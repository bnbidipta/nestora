"""
Light + climate engine (brief model 8). Sun position from standard solar geometry (declination / hour angle),
clear-sky beam irradiance from an air-mass model, solar gain through each room's windows by wall orientation,
summer overhang depths, cross-ventilation and wind exposure. No weather API: physics only, so results are
relative (hotter vs cooler rooms), not indoor temperatures.
"""
import json
import math
import os
from functools import cache
from typing import Any, Dict, List

from backend.app.models.twin import HouseTwin
from backend.app.services.engines.geometry import AZ, walls

CITY_LAT = {"mumbai": 19.07}
SHGC = 0.6  # clear single glazing, typical
DATES = {"summer": 172, "equinox": 80, "winter": 355, "hot_month": 135}  # day of year; 135 = mid-May, Mumbai's hottest


def sun(lat: float, day: int, hour: float) -> Dict[str, float]:
    """Solar altitude and azimuth (degrees, azimuth clockwise from north) at local solar time."""
    decl = math.radians(23.44 * math.sin(math.radians(360 / 365 * (284 + day))))
    phi, h = math.radians(lat), math.radians(15 * (hour - 12))
    alt = math.asin(math.sin(phi) * math.sin(decl) + math.cos(phi) * math.cos(decl) * math.cos(h))
    az = math.degrees(math.atan2(math.sin(h), math.cos(h) * math.sin(phi) - math.tan(decl) * math.cos(phi))) + 180
    return {"hour": hour, "alt": round(math.degrees(alt), 1), "az": round(az % 360, 1)}


def beam(alt_deg: float) -> float:
    """Clear-sky direct normal irradiance (W/m²), Meinel air-mass model."""
    if alt_deg <= 2:
        return 0.0
    am = 1 / math.sin(math.radians(alt_deg))
    return 1353 * 0.7 ** (am ** 0.678)


@cache
def _measured(city: str):
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "climate", f"{city}_walls.json")
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def wall_insolation(lat: float, day: int, wall_az: float) -> Dict[str, float]:
    """Daily kWh/m² on a vertical wall, and the hour and profile angle of its peak."""
    total, peak, peak_h, prof = 0.0, 0.0, 12.0, 90.0
    for i in range(0, 25):
        hr = 6 + i * 0.5
        s = sun(lat, day, hr)
        rel = math.radians(s["az"] - wall_az)
        cos_i = math.cos(math.radians(s["alt"])) * math.cos(rel)
        w = beam(s["alt"]) * max(cos_i, 0) + 0.08 * beam(s["alt"])  # beam on wall + small diffuse share
        total += w * 0.5
        if w > peak and cos_i > 0:
            peak, peak_h = w, hr
            prof = math.degrees(math.atan2(math.tan(math.radians(s["alt"])), max(math.cos(rel), 1e-3)))
    return {"kwh_m2": round(total / 1000, 2), "peak_hour": peak_h, "profile_deg": round(prof, 1)}


def analyse(twin: HouseTwin) -> Dict[str, Any]:
    lat = CITY_LAT.get(str(twin.metadata.get("city", "mumbai")), 19.07)
    by_dir = {d: wall_insolation(lat, DATES["hot_month"], az) for d, az in AZ.items()}
    measured = _measured(str(twin.metadata.get("city", "mumbai")))
    if measured:  # real weather (TMYx) beats the clear-sky model: it includes haze and diffuse sky light
        for d in by_dir:
            by_dir[d] = dict(by_dir[d], kwh_m2=measured["walls_kwh_m2_day"]["5"][d], source="measured TMYx 2007-2021")
    rooms: Dict[str, Any] = {}
    for f in twin.floors:
        for r in f.rooms:
            ws = walls(r, twin)
            ext = [w for w in ws if w["exterior"]]
            if not ext or not r.window_area_sqft:
                rooms[r.name] = {"floor": f.floor_no, "outside_walls": [], "solar_gain_kwh": 0.0, "rating": "interior", "cross_ventilation": False}
                continue
            win_m2 = r.window_area_sqft * 0.0929
            tot_len = sum(w["length_m"] for w in ext)
            gain = sum(win_m2 * w["length_m"] / tot_len * SHGC * by_dir[w["dir"]]["kwh_m2"] for w in ext)
            per_m2 = gain / max(r.area_sqft * 0.0929, 1)
            hot_dirs = [w["dir"] for w in ext if w["dir"] in ("W", "S", "E")]
            overhang = {}
            for d in sorted(set(hot_dirs)):
                prof = by_dir[d]["profile_deg"]
                depth = 1.2 / math.tan(math.radians(max(prof, 15)))  # shade a 1.2 m window at the peak hour
                overhang[d] = round(min(max(depth, 0.3), 1.2), 2)
            rooms[r.name] = {
                "floor": f.floor_no, "outside_walls": sorted({w["dir"] for w in ext}), "solar_gain_kwh": round(gain, 2),
                "gain_per_m2": round(per_m2, 3), "rating": "hot" if per_m2 > 0.25 else "warm" if per_m2 > 0.12 else "cool",
                "cross_ventilation": len({w["dir"] for w in ext}) >= 2, "windward": any(w["dir"] in ("W", "S") for w in ext),
                "overhang_m": overhang,
            }
    hours = [h / 1 for h in range(6, 19)]
    return {
        "latitude": lat,
        "sun_path": {k: [s for s in (sun(lat, d, h) for h in hours) if s["alt"] > 0] for k, d in DATES.items() if k != "hot_month"},
        "wall_insolation_may": by_dir,
        "rooms": rooms,
        "prevailing_wind": "South-west (monsoon) and west/north-west sea breeze",
        "method": "Solar geometry + clear-sky air-mass model; relative ratings, not temperatures.",
    }


def suggestions(c: Dict[str, Any]) -> List[Dict[str, Any]]:
    out = []
    hot = [n for n, r in c["rooms"].items() if r.get("rating") == "hot" and not n.startswith(("stair", "toilet", "passage", "utility"))]
    if hot:
        deepest = max((d for n in hot for d in c["rooms"][n]["overhang_m"].values()), default=0.6)
        out.append({"kind": "climate", "title": f"Shade {', '.join(h.replace('_', ' ') for h in hot[:3])}",
                    "detail": f"These rooms take the most summer sun. Add chajjas/overhangs about {deepest:.1f} m deep over west and south windows, "
                              "and use a light, high-reflectance roof coating.", "auto_applied": False})
    stuffy = [n for n, r in c["rooms"].items() if r.get("rating") != "interior" and not r.get("cross_ventilation") and n.startswith(("bedroom", "living"))]
    if stuffy:
        out.append({"kind": "climate", "title": "Improve airflow", "detail": f"{', '.join(s.replace('_', ' ') for s in stuffy[:3])} have windows on one side only: "
                    "add a high-level ventilator or transom over the door to get cross-ventilation.", "auto_applied": False})
    return out
