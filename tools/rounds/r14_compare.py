"""Side-by-side check: each decomposed part (art/raw/r14/<name>.png) next to its crop from the user's mockup.
usage: python -I tools/rounds/r14_compare.py out.jpg [name ...]"""
import sys, json, pathlib
from PIL import Image, ImageDraw
ROOT = pathlib.Path(__file__).resolve().parents[2]
boxes = json.load(open(ROOT / 'art/ref/ui_parts/boxes.json'))
SRCMAP = {'rope_red': 'rope_slider', 'rod_metal': 'rope_slider', 'bell_knob': 'rope_slider', 'cat_cap': 'rope_slider', 'bar_frame': 'bullet_bar', 'bullet': 'bullet_bar', 'bunny_knob': 'bullet_bar'}
out, names = sys.argv[1], sys.argv[2:]
names = names or sorted(p.stem for p in (ROOT / 'art/raw/r14').glob('*.png') if p.stem not in ('scene_depth',))
rows = []
for n in names:
    p = ROOT / f'art/raw/r14/{n}.png'
    if not p.exists():
        continue
    ref = Image.open(ROOT / f'art/ref/ui_parts/{SRCMAP.get(n, n)}.png').convert('RGB') if (ROOT / f'art/ref/ui_parts/{SRCMAP.get(n, n)}.png').exists() else Image.open(ROOT / 'art/ref/ui_user_mock.png').convert('RGB')
    im = Image.open(p).convert('RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox() or (0, 0, im.width, im.height)
    im = im.crop(bb); bg = Image.new('RGBA', im.size, (60, 140, 90, 255)); bg.alpha_composite(im)
    H = 220
    a = ref.resize((max(1, round(ref.width * H / ref.height)), H)); b = bg.convert('RGB').resize((max(1, round(im.width * H / im.height)), H))
    r = Image.new('RGB', (a.width + b.width + 30, H + 18), (20, 20, 24)); r.paste(a, (0, 18)); r.paste(b, (a.width + 30, 18))
    ImageDraw.Draw(r).text((4, 2), n, fill=(255, 255, 0)); rows.append(r)
W = max(r.width for r in rows); sheet = Image.new('RGB', (W, sum(r.height + 4 for r in rows)), (20, 20, 24)); y = 0
for r in rows: sheet.paste(r, (0, y)); y += r.height + 4
s = min(1, 1400 / sheet.width); sheet = sheet.resize((round(sheet.width * s), round(sheet.height * s)))
sheet.save(out, quality=85); print(len(rows), sheet.size)
