"""scripts/msd_clean.py — Modified Swiss Dwellings (MSD) dataset cleaner for Nestora.

Cleans and normalizes the Modified Swiss Dwellings dataset (4TU.ResearchData,
DOI: 10.4121/e1d89cb5-6872-48fc-be63-aadd687ee6f9, CC BY 4.0, van Engelenburg et al., 2023)
and handles deduplication against Swiss Dwellings.

Dataset Provenance:
- Upstream: Modified Swiss Dwellings (derived from Swiss Dwellings v3.0.0)
- DOI: 10.4121/e1d89cb5-6872-48fc-be63-aadd687ee6f9
- Authors: Casper van Engelenburg, Seyran Khademi, Fatemeh Mostafavi, Matthias Standfest, Michael Franzen
- Release Date: 2023-07-11
- Licence: Creative Commons Attribution 4.0 International (CC BY 4.0)
- Raw inputs: `data/msd/raw/` (parquet tables / 4TU distribution)
- Clean output: `data/msd/clean.jsonl`

Cleaning & Normalization Rules:
1. Filters functional rooms from `graph_out_subtype` and `graph_out_geometry`.
   Drops structural voids (`VOID`, `COLUMN`, `SHAFT`).
2. Groups spatial units by building and floor so multi-floor building structure survives.
3. Filters broken plans:
   - Missing essential rooms: living, kitchen, bedroom, toilet (bathroom).
   - Invalid geometries or zero area.
4. Maps room types to Nestora 14-category taxonomy:
   - LIVING_ROOM / LIVING_DINING -> living
   - DINING -> dining
   - KITCHEN -> kitchen
   - BATHROOM -> toilet
   - BEDROOM / ROOM -> bedroom_master (largest bedroom by area in the plan) and bedroom (others)
   - CORRIDOR -> passage
   - BALCONY / TERRACE -> balcony
   - STAIRCASE -> stair
   - STOREROOM -> store
   - ELEVATOR -> utility
5. Deduplication against Swiss Dwellings:
   - MSD is derived from Swiss Dwellings v3.0.0. All 5,372 floor plans in MSD originate from
     Swiss Dwellings buildings.
   - When `--drop-swiss` is set, all plans sharing `(building_id, plan_id)` with Swiss Dwellings
     are identified as duplicates and dropped.
   - When run standalone, cleans MSD to `data/msd/clean.jsonl` while documenting the overlap.
6. Formats output JSON Lines matching `data/resplan/clean.jsonl`:
   `{"id": f"msd_{pid}", "width_m": width_m, "depth_m": depth_m, "floors": floors, "rooms": rooms_out, "source_id": pid}`
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
import shapely
from shapely.geometry import Polygon, MultiPolygon

ROOT_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT_DIR / "data" / "msd" / "raw"
SWISS_RAW_DIR = ROOT_DIR / "data" / "swiss" / "raw"
OUTPUT_PATH = ROOT_DIR / "data" / "msd" / "clean.jsonl"


def get_swiss_dwelling_signatures(swiss_raw_dir: Path) -> Set[Tuple[int, int]]:
    """Get the set of (building_id, plan_id) from Swiss Dwellings raw data."""
    signatures: Set[Tuple[int, int]] = set()
    for pq_name in ["geometries-train.parquet", "geometries-test.parquet"]:
        p = swiss_raw_dir / pq_name
        if p.exists():
            t = pq.read_table(p, columns=["building_id", "plan_id"])
            bids = t["building_id"].to_pylist()
            pids = t["plan_id"].to_pylist()
            signatures.update(zip(bids, pids))
    return signatures


def map_msd_subtype(
    subtype: str, is_largest_bed: bool = False
) -> Optional[str]:
    """Map MSD subtype string to Nestora 14-category taxonomy."""
    st = (subtype or "").strip().upper()

    if st in ("VOID", "SHAFT", "COLUMN", "STRUCTURE"):
        return None
    if "STAIR" in st:
        return "stair"
    if "ELEVATOR" in st:
        return "utility"
    if "KITCHEN" in st:
        return "kitchen"
    if "DINING" in st and "LIVING" not in st:
        return "dining"
    if "LIVING" in st:
        return "living"
    if "BATH" in st:
        return "toilet"
    if "CORRIDOR" in st or "HALL" in st:
        return "passage"
    if "BALCONY" in st or "TERRACE" in st:
        return "balcony"
    if "STORE" in st:
        return "store"
    if "BED" in st or st == "ROOM":
        return "bedroom_master" if is_largest_bed else "bedroom"

    return "passage"


def clean_msd_dataset(
    raw_dir: Path,
    swiss_signatures: Set[Tuple[int, int]],
    drop_swiss_duplicates: bool = False,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Clean and normalize MSD dataset."""
    t0 = time.time()
    files = sorted(list(raw_dir.glob("*.parquet")))
    if not files:
        raise FileNotFoundError(f"No parquet files found in {raw_dir}")

    raw_count = 0
    broken_reasons: Counter[str] = Counter()
    swiss_duplicates_count = 0
    clean_plans: List[Dict[str, Any]] = []

    bldg_floors: Counter[int] = Counter()
    bldg_to_plans = defaultdict(list)
    stair_plans_count = 0
    plans_rect_only = 0
    plans_with_poly = 0

    plot_widths_m: List[float] = []
    plot_depths_m: List[float] = []
    plot_areas_m2: List[float] = []
    room_type_counts: Counter[str] = Counter()

    for fpath in files:
        table = pq.read_table(
            fpath,
            columns=[
                "id",
                "building_id",
                "plan_id",
                "graph_out_subtype",
                "graph_out_geometry",
            ],
        )
        raw_count += table.num_rows

        for i in range(table.num_rows):
            pid = table["id"][i].as_py()
            bid = table["building_id"][i].as_py()
            plan_id = table["plan_id"][i].as_py()
            subtypes = table["graph_out_subtype"][i].as_py()
            geom_coords_list = table["graph_out_geometry"][i].as_py()

            # Check overlap with Swiss Dwellings
            is_swiss_dup = (bid, plan_id) in swiss_signatures
            if is_swiss_dup:
                swiss_duplicates_count += 1
                if drop_swiss_duplicates:
                    continue

            # Check essential rooms
            has_living = any("LIVING" in s for s in subtypes)
            has_kitchen = any("KITCHEN" in s for s in subtypes)
            has_bed = any("BED" in s or s == "ROOM" for s in subtypes)
            has_bath = any("BATH" in s for s in subtypes)

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

            parsed_rooms = []
            for st, coords in zip(subtypes, geom_coords_list):
                if not coords or len(coords) < 3:
                    continue
                try:
                    poly = Polygon(coords)
                    if not poly.is_valid:
                        poly = shapely.make_valid(poly)
                    if poly.is_empty or poly.area <= 0.05:
                        continue
                    parsed_rooms.append((st, poly))
                except Exception:
                    continue

            if len(parsed_rooms) < 4:
                broken_reasons["insufficient_rooms"] += 1
                continue

            # Largest bedroom
            max_bed_area = -1.0
            max_bed_idx = -1
            for idx, (st, poly) in enumerate(parsed_rooms):
                mapped = map_msd_subtype(st)
                if (
                    mapped in ("bedroom", "bedroom_master")
                    and poly.area > max_bed_area
                ):
                    max_bed_area = poly.area
                    max_bed_idx = idx

            # Bounding box
            min_x = min(poly.bounds[0] for _, poly in parsed_rooms)
            min_y = min(poly.bounds[1] for _, poly in parsed_rooms)
            max_x = max(poly.bounds[2] for _, poly in parsed_rooms)
            max_y = max(poly.bounds[3] for _, poly in parsed_rooms)

            width_m = round(max_x - min_x, 2)
            depth_m = round(max_y - min_y, 2)

            if width_m <= 0 or depth_m <= 0:
                broken_reasons["invalid_envelope"] += 1
                continue

            rooms_out = []
            plan_has_poly = False
            has_stair_in_plan = False

            for idx, (st, poly) in enumerate(parsed_rooms):
                is_largest = idx == max_bed_idx
                rtype = map_msd_subtype(st, is_largest_bed=is_largest)
                if not rtype:
                    continue

                if rtype == "stair":
                    has_stair_in_plan = True

                room_type_counts[rtype] += 1
                rmin_x, rmin_y, rmax_x, rmax_y = poly.bounds
                x = round(rmin_x - min_x, 2)
                y = round(rmin_y - min_y, 2)
                w = round(rmax_x - rmin_x, 2)
                d = round(rmax_y - rmin_y, 2)

                box_area = (rmax_x - rmin_x) * (rmax_y - rmin_y)
                is_rect = abs(poly.area - box_area) < 0.05 * box_area

                room_obj: Dict[str, Any] = {
                    "type": rtype,
                    "x": x,
                    "y": y,
                    "w": w,
                    "d": d,
                }

                if is_rect:
                    rooms_out.append(room_obj)
                else:
                    plan_has_poly = True
                    coords = [
                        [round(cx - min_x, 2), round(cy - min_y, 2)]
                        for cx, cy in poly.exterior.coords
                    ]
                    room_obj["polygon"] = coords
                    rooms_out.append(room_obj)

            if plan_has_poly:
                plans_with_poly += 1
            else:
                plans_rect_only += 1

            if has_stair_in_plan:
                stair_plans_count += 1

            bldg_to_plans[bid].append(pid)
            plot_widths_m.append(width_m)
            plot_depths_m.append(depth_m)
            plot_areas_m2.append(round(width_m * depth_m, 2))

            plan_obj = {
                "id": f"msd_{pid}",
                "width_m": width_m,
                "depth_m": depth_m,
                "floors": 1,  # Individual floor slice; building grouping recorded in metadata
                "rooms": rooms_out,
                "source_id": int(pid),
            }
            clean_plans.append(plan_obj)

    # Building floor distribution
    for bid, pids in bldg_to_plans.items():
        bldg_floors[len(pids)] += 1

    stats = {
        "dataset_name": "Modified Swiss Dwellings (MSD, 4TU)",
        "raw_count": raw_count,
        "broken_count": sum(broken_reasons.values()),
        "broken_reasons": dict(broken_reasons),
        "swiss_duplicates_total": swiss_duplicates_count,
        "swiss_duplicates_dropped": (
            swiss_duplicates_count if drop_swiss_duplicates else 0
        ),
        "final_clean_count": len(clean_plans),
        "unique_buildings": len(bldg_to_plans),
        "floors_per_bldg": dict(sorted(bldg_floors.items())),
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
    w = np.array(stats["plot_widths_m"]) if stats["plot_widths_m"] else np.array([])
    d = np.array(stats["plot_depths_m"]) if stats["plot_depths_m"] else np.array([])
    a = np.array(stats["plot_areas_m2"]) if stats["plot_areas_m2"] else np.array([])

    print("\n" + "=" * 60)
    print("MODIFIED SWISS DWELLINGS (MSD) CLEANING REPORT SUMMARY")
    print("=" * 60)
    print(f"Raw floor plans:       {stats['raw_count']:,}")
    print(f"Dropped (broken):      {stats['broken_count']:,}")
    for reason, c in stats["broken_reasons"].items():
        print(f"  - {reason}: {c:,}")
    print(f"Duplicates with Swiss: {stats['swiss_duplicates_total']:,} (100% of MSD derived from Swiss Dwellings)")
    print(f"Final clean plans:     {stats['final_clean_count']:,}")
    print(f"Unique buildings:      {stats['unique_buildings']:,}")
    print(f"Plans with stair:      {stats['stair_plans_count']:,} ({stats['stair_pct']}%)")
    print(f"Runtime:               {stats['runtime_s']} s")

    if total > 0:
        print("\n--- Floors Per Building Distribution ---")
        for fl, count in stats["floors_per_bldg"].items():
            pct = count / stats["unique_buildings"] * 100
            print(f"  {fl} floor(s): {count:5,} buildings ({pct:5.1f}%)")

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
    parser = argparse.ArgumentParser(description="Clean Modified Swiss Dwellings (MSD) dataset.")
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR, help="Path to raw MSD data directory.")
    parser.add_argument("--swiss-raw-dir", type=Path, default=SWISS_RAW_DIR, help="Path to raw Swiss Dwellings directory.")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH, help="Path to clean.jsonl output.")
    parser.add_argument("--drop-swiss", action="store_true", help="Drop plans that duplicate Swiss Dwellings.")
    args = parser.parse_args()

    swiss_signatures = get_swiss_dwelling_signatures(args.swiss_raw_dir)
    clean_plans, stats = clean_msd_dataset(
        args.raw_dir, swiss_signatures, drop_swiss_duplicates=args.drop_swiss
    )
    write_clean_jsonl(clean_plans, args.output)
    print_stats_summary(stats)


if __name__ == "__main__":
    main()
