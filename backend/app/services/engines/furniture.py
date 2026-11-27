"""
Furniture brain (brief model 7, furniture half). Places standard-size furniture in every room against walls,
keeping the door swing and a 0.6 m clearance around beds; measures the kitchen work triangle from the actual
sink/stove/fridge positions. Doors are assumed on the wall shared with the passage/living/stair (or the inner
wall). Output coordinates are absolute plan feet so the viewer can draw them.
ponytail: greedy wall-hugging placement, not an optimiser; it can leave space unused but never overlaps.
"""
import math
from typing import Any, Dict, List, Optional, Tuple

from backend.app.models.brief import Brief
from backend.app.models.twin import HouseTwin, Room
from backend.app.services.engines.geometry import FT, shared_wall_m, walls

M = 1 / FT  # metres -> feet
CLEAR = 0.6  # metres around beds and in front of storage


def _items(r: Room, brief: Brief) -> List[Tuple[str, float, float, bool]]:
    """(name, width_m along wall, depth_m from wall, needs_front_clearance)."""
    t, area = r.type or "", r.area_sqft * 0.0929
    if brief.compact and t == "bedroom" and area < 9.5:  # wall bed: folds up by day, the room is free floor
        return [("wall bed (folds up)", 1.5, 0.45, True), ("wardrobe", 1.2, 0.6, True)] + \
            ([("fold-down wall desk", 1.0, 0.3, True)] if brief.wfh_people else [])
    if t.startswith("bedroom") or t == "help":
        bed = (1.8, 2.0) if area >= 14 else (1.5, 2.0) if area >= 10.5 else (0.9, 1.9)
        wardrobe = 2.4 if t == "bedroom_master" and brief.master_dressing else 1.8 if area >= 12 else 1.2
        return [("bed", *bed, True), ("wardrobe", wardrobe, 0.6, True), ("side table", 0.45, 0.4, False)] + \
            ([("desk", 1.0, 0.5, True)] if area >= 13 and t != "help" else
             [("fold-down wall desk", 1.0, 0.3, True)] if brief.compact and brief.wfh_people and t == "bedroom_master" else [])
    if t in ("living", "lounge"):
        if brief.compact and t == "living":  # sofa-cum-bed for guests, fold-down dining table on the wall
            return [("sofa-cum-bed", 2.0, 0.9, True), ("tv unit", 1.5, 0.4, True), ("fold-down dining table", 1.2, 0.3, True)]
        return [("sofa", 2.1, 0.9, True), ("tv unit", 1.8, 0.4, True), ("armchair", 0.8, 0.8, False)] + \
            ([("dining table", 1.2, 0.8, True)] if t == "living" and brief.kitchen == "open" else [])
    if t == "dining":
        seats = brief.dining_seats
        return [("dining table", {4: 1.2, 6: 1.6, 8: 2.0}.get(seats, 2.4), 0.9 if seats > 4 else 0.8, True)]
    if t == "study":
        return [("desk", 1.2, 0.6, True), ("bookshelf", 1.0, 0.35, False)]
    if t == "toilet":
        return [("wc", 0.45, 0.7, True), ("basin", 0.5, 0.4, True), ("shower", 0.9, 0.9, False)]
    if t == "puja":
        return [("mandir", 0.6, 0.45, True)]
    if t == "laundry":
        return [("washing machine", 0.6, 0.6, True)]
    return []


def _door_side(r: Room, rooms: List[Room], twin: HouseTwin) -> str:
    """The wall shared with the most 'connecting' neighbour (passage > living > stair), else an inner wall."""
    pref = {"passage": 3, "living": 2, "lounge": 2, "dining": 2, "stair": 1, "entrance": 2}
    best, side = 0, None
    for o in rooms:
        if o is r or shared_wall_m(r, o) <= 0:
            continue
        p = pref.get(o.type or "", 0.5)
        if p > best:
            best = p
            side = ("front" if abs(o.y + o.width_ft - r.y) < 0.05 else "rear" if abs(r.y + r.width_ft - o.y) < 0.05
                    else "left" if abs(o.x + o.length_ft - r.x) < 0.05 else "right")
    if side:
        return side
    inner = [w for w in walls(r, twin) if not w["exterior"]]
    return inner[0]["side"] if inner else "front"


def _door(r: Room, rooms: List[Room], twin: HouseTwin) -> Tuple[str, Optional[List[float]]]:
    """Door wall and, when the plan says which room the door opens onto, the stretch of that wall shared with it
    ([from, to] in plan ft along the wall), so the door lands where the two rooms actually meet."""
    to = next((o for o in rooms if r.opens_to and o.name == r.opens_to), None)
    if not to or shared_wall_m(r, to) <= 0:
        return _door_side(r, rooms, twin), None
    side = ("front" if abs(to.y + to.width_ft - r.y) < 0.05 else "rear" if abs(r.y + r.width_ft - to.y) < 0.05
            else "left" if abs(to.x + to.length_ft - r.x) < 0.05 else "right")
    a, b = ((max(r.x, to.x), min(r.x + r.length_ft, to.x + to.length_ft)) if side in ("front", "rear")
            else (max(r.y, to.y), min(r.y + r.width_ft, to.y + to.width_ft)))
    return side, [round(a, 2), round(b, 2)]


def _rect_on_wall(r: Room, side: str, along: float, width: float, depth: float) -> Tuple[float, float, float, float]:
    """Rectangle (x, y, w, d) in plan feet for an item of width x depth (m) placed on a wall, `along` m from its start."""
    W, D = r.length_ft, r.width_ft
    w, d, a = width * M, depth * M, along * M
    if side == "front":
        return (r.x + a, r.y, w, d)
    if side == "rear":
        return (r.x + a, r.y + D - d, w, d)
    if side == "left":
        return (r.x, r.y + a, d, w)
    return (r.x + W - d, r.y + a, d, w)


def _overlap(a, b, pad=0.0) -> bool:
    return a[0] < b[0] + b[2] + pad and b[0] < a[0] + a[2] + pad and a[1] < b[1] + b[3] + pad and b[1] < a[1] + a[3] + pad


def _inside(a, r: Room) -> bool:
    return a[0] >= r.x - 1e-3 and a[1] >= r.y - 1e-3 and a[0] + a[2] <= r.x + r.length_ft + 1e-3 and a[1] + a[3] <= r.y + r.width_ft + 1e-3


def _door_zone(r: Room, side: str, door_mm: int, span: Optional[List[float]] = None) -> Tuple[float, float, float, float]:
    """Door (at the start of its shared stretch, else of its wall) plus its swing square and a 0.3 m step-in margin."""
    s = (door_mm / 1000 + 0.3) * M
    w = door_mm / 1000 * M
    start = (r.x if side in ("front", "rear") else r.y)
    at = (span[0] if span else start) + 0.1
    if side == "front":
        return (at, r.y, w + 0.3, s)
    if side == "rear":
        return (at, r.y + r.width_ft - s, w + 0.3, s)
    if side == "left":
        return (r.x, at, s, w + 0.3)
    return (r.x + r.length_ft - s, at, s, w + 0.3)


def place_room(r: Room, rooms: List[Room], twin: HouseTwin, brief: Brief) -> Dict[str, Any]:
    ws = {w["side"]: w for w in walls(r, twin)}
    door, span = _door(r, rooms, twin)
    dz = _door_zone(r, door, r.door_width_mm, span)
    bodies: list = []          # furniture footprints: nothing may overlap these
    zones: list = [dz]         # door swing + clearances: free floor, may overlap each other but not furniture
    placed, dropped = [], []
    win_side = next((s for s, w in ws.items() if w["exterior"]), None)
    for name, width, depth, front_clear in _items(r, brief):
        # beds/wardrobes prefer solid walls away from the door and window; sinks/desks like the window wall
        order = sorted(ws, key=lambda s: (s == door, (s == win_side) != (name in ("desk", "basin")), -ws[s]["length_m"]))
        done = False
        for side in order:
            length = ws[side]["length_m"]
            spots = [i * 0.15 for i in range(int(max(length - width, 0) / 0.15) + 1)]
            mid = max((length - width) / 2, 0)
            for along in sorted(spots, key=lambda a: abs(a - mid)) if name == "bed" else spots:
                if along + width > length + 1e-6:
                    continue
                rect = _rect_on_wall(r, side, along, width, depth)
                clear = _rect_on_wall(r, side, along, width, depth + (CLEAR if front_clear else 0))
                if not _inside(clear, r) or any(_overlap(rect, b) for b in bodies + zones) or any(_overlap(clear, b) for b in bodies):
                    continue
                placed.append({"item": name, "x": round(rect[0], 2), "y": round(rect[1], 2), "w": round(rect[2], 2), "d": round(rect[3], 2), "wall": side})
                bodies.append(rect)
                if clear != rect:
                    zones.append((clear[0], clear[1], clear[2], clear[3]))
                done = True
                break
            if done:
                break
        if not done:
            dropped.append(name)
    return {"door_wall": door, "door_span": span, "door_zone": [round(v, 2) for v in dz], "items": placed, "did_not_fit": dropped}


def kitchen_triangle(r: Room, twin: HouseTwin) -> Dict[str, Any]:
    """Counter along the longest walls; sink on the window wall, stove >= 1.2 m from it, fridge at the counter end."""
    ws = sorted(walls(r, twin), key=lambda w: -w["length_m"])
    win = next((w for w in ws if w["exterior"]), ws[0])
    other = next((w for w in ws if w["side"] != win["side"]), ws[1])
    sink = _rect_on_wall(r, win["side"], max(win["length_m"] / 2 - 0.3, 0), 0.6, 0.6)
    stove_along = min(other["length_m"] - 0.6, max(other["length_m"] / 2, 1.2))
    stove = _rect_on_wall(r, other["side"], max(stove_along - 0.3, 0), 0.6, 0.6)
    fridge = _rect_on_wall(r, other["side"], 0.0, 0.7, 0.7) if stove_along > 1.4 else _rect_on_wall(r, win["side"], 0.0, 0.7, 0.7)
    c = lambda a: (a[0] + a[2] / 2, a[1] + a[3] / 2)
    pts = [c(sink), c(stove), c(fridge)]
    per = sum(math.dist(pts[i], pts[(i + 1) % 3]) for i in range(3))
    return {"items": [{"item": n, "x": round(a[0], 2), "y": round(a[1], 2), "w": round(a[2], 2), "d": round(a[3], 2)}
                      for n, a in (("sink", sink), ("stove", stove), ("fridge", fridge))],
            "triangle_ft": round(per, 1)}


def analyse(twin: HouseTwin, brief: Brief) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    tri: Optional[float] = None
    for f in twin.floors:
        for r in f.rooms:
            if (r.type or "") == "kitchen":
                k = kitchen_triangle(r, twin)
                side, span = _door(r, f.rooms, twin)
                res = {"door_wall": side, "door_span": span, "items": k["items"], "did_not_fit": [], "triangle_ft": k["triangle_ft"]}
                tri = k["triangle_ft"] if tri is None else max(tri, k["triangle_ft"])
            else:
                if not _items(r, brief):
                    if not r.opens_to:
                        continue
                    side, span = _door(r, f.rooms, twin)  # no furniture, but the 3D still needs its door
                    res = {"door_wall": side, "door_span": span, "items": [], "did_not_fit": []}
                else:
                    res = place_room(r, f.rooms, twin, brief)
            res["floor"] = f.floor_no
            out[r.name] = res
    return {"rooms": out, "kitchen_triangle_ft": tri,
            "method": "Greedy wall placement with door swing + 0.6 m clearances; standard Indian furniture sizes."}
