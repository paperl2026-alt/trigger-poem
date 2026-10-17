"""Cover art made for the job (tools/job_specs30.py, art/raw/r30) -> cover/<name> (trimmed to the drawing). "solidTop" in the manifest =
where its solid body starts, from the top (a broom or books sticking up do not count): the game sizes the cover by its body.
Then run the relief for them: python -I tools/relief.py "cover/r30_*"
usage: python -I tools/r30_import.py"""
import json, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "raw" / "r30"
A = ROOT / "public" / "content" / "base" / "assets"
NAMES = ["desks", "lockers", "shoebox", "cart", "vault", "mats", "bookcase", "lectern"]

if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    (A / "cover").mkdir(exist_ok=True)
    for n in NAMES:
        im = Image.open(RAW / f"{n}.png").convert("RGBA")
        a = im.getchannel("A").point(lambda v: 255 if v > 24 else 0)
        im = im.crop(a.getbbox())
        if im.width > 1400: im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
        key = f"cover/r30_{n}"
        cov = (np.asarray(im.getchannel("A")) > 128).mean(1)
        solid = int(np.argmax(cov > 0.6)) / im.height
        im.save(A / f"{key}.webp", quality=90, method=6)
        man[key] = {**man.get(key, {}), "src": f"assets/{key}.webp", "w": im.width, "h": im.height, "solidTop": round(solid, 3)}
        print(key, im.size, "solidTop", round(solid, 3))
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
