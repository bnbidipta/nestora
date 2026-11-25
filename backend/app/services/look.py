"""
The house's architecture (its "look"): roof, terrace, massing at roof level, shading and facade elements.
Each option gets a different archetype so options look clearly different, and every look is drawn from the chosen
style's tendencies (hand-written priors now; a model trained on openly licensed house photos replaces them later).

Archetypes:
- terrace: flat roof as a usable terrace (parapet, pergola, garden beds, water tank, stair room)
- sloped:  pitched tiled roof over the whole top floor (hip or gable, deep eaves)
- stepped: a covered roof pavilion over the rear part, open terrace with pergola in front
- mixed:   pitched roof over the rear part, flat terrace garden in front
ponytail: stepping is at roof level only; per-floor setbacks need the new floor-plan engine.
"""
import json
import math
import os
import re
import zlib
from functools import lru_cache
from typing import Any, Dict, List

ARCHETYPES = ("terrace", "sloped", "stepped", "mixed")
FT = 0.3048
FLOOR_M = 3.0
PLINTH_M = 0.45

SLOPED_WORDS = ("pitch", "sloping", "sloped", "tile", "gable", "hip roof", "thatch", "cottage", "nalukettu", "konkan", "goan",
                "kerala", "bengali", "eave", "chalet", "craftsman", "tuscan", "mediterranean", "farmhouse", "hanok", "thai", "balinese",
                "japanese", "victorian", "english", "french", "spanish", "prairie", "ranch", "bhunga", "chettinad", "dravidian")
FLAT_WORDS = ("flat roof", "terrace", "cubic", "box", "bauhaus", "cycladic", "pueblo", "riad", "parametric", "brutalist",
              "minimal", "art deco", "industrial", "haveli", "arabian", "persian", "modernism", "contemporary")

# explicit tendencies where keywords are not enough: archetype weights + element defaults
OVERRIDES: Dict[str, Dict[str, Any]] = {
    "indian_contemporary": {"w": (3, 1, 3, 3), "jaali": True, "chhajja_m": 0.75},
    "kerala_nalukettu": {"w": (0.5, 4, 1, 3), "pitch": 32, "eave_m": 0.9, "tile": "#A14B2F"},
    "konkan": {"w": (0.5, 4, 1, 2), "pitch": 30, "eave_m": 0.8, "tile": "#9C4A30"},
    "goan_portuguese": {"w": (0.5, 4, 1, 2), "pitch": 28, "eave_m": 0.7, "tile": "#A65236"},
    "chettinad": {"w": (1, 3, 1, 3), "pitch": 26, "tile": "#9E4B32"},
    "laurie_baker_vernacular": {"w": (1, 3, 1, 3), "pitch": 30, "jaali": True, "tile": "#8F4A30"},
    "tropical_modernism": {"w": (2, 1, 3, 3), "chhajja_m": 0.9, "eave_m": 0.9},
    "rajasthani_haveli": {"w": (4, 0.5, 3, 1), "jaali": True, "chhajja_m": 0.6},
    "minimalist": {"w": (4, 0.5, 3, 1), "chhajja_m": 0.3},
    "japandi": {"w": (1, 3, 2, 2), "pitch": 22, "eave_m": 0.9},
    "eco_passive": {"w": (3, 1, 3, 3), "garden": True},
    "tropical_brutalist": {"w": (3, 0.5, 3, 2), "garden": True, "chhajja_m": 0.9},
    "nordic_barn": {"w": (0.3, 5, 0.5, 1), "pitch": 40, "eave_m": 0.1},
    "cape_cod": {"w": (0.3, 5, 0.5, 1), "pitch": 40, "eave_m": 0.3},
    "glass_box": {"w": (5, 0.3, 3, 1), "chhajja_m": 0.9},
    "desert_modern": {"w": (4, 0.5, 3, 1), "chhajja_m": 1.2},
}


@lru_cache(maxsize=1)
def vocab() -> Dict[str, Any]:
    with open(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "exterior_vocab.json"), encoding="utf-8") as f:
        return json.load(f)["elements"]


HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
COLOUR_KEYS = ("wall_colour", "accent_colour")


def valid_overrides(o: Dict[str, Any]) -> Dict[str, Any]:
    """Only known elements with known options (wall: 1-2 finishes, main first); colours as #RRGGBB."""
    v, out = vocab(), {}
    for k, x in (o or {}).items():
        if k in COLOUR_KEYS and isinstance(x, str) and HEX.match(x):
            out[k] = x
        elif k == "wall":
            xs = [w for w in (x if isinstance(x, list) else [x]) if w in v["wall"]["options"]][:2]
            if xs:
                out[k] = xs
        elif k in v and x in v[k]["options"]:
            out[k] = x
    return out


TILE = {"mangalore_tile": "#A14B2F", "clay_barrel": "#B8643A", "metal_seam": "#4A4F55", "slate": "#4B5058",
        "wood_shingle": "#7B5A3C", "green_roof": "#5E7D3E", "concrete_flat": "#9A9690"}


def exterior(st: Dict[str, Any], overrides: Dict[str, Any]) -> Dict[str, Any]:
    """The style's default exterior elements with the user's own choices on top."""
    e = dict(st.get("exterior") or {"wall": ["plaster_paint"], "window": "large_glazing", "frame": "dark_metal",
                                      "entrance": "simple_canopy", "railing": "ms_bars", "roof_material": "concrete_flat",
                                      "trim": "none", "boundary": "solid_wall_gate"})
    e["wall_colour"], e["accent_colour"] = st["palette"]["wall"], st["palette"]["accent"]
    e.update(valid_overrides(overrides))
    return e


def _text(st: Dict[str, Any]) -> str:
    return " ".join([st.get("name", ""), " ".join(st.get("features", [])), st.get("group", "")]).lower()


def prior(st: Dict[str, Any]) -> Dict[str, Any]:
    """Archetype weights and element defaults for one style."""
    t = _text(st)
    sloped = sum(w in t for w in SLOPED_WORDS)
    flat = sum(w in t for w in FLAT_WORDS)
    w = (1 + 2 * flat, 1 + 2 * sloped, 1 + flat, 1 + min(flat, sloped) + 0.5)
    out = {"w": w, "pitch": 26, "eave_m": 0.6, "chhajja_m": 0.6, "tile": "#A0522D", "jaali": "jaali" in t or "screen" in t,
           "garden": "garden" in t or "green" in t, "rail": "jaali" if "jaali" in t else "glass" if "glass" in t else "ms"}
    out.update(OVERRIDES.get(st["id"], {}))
    return out


def order(styles: List[str]) -> List[str]:
    """Archetypes for these styles, most fitting first (all four always included, for variety)."""
    from backend.app.services import derive  # lazy: derive imports this module
    cat = derive.styles()
    picks = [cat[s] for s in styles if s in cat] or [cat["indian_contemporary"]]
    total = [sum(prior(s)["w"][i] for s in picks) for i in range(4)]
    return [ARCHETYPES[i] for i in sorted(range(4), key=lambda i: -total[i])]


def default_archetype(styles: List[str], cand_id: str) -> str:
    o = order(styles)
    return o[zlib.crc32(cand_id.encode()) % 2]  # one of the two most fitting


def assign(brief, cands: List[Dict[str, Any]], taken: List[str] = ()) -> None:
    """Give each candidate an archetype not already shown, fitting its own style best (the most opinionated style picks
    first), so options look clearly different and a Kerala option gets the sloped roof rather than a Bauhaus one."""
    from backend.app.services import derive
    used = [t for t in taken if t]
    pri = {c["id"]: prior(derive.style_for(brief, c))["w"] for c in cands}
    for c in sorted(cands, key=lambda c: -max(pri[c["id"]]) / sum(pri[c["id"]])):
        w = pri[c["id"]]
        ranked = [ARCHETYPES[i] for i in sorted(range(4), key=lambda i: -w[i])]
        free = [a for a in ranked if a not in used] or ranked
        c["look_archetype"] = free[0]
        used.append(free[0])


def build(brief, cand: Dict[str, Any], st: Dict[str, Any]) -> Dict[str, Any]:
    """The look for one candidate, fitted to the rules (height limit, eaves within setbacks)."""
    r = cand["rules"]
    p = prior(st)
    arch = cand.get("look_archetype") or default_archetype(brief.styles, str(cand.get("id", "")))
    env = cand["envelope"]
    span = min(env["width_m"], env["depth_m"])
    walls_top = PLINTH_M + cand["floors"] * FLOOR_M
    pitch = p["pitch"]
    rise = lambda pt: (span / 2) * math.tan(math.radians(pt))
    pitched = arch in ("sloped", "mixed")
    if pitched:  # lower the pitch to fit the height limit; drop to a flat terrace if even 15 degrees does not fit
        while pitch > 15 and walls_top + rise(pitch) > r["max_height_m"]:
            pitch -= 1
        if walls_top + rise(pitch) > r["max_height_m"]:
            arch, pitched = "terrace", False
    max_proj = max(0.0, min(r["setback_side_m"], r["setback_front_m"], r["setback_rear_m"]) - 0.3)
    eave = round(min(p["eave_m"], max_proj), 2)
    pal = st["palette"]
    ex = exterior(st, getattr(brief, "exterior", {}) or {})
    roof_mat = ex["roof_material"]
    if pitched and roof_mat in ("concrete_flat", "green_roof"):
        roof_mat = "mangalore_tile"  # a pitched roof needs a roof covering; flat-only choices apply to the terrace parts
    # entrance porch projects into the front setback, kept 0.3 m short of the plot line
    porch = round(min(2.0, max(0.0, r["setback_front_m"] - 0.3)), 2) if ex["entrance"] in ("portico_columns", "verandah", "pergola", "arched_porch") else 0
    rail = {"glass": "glass", "jaali": "jaali"}.get(ex["railing"], "ms")
    return {
        "archetype": arch,
        "style": st["id"],
        "roof": {"form": ("hip" if span > 7 else "gable") if pitched else "flat", "pitch_deg": pitch if pitched else 0,
                 "eave_m": eave if pitched else 0, "tile": TILE.get(roof_mat, p["tile"]), "material": roof_mat, "cover": 1.0 if arch == "sloped" else 0.55 if arch == "mixed" else 0},
        "terrace": {"usable": arch != "sloped", "parapet_m": 1.05, "pergola": arch in ("terrace", "stepped"),
                    "garden": arch != "sloped" and (p["garden"] or arch in ("terrace", "mixed")), "tank": True,
                    "mumty": arch != "sloped", "pavilion": 0.45 if arch == "stepped" else 0},
        "shading": {"chhajja_m": round(min(p["chhajja_m"], max_proj), 2), "jaali": bool(p["jaali"]), "fins": arch == "stepped"},
        "facade": {"plinth_m": PLINTH_M, "wall": ex["wall_colour"], "accent": ex["accent_colour"], "wood": pal.get("wood", "#7A4E2D"),
                   "rail": rail, "band": ex["trim"] in ("floor_band", "cornice") or arch in ("terrace", "stepped")},
        "exterior": {**ex, "porch_m": porch},
        "height_m": round(walls_top + (rise(pitch) if pitched else 1.05), 2),
    }


if __name__ == "__main__":  # self-check: four different archetypes, all within the height limit
    from backend.app.models.brief import Brief
    from backend.app.services import derive
    from backend.app.services import generator, pack
    b = Brief(plot_width_ft=40, plot_depth_ft=60, floors_wanted=2, couples=1, kids=2, styles=["kerala_nalukettu"])
    rr = pack.rules(40 * FT, 60 * FT, b.road_width_m, b.city)
    cs = [{"id": f"c{i}", "rules": rr, "envelope": pack.envelope(40 * FT, 60 * FT, rr), "floors": 2} for i in range(4)]
    assign(b, cs)
    looks = [build(b, c, derive.styles()["kerala_nalukettu"]) for c in cs]
    assert len({lk["archetype"] for lk in looks}) == 4, looks
    assert all(lk["height_m"] <= rr["max_height_m"] for lk in looks)
    print([lk["archetype"] for lk in looks], [lk["height_m"] for lk in looks])
