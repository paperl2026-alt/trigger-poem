"""The prologue boss (tools/rounds/job_specs25.py, art/raw/r25/*.png) -> boss/dc_<part> and its weak points.
Weak points are found on the pictures themselves: the forehead third eye (head parts, p2, p3: the reddest blob near the top
middle) and the armband crest on phase 2 (the brightest pink blob on her raised arm side). Stored in the manifest as
"weak": [[u, v, r], ...] in texture uv (v = 0 at the bottom), r in fractions of the picture height. A preview with the circles goes
to art/_shots/boss_weak.jpg.
usage: python -I tools/rounds/r25_import.py"""
import json, pathlib
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r25"
OUT = ROOT / "public" / "content" / "base" / "assets"
PARTS = {   # part: (key, weak search boxes as fractions [x0, y0, x1, y1], colour test)
    "head": ("dc_head", [[0.38, 0.0, 0.62, 0.32]], "eye"),
    "head_eye": ("dc_head_eye", [[0.38, 0.0, 0.62, 0.32]], "eye"),
    "head_blow": ("dc_head_blow", [[0.38, 0.0, 0.62, 0.32]], "eye"),
    "head_hurt": ("dc_head_hurt", [[0.5, 0.0, 0.8, 0.3]], "eye"),
    "hand_grip": ("dc_grip", [], None),
    "hand_slam": ("dc_slam", [], None),
    "hand_throw": ("dc_throw", [], None),
    "p2": ("dc_p2", [[0.62, 0.35, 0.9, 0.75]], "crest"),
    "p2_low": ("dc_p2_low", [], None),
    "p3": ("dc_p3", [[0.36, 0.0, 0.64, 0.3]], "eye"),
}
MAXW = 1672
# measured by eye on art/_shots/boss_weak.jpg where the colour search picks the wrong blob ([u, v, r], v = 0 at the bottom)
FIXED = {"dc_head_eye": [[0.469, 0.835, 0.1]], "dc_head_hurt": [[0.44, 0.85, 0.07]], "dc_p2": [[0.8125, 0.41, 0.075]], "dc_p3": [[0.443, 0.892, 0.1]],
         "dc_head": [[0.448, 0.843, 0.08]], "dc_head_blow": [[0.458, 0.844, 0.08]]}


def find(a, box, kind):
    H, W = a.shape[:2]
    x0, y0, x1, y1 = int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)
    s = a[y0:y1, x0:x1].astype(np.int16)
    R, G, B, A = s[..., 0], s[..., 1], s[..., 2], s[..., 3]
    if kind == "eye":
        m = (R > 150) & (R - G > 70) & (A > 200)
    else:
        m = (R > 200) & (B > 110) & (R - G > 60) & (A > 200) & (R + G + B > 420)
    m = ndimage.binary_opening(m, iterations=1)
    lab, n = ndimage.label(ndimage.binary_closing(m, iterations=4))
    if not n: return None
    sizes = ndimage.sum(m, lab, range(1, n + 1)); k = 1 + int(np.argmax(sizes))
    ys, xs = np.nonzero(lab == k)
    cx, cy = xs.mean() + x0, ys.mean() + y0
    r = max(np.ptp(xs), np.ptp(ys)) / 2 + 6
    return [round(cx / W, 4), round(1 - cy / H, 4), round(r / H, 4)]


if __name__ == "__main__":
    mp = OUT / "manifest.json"; man = json.loads(mp.read_text())
    (OUT / "boss").mkdir(exist_ok=True)
    tiles = []
    for part, (key, boxes, kind) in PARTS.items():
        im = Image.open(RAW / f"{part}.png").convert("RGBA")
        if im.width > MAXW: im = im.resize((MAXW, round(im.height * MAXW / im.width)), Image.LANCZOS)
        a = np.asarray(im)
        weak = FIXED.get(key) or [[float(x) for x in w] for w in (find(a, b, kind) for b in boxes) if w]
        im.save(OUT / "boss" / f"{key}.webp", quality=90, method=6)
        man[f"boss/{key}"] = {"src": f"assets/boss/{key}.webp", "w": im.width, "h": im.height, "hit": True, "weak": weak}
        prev = Image.new("RGBA", im.size, (60, 60, 70, 255)); prev.alpha_composite(im); d = ImageDraw.Draw(prev)
        for u, v, r in weak:
            x, y, rr = u * im.width, (1 - v) * im.height, r * im.height
            d.ellipse([x - rr, y - rr, x + rr, y + rr], outline=(0, 255, 0), width=8)
        prev = prev.convert("RGB"); prev.thumbnail((480, 300)); tiles.append(prev)
        print(key, im.size, weak)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
    sheet = Image.new("RGB", (480 * 4, 300 * 3), (40, 40, 40))
    for i, t in enumerate(tiles): sheet.paste(t, ((i % 4) * 480, (i // 4) * 300))
    sheet.save(ROOT / "art" / "_shots" / "boss_weak.jpg", quality=85)
