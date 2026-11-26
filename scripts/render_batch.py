"""
The slow, free fallback for photoreal pictures: designs whose user asked for a photo while the fast GPU service was
off or busy (metadata.render: status "queued", fallback true, guide = the browser's street-view snapshot).
  1. fetch those houses from Supabase; download each snapshot; write the prompt (backend photo.prompt_for)
  2. new version of the private dataset nestora-renders, run the kernel nestora-render, wait, download
  3. upload each photo to the public Supabase Storage bucket "renders"
  4. mark the house done, only if its render key is unchanged (the user may have edited it meanwhile)

Reads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from backend/.env and the Kaggle token from ~/.kaggle/access_token.
Never prints secrets. Run from the repo root:  python scripts/render_batch.py [--limit 10]
ponytail: run by hand (or a scheduled GitHub Action later); read-modify-write of the twin JSON, last writer wins
for the render field only.
"""
import argparse
import glob
import os
import shutil
import subprocess
import sys
import time

import httpx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
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
    from backend.app.services import photo  # one prompt and negative list for both GPU paths
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=10)
    a = ap.parse_args()
    url, key = env()
    db = httpx.Client(base_url=f"{url}/rest/v1", headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=30)
    rows = db.get("/houses", params={"select": "id,twin", "twin->metadata->render->>status": "eq.queued",
                                     "twin->metadata->render->>fallback": "eq.true", "limit": a.limit}).raise_for_status().json()
    rows = [r for r in rows if (r["twin"]["metadata"]["render"] or {}).get("guide")]
    if not rows:
        print("nothing queued")
        return
    keys = {r["id"]: r["twin"]["metadata"]["render"]["key"] for r in rows}
    print(f"{len(rows)} queued:", ", ".join(keys))

    for d in glob.glob(os.path.join(DATA, "nest_*")):
        shutil.rmtree(d)
    os.makedirs(DATA, exist_ok=True)
    open(os.path.join(DATA, "negative.txt"), "w", encoding="utf-8").write(photo.NEG)
    for r in rows:
        d = os.path.join(DATA, r["id"])
        os.makedirs(d)
        m = r["twin"]["metadata"]
        open(os.path.join(d, "guide.png"), "wb").write(httpx.get(m["render"]["guide"], timeout=60).raise_for_status().content)
        open(os.path.join(d, "prompt.txt"), "w", encoding="utf-8").write(photo.prompt_for(m.get("look") or {}))

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

    for hid, rkey in keys.items():
        src = os.path.join(OUT, hid, f"{hid}_photo.jpg")
        if not os.path.exists(src):
            print(hid, "no photo (shape check failed or the run errored)")
            continue
        public = photo.upload(f"{hid}/{rkey}.jpg", open(src, "rb").read(), "image/jpeg")
        cur = db.get("/houses", params={"select": "twin", "id": f"eq.{hid}"}).raise_for_status().json()[0]["twin"]
        if (cur["metadata"].get("render") or {}).get("key") != rkey:
            print(hid, "changed since it was queued; skipped")
            continue
        cur["metadata"]["render"] = {"status": "done", "key": rkey, "photo": public, "ai": True, "at": time.time()}
        db.patch("/houses", params={"id": f"eq.{hid}"}, json={"twin": cur}).raise_for_status()
        print(hid, "done ->", public)


if __name__ == "__main__":
    main()
