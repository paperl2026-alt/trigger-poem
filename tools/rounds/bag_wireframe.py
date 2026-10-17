"""The school-bag page's wireframe (docs/DESIGN.md「书包」): the layout is fixed here, Codex only styles it (R52 mockups) and later draws
its parts. It takes the select screen's right side (where the team cards are), mockup px (1672 x 941, like ui/select.json).
Writes art/ref/bag/wireframe.png (boxes only, colour-coded, no words) and prints the boxes as JSON for ui/select.json "bag".
usage: python -I tools/rounds/bag_wireframe.py"""
import json, pathlib
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[2]
REF = ROOT / "art" / "ref" / "bag"

# every box [x0, y0, x1, y1] in select-screen mockup px
GRID = {"x": 895, "y": 258, "w": 135, "h": 142, "gap": 12, "cols": 3, "rows": 3}
BOX = {
    "panel": [880, 172, 1658, 872],
    "cost": [895, 185, 1645, 245],          # the COST strip: label, 20 slots, used / cap, the expand button
    "costLabel": [900, 192, 1005, 238],
    "costPips": [1015, 198, 1432, 232],     # 20 slots, the used ones lit, the ones over cap not there yet
    "costNum": [1440, 192, 1522, 238],
    "costUp": [1530, 190, 1642, 240],       # expand +1 (price)
    "pager": [895, 718, 1324, 760],         # ◀ page dots ▶ when there are more than 9 items
    "worn": [895, 772, 1324, 860],          # what is equipped now: a label and the small icons
    "detail": [1340, 258, 1645, 862],       # the picked item
    "dIcon": [1356, 274, 1472, 390],
    "dName": [1482, 280, 1634, 322],
    "dLv": [1482, 330, 1634, 386],          # Lv, cost
    "dEffect": [1356, 400, 1630, 462],      # the effect now -> after the next level
    "dLore1": [1356, 474, 1630, 540],       # three short paragraphs, like an item text in Dark Souls / Elden Ring
    "dLore2": [1356, 550, 1630, 640],
    "dLore3": [1356, 650, 1630, 760],
    "dEquip": [1356, 790, 1484, 850],       # E: equip / take off
    "dUp": [1494, 790, 1630, 850],          # upgrade (or buy) for its price
}


def cells():
    G = GRID
    return [[G["x"] + c * (G["w"] + G["gap"]), G["y"] + r * (G["h"] + G["gap"]), G["x"] + c * (G["w"] + G["gap"]) + G["w"], G["y"] + r * (G["h"] + G["gap"]) + G["h"]]
            for r in range(G["rows"]) for c in range(G["cols"])]


if __name__ == "__main__":
    im = Image.open(REF / "select_now.png").convert("RGB")
    d = ImageDraw.Draw(im)
    d.rectangle(BOX["panel"], fill=(236, 236, 236), outline=(0, 0, 0), width=6)
    col = {"cost": (240, 200, 0), "pager": (0, 120, 255), "worn": (150, 60, 220), "detail": (0, 170, 80)}
    for k in ("cost", "pager", "worn", "detail"): d.rectangle(BOX[k], outline=col[k], width=6)
    for k in ("costLabel", "costNum"): d.rectangle(BOX[k], fill=(250, 225, 120))
    x0, y0, x1, y1 = BOX["costPips"]; w = (x1 - x0) / 20
    for i in range(20): d.rectangle([x0 + i * w + 2, y0, x0 + (i + 1) * w - 2, y1], fill=(240, 200, 0) if i < 7 else (255, 245, 200), outline=(120, 100, 0))
    d.rectangle(BOX["costUp"], fill=(230, 40, 40))
    for c in cells():
        d.rectangle(c, fill=(205, 225, 255), outline=(0, 120, 255), width=5)
        d.rectangle([c[0] + 18, c[1] + 12, c[2] - 18, c[3] - 38], outline=(0, 80, 200), width=2)   # the item picture
        for i in range(3): d.ellipse([c[0] + 12 + i * 18, c[3] - 28, c[0] + 26 + i * 18, c[3] - 14], fill=(0, 80, 200))   # cost dots
        d.rectangle([c[2] - 52, c[1] + 6, c[2] - 6, c[1] + 28], fill=(0, 80, 200))   # Lv
    d.ellipse([GRID["x"] + 6, GRID["y"] + 6, GRID["x"] + 40, GRID["y"] + 40], fill=(230, 40, 40))   # an E badge on an equipped one
    for k in ("dIcon",): d.rectangle(BOX[k], fill=(190, 235, 200), outline=(0, 170, 80), width=4)
    for k in ("dName", "dLv", "dEffect", "dLore1", "dLore2", "dLore3"):
        x0, y0, x1, y1 = BOX[k]; d.rectangle(BOX[k], outline=(0, 170, 80), width=2)
        for yy in range(y0 + 10, y1 - 8, 16): d.line([x0 + 8, yy, x1 - 8 - (40 if yy > y1 - 30 else 0), yy], fill=(150, 150, 150), width=6)
    for k in ("dEquip", "dUp"): d.rectangle(BOX[k], fill=(230, 40, 40))
    x0, y0, x1, y1 = BOX["worn"]; d.rectangle([x0 + 8, y0 + 10, x0 + 110, y1 - 10], fill=(200, 170, 240))
    for i in range(6): d.rectangle([x0 + 125 + i * 48, y0 + 22, x0 + 165 + i * 48, y1 - 22], outline=(150, 60, 220), width=3)
    x0, y0, x1, y1 = BOX["pager"]; cx = (x0 + x1) / 2
    d.polygon([(x0 + 20, (y0 + y1) / 2), (x0 + 44, y0 + 6), (x0 + 44, y1 - 6)], fill=(0, 120, 255))
    d.polygon([(x1 - 20, (y0 + y1) / 2), (x1 - 44, y0 + 6), (x1 - 44, y1 - 6)], fill=(0, 120, 255))
    for i in range(2): d.ellipse([cx - 22 + i * 30, (y0 + y1) / 2 - 7, cx - 8 + i * 30, (y0 + y1) / 2 + 7], fill=(0, 120, 255))
    im.save(REF / "wireframe.png")
    print(json.dumps({**BOX, "grid": GRID}, indent=None))
