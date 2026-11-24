"""
Plan critic: a small transformer over a floor's rooms that scores how real a plan looks (0..1).
Runs on a free Kaggle GPU. Input: /kaggle/input/nestora-plans/{resplan,swiss}.jsonl (CC BY 4.0) + indian.jsonl (traced from MIT-licensed CAD plans).
Negatives are made from real plans: room sizes shuffled, room types swapped, rooms moved, toilets dropped next to
kitchens. Output: /kaggle/working/critic.json (weights as plain lists, for a pure-Python forward pass) + metrics.json.
"""
import glob
import json
import math
import random

import torch
import torch.nn as nn

TYPES = ["living", "kitchen", "dining", "bedroom", "bedroom_master", "toilet", "stair", "passage", "balcony", "store",
         "porch", "puja", "study", "utility", "entrance", "lift", "dress", "lawn", "other"]
TI = {t: i for i, t in enumerate(TYPES)}
MAXR, D, LAYERS, HEADS = 32, 64, 3, 4
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


def encode(rooms):
    """Rooms -> (MAXR, 7) features: type id, x, y, w, d (normalised by the floor's extent), log area, log plate."""
    x0 = min(r["x"] for r in rooms); y0 = min(r["y"] for r in rooms)
    W = max(r["x"] + r["w"] for r in rooms) - x0; H = max(r["y"] + r["d"] for r in rooms) - y0
    S = max(W, H, 1e-3)
    rows = [[TI.get(r["type"], TI["other"]), (r["x"] - x0) / S, (r["y"] - y0) / S, r["w"] / S, r["d"] / S,
             math.log(r["w"] * r["d"]), math.log(W * H)] for r in rooms]
    return rows


def corrupt(rooms):
    rooms = [dict(r) for r in rooms]
    k = rng.random()
    if k < 0.3:  # shuffle sizes between rooms
        dims = [(r["w"], r["d"]) for r in rooms]; rng.shuffle(dims)
        for r, (w, d) in zip(rooms, dims): r["w"], r["d"] = w, d
    elif k < 0.55:  # swap room types
        ts = [r["type"] for r in rooms]; rng.shuffle(ts)
        for r, t in zip(rooms, ts): r["type"] = t
    elif k < 0.8:  # move two rooms' positions
        a, b = rng.sample(range(len(rooms)), 2)
        (rooms[a]["x"], rooms[a]["y"]), (rooms[b]["x"], rooms[b]["y"]) = (rooms[b]["x"], rooms[b]["y"]), (rooms[a]["x"], rooms[a]["y"])
    else:  # stretch some rooms into corridors / squash them
        for r in rng.sample(rooms, max(1, len(rooms) // 3)):
            f = rng.choice([0.4, 0.5, 2.0, 2.5]); r["w"] *= f; r["d"] /= f
    return rooms


class Critic(nn.Module):
    def __init__(self):
        super().__init__()
        self.emb = nn.Embedding(len(TYPES), D)
        self.geo = nn.Linear(6, D)
        layer = nn.TransformerEncoderLayer(D, HEADS, 2 * D, dropout=0.1, batch_first=True, norm_first=True)
        self.enc = nn.TransformerEncoder(layer, LAYERS)
        self.out = nn.Sequential(nn.LayerNorm(D), nn.Linear(D, 1))

    def forward(self, t, g, mask):
        h = self.enc(self.emb(t) + self.geo(g), src_key_padding_mask=~mask)
        h = (h * mask.unsqueeze(-1)).sum(1) / mask.sum(1, keepdim=True)
        return self.out(h).squeeze(-1)


def batch(items):
    n = len(items)
    t = torch.zeros(n, MAXR, dtype=torch.long); g = torch.zeros(n, MAXR, 6); m = torch.zeros(n, MAXR, dtype=torch.bool)
    for i, rows in enumerate(items):
        for j, r in enumerate(rows):
            t[i, j] = r[0]; g[i, j] = torch.tensor(r[1:]); m[i, j] = True
    return t.to(dev), g.to(dev), m.to(dev)


def main():
    data = {}
    for f in glob.glob("/kaggle/input/**/*.jsonl", recursive=True):
        name = f.split("/")[-1].split(".")[0]
        data[name] = list(floors(f))
        print(name, len(data[name]))
    train, test = [], []
    for name, fl in data.items():
        random.Random(7).shuffle(fl)
        cut = int(0.9 * len(fl)); test += [(name, x) for x in fl[cut:]]
        train += fl[:cut] * (20 if name == "indian" else 1)  # few traced Indian houses: weight them up
    model = Critic().to(dev)
    opt = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.01)
    lossf = nn.BCEWithLogitsLoss()
    BS, EPOCHS = 256, 40
    for ep in range(EPOCHS):
        rng.shuffle(train); model.train(); tot = 0
        for i in range(0, len(train), BS // 2):
            real = train[i:i + BS // 2]
            items = [encode(r) for r in real] + [encode(corrupt(r)) for r in real]
            y = torch.tensor([1.0] * len(real) + [0.0] * len(real), device=dev)
            loss = lossf(model(*batch(items)), y)
            opt.zero_grad(); loss.backward(); opt.step(); tot += loss.item()
        print("epoch", ep, round(tot, 2), flush=True)
    model.eval(); metrics = {}
    with torch.no_grad():
        for name in data:
            real = [x for n, x in test if n == name]
            fake = [corrupt(x) for x in real]
            s_r = torch.sigmoid(model(*batch([encode(x) for x in real]))).cpu()
            s_f = torch.sigmoid(model(*batch([encode(x) for x in fake]))).cpu()
            metrics[name] = {"real_beats_fake": float((s_r > s_f).float().mean()), "real_mean": float(s_r.mean()), "fake_mean": float(s_f.mean()), "n": len(real)}
    print(metrics)
    sd = {k: v.cpu().tolist() for k, v in model.state_dict().items()}
    json.dump({"types": TYPES, "maxr": MAXR, "d": D, "layers": LAYERS, "heads": HEADS, "state": sd}, open("/kaggle/working/critic.json", "w"))
    json.dump(metrics, open("/kaggle/working/metrics.json", "w"), indent=1)


if __name__ == "__main__":
    main()
