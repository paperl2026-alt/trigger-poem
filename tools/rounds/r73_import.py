"""Round 73's classroom doors into the prologue's level pack (tools/rounds/job_specs73.py): ep0/cls_door (the school as it is) and
ep0/cls_door_x (after the evil energy has turned it), leaves for the classroom's side-wall doorways (tools/rounds/ep0_rework.py ways,
src/battle/panels.js buildDoor). The magenta glass is cut out (the dark of the passage shows through), the leaf trimmed to itself.
usage: python -I tools/rounds/r73_import.py [door a|b] [door_x a|b]"""
import pathlib, sys
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402

RAW = ROOT / "art" / "raw" / "r73"
PICK = {"door": "a", "door_x": "b"}   # (the same two-pane window in both: turning the school does not reshape the door)

def leaf(im):
    a = np.asarray(im.convert("RGBA")).copy(); r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    mag = (r > 170) & (b > 170) & (g < 110) & (abs(r - b) < 90)   # (the glass, painted pure magenta)
    a[mag, 3] = 0
    out = Image.fromarray(a, "RGBA"); bb = out.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    return out.crop(bb)

if __name__ == "__main__":
    a = sys.argv[1:]
    for k, v in zip(a[::2], a[1::2]): PICK[k] = v
    man = packs.manifest()
    for k, v in PICK.items():
        im = leaf(Image.open(RAW / f"cls_{k}_{v}.png")); im = im.resize((round(im.width * 1024 / im.height), 1024), Image.LANCZOS)
        key = f"ep0/cls_{k}"; d = man.dir(key) / "assets" / "ep0"; d.mkdir(parents=True, exist_ok=True)
        im.save(d / f"cls_{k}.png"); man[key] = {"src": f"assets/ep0/cls_{k}.png", "w": im.width, "h": im.height}
        print(key, im.size, man.dir(key).name)
    man.save(); print("ok")
