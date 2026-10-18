"""Rounds 56 / 56b (tools/rounds/job_specs56.py, job_specs56b.py; docs/DESIGN.md 第 1 话, redone 2026-10-18) -> the content pack.
  monsters  3 x 2 sheets, the picked versions                 -> enemy/<kind>[_b|_c]_<pose>  (the three lightly corrupted small things,
            three versions each; the studio's four shadows, one each)
  portraits portrait<n>[_x]                                   -> ep1/portrait<n>[_x]  (_x = emptied: the lady-shaped hole filled with blank
            canvas, scaled onto the full one's size so the mechanism flips one into the other in place)
  doors     door<n>_frame / _leaf                             -> ep1/door<n>_frame (manifest "hole") / ep1/door<n>_leaf
  panels    <nursery|studio>_<wallL|wallR|floor|ceil|end><n>  -> ep1/<place>_<name>  (rotten only: the house never turns back)
  covers    cover_<place><n>                                  -> cover/ep1_<place><n>
  props     prop_<place><n>                                   -> prop/ep1_<place><n>  (hit: they can be shot to pieces)
  comics    page_<name>_<v> (the picked one; art/raw/r56/fixed/ when its paw seals were replaced: tools/seal_fix.py r56_*)
            -> comic/ep1p_<name> + comics.json ep1_<name>
  thumbs    the select screen's stage thumbnails of the new stages
A picture that is missing (refused, not drawn yet) is reported and skipped; run again when it is there.
Then: python -I tools/pad_frames.py "enemy/scoopling*" ... and python -I tools/relief.py ... (printed at the end)
usage: python -I tools/rounds/r56_import.py [monsters] [portraits] [doors] [panels] [covers] [props] [comics] [thumbs]"""
import sys, json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[2]
R56 = ROOT / "art" / "raw" / "r56"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r23_import import cells
from r53_import import put, trim, fit, canvas, hole
import r54_import

# kind -> (sheets: the picked versions in order), poses (in sheet order), anchor
MON = {
    "scoopling":     ([R56 / "m_scoop_b.png", R56 / "m_scoop_c.png", R56 / "m_scoop_d.png"], ["walk0", "walk1", "crouch", "leap", "bite", "hurt"], "bottom"),
    "teacup":        ([R56 / "m_cup_a.png", R56 / "m_cup_b.png", R56 / "m_cup_c.png"], ["stand", "air", "crouch", "leap", "bite", "hurt"], "bottom"),
    "doily":         ([R56 / "m_doily_a.png", R56 / "m_doily_b.png", R56 / "m_doily_d.png"], ["fly0", "fly1", "idle", "windup", "dive", "hurt"], "center"),
    "shade_hostess": ([R56 / "shade_hostess_c.png"], ["stand", "glide", "idle", "windup", "throw", "hurt"], "bottom"),
    "shade_mourner": ([R56 / "shade_mourner_c.png"], ["hover0", "hover1", "idle", "windup", "wail", "hurt"], "bottom"),
    "shade_mother":  ([R56 / "shade_mother_c.png"], ["rock", "glide", "idle", "windup", "throw", "hurt"], "bottom"),
    "shade_bride":   ([R56 / "shade_bride_b.png"], ["stand", "walk", "idle", "crouch", "rush", "hurt"], "bottom"),
}
DOORS = {8: "a", 9: "a"}
PAGES = {"turn": ("b", 3), "nursery": ("b", 4), "fall": ("b", 3), "studio": ("a", 4), "merge": ("b", 4)}   # picked, panels
PLACES = {"nursery": ("3:2", "3:2"), "studio": ("1:1", "3:2")}   # wall, end shape
CANVAS = (236, 224, 204)   # the blank canvas left where the lady stepped out of a portrait


def monsters(man):
    for kind, (sheets, poses, anchor) in MON.items():
        for i, src in enumerate(sheets):
            if not src.exists(): print("missing", src.name); continue
            pre = kind if i == 0 else f"{kind}_{'bcd'[i - 1]}"
            for name, can, extra in canvas(list(zip(poses, cells(src))), anchor):
                put(man, f"enemy/{pre}_{name}", can, hit=True, **extra)
            print(pre, can.size, src.name)


def portraits(man):
    for n in (1, 2, 3, 4):
        full = fit(trim(Image.open(R56 / f"portrait{n}.png").convert("RGBA")), 900)
        put(man, f"ep1/portrait{n}", full, hit=True)
        x = trim(Image.open(R56 / f"portrait{n}_x.png").convert("RGBA")).resize(full.size, Image.LANCZOS)
        a = np.asarray(x).copy()
        solid = a[..., 3] > 128
        holes = ndimage.binary_fill_holes(solid) & ~solid   # see-through inside the frame: the emptied canvas
        holes = ndimage.binary_dilation(holes, iterations=1) & ndimage.binary_fill_holes(solid)
        a[holes, :3] = CANVAS; a[holes, 3] = 255
        put(man, f"ep1/portrait{n}_x", Image.fromarray(a), hit=True)
        print(f"ep1/portrait{n}", full.size, "emptied, holes filled:", int(holes.sum()))


def doors(man):
    for n, v in DOORS.items():
        if not (R56 / f"door{n}_leaf_{v}.png").exists(): print("missing door", n); continue
        fr = Image.open(R56 / f"door{n}_frame_{v}.png").convert("RGB")
        hb = hole(fr)
        put(man, f"ep1/door{n}_frame", fit(fr, 1800), q=88, hole=hb)
        leaf = trim(Image.open(R56 / f"door{n}_leaf_{v}.png").convert("RGBA"), 0)
        put(man, f"ep1/door{n}_leaf", fit(leaf, 1400), q=90)
        print(f"door{n}", fr.size, "hole", hb, "leaf", leaf.size)


def panels(man):
    r54_import.RAW = R56
    r54_import.WALL.update({k: w for k, (w, e) in PLACES.items()}); r54_import.END.update({k: e for k, (w, e) in PLACES.items()})
    r54_import.panels(man, list(PLACES))


def covers(man):
    r54_import.RAW = R56; r54_import.covers(man)


def props(man):
    for f in sorted(R56.glob("prop_*.png")):
        im = r54_import.trimmed(Image.open(f).convert("RGBA"))
        if max(im.size) > 900: s = 900 / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        r54_import.save(man, f"prop/ep1_{f.stem[5:]}", im, hit=True); print(f"prop/ep1_{f.stem[5:]}", im.size)


def comics(man):
    from comic_panels import panels as find_panels
    from r47_import import reading_order, INS, KBS
    cp = ROOT / "public" / "content" / "base" / "comics.json"; raw = cp.read_bytes(); crlf = b"\r\n" in raw
    cm = json.loads(raw.decode("utf-8"))
    for page, (v, n) in PAGES.items():
        fixed = R56 / "fixed" / f"page_{page}_{v}.png"
        src = fixed if fixed.exists() else R56 / f"page_{page}_{v}.png"
        if not src.exists(): print("missing page", page); continue
        im = Image.open(src).convert("RGB"); im = im.resize((1920, round(1920 * im.height / im.width)), Image.LANCZOS)
        key = f"comic/ep1p_{page}"; put(man, key, im, q=88)
        ps = reading_order(find_panels(src, expect=n)[0])
        if len(ps) != n: print("!!", page, "found", len(ps), "panels, expected", n)
        cm[f"ep1_{page}"] = [{"page": key, "panels": [{"poly": p["poly"], "at": round(0.15 + i, 2), "in": INS[i % 4], "kb": KBS[i % 4]} for i, p in enumerate(ps)]}]
        print("comic", page, v, src.parent.name, len(ps), "panels")
    txt = json.dumps(cm, ensure_ascii=False, indent=1) + "\n"
    cp.write_bytes((txt.replace("\n", "\r\n") if crlf else txt).encode("utf-8"))


# the select screen's thumbnails (like r53_import.thumbs): a band across each place's concept painting, the boss one taller
THUMBS = {"nursery": R56 / "sc_nursery_a.png", "studio": R56 / "sc_studio_a.png", "boss": R56 / "sc_studio_a.png"}
GONE = ["ui/sel_thumb_ep1_nether", "ui/sel_thumb_ep1_garden2"]   # stages the redone chapter no longer has


def thumbs(man):
    for k, src in THUMBS.items():
        im = Image.open(src).convert("RGB")
        W, H = (1200, 491) if k == "boss" else (1200, 363)
        s = W / im.width; im = im.resize((W, round(im.height * s)), Image.LANCZOS)
        y = max(0, min(im.height - H, round(im.height * 0.5 - H / 2)))
        put(man, f"ui/sel_thumb_ep1_{k}", im.crop((0, y, W, y + H)), q=86, dom=True); print(f"ui/sel_thumb_ep1_{k}")
    for k in GONE:
        if man.pop(k, None): (A / f"{k}.webp").unlink(missing_ok=True); print("removed", k)


if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    parts = sys.argv[1:] or ["monsters", "portraits", "doors", "panels", "covers", "props", "comics", "thumbs"]
    for p in parts: globals()[p](man)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))   # (the way every import writes it)
    if "monsters" in parts:
        ks = " ".join(f'"enemy/{k}*"' for k in MON)
        print("next: python -I tools/pad_frames.py", ks, "\n      python -I tools/relief.py", ks, '"cover/ep1_*" "prop/ep1_*"')
