"""
Kaggle job (free GPU): installs Blender 4.2 LTS and renders every house in the private dataset nestora-renders
(made by scripts/export_house_scene.mts, plus scripts/blender/render_house.py copied in). For each house: a quick test
render first; only if it succeeds, the full render (and the bake when the house folder has a "bake" file).
Results go to /kaggle/working/<house_id>/.
"""
import glob
import os
import subprocess
import tarfile
import time
import urllib.request

BLENDER = "https://download.blender.org/release/Blender4.2/blender-4.2.3-linux-x64.tar.xz"
_found = glob.glob("/kaggle/input/**/render_house.py", recursive=True)  # the mount path differs between Kaggle versions
if not _found:
    raise SystemExit("dataset not found; /kaggle/input has: " + str(glob.glob("/kaggle/input/**", recursive=True)[:30]))
DATA = os.path.dirname(_found[0])
OUT = "/kaggle/working"

t0 = time.time()
tar = "/tmp/blender.tar.xz"
urllib.request.urlretrieve(BLENDER, tar)
with tarfile.open(tar) as tf:
    tf.extractall("/tmp", filter="tar")
exe = glob.glob("/tmp/blender-4.2*/blender")[0]
print(f"blender ready in {time.time() - t0:.0f}s", flush=True)
script = os.path.join(DATA, "render_house.py")

for house in sorted(d for d in glob.glob(os.path.join(DATA, "nest_*")) if os.path.isdir(d)):
    hid = os.path.basename(house)
    out = os.path.join(OUT, hid)
    for q in ("test", "full"):
        t = time.time()
        cmd = [exe, "-b", "-P", script, "--", house, out, "--quality", q]
        if q == "full" and os.path.exists(os.path.join(house, "bake")):
            cmd.append("--bake")
        r = subprocess.run(cmd, capture_output=True, text=True)
        tail = (r.stdout + r.stderr).strip().splitlines()[-6:]
        print(f"{hid} {q}: exit {r.returncode} in {time.time() - t:.0f}s", *tail, sep="\n  ", flush=True)
        if r.returncode != 0:
            break  # fix the test before spending GPU time on the full render
print(f"all done in {time.time() - t0:.0f}s")

# ---- AI repaint: SDXL + canny ControlNet repaints the Blender render into a photo in the house's style.
# The edges of the render hold the shape; a result whose edges drift from the render's is rejected (retry gentler,
# else keep the Blender render). Models: RealVisXL V5.0 (SDXL fine-tune) and controlnet-canny-sdxl-1.0, both CreativeML OpenRAIL++-M.
import json  # noqa: E402

import cv2  # noqa: E402
import numpy as np  # noqa: E402

subprocess.run(["pip", "install", "-q", "diffusers>=0.30", "accelerate"], check=False)
import torch  # noqa: E402
from diffusers import ControlNetModel, StableDiffusionXLControlNetImg2ImgPipeline  # noqa: E402
from PIL import Image  # noqa: E402

t1 = time.time()
cn = ControlNetModel.from_pretrained("diffusers/controlnet-canny-sdxl-1.0", torch_dtype=torch.float16)
pipe = StableDiffusionXLControlNetImg2ImgPipeline.from_pretrained(
    "SG161222/RealVisXL_V5.0", controlnet=cn, torch_dtype=torch.float16).to("cuda")  # photoreal SDXL fine-tune (OpenRAIL++-M)
getattr(pipe, 'enable_vae_slicing', None) and pipe.enable_vae_slicing() or pipe.vae.enable_slicing()  # renamed in newer diffusers
print(f"repaint models ready in {time.time() - t1:.0f}s", flush=True)


def words(x):
    return x.replace("_", " ") if isinstance(x, str) else ""


def prompt_for(info):
    lk = (info.get("look") or {})
    ex = lk.get("exterior") or {}
    walls = ex.get("wall") or []
    wall = f"{words(walls[0])} ground floor" + (f", {words(walls[1])} upper floor" if len(walls) > 1 and walls[1] != walls[0] else "")
    roof = "flat roof terrace with parapet" if ex.get("roof_material") in (None, "concrete_flat", "green_roof") else f"{words(ex.get('roof_material'))} pitched roof"
    return (f"professional architectural photograph of a {words(lk.get('style', 'contemporary'))} style house in India, {wall}, {roof}, "
            f"{words(ex.get('window'))} windows with {words(ex.get('frame'))} frames, {words(ex.get('entrance'))}, {words(ex.get('boundary'))}, "
            "DSLR photograph, golden hour sunlight, mature trees and shrubs, landscaped front garden, potted plants, blue sky with soft clouds, "
            "weathered realistic materials, detailed brick and tile texture, photorealistic, sharp focus, 8k")


NEG = ("3d render, cgi, plastic, clay model, video game, cartoon, illustration, flat colours, distorted, warped walls, extra floors, "
       "people, cars, text, watermark, signature, logo, letters, blurry, painting, drawing")


def edges(img):
    g = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY)
    return cv2.Canny(g, 80, 160)


def kept_shape(src_edges, out_img):
    """Share of the render's edges that the repaint still has within 4 px (walls, windows, roof lines)."""
    o = cv2.dilate(edges(out_img), np.ones((9, 9), np.uint8))
    s = src_edges > 0
    return float((o[s] > 0).mean()) if s.any() else 0.0


for house in sorted(d for d in glob.glob(os.path.join(DATA, "nest_*")) if os.path.isdir(d)):
    hid = os.path.basename(house)
    src = os.path.join(OUT, hid, f"{hid}_full.png")
    if not os.path.exists(src):
        continue
    info = json.load(open(os.path.join(house, "scene.json")))
    img = Image.open(src).convert("RGB").resize((1344, 768))
    e = edges(img)
    ctrl = Image.fromarray(np.stack([e] * 3, -1))
    prompt = prompt_for(info)
    print(hid, "prompt:", prompt, flush=True)
    for strength, cscale in ((0.92, 0.55), (0.85, 0.65), (0.75, 0.75)):  # repaint boldly; the edge guide holds the shape
        t = time.time()
        out = pipe(prompt=prompt, negative_prompt=NEG, image=img, control_image=ctrl, strength=strength,
                   controlnet_conditioning_scale=cscale, num_inference_steps=35, guidance_scale=7.0,
                   generator=torch.Generator("cuda").manual_seed(7)).images[0]
        score = kept_shape(e, out)
        print(f"{hid} repaint strength {strength}: shape kept {score:.2f} in {time.time() - t:.0f}s", flush=True)
        if score >= 0.5:
            out.save(os.path.join(OUT, hid, f"{hid}_photo.jpg"), quality=90)
            break
        out.save(os.path.join(OUT, hid, f"{hid}_rejected_{strength}.jpg"), quality=80)  # kept for review
print(f"all done in {time.time() - t0:.0f}s")
