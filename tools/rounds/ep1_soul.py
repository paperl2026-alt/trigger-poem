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
PATH = [[-8, 0.9, -14], [-4, 0.9, -21], [1, 0.9, -24], [5, 0.9, -30], [9, 0.9, -35], [12, 0.9, -41]]
WHO = "ep1/soul_child"   # (R69: her picture; until it is in, a soft light: escort.js soul)

def wave(*entries): return list(entries)

NE2 = {
    "shot": "escort",
    "cam": [-12.5, 3.4, 7.5], "look": [2.5, 0.6, -27],
    "covers": [{"k": "cover/ep1_hall1", "side": -1}, {"k": "cover/ep1_hall2", "side": 1}],
    "escort": {"who": WHO, "path": PATH, "speed": 0.7, "hp": 620, "h": 1.15, "loop": 1, "name": L("孩子的灵魂", "THE CHILD'S SOUL", "子どもの魂")},
    "on": {"arrive": [
        {"at": 0, "cam": {"on": PATH[0], "dist": 3.2, "up": 0.2, "hold": 2.6, "orbit": 0.5, "dolly": 8, "title": L("孩子的灵魂", "THE CHILD'S SOUL", "子どもの魂")},
         "sfx": "clear", "flash": [0.5, "#fff2d0"]},
        {"at": 0.4, "mv": {"slam": L("护送她回家", "TAKE HER HOME", "おうちまで"), "sub": L("别让任何东西碰到她", "LET NOTHING TOUCH HER", "なにも触れさせないで")}},
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
    E["ep1"]["steps"] = st
    packs.dump(ep, E)
    print("ok", sp.relative_to(ROOT), ep.relative_to(ROOT))
