"""
Learned plan critic (trained on a free Kaggle GPU by backend/ml/kaggle/critic/train.py): a small transformer over a
floor's rooms that scores how much the plan looks like a real home, 0..1. Pure-Python forward pass of the exported
weights (no torch on the server). Pre-norm TransformerEncoder layers, ReLU feed-forward, mean pooling.
ponytail: plain-Python matrix maths; ~30 rooms x 64 dims is a few ms. Switch to numpy/onnx if it ever shows in profiles.
"""
import json
import math
import os
from functools import cache
from typing import Any, Dict, List, Optional

PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "learned", "critic.json")


@cache
def _model() -> Optional[Dict[str, Any]]:
    if not os.path.exists(PATH):
        return None
    with open(PATH, encoding="utf-8") as f:
        return json.load(f)


def _lin(x: List[float], w: List[List[float]], b: List[float]) -> List[float]:
    return [sum(xi * wi for xi, wi in zip(x, row)) + bi for row, bi in zip(w, b)]


def _ln(x: List[float], g: List[float], b: List[float]) -> List[float]:
    m = sum(x) / len(x)
    v = sum((xi - m) ** 2 for xi in x) / len(x)
    s = 1 / math.sqrt(v + 1e-5)
    return [(xi - m) * s * gi + bi for xi, gi, bi in zip(x, g, b)]


def _attn(h: List[List[float]], S: Dict[str, Any], p: str, heads: int) -> List[List[float]]:
    W, B = S[p + "in_proj_weight"], S[p + "in_proj_bias"]
    d = len(h[0])
    qkv = [_lin(x, W, B) for x in h]
    q = [r[:d] for r in qkv]; k = [r[d:2 * d] for r in qkv]; v = [r[2 * d:] for r in qkv]
    hd = d // heads
    out = [[0.0] * d for _ in h]
    for hh in range(heads):
        sl = slice(hh * hd, (hh + 1) * hd)
        for i in range(len(h)):
            sc = [sum(a * b for a, b in zip(q[i][sl], k[j][sl])) / math.sqrt(hd) for j in range(len(h))]
            mx = max(sc)
            e = [math.exp(s - mx) for s in sc]
            z = sum(e)
            for j in range(len(h)):
                wj = e[j] / z
                for c, vv in enumerate(v[j][sl]):
                    out[i][hh * hd + c] += wj * vv
    return [_lin(x, S[p + "out_proj.weight"], S[p + "out_proj.bias"]) for x in out]


def encode(rooms: List[Dict[str, Any]], types: List[str]) -> List[List[float]]:
    ti = {t: i for i, t in enumerate(types)}
    x0 = min(r["x"] for r in rooms); y0 = min(r["y"] for r in rooms)
    W = max(r["x"] + r["w"] for r in rooms) - x0; H = max(r["y"] + r["d"] for r in rooms) - y0
    S = max(W, H, 1e-3)
    return [[ti.get(r["type"], ti["other"]), (r["x"] - x0) / S, (r["y"] - y0) / S, r["w"] / S, r["d"] / S,
             math.log(r["w"] * r["d"]), math.log(max(W * H, 1e-3))] for r in rooms]


ALIAS = {"bedroom_elder": "bedroom", "bedroom_guest": "bedroom", "help": "bedroom", "lounge": "living", "laundry": "utility"}


def score(rooms: List[Dict[str, Any]]) -> Optional[float]:
    """rooms: one floor, [{type,x,y,w,d}] in metres. None if no trained model is installed."""
    M = _model()
    rooms = [dict(r, type=ALIAS.get(r["type"], r["type"])) for r in rooms if r["w"] > 0.3 and r["d"] > 0.3]
    if M is None or len(rooms) < 2:
        return None
    rooms = rooms[:M["maxr"]]
    S = M["state"]
    feats = encode(rooms, M["types"])
    h = [[a + b for a, b in zip(S["emb.weight"][int(f[0])], _lin(f[1:], S["geo.weight"], S["geo.bias"]))] for f in feats]
    for L in range(M["layers"]):
        p = f"enc.layers.{L}."
        n1 = [_ln(x, S[p + "norm1.weight"], S[p + "norm1.bias"]) for x in h]
        a = _attn(n1, S, p + "self_attn.", M["heads"])
        h = [[x + y for x, y in zip(hx, ax)] for hx, ax in zip(h, a)]
        n2 = [_ln(x, S[p + "norm2.weight"], S[p + "norm2.bias"]) for x in h]
        ff = [_lin([max(0.0, u) for u in _lin(x, S[p + "linear1.weight"], S[p + "linear1.bias"])], S[p + "linear2.weight"], S[p + "linear2.bias"]) for x in n2]
        h = [[x + y for x, y in zip(hx, fx)] for hx, fx in zip(h, ff)]
    pooled = [sum(col) / len(h) for col in zip(*h)]
    z = _lin(_ln(pooled, S["out.0.weight"], S["out.0.bias"]), S["out.1.weight"], S["out.1.bias"])[0]
    return 1 / (1 + math.exp(-z))
