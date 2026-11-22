"""
Ranker (Generator C1): fixed brief-fit and quality terms plus learned layout-preference weights.
Each keep/discard in the 4-at-a-time loop is a preference label; weights move toward what the user keeps.
ponytail: online linear preference model (perceptron-style); swap for a trained model once pilot labels exist.
"""
import math
from typing import Any, Dict, List

from backend.app.models.brief import Brief
from backend.app.services import generator

FEATURES = ("living_share", "bedroom_size", "outside_wall_share", "open_plan", "kitchen_front", "bedrooms_front",
            "stair_left", "proportion", "terrace_share", "storeys")
LR = 0.6


def features(c: Dict[str, Any]) -> Dict[str, float]:
    rooms = c["layout"]["rooms"]
    area = sum(r["w"] * r["d"] for r in rooms) or 1.0
    beds = [r for r in rooms if r["type"].startswith("bedroom")]
    asp = [1 - min(abs(math.log(max(r["w"], r["d"]) / min(r["w"], r["d"]))) / math.log(3), 1) for r in rooms if r["type"] not in ("passage", "utility", "stair")]
    cap = c["envelope"]["area_m2"] * c["floors"]
    return {
        "living_share": sum(r["w"] * r["d"] for r in rooms if r["type"] in ("living", "lounge", "dining")) / area,
        "bedroom_size": (sum(r["w"] * r["d"] for r in beds) / len(beds) / 20) if beds else 0.0,
        "outside_wall_share": sum(1 for r in rooms if r["exterior"]) / len(rooms),
        "open_plan": 1.0 if not any(r["type"] == "dining" for r in rooms) else 0.0,
        "kitchen_front": 1.0 if any(r["type"] == "kitchen" and r["zone"] == "front" for r in rooms) else 0.0,
        "bedrooms_front": (sum(1 for r in beds if r["zone"] == "front") / len(beds)) if beds else 0.0,
        "stair_left": 1.0 if c["layout"]["stair_left"] else 0.0,
        "proportion": sum(asp) / len(asp) if asp else 0.0,
        "terrace_share": max(0.0, 1 - generator.built_up_m2(c["layout"]) / cap) if cap else 0.0,
        "storeys": c["floors"] / 3,
    }


def brief_fit(brief: Brief, c: Dict[str, Any]) -> Dict[str, float]:
    rooms = c["layout"]["rooms"]
    ids = {r["id"] for r in rooms}
    beds = sum(1 for r in rooms if r["type"].startswith("bedroom") and not r["id"].startswith("rental"))
    out = {
        "floors": 1.0 if c["floors"] == brief.floors_wanted else 0.0,
        "parking": 1.0 if c["strategy"]["parking"] == brief.parking else 0.0,
        "bedrooms": min(beds / max(brief.bedrooms_needed, 1), 1.0),
        "study": 1.0 if not brief.wfh_people or "study" in ids else 0.0,
        "puja": 1.0 if brief.puja == "none" or "puja" in ids else 0.0,
        "elder_ground": 1.0 if not brief.elders or any(r["type"] == "bedroom_elder" and r["floor"] == 0 for r in rooms) else 0.0,
    }
    return out


def score(brief: Brief, c: Dict[str, Any], prefs: Dict[str, float], tradition_score: float, warnings: int) -> Dict[str, Any]:
    fit = brief_fit(brief, c)
    f = features(c)
    fit_score = 2 * fit["bedrooms"] + fit["floors"] + fit["parking"] + 0.5 * fit["study"] + 0.5 * fit["puja"] + 3 * fit["elder_ground"]
    learned = sum(prefs.get(k, 0.0) * f[k] for k in FEATURES)
    total = fit_score + 1.5 * f["proportion"] + 1.5 * tradition_score + learned - 0.15 * warnings - 0.2 * len(c["layout"]["dropped"])
    return {"total": round(total, 3), "brief_fit": fit, "features": {k: round(v, 3) for k, v in f.items()},
            "learned": round(learned, 3), "tradition": tradition_score}


def update(prefs: Dict[str, float], kept: List[Dict[str, float]], discarded: List[Dict[str, float]]) -> Dict[str, float]:
    """Moves weights toward the mean features of kept options and away from discarded ones."""
    if not kept or not discarded:
        return prefs
    out = dict(prefs)
    for k in FEATURES:
        pos = sum(f[k] for f in kept) / len(kept)
        neg = sum(f[k] for f in discarded) / len(discarded)
        out[k] = round(max(-3.0, min(3.0, out.get(k, 0.0) + LR * (pos - neg))), 3)
    return out
