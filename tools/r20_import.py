"""Chapter-select screen parts (tools/job_specs20.py) from the approved mockup art/ref/select_ref.png into the base pack.
Card art: each character card's picture is the mockup's own pixels inside the card's red window (girl + halftone, exactly as
approved), plus the bits of the girl that stick out over the frame (ears, bows), taken from the mockup too, with the Codex
cut-out as their alpha. The two pictures can then trade places (1P / 2P swap). Codex had enlarged the cat cut-out:
tools/fit_cutout.py put it back first (art/raw/r20/sel_cat_fit.png).
usage: python -I tools/r20_import.py [plate] [cards] [parts]   (then: python -I tools/seal_fix.py sel_card_cat)"""
import sys, json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "content" / "base" / "assets"
RAW = ROOT / "art" / "raw" / "r20"
MOCK = ROOT / "art" / "ref" / "select_ref.png"
# card pictures: the whole top of each card (white edge, black frame, red window, girl), mockup px. Both 373 px wide and
# 382 px apart, like the card frames, so the two pictures can trade places and the frames still line up. The bottom stops
# under the name bar (drawn by the game).
WIN = {"cat": (880, 165, 1253, 584), "pink": (1262, 165, 1635, 584)}
# where a girl may stick out of her picture (ears, bows): the outer sides only, never toward the other card or downward
SIDES = {"cat": ("left", "top"), "pink": ("top", "right")}
CUT = {"cat": RAW / "sel_cat_fit.png", "pink": RAW / "sel_pink.png"}
OVER = 56     # how far a girl may stick out over the frame (left, top, right); never below: the name bar sits there
# bits of a girl over the tabs that the Codex cut-out missed (the cat's ear tips), mockup px: they belong to her picture
EXTRA = {"cat": [[[988, 131], [1007, 134], [1056, 166], [990, 168]], [[1044, 150], [1066, 145], [1106, 171], [1044, 173]]]}


def poly_mask(shape, polys, ox=0, oy=0):
    from PIL import ImageDraw
    im = Image.new("L", (shape[1], shape[0]), 0)
    for P in polys: ImageDraw.Draw(im).polygon([(x - ox, y - oy) for x, y in P], fill=255)
    return np.asarray(im) > 0


def save(key, im, **extra):
    mp = OUT / "manifest.json"; man = json.loads(mp.read_text())
    im.save(OUT / "ui" / f"{key}.webp", quality=92, method=6)
    man[f"ui/{key}"] = {**man.get(f"ui/{key}", {}), "src": f"assets/ui/{key}.webp", "w": im.width, "h": im.height, "dom": True, **extra}
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
    print(f"ui/{key}", im.size)


def cards():
    mock = np.asarray(Image.open(MOCK).convert("RGB"))
    for who, (x0, y0, x1, y1) in WIN.items():
        cut = np.asarray(Image.open(CUT[who]).convert("RGBA"))
        sd = SIDES[who]
        X0, Y0, X1, Y1 = x0 - (OVER if "left" in sd else 0), y0 - OVER, x1 + (OVER if "right" in sd else 0), y1
        a = cut[Y0:Y1, X0:X1, 3].astype(np.float32)
        a = ndimage.grey_dilation(a, size=3)                       # do not trim the outline
        inside = np.zeros_like(a); inside[y0 - Y0:, x0 - X0:x1 - X0] = 255
        if who in EXTRA: inside[poly_mask(a.shape, EXTRA[who], X0, Y0)] = 255
        alpha = np.maximum(a, inside).clip(0, 255).astype(np.uint8)
        rgba = Image.fromarray(np.dstack([mock[Y0:Y1, X0:X1], alpha]))
        if who in SEALED:
            rgba.save(RAW / f"card_{who}.png")       # tools/seal_fix.py puts the canonical seal on, entry sel_card_{who}
            print(f"art/raw/r20/card_{who}.png", rgba.size, "-> run seal_fix", f"sel_card_{who}")
        else:
            save(f"sel_card_{who}", rgba)
        print(f"  {who}: box {[X0, Y0, X1, Y1]}")


# small parts: trimmed to their pixels. Some came back with blotches inside a flat icon: those are made one solid colour.
PARTS = ["arrow_l", "arrow_r", "chevrons", "icon_bag", "icon_coin", "icon_crown", "icon_gear_w", "icon_lock", "icon_lock_big", "icon_shirt",
         "icon_skull", "icon_swap", "icon_swords", "icon_team", "thumb1", "thumb2", "thumb_boss", "sel_next"]
SOLID = {"icon_shirt": (255, 255, 255), "icon_lock_big": (206, 206, 206)}


def parts():
    for n in PARTS:
        im = Image.open(RAW / f"{n}.png").convert("RGBA")
        if n in SOLID:
            a = np.asarray(im).copy(); solid = a[..., 3] > 100
            if n != "icon_lock_big": solid = ndimage.binary_fill_holes(solid)   # the padlock's keyhole and shackle are real holes
            # the keyhole of a padlock is a real hole: keep transparent pixels that are dark in the original
            a[..., :3] = SOLID[n]; a[..., 3] = np.where(solid, np.maximum(a[..., 3], 255 * solid), a[..., 3]).astype(np.uint8)
            im = Image.fromarray(a)
        bb = im.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
        im = im.crop(bb)
        s = min(1, 1200 / max(im.size))
        if s < 1: im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        key = n if n.startswith("sel_") else f"sel_{n}"
        save(key, im)


SEALED = ("cat",)

# control plates cut from the lettering-free mockup (art/raw/r20/sel_base.png); each piece's outline is the control's own
# footprint from the controls-only cut-out (art/raw/r20/sel_ui.png). Windows in mockup px.
PIECES = {
    "back": [10, 8, 294, 98], "coins": [1334, 18, 1564, 90], "gear": [1560, 8, 1664, 102],
    "tab_team": [905, 84, 1274, 172], "tab_bag": [1264, 92, 1574, 172],
    "header": [20, 110, 660, 372], "row_n": [36, 453, 592, 535], "row_boss": [36, 536, 592, 620], "best": [44, 626, 244, 694],
    "go": [0, 652, 648, 884], "low_cat": [866, 574, 1264, 780], "low_pink": [1262, 574, 1672, 780], "swap": [1045, 774, 1464, 890],
}
SEL = ROOT / "public" / "content" / "base" / "ui" / "select.json"


def recolour(a, src, dst, tol=75):
    """a flat-filled control in its other state: its fill (pixels near colour src) becomes dst, keeping a little of the texture"""
    rgb = a[..., :3].astype(np.float32); d = np.abs(rgb - np.array(src, np.float32)).max(-1)
    k = np.clip(1.6 - 1.6 * d / tol, 0, 1)[..., None]
    a = a.copy(); a[..., :3] = (rgb * (1 - k) + (np.array(dst, np.float32) + 0.35 * (rgb - np.array(src))) * k).clip(0, 255).astype(np.uint8)
    return a


MULTI = ("header", "low_cat", "low_pink")   # pieces made of several parts; the others are one control each


def pieces():
    base = np.asarray(Image.open(RAW / "sel_base.png").convert("RGB")).astype(np.float32)
    ui = np.asarray(Image.open(RAW / "sel_ui.png").convert("RGBA"))[..., 3] > 40
    # the girls' ears / bows that overlap the tabs belong to the card pictures (they move on a 1P/2P swap): off the tabs
    girl = np.zeros(ui.shape, bool)
    for who in WIN:
        g = np.asarray(Image.open(CUT[who]).convert("RGBA"))[..., 3] > 30
        girl |= ndimage.binary_dilation(g, iterations=3)
        if who in EXTRA: girl |= ndimage.binary_dilation(poly_mask(girl.shape, EXTRA[who]), iterations=2)
    tabs = np.zeros_like(girl); tabs[84:172, 905:1574] = True
    base = fill_flat(base, girl & tabs & ui).clip(0, 255).astype(np.uint8)
    out = {}
    for name, (x0, y0, x1, y1) in PIECES.items():
        m = np.zeros_like(ui); m[y0:y1, x0:x1] = ui[y0:y1, x0:x1]
        m = ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=2))
        lab, n = ndimage.label(m); sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, 1 + np.where(sizes > 0.02 * sizes.max())[0]) if name in MULTI else lab == 1 + int(np.argmax(sizes))
        a = ndimage.gaussian_filter(ndimage.binary_dilation(m, iterations=1).astype(np.float32), 0.7)
        ys, xs = np.nonzero(a > 0.05); bx = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
        rgba = np.dstack([base, (a * 255).astype(np.uint8)])[bx[1]:bx[3], bx[0]:bx[2]]
        save(f"sel_pc_{name}", Image.fromarray(rgba)); out[name] = {"img": f"ui/sel_pc_{name}", "box": bx}
        if name in ("tab_team", "tab_bag"):    # the other state of each tab: selected = red, not selected = grey
            on = name == "tab_team"
            red, grey = (216, 20, 30), (200, 199, 197)
            alt = recolour(rgba, red, grey) if on else recolour(rgba, grey, red)
            save(f"sel_pc_{name}_{'off' if on else 'on'}", Image.fromarray(alt))
            out[name]["on" if on else "off"] = f"ui/sel_pc_{name}"; out[name]["off" if on else "on"] = f"ui/sel_pc_{name}_{'off' if on else 'on'}"
    # the next-chapter card: the mockup's card with its lettering repainted (job R20_nextfill), outlined by its footprint
    nf = np.asarray(Image.open(RAW / "next_fill.png").convert("RGB"))
    crop = (590, 215, 885, 870)
    nf = np.asarray(Image.fromarray(nf).resize((crop[2] - crop[0], crop[3] - crop[1]), Image.LANCZOS))
    full = np.asarray(Image.open(MOCK).convert("RGB")).copy(); full[crop[1]:crop[3], crop[0]:crop[2]] = nf
    m = np.zeros_like(ui); m[230:800, 640:836] = ui[230:800, 640:836]
    m = ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=2))
    lab, n = ndimage.label(m); m = lab == 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))
    a = ndimage.gaussian_filter(ndimage.binary_dilation(m, iterations=1).astype(np.float32), 0.7)
    ys, xs = np.nonzero(a > 0.05); bx = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
    save("sel_next_ep1", Image.fromarray(np.dstack([full, (a * 255).astype(np.uint8)])[bx[1]:bx[3], bx[0]:bx[2]]))
    out["next"] = {"img": "ui/sel_next_ep1", "box": bx}
    # record the boxes in the screen layout
    j = json.loads(SEL.read_text(encoding="utf-8")); j["select"]["pieces"] = out
    j["select"]["next"]["box"] = bx
    SEL.write_text(json.dumps(j, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("pieces ->", SEL.name)


def inpaint(img, hole):
    """fill the hole from the pixels around it only (normalised blur, fine to coarse): no trace of what was there survives"""
    known = (~hole).astype(np.float32); out = img.copy(); todo = hole.copy()
    for sg in (1.5, 3, 6, 12, 24, 48):
        den = ndimage.gaussian_filter(known, sg)
        num = np.dstack([ndimage.gaussian_filter(img[..., c] * known, sg) for c in range(3)])
        ok = todo & (den > 0.15)
        out[ok] = num[ok] / den[ok][:, None]; todo &= ~ok
    return out


def fill_flat(img, hole):
    """each hole is filled with the main colour of the ring just around it: the controls are flat fills (white bars, red
    blocks, grey chips, black slabs), so the letters vanish without a smudge"""
    out = img.copy(); lab, n = ndimage.label(hole); img = out
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        y0, y1, x0, x1 = max(0, sl[0].start - 6), sl[0].stop + 6, max(0, sl[1].start - 6), sl[1].stop + 6
        comp = lab[y0:y1, x0:x1] == i
        ring = ndimage.binary_dilation(comp, iterations=3) & ~hole[y0:y1, x0:x1]
        px = img[y0:y1, x0:x1][ring]
        if not len(px): continue
        lum = px.mean(-1); med = np.median(lum)
        main = px[np.abs(lum - med) < 25]
        out[y0:y1, x0:x1][comp] = np.median(main if len(main) else px, axis=0)
    return out


# lettering on a textured surface (the red halftone slab, the skull block) is repainted by Codex; the rest sits on flat
# fills and is filled from its surroundings, which leaves no ghost of the old letters
CODEX_FILLED = ("go_text", "go_tri", "next")


def base():
    """the mockup without the lettering / icons on its controls (tools/text_mask.py, job R20_notext) -> art/raw/r20/sel_base.png"""
    sys.path.insert(0, str(ROOT / "tools")); from text_mask import ITEMS, THUMBS
    from PIL import ImageDraw
    mock = np.asarray(Image.open(MOCK).convert("RGB")).astype(np.float32)
    fill = np.asarray(Image.open(RAW / "sel_notext.png").convert("RGB").resize(mock.shape[1::-1], Image.LANCZOS)).astype(np.float32)
    M = np.asarray(Image.open(ROOT / "art" / "ref" / "select_parts" / "notext_mask.png")) > 0
    codex = np.zeros_like(M)
    for k in CODEX_FILLED:
        x0, y0, x1, y1, _ = ITEMS[k]; codex[y0:y1, x0:x1] = True
    codex &= M
    # the stage pictures first: their area becomes the row bar's white (sampled on the bar, left of the picture)
    out = mock.copy(); th = np.zeros_like(M)
    for poly in THUMBS.values():
        im = Image.new("L", M.shape[::-1], 0); ImageDraw.Draw(im).polygon([tuple(p) for p in poly], fill=255); t = np.asarray(im) > 0
        ys = np.nonzero(t.any(1))[0]; white = np.median(mock[ys.min() + 6:ys.max() - 6, 330:362].reshape(-1, 3), axis=0)
        out[t] = white; th |= t
    flat = M & ~codex & ~th
    out = fill_flat(out, ndimage.binary_dilation(flat, iterations=2) & ~codex & ~th)   # wide enough to take the letters' soft edges too
    w = ndimage.gaussian_filter(ndimage.binary_dilation(codex, iterations=1).astype(np.float32), 1.0)[..., None]
    out = out * (1 - w) + fill * w
    Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(RAW / "sel_base.png")
    print("art/raw/r20/sel_base.png")


def plate():
    """the mockup itself, with Codex's fill (art/raw/r20/sel_fill.png) only inside the mask of game-drawn controls (tools/plate_mask.py)"""
    mock = np.asarray(Image.open(MOCK).convert("RGB")).astype(np.float32)
    fill = np.asarray(Image.open(RAW / "sel_fill.png").convert("RGB").resize(mock.shape[1::-1], Image.LANCZOS)).astype(np.float32)
    m = np.asarray(Image.open(ROOT / "art" / "ref" / "select_parts" / "plate_mask.png")) > 0
    w = ndimage.gaussian_filter(ndimage.binary_dilation(m, iterations=1).astype(np.float32), 1.2)[..., None]
    out = Image.fromarray((mock * (1 - w) + fill * w).clip(0, 255).astype(np.uint8)).resize((1920, 1080), Image.LANCZOS)
    save("sel_plate", out)

if __name__ == "__main__":
    what = sys.argv[1:] or ["base", "plate", "cards", "parts", "pieces"]
    if "base" in what: base()
    if "plate" in what: plate()
    if "cards" in what: cards()
    if "parts" in what: parts()
    if "pieces" in what: pieces()
