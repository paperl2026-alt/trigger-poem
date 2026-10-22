"""Round 90's popsicle skeleton (tools/rounds/job_specs90.py: the cold store's own monster) into the episode 1 pack: the three picked
designs (a, c, e; b's bite pose had a box drawn behind it, d was refused) cut from their 3 x 2 sheets into the gelato ghoul's pose names
-> enemy/popsicle_<pose>, enemy/popsicle_b_<pose>, enemy/popsicle_c_<pose>; then the white-outline margin (tools/pad_frames.py) and the
relief (tools/relief.py).
usage: python -I tools/rounds/r90_import.py"""
import pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402
from r23_import import cells  # noqa: E402
from r53_import import put, canvas  # noqa: E402

R90 = ROOT / "art" / "raw" / "r90"
POSES = ["walk0", "walk1", "crouch", "leap", "bite", "hurt"]
PICK = {"popsicle": "a", "popsicle_b": "c", "popsicle_c": "e"}


def main():
    man = packs.manifest()
    for pre, v in PICK.items():
        for name, can, extra in canvas(list(zip(POSES, cells(R90 / f"m_popsicle_{v}.png"))), "bottom"):
            key = f"enemy/{pre}_{name}"
            if key not in man: man.pk["ep1"][key] = {}; man.where[key] = "ep1"
            put(man, key, can, hit=True, **extra)
        print(pre, can.size)
    man.save()
    ks = [f"enemy/{k}_*" for k in PICK]
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "pad_frames.py"), *ks], check=True)
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "relief.py"), *ks], check=True)
    print("ok")


if __name__ == "__main__":
    main()
