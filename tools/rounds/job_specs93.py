# Round 93 (user 2026-10-22: on the fountain page the cat girl has two paws - she only ever has ONE: her spirit power is enough for one
# hand at a time, either hand, the other an ordinary girl's hand): the comic panels where both her hands are paws, done like R60 - only a
# crop around her goes to Codex, and tools/rounds/r93_import.py pastes back her box only (feathered), on the page as it is in the game:
# episode 1's fountain, last panel (both hands raised in fright), and fall, last panel (lying flat in the honey); episode 2's opening, first
# panel (both hands clasped under her chin at the cheap room on the phone).
import sys, pathlib, json
from PIL import Image
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
import packs  # noqa: E402
from job_specs60 import OUTFIT  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r93"
# name -> (page, panel, her box in the panel [x0, y0, x1, y1] as parts of it, the hand that stays a paw, the hand to make a girl's hand)
FIX = {
    "fountain_3": ("fountain", 3, (0.54, 0.0, 1.0, 1.0),
                   "the paw on the viewer's LEFT (her right arm), raised in fright with its palm toward the viewer",
                   "her other hand, on the viewer's RIGHT (her left arm), raised in the same frightened gesture at the same place"),
    "fall_2": ("fall", 2, (0.0, 0.14, 0.55, 1.0),
               "the paw on the viewer's LEFT (her right arm) with the red seal on its back, lying flat in the honey",
               "her other hand, the one nearer the middle of the picture just right of that paw (her left arm), lying flat in the honey at "
               "the same place, sticky with honey like the rest of her"),
    "open_0": ("open", 0, (0.6, 0.0, 1.0, 1.0),
               "the big paw in front, the lower one of her two clasped hands under her chin",
               "her other hand, the one behind that paw, its fingers over it (the upper one of the two), clasped together with the paw under "
               "her chin in delight at the same place"),
    # (user 2026-10-22: on the glass page's last panel the paw is far bigger than the cat girl - redrawn its right size: GLASS below)
    "glass_2": ("glass", 2, (0.01, 0.0, 0.6, 1.0), None, None),
    # (user 2026-10-23: the prologue's page after its first stage, last panel - the cat girl running, her paw arm bent up oddly at her
    # shoulder, nothing a body does: MID below)
    "mid_3": ("mid", 3, (0.0, 0.0, 0.56, 1.0), None, None),
}
GROW = {"glass_2"}   # (a panel too narrow for the tool's shapes: the crop may reach past it on the page - only her box is pasted back)
EP = {"fountain": "ep1", "fall": "ep1", "open": "ep2", "glass": "ep1", "mid": "ep0"}   # (which episode's pack each page is in: comic/<ep>p_<page>, comics.json <ep>_<page>)
SHAPES = (2 / 3, 1.0, 3 / 2)   # w / h the image tool makes


def page_path(page):
    return packs.manifest().dir(f"comic/{EP[page]}p_{page}") / "assets" / "comic" / f"{EP[page]}p_{page}.webp"


def orig(page):   # the page as it was in the game before this round (kept, so the import always starts from it)
    p = RAW / f"orig_{EP[page]}p_{page}.webp"
    if not p.exists():
        RAW.mkdir(parents=True, exist_ok=True); p.write_bytes(page_path(page).read_bytes())
    return p


def panel_box(page, idx):   # the panel's inside on the page (px), from the pack's comics.json (polygons in % of the page)
    C = json.loads(packs.data_file("comics", f"{EP[page]}_{page}").read_text(encoding="utf-8"))
    P = C[f"{EP[page]}_{page}"][0]["panels"][idx]["poly"]; W, H = Image.open(orig(page)).size
    return (round(min(x for x, _ in P) * W / 100) + 3, round(min(y for _, y in P) * H / 100) + 3,
            round(max(x for x, _ in P) * W / 100) - 3, round(max(y for _, y in P) * H / 100) - 3)


def boxes(name):   # -> (crop box, her box) on the page, px: the crop = her box + a margin, made the nearest tool shape that still holds
    # her box whole, inside the panel
    page, idx, (a, b, c, d) = FIX[name][:3]
    X0, Y0, X1, Y1 = panel_box(page, idx); pw, ph = X1 - X0, Y1 - Y0
    her = (X0 + a * pw, Y0 + b * ph, X0 + c * pw, Y0 + d * ph)
    m = 0.12 * max(her[2] - her[0], her[3] - her[1])
    b0 = (max(X0, her[0] - m), max(Y0, her[1] - m), min(X1, her[2] + m), min(Y1, her[3] + m))
    for want in sorted(SHAPES, key=lambda s: abs(s - (b0[2] - b0[0]) / (b0[3] - b0[1]))):
        x0, y0, x1, y1 = b0; w, h = x1 - x0, y1 - y0
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
        if (x1 - x0) / (y1 - y0) > want * 1.02:   # (the panel too low to grow taller: narrower instead, round her box, inside the panel)
            w = (y1 - y0) * want; cx = min(max((her[0] + her[2]) / 2, X0 + w / 2), X1 - w / 2); x0, x1 = cx - w / 2, cx + w / 2
        if x0 <= her[0] + 1 and x1 >= her[2] - 1 and y0 <= her[1] + 1 and y1 >= her[3] - 1: break
    if name in GROW and (x1 - x0) / (y1 - y0) < min(SHAPES, key=lambda s: abs(s - (x1 - x0) / (y1 - y0))) * 0.98:
        W = Image.open(orig(page)).size[0]; want = min(SHAPES, key=lambda s: abs(s - (x1 - x0) / (y1 - y0))); add = (y1 - y0) * want - (x1 - x0)
        x0, x1 = max(0, x0 - add), x1 if x0 - add >= 0 else min(W, x1 + add - x0)
    return tuple(round(v) for v in (x0, y0, x1, y1)), tuple(round(v) for v in her)


def src(name):
    p = RAW / f"src_{name}.png"
    if not p.exists():
        RAW.mkdir(parents=True, exist_ok=True); Image.open(orig(FIX[name][0])).convert("RGB").crop(boxes(name)[0]).save(p)
    return str(p.relative_to(ROOT)).replace("\\", "/")


def prompt(name):
    keep, change = FIX[name][3:]
    return ("Edit reference image 1, a panel from a full-colour manga page of a game. Output the SAME picture at the same framing: keep "
            "everything exactly as it is (the camera, the composition, the background, the colours, the line art and screentone style, "
            "any lettering and effects) and keep the white-haired cat girl's pose, position, size, face, expression, hair and clothes "
            "exactly as they are (reference image 2 is her design sheet), and keep " + keep + " - a big white fluffy ghost-cat paw with "
            "red claws - exactly as it is. The black-haired twin-tail girl, where she is in the picture, stays exactly as she is too "
            "(reference images 3 and 4 are her design; " + OUTFIT + "). Change ONLY one thing: the cat girl has only ONE cat paw - her "
            "spirit power is only enough for one hand at a time - so " + change + " must be an ordinary girl's hand: slim pale human "
            "fingers with short plain nails, no fur, no claws, no paw pads, coming out of the same wide white sleeve. Do not add text, "
            "do not add effects.")


JOBS = {f"R93_{n}": [(f"art/raw/r93/{n}_{v}.png", [src(n), "art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/ref/pink_poses.png"],
                      prompt(n) + f" Try {v}.", "OPAQUE") for v in "abc"] for n in FIX if FIX[n][3]}

# (user 2026-10-22, on open_0 b: three hands - the lump of fur under her chin still read as two paws, with the girl's hand over them: again,
# asking outright for exactly two hands and the second lump gone)
REDO = ("Edit reference image 1, a panel from a full-colour manga page of a game. Output the SAME picture at the same framing: keep "
        "everything exactly as it is (the camera, the composition, the background, the colours, the line art and screentone style, the "
        "phone, the sparkles) and keep the white-haired cat girl's face, delighted expression, hair, glasses, clothes and position exactly "
        "as they are (reference image 2 is her design sheet). The black-haired twin-tail girl, where she is in the picture, stays exactly "
        "as she is (reference images 3 and 4 are her design; " + OUTFIT + "). Change ONLY her hands under her chin: there, a big lump of "
        "white fur now looks like TWO cat paws pressed together - that is wrong, she has only ONE cat paw (her spirit power is only enough "
        "for one hand at a time). Redraw her hands so that the picture shows EXACTLY TWO hands of hers: (1) ONE big white fluffy ghost-cat "
        "paw with red claws, curled into a soft round fist under her chin, coming out of the wide white sleeve on the viewer's LEFT; (2) "
        "her other hand, an ordinary girl's hand with slim pale fingers and short plain nails, coming out of the sleeve on the viewer's "
        "RIGHT and resting over the back of that paw. No second paw, no extra hand, no other lump of fur. Do not add text, do not add "
        "effects.")
JOBS["R93_open_0_redo"] = [(f"art/raw/r93/open_0_{v}.png", [src("open_0"), "art/ref/cat_sheet.png", "art/ref/pink_sheet.png",
                                                             "art/ref/pink_poses.png"], REDO + f" Try {v}.", "OPAQUE") for v in "def"]

GLASS = ("Edit reference image 1, a panel from a full-colour manga page of a game. Output the SAME picture at the same framing: keep "
         "everything exactly as it is (the camera, the composition, the stained-glass door and the room behind, the colours, the line art "
         "and screentone style, the sparkles and the lettering) and keep the white-haired cat girl's pose, position, size, smug smiling "
         "face, hair, glasses, clothes, tail and legs exactly as they are (reference image 2 is her design sheet). The black-haired twin-tail "
         "girl, where she is in the picture, stays exactly as she is too (reference images 3 and 4 are her design; " + OUTFIT + "). Change "
         "ONLY one thing: her cat paw (her raised arm beside her face, its palm with pink paw pads toward the viewer) is drawn FAR too big - "
         "as big as her whole upper body. Redraw it at its right size, as on her design sheet: a white fluffy ghost-cat paw with red claws "
         "about one and a half times the size of her head and no bigger, still raised beside her face in the same proud 'ta-da' gesture "
         "with the palm and pads toward the viewer, coming out of the same wide white sleeve, the arm and sleeve in proportion to her body; "
         "fill the space it leaves with the same background (the door, its stained glass, the sparkles). No mark or seal on the palm. Do not "
         "add text, do not add effects.")
JOBS["R93_glass_2"] = [(f"art/raw/r93/glass_2_{v}.png", [src("glass_2"), "art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/ref/pink_poses.png"],
                        GLASS + f" Try {v}.", "OPAQUE") for v in "abc"]

MID = ("Edit reference image 1, a panel from a full-colour manga page of a game. Output the SAME picture at the same framing: keep "
       "everything exactly as it is (the camera, the composition, the haunted school corridor behind, the speed lines, the colours, the line "
       "art and screentone style, the lettering) and keep the white-haired cat girl's running pose, legs, position, size, face, hair, glasses, "
       "clothes and tail exactly as they are (reference image 2 is her design sheet). The black-haired twin-tail girl, where she is in the "
       "picture, stays exactly as she is (reference images 3 and 4 are her design; " + OUTFIT + "). Change ONLY her right arm (on the viewer's "
       "LEFT), the one that ends in her big white fluffy ghost-cat paw with red claws: it is now bent up oddly behind her shoulder - redraw it "
       "the way a running girl's arm really moves: from her shoulder, the arm swinging back and down beside her body, the elbow bent, the "
       "paw at the height of her hip, curled loosely like a fist, the back of the paw toward the viewer, a faint pale-green ghostly glow "
       "around it; the wide sleeve following the arm; the paw about the size of her head, no bigger. Her other hand stays an ordinary hand. "
       "Do not add text, do not add effects.")
JOBS["R93_mid_3"] = [(f"art/raw/r93/mid_3_{v}.png", [src("mid_3"), "art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/ref/pink_poses.png"],
                      MID + f" Try {v}.", "OPAQUE") for v in "abc"]

# (the first three tries kept the raised paw and turned her other hand into a second paw: asked again, saying what goes where outright)
MID2 = ("Edit reference image 1, a panel from a full-colour manga page of a game. Output the SAME picture at the same framing, everything "
        "kept exactly as it is (the corridor, the speed lines, the colours, the line art, the lettering, the black-haired girl on the right, "
        "the white-haired cat girl's face, hair, glasses, clothes, running legs and tail - reference image 2 is her design sheet), with "
        "exactly TWO changes, both on the cat girl: (1) the big white furry cat paw held up beside her head on the LEFT side of the picture, "
        "with its green ghostly flame and the red seal, is REMOVED: paint the corridor wall and the speed lines there instead; (2) her right "
        "arm (on the LEFT side of the picture) now hangs down along her body swinging back as she runs, the wide white sleeve following it, "
        "and ENDS IN the same big white furry ghost-cat paw with red claws, now at the height of her hip on the left side, curled like a "
        "loose fist, a faint pale-green ghostly glow round it, about the size of her head. Her other hand, on the RIGHT side of her body near "
        "the black-haired girl, stays exactly as it is: an ordinary girl's hand, not a paw. In the whole picture she has exactly ONE paw. "
        "Do not add text, do not add effects.")
JOBS["R93_mid_3b"] = [(f"art/raw/r93/mid_3_{v}.png", [src("mid_3"), "art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/ref/pink_poses.png"],
                       MID2 + f" Try {v}.", "OPAQUE") for v in "def"]
