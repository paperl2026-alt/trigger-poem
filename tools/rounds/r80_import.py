"""Round 80's key frames of the prologue boss's attacks (tools/rounds/job_specs80.py) into the prologue pack as boss/qq_s<n>_<pose>, on the
same canvas as the form's own frames (R43: its size, its padding, its anchor - the feet on the bottom for forms 1 - 3, centred for the
floating 4 and 5) so src/battle/thing.js can swap and blend them; the figure fitted inside the padding. A frame on which her core is
open gets its own core (CORE: [u, v, r] from the left / bottom of the canvas; thing.js core()). Then the relief: tools/relief.py.
usage: python -I tools/rounds/r80_import.py"""
import pathlib, subprocess, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402

RAW = ROOT / "art" / "raw" / "r80"
CORE = {"s1_pound_up": [0.72, 0.77, 0.11], "s2_throw_fling": [0.12, 0.3, 0.1], "s3_slide": [0.22, 0.3, 0.1]}   # (the eye cluster on the
# raised mass; the big eye low on the left; the great mouth in front - where the form's own frames have it)


def main():
    man = packs.manifest(); keys = []
    for f in sorted(RAW.glob("s[1-5]_*.png")):
        n, pose = int(f.stem[1]), f.stem[3:]
        ref = man[f"boss/qq_s{n}_idle0"]; W, H, (pl, pt, pr, pb) = ref["w"], ref["h"], ref["pad"]
        im = Image.open(f).convert("RGBA"); im = im.crop(im.getchannel("A").point(lambda x: 255 if x > 24 else 0).getbbox())
        iw, ih = W - pl - pr, H - pt - pb; s = min(iw / im.width, ih / im.height)
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        can = Image.new("RGBA", (W, H), (0, 0, 0, 0)); x = pl + (iw - im.width) // 2
        y = H - pb - im.height if ref["anchor"] == "bottom" else pt + (ih - im.height) // 2
        can.paste(im, (x, y), im)
        key = f"boss/qq_s{n}_{pose}"
        if key not in man: man.pk["ep0"][key] = {}; man.where[key] = "ep0"
        d = man.dir(key) / "assets" / "boss"; can.save(d / f"qq_s{n}_{pose}.webp", quality=90, method=6)
        e = {"src": f"assets/boss/qq_s{n}_{pose}.webp", "w": W, "h": H, "anchor": ref["anchor"], "figH": round(im.height / H, 4), "pad": ref["pad"], "hit": True}
        if f.stem in CORE: e["core"] = CORE[f.stem]
        man[key] = e; keys.append(key); print(key, im.size)
    man.save()
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "relief.py"), *keys], check=True)
    print("ok")


if __name__ == "__main__":
    main()
