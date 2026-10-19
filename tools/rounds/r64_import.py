"""Round 64 (tools/rounds/job_specs64.py, art/raw/r64; docs/DESIGN.md「阵亡」) -> the content pack.
  word_readvent_<v> -> ui/alert_revive_cat   (再临: the word over the cat girl's half while she is down)
  word_rebirth_<v>  -> ui/alert_revive_pink  (重生: the twin-tail girl's)
  down_cat_<v>      -> down/cat   (the cursed doll she falls back into; the paw's seal made canonical first: tools/seal_fix.py
                                   r64_down_cat_<v> writes art/raw/r64/fixed/)
  down_pink_<v>     -> down/pink  (her clothes in a heap and the memorial photo)
Each picture is one thing on transparency: trimmed to its pixels with a small margin.
usage: python -I tools/rounds/r64_import.py"""
import json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r64"
A = ROOT / "public" / "content" / "base" / "assets"
PICK = {"readvent": "c", "rebirth": "a", "down_cat": "a", "down_pink": "a"}
OUT = {"readvent": ("word_readvent", "ui/alert_revive_cat", 900), "rebirth": ("word_rebirth", "ui/alert_revive_pink", 900),
       "down_cat": ("down_cat", "down/cat", 1000), "down_pink": ("down_pink", "down/pink", 1000)}


def trim(im, pad=8):
    a = im.getchannel("A").point(lambda v: 255 if v > 24 else 0); b = a.getbbox()
    return im.crop((max(0, b[0] - pad), max(0, b[1] - pad), min(im.width, b[2] + pad), min(im.height, b[3] + pad)))


if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    for k, (stem, key, maxs) in OUT.items():
        name = f"{stem}_{PICK[k]}.png"; src = RAW / "fixed" / name if (RAW / "fixed" / name).exists() else RAW / name
        im = trim(Image.open(src).convert("RGBA"))
        if max(im.size) > maxs: s = maxs / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        (A / key).parent.mkdir(parents=True, exist_ok=True)
        im.save(A / f"{key}.webp", quality=92, method=6)
        man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height}
        print(key, src.name, im.size)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
