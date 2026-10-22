"""Episode 1 redone after DESIGN「总纲」 and 第 1 话 10 (user 2026-10-20: the boss's three things each a form with its own attack and way to fight
her, Sweet Home's mechanics brought back, not staged like the prologue). Writes the episode's level pack (levels/ep1/bosses.json);
idempotent, run again after changing it.
  madame  beh "madame" (src/battle/madame.js): form 1 the photo (dark, she shows only in its flash), form 2 the diary (pages shot in the
          order of their dates), form 3 the coffin (the pit, ghost hands dragging a girl in, chandeliers to bring down on her); between
          forms she is repainted; at the end the three things in a row, shown to her in order (Sweet Home's ending)
usage: python -I tools/rounds/ep1_rework.py"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools"), str(ROOT / "tools" / "rounds")]
import packs  # noqa: E402   (the content files' own layout)
L = ROOT / "public" / "content" / "base" / "levels" / "ep1"
BASE = "8f0a791"   # (the commit before the rooms were redone)

# the diary's pages, by date (her story told by them: DESIGN 第 1 话 故事; Sweet Home's diary pages dated one after another)
PAGES = [
    ("2/3", "今天给女儿烤了蜂蜜蛋糕。她最喜欢烤炉的香味。", "Baked honey cake for my girl today. She loves the smell of the oven.", "今日は娘に蜂蜜ケーキを焼いた。あの子はオーブンの匂いが大好き。"),
    ("2/28", "烤炉的门没有关好……都是我的错。", "The oven door wasn't shut... It's all my fault.", "オーブンの扉がちゃんと閉まってなかった……全部わたしのせい。"),
    ("3/13", "她一个人在那边，一定很寂寞。", "She must be so lonely over there, all alone.", "あの子、向こうでひとりぼっち。きっと寂しい。"),
    ("4/4", "邻居家的孩子来玩了。我请她吃了点心。", "The neighbours' child came to play. I gave her sweets.", "近所の子が遊びに来た。お菓子をあげたの。"),
    ("5/5", "娃娃又多了一个。你看，好多朋友。", "One more doll now. Look, so many friends.", "お人形がまたひとつ。ほら、お友だちがいっぱい。"),
    ("6/7", "有人挖开了后院的小坟。……谁也不许走。", "Someone dug up the little grave out back... No one leaves.", "誰かが裏庭の小さなお墓を掘った。……誰も帰さない。"),
]

def madame(B):
    B["beh"] = "madame"
    S1, S2, S3 = B["stages"]
    # (user 2026-10-22: a boss fight is a long hard fight - three minutes is normal - with give and take, not a target stood there to be
    # shot at: on the auto-player she made one move every twelve seconds and the two of them lost 260 between them all fight. Now her
    # moves come on each other's heels: throws of things to shoot down, rushes at a girl, the big one to hide from, the grabbing arm)
    S1["pattern"] = ["volley", "drift", "lunge", "volley", "drift", "volley", "burst"]; S1["projectiles"] = ["furniture"]
    S2["pattern"] = ["volley", "drift", "volley", "lunge", "volley", "burst"]; S2["projectiles"] = ["plane", "manga"]; S2["shots"] = [4, 5]
    S2.pop("summon", None)
    S3["pattern"] = ["drag", "volley", "drift", "lunge", "drag", "volley", "burst"]; S3.pop("summon", None)
    B["hp"] = 4160
    B["rest"] = [0.4, 0.9]
    B["volley"]["shots"] = [3, 4]   # (each throw five seconds in the air: three or four of them to shoot down at once)
    B["weave"] = {"legs": 2, "lateral": 2.0, "leg": 0.45, "pause": 0.3, "near": 5.0, "topY": 0.06, "windup": 1.6, "dmg": 12, "back": 1.2}   # (her drift: thing.js weave, quick slides)
    B["coreSmoke"] = {"colors": ["#ffb347", "#ff7aa8", "#ffd27a", "#c88bff"], "blood": ["#b8520a", "#ff8a3a", "#7a2a08"], "every": [0.8, 1.4], "n": 6, "a": 0.28}   # (honey and rose)
    for s, at in zip(B["stages"], (1, 0.865, 0.433)): s["at"] = at
    B["madame"] = {
        "_doc": "腐蜜夫人三个形态（docs/DESIGN.md 第 1 话 10，src/battle/madame.js）。photo：dark 画室暗到多少、reveal 照片闪一下她现形几秒、recharge 照片多久能再闪、fuse 照片自己蓄力闪光的间隔、warn 最后几秒出快打环、blind 致盲几秒、dmg；diary：pages 纸页（日期、那页的真相；按日期下一页发金光、只有它打得中，上一页的真相读完它才亮；打她本人只溅火花），pageHp 一页要打掉多少血才撕碎，chunk 每撕碎一页扣她最大血量的比例、stun 僵住几秒；coffin：pit 坑的半径、hits 鬼手要打几下、time 拖下去要几秒、dmg 掉进坑的伤害、away 掉下去多久才爬回来、hangX 吊灯离她多远、crushR 砸到的范围、crush 砸中扣最大血量的比例、stun、open 砸中后她露出来几秒、openMul 那几秒的伤害倍数；repaint：换形态的时间和她一字一拍喊的话。assets：这些用到、要随小关载入的图。",
        "photo": {"dark": 0.78, "reveal": 4.0, "recharge": 3.0, "fuse": [9, 13], "warn": 3.0, "blind": 2.4, "dmg": 10},
        "diary": {"pages": [{"date": d, "text": {"zh": z, "en": e, "ja": j}} for d, z, e, j in PAGES], "chunk": 0.072, "stun": 1.2, "pageHp": 700},
        "coffin": {"hands": "ep1/hands_crowd", "arm": {"reach": "ep1/arm_reach", "grip": "ep1/arm_grip", "reach_t": 0.7, "lift": 0.02, "dist": 2.6, "over": 1.3, "eye_reach": [0.745, 0.5, 0.1], "eye_grip": [0.855, 0.643, 0.075]}, "pit": 4.2, "hits": 6, "time": 4.0, "dmg": 18, "away": 6, "hangX": 1.6, "crushR": 3.4, "crush": 0.07, "stun": 3.0, "open": 4.0, "openMul": 2.0},
        "repaint": {"time": 3.6, "word": {"zh": "孩子还给我", "en": "GIVE HER BACK", "ja": "こどもをかえせ"}},
        # dream: her end, dreamed (madame.js dreamUp): the memories in the frames floating round her, one set a step (the happy days; the
        # oven and its fire; the crying, rotting) - the room's darkness and the frames' colour each step; every: seconds a picture is up;
        # frames: [across, up, back from her, size] each
        "dream": {"sets": [["ep1/fresco1", "ep1/crayon1", "ep1/portrait1", "ep1/crayon2", "ep1/fresco3"],
                           ["ep1/crayon2", "ep1/crayon3", "ep1/crayon3", "ep1/fresco1_x", "ep1/crayon2_x"],
                           ["ep1/crayon4", "ep1/crayon4_x", "ep1/crayon3_x", "ep1/fresco1_x", "ep1/portrait1_x", "ep1/crayon1_x"]],
                  "dark": [0.3, 0.42, 0.55], "tint": ["#ffffff", "#ffc890", "#ff8a92"], "every": [1.6, 2.6],
                  "frames": [[-4.6, 3.6, 0.6, 1.9], [-2.9, 5.2, 1.4, 1.6], [3.0, 5.3, 1.2, 1.7], [4.7, 3.4, 0.5, 1.9], [-5.6, 1.8, -0.6, 1.4], [5.7, 2.0, -0.4, 1.4]]},
        "assets": ["ep1/arm_reach", "ep1/arm_grip", "ep1/hands_crowd", "ep1/soul_child", "enemy/chandelier_disguise",
                   "ep1/fresco1", "ep1/fresco1_x", "ep1/fresco3", "ep1/portrait1", "ep1/portrait1_x", "ep1/crayon1", "ep1/crayon1_x", "ep1/crayon2",
                   "ep1/crayon2_x", "ep1/crayon3", "ep1/crayon3_x", "ep1/crayon4", "ep1/crayon4_x", "ep1/photo", "ep1/diary", "ep1/coffin"],
    }

# ---------------------------------------------------------------- the places (DESIGN 第 1 话 按总纲重做时各处加的巧思)
DOUBLE = {"kind": "swing", "k": ["ep1/door_double_l", "ep1/door_double_r"]}
SINGLE = {"kind": "swing", "k": ["ep1/door_single"], "side": 1}
#  set: width, height, doors [(wall, share along the room, double?)], the room's own trick
ROOMS = {
    "ep1_shop":    (10, 4.2, [("left", 0.55, True), ("right", 0.8, False)], "shed"),
    "ep1_gallery": (8, 4.4, [("left", 0.4, False), ("right", 0.72, True)], "melt"),
    "ep1_garden":  (14, 6, [("left", 0.62, True), ("right", 0.35, True)], "burst"),
    "ep1_cold":    (8, 3.6, [("left", 0.7, False)], "puddle"),
    "ep1_nursery": (8, 3.6, [("right", 0.6, False), ("left", 0.3, False)], "merge"),
    "ep1_oven":    (8.5, 4.0, [("left", 0.62, False)], "blast"),
    "ep1_studio":  (12, 6, [("left", 0.3, True)], None),
}
WALKERS = {"ghoul", "crawler", "armor", "scoopling", "teacup", "dollkin", "double_cat", "double_pink", "shade_bride"}

def room(sid, S, spec, rnd):
    W, h, doors, trick = spec
    H = S["hall"]; w0 = H["x1"] - H["x0"]; k = W / w0
    H.update({"x0": -W / 2, "x1": W / 2, "h": max(H["h"], h), "tilesX": max(H.get("tilesX", 3), round(H.get("tilesX", 3) * k))})
    z0, z1 = H["z0"], H["z1"]; L = z0 - z1
    # the doors: side-wall doorways (panels.js buildWay), clear of what hangs on that wall
    hung = [(g.get("on"), g.get("z", 0)) for g in S.get("gimmicks", [])] + [(o.get("on"), o.get("z", 0)) for o in H.get("holes", [])]
    ways = []
    for i, (wall, share, dbl) in enumerate(doors):
        dw = 1.8 if dbl else 1.0
        z = z0 - L * share
        for _ in range(12):
            if all(not (on == wall and abs(gz - z) < dw / 2 + 1.0) for on, gz in hung): break
            z -= 0.8
        ways.append({"id": f"d{i + 1}", "wall": wall, "z0": round(z - dw / 2, 2), "z1": round(z + dw / 2, 2), "y0": 0, "y1": 2.6 if dbl else 2.3, "depth": 3, "door": DOUBLE if dbl else SINGLE})
    H["ways"] = [w for w in H.get("ways", []) if w.get("wall") not in ("left", "right")] + ways
    for pr in S.get("props", []): pr["x"] = round(pr["x"] * k, 2)
    for g in S.get("gimmicks", []):
        if g.get("on") == "stand" and abs(g.get("x", 0)) > 0.3: g["x"] = round(g["x"] * k, 2)
    # the stops: in a corner, looking across the room (alternating sides), from a little higher, a little narrower
    for j, (st, T) in enumerate(S["stations"].items()):
        if "cine" in T or st == "boss": continue
        s = 1 if j % 2 == 0 else -1
        cam, look = T["cam"], T["look"]
        T["cam"] = [round(s * (W / 2 - 1.2), 2), 1.7, cam[2]]
        T["look"] = [round(-s * (W / 2 - 1.8), 2), -0.4 if look[2] < cam[2] else -0.2, look[2]]
        T.setdefault("shot", {"kind": "cover", "cam": {"zoom": 10}})
        for wv in T.get("waves", []):
            if isinstance(wv, list): enter(wv, sid, ways, trick, z1, rnd, k)
    # the room's own trick
    if trick == "blast":   # a gas oven by the far wall: shot, it blows up into whatever stands by it
        S.setdefault("gimmicks", [])
        S["gimmicks"] = [g for g in S["gimmicks"] if g.get("id") != "gasoven"] + [
            {"id": "gasoven", "k": "prop/ep1_oven2", "on": "stand", "x": round(W / 2 - 1.4, 2), "z": round(z1 + 4.5, 2), "w": 1.5, "station": list(S["stations"])[0],
             "do": [{"blast": {"r": 3.4, "dmg": 900, "vfx": "explosion"}}, {"say": "stagger"}]}]

def enter(wave, sid, ways, trick, far, rnd, k):
    """the monsters in by the ways a room has: through its doors, from the far end, some still breaking in; and its trick"""
    for i, e in enumerate(wave):
        ty, fr = e.get("type"), e.get("from")
        if "x" in e and isinstance(e["x"], (int, float)): e["x"] = round(e["x"] * k, 2)
        if fr == "statue" or ty is None: continue
        if ty in WALKERS and fr in ("wall", "ceiling", None):
            r = rnd()
            if trick == "melt" and r < 0.5: e["from"] = "melt"
            elif ways and r < 0.75: e["from"] = "door"; e["way"] = ways[i % len(ways)]["id"]
            elif r < 0.9: e.pop("from", None); e["z"] = round(far + 3, 2)
            else: e["from"] = "wall"
        elif ty in ("bat", "doily") and fr == "ceiling":
            if ways and rnd() < 0.5: e["from"] = "door"; e["way"] = ways[i % len(ways)]["id"]
        if trick == "shed" and ty == "ghoul" and e.get("hp"): e["morph"] = {"shed": {"type": "scoopling", "every": [2.5, 4.5], "max": 3}}
        if trick == "burst" and ty == "armor": e["morph"] = {"burst": {"type": "crawler", "n": 2}}
        if trick == "puddle" and ty == "ghoul": e["morph"] = {"puddle": {"into": "ghoul", "need": 3, "group": "coldpool", "as": {"h": 3.4, "hp": 1725}}}
        if trick == "merge" and ty == "dollkin": e["morph"] = {"merge": {"with": "dollkin", "into": "doll", "after": 4}}

def gallery_mouth(S):
    """the gallery's far door (DESIGN 第 1 话 按总纲重做时各处加的巧思): walked to after the fight, the gallery stretches away (PanelWorld
    .stretch) and springs back with the door right there - and the door is a mouth (enemy door_mouth, R81: it stands as the door, frames
    .disguise, and wakes): it spits honey, clamps shut, and spews a flood of it (hide); shot to bits, the real door is behind it"""
    st = S["stations"]; last = st["ga2b"]; ex = last.pop("exit")
    # (user 2026-10-21: too close to the door - shoot it from further back; what it does could not be read: a hint once it is shown)
    st["ga3"] = {"via": [[0, 1.5, -8]], "cam": [0, 1.45, -11], "look": [0, 1.6, -21], "stretch": {"k": 2.6, "dur": 4.2, "at": 0.8}, "hint": "ep1DoorMouth",
                 "covers": [{"k": "cover/ep1_gallery1", "side": -1}, {"k": "cover/ep1_gallery2", "side": 1}],
                 # (no close-up: those are the bosses' - user 2026-10-22; its hint tells how to fight it)
                 "waves": [[{"type": "door_mouth", "x": 0, "z": round(S["hall"]["z1"] + 0.12, 2), "from": "statue", "wake": 0.8}]],
                 "shot": {"kind": "cover", "cam": {"zoom": 10}}, "exit": ex}

def knight_planks(S):
    """the knights' hall (DESIGN 第 1 话 骑士厅: on the way to the second stop the floor ahead caves in right across - a strip of planks is
    left over the gap - and the monsters crowding onto it break it): hall.planks (PanelWorld: opened by that walk, game.js bridge);
    the stop's second wave a pack of ghouls coming over at once - they squeeze onto the planks, three on it and it goes (Game.planksTick)"""
    S["hall"]["planks"] = {"z0": -7.75, "z1": -10, "x": -2.0, "w": 1.6, "n": 3, "station": "gd2"}   # (x: where the stop's view crosses the gap)
    # (no close-up of the first armour to come alive: close-ups are the bosses' - user 2026-10-22)
    for pr in S.get("props", []):
        if abs(pr["z"] + 9) < 0.01 and abs(pr["x"]) < 0.1: pr["z"] = -13   # (the fountain out of the gap)
    pack = [(-3.4, -14.5), (-0.6, -15), (-2.0, -14), (-2.8, -15.2), (-1.0, -13.8)]
    S["stations"]["gd2"]["waves"].insert(1, [{"t": round(i * 0.45, 2), "type": "ghoul", "x": x, "z": z, "move": "walk"} for i, (x, z) in enumerate(pack)])

def tunnel_fall(S):
    """the honey tunnel (DESIGN 第 1 话: knocked by a big one down a deeper pit, into the next stretch): the first stop's last wave a brute
    (shadow_brute) bursting out of the floor and bringing it down with its blow (blast.collapse: Game.collapse) - they fall into the second
    stop, landing from above (its enter)"""
    st = S["stations"]
    # (no close-up of its own: the shadows were seen long before - user 2026-10-22, a close-up only at the first sight of a thing; its
    # colour of its own: enemies.json tint)
    st["pt1"]["waves"].append([{"t": 0, "type": "larva_queen", "x": 0, "z": -7.5, "from": "burrow"}])   # (the tunnel's own great one: R91)
    st["pt2"]["enter"] = {"from": [0, 6, -6.2], "dur": 0.75, "shake": 1.6, "sfx": "thud"}

def studio_shades(S):
    """the studio's four shadows (user 2026-10-22: they came down on top of one another with bats and ghouls among them - dense,
    unreadable, one-shotting the player; a boss's stages should be one shadow each, shown alone and saying its line, like the prologue's
    boss): each wave only its painting turning and its shadow, the stop fought one wave to the end before the next (solo), the shadow
    looked at as it lands (look: Game.introLook, the lady's voice)"""
    st = S["stations"]["st1"]; st["solo"] = True
    # (user 2026-10-22: the studio dull and dim, and nothing to shoot to light it: dim at first like the cold store, candles on the walls to
    # shoot alight - each lights some of it - and its colour grade no heavier than the other rooms')
    S["dark"] = 0.6; S["grade"]["k"] = 0.22; st["hint"] = "lampHint"
    if not any(g["id"].startswith("lamp") for g in S["gimmicks"]):
        for i, (on, z) in enumerate([("left", -4.0), ("right", -6.5), ("left", -9.5), ("right", -12.0)], 1):
            S["gimmicks"].append({"id": f"lamp{i}", "k": "ep1/nb_candle_out", "kx": "ep1/nb_candle", "on": on, "y": 1.8, "z": z, "w": 0.85, "hp": 1,
                                  "station": "st1", "do": [{"light": 0.15}]})
    for w in st["waves"]:
        keep = [e for e in w if e.get("gimmick") or str(e.get("type", "")).startswith("shade_")]
        pic = next((e["gimmick"] for e in keep if e.get("gimmick")), None)
        for e in keep:
            if str(e.get("type", "")).startswith("shade_"):
                e["look"] = {"say": e["type"], "dist": 4.6, "up": 0.4, "v": 0.55}
                if pic:   # (out of its own painting, down to a spot in front of it: user 2026-10-22, one painting gave no shadow)
                    e["from"] = "painting"; e["painting"] = pic; e["free"] = True; e.pop("way", None)
                    gm = next(g for g in S["gimmicks"] if g["id"] == pic)
                    e["x"] = round(-2.6 if gm["on"] == "left" else 2.6, 2); e["z"] = round(gm["z"] - 1.0, 2)
        w[:] = keep

def acts(D):
    """the monsters' own play (DESIGN「停留点不只是一个镜头、一种打法」 怪的演出, src/battle/acts.js), a wave of its own at some stops, placed
    where the stop's corner view looks: two scooplings squabbling in the gelateria (shoot one, both turn on the girls); four mourners in a
    ring round a circle in the greenhouse - all down before it is done, or an armour rises out of it; a doll holding a portal open in the
    nursery, little dolls stepping out until it is down; a ghoul running for the kitchen wall to blow itself up and hole it"""
    put = lambda sid, st, i, e: D[sid]["stations"][st]["waves"].insert(i, [e])
    put("ep1_shop", "sh2", 1, {"t": 0.3, "act": "squabble", "of": ["scoopling", "scoopling"], "x": -0.3, "z": -11.5})
    # (the knights' hall: four little dolls kneeling round a circle - user 2026-10-21: four mourner shades with their phantoms were
    # sixteen tough figures, coming close, nothing to read; then: no nine seconds to beat, the player can hardly see the circle anyway;
    # then: close-ups are the bosses' only, user 2026-10-22 - a hint tells there is one, and they are cleared like any others)
    D["ep1_garden"]["stations"]["gd1"]["waves"].insert(1, [{"t": 0.3, "act": "ritual", "of": "dollkin", "n": 4, "r": 2.0, "x": 0.2, "z": -4.5},
        {"t": 0.9, "hint": "dollRitual"}])
    put("ep1_nursery", "nu2", 1, {"t": 0.3, "act": "summon", "of": "doll", "x": -0.4, "z": -10.5, "minion": "dollkin", "every": 3, "max": 5})
    put("ep1_oven", "ov2", 1, {"t": 0.3, "act": "sacrifice", "of": "ghoul", "x": 0.4, "z": -8.0, "side": 1})

# (user 2026-10-22: one kind of monster to a room, none repeated from room to room - each room its own kind; docs/DESIGN.md 第 1 话「一屋一种怪」)
#   set: (its kind, its other form - the same thing before it turned - or None, at most so many of its kind to a wave, hp of one made of
#         another monster's place - None: its own)
ONE_KIND = {
    "ep1_shop":    ("ghoul", "scoopling", 3, None),       # (the gelato ghouls; before the shop turns, the little scoops they turn into)
    "ep1_gallery": ("chandelier", None, 1, None),         # (the poltergeist chandeliers, hanging along the middle; the maw door at the end)
    "ep1_garden":  ("armor", None, 1, None),              # (the knights' hall: the armour along the walls coming alive)
    "ep1_nursery": ("dollkin", "doll", 4, None),          # (the dolls: the little ones walking, the coupe dolls throwing)
    "ep1_cold":    ("popsicle", None, 3, None),           # (the popsicle skeletons, R90: frozen in the ice at first, out of the vent)
    "ep1_oven":    ("ginger", None, 3, None),             # (the burnt gingerbread, R91; the one that runs at the wall and bursts too)
    "ep1_pit":     ("larva", "larva_queen", 3, None),     # (the honey larvae, R91, and the great one that brings the floor down)
}
KEEP = {"door_mouth", "double_pink", "double_cat"}         # (a room's own set piece, not one of its monsters)
# (user 2026-10-22: the flyers had all gone, and with them most of the monsters - the swarms of wafer bats were turned into the room's
# walker and capped) each room's own small swarm flyer (R94) where the bats were, in their numbers, not counted in the room's cap; the
# shop keeps its wafer bats and lace doilies; the studio none (its shadows one at a time)
FLYER = {"ep1_gallery": "moth", "ep1_garden": "helm", "ep1_cold": "cherry", "ep1_nursery": "plane", "ep1_oven": "sugarfly", "ep1_pit": "deathmoth"}
SWARM = {"bat", "doily"}

def one_kind(D):
    """every monster of each room in ONE_KIND made into the room's kind (or dropped past the cap); fliers become walkers (a swarm a few of
    them), the shop's small things its little scoops (they still turn into gelato ghouls when the shop turns), the acts' casts too"""
    # (the knights' hall's planks first: three armours step onto them, and they go - Game.planksTick)
    pk = D["ep1_garden"]["stations"]["gd2"]["waves"][1]
    pk[:] = [{**{k: v for k, v in e.items() if k not in ("move", "hp")}, "type": "armor"} for e in pk if e.get("type")][:3]
    for sid, (kind, other, cap, hp) in ONE_KIND.items():
        S = D[sid]
        for st in S["stations"].values():
            for w in st.get("waves", []):
                n = 0; out = []
                cw = max([cap] + [e["kills"] for e in w if not e.get("type") and e.get("kills")])   # (enough to kill for its kill-events)
                for e in w:
                    if e.get("act"):
                        if e["act"] == "ritual": e["of"] = kind; e["n"] = 3; e["r"] = 2.4   # (knights kneeling round the circle)
                        elif isinstance(e.get("of"), str) and e["of"] not in (kind, other): e["of"] = kind   # (the oven's runner: one of its own)
                        out.append(e); continue
                    if "spawner" in e: e["spawner"]["type"] = [kind]; out.append(e); continue
                    ty = e.get("type")
                    if not ty or ty in KEEP: out.append(e); continue
                    if ty in SWARM and sid == "ep1_shop": out.append(e); continue
                    if ty in SWARM and sid in FLYER: out.append({**e, "type": FLYER[sid]}); continue
                    if ty in (kind, other): out.append(e); n += 1 if ty == kind and not e.get("hp") and e.get("from") != "statue" else 0; continue   # (a statue standing there is not one of the wave's)
                    if sid == "ep1_shop" and ty == "teacup": ty2 = other                     # (the small things of the shop: its scoops)
                    elif sid == "ep1_shop" and ty == "chandelier": continue                  # (no chandeliers in the shop: the gallery's)
                    else: ty2 = kind
                    if ty2 == kind:
                        if n >= cw: continue
                        n += 1
                    c = {k: v for k, v in e.items() if k not in ("type", "morph", "y", "hp", "move", "count", "every", "spread", "hole")}
                    c["type"] = ty2
                    if e.get("morph"):   # (the room's own trick goes on with its kind: the cold store's puddles run together into a big one of it)
                        c["morph"] = {k: {**m, **({"into": ty2} if m.get("into") not in (kind, other) else {}), **({"with": ty2} if m.get("with") and m["with"] not in (kind, other) else {})} for k, m in e["morph"].items()}
                    if e.get("count") and ty2 != "chandelier": c["count"] = min(e["count"], 2 if ty2 == "armor" else 3); c["every"] = e.get("every", 0.5)
                    if ty2 == "chandelier": c["x"] = round(max(-1.5, min(1.5, e.get("x", 0))), 2); c.pop("from", None); c.pop("way", None)
                    elif hp and ty2 == kind: c["hp"] = hp
                    out.append(c)
                # (a wave event waiting for so many kills: never more than the wave has left to kill - else, with the others gone, the
                # statues it wakes would wait for ever: the knights' hall's first stop; none to kill: after a while instead)
                can = sum(e.get("count", 1) for e in out if e.get("type") and e.get("from") != "statue" and e["type"] not in SWARM | set(FLYER.values()))
                for e in out:
                    if not e.get("type") and e.get("kills") and e["kills"] > can: e.pop("kills"); e["t"] = 6.0 if can else 2.0
                w[:] = out

def chandeliers(D, h):
    """(user 2026-10-22: the chandeliers were hung anywhere, not where a chandelier hangs - a poltergeist may move about, but it must start
    in its place) each stop's chandeliers hang from the ceiling on their chains from the start (wave 0, a statue: a chandelier as it is,
    enemies.json chandelier hang), and come alive when the wave they were in starts (a wake event for chandeliers only)"""
    for S in D.values():
        if not isinstance(S, dict) or "hall" not in S: continue
        top = S["hall"]["h"]
        for st in (S.get("stations") or {}).values():
            W = st.get("waves") or []
            for wi, w in enumerate(W):
                for e in [e for e in w if e.get("type") == "chandelier"]:
                    w.remove(e)
                    c = {"type": "chandelier", "x": e.get("x", 0), "z": e["z"], "from": "statue", "y": round(top - h - 0.5, 2)}
                    if wi == 0: c["wake"] = e.get("wake", round(e.get("t", 0) + 1.2, 2))
                    else: w.append({"t": round(e.get("t", 0) + 0.3, 2), "wake": 1, "wakeOf": "chandelier"})
                    W[0].append(c)
            # (not in a bunch: at most four to a stop, one after another down the ceiling in front of the camera, 2.5 m apart if there is
            # room, left and right of the middle by turns)
            hung = sorted([e for e in W[0] if e.get("type") == "chandelier"], key=lambda e: -e["z"]) if W else []
            for e in hung[4:]: W[0].remove(e)
            hung = hung[:4]
            if hung and st.get("cam") and st.get("look"):   # (from 8 m off - no nearer than the rest: user 2026-10-22 - as many as there is room for)
                c, sg = st["cam"][2], (1 if st["look"][2] > st["cam"][2] else -1)
                a0 = c + sg * 8.0; lim = (S["hall"]["z0"] - 2.5) if sg > 0 else (S["hall"]["z1"] + 2.5)
                room = max(0.0, (lim - a0) * sg); keep = max(1, min(len(hung), 1 + int(room // 2.2)))
                for e in hung[keep:]: W[0].remove(e)
                hung = hung[:keep]; gap = min(2.5, room / max(1, len(hung) - 1))
                for i, e in enumerate(sorted(hung, key=lambda e: abs(e["z"] - c))):
                    e["z"] = round(a0 + sg * gap * i, 2); e["x"] = round((-1.3 if i % 2 == 0 else 1.3), 2)

def deepen(S, dz, cut):
    """(user 2026-10-22: the monsters too close to the girls - they should stand further off, and big) the room made dz metres longer
    from depth cut on (the second stop's camera): everything deeper than cut moves dz further in - the far wall, its holes and doorways,
    props, things on the walls, the stops' cameras, views and ways on, the monsters' spots"""
    sh = lambda z: round(z - dz, 2) if z < cut else z
    def pts(o):   # (points [x, y, z] under these keys, a list of them under via)
        for k in ("cam", "look", "to", "from", "at"):
            v = o.get(k)
            if isinstance(v, list) and len(v) == 3 and all(isinstance(a, (int, float)) for a in v): v[2] = sh(v[2])
        if isinstance(o.get("via"), list): o["via"] = [[a, b, sh(c)] for a, b, c in o["via"]]
    def walk(o):
        if isinstance(o, list):
            for v in o: walk(v)
        elif isinstance(o, dict):
            if "z0" in o and "z1" in o and isinstance(o["z0"], (int, float)):   # (a span: moved whole)
                if (o["z0"] + o["z1"]) / 2 < cut: o["z0"], o["z1"] = round(o["z0"] - dz, 2), round(o["z1"] - dz, 2)
            elif isinstance(o.get("z"), (int, float)): o["z"] = sh(o["z"])
            pts(o)
            for k, v in o.items():
                if isinstance(v, (list, dict)): walk(v)
    H = S["hall"]; H["z1"] = round(H["z1"] - dz, 2)
    for k in ("holes", "ways", "planks", "stairs", "shafts"): walk(H.get(k))
    for k in ("props", "gimmicks", "decals", "stations"): walk(S.get(k))

# (user 2026-10-22: in each place of the house the lady's shadow jumps out once, up close, saying something; the child's three things
# seen on the way, not first at the end) set -> its stop, her line, the child's thing set out there ([picture, on, across, size]) or None
APPARITIONS = {
    "ep1_shop":    ("sh2", "seen_shop", None),
    "ep1_gallery": ("ga1", "photo", ("ep1/photo", "stand", 1.3, 0.75)),
    "ep1_garden":  ("gd1", "seen_garden", None),
    "ep1_cold":    ("co1", "coffin", ("ep1/coffin", "stand", 1.5, 0.9)),
    "ep1_nursery": ("nu1", "diary", ("ep1/diary", "stand", 1.4, 0.6)),
    "ep1_oven":    ("ov1", "seen_oven", None),
}
SHADE = {"zh": "夫人之影", "en": "The Lady's Shadow", "ja": "夫人の影"}

def apparitions(D):
    """her shadow (a hidden picture, sets.json gimmicks) 9 m ahead of the place's stop, shown by the act apparition in its first wave
    (acts.js); beside it the child's thing of that place, there for good (not to shoot) - on the nearer side wall for the photo"""
    import math
    for sid, (stn, say, thing) in APPARITIONS.items():
        S = D[sid]; st = S["stations"][stn]; H = S["hall"]; c, l = st["cam"], st["look"]
        fx, fz = l[0] - c[0], l[2] - c[2]; n = math.hypot(fx, fz) or 1; fx, fz = fx / n, fz / n
        x = max(H["x0"] + 1.2, min(H["x1"] - 1.2, c[0] + fx * 9)); z = max(H["z1"] + 1.0, min(H["z0"] - 1.0, c[2] + fz * 9))
        S.setdefault("gimmicks", []).append({"id": f"lady_{stn}", "k": "enemy/shadow_idle", "on": "stand", "x": round(x, 2), "z": round(z, 2), "w": 1.5,
                                             "shoot": False, "hidden": True, "station": stn})
        if thing:
            k, on, across, w = thing
            if on == "wall":
                side = "left" if x < (H["x0"] + H["x1"]) / 2 else "right"
                S["gimmicks"].append({"id": f"keep_{stn}", "k": k, "on": side, "y": 1.9, "z": round(z, 2), "w": w, "shoot": False})
            else:
                S["gimmicks"].append({"id": f"keep_{stn}", "k": k, "on": "stand", "x": round(max(H["x0"] + 0.8, min(H["x1"] - 0.8, x + across)), 2), "z": round(z + 0.3, 2),
                                      "w": w, "shoot": False})
        # (hold: the stop's first wave - its monsters, the statues' wakes - only once she is gone, not on a clock: Game.startWave)
        st["waves"][0].insert(0, {"t": 0.8, "act": "apparition", "hold": True, "shade": f"lady_{stn}", "say": say, "name": SHADE})

def places(D):
    import random
    R = random.Random(11)
    for sid, spec in ROOMS.items(): room(sid, D[sid], spec, R.random)
    gallery_mouth(D["ep1_gallery"])
    knight_planks(D["ep1_garden"])
    tunnel_fall(D["ep1_pit"])
    studio_shades(D["ep1_studio"])
    for gm in D["ep1_cold"]["gimmicks"]:   # (the shelf toppled onto the vent: 1.2 times as big - user 2026-10-22, it could not cover the hole)
        if gm.get("id") == "shelf": gm["w"] = round(gm["w"] * 1.2, 2)
    acts(D)
    one_kind(D)
    chandeliers(D, packs.load(L / "enemies.json")["chandelier"]["h"])
    # (user 2026-10-22: the monsters too close - further off, and big: levels/ep1/enemies.json h; the shallow second stops given room)
    for e in D["ep1_shop"]["stations"]["sh1"]["waves"][0]:
        if e.get("type") == "ghoul": e["hp"] = 2150   # (x 0.7 below: 1500 - about five seconds of both of them on it; user 2026-10-22, the monsters' health)
    for sid, dz in (("ep1_shop", 4.5), ("ep1_cold", 4.5), ("ep1_nursery", 4.5), ("ep1_oven", 9.0)):
        S = D[sid]; deepen(S, dz, list(S["stations"].values())[1]["cam"][2])
    for sid, S in D.items():
        if not isinstance(S, dict) or "stations" not in S: continue
        S["monster"] = {"spawnMin": 8.0, "spawnFar": 12.0, "perspective": True}   # (perspective: seen as they really are, no size floor - Actor.sizeFloor)
        for st in S["stations"].values():
            for w in st.get("waves", []):
                for e in w:   # (a monster that comes to hit them walks straight in from far off - not the sideways zigzag rolls)
                    if e.get("move") == "zigzag": e["move"] = "walk"
    apparitions(D)   # (after the rooms are deepened: 9 m ahead of where the stop's camera ends up)

def main():
    f = L / "bosses.json"; B = packs.load(f)
    madame(B["madame"])
    packs.dump(f, B)
    # (the rooms from how they were before this rework, so running it again gives the same: git BASE)
    f = L / "sets.json"; D = json.loads(subprocess.run(["git", "show", f"{BASE}:public/content/base/levels/ep1/sets.json"], cwd=ROOT, capture_output=True, check=True).stdout.decode("utf-8"))
    D.pop("ep1_mine", None)   # (the mine cart ride is gone: user 2026-10-22, tools/rounds/ep1_ride.py)
    from ep1_soul import NE2   # (the soul's escort as tools/rounds/ep1_soul.py has it now, not as it was at BASE)
    D["ep1_nether"]["stations"]["ne2"] = NE2
    places(D)
    # (the monsters' health 70% of what it was - user 2026-10-21: the episode chokes on how many are up at once, and they were tough;
    # the kinds' own in levels/ep1/enemies.json were lowered the same once, by hand)
    for S in D.values():
        for st in (S.get("stations") or {}).values() if isinstance(S, dict) else ():
            for w in st.get("waves", []) if isinstance(st, dict) else ():
                for e in w if isinstance(w, list) else ():
                    if isinstance(e.get("hp"), (int, float)) and e["hp"] > 10: e["hp"] = int(round(e["hp"] * 0.7))
    packs.dump(f, D)
    print("ep1 madame:", [s["pattern"] for s in B["madame"]["stages"]], "rooms:", list(ROOMS))

if __name__ == "__main__":
    main()
