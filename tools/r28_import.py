"""Corridor panel art (tools/job_specs28.py, art/raw/r28) -> st3/<name> textures for the panel-built stage (src/battle/panels.js).
Window panes painted pure magenta become transparent; the floor and ceiling are made tileable (their edges blended with a
half-shifted copy, only near the edges); the outside panorama keeps the part that is the open view; decals are sliced from the sheet.
usage: python -I tools/r28_import.py"""
import sys, json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "raw" / "r28"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path.insert(0, str(ROOT / "tools"))
from r23_import import cells


def save(key, im, q=90):
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    (A / key).parent.mkdir(parents=True, exist_ok=True)
    im.save(A / f"{key}.webp", quality=q, method=6)
    man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height}
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
    print(key, im.size)


def key_magenta(im):
    a = np.asarray(im.convert("RGB")).astype(np.int16)
    m = (a[..., 0] > 200) & (a[..., 1] < 90) & (a[..., 2] > 200)
    m = ndimage.binary_dilation(ndimage.binary_opening(m, iterations=1), iterations=2)
    alpha = (255 * (1 - ndimage.gaussian_filter(m.astype(np.float32), 0.8))).astype(np.uint8)
    rgb = a.astype(np.uint8).copy(); rgb[m] = (40, 30, 40)
    return Image.fromarray(np.dstack([rgb, alpha]))


def tileable(im, band=0.14):
    a = np.asarray(im.convert("RGB")).astype(np.float32); H, W = a.shape[:2]
    sh = np.roll(np.roll(a, H // 2, 0), W // 2, 1)
    wx = np.clip(np.minimum(np.arange(W), W - 1 - np.arange(W)) / (W * band), 0, 1)
    wy = np.clip(np.minimum(np.arange(H), H - 1 - np.arange(H)) / (H * band), 0, 1)
    w = np.minimum(wy[:, None], wx[None, :])[..., None]
    w = w * w * (3 - 2 * w)
    return Image.fromarray((a * w + sh * (1 - w)).clip(0, 255).astype(np.uint8))


if __name__ == "__main__":
    for n in ("wallA", "wallB"):
        save(f"st3/{n}", Image.open(RAW / f"{n}.png").convert("RGB").resize((1536, 1024), Image.LANCZOS))
    for n in ("wallW", "end"):
        save(f"st3/{n}", key_magenta(Image.open(RAW / f"{n}.png")))
    for n in ("floor", "ceil"):
        save(f"st3/{n}", tileable(Image.open(RAW / f"{n}.png").resize((1024, 1024), Image.LANCZOS)))
    out = Image.open(RAW / "outside.png").convert("RGB")
    save("st3/outside", out.crop((int(out.width * 0.36), 0, out.width, out.height)).resize((1536, 1024), Image.LANCZOS), q=86)
    for name, im in zip(["sigil", "banner", "cracks", "papers", "bag", "goo"], cells(RAW / "decals.png")):
        if im is not None: save(f"st3/d_{name}", im, q=92)
