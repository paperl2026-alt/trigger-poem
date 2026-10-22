"""Give sprite frames a transparent margin (room for the white outline / glow that shows what can be shot, docs/DESIGN.md「战斗画面布局」),
keeping their size in the game: the manifest's figH (the figure's share of the canvas height, src/battle/enemies.js Actor) is scaled with
the canvas. Bottom-anchored frames (they stand on the floor) get no margin at the bottom, so their feet stay put. The relief map of each
frame is padded the same way (its edge values carried out). A frame already padded (manifest "pad") is left alone.
usage: python -I tools/pad_frames.py "enemy/*" [--px 18]"""
import sys, json, pathlib, fnmatch
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)


def pad_img(path, l, t, r, b, edge=False):
    im = Image.open(path)
    a = np.asarray(im.convert("RGBA" if not edge else im.mode))
    if edge:   # relief: carry the border values out
        a = np.pad(a, ((t, b), (l, r)) + (((0, 0),) if a.ndim == 3 else ()), mode="edge")
    else:
        a = np.pad(a, ((t, b), (l, r), (0, 0)), mode="constant")
    out = Image.fromarray(a)
    out.save(path, quality=90, method=6) if path.suffix == ".webp" else out.save(path)
    return out.size


if __name__ == "__main__":
    pats = [a for a in sys.argv[1:] if not a.startswith("--")]
    px = int(sys.argv[sys.argv.index("--px") + 1]) if "--px" in sys.argv else 18
    man = packs.manifest()
    keys = [k for p in pats for k in man if fnmatch.fnmatch(k, p) and not k.endswith("_rd") and not man[k].get("pad")]
    n = 0
    for k in keys:
        m = man[k]; W, H = m["w"], m["h"]
        bottom = m.get("anchor") == "bottom"
        p = max(px, round(max(W, H) * 0.035))
        l, t, r, b = p, p, p, (0 if bottom else p)
        nw, nh = pad_img(man.path(k), l, t, r, b)
        m["figH"] = round(m.get("figH", 1) * H / nh, 4)   # (frames without one filled their canvas: 1)
        m["w"], m["h"], m["pad"] = nw, nh, [l, t, r, b]; man[k] = m   # (set back: a level pack's manifest saves only what was set)
        rd = m.get("relief")
        if rd and rd in man:
            R = man[rd]; sx = R["w"] / W; sy = R["h"] / H
            rw, rh = pad_img(man.path(rd), round(l * sx), round(t * sy), round(r * sx), round(b * sy), edge=True)
            R["w"], R["h"] = rw, rh; man[rd] = R
        n += 1
    man.save()
    print("padded", n)
