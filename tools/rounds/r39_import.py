"""Round 39 (tools/rounds/job_specs39.py, art/raw/r39) -> the content pack.
  rl_<who>_<set>.png (3 x 3)        -> ui/rlq_<who>_<set>_<1..9>   chibi big-head reload stickers
  alert_words.png (3 x 3)           -> ui/alert_<name>               arcade lettering (RELOAD!, CONTINUE?, ...)
  alert_cracks.png (3 x 2)          -> fx/crack_<0..5>               screen cracks (being hit)
  gl_<group>_<style>.png / gl_spell_<i>.png -> fx/gl_<style>_u<hex>  the cat girl's art lettering, one character each (key = its code point)
The HUD mockups (hud_*.png) are decomposed in R40.
usage: python -I tools/rounds/r39_import.py"""
import sys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r39"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r23_import import cells
from job_specs39 import SPELL

WORDS = ["reload_p5", "reload_chrome", "reload_cute", "continue_p5", "continue_chrome", "noammo", "danger", "ouch", "hit"]
GROUPS = {"mantra": ("唵嘛呢叭咪吽", 3, 2), "kuji": ("临兵斗者皆阵列前行", 3, 3)}


def save(man, key, im, maxs):
    if max(im.size) > maxs:
        s = maxs / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    (A / key).parent.mkdir(parents=True, exist_ok=True)
    im.save(A / f"{key}.webp", quality=90, method=6)
    man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height}


if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    for f in sorted(RAW.glob("rl_*.png")):
        who, k = f.stem.split("_")[1:3]
        for i, im in enumerate(cells(f, 3, 3), 1):
            if im is not None: save(man, f"ui/rlq_{who}_{k}_{i}", im, 420)
        print(f.stem)
    if (RAW / "alert_words.png").exists():
        for name, im in zip(WORDS, cells(RAW / "alert_words.png", 3, 3)):
            if im is not None: save(man, f"ui/alert_{name}", im, 900)
        print("alert_words")
    if (RAW / "alert_cracks.png").exists():
        for i, im in enumerate(cells(RAW / "alert_cracks.png", 3, 2)):
            if im is not None: save(man, f"fx/crack_{i}", im, 600)
        print("alert_cracks")
    for group, (chars, c, r) in GROUPS.items():
        for style in ("sharp", "cute"):
            f = RAW / f"gl_{group}_{style}.png"
            if not f.exists(): continue
            for ch, im in zip(chars, cells(f, c, r)):
                if im is not None: save(man, f"fx/gl_{style}_u{ord(ch):x}", im, 320)
            print(f.stem)
    for i in range((len(SPELL) + 8) // 9):
        f = RAW / f"gl_spell_{i}.png"
        if not f.exists(): continue
        for ch, im in zip(SPELL[i * 9:i * 9 + 9], cells(f, 3, 3)):
            if im is not None: save(man, f"fx/gl_sharp_u{ord(ch):x}", im, 320)
        print(f.stem)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
