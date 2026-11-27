"""
Builds the pre-solved floor-plan library (backend/app/data/library/plans.json.gz) on free CI compute.

  python scripts/build_plan_library.py --count                 # how many distinct plans to solve
  python scripts/build_plan_library.py --shard 3 --of 20 --out lib/   # solve one share (one CI job)
  python scripts/build_plan_library.py --merge lib/             # combine the shares into the library file

Every common plot size x road class x household is reduced to the distinct room programs the app would ask for
(optional rooms at three levels: none, puja + store, all), each solved with private and with open bedroom doors.
"""
import argparse
import glob
import gzip
import itertools
import json
import logging
import os
import random
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app.models.brief import Brief  # noqa: E402
from backend.app.services import generator, library, pack, solver  # noqa: E402

PLOTS = [(20, 30), (20, 40), (25, 40), (25, 50), (30, 40), (30, 45), (30, 50), (30, 60), (33, 45), (35, 55), (40, 40),
         (40, 50), (40, 60), (40, 70), (50, 80), (24, 48), (28, 38), (27, 43), (18, 40), (22, 35)]
ROADS = [9, 12, 15]  # one per floor-area (FSI) class
SEEDS = (0,)


def households():
    for couples, singles, kids, elders, floors, parking, kitchen in itertools.product(
            (1, 2), (0, 1), (0, 1, 2, 3), (0, 1), (1, 2, 3), ("two_wheeler", "car"), ("closed", "open")):
        if couples == 2 and kids == 3:
            continue
        yield dict(couples=couples, singles=singles, kids=kids, elder_couples=elders, floors_wanted=floors, parking=parking,
                   cars=1, kitchen=kitchen)


def jobs():
    """key -> (plot, road, brief kwargs, strategy), one per distinct program."""
    out = {}
    for (w, d), road, hh in itertools.product(PLOTS, ROADS, households()):
        b = library.full_brief(Brief(plot_width_ft=w, plot_depth_ft=d, road_width_m=road, styles=["indian_contemporary"], **hh))
        r = pack.rules(w * pack.FT, d * pack.FT, road, b.city)
        for st in generator.strategies(b, r):
            k = json.dumps([w, d, library.key(b, r, st)])
            out.setdefault(k, ((w, d), road, hh, st))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", action="store_true")
    ap.add_argument("--shard", type=int, default=0)
    ap.add_argument("--of", type=int, default=1)
    ap.add_argument("--out", default="lib")
    ap.add_argument("--merge")
    a = ap.parse_args()
    logging.disable(logging.WARNING)
    if a.merge:
        plans = {}
        for f in sorted(glob.glob(os.path.join(a.merge, "**", "shard-*.json"), recursive=True)):
            for k, v in json.load(open(f, encoding="utf-8")).items():
                plans.setdefault(k, []).extend(v)
        os.makedirs(os.path.dirname(library.FILE), exist_ok=True)
        with gzip.open(library.FILE, "wt", encoding="utf-8") as f:
            json.dump({"version": 1, "built": time.strftime("%Y-%m-%d"), "plans": plans}, f, separators=(",", ":"))
        print(f"{len(plans)} keys, {sum(map(len, plans.values()))} plans -> {library.FILE} ({os.path.getsize(library.FILE) // 1024} KB)")
        return
    js = jobs()
    if a.count:
        print(len(js), "distinct programs to solve")
        return
    mine = sorted(js)[a.shard::a.of]
    os.makedirs(a.out, exist_ok=True)
    res, t0 = {}, time.time()
    for i, k in enumerate(mine):
        plot, road, hh, st = js[k]
        lib_key = json.loads(k)[2]
        for tier, privacy, seed in itertools.product(library.TIERS, ("private", "open"), SEEDS):
            b = library.tier_brief(Brief(plot_width_ft=plot[0], plot_depth_ft=plot[1], road_width_m=road, styles=["indian_contemporary"],
                                         bedroom_privacy=privacy, **hh), tier)
            c = solver.solve(b, st, random.Random(seed))
            if c and not solver.reachable(c["layout"]) and (privacy == "private" or c["layout"]["privacy"] == "open"):
                e = library.compact(c, plot)
                if e not in res.get(lib_key, []):
                    res.setdefault(lib_key, []).append(e)
        print(f"{i + 1}/{len(mine)} {time.time() - t0:.0f}s", flush=True)
    path = os.path.join(a.out, f"shard-{a.shard:02d}.json")
    json.dump(res, open(path, "w", encoding="utf-8"), separators=(",", ":"))
    print("wrote", path, sum(map(len, res.values())), "plans")


if __name__ == "__main__":
    main()
