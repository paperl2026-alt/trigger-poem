"""Every monster comes in from somewhere (docs/DESIGN.md「怪要有合理的入场」; user 2026-10-19 batch 23: many appeared out of nowhere on a
flat floor). For the hand-written sets (sets/ep0.json, sets/ep1.json; episode 2 has its own table in tools/rounds/ep2_level.py): every
wave monster that had no entrance or popped up off the floor gets one by what it is and where it is -
  a place with side walls: walkers break in through a side wall (the side they stand on), throwers and flyers drop through a hole in the
    ceiling (a swarm through one hole), or, with no ceiling, through the wall too;
  an open place (no side walls: the schoolyard): they dig up out of the ground (burrow); flyers come in over the far edge (outside).
Crawlers keep to the ceiling, statues / scares / the ones a set already gave an entrance keep theirs.
usage: python -I tools/rounds/entrances.py [--dry]"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
B = ROOT / "public" / "content" / "base"
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)
EN = packs.collection("enemies")


def how(e, hall):
    beh = EN.get(e["type"], {}).get("beh")
    walls, ceil = bool(hall.get("left") or hall.get("right")), bool(hall.get("ceil"))
    if beh == "crawler": return None
    if not walls: return {"from": "outside"} if beh == "flyer" else {"from": "burrow"}
    if beh == "walker": return {"from": "wall"}
    return {"from": "ceiling"} if ceil else {"from": "wall"}


if __name__ == "__main__":
    dry = "--dry" in sys.argv
    for p in [f for name in ("ep0", "ep1") for f in packs.data_files(name, "sets")]:
        name = p.parent.name; raw = p.read_bytes(); crlf = b"\r\n" in raw; D = json.loads(raw.decode("utf-8")); n = 0
        for sid, S in D.items():
            if sid == "_doc" or not isinstance(S, dict): continue
            for st in (S.get("stations") or {}).values():
                for wave in st.get("waves", []):
                    for e in wave:
                        if not e.get("type") or e.get("from") not in (None, "pop"): continue
                        h = how(e, S.get("hall") or {})
                        if h: e.update(h); n += 1
        print(name, n, "monsters given an entrance")
        if not dry:
            t = json.dumps(D, ensure_ascii=False, indent=2) + "\n"; p.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
            subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(p)], check=True, stdin=subprocess.DEVNULL)
