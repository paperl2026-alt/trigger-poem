"""Mask of the lettering and icons drawn ON the controls of a mockup (tight to the strokes), so Codex can repaint just those
pixels with the control's own fill and the controls keep their exact textures (job R20_notext). Boxes + colour class per item;
'rect' items (stage pictures, bars, cards) are masked whole.
usage: python -I tools/text_mask.py   -> art/ref/select_parts/notext_magenta.png + notext_mask.png"""
import json
import numpy as np
from PIL import Image
from scipy import ndimage

MOCK = "art/ref/select_ref.png"
D = 392   # the 2P card is the 1P card moved right by this much (its controls)
ITEMS = {
    # [x0, y0, x1, y1, class]
    "back_text": [95, 30, 245, 76, "white"], "back_tri": [42, 32, 82, 74, "white"], "coin_text": [1415, 32, 1525, 76, "white"],
    "coin": [1350, 28, 1405, 82, "notblack"], "gear": [1578, 22, 1648, 84, "dark"],
    "tab_team_text": [1092, 110, 1175, 154, "white"], "tab_bag_text": [1405, 110, 1485, 154, "dark"], "icon_team": [1022, 108, 1086, 156, "white"], "icon_bag": [1336, 106, 1396, 158, "dark"],
    "chapter": [84, 168, 236, 226, "dark"], "chap_no": [240, 114, 330, 224, "red"], "title": [56, 184, 652, 326, "dark"], "sub": [164, 284, 486, 364, "dark"],
    "row1_no": [66, 382, 114, 438, "white"], "row1_text": [150, 392, 336, 434, "dark"], "row2_no": [66, 465, 114, 521, "white"], "row2_text": [150, 476, 316, 517, "dark"],
    "skull": [56, 550, 116, 608, "notred"], "boss_word": [118, 562, 200, 600, "white"], "boss_text": [222, 558, 432, 602, "dark"],
    "best_word": [112, 645, 192, 679, "dark"], "best_no": [196, 638, 228, 681, "red"], "crown": [54, 640, 108, 684, "dark"],
    "go_text": [232, 716, 498, 824, "white"], "go_tri": [126, 726, 212, 824, "white"],
    "p1": [898, 586, 970, 634, "whiteInRed"], "name1": [982, 592, 1220, 636, "dark"], "swords1": [890, 642, 941, 693, "dark"], "mast1": [943, 650, 1066, 688, "dark"],
    "chip1_icon": [900, 708, 954, 760, "white"], "chip1_text": [960, 716, 1024, 752, "white"], "chip2_icon": [1074, 706, 1120, 760, "dark"], "chip2_text": [1123, 716, 1226, 752, "dark"],
    "swap_icon": [1146, 796, 1206, 854, "white"], "swap_text": [1210, 798, 1384, 848, "white"],
    # whole areas: per-stage pictures and chevrons, the mastery bars (drawn by the game), the next-chapter card and the arrows (own images)
    "bar1": [1070, 657, 1236, 681, "rect"], "next": [596, 222, 880, 866, "rect"],
}
# the stage pictures: inside each row's white bar, just within its outline (the outline stays); filled with the bar's own white
THUMBS = {"thumb1": [[366, 380], [579, 380], [558, 441], [366, 441]], "thumb2": [[366, 463], [575, 463], [565, 525], [366, 525]],
          "thumb_boss": [[366, 547], [578, 547], [562, 610], [366, 610]]}
for k in ["p1", "name1", "swords1", "mast1", "chip1_icon", "chip1_text", "chip2_icon", "chip2_text", "bar1"]:
    x0, y0, x1, y1, c = ITEMS[k]; ITEMS[k.replace("1", "2") if k[-1] == "1" else k + "_2"] = [x0 + D, y0, x1 + D, y1, c]

if __name__ == "__main__":
    im = np.asarray(Image.open(MOCK).convert("RGB")).astype(int)
    m = np.zeros(im.shape[:2], bool)
    for k, (x0, y0, x1, y1, c) in ITEMS.items():
        s = im[y0:y1, x0:x1]
        if c == "rect": t = np.ones(s.shape[:2], bool)
        else:
            red = (s[..., 0] > 150) & (s[..., 1] < 95)
            if c == "whiteInRed":   # white letters on a red badge, not the white card around it
                t = (s.min(-1) > 205) & (ndimage.uniform_filter(red.astype(float), 13) > 0.2)
            else:
                t = {"dark": s.max(-1) < 95, "white": s.min(-1) > 205, "red": red, "notblack": s.max(-1) > 110, "notred": ~red}[c]
            t = ndimage.binary_dilation(t, iterations=3)
        m[y0:y1, x0:x1] |= t
    from PIL import ImageDraw
    th = Image.new("L", (im.shape[1], im.shape[0]), 0)
    for poly in THUMBS.values(): ImageDraw.Draw(th).polygon([tuple(p) for p in poly], fill=255)
    m |= np.asarray(th) > 0
    out = im.astype(np.uint8).copy(); out[m] = (255, 0, 255)
    Image.fromarray(out).save("art/ref/select_parts/notext_magenta.png")
    Image.fromarray((m * 255).astype(np.uint8)).save("art/ref/select_parts/notext_mask.png")
    print("masked", round(m.mean(), 3), "items", len(ITEMS))
