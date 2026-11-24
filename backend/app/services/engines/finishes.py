"""
Colour Brain + Material Brain (brief models 5 and 6).
Materials: every floor in data/materials.json is scored for the room and family (pets, elders, toddlers, wet
areas, Mumbai humidity, stains, budget tier, style, maintenance tolerance); the best wins, with 2 alternatives
and its benefits/risks. Colour: per-wall paint (light on long walls and the wall facing the window, accent on
the short or headboard wall, LRV >= 70 in dim rooms), CIELAB values and a harmony note.
"""
import json
import math
import os
from functools import cache
from typing import Any, Dict, List, Optional

from backend.app.models.brief import Brief
from backend.app.models.twin import HouseTwin
from backend.app.services.engines.geometry import walls

TIER_RANK = {"economy": 0, "standard": 1, "premium": 2}
WET = ("toilet", "kitchen", "laundry", "balcony", "utility")


@cache
def catalogue() -> Dict[str, Any]:
    with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "materials.json"), encoding="utf-8") as f:
        return json.load(f)


def _rtype(t: str) -> str:
    return "bedroom" if t in ("bedroom", "help") else t


def score_floors(room_type: str, brief: Brief, style_floor: Optional[str]) -> List[Dict[str, Any]]:
    t = _rtype(room_type)
    out = []
    for m in catalogue()["floors"]:
        s = 3.0 if t in m["rooms"] or room_type in m["rooms"] else 0.0
        if room_type in WET:
            s += 2 * m["slip_wet"] + (2 * m["stain"] if room_type == "kitchen" else 0)
        if brief.elder_mobility_issue and room_type in ("bedroom_elder", "living", "passage", "toilet"):
            s += 2 * m["slip_wet"]
        if brief.pets:
            s += 1.5 * m["scratch"]
        if brief.kids:
            s += m["kid"]
        s += 0.8 * m["humidity"]  # Mumbai: ~85% humidity in monsoon
        if t.startswith("bedroom"):
            s += 0.7 * m["warmth"]
        if style_floor and m["id"] == style_floor:
            s += 2.5
        gap = TIER_RANK[m["tier"]] - TIER_RANK[brief.tier]
        s -= 2.5 * max(gap, 0) + 0.5 * max(-gap, 0)
        if brief.low_maintenance and any(w in m["maintenance"].lower() for w in ("seal", "polish", "wax")):
            s -= 1.5
        out.append({"id": m["id"], "name": m["name"], "score": round(s, 2), "cost_sqft": m["cost"], "benefits": m["benefits"],
                    "risks": m["risks"], "maintenance": m["maintenance"]})
    return sorted(out, key=lambda x: -x["score"])


def choose_floor(room_type: str, brief: Brief, style_floor: Optional[str]) -> str:
    if room_type in ("stair",):
        return "granite"
    if room_type == "porch":
        return "kota_stone"
    return score_floors(room_type, brief, style_floor)[0]["id"]


# ---------------------------------------------------------------- colour
def _rgb(h: str):
    return [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]


def lab(hexv: str) -> List[float]:
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in _rgb(hexv)]
    x = (0.4124 * lin[0] + 0.3576 * lin[1] + 0.1805 * lin[2]) / 0.95047
    y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
    z = (0.0193 * lin[0] + 0.1192 * lin[1] + 0.9505 * lin[2]) / 1.08883
    f = lambda v: v ** (1 / 3) if v > 0.008856 else 7.787 * v + 16 / 116
    return [round(116 * f(y) - 16, 1), round(500 * (f(x) - f(y)), 1), round(200 * (f(y) - f(z)), 1)]


def lrv(hexv: str) -> int:
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in _rgb(hexv)]
    return round(100 * (0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]))


def _hue(hexv: str) -> float:
    L, a, b = lab(hexv)
    return math.degrees(math.atan2(b, a)) % 360


def harmony(a: str, b: str) -> str:
    d = abs(_hue(a) - _hue(b))
    d = min(d, 360 - d)
    return "analogous (calm)" if d < 45 else "complementary (lively)" if d > 140 else "contrasting"


def lighten(hexv: str, target_lrv: int = 72) -> str:
    """Tint towards white until the colour reaches the target LRV (keeps the hue)."""
    rgb = _rgb(hexv)
    for k in range(0, 21):
        t = k / 20
        mix = [c + (1 - c) * t for c in rgb]
        hx = "#" + "".join(f"{round(c * 255):02X}" for c in mix)
        if lrv(hx) >= target_lrv:
            return hx
    return "#F5F0E6"


def paint(twin: HouseTwin, palette: Dict[str, str]) -> Dict[str, Any]:
    base, accent = sorted((palette["wall"], palette["accent"]), key=lambda h: -lrv(h))
    if lrv(base) < 60:
        base = lighten(base, 72)
    out: Dict[str, Any] = {}
    for f in twin.floors:
        for r in f.rooms:
            if (r.type or "") in ("stair", "passage", "utility", "porch"):
                continue
            ws = walls(r, twin)
            dim = not any(w["exterior"] for w in ws) or r.window_area_sqft < 0.12 * r.area_sqft
            main = lighten(base, 75) if dim else base
            win_side = next((w["side"] for w in ws if w["exterior"]), None)
            opposite = {"front": "rear", "rear": "front", "left": "right", "right": "left"}.get(win_side or "", "")
            longest = max(ws, key=lambda w: w["length_m"])["side"]
            shortest = min(ws, key=lambda w: w["length_m"])["side"]
            if (r.type or "").startswith("bedroom"):  # headboard wall: a solid (interior) wall that isn't opposite the window
                solid = [w for w in ws if not w["exterior"] and w["side"] != opposite]
                accent_side = max(solid, key=lambda w: w["length_m"])["side"] if solid else shortest
            else:
                accent_side = shortest if shortest not in (longest, opposite) else None
            wet = (r.type or "") in WET
            assigned = []
            for w in ws:
                role = "accent" if w["side"] == accent_side and not dim and not wet else "main"
                hx = accent if role == "accent" else ("#F4F6F6" if wet else main)
                assigned.append({"side": w["side"], "faces": w["dir"], "length_m": w["length_m"], "role": role, "hex": hx, "lrv": lrv(hx), "lab": lab(hx)})
            why = ["Dim room: walls kept above LRV 70 to bounce daylight."] if dim else []
            if accent_side and not dim and not wet:
                why.append(f"Accent on the {accent_side} wall ({'headboard wall' if (r.type or '').startswith('bedroom') else 'shortest wall, makes the room feel wider'}).")
            if opposite:
                why.append(f"The {opposite} wall faces the window and stays light to reflect it.")
            out[r.name] = {"floor": f.floor_no, "walls": assigned, "ceiling": {"hex": "#F7F6F2", "lrv": lrv("#F7F6F2")},
                           "harmony": harmony(main, accent), "dim": dim, "why": " ".join(why)}
    return out


def materials_report(twin: HouseTwin, brief: Brief, style_floor: Optional[str]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    warns: List[str] = []
    for f in twin.floors:
        for r in f.rooms:
            if (r.type or "") in ("stair", "porch", "utility"):
                continue
            ranked = score_floors(r.type or "", brief, style_floor)
            chosen = next((x for x in ranked if x["id"] == r.material_floor), ranked[0])
            out[r.name] = {"floor": f.floor_no, "chosen": chosen, "alternatives": [x for x in ranked if x["id"] != chosen["id"]][:2]}
            if r.type == "kitchen" and r.material_floor == "marble":
                warns.append("Marble in the kitchen will stain with turmeric and oil.")
    return {"rooms": out, "warnings": warns, "walls": catalogue()["walls"], "finishes": catalogue()["finishes"]}
