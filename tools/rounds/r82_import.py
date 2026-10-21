"""Round 82's painted shots (tools/rounds/job_specs82.py) into the episode 2 pack as comic/ep2s_<shot> (a storyboard's painted shots:
Game.storyboard, src/ui/storyboard.js): her geta stepping into the pond (feet_a) and her face up close (face_a). 1920 wide, 16:9, opaque.
usage: python -I tools/rounds/r82_import.py"""
import pathlib, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402

RAW = ROOT / "art" / "raw" / "r82"
PICKS = {"she_feet": "she_feet_a", "she_face": "she_face_a"}
W, H = 1920, 1080


def main():
    man = packs.manifest()
    for k, src in PICKS.items():
        im = Image.open(RAW / f"{src}.png").convert("RGB")
        s = max(W / im.width, H / im.height); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        x, y = (im.width - W) // 2, (im.height - H) // 2; im = im.crop((x, y, x + W, y + H))
        key = f"comic/ep2s_{k}"
        if key not in man: man.pk["ep2"][key] = {}; man.where[key] = "ep2"
        d = man.dir(key) / "assets" / "comic"; im.save(d / f"ep2s_{k}.webp", quality=88, method=6)
        man[key] = {"src": f"assets/comic/ep2s_{k}.webp", "w": W, "h": H}
        print(key, im.size)
    man.save()
    print("ok")


if __name__ == "__main__":
    main()
