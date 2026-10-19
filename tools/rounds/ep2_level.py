"""Episode 2's one long stage (docs/DESIGN.md「第 2 话」钟楼惊宿; src/battle/chase.js) -> content sets/ep2.json + the episode's steps.
Ten places in a row (round 63's panels), walked through without a cut (Game.passThrough: the doorway in a far wall, a blink of black, the
next place's doorway). The doorways are where round 63 painted them (magenta, keyed out): measured here from the pictures. Every stop's
place is the set it is listed in; the episode's stage step lists the places in order ("places") and the stops ("stations").
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
sys.path[:0] = [str(ROOT / "tools" / "rounds")]
import job_specs63 as J
MAN = json.loads((A / "manifest.json").read_text())
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

def door(key, W, h):
    """the doorway painted in a far / back wall (keyed out): (x of its middle, the height of its middle) in the place's metres, or None"""
    if not have(key) or not MAN[key].get("keyed"): return None
    im = Image.open(A / MAN[key]["src"].replace("assets/", "")).convert("RGBA"); a = np.asarray(im)[..., 3] < 100
    lab, n = ndimage.label(a)
    if not n: return None
    big = 1 + int(np.argmax(ndimage.sum(a, lab, range(1, n + 1)))); ys, xs = np.nonzero(lab == big)
    u = (xs.min() + xs.max()) / 2 / a.shape[1]; v = 1 - (ys.min() + ys.max()) / 2 / a.shape[0]
    return round(-W / 2 + u * W, 2), round(v * h, 2)

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
    d1 = door(f"ep2/{k}_end1", P["W"], P["h"]); d0 = door(f"ep2/{k}_back1", P["W"], P["h"])
    if d1: S["exit"] = [d1[0], max(1.15, min(d1[1], P["h"] - 0.8)) if k == "genkan" else 1.15, round(H["z1"] - 0.6, 2)]   # (only the stairs go up)
    if d0: S["entry"] = {"at": [d0[0], 1.15, round(H["z0"] - 0.25, 2)], "look": [0, 1.1, H["z1"]]}
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
gm(S, id="note", k="prop/ep2_note", on="stand", x=2.6, y=0, z=-3.6, w=0.55, station="gk1", mark=True, do=[{"read": "ep2Rules"}, {"meter": 0}])
# the doll in its case (user 2026-10-19 batch 23: it twitched in a blink nobody saw): shown up close for 7 s (gk2 focus) - it twitches,
# again, harder; the lights flicker and when they come back the case is empty; a fusuma slides somewhere; the girls react
gm(S, id="case", k="prop/ep2_case_doll", kx="prop/ep2_case_empty", on="stand", x=-2.7, y=0, z=-5.2, w=1.6, ry=60, shoot=False, solid=True,
   do=[{"t": 0.5, "twitch": {"n": 1, "amp": 0.03, "creak": True}}, {"t": 1.7, "twitch": {"n": 2, "amp": 0.05, "every": 0.3}},
       {"t": 3.0, "twitch": {"n": 4, "amp": 0.08, "every": 0.14}}, {"t": 3.1, "sfx": "dollScreech"}, {"t": 4.2, "flicker": 0.7}, {"t": 4.55, "swap": True},
       {"t": 5.2, "sound": "shoji"}, {"t": 5.8, "say": "scare"}])
gm(S, id="cage", k="prop/ep2_cage", kx="prop/ep2_cage_open", on="stand", x=2.9, y=0, z=-7.0, w=0.9, ry=-60, station="gk1", do=[{"free": True}, {"flip": True}])
gm(S, id="bell", k="prop/ep2_bell_desk", on="stand", x=2.4, y=0.95, z=-2.6, w=0.3, station="gk1", do=[{"sound": "bellSmall"}, {"say": "real"}])
S["stations"] = {
  "gk0": {"cam": [0, 1.25, 1.8], "look": [0, 1.2, -9], "pause": 1.4, "sfx": "bellSmall", "say": "real"},
  "gk1": {"cam": [0.2, 1.2, -1.0], "look": [1.2, 1.15, -9], "covers": cov("genkan", 1, 2), "cp": True, "hint": "ep2RulesHint",
          "waves": [[{"t": 0, "type": "surippa", "x": -1.6, "z": -5.5, "from": "statue", "wake": 2.5}, {"t": 0, "type": "surippa", "x": 0.2, "z": -6.0, "from": "statue", "wake": 3.2},
                     {"t": 0, "type": "surippa", "x": 1.5, "z": -5.8, "from": "statue", "wake": 3.9}],
                    [kat(14, 0, -6.5), {"t": 2, "type": "surippa", "count": 4, "x": 0, "z": -7.5, "spread": 3, "every": 0.35}],
                    [{"t": 0, "type": "kokeshi", "x": -1.8, "z": -7.0, "from": "pop"}, {"t": 0.8, "type": "kokeshi", "x": 1.8, "z": -7.2, "from": "pop"}, kat(12, 0, -7, 2.6, 2.5)]]},
  "gk2": {"via": [[0, 1.2, -5]], "cam": [0, 1.3, -7.4], "look": [-2.7, 1.3, -5.2], "pause": 1.0, "focus": {"gimmick": "case", "dist": 2.3, "up": 0.05, "v": 0.55, "hold": 6.8},
          "sfx": "snipFar"},
}
# ================================================================ 2. their room (calm): drop the bags
S, H, d0, d1 = place("kyakushitsu", False, music="ep2_inn")
xe = d1[0] if d1 else 0
S["stations"] = {
  "ky0": {"arrive": {"at": [xe, 1.15, H["z1"] + 0.3], "look": [0, 1.1, H["z0"]]}, "cam": [0.3, 1.15, -3.2], "look": [-2.7, 1.25, -2.4], "pause": 1.4, "sfx": "fusumaOpen", "say": "real"},
  "ky1": {"cam": [0.6, 1.15, -1.4], "look": [-1.0, 1.5, 2.0], "pause": 1.4, "say": "photo"},
}
# ================================================================ 3. the corridor (calm), 4. the bath
S, H, d0, d1 = place("rouka", False, music="ep2_inn")
xb = d0[0] if d0 else 0
S["stations"] = {
  "ro0": {"arrive": {"at": [xb, 1.15, H["z0"] - 0.25], "look": [0, 1.1, H["z1"]]}, "cam": [0, 1.15, -8], "look": [0, 1.1, H["z1"]], "pause": 0.8, "sfx": "snipFar"},
  "ro1": {"cam": [0, 1.15, -20.5], "look": [0, 1.1, H["z1"]], "pause": 1.0, "sfx": "clockChime"},
}
S, H, d0, d1 = place("furo", False, music=None)
S["stations"] = {
  "fu0": {"cam": [0, 1.15, -2.8], "look": [0, 0.9, H["z1"]], "pause": 2.0, "sfx": "bathLid", "say": "scare", "music": None},
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
gm(S, id="jam1", k="cover/ep2_rouka4", on="stand", x=-0.6, y=0, z=0.6, w=1.5, hp=36, station="rc2", block=True, do=[{"sound": "woodBreak"}, {"gone": True}])
gm(S, id="jam2", k="cover/ep2_rouka1", on="stand", x=0.7, y=0, z=0.9, w=1.4, hp=36, station="rc2", block=True, do=[{"sound": "tear"}, {"gone": True}])
S["stations"].update({
  "rc1": {"leave": {"exit": [FURO_D0, 1.15, SETS["ep2_furo"]["hall"]["z0"] + 0.6]}, "arrive": {"at": [0, 1.15, H["z1"] + 0.6], "look": [0, 1.1, H["z1"] - 3]}, "state": 1, "cam": [0, 1.15, -4.0], "look": [0, 1.1, H["z1"]],
          "chase": {"path": [[0.3, 1.15, -21], [-0.35, 1.15, -16], [0.35, 1.15, -11], [-0.2, 1.15, -7]], "face": "back", "form": "a", "dist": 6.5, "speed": 1.25,
                    "herSpeed": 2.4, "hint": "sheTrap"}},
  "rc2": {"cam": [0, 1.15, -4.0], "look": [0, 1.1, H["z0"]], "covers": cov("rouka", 2, 3), "cp": True, "state": 1,
          "block": {"form": "a", "dist": 11, "hint": "sheBlock"},
          "waves": [[{"t": 0, "type": "surippa", "count": 5, "x": 0, "z": 0, "spread": 2.4, "every": 0.35}], [kat(14, 0, 0.5, 2.3)],
                    [{"t": 0, "type": "karakasa", "x": -0.6, "z": 0.8, "from": "pop"}, {"t": 1.2, "type": "surippa", "count": 4, "x": 0, "z": 0.5, "spread": 2, "every": 0.4}]]},
})
# ================================================================ 2'. the room in the dark: hiding in the closet
S = SETS["ep2_kyakushitsu"]; H = S["hall"]
S["stations"].update({
  "kh1": {"leave": {"exit": [xb, 1.15, SETS["ep2_rouka"]["hall"]["z0"] + 0.6]}, "arrive": {"at": [xe, 1.15, H["z1"] + 0.35], "look": [0, 1.1, H["z0"]]},
          "state": 1, "cam": [-1.9, 1.0, -2.6], "look": [2.7, 1.0, -3.0], "hide": {"form": "a", "from": [xe, H["z1"] + 0.6], "at": [0.6, -3.2], "stabs": 6}},
})
# ================================================================ 5. the banquet hall: shadows on the shoji, dolls from the skylight; the blocked doors
S, H, d0, d1 = place("hiroma", True)
for i, (x, z) in enumerate(((-2.2, -8.0), (2.4, -12.0))):
    gm(S, id=f"bigl{i}", k="prop/ep2_lantern_big", on="hang", x=x, y=3.4, z=z, w=1.0, station="hr1", mark=True, do=[{"drop": {"t": 0.5}}, {"trap": {"r": 2.6, "down": 9}}])
for i, (x, z, a) in enumerate(((-4.6, -10.0, 1.4), (4.6, -13.0, -1.4))):
    gm(S, id=f"byobu{i}", k="prop/ep2_byobu", on="stand", x=x, y=0, z=z, w=2.6, station="hr1", mark=True, do=[{"topple": a}, {"trap": {"r": 3.2, "down": 7}}])
for i, x in enumerate((-2.6, 0, 2.6)):
    gm(S, id=f"zen{i}", k="prop/ep2_zen", on="stand", x=x, y=0, z=-15.6 - 0.3 * (i % 2), w=1.8, hp=40, station="hr2", block=True, do=[{"sound": "woodBreak"}, {"gone": True}])
gm(S, id="pclock", k="prop/ep2_clock_pillar", on="stand", x=-4.3, y=0, z=-12.5, w=0.75, ry=35, station="hr2", mark=True, do=[{"sound": "clockChime"}, {"lure": {"t": 6}}])
S["stations"] = {
  "hr0": {"leave": {"hole": {"on": "right", "x": 2.7, "z": -3.0, "y": 1.2, "size": 2.6}, "exit": [3.4, 1.15, -3.0]},
          "arrive": {"at": [-5.4, 1.2, 1.2], "look": [0, 1.2, -16]}, "cam": [-1.0, 1.2, -1.2], "look": [0, 1.2, -16], "pause": 1.2, "sfx": "stab", "say": "scare"},
  "hr1": {"cam": [0, 1.2, -2.0], "look": [0, 1.2, -16], "covers": cov("hiroma", 1, 2), "cp": True, "she": {"form": "a", "at": [4.0, -15], "wake": 9},
          "waves": [[kat(18, 0, -9, 3.2, 0, 6, "ceiling")], [{"t": 0, "type": "chochin", "x": -2.5, "z": -11, "y": 1.2}, {"t": 0.8, "type": "chochin", "x": 2.5, "z": -11.5, "y": 1.2},
                     {"t": 1.6, "type": "karakasa", "x": 0, "z": -12, "from": "pop"}],
                    [{"t": 0, "type": "futon", "x": -1.8, "z": -12, "from": "pop"}, {"t": 0.6, "type": "kokeshi", "x": 2.2, "z": -13, "from": "pop"}, kat(16, 0, -10, 3.0, 2, 6, "ceiling")],
                    [{"t": 0, "type": "karakasa", "x": -2, "z": -12, "from": "pop"}, {"t": 0.6, "type": "karakasa", "x": 2, "z": -12.5, "from": "pop"},
                     {"t": 1.4, "type": "chochin", "x": 0, "z": -13, "y": 1.8}, {"t": 3, "type": "surippa", "count": 6, "x": 0, "z": -11, "spread": 5, "every": 0.3}]]},
  "hr2": {"cam": [0, 1.2, -9.5], "look": [0, 1.2, H["z1"]], "covers": cov("hiroma", 3, 4), "cp": True, "block": {"form": "a", "dist": 13, "hint": "sheBlock"},
          "waves": [[{"t": 0, "type": "futon", "x": -2.4, "z": -15, "from": "pop"}, {"t": 0.8, "type": "futon", "x": 2.4, "z": -15.2, "from": "pop"}],
                    [kat(16, 0, -14, 3.0, 0, 6, "ceiling"), {"t": 2, "type": "surippa", "count": 5, "x": 0, "z": -15, "spread": 5, "every": 0.3}]]},
}
# ================================================================ 6. the rainy walkway: the run (shutters, stone lanterns, the bamboo fountain), hiding
S, H, d0, d1 = place("nakaniwa", True)
for i, (x, z, a) in enumerate(((-1.3, -6.0, -1.3), (1.3, -13.0, 1.3))):
    gm(S, id=f"ishi{i}", k="prop/ep2_ishidoro", on="stand", x=x, y=0, z=z, w=0.9, station="nk1", mark=True, do=[{"topple": a}, {"sound": "stoneLantern"}, {"trap": {"r": 2.4, "down": 8}}])
gm(S, id="amado", k="prop/ep2_amado", on="stand", x=0, y=0, z=-9.5, w=2.8, station="nk1", mark=True, shut=True, do=[{"sound": "amado"}, {"door": {"hold": 5}}])
gm(S, id="amado2", k="prop/ep2_amado", on="stand", x=0, y=0, z=-15.8, w=2.8, station="nk1", mark=True, shut=True, do=[{"sound": "amado"}, {"door": {"hold": 4}}])
gm(S, id="shishi", k="prop/ep2_shishi", on="stand", x=1.3, y=0, z=-18.5, w=0.9, station="nk1", mark=True, do=[{"sound": "shishiOdoshi"}, {"lure": {"t": 6}}])
S["stations"] = {
  "nk1": {"cam": [0, 1.15, -21.5], "look": [0, 1.1, 2], "cp": True, "chase": {"path": [[0.2, 1.15, 0.0], [-0.3, 1.15, -5.5], [0.3, 1.15, -11.5], [0, 1.15, -17]], "face": "back", "form": "a", "dist": 8,
                   "speed": 1.35, "herSpeed": 2.5, "hint": "sheDoor"}},
  "nk2": {"cam": [1.1, 0.95, -23.4], "look": [-0.4, 1.0, -12], "hide": {"form": "a", "from": [0, -11], "at": [0.1, -20.2], "stabs": 6}},
  # (out of hiding: the umbrellas come down the walkway in the rain, the lanterns with them, and she comes back from the storehouse's door)
  "nk3": {"cam": [0, 1.15, -13.0], "look": [0, 1.1, H["z1"]], "covers": cov("nakaniwa", 1, 2), "cp": True, "she": {"form": "a", "at": [1.4, H["z1"] + 1.2], "wake": 11},
          "hint": "sheStone",
          "waves": [[{"t": 0, "type": "karakasa", "x": -1.2, "z": -19, "from": "pop"}, {"t": 0.7, "type": "karakasa", "x": 1.2, "z": -20, "from": "pop"}, kat(12, 0, -19, 2.4, 1.5)],
                    [{"t": 0, "type": "chochin", "x": -1.0, "z": -21, "y": 1.3}, {"t": 0.8, "type": "chochin", "x": 1.0, "z": -21.5, "y": 1.6},
                     {"t": 1.6, "type": "surippa", "count": 6, "x": 0, "z": -20, "spread": 2.2, "every": 0.3}],
                    [{"t": 0, "type": "futon", "x": 0, "z": -21, "from": "pop"}, {"t": 0.8, "type": "karakasa", "x": -1.3, "z": -20.5, "from": "pop"},
                     {"t": 1.4, "type": "karakasa", "x": 1.3, "z": -20.5, "from": "pop"}, kat(14, 0, -20, 2.5, 3)]]},
}
for i, (x, z, a) in enumerate(((-1.25, -17.5, -1.3), (1.25, -21.0, 1.3))):
    gm(S, id=f"ishi{i + 2}", k="prop/ep2_ishidoro", on="stand", x=x, y=0, z=z, w=0.9, station="nk3", mark=True, do=[{"topple": a}, {"sound": "stoneLantern"}, {"trap": {"r": 2.6, "down": 8}}])
# ================================================================ 7. the storehouse: locked in, the truth, the clocks; the floor hatch
S, H, d0, d1 = place("kura", True)
gm(S, id="ledger", k="prop/ep2_ledger", on="stand", x=-2.2, y=0.8, z=-5.0, w=0.9, station="ku2", mark=True, do=[{"read": "ep2Ledger"}])
gm(S, id="wadokei", k="prop/ep2_clock_wadokei", on="stand", x=2.3, y=0, z=-8.5, w=1.0, station="ku2", do=[{"read": "ep2Clocks"}, {"sound": "clocksAll"}])
gm(S, id="hatch", k="prop/ep2_hatch", on="floor", x=0, z=-6.5, w=1.4, hp=30, station="ku3", mark=True, block=True, do=[{"sound": "woodBreak"}, {"collapse": True}])
S["stations"] = {
  "ku1": {"cam": [0, 1.2, -2.0], "look": [0, 1.2, H["z1"]], "pause": 1.0, "sfx": "doorSlam", "say": "scare"},
  "ku2": {"cam": [0, 1.2, -1.8], "look": [0, 1.2, H["z1"]], "covers": cov("kura", 1, 2), "cp": True,
          "waves": [[{"t": 0, "type": "kokeshi", "x": -2, "z": -8, "from": "pop"}, {"t": 0.6, "type": "kokeshi", "x": 2, "z": -8.5, "from": "pop"}, {"t": 1.4, "type": "kokeshi", "x": 0, "z": -9.5, "from": "pop"}],
                    [{"t": 0, "sound": "clocksAll", "hint": "ep2Ushimitsu"}, kat(18, 0, -8, 2.6, 0.8), {"t": 2, "type": "chochin", "x": 0, "z": -9.5, "y": 1.8}],
                    [{"t": 0, "type": "futon", "x": 0, "z": -9, "from": "pop"}, {"t": 1, "type": "karakasa", "x": -2, "z": -8.5, "from": "pop"}, {"t": 1.5, "type": "karakasa", "x": 2, "z": -8.5, "from": "pop"}]]},
  "ku3": {"cam": [0, 1.2, -3.6], "look": [0, 0.2, -6.5], "covers": cov("kura", 3, 4), "hint": "ep2Hatch", "block": {"form": "a", "dist": 12, "herSpeed": 0.5, "hint": "ep2Hatch"},
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
  "ch1": {"cam": [0, 1.2, -1.0], "look": [0, 1.1, H["z1"]], "enter": {"from": [0, 5, 0], "dur": 0.9, "shake": 1.4}, "pause": 1.0, "say": "scare"},
  "ch2": {"cam": [0, 1.2, -13.5], "look": [0, 1.1, H["z1"]], "covers": cov("chika", 1, 2), "cp": True, "she": {"form": "kaiko", "at": [0, -25.0], "wake": 4.5},
          "waves": [[kat(14, 0, -18, 2.6, 0.5)], [{"t": 0, "type": "surippa", "count": 6, "x": 0, "z": -19, "spread": 5, "every": 0.3}]]},
  "ch2b": {"cam": [0, 1.2, -10.8], "look": [0, 1.1, 2.0], "covers": cov("chika", 1, 2), "block": {"form": "kaiko", "dist": 13, "herSpeed": 0.45, "turnAt": 5.0, "hint": "sheBlock"},
           "waves": [[{"t": 0, "type": "kokeshi", "x": -1.6, "z": -5.2, "from": "pop"}, {"t": 0.7, "type": "kokeshi", "x": 1.6, "z": -5.4, "from": "pop"}],
                     [kat(16, 0, -5.5, 2.4), {"t": 1.5, "type": "surippa", "count": 5, "x": 0, "z": -5, "spread": 2.4, "every": 0.35}]]},
  "ch3": {"cam": [0, 1.2, -1.5], "look": [0, 1.1, H["z1"]], "chase": {"path": [[0.3, 1.2, -9.5], [-0.3, 1.2, -6]], "face": "back", "form": "kaiko", "dist": 6.5, "speed": 0.95,
                                                                       "herSpeed": 1.7, "hint": "sheKerosene"}},
  "ch4": {"cam": [2.4, 1.2, -25.6], "look": [3.6, 1.3, H["z1"]], "swap": {"ep2/chika_end1": "ep2/chika_end1_b"}, "pause": 1.4, "say": "real"},
}
# the burnt altar's picture shows where the lift is: the way on
db = door("ep2/chika_end1_b", J.PLACES["chika"]["W"], J.PLACES["chika"]["h"])
if db: S["exit"] = [db[0], 1.15, round(H["z1"] - 0.6, 2)]
# ================================================================ 9. the bell tower's shaft: the lift up, the scissor spider climbing after; the gear loft
S, H, d0, d1 = place("shoro", True)
for i, y in enumerate((4.6, 6.8, 9.0)):
    gm(S, id=f"wt{i}", k="prop/ep2_weight", on="hang", x=1.3 * (1 - 2 * (i % 2)), y=y, z=-1.6, w=0.7, station="sh2", mark=True, do=[{"drop": {"t": 0.6}}, {"trap": {"r": 3.0, "down": 9}}])
S["stations"] = {
  "sh1": {"arrive": {"at": [0, 1.2, -1.0], "look": [0, 1.2, H["z1"]]}, "cam": [0, 1.2, -2.0], "look": [0, 1.2, H["z1"]], "pause": 1.0, "sfx": "ropeCreak"},
  "sh2": {"cam": [0, 10.4, -2.0], "look": [0, 1.0, -2.6], "cp": True, "chase": {"path": [[0, 3.2, -2.0], [0, 5.6, -2.0], [0, 8.0, -2.0]], "face": "down", "form": "c", "dist": 4.5, "speed": 0.4, "herSpeed": 0.85, "hint": "sheShaft"}},
  "sh3": {"cam": [1.5, 10.6, -4.6], "look": [-1.0, 10.4, 0.5], "hide": {"form": "c", "y": 9.6, "from": [-1.2, 1.0], "at": [-0.2, -2.0], "stabs": 7}},
}
S["exit"] = [0, 12.4, -2.0]
# ================================================================ 10. the bell chamber: the clock face; the bell
S, H, d0, d1 = place("kane", True, music="ep2_final")
ZOD = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "sheep", "monkey", "rooster", "dog", "boar"]
for i, z in enumerate(ZOD):   # (the twelve hours round the circle, the first one in front of the camera's start, clockwise)
    a = math.pi - i * math.pi / 6
    gm(S, id=f"node{i}", k=f"ep2/zodiac_{z}", on="floor", x=round(math.sin(a) * 3.4, 2), z=round(math.cos(a) * 3.4, 2), w=0.9, ry=-i * 30, station="kn2", node=i, armed=False, do=[{"node": True}])
gm(S, id="bell", k="prop/ep2_bell", on="hang", x=0, y=4.3, z=0, w=2.3, hp=60, station="kn2", bell=True, armed=False, do=[{"toll": True}])
gm(S, id="striker", k="prop/ep2_striker", on="hang", x=-2.5, y=4.1, z=0.15, w=2.0, station="kn2", shoot=False, striker=True)
gm(S, id="hand", k="prop/ep2_hand", on="floor", x=0, z=-1.3, w=0.55, station="kn2", shoot=False, hand=True)
S["stations"] = {
  "kn1": {"arrive": {"at": [0, 1.4, 5.6], "look": [0, 1.3, 0]}, "cam": [0, 1.4, 4.6], "look": [0, 1.3, 0], "pause": 1.4, "sfx": "bellToll", "say": "scare"},
  "kn2": {"cam": [0, 1.4, 4.6], "look": [0, 1.3, 0], "cp": True, "dial": {"center": [0, 0, 0], "r": 4.6, "forms": ["a", "c", "e"], "perForm": 4},
          "waves": [[kat(12, 0, -2, 2.6, 4, 5)], [kat(14, 0, -2, 2.8, 6, 6)], [{"t": 0, "type": "chochin", "x": -2, "z": -2, "y": 2.0}, {"t": 1, "type": "chochin", "x": 2, "z": -2, "y": 2.2}],
                    [kat(16, 0, -1, 2.8, 8, 6)]]},
}

for k, nw, nf, fl, walls in (("genkan", 4, 3, ("slippers",), True), ("kyakushitsu", 4, 2, ("doll", "slippers"), True), ("rouka", 8, 4, ("slippers", "doll"), True),
                            ("furo", 4, 1, ("slippers",), True), ("hiroma", 6, 3, ("doll", "slippers"), True), ("nakaniwa", 0, 4, ("slippers",), False),
                            ("kura", 4, 2, ("doll",), True), ("chika", 6, 2, ("doll", "slippers"), True), ("shoro", 4, 0, (), True)):
    marks(SETS[f"ep2_{k}"], k, nw, nf, fl, walls)

ORDER = ["gk0", "gk1", "gk2", "ky0", "ky1", "ro0", "ro1", "fu0", "fu1", "rc1", "rc2", "kh1", "hr0", "hr1", "hr2", "nk1", "nk2", "nk3", "ku1", "ku2", "ku3",
         "ch1", "ch2", "ch2b", "ch3", "ch4", "sh1", "sh2", "sh3", "kn1", "kn2"]
PLACES = ["ep2_genkan", "ep2_kyakushitsu", "ep2_rouka", "ep2_furo", "ep2_hiroma", "ep2_nakaniwa", "ep2_kura", "ep2_chika", "ep2_shoro", "ep2_kane"]
allst = {k for s in SETS.values() for k in s["stations"]}
assert set(ORDER) == allst, (set(ORDER) ^ allst)

DOC = ("第 2 话「钟楼惊宿」一个很长的小关（docs/DESIGN.md「第 2 话」，src/battle/chase.js；由 tools/rounds/ep2_level.py 生成，不要手改）：十个地方连成一条路，"
       "走进尽头墙的门洞（exit）一眨眼的黑，从下一个地方的门洞（entry / 站点的 arrive）走出来（Game.passThrough）。站点多了：chase 倒跑、block 路障、hide 躲藏点、"
       "she 她在这一站巡游、dial 钟楼表盘决战；leave 怎么离开上一个地方（hole 她剪开的墙洞）；state 这个地方这时停没停电；cp 检查点；fire 到了就触发的机关；"
       "swap 换掉一块墙的图。机关多了 drop / trap / door / lure / read / node / toll / free / collapse，block: true 是挡路的东西，on: floor 平放在地上。")
SP = B / "sets" / "ep2.json"
SP.write_text(json.dumps({"_doc": DOC, **SETS}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(SP)], check=True, stdin=subprocess.DEVNULL)

EP = B / "episodes.json"; raw = EP.read_bytes(); crlf = b"\r\n" in raw; E = json.loads(raw.decode("utf-8"))
E["ep2"]["set"] = "ep2_genkan"
E["ep2"]["steps"] = [{"comic": "ep2_open"},
                     {"stage": "inn", "set": "ep2_genkan", "places": PLACES, "stations": ORDER, "name": L("时守屋", "TOKIMORI INN", "時守屋"), "she": "she", "kaiko": "kaiko", "shots": ["geta", "scissors", "pins", "crane"],
                      "thumb": "ui/sel_thumb_ep2_inn"},
                     {"comic": "ep2_end"}]
t = json.dumps(E, ensure_ascii=False, indent=2) + "\n"; EP.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(EP)], check=True, stdin=subprocess.DEVNULL)
print("ok", len(SETS), "places", len(ORDER), "stops; doors:", {k: (v.get("exit"), (v.get("entry") or {}).get("at")) for k, v in SETS.items()})
