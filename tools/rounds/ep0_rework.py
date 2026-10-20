"""The prologue redone after DESIGN「总纲」 (user 2026-10-20: the world as big as it is and real, the picture only a window on it - never a
box with all five faces in view; the monsters come in every reasonable way, not only through holes they break; each stop one corner where
one thing happens). Writes the prologue's level pack (levels/ep0/sets.json); idempotent, run again after changing it.
  classroom: one room of a school that goes on - out of its windows the real yard two floors down, a row of trees, the other wing across
  the yard and the sky (src/battle/scenery.js); two of its four doors really open (side-wall doorways, panels.js buildWay); desks in
  rows. Two corners: from the back corner across the desks to the blackboard and the windows; from the front corner back to the
  lockers and the back door. The monsters: desk spiders out from under the desks, textbook moths in at the windows, chairs and the shoe
  mimic through the doors, the blackboard teacher up from behind the teacher's desk, the PA siren down out of the ceiling speaker.
usage: python -I tools/rounds/ep0_rework.py"""
import pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402   (the content files' own layout)
F = ROOT / "public" / "content" / "base" / "levels" / "ep0" / "sets.json"

def classroom(S):
    H = S["hall"]
    H.update({"x0": -5.5, "x1": 5.5, "z0": 8, "z1": -8, "h": 3.4, "bay": 4, "tile": 3, "tilesX": 4, "tileL": 1.5,
              "back": ["st0/back1", "st0/back2", "st0/back3"]})
    for k in ("outside", "outsideAt", "outsideX"): H.pop(k, None)
    # the doors: the painted door at the -z end of the first and the last bay of the right wall, cut open (side-wall doorways)
    door = {"kind": "slide", "k": ["ep0/cls_door"], "side": -1}   # (its leaf slides back along the wall: tools/rounds/r73_import.py)
    H["ways"] = [{"id": "dback", "wall": "right", "z0": 4.1, "z1": 4.95, "y0": 0, "y1": 2.45, "depth": 3, "door": door},
                 {"id": "dfront", "wall": "right", "z0": -7.9, "z1": -7.05, "y0": 0, "y1": 2.45, "depth": 3, "door": door}]
    # out of the windows (left wall): the yard below, trees, the other wing across it, the sky - real pieces, far off
    S["scenery"] = [
        {"kind": "slab", "at": [-48, -4.2, 0], "size": [84, 0.2, 150], "tex": {"top": "st4/ground1"}, "tile": [9, 9]},
        {"kind": "box", "at": [-78, -4.2, 0], "size": [14, 22, 150], "tex": {"right": "st4/front1"}, "tile": [44, 22], "fog": False, "color": "#d8c8d0"},
        {"kind": "card", "at": [-12, -4.2, -26], "size": [17, 11], "ry": 90, "tex": "st4/side1", "alpha": True},
        {"kind": "card", "at": [-12.5, -4.2, -9], "size": [17, 11], "ry": 90, "tex": "st4/side2", "alpha": True},
        {"kind": "card", "at": [-12, -4.2, 8], "size": [17, 11], "ry": 90, "tex": "st4/side3", "alpha": True},
        {"kind": "card", "at": [-12.5, -4.2, 25], "size": [17, 11], "ry": 90, "tex": "st4/side4", "alpha": True},
        {"kind": "sky", "at": [0, -80, 0], "size": [240, 360], "tex": "st4/sky", "tile": [500, 360]},
    ]
    # desks in rows across the bigger room, the teacher's desk at the front
    desks, kinds = [], ["prop/desk1", "prop/desk2", "prop/desk1", "prop/desk3", "prop/desk2", "prop/desk1", "prop/desk4"]
    i = 0
    for z in (3.2, 0.8, -1.6, -4.0):
        for x in (-3.4, -1.7, 0, 1.7, 3.4):
            desks.append({"k": kinds[i % len(kinds)], "h": 0.95, "x": x, "z": z}); i += 1
    desks.append({"k": "prop/lectern", "h": 1.15, "x": 0.2, "z": -6.6})
    S["props"] = desks
    st = S["stations"]
    # 1: the back corner, across the desks to the blackboard and the windows (the front door at the right edge)
    st["cls1"].update({"via": [[3.6, 1.35, 7.2]], "cam": [3.8, 1.7, 6.6], "look": [-3.2, -0.7, -6.5], "shot": {"kind": "cover", "cam": {"zoom": 14}}})
    W = lambda *e: list(e)
    st["cls1"]["waves"] = [
        W({"t": 0.4, "type": "desk", "x": -1.7, "z": -1.6, "from": "pop"}, {"t": 1.6, "type": "desk", "x": 0.0, "z": -4.0, "from": "pop"}),
        W({"t": 0, "type": "book", "x": -4.5, "z": -2.5, "y": 2.0, "from": "outside"}, {"t": 0.7, "type": "book", "x": -4.5, "z": -4.5, "y": 2.4, "from": "outside"},
          {"t": 1.4, "type": "chair", "from": "door", "way": "dfront"}),
        W({"t": 0, "type": "chair", "from": "door", "way": "dfront"}, {"t": 1.2, "type": "chair", "from": "door", "way": "dfront"},
          {"t": 2.0, "type": "desk", "x": -3.4, "z": -4.0, "from": "pop"}),
        W({"t": 0, "type": "shoe", "from": "door", "way": "dfront"}),
        W({"t": 0, "type": "desk", "x": 1.7, "z": -1.6, "from": "pop"}, {"t": 0.6, "type": "book", "x": -4.5, "z": -1.0, "y": 2.2, "from": "outside"},
          {"t": 1.2, "type": "book", "x": -4.5, "z": -5.0, "y": 1.8, "from": "outside"}, {"t": 2.0, "type": "chair", "from": "door", "way": "dfront"}),
        W({"t": 0, "type": "board", "x": 0.2, "z": -7.0, "from": "pop"}, {"t": 1.0, "type": "chair", "from": "door", "way": "dfront"},
          {"t": 2.2, "type": "shoe", "from": "door", "way": "dfront"}),
    ]
    # 2: the front corner by the teacher's desk, back across the room to the lockers and the back door
    st["cls2"].update({"via": [[0.2, 1.3, 2.0], [-2.6, 1.25, -5.4]], "cam": [-4.4, 1.7, -7.1], "look": [3.6, -0.7, 6.2], "shot": {"kind": "cover", "cam": {"zoom": 14}}})
    st["cls2"]["waves"] = [
        W({"t": 0.4, "type": "board", "from": "door", "way": "dback"}, {"t": 1.6, "type": "desk", "x": 1.7, "z": 0.8, "from": "pop"}),
        W({"t": 0, "type": "clock", "from": "door", "way": "dback"}, {"t": 0.9, "type": "board", "x": -1.7, "z": 3.2, "from": "pop"}),
        W({"t": 0, "type": "desk", "x": 0, "z": 0.8, "from": "pop"}, {"t": 0.7, "type": "chair", "from": "door", "way": "dback"},
          {"t": 1.6, "type": "desk", "x": 3.4, "z": 3.2, "from": "pop"}),
        W({"t": 0, "type": "horn", "x": 0.5, "z": 4.5, "from": "ceiling"}),
        W({"t": 0, "type": "clock", "from": "door", "way": "dback"}, {"t": 1.0, "type": "book", "x": -4.5, "z": 2.0, "y": 2.2, "from": "outside"},
          {"t": 2.2, "type": "chair", "from": "door", "way": "dback"}),
        W({"t": 0, "type": "desk", "x": -1.7, "z": 3.2, "from": "pop"}, {"t": 0.6, "type": "desk", "x": 1.7, "z": 3.2, "from": "pop"},
          {"t": 1.3, "type": "chair", "from": "door", "way": "dback"}, {"t": 2.0, "type": "shoe", "from": "door", "way": "dback"},
          {"t": 2.8, "type": "board", "from": "door", "way": "dback"}),
        W({"t": 0, "type": "horn", "x": -1.0, "z": 4.0, "from": "ceiling"}),
    ]

def outside(side, zc=-10, length=170):
    """the school beyond a row of windows (side: -1 = out past the left wall, 1 = past the right): the yard two floors down, trees, the
    other wing across the yard, the sky - the same school all round (scenery.js)"""
    s, ry = side, 90 if side < 0 else -90
    return [
        {"kind": "slab", "at": [s * 48, -4.2, zc], "size": [84, 0.2, length], "tex": {"top": "st4/ground1"}, "tile": [9, 9]},
        {"kind": "box", "at": [s * 78, -4.2, zc], "size": [14, 22, length], "tex": {("right" if s < 0 else "left"): "st4/front2" if s > 0 else "st4/front1"}, "tile": [44, 22], "fog": False, "color": "#d8c8d0"},
        *[{"kind": "card", "at": [s * (12 + (i % 2) * 0.5), -4.2, z], "size": [17, 11], "ry": ry, "tex": f"st4/side{1 + i % 4}", "alpha": True}
          for i, z in enumerate(range(int(zc + length / 2 - 16), int(zc - length / 2), -16))],
        {"kind": "sky", "at": [0, -80, zc], "size": [max(240, length * 0.9), 360], "tex": "st4/sky", "tile": [500, 360]},
    ]

def entrances(waves, doors, flyX):
    """the old waves' monsters in by the ways a corridor has: walkers out of the classroom doors (or from the far end, out of the fog),
    flyers in at the windows, portraits and the extinguisher out of the wall they hang in, the PA siren down out of the ceiling"""
    n = 0
    for w in waves:
        for e in w:
            ty = e["type"]
            for k in ("x", "y", "from", "way"):
                if k in ("x", "y") and ty not in ("book", "paper", "frame", "ext", "horn"): continue
                e.pop(k, None) if k in ("from", "way") else None
            if ty in ("shoe", "desk", "chair", "clock", "board"):
                if n % 3 == 2: e.pop("x", None); e["z"] = -22   # (from the far end: it comes running out of the fog)
                else: e["from"] = "door"; e["way"] = doors[n % len(doors)]
                n += 1
            elif ty in ("book", "paper"): e["from"] = "outside"; e["x"] = flyX; e.setdefault("y", 2.0)
            elif ty in ("frame", "ext"): e["from"] = "wall"; e["x"] = -1.5
            elif ty == "horn": e["from"] = "ceiling"; e["x"] = 0
    return waves

def corridor(S):
    H = S["hall"]
    H.update({"x0": -2.5, "x1": 2.5, "z0": 6, "z1": -28, "h": 3.4, "tilesX": 4})
    for k in ("outside", "outsideAt", "outsideX"): H.pop(k, None)
    door = {"kind": "slide", "k": ["ep0/cls_door"], "side": 1}
    # three classroom doors in the left wall (the classroom side), the windows on the right (panels.js: left = classrooms, right = windows)
    H["ways"] = [{"id": f"c{i + 1}", "wall": "left", "z0": z, "z1": z + 0.85, "y0": 0, "y1": 2.3, "depth": 3, "door": door} for i, z in enumerate((-2.4, -10.6, -19.2))]
    S["scenery"] = outside(1)
    st = S["stations"]
    # 1: by the windows, across to the classroom doors down the corridor
    st["cor1"].update({"via": [[0, 1.35, 5]], "cam": [1.7, 1.75, 3.6], "look": [-1.6, -0.4, -12], "shot": {"kind": "cover", "cam": {"zoom": 10}}})
    entrances(st["cor1"]["waves"], ["c1", "c2"], 2.0)
    # 2: against the classroom side, across to the windows and the far end (where the corridor folds up when it turns)
    st["cor2"].update({"via": [[0, 1.35, -2.5], [-0.6, 1.3, -8.5]], "cam": [-1.6, 1.75, -9.6], "look": [1.4, -0.4, -26], "shot": {"kind": "cover", "cam": {"zoom": 10}}})
    entrances(st["cor2"]["waves"], ["c2", "c3"], 2.0)

def dash(S):
    """the run out of the building: half way along, the corridor's window side falls away into an open walkway (hall.open), the whole
    school and the sky beside them - the camera goes round outside to film them running along it, then far out, then back in low"""
    H = S["hall"]
    H["open"] = [{"on": "right", "z0": -46, "z1": -104}]
    rail = "#c8c0b8"
    S["scenery"] = outside(1, -70, 340) + [
        {"kind": "box", "at": [3.15, 1.0, -75], "size": [0.07, 0.07, 58], "color": rail},
        {"kind": "box", "at": [3.15, 0.5, -75], "size": [0.05, 0.05, 58], "color": rail},
        {"kind": "box", "at": [3.15, 0, -46.5], "size": [0.07, 1.04, 0.07], "color": rail, "repeat": {"n": 30, "step": [0, 0, -2]}},
    ]
    R = S["stations"]["ds1"]["ride"]
    keep = [m for m in R["marks"] if "cam" not in m or m["at"] in (6, 9, 17, 33, 136)]
    # (inside, by the wall, looking out past them to the open side: the school and the sky behind them as they run)
    keep += [{"at": 49, "cam": {"back": 0.8, "side": -2.6, "up": 1.5, "ahead": 3, "lookUp": 1.2, "ease": 1.0}},
             {"at": 62, "cam": {"back": 3.2, "side": -1.6, "up": 1.8, "ahead": 8, "lookUp": 1.0, "ease": 0.8}},
             {"at": 82, "cam": {"back": 4.2, "side": -0.3, "up": 0.45, "ahead": 10, "lookUp": 1.6, "ease": 1.2}},
             {"at": 98, "cam": {"back": -3.4, "side": 0.4, "up": 1.3, "ahead": -9, "lookUp": 1.0, "ease": 1.4}},
             {"at": 112, "cam": {"back": 2.6, "side": 0.9, "up": 1.4, "ahead": 9, "lookUp": 0.9, "ease": 1.4}}]
    R["marks"] = sorted([m for m in keep if not ("cam" in m and m["at"] in (56, 66, 120))], key=lambda m: m["at"])

HEALER = "drip"   # (round 75's IV-drip spirits: tools/rounds/r75_import.py)

def yard(S, B):
    """the boss in the yard: a giant (about nine metres, more as it mutates) in front of the school, the whole building and the sky
    behind it, the camera low and looking up; it fights from out there and only lunges in at the covers; the yard goes on all round
    (trees, the fence, the other wing) instead of ending in painted side walls"""
    H = S["hall"]
    H.update({"x0": -26, "x1": 26, "z0": 14, "z1": -40})
    H.pop("left", None); H.pop("right", None)   # (open all round: the trees and the far buildings are scenery)
    S["boards"] = [{"k": "st4/front1", "name": "school", "occlude": True, "x": 0.0, "z": -40, "w": 56}]
    S["scenery"] = [
        *[{"kind": "card", "at": [x, 0, z], "size": [17, 11], "ry": ry, "tex": f"st4/side{1 + i % 4}", "alpha": True}
          for i, (x, z, ry) in enumerate([(-24, -28, 60), (-25, -10, 90), (-24, 8, 110), (24, -28, -60), (25, -10, -90), (24, 8, -110)])],
        {"kind": "box", "at": [-60, 0, -10], "size": [14, 22, 120], "tex": {"right": "st4/front2"}, "tile": [44, 22], "fog": False, "color": "#d8c8d0"},
        {"kind": "sky", "at": [0, -80, -10], "size": [260, 380], "tex": "st4/sky", "tile": [520, 380]},
    ]
    st = S["stations"]["yard"]
    st.update({"via": [[0, 1.3, 11.5], [0, 1.2, 8.5]], "cam": [0, 0.95, 6.5], "look": [0, 4.2, -20]})
    B["zone"] = {"x": [-5.5, 5.5], "z": [-16, -11]}
    # its forms' heights (the old ones, 3.8 .. 4.9 m, were a third of the picture from where the girls fight)
    for s, h, y in zip(B["stages"], (8.4, 9.4, 10.8, 10.1, 8.8), (None, None, None, 5.1, 5.7)):
        s["h"] = h
        if y is not None: s["y"] = y
    # its five forms each fight their own way (user 2026-10-20; DESIGN 序章 Boss): walks up and pounds the covers / throws, open only as it
    # throws / zigzag rush, knocked back by damage / calls up small monsters / charges, its weak point jumping about (src/battle/thing.js)
    S1, S2, S3, S4, S5 = B["stages"]
    S1["pattern"] = ["approach"]
    S2["pattern"] = ["throw", "drift", "throw", "throw", "drift"]; S2["guarded"] = True
    S3["pattern"] = ["drift", "zigzag", "drift", "zigzag"]; S3["open"] = ["windup", "dash", "hurt", "back"]
    # (how long each form lasts: about 40 to 70 s each - its share of the health, the whole a little under 6000)
    # (measured on the auto-player: about 15, 19, 17, 7.5 and 15.6 damage a second in each form -> 45, 45, 50, 55 and 60 s)
    B["hp"] = 3720
    for s, at in zip(B["stages"], (1, 0.817, 0.586, 0.363, 0.253)): s["at"] = at
    # (4) healers (user 2026-10-20): they feed her back; healed past where this form began, she returns to the third
    S4["pattern"] = ["heal", "drift", "volley", "heal", "drift", "lunge", "drift"]
    B["heal"] = {"stage": 3, "type": HEALER, "n": 2, "max": 3, "rate": 14}
    S4["summon"] = [{"type": "chair", "from": "burrow", "x": -4, "z": -3}, {"type": "desk", "from": "burrow", "x": 4, "z": -4},
                    {"type": "book", "from": "outside", "x": -6, "y": 3.0, "z": -5}, {"type": "paper", "from": "outside", "x": 6, "y": 2.6, "z": -4},
                    {"type": "shoe", "from": "burrow", "x": 0, "z": -6}]
    S5["pattern"] = ["drift", "charge"]
    S5["cores"] = [[0.32, 0.65, 0.09], [0.73, 0.46, 0.09], [0.39, 0.82, 0.08], [0.19, 0.37, 0.08], [0.69, 0.27, 0.08]]
    B["approach"] = {"speed": 0.9, "speedUp": 3.0, "near": 9.5, "topY": 0.1, "windup": 0.8, "slams": 3, "gap": 0.55, "dmg": 14, "back": 2.2}
    B["throw"] = {"shots": [2, 4], "gap": 1.0, "expose": 1.3, "after": 1.5, "exposedMul": 2.0, "flight": 2.1, "dmg": 14}
    B["zigzag"] = {"windup": 0.9, "legs": 5, "lateral": 3.2, "time": 2.6, "stop": 2.0, "poise": 110, "dmg": 26}
    B["charge"] = {"time": 4.6, "shifts": 3, "poise": 150, "dmg": 34}
    B["summonMax"] = 6
    B["texts"].update({
        "h1": {"zh": "她越挨打走得越快——砸过来时躲进掩体！", "en": "THE MORE YOU HIT HER, THE FASTER SHE COMES - TAKE COVER WHEN SHE POUNDS!", "ja": "撃つほど速く迫ってくる──叩きつけてきたら隠れて!"},
        "h2": {"zh": "她只在扔东西的一瞬露出弱点：打掉飞来的东西，趁机打弱点！", "en": "HER WEAK POINT OPENS ONLY AS SHE THROWS - SHOOT DOWN WHAT FLIES, THEN HIT IT!", "ja": "投げる瞬間だけ弱点が開く──飛んでくる物を落として狙え!"},
        "h3": {"zh": "Z 字冲过来了：路上打够伤害就能把她打回去！", "en": "SHE ZIGZAGS IN - DEAL ENOUGH DAMAGE ON THE WAY TO KNOCK HER BACK!", "ja": "ジグザグに突っ込んでくる──途中で削りきれば押し返せる!"},
        "h4": {"zh": "点滴瓶在给她回血：先打掉它们！血回满她会退回上一形态！", "en": "THE DRIPS ARE HEALING HER - SHOOT THEM DOWN, OR SHE HEALS BACK TO HER LAST FORM!", "ja": "点滴が回復させてる──先に落とせ! 回復しきると前の形態に戻る!"},
        "regress": {"zh": "她恢复了！", "en": "SHE HEALED BACK!", "ja": "回復された!"},
        "h5": {"zh": "蓄力时弱点会换位置：追着打，蓄满之前打爆她！", "en": "HER WEAK POINT MOVES AS SHE CHARGES - CHASE IT AND BREAK HER BEFORE SHE'S FULL!", "ja": "溜めの間に弱点が移る──追いかけて溜め切る前に砕け!"},
    })

def main():
    D = packs.load(F)
    classroom(D["ep0_classroom"])
    corridor(D["ep0_corridor"])
    dash(D["ep0_dash"])
    BF = F.parent / "bosses.json"; BD = packs.load(BF); BD0 = packs.load(BF)
    yard(D["ep0_yard"], BD["qq"]); packs.dump(F, D)
    if BD != BD0: packs.dump(BF, BD)
    print("ep0 classroom redone:", len(D["ep0_classroom"]["props"]), "props,", len(D["ep0_classroom"]["scenery"]), "scenery pieces")

if __name__ == "__main__":
    main()
