"""Round 47 (tools/rounds/job_specs47.py, art/raw/r47): the prologue's four comic pages redrawn on plain rectangular grids, with the
camera rules (a thought bubble, or over the shoulder onto the phone) -> comic/ep0p_<page> + comics.json ep0_<page>.
The cat girl's paw seals are replaced first (tools/seal_fix.py r47_intro_c2 r47_mid_a r47_mid_a2 r47_boss_b -> art/raw/r47/fixed).
Panels are found by tools/comic_panels.py (the grids are clean) and played in reading order: rows top to bottom, left to right.
usage: python -I tools/rounds/r47_import.py"""
import sys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r47"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools")]
from comic_panels import panels

PAGES = {"intro": ("c2", 5), "mid": ("a", 4), "boss": ("b", 4), "end": ("c", 4)}   # picked version, panel count
INS, KBS = ["punch", "slideL", "drop", "slideR"], ["in", "up", "out", "left"]


def reading_order(ps):
    """rows by their top edge (panels whose tops are within 8% of the page share a row), then left to right"""
    box = lambda p: (min(y for x, y in p["poly"]), min(x for x, y in p["poly"]))
    ps = sorted(ps, key=lambda p: box(p))
    rows, cur = [], []
    for p in ps:
        if cur and box(p)[0] - box(cur[0])[0] > 8: rows.append(cur); cur = []
        cur.append(p)
    rows.append(cur)
    return [p for r in rows for p in sorted(r, key=lambda p: box(p)[1])]


if __name__ == "__main__":
    mp = A / "manifest.json"; mraw = mp.read_bytes(); mcrlf = b"\r\n" in mraw; man = json.loads(mraw.decode("utf-8"))
    cp = ROOT / "public" / "content" / "base" / "comics.json"; raw = cp.read_bytes(); crlf = b"\r\n" in raw
    comics = json.loads(raw.decode("utf-8"))
    for page, (v, n) in PAGES.items():
        fixed = RAW / "fixed" / f"page_{page}_{v}.png"
        src = fixed if fixed.exists() else RAW / f"page_{page}_{v}.png"
        im = Image.open(src).convert("RGB")
        im = im.resize((1920, round(1920 * im.height / im.width)), Image.LANCZOS)
        key = f"comic/ep0p_{page}"; im.save(A / f"{key}.webp", quality=88, method=6)
        man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height}
        ps = reading_order(panels(src, expect=n)[0])
        assert len(ps) == n, (page, len(ps))
        out, at = [], 0.15
        for i, p in enumerate(ps):
            out.append({"poly": p["poly"], "at": round(at, 2), "in": INS[i % 4], "kb": KBS[i % 4]})
            at += 1.0
        comics[f"ep0_{page}"] = [{"page": key, "panels": out}]
        print(page, v, src.name, len(out), "panels")
    txt = json.dumps(comics, ensure_ascii=False, indent=1) + "\n"
    cp.write_bytes((txt.replace("\n", "\r\n") if crlf else txt).encode("utf-8"))
    s = json.dumps(man, indent=1, sort_keys=True)
    mp.write_bytes((s.replace("\n", "\r\n") if mcrlf else s).encode("utf-8"))
