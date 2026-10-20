"""The candle out (docs/DESIGN.md「地形和机关」: a dark room lit candle by candle, user 2026-10-18 第十七批): ep1/nb_candle with its flame
taken away and a little black wick left, the same size, so a shot candle can swap to the lit picture in place (src/battle/gimmick.js
light). -> ep1/nb_candle_out
usage: python -I tools/rounds/candle_out.py"""
import json, pathlib, sys
import numpy as np
from PIL import Image, ImageDraw

A = pathlib.Path(__file__).resolve().parents[2] / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parents[1])]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)
FLAME_TO = 62   # px rows of the flame (above it, the wax)

if __name__ == "__main__":
    man = packs.manifest()
    im = Image.open(man.path("ep1/nb_candle")).convert("RGBA"); a = np.asarray(im).copy(); h, w = a.shape[:2]
    op = (a[:, :, 3] > 100)
    cx = int(round(np.nonzero(op[FLAME_TO + 4])[0].mean()))   # the candle's middle just under the flame
    a[:FLAME_TO, :, 3] = 0
    out = Image.fromarray(a); d = ImageDraw.Draw(out)
    d.line([(cx, FLAME_TO - 12), (cx + 1, FLAME_TO + 3)], fill=(40, 26, 22, 255), width=3)   # the wick
    out.save(man.dir("ep1/nb_candle_out") / "assets" / "ep1" / "nb_candle_out.webp", quality=92, method=6)
    man["ep1/nb_candle_out"] = {**{k: v for k, v in man["ep1/nb_candle"].items() if k not in ("src",)}, "src": "assets/ep1/nb_candle_out.webp"}
    man.save()
    print("ep1/nb_candle_out", w, h, "wick at", cx)
