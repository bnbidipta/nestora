"""
Trace labelled room outlines from clean CAD floor-plan images. Free and local: OpenCV + RapidOCR (Apache 2.0).

1. Walls (blue), doors/windows (cyan) and columns (red) are barriers; door gaps in wall lines are bridged.
2. Each enclosed white region is a room candidate.
3. OCR (run on the image and its two 90-degree rotations, since labels are printed sideways) finds room labels and
   their printed dimensions; a label is assigned to the region containing it. Regions holding several labels
   (open-plan kitchen/dining/lounge) are split by nearest label.
4. Scale comes from the median of sqrt(area_px / printed_area) over single-label rooms with printed sizes.
5. A room is `verified` only if its traced area matches its printed size within 15%. Training uses verified rooms.

    python scripts/trace_plans.py                 # all images -> data/extra/indian_houses/traced.jsonl
    python scripts/trace_plans.py AA_GF_01.jpg    # one image, also writes a debug overlay
"""
import json
import math
import os
import re
import sys

import cv2
import numpy as np

DIR = "data/extra/indian_houses"
FT = 0.3048
LABELS = [("MASTER", "bedroom_master"), ("BED", "bedroom"), ("GUEST", "bedroom"), ("POWDER", "toilet"), ("PWDR", "toilet"),
          ("PDRM", "toilet"), ("TOILET", "toilet"), ("BATH", "toilet"), ("FRY", "kitchen"), ("KITCHEN", "kitchen"),
          ("DINING", "dining"), ("DINNING", "dining"), ("POOJA", "puja"), ("PUJA", "puja"), ("MANDIR", "puja"),
          ("SITTING", "living"), ("LOUNGE", "living"), ("DRAWING", "living"), ("LIVING", "living"), ("GREAT ROOM", "living"),
          ("FAMILY", "living"), ("PASSAGE", "passage"), ("LOBBY", "passage"), ("STAIR", "stair"), ("STORE", "store"),
          ("PORCH", "porch"), ("BALCONY", "balcony"), ("WASH", "utility"), ("UTILITY", "utility"), ("STUDY", "study"),
          ("OFFICE", "study"), ("FOYER", "entrance"), ("ENTRY", "entrance"), ("DRESS", "dress"), ("W.I.C", "dress"),
          ("LIFT", "lift"), ("LAWN", "lawn"), ("LANDSCAPE", "lawn"), ("SERVANT", "help"), ("GUARD", "help")]
DIM = re.compile(r"(\d{1,2})\s*['’′]\s*-?\s*(\d{1,2})?(?:\s*\d/\d)?\s*[\"”″]?\s*[xX×]\s*(\d{1,2})\s*['’′]\s*-?\s*(\d{1,2})?")


def room_type(text: str):
    t = text.upper()
    if "/" in t and "DRESS" in t:
        return None  # combined dress/toilet: ambiguous
    return next((v for k, v in LABELS if k in t), None)


def barriers(img: np.ndarray, gap_px: int = 0) -> np.ndarray:
    b, g, r = (img[..., i].astype(int) for i in range(3))
    blue = ((b > 140) & (r < 110) & (g < 110)).astype(np.uint8) * 255   # wall layer
    cyan = (b > 140) & (g > 140) & (r < 120)                             # doors, windows, frames
    red = (r > 160) & (g < 90) & (b < 90)                                # columns
    if gap_px:  # bridge door openings: join wall pieces that line up across a gap of up to gap_px
        blue = cv2.bitwise_or(cv2.morphologyEx(blue, cv2.MORPH_CLOSE, np.ones((1, gap_px), np.uint8)),
                              cv2.morphologyEx(blue, cv2.MORPH_CLOSE, np.ones((gap_px, 1), np.uint8)))
    m = ((blue > 0) | cyan | red).astype(np.uint8) * 255
    return cv2.dilate(m, np.ones((3, 3), np.uint8), iterations=2)


def outline_px(img: np.ndarray) -> float:
    b, g, r = (img[..., i].astype(int) for i in range(3))
    ys, xs = np.nonzero((b > 140) & (r < 110) & (g < 110))
    return float(max(xs.max() - xs.min(), ys.max() - ys.min()))


def ocr(img: np.ndarray, eng):
    """[(text, x, y)] in original image coordinates, from the image and its two 90-degree rotations."""
    H, W = img.shape[:2]
    out = []
    for rot in (None, cv2.ROTATE_90_CLOCKWISE, cv2.ROTATE_90_COUNTERCLOCKWISE):
        res = eng(img if rot is None else cv2.rotate(img, rot))
        if res.boxes is None:
            continue
        for box, txt, sc in zip(res.boxes, res.txts, res.scores):
            if sc < 0.6:
                continue
            cx, cy = float(np.mean(box[:, 0])), float(np.mean(box[:, 1]))
            x, y = (cy, H - 1 - cx) if rot == cv2.ROTATE_90_CLOCKWISE else (W - 1 - cy, cx) if rot is not None else (cx, cy)
            out.append((txt.replace("−", "-"), x, y))
    return out


def parse_dims(text: str):
    m = DIM.search(text.replace(" ", ""))
    if not m:
        return None
    a = int(m.group(1)) + int(m.group(2) or 0) / 12
    b = int(m.group(3)) + int(m.group(4) or 0) / 12
    return (a, b) if 3 <= a <= 60 and 3 <= b <= 60 else None


def norm(t: str) -> str:
    return re.sub(r"[^A-Z]", "", t.upper())


def printed_sizes(file: str):
    """Room sizes transcribed from this sheet by the vision pass (data/extra/indian_houses/room_sizes.jsonl)."""
    for l in open(f"{DIR}/room_sizes.jsonl", encoding="utf-8"):
        p = json.loads(l)
        if p["file"] == file:
            return [(norm(r["label"] or ""), (r["w_ft"], r["d_ft"])) for r in p["rooms"] if r.get("w_ft") and r.get("d_ft")]
    return []


def trace(path: str, plot_long_ft: float, eng):
    img = cv2.imread(path)
    H, W = img.shape[:2]
    b, g, r = (img[..., i].astype(int) for i in range(3))
    if ((b > 140) & (r < 110) & (g < 110)).sum() < 2000:
        return {"file": os.path.basename(path), "ok": False, "reason": "no blue wall layer (different CAD colours)", "rooms": []}
    ppf0 = outline_px(img) / plot_long_ft  # rough scale, only to size the door-gap bridge
    def label_map(gap_ft):
        wall = barriers(img, gap_px=int(gap_ft * ppf0))
        _, lab, stats, _ = cv2.connectedComponentsWithStats(cv2.bitwise_not(wall), connectivity=4)
        return lab, stats

    def enclosed(stats, rid):  # a real room: not tiny, not huge, not touching the sheet edge (= outside)
        x, y, w, h, a = stats[rid]
        return 0.001 * H * W < a < 0.3 * H * W and x > 0 and y > 0 and x + w < W and y + h < H

    lab, stats = label_map(3.8)        # ordinary doors
    lab2, stats2 = label_map(6.5)      # wide openings and double doors, for labels pass 1 can't enclose
    texts = ocr(img, eng)
    labels, dims = [], []
    for t, x, y in texts:
        d = parse_dims(t)
        if d:
            dims.append((d, x, y))
        rt = room_type(t)
        if rt and not any(L["type"] == rt and math.hypot(L["x"] - x, L["y"] - y) < 60 for L in labels):  # same label read twice
            labels.append({"text": t, "type": rt, "x": x, "y": y})
    printed = printed_sizes(os.path.basename(path))
    for L in labels:
        # printed size: from the checked transcription for this label; if the label repeats (two BED ROOMs),
        # pick the transcribed size closest to the OCR dimension string nearest the label
        same = [d for k, d in printed if k == norm(L["text"])]
        near = sorted((math.hypot(x - L["x"], y - L["y"]), d) for d, x, y in dims)
        near = [d for dist, d in near if dist < 8 * ppf0]
        if len(same) == 1:
            L["dims_ft"] = same[0]
        elif same and near:
            L["dims_ft"] = min(same, key=lambda d: abs(d[0] * d[1] - near[0][0] * near[0][1]))
        else:
            L["dims_ft"] = None
        L["region"] = None
        for pas, (lm, st) in enumerate(((lab, stats), (lab2, stats2))):
            win = lm[max(0, int(L["y"]) - 60):int(L["y"]) + 60, max(0, int(L["x"]) - 60):int(L["x"]) + 60]
            vals = win[win > 0]
            rid = int(np.bincount(vals.ravel()).argmax()) if vals.size else 0
            if rid and enclosed(st, rid):
                L["region"] = (pas, rid)
                break
    rooms = []
    by_region = {}
    for L in labels:
        if L["region"]:
            by_region.setdefault(L["region"], []).append(L)
    for (pas, rid), Ls in by_region.items():
        mask = ((lab, lab2)[pas] == rid)
        if len(Ls) > 1:  # open plan: each pixel goes to the nearest label
            ys, xs = np.nonzero(mask)
            d = np.stack([np.hypot(xs - L["x"], ys - L["y"]) for L in Ls])
            owner = d.argmin(0)
        for i, L in enumerate(Ls):
            m = np.zeros((H, W), np.uint8)
            if len(Ls) > 1:
                m[ys[owner == i], xs[owner == i]] = 1
            else:
                m[mask] = 1
            cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if not cnts:
                continue
            c = max(cnts, key=cv2.contourArea)
            rooms.append({"type": L["type"], "label": L["text"], "dims_ft": L["dims_ft"], "area_px": float(cv2.contourArea(c)),
                          "split": len(Ls) > 1, "polygon_px": cv2.approxPolyDP(c, 3, True)[:, 0, :].tolist()})
    ratios = [math.sqrt(r["area_px"] / (r["dims_ft"][0] * r["dims_ft"][1])) for r in rooms if r["dims_ft"] and not r["split"]]
    if len(ratios) < 3:
        return {"file": os.path.basename(path), "ok": False, "reason": "too few sized rooms to fix the scale", "rooms": []}
    ppf = float(np.median(ratios))
    for r in rooms:
        printed = r["dims_ft"][0] * r["dims_ft"][1] if r["dims_ft"] else None
        r["area_ft2"] = round(r["area_px"] / ppf ** 2, 1)
        r["area_error"] = round(r["area_ft2"] / printed - 1, 3) if printed else None
        r["verified"] = printed is not None and abs(r["area_error"]) <= 0.15
        r["polygon_m"] = [[round(x / ppf * FT, 3), round(y / ppf * FT, 3)] for x, y in r.pop("polygon_px")]
    return {"file": os.path.basename(path), "ok": True, "px_per_ft": round(ppf, 2), "rooms": rooms}


def main():
    from rapidocr import RapidOCR
    import logging
    logging.disable(logging.WARNING)
    eng = RapidOCR()
    plots = {}
    for l in open(f"{DIR}/programs.jsonl", encoding="utf-8"):
        p = json.loads(l)
        if p.get("plot_w_ft"):
            plots[p["id"].replace("indian_house_", "") + ".jpg"] = max(p["plot_w_ft"], p["plot_d_ft"])
    files = sys.argv[1:] or sorted(os.listdir(f"{DIR}/images"))
    out_path = f"{DIR}/traced.jsonl" if len(sys.argv) == 1 else None
    done = set()
    if out_path and os.path.exists(out_path):
        done = {json.loads(l)["file"] for l in open(out_path, encoding="utf-8")}
    for f in files:
        if f in done or f not in plots:
            continue
        res = trace(f"{DIR}/images/{f}", plots[f], eng)
        v = sum(r["verified"] for r in res["rooms"])
        print(f, "ok" if res["ok"] else res.get("reason"), f"{v}/{len(res['rooms'])} verified", flush=True)
        if out_path:
            with open(out_path, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(res) + "\n")
        else:
            for r in res["rooms"]:
                print("  ", r["type"], r["label"], r["dims_ft"], r["area_ft2"] if "area_ft2" in r else "", r.get("area_error"), "split" if r["split"] else "")


if __name__ == "__main__":
    main()
