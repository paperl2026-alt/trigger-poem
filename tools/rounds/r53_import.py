"""Rounds 53 / 53b (tools/rounds/job_specs53.py, job_specs53b.py; docs/DESIGN.md 第 1 话) -> the content pack.
  monsters  3 x 2 sheets, the picked versions                 -> enemy/<kind>_<pose>, enemy/<kind>_b_<pose>, enemy/<kind>_c_<pose>
            (the gelato ghoul's turning-around frames go on the same canvas as its first version: enemy/ghoul_scare0..5)
  shots     mproj_a / _b (3 x 2)                              -> enemy/p_<name>[_b]
  doors     door<n>_frame (the opening solid black) + _leaf   -> ep1/door<n>_frame (manifest "hole" = the opening, 0..1) + ep1/door<n>_leaf
  pictures  fresco<n>[_x], crayon<n>[_x]                      -> ep1/fresco<n>[_x], ep1/crayon<n>[_x]
  props     coffin, eyes, seals, ghost hands, the three objects, the netherworld -> ep1/<name>
  boss      boss_f<n>_<v> (3 x 2, the picked one per form)   -> boss/md_s<n>_<pose>
  comics    page_<name>_<v> (the picked one; art/raw/r53b/fixed/ when its paw seals were replaced: tools/seal_fix.py r53_*) -> comic/ep1p_<name>
            + comics.json ep1_<name> (panels found by tools/comic_panels.py, played in reading order)
Then: python -I tools/pad_frames.py "enemy/ghoul*" ... and python -I tools/relief.py (printed at the end)
usage: python -I tools/rounds/r53_import.py [monsters] [shots] [doors] [pictures] [props] [comics] [boss] [thumbs]"""
import sys, json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[2]
R53, R53B = ROOT / "art" / "raw" / "r53", ROOT / "art" / "raw" / "r53b"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r23_import import cells, CAP, MAXH

# kind -> (sheets: the picked versions in order, the first is the main one), poses (in sheet order), anchor
MON = {
    "ghoul":       ([R53 / "m_ghoul_a.png", R53 / "m_ghoul_b.png", R53 / "m_ghoul_d.png"], ["walk0", "walk1", "crouch", "leap", "bite", "hurt"], "bottom"),
    "bat":         ([R53 / "m_bat_a.png", R53 / "m_bat_b.png", R53 / "m_bat_e.png"], ["fly0", "fly1", "idle", "windup", "dive", "hurt"], "center"),
    "chandelier":  ([R53 / "m2_chandelier_a.png", R53 / "m2_chandelier_b.png", R53 / "m2_chandelier_c.png"],
                    ["hover0", "hover1", "idle", "windup", "fire", "hurt"], "center"),
    "armor":       ([R53 / "m_armor_a.png", R53 / "m_armor_c.png", R53 / "m_armor_e.png"], ["still", "wake", "walk0", "crouch", "bite", "hurt"], "bottom"),
    "doll":        ([R53 / "m2_doll_a.png", R53 / "m2_doll_b.png", R53 / "m2_doll_c.png"], ["hide", "rise", "idle", "windup", "throw", "hurt"], "bottom"),
    "crawler":     ([R53B / "m_crawler_a.png", R53B / "m_crawler_b.png", R53B / "m_crawler_e.png"], ["walk0", "walk1", "idle", "crouch", "bite", "hurt"], "bottom"),
    "shadow":      ([R53B / "m_shadow_a.png", R53B / "m_shadow_b.png", R53B / "m_shadow_e.png"], ["hover0", "hover1", "idle", "windup", "blast", "hurt"], "bottom"),
    "double_pink": ([R53B / "m_double_pink_b.png", R53B / "m_double_pink_c.png", R53B / "m_double_pink_e.png"], ["idle", "idle1", "walk", "windup", "fire", "hurt"], "bottom"),
    "double_cat":  ([R53B / "m_double_cat_a.png", R53B / "m_double_cat_b.png", R53B / "m_double_cat_d.png"], ["idle", "idle1", "walk0", "crouch", "bite", "hurt"], "bottom"),
}
TURN = (R53B / "turn_a.png", ["scare0", "scare1", "scare2", "scare3", "scare4", "scare5"], 4, 2)   # sheet, poses, its pose matching ...
SHOTS = {"mproj_a": ["chair", "cup", "candle", "cherry", "wafer", "scoop"], "mproj_b": ["chair_b", "cup_b", "candle_b", "cherry_b", "wafer_b", "scoop_b"]}
DOORS = {n: "a" for n in range(1, 8)}   # the picked version of each door
PAGES = {"intro": ("a", 5), "glass": ("a", 3), "photo": ("b", 2), "web": ("b", 3), "fountain": ("a", 4), "boss": ("a", 3), "end": ("b", 6)}   # picked, panels


def put(man, key, im, q=90, **extra):
    d = man.dir(key) / "assets" if hasattr(man, "dir") else A   # (its pack's folder: tools/packs.py)
    (d / key).parent.mkdir(parents=True, exist_ok=True)
    im.save(d / f"{key}.webp", quality=q, method=6)
    man[key] = {**{k: v for k, v in man.get(key, {}).items() if k in ("relief", "pad")}, "src": f"assets/{key}.webp", "w": im.width,
                "h": im.height, **extra}


def trim(im, pad=4):
    bb = im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    return im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))


def fit(im, side):
    s = min(1, side / max(im.size))
    return im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS) if s < 1 else im


def canvas(named, anchor, ref=0):
    """[(pose, cut-out)] -> [(pose, canvas, manifest extras)] on one shared canvas (like r23_import.frames, for poses from several sheets)"""
    h0 = named[ref][1].height
    scaled = [(n, im.resize((round(im.width * min(1, CAP * h0 / im.height)), round(im.height * min(1, CAP * h0 / im.height))), Image.LANCZOS))
              for n, im in named]
    CW, CH = max(i.width for _, i in scaled), max(i.height for _, i in scaled)
    s = min(1, MAXH / CH); CW, CH = round(CW * s) + 8, round(CH * s) + 8
    out = []
    for n, im in scaled:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        can = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
        can.alpha_composite(im, ((CW - im.width) // 2, CH - im.height - 2 if anchor == "bottom" else (CH - im.height) // 2))
        out.append((n, can, {"anchor": anchor, "figH": round(scaled[ref][1].height * s / CH, 4)}))
    return out


def monsters(man):
    for kind, (sheets, poses, anchor) in MON.items():
        for i, src in enumerate(sheets):
            pre = kind if i == 0 else f"{kind}_{'bcd'[i - 1]}"
            ims = cells(src)
            named = list(zip(poses, ims))
            if kind == "ghoul" and i == 0:   # + the turning-around frames, scaled so its crouch matches the ghoul's crouch
                tsrc, tposes, tref, gref = TURN
                tims = cells(tsrc); k = ims[gref].height / tims[tref].height
                named += [(n, im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)) for n, im in zip(tposes, tims)]
            for name, can, extra in canvas(named, anchor):
                put(man, f"enemy/{pre}_{name}", can, hit=True, **extra)
            print(pre, can.size, src.name)


def shots(man):
    for sheet, names in SHOTS.items():
        for name, im in zip(names, cells(R53 / f"{sheet}.png")):
            if im is None: print("empty", sheet, name); continue
            put(man, f"enemy/p_{name}", fit(im, 360), hit=True); print("enemy/p_" + name, im.size)


def hole(im):
    """the solid black opening of a doorway picture: its box, 0..1"""
    a = np.asarray(im.convert("RGB")).astype(int)
    dark = a.max(2) < 14
    lab, n = ndimage.label(dark)
    if not n: raise SystemExit("no black opening")
    big = 1 + int(np.argmax(ndimage.sum(dark, lab, range(1, n + 1))))
    ys, xs = np.nonzero(lab == big)
    H, W = dark.shape
    return [round(xs.min() / W, 4), round(ys.min() / H, 4), round((xs.max() + 1) / W, 4), round((ys.max() + 1) / H, 4)]


def doors(man):
    for n, v in DOORS.items():
        fr = Image.open(R53B / f"door{n}_frame_{v}.png").convert("RGB")
        hb = hole(fr)
        put(man, f"ep1/door{n}_frame", fit(fr, 1800), q=88, hole=hb)
        leaf = trim(Image.open(R53B / f"door{n}_leaf_{v}.png").convert("RGBA"), 0)
        put(man, f"ep1/door{n}_leaf", fit(leaf, 1400), q=90)
        print(f"door{n}", fr.size, "hole", hb, "leaf", leaf.size)


def pictures(man):
    for base, n in (("fresco", 6), ("crayon", 4)):
        for i in range(1, n + 1):
            for suf in ("", "_x"):
                src = R53B / f"{base}{i}{suf}.png"
                if not src.exists(): print("missing", src.name); continue
                im = fit(trim(Image.open(src).convert("RGBA")), 900)
                put(man, f"ep1/{base}{i}{suf}", im, hit=True); print(f"ep1/{base}{i}{suf}", im.size)


def props(man):
    one = {"coffin_box": "coffin_box", "coffin_lid": "coffin_lid", "hands_a": "hands_a", "hands_b": "hands_b"}
    for src, key in one.items():
        im = fit(trim(Image.open(R53B / f"{src}.png").convert("RGBA")), 1200)
        put(man, f"ep1/{key}", im, hit=True); print("ep1/" + key, im.size)
    for sheet, names, cols, rows in (("eyes", ["eye_l", "eye_r"], 2, 1), ("seals", ["seal1", "seal2", "seal3", "seal4"], 2, 2),
                                     ("ritual", ["photo", "diary", "coffin"], 3, 1),
                                     ("nether_bits", ["nb_cone", "nb_spoon", "nb_cup", "nb_frame", "nb_scoop", "nb_ribbon", "nb_candle", "nb_cherry", "nb_glove"], 3, 3)):
        for name, im in zip(names, cells(R53B / f"{sheet}.png", cols, rows)):
            if im is None: print("empty", sheet, name); continue
            put(man, f"ep1/{name}", fit(im, 520), hit=True); print("ep1/" + name, im.size)
    for v in "ab":
        im = Image.open(R53B / f"nether_{v}.png").convert("RGB")
        put(man, f"ep1/nether_{v}", fit(im, 2400), q=86); print(f"ep1/nether_{v}", im.size)


def comics(man):
    from comic_panels import panels
    from r47_import import reading_order, INS, KBS
    cp = ROOT / "public" / "content" / "base" / "comics.json"; raw = cp.read_bytes(); crlf = b"\r\n" in raw
    cm = json.loads(raw.decode("utf-8"))
    for page, (v, n) in PAGES.items():
        fixed = R53B / "fixed" / f"page_{page}_{v}.png"
        src = fixed if fixed.exists() else R53B / f"page_{page}_{v}.png"
        im = Image.open(src).convert("RGB"); im = im.resize((1920, round(1920 * im.height / im.width)), Image.LANCZOS)
        key = f"comic/ep1p_{page}"; put(man, key, im, q=88)
        ps = reading_order(panels(src, expect=n)[0])
        if len(ps) != n: print("!!", page, "found", len(ps), "panels, expected", n)
        cm[f"ep1_{page}"] = [{"page": key, "panels": [{"poly": p["poly"], "at": round(0.15 + i, 2), "in": INS[i % 4], "kb": KBS[i % 4]} for i, p in enumerate(ps)]}]
        print("comic", page, v, src.parent.name, len(ps), "panels")
    txt = json.dumps(cm, ensure_ascii=False, indent=1) + "\n"
    cp.write_bytes((txt.replace("\n", "\r\n") if crlf else txt).encode("utf-8"))



# ---------------------------------------------------------------- the boss "Madame Rotten Honey" (bosses.json madame, src/battle/thing.js)
BOSS = {1: R53 / "boss_f1_e.png", 2: R53 / "boss_f2_d.png", 3: R53 / "boss_f3_d.png"}   # the picked form sheets
BPOSES = ["idle0", "idle1", "move", "windup", "attack", "hurt"]


def boss(man):
    from r23_import import frames
    for n, src in BOSS.items():
        for name, can, extra in frames(src, BPOSES, "bottom"):
            put(man, f"boss/md_s{n}_{name}", can, hit=True, **extra)
        print("boss form", n, src.name, can.size)


# the select screen's stage thumbnails: a band across the middle of each place's concept painting (like ui/sel_thumb1: 1200 x 363, the
# boss one 1200 x 491), the netherworld and the pit from their own pictures
THUMBS = {"shop": R53 / "sc_shop_a.png", "gallery": R53 / "sc_gallery_a_x.png", "garden": R53 / "sc_fountain_a_x.png",
          "pit": ROOT / "art" / "raw" / "r55" / "pit_wall2.png", "garden2": R53 / "sc_fountain_a_x.png", "cold": R53 / "sc_cold_a_x.png",
          "oven": R53 / "sc_oven_a_x.png", "nether": R53B / "nether_a.png", "boss": R53 / "sc_hall_a_x.png"}


def thumbs(man):
    import json as _j
    ep = _j.loads((ROOT / "public" / "content" / "base" / "episodes.json").read_text(encoding="utf-8"))
    for k, src in THUMBS.items():
        im = Image.open(src).convert("RGB")
        W, H = (1200, 491) if k == "boss" else (1200, 363)
        s = W / im.width; im = im.resize((W, round(im.height * s)), Image.LANCZOS)
        y = max(0, min(im.height - H, round(im.height * (0.62 if k in ("garden2", "pit") else 0.45) - H / 2)))
        key = f"ui/sel_thumb_ep1_{k}"
        put(man, key, im.crop((0, y, W, y + H)), q=86, dom=True)
        print(key)

if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    parts = sys.argv[1:] or ["monsters", "shots", "doors", "pictures", "props", "comics"]
    for p in parts: globals()[p](man)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))   # (the way every import writes it)
    if "monsters" in parts:
        ks = " ".join(f'"enemy/{k}*"' for k in MON)
        print("next: python -I tools/pad_frames.py", ks, "\n      python -I tools/relief.py", ks)
