"""Mockups for the chapter-select stage list when a chapter has more stages than the 3 rows of the approved layout (docs/PLAN.md: 第 1 话
has 8 stages + the boss). Drawn by Claude over a screenshot of the current select screen (no Codex): the same red / black / white slanted
plates, the game's lettering style. -> art/mock/select_rows_a.png (pages), select_rows_b.png (slim rows)
usage: python -I tools/rounds/select_rows_mock.py <screenshot.png>"""
import sys, pathlib
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "art" / "mock"
FB = "C:/Windows/Fonts/msyhbd.ttc"
RED, BLACK, WHITE, GREY, DARK = (226, 18, 36), (18, 14, 16), (250, 248, 246), (190, 186, 186), (60, 56, 58)
STAGES = ["冰淇淋店", "画廊", "玻璃温室", "坑底", "骑士厅", "地下冷库", "烤炉厨房", "冥界"]


def slant(d, x0, y0, x1, y1, fill, k=10, outline=None, w=0):
    d.polygon([(x0 + k, y0), (x1 + k, y0), (x1 - k, y1), (x0 - k, y1)], fill=fill, outline=outline, width=w)


def blank(im):
    """the stage list area of the screenshot, wiped back to the panel's paper colour"""
    d = ImageDraw.Draw(im)
    d.polygon([(36, 368), (612, 368), (600, 690), (30, 690)], fill=(242, 240, 238))
    return d


def row(d, x, y, w, h, no, name, state, f_no, f_name, boss=False):
    """one stage row: number plate + name band; state: pick / open / locked"""
    band = WHITE if state != "locked" else GREY
    slant(d, x, y, x + w, y + h, BLACK, k=h * 0.14)
    slant(d, x + 4, y + 4, x + w - 4, y + h - 4, band, k=h * 0.14)
    nw = h * 1.15
    slant(d, x + 2, y + 2, x + nw, y + h - 2, RED if state == "pick" else BLACK if state == "open" else DARK, k=h * 0.14)
    d.text((x + nw * 0.52, y + h * 0.5), "★" if boss else str(no), font=f_no, fill=WHITE, anchor="mm")
    d.text((x + nw + h * 0.35, y + h * 0.52), ("BOSS  " if boss else "") + name, font=f_name, fill=BLACK if state != "locked" else (110, 106, 106), anchor="lm")
    if state == "pick":
        d.text((x + w - h * 0.6, y + h * 0.5), "»", font=f_no, fill=RED, anchor="mm")
    if state == "locked":
        cx, cy, r = x + w - h * 0.55, y + h * 0.52, h * 0.2
        d.rounded_rectangle([cx - r, cy - r * 0.2, cx + r, cy + r * 1.1], radius=3, fill=DARK)
        d.arc([cx - r * 0.65, cy - r * 1.1, cx + r * 0.65, cy + r * 0.3], 180, 360, fill=DARK, width=max(2, int(r * 0.3)))


def note(d, x, y, text):
    f = ImageFont.truetype(FB, 17)
    tw = d.textlength(text, font=f)
    d.rectangle([x - 6, y - 4, x + tw + 6, y + 24], fill=(255, 236, 120))
    d.text((x, y), text, font=f, fill=BLACK)


def page_mock(base):
    """A: pages of 3 (like now), arrows above / below the list, dots for the pages; the boss always on the last page's last row"""
    im = base.copy(); d = blank(im)
    f_no, f_name = ImageFont.truetype(FB, 40), ImageFont.truetype(FB, 30)
    for i, (no, name, st) in enumerate([(4, "坑底", "open"), (5, "骑士厅", "pick"), (6, "地下冷库", "locked")]):
        row(d, 52, 386 + i * 84, 540, 68, no, name, st, f_no, f_name)
    for y, up in ((372, True), (642, False)):   # the page arrows
        cx = 322
        d.polygon([(cx - 26, y + (12 if up else 0)), (cx + 26, y + (12 if up else 0)), (cx, y + (0 if up else 12))], fill=RED)
    for i in range(3):   # page dots
        cx = 560 + i * 20; d.ellipse([cx - 6, 646, cx + 6, 658], fill=RED if i == 1 else DARK)
    note(d, 60, 320, "方案 A：每页 3 行（和现在一样大），滚轮 / ↑↓ / 点箭头翻页，右下角是第几页")
    return im


def slim_mock(base):
    """B: all 9 rows on one page, each a third as tall: number + name only (no thumbnails), the picked one sticks out"""
    im = base.copy(); d = blank(im)
    f_no, f_name = ImageFont.truetype(FB, 22), ImageFont.truetype(FB, 19)
    y, h, gap = 376, 30, 3.5
    for i, name in enumerate(STAGES + ["大舞厅"]):
        boss = i == len(STAGES)
        st = "pick" if i == 4 else "open" if i < 4 else "locked"
        x = 52 + (18 if st == "pick" else 0)
        row(d, x, y, 540, h, i + 1, name, st, f_no, f_name, boss)
        y += h + gap
    note(d, 60, 330, "方案 B：一页放下 9 行，行高只有现在的 1/3，去掉缩略图，选中的那行往外突出")
    return im


if __name__ == "__main__":
    base = Image.open(sys.argv[1]).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    page_mock(base).save(OUT / "select_rows_a.png")
    slim_mock(base).save(OUT / "select_rows_b.png")
    print("ok")
