"""scripts/resplan_clean.py — ResPlan dataset cleaner for Nestora.

Cleans and normalizes the ResPlan residential floor plan dataset (17,000 South Asian plans)
following ModRes (arXiv:2610.17178) cleaning guidelines and Nestora's architectural schema.

Rules:
1. Loads raw ResPlan dataset from `data/resplan/raw/ResPlan.pkl`.
2. Drops broken plans:
   - Missing essential rooms: kitchen, bedroom, bathroom/toilet, living.
   - Self-intersecting room polygons (invalid geometries).
   - Zero-area room polygons (<= 0.01 m2).
   - Overlapping rooms (> 1.0 px2 / > 0.1 m2 overlap between distinct rooms).
3. Drops duplicate plans:
   - Explicitly augmented plans from `split.json["augmented"]` (synthetic rotations/flips).
   - Geometric duplicates with identical normalized bounding boxes, relative coordinates, and areas.
4. Maps room types to Nestora schema:
   - living -> living
   - kitchen -> kitchen
   - bedroom -> bedroom_master (largest bedroom by area) and bedroom (other bedrooms)
   - bathroom -> toilet
   - storage -> store
   - stair -> stair
   - balcony -> balcony
   - parking -> porch
5. Scales coordinates from canvas units to metric coordinates (meters), translating
   bounding box minimum to (0.0, 0.0).
6. Classifies rooms as rectangular vs polygon:
   - Rectangular: {type, x, y, w, d}
   - Polygon: {type, x, y, w, d, polygon: [[x, y], ...]}
7. Writes `data/resplan/clean.jsonl`, one JSON object per line.
"""

from __future__ import annotations

import json
import math
import os
import pickle
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np
import shapely
from shapely.geometry import Polygon, MultiPolygon

ROOT_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT_DIR / "data" / "resplan" / "raw"
PKL_PATH = RAW_DIR / "ResPlan.pkl"
SPLIT_PATH = RAW_DIR / "split.json"
OUTPUT_PATH = ROOT_DIR / "data" / "resplan" / "clean.jsonl"


def load_dataset() -> Tuple[List[Dict[str, Any]], Set[int]]:
    """Load raw ResPlan pickle and split metadata."""
    if not PKL_PATH.exists():
        raise FileNotFoundError(
            f"Raw dataset not found at {PKL_PATH}. Please ensure ResPlan.zip is extracted into data/resplan/raw/"
        )

    print(f"Loading raw dataset from {PKL_PATH}...")
    t0 = time.time()
    with open(PKL_PATH, "rb") as f:
        plans = pickle.load(f)
    print(f"Loaded {len(plans):,} plans in {time.time() - t0:.1f}s")

    aug_ids: Set[int] = set()
    if SPLIT_PATH.exists():
        with open(SPLIT_PATH, "r", encoding="utf-8") as f:
            splits = json.load(f)
            aug_ids = set(splits.get("augmented", []))
        print(f"Loaded {len(aug_ids):,} augmented plan IDs from {SPLIT_PATH}")

    return plans, aug_ids


def clean_and_filter_plans(
    plans: List[Dict[str, Any]],
    aug_ids: Set[int],
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Clean, filter broken, deduplicate, and normalize plans."""
    t0 = time.time()
    raw_count = len(plans)

    broken_reasons: Counter[str] = Counter()
    broken_indices: Set[int] = set()
    candidate_rooms: Dict[int, List[Tuple[str, Any]]] = {}

    room_keys = [
        "living",
        "bedroom",
        "bathroom",
        "kitchen",
        "balcony",
        "storage",
        "stair",
        "parking",
    ]

    print("\n--- Pass 1: Filtering broken plans ---")
    for idx, p in enumerate(plans):
        reported_area = p.get("area")
        if not reported_area or reported_area <= 0:
            broken_reasons["invalid_area"] += 1
            broken_indices.add(idx)
            continue

        # 1. Missing essential rooms (ModRes zero_kitchens / essential rooms)
        kitch = (
            [pt for pt in shapely.get_parts(p.get("kitchen")) if pt.area > 0.01]
            if p.get("kitchen")
            else []
        )
        bed = (
            [pt for pt in shapely.get_parts(p.get("bedroom")) if pt.area > 0.01]
            if p.get("bedroom")
            else []
        )
        bath = (
            [pt for pt in shapely.get_parts(p.get("bathroom")) if pt.area > 0.01]
            if p.get("bathroom")
            else []
        )
        liv = (
            [pt for pt in shapely.get_parts(p.get("living")) if pt.area > 0.01]
            if p.get("living")
            else []
        )

        if len(kitch) == 0:
            broken_reasons["missing_kitchen"] += 1
            broken_indices.add(idx)
            continue
        if len(bed) == 0:
            broken_reasons["missing_bedroom"] += 1
            broken_indices.add(idx)
            continue
        if len(bath) == 0:
            broken_reasons["missing_bathroom"] += 1
            broken_indices.add(idx)
            continue
        if len(liv) == 0:
            broken_reasons["missing_living"] += 1
            broken_indices.add(idx)
            continue

        # 2. Check for invalid or zero-area room geometries
        rooms: List[Tuple[str, Any]] = []
        has_geom_err = False
        for k in room_keys:
            g = p.get(k)
            if g and not g.is_empty:
                for pt in shapely.get_parts(g):
                    if not pt.is_valid:
                        broken_reasons["self_intersecting_room"] += 1
                        broken_indices.add(idx)
                        has_geom_err = True
                        break
                    if pt.area <= 0.01:
                        broken_reasons["zero_area_room"] += 1
                        broken_indices.add(idx)
                        has_geom_err = True
                        break
                    rooms.append((k, pt))
            if has_geom_err:
                break
        if has_geom_err:
            continue

        # Deduplicate identical room polygons within the same room type (e.g. bathroom duplicates)
        unique_rooms: List[Tuple[str, Any]] = []
        for k, pt in rooms:
            if not any(
                k == uk and shapely.equals(pt, upt) for uk, upt in unique_rooms
            ):
                unique_rooms.append((k, pt))

        # 3. Check for overlapping rooms
        has_ov = False
        for i in range(len(unique_rooms)):
            b1 = unique_rooms[i][1].bounds
            for j in range(i + 1, len(unique_rooms)):
                b2 = unique_rooms[j][1].bounds
                # Fast axis-aligned bounding box disjoint check
                if not (
                    b1[2] <= b2[0]
                    or b1[0] >= b2[2]
                    or b1[3] <= b2[1]
                    or b1[1] >= b2[3]
                ):
                    inter = unique_rooms[i][1].intersection(unique_rooms[j][1])
                    if inter.area > 1.0:  # Significant overlap (> 1.0 px^2 / > 0.05 m^2)
                        has_ov = True
                        break
            if has_ov:
                break
        if has_ov:
            broken_reasons["overlapping_rooms"] += 1
            broken_indices.add(idx)
            continue

        candidate_rooms[idx] = unique_rooms

    print(
        f"Pass 1 complete: {len(broken_indices):,} broken plans filtered. {len(candidate_rooms):,} valid candidates remain."
    )

    print("\n--- Pass 2: Deduplication ---")
    duplicate_reasons: Counter[str] = Counter()
    duplicate_indices: Set[int] = set()

    # Flag augmented plans from split.json
    for idx in candidate_rooms:
        if plans[idx]["id"] in aug_ids:
            duplicate_reasons["split_augmented"] += 1
            duplicate_indices.add(idx)

    # Flag geometric normalized duplicates
    seen_signatures: Dict[Tuple[Any, ...], int] = {}
    for idx, uniq in candidate_rooms.items():
        if idx in duplicate_indices:
            continue
        p = plans[idx]
        rep_area = round(float(p["area"]), 1)
        min_x = min(pt.bounds[0] for _, pt in uniq)
        min_y = min(pt.bounds[1] for _, pt in uniq)
        max_x = max(pt.bounds[2] for _, pt in uniq)
        max_y = max(pt.bounds[3] for _, pt in uniq)
        w = max_x - min_x
        d = max_y - min_y
        tot_area = sum(pt.area for _, pt in uniq)

        descs = []
        for k, pt in uniq:
            b = pt.bounds
            rx = round((b[0] - min_x) / (w + 1e-4), 2)
            ry = round((b[1] - min_y) / (d + 1e-4), 2)
            rw = round((b[2] - b[0]) / (w + 1e-4), 2)
            rd = round((b[3] - b[1]) / (d + 1e-4), 2)
            ra = round(pt.area / (tot_area + 1e-4), 2)
            descs.append((k, rx, ry, rw, rd, ra))
        descs.sort()

        sig = (len(uniq), rep_area, round(w / (d + 1e-4), 1), tuple(descs))
        if sig in seen_signatures:
            duplicate_reasons["geometry_duplicate"] += 1
            duplicate_indices.add(idx)
        else:
            seen_signatures[sig] = idx

    clean_indices = [
        idx for idx in candidate_rooms if idx not in duplicate_indices
    ]
    print(
        f"Pass 2 complete: {len(duplicate_indices):,} duplicate plans filtered. {len(clean_indices):,} clean plans remain."
    )

    print(
        f"\n--- Pass 3: Geometry normalisation & exporting {len(clean_indices):,} clean plans ---"
    )
    clean_plans: List[Dict[str, Any]] = []

    # Distribution stats tracking
    plot_widths_m: List[float] = []
    plot_depths_m: List[float] = []
    plot_areas_m2: List[float] = []
    bhk_counts: Counter[str] = Counter()
    room_type_counts: Counter[str] = Counter()
    plans_rect_only = 0
    plans_with_poly = 0

    all_element_keys = [
        "living",
        "bedroom",
        "bathroom",
        "kitchen",
        "balcony",
        "storage",
        "stair",
        "parking",
        "wall",
        "door",
        "window",
        "front_door",
    ]

    t_export = time.time()
    for count_i, idx in enumerate(clean_indices):
        if (count_i + 1) % 2500 == 0 or (count_i + 1) == len(clean_indices):
            print(
                f"Processing {count_i + 1:,} / {len(clean_indices):,} plans ({time.time() - t_export:.1f}s)..."
            )

        p = plans[idx]
        pid = p["id"]
        rep_area = float(p["area"])
        room_items = candidate_rooms[idx]

        # Calculate metric scale factor (pixels per meter)
        elements = []
        for k in all_element_keys:
            g = p.get(k)
            if g and not g.is_empty:
                for pt in shapely.get_parts(g):
                    elements.append(pt)
        calc_area = shapely.unary_union(elements).area
        px_per_m = math.sqrt(calc_area / rep_area) if rep_area > 0 else 1.0

        min_x = min(pt.bounds[0] for _, pt in room_items)
        min_y = min(pt.bounds[1] for _, pt in room_items)
        max_x = max(pt.bounds[2] for _, pt in room_items)
        max_y = max(pt.bounds[3] for _, pt in room_items)

        width_m = round((max_x - min_x) / px_per_m, 2)
        depth_m = round((max_y - min_y) / px_per_m, 2)
        area_m2 = rep_area

        plot_widths_m.append(width_m)
        plot_depths_m.append(depth_m)
        plot_areas_m2.append(area_m2)

        # Identify master bedroom vs secondary bedrooms
        beds = [item for item in room_items if item[0] == "bedroom"]
        master_pt = max(beds, key=lambda x: x[1].area) if beds else None

        bed_count = len(beds)
        if bed_count == 1:
            bhk_counts["1 BHK"] += 1
        elif bed_count == 2:
            bhk_counts["2 BHK"] += 1
        elif bed_count == 3:
            bhk_counts["3 BHK"] += 1
        elif bed_count == 4:
            bhk_counts["4 BHK"] += 1
        else:
            bhk_counts["5+ BHK"] += 1

        rooms_out: List[Dict[str, Any]] = []
        plan_has_poly = False

        for k, pt in room_items:
            if k == "living":
                rtype = "living"
            elif k == "kitchen":
                rtype = "kitchen"
            elif k == "bathroom":
                rtype = "toilet"
            elif k == "storage":
                rtype = "store"
            elif k == "stair":
                rtype = "stair"
            elif k == "balcony":
                rtype = "balcony"
            elif k == "parking":
                rtype = "porch"
            elif k == "bedroom":
                rtype = (
                    "bedroom_master"
                    if (master_pt and pt is master_pt[1])
                    else "bedroom"
                )
            else:
                rtype = k

            room_type_counts[rtype] += 1

            b = pt.bounds
            x = round((b[0] - min_x) / px_per_m, 2)
            y = round((b[1] - min_y) / px_per_m, 2)
            w = round((b[2] - b[0]) / px_per_m, 2)
            d = round((b[3] - b[1]) / px_per_m, 2)
            bbox_area = (b[2] - b[0]) * (b[3] - b[1])

            # Test if polygon is an axis-aligned rectangle (area within 2% of bounding box)
            is_rect = (
                bbox_area > 0 and abs(pt.area - bbox_area) / bbox_area < 0.02
            )

            if is_rect:
                rooms_out.append(
                    {"type": rtype, "x": x, "y": y, "w": w, "d": d}
                )
            else:
                plan_has_poly = True
                coords = [
                    [
                        round((cx - min_x) / px_per_m, 2),
                        round((cy - min_y) / px_per_m, 2),
                    ]
                    for cx, cy in pt.exterior.coords
                ]
                rooms_out.append({
                    "type": rtype,
                    "x": x,
                    "y": y,
                    "w": w,
                    "d": d,
                    "polygon": coords,
                })

        if plan_has_poly:
            plans_with_poly += 1
        else:
            plans_rect_only += 1

        clean_plan_obj = {
            "id": f"resplan_{pid}",
            "width_m": width_m,
            "depth_m": depth_m,
            "floors": 1,
            "rooms": rooms_out,
            "source_id": pid,
        }
        clean_plans.append(clean_plan_obj)

    stats = {
        "raw_count": raw_count,
        "broken_count": len(broken_indices),
        "broken_reasons": dict(broken_reasons),
        "duplicate_count": len(duplicate_indices),
        "duplicate_reasons": dict(duplicate_reasons),
        "final_clean_count": len(clean_plans),
        "plot_widths_m": plot_widths_m,
        "plot_depths_m": plot_depths_m,
        "plot_areas_m2": plot_areas_m2,
        "bhk_counts": dict(bhk_counts),
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


def print_report_summary(stats: Dict[str, Any]) -> None:
    """Print comprehensive statistical summary to console."""
    w = np.array(stats["plot_widths_m"])
    d = np.array(stats["plot_depths_m"])
    a = np.array(stats["plot_areas_m2"])
    total = stats["final_clean_count"]

    print("\n" + "=" * 60)
    print("RESPLAN DATASET CLEANING REPORT SUMMARY")
    print("=" * 60)
    print(f"Raw plan count:      {stats['raw_count']:,}")
    print(f"Broken plans:        {stats['broken_count']:,}")
    for reason, c in stats["broken_reasons"].items():
        print(f"  - {reason}: {c:,}")
    print(f"Duplicate plans:     {stats['duplicate_count']:,}")
    for reason, c in stats["duplicate_reasons"].items():
        print(f"  - {reason}: {c:,}")
    print(f"Final clean count:   {stats['final_clean_count']:,}")
    print(f"Cleaning runtime:    {stats['runtime_s']} s")

    print("\n--- BHK Distribution ---")
    for bhk in ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK"]:
        c = stats["bhk_counts"].get(bhk, 0)
        pct = c / total * 100 if total else 0
        print(f"  {bhk:8s}: {c:6,} ({pct:5.1f}%)")

    print("\n--- Room Geometry Type ---")
    rect_only = stats["plans_rect_only"]
    has_poly = stats["plans_with_poly"]
    print(
        f"  Rectangular-only rooms: {rect_only:6,} ({rect_only/total*100:5.1f}%)"
    )
    print(
        f"  Contains polygon rooms: {has_poly:6,} ({has_poly/total*100:5.1f}%)"
    )

    print("\n--- Room Type Counts ---")
    for rtype, c in sorted(
        stats["room_type_counts"].items(), key=lambda x: -x[1]
    ):
        avg_per_plan = c / total if total else 0
        print(
            f"  {rtype:16s}: {c:7,} total ({avg_per_plan:4.2f} avg/plan, {c/sum(stats['room_type_counts'].values())*100:4.1f}%)"
        )

    print("\n--- Plot Dimensions & Area Percentiles ---")
    print(
        f"  Width (m):  p10={np.percentile(w, 10):.2f}, p25={np.percentile(w, 25):.2f}, median={np.percentile(w, 50):.2f}, p75={np.percentile(w, 75):.2f}, p90={np.percentile(w, 90):.2f}"
    )
    print(
        f"  Width (ft): p10={np.percentile(w*3.28084, 10):.1f}, p25={np.percentile(w*3.28084, 25):.1f}, median={np.percentile(w*3.28084, 50):.1f}, p75={np.percentile(w*3.28084, 75):.1f}, p90={np.percentile(w*3.28084, 90):.1f}"
    )
    print(
        f"  Depth (m):  p10={np.percentile(d, 10):.2f}, p25={np.percentile(d, 25):.2f}, median={np.percentile(d, 50):.2f}, p75={np.percentile(d, 75):.2f}, p90={np.percentile(d, 90):.2f}"
    )
    print(
        f"  Depth (ft): p10={np.percentile(d*3.28084, 10):.1f}, p25={np.percentile(d*3.28084, 25):.1f}, median={np.percentile(d*3.28084, 50):.1f}, p75={np.percentile(d*3.28084, 75):.1f}, p90={np.percentile(d*3.28084, 90):.1f}"
    )
    print(
        f"  Area (m2):  p10={np.percentile(a, 10):.1f}, p25={np.percentile(a, 25):.1f}, median={np.percentile(a, 50):.1f}, p75={np.percentile(a, 75):.1f}, p90={np.percentile(a, 90):.1f}"
    )
    print(
        f"  Area (sqft):p10={np.percentile(a*10.7639, 10):.0f}, p25={np.percentile(a*10.7639, 25):.0f}, median={np.percentile(a*10.7639, 50):.0f}, p75={np.percentile(a*10.7639, 75):.0f}, p90={np.percentile(a*10.7639, 90):.0f}"
    )

    print("\n--- Mumbai Plot Size Benchmarks ---")
    w_ft = w * 3.28084
    d_ft = d * 3.28084
    # Comparing footprint fitting (either orientation: w <= W and d <= D, or w <= D and d <= W)
    fits_20x30 = np.sum(
        ((w_ft <= 20) & (d_ft <= 30)) | ((w_ft <= 30) & (d_ft <= 20))
    )
    fits_25x40 = np.sum(
        ((w_ft <= 25) & (d_ft <= 40)) | ((w_ft <= 40) & (d_ft <= 25))
    )
    fits_30x40 = np.sum(
        ((w_ft <= 30) & (d_ft <= 40)) | ((w_ft <= 40) & (d_ft <= 30))
    )
    fits_30x50 = np.sum(
        ((w_ft <= 30) & (d_ft <= 50)) | ((w_ft <= 50) & (d_ft <= 30))
    )
    fits_40x60 = np.sum(
        ((w_ft <= 40) & (d_ft <= 60)) | ((w_ft <= 60) & (d_ft <= 40))
    )

    print(
        f"  Fits 20x30 ft (600 sqft):  {fits_20x30:6,} ({fits_20x30/total*100:5.1f}%)"
    )
    print(
        f"  Fits 25x40 ft (1000 sqft): {fits_25x40:6,} ({fits_25x40/total*100:5.1f}%)"
    )
    print(
        f"  Fits 30x40 ft (1200 sqft): {fits_30x40:6,} ({fits_30x40/total*100:5.1f}%)"
    )
    print(
        f"  Fits 30x50 ft (1500 sqft): {fits_30x50:6,} ({fits_30x50/total*100:5.1f}%)"
    )
    print(
        f"  Fits 40x60 ft (2400 sqft): {fits_40x60:6,} ({fits_40x60/total*100:5.1f}%)"
    )
    print("=" * 60 + "\n")


def main() -> None:
    plans, aug_ids = load_dataset()
    clean_plans, stats = clean_and_filter_plans(plans, aug_ids)
    write_clean_jsonl(clean_plans, OUTPUT_PATH)
    print_report_summary(stats)


if __name__ == "__main__":
    main()
