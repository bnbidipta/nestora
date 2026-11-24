"""
Train Nestora's plan-realism prior on open data, all CC BY 4.0 (see docs/research/open-datasets-report.md):
ResPlan (South Asian homes: room proportions) and Swiss Dwellings (multi-floor: stairs, passages, dining).
Learns, per room type and plot-size bucket:
  - log-normal room area and aspect ratio (from the room outline, so rotated rooms count correctly)
  - how often two room types share a wall when both are on the same floor
from 90% of each set, then checks on the held-out 10% that real plans score higher than shuffled ones.
Output: backend/app/data/learned/plan_prior.json (aggregate statistics only, no plans).

    python -m backend.ml.train_plan_prior
"""
import json
import math
import os
import random
from collections import defaultdict
from statistics import mean, pstdev

SOURCES = {"resplan": "data/resplan/clean.jsonl", "swiss": "data/swiss/clean.jsonl"}
BUCKETS = (("small", 0, 90), ("medium", 90, 160), ("large", 160, 1e9))  # floor plate m2: 20x30 ft = 56, 40x60 ft = 223
OUT = "backend/app/data/learned/plan_prior.json"
TOL, MIN_SHARED = 0.15, 0.6  # metres: touching tolerance, minimum shared wall to count as adjacent


def _rect(r):
    return r["x"], r["y"], r["w"], r["d"]


def touches(a, b) -> bool:
    ax, ay, aw, ad = a
    bx, by, bw, bd = b
    ox = min(ax + aw, bx + bw) - max(ax, bx)
    oy = min(ay + ad, by + bd) - max(ay, by)
    vertical = (abs(ax + aw - bx) < TOL or abs(bx + bw - ax) < TOL) and oy >= MIN_SHARED
    horizontal = (abs(ay + ad - by) < TOL or abs(by + bd - ay) < TOL) and ox >= MIN_SHARED
    return vertical or horizontal


def pair(a: str, b: str) -> str:
    return "|".join(sorted((a, b)))


def area_aspect(r):
    """True area and long:short ratio. Outlines: shoelace area, and the rectangle with the same area and perimeter."""
    poly = r.get("polygon")
    if not poly or len(poly) < 4:
        return r["w"] * r["d"], max(r["w"], r["d"]) / min(r["w"], r["d"])
    ring = list(zip(poly, poly[1:] + poly[:1]))
    a = abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in ring)) / 2
    h = sum(math.dist(p, q) for p, q in ring) / 4
    disc = h * h - a
    if a <= 0 or disc <= 0:
        return max(a, 1e-3), 1.0
    return a, (h + math.sqrt(disc)) / (h - math.sqrt(disc))


def axis_aligned(r) -> bool:
    return not r.get("polygon") or area_aspect(r)[0] >= 0.85 * r["w"] * r["d"]


def by_floor(rooms):
    out = defaultdict(list)
    for r in rooms:
        out[r.get("floor", 0)].append(r)
    return list(out.values())


def bucket(plate_m2: float) -> str:
    return next(n for n, lo, hi in BUCKETS if lo <= plate_m2 < hi)


def plate(p) -> float:
    return p["width_m"] * p["depth_m"]


def fit(plans):
    area, aspect = defaultdict(list), defaultdict(list)
    adj, both = defaultdict(int), defaultdict(int)
    for p in plans:
        bk = bucket(plate(p))
        for floor in by_floor([r for r in p["rooms"] if r["w"] > 0.5 and r["d"] > 0.5]):
            for r in floor:
                ar, asp = area_aspect(r)
                for key in (r["type"], f"{r['type']}@{bk}"):
                    area[key].append(math.log(ar))
                    aspect[key].append(math.log(asp))
            types = sorted({r["type"] for r in floor})
            for i, a in enumerate(types):
                for b in types[i:]:
                    both[pair(a, b)] += 1
            square = [r for r in floor if axis_aligned(r)]
            seen = set()
            for i, a in enumerate(square):
                for b in square[i + 1:]:
                    if touches(_rect(a), _rect(b)):
                        seen.add(pair(a["type"], b["type"]))
            for k in seen:
                adj[k] += 1
    stat = lambda v: {"mu": round(mean(v), 4), "sd": round(max(pstdev(v), 0.05), 4), "n": len(v)}
    return {
        "rooms": {t: {"log_area": stat(area[t]), "log_aspect": stat(aspect[t])} for t in area if len(area[t]) >= 50},
        "adjacency": {k: round((adj[k] + 1) / (both[k] + 2), 4) for k in both if both[k] >= 30},  # Laplace-smoothed
    }


def merge(primary, secondary, min_n=200):
    """ResPlan wins where it has enough data (South Asian proportions); Swiss fills stairs, passages, dining."""
    rooms = dict(secondary["rooms"])
    rooms.update({t: v for t, v in primary["rooms"].items() if v["log_area"]["n"] >= min_n})
    adjacency = dict(secondary["adjacency"])
    adjacency.update(primary["adjacency"])
    return {"rooms": rooms, "adjacency": adjacency}


# Nestora room types -> the types the prior knows
ALIAS = {"bedroom_elder": "bedroom", "bedroom_guest": "bedroom", "bedroom_kid": "bedroom", "help": "bedroom",
         "lounge": "living", "entrance": "porch"}


def realism(rooms, prior, plate_m2=None) -> dict:
    """0..1: how typical the room sizes, proportions and adjacencies are vs real plans.
    rooms: [{type,x,y,w,d,polygon?}] in metres, one floor; plate_m2 picks the plot-size bucket."""
    bk = bucket(plate_m2) if plate_m2 else None
    known = []
    for r in rooms:
        t = ALIAS.get(r["type"], r["type"])
        s = prior["rooms"].get(f"{t}@{bk}") or prior["rooms"].get(t)
        if not s or r["w"] <= 0 or r["d"] <= 0:
            continue
        ar, asp = area_aspect(r)
        za = (math.log(ar) - s["log_area"]["mu"]) / s["log_area"]["sd"]
        zr = (math.log(asp) - s["log_aspect"]["mu"]) / s["log_aspect"]["sd"]
        known.append(((t, r), math.exp(-0.5 * (za * za + zr * zr) / 2)))
    size = mean(v for _, v in known) if known else 0.5
    adj = []
    square = [(t, r) for (t, r), _ in known if axis_aligned(r)]
    for i, (ta, a) in enumerate(square):
        for tb, b in square[i + 1:]:
            if touches(_rect(a), _rect(b)):
                p = prior["adjacency"].get(pair(ta, tb))
                if p is not None:
                    adj.append(p)
    adjs = mean(adj) if adj else 0.5
    return {"size": round(size, 3), "adjacency": round(adjs, 3), "score": round(0.6 * size + 0.4 * adjs, 3)}


def heldout(test, prior):
    """Real plans vs the same plans with room sizes shuffled between rooms (a plausible-looking fake)."""
    rng, real, fake = random.Random(1), [], []
    for p in test:
        for floor in by_floor(p["rooms"]):
            if len(floor) < 3:
                continue
            real.append(realism(floor, prior, plate(p))["score"])
            rooms = [{k: v for k, v in r.items() if k != "polygon"} for r in floor]
            dims = [(r["w"], r["d"]) for r in rooms]
            rng.shuffle(dims)
            for r, (w, d) in zip(rooms, dims):
                r["w"], r["d"] = w, d
            fake.append(realism(rooms, prior, plate(p))["score"])
    return {"real_mean": round(mean(real), 3), "shuffled_mean": round(mean(fake), 3),
            "real_beats_shuffled": round(sum(r > f for r, f in zip(real, fake)) / len(real), 3), "floors": len(real)}


def main():
    fits, tests = {}, {}
    for name, path in SOURCES.items():
        plans = [json.loads(l) for l in open(path, encoding="utf-8")]
        random.Random(7).shuffle(plans)
        cut = int(len(plans) * 0.9)
        fits[name], tests[name] = fit(plans[:cut]), plans[cut:]
    prior = merge(fits["resplan"], fits["swiss"])
    prior["meta"] = {
        "sources": ["ResPlan v1.0.0 (github.com/m-agour/ResPlan), CC BY 4.0",
                    "Swiss Dwellings v3.0.0 (zenodo.org/records/7788422), CC BY 4.0"],
        "attribution": "Floor-plan statistics derived from ResPlan (Abouagour & Garyfallidis) and Swiss Dwellings (Archilyse), both CC BY 4.0.",
        "buckets_m2": {n: [lo, hi] for n, lo, hi in BUCKETS},
        "heldout": {name: heldout(t, prior) for name, t in tests.items()},
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(prior, f, indent=1)
    print(json.dumps(prior["meta"]["heldout"], indent=1))
    print("room types:", sorted(t for t in prior["rooms"] if "@" not in t))


if __name__ == "__main__":
    main()
