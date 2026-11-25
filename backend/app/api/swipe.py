"""
"Find my style": real photos of each catalogue style (Wikimedia Commons, free licences, credited in style_photos.json).
Model: Beta(likes+1, passes+1) per style, dwell-weighted. When the user already picked styles, the deck shows only those
styles, so the swipes rank their own picks. Stops early once one style clearly leads (>= 10 swipes and a 0.25 lead),
at most 24 swipes.
"""
import json
import os
import random
from functools import cache
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.app.models.twin import SwipeRecord
from backend.app.services import derive
from backend.app.services.access import require_edit
from backend.app.services.repository import HouseTwinRepository

router = APIRouter(prefix="/api/v1", tags=["Swipe"])
MIN_SWIPES, MAX_SWIPES, LEAD = 10, 24, 0.25
PHOTOS = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "style_photos.json")


@cache
def photos() -> Dict[str, List[Dict[str, Any]]]:
    if not os.path.exists(PHOTOS):
        return {}
    with open(PHOTOS, encoding="utf-8") as f:
        return {k: v for k, v in json.load(f).items() if v}


@cache
def cards() -> List[Dict[str, Any]]:
    cat = derive.styles()
    out = []
    for st, ps in photos().items():
        if st not in cat:
            continue
        for i, p in enumerate(ps, 1):
            out.append({"id": f"{st}_{i}", "file": p["file"], "deck": "style", "style": st, "style_name": cat[st]["name"],
                        "alt": f"{cat[st]['name']}: {p['title'].removeprefix('File:').rsplit('.', 1)[0]}"[:160],
                        "author": p["author"], "url": p["page"], "licence": p["licence"]})
    return out


def _by_id() -> Dict[str, Dict[str, Any]]:
    return {c["id"]: c for c in cards()}


def taste(history: List[SwipeRecord]) -> Dict[str, Any]:
    styles: Dict[str, List[float]] = {}
    for h in history:
        c = _by_id().get(h.card_id)
        if not c:
            continue
        w = 1.5 if h.dwell_ms >= 3000 else 1.0
        ab = styles.setdefault(c["style"], [1.0, 1.0])
        ab[0 if h.direction == "right" else 1] += w
    means = sorted(((s, a / (a + b)) for s, (a, b) in styles.items()), key=lambda x: -x[1]) or [("", 0.5)]
    second = means[1][1] if len(means) > 1 else 0.5
    n = len(history)
    done = n >= MAX_SWIPES or (n >= MIN_SWIPES and means[0][1] - second >= LEAD)
    top = [s for s, m in means[:2] if s and m > 0.5]
    return {"style_scores": {s: round(m, 3) for s, m in means if s}, "recommended_styles": top, "done": done, "swipes": n,
            "confidence": round(means[0][1] - second, 3)}


@router.get("/swipe/cards")
def get_cards(seed: Optional[int] = None, styles: str = ""):
    """Photos of the given styles (comma-separated), or of every style; round-robin so early swipes cover each style."""
    want = {s for s in styles.split(",") if s}
    rng = random.Random(seed)
    by_style: Dict[str, List[Dict[str, Any]]] = {}
    for c in cards():
        if not want or c["style"] in want:
            by_style.setdefault(c["style"], []).append(c)
    for v in by_style.values():
        rng.shuffle(v)
    order, keys = [], list(by_style)
    rng.shuffle(keys)
    while any(by_style.values()):
        for k in keys:
            if by_style[k]:
                order.append(by_style[k].pop())
    return {"cards": order, "min_swipes": min(MIN_SWIPES, len(order)), "max_swipes": min(MAX_SWIPES, len(order))}


class SwipeInput(BaseModel):
    card_id: str = Field(max_length=60)
    direction: str = Field(pattern="^(left|right)$")
    dwell_ms: int = Field(default=2000, ge=0, le=600_000)


@router.post("/house/{house_id}/swipe")
def register_swipe(house_id: str, swipe: SwipeInput, _user: Optional[str] = Depends(require_edit)):
    twin = HouseTwinRepository.get(house_id)
    if not twin:
        raise HTTPException(status_code=404, detail="House not found.")
    card = _by_id().get(swipe.card_id)
    if not card:
        raise HTTPException(status_code=400, detail="Unknown card.")
    if len(twin.swipe_history) >= 80:
        raise HTTPException(status_code=429, detail="Too many swipes for one house.")
    twin.swipe_history.append(SwipeRecord(card_id=swipe.card_id, deck=card["deck"], direction=swipe.direction, dwell_ms=swipe.dwell_ms))
    t = taste(twin.swipe_history)
    twin.metadata["taste"] = t
    brief = twin.metadata.get("brief")
    if brief is not None and t["done"] and t["recommended_styles"]:
        picked = brief.get("styles") or []
        # hand-picked styles are ranked by the swipes (liked ones first), never replaced by styles the user didn't pick
        brief["styles"] = ([s for s in t["recommended_styles"] if s in picked] + [s for s in picked if s not in t["recommended_styles"]]) \
            if brief.get("styles_locked") else t["recommended_styles"]
    HouseTwinRepository.save(twin)
    return {"success": True, **t}
