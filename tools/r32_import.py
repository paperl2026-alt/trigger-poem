"""Round 32 art (tools/job_specs32.py, art/raw/r32) -> the content pack.
  covers   c_<name>.png        -> cover/<name>      (trimmed; "solidTop" = where the solid body starts, from the top; relief separately)
  decals   dec_<sheet>.png     -> st3/d_<name>      (3 x 2 sheets sliced)
  monsters m_<kind>_<v>.png    -> enemy/<kind>_<v>_<pose>   (sliced like R23, tools/r23_import.py)
Then: python -I tools/relief.py "cover/*" "enemy/*_b_*" "enemy/*_c_*"
usage: python -I tools/r32_import.py [covers] [decals] [monsters]"""
import sys, json, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "raw" / "r32"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path.insert(0, str(ROOT / "tools"))
from r23_import import cells, frames, SHEETS, REF

COVERS = ["desks", "lockers", "shoebox", "cart", "vault", "mats", "bookcase", "lectern", "boxes", "piano", "sofa", "planter"]
DECALS = {"sigils": [f"sigil{i}" for i in range(1, 7)], "banners": [f"banner{i}" for i in range(1, 7)],
          "floor": ["papers2", "bag2", "shoe", "glasses", "goo2", "steps"], "wall": ["cracks2", "drip", "poster", "claws", "splash", "rash"]}


def covers(man):
    for n in COVERS:
        im = Image.open(RAW / f"c_{n}.png").convert("RGBA")
        im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox())
        if im.width > 1400: im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
        cov = (np.asarray(im.getchannel("A")) > 128).mean(1)
        key = f"cover/{n}"
        im.save(A / f"{key}.webp", quality=90, method=6)
        man[key] = {**{k: v for k, v in man.get(key, {}).items() if k == "relief"}, "src": f"assets/{key}.webp", "w": im.width, "h": im.height,
                    "solidTop": round(int(np.argmax(cov > 0.6)) / im.height, 3)}
        print(key, im.size, man[key]["solidTop"])


def decals(man):
    for sheet, names in DECALS.items():
        for name, im in zip(names, cells(RAW / f"dec_{sheet}.png")):
            if im is None: print("empty cell", sheet, name); continue
            key = f"st3/d_{name}"
            im.save(A / f"{key}.webp", quality=92, method=6)
            man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height}
            print(key, im.size)


def monsters(man):
    for kind, (eid, poses, anchor) in SHEETS.items():
        for v in "bc":
            src = RAW / f"m_{kind}_{v}.png"
            if not src.exists(): print("missing", src.name); continue
            for name, can, extra in frames(src, poses, anchor, REF.get(eid, 0)):
                key = f"enemy/{eid}_{v}_{name}"
                can.save(A / f"{key}.webp", quality=90, method=6)
                man[key] = {"src": f"assets/{key}.webp", "w": can.width, "h": can.height, "hit": True, **extra}
            print(eid, v, can.size, extra)


if __name__ == "__main__":
    what = sys.argv[1:] or ["covers", "decals"]
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    if "covers" in what: covers(man)
    if "decals" in what: decals(man)
    if "monsters" in what: monsters(man)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
