"""Round 62 (tools/rounds/job_specs62.py; docs/DESIGN.md 第 2 话) -> the content pack: the monsters' 3 x 2 sheets, cut into frames.
  small monsters  the three picked versions of each kind         -> enemy/<kind>[_b|_c]_<pose>
  she             her forms: a (main), e (true form), c (spider) + the extra poses of R63 (she_a2, she_e2, she_c2) when there
                                                                 -> enemy/she_<form>_<pose>
  okaiko          the giant silkworm, the picked version(s)       -> enemy/kaiko[_b]_<pose>
A sheet that is missing is reported and skipped; run again when it is there.
Then: python -I tools/pad_frames.py "enemy/<kind>*" ... and python -I tools/relief.py "enemy/<kind>*" ... (printed at the end)
usage: python -I tools/rounds/r62_import.py [kinds ...]"""
import sys, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
R62 = ROOT / "art" / "raw" / "r62"; R63 = ROOT / "art" / "raw" / "r63"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r23_import import cells
from r53_import import put, canvas

# kind -> ([(sheet, version prefix)], poses in sheet order, anchor)
MON = {
    "katashiro": ([("m_katashiro_a", ""), ("m_katashiro_c", "_b"), ("m_katashiro_e", "_c")], ["fly0", "fly1", "idle", "windup", "dive", "hurt"], "center"),
    "chochin":   ([("m_chochin_a", ""), ("m_chochin_c", "_b"), ("m_chochin_e", "_c")], ["idle", "rise", "coy", "windup", "throw", "hurt"], "bottom"),
    "surippa":   ([("m_surippa_b", ""), ("m_surippa_c", "_b"), ("m_surippa_d", "_c")], ["idle", "walk0", "walk1", "crouch", "leap", "hurt"], "bottom"),
    "karakasa":  ([("m_karakasa_a", ""), ("m_karakasa_b", "_b"), ("m_karakasa_e", "_c")], ["idle", "walk0", "walk1", "crouch", "leap", "hurt"], "bottom"),
    "futon":     ([("m_futon_a", ""), ("m_futon_c", "_b"), ("m_futon_d", "_c")], ["flat", "walk0", "walk1", "crouch", "leap", "hurt"], "bottom"),
    "kokeshi":   ([("m_kokeshi_b", ""), ("m_kokeshi_c", "_b"), ("m_kokeshi_d", "_c")], ["hide", "rise", "idle", "windup", "throw", "hurt"], "bottom"),
    "kaiko":     ([("kaiko_b", ""), ("kaiko_c", "_b")], ["sleep", "wake", "crawl", "windup", "lunge", "hurt"], "bottom"),
}
# her forms: every pose of a form on one canvas (the base sheet + the extra sheet of R63)
SHE = {
    "a": [("she_a", R62, ["still", "walk0", "walk1", "windup", "lunge", "down"]), ("she_a2", R63, ["rise", "stare", "peek", "grab", "stab", "stuck"])],
    "e": [("she_e", R62, ["still", "walk0", "walk1", "windup", "lunge", "down"]), ("she_e2", R63, ["hover", "summon", "inhale", "scream", "sweep", "fall"])],
    "c": [("she_c", R62, ["still", "walk0", "walk1", "windup", "lunge", "down"]), ("she_c2", R63, ["climb0", "climb1", "cling", "rear", "pounce", "drop"])],
}


def main(only):
    man = json.loads((A / "manifest.json").read_text())
    done = []
    for kind, (sheets, poses, anchor) in MON.items():
        if only and kind not in only: continue
        for name, suf in sheets:
            src = R62 / f"{name}.png"
            if not src.exists(): print("missing", src.name); continue
            for pose, can, extra in canvas(list(zip(poses, cells(src))), anchor):
                put(man, f"enemy/{kind}{suf}_{pose}", can, hit=True, **extra)
            print(kind + suf, can.size, src.name)
        done.append(f"enemy/{kind}*")
    if not only or "she" in only:
        for form, parts in SHE.items():
            named = []
            for name, d, poses in parts:
                src = d / f"{name}.png"
                if not src.exists(): print("missing", src.name); continue
                named += list(zip(poses, cells(src)))
            if not named: continue
            for pose, can, extra in canvas(named, "bottom"):
                put(man, f"enemy/she_{form}_{pose}", can, hit=True, **extra)
            print("she", form, len(named), "poses", can.size)
        done.append("enemy/she_*")
    (A / "manifest.json").write_text(json.dumps(man, indent=1, sort_keys=True))
    print("next:", " ".join(f'python -I tools/pad_frames.py "{d}" &&' for d in done), " ".join(f'python -I tools/relief.py "{d}" &&' for d in done))


if __name__ == "__main__":
    main(sys.argv[1:])
