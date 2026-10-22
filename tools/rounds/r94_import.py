"""Round 94 (tools/rounds/job_specs94.py: each room of episode 1 its own small swarm flyer) into the episode 1 pack, cut from their 3 x 2
sheets (picked designs below, every one of them a look of the same kind) -> enemy/<kind>[_b|_c]_<pose> with the wafer bat's poses; then
the white-outline margin (tools/pad_frames.py) and the relief (tools/relief.py).
usage: python -I tools/rounds/r94_import.py"""
import pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402
from r23_import import cells  # noqa: E402
from r53_import import put, canvas  # noqa: E402

R94 = ROOT / "art" / "raw" / "r94"
FLY = ["fly0", "fly1", "idle", "windup", "dive", "hurt"]   # (the wafer bat's: r53_import MON bat)
MON = {"moth": "abc", "helm": "abc", "cherry": "bc", "plane": "abc", "sugarfly": "abc", "deathmoth": "abc"}   # (cherry a was refused)


def main():
    man = packs.manifest()
    for kind, picks in MON.items():
        for i, v in enumerate(picks):
            pre = kind if i == 0 else f"{kind}_{'bc'[i - 1]}"
            for name, can, extra in canvas(list(zip(FLY, cells(R94 / f"m_{kind}_{v}.png"))), "center"):
                key = f"enemy/{pre}_{name}"
                if key not in man: man.pk["ep1"][key] = {}; man.where[key] = "ep1"
                put(man, key, can, hit=True, **extra)
            print(pre, can.size)
    man.save()
    ks = [f"enemy/{k}_*" for k in MON]
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "pad_frames.py"), *ks], check=True)
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "relief.py"), *ks], check=True)
    print("ok")


if __name__ == "__main__":
    main()
