"""
Layout generator: a masked room-geometry transformer (MaskPLAN-style, own code, MIT-compatible) trained on real
floors (ResPlan, Swiss Dwellings: CC BY 4.0; traced Indian houses: MIT). Each room is a token: type + its box
(x, y, w, d), each quantised to BINS bins of the floor's extent, plus the floor's aspect ratio. During training a
random subset of rooms has its box hidden and the model predicts it. At inference we fix the rooms we know (living and
porch at the road side) and let it fill in the rest, a few rooms per step, most confident first.
Plans are augmented with the 8 flips/rotations, since the datasets don't mark the road side.
Output: /kaggle/working/layoutgen.json (weights as lists for a numpy forward pass) + metrics.json.
"""
import glob
import json
import math
import random

import torch
import torch.nn as nn
import torch.nn.functional as F

TYPES = ["living", "kitchen", "dining", "bedroom", "bedroom_master", "toilet", "stair", "passage", "balcony", "store",
         "porch", "puja", "study", "utility", "entrance", "lift", "dress", "lawn", "other"]
TI = {t: i for i, t in enumerate(TYPES)}
MAXR, D, LAYERS, HEADS, BINS = 32, 128, 4, 4, 24
MASK = BINS  # extra token id meaning "unknown"
dev = "cuda" if torch.cuda.is_available() else "cpu"
rng = random.Random(0)


def floors(path):
    for l in open(path, encoding="utf-8"):
        p = json.loads(l)
        by = {}
        for r in p["rooms"]:
            if r["w"] > 0.5 and r["d"] > 0.5:
                by.setdefault(r.get("floor", 0), []).append(r)
        for rooms in by.values():
            if 3 <= len(rooms) <= MAXR:
                yield rooms


def boxes(rooms, sym):
    """Normalised boxes in [0,1] of the floor's extent, after one of the 8 symmetries."""
    x0 = min(r["x"] for r in rooms); y0 = min(r["y"] for r in rooms)
    W = max(r["x"] + r["w"] for r in rooms) - x0; H = max(r["y"] + r["d"] for r in rooms) - y0
    out = []
    for r in rooms:
        x, y, w, d = (r["x"] - x0) / W, (r["y"] - y0) / H, r["w"] / W, r["d"] / H
        if sym & 1: x = 1 - x - w
        if sym & 2: y = 1 - y - d
        out.append([x, y, w, d])
    aspect = W / H
    if sym & 4:
        out = [[b[1], b[0], b[3], b[2]] for b in out]; aspect = 1 / aspect
    return out, aspect


def q(v):
    return min(BINS - 1, max(0, int(v * BINS)))


class Gen(nn.Module):
    def __init__(self):
        super().__init__()
        self.typ = nn.Embedding(len(TYPES), D)
        self.coord = nn.ModuleList([nn.Embedding(BINS + 1, D) for _ in range(4)])
        self.asp = nn.Linear(1, D)
        layer = nn.TransformerEncoderLayer(D, HEADS, 4 * D, dropout=0.1, batch_first=True, norm_first=True)
        self.enc = nn.TransformerEncoder(layer, LAYERS)
        self.norm = nn.LayerNorm(D)
        self.heads = nn.ModuleList([nn.Linear(D, BINS) for _ in range(4)])

    def forward(self, t, c, asp, mask):
        h = self.typ(t) + sum(self.coord[i](c[..., i]) for i in range(4)) + self.asp(asp.unsqueeze(-1)).unsqueeze(1)
        h = self.norm(self.enc(h, src_key_padding_mask=~mask))
        return [hd(h) for hd in self.heads]


def make_batch(items):
    n = len(items)
    t = torch.zeros(n, MAXR, dtype=torch.long); c = torch.full((n, MAXR, 4), MASK, dtype=torch.long)
    tgt = torch.full((n, MAXR, 4), -100, dtype=torch.long); m = torch.zeros(n, MAXR, dtype=torch.bool)
    asp = torch.zeros(n)
    for i, rooms in enumerate(items):
        bx, a = boxes(rooms, rng.randrange(8))
        asp[i] = math.log(a)
        hide_frac = rng.choice([1.0, rng.random()])  # half the time hide everything, else a random share
        for j, (r, b) in enumerate(zip(rooms, bx)):
            t[i, j] = TI.get(r["type"], TI["other"]); m[i, j] = True
            qb = [q(v) for v in b]
            if rng.random() < hide_frac:
                tgt[i, j] = torch.tensor(qb)
            else:
                c[i, j] = torch.tensor(qb)
    return t.to(dev), c.to(dev), asp.to(dev), m.to(dev), tgt.to(dev)


def main():
    data = {}
    for f in glob.glob("/kaggle/input/**/*.jsonl", recursive=True):
        name = f.split("/")[-1].split(".")[0]
        data[name] = list(floors(f)); print(name, len(data[name]))
    train, test = [], []
    for name, fl in data.items():
        random.Random(7).shuffle(fl)
        cut = int(0.9 * len(fl)); test += fl[cut:]
        train += fl[:cut] * (20 if name == "indian" else 1)
    model = Gen().to(dev)
    opt = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.01)
    EPOCHS, BS = 60, 256
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, 6e-4, total_steps=EPOCHS * (len(train) // BS + 1))
    for ep in range(EPOCHS):
        rng.shuffle(train); model.train(); tot = 0
        for i in range(0, len(train), BS):
            t, c, asp, m, tgt = make_batch(train[i:i + BS])
            out = model(t, c, asp, m)
            loss = sum(F.cross_entropy(o.reshape(-1, BINS), tgt[..., k].reshape(-1), ignore_index=-100) for k, o in enumerate(out))
            opt.zero_grad(); loss.backward(); opt.step(); sched.step(); tot += loss.item()
        print("epoch", ep, round(tot, 1), flush=True)
    model.eval()
    # held-out: pin one room, hide the rest, compare predicted bins with the real plan (no symmetry)
    errs = []
    with torch.no_grad():
        for rooms in test[:2000]:
            bx, a = boxes(rooms, 0)
            t = torch.tensor([[TI.get(r["type"], TI["other"]) for r in rooms]], device=dev)
            c = torch.full((1, len(rooms), 4), MASK, dtype=torch.long, device=dev)
            m = torch.ones(1, len(rooms), dtype=torch.bool, device=dev)
            # pin the first room (as we pin living/porch in use), predict the rest
            c[0, 0] = torch.tensor([q(v) for v in bx[0]], device=dev)
            out = model(t, c, torch.tensor([math.log(a)], device=dev), m)
            for j in range(1, len(rooms)):
                for k in range(4):
                    errs.append(abs(int(out[k][0, j].argmax()) - q(bx[j][k])))
    metrics = {"mean_abs_bin_error": sum(errs) / len(errs), "within_1_bin": sum(e <= 1 for e in errs) / len(errs),
               "within_3_bins": sum(e <= 3 for e in errs) / len(errs), "bins": BINS, "test_floors": min(2000, len(test))}
    print(metrics)
    sd = {k: v.cpu().tolist() for k, v in model.state_dict().items()}
    json.dump({"types": TYPES, "maxr": MAXR, "d": D, "layers": LAYERS, "heads": HEADS, "bins": BINS, "state": sd},
              open("/kaggle/working/layoutgen.json", "w"))
    json.dump(metrics, open("/kaggle/working/metrics.json", "w"), indent=1)


if __name__ == "__main__":
    main()
