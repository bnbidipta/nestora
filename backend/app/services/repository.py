"""
House Twin Repository - Section 4 of Nestora Brief.
Provides file-backed JSON document persistence and microsecond in-memory caching.
Zero external database required for Phase 1 local development.
"""
import os
import json
import re
from typing import Optional, Dict, List
from threading import Lock
from backend.app.models.twin import HouseTwin

# NESTORA_STORAGE_DIR lets tests and the benchmark write somewhere other than real-user storage.
STORAGE_DIR = os.environ.get(
    "NESTORA_STORAGE_DIR",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "storage", "houses"),
)
os.makedirs(STORAGE_DIR, exist_ok=True)

# Thread-safe lock for atomic file operations
_LOCK = Lock()
_CACHE: Dict[str, HouseTwin] = {}


class HouseTwinRepository:
    @staticmethod
    def _sanitize_id(house_id: str) -> str:
        """Sanitizes house_id to prevent path traversal injection."""
        if not re.match(r"^[a-zA-Z0-9_\-]+$", house_id):
            raise ValueError(f"Invalid house_id format: '{house_id}'")
        return house_id

    @classmethod
    def save(cls, twin: HouseTwin) -> HouseTwin:
        sanitized_id = cls._sanitize_id(twin.house_id)
        file_path = os.path.join(STORAGE_DIR, f"{sanitized_id}.json")
        
        with _LOCK:
            _CACHE[sanitized_id] = twin
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(twin.model_dump_json(indent=2))
                
        return twin

    @classmethod
    def get(cls, house_id: str) -> Optional[HouseTwin]:
        sanitized_id = cls._sanitize_id(house_id)
        
        with _LOCK:
            if sanitized_id in _CACHE:
                return _CACHE[sanitized_id]
                
            file_path = os.path.join(STORAGE_DIR, f"{sanitized_id}.json")
            if not os.path.exists(file_path):
                return None
                
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                twin = HouseTwin(**data)
                _CACHE[sanitized_id] = twin
                return twin

    @classmethod
    def delete(cls, house_id: str) -> bool:
        sanitized_id = cls._sanitize_id(house_id)
        file_path = os.path.join(STORAGE_DIR, f"{sanitized_id}.json")
        
        with _LOCK:
            if sanitized_id in _CACHE:
                del _CACHE[sanitized_id]
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        return False

    @classmethod
    def list_all(cls) -> List[str]:
        with _LOCK:
            return [f[:-5] for f in os.listdir(STORAGE_DIR) if f.endswith(".json")]
