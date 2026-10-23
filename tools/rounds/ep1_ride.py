"""Episode 1's netherworld (ep1_nether): wide open, melting ice-cream ground, floating islands all round (the old netherworld set of
commit b8ca8fb); the child's soul is taken home across it (station ne2: tools/rounds/ep1_soul.py). Once there was a mine cart down a honey
mine before it (ep1_mine: user 2026-10-22, ugly, a vehicle out of nowhere) and the honey maggot boss in it (user 2026-10-23: it did not
belong - not the original's, out of keeping with the rest): both gone; MINE stays here only as it was.
Writes the set (keeping its stations) and takes those two steps out of episodes.json. Idempotent.
usage: python -I tools/rounds/ep1_ride.py"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
B = ROOT / "public" / "content" / "base"
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)

PIT = ["ep1/pit_wall1", "ep1/pit_wall2", "ep1/pit_wall3", "ep1/pit_wall4"]
L = 260   # metres of mine

def path():
    # gentle S-bends across the 3.2 m trench (the camera leans into them), level
    pts = []
    for i, z in enumerate(range(-20, -L + 4, -24)):
        pts.append([round(0.45 * (1 if i % 2 else -1), 2), 1.35, z])
    pts.append([0, 1.35, -(L - 6)])
    return pts

def bats(at, n, ahead=18, spread=2.4):
    return [{"type": "bat", "ahead": ahead + k * 1.2, "x": round(-spread / 2 + spread * k / max(1, n - 1), 2), "y": 2.0 + (k % 2) * 0.6, "from": "outside"} for k in range(n)]

MARKS = [
    {"at": 0, "speed": 5, "say": "start"},
    {"at": 6, "speed": 10, "shake": 0.6, "sfx": "whoosh"},
    {"at": 12, "spawn": bats(12, 5)},
    {"at": 26, "block": {"k": "prop/ep1_tunnel1", "h": 1.3, "ahead": 26, "x": 0}, "hint": "rideBlock"},
    {"at": 44, "spawn": [{"type": "ghoul", "ahead": 16, "x": -0.5, "from": "burrow"}, {"type": "crawler", "ahead": 21, "x": 0.5, "from": "burrow"}]},
    {"at": 62, "face": "back", "say": "scare", "spawn": [{"type": "double_pink", "ahead": -7, "x": -0.4, "from": "burrow"}, {"type": "double_cat", "ahead": -9, "x": 0.4, "from": "burrow"}]},
    {"at": 90, "face": "fwd"},
    {"at": 94, "block": {"k": "prop/ep1_tunnel2", "h": 1.4, "ahead": 24, "x": 0.2}},
    {"at": 108, "spawn": bats(108, 6, 16, 2.8)},
    {"at": 126, "speed": 13, "burst": [0.8, [1, 3], 0.14, 1972224, 16756800], "spawn": [{"type": "shadow", "ahead": 20, "x": 0, "from": "burrow"}]},
    {"at": 146, "block": {"k": "prop/ep1_tunnel1", "h": 1.2, "ahead": 22, "x": 0.35}},
    {"at": 150, "block": {"k": "prop/ep1_tunnel2", "h": 1.3, "ahead": 30, "x": -0.35}},
    {"at": 170, "face": "back", "spawn": [{"type": "double_cat", "ahead": -6, "x": 0, "from": "burrow"}, {"type": "double_pink", "ahead": -8, "x": -0.5, "from": "burrow"},
                                          {"type": "double_pink", "ahead": -10, "x": 0.5, "from": "burrow"}]},
    {"at": 198, "face": "fwd", "spawn": [{"type": "ghoul", "ahead": 14, "x": 0.5, "from": "burrow"}, {"type": "ghoul", "ahead": 19, "x": -0.5, "from": "burrow"}]},
    {"at": 222, "speed": 15, "shake": 1.2, "burst": [1.2, [5, 1, 2, 6], 0.15, 1972224, 16764048], "say": "scare"},
]

MINE = {"panels": True, "seed": 87, "fogNear": 8, "fogFar": 34, "fogDensity": 0.014, "sky": "#f0c890", "fog": "#c88a50", "lit": [1.04, 0.94, 0.84],
        "ink": "#3a2010", "paper": 0.05, "void": "#2a160c", "grade": {"tint": [1.06, 0.95, 0.86], "k": 0.3, "sat": 1.04},
        "ambient": {"kind": "embers", "rate": 9},
        "hall": {"x0": -1.6, "x1": 1.6, "z0": 6, "z1": -L, "h": 5, "bay": 3, "tile": 3, "tilesX": 2, "tileL": 1.5, "left": PIT, "right": PIT,
                 "floor": ["ep1/pit_floor1", "ep1/pit_floor2"], "end": ["ep1/pit_wall2", "ep1/pit_wall3"]},
        "stations": {"mn1": {"ride": {"from": [0, 1.35, 4], "path": path(), "speed": 10, "vehicle": "cart", "front": "ep1/cart_front", "marks": MARKS}, "cam": [0, 1.35, -(L - 6)], "look": [0, 1.3, -(L + 10)]}}}

NETHER = {"panels": True, "seed": 61, "fogNear": 10, "fogFar": 60, "fogDensity": 0.012, "sky": "#e6a868", "fog": "#e6b07a", "lit": [1.12, 0.98, 0.86],
          "ink": "#3a2010", "paper": 0.05, "void": "#d89050", "grade": {"tint": [1.1, 0.95, 0.85], "k": 0.3, "sat": 1.08}, "ambient": {"kind": "petals", "rate": 8},
          "hall": {"x0": -14, "x1": 14, "z0": 10, "z1": -44, "h": 14, "bay": 10, "tile": 6, "tilesX": 5, "tileL": 6, "left": [], "right": [],
                   "floor": ["ep1/nether_floor1", "ep1/nether_floor2", "ep1/nether_floor3"]},
          # (floating islands all round: ahead, on both sides and behind - the camera looks across it from one side)
          "boards": [{"k": "ep1/nether_a", "x": 0, "y": -10, "z": -80, "w": 170, "sky": True}, {"k": "ep1/nether_b", "x": -78, "y": -10, "z": -20, "w": 170, "ry": 90, "sky": True},
                     {"k": "ep1/nether_b", "x": 78, "y": -10, "z": -20, "w": 170, "ry": -90, "sky": True}, {"k": "ep1/nether_a", "x": 0, "y": -10, "z": 50, "w": 170, "ry": 180, "sky": True}],
          "props": [{"k": "ep1/nb_cone", "h": 1.4, "x": -9, "z": -12}, {"k": "ep1/nb_frame", "h": 1.8, "x": 9, "z": -18}, {"k": "ep1/nb_cup", "h": 1.0, "x": -4, "z": -26},
                    {"k": "ep1/nb_spoon", "h": 2.0, "x": 6, "z": -30}, {"k": "ep1/nb_scoop", "h": 1.2, "x": -11, "z": -32},
                    {"k": "ep1/nb_cherry", "h": 0.9, "x": 2, "z": -38}, {"k": "ep1/nb_ribbon", "h": 1.0, "x": -6, "z": -40}],
          "stations": {}}

if __name__ == "__main__":
    sp = packs.data_file("sets", "ep1_pit"); raw = sp.read_bytes(); crlf = b"\r\n" in raw; D = json.loads(raw.decode("utf-8"))
    # (the mine cart ride is gone - user 2026-10-22: ugly, unneeded, the views swapping back and forth odd, a vehicle out of nowhere:
    # from the tunnel straight to the netherworld; MINE stays here only as it was)
    D.pop("ep1_mine", None); D["ep1_nether"] = {**NETHER, "stations": D.get("ep1_nether", {}).get("stations", {})}
    D["ep1_pit"]["stations"].pop("pt4", None)
    t = json.dumps(D, ensure_ascii=False, indent=2) + "\n"; sp.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
    ep = packs.data_file("episodes", "ep1"); raw = ep.read_bytes(); crlf2 = b"\r\n" in raw; E = json.loads(raw.decode("utf-8"))
    E["ep1"]["steps"] = [s for s in E["ep1"]["steps"] if s.get("stage") != "mine" and s.get("boss") != "maggot"]
    t = json.dumps(E, ensure_ascii=False, indent=2) + "\n"; ep.write_bytes((t.replace("\n", "\r\n") if crlf2 else t).encode("utf-8"))
    for p in (sp, ep): subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(p)], check=True, stdin=subprocess.DEVNULL)
    print("ok", len(MARKS), "marks", len(path()), "path points")
