"""Applies what the user picked on the listening page (sound.html, 开始游戏.bat [6]; saved as saves/audition.json):
  BGM: the version chosen for a track -> art/raw/bgm_ai/picks.json, then tools/bgm_pick.py makes the game's loop of it
  sound effects: the files turned down (✕) -> art/raw/sfx_ai/<key>/rejected.json, then tools/sfx_pick.py fills in from the other versions
  kinds marked 整种重做, lines marked 不好, and every note: printed, for Claude to make again
usage: python -I tools/audition_apply.py [--dry]"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.stdout.reconfigure(encoding="utf-8")


def saved():
    best = None
    for f in [ROOT / "saves" / "audition.json", *(pathlib.Path.home() / "AppData" / "Roaming" / n / "saves" / "audition.json" for n in ("Trigger Poem", "trigger-poem"))]:
        try: env = json.loads(f.read_text(encoding="utf-8"))
        except Exception: continue
        if best is None or env.get("seq", 0) > best.get("seq", 0): best = env
    if not best: sys.exit("no saves/audition.json yet: open the listening page (开始游戏.bat [6]) and pick something")
    return json.loads(best["data"])


def main():
    dry = "--dry" in sys.argv; A = saved()
    S = json.loads((ROOT / "public/content/base/audio/sounds.json").read_text(encoding="utf-8"))
    # ---- BGM
    pp = ROOT / "art/raw/bgm_ai/picks.json"; picks = json.loads(pp.read_text(encoding="utf-8")) if pp.exists() else {}
    tracks = [t for t, f in (A.get("bgm") or {}).items() if f and picks.get(t) != f and f"{S['music'].get(t, {}).get('from')}.wav" != f]
    for t in tracks: picks[t] = A["bgm"][t]; print("BGM", t, "->", picks[t])
    if tracks and not dry:
        pp.write_text(json.dumps(picks, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        subprocess.run([sys.executable, "-I", str(ROOT / "tools/bgm_pick.py"), *tracks], check=True)
    # ---- sound effects
    rep = json.loads((ROOT / "art/raw/sfx_ai/_look/pick_report.json").read_text(encoding="utf-8"))
    redo, again = [], []
    for key, st in (A.get("sfx") or {}).items():
        e = S["sfx"].get(key) or {}
        if st.get("redo") or st.get("note"): redo.append((key, st.get("redo"), st.get("note", "")))
        if not st.get("no") or e.get("src") != "ai": continue
        stems = []
        for x in st["no"]:   # (a version's name; or, before the files knew their versions, its file: the n-th kept = the n-th best)
            if x.endswith(".ogg"):
                n = int(x.rsplit("_", 1)[1].split(".")[0]); x = rep[key][n - 1][1][:-4] if key in rep and n <= len(rep[key]) else None
            if x: stems.append(x)
        rj = ROOT / "art/raw/sfx_ai" / key / "rejected.json"
        old = set(json.loads(rj.read_text(encoding="utf-8"))) if rj.exists() else set()
        if set(stems) - old:
            again.append(key); print("SFX", key, "turned down:", ", ".join(sorted(set(stems) - old)))
            if not dry: rj.write_text(json.dumps(sorted(old | set(stems)), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    if again and not dry:
        subprocess.run([sys.executable, "-I", str(ROOT / "tools/sfx_pick.py"), str(ROOT / "tools/rounds/sfx_specs62.py"), *again], check=True)
    # ---- for Claude
    for name, n in (A.get("bgmNote") or {}).items():
        if n: print("BGM note", name, ":", n)
    for key, r, n in redo: print("SFX", key, "make again" if r else "", ":", n)
    if A.get("hitsNote"): print("HITS note :", A["hitsNote"])
    for n in A.get("sandboxNotes") or []: print("SANDBOX", n.get("set"), n.get("music"), ",".join(n.get("monsters") or []), ":", n.get("note"))
    for k, n in (A.get("criesNote") or {}).items():
        if n: print("CRY", k, ":", n)
    for k, n in (A.get("chantNote") or {}).items():
        if n: print("CHANT", k, ":", n)
    for k, v in (A.get("voice") or {}).items():
        if v.get("bad") or v.get("note"): print("LINE", k, "bad" if v.get("bad") else "", ":", v.get("note", ""))


if __name__ == "__main__":
    main()
