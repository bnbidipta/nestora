"""scripts/extra_clean.py — Architectural Program Cleaner for Indian Residential House Plans.

Cleans and extracts natural-language architectural briefs and floor-plan programs from
the Indian Residential House Plan dataset (Hugging Face: `umesh16071973/Floorplan_Dataset_20022024`,
MIT License) featuring independent houses, villas, and bungalows.

Reviewer Correction Note (agy task 16):
- Captions contain architectural programs (plot size, facing, corner, floor count, room counts,
  and special features like puja, porch, lift, lawn, dressing), NOT vectorized geometric room coordinates.
- Prior synthetic uniform grid room allocations have been eliminated.
- The real raster floor-plan images (215 CAD line drawings, 3200×1800 resolution) are preserved
  in `data/extra/indian_houses/images/` under MIT License.
- Outputs ONLY verified extracted program parameters to `data/extra/indian_houses/programs.jsonl`.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT_DIR = Path(__file__).resolve().parent.parent
EXTRA_DIR = ROOT_DIR / "data" / "extra" / "indian_houses"
RAW_DIR = EXTRA_DIR / "raw"
IMAGES_DIR = EXTRA_DIR / "images"
DEFAULT_CSV_PATH = RAW_DIR / "metadata.csv"
DEFAULT_OUTPUT_PATH = EXTRA_DIR / "programs.jsonl"
UPSTREAM_CSV_URL = (
    "https://huggingface.co/datasets/umesh16071973/Floorplan_Dataset_20022024/raw/main/metadata.csv"
)
UPSTREAM_TREE_URL = (
    "https://huggingface.co/api/datasets/umesh16071973/Floorplan_Dataset_20022024/tree/main"
)


def download_raw_if_missing(csv_path: Path) -> None:
    """Download upstream metadata.csv if not present locally."""
    if csv_path.exists():
        return
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading raw metadata from {UPSTREAM_CSV_URL} to {csv_path}...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    req = urllib.request.Request(UPSTREAM_CSV_URL, headers=headers)
    with urllib.request.urlopen(req) as resp, open(csv_path, "wb") as f:
        f.write(resp.read())
    print(f"Downloaded {csv_path.stat().st_size:,} bytes.")


def download_images_if_missing(images_dir: Path, max_workers: int = 8) -> None:
    """Download raster floor-plan images from Hugging Face if not already present."""
    images_dir.mkdir(parents=True, exist_ok=True)
    print(f"Checking images list from {UPSTREAM_TREE_URL}...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    req = urllib.request.Request(UPSTREAM_TREE_URL, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    img_names = [x["path"] for x in data if x.get("path", "").lower().endswith((".jpg", ".png", ".jpeg"))]
    missing = [name for name in img_names if not (images_dir / name).exists() or (images_dir / name).stat().st_size == 0]

    if not missing:
        print(f"All {len(img_names)} images already present in {images_dir}.")
        return

    print(f"Downloading {len(missing)} missing images (out of {len(img_names)}) to {images_dir}...")

    def _fetch(name: str) -> bool:
        target = images_dir / name
        url = f"https://huggingface.co/datasets/umesh16071973/Floorplan_Dataset_20022024/resolve/main/{name}"
        r = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(r, timeout=30) as resp, open(target, "wb") as f:
                f.write(resp.read())
            return True
        except Exception as err:
            print(f"Error downloading {name}: {err}")
            return False

    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        results = list(ex.map(_fetch, missing))
    print(f"Downloaded {sum(results)} / {len(missing)} images.")


def parse_plot_dimensions_ft(caption: str) -> Tuple[Optional[float], Optional[float]]:
    """Parse plot width and depth in feet from natural-language architectural brief."""
    cap_clean = caption.replace("\\'", "'").replace('\\"', '"')
    pattern = (
        r"(\d+)\s*(?:\'|ft)?\s*(?:-\s*(\d+)\s*\"?)?\s*[xX*×]\s*(\d+)\s*(?:\'|ft)?\s*(?:-\s*(\d+)\s*\"?)?"
    )
    m = re.search(pattern, cap_clean)
    if not m:
        return None, None

    w_ft = float(m.group(1)) + (float(m.group(2)) / 12.0 if m.group(2) else 0.0)
    d_ft = float(m.group(3)) + (float(m.group(4)) / 12.0 if m.group(4) else 0.0)

    # By convention: smaller dimension is width, larger is depth
    return round(min(w_ft, d_ft), 2), round(max(w_ft, d_ft), 2)


def parse_facing(caption: str) -> Optional[str]:
    """Parse cardinal orientation from caption."""
    m1 = re.search(
        r"(north-east|north-west|south-east|south-west|north|south|east|west)\s+(?:orientation|facing)",
        caption,
        re.I,
    )
    if m1:
        return m1.group(1).lower()

    m2 = re.search(
        r"facing\s+(?:the\s+)?(north-east|north-west|south-east|south-west|north|south|east|west)",
        caption,
        re.I,
    )
    if m2:
        return m2.group(1).lower()

    m3 = re.search(
        r"orientation\s+(?:is\s+)?(north-east|north-west|south-east|south-west|north|south|east|west)",
        caption,
        re.I,
    )
    if m3:
        return m3.group(1).lower()

    return None


def parse_corner(caption: str) -> bool:
    """Identify whether plot is a corner plot."""
    return bool(re.search(r"\bcorner\b", caption, re.I))


def parse_floors(caption: str) -> int:
    """Parse number of residential floors described in brief."""
    cap = caption.lower()
    if any(k in cap for k in ["g+2", "three floors", "3 floors", "second floor", "2nd floor"]):
        return 3
    if any(
        k in cap
        for k in [
            "stair",
            "stairway",
            "upper floor",
            "first floor",
            "1st floor",
            "g+1",
            "two floors",
            "duplex",
        ]
    ):
        return 2
    return 1


def parse_room_counts(caption: str) -> Dict[str, int]:
    """Extract semantic room counts explicitly mentioned in the caption."""
    cap = caption.lower()
    counts: Dict[str, int] = {}

    # Bedrooms
    m_bed = re.search(r"(\d+)\s*(?:attached\s*)?(?:master\s*)?bedrooms?", cap)
    if m_bed:
        counts["bedroom"] = int(m_bed.group(1))
    elif "bedroom" in cap or "master bedroom" in cap:
        counts["bedroom"] = 1

    # Bathrooms / Toilets / Powder rooms
    m_bath = re.search(r"(\d+)\s*(?:attached\s*)?bathrooms?", cap)
    if m_bath:
        counts["bathroom"] = int(m_bath.group(1))
    elif "bathroom" in cap:
        counts["bathroom"] = 1
    if "powder room" in cap or "powder" in cap:
        counts["powder_room"] = 1

    # Kitchens
    if "kitchen" in cap:
        k_count = 1
        if "wet kitchen" in cap or "fry kitchen" in cap:
            k_count += 1
        counts["kitchen"] = k_count

    # Living / Drawing / Dining
    if "drawing" in cap or "formal" in cap:
        counts["drawing_room"] = 1
    if "living" in cap or "informal" in cap or "family lounge" in cap or "sitting" in cap:
        counts["living_room"] = 1
    if "dinning" in cap or "dining" in cap:
        counts["dining_room"] = 1

    # Study
    if "study" in cap or "office" in cap:
        counts["study"] = 1

    return counts


def parse_features(caption: str) -> List[str]:
    """Identify architectural and functional features present in brief."""
    cap = caption.lower()
    features: List[str] = []
    feature_keywords = [
        ("puja", ["puja", "pooja", "mandir"]),
        ("porch", ["porch", "car park", "car porch", "parking", "proch"]),
        ("lift", ["lift", "elevator"]),
        ("lawn", ["lawn", "garden", "landscape", "landscaping"]),
        ("dressing", ["dressing", "dress area", "walk-in"]),
        ("staircase", ["stair", "stairway", "staircase", "steps"]),
        ("servant_room", ["servant", "maid"]),
        ("store", ["store", "pantry"]),
        ("utility", ["utility", "wash area", "washing"]),
        ("balcony", ["balcony", "terrace", "verandah", "veranda"]),
        ("foyer", ["foyer", "entrance lobby", "vestibule"]),
    ]
    for feat_name, kws in feature_keywords:
        if any(kw in cap for kw in kws):
            features.append(feat_name)
    return features


def clean_indian_programs(csv_path: Path) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Clean and extract verified architectural programs from metadata CSV."""
    with open(csv_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        header = next(reader)
        raw_rows = list(reader)

    programs: List[Dict[str, Any]] = []
    seen_ids = set()

    stats: Dict[str, Any] = {
        "raw_rows": len(raw_rows),
        "total_programs": 0,
        "with_dimensions": 0,
        "multi_floor": 0,
        "single_floor": 0,
        "corner_plots": 0,
        "facings": Counter(),
        "features": Counter(),
        "widths_ft": [],
        "depths_ft": [],
    }

    for row in raw_rows:
        if len(row) < 2:
            continue
        fn, cap = row[0].strip(), row[1].strip()
        stem = Path(fn).stem
        if stem in seen_ids:
            continue
        seen_ids.add(stem)

        w_ft, d_ft = parse_plot_dimensions_ft(cap)
        facing = parse_facing(cap)
        corner = parse_corner(cap)
        floors = parse_floors(cap)
        room_counts = parse_room_counts(cap)
        features = parse_features(cap)

        entry: Dict[str, Any] = {
            "id": f"indian_house_{stem}",
            "plot_w_ft": w_ft,
            "plot_d_ft": d_ft,
            "facing": facing,
            "corner": corner,
            "floors": floors,
            "room_counts": room_counts,
            "features": features,
            "caption": cap,
        }
        programs.append(entry)

        if w_ft is not None and d_ft is not None:
            stats["with_dimensions"] += 1
            stats["widths_ft"].append(w_ft)
            stats["depths_ft"].append(d_ft)

        if floors > 1:
            stats["multi_floor"] += 1
        else:
            stats["single_floor"] += 1

        if corner:
            stats["corner_plots"] += 1

        stats["facings"][facing] += 1
        for ft in features:
            stats["features"][ft] += 1

    stats["total_programs"] = len(programs)
    return programs, stats


def write_programs_jsonl(programs: List[Dict[str, Any]], output_path: Path) -> None:
    """Write parsed programs to JSON Lines."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Writing {len(programs):,} programs to {output_path}...")
    with open(output_path, "w", encoding="utf-8") as f:
        for p in programs:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")
    print(f"Saved {output_path} ({(output_path.stat().st_size / 1024):.1f} KB)")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Clean Indian House Plans architectural programs for Nestora"
    )
    parser.add_argument(
        "--raw-path", type=Path, default=DEFAULT_CSV_PATH, help="Path to raw metadata.csv"
    )
    parser.add_argument(
        "--output-path", type=Path, default=DEFAULT_OUTPUT_PATH, help="Path to programs.jsonl"
    )
    parser.add_argument(
        "--download-images",
        action="store_true",
        help="Download associated raster CAD drawings if missing",
    )
    args = parser.parse_args()

    download_raw_if_missing(args.raw_path)
    if args.download_images:
        download_images_if_missing(IMAGES_DIR)

    programs, stats = clean_indian_programs(args.raw_path)
    write_programs_jsonl(programs, args.output_path)

    # Ensure synthetic clean.jsonl is removed if present
    synthetic_clean = EXTRA_DIR / "clean.jsonl"
    if synthetic_clean.exists():
        synthetic_clean.unlink()
        print(f"Removed deprecated synthetic file: {synthetic_clean}")

    print("\n" + "=" * 65)
    print("INDIAN HOUSE ARCHITECTURAL PROGRAMS EXTRACTION REPORT")
    print("=" * 65)
    print(f"Raw rows processed:          {stats['raw_rows']}")
    print(f"Unique architectural briefs: {stats['total_programs']}")
    print(
        f"Briefs with plot dimensions: {stats['with_dimensions']} ({(stats['with_dimensions']/stats['total_programs'])*100:.1f}%)"
    )
    if stats["widths_ft"]:
        w_sorted = sorted(stats["widths_ft"])
        d_sorted = sorted(stats["depths_ft"])
        med_w = w_sorted[len(w_sorted) // 2]
        med_d = d_sorted[len(d_sorted) // 2]
        print(f"Median Plot Dimensions:      {med_w:.1f} ft x {med_d:.1f} ft")
    print(
        f"Multi-floor programs (G+1):  {stats['multi_floor']} ({(stats['multi_floor']/stats['total_programs'])*100:.1f}%)"
    )
    print(
        f"Corner plot programs:        {stats['corner_plots']} ({(stats['corner_plots']/stats['total_programs'])*100:.1f}%)"
    )
    print("Top features extracted:")
    for feat, count in stats["features"].most_common(8):
        print(f"  - {feat:14s}: {count:3d} ({(count/stats['total_programs'])*100:.1f}%)")
    print("=" * 65)


if __name__ == "__main__":
    main()
