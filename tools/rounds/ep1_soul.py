"""Episode 1's escort (DESIGN「停留点不只是一个镜头、一种打法」 狙击护卫, user 2026-10-20: the girls far off, sniping; something out there
to keep safe and the monsters going for it; what hits it hurts the girls too): the honey maggot had the mistress's lost child inside it -
its core was her soul. When it falls the soul comes out and walks home across the netherworld toward the way to the studio (where the
mother waits), and everything that crawls out of the honey goes for it. The girls are up on a floating island's edge, sniping
(tuning/shots.json escort: the scope's narrow view, only their shoulders and guns).
A new stage after the maggot: set ep1_nether, station ne2 (escort, its waves coming in along the soul's way, a close look at it first).
Writes into episode 1's level pack (tools/packs.py: wherever ep1_nether and episode 1 are). Idempotent.
usage: python -I tools/rounds/ep1_soul.py"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)

L = lambda zh, en, ja: {"zh": zh, "en": en, "ja": ja}
# (user 2026-10-22: the soul was far too far off - 22 to 50 m - sniping is not that far; where it went was not plain; it reached the end
# and still a wave came; then a door opened that was nowhere in the place): its way 9 to 18 m in front, across the view, to a door that
# stands alone out in the open field (no wall: the way home) - in sight from the start; there it goes into the light and the door opens
PATH = [[-12.6, 0.9, -2.4], [-8.6, 0.9, -3.9], [-4.7, 0.9, -5.5], [-1.7, 0.9, -7.4]]
DOOR = {"at": [-0.6, 0, -8.6], "h": 4.4}   # (a doorway of light: escort.js makeDoor)
WHO = "ep1/soul_child"   # (R69: her picture; until it is in, a soft light: escort.js soul)

def wave(*entries): return list(entries)

NE2 = {
    "shot": "escort",
    "cam": [-12.5, 3.4, 7.5], "look": [2.5, 0.6, -27],
    "covers": [{"k": "cover/ep1_hall1", "side": -1}, {"k": "cover/ep1_hall2", "side": 1}],
    "escort": {"who": WHO, "path": PATH, "speed": 0.55, "hp": 620, "h": 1.15, "loop": 1, "door": DOOR, "name": L("孩子的灵魂", "THE CHILD'S SOUL", "子どもの魂")},
    "on": {"arrive": [
        {"at": 0, "cam": {"on": PATH[0], "dist": 3.2, "up": 0.2, "hold": 2.6, "orbit": 0.5, "dolly": 8, "title": L("孩子的灵魂", "THE CHILD'S SOUL", "子どもの魂")},
         "sfx": "clear", "flash": [0.5, "#fff2d0"]},
        {"at": 0.4, "mv": {"slam": L("护送她回家", "TAKE HER HOME", "おうちまで"), "sub": L("送她走到那扇门", "GET HER TO THAT DOOR", "あの扉まで送って")}},
        {"at": 3.4, "say": "scare", "who": 0, "force": True},
    ], "clear": [
        {"at": 0, "mv": {"wall": L("回家了", "HOME", "おかえり"), "life": 1.2}, "say": "clear", "who": "both", "force": True},
    ]},
    "waves": [
        wave({"type": "ghoul", "ahead": 6, "side": -3, "from": "burrow"}, {"type": "ghoul", "ahead": 9, "side": 3, "from": "burrow"},
             {"type": "bat", "ahead": 5, "side": 2, "y": 3.2}),
        wave({"type": "scoopling", "count": 4, "ahead": 5, "side": -2.5, "from": "burrow"}, {"type": "crawler", "ahead": -2, "side": 1.5, "from": "burrow"},
             {"type": "bat", "ahead": 8, "side": -2, "y": 3.4}, {"type": "doll", "ahead": 12, "side": 4.5}),
        wave({"type": "ghoul", "ahead": 3, "side": -3, "from": "burrow"}, {"type": "teacup", "count": 3, "ahead": 7, "side": 2.5, "from": "burrow"},
             {"type": "bat", "count": 2, "ahead": 6, "side": 0, "y": 3.6}, {"type": "crawler", "ahead": 10, "side": -1, "from": "burrow"}),
        wave({"type": "doll", "ahead": 9, "side": -4.5}, {"type": "ghoul", "ahead": 4, "side": 3, "from": "burrow"}, {"type": "ghoul", "ahead": 6, "side": -2, "from": "burrow"},
             {"type": "scoopling", "count": 3, "ahead": -3, "side": 2, "from": "burrow"}),
    ],
}

if __name__ == "__main__":
    sp = packs.data_file("sets", "ep1_nether"); D = packs.load(sp)
    D["ep1_nether"]["stations"]["ne2"] = NE2
    packs.dump(sp, D)
    ep = packs.data_file("episodes", "ep1"); E = packs.load(ep)
    st = [s for s in E["ep1"]["steps"] if s.get("stage") != "soul"]
    i = [k for k, s in enumerate(st) if s.get("boss") == "maggot"][0]
    st.insert(i + 1, {"stage": "soul", "set": "ep1_nether", "stations": ["ne2"], "name": L("灵魂的归途", "THE SOUL GOES HOME", "魂の帰り道"),
                      "thumb": st[i].get("thumb") or "ui/sel_thumb_ep1_pit"})
    # (after it the door opens into the lady's room - the soul went into the doorway of light, and the door of her studio opens: user
    # 2026-10-22, wanted back after it had been taken out)
    k = st.index(next(s for s in st if s.get("stage") == "soul"))
    if not (k + 1 < len(st) and st[k + 1].get("door")):
        st.insert(k + 1, {"door": {"frame": "ep1/door9_frame", "leaf": "ep1/door9_leaf", "leaves": 2, "hinge": "left"}})
    E["ep1"]["steps"] = st
    packs.dump(ep, E)
    print("ok", sp.relative_to(ROOT), ep.relative_to(ROOT))
