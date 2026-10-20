"""Round 76's arms into episode 1's level pack (tools/rounds/job_specs76.py): the arm Madame's coffin form reaches in with from the edge of the
picture (src/battle/madame.js drag) -> ep1/arm_reach, ep1/arm_grip, trimmed to the arm (its left end stays where the picture's edge cut it).
Where the eye in its palm is (bosses.json madame.coffin.arm.eye_<pose>) is measured on these.
usage: python -I tools/rounds/r76_import.py [reach a|b] [grip a|b]"""
import pathlib, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402

RAW = ROOT / "art" / "raw" / "r76"
PICK = {"reach": "a", "grip": "a"}

if __name__ == "__main__":
    a = sys.argv[1:]
    for k, v in zip(a[::2], a[1::2]): PICK[k] = v
    man = packs.manifest(); size = None
    for k, v in PICK.items():   # (reach first: grip goes on a canvas of reach's size, scaled to its width, centred up and down - one mesh shows both)
        im = Image.open(RAW / f"arm_{k}_{v}.png").convert("RGBA"); im = im.crop(im.getchannel("A").point(lambda x: 255 if x > 30 else 0).getbbox())
        if size:
            s = size[0] / im.width; im = im.resize((size[0], round(im.height * s)), Image.LANCZOS)
            can = Image.new("RGBA", size, (0, 0, 0, 0)); can.alpha_composite(im, (0, (size[1] - im.height) // 2)); im = can
        size = size or im.size
        key = f"ep1/arm_{k}"
        if key not in man: man.pk["ep1"][key] = {}; man.where[key] = "ep1"
        d = man.dir(key) / "assets" / "ep1"; im.save(d / f"arm_{k}.webp", quality=90, method=6)
        man[key] = {"src": f"assets/ep1/arm_{k}.webp", "w": im.width, "h": im.height, "hit": True}; print(key, im.size)
    man.save(); print("ok")
