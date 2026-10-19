"""Finds cut-out pictures that caught a piece of their neighbour (user 2026-10-19: things cut from a sheet of several had bits of the
next one at their edges) and, with --fix, takes those pieces off.
A piece = a separate blob of opaque pixels (alpha > 40, after closing small gaps) that is not the main blob, is big enough to see (over
0.15% of the picture) and is SLICED by the picture's border: along some side it runs on the border line for over a third of its own
extent there (the cut of the sheet went through the neighbour). The picture's own separate bits (a glyph's strokes, sparks, the parts
of a reticle) only touch the border at a point where the trim was tight.
Pictures with a part of THEMSELVES cut off (a glyph missing its bottom half) show up too when that cut part is a separate blob; those
need cutting again from the sheet, not --fix.
  python -I tools/cutout_check.py [prefix ...]          report + art/raw/_cutout/sheet_<n>.png (each flagged picture, the pieces in red)
  python -I tools/cutout_check.py --fix key [key ...]   clear those pieces in the content pack's picture (webp), keep its size
Only pictures with transparency are looked at (the manifest's keys under the prefixes; default: enemy/ prop/ cover/ ui/ fx/ item/ ep2/ down/)."""
import json, pathlib, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[1]
A = ROOT / "public" / "content" / "base" / "assets"
OUT = ROOT / "art" / "raw" / "_cutout"


def pieces(im):
    a = np.asarray(im.getchannel("A")) > 40
    if a.mean() > 0.97 or a.mean() < 0.002: return None, []
    lab, n = ndimage.label(ndimage.binary_closing(a, iterations=2), structure=np.ones((3, 3)))
    if n < 2: return lab, []
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)); main = 1 + int(np.argmax(sizes))
    H, W = a.shape; out = []
    for i in range(1, n + 1):
        if i == main or sizes[i - 1] < 0.0015 * H * W: continue
        m = lab == i; ys, xs = np.nonzero(m); ex, ey = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
        cut = max(m[:4].any(0).sum() / ex, m[-4:].any(0).sum() / ex, m[:, :4].any(1).sum() / ey, m[:, -4:].any(1).sum() / ey)
        if cut > 0.33: out.append(i)
    return lab, out


def main():
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    man = json.loads((A / "manifest.json").read_text())
    if "--fix" in sys.argv:
        for key in args:
            p = A / man[key]["src"].replace("assets/", ""); im = Image.open(p).convert("RGBA"); lab, bad = pieces(im)
            if not bad: print("nothing on", key); continue
            a = np.asarray(im).copy(); a[np.isin(lab, bad), 3] = 0
            Image.fromarray(a).save(p, quality=92, method=6) if p.suffix == ".webp" else Image.fromarray(a).save(p)
            print("fixed", key, len(bad), "pieces")
        return
    pre = tuple(args) or ("enemy/", "prop/", "cover/", "ui/", "fx/", "item/", "ep2/", "down/")
    flagged = []
    for key, m in sorted(man.items()):
        if not key.startswith(pre) or m.get("dom") is None and False: continue
        if not key.startswith(pre): continue
        p = A / m["src"].replace("assets/", "")
        if not p.exists(): continue
        im = Image.open(p)
        if im.mode not in ("RGBA", "LA", "P") and "transparency" not in im.info: continue
        im = im.convert("RGBA"); lab, bad = pieces(im)
        if bad: flagged.append((key, im, lab, bad))
    print(len(flagged), "pictures with pieces at their edges")
    for k, *_ in flagged: print(" ", k)
    OUT.mkdir(parents=True, exist_ok=True)
    for s in range(0, len(flagged), 20):
        cell = 300; sheet = Image.new("RGB", (cell * 5, cell * 4), (40, 40, 48)); d = ImageDraw.Draw(sheet)
        for j, (key, im, lab, bad) in enumerate(flagged[s:s + 20]):
            a = np.asarray(im).astype(np.float32); bg = np.full_like(a[..., :3], 90.0); al = a[..., 3:] / 255
            rgb = a[..., :3] * al + bg * (1 - al); rgb[np.isin(lab, bad)] = [255, 30, 60]
            t = Image.fromarray(rgb.astype(np.uint8)); t.thumbnail((cell - 8, cell - 24))
            x, y = (j % 5) * cell, (j // 5) * cell; sheet.paste(t, (x + 4, y + 20)); d.text((x + 4, y + 4), key, fill=(255, 220, 120))
        sheet.save(OUT / f"sheet_{s // 20}.png")


if __name__ == "__main__":
    main()
