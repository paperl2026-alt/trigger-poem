"""Round 42 (tools/rounds/job_specs42.py, art/raw/r42) -> the content pack.
  classroom  cls_<win|door|back><n>[_x], cls_front1[_x], cls_floor<n>[_x], cls_ceil1[_x]  -> st0/<name>   (_x = the anomaly version; window
             panes keyed out; floors / ceilings made tileable, their edges matched to version 1)
  yard       yard_front<n>, yard_side<n> (sky keyed out), yard_ground<n> (tileable), yard_sky   -> st4/<name>
  props      prop_<name>                                                                     -> prop/<name>
  onoma      ono_<a|b|c>.png (3 x 3)                                                          -> fx/ono_<sheet>_<i>
  boss       b<form>_<part>_<v>                                                               -> boss/dc3_<form>_<part>_<v>  (trimmed)
  pages      tf12_<v>, tf23_<v>   (the picked one)                                            -> comic/ep0p_tf12 / tf23 + comics.json
Then: relief maps (tools/relief.py "prop/*" "boss/dc3_*") and margins for the outline (tools/pad_frames.py "boss/dc3_*").
usage: python -I tools/rounds/r42_import.py"""
import sys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r42"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r23_import import cells
from r28_import import key_magenta, tileable
from r31_import import same_edges
from comic_panels import panels

PAGES = {"tf12": ("b", 4), "tf23": ("a", 4)}


def save(man, key, im, maxs=None, q=90, **extra):
    if maxs and max(im.size) > maxs:
        s = maxs / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    (A / key).parent.mkdir(parents=True, exist_ok=True)
    im.save(A / f"{key}.webp", quality=q, method=6)
    man[key] = {**{k: v for k, v in man.get(key, {}).items() if k in ("relief",)}, "src": f"assets/{key}.webp", "w": im.width, "h": im.height, **extra}
    return im


if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    # ---- the classroom
    for f in sorted(RAW.glob("cls_*.png")):
        n = f.stem[4:]; im = Image.open(f)
        if n.startswith("win"): save(man, f"st0/{n}", key_magenta(im.resize((1536, 1152), Image.LANCZOS)), keyed=True)
        elif n.startswith(("floor", "ceil")):
            base = tileable(Image.open(RAW / f"cls_{n.split('_')[0][:-1]}1.png").resize((1024, 1024), Image.LANCZOS))
            t = tileable(im.convert("RGB").resize((1024, 1024), Image.LANCZOS))
            save(man, f"st0/{n}", t if n.split("_")[0].endswith("1") else same_edges(t, base))
        elif n.startswith("front"): save(man, f"st0/{n}", im.convert("RGB").resize((2048, 768), Image.LANCZOS))
        else: save(man, f"st0/{n}", im.convert("RGB").resize((1536, 1152), Image.LANCZOS))
    print("classroom")
    # ---- the yard
    for f in sorted(RAW.glob("yard_*.png")):
        n = f.stem[5:]; im = Image.open(f)
        if n.startswith(("front", "side")): save(man, f"st4/{n}", key_magenta(im), maxs=2048, keyed=True, **({"hit": True} if n.startswith("front") else {}))   # (the building stops shots: its alpha mask)
        elif n.startswith("ground"): save(man, f"st4/{n}", tileable(im.convert("RGB").resize((1024, 1024), Image.LANCZOS)))
        else: save(man, f"st4/{n}", im.convert("RGB"), maxs=2048, q=86)
    print("yard")
    # ---- props (trimmed)
    for f in sorted(RAW.glob("prop_*.png")):
        im = Image.open(f).convert("RGBA"); im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox())
        save(man, f"prop/{f.stem[5:]}", im, maxs=900)
    print("props")
    # ---- kill onomatopoeia
    for f in sorted(RAW.glob("ono_*.png")):
        for i, im in enumerate(cells(f, 3, 3)):
            if im is not None: save(man, f"fx/ono_{f.stem[4:]}_{i}", im, maxs=420)
    print("onoma")
    # ---- the boss's parts
    for f in sorted(RAW.glob("b[123]_*.png")):
        im = Image.open(f).convert("RGBA"); im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox())
        save(man, f"boss/dc3_{f.stem}", im, maxs=1400, hit=True)
    print("boss")
    # ---- the transformations: whole manga pages
    cp = ROOT / "public" / "content" / "base" / "comics.json"; comics = json.loads(cp.read_text(encoding="utf-8"))
    for page, (v, n) in PAGES.items():
        src = RAW / f"{page}_{v}.png"
        if not src.exists(): print("missing", src.name); continue
        save(man, f"comic/ep0p_{page}", Image.open(src).convert("RGB"), maxs=1920, q=88)
        ps, _ = panels(src, expect=n)
        at, out = 0.15, []
        for i, p in enumerate(ps):
            out.append({"poly": p["poly"], "at": round(at, 2), "in": ["punch", "slideL", "drop", "slideR"][i % 4], "kb": ["in", "up", "out", "left"][i % 4]})
            at += 0.9
        comics[f"ep0_{page}"] = [{"page": f"comic/ep0p_{page}", "panels": out}]
        print(page, len(out), "panels")
    cp.write_text(json.dumps(comics, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
