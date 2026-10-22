"""Episode 1's escort (DESIGN「停留点不只是一个镜头、一种打法」 狙击护卫, user 2026-10-20: the girls far off, sniping; something out there
to keep safe and the monsters going for it; what hits it hurts the girls too): the honey maggot had the mistress's lost child inside it -
its core was her soul. When it falls the soul comes out and walks home across the netherworld toward the way to the studio (where the
mother waits), and everything that crawls out of the honey goes for it. The girls are up on a floating island's edge, sniping
(tuning/shots.json escort: the scope's narrow view, only their shoulders and guns).
A new stage after the maggot: set ep1_nether, station ne2 (escort, its waves coming in along the soul's way, a close look at it first).
Writes into episode 1's level pack (tools/packs.py: wherever ep1_nether and episode 1 are). Idempotent.
usage: python -I tools/rounds/ep1_soul.py"""
import json, math, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)

L = lambda zh, en, ja: {"zh": zh, "en": en, "ja": ja}
# (user 2026-10-22: the soul was far too far off - 22 to 50 m - sniping is not that far; where it went was not plain; it reached the end
# and still a wave came; then a door opened that was nowhere in the place): its way 9 to 18 m in front, across the view, to a door that
# stands alone out in the open field (no wall: the way home) - in sight from the start; there it goes into the light and the door opens
# (then, a third time: still tiny, smaller than the sight - the camera walks along beside her, follow, a few metres off, across the
# field from left to right; the door at the far end of her way, coming into view as she nears it)
PATH = [[-10.5, 1.2, -2.0], [-5.5, 1.2, -3.6], [-0.5, 1.2, -5.0], [4.5, 1.2, -6.2], [8.0, 1.2, -7.0]]
DOOR = {"at": [9.4, 0, -7.6], "h": 4.4}   # (a doorway of light: escort.js makeDoor)
FOLLOW = {"dist": 6.5, "y": 1.75, "lead": 2.2, "lookY": 1.3, "ease": 1.6}
_tx, _tz = PATH[1][0] - PATH[0][0], PATH[1][2] - PATH[0][2]; _n = math.hypot(_tx, _tz); _tx, _tz = _tx / _n, _tz / _n
CAM = [round(PATH[0][0] - _tz * FOLLOW["dist"], 2), FOLLOW["y"], round(PATH[0][2] + _tx * FOLLOW["dist"], 2)]   # (where the walk-along starts: beside her, on the near side)
LOOK = [round(PATH[0][0] + _tx * FOLLOW["lead"], 2), FOLLOW["lookY"], round(PATH[0][2] + _tz * FOLLOW["lead"], 2)]
WHO = "ep1/soul_child"   # (R69: her picture; until it is in, a soft light: escort.js soul)

# (user 2026-10-22: the child and the monsters bigger while she is taken home - out here on the open field, far off: 1.4 times their
# kinds' own size, levels/ep1/enemies.json h; then: to be seen, not only to be there)
_E = json.loads((pathlib.Path(__file__).resolve().parents[2] / "public/content/base/levels/ep1/enemies.json").read_text(encoding="utf-8"))
def wave(*entries): return [{**e, "h": round(_E[e["type"]]["h"] * 1.4, 2)} for e in entries]

NE2 = {
    "shot": "escort",
    "cam": CAM, "look": LOOK,
    # (no covers, no girls on screen: the whole picture is the field - user 2026-10-22; tuning/shots.json escort)
    "escort": {"who": WHO, "path": PATH, "speed": 0.48, "hp": 620, "h": 2.4, "loop": 0, "door": DOOR, "oneShot": True, "touch": 80, "share": 0.3, "gap": 7.0, "follow": FOLLOW,
               "look": {"tint": "#2a0a3a", "tintAmt": 0.45, "outlineW": 2.2}, "name": L("孩子的灵魂", "THE CHILD'S SOUL", "子どもの魂")},
    "on": {"arrive": [
        {"at": 0, "cam": {"on": PATH[0], "dist": 3.2, "up": 0.2, "hold": 2.6, "orbit": 0.5, "dolly": 8, "title": L("孩子的灵魂", "THE CHILD'S SOUL", "子どもの魂")},
         "sfx": "clear", "flash": [0.5, "#fff2d0"]},
        {"at": 0.4, "mv": {"slam": L("护送她回家", "TAKE HER HOME", "おうちまで"), "sub": L("送她走到那扇门", "GET HER TO THAT DOOR", "あの扉まで送って")}},
        {"at": 3.4, "say": "scare", "who": 0, "force": True},
    ], "clear": [
        {"at": 0, "mv": {"wall": L("回家了", "HOME", "おかえり"), "life": 1.2}, "say": "clear", "who": "both", "force": True},
    ]},
    # (a steady stream of ground monsters, from ahead of her and from behind by turns - the sight swung back and forth; one shot each;
    # none of them flying, none throwing; each comes up out of the honey well clear of her - escort gap - and walks at her)
    "waves": [   # (in from the right edge of the frame - ahead of her - and the left - behind her - by turns, on the far side of her way;
                 # the netherworld's own kind: the tar guests, R91 - user 2026-10-22, one kind to a place)
        wave({"type": "tar", "count": 3, "every": 1.1, "ahead": 8, "side": -2.5, "from": "burrow"}, {"type": "tar", "count": 3, "every": 0.9, "t": 1.6, "ahead": -7.5, "side": -3, "from": "burrow"}),
        wave({"type": "tar", "count": 3, "every": 1.0, "ahead": -7.5, "side": -2, "from": "burrow"}, {"type": "tar", "count": 3, "every": 1.1, "t": 1.4, "ahead": 8.5, "side": -1.5, "from": "burrow"}),
        wave({"type": "tar", "count": 4, "every": 0.7, "ahead": 8, "side": -3.5, "from": "burrow"}, {"type": "tar", "count": 2, "every": 1.2, "t": 1.4, "ahead": -8, "side": -2.5, "from": "burrow"}),
        wave({"type": "tar", "count": 3, "every": 0.8, "ahead": -8, "side": -1.5, "from": "burrow"}, {"type": "tar", "count": 3, "every": 1.0, "t": 1.0, "ahead": 8, "side": -3, "from": "burrow"}),
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
