"""
Photoreal pictures of a chosen design, on demand.

The browser sends a street-view snapshot of its own 3D model (the exact house); a GPU service (Modal, see
backend/ml/modal/repaint.py) repaints it into a photo with a fast SDXL model guided by the snapshot's edges, and
rejects results that change the house's shape. The photo goes to Supabase Storage (bucket "renders") and the
house's metadata.render. Without the GPU service configured, or if it fails, the design stays queued for the
Kaggle batch (scripts/render_batch.py).

Config (env): PHOTO_GPU_URL (the Modal endpoint), PHOTO_GPU_KEY / PHOTO_GPU_SECRET (Modal proxy-auth token).
"""
import logging
import os
import time
from typing import Any, Dict, Optional

import httpx

log = logging.getLogger(__name__)
GPU_URL = os.environ.get("PHOTO_GPU_URL", "")
NEG = ("3d render, cgi, plastic, clay model, video game, cartoon, illustration, painting, drawing, flat colours, distorted, "
       "warped walls, extra floors, people, cars, text, watermark, signature, logo, letters, blurry")


def words(x: Any) -> str:
    return x.replace("_", " ") if isinstance(x, str) else ""


def prompt_for(look: Dict[str, Any]) -> str:
    """The photo prompt from the design's style and exterior choices."""
    ex = look.get("exterior") or {}
    walls = ex.get("wall") or []
    wall = f"{words(walls[0])} ground floor" if walls else "plastered walls"
    if len(walls) > 1 and walls[1] != walls[0]:
        wall += f", {words(walls[1])} upper floor"
    roof = ("flat roof terrace with parapet" if ex.get("roof_material") in (None, "concrete_flat", "green_roof")
            else f"{words(ex.get('roof_material'))} pitched roof")
    return (f"DSLR photograph of a {words(look.get('style', 'contemporary'))} style house in India, {wall}, {roof}, "
            f"{words(ex.get('window'))} windows with {words(ex.get('frame'))} frames, {words(ex.get('entrance'))}, "
            f"{words(ex.get('boundary'))}, golden hour sunlight, mature trees and shrubs, landscaped front garden, potted plants, "
            "blue sky with soft clouds, weathered realistic materials, photorealistic, sharp focus")


def _store() -> Optional[httpx.Client]:
    url, key = os.environ.get("SUPABASE_URL", "").rstrip("/"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not (url and key):
        return None
    return httpx.Client(base_url=f"{url}/storage/v1", headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=60)


def upload(path: str, data: bytes, content_type: str) -> Optional[str]:
    """Stores a file in the public "renders" bucket; returns its public URL (None in file/dev mode)."""
    s = _store()
    if not s:
        return None
    with s:
        s.post("/bucket", json={"id": "renders", "name": "renders", "public": True})  # no-op once it exists
        s.post(f"/object/renders/{path}", content=data, headers={"Content-Type": content_type, "x-upsert": "true"}).raise_for_status()
    return f"{os.environ['SUPABASE_URL'].rstrip('/')}/storage/v1/object/public/renders/{path}"


def repaint(guide_png: bytes, prompt: str) -> Optional[bytes]:
    """Asks the GPU service for a photo; None if it isn't configured, fails, or the shape check rejected it."""
    if not GPU_URL:
        return None
    headers = {}
    if os.environ.get("PHOTO_GPU_KEY"):
        headers = {"Modal-Key": os.environ["PHOTO_GPU_KEY"], "Modal-Secret": os.environ.get("PHOTO_GPU_SECRET", "")}
    try:
        r = httpx.post(GPU_URL, files={"guide": ("guide.png", guide_png, "image/png")}, data={"prompt": prompt, "negative": NEG},
                       headers=headers, timeout=180)
        if r.status_code == 200 and r.headers.get("content-type", "").startswith("image/"):
            return r.content
        log.warning("photo GPU returned %s", r.status_code)
    except Exception:
        log.warning("photo GPU call failed", exc_info=True)
    return None


def make_photo(house_id: str, key: str, guide_png: bytes) -> None:
    """Background job: repaint, store, and record on the house if it is still the same design (same render key)."""
    from backend.app.services.repository import HouseTwinRepository
    twin = HouseTwinRepository.get(house_id)
    if not twin:
        return
    photo = repaint(guide_png, prompt_for(twin.metadata.get("look") or {}))
    if photo is None:
        _set(house_id, key, {"status": "queued", "key": key, "fallback": True})  # the Kaggle batch picks it up
        return
    url = upload(f"{house_id}/{key}.jpg", photo, "image/jpeg")
    _set(house_id, key, {"status": "done", "key": key, "photo": url, "ai": True, "at": time.time()})


def _set(house_id: str, key: str, render: Dict[str, Any]) -> None:
    from backend.app.services.repository import HouseTwinRepository
    twin = HouseTwinRepository.get(house_id)
    if twin and (twin.metadata.get("render") or {}).get("key") == key:  # skip if the design changed meanwhile
        twin.metadata["render"] = {**twin.metadata.get("render", {}), **render}
        HouseTwinRepository.save(twin)
