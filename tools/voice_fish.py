"""The girls' voices with Fish Audio (docs/TECH.md「声音」). The API key comes ONLY from the environment variable FISH_API_KEY (never
written to a file, never printed). Model "drama-3": each line gets a performance direction in square brackets (the character's tone from
content audio/sounds.json voices.<who>.tone + the moment's mood below). FISH_MODEL picks another model (s2.1-pro-free: the free
developer tier, for auditioning voices; it takes no directions, so they are left out). Model "drama-3" and "s2.1-pro" need API credit
(separate from the website's credit: fish.audio/app/developers).
usage:
  python -I tools/voice_fish.py search [--lang ja] [--title text] [--tag tag]    list public voices (id, title, tags, uses)
  python -I tools/voice_fish.py say <voice id> <out.mp3> <text>                  one clip (tests)
  python -I tools/voice_fish.py lines <who>                                       every line of <who> in text/stickers.json -> content
                                                                                  voice/<who>/<kind>_<n>.mp3, registered in sounds.json"""
import os, re, sys, json, pathlib, urllib.request, urllib.parse, time
sys.stdout.reconfigure(encoding="utf-8")

ROOT = pathlib.Path(__file__).resolve().parents[1]
PACK = ROOT / "public" / "content" / "base"
API = "https://api.fish.audio"
# the mood of each moment, added to the character's own direction
MOOD = {
    "hit": "short, playful", "crit": "excited, teasing", "kill": "sweet and a little cruel", "combo": "breathless, thrilled, a little suggestive",
    "hurt": "a sharp little cry of pain, pouting", "low": "weak, close to tears, clingy", "reload": "lazy, flirty", "empty": "pouting, asking for a hug",
    "fever": "hot and excited", "ready": "coaxing, seductive", "skill": "shouting with full energy", "cover": "playful, hiding",
    "revive": "cheeky, seductive", "down": "sobbing, sulking", "coverBroken": "flustered", "stagger": "smug, like praising a pet",
    "join": "cheerful, sweet", "quit": "lonely and quiet, almost a whisper, begging you to stay", "poke": "startled squeak, then giggly",
    "idle": "humming to herself, whimsical", "windup": "", "die": "",
}


def key():
    k = os.environ.get("FISH_API_KEY")
    if not k: raise SystemExit("set FISH_API_KEY first")
    return k


def call(path, data=None, headers=None, raw=False):
    req = urllib.request.Request(API + path, data=json.dumps(data).encode() if data is not None else None, method="POST" if data is not None else "GET",
                                 headers={"Authorization": f"Bearer {key()}", "Content-Type": "application/json", **(headers or {})})
    with urllib.request.urlopen(req, timeout=120) as r:
        body = r.read()
    return body if raw else json.loads(body)


MODEL = os.environ.get("FISH_MODEL", "drama-3")


def tts(ref, text, out):
    if MODEL != "drama-3": text = re.sub(r"\[[^\]]*\]\s*", "", text)   # (only drama-3 reads directions)
    body = {"text": text, "reference_id": ref, "format": "mp3", "mp3_bitrate": 128, "normalize": True, "latency": "normal",
            "temperature": 0.75, "top_p": 0.8, "prosody": {"speed": 1.0, "volume": 0, "normalize_loudness": True}}
    for attempt in range(3):
        try:
            audio = call("/v1/tts", body, {"model": MODEL}, raw=True); break
        except Exception as e:
            if attempt == 2: raise
            time.sleep(2 + attempt * 3)
    out = pathlib.Path(out); out.parent.mkdir(parents=True, exist_ok=True); out.write_bytes(audio)
    return len(audio)


def direct(tone, kind, text):
    mood = MOOD.get(kind, "")
    return f"[{tone}{'; ' + mood if mood else ''}] {text}"


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: raise SystemExit(__doc__)
    if a[0] == "search":
        q = {"page_size": 20, "sort_by": "task_count"}
        for flag, name in (("--lang", "language"), ("--title", "title"), ("--tag", "tag")):
            if flag in a: q[name] = a[a.index(flag) + 1]
        r = call("/model?" + urllib.parse.urlencode(q))
        for m in r.get("items", []):
            print(f"{m['_id']}  {m.get('task_count', 0):>8} uses  {m.get('like_count', 0):>5} likes  {','.join(m.get('languages', []))}  {m['title'][:30]}  [{', '.join(m.get('tags', [])[:6])}]")
    elif a[0] == "say":
        print(tts(a[1], a[3], a[2]), "bytes ->", a[2])
    elif a[0] == "lines":
        who = a[1]
        sp = PACK / "audio" / "sounds.json"; raw = sp.read_bytes(); crlf = b"\r\n" in raw
        S = json.loads(raw.decode("utf-8")); V = S["voices"][who]
        if not V.get("ref"): raise SystemExit(f"no voice for {who}: set voices.{who}.ref in audio/sounds.json")
        lines = json.loads((PACK / "text" / "stickers.json").read_text(encoding="utf-8"))["stickers"]["heroines"][who]
        say = "ja" if V.get("lang", "ja") == "ja" else "zh"
        V["lines"] = {}
        for kind, s in lines.items():
            for i, ln in enumerate(s["lines"]):
                rel = f"voice/{who}/{kind}_{i + 1}.mp3"
                n = tts(V["ref"], direct(V["tone_en"], kind, ln[say]), PACK / rel)
                V["lines"][f"{kind}_{i + 1}"] = rel
                print(f"{rel}  {n} bytes  {ln[say]}")
        txt = json.dumps(S, ensure_ascii=False, indent=2) + "\n"
        sp.write_bytes((txt.replace("\n", "\r\n") if crlf else txt).encode("utf-8"))
        import subprocess
        subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(sp)], check=True, stdin=subprocess.DEVNULL)
