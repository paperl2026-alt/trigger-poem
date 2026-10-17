"""Title girls layer without the straight cuts (tools/rounds/job_specs16.py). The approved layer ui/t_girls (canonical seal already stamped
by seal_fix) is cut by a vertical line at its left edge and a horizontal line near its bottom. Codex continued the drawing past the
cuts on a padded canvas (art/ref/p5_parts/girls_pad.png -> art/raw/r16/girls_ext.png). Here the generated image is aligned back onto
the padded canvas, and ONLY the parts beyond the cuts are taken from it: everywhere the original exists it stays pixel-identical,
with a short crossfade across the cut lines so the seam does not show.
usage: python -I tools/rounds/r16_import.py      -> ui/t_girls_ext (+ prints the box to use in ui/title.json)"""
import json, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "content" / "base" / "assets"
PAD_L, PAD_B = 220, 260       # the padding girls_pad.png was made with
CUT_Y = 1050                  # where the original's bodies end (rows below are empty)
FADE = 24                     # crossfade width across the cuts, px


def load(p):
    return np.asarray(Image.open(p).convert("RGBA")).astype(np.float32) / 255


def align(gen, ref, mask):
    """small search for the scale / shift that puts the generated image on the original (compares luminance where the original is solid)"""
    lum = lambda a: a[..., :3] @ np.array([0.3, 0.59, 0.11], np.float32)
    H, W = ref.shape[:2]
    small = lambda a, s: np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((max(1, round(a.shape[1] * s)), max(1, round(a.shape[0] * s))), Image.BILINEAR)).astype(np.float32) / 255
    q = 0.25
    r = lum(small(ref, q)); m = small(mask[..., None].repeat(4, -1), q)[..., 0] > 0.9
    best = (1e9, 1.0, 0, 0)
    for sc in np.linspace(0.97, 1.03, 13):
        g = np.asarray(Image.fromarray((gen * 255).astype(np.uint8)).resize((round(W * sc * q), round(H * sc * q)), Image.BILINEAR)).astype(np.float32) / 255
        gl = lum(g)
        for dy in range(-8, 9):
            for dx in range(-8, 9):
                # generated pixel at (y - dy, x - dx) lands on (y, x)
                ys, xs = np.nonzero(m)
                gy, gx = ys - dy, xs - dx
                ok = (gy >= 0) & (gx >= 0) & (gy < gl.shape[0]) & (gx < gl.shape[1])
                if ok.mean() < 0.9:
                    continue
                e = np.abs(gl[gy[ok], gx[ok]] - r[ys[ok], xs[ok]]).mean()
                if e < best[0]:
                    best = (e, sc, dx / q, dy / q)
    return best


if __name__ == "__main__":
    orig = load(OUT / "ui" / "t_girls.webp")
    oh, ow = orig.shape[:2]
    H, W = oh + PAD_B, ow + PAD_L
    ref = np.zeros((H, W, 4), np.float32); ref[:oh, PAD_L:] = orig
    gen = load(ROOT / "art" / "raw" / "r16" / "girls_ext.png")
    err, sc, dx, dy = align(gen, ref, ref[..., 3] > 0.95)
    print(f"align: scale {sc:.3f} shift {dx:+.0f},{dy:+.0f} (mean luminance error {err:.3f})")
    g = Image.fromarray((gen * 255).astype(np.uint8)).resize((round(W * sc), round(H * sc)), Image.LANCZOS)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0)); canvas.paste(g, (round(dx), round(dy)))
    gen = np.asarray(canvas).astype(np.float32) / 255
    # how much of the generated image to use: 1 beyond the cuts, 0 inside the original, a ramp across each cut line
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    beyond_left = np.clip((PAD_L + FADE - xx) / FADE, 0, 1)
    beyond_bottom = np.clip((yy - (CUT_Y - FADE)) / FADE, 0, 1)
    m = np.maximum(beyond_left, beyond_bottom)[..., None]
    # premultiplied blend
    pa, pg = ref[..., :3] * ref[..., 3:], gen[..., :3] * gen[..., 3:]
    a = ref[..., 3:] * (1 - m) + gen[..., 3:] * m
    rgb = (pa * (1 - m) + pg * m) / np.maximum(a, 1e-4)
    out = Image.fromarray((np.dstack([rgb, a]) * 255 + 0.5).clip(0, 255).astype(np.uint8))
    out.save(OUT / "ui" / "t_girls_ext.webp", quality=92, method=6)
    mp = OUT / "manifest.json"; man = json.loads(mp.read_text())
    man["ui/t_girls_ext"] = {"src": "assets/ui/t_girls_ext.webp", "w": W, "h": H, "dom": True, "seal": "canonical (from ui/t_girls)"}
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
    print("ui/t_girls_ext", (W, H), f"-> in title.json keep the original's scale: box x0 = old_x0 - {PAD_L} * s, x1 = old_x1, y1 = old_y0 + {H} * s")
