"""Prologue comic pages (content comics.json, panels art/raw/r26/*.png from tools/job_specs26.py). No text anywhere (user rule:
the comics have no words, no sound-effect lettering). Panels -> comic/ep0_<n>; pages laid out as slanted manga panels.
The cat girl's paw seal is made canonical on panels where the paw's back shows big (art/seal_placements.json "cm_<n>").
usage: python -I tools/ep0_comics.py"""
import json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "raw" / "r26"
OUT = ROOT / "public" / "content" / "base" / "assets"
CJ = ROOT / "public" / "content" / "base" / "comics.json"


def P(n, rect, clip, pos="50% 50%", at=0.1, anim="slideL"):
    return {"img": f"comic/ep0_{n}", "rect": rect, "clip": clip, "pos": pos, "in": anim, "at": at}


# rect = [x, y, w, h] in % of the 16:9 page; clip = polygon in % of the panel
PAGES = {
    "ep0_intro": [
        [P("i1", [1.5, 2.5, 97, 40], "0 0,100% 0,100% 86%,0 100%", "50% 45%", 0.1, "slideL"),
         P("i2", [1.5, 41, 47.5, 56.5], "0 6%,100% 0,96% 100%,0 100%", "50% 40%", 0.9, "slideL"),
         P("i3", [50.5, 39, 48, 58.5], "4% 0,100% 0,100% 100%,0 100%", "50% 40%", 1.6, "slideR")],
        [P("i4", [1.5, 2.5, 97, 31], "0 0,100% 0,100% 82%,0 100%", "50% 50%", 0.1, "punch"),
         P("i5", [1.5, 32, 62, 65.5], "0 8%,100% 0,92% 100%,0 100%", "50% 45%", 0.8, "slideL"),
         P("i6", [62, 30, 36.5, 67.5], "10% 0,100% 0,100% 100%,0 100%", "50% 40%", 1.6, "drop")],
        [P("i7", [1.5, 2.5, 97, 44], "0 0,100% 0,100% 88%,0 100%", "50% 50%", 0.1, "slideR"),
         P("i8", [12, 40, 76, 57.5], "4% 8%,100% 0,96% 100%,0 92%", "50% 35%", 1.0, "punch")],
    ],
    "ep0_mid": [
        [P("m1", [1.5, 2.5, 62, 62], "0 0,100% 0,90% 100%,0 100%", "50% 45%", 0.1, "slideL"),
         P("m2", [60, 2.5, 38.5, 95], "12% 0,100% 0,100% 100%,0 100%", "50% 40%", 0.9, "drop"),
         P("m3", [1.5, 64, 60, 33.5], "0 0,96% 0,100% 100%,0 100%", "50% 50%", 1.7, "slideL")],
    ],
    "ep0_boss": [
        [P("b1", [1.5, 2.5, 97, 46], "0 0,100% 0,100% 84%,0 100%", "50% 45%", 0.1, "slideR"),
         P("b2", [1.5, 44, 32, 53.5], "0 8%,100% 0,94% 100%,0 100%", "50% 30%", 0.9, "drop"),
         P("b3", [32, 40, 66.5, 57.5], "6% 6%,100% 0,100% 100%,0 100%", "50% 40%", 1.7, "slideL")],
        [P("b4", [1.5, 18, 97, 64], "0 6%,100% 0,100% 94%,0 100%", "50% 45%", 0.15, "punch")],
    ],
    "ep0_end": [
        [P("e1", [1.5, 2.5, 97, 50], "0 0,100% 0,100% 88%,0 100%", "50% 40%", 0.1, "slideL"),
         P("e2", [1.5, 48, 97, 49.5], "0 10%,100% 0,100% 100%,0 100%", "50% 55%", 1.0, "slideR")],
        [P("e3", [1.5, 2.5, 48, 95], "0 0,100% 0,92% 100%,0 100%", "50% 40%", 0.1, "drop"),
         P("e4", [48.5, 2.5, 50, 95], "8% 0,100% 0,100% 100%,0 100%", "50% 40%", 0.9, "drop")],
        [P("e5", [1.5, 2.5, 97, 95], "0 0,100% 0,100% 100%,0 100%", "50% 50%", 0.15, "slideL")],
    ],
}

if __name__ == "__main__":
    mp = OUT / "manifest.json"; man = json.loads(mp.read_text())
    (OUT / "comic").mkdir(exist_ok=True)
    for f in sorted(RAW.glob("*.png")):
        sealed = RAW.parent / "r26s" / f.name   # the canonical paw seal stamped on (art/seal_placements.json "cm_<n>")
        im = Image.open(sealed if sealed.exists() else f).convert("RGB")
        s = min(1, 1600 / max(im.size)); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        key = f"comic/ep0_{f.stem}"
        im.save(OUT / f"{key}.webp", quality=88, method=6)
        man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height, "dom": True}
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
    cj = json.loads(CJ.read_text(encoding="utf-8"))
    cj["_doc"] = ("漫画转场。每段是若干页，每页若干格：img 图，rect 在 16:9 页面上的位置 [x, y, 宽, 高]（百分比），clip 格子形状（格子内百分比的多边形），"
                  "pos 图的取景焦点，in 入场动画（slideL / slideR / drop / punch），at 第几秒出现。序章漫画按用户要求不放任何文字（tools/ep0_comics.py 生成）。")
    for k, pages in PAGES.items(): cj[k] = pages
    CJ.write_text(json.dumps(cj, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("comics", list(PAGES))
