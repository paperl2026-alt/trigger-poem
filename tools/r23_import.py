"""Prologue monster sprite sheets (tools/job_specs23.py, art/raw/r23/<sheet>.png, 3 x 2 poses each) -> enemy/<id>_<pose> frames.
Every piece of ink is given to the grid cell its centre lies in (debris that crosses a border goes with its pose). All frames of one
monster share one canvas (the game swaps textures on one mesh): poses are scaled to a common size and bottom-aligned (walkers,
throwers) or centred (floaters). A pose drawn much bigger than the first (a bite right in your face) is kept a little bigger, capped.
usage: python -I tools/r23_import.py [sheet ...]"""
import sys, json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "raw" / "r23"
OUT = ROOT / "public" / "content" / "base" / "assets"
# sheet -> (enemy id, pose names in reading order, anchor)
SHEETS = {
    "desk": ("desk", ["walk0", "walk1", "crouch", "leap", "bite", "hurt"], "bottom"),
    "board": ("board", ["hide", "rise", "idle", "windup", "throw", "hurt"], "bottom"),   # sized by its standing pose (REF)
    "paper": ("paper", ["fly0", "fly1", "idle", "windup", "dive", "hurt"], "center"),
    "shoe": ("shoe", ["walk0", "walk1", "crouch", "leap", "bite", "hurt"], "bottom"),
    "horn": ("horn", ["hover0", "hover1", "idle", "windup", "blast", "hurt"], "center"),
    "frame": ("frame", ["fly0", "fly1", "idle", "windup", "fire", "hurt"], "center"),
}
PROJ = ("proj", ["chalk", "shard", "plane", "phone", "manga", "ring"])
CAP = 1.35        # a pose may be at most this much taller than the reference pose
REF = {"board": 2}  # which pose the size is taken from (default: the first)
MAXH = 900        # canvas height cap (px)


def splits(profile, n, lo, hi):
    """n-1 cut positions: the middles of the widest empty runs of a coverage profile (equal parts where there is no gap)"""
    L = len(profile); empty = profile < max(1, profile.max() * 0.01)
    runs, i = [], 0
    while i < L:
        if empty[i]:
            j = i
            while j < L and empty[j]: j += 1
            if i > 0 and j < L: runs.append((j - i, (i + j) // 2))
            i = j
        else: i += 1
    cuts = []
    for k in range(1, n):
        want = L * k / n
        near = [r for r in runs if abs(r[1] - want) < L / n * 0.45]
        cuts.append(max(near)[1] if near else int(want))
    return cuts


def cells(path, cols=3, rows=2):
    im = Image.open(path).convert("RGBA"); a = np.asarray(im)
    al = a[..., 3] > 30
    lab, n = ndimage.label(ndimage.binary_dilation(al, iterations=2))
    H, W = al.shape
    ycut = splits(al.sum(1), rows, 0, H)
    xcuts = []
    for r in range(rows):
        y0 = ([0] + ycut)[r]; y1 = (ycut + [H])[r]
        xcuts.append(splits(al[y0:y1].sum(0), cols, 0, W))
    out = [np.zeros_like(al) for _ in range(cols * rows)]
    # which cell each pixel lies in (by the cut lines)
    yy, xx = np.mgrid[0:H, 0:W]
    rr = (yy > ycut[0]).astype(int) if rows == 2 else sum((yy > c).astype(int) for c in ycut)
    cc = np.zeros_like(rr)
    for r in range(rows):
        cc = np.where(rr == r, sum((xx > x).astype(int) for x in xcuts[r]), cc)
    cell_of = cc + cols * rr
    big = 0.02 * al.sum() / (cols * rows)
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        comp = (lab[sl] == i) & al[sl]
        n = comp.sum()
        if n < 40: continue
        if n > big:   # a pose (or two touching poses): cut along the cell lines
            for k in range(cols * rows): out[k][sl] |= comp & (cell_of[sl] == k)
            continue
        ys, xs = np.nonzero(comp); cy, cx = ys.mean() + sl[0].start, xs.mean() + sl[1].start
        r = sum(cy > c for c in ycut); c = sum(cx > x for x in xcuts[r])
        out[c + cols * r][sl] |= comp
    # slivers of a neighbouring pose cut off at a cell line: small pieces touching the cut lines go
    border = np.zeros_like(al)
    for c in ycut: border[max(0, c - 2):c + 3] = True
    for r in range(rows):
        y0 = ([0] + ycut)[r]; y1 = (ycut + [H])[r]
        for x in xcuts[r]: border[y0:y1, max(0, x - 2):x + 3] = True
    for k, m in enumerate(out):
        lb, nn = ndimage.label(m)
        if nn < 2: continue
        sizes = ndimage.sum(m, lb, range(1, nn + 1)); touch = ndimage.maximum(border, lb, range(1, nn + 1))
        drop = [i + 1 for i in range(nn) if touch[i] and sizes[i] < 0.04 * sizes.max()]
        out[k] = m & ~np.isin(lb, drop)
    pieces = []
    for m in out:
        ys, xs = np.nonzero(m)
        if not len(xs): pieces.append(None); continue
        x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        rgba = a[y0:y1, x0:x1].copy(); rgba[..., 3] = np.where(m[y0:y1, x0:x1], rgba[..., 3], 0)
        pieces.append(Image.fromarray(rgba))
    return pieces


def frames(path, poses, anchor, ref=0):
    """one sheet -> [(pose, canvas, manifest extras)]: all poses on one shared canvas, scaled to a common size (a pose much bigger than
    the reference pose is kept a little bigger, capped), bottom-aligned or centred"""
    ims = cells(path)
    h0 = ims[ref].height
    scaled = []
    for im in ims:
        k = min(1, CAP * h0 / im.height)
        scaled.append(im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS))
    CW, CH = max(i.width for i in scaled), max(i.height for i in scaled)
    s = min(1, MAXH / CH); CW, CH = round(CW * s) + 8, round(CH * s) + 8
    out = []
    for name, im in zip(poses, scaled):
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        can = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
        x = (CW - im.width) // 2; y = CH - im.height - 2 if anchor == "bottom" else (CH - im.height) // 2
        can.alpha_composite(im, (x, y))
        out.append((name, can, {"anchor": anchor, "figH": round(scaled[ref].height * s / CH, 4)}))
    return out


def save(key, im, **extra):
    mp = OUT / "manifest.json"; man = json.loads(mp.read_text())
    (OUT / key).parent.mkdir(parents=True, exist_ok=True)
    im.save(OUT / f"{key}.webp", quality=90, method=6)
    man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height, "hit": True, **extra}
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))


if __name__ == "__main__":
    want = sys.argv[1:] or list(SHEETS) + ["proj"]
    for sheet in want:
        if sheet == "proj":
            for name, im in zip(PROJ[1], cells(RAW / "proj.png")):
                if im is None: continue
                s = min(1, 360 / max(im.size)); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
                save(f"enemy/p_{name}", im); print("enemy/p_" + name, im.size)
            continue
        eid, poses, anchor = SHEETS[sheet]
        for name, can, extra in frames(RAW / f"{sheet}.png", poses, anchor, REF.get(eid, 0)):
            save(f"enemy/{eid}_{name}", can, **extra)
        print(eid, can.size, extra)
