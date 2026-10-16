"""Preview the soft-tissue fields (public/jiggle/flesh.json) over the pose sprites.
usage: python -I tools/flesh_preview.py out_dir
Same field function as src/jiggle/flesh.js (keep the two in sync)."""
import json, sys, pathlib
import numpy as np
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIR = ROOT / "public" / "jiggle"


def sstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def field(d, u, v, ar):
    s = np.zeros_like(u)
    for mu, mv, ru, rv, ms, hang in d["masses"]:
        r = np.hypot((u - mu) / ru, (v - mv) / rv)
        up = np.clip((v - mv) / rv, 0, 1)            # upper half of the mass: attached
        s = np.maximum(s, ms * (1 - sstep(0.55, 1.6, r)) * (1 - hang * up))
    for u0, v0, u1, v1, r, s0, s1 in d["limbs"]:
        ax, ay, bx, by = u0, v0 * ar, u1, v1 * ar
        ex, ey = bx - ax, by - ay
        t = np.clip(((u - ax) * ex + (v * ar - ay) * ey) / (ex * ex + ey * ey), 0, 1)
        dd = np.hypot(u - ax - ex * t, v * ar - ay - ey * t)
        s = np.maximum(s, (s0 + (s1 - s0) * t) * (1 - sstep(0.55, 1.5, dd / r)))
    for pu, pv, ru, rv, pk in d["pins"]:
        r = np.hypot((u - pu) / ru, (v - pv) / rv)
        s = s * (1 - pk * (1 - sstep(0.6, 1.2, r)))
    return s


if __name__ == "__main__":
    out = pathlib.Path(sys.argv[1])
    F = json.loads((DIR / "flesh.json").read_text())
    tiles = []
    for pose in ["cat_cover", "cat_fire", "pink_cover", "pink_fire"]:
        im = Image.open(DIR / f"{pose}.png").convert("RGBA")
        s = 760 / im.height
        im = im.resize((round(im.width * s), 760))
        W, H = im.size
        u, v = np.meshgrid((np.arange(W) + 0.5) / W, 1 - (np.arange(H) + 0.5) / H)
        f = field(F[pose], u, v, H / W)
        a = np.asarray(im).astype(np.float32)
        base = a[..., :3] * 0.55 + 30
        heat = np.stack([255 * f, 60 + 40 * (1 - f), 255 * (1 - f)], -1)
        al = (a[..., 3:4] / 255)
        col = base * (1 - 0.6 * al) + heat * 0.6 * al
        col = col * al + np.array([40, 45, 42]) * (1 - al)
        t = Image.fromarray(np.clip(col, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(t)
        for lv in (0.25, 0.5, 0.75):
            d.line([(0, (1 - lv) * H), (W, (1 - lv) * H)], fill=(255, 255, 255), width=1)
            d.line([(lv * W, 0), (lv * W, H)], fill=(255, 255, 255), width=1)
        d.text((6, 6), pose, fill=(255, 255, 0))
        tiles.append(t)
    sheet = Image.new("RGB", (sum(t.width for t in tiles) + 6 * len(tiles), 760), (20, 20, 20))
    x = 0
    for t in tiles:
        sheet.paste(t, (x, 0)); x += t.width + 6
    sheet.save(out / "flesh_fields.jpg", quality=88)
    print(sheet.size)
