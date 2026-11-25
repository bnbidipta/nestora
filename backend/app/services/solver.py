"""
Floor-plan solver (OR-Tools CP-SAT), merged with the rule-based generator:
the generator proposes the rooms and roughly where each goes (its arrangement and learned room order); the solver turns
that into a plan with hard guarantees, staying as close to the proposal as the guarantees allow.

Hard: rooms inside the floor's footprint, no overlaps, code minimum sizes and widths, proportions, every room reachable
(bedrooms open off a passage, lounge, living or dining; attached baths off their bedroom; kitchen off dining or living;
circulation chained to the stair), habitable rooms and kitchen on an outside wall, stair and lift stacked on every floor,
store and puja kept unless physically impossible, FSI cap. Upper floors may step back from the front, leaving a real terrace below.
Soft: fill the footprint, bathrooms over bathrooms, close to the generator's positions.
Grid: 20 cm; a final pass grows rooms into any gap the solver left. Coordinates: x along the road, y away from it (front = 0), metres in the output.
"""
import logging
import random
import threading
from typing import Any, Dict, List, Optional

from ortools.sat.python import cp_model

from backend.app.models.brief import Brief
from backend.app.services import generator, pack

log = logging.getLogger(__name__)
S = 5  # grid cells per metre (20 cm)
DOOR = 5  # shared wall needed for a door, 1.0 m
CIRC = ("passage", "lounge", "living", "dining", "entrance")
TIME_LIMIT_S = 3.0
KEEP = ("store", "puja")
# extra size caps (m2) for service rooms, so leftover space goes to the rooms people live in
CAP = {"living": 30.0, "lounge": 18.0, "toilet": 5.5, "entrance": 5.0, "puja": 3.5, "store": 4.5, "laundry": 4.5, "balcony": 9.0, "porch": 40.0}
GROWS = ("living", "dining", "kitchen", "lounge", "bedroom", "bedroom_master", "bedroom_elder", "study", "passage", "help")  # small rooms the old engine used to drop; the solver must find them a place


def _rect(m, W, D, y_min, rm):
    t = rm["type"]
    lo = max(1, int(round(rm["min_w"] * S)))
    x, y = m.NewIntVar(0, W, f"x_{rm['key']}"), m.NewIntVar(y_min, D, f"y_{rm['key']}")
    w, h = m.NewIntVar(lo, W, f"w_{rm['key']}"), m.NewIntVar(max(lo, int(round(rm.get("min_d", 0) * S))), D, f"h_{rm['key']}")
    m.Add(x + w <= W)
    m.Add(y + h <= D)
    area = m.NewIntVar(0, W * D, f"a_{rm['key']}")
    m.AddMultiplicationEquality(area, [w, h])
    m.Add(area >= int(rm["min_area"] * S * S))
    cap = generator.MAX_AREA.get(t) or CAP.get(t)
    if cap:
        m.Add(area <= int(cap * S * S))
    asp = generator.TYPES[t].get("aspect", generator.MAX_ASPECT.get(t, 2.2))
    if asp < 50:
        m.Add(10 * w <= int(asp * 10) * h)
        m.Add(10 * h <= int(asp * 10) * w)
    return {"x": x, "y": y, "w": w, "h": h, "area": area}


def _adjacent(m, a, b, door=DOOR):
    """A bool that, when true, forces rectangles a and b to share a wall long enough for a door."""
    sides = []
    for horiz in (False, True):
        for first, second in ((a, b), (b, a)):
            s = m.NewBoolVar("")
            if not horiz:  # side by side: first's right edge = second's left edge, overlapping in y
                m.Add(first["x"] + first["w"] == second["x"]).OnlyEnforceIf(s)
                m.Add(a["y"] + door <= b["y"] + b["h"]).OnlyEnforceIf(s)
                m.Add(b["y"] + door <= a["y"] + a["h"]).OnlyEnforceIf(s)
            else:  # one behind the other, overlapping in x
                m.Add(first["y"] + first["h"] == second["y"]).OnlyEnforceIf(s)
                m.Add(a["x"] + door <= b["x"] + b["w"]).OnlyEnforceIf(s)
                m.Add(b["x"] + door <= a["x"] + a["w"]).OnlyEnforceIf(s)
            sides.append(s)
    adj = m.NewBoolVar("")
    m.AddBoolOr(sides + [adj.Not()])
    return adj


def _needs(rm, floor_rooms):
    """Which rooms this one must open onto (any one of them)."""
    t, rid = rm["type"], rm["id"]
    of = lambda *types: [o for o in floor_rooms if o["type"] in types and o is not rm]
    if rid == "toilet_master":
        return of("bedroom_master")
    if rid == "toilet_elder":
        return of("bedroom_elder")
    if t in ("bedroom", "bedroom_master", "bedroom_elder", "study", "help", "puja", "store", "toilet", "lift"):
        return of(*CIRC)
    if t == "kitchen":
        return of("dining", "living")
    if t == "dining":
        return of("living", "passage", "lounge")
    if t == "laundry":
        return of("kitchen", *CIRC)
    if t == "balcony":
        return of(*CIRC, "bedroom", "bedroom_master")
    if t in ("passage", "lounge"):
        return of("stair", "living", "dining", "lounge", "passage")
    if t == "stair":
        return of(*CIRC)
    if t in ("porch", "entrance"):
        return of("living", "entrance", "passage")
    return []


_LOCK = threading.Lock()  # one solve at a time: CP-SAT models must not be built from parallel threads, and it bounds CPU


def solve(brief: Brief, strat: Dict[str, Any], rng: random.Random, hint: Optional[Dict[str, Any]] = None,
          step_m: Optional[float] = None, resize: Optional[Dict[str, tuple]] = None) -> Optional[Dict[str, Any]]:
    """Serialised entry point; None when busy for too long (callers fall back to the generator's layouts)."""
    if not _LOCK.acquire(timeout=30):
        log.warning("solver busy; skipped")
        return None
    try:
        return _solve(brief, strat, rng, hint, step_m, resize)
    finally:
        _LOCK.release()


def _solve(brief: Brief, strat: Dict[str, Any], rng: random.Random, hint: Optional[Dict[str, Any]] = None,
           step_m: Optional[float] = None, resize: Optional[Dict[str, tuple]] = None) -> Optional[Dict[str, Any]]:
    """A guaranteed plan for one strategy, near the generator candidate `hint` (its positions) when given.
    Floors are solved bottom-up: the stair/lift position is chosen on the first floor and fixed above, and each
    upper floor sees the wet rooms below it, so bathrooms can stack."""
    W_m, D_m = brief.plot_width_ft * pack.FT, brief.plot_depth_ft * pack.FT
    r = pack.rules(W_m, D_m, brief.road_width_m, brief.city)
    env = pack.envelope(W_m, D_m, r)
    W, D = int(env["width_m"] * S), int(env["depth_m"] * S)
    rooms = generator.program(brief, r, strat["floors"], strat["parking"], strat["stilt"])
    first_living = 1 if strat["stilt"] else 0
    step = int(S * (step_m if step_m is not None else rng.choice([0, 0, 1.5, 2.5])))
    stair_box = pack.stair_box(r)
    hint_pos = {rm["id"]: rm for rm in hint["layout"]["rooms"]} if hint else {}
    cap_left = int(W_m * D_m * r["fsi_max"] * S * S)
    core = {}  # type -> fixed (x, y, w, h) once placed
    boxes, dropped = {}, []
    zone_y = {"front": 0.15, "middle": 0.5, "rear": 0.85}

    for f in sorted({rm["floor"] for rm in rooms}):
        fr = [rm for rm in rooms if rm["floor"] == f]
        fy0 = step if f > first_living else 0
        m = cp_model.CpModel()
        vars_, present = {}, {}
        for rm in fr:
            rm["key"] = rm["id"]
            if rm["type"] in ("stair", "lift"):
                sw, sl = ((stair_box["width_m"], stair_box["length_m"]) if rm["type"] == "stair" else (generator.LIFT_M, generator.LIFT_M))
                w, h = int(round(sw * S)), int(round(sl * S))
                if rm["type"] in core:
                    x, y = (m.NewConstant(core[rm["type"]][0]), m.NewConstant(core[rm["type"]][1]))
                else:
                    x, y = m.NewIntVar(0, W - w, ""), m.NewIntVar(step, D - h, "")  # behind the upper-floor step: it rises through every floor
                v = {"x": x, "y": y, "w": m.NewConstant(w), "h": m.NewConstant(h), "area": m.NewConstant(w * h)}
            else:
                v = _rect(m, W, D, fy0, rm)
                lo_hi = (resize or {}).get(rm["id"])
                if lo_hi:  # an edit: this room's area must move into [lo, hi] m2
                    m.Add(v["area"] >= int(lo_hi[0] * S * S))
                    m.Add(v["area"] <= int(lo_hi[1] * S * S))
            vars_[rm["id"]] = v
            present[rm["id"]] = m.NewBoolVar("") if rm["prio"] >= 2 else m.NewConstant(1)  # essentials are never dropped
            h0 = hint_pos.get(rm["id"])
            if h0 and rm["type"] not in ("stair", "lift"):  # warm start from the generator's layout
                for k, val in (("x", h0["x"]), ("y", max(h0["y"] * S, fy0) / S), ("w", h0["w"]), ("h", h0["d"])):
                    m.AddHint(v[k], int(round(val * S)))

        xs, ys = [], []
        for rm in fr:
            v, p = vars_[rm["id"]], present[rm["id"]]
            ex, ey = m.NewIntVar(0, W, ""), m.NewIntVar(0, D, "")
            m.Add(ex == v["x"] + v["w"])
            m.Add(ey == v["y"] + v["h"])
            xs.append(m.NewOptionalIntervalVar(v["x"], v["w"], ex, p, ""))
            ys.append(m.NewOptionalIntervalVar(v["y"], v["h"], ey, p, ""))
        m.AddNoOverlap2D(xs, ys)

        for rm in fr:  # reachability, outside walls, main door
            v, p = vars_[rm["id"]], present[rm["id"]]
            need = _needs(rm, fr)
            if need:
                links = []
                for o in need:
                    a = _adjacent(m, v, vars_[o["id"]])
                    m.AddImplication(a, present[o["id"]])
                    links.append(a)
                m.AddBoolOr(links).OnlyEnforceIf(p)
            if rm["ext"] and rm["type"] not in ("stair", "lift"):
                e = [m.NewBoolVar("") for _ in range(4)]
                m.Add(v["x"] == 0).OnlyEnforceIf(e[0])
                m.Add(v["x"] + v["w"] == W).OnlyEnforceIf(e[1])
                m.Add(v["y"] == fy0).OnlyEnforceIf(e[2])
                m.Add(v["y"] + v["h"] == D).OnlyEnforceIf(e[3])
                m.AddBoolOr(e).OnlyEnforceIf(p)
            if rm["type"] in ("porch", "entrance") or (rm["type"] == "living" and f == first_living and not any(x["type"] == "entrance" for x in fr)):
                m.Add(v["y"] == 0).OnlyEnforceIf(p)

        # circulation is one connected tree rooted at the front door (ground) or the stair (upper floors):
        # each circulation room links to one strictly closer to the root, so there are no closed loops
        circ = [x for x in fr if x["type"] in CIRC or x["type"] in ("stair", "porch")]
        root = next((x for x in circ if x["type"] == "entrance"), None) or next((x for x in circ if x["type"] == "living"), None)             if f == first_living else next((x for x in circ if x["type"] == "stair"), None)
        if f < first_living:  # stilt floor: porch and the stair hall only
            root = next((x for x in circ if x["type"] == "entrance"), None) or next((x for x in circ if x["type"] == "stair"), None)
        if root:
            dist = {x["id"]: m.NewIntVar(0, len(circ), "") for x in circ}
            m.Add(dist[root["id"]] == 0)
            for x in circ:
                if x is root:
                    continue
                links = []
                for o in circ:
                    if o is x:
                        continue
                    e = m.NewBoolVar("")
                    m.AddImplication(e, present[o["id"]])
                    m.Add(dist[o["id"]] + 1 <= dist[x["id"]]).OnlyEnforceIf(e)
                    a = _adjacent(m, vars_[x["id"]], vars_[o["id"]])
                    m.AddImplication(e, a)
                    links.append(e)
                m.AddBoolOr(links).OnlyEnforceIf(present[x["id"]])

        eff = {}  # area that counts: zero for a room left out
        for x in fr:
            e = m.NewIntVar(0, W * D, "")
            m.Add(e == vars_[x["id"]]["area"]).OnlyEnforceIf(present[x["id"]])
            m.Add(e == 0).OnlyEnforceIf(present[x["id"]].Not())
            eff[x["id"]] = e
        built = [eff[x["id"]] for x in fr if x["type"] not in generator.NON_FSI and not (strat["stilt"] and f == 0 and x["type"] != "stair")]
        # leave enough FSI for the essential rooms of the floors above
        def need(x):
            if x["type"] == "stair":
                return stair_box["width_m"] * stair_box["length_m"]
            return generator.LIFT_M ** 2 if x["type"] == "lift" else x["min_area"]
        above = [x for x in rooms if x["floor"] > f]
        reserve = int(S * S * (1.15 * sum(need(x) for x in above if x["prio"] == 1 or x["type"] in ("stair", "lift", "toilet"))
                               + 6.0 * len({x["floor"] for x in above})))  # + a passage to reach them on each floor
        m.Add(sum(built) <= max(0, cap_left - reserve))

        terms = [2 * eff[rm["id"]] for rm in fr]  # fill the footprint
        below = [boxes[x["id"]] for x in rooms if x["floor"] == f - 1 and x.get("wet") and x["id"] in boxes]
        for t in (x for x in fr if x["type"] == "toilet"):  # bathrooms over bathrooms (or the kitchen)
            a, hits = vars_[t["id"]], []
            for bx, by, bw, bh in below:
                s = m.NewBoolVar("")
                m.Add(a["x"] + 3 <= bx + bw).OnlyEnforceIf(s)
                m.Add(a["x"] + a["w"] >= bx + 3).OnlyEnforceIf(s)
                m.Add(a["y"] + 3 <= by + bh).OnlyEnforceIf(s)
                m.Add(a["y"] + a["h"] >= by + 3).OnlyEnforceIf(s)
                hits.append(s)
            if hits:
                stacked = m.NewBoolVar("")
                m.AddBoolOr(hits + [stacked.Not()])
                terms.append(1500 * stacked)
        for rm in fr:  # near the generator's proposal, else near the zone
            if rm["type"] in ("stair", "lift"):
                continue
            h0, v = hint_pos.get(rm["id"]), vars_[rm["id"]]
            tg = [(2 * v["x"] + v["w"], int(S * (2 * h0["x"] + h0["w"]))), (2 * v["y"] + v["h"], int(S * (2 * h0["y"] + h0["d"])))] if h0 \
                else [(2 * v["y"] + v["h"], int(2 * D * zone_y[rm["zone"]]))]
            for c2, target in tg:
                dev = m.NewIntVar(0, 4 * max(W, D), "")
                m.AddAbsEquality(dev, c2 - target)
                terms.append(-6 * dev)
            if rm["prio"] >= 2:  # dropped only when it truly cannot fit: optional first, store/puja last
                terms.append((20000 if rm["type"] in KEEP else 6000 if rm["prio"] == 2 else 1500) * present[rm["id"]])
        m.Maximize(sum(terms))

        sol = cp_model.CpSolver()
        sol.parameters.max_time_in_seconds = TIME_LIMIT_S
        sol.parameters.num_workers = 8
        sol.parameters.random_seed = rng.randrange(1000)
        status = sol.Solve(m)
        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            log.info("solver: floor %s %s (FSI left %.1f m2, reserve %.1f m2)", f, sol.StatusName(status), cap_left / S / S, reserve / S / S)
            return None
        for rm in fr:
            if not sol.Value(present[rm["id"]]):
                dropped.append(rm["id"])
                continue
            boxes[rm["id"]] = [sol.Value(vars_[rm["id"]][k]) for k in ("x", "y", "w", "h")]
            if rm["type"] in ("stair", "lift"):
                core.setdefault(rm["type"], boxes[rm["id"]])
        used = sum(boxes[x["id"]][2] * boxes[x["id"]][3] for x in fr if x["id"] in boxes and x["type"] not in generator.NON_FSI)
        _grow(boxes, [rm for rm in fr if rm["id"] in boxes], W, D, step, first_living, budget=max(0, cap_left - reserve - used))
        cap_left -= sum(boxes[x["id"]][2] * boxes[x["id"]][3] for x in fr if x["id"] in boxes and x["type"] not in generator.NON_FSI
                        and not (strat["stilt"] and f == 0 and x["type"] != "stair"))

    placed = []
    for rm in rooms:
        if rm["id"] not in boxes:
            continue
        x, y, w, h = (val / S for val in boxes[rm["id"]])
        out = {k: val for k, val in rm.items() if k != "key"}
        fy0 = step / S if rm["floor"] > first_living else 0
        out.update(x=round(x, 3), y=round(y, 3), w=round(w, 3), d=round(h, 3),
                   exterior=x < 1e-3 or abs(y - fy0) < 1e-3 or abs(x + w - W / S) < 1e-3 or abs(y + h - D / S) < 1e-3)
        placed.append(out)
    stair = next((p for p in placed if p["type"] == "stair"), None)
    return {
        "id": f"s{rng.randrange(16**6):06x}", "strategy": strat, "arrangement": hint["arrangement"] if hint else "solver", "jitter": 0,
        "layout": {"rooms": placed, "dropped": dropped, "depths": {}, "stair_left": bool(stair and stair["x"] < env["width_m"] / 2),
                   "collapse": False, "stilt": strat["stilt"], "engine": "solver", "upper_step_m": step / S},
        "envelope": env, "rules": r, "floors": strat["floors"], "parent": hint["id"] if hint else None,
    }


def mirror(c: Dict[str, Any]) -> None:
    """Flip a layout left-right in place (every guarantee survives a reflection)."""
    W = c["envelope"]["width_m"]
    for rm in c["layout"]["rooms"]:
        rm["x"] = round(W - rm["x"] - rm["w"], 3)
    c["layout"]["stair_left"] = not c["layout"].get("stair_left", True)


def _grow(boxes, rooms, W, D, step, first_living, budget=10**9):
    """Extend rooms into empty space next to them (largest gain first) so the floor has no leftover holes,
    within the FSI area still allowed (budget, in grid cells)."""
    by_floor = {}
    for rm in rooms:
        if rm["id"] in boxes:
            by_floor.setdefault(rm["floor"], []).append(rm)
    for f, fr in by_floor.items():
        y0 = step if f > first_living else 0
        changed = True
        while changed:
            changed = False
            best = None
            for rm in fr:
                if rm["type"] not in GROWS:
                    continue
                x, y, w, h = boxes[rm["id"]]
                cap = (generator.MAX_AREA.get(rm["type"]) or 60) * S * S * 1.15
                others = [boxes[o["id"]] for o in fr if o is not rm]
                for side in ("l", "r", "t", "b"):
                    room_for = {"l": x, "r": W - x - w, "t": y - y0, "b": D - y - h}[side]
                    for o in others:
                        ox, oy, ow, oh = o
                        if side in ("l", "r") and oy < y + h and y < oy + oh:
                            room_for = min(room_for, x - (ox + ow) if side == "l" and ox + ow <= x else room_for,
                                           ox - (x + w) if side == "r" and ox >= x + w else room_for)
                        if side in ("t", "b") and ox < x + w and x < ox + ow:
                            room_for = min(room_for, y - (oy + oh) if side == "t" and oy + oh <= y else room_for,
                                           oy - (y + h) if side == "b" and oy >= y + h else room_for)
                    if room_for <= 0:
                        continue
                    nw, nh = (w + room_for, h) if side in ("l", "r") else (w, h + room_for)
                    if (max(nw, nh) > 2.6 * min(nw, nh) or nw * nh > cap) and rm["type"] != "passage":
                        continue
                    gain = room_for * (h if side in ("l", "r") else w)
                    if gain > budget:
                        continue
                    if not best or gain > best[0]:
                        best = (gain, rm["id"], side, room_for)
            if best:
                _, rid, side, d = best
                x, y, w, h = boxes[rid]
                boxes[rid] = {"l": [x - d, y, w + d, h], "r": [x, y, w + d, h], "t": [x, y - d, w, h + d], "b": [x, y, w, h + d]}[side]
                budget -= best[0]
                changed = True


def reachable(layout: Dict[str, Any], door=0.9) -> List[str]:
    """Independent check: rooms not reachable from the front door / stair by doors through circulation rooms."""
    rooms = layout["rooms"]
    def touch(a, b):
        if a["floor"] != b["floor"]:
            return False
        ox = min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"])
        oy = min(a["y"] + a["d"], b["y"] + b["d"]) - max(a["y"], b["y"])
        return (abs(ox) < 1e-3 and oy >= door - 1e-3) or (abs(oy) < 1e-3 and ox >= door - 1e-3)
    passable = set(CIRC) | {"stair", "porch"}
    start = [rm for rm in rooms if rm["type"] in ("porch", "entrance", "living") and rm["y"] < 1e-3 and rm["floor"] == min(r["floor"] for r in rooms)]
    seen = {id(x) for x in start}
    todo = list(start)
    stairs = [rm for rm in rooms if rm["type"] == "stair"]
    while todo:
        a = todo.pop()
        nxt = [b for b in rooms if id(b) not in seen and touch(a, b)]
        if a["type"] == "stair":
            nxt += [s for s in stairs if id(s) not in seen]
        for b in nxt:
            seen.add(id(b))
            if b["type"] in passable or b["type"].startswith("bedroom"):  # attached baths and balconies open off bedrooms
                todo.append(b)
    return [rm["id"] for rm in rooms if id(rm) not in seen and rm["type"] not in ("utility",)]


if __name__ == "__main__":  # self-check: a 40x60 G+1 family brief solves with every guarantee
    import time
    b = Brief(plot_width_ft=40, plot_depth_ft=60, floors_wanted=2, couples=1, elder_couples=1, kids=2, store_room=True, puja="nook",
              styles=["indian_contemporary"])
    rng = random.Random(3)
    st = generator.strategies(b, pack.rules(40 * pack.FT, 60 * pack.FT, b.road_width_m, b.city))[0]
    t0 = time.time()
    c = solve(b, st, rng, step_m=1.5)
    assert c, "no solution"
    ids = {x["id"] for x in c["layout"]["rooms"]}
    assert {"store", "puja"} <= ids, c["layout"]["dropped"]
    assert not reachable(c["layout"]), reachable(c["layout"])
    print(f"{time.time() - t0:.1f}s", len(ids), "rooms; dropped", c["layout"]["dropped"])
    for x in sorted(c["layout"]["rooms"], key=lambda x: (x["floor"], x["y"], x["x"])):
        print(x["floor"], f"{x['id']:16s}", x["x"], x["y"], x["w"], x["d"])
