"""Round 34: the R23 monster sheets with their drawn-in attack effects removed (tools/job_specs34.py, art/raw/r34) replace the frames
enemy/<kind>_<pose> (same slicing as tools/r23_import.py). Then the relief maps of those frames: tools/relief.py with their keys.
usage: python -I tools/r34_import.py"""
import sys, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
A = ROOT / "public" / "content" / "base" / "assets"
sys.path.insert(0, str(ROOT / "tools"))
from r23_import import frames, SHEETS, REF

if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    for kind in ("horn", "frame", "board"):
        eid, poses, anchor = SHEETS[kind]
        for name, can, extra in frames(ROOT / "art" / "raw" / "r34" / f"{kind}.png", poses, anchor, REF.get(eid, 0)):
            key = f"enemy/{eid}_{name}"
            can.save(A / f"{key}.webp", quality=90, method=6)
            man[key] = {**{k: v for k, v in man.get(key, {}).items() if k == "relief"}, "src": f"assets/{key}.webp", "w": can.width, "h": can.height,
                        "hit": True, **extra}
        print(eid, can.size, extra)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
