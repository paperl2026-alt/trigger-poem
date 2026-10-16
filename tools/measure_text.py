"""Measure text / icon boxes on a mockup: for each named search box, the bounding box of the ink of one colour class
(dark, white, red, grey), plus the slant of the line of text (least-squares fit of the ink's lowest pixels per column),
so the game can set its own text at the same place, size and angle.
usage: python -I tools/measure_text.py <mockup.png> <boxes.json>      boxes: {"name": [x0, y0, x1, y1, "dark|white|red|light"]}"""
import sys, json
import numpy as np
from PIL import Image

if __name__ == "__main__":
    im = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(int)
    boxes = json.load(open(sys.argv[2], encoding="utf-8"))
    out = {}
    for k, (x0, y0, x1, y1, mode) in boxes.items():
        s = im[y0:y1, x0:x1]
        m = {"dark": s.max(-1) < 90, "white": s.min(-1) > 215, "red": (s[..., 0] > 160) & (s[..., 1] < 90),
             "light": (s.min(-1) > 150) & (s.max(-1) - s.min(-1) < 30)}[mode]
        ys, xs = np.nonzero(m)
        if not len(xs): out[k] = None; continue
        bx = [int(xs.min() + x0), int(ys.min() + y0), int(xs.max() + x0), int(ys.max() + y0)]
        # slant: lowest ink per column
        cols = [(x, ys[xs == x].max()) for x in np.unique(xs) if (xs == x).sum() > 1]
        a = np.polyfit([c[0] for c in cols], [c[1] for c in cols], 1)[0] if len(cols) > 10 else 0.0
        out[k] = {"box": bx, "h": bx[3] - bx[1], "w": bx[2] - bx[0], "deg": round(float(np.degrees(np.arctan(a))), 1)}
        print(k.ljust(12), out[k])
    json.dump(out, open(sys.argv[2].replace(".json", "_measured.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
