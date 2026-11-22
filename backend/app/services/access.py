"""
Who may change a house.

- Reading a house needs only its id (share links).
- Changing it needs either: the signed-in owner's Supabase access token, or, for an
  unclaimed anonymous house, the edit token issued when it was created.
- In file mode (no Supabase) there is no ownership and everything is allowed (dev only).
"""
import hmac
import os
from typing import Optional

import httpx
from fastapi import Header, HTTPException

from backend.app.services.repository import HouseTwinRepository, hash_token

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")


def user_id_from_token(authorization: Optional[str]) -> Optional[str]:
    """Validates a Supabase access token with the Auth server; returns the user id or None."""
    if not authorization or not authorization.lower().startswith("bearer ") or not SUPABASE_URL:
        return None
    # ponytail: one Auth round-trip per write; verify JWTs locally against JWKS if this gets hot.
    try:
        r = httpx.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"apikey": _ANON_KEY, "Authorization": authorization},
            timeout=10.0,
        )
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Sign-in service unavailable. Try again.")
    return r.json().get("id") if r.status_code == 200 else None


def require_edit(
    house_id: str,
    authorization: Optional[str] = Header(default=None),
    x_edit_token: Optional[str] = Header(default=None),
) -> Optional[str]:
    """FastAPI dependency for write endpoints. Returns the caller's user id (or None)."""
    try:
        access = HouseTwinRepository.get_access(house_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid house id.")
    user_id = user_id_from_token(authorization)
    if access is None:
        if HouseTwinRepository.get(house_id) is None:
            raise HTTPException(status_code=404, detail=f"House '{house_id}' not found.")
        return user_id  # file mode
    if access.get("owner_id"):
        if user_id != access["owner_id"]:
            raise HTTPException(status_code=403, detail="Only the owner can change this house.")
        return user_id
    token_hash = access.get("edit_token_hash")
    if token_hash and x_edit_token and hmac.compare_digest(hash_token(x_edit_token), token_hash):
        return user_id
    raise HTTPException(status_code=403, detail="You don't have permission to change this house.")


# ponytail: in-memory per-IP sliding window, per process. Move to Redis/Upstash if we run several instances.
_HITS: dict = {}


def rate_limit(bucket: str, per_minute: int):
    """FastAPI dependency factory: at most `per_minute` calls per client IP per bucket."""
    import time
    from fastapi import Request

    def dep(request: Request) -> None:
        if os.environ.get("NESTORA_RATE_LIMIT") == "off":  # tests and offline batch jobs
            return
        ip = (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "?")).split(",")[0].strip()
        now = time.time()
        hits = [t for t in _HITS.get((bucket, ip), []) if now - t < 60]
        if len(hits) >= per_minute:
            raise HTTPException(status_code=429, detail="Too many requests. Please wait a minute.")
        hits.append(now)
        _HITS[(bucket, ip)] = hits
        if len(_HITS) > 10000:
            _HITS.clear()

    return dep
