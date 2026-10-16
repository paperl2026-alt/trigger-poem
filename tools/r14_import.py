"""Bring the strictly-decomposed title parts (art/raw/r14/*.png, see tools/job_specs14.py) into the base pack as ui/t_<name>,
trimmed to their visible pixels. The scene plate is split into two depth layers with the local depth model
(tools/models/depth-anything-v2-small): t_far = the whole plate (the view through the window, behind), t_room = the plate
with the far parts (window glass / outside) made transparent, so the two can slide at different speeds.
usage: python -I tools/r14_import.py [name ...]      (no names = everything that exists)
"""
import sys, json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "art" / "raw" / "r14"
OUT = ROOT / "public" / "content" / "base" / "assets"


def save(im, name, man, max_side=1600, quality=92):
    s = min(1, max_side / max(im.size))
    if s < 1:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    (OUT / "ui").mkdir(parents=True, exist_ok=True)
    im.save(OUT / "ui" / f"{name}.webp", quality=quality, method=6)
    man[f"ui/{name}"] = {"src": f"assets/ui/{name}.webp", "w": im.width, "h": im.height, "dom": True}
    print(f"ui/{name}", im.size)


def part(path, man):
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im)[..., 3]
    if a.min() > 200:
        print(f"!! {path.name} has no transparency - check it by eye")
    ys, xs = np.where(a > 24)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    save(im, f"t_{path.stem}", man)


def plate(path, man):
    from transformers import pipeline
    im = Image.open(path).convert("RGB").resize((1920, 1080), Image.LANCZOS)
    pipe = pipeline("depth-estimation", model=str(ROOT / "tools" / "models" / "depth-anything-v2-small"))
    d = np.asarray(pipe(im)["depth"].resize(im.size), np.float32)
    d = (d - d.min()) / max(1e-6, d.max() - d.min())       # 0 far .. 1 near
    far = d < np.percentile(d, 22) + 0.04                    # the view through the window
    far = ndimage.binary_opening(far, iterations=2)
    far = ndimage.binary_closing(far, iterations=3)
    alpha = 1 - ndimage.gaussian_filter(far.astype(np.float32), 1.5)
    room = np.dstack([np.asarray(im), (np.clip(alpha, 0, 1) * 255).astype(np.uint8)])
    save(im, "t_far", man, max_side=1920, quality=88)
    save(Image.fromarray(room), "t_room", man, max_side=1920, quality=90)
    Image.fromarray((d * 255).astype(np.uint8)).save(SRC / "scene_depth.png")
    print("far fraction", round(float(far.mean()), 3))


if __name__ == "__main__":
    names = sys.argv[1:]
    mp = OUT / "manifest.json"; man = json.loads(mp.read_text())
    for p in sorted(SRC.glob("*.png")):
        if p.stem == "scene_depth" or (names and p.stem not in names):
            continue
        plate(p, man) if p.stem == "scene_plate" else part(p, man)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
