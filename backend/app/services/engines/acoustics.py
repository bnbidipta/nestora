"""
Sound engine (brief model 9). Outside noise from road class, facade sound insulation (composite STC of wall +
window), indoor level per room, Sabine reverberation time from room volume and finishes, and privacy between
rooms sharing a wall. STC and absorption values are textbook typicals (brief §8.6); unverified.
"""
import math
from typing import Any, Dict, List

from backend.app.models.twin import HouseTwin
from backend.app.services.engines.geometry import FT, neighbours, walls

STC = {"wall_230_brick": 45, "wall_115_brick": 40, "window_single": 26, "window_double": 32, "door_solid": 30}
TARGET_DB = {"bedroom": 35, "study": 35, "living": 40, "lounge": 40, "dining": 45, "kitchen": 50}
TARGET_RT = {"bedroom": 0.8, "study": 0.8, "living": 1.0, "lounge": 1.0, "dining": 1.0}
ALPHA = {"marble": 0.01, "granite": 0.01, "vitrified_tiles": 0.02, "anti_skid_vitrified": 0.02, "anti_skid_ceramic": 0.02,
         "kota_stone": 0.02, "terrazzo": 0.02, "polished_concrete": 0.02, "epoxy_flooring": 0.03, "red_oxide": 0.02,
         "athangudi_tiles": 0.02, "terracotta": 0.04, "wood_look_tiles": 0.02, "teak_wood": 0.1, "engineered_wood": 0.08}
FURNISHED_SABINS = {"bedroom": 6.0, "living": 8.0, "lounge": 6.0, "study": 4.0, "dining": 4.0}  # bed, sofa, curtains (m²)
NOISY = ("living", "lounge", "kitchen", "dining", "stair", "toilet")


def road_noise_db(road_m: float) -> int:
    """Daytime outside level at the facade by road width (brief: quiet lane ~40-50, main road ~75)."""
    return 50 if road_m < 9 else 60 if road_m < 12 else 65 if road_m < 18 else 72


def _kind(t: str) -> str:
    return "bedroom" if t.startswith("bedroom") or t == "help" else t


def composite_stc(wall_m2: float, win_m2: float, win_stc: int, wall_stc: int = STC["wall_230_brick"]) -> float:
    tau = (wall_m2 * 10 ** (-wall_stc / 10) + win_m2 * 10 ** (-win_stc / 10)) / max(wall_m2 + win_m2, 1e-6)
    return -10 * math.log10(tau)


def analyse(twin: HouseTwin) -> Dict[str, Any]:
    outside = road_noise_db(float(twin.metadata.get("road_width_m", 9)))
    h = 2.75  # clear height (m)
    rooms: Dict[str, Any] = {}
    for f in twin.floors:
        for r in f.rooms:
            k = _kind(r.type or "")
            ws = walls(r, twin)
            ext = [w for w in ws if w["exterior"]]
            front = any(w["side"] == "front" for w in ext)
            level = outside - (0 if front else 6) - 1.5 * f.floor_no  # side/rear walls are shielded; upper floors slightly less
            win_m2 = r.window_area_sqft * 0.0929
            wall_m2 = sum(w["length_m"] for w in ext) * h - win_m2
            glazing = "single"
            indoor = None
            if ext:
                stc = composite_stc(max(wall_m2, 1), win_m2, STC["window_single"])
                indoor = level - stc
                if k in TARGET_DB and indoor > TARGET_DB[k]:
                    stc2 = composite_stc(max(wall_m2, 1), win_m2, STC["window_double"])
                    glazing = "double" if level - stc2 <= TARGET_DB[k] else "double + acoustic seals"
            area = r.area_sqft * 0.0929
            vol = area * h
            a_floor = area * ALPHA.get(r.material_floor, 0.02)
            surfaces = 2 * (r.length_ft + r.width_ft) * FT * h + area  # walls + ceiling, painted plaster
            sabins = a_floor + surfaces * 0.02 + FURNISHED_SABINS.get(k, 2.0)
            rt = 0.161 * vol / sabins if sabins else 0
            noisy = [(o.name, round(s, 1)) for o, s in neighbours(r, f.rooms) if _kind(o.type or "").startswith(NOISY)]
            rooms[r.name] = {
                "floor": f.floor_no, "outside_db": round(level), "indoor_db": round(indoor) if indoor is not None else None,
                "target_db": TARGET_DB.get(k), "glazing": glazing, "rt60_s": round(rt, 2), "target_rt60_s": TARGET_RT.get(k),
                "echo_risk": bool(TARGET_RT.get(k) and rt > TARGET_RT[k]),
                "noisy_neighbours": noisy if k in ("bedroom", "study") else [],
                "partition_stc": STC["wall_115_brick"],
            }
    return {"outside_db": outside, "rooms": rooms,
            "method": "Composite STC (wall 230 mm brick STC 45, single glazing STC 26) and Sabine RT60; typical values, unverified."}


def suggestions(s: Dict[str, Any]) -> List[Dict[str, Any]]:
    out = []
    dbl = [n for n, r in s["rooms"].items() if r["glazing"] != "single"]
    if dbl:
        out.append({"kind": "sound", "title": "Double glazing on the road side",
                    "detail": f"Road noise about {s['outside_db']} dB: {', '.join(d.replace('_', ' ') for d in dbl[:3])} need double-glazed windows to reach quiet-room levels.",
                    "auto_applied": False})
    echo = [n for n, r in s["rooms"].items() if r["echo_risk"]]
    if echo:
        out.append({"kind": "sound", "title": "Soften echo", "detail": f"{', '.join(e.replace('_', ' ') for e in echo[:3])} will sound echoey with hard floors: add rugs, curtains or an acoustic ceiling panel.",
                    "auto_applied": False})
    priv = [(n, r["noisy_neighbours"]) for n, r in s["rooms"].items() if r["noisy_neighbours"]]
    if priv:
        n, nb = priv[0]
        out.append({"kind": "sound", "title": "Bedroom privacy", "detail": f"{n.replace('_', ' ')} shares a wall with {nb[0][0].replace('_', ' ')}: line that wall with the wardrobe, or build it 230 mm instead of 115 mm.",
                    "auto_applied": False})
    return out
