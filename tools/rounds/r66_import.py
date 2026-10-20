"""Round 66 (tools/rounds/job_specs66.py, art/raw/r66): episode 2's loose things, four per place -> prop/ep2s_<place>_<name> (trimmed,
at most 1100 px, a hit mask so shots only stop on the drawn part), then their depth relief (tools/relief.py). tools/rounds/ep2_level.py
stands them about the places as the sets' "props" (rigid bodies in the game: docs/TECH.md「物理」).
usage: python -I tools/rounds/r66_import.py"""
import sys, json, pathlib, subprocess
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r66"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)
from r54_import import save, trimmed

if __name__ == "__main__":
    man = packs.manifest()
    keys = []
    for f in sorted(RAW.glob("prop_*.png")):
        im = trimmed(Image.open(f).convert("RGBA"))
        if max(im.size) > 1100: s = 1100 / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        key = f"prop/ep2s_{f.stem[5:]}"; save(man, key, im, hit=True); keys.append(key); print(key, im.size)
    man.save()
    if keys: subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "relief.py"), "prop/ep2s_*"], check=True, stdin=subprocess.DEVNULL)
