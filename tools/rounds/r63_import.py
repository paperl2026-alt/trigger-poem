"""Round 63 (tools/rounds/job_specs63.py, art/raw/r63; docs/DESIGN.md 第 2 话) -> the content pack.
  panels   <place>_<wallL|wallR|floor|ceil|end|back><n>[_x|_b], <place>_outside<n>, kane_dial<v>   -> ep2/<place>_<name>
           (_x = after the lights went out; doorways and window panes painted magenta are keyed out (the black beyond shows through: the
           way on); floors / ceilings tileable, every version's edges matched to version 1 of its kind)
  covers   cover_<place><n>  -> cover/ep2_<place><n>  (trimmed, solidTop)
  props    prop_<name>       -> prop/ep2_<name>       (trimmed); prop_zodiac (4 x 3) -> ep2/zodiac_<1..12>; decals<v> (3 x 2) -> ep2/d_<name><v>
  proj     m_proj (3 x 2)    -> enemy/p_<name>        (what the small monsters throw)
  comics   page_<open|end>_<v> (the picked one) -> comic/ep2p_<name> + comics.json ep2_<name>
  res      res_cover_ep2_<v> -> res/cover_ep2; res_outfit_yk_<v> -> res/outfit_yk (the results page)
A picture that is missing (refused, not drawn yet) is reported and skipped; run again when it is there.
Then: python -I tools/relief.py "cover/ep2_*" "prop/ep2_*" ; python -I tools/pad_frames.py "enemy/p_lantern*" ...
usage: python -I tools/rounds/r63_import.py [panels] [covers] [props] [proj] [comics] [res] [places ...]"""
import sys, json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r63"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r28_import import key_magenta, tileable
from r31_import import same_edges
from r23_import import cells
from r54_import import save, magenta, trimmed
import job_specs63 as J

SIZE = {"3:2": (1536, 1024), "2:3": (1024, 1536), "1:1": (1280, 1280)}
def shp(w, h): r = w / h; return "3:2" if r > 1.25 else "2:3" if r < 0.8 else "1:1"
PICK = {"open": "b", "end": "b", "cover_ep2": "b", "outfit_yk": "a"}
DECALS = ["slippers", "doll", "hair", "slash", "threads", "gouge"]
ZODIAC = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "sheep", "monkey", "rooster", "dog", "boar"]
PROJ = ["lanternlet", "kokehead", "geta", "crane", "pins", "scissors"]


def mag(a):   # magenta, loosely (round 63's panes and doorways are not always pure #FF00FF)
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    return (r > 150) & (b > 150) & (g < 120) & (r - g > 70) & (b - g > 70)


def key2(im):   # magenta -> see-through (the black beyond: a doorway, the night through a window), soft edges
    a = np.asarray(im.convert("RGB")); m = mag(a)
    m = ndimage.binary_dilation(ndimage.binary_opening(m, iterations=1), iterations=2)
    alpha = (255 * (1 - ndimage.gaussian_filter(m.astype(np.float32), 0.8))).astype(np.uint8)
    rgb = a.copy(); rgb[m] = (26, 18, 30)
    return Image.fromarray(np.dstack([rgb, alpha]))


def night(im):   # magenta in a floor / ceiling (a skylight, a trapdoor) -> the night sky: deep indigo, a few stars
    a = np.asarray(im.convert("RGB")).astype(np.float32); m = ndimage.binary_dilation(mag(a.astype(np.uint8)), iterations=2)
    H, W = m.shape; t = np.linspace(0, 1, H)[:, None, None]
    sky = np.array([10, 10, 34]) * (1 - t) + np.array([28, 20, 52]) * t
    sky = sky * np.ones_like(a); rng = np.random.default_rng(3); st = rng.random((H, W)) > 0.9975
    sky[st] = (230, 226, 255)
    return Image.fromarray(np.where(m[..., None], sky, a).clip(0, 255).astype(np.uint8))


def panels(man, only=None):
    for k, P in J.PLACES.items():
        if only and k not in only: continue
        wh = P["h"] / P.get("rows", 1)
        for f in sorted(RAW.glob(f"{k}_*.png")):
            n = f.stem[len(k) + 1:]; base = n.split("_")[0]; kind = base.rstrip("0123456789")
            im = Image.open(f); key = f"ep2/{k}_{n}"
            if kind in ("floor", "ceil"):
                t = tileable(im.convert("RGB").resize((1024, 1024), Image.LANCZOS))
                b1 = RAW / f"{k}_{kind}1{'_x' if n.endswith('_x') else ''}.png"
                if b1 != f and b1.exists(): t = same_edges(t, tileable(Image.open(b1).convert("RGB").resize((1024, 1024), Image.LANCZOS)))
                save(man, key, night(t) if mag(np.asarray(t)).mean() > 0.0005 else t)
            elif kind == "dial":
                save(man, f"ep2/kane_{n}", im.convert("RGB").resize((1536, 1536), Image.LANCZOS)); key = f"ep2/kane_{n}"
            elif kind == "outside":
                save(man, key, im.convert("RGB").resize((2048, 1365), Image.LANCZOS))
            else:
                size = SIZE[shp(P["bay"], wh)] if kind.startswith("wall") else SIZE[shp(P["W"], P["h"])]
                im = im.convert("RGB").resize(size, Image.LANCZOS)
                if mag(np.asarray(im)).mean() > 0.0008: save(man, key, key2(im), keyed=True)
                else: save(man, key, im)
            print(key, man[key]["w"], man[key]["h"], "keyed" if man[key].get("keyed") else "")


def covers(man):
    for f in sorted(RAW.glob("cover_*.png")):
        im = trimmed(Image.open(f).convert("RGBA"))
        if im.width > 1400: im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
        cov = (np.asarray(im.getchannel("A")) > 128).mean(1)
        save(man, f"cover/ep2_{f.stem[6:]}", im, solidTop=round(int(np.argmax(cov > 0.6)) / im.height, 3))
        print(f"cover/ep2_{f.stem[6:]}", im.size)


def props(man):
    for f in sorted(RAW.glob("prop_*.png")):
        if f.stem == "prop_zodiac": continue
        im = trimmed(Image.open(f).convert("RGBA"))
        if max(im.size) > 1100: s = 1100 / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        save(man, f"prop/ep2_{f.stem[5:]}", im, hit=True); print(f"prop/ep2_{f.stem[5:]}", im.size)
    z = RAW / "prop_zodiac.png"
    if z.exists():
        for name, im in zip(ZODIAC, cells(z, 4, 3)):
            if im is None: print("empty cell", name); continue
            save(man, f"ep2/zodiac_{name}", trimmed(im), q=92, hit=True); print(f"ep2/zodiac_{name}")
    for v in "ab":
        src = RAW / f"decals{v}.png"
        if not src.exists(): print("missing", src.name); continue
        for name, im in zip(DECALS, cells(src)):
            if im is None: continue
            save(man, f"ep2/d_{name}{v}", trimmed(im), q=92); print(f"ep2/d_{name}{v}")


def proj(man):
    src = RAW / "m_proj.png"
    if not src.exists(): print("missing m_proj"); return
    for name, im in zip(PROJ, cells(src)):
        if im is None: continue
        im = trimmed(im)
        if max(im.size) > 400: s = 400 / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        save(man, f"enemy/p_{name}", im, q=92); print(f"enemy/p_{name}", im.size)


def comics(man):
    from comic_panels import panels as find_panels
    from r47_import import reading_order, INS, KBS
    cp = ROOT / "public" / "content" / "base" / "comics.json"; raw = cp.read_bytes(); crlf = b"\r\n" in raw; cm = json.loads(raw.decode("utf-8"))
    for name in ("open", "end"):
        v = PICK[name]; fixed = RAW / "fixed" / f"page_{name}_{v}.png"; src = fixed if fixed.exists() else RAW / f"page_{name}_{v}.png"
        if not src.exists(): print("missing", src.name); continue
        im = Image.open(src).convert("RGB"); im = im.resize((1920, round(1920 * im.height / im.width)), Image.LANCZOS)
        key = f"comic/ep2p_{name}"; save(man, key, im, q=88)
        ps = reading_order(find_panels(src, expect=4)[0])
        cm[f"ep2_{name}"] = [{"page": key, "panels": [{"poly": p["poly"], "at": round(0.15 + i, 2), "in": INS[i % 4], "kb": KBS[i % 4]} for i, p in enumerate(ps)]}]
        print(key, "panels", len(ps))
    t = json.dumps(cm, ensure_ascii=False, indent=1) + "\n"; cp.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))


def res(man):
    for name, key in (("cover_ep2", "res/cover_ep2"), ("outfit_yk", "res/outfit_yk")):
        src = RAW / f"res_{name}_{PICK[name]}.png"
        if not src.exists(): print("missing", src.name); continue
        im = Image.open(src).convert("RGB"); im.thumbnail((1200, 1200)); save(man, key, im, q=90); print(key, im.size)


if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    args = sys.argv[1:]; places = [x for x in args if x in J.PLACES]; parts = [x for x in args if x not in J.PLACES]
    for w in parts or ["panels", "covers", "props", "proj", "comics", "res"]: globals()[w](man, places) if w == "panels" else globals()[w](man)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
