"""Round 69's things into episode 1's level pack (tools/rounds/job_specs69.py): the mine cart's front wall (ep1/cart_front: src/battle/ride.js
draws it in front of the girls; "rim" = where its top edge is, a share of the picture's height from the top) and the child's soul the
girls guard (ep1/soul_child: src/battle/escort.js). The heroines' pose sets go through the jiggle rig (tools/jiggle_masks.py) instead.
usage: python -I tools/rounds/r69_import.py [cart a|b] [soul a|b]"""
import pathlib, sys
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)
from r54_import import save, trimmed  # noqa: E402

RAW = ROOT / "art" / "raw" / "r69"
PICK = {"cart": "b", "soul": "a"}

if __name__ == "__main__":
    a = sys.argv[1:]
    for k, v in zip(a[::2], a[1::2]): PICK[k] = v
    man = packs.manifest()
    src = Image.open(RAW / f"cart_front_{PICK['cart']}.png").convert("RGBA")
    bb = src.getbbox(); im = src.crop(bb)
    rows = np.where((np.asarray(im)[..., 3] > 128).mean(axis=1) > 0.5)[0]   # the first row the wall fills more than half of: its top edge
    rim = round(float(rows[0]) / im.height, 3)
    if im.width > 1600: im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
    save(man, "ep1/cart_front", im, q=90, rim=rim); print("ep1/cart_front", im.size, "rim", rim)
    im = trimmed(Image.open(RAW / f"soul_child_{PICK['soul']}.png").convert("RGBA"))
    if im.height > 900: im = im.resize((round(im.width * 900 / im.height), 900), Image.LANCZOS)
    save(man, "ep1/soul_child", im, q=92); print("ep1/soul_child", im.size)
    man.save()
