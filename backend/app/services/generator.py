"""
Layout generator (Generator A): brief -> room program -> fitted floor plans.

Every floor is cut into up to three full-width rows (front, middle, rear). Row depths are the same on
every floor, so the stair (always at one end of the middle row) and the wet core stack. Inside a row,
rooms sit side by side; each gets at least its code-minimum width/area, and spare width is shared by
weight. Rooms therefore tile the buildable envelope exactly, so overlap and out-of-bounds are impossible
by construction; the Judge still re-checks everything from geometry.

ponytail: row-slicing fitter, not CP-SAT. Can't produce L-shaped rooms or courtyards; swap in OR-Tools
when templates need non-rectangular adjacency.

Variation comes from: arrangement templates (zone per room type), mirroring, row-depth jitter, and
parking strategy. Units are metres internally.
"""
import copy
import json
import math
import os
import random
from functools import cache
from typing import Any, Dict, List, Optional

from backend.app.models.brief import Brief
from backend.app.services import pack

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "templates", "draft")
ZONES = ("front", "middle", "rear")

# min_w = smallest allowed side; weight = share of spare space; prio 1 essential .. 3 optional
TYPES: Dict[str, Dict[str, Any]] = {
    "porch":          {"zone": "front",  "min_w": 2.7, "min_d": 5.0, "weight": 0.0, "hab": False, "ext": True},
    "entrance":       {"zone": "front",  "min_w": 1.2, "area": 2.5, "weight": 0.3, "hab": False, "ext": True},
    "living":         {"zone": "front",  "min_w": 2.7, "area": "hab", "weight": 3.0, "hab": True, "ext": True},
    "dining":         {"zone": "middle", "min_w": 2.4, "area": 6.0, "weight": 1.2, "hab": False, "ext": False},
    "kitchen":        {"zone": "rear",   "min_w": 1.8, "area": "kitchen", "weight": 1.4, "hab": False, "ext": True, "wet": True},
    "bedroom_master": {"zone": "rear",   "min_w": 2.7, "area": "hab", "weight": 2.4, "hab": True, "ext": True},
    "bedroom_elder":  {"zone": "rear",   "min_w": 2.7, "area": "hab", "weight": 2.2, "hab": True, "ext": True},
    "bedroom":        {"zone": "front",  "min_w": 2.4, "area": "hab", "weight": 2.0, "hab": True, "ext": True},
    "study":          {"zone": "front",  "min_w": 2.1, "area": 6.0, "weight": 0.9, "hab": True, "ext": True},
    "lounge":         {"zone": "front",  "min_w": 2.4, "area": "hab", "weight": 1.4, "hab": True, "ext": True},
    "toilet":         {"zone": "middle", "min_w": 1.2, "area": "toilet", "weight": 0.5, "hab": False, "ext": False, "wet": True},
    "puja":           {"zone": "middle", "min_w": 1.0, "area": 1.2, "weight": 0.25, "hab": False, "ext": False},
    "balcony":        {"zone": "front",  "min_w": 1.2, "area": 2.4, "weight": 0.5, "hab": False, "ext": True},
    "stair":          {"zone": "middle", "hab": False, "ext": False},
    "lift":           {"zone": "middle", "hab": False, "ext": False},
    "passage":        {"zone": "middle", "min_w": 1.0, "area": 2.0, "weight": 0.3, "hab": False, "ext": False, "aspect": 8},
    "help":           {"zone": "rear",   "min_w": 2.1, "area": 6.0, "weight": 0.5, "hab": True, "ext": True},
    "laundry":        {"zone": "rear",   "min_w": 1.2, "area": 2.5, "weight": 0.3, "hab": False, "ext": True, "wet": True},
    "store":          {"zone": "middle", "min_w": 1.2, "area": 2.0, "weight": 0.2, "hab": False, "ext": False},
    "utility":        {"zone": "middle", "min_w": 0.9, "area": 0.0, "weight": 0.0, "hab": False, "ext": False, "aspect": 99},
}
LIFT_M = 1.6
MAX_ASPECT = {"porch": 3.0, "kitchen": 3.0, "toilet": 2.6, "balcony": 6.0, "dining": 2.6}
MAX_AREA = {"laundry": 5.0, "store": 5.0, "help": 9.0, "toilet": 6.0, "puja": 5.0, "passage": 12.0, "kitchen": 16.0, "entrance": 8.0, "dining": 18.0,
            "balcony": 9.0, "study": 12.0, "porch": 18.0}
NON_FSI = ("porch",)  # open parking: non-FSI per DCPR 2034 Reg. 31(1) (unverified)
TEMPLATE_TYPE_MAP = {"entrance": "porch", "family_lounge": "lounge", "store": None, "courtyard": None}


def _min_area(t: str, r: Dict[str, Any]) -> float:
    a = TYPES[t].get("area", 0)
    return {"hab": r["habitable_min_m2"], "kitchen": r["kitchen_min_m2"], "toilet": r["toilet_min_m2"]}.get(a, a)


def _room(rid: str, t: str, floor: int, prio: int, r: Dict[str, Any]) -> Dict[str, Any]:
    spec = TYPES[t]
    return {"id": rid, "type": t, "floor": floor, "prio": prio, "zone": spec["zone"],
            "min_w": spec.get("min_w", 0), "min_d": spec.get("min_d", 0), "min_area": _min_area(t, r),
            "weight": spec.get("weight", 0), "hab": spec["hab"], "ext": spec["ext"], "wet": spec.get("wet", False)}


@cache
def arrangements() -> List[Dict[str, Any]]:
    """Zone per room type, taken from the authored templates (draft). First entry is the default."""
    out = [{"id": "default", "zones": {}}]
    for f in sorted(os.listdir(TEMPLATE_DIR)):
        with open(os.path.join(TEMPLATE_DIR, f), encoding="utf-8") as fh:
            t = json.load(fh)
        zones: Dict[str, str] = {}
        for room in t["rooms"]:
            typ = TEMPLATE_TYPE_MAP.get(room["type"], room["type"])
            if typ in TYPES and typ not in zones and room.get("zone") in ZONES:
                zones[typ] = room["zone"]
        out.append({"id": t["id"], "zones": zones})
    return out


# ---------------------------------------------------------------------------------------------
# Program: which rooms on which floor
# ---------------------------------------------------------------------------------------------
def program(brief: Brief, r: Dict[str, Any], floors: int, parking: str, stilt: bool) -> List[Dict[str, Any]]:
    rooms: List[Dict[str, Any]] = []
    add = lambda rid, t, f, p: rooms.append(_room(rid, t, f, p, r))
    g = 1 if stilt else 0  # first living floor
    if stilt:
        add("porch", "porch", 0, 1)
        add("entrance", "entrance", 0, 1)
    elif parking == "car":
        add("porch", "porch", 0, 1)
        rooms[-1]["min_w"] = 2.7 * brief.cars
    else:
        add("entrance", "entrance", 0, 3)  # optional: the main door can open straight into the living room
    if floors > 1:
        for f in range(floors):
            add(f"stair_{f}", "stair", f, 1)
            if brief.lift != "none":
                add(f"lift_{f}", "lift", f, 1)

    living_floors = list(range(g, floors))
    rental = brief.rental_floor and len(living_floors) >= 2
    family_floors = living_floors[:-1] if rental else living_floors

    add("living", "living", g, 1)
    add("kitchen", "kitchen", g, 1)
    add("toilet_common", "toilet", g, 2 if brief.elders else 1)  # the elder's toilet can double as common
    if brief.kitchen == "closed":
        add("dining", "dining", g, 3 if brief.dining_seats <= 4 else 2)
        rooms[-1]["min_area"] = {2: 4.5, 4: 6.0, 6: 8.0, 8: 10.5}.get(min(8, brief.dining_seats - brief.dining_seats % 2), 12.0)
    else:  # open kitchen: the living room absorbs dining
        next(x for x in rooms if x["id"] == "living")["weight"] += 1.2
    if brief.laundry:
        add("laundry", "laundry", g, 2)
    if brief.store_room:
        add("store", "store", g, 3)
    if brief.help_room:
        add("help_room", "help", g, 2)
    if brief.puja != "none":
        add("puja", "puja", g, 2 if brief.puja == "room" else 3)
    if brief.elders:
        add("bedroom_elder", "bedroom_elder", g, 1)
        add("toilet_elder", "toilet", g, 1)

    beds = brief.bedrooms_needed - (1 if brief.elders else 0)
    upper = family_floors[1:] or family_floors
    for i in range(beds):
        f = upper[i % len(upper)]
        if i == 0:
            add("bedroom_master", "bedroom_master", f, 1)
            add("toilet_master", "toilet", f, 1)
        else:
            add(f"bedroom_{i + 1}", "bedroom", f, 1 if i < 2 else 2)
    if brief.master_dressing:
        m = next((x for x in rooms if x["id"] == "bedroom_master"), None)
        if m:
            m["min_area"] += 3.0
    if brief.guest_room:
        add("bedroom_guest", "bedroom", g if not brief.elders else upper[0], 2)
    for f in upper:
        if f != g and not any(x["floor"] == f and x["type"] == "toilet" and x["id"] != "toilet_master" for x in rooms):
            add(f"toilet_{f}", "toilet", f, 2)
        if f != g:
            add(f"lounge_{f}", "lounge", f, 3)
            add(f"balcony_{f}", "balcony", f, 3)
    if brief.wfh_people:
        add("study", "study", upper[-1], 2)
    if rental:
        f = living_floors[-1]
        add("rental_living", "living", f, 1)
        add("rental_kitchen", "kitchen", f, 1)
        add("rental_bedroom", "bedroom", f, 1)
        add("rental_toilet", "toilet", f, 1)
    for f in range(floors):
        if any(x["floor"] == f for x in rooms) and floors > 1:
            add(f"passage_{f}", "passage", f, 2)
    return rooms


# ---------------------------------------------------------------------------------------------
# Fitting
# ---------------------------------------------------------------------------------------------
def _aspect(room: Dict[str, Any]) -> float:
    return TYPES[room["type"]].get("aspect", MAX_ASPECT.get(room["type"], 2.2))


def _bounds(room: Dict[str, Any], depth: float, stair: Dict[str, float]) -> Optional[tuple]:
    """(narrowest, widest) width for this room in a row of this depth, or None if the depth doesn't work."""
    if room["type"] == "stair":
        return (stair["width_m"], stair["width_m"]) if depth >= stair["length_m"] - 1e-6 else None
    if room["type"] == "lift":  # 1.6 m square core (car + wall), stacked beside the stair
        return (LIFT_M, LIFT_M) if depth >= LIFT_M - 1e-6 else None
    if depth < max(room["min_d"], room["min_w"]) - 1e-6:
        return None
    a = _aspect(room)
    lo = max(room["min_w"], room["min_area"] / depth, depth / a)
    hi = min(a * depth, MAX_AREA.get(room["type"], 1e9) / depth)
    return (lo, hi) if lo <= hi + 1e-6 else None


def _fit_row(rooms: List[Dict[str, Any]], width: float, depth: float, stair: Dict[str, float],
             stair_left: bool, y: float, last_row: bool = False) -> Optional[List[Dict[str, Any]]]:
    rooms = list(rooms)
    bounds = [_bounds(rm, depth, stair) for rm in rooms]
    if any(b is None for b in bounds) or sum(b[0] for b in bounds) > width + 1e-6:
        return None
    widths = [b[0] for b in bounds]
    spare = width - sum(widths)
    # water-fill spare width by weight, respecting each room's aspect cap
    for _ in range(len(rooms) + 1):
        open_i = [i for i, rm in enumerate(rooms) if rm["weight"] > 0 and widths[i] < bounds[i][1] - 1e-6]
        if spare <= 1e-6 or not open_i:
            break
        tw = sum(rooms[i]["weight"] for i in open_i)
        given = 0.0
        for i in open_i:
            add = min(spare * rooms[i]["weight"] / tw, bounds[i][1] - widths[i])
            widths[i] += add
            given += add
        spare -= given
    if spare > 0.9:  # leftover becomes a store/utility bay rather than stretching rooms
        rooms.append({"id": f"utility_{rooms[0]['floor']}_{rooms[0]['zone']}", "type": "utility", "floor": rooms[0]["floor"],
                      "prio": 3, "zone": rooms[0]["zone"], "min_w": 0.9, "min_d": 0, "min_area": 0, "weight": 0,
                      "hab": False, "ext": False, "wet": False})
        widths.append(spare)
    elif spare > 1e-6:
        flex = [i for i, rm in enumerate(rooms) if rm["type"] not in ("stair", "lift")]
        if not flex:
            return None
        widths[max(flex, key=lambda i: widths[i])] += spare
    # Order: stair at its end, rooms needing an outside wall at the row ends, interior-ok rooms between.
    idx = range(len(rooms))
    stair_i = [i for i in idx if rooms[i]["type"] == "stair"] + [i for i in idx if rooms[i]["type"] == "lift"]
    core = ("stair", "lift")
    ext = [i for i in idx if rooms[i]["ext"] and rooms[i]["type"] not in core]
    inner = [i for i in idx if not rooms[i]["ext"] and rooms[i]["type"] not in core]
    seq = stair_i + ([ext[0]] if ext and not stair_i else []) + inner + ext[(0 if stair_i else 1):]
    if not stair_left:
        seq = seq[::-1]
    # Front/rear rows without a stair touch an outer wall everywhere, so order is free: honour side preferences
    # (absolute left/centre/right as seen from the road), e.g. a tradition wanting the kitchen on one side.
    if not stair_i and rooms[0]["zone"] != "middle" and any(rooms[i].get("side") for i in idx):
        rank = {"left": 0, "centre": 1, "right": 2}
        seq = sorted(seq, key=lambda i: rank.get(rooms[i].get("side"), 1))
    out, x = [], 0.0
    for i in seq:
        out.append(dict(rooms[i], x=round(x, 3), y=round(y, 3), w=round(widths[i], 3), d=round(depth, 3)))
        x += widths[i]
    return out


def _exterior(rm: Dict[str, Any], W: float, D: float) -> bool:
    e = 1e-3
    return rm["x"] < e or rm["y"] < e or abs(rm["x"] + rm["w"] - W) < e or abs(rm["y"] + rm["d"] - D) < e


def _zone(rm: Dict[str, Any], zones: Dict[str, str], collapse: bool) -> str:
    z = rm["zone"] if rm["type"] in ("stair", "lift", "porch") else zones.get(rm["type"], rm["zone"])
    return "front" if collapse and z == "rear" else z


def fit(rooms: List[Dict[str, Any]], env: Dict[str, float], r: Dict[str, Any], depths: Dict[str, float],
        zones: Dict[str, str], stair_left: bool, collapse: bool = False, sides: Optional[Dict[str, str]] = None) -> Optional[Dict[str, Any]]:
    """Places rooms floor by floor. Moves rooms between rows, then drops optional rooms, until rows fit."""
    W, D = env["width_m"], env["depth_m"]
    stair = pack.stair_box(r)
    y0 = {"front": 0.0, "middle": depths["front"], "rear": depths["front"] + depths["middle"]}
    live = [z for z in ZONES if depths[z] > 0]
    placed: List[Dict[str, Any]] = []
    dropped: List[str] = []
    for f in sorted({rm["floor"] for rm in rooms}):
        rows = {z: [] for z in ZONES}
        for rm in (x for x in rooms if x["floor"] == f):
            z = _zone(rm, zones, collapse)
            if z not in live:
                z = live[-1]
            rows[z].append(dict(rm, zone=z, side=(sides or {}).get(rm["type"], rm.get("side"))))
        fits = lambda z: _fit_row(rows[z], W, depths[z], stair, stair_left, y0[z]) is not None
        moved_once: set = set()  # each room moves at most once, so rooms can't ping-pong between rows
        for _ in range(60):
            bad = next((z for z in ZONES if rows[z] and not fits(z)), None)
            # with a rear row, the middle row has outside walls only at its ends (one if the stair takes an end)
            ext_only = False
            if bad is None and depths["rear"] > 0:
                n_ext = sum(1 for x in rows["middle"] if x["ext"])
                if n_ext > (1 if any(x["type"] == "stair" for x in rows["middle"]) else 2):
                    bad, ext_only = "middle", True
            if bad is None:
                break
            movable = sorted((x for x in rows[bad] if x["type"] not in ("stair", "lift", "porch") and x["id"] not in moved_once),
                             key=lambda x: (-x["prio"], x["weight"]))
            if ext_only:
                movable = [x for x in movable if x["ext"]]
            moved = False
            for rm in movable:
                for z in sorted(live, key=lambda z: abs(ZONES.index(z) - ZONES.index(bad))):
                    if z == bad:
                        continue
                    trial = rows[z] + [dict(rm, zone=z)]
                    if _fit_row(trial, W, depths[z], stair, stair_left, y0[z]) is not None:
                        rows[bad].remove(rm)
                        rows[z] = trial
                        moved_once.add(rm["id"])
                        moved = True
                        break
                if moved:
                    break
            if moved:
                continue
            ok = lambda x: x["prio"] >= 2 and x["type"] not in ("stair", "lift", "porch")
            opt = [(bad, x) for x in rows[bad] if ok(x) and (x["ext"] or not ext_only)]
            if not opt:  # free space elsewhere on this floor so a room from the stuck row can move there
                opt = [(z, x) for z in ZONES for x in rows[z] if ok(x)]
            if not opt:
                return None
            vz, victim = max(opt, key=lambda zx: (zx[1]["prio"], -zx[1]["weight"]))
            rows[vz].remove(victim)
            moved_once.clear()
            dropped.append(victim["id"])
        else:
            return None
        for z in ZONES:
            if rows[z]:
                placed += _fit_row(rows[z], W, depths[z], stair, stair_left, y0[z])
    for rm in placed:
        rm["exterior"] = _exterior(rm, W, D)
    return {"rooms": placed, "dropped": dropped, "depths": depths, "stair_left": stair_left, "collapse": collapse}


def _row_depths(rooms: List[Dict[str, Any]], env: Dict[str, float], r: Dict[str, Any], zones: Dict[str, str],
                rng: random.Random, jitter: float, collapse: bool) -> Optional[Dict[str, float]]:
    """Row depths from the busiest floor's demand per zone, respecting stair and porch minimums."""
    D = env["depth_m"]
    stair = pack.stair_box(r)
    demand = {z: 0.0 for z in ZONES}
    for f in {rm["floor"] for rm in rooms}:
        per = {z: 0.0 for z in ZONES}
        for rm in (x for x in rooms if x["floor"] == f):
            area = (stair["width_m"] * stair["length_m"] if rm["type"] == "stair" else LIFT_M * LIFT_M if rm["type"] == "lift"
                    else rm["min_area"] + rm["weight"] * 3.0)
            per[_zone(rm, zones, collapse)] += area
        for z in ZONES:
            demand[z] = max(demand[z], per[z])
    floor_min = {z: (2.4 if demand[z] > 0 else 0.0) for z in ZONES}
    if any(x["type"] == "stair" for x in rooms):
        floor_min["middle"] = max(floor_min["middle"], stair["length_m"])
    if any(x["type"] == "porch" for x in rooms):
        floor_min["front"] = max(floor_min["front"], TYPES["porch"]["min_d"])
    if sum(floor_min.values()) > D + 1e-6:
        return None
    tot = sum(demand.values()) or 1.0
    depths = {z: max(D * demand[z] / tot * (1 + rng.uniform(-jitter, jitter)), floor_min[z]) if demand[z] > 0 else 0.0 for z in ZONES}
    over = sum(depths.values()) - D
    live = [z for z in ZONES if depths[z] > 0]
    if over > 0:
        free = {z: depths[z] - floor_min[z] for z in live}
        fsum = sum(free.values())
        if fsum < over - 1e-6:
            return None
        for z in live:
            depths[z] -= over * free[z] / fsum if fsum else 0
    else:
        for z in live:
            depths[z] += -over / len(live)
    return {z: round(v, 3) for z, v in depths.items()}


def built_up_m2(layout: Dict[str, Any]) -> float:
    """Built-up area for FSI: every room except open/stilt parking (rooms tile their rows exactly)."""
    return sum(rm["w"] * rm["d"] for rm in layout["rooms"] if rm["type"] not in NON_FSI
               and not (layout.get("stilt") and rm["floor"] == 0 and rm["type"] != "stair"))


# ---------------------------------------------------------------------------------------------
# Candidates
# ---------------------------------------------------------------------------------------------
def strategies(brief: Brief, r: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Parking/floor strategies to try, closest to the brief first."""
    max_floors = max(1, int(r["max_height_m"] // pack.FLOOR_HEIGHT_M))
    want = min(brief.floors_wanted, max_floors)
    out = [{"floors": want, "parking": brief.parking, "stilt": False}]
    if brief.parking == "car":
        if want + 1 <= max_floors and not brief.elders:
            out.append({"floors": want + 1, "parking": "car", "stilt": True})
        out.append({"floors": want, "parking": "two_wheeler", "stilt": False})
    park = out[-1]["parking"]
    if want < max_floors:
        out.append({"floors": want + 1, "parking": park, "stilt": False})
    if want > 1:
        out.append({"floors": want - 1, "parking": park, "stilt": False})
    return out


def make_candidate(brief: Brief, rng: random.Random, strategy: Dict[str, Any], arrangement: Dict[str, Any],
                   jitter: float = 0.15, mirror: Optional[bool] = None) -> Optional[Dict[str, Any]]:
    W_m, D_m = brief.plot_width_ft * pack.FT, brief.plot_depth_ft * pack.FT
    r = pack.rules(W_m, D_m, brief.road_width_m, brief.city)
    env = pack.envelope(W_m, D_m, r)
    if env["width_m"] < 3 or env["depth_m"] < 3:
        return None
    rooms = program(brief, r, strategy["floors"], strategy["parking"], strategy["stilt"])
    stair_left = rng.random() < 0.5 if mirror is None else mirror
    cap = W_m * D_m * r["fsi_max"]
    for collapse in (False, True):
        depths = _row_depths(rooms, env, r, arrangement["zones"], rng, jitter, collapse)
        if depths is None:
            continue
        # Fit; while over the FSI cap, drop the largest optional top-floor room and refit (it becomes terrace).
        prog = list(rooms)
        while True:
            layout = fit(prog, env, r, depths, arrangement["zones"], stair_left, collapse, arrangement.get("sides"))
            if layout is None:
                break
            layout["stilt"] = strategy["stilt"]
            if built_up_m2(layout) <= cap + 1e-6:
                layout["dropped"] = sorted(set(layout["dropped"]) | {x["id"] for x in rooms if x not in prog})
                return {
                    "id": f"c{rng.randrange(16**6):06x}",
                    "strategy": strategy,
                    "arrangement": arrangement["id"],
                    "jitter": jitter,
                    "layout": layout,
                    "envelope": env,
                    "rules": r,
                    "floors": strategy["floors"],
                }
            top = max(x["floor"] for x in prog)
            opt = [x for x in prog if x["floor"] == top and x["prio"] >= 2 and x["type"] not in ("stair", "lift")]
            if not opt:
                break
            prog.remove(max(opt, key=lambda x: (x["prio"], x["min_area"] + x["weight"])))
    return None


def candidates(brief: Brief, n: int = 24, seed: int = 0, extra_arrangements: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    """A diverse pool: every strategy x arrangement x mirror, with jitter, deduplicated by geometry."""
    rng = random.Random(seed)
    pool, seen = [], set()
    arr = (extra_arrangements or []) + arrangements()
    for strat in strategies(brief, pack.rules(brief.plot_width_ft * pack.FT, brief.plot_depth_ft * pack.FT, brief.road_width_m, brief.city)):
        for a in arr:
            for mirror in (True, False):
                c = make_candidate(brief, rng, strat, a, jitter=0.15, mirror=mirror)
                if c is None:
                    continue
                key = signature(c)
                if key in seen:
                    continue
                seen.add(key)
                pool.append(c)
                if len(pool) >= n * 3:
                    return pool
    return pool


def signature(c: Dict[str, Any]) -> tuple:
    return tuple(sorted((rm["id"], rm["floor"], round(rm["x"], 1), round(rm["y"], 1), round(rm["w"], 1)) for rm in c["layout"]["rooms"]))


def mutate(brief: Brief, parent: Dict[str, Any], rng: random.Random) -> Optional[Dict[str, Any]]:
    """A neighbour of a kept candidate: same strategy, nearby arrangement/row split, maybe mirrored."""
    arr = arrangements()
    a = next((x for x in arr if x["id"] == parent["arrangement"]), arr[0])
    if rng.random() < 0.4:
        a = rng.choice(arr)
    for _ in range(6):
        c = make_candidate(brief, rng, parent["strategy"], a, jitter=0.25,
                           mirror=parent["layout"]["stair_left"] if rng.random() < 0.7 else None)
        if c and signature(c) != signature(parent):
            c["parent"] = parent["id"]
            return c
    return None


def compass(rm: Dict[str, Any], env: Dict[str, float], facing: str) -> str:
    """8-way compass sector (or CENTRE) of a room's centre. Facing = direction the road side faces."""
    vec = {"N": (0, 1), "E": (1, 0), "S": (0, -1), "W": (-1, 0)}[facing]
    into = (-vec[0], -vec[1])
    right = (into[1], -into[0])
    dx = rm["x"] + rm["w"] / 2 - env["width_m"] / 2
    dy = rm["y"] + rm["d"] / 2 - env["depth_m"] / 2
    if abs(dx) < env["width_m"] / 6 and abs(dy) < env["depth_m"] / 6:
        return "CENTRE"
    wx = right[0] * dx + into[0] * dy
    wy = right[1] * dx + into[1] * dy
    ang = (math.degrees(math.atan2(wx, wy)) + 360) % 360  # 0 = north, clockwise
    return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][int(((ang + 22.5) % 360) // 45)]


def copy_candidate(c: Dict[str, Any]) -> Dict[str, Any]:
    return copy.deepcopy(c)
