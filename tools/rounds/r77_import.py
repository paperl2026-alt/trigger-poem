"""Round 77's crowd of hands into episode 1's level pack (tools/rounds/job_specs77.py): ep1/hands_crowd, laid round the feet of a girl caught
in the hole of Madame's coffin form who has no caught picture of her own (src/battle/madame.js hole). Trimmed to the hands.
usage: python -I tools/rounds/r77_import.py [a|b]"""
import pathlib, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402

if __name__ == "__main__":
    v = (sys.argv[1:] or ["a"])[0]
    im = Image.open(ROOT / "art" / "raw" / "r77" / f"hands_{v}.png").convert("RGBA"); im = im.crop(im.getchannel("A").point(lambda x: 255 if x > 30 else 0).getbbox())
    man = packs.manifest(); key = "ep1/hands_crowd"
    if key not in man: man.pk["ep1"][key] = {}; man.where[key] = "ep1"
    im.save(man.dir(key) / "assets" / "ep1" / "hands_crowd.webp", quality=90, method=6)
    man[key] = {"src": "assets/ep1/hands_crowd.webp", "w": im.width, "h": im.height}; man.save(); print(key, im.size)
