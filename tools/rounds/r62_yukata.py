"""Round 62 yukata (user 2026-10-18: "和风浴衣试试看 codex 能不能维持不变的情况下局部更改，理论上是可以动态细节不变的"): Codex redrew the four
battle sprites with only the clothes changed (tools/rounds/job_specs62.py R62_yk_*). This puts the picked ones back onto the sprites:
  1. align: Codex keeps the figure where it was on the 2:3 grey canvas (art/raw/r62/ref_meta.json) give or take a few pixels / percent:
     search the scale and offset where the parts it did not change (head and hair at the top, legs and shoes at the bottom) match;
  2. map back into the sprite's own frame (public/jiggle/<pose>.png size);
  3. the cat paw: the original pixels around the paw go back (its seal is the canonical one, docs/ART.md 猫爪咒印);
  4. bleed the colours into the transparent margin (no dark fringes when filtered), save public/jiggle/<pose>_yk.png;
  5. the jiggle weights of the same rig on the new picture (tools/jiggle_masks.py --pose=<pose>_yk), then into the content pack as
     outfit/yk_<pose> (+ _w0.._w3) and characters/<who>.json "rigs.yk" (same pivots and flesh as the pose it was drawn over). The yukata
     is an outfit (user 2026-10-18): episode 2's clear unlocks it, the select screen's outfit chip puts it on, in any episode.
usage: python -I tools/rounds/r62_yukata.py [pose=letter ...]   (default picks below)
"""
import json, pathlib, shutil, subprocess, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[2]
R62 = ROOT / "art" / "raw" / "r62"; J = ROOT / "public" / "jiggle"
A = ROOT / "public" / "content" / "base" / "assets"; CH = ROOT / "public" / "content" / "base" / "characters"
PICK = {"cat_cover": "a", "cat_fire": "a", "pink_cover": "b", "pink_fire": "b"}
PAW = {"cat_cover": (870, 429, 150), "cat_fire": (837, 283, 150)}   # (x, y, radius) of the paw kept from the original sprite


def bleed(a):
    al = a[..., 3] > 8
    if al.all(): return a
    _, (iy, ix) = ndimage.distance_transform_edt(~al, return_indices=True)
    out = a.copy(); out[..., :3] = a[iy, ix, :3]; return out


def place(img, s, dx, dy, size):
    """img scaled by s about the canvas centre, then shifted by (dx, dy), on a canvas of `size`"""
    cx, cy = size[0] / 2, size[1] / 2
    return img.transform(size, Image.AFFINE, (1 / s, 0, cx - (dx + cx) / s, 0, 1 / s, cy - (dy + cy) / s), Image.BICUBIC)


def align(orig, new, meta):
    W, H = meta["canvas"]; k = 1024 / W; ox, oy = meta["off"]
    w, h = orig.size
    ref = Image.new("RGBA", (1024, 1536)); ref.alpha_composite(orig.resize((round(w * k), round(h * k)), Image.LANCZOS), (round(ox * k), round(oy * k)))
    q = 4; small = (1024 // q, 1536 // q)
    R = np.asarray(ref.resize(small, Image.BILINEAR))[..., 3] > 128
    ys = np.nonzero(R)[0]; y0, y1 = ys.min(), ys.max()
    band = np.zeros_like(R); band[y0:y0 + int((y1 - y0) * 0.3)] = True; band[y0 + int((y1 - y0) * 0.55):y1 + 1] = True   # head, legs
    R = R & band
    na = new.split()[3].resize(small, Image.BILINEAR)
    best = (-1, 1.0, 0, 0)
    for s in np.arange(0.95, 1.051, 0.005):
        for dx in range(-10, 11):
            for dy in range(-10, 11):
                N = (np.asarray(place(na, s, dx, dy, small)) > 128) & band
                iou = (N & R).sum() / max(1, (N | R).sum())
                if iou > best[0]: best = (iou, s, dx * q, dy * q)
    iou, s, dx, dy = best
    can = place(new, s, dx, dy, (1024, 1536))
    out = can.crop((round(ox * k), round(oy * k), round(ox * k) + round(w * k), round(oy * k) + round(h * k))).resize((w, h), Image.LANCZOS)
    return out, iou, s, dx, dy


def main():
    picks = dict(PICK); picks.update(dict(a.split("=") for a in sys.argv[1:] if "=" in a))
    M = json.loads((R62 / "ref_meta.json").read_text())
    for pose, letter in picks.items():
        orig = Image.open(J / f"{pose}.png").convert("RGBA"); new = Image.open(R62 / f"yk_{pose}_{letter}.png").convert("RGBA")
        out, iou, s, dx, dy = align(orig, new, M[pose])
        a = np.asarray(out).astype(np.float32); o = np.asarray(orig).astype(np.float32)
        if pose in PAW:   # the paw from the original (canonical seal), feathered over 14 px
            x, y, r = PAW[pose]; H_, W_ = a.shape[:2]
            yy, xx = np.mgrid[:H_, :W_]; d = np.hypot(xx - x, yy - y); m = np.clip((r - d) / 14, 0, 1)[..., None]
            a = a * (1 - m) + o * m
        a = bleed(np.clip(a, 0, 255).astype(np.uint8))
        Image.fromarray(a).save(J / f"{pose}_yk.png"); Image.fromarray(a).save(R62 / f"yk_{pose}_fit.png")
        print(pose, letter, f"iou={iou:.3f} scale={s:.3f} shift=({dx},{dy})")
        subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "jiggle_masks.py"), f"--pose={pose}_yk"], check=True, stdin=subprocess.DEVNULL)
    # into the content pack (like tools/jig_import.py, as an outfit: characters/<who>.json rigs.yk)
    meta = json.loads((J / "meta.json").read_text()); flesh = json.loads((J / "flesh.json").read_text())
    man = json.loads((A / "manifest.json").read_text()); (A / "outfit").mkdir(exist_ok=True)
    for k in [k for k in man if k.startswith("ep2/jig_")]: del man[k]   # (the first try named them after the chapter)
    rigs = {}
    for pose in picks:
        who, name = pose.split("_"); keys = []
        for f in [f"{pose}_yk"] + [f"{pose}_yk_w{i}" for i in range(4)]:
            nm = "yk_" + f.replace("_yk", ""); dst = A / "outfit" / f"{nm}.png"; shutil.copy(J / f"{f}.png", dst); im = Image.open(dst)
            man[f"outfit/{nm}"] = {"src": f"assets/outfit/{nm}.png", "w": im.width, "h": im.height, **({"data": True} if "_w" in f else {})}
            keys.append(f"outfit/{nm}")
        base = json.loads((CH / f"{who}.json").read_text(encoding="utf-8"))[who]["rig"][name]
        rig = json.loads((J / f"{pose}_yk_rig.json").read_text())
        rigs.setdefault(who, {})[name] = {**base, "img": keys[0], "w": keys[1:], "rig": rig, "flesh": flesh[pose]}
    (A / "manifest.json").write_text(json.dumps(man, indent=1, sort_keys=True))
    for who, r in rigs.items():
        f = CH / f"{who}.json"; raw = f.read_bytes(); crlf = b"\r\n" in raw; d = json.loads(raw.decode("utf-8")); c = d[who]
        c.setdefault("rigs", {})["yk"] = r
        d["_doc"] = d.get("_doc", "").split(" rigs：")[0] + " rigs：别的服装（同一套姿势只改衣服，晃动骨架一样）：yk = 浴衣（第 2 话通关解锁，tools/rounds/r62_yukata.py 生成，不要手改）；选关画面队伍卡的服装小牌切换（SAVE.chars[id].outfit），图只在穿的时候读（src/core/groups.js outfitKeys）。"
        t = json.dumps(d, ensure_ascii=False, indent=2) + "\n"; f.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
        print(who, "rigs.yk", list(r))


if __name__ == "__main__":
    main()
