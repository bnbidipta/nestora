"""
Add AI-generated style images (docs/brand/ai-styles/<style>/<n>.png, made with agy) for styles where no suitable free
photo exists. Each is converted to WebP and listed in style_photos.json, clearly labelled as an AI image.
Real photos stay first; AI images only fill up to TARGET per style. Re-runnable: skips images already added.
"""
import hashlib
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs", "brand", "ai-styles")
META = os.path.join(ROOT, "backend", "app", "data", "style_photos.json")
TARGET = 4

meta = json.load(open(META, encoding="utf-8"))
for st in sorted(os.listdir(SRC)):
    d = os.path.join(SRC, st)
    if not os.path.isdir(d):
        continue
    have = meta.setdefault(st, [])
    known = {p["sha1"] for p in have}
    for f in sorted(os.listdir(d)):
        if not f.endswith(".png") or len(have) >= TARGET:
            continue
        raw = open(os.path.join(d, f), "rb").read()
        sha = hashlib.sha1(raw).hexdigest()
        if sha in known:
            continue
        out = f"/styles/{st}/ai-{f[:-4]}.webp"
        dst = os.path.join(ROOT, "frontend", "public", out.lstrip("/"))
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        im = Image.open(os.path.join(d, f)).convert("RGB")
        im.thumbnail((960, 640))
        im.save(dst, "WEBP", quality=72, method=6)
        have.append({"title": "AI-generated illustration", "page": "", "sha1": sha, "licence": "AI-generated image, illustrative",
                     "licence_url": "", "author": "Nestora (AI-generated)", "query": "ai", "file": out, "ai": True})
        known.add(sha)
    print(st, len(have))
json.dump(meta, open(META, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
