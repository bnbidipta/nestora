"""
Sharing with family, and saved versions.
- Vote link: the owner shares a link; anyone with it can heart the current options (no sign-up). Only a hash of the
  link's secret is stored. Each voter is a random id from their browser plus an optional first name they type.
- Versions: every committed change keeps the design it replaced; any version can be restored.
"""
import hashlib
import secrets
import time
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.app.models.brief import Brief
from backend.app.services import orchestrator
from backend.app.services.access import rate_limit, require_edit
from backend.app.services.repository import HouseTwinRepository

router = APIRouter(prefix="/api/v1/house", tags=["Family"])
MAX_VOTERS = 40


def _twin(house_id: str):
    twin = HouseTwinRepository.get(house_id)
    if not twin:
        raise HTTPException(status_code=404, detail="House not found.")
    return twin


def _h(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _tally(vote: dict) -> dict:
    out = {}
    for v in vote.get("voters", {}).values():
        for oid in v["likes"]:
            out.setdefault(oid, []).append(v.get("name") or "Someone")
    return out


@router.post("/{house_id}/vote-link", dependencies=[Depends(rate_limit("vote", 20))])
def make_vote_link(house_id: str, _u: Optional[str] = Depends(require_edit)):
    """A new family vote on the options shown now (replaces any earlier vote)."""
    twin = _twin(house_id)
    opts = twin.metadata.get("options") or []
    if not opts:
        raise HTTPException(status_code=409, detail="Generate options first.")
    token = secrets.token_urlsafe(16)
    twin.metadata["vote"] = {"token_hash": _h(token), "options": [o["id"] for o in opts], "voters": {}, "created": time.time()}
    HouseTwinRepository.save(twin)
    return {"token": token}


def _vote(twin, token: str) -> dict:
    v = twin.metadata.get("vote")
    if not v or not secrets.compare_digest(v["token_hash"], _h(token)):
        raise HTTPException(status_code=403, detail="This voting link is no longer valid.")
    return v


@router.get("/{house_id}/vote", dependencies=[Depends(rate_limit("vote", 60))])
def read_vote(house_id: str, t: str):
    twin = _twin(house_id)
    v = _vote(twin, t)
    opts = [o for o in twin.metadata.get("options") or [] if o["id"] in v["options"]]
    return {"options": opts, "tally": _tally(v)}


class VoteIn(BaseModel):
    token: str = Field(max_length=64)
    voter: str = Field(min_length=8, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    name: str = Field(default="", max_length=30)
    likes: List[str] = Field(default_factory=list, max_length=8)


@router.post("/{house_id}/vote", dependencies=[Depends(rate_limit("vote", 30))])
def cast_vote(house_id: str, body: VoteIn):
    twin = _twin(house_id)
    v = _vote(twin, body.token)
    if body.voter not in v["voters"] and len(v["voters"]) >= MAX_VOTERS:
        raise HTTPException(status_code=429, detail="This vote already has the maximum number of people.")
    v["voters"][body.voter] = {"name": body.name.strip()[:30], "likes": [i for i in body.likes if i in v["options"]], "at": time.time()}
    HouseTwinRepository.save(twin)
    return {"tally": _tally(v)}


@router.get("/{house_id}/votes")
def owner_votes(house_id: str, _u: Optional[str] = Depends(require_edit)):
    v = _twin(house_id).metadata.get("vote")
    return {"tally": _tally(v) if v else {}, "people": len(v["voters"]) if v else 0}


@router.get("/{house_id}/versions")
def versions(house_id: str):
    return {"versions": [{"n": i, "note": x["note"], "at": x["at"]} for i, x in enumerate(_twin(house_id).metadata.get("versions", []))]}


@router.post("/{house_id}/versions/{n}/restore", dependencies=[Depends(rate_limit("edit", 20))])
def restore(house_id: str, n: int, _u: Optional[str] = Depends(require_edit)):
    twin = _twin(house_id)
    vs = twin.metadata.get("versions", [])
    if not 0 <= n < len(vs):
        raise HTTPException(status_code=404, detail="No such version.")
    x = vs[n]
    return orchestrator.commit_edit(house_id, Brief(**x["brief"]), x["cand"], f"Restored: {x['note']}.")
