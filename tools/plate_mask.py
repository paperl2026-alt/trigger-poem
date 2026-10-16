"""Clean plate for a screen built from a mockup: the areas where the game draws its own controls / text are painted magenta on
the mockup (this script), Codex fills ONLY those areas (job R20_fill), and tools/r20_import.py takes Codex's pixels only
inside the mask, so everything else stays the mockup's own pixels and no shape can change.
Pass 1 (no cut-out of the controls yet): loose boxes, used only to get Codex's fill. Pass 2 ("--ui"): the mask is the exact
footprint of the controls, from Codex's controls-only cut-out (job R20_ui, art/raw/r20/sel_ui.png): only what a control
covers is refilled, so the shards / background around the controls stay the mockup's.
usage: python -I tools/plate_mask.py [--ui]     (select screen: art/ref/select_ref.png -> art/ref/select_parts/plate_magenta.png + plate_mask.png)"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

MOCK = "art/ref/select_ref.png"
RECTS = {   # controls drawn by the game (mockup px)
    "back_btn": [14, 10, 288, 96], "coin_gear": [1334, 8, 1662, 96], "tabs": [912, 88, 1566, 168],
    "rows": [36, 370, 592, 620], "best": [48, 634, 236, 694], "go": [14, 664, 628, 858],
    "next_arrows": [590, 218, 882, 866], "card_low_cat": [884, 584, 1260, 772], "card_low_pink": [1266, 584, 1654, 772], "swap": [1052, 774, 1458, 878],
}
TEXT = {"chapter": [80, 160, 245, 228], "title": [55, 188, 662, 326], "sub": [165, 284, 488, 366]}   # black letters only
ZERO = [238, 116, 342, 248]   # the big red chapter number

if __name__ == "__main__":
    mock = np.asarray(Image.open(MOCK).convert("RGB")).astype(np.int16)
    m = np.zeros(mock.shape[:2], bool)
    for x0, y0, x1, y1 in RECTS.values(): m[y0:y1, x0:x1] = True
    black = mock.max(-1) < 100
    for x0, y0, x1, y1 in TEXT.values():
        t = np.zeros_like(m); t[y0:y1, x0:x1] = black[y0:y1, x0:x1]
        m |= ndimage.binary_dilation(t, iterations=4)
    x0, y0, x1, y1 = ZERO
    z = np.zeros_like(m); z[y0:y1, x0:x1] = (mock[y0:y1, x0:x1, 0] > 160) & (mock[y0:y1, x0:x1, 1] < 90)
    z = ndimage.binary_fill_holes(ndimage.binary_closing(z, iterations=3))
    lab, n = ndimage.label(z); sizes = ndimage.sum(z, lab, range(1, n + 1))
    m |= ndimage.binary_dilation(lab == 1 + int(np.argmax(sizes)), iterations=4)
    if "--ui" in sys.argv:
        ui = np.asarray(Image.open("art/raw/r20/sel_ui.png").convert("RGBA"))[..., 3] > 40
        m = ndimage.binary_dilation(ndimage.binary_fill_holes(ui), iterations=3)
    else:
        img = mock.astype(np.uint8).copy(); img[m] = (255, 0, 255)
        Image.fromarray(img).save("art/ref/select_parts/plate_magenta.png")
    Image.fromarray((m * 255).astype(np.uint8)).save("art/ref/select_parts/plate_mask.png")
    print("mask", round(m.mean(), 3))
