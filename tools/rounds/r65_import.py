"""Round 65 (tools/rounds/job_specs65.py, art/raw/r65): episode 2's house rules as a comic page of their own (user 2026-10-19 batch 23:
nobody read the note in the stage) -> comic/ep2p_rules + comics.json ep2_rules (six panels, in reading order). The episode's steps put it
right after the opening page (tools/rounds/ep2_level.py).
usage: python -I tools/rounds/r65_import.py [variation]"""
import sys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r65"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r54_import import save

PICK = "c"   # (the clearest of the three: the doll down, the cat girl covering her friend's eyes, the shutter slamming)

if __name__ == "__main__":
    from comic_panels import panels as find_panels
    from r47_import import reading_order, INS, KBS
    v = sys.argv[1] if len(sys.argv) > 1 else PICK
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    cp = ROOT / "public" / "content" / "base" / "comics.json"; raw = cp.read_bytes(); crlf = b"\r\n" in raw; cm = json.loads(raw.decode("utf-8"))
    src = RAW / f"page_rules_{v}.png"
    im = Image.open(src).convert("RGB"); im = im.resize((1920, round(1920 * im.height / im.width)), Image.LANCZOS)
    key = "comic/ep2p_rules"; save(man, key, im, q=88)
    ps = reading_order(find_panels(src, expect=6)[0])
    cm["ep2_rules"] = [{"page": key, "panels": [{"poly": p["poly"], "at": round(0.15 + i * 1.8, 2), "in": INS[i % 4], "kb": KBS[i % 4]} for i, p in enumerate(ps)]}]
    print(key, "panels", len(ps))
    t = json.dumps(cm, ensure_ascii=False, indent=1) + "\n"; cp.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
