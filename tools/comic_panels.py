"""Find the panels on a whole manga page (Codex draws the pages with the lettering in, docs/DESIGN.md「漫画转场的规矩」): the gutters are the
white paper connected to the page's edge (panel borders are black lines, so a panel's white insides are not reached), the panels are what is
left; each panel becomes a polygon (its convex hull, simplified), in reading order (rows top to bottom, left to right in a row).
usage: python -I tools/comic_panels.py <page.png> [--expect N] [--preview out.jpg]     prints JSON: [{"poly": [[x%, y%], ...], "box": [x0, y0, x1, y1]}]"""
import sys, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.spatial import ConvexHull


def simplify(pts, keep=0.985, most=8):
    """Visvalingam: drop the vertex whose triangle is smallest while the polygon keeps `keep` of its area (and has at most `most`)"""
    pts = [tuple(p) for p in pts]
    area = lambda P: abs(sum(P[i][0] * P[i - 1][1] - P[i - 1][0] * P[i][1] for i in range(len(P)))) / 2
    full = area(pts)
    tri = lambda a, b, c: abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2
    while len(pts) > 4:
        i = min(range(len(pts)), key=lambda i: tri(pts[i - 1], pts[i], pts[(i + 1) % len(pts)]))
        trial = pts[:i] + pts[i + 1:]
        if area(trial) < full * keep and len(pts) <= most: break
        pts = trial
    return np.array(pts)


def best_cut(border, block, box):
    """the straight, roughly vertical line across a merged block that runs almost entirely along border pixels (a panel border drawn
    as a single black or white line), leaving at least a fifth of the block on each side: returns (how much of it lies on border,
    ((x0, y0), (x1, y1)))"""
    x0, y0, x1, y1 = box
    best = (0.0, None)
    ys = np.linspace(y0 + 2, y1 - 2, 160).astype(int)
    yy, xx = np.nonzero(block); yy = yy + y0; xx = xx + x0; tot = len(xx) or 1
    span = int((y1 - y0) * 0.55)
    for xt in range(x0 + (x1 - x0) // 8, x1 - (x1 - x0) // 8, 4):
        for dx in range(-span, span + 1, 4):
            xs = np.clip((xt + dx * (ys - y0) / max(1, y1 - y0)).astype(int), 0, border.shape[1] - 1)
            f = border[ys, xs].mean()
            if f <= best[0]: continue
            left = (xx < xt + dx * (yy - y0) / max(1, y1 - y0)).sum() / tot
            if 0.2 < left < 0.8: best = (f, ((xt, y0), (xt + dx, y1)))
    return best


def panels(path, white=222, min_share=0.02, expect=0):
    im = np.asarray(Image.open(path).convert("RGB")).astype(int); H, W = im.shape[:2]
    paper = (im.min(-1) > white) & (im.max(-1) - im.min(-1) < 30)
    ink = im.max(-1) < 60
    border = ndimage.binary_dilation(paper | ink, iterations=1)
    # the gutters: paper reachable from the page edge (a little erosion so thin gaps in borders do not leak)
    lab, n = ndimage.label(ndimage.binary_opening(paper, iterations=2))
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    gutter = np.isin(lab, list(edge))
    gutter = ndimage.binary_dilation(gutter, iterations=2)
    # fewer panels than the page has: cut the widest merged block along its best straight border line, again and again
    for _ in range(6):
        lab, n = ndimage.label(~gutter)
        objs = [(i + 1, sl) for i, sl in enumerate(ndimage.find_objects(lab)) if (lab[sl] == i + 1).sum() > min_share * H * W]
        if not expect or len(objs) >= expect: break
        # the block whose straight border line fits best (a real panel has no line all across it)
        cands = [best_cut(border, lab[sl] == i, (sl[1].start, sl[0].start, sl[1].stop, sl[0].stop)) for i, sl in objs]
        score, cut = max(cands, key=lambda c: c[0])
        if score < 0.7 or not cut: break
        mk = Image.new("L", (W, H), 0); ImageDraw.Draw(mk).line([cut[0], cut[1]], fill=255, width=9)
        gutter |= np.asarray(mk) > 0
    body = ~gutter
    lab, n = ndimage.label(body)
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        m = lab[sl] == i
        if m.sum() < min_share * H * W: continue
        ys, xs = np.nonzero(m); ys = ys + sl[0].start; xs = xs + sl[1].start
        pts = np.c_[xs, ys].astype(float)
        hull = pts[ConvexHull(pts).vertices]
        poly = simplify(hull)
        out.append({"poly": [[round(x / W * 100, 2), round(y / H * 100, 2)] for x, y in poly],
                    "box": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]})
    # reading order: rows (by vertical centre, with tolerance), left to right
    out.sort(key=lambda p: ((p["box"][1] + p["box"][3]) / 2, p["box"][0]))
    rows, cur = [], []
    for p in out:
        cy = (p["box"][1] + p["box"][3]) / 2
        if cur and cy - (cur[0]["box"][1] + cur[0]["box"][3]) / 2 > H * 0.18: rows.append(cur); cur = []
        cur.append(p)
    if cur: rows.append(cur)
    return [p for r in rows for p in sorted(r, key=lambda p: p["box"][0])], (W, H)


if __name__ == "__main__":
    ps, (W, H) = panels(sys.argv[1], expect=int(sys.argv[sys.argv.index("--expect") + 1]) if "--expect" in sys.argv else 0)
    if "--preview" in sys.argv:
        im = Image.open(sys.argv[1]).convert("RGB"); d = ImageDraw.Draw(im)
        for k, p in enumerate(ps):
            pts = [(x / 100 * W, y / 100 * H) for x, y in p["poly"]]
            d.line(pts + [pts[0]], fill=(0, 255, 0), width=6)
            d.text((pts[0][0] + 10, pts[0][1] + 10), str(k + 1), fill=(255, 0, 0))
        im.save(sys.argv[sys.argv.index("--preview") + 1], quality=85)
    print(json.dumps(ps))
