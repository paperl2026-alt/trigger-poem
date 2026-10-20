"""Depth relief for 2D cut-outs (docs/DESIGN.md "场景的技术路线"): covers, props, monster frames, boss parts.
Depth Anything V2 Small (offline, tools/models) estimates how near every pixel of the drawing is; inside the cut-out that becomes a
relief (0 = the farthest part of the object, 1 = the nearest), smoothed, and carried a little past the outline so the mesh edge does
not drop back. The game displaces a dense plane by it (src/core/paper.js "relief") and lights it with normals taken from it, so a
2D drawing has real volume when the camera moves, instead of being a flat card or a card with a uniform thickness.
Writes <key>_rd.png (8-bit grey) next to the image and "relief": "<key>_rd" into the manifest entry.
usage: python -I tools/relief.py <manifest key or prefix*> [...]      e.g. enemy/shoe_* cover/*"""
import sys, json, pathlib, fnmatch
import numpy as np
import torch
from PIL import Image
from scipy import ndimage
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

ROOT = pathlib.Path(__file__).resolve().parent.parent
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)
MODEL = ROOT / "tools" / "models" / "depth-anything-v2-small"
MAXS = 512   # relief maps are small: the mesh has at most ~128 vertices across

if __name__ == "__main__":
    man = packs.manifest()
    keys = [k for pat in sys.argv[1:] for k in man if fnmatch.fnmatch(k, pat) and not k.endswith("_rd")]
    proc = AutoImageProcessor.from_pretrained(MODEL); model = AutoModelForDepthEstimation.from_pretrained(MODEL).eval()
    for k in keys:
        src = man.path(k)
        im = Image.open(src).convert("RGBA")
        s = min(1, MAXS / max(im.size)); im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        a = np.asarray(im)[..., 3].astype(np.float32) / 255
        bg = Image.new("RGBA", im.size, (128, 128, 128, 255)); bg.alpha_composite(im)
        with torch.no_grad():
            pred = model(**proc(images=bg.convert("RGB"), return_tensors="pt")).predicted_depth
        d = torch.nn.functional.interpolate(pred[None], size=im.size[::-1], mode="bicubic", align_corners=False)[0, 0].numpy()
        inside = a > 0.5
        if inside.sum() < 50: print("skip", k); continue
        lo, hi = np.percentile(d[inside], 3), np.percentile(d[inside], 99)
        r = np.clip((d - lo) / max(hi - lo, 1e-6), 0, 1)
        # outside the outline: the nearest inside value, so the edge of the mesh keeps its height
        idx = ndimage.distance_transform_edt(~inside, return_distances=False, return_indices=True)
        r = r[idx[0], idx[1]]
        r = ndimage.gaussian_filter(r, max(1.0, im.width / 220))
        key = f"{k}_rd"
        out = man.dir(k) / "assets" / f"{key}.png"   # (next to its picture, in the same pack)
        Image.fromarray((r * 255).astype(np.uint8)).save(out, optimize=True)
        man.put(key, {"src": f"assets/{key}.png", "w": im.width, "h": im.height}, like=k)   # (in its picture's pack)
        man[k] = {**man[k], "relief": key}
        print(key, im.size)
    man.save()
