"""Round 96 (tools/rounds/job_specs96.py: each girl's victory jump, three keyframes in one picture) into the base pack: the picked sheet cut
into its three cells along the empty gaps between them -> ui/win_<girl>_<1|2|3>. Each keeps the sheet's full height (the cells share one
ground line: the jump's top frame stays high, as drawn) on a canvas as wide as the widest of the three, the figure in its middle.
usage: python -I tools/rounds/r96_import.py"""
import pathlib, sys
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402
from r23_import import splits  # noqa: E402
from r53_import import put  # noqa: E402

R96 = ROOT / "art" / "raw" / "r96"
PICK = {"cat": "a", "pink": "a"}


def main():
    man = packs.manifest()
    for girl, v in PICK.items():
        im = Image.open(R96 / f"win_{girl}_{v}.png").convert("RGBA"); a = np.asarray(im)[..., 3] > 30; H, W = a.shape
        xs = [0] + splits(a.sum(0), 3, 0, W) + [W]
        parts = []
        for k in range(3):
            c = im.crop((xs[k], 0, xs[k + 1], H)); bb = c.getchannel("A").point(lambda q: 255 if q > 30 else 0).getbbox()
            parts.append(c.crop((max(0, bb[0] - 6), 0, min(c.width, bb[2] + 6), H)))
        y0 = min(p.getchannel("A").point(lambda q: 255 if q > 30 else 0).getbbox()[1] for p in parts) - 6   # (the top of the highest one)
        y1 = max(p.getchannel("A").point(lambda q: 255 if q > 30 else 0).getbbox()[3] for p in parts) + 6
        CW = max(p.width for p in parts)
        for k, p in enumerate(parts, 1):
            can = Image.new("RGBA", (CW, y1 - y0), (0, 0, 0, 0)); can.alpha_composite(p.crop((0, y0, p.width, y1)), ((CW - p.width) // 2, 0))
            put(man, f"ui/win_{girl}_{k}", can, q=92, dom=True)
            print(girl, k, can.size)
    man.save()


if __name__ == "__main__":
    main()
