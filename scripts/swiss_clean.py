"""scripts/swiss_clean.py — Swiss Dwellings dataset cleaner for Nestora.

Cleans and normalizes the Swiss Dwellings residential dataset (Zenodo record 7788422,
DOI: 10.5281/zenodo.7788422, CC BY 4.0, Archilyse AG) following Nestora's architectural
schema and multi-floor building conventions.

Dataset Provenance:
- Upstream: Swiss Dwellings v3.0.0
- DOI / Record: 10.5281/zenodo.7788422
- Release Date: 2023-03-31 (Archive update: 2026-01-17)
- Licence: Creative Commons Attribution 4.0 International (CC BY 4.0)
- Raw inputs: `data/swiss/raw/` (`swiss-dwellings-v3.0.0.zip` / `geometries-*.parquet`)
- Clean output: `data/swiss/clean.jsonl`

Cleaning & Normalization Rules:
1. Filters functional rooms: `entity_type == 'area'`. Drops non-habitable structural voids/shafts
   (`roomtype == 'Structure'` or `entity_subtype in ['SHAFT', 'COLUMN', 'VOID']`).
2. Groups spatial units by `building_id` and vertical `floor_id` so that multi-floor building
   information and staircase connections survive.
3. Filters broken plans:
   - Missing essential rooms: living, kitchen, bedroom, toilet (bathroom).
   - Invalid / non-polygon geometries or zero/negative area.
4. Maps room types to Nestora 14-category taxonomy:
   - Livingroom / LIVING_ROOM / LIVING_DINING -> living
   - Dining / DINING -> dining
   - Kitchen / KITCHEN / KITCHEN_DINING -> kitchen
   - Bedroom / BEDROOM -> bedroom_master (largest bedroom by area in the plan) and bedroom (others)
   - Bathroom / BATHROOM -> toilet
   - Corridor / CORRIDOR / CORRIDORS_AND_HALLS -> passage
   - Balcony / BALCONY / TERRACE -> balcony
   - Stairs / STAIRCASE -> stair
   - Storeroom / STOREROOM -> store
   - ELEVATOR -> utility
5. Converts coordinates into local metric coordinates translated to origin (0.0, 0.0).
6. Preserves floor level on each room (`"floor": int`) and overall `floors` on building object.
7. Classifies rooms as rectangular vs polygon:
   - Rectangular: {type, x, y, w, d}
   - Polygon: {type, x, y, w, d, polygon: [[x, y], ...]}
8. Formats output JSON Lines matching `data/resplan/clean.jsonl`:
   `{"id": f"swiss_bldg_{bldg_id}", "width_m": width_m, "depth_m": depth_m, "floors": floors, "rooms": rooms_out, "source_id": bldg_id}`
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np
import pyarrow.parquet as pq
import pyarrow.compute as pc
import shapely
import shapely.wkt
from shapely.geometry import Polygon, MultiPolygon

ROOT_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT_DIR / "data" / "swiss" / "raw"
OUTPUT_PATH = ROOT_DIR / "data" / "swiss" / "clean.jsonl"


def load_swiss_geometries(raw_dir: Path) -> Any:
    """Load Swiss Dwellings geometries table from parquet or raw extracted files."""
    train_pq = raw_dir / "geometries-train.parquet"
    test_pq = raw_dir / "geometries-test.parquet"

    if not train_pq.exists():
        raise FileNotFoundError(
            f"Swiss geometries parquet not found at {train_pq}. "
            "Please ensure raw files are downloaded in data/swiss/raw/"
        )

    print(f"Loading Swiss geometries from {train_pq.name}...")
    t0 = time.time()
    t_train = pq.read_table(
        train_pq,
        columns=[
            "building_id",
            "floor_id",
            "apartment_id",
            "entity_type",
            "entity_subtype",
            "roomtype",
            "geom",
        ],
    )
    tables = [t_train]
    if test_pq.exists():
        print(f"Loading Swiss test geometries from {test_pq.name}...")
        t_test = pq.read_table(
            test_pq,
            columns=[
                "building_id",
                "floor_id",
                "apartment_id",
                "entity_type",
                "entity_subtype",
                "roomtype",
                "geom",
            ],
        )
        tables.append(t_test)

    from pyarrow import concat_tables

    combined = concat_tables(tables)
    print(
        f"Loaded {combined.num_rows:,} total geometry rows in {time.time() - t0:.1f}s"
    )
    return combined


def map_swiss_room_type(
    roomtype: Optional[str],
    subtype: Optional[str],
    is_largest_bed: bool = False,
) -> Optional[str]:
    """Map Swiss room classification to Nestora's 14-category taxonomy."""
    rt = (roomtype or "").strip().lower()
    st = (subtype or "").strip().upper()

    # Drop structural elements / shafts
    if rt == "structure" or st in ("SHAFT", "COLUMN", "VOID"):
        return None

    if st in ("STAIRCASE",) or rt in ("stairs", "stair"):
        return "stair"
    if st in ("ELEVATOR",):
        return "utility"
    if rt == "kitchen" or "KITCHEN" in st:
        return "kitchen"
    if rt == "dining" or st == "DINING":
        return "dining"
    if rt == "livingroom" or "LIVING" in st:
        return "living"
    if rt == "bathroom" or "BATH" in st:
        return "toilet"
    if rt == "corridor" or "CORRIDOR" in st or "HALL" in st:
        return "passage"
    if rt == "balcony" or "BALCONY" in st or "TERRACE" in st:
        return "balcony"
    if rt == "storeroom" or "STORE" in st:
        return "store"
    if rt == "bedroom" or "BED" in st or st == "ROOM":
        return "bedroom_master" if is_largest_bed else "bedroom"

    return "passage"


def clean_swiss_dataset(
    table: Any,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Clean, filter, and normalize Swiss Dwellings buildings."""
    t0 = time.time()

    # 1. Filter for area entities
    areas = table.filter(pc.equal(table["entity_type"], "area"))
    print(f"Filtered {areas.num_rows:,} spatial area entities")

    bids = areas["building_id"].to_pylist()
    fids = areas["floor_id"].to_pylist()
    aids = areas["apartment_id"].to_pylist()
    rtypes = areas["roomtype"].to_pylist()
    subtypes = areas["entity_subtype"].to_pylist()
    geoms = areas["geom"].to_pylist()

    # Group by building
    bldg_rooms = defaultdict(list)
    for b, f, a, rt, st, g in zip(bids, fids, aids, rtypes, subtypes, geoms):
        bldg_rooms[b].append((f, a, rt, st, g))

    raw_building_count = len(bldg_rooms)
    print(f"Aggregated into {raw_building_count:,} candidate buildings")

    broken_reasons: Counter[str] = Counter()
    clean_plans: List[Dict[str, Any]] = []
    floors_per_bldg: Counter[int] = Counter()
    stair_plans_count = 0
    plans_rect_only = 0
    plans_with_poly = 0

    plot_widths_m: List[float] = []
    plot_depths_m: List[float] = []
    plot_areas_m2: List[float] = []
    room_type_counts: Counter[str] = Counter()

    for bid, raw_items in bldg_rooms.items():
        # Check essential rooms
        has_living = False
        has_kitchen = False
        has_bed = False
        has_bath = False

        for f, a, rt, st, _ in raw_items:
            mapped = map_swiss_room_type(rt, st)
            if mapped == "living":
                has_living = True
            elif mapped == "kitchen":
                has_kitchen = True
            elif mapped in ("bedroom", "bedroom_master"):
                has_bed = True
            elif mapped == "toilet":
                has_bath = True

        if not has_living:
            broken_reasons["missing_living"] += 1
            continue
        if not has_kitchen:
            broken_reasons["missing_kitchen"] += 1
            continue
        if not has_bed:
            broken_reasons["missing_bedroom"] += 1
            continue
        if not has_bath:
            broken_reasons["missing_bathroom"] += 1
            continue

        # Parse geometries and validate
        parsed_rooms = []
        valid_bldg = True
        has_stair_in_bldg = False

        # Identify floors and map floor IDs to 1-indexed integers
        unique_fids = sorted(list(set(item[0] for item in raw_items)))
        floor_to_idx = {fid: idx + 1 for idx, fid in enumerate(unique_fids)}
        num_floors = len(unique_fids)

        for fid, aid, rt, st, g_str in raw_items:
            try:
                geom = shapely.wkt.loads(g_str)
            except Exception:
                continue

            if not geom or geom.is_empty or geom.area <= 0.05:
                continue

            # If MultiPolygon, take parts
            parts = [pt for pt in shapely.get_parts(geom) if pt.area > 0.05]
            for pt in parts:
                if not pt.is_valid:
                    pt = shapely.make_valid(pt)
                    if not pt.is_valid or pt.is_empty:
                        continue
                parsed_rooms.append((floor_to_idx[fid], aid, rt, st, pt))

        if len(parsed_rooms) < 4:
            broken_reasons["insufficient_rooms"] += 1
            continue

        # Find largest bedroom in building to assign bedroom_master
        max_bed_area = -1.0
        max_bed_idx = -1
        for idx, (_, _, rt, st, pt) in enumerate(parsed_rooms):
            mapped = map_swiss_room_type(rt, st)
            if mapped in ("bedroom", "bedroom_master") and pt.area > max_bed_area:
                max_bed_area = pt.area
                max_bed_idx = idx

        # Compute bounding box
        min_x = min(pt.bounds[0] for _, _, _, _, pt in parsed_rooms)
        min_y = min(pt.bounds[1] for _, _, _, _, pt in parsed_rooms)
        max_x = max(pt.bounds[2] for _, _, _, _, pt in parsed_rooms)
        max_y = max(pt.bounds[3] for _, _, _, _, pt in parsed_rooms)

        width_m = round(max_x - min_x, 2)
        depth_m = round(max_y - min_y, 2)

        if width_m <= 0 or depth_m <= 0:
            broken_reasons["invalid_envelope"] += 1
            continue

        rooms_out = []
        bldg_has_poly = False

        for idx, (fl_idx, aid, rt, st, pt) in enumerate(parsed_rooms):
            is_largest = idx == max_bed_idx
            rtype = map_swiss_room_type(rt, st, is_largest_bed=is_largest)
            if not rtype:
                continue

            if rtype == "stair":
                has_stair_in_bldg = True

            room_type_counts[rtype] += 1
            rmin_x, rmin_y, rmax_x, rmax_y = pt.bounds
            x = round(rmin_x - min_x, 2)
            y = round(rmin_y - min_y, 2)
            w = round(rmax_x - rmin_x, 2)
            d = round(rmax_y - rmin_y, 2)

            box_area = (rmax_x - rmin_x) * (rmax_y - rmin_y)
            is_rect = abs(pt.area - box_area) < 0.05 * box_area

            room_obj: Dict[str, Any] = {
                "type": rtype,
                "x": x,
                "y": y,
                "w": w,
                "d": d,
                "floor": fl_idx,
            }

            if is_rect:
                rooms_out.append(room_obj)
            else:
                bldg_has_poly = True
                coords = [
                    [round(cx - min_x, 2), round(cy - min_y, 2)]
                    for cx, cy in pt.exterior.coords
                ]
                room_obj["polygon"] = coords
                rooms_out.append(room_obj)

        if bldg_has_poly:
            plans_with_poly += 1
        else:
            plans_rect_only += 1

        if has_stair_in_bldg:
            stair_plans_count += 1

        floors_per_bldg[num_floors] += 1
        plot_widths_m.append(width_m)
        plot_depths_m.append(depth_m)
        plot_areas_m2.append(round(width_m * depth_m, 2))

        plan_obj = {
            "id": f"swiss_bldg_{bid}",
            "width_m": width_m,
            "depth_m": depth_m,
            "floors": num_floors,
            "rooms": rooms_out,
            "source_id": int(bid),
        }
        clean_plans.append(plan_obj)

    stats = {
        "dataset_name": "Swiss Dwellings (Zenodo 7788422 v3.0.0)",
        "raw_count": raw_building_count,
        "broken_count": sum(broken_reasons.values()),
        "broken_reasons": dict(broken_reasons),
        "final_clean_count": len(clean_plans),
        "floors_per_bldg": dict(sorted(floors_per_bldg.items())),
        "stair_plans_count": stair_plans_count,
        "stair_pct": (
            round(stair_plans_count / len(clean_plans) * 100, 1)
            if clean_plans
            else 0.0
        ),
        "plot_widths_m": plot_widths_m,
        "plot_depths_m": plot_depths_m,
        "plot_areas_m2": plot_areas_m2,
        "room_type_counts": dict(room_type_counts),
        "plans_rect_only": plans_rect_only,
        "plans_with_poly": plans_with_poly,
        "runtime_s": round(time.time() - t0, 1),
    }

    return clean_plans, stats


def write_clean_jsonl(
    clean_plans: List[Dict[str, Any]], output_path: Path
) -> None:
    """Write cleaned plans to JSON Lines file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"\nWriting {len(clean_plans):,} clean plans to {output_path}...")
    t0 = time.time()
    with open(output_path, "w", encoding="utf-8") as f:
        for plan in clean_plans:
            f.write(json.dumps(plan) + "\n")
    print(
        f"Wrote {os.path.getsize(output_path) / 1024 / 1024:.2f} MB in {time.time() - t0:.1f}s"
    )


def print_stats_summary(stats: Dict[str, Any]) -> None:
    """Print detailed summary report."""
    total = stats["final_clean_count"]
    w = np.array(stats["plot_widths_m"])
    d = np.array(stats["plot_depths_m"])
    a = np.array(stats["plot_areas_m2"])

    print("\n" + "=" * 60)
    print("SWISS DWELLINGS CLEANING REPORT SUMMARY")
    print("=" * 60)
    print(f"Raw building count:    {stats['raw_count']:,}")
    print(f"Dropped (broken):      {stats['broken_count']:,}")
    for reason, c in stats["broken_reasons"].items():
        print(f"  - {reason}: {c:,}")
    print(f"Final clean buildings: {stats['final_clean_count']:,}")
    print(f"Buildings with stair:  {stats['stair_plans_count']:,} ({stats['stair_pct']}%)")
    print(f"Runtime:               {stats['runtime_s']} s")

    print("\n--- Floors Per Building ---")
    for fl, count in stats["floors_per_bldg"].items():
        pct = count / total * 100 if total else 0
        print(f"  {fl} floor(s): {count:5,} ({pct:5.1f}%)")

    print("\n--- Footprint Dimension Percentiles (meters) ---")
    print(f"  Width:  p10={np.percentile(w, 10):.1f}m, p50={np.percentile(w, 50):.1f}m, p90={np.percentile(w, 90):.1f}m")
    print(f"  Depth:  p10={np.percentile(d, 10):.1f}m, p50={np.percentile(d, 50):.1f}m, p90={np.percentile(d, 90):.1f}m")
    print(f"  Area:   p10={np.percentile(a, 10):.1f}m², p50={np.percentile(a, 50):.1f}m², p90={np.percentile(a, 90):.1f}m²")

    print("\n--- Comparison to Mumbai Plotted Residential Footprints ---")
    p20x30 = np.sum((w >= 5.0) & (w <= 8.0) & (d >= 8.0) & (d <= 11.0))
    p30x40 = np.sum((w >= 8.0) & (w <= 11.0) & (d >= 11.0) & (d <= 14.0))
    p40x60 = np.sum((w >= 11.0) & (w <= 14.0) & (d >= 17.0) & (d <= 20.0))
    p_large = np.sum((w > 14.0) | (d > 20.0))
    print(f"  Matches 20x30 ft plot scale: {p20x30:,} ({p20x30/total*100:.1f}%)")
    print(f"  Matches 30x40 ft plot scale: {p30x40:,} ({p30x40/total*100:.1f}%)")
    print(f"  Matches 40x60 ft plot scale: {p40x60:,} ({p40x60/total*100:.1f}%)")
    print(f"  Larger multi-family block:   {p_large:,} ({p_large/total*100:.1f}%)")

    print("\n--- Room Taxonomy Counts ---")
    for rtype, c in sorted(stats["room_type_counts"].items(), key=lambda x: -x[1]):
        print(f"  {rtype:16s}: {c:6,}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Clean Swiss Dwellings dataset for Nestora.")
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR, help="Path to raw Swiss data directory.")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH, help="Path to clean.jsonl output.")
    args = parser.parse_args()

    table = load_swiss_geometries(args.raw_dir)
    clean_plans, stats = clean_swiss_dataset(table)
    write_clean_jsonl(clean_plans, args.output)
    print_stats_summary(stats)


if __name__ == "__main__":
    main()
