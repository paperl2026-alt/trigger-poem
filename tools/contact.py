"""Contact sheet for reviewing raw art: python -I tools/contact.py out.png cols name1 name2 ..."""
import sys, pathlib
from PIL import Image, ImageDraw
ROOT = pathlib.Path(__file__).resolve().parent.parent
out, cols, names = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
W = 760
ims = []
for n in names:
    im = Image.open(ROOT / "art" / "raw" / f"{n}.png").convert("RGBA")
    s = W / im.width
    im = im.resize((W, round(im.height * s)))
    bg = Image.new("RGBA", im.size, (90, 140, 110, 255))
    bg.alpha_composite(im)
    d = ImageDraw.Draw(bg); d.text((8, 8), n, fill=(255, 255, 0, 255))
    ims.append(bg.convert("RGB"))
rows = (len(ims) + cols - 1) // cols
H = max(i.height for i in ims)
sheet = Image.new("RGB", (cols * W, rows * H), (20, 20, 20))
for i, im in enumerate(ims):
    sheet.paste(im, ((i % cols) * W, (i // cols) * H))
sheet.save(out)
print(sheet.size)
