"""
Brief-understanding eval on 213 real Indian client briefs (Floorplan_Dataset_20022024, MIT). Ground truth is what the
architect actually drew for that brief (room labels transcribed from the CAD sheet), plus the plot size stated in it.
Scores the offline extractor (keyword_extract); pass --groq to also score the Groq path on the first N briefs.

    python -m backend.eval.brief_eval [--groq 30]
"""
import json
import re
import sys
from collections import Counter

from backend.app.services import llm

DRAWN = "data/extra/indian_houses/room_sizes.jsonl"
BRIEFS = "data/extra/indian_houses/programs.jsonl"
HAS = {
    "puja": ("POOJA", "PUJA", "MANDIR"),
    "lift": ("LIFT",),
    "guest_room": ("GUEST",),
    "help_room": ("SERVANT", "DRIVER", "MAID", "GUARD", "STAFF"),
    "master_dressing": ("DRESS", "W.I.C", "WARDROBE"),
    "store_room": ("STORE",),
    "laundry": ("WASH", "LAUNDRY", "UTILITY"),
}


def truth(drawn: dict, brief: dict) -> dict:
    labels = " | ".join((r["label"] or "").upper() for r in drawn["rooms"])
    labs = [(r["label"] or "").upper() for r in drawn["rooms"]]
    t = {k: any(w in l for l in labs for w in ws) for k, ws in HAS.items()}
    # a WASH/FRY kitchen is a second kitchen, not a laundry; a SERVANT STAIR is not a room
    t["laundry"] = any(w in l for l in labs for w in HAS["laundry"] if "KIT" not in l and "FRY" not in l)
    t["help_room"] = any(w in l for l in labs for w in HAS["help_room"] if "STAIR" not in l)
    t["parking_car"] = "PORCH" in labels or "PARKING" in labels or "CAR" in labels
    if brief.get("plot_w_ft"):
        t["plot"] = (round(brief["plot_w_ft"]), round(brief["plot_d_ft"]))
    return t


def predicted(fields: dict) -> dict:
    return {
        "puja": fields.get("puja") == "room",
        "lift": fields.get("lift", "none") != "none",
        "guest_room": bool(fields.get("guest_room")),
        "help_room": bool(fields.get("help_room")),
        "master_dressing": bool(fields.get("master_dressing")),
        "store_room": bool(fields.get("store_room")),
        "laundry": bool(fields.get("laundry")),
        "parking_car": fields.get("parking") == "car",
        "plot": (round(fields["plot_width_ft"]), round(fields["plot_depth_ft"])) if fields.get("plot_width_ft") and fields.get("plot_depth_ft") else None,
    }


def score(pairs):
    """pairs: [(truth, predicted)] -> per-field accuracy and recall."""
    acc, n, tp, pos = Counter(), Counter(), Counter(), Counter()
    for t, p in pairs:
        for k in t:
            n[k] += 1
            ok = (p.get(k) == t[k]) if k != "plot" else (p.get("plot") is not None and set(p["plot"]) == set(t["plot"]))
            acc[k] += ok
            if k != "plot" and t[k]:
                pos[k] += 1
                tp[k] += bool(p.get(k))
    return {k: {"accuracy": round(acc[k] / n[k], 3), "recall": round(tp[k] / pos[k], 3) if pos[k] else None, "n": n[k]} for k in n}


def main():
    drawn = {d["file"].rsplit(".", 1)[0]: d for d in map(json.loads, open(DRAWN, encoding="utf-8"))}
    rows = []
    for b in map(json.loads, open(BRIEFS, encoding="utf-8")):
        d = drawn.get(b["id"].replace("indian_house_", ""))
        if d and d["rooms"]:
            rows.append((b, d))
    kw = [(truth(d, b), predicted(llm.keyword_extract(b["caption"])["fields"])) for b, d in rows]
    print(f"{len(rows)} briefs\nkeywords:", json.dumps(score(kw), indent=1))
    if "--groq" in sys.argv:
        k = int(sys.argv[sys.argv.index("--groq") + 1])
        g = [(truth(d, b), predicted(llm.extract(b["caption"], [])["fields"])) for b, d in rows[:k]]
        print("groq:", json.dumps(score(g), indent=1))


if __name__ == "__main__":
    main()
