"""Round 41 (tools/rounds/job_specs41.py, art/raw/r41) -> the content pack.
  gl_<style>_<n>.png (3 x 3)  -> fx/gl2_<style>_u<code>   the cat girl's designed lettering, one character each
  page_<page>_<v>.png          -> comic/ep0p_<page>         the picked whole manga page (canonical paw seal put on first: art/seal_placements.json
                                                            comicpage_<page>), its panels found by tools/comic_panels.py -> comics.json
usage: python -I tools/rounds/r41_import.py [glyphs] [pages]"""
import sys, json, pathlib, subprocess
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r41"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r23_import import cells
from job_specs41 import SHEETS, STYLES
from comic_panels import panels

PICK = {"intro": "b", "mid": "b", "boss": "c", "end": "c"}
EXPECT = {"intro": 5, "mid": 4, "boss": 4, "end": 4}   # how many panels each page has (tools/comic_panels.py cuts merged ones)
COMIC = {"intro": "ep0_intro", "mid": "ep0_mid", "boss": "ep0_boss", "end": "ep0_end"}
KB = ["in", "right", "out", "up", "in", "left", "down"]
IN = ["slideL", "drop", "slideR", "punch"]


def save(man, key, im, maxs, q=90):
    if max(im.size) > maxs:
        s = maxs / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    (A / key).parent.mkdir(parents=True, exist_ok=True)
    im.save(A / f"{key}.webp", quality=q, method=6)
    man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height}


if __name__ == "__main__":
    what = sys.argv[1:] or ["glyphs", "pages"]
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    if "glyphs" in what:
        for style in STYLES:
            for i, chars in enumerate(SHEETS):
                f = RAW / f"gl_{style}_{i}.png"
                if not f.exists(): print("missing", f.name); continue
                for ch, im in zip(chars, cells(f, 3, -(-len(chars) // 3))):   # (a last sheet of 3 is ONE row: cut as 3 x 3 they lost two thirds)
                    if im is not None: save(man, f"fx/gl2_{style}_u{ord(ch):x}", im, 320)
            print(style)
    if "pages" in what:
        cp = ROOT / "public" / "content" / "base" / "comics.json"; comics = json.loads(cp.read_text(encoding="utf-8"))
        places = json.loads((ROOT / "art" / "seal_placements.json").read_text(encoding="utf-8"))
        for page, v in PICK.items():
            src = RAW / f"page_{page}_{v}.png"
            names = [k for k in places if k == f"comicpage_{page}" or k.startswith(f"comicpage_{page}_")]   # every paw seal on the page, in order
            if names:   # the canonical paw seal on her paw first
                subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "seal_fix.py"), *names, "--preview", str(ROOT / "art" / "_shots")], check=True)
                fixed = RAW / "fixed" / src.name
                if fixed.exists(): src = fixed
            save(man, f"comic/ep0p_{page}", Image.open(src).convert("RGB"), 1920, 88)
            ps, _ = panels(RAW / f"page_{page}_{v}.png", expect=EXPECT[page])
            at, out = 0.15, []
            for i, p in enumerate(ps):
                out.append({"poly": p["poly"], "at": round(at, 2), "in": IN[i % len(IN)], "kb": KB[i % len(KB)]})
                at += 1.0 + 0.15 * (i % 2)
            comics[COMIC[page]] = [{"page": f"comic/ep0p_{page}", "panels": out}]
            print(page, v, len(out), "panels")
        comics["_doc"] = ("漫画。每个漫画是一串页。新格式（序章，2026-10-17）：Codex 画好的整页漫画（字画在里面，docs/DESIGN.md「漫画转场的规矩」）{page: 图, panels: [...]}，"
                          "每格 poly = 这格在页面上的多边形（百分比，tools/comic_panels.py 找出来的），at 第几秒出现，in 入场（slideL / slideR / drop / punch），kb 格内小运镜（in / out / left / "
                          "right / up / down）。旧格式（一格一张图）：rect 是格子在页面上的位置，clip 格子形状，pos 取景焦点，text 程序加的字（不再用）。由 tools/rounds/r41_import.py 生成。")
        cp.write_text(json.dumps(comics, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
