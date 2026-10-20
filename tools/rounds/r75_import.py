"""Round 75's IV-drip spirits into the prologue's level pack (tools/rounds/job_specs75.py): the healers the prologue boss's fourth form calls
up (src/battle/thing.js heal). Each picked 3 x 2 sheet is cut into its six poses and put on one canvas -> enemy/drip_<pose>,
enemy/drip_b_<pose>, enemy/drip_c_<pose>; the kind goes into levels/ep0/enemies.json as "drip" (a flyer that only heals; its frames:
fly, channel, hurt), and the boss's heal.type is set to it.
Then: python -I tools/pad_frames.py "enemy/drip*" and python -I tools/relief.py "enemy/drip*" (it prints them at the end).
usage: python -I tools/rounds/r75_import.py [a b c]"""
import sys, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402
from r23_import import cells  # noqa: E402
from r53_import import canvas, put  # noqa: E402

RAW = ROOT / "art" / "raw" / "r75"
POSES = ["fly0", "fly1", "idle", "channel", "windup", "hurt"]

if __name__ == "__main__":
    picks = sys.argv[1:] or ["a", "b", "c"]
    man = packs.manifest(); variants = []
    for i, v in enumerate(picks):
        pre = "drip" if i == 0 else f"drip_{'bcd'[i - 1]}"; variants.append(pre)
        for name, can, extra in canvas(list(zip(POSES, cells(RAW / f"drip_{v}.png"))), "center"):
            key = f"enemy/{pre}_{name}"
            if key not in man: man.pk["ep0"][key] = {}; man.where[key] = "ep0"   # (the prologue's level pack: tools/packs.py)
            put(man, key, can, hit=True, **extra)
        print(pre, can.size, v)
    man.save()
    f = packs.data_file("enemies", "drip") or packs.data_files("ep0", "enemies")[0]; D = packs.load(f)
    D["drip"] = {"beh": "flyer", "name": {"zh": "点滴瓶幽灵", "en": "IV Drip Spirit", "ja": "点滴おばけ"}, "sprite": "drip", "variants": variants,
                 "hp": 130, "h": 1.6, "screen": 0.2, "windup": 1.0, "poise": 16, "first": "fly0",
                 "frames": {"fly": ["fly0", "fly1", "idle", "fly1"], "channel": ["channel"], "windup": ["windup"], "dive": ["windup"], "hurt": ["hurt"]},
                 "scar": "splat", "scarColor": "#ff8ab0"}
    packs.dump(f, D); print(f.relative_to(ROOT))
    bf = ROOT / "public" / "content" / "base" / "levels" / "ep0" / "bosses.json"; B = packs.load(bf); B["qq"]["heal"]["type"] = "drip"; packs.dump(bf, B)
    print('next: python -I tools/pad_frames.py "enemy/drip*" ; python -I tools/relief.py "enemy/drip*"')
