"""Round 92's opening and ending pages of the first episode (tools/rounds/job_specs92.py) into the episode 1 pack: comic/ep1p_intro and
comic/ep1p_end, their panels found on the page (tools/comic_panels.py, in reading order) into the pack's comics.json ep1_intro / ep1_end.
The cat girl's paw seals put right first (tools/seal_fix.py page92_*: art/raw/r92/fixed/, taken before the raw page).
usage: python -I tools/rounds/r92_import.py"""
import json, pathlib, subprocess, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402
from comic_panels import panels as find_panels  # noqa: E402
from r47_import import reading_order, INS, KBS  # noqa: E402
from r53_import import put  # noqa: E402

R92 = ROOT / "art" / "raw" / "r92"
PAGES = {"intro": ("page_intro_c", 5), "end": ("page_end_a", 6)}   # (the picked versions: intro c - its paw shows one seal, put right; end a)


def main():
    man = packs.manifest()
    cp = packs.data_file("comics", "ep1_intro"); raw = cp.read_bytes(); crlf = b"\r\n" in raw; cm = json.loads(raw.decode("utf-8"))
    for page, (name, n) in PAGES.items():
        src = next(f for f in (R92 / "fixed" / f"{name}.png", R92 / f"{name}.png") if f.exists())
        im = Image.open(src).convert("RGB"); im = im.resize((1920, round(1920 * im.height / im.width)), Image.LANCZOS)
        key = f"comic/ep1p_{page}"; put(man, key, im, q=88)
        ps = reading_order(find_panels(src, expect=n)[0])
        if len(ps) != n: print("!!", page, "found", len(ps), "panels, expected", n)
        cm[f"ep1_{page}"] = [{"page": key, "panels": [{"poly": p["poly"], "at": round(0.15 + i, 2), "in": INS[i % 4], "kb": KBS[i % 4]} for i, p in enumerate(ps)]}]
        print("comic", page, src.parent.name, src.name, len(ps), "panels")
    man.save()
    txt = json.dumps(cm, ensure_ascii=False, indent=2) + "\n"; cp.write_bytes((txt.replace("\n", "\r\n") if crlf else txt).encode("utf-8"))
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(cp)], check=True, stdin=subprocess.DEVNULL)


if __name__ == "__main__":
    main()
