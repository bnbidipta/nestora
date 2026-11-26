"""
Photoreal renders for chosen designs, in one batch on Kaggle's free GPU:
  1. houses whose metadata.render.status is "queued" (Supabase houses table)
  2. export each house for Blender (scripts/export_house_scene.mts, via the public API)
  3. new version of the private dataset nestora-renders, run the kernel nestora-render, wait, download
  4. upload the photo (AI repaint, else the Blender render) to the public Supabase Storage bucket "renders"
  5. mark the house done, only if its render key is unchanged (the user may have edited it meanwhile)

Reads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from backend/.env and the Kaggle token from ~/.kaggle/access_token.
Never prints secrets. Run from the repo root:  python scripts/render_batch.py [--limit 10] [--api URL]
ponytail: run by hand (or a scheduled GitHub Action later); read-modify-write of the twin JSON, last writer wins
for the render field only.
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import sys
import time

import httpx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "kaggle", "nestora-renders")
KERNEL = os.path.join(ROOT, "backend", "ml", "kaggle", "render")
OUT = os.path.join(ROOT, "data", "kaggle", "render-out")


def env():
    for line in open(os.path.join(ROOT, "backend", ".env"), encoding="utf-8"):
        if "=" in line and not line.startswith("#"):
            k, v = line.strip().split("=", 1)
            os.environ.setdefault(k, v.strip().strip('"'))
    os.environ.setdefault("KAGGLE_API_TOKEN", open(os.path.expanduser("~/.kaggle/access_token")).read().strip())
    return os.environ["SUPABASE_URL"].rstrip("/"), os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def kaggle(*args, cwd=None):
    r = subprocess.run([sys.executable, "-c", "from kaggle.cli import main; import sys; sys.argv=['kaggle']+sys.argv[1:]; main()", *args],
                       cwd=cwd, capture_output=True, text=True, encoding="utf-8", timeout=600)
    return (r.stdout + r.stderr).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=10)
    ap.add_argument("--api", default="https://nestora-api-vpia.onrender.com")
    a = ap.parse_args()
    url, key = env()
    db = httpx.Client(base_url=f"{url}/rest/v1", headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=30)
    rows = db.get("/houses", params={"select": "id,twin", "twin->metadata->render->>status": "eq.queued", "limit": a.limit}).raise_for_status().json()
    if not rows:
        print("nothing queued")
        return
    keys = {r["id"]: r["twin"]["metadata"]["render"]["key"] for r in rows}
    print(f"{len(rows)} queued:", ", ".join(keys))

    # 2. fresh dataset folder: the render script plus one folder per queued house
    for d in glob.glob(os.path.join(DATA, "nest_*")):
        shutil.rmtree(d)
    shutil.copy(os.path.join(ROOT, "scripts", "blender", "render_house.py"), DATA)
    subprocess.run(["node", "scripts/export_house_scene.mts", *keys, "--api", a.api, "--out", DATA], cwd=ROOT, check=True)

    # 3. Kaggle: dataset version, wait until ready, run, wait until done, download
    print(kaggle("datasets", "version", "-p", ".", "-m", f"batch {time.strftime('%Y-%m-%d %H:%M')}", "-r", "zip", cwd=DATA)[-200:])
    while "ready" not in kaggle("datasets", "status", "bnbidipta/nestora-renders").lower():
        time.sleep(20)
    print(kaggle("kernels", "push", "-p", ".", cwd=KERNEL)[-200:])
    time.sleep(60)
    while True:
        s = kaggle("kernels", "status", "bnbidipta/nestora-render")
        if any(w in s.lower() for w in ("complete", "error", "cancel")):
            break
        time.sleep(45)
    print(s)
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT)
    kaggle("kernels", "output", "bnbidipta/nestora-render", "-p", OUT)

    # 4-5. upload and mark done
    store = httpx.Client(base_url=f"{url}/storage/v1", headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=120)
    store.post("/bucket", json={"id": "renders", "name": "renders", "public": True})  # no-op if it exists
    for hid, rkey in keys.items():
        photo = os.path.join(OUT, hid, f"{hid}_photo.jpg")
        src = photo if os.path.exists(photo) else os.path.join(OUT, hid, f"{hid}_full.png")
        if not os.path.exists(src):
            print(hid, "no render produced")
            continue
        path = f"{hid}/{rkey}{os.path.splitext(src)[1]}"
        with open(src, "rb") as f:
            store.post(f"/object/renders/{path}", content=f.read(),
                       headers={"Content-Type": "image/jpeg" if src.endswith(".jpg") else "image/png", "x-upsert": "true"}).raise_for_status()
        public = f"{url}/storage/v1/object/public/renders/{path}"
        cur = db.get("/houses", params={"select": "twin", "id": f"eq.{hid}"}).raise_for_status().json()[0]["twin"]
        if (cur["metadata"].get("render") or {}).get("key") != rkey:
            print(hid, "changed since queued; it will render in the next batch")
            continue
        cur["metadata"]["render"] = {"status": "done", "key": rkey, "photo": public, "ai": src == photo, "at": time.time()}
        db.patch("/houses", params={"id": f"eq.{hid}"}, json={"twin": cur}).raise_for_status()
        print(hid, "done ->", public)


if __name__ == "__main__":
    main()
