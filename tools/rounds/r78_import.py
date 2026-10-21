"""Round 78's chase pictures into the prologue's level pack (tools/rounds/job_specs78.py): the possessed girl as the chase sees her ->
boss/qq_chase_<pose>_<v> (run, corner - cut by its left edge, the white outline along the cut trimmed off -, lunge); the girls' cut-in faces
-> ep0/cut_<girl>_<moment>_<v> (src/battle/ride.js insert; tools/rounds/ep0_rework.py dash). Trimmed to what is drawn, 1024 px on the
long side, WebP. The cat girl's paw with its seal: the one tools/seal_fix.py put the canonical seal on (art/raw/r78/seal/,
art/seal_placements.json r78_*); the twin-tail girl's are cut at the waist (Codex drew her down to the thighs).
usage: python -I tools/rounds/r78_import.py [name ...]   (a name: qq_run_a, pink_lookback_b ...; default every picture there is)"""
import pathlib, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402

RAW = ROOT / "art" / "raw" / "r78"


def put(man, key, im):
    if key not in man: man.pk["ep0"][key] = {}; man.where[key] = "ep0"
    d = man.dir(key) / "assets" / key.split("/")[0]; d.mkdir(parents=True, exist_ok=True)
    s = 1024 / max(im.size)
    if s < 1: im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    im.save(d / f"{key.split('/')[1]}.webp", quality=90, method=6)
    man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height}; print(key, im.size)


def run(raw, want=()):   # (round 79's retort faces come in the same way: r79_import.py)
    man = packs.manifest()
    for f in sorted(raw.glob("*.png")):
        n = f.stem
        if want and n not in want: continue
        if n in SEALED and not (raw / "seal" / f.name).exists(): continue   # (its seal not put right)
        im = Image.open(raw / "seal" / f.name if (raw / "seal" / f.name).exists() else f).convert("RGBA"); im = im.crop(im.getchannel("A").point(lambda x: 255 if x > 24 else 0).getbbox())
        if n.startswith("pink_") or n.startswith("cat_retort"): im = im.crop((0, 0, im.width, round(im.height * 0.56)))   # (above the waist; the cat girl's tail below it)
        if n.startswith("qq_corner"): im = im.crop((int(im.width * 0.012), 0, im.width, im.height))   # (the outline drawn along the cut)
        key = f"boss/qq_chase_{n[3:]}" if n.startswith("qq_") else f"ep0/cut_{n}"
        put(man, key, im)
    man.save(); print("ok")


SEALED = {"cat_startled_a", "cat_startled_b", "cat_retort_a", "cat_retort_b"}   # (the cat girl's pictures showing the back of her paw: only with the
# canonical seal on, art/raw/rNN/seal/)

if __name__ == "__main__":
    run(RAW, set(sys.argv[1:]))
