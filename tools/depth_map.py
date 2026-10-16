"""Depth map of a painting with Depth Anything V2 Small (tools/models/depth-anything-v2-small, CPU). Writes a 16-bit PNG
(near = bright) next to the output name, at the painting's size, for the 2.5D scene builder.
usage: python -I tools/depth_map.py <painting.png> <out_depth.png>"""
import sys, pathlib
import numpy as np
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODEL = ROOT / "tools" / "models" / "depth-anything-v2-small"

if __name__ == "__main__":
    src, out = sys.argv[1], sys.argv[2]
    im = Image.open(src).convert("RGB")
    proc = AutoImageProcessor.from_pretrained(MODEL); model = AutoModelForDepthEstimation.from_pretrained(MODEL).eval()
    with torch.no_grad():
        pred = model(**proc(images=im, return_tensors="pt")).predicted_depth          # relative inverse depth (bigger = nearer)
    d = torch.nn.functional.interpolate(pred[None], size=im.size[::-1], mode="bicubic", align_corners=False)[0, 0].numpy()
    d = (d - d.min()) / max(d.max() - d.min(), 1e-6)
    Image.fromarray((d * 65535).astype(np.uint16)).save(out)
    Image.fromarray((d * 255).astype(np.uint8)).save(out.replace(".png", "_preview.png"))
    print(out, im.size)
