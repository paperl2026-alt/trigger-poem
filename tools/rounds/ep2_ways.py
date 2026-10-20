"""Episode 2's ways between places (docs/DESIGN.md 第 2 话「场景之间怎么走」; user 2026-10-19 batch 23: no jumping out of windows, no
teleporting - doors, stairs, a passage behind every doorway). Edits round 63's walls in the content pack; run after
`r63_import.py panels` (which writes them afresh), then tools/rounds/ep2_level.py:
  - the guest room's door and the banquet hall's doorway onto the walkway were painted with a railing across their bottom (walking
    through them went over a balcony): the doorway is opened down to the floor
  - the storehouse's iron doors are cut out of its back wall into two door leaves (ep2/door_kura_l / _r) that swing (they slam shut
    behind the girls), the doorway behind them keyed out
  - a sliding door (ep2/door_fusuma) cut from the corridor's painting of the guest room's fusuma: the room's door
  - the nine small stages' thumbnails for the select screen (ui/sel_thumb_ep2_<stage>): a band across each one's most telling wall
usage: python -I tools/rounds/ep2_ways.py"""
import json, pathlib, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[2]
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)
from r54_import import save
DARK = (26, 18, 30)   # (what a keyed doorway shows where the passage beyond is not drawn: r63_import key2)


def load(key): return Image.open(A / f"{key}.webp").convert("RGBA")


def doorway(a):   # the biggest see-through area: (u0, u1, v0, v1), v from the top
    m = a[..., 3] < 100; lab, n = ndimage.label(m)
    big = 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1)))); ys, xs = np.nonzero(lab == big)
    H, W = m.shape
    return xs.min() / W, xs.max() / W, ys.min() / H, ys.max() / H


def cut(a, u0, u1, v0, v1):   # see-through in this rectangle (soft edges)
    H, W = a.shape[:2]; m = np.zeros((H, W), bool); m[int(v0 * H):int(v1 * H), int(u0 * W):int(u1 * W)] = True
    soft = ndimage.gaussian_filter(m.astype(np.float32), 0.8)
    a = a.copy(); a[..., 3] = np.minimum(a[..., 3], (255 * (1 - soft)).astype(np.uint8)); a[m, :3] = DARK
    return a


def open_to_floor(man, key):
    a = np.asarray(load(key)).copy(); u0, u1, v0, v1 = doorway(a)
    if v1 > 0.98: return   # (already open)
    a = cut(a, u0 + 0.004, u1 - 0.004, v1 - 0.01, 1.0)
    save(man, key, Image.fromarray(a), q=90, keyed=True); print(key, "opened to the floor", round(u0, 3), round(u1, 3), "from", round(v1, 3))


def kura_doors(man):
    U0, U1, UM, V0, V1 = 0.327, 0.670, 0.4995, 0.252, 0.967   # (measured on the picture: the frame, the seam between the two doors)
    im = load("ep2/kura_back1"); W, H = im.size
    if np.asarray(im)[int((V0 + V1) / 2 * H), int((U0 + UM) / 2 * W), 3] > 100:   # (not cut yet)
        save(man, "ep2/door_kura_l", im.crop((int(U0 * W), int(V0 * H), int(UM * W), int(V1 * H))), q=90)
        save(man, "ep2/door_kura_r", im.crop((int(UM * W), int(V0 * H), int(U1 * W), int(V1 * H))), q=90)
        save(man, "ep2/kura_back1", Image.fromarray(cut(np.asarray(im), U0 + 0.003, U1 - 0.003, V0 + 0.003, V1)), q=90, keyed=True)
        print("kura doors cut out")
    man["ep2/kura_back1"]["door"] = [U0, U1, V0, V1]   # (where the doorway is: ep2_level.py reads it)


def fusuma(man):
    im = load("ep2/rouka_back1"); W, H = im.size
    save(man, "ep2/door_fusuma", im.crop((int(0.045 * W), int(0.255 * H), int(0.395 * W), int(0.935 * H))), q=90); print("fusuma cut")


THUMBS = {"genkan": ("ep2/genkan_end1", 0.5), "room": ("ep2/rouka_end1", 0.45), "run": ("ep2/rouka_wallL1_x", 0.5), "hiroma": ("ep2/hiroma_end1", 0.4),
          "nakaniwa": ("ep2/nakaniwa_end1", 0.5), "kura": ("ep2/kura_end1", 0.45), "chika": ("ep2/chika_end1", 0.45), "shoro": ("ep2/shoro_wallL1", 0.5),
          "kane": ("ep2/kane_end1", 0.45)}


def thumbs(man):   # (the size of the old one: 1200 x 363)
    for sid, (key, v) in THUMBS.items():
        if not (A / f"{key}.webp").exists(): key = key.replace("_x", "")
        im = load(key); bg = Image.new("RGBA", im.size, DARK + (255,)); bg.alpha_composite(im); im = bg.convert("RGB")
        W, H = im.size; h = round(W * 363 / 1200); y = int(min(H - h, max(0, v * H - h / 2)))
        save(man, f"ui/sel_thumb_ep2_{sid}", im.crop((0, y, W, y + h)).resize((1200, 363), Image.LANCZOS), q=88, dom=True)
    print("thumbs", len(THUMBS))


if __name__ == "__main__":
    man = packs.manifest()
    for k in ("ep2/kyakushitsu_end1", "ep2/hiroma_end1"): open_to_floor(man, k)
    kura_doors(man); fusuma(man); thumbs(man)
    man.save()
