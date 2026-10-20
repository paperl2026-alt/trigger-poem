"""Round 74's mansion doors into episode 1's level pack (tools/rounds/job_specs74.py): leaves for the side-wall doorways of its rooms
(src/battle/panels.js buildWay / buildDoor, kind swing): the frame cut off, the double door split down the middle into its two leaves ->
ep1/door_double_l, ep1/door_double_r, ep1/door_single, each with its honey-rotted _x (the leaves turn with the room).
usage: python -I tools/rounds/r74_import.py [double a|b] [double_x a|b] [single a|b] [single_x a|b]"""
import pathlib, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402

RAW = ROOT / "art" / "raw" / "r74"
PICK = {"double": "a", "double_x": "a", "single": "a", "single_x": "a"}
# the leaves inside each frame (share of the trimmed picture: left, top, right, bottom)
INNER = {"double": (0.105, 0.135, 0.895, 0.985), "single": (0.12, 0.075, 0.88, 0.99)}

def put(man, key, im):
    if key not in man: man.pk["ep1"][key] = {}; man.where[key] = "ep1"
    d = man.dir(key) / "assets" / "ep1"; d.mkdir(parents=True, exist_ok=True)
    im = im.resize((round(im.width * 1024 / im.height), 1024), Image.LANCZOS); im.save(d / f"{key.split('/')[1]}.webp", quality=90, method=6)
    man[key] = {"src": f"assets/ep1/{key.split('/')[1]}.webp", "w": im.width, "h": im.height}; print(key, im.size)

if __name__ == "__main__":
    a = sys.argv[1:]
    for k, v in zip(a[::2], a[1::2]): PICK[k] = v
    man = packs.manifest()
    for k, v in PICK.items():
        im = Image.open(RAW / f"door_{k}_{v}.png").convert("RGBA"); im = im.crop(im.getchannel("A").point(lambda x: 255 if x > 40 else 0).getbbox())
        kind, x = k.replace("_x", ""), "_x" if k.endswith("_x") else ""
        l, t, r, b = INNER[kind]; W, H = im.size; leaf = im.crop((round(W * l), round(H * t), round(W * r), round(H * b)))
        if kind == "double":
            half = leaf.width // 2
            put(man, f"ep1/door_double_l{x}", leaf.crop((0, 0, half, leaf.height))); put(man, f"ep1/door_double_r{x}", leaf.crop((half, 0, leaf.width, leaf.height)))
        else: put(man, f"ep1/door_single{x}", leaf)
    man.save(); print("ok")
