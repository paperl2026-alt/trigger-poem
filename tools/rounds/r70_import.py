"""Round 70's reticles into the base pack (tools/rounds/job_specs70.py; docs/DESIGN.md「准星精简」): ui/retv_<who>_<idle|lock>, white line art
on transparent, square. The aim point is the centre of the picture: each one is shifted so its centre dot sits exactly there (the dot =
the small round blob nearest the middle) on a canvas grown so nothing is cut, then sized to 256 px; "frame" in the manifest = its width
as a share of the picture (the game sizes it by that). src/ui/glhud.js Reticle draws them inverting what is behind.
usage: python -I tools/rounds/r70_import.py [<who>_<form> a|b ...]"""
import pathlib, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402

RAW = ROOT / "art" / "raw" / "r70"
PICK = {"cat_idle": "a", "cat_lock": "a", "pink_idle": "a", "pink_lock": "a"}

def centred(im):
    a = np.asarray(im)[..., 3] > 100; H, W = a.shape
    lab, n = ndimage.label(a); best = None
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if len(xs) > a.sum() * 0.05: continue   # (a line, not the dot)
        h, w = np.ptp(ys) + 1, np.ptp(xs) + 1
        if max(h, w) > W * 0.06 or abs(h - w) > max(h, w) * 0.4: continue   # (small and round)
        cy, cx = ys.mean(), xs.mean(); d = (cx - W / 2) ** 2 + (cy - H / 2) ** 2
        if best is None or d < best[0]: best = (d, cx, cy)
    if not best: print("  no centre dot found: left as drawn"); return im
    dx, dy = round(W / 2 - best[1]), round(H / 2 - best[2]); pad = max(abs(dx), abs(dy))
    S = W + 2 * pad   # (a bigger canvas: moving the dot to the middle never cuts the ears off)
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0)); out.paste(im, (pad + dx, pad + dy)); print("  dot moved by", dx, dy)
    return out

if __name__ == "__main__":
    a = sys.argv[1:]
    for k, v in zip(a[::2], a[1::2]): PICK[k] = v
    man = packs.manifest()
    for k, v in PICK.items():
        im = Image.open(RAW / f"{k}_{v}.png").convert("RGBA"); print(k, v, im.size)
        im = centred(im); bb = im.getchannel("A").point(lambda v: 255 if v > 100 else 0).getbbox(); frame = round((bb[2] - bb[0]) / im.width, 4)   # (how wide it is: the game sizes it by this)
        im = im.resize((256, 256), Image.LANCZOS)
        key = f"ui/retv_{k}"; d = man.dir(key) / "assets" / "ui"; d.mkdir(parents=True, exist_ok=True)
        im.save(d / f"retv_{k}.png"); man[key] = {"src": f"assets/ui/retv_{k}.png", "w": 256, "h": 256, "frame": frame}; print("  frame", frame)
    man.save(); print("ok")
