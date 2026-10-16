"""Measure the shapes of UI controls on a controls-only cut-out (e.g. art/raw/r20/sel_ui.png): every solid piece is reduced to
the quadrilateral that best follows its outline (convex hull, then the corners that keep the most area). Prints mockup px.
usage: python -I tools/fit_quads.py <cutout.png> [min_area] [x0 y0 x1 y1]"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import ConvexHull


def quad(points):
    h = ConvexHull(points); P = points[h.vertices].astype(float)
    while len(P) > 4:   # drop the corner whose removal loses the least area
        n = len(P); best = None
        for i in range(n):
            a, b, c = P[i - 1], P[i], P[(i + 1) % n]
            loss = abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2
            if best is None or loss < best[0]: best = (loss, i)
        P = np.delete(P, best[1], axis=0)
    # clockwise from top-left on screen
    c = P.mean(0); ang = np.arctan2(P[:, 1] - c[1], P[:, 0] - c[0]); P = P[np.argsort(ang)]
    k = int(np.argmin(P[:, 0] + P[:, 1])); return np.roll(P, -k, axis=0)


if __name__ == "__main__":
    a = np.asarray(Image.open(sys.argv[1]).convert("RGBA"))[..., 3] > 128
    min_area = int(sys.argv[2]) if len(sys.argv) > 2 else 800
    win = list(map(int, sys.argv[3:7])) if len(sys.argv) > 6 else None
    if win: w = np.zeros_like(a); w[win[1]:win[3], win[0]:win[2]] = True; a &= w
    a = ndimage.binary_fill_holes(ndimage.binary_closing(a, iterations=2))
    lab, n = ndimage.label(a)
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        area = int((lab[sl] == i).sum())
        if area < min_area: continue
        ys, xs = np.nonzero(lab == i)
        Q = quad(np.c_[xs, ys]); fill = area / max(ConvexHull(np.c_[xs, ys]).volume, 1)
        print(f"area {area:6d} bbox [{sl[1].start},{sl[0].start},{sl[1].stop},{sl[0].stop}] quad {[[int(round(x)), int(round(y))] for x, y in Q]} solid {fill:.2f}")
