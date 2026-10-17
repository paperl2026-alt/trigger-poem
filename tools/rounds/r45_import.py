"""Round 45 (tools/rounds/job_specs45.py, art/raw/r45): the prologue's new boss page and ending page -> comic/ep0p_<page> + comics.json
(whole pages, panels cut by tools/comic_panels.py).
usage: python -I tools/rounds/r45_import.py"""
import sys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r45"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools")]
from comic_panels import panels

PAGES = {"boss": ("a", 4), "end": ("a", 4)}   # picked version, panel count
# the cutter misreads these two pages (slanted gutters, a caption box): their panels set by hand (percent of the page)
MANUAL = {"boss": [[[0, 0], [34.5, 0], [32, 47], [0, 43.5]], [[35, 0], [61, 0], [66, 100], [50, 100], [33, 47.5]],
                   [[0, 44], [32.6, 47.8], [49.5, 100], [0, 100]], [[61.6, 0], [100, 0], [100, 100], [66.6, 100]]],
          "end": [[[0, 0], [65.5, 0], [62, 33], [0, 33]], [[66.5, 0], [100, 0], [100, 35.5], [62.8, 34.2]],
                  [[0, 34], [100, 36.6], [100, 66.2], [0, 64.6]], [[0, 65.8], [100, 67.4], [100, 100], [0, 100]]]}

if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    cp = ROOT / "public" / "content" / "base" / "comics.json"; raw = cp.read_bytes(); crlf = b"\r\n" in raw
    comics = json.loads(raw.decode("utf-8"))
    for page, (v, n) in PAGES.items():
        src = RAW / f"page_{page}_{v}.png"; im = Image.open(src).convert("RGB")
        im = im.resize((1920, round(1920 * im.height / im.width)), Image.LANCZOS)
        key = f"comic/ep0p_{page}"; im.save(A / f"{key}.webp", quality=88, method=6)
        man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height}
        ps = [{"poly": q} for q in MANUAL[page]] if page in MANUAL else panels(src, expect=n)[0]
        at, out = 0.15, []
        for i, p in enumerate(ps):
            out.append({"poly": p["poly"], "at": round(at, 2), "in": ["punch", "slideL", "drop", "slideR"][i % 4], "kb": ["in", "up", "out", "left"][i % 4]})
            at += 1.0
        comics[f"ep0_{page}"] = [{"page": key, "panels": out}]
        print(page, len(out), "panels")
    txt = json.dumps(comics, ensure_ascii=False, indent=1) + "\n"
    cp.write_bytes((txt.replace("\n", "\r\n") if crlf else txt).encode("utf-8"))
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
