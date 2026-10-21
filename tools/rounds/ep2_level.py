"""Episode 2's one long stage (docs/DESIGN.md「第 2 话」钟楼惊宿; src/battle/chase.js) -> content sets/ep2.json + the episode's steps.
Ten places in a row (round 63's panels) in nine small stages (user 2026-10-19 batch 23: too long as one), walked through without a cut
(Game.passThrough, DESIGN「场景之间怎么走」: the girls out of the picture, the camera turns to the way on, a door opens, it walks into the
passage behind the doorway - up real stairs, a ladder, through her hole - and comes out of the next place's passage; no windows, no
teleporting). The doorways are where round 63 painted them (magenta, keyed out; tools/rounds/ep2_ways.py opened two to the floor and
cut the storehouse's doors out): measured here from the pictures. Every stop's place is the set it is listed in; each stage step lists
its places (and the next stage's first, so it loads before the walk there) and its stops.
The route, by the user's loop (DESIGN): the calm inn (arrive, the rules, the room, the corridor) -> the bath (she bursts out of the tub, the
lights go out) -> the corridor run with her behind -> the stuck door -> hiding in the closet -> through the wall she cut into the banquet
hall (shadows on the shoji, paper dolls from the skylight) -> the blocked doors -> the rainy walkway run (shutters, stone lanterns, a bamboo
fountain to draw her off) -> hiding behind the stone lantern -> locked in the storehouse (the ledger, the clocks striking) -> through the
floor into the cave -> the silkworm wakes, the kerosene -> the lift up the bell tower with the scissor spider climbing after -> hiding in the
gear loft -> the clock face, the bell.
usage: python -I tools/rounds/ep2_level.py"""
import json, pathlib, sys, subprocess, math
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[2]
B = ROOT / "public" / "content" / "base"; A = B / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)
import job_specs63 as J
import job_specs66 as R66
MAN = packs.manifest()
have = lambda k: k in MAN
L = lambda zh, en, ja: {"zh": zh, "en": en, "ja": ja}

# the places: hall size (from round 63's prompts), how many bays long, where it starts
BAYS = {"genkan": 2, "kyakushitsu": 2, "rouka": 6, "furo": 2, "hiroma": 3, "nakaniwa": 6, "kura": 2, "chika": 4, "shoro": 2, "kane": 2}
Z0 = {"kane": 6.0}

def hall(k):
    P = J.PLACES[k]; W, h, bay = P["W"], P["h"], P["bay"]; n = BAYS[k]; z0 = Z0.get(k, 2.0); z1 = z0 - n * bay
    keys = lambda kind, m: [f"ep2/{k}_{kind}{i}" for i in range(1, m + 1) if have(f"ep2/{k}_{kind}{i}")]
    H = {"x0": -W / 2, "x1": W / 2, "z0": z0, "z1": round(z1, 3), "h": h, "bay": bay, "tile": W, "tilesX": 3 if W <= 6 else 6, "tileL": 1.2 if W <= 6 else 2.0,
         "left": keys("wallL", 6), "right": keys("wallR", 6), "ceil": keys("ceil", 3)}
    if P.get("rows"): H["rows"] = P["rows"]
    fl = keys("floor", 3)
    if k == "kane": fl = ["ep2/kane_diala"] if have("ep2/kane_diala") else fl
    H["floor"] = fl
    if have(f"ep2/{k}_end1"): H["end"] = [f"ep2/{k}_end1"]
    if have(f"ep2/{k}_back1"): H["back"] = [f"ep2/{k}_back1"]
    outs = [f"ep2/{k}_outside{i}" for i in (1, 2) if have(f"ep2/{k}_outside{i}")]
    if outs:   # (an open place: the garden / the town beyond its railings, on both sides; the bell chamber is open on all four)
        H["outside"] = outs[0]
        H["outsideAt"] = [{"k": outs[0], "x": -W / 2 - 14, "z": (z0 + z1) / 2, "ry": math.pi / 2, "w": 64, "yk": 0.32},
                          {"k": outs[-1], "x": W / 2 + 14, "z": (z0 + z1) / 2, "ry": -math.pi / 2, "w": 64, "yk": 0.32}]
        if k == "kane": H["outsideAt"] += [{"k": outs[0], "x": 0, "z": z1 - 14, "ry": 0, "w": 64, "yk": 0.32},
                                          {"k": outs[-1], "x": 0, "z": z0 + 14, "ry": math.pi, "w": 64, "yk": 0.32}]
    return H

def door(key, W, h, mirror=False):
    """the doorway painted in a far / back wall (keyed out): (x of its middle, the height of its middle) in the place's metres, or None
    (mirror: a back wall, which faces the other way: its picture's left is the place's right)"""
    if not have(key) or not MAN[key].get("keyed"): return None
    im = Image.open(MAN.path(key)).convert("RGBA"); a = np.asarray(im)[..., 3] < 100
    lab, n = ndimage.label(a)
    if not n: return None
    big = 1 + int(np.argmax(ndimage.sum(a, lab, range(1, n + 1)))); ys, xs = np.nonzero(lab == big)
    u = (xs.min() + xs.max()) / 2 / a.shape[1]; v = 1 - (ys.min() + ys.max()) / 2 / a.shape[0]
    if mirror: u = 1 - u
    return round(-W / 2 + u * W, 2), round(v * h, 2)

def rect(key, W, h, mirror=False):
    """the same doorway's rectangle in the place's metres: x0, x1 (across), y0, y1 (its bottom, its top), or None"""
    if not have(key) or not MAN[key].get("keyed"): return None
    im = Image.open(MAN.path(key)).convert("RGBA"); a = np.asarray(im)[..., 3] < 100
    lab, n = ndimage.label(a)
    if not n: return None
    big = 1 + int(np.argmax(ndimage.sum(a, lab, range(1, n + 1)))); ys, xs = np.nonzero(lab == big); Hh, Ww = a.shape
    u0, u1 = (1 - xs.max() / Ww, 1 - xs.min() / Ww) if mirror else (xs.min() / Ww, xs.max() / Ww)
    return [round(-W / 2 + u0 * W + 0.03, 2), round(-W / 2 + u1 * W - 0.03, 2), round(max(0.0, (1 - ys.max() / Hh) * h), 2), round((1 - ys.min() / Hh) * h, 2)]

def way(S, wid, r, **extra):   # a passage behind a doorway (hall.ways, src/battle/panels.js buildWay)
    if r: S["hall"].setdefault("ways", []).append({"id": wid, "wall": wid, "x0": r[0], "x1": r[1], "y0": r[2], "y1": r[3], **extra})

SETS = {}
# how much each place echoes (src/core/audio.js setRoom): the tiled bath and the cave a lot, the open walkway and bell chamber little
REVERB = {"genkan": 0.3, "kyakushitsu": 0.18, "rouka": 0.3, "furo": 0.55, "hiroma": 0.45, "nakaniwa": 0.12, "kura": 0.4, "chika": 0.6, "shoro": 0.5, "kane": 0.15}

def place(k, dark, **extra):
    P = J.PLACES[k]; H = hall(k)
    S = {"panels": True, "seed": 31 + len(SETS), "fogNear": 7, "fogFar": 32, "fogDensity": 0.012,
         "sky": "#05030a", "fog": "#1a1020", "void": "#05030a", "ink": "#140a10", "paper": 0.05,
         "lit": [0.95, 0.9, 0.86], "grade": {"tint": [1.02, 0.96, 0.92], "k": 0.12, "sat": 1.0}, "hall": H, "gimmicks": [], "stations": {},
         "music": None, "clocks": True, "reverb": REVERB.get(k, 0.3)}
    if P["calm"]:   # (a calm place that turns dark when she wakes: the boards flip to their _x versions)
        S.update({"turns": True, "start": 0, "anomalyFrom": [0, 1.5, H["z1"]], "anomalyLit": [0.82, 0.76, 0.86], "anomalyFog": "#120a18", "anomalySky": "#020104",
                  "anomalyGrade": {"tint": [0.9, 0.86, 1.04], "k": 0.3, "sat": 0.92}})
    if dark and not P["calm"]: S.update({"lit": [0.84, 0.78, 0.86], "grade": {"tint": [0.92, 0.88, 1.04], "k": 0.28, "sat": 0.94}})
    d1 = door(f"ep2/{k}_end1", P["W"], P["h"]); d0 = door(f"ep2/{k}_back1", P["W"], P["h"], True)
    if d1: S["exit"] = [d1[0], max(1.15, min(d1[1], P["h"] - 0.8)) if k == "genkan" else 1.15, round(H["z1"] - 0.6, 2)]   # (only the stairs go up)
    if d0: S["entry"] = {"at": [d0[0], 1.15, round(H["z0"] - 0.25, 2)], "look": [0, 1.1, H["z1"]]}
    way(S, "end", rect(f"ep2/{k}_end1", P["W"], P["h"])); way(S, "back", rect(f"ep2/{k}_back1", P["W"], P["h"], True))
    S.update(extra)
    SETS[f"ep2_{k}"] = S
    return S, H, d0, d1

# the marks of her and of the house on the boards (round 63's decals, two versions each: scissor slashes, gouges, red threads, hair; on the
# floor slippers, a doll): a calm place gets them only once the lights are out (anomaly), a dark one has them from the start. Seeded per
# place, spread along the walls; an open place (no walls, only railings) gets floor marks only
def marks(S, k, n_wall, n_floor, floor=("slippers",), walls=True):
    H = S["hall"]; rng = np.random.default_rng(sum(map(ord, k)) * 13); L = H["z0"] - H["z1"]; out = []
    calm = J.PLACES[k]["calm"]; W = H["x1"] - H["x0"]
    kinds = ["slash", "threads", "gouge", "hair"]
    for i in range(n_wall if walls else 0):
        key = f"ep2/d_{kinds[i % 4]}{'ab'[int(rng.integers(2))]}"
        if not have(key): continue
        z = H["z0"] - L * (0.1 + 0.8 * (i + 0.2 + rng.random() * 0.6) / n_wall)
        out.append({"k": key, "on": "left" if (i + int(rng.integers(2))) % 2 else "right", "z": round(float(z), 2),
                    "y": round(float(rng.uniform(0.9, min(2.3, H["h"] - 0.5))), 2), "w": round(float(rng.uniform(0.75, 1.25)), 2)})
    for i in range(n_floor):
        key = f"ep2/d_{floor[i % len(floor)]}{'ab'[int(rng.integers(2))]}"
        if not have(key): continue
        z = H["z0"] - L * (0.15 + 0.7 * (i + rng.random()) / n_floor)
        out.append({"k": key, "on": "floor", "x": round(float(rng.uniform(-W / 2 + 0.7, W / 2 - 0.7)), 2), "z": round(float(z), 2),
                    "w": round(float(rng.uniform(0.6, 0.9)), 2), "r": round(float(rng.uniform(-3.1, 3.1)), 2)})
    if calm:
        for d in out: d["anomaly"] = True
    S["decals"] = out

def cov(k, a, b): return [{"k": f"cover/ep2_{k}{a}", "side": -1}, {"k": f"cover/ep2_{k}{b}", "side": 1}]
def gm(S, **g): S["gimmicks"].append(g); return g
def kat(n, x, z, y=2.4, t=0, spread=3.0, frm=None):
    e = {"t": t, "type": "katashiro", "count": n, "x": x, "z": z, "y": y, "spread": spread, "every": 0.12}
    if frm: e["from"] = frm
    return e

# ================================================================ 1. the entrance hall (calm): arrive, the rules, the doll, the crow
S, H, d0, d1 = place("genkan", False, music="ep2_inn")
# (the house rules: a comic page of their own before this stage, ep2_rules - user 2026-10-19 batch 23: nobody read the note in the stage;
# the note still lies on the desk)
gm(S, id="note", k="prop/ep2_note", on="stand", x=2.6, y=0, z=-3.6, w=0.55, shoot=False)
# the doll in its case (user 2026-10-19 batch 23: it twitched in a blink nobody saw): shown up close for 7 s (gk2 focus) - it twitches,
# again, harder; the lights flicker and when they come back the case is empty; a fusuma slides somewhere; the girls react
gm(S, id="case", k="prop/ep2_case_doll", kx="prop/ep2_case_empty", on="stand", x=-2.7, y=0, z=-5.2, w=1.6, ry=60, shoot=False, solid=True,
   do=[{"t": 0.5, "twitch": {"n": 1, "amp": 0.03, "creak": True}}, {"t": 1.7, "twitch": {"n": 2, "amp": 0.05, "every": 0.3}},
       {"t": 3.0, "twitch": {"n": 4, "amp": 0.08, "every": 0.14}}, {"t": 3.1, "sfx": "dollScreech"}, {"t": 4.2, "flicker": 0.7}, {"t": 4.55, "swap": True},
       {"t": 5.2, "sound": "shoji"}, {"t": 5.8, "say": "scare"}])
gm(S, id="cage", k="prop/ep2_cage", kx="prop/ep2_cage_open", on="stand", x=2.9, y=0, z=-7.0, w=0.9, ry=-60, station="gk1", do=[{"free": True}, {"flip": True}])
# (DESIGN「总纲」 处处有小巧思 - the shoe cabinet by the wall: in the fight the slippers keep pouring out of it until it is shot over onto
# its own doors, which seals it and flattens whatever is in front of it: a spawner + a topple seal, like episode 1's cold store shelf)
gm(S, id="getabako", k="prop/ep2s_genkan_getabox", on="stand", x=3.0, y=0, z=-5.3, w=1.1, ry=-90, hp=5, station="gk1", needs="geta", mark=True,
   do=[{"topple": 1.5, "seal": "geta", "crush": {"r": 2.2, "dmg": 700}}, {"sound": "woodBreak"}])
gm(S, id="bell", k="prop/ep2_bell_desk", on="stand", x=2.4, y=0.95, z=-2.6, w=0.3, station="gk1", do=[{"sound": "bellSmall"}, {"say": "real"}])
S["stations"] = {
  "gk0": {"cam": [0, 1.25, 1.8], "look": [0, 1.2, -9], "pause": 1.4, "sfx": "bellSmall", "say": "real"},
  # (DESIGN「总纲」 rooms seen from a corner, across - user 2026-10-21 "do episode 2": not straight down the room)
  "gk1": {"cam": [-2.3, 1.7, 1.0], "look": [2.2, -0.3, -9.5], "covers": cov("genkan", 1, 2), "cp": True, "shot": {"kind": "cover", "cam": {"zoom": 8}},
          "waves": [[{"t": 0, "type": "surippa", "x": -1.6, "z": -5.5, "from": "statue", "wake": 2.5}, {"t": 0, "type": "surippa", "x": 0.2, "z": -6.0, "from": "statue", "wake": 3.2},
                     {"t": 0, "type": "surippa", "x": 1.5, "z": -5.8, "from": "statue", "wake": 3.9}],
                    [kat(14, 0, -6.5), {"t": 2, "type": "surippa", "count": 4, "x": 0, "z": -7.5, "spread": 3, "every": 0.35}],
                    [{"t": 0, "type": "kokeshi", "x": -1.8, "z": -7.0, "from": "pop"}, {"t": 0.8, "type": "kokeshi", "x": 1.8, "z": -7.2, "from": "pop"}, kat(12, 0, -7, 2.6, 2.5),
                     {"t": 1.5, "spawner": {"id": "geta", "type": ["surippa"], "side": 1, "z": -5.3, "every": 2.4, "first": 0.5, "sealAfter": 3, "hint": "getaHint", "remind": 12}}]]},
  "gk2": {"via": [[0, 1.2, -5]], "cam": [0, 1.3, -6.6], "look": [-2.7, 1.3, -5.2], "pause": 1.0, "focus": {"gimmick": "case", "dist": 2.3, "up": 0.05, "v": 0.55, "hold": 6.8},
          "sfx": "snipFar"},
}
# the stairs up (user: up and down stairs, not flying up a painting): solid steps from the floor to the doorway at their top
GW = next(w for w in H["ways"] if w["id"] == "end"); GX = round((GW["x0"] + GW["x1"]) / 2, 2)
H["stairs"] = [{"x": GX, "w": 1.7, "z0": round(H["z1"] + 2.9, 2), "z1": round(H["z1"] + 0.02, 2), "y1": GW["y0"], "n": 13, "tint": "#e09090"}]
GENKAN_FOOT = [GX, 1.15, round(H["z1"] + 3.5, 2)]
# ================================================================ 2. their room (calm): drop the bags
S, H, d0, d1 = place("kyakushitsu", False, music="ep2_inn")
xe = d1[0] if d1 else 0
H["ways"] = [w for w in H["ways"] if w["id"] == "end"]   # (its back wall is the window: no way there)
H["ways"][0]["door"] = {"kind": "slide", "k": ["ep2/door_fusuma"], "side": 1}
S["stations"] = {
  "ky0": {"leave": {"way": "end", "via": [GENKAN_FOOT], "steps": 13}, "arrive": {"way": "end", "at": [xe, 1.15, round(H["z1"] + 1.3, 2)], "look": [0, 1.1, H["z0"]]}, "cam": [0.3, 1.15, -3.2], "look": [-2.7, 1.25, -2.4], "pause": 1.4, "sfx": "fusumaOpen", "say": "real"},
  "ky1": {"cam": [0.6, 1.15, -1.4], "look": [-1.0, 1.5, 2.0], "pause": 1.4, "say": "photo"},
}
# ================================================================ 3. the corridor (calm), 4. the bath
# (night falls on the corridor: the girls' whispered chant, tools/bgm_free.py ep2_night - user 2026-10-20 "the inn one can go in")
S, H, d0, d1 = place("rouka", False, music="ep2_night")
xb = d0[0] if d0 else 0
S["stations"] = {
  "ro0": {"leave": {"way": "end"}, "arrive": {"way": "back", "at": [xb, 1.15, round(H["z0"] - 1.3, 2)], "look": [0, 1.1, H["z1"]]}, "cam": [0, 1.15, -8], "look": [0, 1.1, H["z1"]], "pause": 0.8, "sfx": "snipFar"},
  "ro1": {"cam": [0, 1.15, -20.5], "look": [0, 1.1, H["z1"]], "pause": 1.0, "sfx": "clockChime"},
}
S, H, d0, d1 = place("furo", False, music=None)
S["stations"] = {
  "fu0": {"leave": {"way": "end"}, "arrive": {"way": "back", "at": [d0[0] if d0 else 0, 1.15, round(H["z0"] - 1.2, 2)], "look": [0, 1.0, H["z1"]]}, "cam": [0, 1.15, -2.8], "look": [0, 0.9, H["z1"]], "pause": 2.0, "sfx": "bathLid", "say": "scare", "music": None},
  "fu1": {"cam": [0, 1.15, -1.8], "look": [0, 1.0, H["z1"]], "covers": cov("furo", 1, 2), "cp": True, "state": 0,
          "turn": {"to": 1, "hit": True, "dur": 1.2, "wait": 0.1}, "she": {"form": "a", "at": [0, -6.6], "wake": 1.6, "burst": True}, "hint": "sheRun",
          "waves": [[kat(10, 0, -5.5, 2.2, 1.0)], [kat(14, 0, -5.8, 2.4)], [{"t": 0, "type": "surippa", "count": 3, "x": 0, "z": -6.2, "spread": 2.5, "every": 0.4}]]},
}
# ================================================================ 3'. the corridor in the dark: the run, the stuck door
FURO_D0 = d0[0] if d0 else 0   # (out of the bath the way they came in: its curtain)
S = SETS["ep2_rouka"]; H = S["hall"]
for i, z in enumerate((-17.5, -10.5, -4.8)):
    gm(S, id=f"lan{i}", k="prop/ep2_lantern_hang", on="hang", x=0.3 * (1 - 2 * (i % 2)), y=2.45, z=z, w=0.7, station="rc1", mark=True, do=[{"drop": {"t": 0.4}}, {"trap": {"r": 2.4, "down": 8}}])
gm(S, id="noren", k="prop/ep2_noren", on="hang", x=0, y=2.2, z=-14, w=1.6, station="rc1", mark=True, do=[{"drop": {"t": 0.35}}, {"door": {"hold": 3.5}}])
gm(S, id="rclock", k="prop/ep2_clock_pillar", on="stand", x=round(H["x0"] + 0.35, 2), y=0, z=-8.4, w=0.7, ry=70, station="rc1", mark=True, do=[{"sound": "clockChime"}, {"lure": {"t": 4}}])
# (the things in the way come crashing down only when she has them in the way: walked past before that, appear: rc2)
gm(S, id="jam1", k="cover/ep2_rouka4", on="stand", x=-0.6, y=0, z=0.6, w=1.5, hp=36, station="rc2", block=True, appear=True, do=[{"sound": "woodBreak"}, {"gone": True}])
gm(S, id="jam2", k="cover/ep2_rouka1", on="stand", x=0.7, y=0, z=0.9, w=1.4, hp=36, station="rc2", block=True, appear=True, do=[{"sound": "tear"}, {"gone": True}])
S["stations"].update({
  "rc1": {"leave": {"way": "back"}, "arrive": {"way": "end", "at": [0, 1.15, round(H["z1"] + 1.0, 2)], "look": [0, 1.1, H["z1"] - 3]}, "state": 1, "cam": [0, 1.15, -4.0], "look": [0, 1.1, H["z1"]],
          "chase": {"path": [[0.3, 1.15, -21], [-0.35, 1.15, -16], [0.35, 1.15, -11], [-0.2, 1.15, -7]], "face": "back", "form": "a", "dist": 6.5, "speed": 1.25,
                    "herSpeed": 2.4, "hint": "sheTrap"}},
  "rc2": {"cam": [0, 1.15, -4.0], "look": [0, 1.1, H["z0"]], "covers": [{"k": "cover/ep2_rouka2", "side": -1}, {"k": "cover/ep2_rouka4", "side": 1, "fall": 1.6}],   # (a fusuma door comes off its track as they get there: DESIGN「掩体」)
          "cp": True, "state": 1,
          "block": {"form": "a", "dist": 11, "hint": "sheBlock"},
          "waves": [[{"t": 0, "type": "surippa", "count": 5, "x": 0, "z": 0, "spread": 2.4, "every": 0.35}], [kat(14, 0, 0.5, 2.3)],
                    [{"t": 0, "type": "karakasa", "x": -0.6, "z": 0.8, "from": "pop"}, {"t": 1.2, "type": "surippa", "count": 4, "x": 0, "z": 0.5, "spread": 2, "every": 0.4}]]},
})
# ================================================================ 2'. the room in the dark: hiding in the closet
S = SETS["ep2_kyakushitsu"]; H = S["hall"]
S["stations"].update({
  # (a quiet stretch after it - user 2026-10-21: the stage has its rise and fall, not running and fighting all the time; a walk, a look,
  # a word between them, and the next small stage loads meanwhile: out of the closet, catching their breath, the slippers cut in half)
  "kh2": {"cam": [-1.0, 1.3, -2.0], "look": [2.2, 0.8, 0.4], "pause": 8.5,
          "on": {"arrive": [{"at": 0.5, "say": "breath", "who": "pink"}, {"at": 2.6, "say": "breath", "who": "cat"},
                            {"at": 4.6, "vignette": {"k": "ep2/d_slippersa", "color": "#3a2a30", "title": L("被剪成两半的拖鞋", "SLIPPERS CUT IN TWO", "真っ二つのスリッパ"),
                                                     "sub": L("每间客房门口都是", "at every guest room's door", "どの客室の前にも")}}]}},
  "kh1": {"leave": {"way": "back"}, "arrive": {"way": "end", "at": [xe, 1.15, round(H["z1"] + 0.9, 2)], "look": [0, 1.1, H["z0"]]},
          "state": 1, "cam": [-1.9, 1.0, -2.6], "look": [2.7, 1.0, -3.0], "hide": {"form": "a", "from": [xe, H["z1"] + 0.6], "at": [0.6, -3.2], "stabs": 6}},
})
# ================================================================ 5. the banquet hall: shadows on the shoji, dolls from the skylight; the blocked doors
S, H, d0, d1 = place("hiroma", True)
# (its side walls' fusuma: two doorways the dolls and slippers slide open and pour out of - DESIGN「总纲」 the monsters by the doors)
FUSUMA2 = {"kind": "slide", "k": ["ep2/door_fusuma", "ep2/door_fusuma"]}
H["ways"] = H.get("ways", []) + [{"id": "d1", "wall": "left", "z0": -14.4, "z1": -12.6, "y0": 0, "y1": 2.3, "depth": 3, "door": FUSUMA2},
                                 {"id": "d2", "wall": "right", "z0": -6.2, "z1": -4.4, "y0": 0, "y1": 2.3, "depth": 3, "door": FUSUMA2}]
for i, (x, z) in enumerate(((-2.2, -8.0), (2.4, -12.0))):
    gm(S, id=f"bigl{i}", k="prop/ep2_lantern_big", on="hang", x=x, y=3.4, z=z, w=1.0, station="hr1", mark=True, do=[{"drop": {"t": 0.5}}, {"trap": {"r": 2.6, "down": 9}}])
for i, (x, z, a) in enumerate(((-4.6, -10.0, 1.4), (4.6, -13.0, -1.4))):
    gm(S, id=f"byobu{i}", k="prop/ep2_byobu", on="stand", x=x, y=0, z=z, w=2.6, station="hr1", mark=True, do=[{"topple": a}, {"trap": {"r": 3.2, "down": 7}}])
for i, x in enumerate((-2.6, 0, 2.6)):
    gm(S, id=f"zen{i}", k="prop/ep2_zen", on="stand", x=x, y=0, z=-15.6 - 0.3 * (i % 2), w=1.8, hp=40, station="hr2", block=True, do=[{"sound": "woodBreak"}, {"gone": True}])
gm(S, id="pclock", k="prop/ep2_clock_pillar", on="stand", x=-4.3, y=0, z=-12.5, w=0.75, ry=35, station="hr2", mark=True, do=[{"sound": "clockChime"}, {"lure": {"t": 6}}])
S["stations"] = {
  "hr0": {"leave": {"hole": {"on": "right", "x": 2.7, "z": -3.0, "y": 1.2, "size": 2.6}, "exit": [3.6, 1.15, -3.0]},
          "arrive": {"hole": {"on": "left", "z": 0.6, "y": 1.3, "size": 2.6}, "from": [round(H["x0"] - 0.9, 2), 1.2, 0.6], "at": [round(H["x0"] + 1.2, 2), 1.2, 0.4], "look": [0, 1.2, -16]}, "cam": [-1.0, 1.2, -1.2], "look": [0, 1.2, -16], "pause": 1.2, "sfx": "stab", "say": "scare"},
  "hr1": {"cam": [-4.5, 1.75, 0.6], "look": [3.6, -0.3, -15.5], "covers": cov("hiroma", 1, 2), "cp": True, "shot": {"kind": "cover", "cam": {"zoom": 8}}, "she": {"form": "a", "at": [4.0, -15], "wake": 9},
          "waves": [[kat(18, 0, -9, 3.2, 0, 6, "ceiling")], [{"t": 0, "type": "chochin", "x": -2.5, "z": -11, "y": 1.2}, {"t": 0.8, "type": "chochin", "x": 2.5, "z": -11.5, "y": 1.2},
                     {"t": 1.6, "type": "karakasa", "x": 0, "z": -12, "from": "pop"}],
                    [{"t": 0, "type": "futon", "x": -1.8, "z": -12, "from": "pop"}, {"t": 0.6, "type": "kokeshi", "x": 2.2, "z": -13, "from": "pop"}, kat(16, 0, -10, 3.0, 2, 6, "ceiling")],
                    [{"t": 0, "type": "karakasa", "x": -2, "z": -12, "from": "pop"}, {"t": 0.6, "type": "karakasa", "x": 2, "z": -12.5, "from": "pop"},
                     {"t": 1.4, "type": "chochin", "x": 0, "z": -13, "y": 1.8}, {"t": 3, "type": "surippa", "count": 6, "x": 0, "z": -11, "spread": 5, "every": 0.3},
                     # (DESIGN「总纲」 处处有小巧思 - two paper dolls left alone a moment fold into one great one: src/battle/morph.js merge)
                     {"t": 2, "type": "katashiro", "count": 4, "x": 0, "z": -10, "y": 2.8, "spread": 4, "every": 0.25, "from": "ceiling",
                      "morph": {"merge": {"with": "katashiro", "into": "katashiro_big", "after": 2.5}}}]]},
  "hr2": {"cam": [4.4, 1.75, -7.6], "look": [-3.4, -0.3, -18.2], "covers": cov("hiroma", 3, 4), "cp": True, "shot": {"kind": "cover", "cam": {"zoom": 8}}, "block": {"form": "a", "dist": 13, "hint": "sheBlock"},
          "waves": [[{"t": 0, "type": "futon", "x": -2.4, "z": -15, "from": "pop"}, {"t": 0.8, "type": "futon", "x": 2.4, "z": -15.2, "from": "pop"}],
                    [kat(16, 0, -14, 3.0, 0, 6, "ceiling"), {"t": 2, "type": "surippa", "count": 5, "x": 0, "z": -15, "spread": 5, "every": 0.3}]]},
}
# ================================================================ 6. the rainy walkway: the run (shutters, stone lanterns, the bamboo fountain), hiding
S, H, d0, d1 = place("nakaniwa", True)
# (DESIGN 第 2 话 每话都用上: the garden open to the rain - user 2026-10-21 "do episode 2": its second half has no railing walls, only posts
# and a low rail; the walkway runs over a pond in the rain - rain rings on it, the lanterns' light - the panorama of the garden beyond;
# the last stop looks across the pond, the monsters rise out of the water and float in over it)
H["open"] = [{"on": "left", "z0": -11.0, "z1": -25.5}, {"on": "right", "z0": -11.0, "z1": -25.5}]
H["pond"] = {"y": -0.12, "x0": -27, "x1": 27, "z0": 4.0, "z1": -48.0}
# (the garden beyond, far off: its two pictures pushed out and widened, a third across the far end - the last stop looks out at a slant)
O1, O2 = H["outside"], "ep2/nakaniwa_outside2"
H["outsideAt"] = [{"k": O1, "x": -27.5, "z": -12, "ry": math.pi / 2, "w": 100, "yk": 0.3}, {"k": O2, "x": 27.5, "z": -16, "ry": -math.pi / 2, "w": 100, "yk": 0.3},
                  {"k": O1, "x": 6, "z": -48.5, "ry": 0, "w": 100, "yk": 0.3}]
S["rain"] = {"n": 1800, "speed": 11, "a": 0.3, "dry": True}
for i, (x, z, a) in enumerate(((-1.3, -6.0, -1.3), (1.3, -13.0, 1.3))):
    gm(S, id=f"ishi{i}", k="prop/ep2_ishidoro", on="stand", x=x, y=0, z=z, w=0.9, station="nk1", mark=True, do=[{"topple": a}, {"sound": "stoneLantern"}, {"trap": {"r": 2.4, "down": 8}}])
gm(S, id="amado", k="prop/ep2_amado", on="stand", x=0, y=0, z=-9.5, w=2.8, station="nk1", mark=True, shut=True, do=[{"sound": "amado"}, {"door": {"hold": 5}}])
gm(S, id="amado2", k="prop/ep2_amado", on="stand", x=0, y=0, z=-15.8, w=2.8, station="nk1", mark=True, shut=True, do=[{"sound": "amado"}, {"door": {"hold": 4}}])
gm(S, id="shishi", k="prop/ep2_shishi", on="stand", x=1.3, y=0, z=-18.5, w=0.9, station="nk1", mark=True, do=[{"sound": "shishiOdoshi"}, {"lure": {"t": 6}}])
S["stations"] = {
  "nk0": {"leave": {"way": "end"}, "arrive": {"way": "back", "at": [0, 1.15, round(H["z0"] - 1.0, 2)], "look": [0, 1.1, H["z1"]]},
          "cam": [0.4, 1.2, -1.2], "look": [-14, 3.5, -14], "pause": 8.0,
          "on": {"arrive": [{"at": 0.5, "say": "rain", "who": "pink"}, {"at": 2.6, "say": "rain", "who": "cat"},
                            {"at": 4.4, "vignette": {"k": "ep2/nakaniwa_outside1", "crop": [0.55, 0.0, 0.8, 0.4], "color": "#22324a",
                                                     "title": L("钟楼", "THE BELL TOWER", "鐘楼"), "sub": L("时之钟就挂在那上面", "the Time Bell hangs up there", "時の鐘はあそこに")}}]}},
  "nk1": {"cam": [0, 1.15, -21.5], "look": [0, 1.1, 2], "cp": True, "chase": {"path": [[0.2, 1.15, 0.0], [-0.3, 1.15, -5.5], [0.3, 1.15, -11.5], [0, 1.15, -17]], "face": "back", "form": "a", "dist": 8,
                   "speed": 1.35, "herSpeed": 2.5, "hint": "sheDoor"}},
  "nk2": {"cam": [1.1, 0.95, -23.4], "look": [-0.4, 1.0, -12], "hide": {"form": "a", "from": [0, -11], "at": [0.1, -20.2], "stabs": 6}},
  # (out of hiding: the umbrellas come down the walkway in the rain, the lanterns with them, and she comes back from the storehouse's door)
  # (the walkway's open side: the camera at its rail looking out across the pond - the rain, the garden; she wades in from the far bank)
  "nk3": {"cam": [-0.9, 1.5, -16.5], "look": [13, 0.2, -30.0], "covers": cov("nakaniwa", 1, 2), "cp": True, "she": {"form": "a", "at": [10.0, -33.0], "wake": 11},
          "hint": "sheStone", "shot": {"kind": "cover", "cam": {"zoom": 6}},
          "waves": [[{"t": 0, "type": "karakasa", "x": 5.0, "z": -21.0, "from": "water", "free": True}, {"t": 0.7, "type": "karakasa", "x": 8.0, "z": -26.0, "from": "water", "free": True}, kat(12, 8, -24, 2.4, 1.5, 6, "outside")],
                    [{"t": 0, "type": "chochin", "x": 6.0, "z": -22.0, "y": 1.6, "from": "outside", "free": True}, {"t": 0.8, "type": "chochin", "x": 9.5, "z": -27.0, "y": 2.0, "from": "outside", "free": True},
                     {"t": 1.6, "type": "surippa", "count": 6, "x": 0, "z": -24.5, "spread": 1.4, "every": 0.3, "from": "door", "way": "end"}],
                    [{"t": 0, "type": "futon", "x": 5.5, "z": -23.5, "from": "water", "free": True}, {"t": 0.8, "type": "karakasa", "x": 4.0, "z": -19.5, "from": "water", "free": True},
                     {"t": 1.4, "type": "karakasa", "x": 8.5, "z": -28.0, "from": "water", "free": True}, kat(14, 8, -24, 2.5, 3, 6, "outside")]]},
}
for i, (x, z, a) in enumerate(((4.0, -22.5, 1.3), (6.5, -29.0, -1.3))):   # (the last stop's: out on the pond's stones, where she wades by)
    gm(S, id=f"ishi{i + 2}", k="prop/ep2_ishidoro", on="stand", x=x, y=0, z=z, w=0.9, station="nk3", mark=True, do=[{"topple": a}, {"sound": "stoneLantern"}, {"trap": {"r": 2.6, "down": 8}}])
# ================================================================ 7. the storehouse: locked in, the truth, the clocks; the floor hatch
S, H, d0, d1 = place("kura", True)
KR = MAN["ep2/kura_back1"].get("door")   # (tools/rounds/ep2_ways.py: the doors cut out of the wall)
if KR:
    W6, h6 = J.PLACES["kura"]["W"], J.PLACES["kura"]["h"]
    H["ways"] = [w for w in H.get("ways", []) if w["id"] != "back"] + [{"id": "back", "wall": "back", "x0": round(-W6 / 2 + (1 - KR[1]) * W6, 2), "x1": round(-W6 / 2 + (1 - KR[0]) * W6, 2),
        "y0": round((1 - KR[3]) * h6, 2), "y1": round((1 - KR[2]) * h6, 2), "door": {"kind": "swing", "k": ["ep2/door_kura_r", "ep2/door_kura_l"]}}]
KB = next((w for w in H.get("ways", []) if w["id"] == "back"), None)
gm(S, id="ledger", k="prop/ep2_ledger", on="stand", x=-2.2, y=0.8, z=-5.0, w=0.9, station="ku1b", shoot=False, do=[{"read": "ep2Ledger"}])
gm(S, id="wadokei", k="prop/ep2_clock_wadokei", on="stand", x=2.3, y=0, z=-8.5, w=1.0, station="ku2", do=[{"read": "ep2Clocks"}, {"sound": "clocksAll"}])
# (DESIGN「总纲」 处处有小巧思 - the storehouse's wall of clocks: its great pendulum clock struck in the fight, every clock in the room
# strikes and time stands still for the monsters a few seconds: src/battle/game.js timeStop)
gm(S, id="bigclock", k="prop/ep2_clock_pillar", on="stand", x=-2.4, y=0, z=-8.6, w=0.8, ry=40, station="ku3", mark=True, do=[{"freeze": 4.5}])
gm(S, id="hatch", k="prop/ep2_hatch", on="floor", x=0, z=-6.5, w=1.4, hp=30, station="ku3", mark=True, block=True, do=[{"sound": "woodBreak"}, {"collapse": True}])
S["stations"] = {
  "ku1": {"leave": {"way": "end", "steps": 4}, "arrive": {"way": "back", "at": [round((KB["x0"] + KB["x1"]) / 2, 2) if KB else 0, 1.2, round(H["z0"] - 1.3, 2)], "look": [0, 1.2, H["z1"]]},
          "cam": [0, 1.2, -2.0], "look": [0, 1.2, H["z1"]], "pause": 1.0, "say": "scare", "slam": "back"},
  # (the quiet before the clocks: the ledger on the chest read, what it tells talked over)
  "ku1b": {"via": [[-0.6, 1.2, -3.0]], "cam": [-0.9, 1.3, -3.4], "look": [-2.2, 0.7, -5.0], "walkSpeed": 1.2, "pause": 8.0,
           "on": {"arrive": [{"at": 0.4, "fire": ["ledger"]}, {"at": 3.6, "say": "ledger", "who": "pink"}, {"at": 5.8, "say": "ledger", "who": "cat"}]}},
  "ku2": {"cam": [-1.8, 1.7, 0.4], "look": [1.6, -0.3, -11.0], "covers": cov("kura", 1, 2), "cp": True, "shot": {"kind": "cover", "cam": {"zoom": 8}},
          "waves": [[{"t": 0, "type": "kokeshi", "x": -2, "z": -8, "from": "pop"}, {"t": 0.6, "type": "kokeshi", "x": 2, "z": -8.5, "from": "pop"}, {"t": 1.4, "type": "kokeshi", "x": 0, "z": -9.5, "from": "pop"}],
                    [{"t": 0, "sound": "clocksAll", "hint": "ep2Ushimitsu"}, kat(18, 0, -8, 2.6, 0.8), {"t": 2, "type": "chochin", "x": 0, "z": -9.5, "y": 1.8}],
                    [{"t": 0, "type": "futon", "x": 0, "z": -9, "from": "pop"}, {"t": 1, "type": "karakasa", "x": -2, "z": -8.5, "from": "pop"}, {"t": 1.5, "type": "karakasa", "x": 2, "z": -8.5, "from": "pop"}]]},
  "ku3": {"cam": [1.7, 1.8, -2.2], "look": [-1.2, -0.5, -9.0], "covers": cov("kura", 3, 4), "shot": {"kind": "cover", "cam": {"zoom": 8}}, "hint": "ep2Hatch", "block": {"form": "a", "dist": 12, "herSpeed": 0.5, "hint": "ep2Hatch"},
          "waves": [[kat(16, 0, -8, 2.4)], [{"t": 0, "type": "kokeshi", "x": -2, "z": -9, "from": "pop"}, {"t": 0.5, "type": "kokeshi", "x": 2, "z": -9, "from": "pop"}], [kat(20, 0, -8.5, 2.6)]]},
}
# ================================================================ 8. the cave: the silkworm, the kerosene
S, H, d0, d1 = place("chika", True)
for i, (x, kk) in enumerate(((-1.5, "cover/ep2_chika3"), (0.05, "prop/ep2_cocoon"), (1.55, "cover/ep2_chika4"))):
    gm(S, id=f"jam{i}", k=kk, on="stand", x=x, y=0, z=-6.6 - 0.25 * (i % 2), w=1.5 if i != 1 else 1.2, hp=34, station="ch2b", block=True,
       do=[{"sound": "woodBreak" if i != 1 else "paperRip"}, {"gone": True}])
gm(S, id="kero1", k="prop/ep2_kerosene", on="stand", x=1.7, y=0, z=-9.0, w=0.8, station="ch3", mark=True, do=[{"trap": {"r": 3.2, "kill": True}}])
gm(S, id="kero2", k="prop/ep2_candles", on="stand", x=-1.8, y=0, z=-4.0, w=0.9, station="ch3", mark=True, do=[{"trap": {"r": 3.6, "kill": True}}])
S["stations"] = {
  "ch1": {"cam": [0, 1.2, -1.0], "look": [0, 1.1, H["z1"]], "enter": {"from": [0, round(J.PLACES["chika"]["h"] + 1.6 - 1.2, 2), 0], "dur": 1.0, "shake": 1.4}, "pause": 6.5, "say": "scare",
          "on": {"arrive": [{"at": 2.0, "say": "cave", "who": "pink"}, {"at": 4.2, "say": "cave", "who": "cat"}]}},
  "ch2": {"cam": [0, 1.2, -13.5], "look": [0, 1.1, H["z1"]], "covers": cov("chika", 1, 2), "cp": True, "she": {"form": "kaiko", "at": [0, -25.0], "wake": 4.5},
          "waves": [[kat(14, 0, -18, 2.6, 0.5)], [{"t": 0, "type": "surippa", "count": 6, "x": 0, "z": -19, "spread": 5, "every": 0.3}]]},
  "ch2b": {"cam": [0, 1.2, -10.8], "look": [0, 1.1, 2.0], "covers": cov("chika", 1, 2), "block": {"form": "kaiko", "dist": 13, "herSpeed": 0.45, "turnAt": 5.0, "hint": "sheBlock"},
           "waves": [[{"t": 0, "type": "kokeshi", "x": -1.6, "z": -5.2, "from": "pop"}, {"t": 0.7, "type": "kokeshi", "x": 1.6, "z": -5.4, "from": "pop"}],
                     [kat(16, 0, -5.5, 2.4), {"t": 1.5, "type": "surippa", "count": 5, "x": 0, "z": -5, "spread": 2.4, "every": 0.35}]]},
  "ch3": {"cam": [0, 1.2, -1.5], "look": [0, 1.1, H["z1"]], "chase": {"path": [[0.3, 1.2, -9.5], [-0.3, 1.2, -6]], "face": "back", "form": "kaiko", "dist": 6.5, "speed": 0.95,
                                                                       "herSpeed": 1.7, "hint": "sheKerosene"}},
  "ch4": {"cam": [0.6, 1.2, round(H["z1"] + 5.0, 2)], "look": [2.6, 2.6, H["z1"]], "swap": {"ep2/chika_end1": "ep2/chika_end1_b"}, "pause": 1.4, "say": "real"},
}
# the burnt altar's picture shows where the lift is: the way on
db = door("ep2/chika_end1_b", J.PLACES["chika"]["W"], J.PLACES["chika"]["h"])
if db: S["exit"] = [db[0], 1.15, round(H["z1"] - 0.6, 2)]
H["shafts"] = [{"at": "ceil", "x": 0, "z": -1.0, "size": 1.8, "h": 3.5}]
rb = rect("ep2/chika_end1_b", J.PLACES["chika"]["W"], J.PLACES["chika"]["h"])
H["ways"] = [w for w in H.get("ways", []) if w["id"] != "end"]
if rb:
    way(S, "end", rb, depth=2.0); CX = round((rb[0] + rb[1]) / 2, 2)
    H["stairs"] = [{"x": CX, "w": 0.95, "z0": round(H["z1"] + 3.6, 2), "z1": round(H["z1"] + 0.02, 2), "y1": rb[2], "n": 14, "tint": "#8a7a70"}]
    CHIKA_FOOT = [CX, 1.2, round(H["z1"] + 4.2, 2)]
# ================================================================ 9. the bell tower's shaft: the lift up, the scissor spider climbing after; the gear loft
S, H, d0, d1 = place("shoro", True)
for i, y in enumerate((4.6, 6.8, 9.0)):
    gm(S, id=f"wt{i}", k="prop/ep2_weight", on="hang", x=1.3 * (1 - 2 * (i % 2)), y=y, z=-1.6, w=0.7, station="sh2", mark=True, do=[{"drop": {"t": 0.6}}, {"trap": {"r": 3.0, "down": 9}}])
S["stations"] = {
  "sh1": {"leave": {"way": "end", "via": [CHIKA_FOOT], "steps": 14}, "arrive": {"from": [0, 1.2, round(H["z0"] - 0.3, 2)], "at": [0, 1.2, -1.0], "look": [0, 1.2, H["z1"]]}, "cam": [0, 1.2, -2.0], "look": [0, 1.2, H["z1"]], "pause": 1.0, "sfx": "ropeCreak"},
  "sh2": {"cam": [0, 10.4, -2.0], "look": [0, 1.0, -2.6], "cp": True, "chase": {"path": [[0, 3.2, -2.0], [0, 5.6, -2.0], [0, 8.0, -2.0]], "face": "down", "form": "c", "dist": 4.5, "speed": 0.4, "herSpeed": 0.85, "hint": "sheShaft"}},
  "sh3": {"cam": [1.5, 10.6, -4.6], "look": [-1.0, 10.4, 0.5], "hide": {"form": "c", "y": 9.6, "from": [-1.2, 1.0], "at": [-0.2, -2.0], "stabs": 7}},
}
H["shafts"] = [{"at": "ceil", "x": 0, "z": -2.0, "size": 1.4, "h": 2.6, "ladder": True, "ladderFrom": 9.4}]
S["exit"] = [0, round(J.PLACES["shoro"]["h"] + 1.6, 2), -2.0]
# ================================================================ 10. the bell chamber: the clock face; the bell
S, H, d0, d1 = place("kane", True, music="ep2_final")
H["shafts"] = [{"at": "floor", "x": 0, "z": 5.0, "size": 1.4, "h": 2.6, "ladder": True}]   # (the trapdoor at the top of the ladder)
H["ways"] = []
ZOD = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "sheep", "monkey", "rooster", "dog", "boar"]
for i, z in enumerate(ZOD):   # (the twelve hours round the circle, the first one in front of the camera's start, clockwise)
    a = math.pi - i * math.pi / 6
    gm(S, id=f"node{i}", k=f"ep2/zodiac_{z}", on="floor", x=round(math.sin(a) * 3.4, 2), z=round(math.cos(a) * 3.4, 2), w=0.9, ry=-i * 30, station="kn2", node=i, armed=False, do=[{"node": True}])
gm(S, id="bell", k="prop/ep2_bell", on="hang", x=0, y=4.3, z=0, w=2.3, hp=60, station="kn2", bell=True, armed=False, do=[{"toll": True}])
gm(S, id="striker", k="prop/ep2_striker", on="hang", x=-2.5, y=4.1, z=0.15, w=2.0, station="kn2", shoot=False, striker=True)
gm(S, id="hand", k="prop/ep2_hand", on="floor", x=0, z=-1.3, w=0.55, station="kn2", shoot=False, hand=True)
S["stations"] = {
  "kn1": {"leave": {"via": [[0, 10.6, -1.5]], "steps": 9}, "arrive": {"from": [0, -1.4, 5.0], "at": [0, 1.4, 4.3], "look": [0, 1.3, 0], "steps": 6}, "cam": [0, 1.4, 4.6], "look": [0, 1.3, 0], "pause": 1.4, "sfx": "bellToll", "say": "scare"},
  # (DESIGN 第 2 话 每话都用上 - 护卫: the crow they let out of its cage in the entrance hall flies to the bell; the paper dolls and the
  # lanterns go for it over the town; it comes from far off (inside the town's pictures round the chamber) - the camera at the chamber's
  # edge looking out, a scope's narrow view - and
  # lands on the bell, which rings once. Only when it was let out: needs crow)
  "kn1c": {"needs": "crow", "shot": "escort", "cam": [1.2, 1.5, 5.4], "look": [-5, 6.2, -10],
           "escort": {"who": "prop/ep2_crow", "path": [[-16, 9, -17], [-10, 8.2, -13], [-4, 7.2, -9], [1, 6.2, -5.5], [2, 5.4, -2.5], [0.3, 4.9, -0.4]],
                      "speed": 1.1, "hp": 420, "h": 1.3, "loop": 0, "name": L("乌鸦", "THE CROW", "カラス")},
           "on": {"arrive": [{"at": 0, "cam": {"on": [-16, 9, -17], "dist": 4.0, "up": 0.2, "hold": 2.4, "orbit": 0.4, "dolly": 6, "title": L("乌鸦", "THE CROW", "カラス")}, "sound": "crow"},
                             {"at": 0.4, "mv": {"slam": L("带它到钟那里", "GET IT TO THE BELL", "鐘まで連れてって"), "sub": L("别让纸人碰到它", "KEEP THE DOLLS OFF IT", "人形を近づけないで")}}],
                  "clear": [{"at": 0, "sound": "bellToll", "say": "real"}]},
           "waves": [[{"t": 0, "type": "katashiro", "count": 10, "ahead": 9, "side": 0, "y": 8, "spread": 4, "every": 0.15}],
                     [{"t": 0, "type": "chochin", "ahead": 7, "side": -2.5, "y": 7}, {"t": 0.8, "type": "chochin", "ahead": 11, "side": 2.5, "y": 7.5},
                      {"t": 1.5, "type": "katashiro", "count": 12, "ahead": 12, "side": 0, "y": 8, "spread": 4, "every": 0.12}]]},
  "kn2": {"cam": [0, 1.4, 4.6], "look": [0, 1.3, 0], "cp": True, "dial": {"center": [0, 0, 0], "r": 4.6, "forms": ["a", "c", "e"], "perForm": 4},
          "waves": [[kat(12, 0, -2, 2.6, 4, 5)], [kat(14, 0, -2, 2.8, 6, 6)], [{"t": 0, "type": "chochin", "x": -2, "z": -2, "y": 2.0}, {"t": 1, "type": "chochin", "x": 2, "z": -2, "y": 2.2}],
                    [kat(16, 0, -1, 2.8, 8, 6)]]},
}

for k, nw, nf, fl, walls in (("genkan", 4, 3, ("slippers",), True), ("kyakushitsu", 4, 2, ("doll", "slippers"), True), ("rouka", 8, 4, ("slippers", "doll"), True),
                            ("furo", 4, 1, ("slippers",), True), ("hiroma", 6, 3, ("doll", "slippers"), True), ("nakaniwa", 0, 4, ("slippers",), False),
                            ("kura", 4, 2, ("doll",), True), ("chika", 6, 2, ("doll", "slippers"), True), ("shoro", 4, 0, (), True)):
    marks(SETS[f"ep2_{k}"], k, nw, nf, fl, walls)

# the loose things standing about (round 66; user 2026-10-20: the whole game physical): rigid bodies in the game (docs/TECH.md「物理」) that
# rock when shot, fly and tumble when broken, get shoved by the monsters. Along the side walls (the middle is the way the camera walks),
# never on a stop's camera, a mechanism, the stairs or a hole in the floor; height in metres; solid ones (stone) never move
PROP_H = {"umbrella": 1.0, "hibachi": 0.6, "tanuki": 0.8, "getabox": 0.5, "chabudai": 0.55, "zaisu": 0.6, "andon": 0.95, "zabuton": 0.45,
          "bucket": 0.45, "vase": 0.9, "towels": 0.5, "tray": 0.8, "oke": 0.55, "stool": 0.35, "yuzu": 0.35, "bottles": 0.4, "taru": 0.85,
          "shamisen": 1.1, "ozen": 0.45, "lantern": 1.3, "bonsai": 0.8, "bench": 0.6, "watering": 0.6, "koi": 0.55, "nagamochi": 0.8,
          "boxes": 0.9, "kame": 0.9, "mino": 1.4, "crate": 0.7, "wheel": 1.0, "barrel": 0.8, "jizo": 0.7, "toolbox": 0.45, "cogs": 0.5,
          "oilcan": 0.7, "spool": 0.7, "saisen": 0.7, "shimenawa": 0.4, "drum": 0.8, "incense": 0.6}
SOLID = {"jizo", "koi"}
def scatter(S, k):
    H = S["hall"]; rng = np.random.default_rng(sum(map(ord, k)) * 29); out = []
    names = [n for n, _ in R66.PROPS.get(k, []) if have(f"prop/ep2s_{k}_{n}")]
    if not names: return
    W = H["x1"] - H["x0"]; z_hi, z_lo = H["z0"] - 1.6, H["z1"] + 1.2
    avoid = [(st["cam"][0], st["cam"][2], 1.7) for st in S["stations"].values() if st.get("cam")]
    avoid += [(g.get("x", 0), g["z"], 1.1) for g in S["gimmicks"] if g.get("z") is not None]
    for s in H.get("stairs", []): avoid.append((s["x"], (s["z0"] + s["z1"]) / 2, max(1.5, abs(s["z0"] - s["z1"]) / 2 + 0.6)))
    for s in H.get("shafts", []):
        if s.get("at") == "floor": avoid.append((s["x"], s["z"], s["size"] / 2 + 1.0))
    free = lambda x, z: all((x - ax) ** 2 + (z - az) ** 2 > r * r for ax, az, r in avoid) and all((x - o["x"]) ** 2 + (z - o["z"]) ** 2 > 1.0 for o in out)
    for i, n in enumerate(names * 2):   # (each thing up to twice in a long place, in different spots)
        if i >= max(len(names), round((z_hi - z_lo) / 2.2)): break
        for _ in range(40):
            side = -1 if (i + int(rng.integers(2))) % 2 else 1
            x = side * (W / 2 - rng.uniform(0.45, 0.9)); z = rng.uniform(z_lo, z_hi)
            if z_hi > z_lo and free(x, z):
                p = {"k": f"prop/ep2s_{k}_{n}", "h": PROP_H.get(n, 0.7), "x": round(float(x), 2), "z": round(float(z), 2)}
                if n in SOLID: p["solid"] = True
                out.append(p); avoid.append((x, z, 0.9)); break
    if out: S["props"] = out
for k in ("genkan", "kyakushitsu", "rouka", "furo", "hiroma", "nakaniwa", "kura", "chika", "shoro", "kane"):
    scatter(SETS[f"ep2_{k}"], k)

# the place used against the monsters too (DESIGN「总纲」 地形能用 - user 2026-10-21 "do episode 2"): whatever drops or tips over onto her
# (lanterns, screens, stone lanterns, the lift's weights) crushes the monsters under it as well (src/battle/gimmick.js crush)
for S in SETS.values():
    for g in S["gimmicks"]:
        do = g.get("do", []); trap = next((e["trap"] for e in do if "trap" in e), None)
        if trap and not trap.get("kill"):
            for e in do:
                if "drop" in e or "topple" in e: e.setdefault("crush", {"r": trap.get("r", 2.4), "dmg": 700})

# where each monster comes in from (DESIGN「怪要有合理的入场」, user 2026-10-19 batch 23: many small ones appeared out of nowhere on a
# flat floor; in 3D they can pour down the stairs, out of the rooms): only the ones that had none or popped up from the floor. door = out of
# the passage behind that doorway (way end / back), stairs = down the genkan stairs, wall = through a side wall (the paper shoji of the
# rooms along it), drop = down from the beams on a string, statue = a thing standing there comes alive, outside = in over the railing
ENTER = {
    "gk1": {"katashiro": {"from": "door"}, "surippa": {"from": "stairs"}, "kokeshi": {"from": "stairs"}},
    "rc2": {"surippa": {"from": "door", "way": "back"}, "katashiro": {"from": "door", "way": "back"}, "karakasa": {"from": "wall"}},
    "fu1": {"katashiro": {"from": "ceiling"}, "surippa": {"from": "wall"}},
    "hr1": {"chochin": {"from": "drop"}, "karakasa": {"from": "wall"}, "futon": {"from": "wall"}, "kokeshi": {"from": "door", "way": "d2"}, "surippa": {"from": "door", "way": "d1"}},
    "hr2": {"futon": {"from": "wall"}, "surippa": {"from": "door", "way": "d1"}, "kokeshi": {"from": "door", "way": "d2"}},
    "ku2": {"kokeshi": {"from": "statue", "wake": 0.8}, "katashiro": {"from": "ceiling"}, "chochin": {"from": "drop"}, "futon": {"from": "wall"}, "karakasa": {"from": "wall"}},
    "ku3": {"katashiro": {"from": "ceiling"}, "kokeshi": {"from": "statue", "wake": 0.6}},
    "ch2": {"katashiro": {"from": "ceiling"}, "surippa": {"from": "wall"}},
    "ch2b": {"kokeshi": {"from": "wall"}, "katashiro": {"from": "ceiling"}, "surippa": {"from": "wall"}},
    "kn2": {"katashiro": {"from": "outside"}, "chochin": {"from": "outside"}},
}
for S in SETS.values():
    for sid, st in S["stations"].items():
        for wave in st.get("waves", []):
            for e in wave:
                how = ENTER.get(sid, {}).get(e.get("type"))
                if how and e.get("from") in (None, "pop"): e.update(how)
# the monsters' own play (DESIGN「停留点不只是一个镜头、一种打法」 怪的演出, src/battle/acts.js), a wave of its own, where the stop's corner
# view looks: two slippers squabbling in the entrance hall; kokeshi in a ring round a circle in the banquet hall - all down in time, or a
# futon rises out of it; in the storehouse a straw raincoat hanging there shudders and turns into an umbrella yokai
def act_wave(sid, i, e):
    for S in SETS.values():
        if sid in S["stations"]: S["stations"][sid]["waves"].insert(i, [e]); return
act_wave("gk1", 1, {"t": 0.3, "act": "squabble", "of": ["surippa", "surippa"], "x": 0.2, "z": -5.8})
act_wave("hr1", 1, {"t": 0.3, "act": "ritual", "of": "kokeshi", "n": 4, "r": 1.8, "x": 0.3, "z": -8.5})   # (no clock: user 2026-10-21 - shown, then cleared)
act_wave("ku2", 1, {"t": 0.6, "act": "transform", "k": "prop/ep2s_kura_mino", "h": 1.3, "x": 0.6, "z": -7.0, "of": "karakasa"})
# the story's close-ups and comic panels (user 2026-10-21: a close-up where the story wants it - not on every big one, not never; a long
# stage like this one has plenty of them; a close-up is a comic page of its own, not the camera dragged through the fight: cues.js
# vignette, src/ui/vignette.js; the little slanted panels cut in on a run: insert)
def stop(sid):
    return next(S["stations"][sid] for S in SETS.values() if sid in S["stations"])
def beat(sid, *cues):
    st = stop(sid); st.setdefault("on", {}).setdefault("arrive", []).extend(cues)
# (the great hall's ritual told by a close look at the ring, then cleared like any others: user 2026-10-21)
stop("hr1")["waves"][1].append({"t": 0.7, "storyboard": {"lead": 0.3, "shots": [{"cam": [3.5, 2.3, -3.4], "look": [0.3, 0.1, -8.5], "zoom": 6, "to": {"cam": [3.2, 2.15, -3.9]},
    "show": ["kokeshi"], "hold": 2.2, "cap": L("小芥子围着法阵在念咒……", "the kokeshi are chanting round a circle...", "こけしが魔法陣を囲んで唱えている……")}]}})
beat("sh1", {"at": 1.6, "say": "shaft", "who": "pink"}, {"at": 3.8, "say": "shaft", "who": "cat"})
beat("kn1", {"at": 1.8, "say": "dawn", "who": "pink"}, {"at": 4.0, "say": "dawn", "who": "cat"})
stop("sh1")["pause"] = 6.0; stop("kn1")["pause"] = 6.0   # (long enough for the two of them to have their word)
for S in SETS.values():   # (no checkpoints inside a stage: each stretch between two of them is a small stage now - user 2026-10-21)
    for st in S["stations"].values(): st.pop("cp", None)
beat("rc1", {"at": 0.4, "insert": {"k": "enemy/she_a_walk0", "side": 1, "life": 1.3}, "sound": "snipFar"})        # (behind them in the dark corridor: her blades)
beat("nk1", {"at": 0.4, "insert": {"k": "enemy/she_a_stare", "side": -1, "life": 1.3}, "sound": "snipFar"})       # (out on the walkway in the rain, she is there again)
# (the first storyboarded close-up - user 2026-10-21: a close-up is shots, a pose of its own, rise and fall - she wades across: the pond in
# the rain with nothing in it, held; cut to her geta stepping down into the water; cut to her face up close, one eye through the wet hair, a
# little bell; the first shot again - now she is standing out in the pond - and the fight starts. Painted shots: R82, tools/rounds/r82_import.py)
beat("nk3", {"at": 0.0, "storyboard": {"lead": 0.7, "shots": [
    {"cam": [4.6, 0.55, -24.5], "look": [10, 1.0, -33], "zoom": 8, "to": {"cam": [4.85, 0.5, -25.0]}, "hold": 1.7},
    {"k": "comic/ep2s_she_feet", "hold": 1.1, "push": [1.0, 1.04], "focus": [0.45, 0.62], "sfx": "splash"},
    {"k": "comic/ep2s_she_face", "hold": 1.8, "push": [1.02, 1.1], "focus": [0.62, 0.5], "sfx": "bellSmall"},
    {"cam": [4.85, 0.5, -25.0], "look": [10, 1.0, -33], "zoom": 8, "show": ["she"], "hold": 1.4}]}})   # (the first shot again: now she is in it)
KW = next((w for w in SETS["ep2_kura"]["hall"].get("ways", []) if w["id"] == "back"), None)
if KW: beat("ku1", {"at": 1.3, "vignette": {"k": "ep2/door_kura_r", "color": "#3a2a22", "title": L("被锁在里面了", "LOCKED IN", "閉じ込められた"),
                                               "sub": L("门从外面闩上了", "barred from the outside", "外から閂をかけられた")}})
for wave in stop("ku2")["waves"]:   # (the hour of the ox: every clock in the storehouse strikes - the great one up close)
    if any(e.get("hint") == "ep2Ushimitsu" for e in wave): wave.append({"t": 0.2, "vignette": {"k": "prop/ep2_clock_wadokei", "color": "#3a2a22", "title": L("丑三时", "THE HOUR OF THE OX", "丑三つ時"),
                                                                                              "sub": L("满屋的钟一起敲响", "every clock in the room strikes", "部屋中の時計が一斉に鳴る")}})
beat("ch3", {"at": 0.3, "insert": {"k": "enemy/kaiko_lunge", "side": -1, "life": 1.4}})                         # (the silkworm comes for them)
beat("sh2", {"at": 0.6, "insert": {"k": "enemy/she_c_climb0", "side": 1, "life": 1.4}, "sound": "ropeCreak"})    # (down the shaft: she climbs after them)
ORDER = ["gk0", "gk1", "gk2", "ky0", "ky1", "ro0", "ro1", "fu0", "fu1", "rc1", "rc2", "kh1", "kh2", "hr0", "hr1", "hr2", "nk0", "nk1", "nk2", "nk3", "ku1", "ku1b", "ku2", "ku3",
         "ch1", "ch2", "ch2b", "ch3", "ch4", "sh1", "sh2", "sh3", "kn1", "kn1c", "kn2"]
PLACES = ["ep2_genkan", "ep2_kyakushitsu", "ep2_rouka", "ep2_furo", "ep2_hiroma", "ep2_nakaniwa", "ep2_kura", "ep2_chika", "ep2_shoro", "ep2_kane"]
allst = {k for s in SETS.values() for k in s["stations"]}
assert set(ORDER) == allst, (set(ORDER) ^ allst)

DOC = ("第 2 话「钟楼惊宿」十个小关（docs/DESIGN.md「第 2 话」，src/battle/chase.js；由 tools/rounds/ep2_level.py 生成，不要手改）：十个地方连成一条路，"
       "镜头自己走过去（Game.passThrough：两人退出画面，转向出口，开门，走进门洞后面的过道 hall.ways，或上楼梯 hall.stairs、爬梯子、钻她剪开的洞，在过道的黑暗里换成下一个地方，从那边的过道 / 洞 / 天窗走出来）；站点 leave 怎么离开上一个地方（way、via、steps、hole、exit），arrive 怎么进来（way、from、hole、at、look）；hall.shafts 天花板 / 地板上的竖井。站点多了：chase 倒跑、block 路障、hide 躲藏点、"
       "she 她在这一站巡游、dial 钟楼表盘决战；leave 怎么离开上一个地方（hole 她剪开的墙洞）；state 这个地方这时停没停电；cp 检查点；fire 到了就触发的机关；"
       "swap 换掉一块墙的图。机关多了 drop / trap / door / lure / read / node / toll / free / collapse，block: true 是挡路的东西，on: floor 平放在地上。")
SP = packs.new_file("sets", "ep2_genkan")   # (episode 2's level pack)
SP.write_text(json.dumps({"_doc": DOC, **SETS}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(SP)], check=True, stdin=subprocess.DEVNULL)

EP = packs.data_file("episodes", "ep2"); raw = EP.read_bytes(); crlf = b"\r\n" in raw; E = json.loads(raw.decode("utf-8"))
E["ep2"]["set"] = "ep2_genkan"
STAGES = [   # (id, name, its places, its stops)
    ("genkan", L("玄关", "ENTRANCE HALL", "玄関"), ["genkan"], ["gk0", "gk1", "gk2"]),
    ("room", L("客房与浴场", "ROOM AND BATH", "客室と湯殿"), ["kyakushitsu", "rouka", "furo"], ["ky0", "ky1", "ro0", "ro1", "fu0", "fu1"]),
    ("run", L("逃回客房", "BACK TO THE ROOM", "客室へ逃げろ"), ["rouka", "kyakushitsu"], ["rc1", "rc2", "kh1", "kh2"]),
    ("hiroma", L("大广间", "BANQUET HALL", "大広間"), ["hiroma"], ["hr0", "hr1", "hr2"]),
    ("nakaniwa", L("雨中渡廊", "RAINY WALKWAY", "雨の渡り廊下"), ["nakaniwa"], ["nk0", "nk1", "nk2", "nk3"]),
    ("kura", L("土藏", "STOREHOUSE", "蔵"), ["kura"], ["ku1", "ku1b", "ku2", "ku3"]),
    ("chika", L("地底", "UNDERGROUND", "地下"), ["chika"], ["ch1", "ch2", "ch2b"]),
    ("kerosene", L("灯油与烛火", "OIL AND CANDLES", "灯油と蝋燭"), ["chika"], ["ch3", "ch4"]),
    ("shoro", L("钟楼竖井", "BELL TOWER SHAFT", "鐘楼"), ["shoro"], ["sh1", "sh2", "sh3"]),
    ("kane", L("时之钟", "THE TIME BELL", "時の鐘"), ["kane"], ["kn1", "kn1c", "kn2"]),
]
assert [s for st in STAGES for s in st[3]] == ORDER
steps = [{"comic": "ep2_open"}, {"comic": "ep2_rules"}]   # (the house rules: their own page, round 65)
for i, (sid, name, pl, sts) in enumerate(STAGES):
    nxt = [f"ep2_{STAGES[i + 1][2][0]}"] if i + 1 < len(STAGES) and STAGES[i + 1][2][0] not in pl else []   # (loaded before the walk there)
    st = {"stage": sid, "set": f"ep2_{pl[0]}", "places": [f"ep2_{p}" for p in pl] + nxt, "stations": sts, "name": name,
          "thumb": next((k for k in (f"ui/sel_thumb_ep2_{sid}", f"ui/sel_thumb_ep2_{pl[0]}") if have(k)), "ui/sel_thumb_ep2_inn")}
    if any(s in sts for s in ("fu1", "rc1", "rc2", "kh1", "hr1", "hr2", "nk1", "nk2", "nk3", "ku3", "ch2", "ch2b", "ch3", "sh2", "sh3", "kn2")):
        st.update({"she": "she", "kaiko": "kaiko"})
    st["shots"] = ["geta", "scissors", "pins", "crane"]
    steps.append(st)
E["ep2"]["steps"] = steps + [{"comic": "ep2_end"}]
t = json.dumps(E, ensure_ascii=False, indent=2) + "\n"; EP.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(EP)], check=True, stdin=subprocess.DEVNULL)
print("ok", len(SETS), "places", len(ORDER), "stops; doors:", {k: (v.get("exit"), (v.get("entry") or {}).get("at")) for k, v in SETS.items()})
