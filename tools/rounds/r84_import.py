"""Round 84's painting of the honey maggot (tools/rounds/job_specs84.py) into the episode 1 pack as boss/maggot_cu: its entrance close-up
page (bosses.json maggot.closeup.k, Game.vignette - only a picture on a page: no relief, no frames). Trimmed, 1000 px high.
usage: python -I tools/rounds/r84_import.py"""
import pathlib, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402

PICK, H = "a", 1000


def main():
    im = Image.open(ROOT / "art" / "raw" / "r84" / f"maggot_{PICK}.png").convert("RGBA")
    im = im.crop(im.getchannel("A").point(lambda x: 255 if x > 24 else 0).getbbox())
    im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
    man = packs.manifest(); key = "boss/maggot_cu"
    if key not in man: man.pk["ep1"][key] = {}; man.where[key] = "ep1"
    d = man.dir(key) / "assets" / "boss"; d.mkdir(parents=True, exist_ok=True); im.save(d / "maggot_cu.webp", quality=90, method=6)
    man[key] = {"src": "assets/boss/maggot_cu.webp", "w": im.width, "h": im.height}
    man.save(); print(key, im.size)


if __name__ == "__main__":
    main()
