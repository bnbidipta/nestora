"""
Kaggle job (free GPU), the slow fallback for photoreal pictures: repaints each house's street-view snapshot
(guide.png, taken by the browser from the app's 3D model) into a photo, with the same model and shape check as the
fast Modal service (backend/ml/modal/repaint.py). The prompt comes from the backend (prompt.txt, written by
scripts/render_batch.py). Results: /kaggle/working/<house_id>/<house_id>_photo.jpg.
Models: RealVisXL V5.0 Lightning + controlnet-canny-sdxl-1.0, both CreativeML OpenRAIL++-M.
"""
import glob
import os
import subprocess
import time

subprocess.run(["pip", "install", "-q", "diffusers>=0.30", "accelerate"], check=False)
import cv2  # noqa: E402
import numpy as np  # noqa: E402
import torch  # noqa: E402
from diffusers import ControlNetModel, DPMSolverMultistepScheduler, StableDiffusionXLControlNetImg2ImgPipeline  # noqa: E402
from PIL import Image  # noqa: E402

_found = glob.glob("/kaggle/input/**/negative.txt", recursive=True)  # the mount path differs between Kaggle versions
if not _found:
    raise SystemExit("dataset not found; /kaggle/input has: " + str(glob.glob("/kaggle/input/**", recursive=True)[:30]))
DATA, OUT = os.path.dirname(_found[0]), "/kaggle/working"
NEG = open(_found[0], encoding="utf-8").read()
Image.MAX_IMAGE_PIXELS = 2048 * 2048

t0 = time.time()
cn = ControlNetModel.from_pretrained("diffusers/controlnet-canny-sdxl-1.0", torch_dtype=torch.float16, variant="fp16")
pipe = StableDiffusionXLControlNetImg2ImgPipeline.from_pretrained("SG161222/RealVisXL_V5.0_Lightning", controlnet=cn,
                                                                  torch_dtype=torch.float16).to("cuda")
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config, use_karras_sigmas=True, algorithm_type="sde-dpmsolver++")
pipe.vae.enable_slicing()
print(f"models ready in {time.time() - t0:.0f}s", flush=True)


def edges(img):
    return cv2.Canny(cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY), 80, 160)


def kept_shape(src, out_img):
    """Share of the snapshot's edges (walls, windows, roof lines) the photo still has within 4 px."""
    o = cv2.dilate(edges(out_img), np.ones((9, 9), np.uint8))
    s = src > 0
    return float((o[s] > 0).mean()) if s.any() else 0.0


for house in sorted(d for d in glob.glob(os.path.join(DATA, "nest_*")) if os.path.isdir(d)):
    hid = os.path.basename(house)
    os.makedirs(os.path.join(OUT, hid), exist_ok=True)
    guide = Image.open(os.path.join(house, "guide.png")).convert("RGB").resize((1344, 768))
    prompt = open(os.path.join(house, "prompt.txt"), encoding="utf-8").read()
    e = edges(guide)
    ctrl = Image.fromarray(np.stack([e] * 3, -1))
    for strength, cscale in ((0.9, 0.55), (0.8, 0.65), (0.7, 0.75)):
        t = time.time()
        out = pipe(prompt=prompt, negative_prompt=NEG, image=guide, control_image=ctrl, strength=strength,
                   controlnet_conditioning_scale=cscale, num_inference_steps=7, guidance_scale=1.8,
                   generator=torch.Generator("cuda").manual_seed(7)).images[0]
        score = kept_shape(e, out)
        print(f"{hid} strength {strength}: shape kept {score:.2f} in {time.time() - t:.0f}s", flush=True)
        if score >= 0.5:
            out.save(os.path.join(OUT, hid, f"{hid}_photo.jpg"), quality=90)
            break
print(f"all done in {time.time() - t0:.0f}s")
