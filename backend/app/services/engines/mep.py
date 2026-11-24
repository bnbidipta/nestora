"""
MEP layout (diagrammatic): fixtures per room, pipe and wiring runs that follow walls, and the site services.
- Drainage: soil/waste stacks where wet rooms cluster; each WC, basin, floor trap and sink drains along the walls to its
  stack (110 mm soil at 1:60, 75 mm waste at 1:80); stacks fall to inspection chambers outside the house, which run
  to the municipal sewer at the road.
- Water: underground sump at the road side, pumped up the stair shaft to the overhead tank on the roof; 25 mm
  down-take, 20 mm branches to every tap, 15 mm hot lines from each bathroom geyser.
- Electrical: meter at the boundary, distribution board by the entrance, a circuit to each room's switchboard
  beside its door, then lights, fans, sockets and AC points per room type (IS 732 / NBC Part 8 practice, unverified).
Plan feet, x along the road, y from the front of the building.
ponytail: routes are wall-following polylines, not a clash-checked services drawing; shows intent, not shop drawings.
"""
import math
from typing import Any, Dict, List, Optional, Tuple

from backend.app.models.twin import HouseTwin, Room

P = Tuple[float, float]
WET = ("toilet", "kitchen", "laundry", "utility")
FAN_ROOMS = ("living", "lounge", "dining", "bedroom", "bedroom_master", "bedroom_elder", "study", "help")
AC_ROOMS = ("bedroom", "bedroom_master", "bedroom_elder", "living")
IN = 0.6  # services run this far inside the walls (ft)


def _r(p: P) -> List[float]:
    return [round(p[0], 2), round(p[1], 2)]


def _wall_point(r: Room, side: str, t: float) -> P:
    """Point just inside wall `side` of room r, t in 0..1 along it."""
    x0, y0, x1, y1 = r.x + IN, r.y + IN, r.x + r.length_ft - IN, r.y + r.width_ft - IN
    return {"front": (x0 + (x1 - x0) * t, y0), "rear": (x0 + (x1 - x0) * t, y1),
            "left": (x0, y0 + (y1 - y0) * t), "right": (x1, y0 + (y1 - y0) * t)}[side]


def _nearest_side(r: Room, p: P) -> str:
    d = {"front": abs(p[1] - r.y), "rear": abs(r.y + r.width_ft - p[1]), "left": abs(p[0] - r.x), "right": abs(r.x + r.length_ft - p[0])}
    return min(d, key=d.get)


def _route(a: P, b: P, horizontal_first: bool) -> List[List[float]]:
    mid = (b[0], a[1]) if horizontal_first else (a[0], b[1])
    return [_r(a), _r(mid), _r(b)]


def _along_wall(r: Room, a: P, b: P) -> List[List[float]]:
    """From a fixture to b: first to the nearest wall, then along that wall's line, then across to b."""
    side = _nearest_side(r, a)
    w = (a[0], r.y + IN) if side == "front" else (a[0], r.y + r.width_ft - IN) if side == "rear" else \
        (r.x + IN, a[1]) if side == "left" else (r.x + r.length_ft - IN, a[1])
    along_x = side in ("front", "rear")
    rest = _route(w, b, horizontal_first=along_x)
    return [_r(a)] + rest


def _door_side(twin: HouseTwin, r: Room) -> str:
    f = (twin.furniture or {}).get("rooms", {}).get(r.name, {}) if isinstance(twin.furniture, dict) else {}
    return f.get("door_wall") or "front"


def _fixtures(twin: HouseTwin, r: Room) -> List[Dict[str, Any]]:
    t = r.type or ""
    out: List[Dict[str, Any]] = []
    add = lambda kind, p, label=None: out.append({"kind": kind, "x": round(p[0], 2), "y": round(p[1], 2), "room": r.name, "label": label})
    cx, cy = r.x + r.length_ft / 2, r.y + r.width_ft / 2
    if t == "toilet":
        add("wc", _wall_point(r, "rear", 0.25))
        add("basin", _wall_point(r, "left", 0.7))
        add("floor_trap", (cx + 0.4, cy - 0.4))
        add("tap", _wall_point(r, "right", 0.6), "shower")
        add("geyser", _wall_point(r, "right", 0.85))
    elif t == "kitchen":
        add("sink", _wall_point(r, "rear", 0.6))
        add("tap", _wall_point(r, "rear", 0.75), "sink")
        add("tap", _wall_point(r, "rear", 0.9), "RO")
        add("floor_trap", (cx, r.y + IN + 1.0))
    elif t in ("laundry", "utility"):
        add("tap", _wall_point(r, "rear", 0.3), "washing machine")
        add("floor_trap", (cx, cy))
    # electrical, every room except open/parking areas
    if t not in ("passage", "porch", "balcony"):
        ds = _door_side(twin, r)
        add("switchboard", _wall_point(r, ds, 0.15))
        if r.length_ft * r.width_ft > 25:
            add("light", (cx, cy))
        if t in FAN_ROOMS:
            add("fan", (cx + min(1.5, r.length_ft / 5), cy))
        sockets = 1 if t in ("toilet", "stair", "lift", "store", "puja", "entrance") else 4 if t == "kitchen" else 2 if r.length_ft * r.width_ft < 100 else 3
        for i in range(sockets if t not in ("stair", "lift") else 0):
            side = ["left", "right", "rear", "front"][i % 4]
            add("socket", _wall_point(r, side, 0.5))
        if t in AC_ROOMS:
            add("ac", _wall_point(r, "rear", 0.5))
    elif t in ("passage", "balcony", "porch"):
        add("light", (cx, cy))
    return out


def analyse(twin: HouseTwin) -> Dict[str, Any]:
    md = twin.metadata or {}
    W = float(md.get("envelope_width_ft") or 20)
    sb_front = float(md.get("setback_front_m") or 0) * 3.28084
    wet = [(f.floor_no, r) for f in twin.floors for r in f.rooms if (r.type or "") in WET]
    stacks: List[P] = []
    for _, r in sorted(wet, key=lambda x: x[0]):  # one stack per cluster within 8 ft, against the room's outer wall
        c = _wall_point(r, "rear", 0.1)
        if not any(math.dist(c, s) < 8 for s in stacks):
            stacks.append(c)
    stair = next((r for f in twin.floors for r in f.rooms if (r.type or "") == "stair"), None)
    oht: P = (stair.x + stair.length_ft / 2, stair.y + stair.width_ft / 2) if stair else (W / 2, float(md.get("envelope_depth_ft") or 30) / 2)
    ground = twin.floors[0].rooms if twin.floors else []
    entry = next((r for r in ground if (r.type or "") in ("entrance", "living", "porch")), None)
    db: P = _wall_point(entry, "front", 0.85) if entry else (1.0, 1.0)
    sump: P = (W - 3.0, -max(2.0, sb_front * 0.5))  # under the front open space, at the road side
    meter: P = (W - 0.5, -max(1.0, sb_front - 0.5))
    # inspection chamber just outside the nearest outer wall of each stack; the sewer runs round the outside to the road
    D = float(md.get("envelope_depth_ft") or 30)
    road_y = -max(2.5, sb_front)
    ics: List[P] = []
    sewer_runs: List[List[List[float]]] = []
    underground: List[List[List[float]]] = []
    for sx, sy in stacks:
        edge = min((sy, "front"), (D - sy, "rear"), (sx, "left"), (W - sx, "right"))[1]
        ic = {"front": (sx, -1.2), "rear": (sx, D + 1.2), "left": (-1.2, sy), "right": (W + 1.2, sy)}[edge]
        ics.append(ic)
        underground.append([_r((sx, sy)), _r(ic)])
        side_x = -1.2 if ic[0] < W / 2 else W + 1.2
        run = [ic] if edge in ("left", "right") else [ic, (side_x, ic[1])]
        sewer_runs.append([_r(p) for p in run + [(side_x if edge != "front" else ic[0], road_y)]])
    sewer = sewer_runs[0] if sewer_runs else []
    floors: Dict[int, Any] = {}
    for f in twin.floors:
        fixtures, drains, water, conduits = [], [], [], []
        for r in f.rooms:
            fx = _fixtures(twin, r)
            fixtures += fx
            for x in fx:
                p = (x["x"], x["y"])
                if x["kind"] in ("wc", "basin", "floor_trap", "sink") and stacks:
                    s = min(stacks, key=lambda s: math.dist(p, s))
                    soil = x["kind"] == "wc"
                    drains.append({"room": r.name, "fixture": x["kind"], "kind": "soil" if soil else "waste", "dia_mm": 110 if soil else 75 if x["kind"] == "floor_trap" else 50,
                                   "slope": "1:60" if soil else "1:80", "path": _along_wall(r, p, s)})
                if x["kind"] in ("tap", "wc", "basin", "geyser"):
                    water.append({"room": r.name, "fixture": x["kind"], "dia_mm": 15 if x["kind"] in ("basin", "geyser") else 20, "hot": False,
                                  "path": _along_wall(r, p, oht)[::-1]})
                if x["kind"] == "geyser":
                    for y in fx:
                        if y["kind"] in ("tap", "basin"):
                            water.append({"room": r.name, "fixture": "hot", "dia_mm": 15, "hot": True, "path": _route(p, (y["x"], y["y"]), True)})
                if x["kind"] == "switchboard":
                    conduits.append({"room": r.name, "kind": "circuit", "path": _along_wall(r, p, db)[::-1]})
                elif x["kind"] in ("light", "fan", "socket", "ac"):
                    sbd = next((y for y in fx if y["kind"] == "switchboard"), None)
                    if sbd:
                        conduits.append({"room": r.name, "kind": "point", "path": _along_wall(r, p, (sbd["x"], sbd["y"]))})
        floors[f.floor_no] = {"fixtures": fixtures, "drains": drains, "water": water, "conduits": conduits}
    ac_kw = sum(u.tonnage * 1.2 for u in twin.mep.ac_units)
    load_kw = round(twin.mep.electrical_points * 0.06 + ac_kw + 2.0, 1)  # points + AC + pump/geyser allowance
    return {"stacks": [_r(s) for s in stacks], "overhead_tank": _r(oht), "distribution_board": _r(db), "sump": _r(sump), "meter": _r(meter),
            "inspection_chambers": [_r(c) for c in ics], "sewer": sewer, "sewer_runs": sewer_runs, "underground": underground, "pump_line": [_r(sump), _r((oht[0], sump[1])), _r(oht)],
            "floors": floors, "connected_load_kw": load_kw, "main_water_mm": 25, "branch_water_mm": 20, "soil_mm": 110, "waste_mm": 75,
            "method": "Fixtures per room; drains, water and wiring run along walls to stacks, the overhead tank and the board. Diagrammatic, not shop drawings."}
