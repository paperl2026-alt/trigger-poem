"""Round 91 (tools/rounds/job_specs91.py: the oven kitchen's, the honey tunnel's and the netherworld's own monsters, and the tunnel's
great larva) into the episode 1 pack, cut from their 3 x 2 sheets (picked designs below) -> enemy/<kind>[_b|_c]_<pose>; a bite pose drawn
up to its cell's edges (cut off straight: most of this round's) is left out and the lunge stands in for it; then the white-outline
margin (tools/pad_frames.py) and the relief (tools/relief.py).
usage: python -I tools/rounds/r91_import.py"""
import pathlib, subprocess, sys
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402
from r23_import import cells  # noqa: E402
from r53_import import put, canvas  # noqa: E402

R91 = ROOT / "art" / "raw" / "r91"
WALK = ["walk0", "walk1", "crouch", "leap", "bite", "hurt"]
MON = {   # kind -> picked designs (the first is the main one), poses
    "ginger": ("bcd", WALK),
    "larva": ("abc", WALK),
    "tar": ("cde", WALK),
    "larva_queen": ("b", ["hover0", "hover1", "idle", "windup", "blast", "hurt"]),
}


def boxed(im):
    """cut off straight at its cell's edge: a long run of solid pixels along a side of its box"""
    a = np.asarray(im)[..., 3] > 40
    return max(a[0].mean(), a[-1].mean(), a[:, 0].mean(), a[:, -1].mean()) > 0.3


def main():
    man = packs.manifest()
    for kind, (picks, poses) in MON.items():
        for i, v in enumerate(picks):
            pre = kind if i == 0 else f"{kind}_{'bc'[i - 1]}"
            ims = cells(R91 / f"m_{kind}_{v}.png")
            if "bite" in poses and boxed(ims[poses.index("bite")]): ims[poses.index("bite")] = ims[poses.index("leap")]; print(pre, "bite -> leap")
            for name, can, extra in canvas(list(zip(poses, ims)), "bottom"):
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
