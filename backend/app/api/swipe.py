"""
Taste swipes: 54 photo cards (Unsplash, credited) with 9 taste attributes each.
Model: Beta(likes+1, passes+1) per card style, dwell-weighted, plus a running attribute vector.
Stops early once one style clearly leads (>= 10 swipes and a 0.25 lead), at most 24 swipes.
"""
import json
import os
import random
from functools import cache
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.app.models.twin import SwipeRecord
from backend.app.services.access import require_edit
from backend.app.services.repository import HouseTwinRepository

router = APIRouter(prefix="/api/v1", tags=["Swipe"])
MIN_SWIPES, MAX_SWIPES, LEAD = 10, 24, 0.25
# card style -> catalogue styles (data/styles.json) it is evidence for
CATALOGUE = {"japanese": ["japandi", "japanese"], "biophilic": ["biophilic", "tropical_modernism"], "brutalist": ["brutalist"],
             "minimalist": ["minimalist"], "indian_heritage": ["old_world_heritage", "chettinad"], "scandinavian": ["scandinavian"],
             "mediterranean": ["mediterranean"], "industrial": ["industrial"]}


@cache
def cards() -> List[Dict[str, Any]]:
    with open(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "swipe_cards.json"), encoding="utf-8") as f:
        return json.load(f)


def _by_id() -> Dict[str, Dict[str, Any]]:
    return {c["id"]: c for c in cards()}


def taste(history: List[SwipeRecord]) -> Dict[str, Any]:
    styles = {s: [1.0, 1.0] for s in CATALOGUE}
    attrs: Dict[str, float] = {}
    wsum = 0.0
    for h in history:
        c = _by_id().get(h.card_id)
        if not c:
            continue
        w = 1.5 if h.dwell_ms >= 3000 else 1.0
        like = h.direction == "right"
        if c["style"] in styles:
            styles[c["style"]][0 if like else 1] += w
        for k, v in c["attributes"].items():
            attrs[k] = attrs.get(k, 0.0) + (v if like else -v) * w
        wsum += w
    means = sorted(((s, a / (a + b)) for s, (a, b) in styles.items()), key=lambda x: -x[1])
    n = len(history)
    done = n >= MAX_SWIPES or (n >= MIN_SWIPES and means[0][1] - means[1][1] >= LEAD)
    top = [x for s, _ in means[:2] for x in CATALOGUE[s][:1]]
    return {"style_scores": {s: round(m, 3) for s, m in means}, "attributes": {k: round(v / wsum, 3) for k, v in attrs.items()} if wsum else {},
            "recommended_styles": top, "done": done, "swipes": n, "confidence": round(means[0][1] - means[1][1], 3)}


@router.get("/swipe/cards")
def get_cards(seed: Optional[int] = None):
    """Round-robin across styles so early swipes cover every style."""
    rng = random.Random(seed)
    by_style: Dict[str, List[Dict[str, Any]]] = {}
    for c in cards():
        by_style.setdefault(c["style"], []).append(c)
    for v in by_style.values():
        rng.shuffle(v)
    order, keys = [], list(by_style)
    rng.shuffle(keys)
    while any(by_style.values()):
        for k in keys:
            if by_style[k]:
                order.append(by_style[k].pop())
    return {"cards": order, "min_swipes": MIN_SWIPES, "max_swipes": MAX_SWIPES}


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
    if brief is not None and t["done"] and not brief.get("styles_locked"):
        brief["styles"] = t["recommended_styles"]
    HouseTwinRepository.save(twin)
    return {"success": True, **t}
