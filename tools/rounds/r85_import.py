"""Round 85's ordinary dolls (tools/rounds/job_specs85.py) into the episode 1 pack as enemy/<variant>_disguise (enemies.json doll
frames.disguise: what a sundae doll sits as until it wakes - Enemy.wake shudders it and melts it into the monster; as R83, tools/rounds/
r83_import.py). Each on the canvas of its variant's idle frame, fitted to the monster's figure height, feet on the bottom. Then the
relief: tools/relief.py.
usage: python -I tools/rounds/r85_import.py"""
import pathlib, subprocess, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402

RAW = ROOT / "art" / "raw" / "r85"
FRAME = {"doll": "idle"}


def cut(im):
    im = im.convert("RGBA")
    return im.crop(im.getchannel("A").point(lambda x: 255 if x > 24 else 0).getbbox())


def main():
    man = packs.manifest(); keys = []
    for kind, fr in FRAME.items():
        for v in ("", "_b", "_c"):
            ref = man[f"enemy/{kind}{v}_{fr}"]; W, H = ref["w"], ref["h"]; pad = ref.get("pad", [0, 0, 0, 0])
            fig = cut(Image.open(RAW / f"{kind}{v}_disguise.png"))
            bw, bh = W - pad[0] - pad[2], round(ref["figH"] * H) if ref.get("anchor") == "bottom" else H - pad[1] - pad[3]
            s = min(bw / fig.width, bh / fig.height); fig = fig.resize((round(fig.width * s), round(fig.height * s)), Image.LANCZOS)
            can = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            y = H - pad[3] - fig.height if ref.get("anchor") == "bottom" else (H - fig.height) // 2
            can.paste(fig, ((W - fig.width) // 2, y), fig)
            key = f"enemy/{kind}{v}_disguise"
            if key not in man: man.pk["ep1"][key] = {}; man.where[key] = "ep1"
            d = man.dir(key) / "assets" / "enemy"; can.save(d / f"{kind}{v}_disguise.webp", quality=90, method=6)
            man[key] = {k: ref[k] for k in ("anchor", "figH", "pad", "hit") if k in ref} | {"src": f"assets/enemy/{kind}{v}_disguise.webp", "w": W, "h": H}
            keys.append(key); print(key, can.size, fig.size)
    man.save()
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "relief.py"), *keys], check=True)
    print("ok")


if __name__ == "__main__":
    main()
