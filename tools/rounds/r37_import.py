"""Round 37 (tools/rounds/job_specs37.py, art/raw/r37): the talisman brush glyphs (black ink on transparency) -> fx/fu_<sheet>_<0..8>.
  fu_words  -> fx/fu_w_*: 0 敕令, 1 急急如律令, 2 㗊, 3 敕, 4 令, 5 雷, 6 鬼, 7 罡, 8 斬
  fu_seals_a -> fx/fu_a_*: nine fu talisman sigils;  fu_seals_b -> fx/fu_b_*: nine round seals
The game turns their ink into glyph masks and colours them (src/battle/glyphs.js pictureGlyph).
usage: python -I tools/rounds/r37_import.py"""
import sys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r37"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r23_import import cells

if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    (A / "fx").mkdir(exist_ok=True)
    for sheet, key in (("fu_words", "w"), ("fu_seals_a", "a"), ("fu_seals_b", "b")):
        for i, im in enumerate(cells(RAW / f"{sheet}.png", 3, 3)):
            if im is None: print("empty", sheet, i); continue
            s = min(1, 384 / max(im.size)); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
            im.save(A / f"fx/fu_{key}_{i}.webp", quality=92, method=6)
            man[f"fx/fu_{key}_{i}"] = {"src": f"assets/fx/fu_{key}_{i}.webp", "w": im.width, "h": im.height}
        print(sheet)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
