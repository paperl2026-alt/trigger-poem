"""Round 87's four studio shadows (tools/rounds/job_specs87.py) into the episode 1 pack as enemy/shade_<id>_<pose>, cut from their 3 x 2
sheets into the same pose names as before (R56: tools/rounds/r56_import.py), so enemies.json frames still fit; then the white-outline
margin (tools/pad_frames.py) and the relief (tools/relief.py).
usage: python -I tools/rounds/r87_import.py"""
import pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402
from r23_import import cells  # noqa: E402
from r53_import import put, canvas  # noqa: E402

R87 = ROOT / "art" / "raw" / "r87"
MON = {
    "shade_hostess": (R87 / "shade_hostess.png", ["stand", "glide", "idle", "windup", "throw", "hurt"], "bottom"),
    "shade_mourner": (R87 / "shade_mourner.png", ["hover0", "hover1", "idle", "windup", "wail", "hurt"], "bottom"),
    "shade_mother":  (R87 / "shade_mother.png", ["rock", "glide", "idle", "windup", "throw", "hurt"], "bottom"),
    "shade_bride":   (R87 / "shade_bride.png", ["stand", "walk", "idle", "crouch", "rush", "hurt"], "bottom"),
}


def main():
    man = packs.manifest()
    for kind, (src, poses, anchor) in MON.items():
        for name, can, extra in canvas(list(zip(poses, cells(src))), anchor):
            key = f"enemy/{kind}_{name}"
            if key not in man: man.pk["ep1"][key] = {}; man.where[key] = "ep1"
            man[key] = {}   # (the old picture's margin and relief do not fit the new one: made again below)
            put(man, key, can, hit=True, **extra)
        print(kind, can.size)
    man.save()
    ks = [f"enemy/{k}*" for k in MON]
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "pad_frames.py"), *ks], check=True)
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "relief.py"), *ks], check=True)
    print("ok")


if __name__ == "__main__":
    main()
