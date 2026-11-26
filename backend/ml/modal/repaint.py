"""
Nestora photo service on Modal (free Starter credits): repaints a street-view snapshot of a design's 3D model into a
photo. RealVisXL V5.0 Lightning (few-step SDXL fine-tune) + canny ControlNet; both CreativeML OpenRAIL++-M.
The snapshot's edges hold the house's shape; a result that drops too many of them is retried more gently, then
rejected (HTTP 422) so the app falls back to the Kaggle queue.

Deploy (once, from the repo root, after `modal token new`):  modal deploy backend/ml/modal/repaint.py
Then set on Render: PHOTO_GPU_URL (the printed URL), PHOTO_GPU_KEY / PHOTO_GPU_SECRET (a Modal proxy-auth token).
Cost control: GPU only while a request runs (+60 s idle), model weights baked into the image so cold starts skip
downloads. Set a spend limit in the Modal dashboard so the free credits are never exceeded.
"""
import io

import modal

BASE, CONTROL = "SG161222/RealVisXL_V5.0_Lightning", "diffusers/controlnet-canny-sdxl-1.0"


def download():
    from huggingface_hub import snapshot_download
    snapshot_download(BASE, allow_patterns=["*.json", "*.txt", "*fp16*.safetensors", "*/diffusion_pytorch_model.safetensors",
                                            "*/model.safetensors", "*/model.fp16.safetensors", "*.model"])
    snapshot_download(CONTROL, allow_patterns=["*.json", "*fp16*.safetensors"])


image = (modal.Image.debian_slim(python_version="3.11")
         .pip_install("torch==2.4.1", "diffusers==0.31.0", "transformers==4.46.3", "accelerate==1.1.1", "huggingface_hub==0.26.2",
                      "opencv-python-headless==4.10.0.84", "pillow==11.0.0", "fastapi[standard]==0.115.5")
         .run_function(download))
app = modal.App("nestora-photo", image=image)


def _edges(img):
    import cv2
    import numpy as np
    return cv2.Canny(cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY), 80, 160)


def _kept(src, out_img):
    import cv2
    import numpy as np
    o = cv2.dilate(_edges(out_img), np.ones((9, 9), np.uint8))
    s = src > 0
    return float((o[s] > 0).mean()) if s.any() else 0.0


@app.cls(gpu="T4", scaledown_window=60, timeout=180)
class Photo:
    @modal.enter()
    def load(self):
        import torch
        from diffusers import ControlNetModel, DPMSolverMultistepScheduler, StableDiffusionXLControlNetImg2ImgPipeline
        cn = ControlNetModel.from_pretrained(CONTROL, torch_dtype=torch.float16, variant="fp16")
        self.pipe = StableDiffusionXLControlNetImg2ImgPipeline.from_pretrained(BASE, controlnet=cn, torch_dtype=torch.float16).to("cuda")
        self.pipe.scheduler = DPMSolverMultistepScheduler.from_config(self.pipe.scheduler.config, use_karras_sigmas=True,
                                                                      algorithm_type="sde-dpmsolver++")
        self.pipe.vae.enable_slicing()

    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
    async def repaint(self, request: "fastapi.Request"):  # noqa: F821
        import numpy as np
        import torch
        from fastapi import Response
        from PIL import Image
        form = await request.form()
        guide = Image.open(io.BytesIO(await form["guide"].read())).convert("RGB").resize((1344, 768))
        prompt, negative = str(form.get("prompt", ""))[:1500], str(form.get("negative", ""))[:800]
        e = _edges(guide)
        ctrl = Image.fromarray(np.stack([e] * 3, -1))
        for strength, cscale in ((0.9, 0.55), (0.8, 0.65), (0.7, 0.75)):
            out = self.pipe(prompt=prompt, negative_prompt=negative, image=guide, control_image=ctrl, strength=strength,
                            controlnet_conditioning_scale=cscale, num_inference_steps=7, guidance_scale=1.8,
                            generator=torch.Generator("cuda").manual_seed(7)).images[0]
            if _kept(e, out) >= 0.5:
                buf = io.BytesIO()
                out.save(buf, "JPEG", quality=90)
                return Response(buf.getvalue(), media_type="image/jpeg")
        return Response("shape changed too much", status_code=422)
