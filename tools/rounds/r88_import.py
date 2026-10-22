"""Round 88's studio comic pages (tools/rounds/job_specs88.py) into the episode 1 pack: comic/ep1p_studio and comic/ep1p_merge, their
panels found on the page (tools/comic_panels.py, in reading order) into the pack's comics.json ep1_studio / ep1_merge. The cat girl's paw
seals put right first (tools/seal_fix.py page88_*: art/raw/r88/fixed/).
Round 89 redid both with the girls' design sheets: its pages are taken first.
usage: python -I tools/rounds/r88_import.py"""
import json, pathlib, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402
from comic_panels import panels as find_panels  # noqa: E402
from r47_import import reading_order, INS, KBS  # noqa: E402
from r53_import import put  # noqa: E402

RAWS = [ROOT / "art" / "raw" / "r89", ROOT / "art" / "raw" / "r88"]   # (R89: the same pages with the girls' design sheets - tools/rounds/job_specs89.py)
# (the studio page: R89's first panel - the girls right - put into R88's page, whose portrait is the lady as she is: page_studio_mix)
PAGES = {"studio": ("page_studio_mix", 4), "merge": ("page_merge", 4)}


def main():
    man = packs.manifest()
    cp = packs.data_file("comics", "ep1_studio"); raw = cp.read_bytes(); crlf = b"\r\n" in raw; cm = json.loads(raw.decode("utf-8"))
    for page, (name, n) in PAGES.items():
        src = next(f for R in RAWS for f in (R / "fixed" / f"{name}.png", R / f"{name}.png") if f.exists())
        im = Image.open(src).convert("RGB"); im = im.resize((1920, round(1920 * im.height / im.width)), Image.LANCZOS)
        key = f"comic/ep1p_{page}"; put(man, key, im, q=88)
        ps = reading_order(find_panels(src, expect=n)[0])
        if len(ps) != n: print("!!", page, "found", len(ps), "panels, expected", n)
        cm[f"ep1_{page}"] = [{"page": key, "panels": [{"poly": p["poly"], "at": round(0.15 + i, 2), "in": INS[i % 4], "kb": KBS[i % 4]} for i, p in enumerate(ps)]}]
        print("comic", page, src.parent.name, src.name, len(ps), "panels")
    man.save()
    txt = json.dumps(cm, ensure_ascii=False, indent=2) + "\n"; cp.write_bytes((txt.replace("\n", "\r\n") if crlf else txt).encode("utf-8"))
    import subprocess; subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(cp)], check=True, stdin=subprocess.DEVNULL)


if __name__ == "__main__":
    main()
