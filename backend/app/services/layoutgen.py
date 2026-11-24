"""
Learned layout generator (backend/ml/kaggle/layoutgen/train.py, trained free on Kaggle): a masked room-geometry
transformer. Given a floor's room types and its aspect ratio, with the living room pinned at the road side, it fills in
where every other room goes, most confident rooms first (iterative decoding). The result is turned into an
arrangement (front/middle/rear band and left/centre/right side per room type) for the rule-based fitter, so every
learned layout is still sized, checked and judged by the same code as the authored templates.
"""
import json
import math
import os
from functools import cache
from typing import Any, Dict, List, Optional

import numpy as np

from backend.app.services.critic import _ln, encoder

DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "learned")
ALIAS = {"bedroom_elder": "bedroom", "bedroom_guest": "bedroom", "help": "bedroom", "lounge": "living", "laundry": "utility",
         "help_room": "bedroom"}
PIN = {"living": [0.0, 0.0, 0.5, 0.4], "porch": [0.5, 0.0, 0.5, 0.25]}  # road side = y 0


@cache
def _model() -> Optional[Dict[str, Any]]:
    cfg, w = os.path.join(DIR, "layoutgen.config.json"), os.path.join(DIR, "layoutgen.npz")
    if not (os.path.exists(cfg) and os.path.exists(w)):
        return None
    with open(cfg, encoding="utf-8") as f:
        m = json.load(f)
    with np.load(w) as z:  # float16 on disk (3 MB), float32 in memory
        m["state"] = {k: z[k].astype(np.float32) for k in z.files}
    return m


def _logits(M, t, c, aspect):
    S = M["state"]
    h = S["typ.weight"][t] + sum(S[f"coord.{i}.weight"][c[:, i]] for i in range(4))
    h = h + (np.array([math.log(aspect)], dtype=np.float32) @ S["asp.weight"].T + S["asp.bias"])
    h = _ln(encoder(h, S, M["layers"], M["heads"]), S["norm.weight"], S["norm.bias"])
    return [h @ S[f"heads.{i}.weight"].T + S[f"heads.{i}.bias"] for i in range(4)]


def decode(types: List[str], aspect: float, pin_x: float = 0.0, temperature: float = 0.0, seed: int = 0) -> Optional[List[List[float]]]:
    """Boxes [x, y, w, d] in 0..1 of the floor (y 0 = road side), one per room type given."""
    M = _model()
    if M is None or not types:
        return None
    B, ti = M["bins"], {t: i for i, t in enumerate(M["types"])}
    types = [ALIAS.get(t, t) for t in types][:M["maxr"]]
    t = np.array([ti.get(x, ti["other"]) for x in types])
    c = np.full((len(types), 4), B, dtype=int)  # B = unknown
    known = np.zeros(len(types), bool)
    for i, x in enumerate(types):  # pin the first living room / porch to the road side
        if x in PIN and not any(known[j] and types[j] == x for j in range(i)):
            px, py, pw, pd = PIN[x]
            px = pin_x if x == "living" else (0.0 if pin_x > 0.25 else 0.5)
            c[i] = [min(B - 1, int(v * B)) for v in (px, py, pw, pd)]; known[i] = True
    rs = np.random.default_rng(seed)
    while not known.all():
        logits = [l / temperature if temperature else l for l in _logits(M, t, c, aspect)]
        probs = [np.exp(l - l.max(-1, keepdims=True)) for l in logits]
        probs = [p / p.sum(-1, keepdims=True) for p in probs]
        conf = np.prod([p.max(-1) for p in probs], axis=0)
        conf[known] = -1
        k = max(1, int(math.ceil((~known).sum() / 3)))  # fix the most confident third each step
        for i in np.argsort(-conf)[:k]:
            c[i] = [int(rs.choice(B, p=p[i])) if temperature else int(p[i].argmax()) for p in probs]; known[i] = True
    return [[(v + 0.5) / B for v in row] for row in c.tolist()]


def arrangements(floors: Dict[int, List[str]], aspect: float, k: int = 6) -> List[Dict[str, Any]]:
    """k varied proposals: living pinned front-left / front-centre / front-right, greedy and sampled."""
    out, seen = [], set()
    for i in range(k):
        a = arrangement(floors, aspect, f"learned_{i}", pin_x=(0.0, 0.25, 0.5)[i % 3], temperature=0.0 if i < 3 else 0.8, seed=i)
        if a is None:
            return []
        key = json.dumps([a["zones"], a["sides"]], sort_keys=True)
        if key not in seen:
            seen.add(key); out.append(a)
    return out


def arrangement(floors: Dict[int, List[str]], aspect: float, aid: str = "learned", pin_x: float = 0.0,
                temperature: float = 0.0, seed: int = 0) -> Optional[Dict[str, Any]]:
    """{floor: [room types]} -> {"id", "zones": {type: front|middle|rear}, "sides": {type: left|centre|right}}."""
    zones, sides = {}, {}
    for f in sorted(floors):
        bx = decode(floors[f], aspect, pin_x, temperature, seed + f)
        if bx is None:
            return None
        for typ, (x, y, w, d) in zip(floors[f], bx):
            cy, cx = y + d / 2, x + w / 2
            zones.setdefault(typ, "front" if cy < 1 / 3 else "middle" if cy < 2 / 3 else "rear")
            sides.setdefault(typ, "left" if cx < 1 / 3 else "centre" if cx < 2 / 3 else "right")
    return {"id": aid, "zones": zones, "sides": sides}
