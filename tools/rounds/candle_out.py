"""The candle out (docs/DESIGN.md「地形和机关」: a dark room lit candle by candle, user 2026-10-18 第十七批): ep1/nb_candle with its flame
taken away and a little black wick left, the same size, so a shot candle can swap to the lit picture in place (src/battle/gimmick.js
light). -> ep1/nb_candle_out
usage: python -I tools/rounds/candle_out.py"""
import json, pathlib
import numpy as np
from PIL import Image, ImageDraw

A = pathlib.Path(__file__).resolve().parents[2] / "public" / "content" / "base" / "assets"
FLAME_TO = 62   # px rows of the flame (above it, the wax)

if __name__ == "__main__":
    im = Image.open(A / "ep1" / "nb_candle.webp").convert("RGBA"); a = np.asarray(im).copy(); h, w = a.shape[:2]
    op = (a[:, :, 3] > 100)
    cx = int(round(np.nonzero(op[FLAME_TO + 4])[0].mean()))   # the candle's middle just under the flame
    a[:FLAME_TO, :, 3] = 0
    out = Image.fromarray(a); d = ImageDraw.Draw(out)
    d.line([(cx, FLAME_TO - 12), (cx + 1, FLAME_TO + 3)], fill=(40, 26, 22, 255), width=3)   # the wick
    out.save(A / "ep1" / "nb_candle_out.webp", quality=92, method=6)
    mp = A / "manifest.json"; raw = mp.read_bytes(); crlf = b"\r\n" in raw; man = json.loads(raw.decode("utf-8"))
    man["ep1/nb_candle_out"] = {**{k: v for k, v in man["ep1/nb_candle"].items() if k not in ("src",)}, "src": "assets/ep1/nb_candle_out.webp"}
    s = json.dumps(man, indent=1, sort_keys=True); mp.write_bytes((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))
    print("ep1/nb_candle_out", w, h, "wick at", cx)
