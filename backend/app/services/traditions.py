"""
Tradition packs (Vaastu, Feng Shui, Islamic, ...): soft/strict placement rules scored on a candidate layout.
Building code always wins: traditions only rank candidates (soft) or veto them (strict, core rules only).
Fixture-level rules (bed headboard, stair turning) can't be judged on a concept plan and are reported as such.
"""
import json
import os
from functools import cache
from typing import Any, Dict, List

from backend.app.services.generator import compass

DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "traditions")
WEIGHT = {"core": 1.0, "common": 0.6, "minor": 0.3}
TYPE_ALIASES = {"staircase": ("stair",), "entrance": ("entrance", "porch"), "bedroom": ("bedroom", "bedroom_master", "bedroom_elder"),
                "living": ("living", "lounge"), "toilet": ("toilet",), "hearth": ("kitchen",)}


@cache
def packs() -> Dict[str, Dict[str, Any]]:
    out = {}
    for f in sorted(os.listdir(DIR)):
        with open(os.path.join(DIR, f), encoding="utf-8") as fh:
            p = json.load(fh)
        out[p["tradition"]] = p
    return out


def _types(name: str) -> tuple:
    return TYPE_ALIASES.get(name, (name,))


def _touch(a: Dict[str, Any], b: Dict[str, Any]) -> bool:
    """Rooms on the same floor sharing a wall segment longer than 0.3 m."""
    if a["floor"] != b["floor"]:
        return False
    ox = min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"])
    oy = min(a["y"] + a["d"], b["y"] + b["d"]) - max(a["y"], b["y"])
    return (abs(ox) < 1e-3 and oy > 0.3) or (abs(oy) < 1e-3 and ox > 0.3)


def evaluate(cand: Dict[str, Any], facing: str, chosen: Dict[str, str]) -> Dict[str, Any]:
    """Scores every active pack. Returns per-pack score in [-1, 1], findings, and whether a strict pack vetoes."""
    env = cand["envelope"]
    rooms = cand["layout"]["rooms"]
    for rm in rooms:
        rm["compass"] = compass(rm, env, facing)
    result: Dict[str, Any] = {"packs": {}, "veto": False, "score": 0.0}
    active = [(k, v) for k, v in chosen.items() if v != "off" and k in packs()]
    for name, mode in active:
        got, total = 0.0, 0.0
        findings: List[Dict[str, Any]] = []
        for rule in packs()[name]["rules"]:
            kind, val = rule["kind"], rule["value"]
            w = WEIGHT.get(rule.get("strength"), 0.5)
            targets = [r for r in rooms if r["type"] in _types(rule["applies_to"])]
            outcome = None  # 1 satisfied, 0.5 acceptable, -1 violated, None not evaluated
            if kind in ("zone", "avoid_zone") and targets:
                secs = {r["compass"] for r in targets}
                if secs & set(val.get("avoid", [])):
                    outcome = -1
                elif secs & set(val.get("preferred", [])):
                    outcome = 1
                elif secs & set(val.get("acceptable", [])):
                    outcome = 0.5
                elif kind == "zone":
                    outcome = 0  # neither preferred nor avoided
            elif kind == "centre_open":
                banned = {t for a in val.get("avoid", []) for t in _types(a)}
                outcome = -1 if any(r["compass"] == "CENTRE" and r["type"] in banned for r in rooms) else 1
            elif kind == "avoid_adjacency" and targets:
                banned = {t for a in val.get("avoid", []) for t in _types(a)}
                outcome = -1 if any(_touch(t, o) for t in targets for o in rooms if o["type"] in banned) else 1
            elif kind == "adjacency" and targets and val.get("must_touch"):
                need = {t for a in val["must_touch"] for t in _types(a)}
                outcome = 1 if any(_touch(t, o) for t in targets for o in rooms if o["type"] in need) else -1
            elif kind == "facing" and rule["applies_to"] == "entrance":
                outcome = -1 if facing in val.get("avoid", []) else 1 if facing in val.get("preferred", []) else 0.5 if facing in val.get("acceptable", []) else 0
            if outcome is None:
                findings.append({"rule": rule["id"], "status": "not_checked", "why": "Needs fixture-level detail or a room this plan doesn't have."})
                continue
            total += w
            got += w * outcome
            status = "satisfied" if outcome >= 1 else "partial" if outcome > 0 else "neutral" if outcome == 0 else "violated"
            findings.append({"rule": rule["id"], "status": status, "why": rule.get("rationale", "")})
            if outcome < 0 and mode == "strict" and rule.get("strength") == "core":
                result["veto"] = True
        score = got / total if total else 0.0
        result["packs"][name] = {"mode": mode, "score": round(score, 2), "verified": packs()[name].get("verified", False), "findings": findings}
        result["score"] += score * (2.0 if mode == "strict" else 1.0)
    if active:
        result["score"] = round(result["score"] / len(active), 3)
    return result


SECTOR_VEC = {"N": (0, 1), "NE": (1, 1), "E": (1, 0), "SE": (1, -1), "S": (0, -1), "SW": (-1, -1), "W": (-1, 0), "NW": (-1, 1)}


def placement(sector: str, facing: str) -> tuple:
    """Compass sector -> (row, side) on this plot. Rows run front (road) to rear; sides as seen from the road."""
    if sector == "CENTRE":
        return "middle", "centre"
    f = {"N": (0, 1), "E": (1, 0), "S": (0, -1), "W": (-1, 0)}[facing]
    into, sx = (-f[0], -f[1]), SECTOR_VEC[sector]
    right = (into[1], -into[0])
    depth = sx[0] * into[0] + sx[1] * into[1]
    lat = sx[0] * right[0] + sx[1] * right[1]
    return ("rear" if depth > 0 else "front" if depth < 0 else "middle"), ("right" if lat > 0 else "left" if lat < 0 else "centre")


def arrangement_for(facing: str, chosen: Dict[str, str]) -> Dict[str, Any]:
    """An arrangement that puts rooms in their preferred tradition sectors (strict packs first)."""
    zones: Dict[str, str] = {}
    sides: Dict[str, str] = {}
    order = sorted((k for k, v in chosen.items() if v != "off" and k in packs()), key=lambda k: chosen[k] != "strict")
    for name in order:
        for rule in packs()[name]["rules"]:
            if rule["kind"] not in ("zone", "avoid_zone") or not rule["value"].get("preferred"):
                continue
            sector = next((x for x in rule["value"]["preferred"] if x in SECTOR_VEC or x == "CENTRE"), None)
            if not sector:
                continue
            for t in _types(rule["applies_to"]):
                if t in zones or t in ("stair", "porch", "entrance"):
                    continue
                zones[t], sides[t] = placement(sector, facing)
    return {"id": "tradition_" + "_".join(order) if order else "tradition", "zones": zones, "sides": sides}
