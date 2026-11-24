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
INDIAN = ("data/extra/indian_houses/room_sizes.jsonl", "data/extra/indian_houses/programs.jsonl")  # printed sizes from 214 CAD plans (MIT)
FT = 0.3048
# Printed CAD labels -> Nestora types (first match wins; combined rooms like DRESS/TOILET are skipped)
LABELS = [("MASTER", "bedroom_master"), ("BED", "bedroom"), ("POWDER", "toilet"), ("PWDR", "toilet"), ("PDRM", "toilet"),
          ("TOILET", "toilet"), ("FRY", None), ("KITCHEN", "kitchen"), ("DINING", "dining"), ("POOJA", "puja"), ("PUJA", "puja"),
          ("MANDIR", "puja"), ("SITTING", "living"), ("LOUNGE", "living"), ("DRAWING", "living"), ("LIVING", "living"),
          ("GREAT ROOM", "living"), ("PASSAGE", "passage"), ("LOBBY", "passage"), ("STAIR", "stair"), ("STORE", "store"),
          ("PORCH", "porch"), ("FOYER", "entrance"), ("ENTRY", "entrance"), ("BALCONY", "balcony"), ("WASH", "utility"), ("UTILITY", "utility"), ("STUDY", "study"), ("OFFICE", "study")]

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


def outline(r):
    poly = r.get("polygon")
    if poly and len(poly) >= 3:
        return [tuple(p) for p in poly]
    x, y, w, d = _rect(r)
    return [(x, y), (x + w, y), (x + w, y + d), (x, y + d)]


def shared_wall(a, b) -> float:
    """Length (m) of boundary two rooms share: parallel edges within TOL of each other, overlapping along their length."""
    ax, ay, aw, ad = _rect(a)
    bx, by, bw, bd = _rect(b)
    if ax > bx + bw + TOL or bx > ax + aw + TOL or ay > by + bd + TOL or by > ay + ad + TOL:
        return 0.0
    pa, pb = outline(a), outline(b)
    total = 0.0
    for p1, p2 in zip(pa, pa[1:] + pa[:1]):
        dx, dy = p2[0] - p1[0], p2[1] - p1[1]
        L = math.hypot(dx, dy)
        if L < 0.2:
            continue
        ux, uy = dx / L, dy / L
        for q1, q2 in zip(pb, pb[1:] + pb[:1]):
            # both ends of q within TOL of p's line, then overlap of the projections
            d1 = abs((q1[0] - p1[0]) * uy - (q1[1] - p1[1]) * ux)
            d2 = abs((q2[0] - p1[0]) * uy - (q2[1] - p1[1]) * ux)
            if d1 > TOL or d2 > TOL:
                continue
            t1 = (q1[0] - p1[0]) * ux + (q1[1] - p1[1]) * uy
            t2 = (q2[0] - p1[0]) * ux + (q2[1] - p1[1]) * uy
            total += max(0.0, min(L, max(t1, t2)) - max(0.0, min(t1, t2)))
    return total


def adjacent(a, b) -> bool:
    return shared_wall(a, b) >= MIN_SHARED


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
            seen = set()
            for i, a in enumerate(floor):
                for b in floor[i + 1:]:
                    if adjacent(a, b):
                        seen.add(pair(a["type"], b["type"]))
            for k in seen:
                adj[k] += 1
    stat = lambda v: {"mu": round(mean(v), 4), "sd": round(max(pstdev(v), 0.05), 4), "n": len(v)}
    return {
        "rooms": {t: {"log_area": stat(area[t]), "log_aspect": stat(aspect[t])} for t in area if len(area[t]) >= 50},
        "adjacency": {k: round((adj[k] + 1) / (both[k] + 2), 4) for k in both if both[k] >= 30},  # Laplace-smoothed
    }


def indian_sizes():
    """Room sizes printed on real Indian house drawings, bucketed by plot (footprint ~65% of plot)."""
    plots = {}
    for l in open(INDIAN[1], encoding="utf-8"):
        p = json.loads(l)
        if p.get("plot_w_ft") and p.get("plot_d_ft"):
            plots[p["id"].replace("indian_house_", "")] = p["plot_w_ft"] * p["plot_d_ft"] * FT * FT * 0.65  # ponytail: rough footprint
    area, aspect = defaultdict(list), defaultdict(list)
    for l in open(INDIAN[0], encoding="utf-8"):
        p = json.loads(l)
        plate_m2 = plots.get(p["file"].rsplit(".", 1)[0])
        if not plate_m2:
            continue
        for r in p["rooms"]:
            lab = (r["label"] or "").upper()
            if "/" in lab or not r.get("w_ft") or not r.get("d_ft"):
                continue
            t = next((v for k, v in LABELS if k in lab), None)
            if not t:
                continue
            w, d = r["w_ft"] * FT, r["d_ft"] * FT
            if min(w, d) < 0.6:
                continue
            for key in (t, f"{t}@{bucket(plate_m2)}"):
                area[key].append(math.log(w * d))
                aspect[key].append(math.log(max(w, d) / min(w, d)))
    stat = lambda v: {"mu": round(mean(v), 4), "sd": round(max(pstdev(v), 0.05), 4), "n": len(v)}
    return {t: {"log_area": stat(area[t]), "log_aspect": stat(aspect[t])} for t in area if len(area[t]) >= 30}


def merge(primary, secondary, min_n=200):
    """ResPlan wins where it has enough data (South Asian proportions); Swiss fills stairs, passages, dining."""
    rooms = dict(secondary["rooms"])
    # ResPlan labels living + its corridors as one polygon, so living stats come from Swiss (separate passage label).
    rooms.update({t: v for t, v in primary["rooms"].items() if v["log_area"]["n"] >= min_n and t.split("@")[0] != "living"})
    adjacency = dict(secondary["adjacency"])
    multi = ("stair", "passage", "dining")  # flats rarely have these; trust the multi-floor set for their neighbours
    adjacency.update({k: v for k, v in primary["adjacency"].items() if not any(m in k.split("|") for m in multi)})
    return {"rooms": rooms, "adjacency": adjacency}


# Nestora room types -> the types the prior knows
ALIAS = {"bedroom_elder": "bedroom", "bedroom_guest": "bedroom", "bedroom_kid": "bedroom", "help": "bedroom",
         "lounge": "living"}


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
    rooms_t = [(t, r) for (t, r), _ in known]
    for i, (ta, a) in enumerate(rooms_t):
        for tb, b in rooms_t[i + 1:]:
            if "stair" in (ta, tb):
                continue  # ponytail: Swiss stairs are shared apartment cores; skip until we have house data with internal stairs
            if adjacent(a, b):
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
    indian = indian_sizes() if os.path.exists(INDIAN[0]) else {}
    for t, v in indian.items():  # real Indian houses win for their plot-size buckets, and for room types nobody else has
        if "@" in t or t not in prior["rooms"]:
            prior["rooms"][t] = v
    prior["meta"] = {
        "sources": ["ResPlan v1.0.0 (github.com/m-agour/ResPlan), CC BY 4.0",
                    "Swiss Dwellings v3.0.0 (zenodo.org/records/7788422), CC BY 4.0",
                    "Indian house CAD plans (huggingface.co/datasets/umesh16071973/Floorplan_Dataset_20022024), MIT: printed room sizes only"],
        "indian_room_types": sorted(t for t in indian if "@" not in t),
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
