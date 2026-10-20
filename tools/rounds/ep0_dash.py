"""The prologue's high-speed stretch (DESIGN「停留点不只是一个镜头、一种打法」, user 2026-10-20; the prologue has nothing to do with a school
festival): after the corridor, the ??? thing's reach comes after them and the two run flat out down a long corridor and out of the school
building toward the yard - running (no vehicle), no cover, endless ammunition, the corridor's desks and lockers thrown across the way,
paper and textbooks flying at them, the chairs and shoes running after them (the view turns round to face them).
Writes sets/ep0.json ep0_dash (the corridor's own pictures, 150 m, no fold) and its stage in episodes.json after the corridor. Idempotent.
usage: python -I tools/rounds/ep0_dash.py"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
B = ROOT / "public" / "content" / "base"
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)
L = 150

def flock(kind, n, ahead, spread=2.2, y=1.6, frm="outside"):
    return [{"type": kind, "ahead": ahead + k * 1.4, "x": round(-spread / 2 + spread * k / max(1, n - 1), 2), "y": y + (k % 2) * 0.4, "from": frm} for k in range(n)]

MARKS = [
    {"at": 0, "speed": 3, "say": "scare", "shake": 1.0, "sfx": "roar"},
    {"at": 3, "speed": 7.5, "hint": "runBlock"},
    {"at": 8, "spawn": flock("paper", 6, 14)},
    {"at": 20, "block": {"k": "cover/desks", "h": 1.0, "ahead": 20, "x": 0}},
    {"at": 34, "face": "back", "spawn": [{"type": "chair", "ahead": -6, "x": -0.6, "from": "burrow"}, {"type": "shoe", "ahead": -8, "x": 0.6, "from": "burrow"},
                                         {"type": "shoe", "ahead": -10, "x": 0, "from": "burrow"}]},
    {"at": 58, "face": "fwd", "spawn": flock("book", 5, 15, 2.6)},
    {"at": 70, "block": {"k": "cover/lockers", "h": 1.2, "ahead": 22, "x": 0.3}},
    {"at": 84, "speed": 9, "burst": [0.9, [3, 1, 4], 0.13, 2097176, 16726688], "spawn": [{"type": "board", "ahead": 18, "x": 0, "from": "burrow"}]},
    {"at": 100, "face": "back", "spawn": [{"type": "desk", "ahead": -6, "x": 0, "from": "burrow"}, {"type": "chair", "ahead": -9, "x": -0.5, "from": "burrow"}]},
    {"at": 122, "face": "fwd", "spawn": flock("paper", 7, 12, 2.8)},
    {"at": 138, "speed": 11, "shake": 1.2, "say": "start"},
]

def path():
    pts = []
    for i, z in enumerate(range(-14, -L + 4, -18)):
        pts.append([round(0.35 * (1 if i % 2 else -1), 2), 1.25 + (0.05 if i % 2 else 0), z])
    pts.append([0, 1.25, -(L - 6)])
    return pts

if __name__ == "__main__":
    sp = packs.data_file("sets", "ep0_corridor"); raw = sp.read_bytes(); crlf = b"\r\n" in raw; D = json.loads(raw.decode("utf-8"))
    C = D["ep0_corridor"]
    H = {k: v for k, v in C["hall"].items() if k not in ("foldZ", "fold")}; H["z1"] = -L
    D["ep0_dash"] = {**{k: v for k, v in C.items() if k not in ("stations", "props", "gimmicks", "hall", "decals")}, "hall": H, "decals": C.get("decals", []),
                     "ambient": {"kind": "petals", "rate": 8},
                     "stations": {"ds1": {"ride": {"from": [0, 1.25, 4], "path": path(), "speed": 7.5, "marks": MARKS}, "cam": [0, 1.25, -(L - 6)], "look": [0, 1.2, -(L + 10)]}}}
    t = json.dumps(D, ensure_ascii=False, indent=2) + "\n"; sp.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
    ep = packs.data_file("episodes", "ep0"); raw = ep.read_bytes(); crlf2 = b"\r\n" in raw; E = json.loads(raw.decode("utf-8"))
    st = [s for s in E["ep0"]["steps"] if s.get("stage") != "dash"]
    i = [k for k, s in enumerate(st) if s.get("stage") == "corridor"][0]
    st.insert(i + 1, {"stage": "dash", "set": "ep0_dash", "stations": ["ds1"], "name": {"zh": "冲出教学楼", "en": "RUN FOR IT", "ja": "校舎から脱出"}, "thumb": E["ep0"]["steps"][i].get("thumb")})
    E["ep0"]["steps"] = st
    t = json.dumps(E, ensure_ascii=False, indent=2) + "\n"; ep.write_bytes((t.replace("\n", "\r\n") if crlf2 else t).encode("utf-8"))
    for p in (sp, ep): subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(p)], check=True, stdin=subprocess.DEVNULL)
    print("ok", len(MARKS), "marks")
