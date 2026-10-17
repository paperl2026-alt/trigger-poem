"""The corridor in many versions (tools/job_specs31.py, art/raw/r31; the lost left wall from art/raw/r32) -> st3/ textures.
  - left walls st3/wallL<n> (opaque), right walls st3/wallR<n> and the end wall st3/end2 (window panes keyed out, "keyed": true);
  - floors st3/floor<n> and ceilings st3/ceil<n>: made tileable like R28's, then their edges are blended into the R28 tile's edges, so
    every version meets every other one (and R28's) without a seam, in any order.
The decals of R31 had glow drawn in (docs/ART.md: no effects in the art) and are not imported; R32 redoes them.
usage: python -I tools/r31_import.py"""
import sys, json, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "raw" / "r31"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path.insert(0, str(ROOT / "tools"))
from r28_import import key_magenta, tileable


def save(man, key, im, q=90, **extra):
    (A / key).parent.mkdir(parents=True, exist_ok=True)
    im.save(A / f"{key}.webp", quality=q, method=6)
    man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height, **extra}
    print(key, im.size)


def same_edges(im, base, band=0.14):
    """the edge band of a tileable picture replaced (smoothly) by the base tile's, so all versions share their borders"""
    a = np.asarray(im.convert("RGB")).astype(np.float32); b = np.asarray(base.convert("RGB").resize(im.size, Image.LANCZOS)).astype(np.float32)
    H, W = a.shape[:2]
    wx = np.clip(np.minimum(np.arange(W), W - 1 - np.arange(W)) / (W * band), 0, 1)
    wy = np.clip(np.minimum(np.arange(H), H - 1 - np.arange(H)) / (H * band), 0, 1)
    w = np.minimum(wy[:, None], wx[None, :])[..., None]; w = w * w * (3 - 2 * w)
    return Image.fromarray((a * w + b * (1 - w)).clip(0, 255).astype(np.uint8))


if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    for n in range(1, 9):
        src = RAW / f"wallL{n}.png"
        if not src.exists(): src = ROOT / "art" / "raw" / "r32" / f"wallL{n}.png"
        if src.exists(): save(man, f"st3/wallL{n}", Image.open(src).convert("RGB").resize((1536, 1024), Image.LANCZOS))
        else: print("missing", src.name)
    for n in range(1, 9):
        save(man, f"st3/wallR{n}", key_magenta(Image.open(RAW / f"wallR{n}.png").resize((1536, 1024), Image.LANCZOS)), keyed=True)
    save(man, "st3/end2", key_magenta(Image.open(RAW / "end2.png").resize((1536, 1024), Image.LANCZOS)), keyed=True)
    for kind in ("floor", "ceil"):
        base = tileable(Image.open(ROOT / "art" / "raw" / "r28" / f"{kind}.png").resize((1024, 1024), Image.LANCZOS))
        for n in (2, 3, 4):
            im = tileable(Image.open(RAW / f"{kind}{n}.png").resize((1024, 1024), Image.LANCZOS))
            save(man, f"st3/{kind}{n}", same_edges(im, base))
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
