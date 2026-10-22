"""Round 93 (tools/rounds/job_specs93.py): the cat girl with only one paw on episode 1's comic pages. Each picked try is scaled back onto
its crop and pasted over HER box only (feathered inward; no feather on a side lying on the panel's edge), always on the page as it was in
the game before this round (art/raw/r93/orig_*). The page goes to art/raw/r93/page_<page>.png; its paw seal entries (art/seal_placements.json
page93_<page>_*: the paw that stays, as Codex redrew it) are run on it (tools/seal_fix.py -> art/raw/r93/fixed/), and it goes into its pack.
usage: python -I tools/rounds/r93_import.py [--preview out_dir]   (preview: writes the pages as PNG there instead)"""
import sys, pathlib, json, subprocess
import numpy as np
from PIL import Image, ImageFilter
ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402
from job_specs93 import FIX, EP, RAW, boxes, panel_box, orig  # noqa: E402
from r53_import import put  # noqa: E402

PICK = {"fountain_3": "b", "fall_2": "c", "open_0": "d"}
# (fountain b: the sleeve keeps its mint lining; fall a drew a second gun girl behind her; open: a-c kept the two-paw lump under the girl's
# hand - three hands (user 2026-10-22) - so d-f asked for exactly two: d; e drew her as the gun girl, f changed the whole panel)
FEATHER = 0.05   # of her box's smaller side


def mask_for(name, crop):
    (cx0, cy0, cx1, cy1), (hx0, hy0, hx1, hy1) = crop, boxes(name)[1]
    w, h = cx1 - cx0, cy1 - cy0
    X0, Y0, X1, Y1 = panel_box(*FIX[name][:2])
    f = max(4, round(FEATHER * min(hx1 - hx0, hy1 - hy0)))
    on_edge = [abs(hx0 - X0) < 4, abs(hy0 - Y0) < 4, abs(hx1 - X1) < 4, abs(hy1 - Y1) < 4]
    # a box shrunk by f on the inner sides, blurred: full strength inside, fading to 0 at her box's line; full out to a panel edge
    e = [0 if s else f for s in on_edge]
    m = Image.new("L", (w, h), 0)
    m.paste(255, (hx0 - cx0 + e[0], hy0 - cy0 + e[1], hx1 - cx0 - e[2], hy1 - cy0 - e[3]))
    a = np.asarray(m.filter(ImageFilter.GaussianBlur(f / 2))).astype(np.float32) / 255
    core = np.zeros((h, w), np.float32); core[hy0 - cy0 + e[1]:hy1 - cy0 - e[3], hx0 - cx0 + e[0]:hx1 - cx0 - e[2]] = 1
    if on_edge[0]: core[hy0 - cy0 + e[1]:hy1 - cy0 - e[3], :hx0 - cx0 + f] = 1
    if on_edge[1]: core[:hy0 - cy0 + f, hx0 - cx0 + e[0]:hx1 - cx0 - e[2]] = 1
    if on_edge[2]: core[hy0 - cy0 + e[1]:hy1 - cy0 - e[3], hx1 - cx0 - f:] = 1
    if on_edge[3]: core[hy1 - cy0 - f:, hx0 - cx0 + e[0]:hx1 - cx0 - e[2]] = 1
    return np.maximum(a, core)


def main():
    prev = sys.argv[sys.argv.index("--preview") + 1] if "--preview" in sys.argv else None
    pages = {}
    for name, v in PICK.items():
        if not v: continue
        page = FIX[name][0]
        if page not in pages: pages[page] = np.asarray(Image.open(orig(page)).convert("RGB")).astype(np.float32)
        crop, _ = boxes(name)
        new = np.asarray(Image.open(RAW / f"{name}_{v}.png").convert("RGB").resize((crop[2] - crop[0], crop[3] - crop[1]), Image.LANCZOS)).astype(np.float32)
        a = mask_for(name, crop)[..., None]
        P = pages[page]; region = P[crop[1]:crop[3], crop[0]:crop[2]]
        P[crop[1]:crop[3], crop[0]:crop[2]] = region * (1 - a) + new * a
        print(name, v, crop)
    places = json.loads((ROOT / "art" / "seal_placements.json").read_text(encoding="utf-8"))
    man = packs.manifest()
    for page, P in pages.items():
        im = Image.fromarray(P.clip(0, 255).astype(np.uint8)); out = RAW / f"page_{page}.png"; im.save(out)
        seals = [k for k in places if k.startswith(f"page93_{page}_")]
        if seals:
            (RAW / "fixed").mkdir(exist_ok=True)
            subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "seal_fix.py"), *seals], check=True, stdin=subprocess.DEVNULL)
            im = Image.open(RAW / "fixed" / f"page_{page}.png").convert("RGB")
        key = f"comic/{EP[page]}p_{page}"
        if prev: pathlib.Path(prev).mkdir(parents=True, exist_ok=True); im.save(pathlib.Path(prev) / f"{EP[page]}p_{page}.png"); continue
        put(man, key, im, q=88); print("->", key)
    if not prev: man.save()


if __name__ == "__main__":
    main()
