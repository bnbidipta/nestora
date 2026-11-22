"""
City code packs: every threshold the generator and Judge use comes from here, with its source.
Only Mumbai exists; `rules()` takes a city so no city logic is hardcoded elsewhere.
All values are unverified drafts until a licensed architect signs the pack off.
"""
import json
import os
from functools import cache
from typing import Any, Dict

DATA = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "packs")
FT = 0.3048
FLOOR_HEIGHT_M = 3.0  # floor-to-floor; 2.75 m clear + slab


@cache
def load(city: str = "mumbai") -> Dict[str, Any]:
    with open(os.path.join(DATA, f"{city}.draft.json"), encoding="utf-8") as f:
        return json.load(f)


@cache
def rates(city: str = "mumbai") -> Dict[str, Any]:
    with open(os.path.join(DATA, f"{city}.rates.draft.json"), encoding="utf-8") as f:
        return json.load(f)


def _v(node: Dict[str, Any]) -> Any:
    return node["value"]


def rules(plot_w_m: float, plot_d_m: float, road_m: float, city: str = "mumbai") -> Dict[str, Any]:
    """Flattened thresholds for one plot. Rows are picked by plot area (setbacks) and road width (FSI)."""
    p = load(city)
    area = plot_w_m * plot_d_m
    sb_rows = p["setbacks"]["by_plot_and_road"]
    sb = next((r for r in sb_rows if area <= r["plot_area_max_m2"]), sb_rows[-1])
    fsi_rows = p["fsi"]["base_by_road_width"]
    fsi_row = next((r for r in fsi_rows if road_m <= r["road_width_max_m"]), fsi_rows[-1])
    mr, st = p["min_room"], p["stair"]
    return {
        "city": p["city"],
        "verified": p.get("verified", False),
        "setback_front_m": _v(sb["front"]),
        "setback_side_m": _v(sb["side"]),
        "setback_rear_m": _v(sb["rear"]),
        "setback_source": sb["front"]["source"],
        "fsi_base": _v(fsi_rows[0]["fsi"]),
        "fsi_max": _v(fsi_row["fsi"]),
        "fsi_source": fsi_row["fsi"]["source"],
        "max_height_m": _v(p["max_height"]),
        "habitable_min_m2": _v(mr["habitable_area_m2"]),
        "habitable_min_width_m": _v(mr["habitable_min_width_m"]),
        "kitchen_min_m2": _v(mr["kitchen_area_m2"]),
        "toilet_min_m2": _v(mr["toilet_area_m2"]),
        "window_ratio": _v(p["ventilation"]["window_to_floor_ratio"]),
        "door_main_mm": _v(p["doors_mm"]["main"]),
        "door_habitable_mm": _v(p["doors_mm"]["habitable"]),
        "door_toilet_mm": _v(p["doors_mm"]["toilet"]),
        "stair_min_width_m": _v(st["min_width_m"]),
        "stair_max_riser_mm": _v(st["max_riser_mm"]),
        "stair_min_tread_mm": _v(st["min_tread_mm"]),
        "car_stall_m": _v(p["parking"]["car_stall_size_m"]),
        "min_column_mm": _v(p["structural"]["min_column_mm"]),
        "span_depth_ratio": _v(p["structural"]["span_depth_ratio"]),
        "soil_bearing_kn_m2": _v(p["site_defaults"]["soil_bearing_kn_m2"]),
        "max_beam_span_m": 6.0,  # IS 456 practice for residential frames without a deeper design
        "min_safety_factor": 1.5,
    }


def envelope(plot_w_m: float, plot_d_m: float, r: Dict[str, Any]) -> Dict[str, float]:
    """Buildable rectangle after setbacks: width along the frontage, depth away from the road."""
    w = plot_w_m - 2 * r["setback_side_m"]
    d = plot_d_m - r["setback_front_m"] - r["setback_rear_m"]
    return {"width_m": max(w, 0.0), "depth_m": max(d, 0.0), "area_m2": max(w, 0.0) * max(d, 0.0)}


def stair_box(r: Dict[str, Any]) -> Dict[str, float]:
    """Dog-leg stair for one floor: two flights side by side plus a landing."""
    risers = -(-int(FLOOR_HEIGHT_M * 1000) // int(r["stair_max_riser_mm"]))  # ceil
    flight_run = (risers // 2) * r["stair_min_tread_mm"] / 1000
    return {"width_m": 2 * r["stair_min_width_m"] + 0.1, "length_m": round(flight_run + r["stair_min_width_m"], 2), "risers": risers}
