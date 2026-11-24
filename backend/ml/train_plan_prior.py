"""
Train Nestora's plan-realism prior on open data (ResPlan, CC BY 4.0 per its GitHub release; see
docs/research/resplan-report.md for the licence caveat). Learns, per room type:
  - log-normal room area and aspect ratio
  - how often two room types share a wall when both are present
from 90% of data/resplan/clean.jsonl, then checks on the held-out 10% that real plans score higher than shuffled ones.
Output: backend/app/data/learned/plan_prior.json (aggregate statistics only, no plans).

    python -m backend.ml.train_plan_prior
"""
import json
import math
import os
import random
from collections import defaultdict
from statistics import mean, pstdev

SRC = "data/resplan/clean.jsonl"
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


def fit(plans):
    area, aspect = defaultdict(list), defaultdict(list)
    adj, both = defaultdict(int), defaultdict(int)
    for p in plans:
        rooms = [r for r in p["rooms"] if r["w"] > 0.5 and r["d"] > 0.5]
        for r in rooms:
            area[r["type"]].append(math.log(r["w"] * r["d"]))
            aspect[r["type"]].append(math.log(max(r["w"], r["d"]) / min(r["w"], r["d"])))
        types = sorted({r["type"] for r in rooms})
        for i, a in enumerate(types):
            for b in types[i:]:
                both[pair(a, b)] += 1
        seen = set()
        for i, a in enumerate(rooms):
            for b in rooms[i + 1:]:
                if touches(_rect(a), _rect(b)):
                    seen.add(pair(a["type"], b["type"]))
        for k in seen:
            adj[k] += 1
    stat = lambda v: {"mu": round(mean(v), 4), "sd": round(max(pstdev(v), 0.05), 4), "n": len(v)}
    return {
        "rooms": {t: {"log_area": stat(area[t]), "log_aspect": stat(aspect[t])} for t in area if len(area[t]) >= 50},
        "adjacency": {k: round((adj[k] + 1) / (both[k] + 2), 4) for k in both if both[k] >= 30},  # Laplace-smoothed
    }


# Nestora room types -> the types the prior knows
ALIAS = {"bedroom_elder": "bedroom", "bedroom_guest": "bedroom", "bedroom_kid": "bedroom", "help": "bedroom",
         "lounge": "living", "dining": "living", "entrance": "porch"}


def realism(rooms, prior) -> dict:
    """0..1: how typical the room sizes, proportions and adjacencies are vs real plans. rooms: [{type,x,y,w,d}] in metres, one floor."""
    known = []
    for r in rooms:
        t = ALIAS.get(r["type"], r["type"])
        s = prior["rooms"].get(t)
        if not s or r["w"] <= 0 or r["d"] <= 0:
            continue
        za = (math.log(r["w"] * r["d"]) - s["log_area"]["mu"]) / s["log_area"]["sd"]
        zr = (math.log(max(r["w"], r["d"]) / min(r["w"], r["d"])) - s["log_aspect"]["mu"]) / s["log_aspect"]["sd"]
        known.append(((t, r), math.exp(-0.5 * (za * za + zr * zr) / 2)))
    size = mean(v for _, v in known) if known else 0.5
    adj = []
    for i, ((ta, a), _) in enumerate(known):
        for (tb, b), _ in known[i + 1:]:
            if touches(_rect(a), _rect(b)):
                p = prior["adjacency"].get(pair(ta, tb))
                if p is not None:
                    adj.append(p)
    adjs = mean(adj) if adj else 0.5
    return {"size": round(size, 3), "adjacency": round(adjs, 3), "score": round(0.6 * size + 0.4 * adjs, 3)}


def main():
    plans = [json.loads(l) for l in open(SRC, encoding="utf-8")]
    random.Random(7).shuffle(plans)
    cut = int(len(plans) * 0.9)
    train, test = plans[:cut], plans[cut:]
    prior = fit(train)
    # Held-out check: real plans vs the same plans with room sizes shuffled between rooms (a "plausible-looking fake").
    real = [realism(p["rooms"], prior)["score"] for p in test]
    rng = random.Random(1)
    fake = []
    for p in test:
        rooms = [dict(r) for r in p["rooms"]]
        dims = [(r["w"], r["d"]) for r in rooms]
        rng.shuffle(dims)
        for r, (w, d) in zip(rooms, dims):
            r["w"], r["d"] = w, d
        fake.append(realism(rooms, prior)["score"])
    wins = sum(r > f for r, f in zip(real, fake)) / len(real)
    prior["meta"] = {"source": "ResPlan v1.0.0 (github.com/m-agour/ResPlan), CC BY 4.0; cleaned by scripts/resplan_clean.py",
                     "attribution": "Floor-plan statistics derived from ResPlan (Agour et al.), CC BY 4.0.",
                     "train_plans": len(train), "test_plans": len(test),
                     "heldout_real_mean": round(mean(real), 3), "heldout_shuffled_mean": round(mean(fake), 3),
                     "heldout_real_beats_shuffled": round(wins, 3)}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(prior, f, indent=1)
    print(json.dumps(prior["meta"], indent=1))
    print("room types:", sorted(prior["rooms"]))


if __name__ == "__main__":
    main()
