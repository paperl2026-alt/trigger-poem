"""Round 61 (tools/rounds/job_specs61.py): the honey-reflection page -> comic/ep1p_double + comics.json ep1_double, and the episode step
{ comic: ep1_double } after the fall page (before the honey tunnel). If the picked page shows the cat paw's seal, fix it first
(tools/seal_fix.py r61_double_<v>) and the fixed copy in art/raw/r61/fixed/ is used.
usage: python -I tools/rounds/r61_import.py <v>"""
import sys, json, pathlib, subprocess
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
R61 = ROOT / "art" / "raw" / "r61"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r53_import import put
from comic_panels import panels as find_panels
from r47_import import reading_order, INS, KBS

if __name__ == "__main__":
    v = sys.argv[1]
    fixed = R61 / "fixed" / f"page_double_{v}.png"
    src = fixed if fixed.exists() else R61 / f"page_double_{v}.png"
    mp = ROOT / "public" / "content" / "base" / "assets" / "manifest.json"; raw = mp.read_bytes(); crlf = b"\r\n" in raw; man = json.loads(raw.decode("utf-8"))
    im = Image.open(src).convert("RGB"); im = im.resize((1920, round(1920 * im.height / im.width)), Image.LANCZOS)
    key = "comic/ep1p_double"; put(man, key, im, q=88)
    s = json.dumps(man, indent=1, sort_keys=True); mp.write_bytes((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))
    ps = reading_order(find_panels(src, expect=4)[0])
    print("panels", len(ps))
    cp = ROOT / "public" / "content" / "base" / "comics.json"; raw = cp.read_bytes(); crlf = b"\r\n" in raw; cm = json.loads(raw.decode("utf-8"))
    cm["ep1_double"] = [{"page": key, "panels": [{"poly": p["poly"], "at": round(0.15 + i, 2), "in": INS[i % 4], "kb": KBS[i % 4]} for i, p in enumerate(ps)]}]
    t = json.dumps(cm, ensure_ascii=False, indent=1) + "\n"; cp.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
    ep = ROOT / "public" / "content" / "base" / "episodes.json"; raw = ep.read_bytes(); crlf = b"\r\n" in raw; E = json.loads(raw.decode("utf-8"))
    eps = E["episodes"] if "episodes" in E else E
    ep1 = next(e for e in (eps if isinstance(eps, list) else eps.values()) if isinstance(e, dict) and e.get("id") == "ep1")
    st = ep1["steps"]
    if not any(x.get("comic") == "ep1_double" for x in st):
        i = next(i for i, x in enumerate(st) if x.get("comic") == "ep1_fall"); st.insert(i + 1, {"comic": "ep1_double"})
        t = json.dumps(E, ensure_ascii=False, indent=2) + "\n"; ep.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
        subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(ep)], check=True, stdin=subprocess.DEVNULL)
    print("ok", src)
