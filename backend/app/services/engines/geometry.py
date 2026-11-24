"""Shared room geometry for the engines. Twin units: feet; plan origin = buildable corner on the road side."""
from typing import Dict, List, Tuple

from backend.app.models.twin import HouseTwin, Room

FT = 0.3048
DIRS = {"N": (0, 1), "E": (1, 0), "S": (0, -1), "W": (-1, 0)}
AZ = {"N": 0.0, "E": 90.0, "S": 180.0, "W": 270.0}


def facing(twin: HouseTwin) -> str:
    return {"North": "N", "East": "E", "South": "S", "West": "W"}.get(twin.plot.orientation, "E")


def _name(v: Tuple[int, int]) -> str:
    return next(k for k, d in DIRS.items() if d == v)


def side_dirs(f: str) -> Dict[str, str]:
    """Compass direction each plan side faces outward: front (road), rear, left, right (as seen from the road)."""
    out = DIRS[f]
    into = (-out[0], -out[1])
    right = (into[1], -into[0])
    return {"front": f, "rear": _name(into), "right": _name(right), "left": _name((-right[0], -right[1]))}


def envelope(twin: HouseTwin) -> Tuple[float, float]:
    return float(twin.metadata.get("envelope_width_ft", 0)), float(twin.metadata.get("envelope_depth_ft", 0))


def walls(room: Room, twin: HouseTwin) -> List[Dict]:
    """The room's four walls: plan side, length (m), outward compass direction, and whether it is an outside wall."""
    W, D = envelope(twin)
    dirs = side_dirs(facing(twin))
    e = 0.05
    spec = [("front", room.length_ft, room.y < e), ("rear", room.length_ft, abs(room.y + room.width_ft - D) < e),
            ("left", room.width_ft, room.x < e), ("right", room.width_ft, abs(room.x + room.length_ft - W) < e)]
    return [{"side": s, "length_m": round(l * FT, 2), "dir": dirs[s], "exterior": ext} for s, l, ext in spec]


def shared_wall_m(a: Room, b: Room) -> float:
    """Length of wall two rooms on the same floor share (m)."""
    ox = min(a.x + a.length_ft, b.x + b.length_ft) - max(a.x, b.x)
    oy = min(a.y + a.width_ft, b.y + b.width_ft) - max(a.y, b.y)
    if abs(ox) < 0.05 and oy > 0.5:
        return oy * FT
    if abs(oy) < 0.05 and ox > 0.5:
        return ox * FT
    return 0.0


def neighbours(room: Room, rooms: List[Room]) -> List[Tuple[Room, float]]:
    return [(o, s) for o in rooms if o is not room for s in [shared_wall_m(room, o)] if s > 0]
