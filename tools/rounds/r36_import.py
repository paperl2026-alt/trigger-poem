"""Round 36 (tools/rounds/job_specs36.py, art/raw/r36) -> the content pack.
  reload close-ups  rl_<cat|pink>_<set>.png (3 x 3)  -> ui/rl_<who>_<set>_<1..9>  (the cat girl's: canonical seal put on first, see below)
  bubbles           bub_<cute|shout|monster>.png (3 x 2) -> ui/bub_<kind>_<0..5>
  comic panels      c_<panel>_<v>.png                -> comic/ep0_<panel>_<v>  (all candidates; ui/... picks in comics.json)
  boss parts        b_<part>_<v>.png                 -> boss/dc2_<part>_<v>
usage: python -I tools/rounds/r36_import.py [reload] [bubbles] [comics] [boss]"""
import sys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r36"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r23_import import cells


def save(man, key, im, maxs=None, q=88, **extra):
    if maxs and max(im.size) > maxs:
        s = maxs / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    (A / key).parent.mkdir(parents=True, exist_ok=True)
    im.save(A / f"{key}.webp", quality=q, method=6)
    man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height, **extra}


if __name__ == "__main__":
    what = sys.argv[1:] or ["reload", "bubbles", "comics", "boss"]
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    if "reload" in what:
        for f in sorted(RAW.glob("rl_*.png")):
            who, k = f.stem.split("_")[1:3]
            # the cat girl's paw: cells with the canonical seal put on (art/seal_placements.json rl_<who>_<set>_<i>, tools/seal_fix.py)
            fixed = RAW / f"{f.stem}_cells"
            if who == "cat" and not fixed.exists(): print(f.stem, "skipped: seals not made canonical yet"); continue
            for i, im in enumerate(cells(f, 3, 3), 1):
                if (fixed / f"fixed_{i}.png").exists(): im = Image.open(fixed / f"fixed_{i}.png").convert("RGBA")
                if im is not None: save(man, f"ui/rl_{who}_{k}_{i}", im, maxs=640, **({"seal": "canonical"} if (fixed / f"fixed_{i}.png").exists() else {}))
            print(f.stem)
    if "bubbles" in what:
        for f in sorted(RAW.glob("bub_*.png")):
            for i, im in enumerate(cells(f, 3, 2)):
                if im is not None: save(man, f"ui/bub_{f.stem[4:]}_{i}", im, maxs=420)
            print(f.stem)
    if "comics" in what:
        for f in sorted(RAW.glob("c_*.png")):
            save(man, f"comic/ep0_{f.stem[2:]}", Image.open(f).convert("RGB"), maxs=1536, q=86)
        print("comics", len(list(RAW.glob("c_*.png"))))
    if "boss" in what:
        for f in sorted(RAW.glob("b_*.png")):
            im = Image.open(f).convert("RGBA"); im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox())
            save(man, f"boss/dc2_{f.stem[2:]}", im, maxs=1600, hit=True)
        print("boss", len(list(RAW.glob("b_*.png"))))
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
