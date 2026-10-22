"""Round 98 (tools/rounds/job_specs98.py) into the episode 1 pack:
  rest<n>_<v>   the lady's rest, five painted shots -> comic/ep1s_rest<n> (1920 x 1080, 16:9, opaque: Game.storyboard, src/battle/madame.js rest)
  ghosts_<v>    the three lost children's ghosts, 3 x 2 sheet -> ep1/ghost<1..3>_angel (top row) / ep1/ghost<1..3>_demon (the same child below)
usage: python -I tools/rounds/r98_import.py"""
import pathlib, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402
from r23_import import cells  # noqa: E402
from r53_import import put, trim, fit, canvas  # noqa: E402

RAW = ROOT / "art" / "raw" / "r98"
REST = {1: "b", 2: "b", 3: "b", 4: "b", 5: "b"}
GHOSTS = "a"
W, H = 1920, 1080


def add(man, key, im, **kw):
    if key not in man: man.pk["ep1"][key] = {}; man.where[key] = "ep1"
    put(man, key, im, **kw)


def main():
    man = packs.manifest()
    for n, v in REST.items():
        im = Image.open(RAW / f"rest{n}_{v}.png").convert("RGB")
        s = max(W / im.width, H / im.height); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        x, y = (im.width - W) // 2, (im.height - H) // 2
        add(man, f"comic/ep1s_rest{n}", im.crop((x, y, x + W, y + H)), q=88); print("rest", n, v)
    ims = cells(RAW / f"ghosts_{GHOSTS}.png")
    for i in range(3):   # (each child's two looks on one canvas, the same size: the one turns into the other where it is)
        for name, can, extra in canvas([("angel", trim(ims[i], 4)), ("demon", trim(ims[i + 3], 4))], "center"):
            add(man, f"ep1/ghost{i + 1}_{name}", fit(can, 700), q=92); print(f"ep1/ghost{i + 1}_{name}", can.size)
    man.save()


if __name__ == "__main__":
    main()
