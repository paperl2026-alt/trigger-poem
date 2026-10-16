"""Bring the P5-style title parts (art/raw/r15/*.png, tools/job_specs15.py) into the base pack as ui/p5_<name>.
Full-screen layers (back, front, plate) keep their 16:9 frame at 1920x1080; everything else is trimmed to its pixels.
usage: python -I tools/r15_import.py [name ...]"""
import sys, json, pathlib
import numpy as np
from scipy import ndimage
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "art" / "raw" / "r15"
OUT = ROOT / "public" / "content" / "base" / "assets"
FULL = ("p5_back", "p5_front", "p5_plate")
# parts that came back with loose specks around the shape: keep only the shape itself (largest solid piece)
SOLID = ("icon_play",)
# ink flecks Codex added where the controls sit (not in the mockup): cleared, in mockup pixels [x0, y0, x1, y1]
CLEAR = {"p5_front": [[30, 185, 660, 600]]}
# the front layer's black parts (skyline, flecks) must be where the mockup is black too: Codex added flecks elsewhere
MATCH_DARK = ("p5_front",)
MOCK = ROOT / "art" / "ref" / "ui_p5.png"
if __name__ == "__main__":
    names = sys.argv[1:]
    mp = OUT / "manifest.json"; man = json.loads(mp.read_text())
    for p in sorted(SRC.glob("*.png")):
        if names and p.stem not in names:
            continue
        key = p.stem if p.stem.startswith("p5_") else f"p5_{p.stem}"
        im = Image.open(p)
        if p.stem in CLEAR:
            arr = np.asarray(im.convert("RGBA")).copy()
            for x0, y0, x1, y1 in CLEAR[p.stem]: arr[y0:y1, x0:x1, 3] = 0
            im = Image.fromarray(arr)
        if p.stem in MATCH_DARK:
            arr = np.asarray(im.convert("RGBA")).copy()
            mk = np.asarray(Image.open(MOCK).convert("L").resize((arr.shape[1], arr.shape[0]))).astype(np.int16)
            mock_dark = ndimage.binary_dilation(mk < 100, iterations=2)
            lum = arr[..., :3].astype(np.int16).mean(-1)
            arr[..., 3] = np.where((lum < 90) & ~mock_dark, 0, arr[..., 3])
            im = Image.fromarray(arr)
        if p.stem in FULL:
            im = im.convert("RGB" if p.stem in ("p5_back", "p5_plate") else "RGBA").resize((1920, 1080), Image.LANCZOS)
        else:
            im = im.convert("RGBA")
            if p.stem in SOLID:
                arr = np.asarray(im).copy(); lab, n = ndimage.label(arr[..., 3] > 128)
                big = lab == 1 + np.argmax(ndimage.sum(lab > 0, lab, range(1, n + 1)))
                big = ndimage.binary_fill_holes(big)
                arr[..., 3] = np.minimum(arr[..., 3], (ndimage.gaussian_filter(big.astype(np.float32), 0.8) * 255).astype(np.uint8))
                im = Image.fromarray(arr)
            a = np.asarray(im)[..., 3]
            ys, xs = np.where(a > 24); im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
            s = min(1, 1600 / max(im.size))
            if s < 1: im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        (OUT / "ui").mkdir(exist_ok=True)
        im.save(OUT / "ui" / f"{key}.webp", quality=90, method=6)
        man[f"ui/{key}"] = {"src": f"assets/ui/{key}.webp", "w": im.width, "h": im.height, "dom": True}
        print(f"ui/{key}", im.size)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
