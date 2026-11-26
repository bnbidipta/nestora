"""
House Twin repository: the single place that persists House Twins.

Two backends, chosen by environment:
- Supabase Postgres (houses / house_versions tables) when SUPABASE_URL and
  SUPABASE_SERVICE_ROLE_KEY are set: production.
- JSON files under STORAGE_DIR otherwise: tests, the benchmark and offline dev.

Ownership (owner_id, edit-token hash) lives only in Postgres. In file mode there is
no ownership, so every house is editable (dev only).
"""
import hashlib
import json
import os
import re
from threading import Lock
from typing import Any, Dict, List, Optional

import httpx

from backend.app.models.twin import HouseTwin

# NESTORA_STORAGE_DIR lets tests and the benchmark write somewhere other than real-user storage.
STORAGE_DIR = os.environ.get(
    "NESTORA_STORAGE_DIR",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "storage", "houses"),
)
os.makedirs(STORAGE_DIR, exist_ok=True)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
# The benchmark flips this off so eval houses never reach the real database.
USE_SUPABASE = bool(SUPABASE_URL and _SERVICE_KEY)

_LOCK = Lock()
_CACHE: Dict[str, HouseTwin] = {}  # file mode only


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _rest() -> httpx.Client:
    return httpx.Client(
        base_url=f"{SUPABASE_URL}/rest/v1",
        headers={"apikey": _SERVICE_KEY, "Authorization": f"Bearer {_SERVICE_KEY}"},
        timeout=15.0,
    )


class HouseTwinRepository:
    @staticmethod
    def _sanitize_id(house_id: str) -> str:
        """Rejects anything but [A-Za-z0-9_-] (blocks path traversal and filter injection)."""
        if not re.match(r"^[a-zA-Z0-9_\-]{1,64}$", house_id):
            raise ValueError(f"Invalid house_id format: '{house_id}'")
        return house_id

    # ---- public API -----------------------------------------------------------

    @classmethod
    def create(cls, twin: HouseTwin, edit_token: Optional[str] = None) -> HouseTwin:
        """First save of a new house. The edit token lets an anonymous creator modify it."""
        hid = cls._sanitize_id(twin.house_id)
        if not USE_SUPABASE:
            if edit_token:  # same access model as Supabase: hash in a sidecar file
                with open(os.path.join(STORAGE_DIR, f"{hid}.access"), "w", encoding="utf-8") as f:
                    json.dump({"owner_id": None, "edit_token_hash": hash_token(edit_token)}, f)
            return cls._file_save(twin)
        row = {"id": hid, "status": twin.status, "twin": json.loads(twin.model_dump_json())}
        if edit_token:
            row["edit_token_hash"] = hash_token(edit_token)
        with _rest() as c:
            c.post("/houses", json=row).raise_for_status()
        return twin

    @classmethod
    def save(cls, twin: HouseTwin) -> HouseTwin:
        hid = cls._sanitize_id(twin.house_id)
        if not USE_SUPABASE:
            return cls._file_save(twin)
        payload = json.loads(twin.model_dump_json())
        with _rest() as c:
            # Keep the previous twin as a version before overwriting it.
            prev = c.get("/houses", params={"id": f"eq.{hid}", "select": "twin"}).raise_for_status().json()
            if prev:
                last = c.get(
                    "/house_versions",
                    params={"house_id": f"eq.{hid}", "select": "version", "order": "version.desc", "limit": "1"},
                ).raise_for_status().json()
                c.post(
                    "/house_versions",
                    json={"house_id": hid, "version": (last[0]["version"] + 1) if last else 1, "twin": prev[0]["twin"]},
                ).raise_for_status()
                c.patch("/houses", params={"id": f"eq.{hid}"}, json={"twin": payload, "status": twin.status}).raise_for_status()
            else:
                c.post("/houses", json={"id": hid, "twin": payload, "status": twin.status}).raise_for_status()
        return twin

    @classmethod
    def get(cls, house_id: str) -> Optional[HouseTwin]:
        hid = cls._sanitize_id(house_id)
        if not USE_SUPABASE:
            return cls._file_get(hid)
        with _rest() as c:
            rows = c.get("/houses", params={"id": f"eq.{hid}", "select": "twin"}).raise_for_status().json()
        return HouseTwin(**rows[0]["twin"]) if rows else None

    @classmethod
    def get_access(cls, house_id: str) -> Optional[Dict[str, Any]]:
        """{'owner_id', 'edit_token_hash'} for a house, or None in file mode / when missing."""
        hid = cls._sanitize_id(house_id)
        if not USE_SUPABASE:
            path = os.path.join(STORAGE_DIR, f"{hid}.access")
            if not os.path.exists(path):
                return None
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        with _rest() as c:
            rows = c.get(
                "/houses", params={"id": f"eq.{hid}", "select": "owner_id,edit_token_hash"}
            ).raise_for_status().json()
        return rows[0] if rows else None

    @classmethod
    def claim(cls, house_id: str, user_id: str) -> None:
        """Attach an anonymous house to a signed-in user and stop it expiring."""
        hid = cls._sanitize_id(house_id)
        if not USE_SUPABASE:
            return
        with _rest() as c:
            c.patch(
                "/houses",
                params={"id": f"eq.{hid}", "owner_id": "is.null"},
                json={"owner_id": user_id, "edit_token_hash": None, "expires_at": None},
            ).raise_for_status()

    @classmethod
    def delete(cls, house_id: str) -> bool:
        hid = cls._sanitize_id(house_id)
        if not USE_SUPABASE:
            return cls._file_delete(hid)
        with _rest() as c:
            r = c.delete("/houses", params={"id": f"eq.{hid}"}, headers={"Prefer": "return=representation"})
            r.raise_for_status()
            return bool(r.json())

    @classmethod
    def add_waitlist(cls, kind: str, email: Optional[str] = None, city: Optional[str] = None,
                     house_id: Optional[str] = None, user_id: Optional[str] = None,
                     topic: Optional[str] = None, message: Optional[str] = None) -> None:
        if not USE_SUPABASE:
            return  # ponytail: file mode drops leads; dev only
        row = {"kind": kind, "email": email, "city": city, "house_id": house_id, "user_id": user_id, "topic": topic, "message": message}
        with _rest() as c:
            c.post("/waitlist", json={k: v for k, v in row.items() if v is not None}).raise_for_status()

    @classmethod
    def list_all(cls) -> List[str]:
        if not USE_SUPABASE:
            with _LOCK:
                return [f[:-5] for f in os.listdir(STORAGE_DIR) if f.endswith(".json")]
        with _rest() as c:
            return [r["id"] for r in c.get("/houses", params={"select": "id"}).raise_for_status().json()]

    # ---- file backend ---------------------------------------------------------

    @classmethod
    def _file_save(cls, twin: HouseTwin) -> HouseTwin:
        path = os.path.join(STORAGE_DIR, f"{twin.house_id}.json")
        with _LOCK:
            _CACHE[twin.house_id] = twin
            tmp = path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                f.write(twin.model_dump_json(indent=2))
            os.replace(tmp, path)  # atomic: a crash mid-write can't corrupt the house
        return twin

    @classmethod
    def _file_get(cls, hid: str) -> Optional[HouseTwin]:
        with _LOCK:
            if hid in _CACHE:
                return _CACHE[hid]
            path = os.path.join(STORAGE_DIR, f"{hid}.json")
            if not os.path.exists(path):
                return None
            with open(path, "r", encoding="utf-8") as f:
                twin = HouseTwin(**json.load(f))
            _CACHE[hid] = twin
            return twin

    @classmethod
    def _file_delete(cls, hid: str) -> bool:
        path = os.path.join(STORAGE_DIR, f"{hid}.json")
        with _LOCK:
            _CACHE.pop(hid, None)
            if os.path.exists(path):
                os.remove(path)
                return True
        return False
