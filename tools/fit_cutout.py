"""Put a Codex cut-out back onto its mockup when Codex changed its size / position (it sometimes enlarges the figure to fill
the frame). Searches the scale and offset at which the cut-out matches the mockup inside a window, then writes it out in the
mockup's frame (same size as the mockup), so it can be placed 1:1 like the other layers.
usage: python -I tools/fit_cutout.py <cutout.png> <mockup.png> x0 y0 x1 y1 smin smax [out.png]"""
import sys
import numpy as np
from PIL import Image
from scipy.signal import fftconvolve


def lum(a):
    return a[..., :3] @ np.array([0.3, 0.59, 0.11], np.float32)


def search(cut, ref, win, scales, q):
    """best (error, scale, x, y) at working scale q: the cut-out scaled by s is placed with its top-left at (x, y) in the mockup"""
    x0, y0, x1, y1 = win
    R = lum(ref)[::int(1 / q), ::int(1 / q)] if q < 1 else lum(ref)
    best = (1e9, 0, 0, 0)
    for s in scales:
        w, h = round(cut.width * s * q), round(cut.height * s * q)
        c = np.asarray(cut.resize((w, h), Image.BILINEAR)).astype(np.float32)
        a = (c[..., 3] > 230).astype(np.float32); L = lum(c) * a
        # squared error over the cut-out's solid pixels that land inside the window (outside it the mockup shows the frame /
        # whatever covers the figure), for every placement at once, via correlations
        H, W = R.shape
        Wm = np.zeros_like(R); Wm[int(y0 * q):int(y1 * q), int(x0 * q):int(x1 * q)] = 1
        k = lambda img, ker: fftconvolve(img, ker[::-1, ::-1], mode="full")
        n = k(Wm, a)
        e = (k(R ** 2 * Wm, a) - 2 * k(R * Wm, L) + k(Wm, L ** 2)) / np.maximum(n, 1)
        ys, xs = np.mgrid[0:e.shape[0], 0:e.shape[1]]
        px, py = xs - (w - 1), ys - (h - 1)
        # the window must be mostly covered by the figure's solid part
        ok = n > 0.55 * Wm.sum()
        if not ok.any(): continue
        i = np.argmin(np.where(ok, e, 1e12)); err = np.sqrt(max(e.flat[i], 0))
        if err < best[0]: best = (err, s, px.flat[i] / q, py.flat[i] / q)
    return best


if __name__ == "__main__":
    src, mock = sys.argv[1], sys.argv[2]
    x0, y0, x1, y1 = map(int, sys.argv[3:7]); smin, smax = float(sys.argv[7]), float(sys.argv[8])
    out = sys.argv[9] if len(sys.argv) > 9 else src
    cut = Image.open(src).convert("RGBA"); cut = cut.crop(cut.getbbox())
    ref = np.asarray(Image.open(mock).convert("RGB")).astype(np.float32)
    e, s, x, y = search(cut, ref, (x0, y0, x1, y1), np.linspace(smin, smax, 25), 0.25)
    print(f"coarse: error {e:.1f} scale {s:.4f} at {x:.0f},{y:.0f}")
    e, s, x, y = search(cut, ref, (x0, y0, x1, y1), np.linspace(s * 0.98, s * 1.02, 9), 0.5)
    print(f"fine:   error {e:.1f} scale {s:.4f} at {x:.0f},{y:.0f}")
    W, H = Image.open(mock).size
    frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    c = cut.resize((round(cut.width * s), round(cut.height * s)), Image.LANCZOS)
    frame.alpha_composite(c, (round(x), round(y))) if x >= 0 and y >= 0 else frame.paste(c, (round(x), round(y)), c)
    frame.save(out)
    print("->", out)
