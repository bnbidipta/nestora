"""
Pre-solved floor-plan library: plans the constraint solver made offline (scripts/build_plan_library.py, on free CI
compute), served in milliseconds. The free server is far too slow to solve live in reasonable time.

Each room program is solved at three levels of optional rooms (none; puja + store; all of store, puja, laundry, help
room, guest room, study). Serving picks the level closest to what the family asked for, drops any extras and lets the
neighbouring rooms grow into the space, so a few plans cover every combination of those toggles. A plan solved for a slightly smaller buildable area is stretched to the exact plot
(room edges scale together, so walls still meet). Every served plan is re-checked: no holes, every room reachable,
code minimum sizes, floor-area cap.
"""
import gzip
import json
import logging
import os
import random
from functools import cache
from typing import Any, Dict, List, Optional

from backend.app.models.brief import Brief
from backend.app.services import generator, pack, solver

log = logging.getLogger(__name__)
FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "library", "plans.json.gz")
OPTIONAL = ("store", "puja", "laundry", "help_room", "bedroom_guest", "study")
STRETCH_MAX = 1.25  # serve a plan on a buildable area up to 25% wider/deeper than it was solved for
S = solver.S


TIERS = ("bare", "common", "full")


def tier_brief(brief: Brief, tier: str) -> Brief:
    """The brief with the optional rooms of one library level."""
    on = tier == "full"
    return brief.model_copy(update={"store_room": tier != "bare", "puja": "none" if tier == "bare" else "room" if brief.puja == "room" else "nook",
                                    "laundry": on, "help_room": on, "guest_room": on, "wfh_people": max(1, brief.wfh_people) if on else 0})


def full_brief(brief: Brief) -> Brief:
    return tier_brief(brief, "full")


def key(brief: Brief, r: Dict[str, Any], strat: Dict[str, Any]) -> str:
    """What a plan must match exactly: the non-optional rooms per floor, how the floors are used and the floor-area rule."""
    prog = generator.program(full_brief(brief), r, strat["floors"], strat["parking"], strat["stilt"])
    core = sorted([x["floor"], x["id"]] for x in prog if x["id"] not in OPTIONAL)
    return json.dumps([core, strat["floors"], strat["parking"], strat["stilt"], brief.kitchen,
                       brief.cars if strat["parking"] == "car" else 0, r["fsi_max"]], separators=(",", ":"))


def compact(c: Dict[str, Any], plot_ft) -> Dict[str, Any]:
    L = c["layout"]
    return {"env": [c["envelope"]["width_m"], c["envelope"]["depth_m"]], "plot": list(plot_ft), "privacy": L["privacy"],
            "step": L.get("upper_step_m", 0), "fp": {str(f): v for f, v in L["footprints"].items()},
            "rooms": [[x["id"], x["floor"], x["x"], x["y"], x["w"], x["d"], x.get("opens_to")] for x in L["rooms"]],
            "dropped": L.get("dropped", [])}


@cache
def index() -> Dict[str, List[Dict[str, Any]]]:
    if not os.path.exists(FILE):
        return {}
    with gzip.open(FILE, "rt", encoding="utf-8") as f:
        data = json.load(f)
    log.info("plan library: %d keys, %d plans", len(data["plans"]), sum(len(v) for v in data["plans"].values()))
    return data["plans"]


def _cells(v: float, scale: float) -> int:
    return int(round(v * scale * S))


def adapt(entry: Dict[str, Any], brief: Brief, strat: Dict[str, Any], rng: random.Random) -> Optional[Dict[str, Any]]:
    """The library plan fitted to this brief and plot, or None when it doesn't hold up."""
    W_m, D_m = brief.plot_width_ft * pack.FT, brief.plot_depth_ft * pack.FT
    r = pack.rules(W_m, D_m, brief.road_width_m, brief.city)
    env = pack.envelope(W_m, D_m, r)
    sx, sy = env["width_m"] / entry["env"][0], env["depth_m"] / entry["env"][1]
    if not (0.999 <= sx <= STRETCH_MAX and 0.999 <= sy <= STRETCH_MAX):
        return None
    rooms = generator.program(brief, r, strat["floors"], strat["parking"], strat["stilt"])
    want = {x["id"]: x for x in rooms}
    have = {e[0] for e in entry["rooms"]}
    missing = set(want) - have
    if any(want[x]["prio"] == 1 for x in missing):  # an essential room this family needs that the plan doesn't have
        return None
    gone = have - set(want)
    opens, boxes = {}, {}
    for rid, f, x, y, w, d, to in entry["rooms"]:
        if rid in gone:
            continue
        if to in gone:  # something opens onto a room being removed: not a leaf, can't drop it
            return None
        x0, y0, x1, y1 = _cells(x, sx), _cells(y, sy), _cells(x + w, sx), _cells(y + d, sy)
        boxes[rid] = [x0, y0, x1 - x0, y1 - y0]
        if to:
            opens[rid] = to
    # ponytail: stretching also widens the stair box (a roomier stair hall, never a steeper stair); fine up to STRETCH_MAX
    rects = {int(f): (_cells(v[0], sx), _cells(v[1], sy), _cells(v[0] + v[2], sx) - _cells(v[0], sx),
                      _cells(v[1] + v[3], sy) - _cells(v[1], sy)) for f, v in entry["fp"].items()}
    first_living = 1 if strat["stilt"] else 0
    cap = int(W_m * D_m * r["fsi_max"] * S * S)
    placed = [x for x in rooms if x["id"] in boxes]
    built = lambda: sum(boxes[x["id"]][2] * boxes[x["id"]][3] for x in placed
                        if x["type"] not in generator.NON_FSI and not (strat["stilt"] and x["floor"] == 0 and x["type"] != "stair"))
    for f, rect in sorted(rects.items()):  # close the gaps left by removed rooms
        if f < first_living:
            continue
        fr = [x for x in placed if x["floor"] == f]
        solver._grow(boxes, fr, rect, budget=max(0, cap - built()))
        solver._grow(boxes, fr, rect, budget=max(0, cap - built()), types=tuple(t for t in generator.TYPES if t not in ("stair", "lift")))
        if rect[2] * rect[3] - sum(boxes[x["id"]][2] * boxes[x["id"]][3] for x in fr) > solver.HOLE_M2 * S * S:
            return None
    if built() > cap:
        return None
    for x in placed:  # code minimums for this family (e.g. a bigger dining table than the plan was solved for)
        w, h = boxes[x["id"]][2] / S, boxes[x["id"]][3] / S
        if x["type"] not in ("stair", "lift") and (w * h < x["min_area"] - 0.05 or min(w, h) < min(x["min_w"], max(w, h)) - 0.05):
            return None
    c = solver._candidate(rooms, boxes, rects, opens, sorted(missing), strat, env, r,
                          int(round(entry["step"] * sy * S)), entry["privacy"], "library", None, rng, engine="library")
    if solver.reachable(c["layout"]):
        return None
    # how close a fit: wanted rooms missing (store/puja count most), extra rooms removed, privacy, stretch
    c["fit"] = (sum(3 if x in ("store", "puja") else 1 for x in missing), len(gone), entry["privacy"] != brief.bedroom_privacy, sx * sy)
    return c


def plans(brief: Brief, strategies: List[Dict[str, Any]], rng: random.Random, k: int = 6) -> List[Dict[str, Any]]:
    """Up to k fitted library plans across the brief's strategies, closest fits first, at most 3 per strategy."""
    idx = index()
    if not idx:
        return []
    r = pack.rules(brief.plot_width_ft * pack.FT, brief.plot_depth_ft * pack.FT, brief.road_width_m, brief.city)
    out = []
    for strat in strategies:
        fitted = [c for c in (adapt(e, brief, strat, rng) for e in idx.get(key(brief, r, strat), [])) if c]
        out += sorted(fitted, key=lambda c: c["fit"])[:3]
    return sorted(out, key=lambda c: c["fit"][:2])[:k]
