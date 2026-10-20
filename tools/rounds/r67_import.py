"""Round 67 (tools/rounds/job_specs67.py, art/raw/r67): covers that come crashing down into their place (cover "fall", DESIGN「掩体」)
-> cover/fall_<name> (trimmed, at most 1400 px wide, solidTop: where the solid body starts), then their depth relief (tools/relief.py).
The sets put them at a few stops (sets/ep0.json, sets/ep1.json by hand, episode 2 in tools/rounds/ep2_level.py).
usage: python -I tools/rounds/r67_import.py"""
import sys, json, pathlib, subprocess
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r67"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)
from r54_import import save, trimmed

if __name__ == "__main__":
    man = packs.manifest()
    n = 0
    for f in sorted(RAW.glob("cover_*.png")):
        im = trimmed(Image.open(f).convert("RGBA"))
        if im.width > 1400: im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
        cov = (np.asarray(im.getchannel("A")) > 128).mean(1)
        key = f"cover/fall_{f.stem[6:]}"; save(man, key, im, solidTop=round(int(np.argmax(cov > 0.6)) / im.height, 3)); n += 1; print(key, im.size)
    man.save()
    if n: subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "relief.py"), "cover/fall_*"], check=True, stdin=subprocess.DEVNULL)
