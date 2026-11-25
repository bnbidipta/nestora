"""
Collects openly licensed house photos (Wikimedia Commons, Openverse) to train the house-look model.
Only CC0, public domain, CC BY and CC BY-SA images; author and licence kept per image. Photos go OUTSIDE the repo
(default ../nestora-photos) as 640 px JPEGs with a manifest.jsonl; only the manifest's credits ever enter the repo.
De-duplicated by SHA-1 and a perceptual hash. Re-runnable: skips what it already has.

Usage: python scripts/collect_house_photos.py [--target 15000] [--out DIR]
"""
import argparse
import hashlib
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_style_photos import OK_LICENCE, Q, clean  # noqa: E402


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "NestoraHousePhotos/1.0 (training data for house-style model; contact via project repository)"}
COMMONS = "https://commons.wikimedia.org/w/api.php"
OPENVERSE = "https://api.openverse.org/v1/images/"
# not houses: places of worship, people, drawings, vehicles, monuments, interiors of public buildings
SKIP = re.compile(r"temple|church|mosque|cathedral|chapel|shrine|gopuram|mandir|masjid|dargah|basilica|monastery|statue|idol|"
                  r"portrait|people|wedding|map|plan|drawing|diagram|logo|sketch|painting|stamp|poster|airport|station|mall|car |bus|"
                  r"train|ship|tomb|grave|cemetery|fort |ruins|cave|monument|carving|sculpture|kolam|rangoli|sign|plaque|model|lego|"
                  r"postcard|restaurant|shop|market|mountain|engraving|print|museum|school|college|hospital|office|factory|bridge|palace|mahal|darwaza|gate|lake|valley|hills|panorama|aerial|skyline|landscape|tea garden|taj", re.I)

# Commons house categories (deepcat searches subcategories); Indian regions first, then countries behind the world styles.
REGIONS = ["India", "Kerala", "Tamil Nadu", "Karnataka", "Goa", "Maharashtra", "Gujarat", "Rajasthan", "Punjab, India", "Delhi",
           "Uttar Pradesh", "West Bengal", "Assam", "Odisha", "Telangana", "Andhra Pradesh", "Himachal Pradesh", "Uttarakhand",
           "Sri Lanka", "Bangladesh", "Nepal", "Japan", "South Korea", "China", "Thailand", "Indonesia", "Morocco", "Iran", "Italy",
           "Spain", "Greece", "France", "England", "Sweden", "Norway", "Denmark", "Germany", "Brazil", "Mexico", "the United States",
           "Australia", "Portugal", "United Arab Emirates"]
SPLIT = ["", "roof", "terrace", "balcony", "facade", "villa", "bungalow", "tiled", "veranda", "courtyard", "modern", "traditional"]
TEXT = ["house roof terrace India", "Kerala house tiled roof", "Indian house balcony", "duplex house India", "bungalow India"]


def get(url, params):
    full = url + "?" + urllib.parse.urlencode(params)
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(full, headers=UA), timeout=40) as r:
                return json.load(r)
        except Exception:  # transient failure or rate limit: back off
            time.sleep(4 * (i + 1))
    return {}


def commons(q, offset):
    d = get(COMMONS, {"action": "query", "format": "json", "formatversion": 2, "generator": "search", "gsrnamespace": 6,
                      "gsrsearch": f"{q} filetype:bitmap", "gsrlimit": 50, "gsroffset": offset, "prop": "imageinfo",
                      "iiprop": "url|sha1|size|extmetadata|mime", "iiurlwidth": 640})
    for p in (d.get("query") or {}).get("pages", []):
        ii = (p.get("imageinfo") or [{}])[0]
        m = ii.get("extmetadata", {})
        lic = clean(m.get("LicenseShortName", {}).get("value"))
        if ii.get("mime") not in ("image/jpeg", "image/png") or not OK_LICENCE.match(lic) or "nc" in lic.lower().split():
            continue
        desc = clean(m.get("ImageDescription", {}).get("value"))[:300]
        if SKIP.search(p.get("title", "")) or SKIP.search(desc) or ii.get("width", 0) < 640:
            continue
        yield {"src": "commons", "id": ii.get("sha1"), "url": ii.get("thumburl") or ii["url"], "page": ii.get("descriptionurl"),
               "title": p.get("title", ""), "desc": desc, "licence": lic, "author": clean(m.get("Artist", {}).get("value"))[:120] or "Unknown",
               "query": q}


def openverse(q, page):
    d = get(OPENVERSE, {"q": q, "license": "cc0,pdm,by,by-sa", "page_size": 20, "page": page, "mature": "false"})
    for r in d.get("results", []):
        if SKIP.search(r.get("title") or "") or (r.get("width") or 0) < 640:
            continue
        yield {"src": "openverse", "id": r["id"], "url": r.get("thumbnail") or r["url"], "page": r.get("foreign_landing_url"),
               "title": r.get("title") or "", "desc": " ".join(t.get("name", "") for t in (r.get("tags") or [])[:15]),
               "licence": f"CC {r.get('license', '').upper()} {r.get('license_version') or ''}".strip(), "author": (r.get("creator") or "Unknown")[:120],
               "query": q}


def dhash(im):
    g = im.convert("L").resize((9, 8))
    px = list(g.tobytes())
    return sum(1 << i for i in range(64) if px[(i // 8) * 9 + i % 8] > px[(i // 8) * 9 + i % 8 + 1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", type=int, default=15000)
    ap.add_argument("--out", default=os.path.join(os.path.dirname(ROOT), "nestora-photos"))
    a = ap.parse_args()
    os.makedirs(os.path.join(a.out, "img"), exist_ok=True)
    man = os.path.join(a.out, "manifest.jsonl")
    seen_ids, hashes, n = set(), [], 0
    if os.path.exists(man):
        for line in open(man, encoding="utf-8"):
            r = json.loads(line)
            seen_ids.add(r["id"]); hashes.append(r["dhash"]); n += 1
    queries = [f'deepcat:"Houses in {r}" {k}'.strip() for r in REGIONS for k in (SPLIT if r == "India" else SPLIT[:4])]
    queries += [q for qs in Q.values() for q in qs]
    with open(man, "a", encoding="utf-8") as out:
        for qi, q in enumerate(queries):
            if n >= a.target:
                break
            pages = [("c", off) for off in range(0, 2000, 50)] + ([("o", pg) for pg in (1, 2)] if not q.startswith("deepcat") else [])
            for kind, pg in pages:
                items = list(commons(q, pg) if kind == "c" else openverse(q, pg))
                if not items and kind == "c" and pg > 0:
                    break  # no more results for this query
                for it in items:
                    if it["id"] in seen_ids or n >= a.target:
                        continue
                    seen_ids.add(it["id"])
                    try:
                        with urllib.request.urlopen(urllib.request.Request(it["url"], headers=UA), timeout=40) as r:
                            raw = r.read()
                        im = Image.open(io.BytesIO(raw)).convert("RGB")
                    except Exception:
                        continue
                    w, h = im.size
                    if not (0.6 <= w / h <= 2.2):
                        continue
                    dh = dhash(im)
                    if any(bin(dh ^ x).count("1") <= 4 for x in hashes[-5000:]):  # near-duplicate
                        continue
                    im.thumbnail((640, 640))
                    name = hashlib.sha1(raw).hexdigest()[:16] + ".jpg"
                    im.save(os.path.join(a.out, "img", name), "JPEG", quality=85)
                    it.update({"file": name, "dhash": dh})
                    out.write(json.dumps(it, ensure_ascii=False) + "\n")
                    out.flush()
                    hashes.append(dh); n += 1
                time.sleep(0.5)
            print(f"[{qi + 1}/{len(queries)}] {q!r}: {n} photos", flush=True)
    print("done", n)


if __name__ == "__main__":
    main()
