"""Round 54 (tools/rounds/job_specs54.py, art/raw/r54; docs/DESIGN.md 第 1 话) -> the content pack.
  panels   <place>_<wallL|wallR|floor|ceil|end><n>[_x], <place>_outside[_x]   -> ep1/<place>_<name>[_x]
           (_x = the rotten version; window panes keyed out where painted magenta; floors / ceilings tileable, every version's edges matched
           to version 1 of its kind (the rotten ones to version 1's rotten one))
  covers   cover_<place><n>   -> cover/ep1_<place><n>   (trimmed, "solidTop" like tools/rounds/r32_import.py)
  props    prop_<place><n>    -> prop/ep1_<place><n>    (trimmed)
  decals   dec_<sheet> (3 x 2) -> ep1/d_<name>
A picture that is missing (refused, not drawn yet) is reported and skipped; run again when it is there.
Then: python -I tools/relief.py "cover/ep1_*" "prop/ep1_*"
usage: python -I tools/rounds/r54_import.py [panels] [covers] [props] [decals]"""
import sys, json, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r54"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r28_import import key_magenta, tileable
from r31_import import same_edges
from r23_import import cells

PLACES = ["shop", "gallery", "garden", "cold", "oven", "hall", "nether"]   # (nether: floor only)
SIZE = {"3:2": (1536, 1024), "2:3": (1024, 1536), "1:1": (1280, 1280)}
WALL = {"shop": "3:2", "gallery": "3:2", "garden": "1:1", "cold": "3:2", "oven": "3:2", "hall": "2:3"}
END = {"shop": "3:2", "gallery": "1:1", "garden": "3:2", "cold": "3:2", "oven": "3:2", "hall": "3:2"}
DECALS = {"drips": ["drip1", "drip2", "drip3", "drip4", "drip5", "drip6"], "rot": ["peel", "mould", "web", "crack", "torn", "splash"],
          "floor": ["puddle", "honey", "bones", "cones", "syrup", "cherries"], "words": ["asobo", "asobo2", "kaeshite", "zutto", "smile", "hand"]}


def save(man, key, im, q=90, **extra):
    (A / key).parent.mkdir(parents=True, exist_ok=True)
    im.save(A / f"{key}.webp", quality=q, method=6)
    man[key] = {**{k: v for k, v in man.get(key, {}).items() if k in ("relief",)}, "src": f"assets/{key}.webp", "w": im.width, "h": im.height, **extra}


def magenta(im):
    a = np.asarray(im.convert("RGB")).astype(np.int16)
    return ((a[..., 0] > 200) & (a[..., 1] < 90) & (a[..., 2] > 200)).mean() > 0.002


def sky_fill(im, rotten):
    """a glass roof: its magenta panes become sky (nothing is above the ceiling to see through): pale blue going pink, or warm amber
    when the place has rotted"""
    a = np.asarray(im.convert("RGB")).astype(np.float32)
    m = (a[..., 0] > 200) & (a[..., 1] < 90) & (a[..., 2] > 200)
    from scipy import ndimage
    m = ndimage.binary_dilation(m, iterations=2)
    H = a.shape[0]; t = np.linspace(0, 1, H)[:, None, None]
    top, bot = (np.array([236, 196, 150]), np.array([250, 222, 196])) if rotten else (np.array([176, 208, 238]), np.array([246, 220, 226]))
    sky = top * (1 - t) + bot * t
    a = np.where(m[..., None], sky * np.ones_like(a), a)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def trimmed(im):
    return im.crop(im.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox())


def panels(man, only=None):
    for k in (only or PLACES):
        for f in sorted(RAW.glob(f"{k}_*.png")):
            n = f.stem[len(k) + 1:]; kind = n.rstrip("_x").rstrip("0123456789")
            im = Image.open(f)
            key = f"ep1/{k}_{n}"
            if kind in ("floor", "ceil"):
                t = tileable(im.convert("RGB").resize((1024, 1024), Image.LANCZOS))
                base = RAW / f"{k}_{kind}1{'_x' if n.endswith('_x') else ''}.png"
                if base != f and base.exists(): t = same_edges(t, tileable(Image.open(base).convert("RGB").resize((1024, 1024), Image.LANCZOS)))
                if magenta(t): save(man, key, sky_fill(t, n.endswith("_x")))   # (the garden's glass roof: sky painted in)
                else: save(man, key, t)
            else:
                size = SIZE[WALL[k]] if kind.startswith("wall") else SIZE[END[k]] if kind == "end" else (2048, 1365)
                im = im.convert("RGB").resize(size, Image.LANCZOS)
                if magenta(im): save(man, key, key_magenta(im), keyed=True)
                else: save(man, key, im)
            print(key, man[key]["w"], man[key]["h"], "keyed" if man[key].get("keyed") else "")


def covers(man):
    for f in sorted(RAW.glob("cover_*.png")):
        im = trimmed(Image.open(f).convert("RGBA"))
        if im.width > 1400: im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
        cov = (np.asarray(im.getchannel("A")) > 128).mean(1)
        save(man, f"cover/ep1_{f.stem[6:]}", im, solidTop=round(int(np.argmax(cov > 0.6)) / im.height, 3))
        print(f"cover/ep1_{f.stem[6:]}", im.size)


def props(man):
    for f in sorted(RAW.glob("prop_*.png")):
        im = trimmed(Image.open(f).convert("RGBA"))
        if max(im.size) > 900: s = 900 / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        save(man, f"prop/ep1_{f.stem[5:]}", im); print(f"prop/ep1_{f.stem[5:]}", im.size)


def decals(man):
    for sheet, names in DECALS.items():
        src = RAW / f"dec_{sheet}.png"
        if not src.exists(): print("missing", src.name); continue
        for name, im in zip(names, cells(src)):
            if im is None: print("empty cell", sheet, name); continue
            save(man, f"ep1/d_{name}", im, q=92); print(f"ep1/d_{name}", im.size)


if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    for w in sys.argv[1:] or ["panels", "covers", "props", "decals"]: globals()[w](man)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))   # (the way every import writes it)
