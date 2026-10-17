"""The sound effects picked from the downloaded libraries (docs/ART.md「声音」) -> the content pack. Picked by Claude from the measurements of
tools/node/sfx_scan.cjs against what content audio/sounds.json asks for (its "want"); the user changes a pick by telling Claude.
Sources: art/raw/sfx_dl/se/<zip name>/<file> (tools/sfx_unpack.py). Copied to public/content/base/sfx/<maou|otologic>/ with their own names
(only brackets and spaces made plain), and written into sounds.json: files, vol, and when needed len (play only so many seconds, then a
short fade) and rate (pitch: < 1 lower and slower).
usage: python -I tools/rounds/sfx_import.py"""
import json, re, shutil, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "art" / "raw" / "sfx_dl" / "se"
PACK = ROOT / "public" / "content" / "base"
OUT = PACK / "sfx"

M, O = "maou_se/maou_se_", ""   # the Maou pack's folder + prefix; OtoLogic files are "<group>-mp3/<file>"
def oto(group, *names): return [f"{group}-mp3/{n}" for n in names]

# sound -> (files, vol, extra). Synthesized still (nothing fits yet): cannon (the cat's mantra shot), shell, paperRip, tear, crackle, flame*
SFX = {
    "ui":       ([M + "system45.mp3"], 0.6, {}),
    "panel":    (oto("Book02", "Book02-1(Flip).mp3", "Book02-4(Flick_Through).mp3"), 1, {}),
    "viewer":   (oto("Book02", "Book02-1(Flip).mp3"), 1, {}),
    "stamp":    ([M + "battle07.mp3"], 0.8, {}),
    "popup":    (oto("Motion-Swish01", *[f"Motion-Swish01-0{i}.mp3" for i in range(1, 7)]), 0.4, {}),
    "clear":    (oto("Onoma-Sparkle04", "Onoma-Sparkle04-1(Timbre1-Short).mp3", "Onoma-Sparkle04-3(Timbre2-Short).mp3"), 0.8, {"len": 1.8}),
    "victory":  ([M + "jingle05.mp3"], 0.9, {}),
    "defeat":   ([M + "onepoint06.mp3"], 0.9, {}),
    "gun":      ([M + "battle_gun02.mp3", M + "battle_gun03.mp3"], 0.45, {"len": 0.16}),
    "empty":    ([M + "sound_switch01.mp3"], 0.8, {}),
    "reload":   ([M + "sound19.mp3", M + "sound20.mp3"], 0.8, {}),
    "hit":      (oto("Hit-Punch02", *[f"Hit-Punch02-{i}(Dry).mp3" for i in range(1, 5)]), 0.5, {}),
    "thud":     ([M + "battle12.mp3"], 0.9, {}),
    "shatter":  ([M + "magic_ice05.mp3"], 0.7, {"len": 0.8}),
    "slash":    (oto("Cut02", *[f"Cut02-{i}.mp3" for i in range(1, 5)]), 0.8, {}),
    "clang":    ([M + "battle10.mp3", M + "battle04.mp3"], 0.7, {"len": 0.5}),
    "coverHit": (oto("Hit-Punch09", "Hit-Punch09-1(Low).mp3", "Hit-Punch09-3(Low).mp3"), 0.8, {}),
    "burnOut":  ([M + "magical25.mp3"], 0.6, {"len": 1.6}),
    "whoosh":   (oto("Motion-Swish01", *[f"Motion-Swish01-{i:02d}.mp3" for i in range(7, 11)]), 0.6, {}),
    "throwIt":  (oto("Motion-Swish01", "Motion-Swish01-07.mp3", "Motion-Swish01-08.mp3"), 0.7, {"rate": 0.8}),
    "warn":     ([M + "8bit02.mp3"], 0.5, {}),
    "miss":     (oto("Onoma-Negative16", "Onoma-Negative16-4(High).mp3", "Onoma-Negative16-3(Low).mp3"), 0.8, {}),
    "slam":     ([M + "battle_explosion07.mp3"], 0.9, {"len": 1.2}),
    "run":      ([M + "sound_footstep01.mp3", M + "sound_footstep02.mp3"], 0.6, {}),
    "hurt":     (oto("Hit-Punch09", "Hit-Punch09-2(High).mp3", "Hit-Punch09-4(High).mp3"), 0.8, {}),
    "madness":  (oto("Onoma-Syakiin05", "Onoma-Syakiin05-1(Heavy).mp3", "Onoma-Syakiin05-2(Light).mp3"), 0.8, {}),
    "roar":     (oto("Monster02", "Monster02-10.mp3", "Monster02-11.mp3"), 1, {"rate": 0.8, "len": 2.2}),
    "dollScreech": (oto("Horror-Laugh02", "Horror-Laugh02-4(Dry).mp3", "Horror-Laugh02-5(Dry).mp3", "Horror-Laugh02-6(Dry).mp3"), 0.8, {}),
    "mothFlap": ([M + "sound17.mp3"], 0.7, {}),
}
# monster cries: each kind its own material and pitch (rate)
SHORT = oto("Monster02", "Monster02-01.mp3", "Monster02-02.mp3", "Monster02-04.mp3", "Monster02-05.mp3")
DIE = oto("Monster01", "Monster01-1.mp3", "Monster01-2.mp3")
MON = {
    "default": {"windup": SHORT, "die": DIE},
    "desk":  {"rate": 0.75, "windup": SHORT, "die": DIE},
    "shoe":  {"rate": 0.9, "windup": SHORT, "die": DIE},
    "board": {"rate": 0.7, "windup": oto("Horror-Laugh02", "Horror-Laugh02-4(Dry).mp3"), "die": oto("Horror-Scream02", "Horror-Scream02-8(Low-Dry).mp3")},
    "paper": {"rate": 1.3, "windup": oto("Horror-Laugh01", "Horror-Laugh01-3(Dry).mp3", "Horror-Laugh01-4(Dry).mp3"), "die": oto("Horror-Scream02", "Horror-Scream02-6(High-Dry).mp3")},
    "frame": {"windup": oto("Horror-Scream03", "Horror-Scream03-6(High-Dry).mp3"), "die": oto("Horror-Scream03", "Horror-Scream03-8(Low-Dry).mp3")},
    "horn":  {"rate": 0.9, "windup": oto("Monster02", "Monster02-08.mp3"), "die": DIE},
}


def place(rel):
    """copy one picked file into the pack; returns its path inside the pack"""
    src = SRC / rel
    if not src.exists(): raise SystemExit(f"missing: {src}")
    site = "maou" if rel.startswith("maou_se/") else "otologic"
    name = re.sub(r"[^A-Za-z0-9_.-]+", "_", src.name).replace("_.", ".")
    (OUT / site).mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, OUT / site / name)
    return f"sfx/{site}/{name}"


if __name__ == "__main__":
    if OUT.exists(): shutil.rmtree(OUT)   # only what is picked now
    p = PACK / "audio" / "sounds.json"; raw = p.read_bytes(); crlf = b"\r\n" in raw
    d = json.loads(raw.decode("utf-8"))
    for k, e in d["sfx"].items():
        e["files"] = []; e.pop("len", None); e.pop("rate", None)
        if k in SFX:
            files, vol, extra = SFX[k]
            e["files"] = [place(f) for f in files]; e["vol"] = vol; e.update(extra)
            if e.get("src") == "tts": e["src"] = "lib"
    for k, m in MON.items():
        e = d["monsters"].setdefault(k, {})
        for act in ("windup", "attack", "hurt", "die"): e[act] = [place(f) for f in m.get(act, [])]
        if "rate" in m: e["rate"] = m["rate"]
        else: e.pop("rate", None)
    txt = json.dumps(d, ensure_ascii=False, indent=2) + "\n"
    p.write_bytes((txt.replace("\n", "\r\n") if crlf else txt).encode("utf-8"))
    import subprocess, sys
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(p)], check=True, stdin=subprocess.DEVNULL)
    n = sum(1 for _ in OUT.rglob("*.*")); size = sum(f.stat().st_size for f in OUT.rglob("*.*"))
    print(f"{n} files, {size / 1024:.0f} KB in {OUT.relative_to(ROOT)}; {len(SFX)} sounds + {len(MON)} monster sets")
