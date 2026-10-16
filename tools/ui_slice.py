"""Cut a UI sticker sheet (transparent background, separate items with gaps) into single images for the base pack.
usage: python -I tools/ui_slice.py <sheet.png> <name1,name2,...|-> [--merge N] [--min A] [--preview out.jpg]
  items are found as connected blobs (after growing each by --merge px so a word / tassel stays in one piece), ordered in
  reading order (rows top to bottom, then left to right), trimmed, and written to
  public/content/base/assets/ui/<name>.webp + manifest key "ui/<name>". Use "-" in the name list to skip an item.
  With no names (or a count mismatch) it only reports what it found (and writes the preview) so the names can be checked.
"""
import sys, json, pathlib, argparse
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "content" / "base" / "assets"


def blobs(im, merge, min_frac):
    a = np.asarray(im)[..., 3] > 24
    grown = ndimage.binary_dilation(a, iterations=merge) if merge else a
    lab, n = ndimage.label(grown)
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl is None:
            continue
        ys, xs = sl
        area = int((a[sl] & (lab[sl] == i)).sum())
        if area < a.size * min_frac:
            continue
        boxes.append([xs.start, ys.start, xs.stop, ys.stop, i])
    # reading order: group into rows by vertical overlap, then left to right
    boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
    rows = []
    for b in boxes:
        cy = (b[1] + b[3]) / 2
        for r in rows:
            if r["y0"] <= cy <= r["y1"]:
                r["items"].append(b); r["y0"] = min(r["y0"], b[1]); r["y1"] = max(r["y1"], b[3]); break
        else:
            rows.append({"y0": b[1], "y1": b[3], "items": [b]})
    out = []
    for r in rows:
        out += sorted(r["items"], key=lambda b: b[0])
    return out, lab, a


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet"); ap.add_argument("names", nargs="?", default="")
    ap.add_argument("--merge", type=int, default=8); ap.add_argument("--min", type=float, default=0.0004)
    ap.add_argument("--preview"); ap.add_argument("--max", type=int, default=1400)
    o = ap.parse_args()
    im = Image.open(o.sheet).convert("RGBA")
    found, lab, a = blobs(im, o.merge, o.min)
    names = [n for n in o.names.split(",")] if o.names else []
    print(f"{len(found)} items found" + (f", {len(names)} names given" if names else ""))
    if o.preview:
        pv = Image.new("RGBA", im.size, (90, 90, 100, 255)); pv.alpha_composite(im); d = ImageDraw.Draw(pv)
        for k, (x0, y0, x1, y1, _) in enumerate(found):
            d.rectangle([x0, y0, x1, y1], outline=(255, 255, 0), width=3)
            d.text((x0 + 6, y0 + 4), f"{k}:{names[k] if k < len(names) else '?'}", fill=(255, 255, 0))
        pv.convert("RGB").save(o.preview, quality=85)
    if not names or len(names) != len(found):
        for k, b in enumerate(found):
            print(k, b[:4])
        sys.exit(0 if not names else 1)
    mp = OUT / "manifest.json"
    manifest = json.loads(mp.read_text()) if mp.exists() else {}
    (OUT / "ui").mkdir(parents=True, exist_ok=True)
    for name, (x0, y0, x1, y1, i) in zip(names, found):
        if name == "-":
            continue
        crop = im.crop((x0, y0, x1, y1))
        # keep only this blob's pixels (a neighbour's edge can poke into the box)
        keep = (lab[y0:y1, x0:x1] == i)
        arr = np.asarray(crop).copy(); arr[..., 3] = np.where(keep, arr[..., 3], 0)
        crop = Image.fromarray(arr)
        bb = crop.getbbox(); crop = crop.crop(bb)
        s = min(1, o.max / max(crop.size))
        if s < 1:
            crop = crop.resize((round(crop.width * s), round(crop.height * s)), Image.LANCZOS)
        crop.save(OUT / "ui" / f"{name}.webp", quality=92, method=6)
        manifest[f"ui/{name}"] = {"src": f"assets/ui/{name}.webp", "w": crop.width, "h": crop.height, "dom": True}
        print("ui/" + name, crop.size)
    mp.write_text(json.dumps(manifest, indent=1, sort_keys=True))
