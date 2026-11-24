"""Locks the brief reader at 100% on 183 real Indian client briefs (labels from the text, hand-adjudicated)."""
import json
import os

from backend.app.services.llm import keyword_extract

GOLD = os.path.join(os.path.dirname(os.path.dirname(__file__)), "eval", "data", "indian_briefs_gold.json")
MAP = {"lift": lambda f: f.get("lift", "none") != "none", "puja": lambda f: f.get("puja") == "room",
       "guest_room": lambda f: bool(f.get("guest_room")), "help_room": lambda f: bool(f.get("help_room")),
       "dressing": lambda f: bool(f.get("master_dressing")), "store_room": lambda f: bool(f.get("store_room")),
       "wash_area": lambda f: bool(f.get("laundry")), "car_parking": lambda f: f.get("parking") == "car",
       "corner": lambda f: bool(f.get("corner_plot")), "facing": lambda f: f.get("facing")}


def test_real_indian_briefs_all_fields():
    misses = []
    for g in json.load(open(GOLD, encoding="utf-8"))["items"]:
        f = keyword_extract(g["text"])["fields"]
        for k, fn in MAP.items():
            if fn(f) != g.get(k):
                misses.append((g["i"], k, g.get(k), fn(f)))
        if g.get("plot_w_ft"):
            w, d = f.get("plot_width_ft"), f.get("plot_depth_ft")
            if w is None or abs(w - g["plot_w_ft"]) > 0.6 or abs(d - g["plot_d_ft"]) > 0.6:
                misses.append((g["i"], "plot", (g["plot_w_ft"], g["plot_d_ft"]), (w, d)))
    assert not misses, misses[:10]
