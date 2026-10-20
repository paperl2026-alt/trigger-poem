"""Episode 1's cinematic stop (DESIGN「停留点不只是一个镜头、一种打法」 演出镜头: no fight, no HUD, no girls, only what happens): after the
studio's fight the camera goes alone along the four emptied portraits (the shades came out of them: the frames hang empty, the paint
running), and up to the mistress's own portrait at the end, which bleeds as it wakes - then the boss stop. A station "st2" with a cue
timeline (src/battle/cues.js: cam, burst, mv, say...) in the studio stage, between st1 and the boss. Writes into episode 1's level pack.
Idempotent.
usage: python -I tools/rounds/ep1_cine.py"""
import pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402

L = lambda zh, en, ja: {"zh": zh, "en": en, "ja": ja}
X = 4.4   # the walls (hall x0 / x1 = -4.5 / 4.5)
ST2 = {
    "shot": "cine",
    "cam": [0, 1.3, 2.5], "look": [0, 2.6, -14],
    "cine": [
        {"at": 0.0, "cam": {"on": [-X, 3.6, -4], "dist": 2.8, "side": 0.6, "up": -0.3, "in": 0.9, "hold": 1.3, "out": 0.5}, "sfx": "creak"},
        {"at": 0.2, "cam": {"on": [X, 3.6, -7], "dist": 2.8, "side": -0.6, "up": -0.3, "in": 0.6, "hold": 1.1, "out": 0.5}},
        {"at": 0.4, "cam": {"on": [-X, 3.6, -10], "dist": 2.8, "side": 0.6, "up": -0.3, "in": 0.6, "hold": 1.1, "out": 0.5}, "sfx": "creak"},
        {"at": 0.6, "cam": {"on": [X, 3.6, -13], "dist": 2.8, "side": -0.6, "up": -0.3, "in": 0.6, "hold": 1.1, "out": 0.5}},
        {"at": 0.8, "shake": 0.9, "sfx": "madness", "burst": [1.4, [1, 3, 5, 2], 0.14, "#1a0010", "#ff5aa8"],
         "cam": {"on": [0, 3.0, -15.6], "dist": 5.0, "up": -0.8, "in": 1.2, "hold": 2.8, "out": 0.8, "orbit": 0.35, "dolly": 14,
                 "title": L("夫人的画像", "HER PORTRAIT", "夫人の肖像")}},
        {"at": 1.4, "mv": {"wall": L("妈妈", "MAMA", "ママ"), "life": 1.4}},
        {"at": 2.2, "say": "scare", "who": "both", "force": True},
    ],
}

if __name__ == "__main__":
    sp = packs.data_file("sets", "ep1_studio"); D = packs.load(sp)
    D["ep1_studio"]["stations"]["st2"] = ST2
    packs.dump(sp, D)
    ep = packs.data_file("episodes", "ep1"); E = packs.load(ep)
    for s in E["ep1"]["steps"]:
        if s.get("stage") == "studio" and "st2" not in s["stations"]: s["stations"].append("st2")
    packs.dump(ep, E)
    print("ok")
