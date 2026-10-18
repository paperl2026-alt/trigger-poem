"""Round 58 (tools/rounds/job_specs58.py, art/raw/r58): the results page's pictures, like tools/rounds/r51_import.py (no lettering).
  cover_<ep>_<v>  (seal fixed: art/raw/r58/fixed, tools/seal_fix.py r58_*)  -> res/cover_<ep>   (that chapter's clear; res/cover = the rest)
  lose_<scene>_<v> (seal fixed)                                             -> res/lose_<n>     (a defeat: one of them at random)
usage: python -I tools/rounds/r58_import.py"""
import json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r58"
A = ROOT / "public" / "content" / "base" / "assets"
COVERS = {"ep1": "c"}                                                      # the picked version per chapter
LOSE = [("ko", "b"), ("dragged", "b"), ("flag", "a"), ("loom", "a")]     # the defeat pictures in use, -> res/lose_1 ..


def put(man, key, name):
    src = RAW / "fixed" / f"{name}.png"
    if not src.exists(): src = RAW / f"{name}.png"
    if not src.exists(): print("missing", name); return
    im = Image.open(src).convert("RGB")
    s = min(1, 1100 / max(im.size)); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    (A / key).parent.mkdir(parents=True, exist_ok=True)
    im.save(A / f"{key}.webp", quality=90, method=6)
    man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height}
    print(key, src.parent.name, src.name, im.size)


if __name__ == "__main__":
    mp = A / "manifest.json"; raw = mp.read_bytes(); crlf = b"\r\n" in raw
    man = json.loads(raw.decode("utf-8"))
    for ep, v in COVERS.items(): put(man, f"res/cover_{ep}", f"cover_{ep}_{v}")
    for i, (scene, v) in enumerate(LOSE, 1): put(man, f"res/lose_{i}", f"lose_{scene}_{v}")
    s = json.dumps(man, indent=1, sort_keys=True)
    mp.write_bytes((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))
