"""Round 51 (tools/rounds/job_specs51.py, art/raw/r51): the results page's pictures -> the content pack (no lettering in any of them).
  cover_<v>      (seal fixed: art/raw/r51/fixed, tools/seal_fix.py res_cover_<v>) -> res/cover
  face_<id>_<v>  -> res/face_<id>        (the girls' thumbnails; screens.js showResults falls back to the chibi face)
  item_<id>_<v>  -> res/item_<id>        (an item's thumbnail; falls back to its icon)
usage: python -I tools/rounds/r51_import.py [variant]   (one letter for every picture, else PICK)"""
import sys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r51"
A = ROOT / "public" / "content" / "base" / "assets"
PICK = {"cover": "a", "face_cat": "a", "face_pink": "a", "item_pig": "a"}


def put(man, key, src, maxs):
    im = Image.open(src).convert("RGB")
    s = min(1, maxs / max(im.size)); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    (A / key).parent.mkdir(parents=True, exist_ok=True)
    im.save(A / f"{key}.webp", quality=90, method=6)
    man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height}
    print(key, src.name, im.size)


if __name__ == "__main__":
    pick = {k: sys.argv[1] for k in PICK} if len(sys.argv) > 1 else PICK
    mp = A / "manifest.json"; raw = mp.read_bytes(); crlf = b"\r\n" in raw
    man = json.loads(raw.decode("utf-8"))
    for name, v in pick.items():
        src = RAW / "fixed" / f"{name}_{v}.png" if name == "cover" else RAW / f"{name}_{v}.png"
        put(man, f"res/{name}", src, 1100 if name == "cover" else 384)
    s = json.dumps(man, indent=1, sort_keys=True)
    mp.write_bytes((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))
