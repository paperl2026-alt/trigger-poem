"""Round 44 (tools/rounds/job_specs44.py, art/raw/r44): the battle warnings -> the content pack.
  warn_<kind>_<v>.png (3 x 3, the picked version)  -> ui/w<i|h|s>_<cell>   (i = interrupt, h = hide, s = shoot down)
  edge_<kind>_<v>.png (the picked version)         -> ui/edge_<kind>      (trimmed: the strip along the left screen edge)
usage: python -I tools/rounds/r44_import.py"""
import sys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r44"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r23_import import cells

WARN = {"interrupt": ("b", "wi", ["zh", "en", "ja", "zh2", "en2", "ja2", "corner", "dial", "ptr"]),
        "hide": ("c", "wh", ["zh", "en", "ja", "zh2", "en2", "ja2", "duck", "dial", "tri"]),
        "shot": ("c", "ws", ["zh", "en", "ja", "zh2", "en2", "ja2", "ring", "arrow", "burst"])}
EDGE = {"red": "a", "amber": "a", "vein": "b"}


def put(man, key, im):
    im.save(A / f"{key}.webp", quality=92, method=6)
    man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height}
    print(key, im.size)


if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    for kind, (v, pre, names) in WARN.items():
        for name, im in zip(names, cells(RAW / f"warn_{kind}_{v}.png", 3, 3)):
            if im is None: print("empty", kind, name); continue
            s = min(1, 512 / max(im.size)); put(man, f"ui/{pre}_{name}", im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS))
    for kind, v in EDGE.items():
        im = Image.open(RAW / f"edge_{kind}_{v}.png").convert("RGBA")
        im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox())
        s = min(1, 1024 / im.height); put(man, f"ui/edge_{kind}", im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS))
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
