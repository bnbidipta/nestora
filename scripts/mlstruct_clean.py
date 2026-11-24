"""scripts/mlstruct_clean.py — MLSTRUCT-FP dataset cleaner for Nestora.

Cleans and normalizes the MLSTRUCT-FP dataset (MIT License, Pablo Pizarro et al., 2023,
Automation in Construction, DOI: 10.1016/j.autcon.2023.105132) following Nestora's
architectural schema and JSON Lines data conventions.

Dataset Provenance:
- Upstream: MLStructFP (Machine Learning STRUCTural Floor Plan) v1
- GitHub: https://github.com/MLSTRUCT/MLStructFP
- Paper: "MLStructFP: A multi-unit floor plan dataset for architectural analysis and recognition"
  Automation in Construction, Vol 156, Dec 2023, 105132. DOI: 10.1016/j.autcon.2023.105132
- Authors: Pablo Pizarro, et al.
- Licence: MIT License (confirmed from upstream repository LICENSE:
  "Copyright (c) 2023 MLSTRUCT. Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation files (the 'Software'), to deal
  in the Software without restriction, including without limitation the rights to use, copy,
  modify, merge, publish, distribute, sublicense, and/or sell copies of the Software...")
- Raw inputs: `data/mlstruct/raw/fp.json` (extracted from MLSTRUCT-FP_v1.zip, Google Drive ID: 1-38lW9PtzJP4YhQ3aq73FH6pnUn-l60x)
- Clean output: `data/mlstruct/clean.jsonl`

Architectural Geometry & Room Recovery:
- Upstream MLSTRUCT-FP contains detailed structural elements: 70,873 rectangular wall sections (`rect`)
  and 954 outer floor slab boundary polygons (`slab`) across 954 large-scale floor plans.
- Upstream limitation: The dataset annotates structural walls and perimeters ONLY; it contains NO room
  semantic category labels, and doorways are left unclosed.
- Recovery Mechanism:
  1. For each floor, wall rectangles are unified into a single geometric barrier.
  2. To separate rooms through door openings (typically 0.8m–1.2m wide), morphological closing is applied
     with a dilation radius (default: 0.75m), bridging doorways.
  3. The void space inside the slab is computed: `voids = slab.difference(dilated_walls)`.
  4. Void components with area >= 1.5 m² are recovered, re-expanded to the wall boundaries, and
     formatted as room polygons/rectangles.
  5. Without semantic ground truth, rooms are labelled with standard type "room".
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
import time
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import shapely
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union

ROOT_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT_DIR / "data" / "mlstruct" / "raw"
DEFAULT_JSON_PATH = RAW_DIR / "fp.json"
DEFAULT_OUTPUT_PATH = ROOT_DIR / "data" / "mlstruct" / "clean.jsonl"


def load_raw_dataset(fp_path: Path) -> Dict[str, Any]:
    """Load raw fp.json file."""
    if not fp_path.exists():
        raise FileNotFoundError(
            f"Raw dataset not found at {fp_path}. Please download fp.json into {fp_path.parent}"
        )
    print(f"Loading raw MLSTRUCT-FP dataset from {fp_path}...")
    t0 = time.time()
    with open(fp_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"Loaded {fp_path.name} ({len(data.get('floor', {})):,} floors, {len(data.get('rect', {})):,} walls) in {time.time()-t0:.2f}s")
    return data


def recover_rooms_from_walls(
    slab_poly: Polygon,
    wall_polys: List[Polygon],
    dilation_radius: float = 0.75,
    min_room_area: float = 1.5,
) -> List[Polygon]:
    """Recover discrete room polygons by morphological closing over doorway gaps."""
    if not slab_poly.is_valid:
        slab_poly = slab_poly.buffer(0)
    if not slab_poly.is_valid or slab_poly.area < min_room_area:
        return []

    wall_union = unary_union(wall_polys)
    # Morphological closing of door gaps
    dilated_walls = wall_union.buffer(dilation_radius)
    voids = slab_poly.difference(dilated_walls)

    raw_voids: List[Polygon] = []
    if isinstance(voids, Polygon):
        raw_voids = [voids]
    elif isinstance(voids, MultiPolygon):
        raw_voids = list(voids.geoms)

    recovered_rooms: List[Polygon] = []
    for void in raw_voids:
        if void.area >= min_room_area and void.is_valid:
            # Re-expand void to touch true wall faces, bounded by slab
            expanded = void.buffer(dilation_radius - 0.05).intersection(slab_poly).difference(wall_union)
            if isinstance(expanded, Polygon):
                if expanded.is_valid and expanded.area >= min_room_area:
                    recovered_rooms.append(expanded)
            elif isinstance(expanded, MultiPolygon):
                for p in expanded.geoms:
                    if p.is_valid and p.area >= min_room_area:
                        recovered_rooms.append(p)

    return recovered_rooms


def clean_mlstruct_dataset(
    data: Dict[str, Any],
    dilation_radius: float = 0.75,
    min_room_area: float = 1.5,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Clean and normalize all floors in MLSTRUCT-FP."""
    floors = data.get("floor", {})
    rects = data.get("rect", {})
    slabs = data.get("slab", {})

    # Index walls by floorID
    walls_by_floor: Dict[int, List[Polygon]] = {}
    for r_id, r in rects.items():
        fid = int(r["floorID"])
        if fid not in walls_by_floor:
            walls_by_floor[fid] = []
        coords = list(zip(r["x"], r["y"]))
        if coords[0] != coords[-1]:
            coords.append(coords[0])
        p = Polygon(coords)
        if p.is_valid and p.area > 0.001:
            walls_by_floor[fid].append(p)

    # Index slabs by floorID
    slabs_by_floor: Dict[int, Polygon] = {}
    for s_id, s in slabs.items():
        fid = int(s["floorID"])
        coords = list(zip(s["x"], s["y"]))
        if coords[0] != coords[-1]:
            coords.append(coords[0])
        p = Polygon(coords)
        if not p.is_valid:
            p = p.buffer(0)
        slabs_by_floor[fid] = p

    clean_plans: List[Dict[str, Any]] = []
    stats: Dict[str, Any] = {
        "raw_floors": len(floors),
        "total_walls": len(rects),
        "total_slabs": len(slabs),
        "dropped_missing_slab": 0,
        "dropped_invalid_slab": 0,
        "dropped_no_rooms": 0,
        "clean_plans": 0,
        "total_recovered_rooms": 0,
        "rooms_per_plan": [],
        "width_m": [],
        "depth_m": [],
        "area_m2": [],
    }

    t0 = time.time()
    for fid_str, floor_meta in floors.items():
        fid = int(fid_str)
        slab_poly = slabs_by_floor.get(fid)
        if slab_poly is None:
            stats["dropped_missing_slab"] += 1
            continue
        if not slab_poly.is_valid or slab_poly.area < 10.0:
            stats["dropped_invalid_slab"] += 1
            continue

        walls = walls_by_floor.get(fid, [])
        recovered = recover_rooms_from_walls(
            slab_poly=slab_poly,
            wall_polys=walls,
            dilation_radius=dilation_radius,
            min_room_area=min_room_area,
        )

        if not recovered:
            stats["dropped_no_rooms"] += 1
            continue

        # Coordinate translation: shift bounding box minimum to (0.0, 0.0)
        min_x, min_y, max_x, max_y = slab_poly.bounds
        width_m = round(max_x - min_x, 2)
        depth_m = round(max_y - min_y, 2)

        rooms_out: List[Dict[str, Any]] = []
        for room_poly in recovered:
            rx1, ry1, rx2, ry2 = room_poly.bounds
            rw = round(rx2 - rx1, 2)
            rd = round(ry2 - ry1, 2)
            rx = round(rx1 - min_x, 2)
            ry = round(ry1 - min_y, 2)

            room_obj: Dict[str, Any] = {
                "type": "room",
                "x": rx,
                "y": ry,
                "w": rw,
                "d": rd,
                "floor": 1,
            }

            # Check if rectangular
            poly_area = room_poly.area
            bbox_area = rw * rd
            is_rect = abs(poly_area - bbox_area) / max(bbox_area, 1e-4) < 0.05

            if not is_rect:
                coords = [(round(x - min_x, 2), round(y - min_y, 2)) for x, y in room_poly.exterior.coords]
                room_obj["polygon"] = coords

            rooms_out.append(room_obj)

        plan_entry: Dict[str, Any] = {
            "id": f"mlstruct_{fid}",
            "width_m": width_m,
            "depth_m": depth_m,
            "floors": 1,
            "rooms": rooms_out,
            "source_id": fid,
        }

        clean_plans.append(plan_entry)
        stats["rooms_per_plan"].append(len(rooms_out))
        stats["width_m"].append(width_m)
        stats["depth_m"].append(depth_m)
        stats["area_m2"].append(round(slab_poly.area, 1))

    stats["clean_plans"] = len(clean_plans)
    stats["total_recovered_rooms"] = sum(stats["rooms_per_plan"])
    stats["elapsed_seconds"] = round(time.time() - t0, 2)

    return clean_plans, stats


def write_clean_dataset(plans: List[Dict[str, Any]], output_path: Path) -> None:
    """Write cleaned plans to JSON Lines."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Writing {len(plans):,} plans to {output_path}...")
    with open(output_path, "w", encoding="utf-8") as f:
        for plan in plans:
            f.write(json.dumps(plan, ensure_ascii=False) + "\n")
    print(f"Saved {output_path} ({(output_path.stat().st_size / (1024*1024)):.2f} MB)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Clean and normalize MLSTRUCT-FP dataset")
    parser.add_argument("--raw-path", type=Path, default=DEFAULT_JSON_PATH, help="Path to fp.json")
    parser.add_argument("--output-path", type=Path, default=DEFAULT_OUTPUT_PATH, help="Path to clean.jsonl")
    parser.add_argument("--dilation", type=float, default=0.75, help="Morphological dilation radius (meters) for door gap closing")
    parser.add_argument("--min-room-area", type=float, default=1.5, help="Minimum room area (m2) to retain")
    args = parser.parse_args()

    data = load_raw_dataset(args.raw_path)
    clean_plans, stats = clean_mlstruct_dataset(
        data=data,
        dilation_radius=args.dilation,
        min_room_area=args.min_room_area,
    )
    write_clean_dataset(clean_plans, args.output_path)

    rooms_per_plan = stats["rooms_per_plan"]
    median_rooms = sorted(rooms_per_plan)[len(rooms_per_plan) // 2] if rooms_per_plan else 0
    mean_rooms = stats["total_recovered_rooms"] / stats["clean_plans"] if stats["clean_plans"] else 0

    print("\n" + "=" * 60)
    print("MLSTRUCT-FP CLEANING REPORT")
    print("=" * 60)
    print(f"Raw floor plates in dataset: {stats['raw_floors']}")
    print(f"Total structural walls:      {stats['total_walls']}")
    print(f"Dropped (missing slab):      {stats['dropped_missing_slab']}")
    print(f"Dropped (invalid slab):      {stats['dropped_invalid_slab']}")
    print(f"Dropped (no rooms recovered):{stats['dropped_no_rooms']}")
    print(f"Final Clean Plans:           {stats['clean_plans']} ({(stats['clean_plans']/stats['raw_floors'])*100:.1f}%)")
    print(f"Total Rooms Recovered:       {stats['total_recovered_rooms']}")
    print(f"Rooms per Plan (mean/median):{mean_rooms:.1f} / {median_rooms}")
    print(f"Min / Max Rooms per Plan:    {min(rooms_per_plan)} / {max(rooms_per_plan)}")
    print(f"Median Footprint Area:       {sorted(stats['area_m2'])[len(stats['area_m2'])//2]:.1f} m²")
    print(f"Median Width / Depth:        {sorted(stats['width_m'])[len(stats['width_m'])//2]:.1f} m / {sorted(stats['depth_m'])[len(stats['depth_m'])//2]:.1f} m")
    print(f"Processing time:             {stats['elapsed_seconds']}s")
    print("=" * 60)


if __name__ == "__main__":
    main()
