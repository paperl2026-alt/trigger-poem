# Round 60 (user 2026-10-18 第十七批: "小过场的地雷妹衣服明显和设定不符，Codex 出图多抽几次"): episode 1's comic pages drew the gun girl in
# a long-sleeved pink blouse and skirt (the prompts said so on purpose, to get past the safety filter: docs/ART.md). Each place she
# appears off-model is cut out of the game's page around her (a box of about 2:3, 1:1 or 3:2, the shapes the image tool makes), Codex
# redraws ONLY her clothes after her character sheet, three tries each; tools/rounds/r60_import.py pastes the picked one back, only over
# her own box (feathered), so everything else on the page (the cat paw's canonical seal, lettering, borders) stays as it was.
#   FIX[name] = (page, panel index, her box inside that panel: x0, y0, x1, y1 as fractions)
import pathlib, json
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r60"
PAGES = ROOT / "public" / "content" / "base" / "assets" / "comic"
FIX = {
    "turn_0": ("turn", 0, (0.52, 0.5, 1.0, 1.0)),
    "photo_0": ("photo", 0, (0.22, 0.14, 0.92, 1.0)),
    "web_0": ("web", 0, (0.0, 0.3, 0.48, 1.0)),
    "web_2": ("web", 2, (0.5, 0.36, 1.0, 1.0)),
    "nursery_0": ("nursery", 0, (0.0, 0.08, 0.42, 1.0)),
    "fall_0": ("fall", 0, (0.36, 0.0, 0.66, 1.0)),
    "fall_1": ("fall", 1, (0.48, 0.1, 1.0, 1.0)),
    "studio_0": ("studio", 0, (0.2, 0.4, 0.5, 1.0)),
    "studio_1": ("studio", 1, (0.15, 0.62, 0.38, 1.0)),
    "merge_0": ("merge", 0, (0.68, 0.2, 1.0, 1.0)),
    "merge_3": ("merge", 3, (0.68, 0.3, 1.0, 1.0)),
    "boss_0": ("boss", 0, (0.5, 0.55, 0.76, 1.0)),
    "boss_2": ("boss", 2, (0.6, 0.62, 0.9, 1.0)),
}
# where the cat paw's canonical seal lies inside her box: kept from the old page (fractions of the panel, like her box)
PROTECT = {"studio_0": [(0.18, 0.68, 0.29, 0.96)], "studio_1": [(0.21, 0.84, 0.32, 1.0)]}
SHAPES = (2 / 3, 1.0, 3 / 2)   # w / h the image tool makes


def panel_box(page, idx):   # the panel's inside on the page (px), from comics.json (polygons in % of the page)
    C = json.loads((ROOT / "public" / "content" / "base" / "comics.json").read_text(encoding="utf-8"))
    pg = C[f"ep1_{page}"][0]; im = Image.open(PAGES / f"ep1p_{page}.webp"); W, H = im.size
    P = pg["panels"][idx]["poly"]
    return (round(min(x for x, _ in P) * W / 100) + 3, round(min(y for _, y in P) * H / 100) + 3,
            round(max(x for x, _ in P) * W / 100) - 3, round(max(y for _, y in P) * H / 100) - 3)


def boxes(name):   # -> (crop box, her box) on the page, px: the crop = her box + a margin, grown to the nearest tool shape, inside the panel
    page, idx, (a, b, c, d) = FIX[name]
    X0, Y0, X1, Y1 = panel_box(page, idx); pw, ph = X1 - X0, Y1 - Y0
    her = (X0 + a * pw, Y0 + b * ph, X0 + c * pw, Y0 + d * ph)
    m = 0.12 * max(her[2] - her[0], her[3] - her[1])
    x0, y0, x1, y1 = max(X0, her[0] - m), max(Y0, her[1] - m), min(X1, her[2] + m), min(Y1, her[3] + m)
    w, h = x1 - x0, y1 - y0
    want = min(SHAPES, key=lambda s: abs(s - w / h))
    if w / h < want:   # widen
        add = h * want - w; x0 -= add / 2; x1 += add / 2
        if x0 < X0: x1 += X0 - x0; x0 = X0
        if x1 > X1: x0 -= x1 - X1; x1 = X1
        x0 = max(X0, x0)
    else:              # make taller
        add = w / want - h; y0 -= add / 2; y1 += add / 2
        if y0 < Y0: y1 += Y0 - y0; y0 = Y0
        if y1 > Y1: y0 -= y1 - Y1; y1 = Y1
        y0 = max(Y0, y0)
    return tuple(round(v) for v in (x0, y0, x1, y1)), tuple(round(v) for v in her)


def src(name):
    p = RAW / f"src_{name}.png"
    if not p.exists():
        RAW.mkdir(parents=True, exist_ok=True)
        page = FIX[name][0]; Image.open(PAGES / f"ep1p_{page}.webp").convert("RGB").crop(boxes(name)[0]).save(p)
    return str(p.relative_to(ROOT)).replace("\\", "/")


OUTFIT = ("her outfit EXACTLY as on her character sheet (reference image 2): a baby-pink one-piece romper with lace trim and small silver "
          "heart buckles on the sides; over it a long, loose white lace cardigan-coat, sheer and frilly, with wide puffed sleeves gathered "
          "at the wrist with pink ribbons, its hem around her knees; a mint-green sailor collar with white stripes; a big pale-yellow bow "
          "with a pink rose and a heart pendant at the chest; a pink heart garter on one thigh; white frilly ankle socks with pink bows; "
          "pink platform Mary Jane shoes with chunky clear mint soles. Bare legs: NO tights, NO stockings. She does NOT wear a skirt, a "
          "long-sleeved blouse or a dress: the romper and the open lace coat are her clothes. Cute idol-like street fashion, wholesome, "
          "fully covered, nothing revealing. Her hair stays as it is: long wavy black twin tails with pink-and-mint ribbon bows and a "
          "white bunny hair clip.")
PROMPT = ("Edit reference image 1, a panel from a full-colour manga page of a game. Output the SAME picture at the same framing: keep "
          "everything exactly as it is (the camera, the composition, the background, the colours, the line art and screentone style, "
          "the white-haired cat girl untouched, any hand lettering untouched) and keep the black-haired twin-tail girl's pose, position, "
          "size, face, expression and hair exactly as they are. Change ONLY her clothes: redraw them as " + OUTFIT + " Reference image 3 "
          "shows the same girl in other poses: use it to draw the outfit from this angle. Do not add text, do not add effects.")
JOBS = {f"R60_{n}": [(f"art/raw/r60/{n}_{v}.png", [src(n), "art/ref/pink_sheet.png", "art/ref/pink_poses.png"], PROMPT +
                      f" Try {v}.", "OPAQUE") for v in "abc"] for n in FIX}

if __name__ == "__main__":
    for n in FIX:
        c, h = boxes(n); print(n, "crop", c, f"{(c[2] - c[0]) / (c[3] - c[1]):.2f}", "her", h, src(n))
