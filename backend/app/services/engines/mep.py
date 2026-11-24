"""
MEP routing (brief model 4, routes half). Soil/waste stacks where the wet rooms cluster (shared by all floors),
L-shaped pipe runs from each wet room to its stack, the overhead-tank down-take beside the stair, an electrical
distribution board near the entrance with conduit runs to every room, and connected load. Plan feet.
ponytail: L-shaped runs along room centres, not a routed duct layout; it shows intent, not shop drawings.
"""
import math
from typing import Any, Dict, List, Tuple

from backend.app.models.twin import HouseTwin, Room

WET = ("toilet", "kitchen", "laundry")


def _c(r: Room) -> Tuple[float, float]:
    return (r.x + r.length_ft / 2, r.y + r.width_ft / 2)


def _l(a, b) -> List[List[float]]:
    return [[round(a[0], 2), round(a[1], 2)], [round(b[0], 2), round(a[1], 2)], [round(b[0], 2), round(b[1], 2)]]


def analyse(twin: HouseTwin) -> Dict[str, Any]:
    wet = [(f.floor_no, r) for f in twin.floors for r in f.rooms if (r.type or "") in WET]
    stacks: List[Tuple[float, float]] = []
    for _, r in sorted(wet, key=lambda x: x[0]):  # one stack per cluster within 8 ft
        c = _c(r)
        if not any(math.dist(c, s) < 8 for s in stacks):
            stacks.append(c)
    floors: Dict[int, Any] = {}
    stair = next((r for f in twin.floors for r in f.rooms if (r.type or "") == "stair"), None)
    tank = _c(stair) if stair else (twin.metadata.get("envelope_width_ft", 20) / 2, twin.metadata.get("envelope_depth_ft", 30) / 2)
    entry = next((r for r in (twin.floors[0].rooms if twin.floors else []) if (r.type or "") in ("entrance", "living", "porch")), None)
    db = (entry.x + 1.0, entry.y + 1.0) if entry else (1.0, 1.0)
    for f in twin.floors:
        drains, water, conduits = [], [], []
        for r in f.rooms:
            c = _c(r)
            if (r.type or "") in WET and stacks:
                s = min(stacks, key=lambda s: math.dist(c, s))
                drains.append({"room": r.name, "kind": "soil" if r.type == "toilet" else "waste", "dia_mm": 110 if r.type == "toilet" else 75,
                               "slope": "1:60" if r.type == "toilet" else "1:80", "path": _l(c, s)})
                water.append({"room": r.name, "dia_mm": 20, "path": _l(tank, c)})
            if (r.type or "") not in ("utility",):
                conduits.append({"room": r.name, "path": _l(db, c)})
        floors[f.floor_no] = {"drains": drains, "water": water, "conduits": conduits}
    ac_kw = sum(u.tonnage * 1.2 for u in twin.mep.ac_units)
    load_kw = round(twin.mep.electrical_points * 0.06 + ac_kw + 2.0, 1)  # points + AC + pump/geyser allowance
    return {"stacks": [[round(x, 2), round(y, 2)] for x, y in stacks], "overhead_tank": [round(v, 2) for v in tank],
            "distribution_board": [round(v, 2) for v in db], "floors": floors, "connected_load_kw": load_kw,
            "main_water_mm": 25, "branch_water_mm": 20,
            "method": "Wet stacks at clustered wet rooms; L-shaped runs; diagrammatic, not shop drawings."}
