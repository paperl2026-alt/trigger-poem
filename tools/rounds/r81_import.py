"""Round 81's mouth door (tools/rounds/job_specs81.py) into the episode 1 pack as the monster enemy/door_mouth_<frame> (levels/ep1/enemies.json
door_mouth): shut, open, and door - the gallery's own end door as it was (R74 door2: its frame with its leaves set in its hole), the
disguise it stands as until it wakes (enemies.js frames.disguise). All three on one canvas, the figure the same height, feet on the
bottom, centred, a margin for the white outline (like every monster's frames), so they swap in place. Then the relief: tools/relief.py.
usage: python -I tools/rounds/r81_import.py"""
import pathlib, subprocess, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402

RAW = ROOT / "art" / "raw" / "r81"
A = ROOT / "public" / "content" / "base" / "levels" / "ep1" / "assets" / "ep1"
FIG_H, PAD = 900, 24   # (the figure's height in px; the margin round it, none under the feet)


def cut(im, a=24):   # (a: the door's frame picture carries strips of faded wall at its sides - only its solid part counts)
    im = im.convert("RGBA")
    return im.crop(im.getchannel("A").point(lambda x: 255 if x > a else 0).getbbox())


def door():
    """the end door as the gallery shows it: the leaves in the frame's hole (manifest ep1/door2_room hole: x0, y0, x1, y1 from the top left)"""
    man = packs.manifest(); fr = Image.open(A / "door2_room.webp").convert("RGBA"); x0, y0, x1, y1 = man["ep1/door2_room"]["hole"]
    W, H = fr.size; box = (round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H))
    leaf = Image.open(A / "door2_leaf.webp").convert("RGBA").resize((box[2] - box[0], box[3] - box[1]), Image.LANCZOS)
    can = Image.new("RGBA", fr.size, (0, 0, 0, 0)); can.paste(leaf, box[:2], leaf); can.alpha_composite(fr)
    return can


def main():
    figs = {"door": cut(door(), 235), "shut": cut(Image.open(RAW / "door_mouth_shut.png")), "open": cut(Image.open(RAW / "door_mouth_open.png"))}
    figs = {k: im.resize((round(im.width * FIG_H / im.height), FIG_H), Image.LANCZOS) for k, im in figs.items()}
    W = max(im.width for im in figs.values()) + PAD * 2; H = FIG_H + PAD
    man = packs.manifest(); keys = []
    for k, im in figs.items():
        can = Image.new("RGBA", (W, H), (0, 0, 0, 0)); can.paste(im, ((W - im.width) // 2, H - im.height), im)
        key = f"enemy/door_mouth_{k}"
        if key not in man: man.pk["ep1"][key] = {}; man.where[key] = "ep1"
        d = man.dir(key) / "assets" / "enemy"; can.save(d / f"door_mouth_{k}.webp", quality=90, method=6)
        man[key] = {"src": f"assets/enemy/door_mouth_{k}.webp", "w": W, "h": H, "anchor": "bottom", "figH": round(FIG_H / H, 4), "pad": [PAD, PAD, PAD, 0], "hit": True}
        keys.append(key); print(key, can.size)
    man.save()
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "relief.py"), *keys], check=True)
    print("ok")


if __name__ == "__main__":
    main()
