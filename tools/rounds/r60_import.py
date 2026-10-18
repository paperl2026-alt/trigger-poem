"""Round 60 (tools/rounds/job_specs60.py): the gun girl redrawn in her own outfit on episode 1's comic pages. Each picked try is scaled
back onto its crop and pasted over HER box only (feathered inward, so nothing outside her box changes: the cat paw's canonical seals,
lettering, panel borders stay as they were); the PROTECT boxes inside hers keep the old pixels too. The pages are written straight
over the game's comic/ep1p_<page>.webp, always starting from the pages as they were before this round (art/raw/r60/orig_*).
usage: python -I tools/rounds/r60_import.py [--preview out_dir]   (preview: writes the pages as PNG there instead)"""
import sys, pathlib, json
import numpy as np
from PIL import Image, ImageFilter
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent)]
from job_specs60 import FIX, PROTECT, boxes, panel_box, RAW, PAGES

PICK = {"turn_0": "c", "photo_0": "a", "web_0": "b", "web_2": "a", "nursery_0": "c", "fall_0": "b", "fall_1": "b", "studio_0": "c",
        "studio_1": "b", "merge_0": "a", "merge_3": "a", "boss_0": "a", "boss_2": "b"}
FEATHER = 0.05   # of her box's smaller side


def mask_for(name, crop):
    (cx0, cy0, cx1, cy1), (hx0, hy0, hx1, hy1) = crop, boxes(name)[1]
    w, h = cx1 - cx0, cy1 - cy0
    page, idx, _ = FIX[name]
    X0, Y0, X1, Y1 = panel_box(page, idx); pw, ph = X1 - X0, Y1 - Y0
    m = Image.new("L", (w, h), 0)
    f = max(4, round(FEATHER * min(hx1 - hx0, hy1 - hy0)))
    # (no feather on a side that lies on the panel's edge: the old picture would show through there)
    e = [0 if abs(hx0 - X0) < 3 else f, 0 if abs(hy0 - Y0) < 3 else f, 0 if abs(hx1 - X1) < 3 else f, 0 if abs(hy1 - Y1) < 3 else f]
    inner = Image.new("L", (hx1 - hx0 - e[0] - e[2], hy1 - hy0 - e[1] - e[3]), 255)
    m.paste(inner, (hx0 - cx0 + e[0], hy0 - cy0 + e[1]))
    m = m.filter(ImageFilter.GaussianBlur(f / 2))
    a = np.asarray(m).astype(np.float32) / 255
    # the blur softens the panel-edge sides too: there, full strength out to the edge
    if not e[0]: a[:, :max(0, hx0 - cx0) + f] = np.maximum(a[:, :max(0, hx0 - cx0) + f], (np.arange(h)[:, None] >= hy0 - cy0 + e[1]) & (np.arange(h)[:, None] < hy1 - cy0 - e[3]))
    if not e[3]: a[hy1 - cy0 - f:hy1 - cy0, :] = np.maximum(a[hy1 - cy0 - f:hy1 - cy0, :], ((np.arange(w)[None, :] >= hx0 - cx0 + e[0]) & (np.arange(w)[None, :] < hx1 - cx0 - e[2])).astype(np.float32))
    if not e[2]: a[:, hx1 - cx0 - f:hx1 - cx0] = np.maximum(a[:, hx1 - cx0 - f:hx1 - cx0], ((np.arange(h)[:, None] >= hy0 - cy0 + e[1]) & (np.arange(h)[:, None] < hy1 - cy0 - e[3])).astype(np.float32))
    if not e[1]: a[hy0 - cy0:hy0 - cy0 + f, :] = np.maximum(a[hy0 - cy0:hy0 - cy0 + f, :], ((np.arange(w)[None, :] >= hx0 - cx0 + e[0]) & (np.arange(w)[None, :] < hx1 - cx0 - e[2])).astype(np.float32))
    for (a0, b0, a1, b1) in PROTECT.get(name, []):
        px0, py0, px1, py1 = X0 + a0 * pw - cx0, Y0 + b0 * ph - cy0, X0 + a1 * pw - cx0, Y0 + b1 * ph - cy0
        a[max(0, int(py0)):int(py1), max(0, int(px0)):int(px1)] = 0
    return a


if __name__ == "__main__":
    prev = sys.argv[sys.argv.index("--preview") + 1] if "--preview" in sys.argv else None
    pages = {}
    for name, v in PICK.items():
        if not v: continue
        page = FIX[name][0]
        if page not in pages: pages[page] = np.asarray(Image.open(RAW / f"orig_ep1p_{page}.webp").convert("RGB")).astype(np.float32)   # (the page before this round)
        crop, _ = boxes(name)
        new = np.asarray(Image.open(RAW / f"{name}_{v}.png").convert("RGB").resize((crop[2] - crop[0], crop[3] - crop[1]), Image.LANCZOS)).astype(np.float32)
        a = mask_for(name, crop)[..., None]
        P = pages[page]; region = P[crop[1]:crop[3], crop[0]:crop[2]]
        P[crop[1]:crop[3], crop[0]:crop[2]] = region * (1 - a) + new * a
        print(name, v, crop)
    for page, P in pages.items():
        im = Image.fromarray(P.clip(0, 255).astype(np.uint8))
        if prev: pathlib.Path(prev).mkdir(parents=True, exist_ok=True); im.save(pathlib.Path(prev) / f"ep1p_{page}.png"); continue
        im.save(PAGES / f"ep1p_{page}.webp", quality=88, method=6); print("->", f"comic/ep1p_{page}.webp")
