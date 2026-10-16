"""Clean the chosen bubble lettering for use ON paper (title buttons, tags): the stickers come with a wide white sticker border,
little sakura / sparkle / '!!' decorations and soft halos, which look pasted on. Keep only the letters themselves (the dark plum
outline and everything inside it: pink fill, white gloss, the cat ears / paw / bell that are part of a word), drop the rest,
and harden the edge. Reads the original stickers from art/raw/letters_src/ (copied there on the first run) and writes the
cleaned images back into the pack under the same keys.
usage: python -I tools/letter_clean.py [key ...]     (default: every ui/zh_*, ui/ja_*, ui/en_*, ui/d*, ui/dpct)
"""
import sys, json, pathlib, shutil
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "content" / "base" / "assets"
SRC = ROOT / "art" / "raw" / "letters_src"


# words whose outline is interrupted where a decoration overlapped it need a wider seal
SEAL = {"en_english": 12}


def clean(im, seal=3):
    a = np.asarray(im.convert("RGBA")).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3]
    lum = rgb @ np.array([0.3, 0.59, 0.11], np.float32)
    sat = rgb.max(-1) - rgb.min(-1)
    # everything outside the letters' dark plum outline goes: fill in from the image edge through every pixel that is not
    # outline (small gaps in the outline are sealed first). That takes the white sticker border and the sakura / sparkles
    # stuck around the words; the pink fill and white gloss inside the outline stay.
    dark = (al > 140) & (lum < 105)
    wall = ndimage.binary_closing(dark, iterations=seal) | dark
    seed = np.zeros_like(wall); seed[0, :] = seed[-1, :] = True; seed[:, 0] = seed[:, -1] = True
    outside = ndimage.binary_propagation(seed & ~wall, mask=~wall)
    body = (al >= 110) & ~outside
    body = ndimage.binary_opening(body, iterations=1)
    # drop small bits (sakura, sparkles, !!): keep components that are a real part of the word
    lab, n = ndimage.label(body)
    if n:
        idx = range(1, n + 1)
        sizes = ndimage.sum(body, lab, idx)
        # letters carry the thick dark plum outline; sakura and sparkles do not
        darkfrac = ndimage.sum(body & (lum < 95), lab, idx) / np.maximum(sizes, 1)
        ok = (sizes >= sizes.max() * 0.03) & (darkfrac > 0.1)
        keep = np.isin(lab, 1 + np.where(ok)[0])
    else:
        keep = body
    # a 1px soft edge so it does not look cut with scissors
    soft = ndimage.gaussian_filter(keep.astype(np.float32), 0.7)
    out = np.dstack([rgb, np.clip(np.minimum(al / 255, soft) * 255, 0, 255)]).astype(np.uint8)
    o = Image.fromarray(out)
    bb = o.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    return o.crop(bb) if bb else o


if __name__ == "__main__":
    mp = OUT / "manifest.json"; man = json.loads(mp.read_text())
    keys = sys.argv[1:] or [k for k in man if k.startswith(("ui/zh_", "ui/ja_", "ui/en_", "ui/d")) and not k.startswith("ui/dust")]
    SRC.mkdir(parents=True, exist_ok=True)
    for k in keys:
        name = k.split("/", 1)[1]
        src = SRC / f"{name}.webp"
        if not src.exists():
            shutil.copy(OUT / "ui" / f"{name}.webp", src)   # keep the original sticker once
        im = clean(Image.open(src), SEAL.get(name, 3))
        im.save(OUT / "ui" / f"{name}.webp", quality=93, method=6)
        man[k] = {**man[k], "w": im.width, "h": im.height, "clean": True}
        print(k, im.size)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
