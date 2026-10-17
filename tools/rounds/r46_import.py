"""Round 46 (tools/rounds/job_specs46.py, art/raw/r46): the two sights that sit on the threats -> ui/s<s|h>_<layer>
  sight_shot_<v>.png (3 x 2): outer ring, inner ring, arrows, dot, the whole sight, the break burst   -> ui/ss_*
  sight_hide_<v>.png (3 x 2): outer frame, inner ring, spikes, the ! mark, the whole sight, the ducking chibi -> ui/sh_*
usage: python -I tools/rounds/r46_import.py"""
import sys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r46"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r23_import import cells

SIGHTS = {"shot": ("a", "ss", ["outer", "inner", "arrows", "dot", "full", "break"]),
          "hide": ("b", "sh", ["outer", "inner", "spikes", "mark", "full", "duck"])}

if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    for kind, (v, pre, names) in SIGHTS.items():
        for name, im in zip(names, cells(RAW / f"sight_{kind}_{v}.png")):
            if im is None: print("empty", kind, name); continue
            s = min(1, 512 / max(im.size)); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
            key = f"ui/{pre}_{name}"; im.save(A / f"{key}.webp", quality=92, method=6)
            man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height}
            print(key, im.size)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
