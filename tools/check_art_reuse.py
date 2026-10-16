"""User rule (stated many times): character art is NEVER reused. Every screen / scene draws its girls anew, in its own pose and
expression; the same drawing must not appear in two places, not even cropped, scaled or re-cut.
This check enforces it:
  - collects every character image: items marked "char": true in public/content/base/ui/*.json (one screen per file), plus
    the battle sprites named in public/content/base/characters/*.json (screen "battle");
  - fails when the same image key is used by two screens;
  - fails when two different images are the same drawing: detailed patches (face, hair) of one are searched in the other
    over scales 0.5x..2x by normalised cross-correlation; a re-cut drawing matches almost exactly, a new drawing does not;
  - a pose redrawn by the AI is not the same pixels, so every UI character item must also say its "pose" (one line per girl,
    e.g. "神乐：右手推眼镜，白毛爪举在胸前"); it fails when a UI item has no pose or two screens give the same pose.
    used_poses() lists them: character prompts include that list as "already used, do not repeat".
usage: python -I tools/check_art_reuse.py                 (exit 1 on a violation)
       python -I tools/check_art_reuse.py --vs new.png    (check a new image / mockup against everything registered)
       python -I tools/check_art_reuse.py --poses         (print the poses already used)
Run it after adding any character art, before showing or committing it."""
import sys, json, pathlib, itertools
sys.stdout.reconfigure(encoding="utf-8")
import numpy as np
from PIL import Image
from scipy.signal import fftconvolve

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = ROOT / "public" / "content" / "base"
SIDE = 256          # images compared at this size (longer side)
PATCH = 40          # patch size at that scale
THRESH = 0.86       # normalised correlation that means "same drawing"


def chars():
    out = []   # (screen, key, pose)
    def walk(o, screen):
        if isinstance(o, dict):
            if o.get("char") and isinstance(o.get("img"), str):
                out.append((screen, o["img"], o.get("pose")))
            for v in o.values():
                walk(v, screen)
        elif isinstance(o, list):
            for v in o:
                walk(v, screen)
    for f in sorted((BASE / "ui").glob("*.json")):
        walk(json.loads(f.read_text(encoding="utf-8")), f.stem)
    man = json.loads((BASE / "assets" / "manifest.json").read_text())
    for f in sorted((BASE / "characters").glob("*.json")):
        def keys(o):
            if isinstance(o, dict):
                for v in o.values(): yield from keys(v)
            elif isinstance(o, list):
                for v in o: yield from keys(v)
            elif isinstance(o, str) and o in man and man[o].get("src", "").endswith((".webp", ".png")):
                yield o
        for k in sorted(set(keys(json.loads(f.read_text(encoding="utf-8"))))):
            out.append(("battle", k, f"战斗 {k}"))
    return out, man


def used_poses():
    items, _ = chars()
    return [(sc, k, p) for sc, k, p in items if sc != "battle"] + [("battle", "", "战斗用的各个姿势（掩体、探身、换弹、挑衅、射击、技能、受击、倒地、跑动、胜利）")]


def gray(path):
    im = Image.open(path).convert("RGBA")
    bg = Image.new("RGBA", im.size, (128, 128, 128, 255)); bg.alpha_composite(im)
    g = bg.convert("L"); s = SIDE / max(g.size)
    return np.asarray(g.resize((max(1, round(g.width * s)), max(1, round(g.height * s))), Image.BILINEAR)).astype(np.float32)


def patches(g, n=4):
    """the n most detailed patches (not overlapping much)"""
    H, W = g.shape; res = []
    cand = []
    for y in range(0, H - PATCH, PATCH // 2):
        for x in range(0, W - PATCH, PATCH // 2):
            p = g[y:y + PATCH, x:x + PATCH]; cand.append((p.std(), y, x))
    for sd, y, x in sorted(cand, reverse=True):
        if sd < 25: break
        if all(abs(y - y2) >= PATCH or abs(x - x2) >= PATCH for y2, x2 in [(r[1], r[2]) for r in res]):
            res.append((g[y:y + PATCH, x:x + PATCH], y, x))
        if len(res) == n: break
    return [r[0] for r in res]


def ncc_max(img, p):
    p = p - p.mean(); pn = np.sqrt((p ** 2).sum())
    if pn < 1e-3 or img.shape[0] < p.shape[0] or img.shape[1] < p.shape[1]: return 0.0
    ones = np.ones_like(p)
    num = fftconvolve(img, p[::-1, ::-1], mode="valid")
    s1 = fftconvolve(img, ones, mode="valid"); s2 = fftconvolve(img ** 2, ones, mode="valid")
    var = s2 - s1 ** 2 / p.size
    ok = var > (12 ** 2) * p.size          # flat windows (background) cannot match a detailed patch
    if not ok.any(): return 0.0
    return float(np.clip(num[ok] / (np.sqrt(var[ok]) * pn), -1, 1).max())


def same_drawing(ga, gb):
    """True when patches of a are found (at some scale) in b"""
    ps = patches(ga)
    if not ps: return False, 0.0
    best = []
    for p in ps:
        m = 0.0
        for s in (0.5, 0.63, 0.8, 1.0, 1.25, 1.6, 2.0):
            b = np.asarray(Image.fromarray(gb.astype(np.uint8)).resize((max(1, round(gb.shape[1] * s)), max(1, round(gb.shape[0] * s))), Image.BILINEAR)).astype(np.float32)
            m = max(m, ncc_max(b, p))
        best.append(m)
    hits = sum(m > THRESH for m in best)
    return hits >= 2, max(best)


if __name__ == "__main__":
    items, man = chars()
    if "--poses" in sys.argv:
        for sc, k, p in used_poses(): print(f"{sc}: {p}")
        sys.exit(0)
    src = {k: BASE / man[k]["src"] for _, k, _ in items if k in man}
    bad = []
    by_key = {}
    for screen, k, pose in items:
        by_key.setdefault(k, set()).add(screen)
        if screen != "battle" and not pose: bad.append(f"{k} ({screen}) has no \"pose\"")
    seen = {}
    for screen, k, pose in items:
        for line in (pose or "").replace("；", "\n").split("\n"):
            line = line.strip()
            if line and screen != "battle":
                if line in seen and seen[line] != screen: bad.append(f"pose used twice ({seen[line]}, {screen}): {line}")
                seen.setdefault(line, screen)
    for k, sc in by_key.items():
        if len(sc) > 1: bad.append(f"same image {k} used in {sorted(sc)}")
    vs = sys.argv[sys.argv.index("--vs") + 1:] if "--vs" in sys.argv else []
    g = {k: gray(p) for k, p in src.items() if p.exists()}
    if vs:
        for v in vs:
            gv = gray(v)
            for k, gk in g.items():
                hit, m = same_drawing(gk, gv)
                hit2, m2 = same_drawing(gv, gk)
                if hit or hit2: bad.append(f"{v} contains the drawing of {k} ({'/'.join(sorted(by_key[k]))}), match {max(m, m2):.2f}")
    else:
        keys = sorted(g)
        for a, b in itertools.combinations(keys, 2):
            if by_key[a] & by_key[b]: continue          # the same screen may hold several pieces of one figure
            hit, m = same_drawing(g[a], g[b]); hit2, m2 = same_drawing(g[b], g[a])
            if hit or hit2: bad.append(f"{a} ({'/'.join(sorted(by_key[a]))}) and {b} ({'/'.join(sorted(by_key[b]))}) are the same drawing, match {max(m, m2):.2f}")
    print(f"{len(items)} character images checked")
    for b in bad: print("REUSE:", b)
    sys.exit(1 if bad else 0)
