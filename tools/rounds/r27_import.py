"""Battle poses into the pose packs (characters/<id>.json "poses"): the Codex poses of round 27 (art/raw/r27/<who>_<pose>.png) and,
where the image service refused, the user's own GPT battle set poses. Trimmed, scaled like the pack (rawH: kneeling poses are as
tall as the pack's aim pose, standing ones 1.38x, sitting 0.75x), anchor = the body's centre of mass, written into the character
file. The cat girl's paw seal is then made canonical on every battle pose (tools/seal_fix.py entries "bt_<pose>", found by
looking for the seal's red on white fur).
usage: python -I tools/rounds/r27_import.py"""
import json, pathlib, subprocess, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "content" / "base" / "assets"
CH = ROOT / "public" / "content" / "base" / "characters"
G = ROOT / "art" / "gpt_sets"
R27 = ROOT / "art" / "raw" / "r27"
# pose role -> (source, size class)
SRC = {
    "neko": {"aimOut": (R27 / "neko_aim_out.png", "kneel"), "recoil": (R27 / "neko_recoil.png", "kneel"), "hurt": (G / "set_1/cat_10_hit.png", "stand"),
             "down": (R27 / "neko_down.png", "sit"), "run": (R27 / "neko_run.png", "stand"), "runB": (R27 / "neko_run_b.png", "stand"),
             "victory": (R27 / "neko_victory.png", "stand"), "active": (R27 / "neko_active.png", "kneel"), "activeOut": (R27 / "neko_active_out.png", "kneel")},
    "pink": {"taunt": (G / "set_4/pink_04_cover_taunt.png", "kneel"), "aimOut": (R27 / "pink_aim_out.png", "kneel"), "recoil": (R27 / "pink_recoil.png", "kneel"),
             "hurt": (R27 / "pink_hurt.png", "kneel"), "down": (G / "set_4/pink_11_knocked_down.png", "sit"), "reload": (R27 / "pink_reload.png", "kneel"),
             "run": (G / "set_1/pink_13_running_b.png", "stand"), "runB": (R27 / "pink_run_b.png", "stand"),
             "active": (G / "set_5/pink_08_skill_forward.png", "stand"), "activeOut": (G / "set_4/pink_09_skill_outward.png", "stand")},
}
KEY = {"aimOut": "aim_out", "runB": "run_b", "activeOut": "active_out"}
K = {"kneel": 1.0, "stand": 1.38, "sit": 0.75}
FILE = {"neko": "cat", "pink": "pink"}


def trim(im):
    a = np.asarray(im)[..., 3] > 24
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=3))
    sizes = ndimage.sum(a, lab, range(1, n + 1))
    keep = np.isin(lab, 1 + np.where(sizes > 0.01 * sizes.max())[0]) & a
    arr = np.asarray(im).copy(); arr[..., 3] = np.where(ndimage.binary_dilation(keep, iterations=2), arr[..., 3], 0)
    im = Image.fromarray(arr); return im.crop(im.getbbox())


def seal_spot(im):
    """the paw seal's ring on a cat pose: [cx, cy, diameter], or None when no paw back with a seal shows.
    The ring is found as a filled round blob of seal red (thin lines such as the pendant are opened away) with white fur all
    around it; skin, the bell's red cord and ribbons do not pass."""
    a = np.asarray(im).astype(np.int16)
    R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    red = (R - G > 55) & (G < 170) & (A > 128)
    fur = (R > 205) & (G > 200) & (B > 195) & (np.abs(R - B) < 30) & (A > 128)
    disk = ndimage.binary_fill_holes(ndimage.binary_closing(red, iterations=4))
    disk = ndimage.binary_opening(disk, iterations=4)
    lab, n = ndimage.label(disk)
    best = None
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if min(h, w) < 18 or max(h, w) > 0.2 * im.height or max(h, w) / min(h, w) > 1.6: continue
        comp = lab[sl] == i
        if comp.sum() < 0.55 * h * w: continue                      # round, not a ribbon
        inner = red[sl] & comp
        if inner.mean() > 0.75: continue                            # a solid red thing (bell cord, bow), not line art
        y0, y1, x0, x1 = max(0, sl[0].start - 14), sl[0].stop + 14, max(0, sl[1].start - 14), sl[1].stop + 14
        full = lab[y0:y1, x0:x1] == i
        ring = ndimage.binary_dilation(full, iterations=10) & ~ndimage.binary_dilation(full, iterations=3)
        f = fur[y0:y1, x0:x1][ring].mean() if ring.any() else 0
        if f > 0.55 and (best is None or f > best[0]):
            best = (f, [int((sl[1].start + sl[1].stop) / 2), int((sl[0].start + sl[0].stop) / 2), int((h + w) / 2)])
    return best[1] if best else None


if __name__ == "__main__":
    mp = OUT / "manifest.json"; man = json.loads(mp.read_text())
    seals = {}
    for who, poses in SRC.items():
        cf = CH / f"{FILE[who]}.json"; cd = json.loads(cf.read_text(encoding="utf-8")); c = cd[FILE[who]]
        ref = man[f"{who}/aim"]["rawH"]
        for role, (src, cls) in poses.items():
            if not pathlib.Path(src).exists(): print("missing", src); continue
            im = trim(Image.open(src).convert("RGBA"))
            s = min(1, 1150 / im.height); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
            key = f"{who}/{KEY.get(role, role)}"
            im.save(OUT / f"{key}.webp", quality=92, method=6)
            man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height, "rawH": round(ref * K[cls]), "sheet": str(pathlib.Path(src).relative_to(ROOT)).replace("\\", "/")}
            a = np.asarray(im)[..., 3] > 60
            c.setdefault("anchor", {})[role] = round(float(np.nonzero(a)[1].mean() / im.width), 3)
            c["poses"][role] = key
            if who == "neko":
                sp = seal_spot(im)
                if sp: seals[KEY.get(role, role)] = sp
            print(key, im.size, cls)
        cf.write_text(json.dumps(cd, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
    # every cat battle pose (old and new) gets the canonical seal where the paw's back shows
    raw0 = ROOT / "art" / "raw" / "bt_src"
    for role in ["cover", "peek", "taunt", "aim", "reload"]:
        f = raw0 / f"neko_{role}.png"
        im = Image.open(f if f.exists() else OUT / f"neko/{role}.webp").convert("RGBA"); sp = seal_spot(im)
        if sp: seals[role] = sp
    pl = ROOT / "art" / "seal_placements.json"; P = json.loads(pl.read_text(encoding="utf-8"))
    raw = ROOT / "art" / "raw" / "bt_src"; raw.mkdir(parents=True, exist_ok=True)
    for role, (cx, cy, d) in seals.items():
        src = raw / f"neko_{role}.png"
        if not src.exists(): Image.open(OUT / f"neko/{role}.webp").save(src)   # keep the drawn original once
        r = d // 2 + 6
        P[f"bt_{role}"] = {"src": str(src.relative_to(ROOT)).replace("\\", "/"), "erase": [cx - r, cy - r, cx + r, cy + round(d * 1.3)],
                           "center": [cx, cy], "ring": round(d * 1.02), "rot": 0, "png": f"public/content/base/assets/neko/{role}.png"}
    pl.write_text(json.dumps(P, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # by hand: poses where the search misses the seal (partly hidden) or finds a false one
    for role in ("taunt",): seals.pop(role, None)
    for role, cx, cy, dd in (("cover", 782, 862, 54), ("reload", 774, 386, 76)):
        seals[role] = [cx, cy, dd]
        r = dd // 2 + 6
        P[f"bt_{role}"] = {"src": f"art/raw/bt_src/neko_{role}.png", "erase": [cx - r, cy - r, cx + r, cy + round(dd * 1.3)], "center": [cx, cy], "ring": round(dd * 1.02), "rot": 0, "png": f"public/content/base/assets/neko/{role}.png"}
    P.pop("bt_taunt", None)
    pl.write_text(json.dumps(P, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if seals:
        subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "seal_fix.py"), *[f"bt_{r}" for r in seals], "--preview", str(ROOT / "art" / "_shots")], check=True)
        for role in seals:   # seal_fix wrote PNGs: back to webp under the same key
            p = OUT / f"neko/{role}.png"; Image.open(p).save(OUT / f"neko/{role}.webp", quality=92, method=6); p.unlink()
    print("seals", seals)
