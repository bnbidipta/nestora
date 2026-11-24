"""
Learned plan critic (trained on a free Kaggle GPU by backend/ml/kaggle/critic/train.py): a small transformer over a
floor's rooms that scores how much the plan looks like a real home, 0..1. numpy forward pass of the exported
weights (no torch on the server). Pre-norm TransformerEncoder layers, ReLU feed-forward, mean pooling.
Held-out (same fakes for both): critic 90.7%/88.3% vs statistics prior 86.7%/57.7% on ResPlan/Swiss; combined best.
"""
import json
import math
import os
from functools import cache
from typing import Any, Dict, List, Optional

import numpy as np

PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "learned", "critic.json")
ALIAS = {"bedroom_elder": "bedroom", "bedroom_guest": "bedroom", "help": "bedroom", "lounge": "living", "laundry": "utility"}


@cache
def _model() -> Optional[Dict[str, Any]]:
    if not os.path.exists(PATH):
        return None
    with open(PATH, encoding="utf-8") as f:
        m = json.load(f)
    m["state"] = {k: np.asarray(v, dtype=np.float32) for k, v in m["state"].items()}
    return m


def _ln(x, g, b):
    m = x.mean(-1, keepdims=True)
    v = ((x - m) ** 2).mean(-1, keepdims=True)
    return (x - m) / np.sqrt(v + 1e-5) * g + b


def encode(rooms: List[Dict[str, Any]], types: List[str]):
    ti = {t: i for i, t in enumerate(types)}
    x0 = min(r["x"] for r in rooms); y0 = min(r["y"] for r in rooms)
    W = max(r["x"] + r["w"] for r in rooms) - x0; H = max(r["y"] + r["d"] for r in rooms) - y0
    S = max(W, H, 1e-3)
    t = np.array([ti.get(r["type"], ti["other"]) for r in rooms])
    g = np.array([[(r["x"] - x0) / S, (r["y"] - y0) / S, r["w"] / S, r["d"] / S, math.log(r["w"] * r["d"]),
                   math.log(max(W * H, 1e-3))] for r in rooms], dtype=np.float32)
    return t, g


def score(rooms: List[Dict[str, Any]]) -> Optional[float]:
    """rooms: one floor, [{type,x,y,w,d}] in metres. None if no trained model is installed."""
    M = _model()
    rooms = [dict(r, type=ALIAS.get(r["type"], r["type"])) for r in rooms if r["w"] > 0.3 and r["d"] > 0.3]
    if M is None or len(rooms) < 2:
        return None
    S, heads = M["state"], M["heads"]
    t, g = encode(rooms[:M["maxr"]], M["types"])
    h = encoder(S["emb.weight"][t] + g @ S["geo.weight"].T + S["geo.bias"], S, M["layers"], heads)
    z = _ln(h.mean(0), S["out.0.weight"], S["out.0.bias"]) @ S["out.1.weight"].T + S["out.1.bias"]
    return float(1 / (1 + math.exp(-float(z[0]))))


def encoder(h, S, layers: int, heads: int):
    """Pre-norm torch TransformerEncoder layers (ReLU feed-forward), keys enc.layers.{i}.*; h: (rooms, d)."""
    n, d = h.shape
    hd = d // heads
    for L in range(layers):
        p = f"enc.layers.{L}."
        x = _ln(h, S[p + "norm1.weight"], S[p + "norm1.bias"])
        qkv = x @ S[p + "self_attn.in_proj_weight"].T + S[p + "self_attn.in_proj_bias"]
        q, k, v = (qkv[:, i * d:(i + 1) * d].reshape(n, heads, hd).transpose(1, 0, 2) for i in range(3))
        a = q @ k.transpose(0, 2, 1) / math.sqrt(hd)
        a = np.exp(a - a.max(-1, keepdims=True)); a /= a.sum(-1, keepdims=True)
        o = (a @ v).transpose(1, 0, 2).reshape(n, d)
        h = h + o @ S[p + "self_attn.out_proj.weight"].T + S[p + "self_attn.out_proj.bias"]
        x = _ln(h, S[p + "norm2.weight"], S[p + "norm2.bias"])
        ff = np.maximum(x @ S[p + "linear1.weight"].T + S[p + "linear1.bias"], 0)
        h = h + ff @ S[p + "linear2.weight"].T + S[p + "linear2.bias"]
    return h
