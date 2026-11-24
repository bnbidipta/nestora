"""
Groq (OpenAI-compatible) LLM calls. Locked rule: the LLM never outputs numbers that become geometry.
- extract(): free text -> brief fields, each backed by a quote from the user's own words; keyword fallback offline.
- propose_arrangement(): topology only (which zone each room type sits in) -> fed to the same fitter + Judge.
Emails and phone numbers are stripped before sending. Without GROQ_API_KEY everything falls back silently.
"""
import json
import logging
import os
import re
from functools import lru_cache
from typing import Any, Dict, List, Optional

import httpx

from backend.app.models.brief import TRADITIONS, Brief

log = logging.getLogger(__name__)


def _has(text: str, keywords: List[str]) -> bool:
    """Whole-word match, so "dad" doesn't match "Dadar" and "car" doesn't match "cardamom"."""
    return any(re.search(r"\b" + re.escape(kw) + r"s?\b", text) for kw in keywords)


_FTIN = r"(\d{1,3})\s*(?:'|ft|feet|’)?\s*(?:-?\s*(\d{1,2}(?:\.\d+)?)(?:\s*\d/\d)?\s*(\"|in|”|''))?"
PLOT = re.compile(_FTIN + r"\s*(?:x|×|by|\*|(?<=[\"”])\s*-)\s*" + _FTIN, re.I)
DIRS = {"north": "N", "east": "E", "south": "S", "west": "W"}


def plot_size(text: str) -> Optional[tuple]:
    """Deterministic plot size (ft) from text like 58'-2\" x 125'-7\", 30x40, 30 by 40 ft. Never from the LLM."""
    for m in PLOT.finditer(text.replace("\\", "")):
        a = int(m.group(1)) + float(m.group(2) or 0) / 12
        b = int(m.group(4)) + float(m.group(5) or 0) / 12
        if 10 <= a <= 250 and 10 <= b <= 250:
            return round(a, 2), round(b, 2)
    return None


def facing(text: str) -> Optional[str]:
    m = re.search(r"\b(north|east|south|west)(?:[\s-]*(?:east|west))?[\s-]*(?:facing|ori\w*ted|orient\w*|face[sd]?)\b"
                  r"|\b(?:facing|faces?|orient\w*(?:\s+should\s+be)?)\s+(?:towards\s+|to\s+)?(?:the\s+)?(north|east|south|west)\b",
                  text, re.I)
    return DIRS[(m.group(1) or m.group(2)).lower()] if m else None


URL = "https://api.groq.com/openai/v1/chat/completions"
PII = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+|\+?\d[\d\s-]{8,}\d")


def _chat(system: str, user: str) -> Optional[Dict[str, Any]]:
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        return None
    try:
        res = httpx.post(URL, timeout=25, headers={"Authorization": f"Bearer {key}"}, json={
            "model": os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b"), "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": PII.sub("[removed]", user)}],
        })
        res.raise_for_status()
        return json.loads(res.json()["choices"][0]["message"]["content"])
    except Exception:  # network, quota, bad JSON: the caller falls back
        log.warning("Groq call failed; using fallback", exc_info=True)
        return None


FIELDS = {
    "elders": "integer 0-6: elderly people living in the home",
    "elder_mobility_issue": "boolean: anyone has knee pain, uses a wheelchair or walker, or can't climb stairs",
    "kids": "integer 0-8: children",
    "pets": "boolean",
    "wfh_people": "integer 0-8: people who work or study from home",
    "joint_family": "boolean",
    "rental_floor": "boolean: wants a separate floor to rent out",
    "puja": "one of none|nook|room",
    "parking": "one of none|two_wheeler|car",
    "floors_wanted": "integer 1-3",
    "traditions": "object mapping any of " + ",".join(TRADITIONS) + " to off|soft|strict",
}


def extract(text: str, style_ids: List[str]) -> Dict[str, Any]:
    """Returns {fields, evidence, questions, source}. Only fields quoted from the text are kept."""
    text = (text or "").strip()
    if not text:
        return {"fields": {}, "evidence": {}, "questions": [], "source": "none"}
    sys = ("You extract a house design brief from a family's own words. Reply in JSON: "
           '{"fields": {...}, "evidence": {field: exact quote from the text}, "questions": [short clarifying questions]}. '
           "Allowed fields: " + json.dumps(FIELDS) + f". styles: list of ids from {style_ids}. "
           "Include a field ONLY if the text states or clearly implies it, and give the exact quote. Never guess. "
           "Never output room sizes, dimensions or costs. Ask a question when something matters but is ambiguous "
           "(e.g. 'parents visit' could mean live-in or occasional). Text may be English, Hindi or Hinglish.")
    out = _chat(sys, text)
    if out and isinstance(out.get("fields"), dict):
        ev = out.get("evidence") or {}
        fields = {}
        for k, v in out["fields"].items():
            quote = str(ev.get(k, ""))
            if (k in FIELDS or k == "styles") and quote and quote.lower() in text.lower():
                fields[k] = v
        try:  # validate types through the Brief model, dropping anything invalid
            clean = Brief(**fields).model_dump(include=set(fields))
        except Exception:
            clean = {}
            for k, v in fields.items():
                try:
                    clean.update(Brief(**{k: v}).model_dump(include={k}))
                except Exception:
                    pass
        if "styles" in clean:
            clean["styles"] = [s for s in clean["styles"] if s in style_ids]
        for k, v in _rooms_and_plot(text).items():
            clean.setdefault(k, v)
        return {"fields": clean, "evidence": {k: ev[k] for k in clean if k in ev},
                "questions": [str(q)[:200] for q in (out.get("questions") or [])][:3], "source": "groq"}
    return keyword_extract(text)


def _rooms_and_plot(text: str) -> Dict[str, Any]:
    """Facts stated outright in a brief: plot size and facing (regex), and rooms asked for by name."""
    t, f = text.lower(), {}
    ps = plot_size(text)
    if ps:
        f["plot_width_ft"], f["plot_depth_ft"] = ps
    fc = facing(text)
    if fc:
        f["facing"] = fc
    if _has(t, ["corner plot", "corner plot type", "facing the corner", "corner side", "corner type"]):
        f["corner_plot"] = True
    if _has(t, ["lift", "elevator"]):
        f["lift"] = "lift"
    if _has(t, ["guest room", "guest bedroom", "guest"]):
        f["guest_room"] = True
    if _has(t, ["servant", "servant quarter", "maid", "driver room", "driver's room", "guard room", "staff room", "help room", "domestic help"]):
        f["help_room"] = True
    if _has(t, ["dressing", "dress area", "dress room", "walk-in", "walk in wardrobe", "w.i.c", "wic"]):
        f["master_dressing"] = True
    if _has(t, ["store", "storage room", "kitchen store"]):
        f["store_room"] = True
    if re.search(r"\b(?:hand|feet|foot|hand/feet)\s+wash", t):
        t = re.sub(r"\b(?:hand|feet|foot|hand/feet)\s+wash\s+area", "", t)  # a foot-wash at the entrance is not a laundry
    if _has(t, ["frywash", "wash area", "washing area", "washing space", "wasing area", "wash kitchen", "kit wash", "kitchen wash",
                "laundry", "laundary", "utility area", "utility room"]) or re.search(r"\butility\b(?!\s+(?:service\s+)?stair)", t):
        f["laundry"] = True
    if _has(t, ["puja", "pooja", "mandir", "prayer room"]) and "puja" not in f:
        f["puja"] = "room"
    if _has(t, ["car park", "car parking", "car porch", "garage", "porch"]):
        f["parking"] = "car"
    return f


def keyword_extract(text: str) -> Dict[str, Any]:
    t = text.lower()
    f: Dict[str, Any] = {}
    if _has(t, ["elder", "grandma", "grandmother", "grandfather", "grandparent", "granny", "parents", "in-laws", "senior", "dadi", "nani", "dada", "nana", "mother", "father", "mom", "dad", "mummy", "papa", "maa"]):
        f["elders"] = 1 if not _has(t, ["grandparents", "parents", "in-laws"]) else 2
    if _has(t, ["knee", "wheelchair", "walker", "arthritis", "can't climb", "cannot climb", "no stairs"]):
        f["elder_mobility_issue"] = True
    if _has(t, ["toddler", "baby", "kid", "child", "son", "daughter"]):
        f["kids"] = 1
    if _has(t, ["dog", "cat", "pet", "puppy"]):
        f["pets"] = True
    if _has(t, ["wfh", "work from home", "home office", "remote work", "study room"]):
        f["wfh_people"] = 1
    if _has(t, ["joint family", "extended family", "3 generations", "three generations"]):
        f["joint_family"] = True
    if _has(t, ["rent out", "rental", "tenant"]):
        f["rental_floor"] = True
    if _has(t, ["puja room", "pooja room", "mandir room", "prayer room"]):
        f["puja"] = "room"
    if _has(t, ["car"]):
        f["parking"] = "car"
    if _has(t, ["strict vaastu", "vaastu strict", "100% vaastu", "strict vastu"]):
        f["traditions"] = {"vaastu": "strict"}
    f.update(_rooms_and_plot(text))
    return {"fields": f, "evidence": {}, "questions": [], "source": "keywords"}


ZONE_TYPES = ("living", "kitchen", "dining", "bedroom", "bedroom_master", "study", "puja", "toilet", "lounge", "balcony", "entrance")


@lru_cache(maxsize=256)
def _propose(brief_json: str) -> Optional[Dict[str, Any]]:
    sys = ("You are an architect proposing the TOPOLOGY of an Indian independent house plan. The plot is cut into "
           "three bands from the road: front, middle (holds the stair), rear. Reply in JSON: "
           '{"zones": {room_type: "front"|"middle"|"rear"}, "rationale": "one sentence"} for room types ' + ",".join(ZONE_TYPES) +
           ". Consider privacy gradient (public front, private rear), the plot facing, traditions and family needs. "
           "Output no numbers, sizes or dimensions.")
    out = _chat(sys, brief_json)
    if not out or not isinstance(out.get("zones"), dict):
        return None
    zones = {k: v for k, v in out["zones"].items() if k in ZONE_TYPES and v in ("front", "middle", "rear")}
    if len(zones) < 4:
        return None
    return {"id": "llm_proposal", "zones": zones, "rationale": str(out.get("rationale", ""))[:300]}


def propose_arrangement(brief: Brief) -> Optional[Dict[str, Any]]:
    b = brief.model_dump(exclude={"free_text", "budget_inr"})
    return _propose(json.dumps(b, sort_keys=True))
