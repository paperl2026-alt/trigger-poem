"""The girls' voices with AivisSpeech (docs/TECH.md「声音」): a free voice-synthesis engine that runs on this computer (the official
Windows zip unpacked in tools/aivis/app, not in git) with voice models from AivisHub. Settings per girl in content audio/sounds.json
voices.<who> (model, read, say, credit); her lines are the Japanese ones in text/stickers.json (a boss's: stickers.bosses.<who>, bent
by voices.<who>.fx, e.g. "ghost"). Clips are trimmed, peak-levelled and written as Ogg Opus with ffmpeg (tools/ffmpeg, not in git).
usage:
  python -I tools/voice_aivis.py start                            start the engine if it is not running; install the models sounds.json names
  python -I tools/voice_aivis.py read <who>                       how every line will be read (style, settings, kana), no sound files
  python -I tools/voice_aivis.py say <who> <style> <out> <text>   one clip (tests; out .wav or .ogg)
  python -I tools/voice_aivis.py lines <who> [<kind> | <kind>_<n> ...]   every line (or only these) -> voice/<who>/<kind>_<n>.ogg,
                                                                  registered in sounds.json voices.<who>.lines"""
import io, sys, json, time, wave, zlib, pathlib, subprocess, importlib.util, urllib.request, urllib.parse
import numpy as np
sys.stdout.reconfigure(encoding="utf-8")

ROOT = pathlib.Path(__file__).resolve().parents[1]
PACK = ROOT / "public" / "content" / "base"
ENGINE = ROOT / "tools" / "aivis" / "app" / "AivisSpeech" / "AivisSpeech-Engine" / "run.exe"
HOST = "http://127.0.0.1:10101"
HUB = "https://api.aivis-project.com/v1/aivm-models/{}/download?model_type=AIVMX"
# read settings -> AudioQuery fields (pitch is left alone: AivisSpeech loses quality when it is moved)
FIELDS = {"speed": "speedScale", "intonation": "intonationScale", "tempo": "tempoDynamicsScale", "volume": "volumeScale"}


def call(path, data=None, ctype="application/json", timeout=120, raw=False):
    req = urllib.request.Request(HOST + path, data=data, method="POST" if data is not None else "GET", headers={"Content-Type": ctype})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        body = r.read()
    return body if raw else json.loads(body) if body else None


def up():
    try: return call("/version", timeout=3)
    except Exception: return None


def start():
    if not up():
        if not ENGINE.exists(): raise SystemExit(f"no engine at {ENGINE}: unzip the official AivisSpeech Windows zip into tools/aivis/app")
        log = open(ROOT / "tools" / "aivis" / "engine.log", "ab")
        subprocess.Popen([str(ENGINE), "--host", "127.0.0.1", "--port", "10101", "--output_log_utf8", "--disable_sentry"], stdout=log,
                         stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, creationflags=0x00000008 | 0x00000200 | 0x08000000)
        for _ in range(120):
            if up(): break
            time.sleep(3)
        else: raise SystemExit("the engine did not start (tools/aivis/engine.log)")
    print("engine", up())
    have = call("/aivm_models")
    for who, v in voices().items():
        if not isinstance(v, dict) or not v.get("model"): continue
        if v["model"] not in have:
            print(f"installing {v.get('voice', v['model'])} for {who} ...", flush=True)
            b = "----voiceaivis" + str(int(time.time()))
            form = f'--{b}\r\nContent-Disposition: form-data; name="url"\r\n\r\n{HUB.format(v["model"])}\r\n--{b}--\r\n'.encode()
            call("/aivm_models/install", form, f"multipart/form-data; boundary={b}", timeout=1800)
        print(who, v.get("voice"), {k: i for k, i in styles(v["model"]).items()})


def voices():
    return json.loads((PACK / "audio" / "sounds.json").read_text(encoding="utf-8"))["voices"]


def styles(model):
    m = call(f"/aivm_models/{model}")
    return {s["name"]: s["id"] for sp in m["speakers"] for s in sp["speaker"]["styles"]}


def how(V, kind, n):   # read settings for one line: default <- the moment <- that line
    R = V.get("read", {})
    return {**R.get("default", {}), **R.get(kind, {}), **R.get(f"{kind}_{n}", {})}


def spoken(text):   # what the engine is given: hearts and notes are not read, a space is a little pause, wavy dashes are long vowels
    for a, b in (("♡", " "), ("♪", " "), ("~", "ー"), ("～", "ー"), ("〜", "ー"), ("!!", "!")):
        text = text.replace(a, b)
    return "、".join(text.split())


def query(text, sid, h):
    q = call("/audio_query?" + urllib.parse.urlencode({"text": text, "speaker": sid}), b"")
    for k, f in FIELDS.items():
        if k in h: q[f] = h[k]
    q["prePhonemeLength"], q["postPhonemeLength"] = 0.05, 0.12
    return q


def kana(q):
    return "/".join("".join(m["text"] for m in ap["moras"]) + ("、" if ap.get("pause_mora") else "") for ap in q["accent_phrases"])


def synth(q, sid):
    w = wave.open(io.BytesIO(call(f"/synthesis?speaker={sid}", json.dumps(q).encode(), raw=True, timeout=300)))
    a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    if w.getnchannels() == 2: a = a.reshape(-1, 2).mean(1)
    return a, w.getframerate()


def tidy(a, sr):   # trim the quiet ends, short fades, peak at -1 dBFS
    loud = np.flatnonzero(np.abs(a) > 10 ** (-45 / 20))
    if len(loud): a = a[max(0, loud[0] - int(0.02 * sr)): loud[-1] + int(0.08 * sr)]
    fi, fo = int(0.005 * sr), int(0.03 * sr)
    a = a.copy(); a[:fi] *= np.linspace(0, 1, fi); a[-fo:] *= np.linspace(1, 0, fo)
    return a * (10 ** (-1 / 20) / max(1e-6, np.abs(a).max()))


def bend(name, a, sr, key):   # a boss's voice bent a little (voices.<who>.fx), the words still clear (tools/monster_voice.py effects)
    spec = importlib.util.spec_from_file_location("mv", ROOT / "tools" / "monster_voice.py"); MV = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(MV)
    rng = np.random.default_rng(zlib.crc32(key.encode()))
    if name == "ghost":   # a mother's ghost: a touch lower and slower, doubled a hair apart, a reversed whisper rising into it, a long cold room
        y = MV.tape(a, -1.2)
        y = y * 0.8 + MV.comb(y, sr, 21, 0.3) * 0.3
        y = MV.rev_swell(y, sr, rng, 0.45)
        n = int(1.6 * sr); ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 7, n))
        wet = MV.signal.fftconvolve(y, ir); wet = wet / (np.abs(wet).max() + 1e-9)
        y = np.concatenate([y, np.zeros(len(wet) - len(y))]) + wet * 0.22 * np.abs(y).max()
        f = int(0.3 * sr); y[-f:] *= np.linspace(1, 0, f)
        return (y * (10 ** (-1 / 20) / max(1e-6, np.abs(y).max()))).astype(np.float32)
    if name == "glitch":   # a possessed schoolgirl on a broken PA: a touch higher, the first syllable caught, a metallic ring, crushed, a short hall
        y = MV.tape(a, 1.0)
        y = MV.stutter(y, sr, rng)
        y = y * 0.75 + MV.ring(y, sr, 90, 1.0) * 0.25
        k = 2; y = np.repeat(y[::k], k)[:len(y)]
        n = int(0.7 * sr); ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 9, n))
        wet = MV.signal.fftconvolve(y, ir); wet = wet / (np.abs(wet).max() + 1e-9)
        y = np.concatenate([y, np.zeros(len(wet) - len(y))]) + wet * 0.15 * np.abs(y).max()
        f = int(0.2 * sr); y[-f:] *= np.linspace(1, 0, f)
        return (y * (10 ** (-1 / 20) / max(1e-6, np.abs(y).max()))).astype(np.float32)
    if name == "doll":   # a doll whispering in your ear: higher, a faint metallic ring, a little crushed, a breathy whisper layer, close and dry
        y = MV.tape(a, 2.0)
        y = y * 0.85 + MV.ring(y, sr, 160, 1.0) * 0.15
        k = 2; y = np.repeat(y[::k], k)[:len(y)]
        wh = MV.vocoder(y, sr, rng.standard_normal(len(y)), bands=24, lo=500, hi=9000)
        y = y + wh / (np.abs(wh).max() + 1e-9) * 0.3 * np.abs(y).max()
        f = int(0.05 * sr); y[-f:] *= np.linspace(1, 0, f)
        return (y * (10 ** (-1 / 20) / max(1e-6, np.abs(y).max()))).astype(np.float32)
    raise SystemExit(f"unknown fx {name}")


def ffmpeg():
    f = sorted((ROOT / "tools" / "ffmpeg").glob("*/bin/ffmpeg.exe"))
    if not f: raise SystemExit("no ffmpeg: unzip an ffmpeg build into tools/ffmpeg")
    return str(f[-1])


def write(a, sr, out):
    out = pathlib.Path(out); out.parent.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes()
    if out.suffix == ".wav":
        with wave.open(str(out), "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm)
    else:
        subprocess.run([ffmpeg(), "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(sr), "-ac", "1", "-i", "-",
                        "-c:a", "libopus", "-b:a", "48k", "-ar", "48000", str(out)], input=pcm, check=True)
    return out.stat().st_size


def plan(who, only=()):   # (key, kind, n, written line, spoken text, read settings) for each line of <who>
    V = voices()[who]
    S = json.loads((PACK / "text" / "stickers.json").read_text(encoding="utf-8"))["stickers"]
    lines = S["heroines"].get(who) or S.get("bosses", {})[who]
    for kind, s in lines.items():
        for i, ln in enumerate(s["lines"]):
            key = f"{kind}_{i + 1}"
            if only and kind not in only and key not in only: continue
            yield key, kind, i + 1, ln["ja"], spoken(V.get("say", {}).get(key, ln["ja"])), how(V, kind, i + 1)


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: raise SystemExit(__doc__)
    if a[0] == "start":
        start()
    elif a[0] == "read":
        V = voices()[a[1]]; S = styles(V["model"])
        for key, kind, n, line, text, h in plan(a[1]):
            q = query(text, S[h["style"]], h)
            print(f"{key:<14} {h['style']:<6} {line:<24} -> {kana(q)}")
    elif a[0] == "say":
        V = voices()[a[1]]; sid = styles(V["model"])[a[2]]
        x, sr = synth(query(spoken(a[4]), sid, how(V, "", 0)), sid)
        print(write(tidy(x, sr), sr, a[3]), "bytes ->", a[3])
    elif a[0] == "lines":
        who = a[1]; sp = PACK / "audio" / "sounds.json"; raw = sp.read_bytes(); crlf = b"\r\n" in raw
        S = json.loads(raw.decode("utf-8")); V = S["voices"][who]; ids = styles(V["model"])
        only = tuple(a[2:]); V["lines"] = V.get("lines", {}) if only else {}
        total = 0
        for key, kind, n, line, text, h in plan(who, only):
            sid = ids[h["style"]]
            x, sr = synth(query(text, sid, h), sid)
            rel = f"voice/{who}/{key}.ogg"
            y = tidy(x, sr)
            if V.get("fx"): y = bend(V["fx"], y, sr, key)
            size = write(y, sr, PACK / rel); total += size
            V["lines"][key] = rel
            print(f"{rel:<28} {h['style']:<6} {len(x) / sr:4.1f}s {size:>6} bytes  {line}", flush=True)
        order = [key for key, *_ in plan(who)]   # same order as the lines
        V["lines"] = {k: V["lines"][k] for k in order if k in V["lines"]}
        txt = json.dumps(S, ensure_ascii=False, indent=2) + "\n"
        sp.write_bytes((txt.replace("\n", "\r\n") if crlf else txt).encode("utf-8"))
        subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(sp)], check=True, stdin=subprocess.DEVNULL)
        print(f"{len(V['lines'])} lines registered, {total / 1024:.0f} KB written")
