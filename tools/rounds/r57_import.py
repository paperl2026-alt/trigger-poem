"""Round 57 (tools/rounds/job_specs57.py, art/raw/r57; docs/DESIGN.md 书包): the episode-1 reward's icon.
  item   item_cone_<v>.png (the picked one)   -> item/cone   (trimmed, at most 512 px, like item/pig in tools/rounds/r43_import.py)
usage: python -I tools/rounds/r57_import.py"""
import sys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r57"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r53_import import put

CONE = "a"   # the picked version

if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    im = Image.open(RAW / f"item_cone_{CONE}.png").convert("RGBA")
    im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox())
    s = min(1, 512 / max(im.size)); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    put(man, "item/cone", im, dom=True); print("item/cone", im.size)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))   # (the way every import writes it)
