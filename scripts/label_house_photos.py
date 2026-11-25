"""
Labels the collected house photos with exterior elements (backend/app/data/exterior_vocab.json) using a vision model via
the agy CLI (read-only: it only looks at the images and prints JSON). Labels go to <photos>/labels.jsonl, outside the repo.
Rarest styles first, so every style reaches a trainable count early. Off-vocabulary answers are dropped, not guessed.

Usage: python scripts/label_house_photos.py [--batch 20] [--limit 2000] [--photos DIR]
"""
import argparse
import json
import os
import subprocess
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOCAB = json.load(open(os.path.join(ROOT, "backend", "app", "data", "exterior_vocab.json"), encoding="utf-8"))["elements"]
STYLES = [s["id"] for s in json.load(open(os.path.join(ROOT, "backend", "app", "data", "styles.json"), encoding="utf-8"))["styles"]
          if s.get("scope", "exterior") == "exterior"]
ROOFS = ["flat_terrace", "gable", "hip", "mono", "mixed", "other"]
MODEL = "gemini-4-hydrogen-medium"

PROMPT = """You are labelling photos of house exteriors for an architecture dataset. Look at each image file listed below
(in the folder {folder}). Do NOT create, edit or delete any file. Reply with ONLY a JSON array, one object per image, in
the same order, with exactly these keys:
- "file": the file name
- "house": true only if the photo mainly shows the exterior of a single home (house, villa, cottage, bungalow); false for
  interiors, apartments blocks, temples, shops, ruins, streets, drawings
- "style": the closest of {styles}, or null if unclear
- "roof_form": one of {roofs}
- "storeys": integer number of floors visible
{elements}
- "confidence": 0 to 1, how sure you are overall
For each element use only the listed ids; use null if it is not visible. "wall" may list up to 2 ids (main first).
Files:
{files}"""


def ask(folder, files):
    elems = "\n".join(f'- "{k}": one of {list(v["options"])}' + (" (a list)" if k == "wall" else "") for k, v in VOCAB.items())
    prompt = PROMPT.format(folder=folder, styles=STYLES, roofs=ROOFS, elements=elems, files="\n".join(files))
    r = subprocess.run(["agy", "-p", prompt, "--model", MODEL, "--add-dir", folder, "--mode", "plan", "--print-timeout", "600s"],
                       capture_output=True, text=True, encoding="utf-8", timeout=700)
    out = r.stdout
    s, e = out.find("["), out.rfind("]")
    if s < 0 or e < 0:
        raise RuntimeError((r.stderr or out)[-400:])
    return json.loads(out[s:e + 1])


def clean(x):
    """Keep only in-vocabulary values."""
    out = {"file": x.get("file"), "house": bool(x.get("house")), "style": x.get("style") if x.get("style") in STYLES else None,
           "roof_form": x.get("roof_form") if x.get("roof_form") in ROOFS else None,
           "storeys": x.get("storeys") if isinstance(x.get("storeys"), int) and 0 < x["storeys"] < 8 else None,
           "confidence": float(x.get("confidence") or 0)}
    for k, v in VOCAB.items():
        val = x.get(k)
        if k == "wall":
            vals = val if isinstance(val, list) else [val]
            out[k] = [w for w in vals if w in v["options"]][:2] or None
        else:
            out[k] = val if val in v["options"] else None
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--photos", default=os.path.join(os.path.dirname(ROOT), "nestora-photos"))
    ap.add_argument("--batch", type=int, default=20)
    ap.add_argument("--limit", type=int, default=2000)
    a = ap.parse_args()
    folder = os.path.join(a.photos, "img")
    lab_p = os.path.join(a.photos, "labels.jsonl")
    done = {json.loads(l)["file"] for l in open(lab_p, encoding="utf-8")} if os.path.exists(lab_p) else set()
    man = [json.loads(l) for l in open(os.path.join(a.photos, "manifest.jsonl"), encoding="utf-8")]
    todo = [m for m in man if m["file"] not in done]
    have = Counter(json.loads(l).get("style_hint") for l in open(lab_p, encoding="utf-8")) if os.path.exists(lab_p) else Counter()
    todo.sort(key=lambda m: have.get(m.get("style"), 0))  # rarest styles first; untagged (region sweep) photos last-ish
    hint = {m["file"]: m.get("style") for m in man}
    n = 0
    with open(lab_p, "a", encoding="utf-8") as out:
        for i in range(0, min(len(todo), a.limit), a.batch):
            files = [m["file"] for m in todo[i:i + a.batch]]
            try:
                res = ask(folder, files)
            except Exception as ex:  # quota, login or a bad reply: stop, re-run later resumes
                print("stopped:", str(ex)[:300], flush=True)
                break
            for x in res:
                if x.get("file") in files:
                    c = clean(x)
                    c["style_hint"] = hint.get(c["file"])
                    out.write(json.dumps(c) + "\n")
                    n += 1
            out.flush()
            print(f"labelled {n}", flush=True)
    print("done", n)


if __name__ == "__main__":
    main()
