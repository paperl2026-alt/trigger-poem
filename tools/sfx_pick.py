"""Pick the best generated variants of each sound effect and put them in the game (docs/ART.md「声音」).
python -I tools/sfx_pick.py <specs.py> [key ...] [--dry]
  For every key of the specs (tools/rounds/sfx_specsNN.py): measures every art/raw/sfx_ai/<key>/*.wav, scores it for its kind
  (hit = starts at once, one event, dies away, no noise bed; multi = a short burst; long = one event that ends inside the file;
  loop = steady, no gaps), keeps the best `keep`, trims the silence (hit / multi / long) or makes a seamless loop (loop), fades,
  writes Ogg Opus to public/content/base/sfx/ai/<key>_<n>.ogg and registers them in content audio/sounds.json (sfx.<key>: when,
  want, src "ai", files; an existing key keeps its vol / rate / gap). Draws art/raw/sfx_ai/_look/pick_<key>.png of the kept ones.
"""
import importlib.util, json, pathlib, subprocess, sys
import numpy as np
from scipy.io import wavfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = ROOT / "art" / "raw" / "sfx_ai"
OUT = ROOT / "public" / "content" / "base" / "sfx" / "ai"
SOUNDS = ROOT / "public" / "content" / "base" / "audio" / "sounds.json"


def mod(path):
    s = importlib.util.spec_from_file_location(pathlib.Path(path).stem, path); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m


look = mod(ROOT / "tools" / "sfx_look.py")


def ffmpeg():
    f = sorted((ROOT / "tools" / "ffmpeg").glob("*/bin/ffmpeg.exe"))
    if not f: raise SystemExit("no ffmpeg: unzip an ffmpeg build into tools/ffmpeg")
    return str(f[-1])


def read2(p):   # stereo float (T, 2)
    sr, x = wavfile.read(str(p)); x = x.astype(np.float32)
    if np.abs(x).max() > 2: x = x / 32768.0
    if x.ndim == 1: x = np.stack([x, x], 1)
    return sr, x


def env_db(x, sr, hop=0.01):
    a = np.abs(x).max(axis=1); h = int(sr * hop); n = max(1, len(a) // h)
    e = np.array([a[i * h:(i + 1) * h].max() for i in range(n)]) + 1e-9
    return 20 * np.log10(e / e.max())


def score(kind, sr, x):
    e = env_db(x, sr); L = len(e) * 0.01
    on = np.nonzero(e > -30)[0]
    if not len(on): return -1e9, {}
    start, last = on[0] * 0.01, on[-1] * 0.01
    tail = np.nonzero(e > -48)[0][-1] * 0.01
    seg = e[on[0]:on[-1] + 1]
    floor = float(np.median(seg))
    gaps = float((seg < -24).mean())
    attack = float((np.argmax(e > -6) - on[0]) * 0.01)
    rms = 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9); pk = 20 * np.log10(np.abs(x).max() + 1e-9); crest = pk - rms
    ends_inside = tail < L - 0.12
    # (a hit that never decays - its envelope's median within 12 dB of its peak - is the generator's noise texture: never picked)
    if kind in ("hit", "multi") and float(np.median(e)) > -12: return -1e6, dict(start=round(start, 2), floor=round(float(np.median(e)), 1), noise=True)
    if kind == "hit":
        s = crest - gaps * 6 - start * 12 - attack * 40 - max(0.0, floor + 18) * 1.5 + (6 if ends_inside else -8)
    elif kind == "multi":
        s = crest * 0.6 - start * 10 - max(0.0, floor + 12) + (5 if ends_inside else -6)
    elif kind == "long":
        s = -start * 8 - max(0.0, gaps - 0.5) * 20 + (6 if ends_inside else -4) + min(crest, 18) * 0.3
    else:   # loop: steady, no holes, no big spikes
        w = e[int(0.5 / 0.01):]
        s = -float(np.std(w)) * 2 - float((w < -30).mean()) * 40 - max(0.0, crest - 16) * 2
    return s, dict(start=round(start, 2), end=round(tail, 2), floor=round(floor, 1), gaps=round(gaps, 2), attack=round(attack, 3),
                   crest=round(crest, 1), inside=bool(ends_inside))


def trim(kind, sr, x, st):
    if kind == "loop":   # take after the first 0.5 s, crossfade the end over the start -> seamless
        x = x[int(0.5 * sr):]; cf = int(0.6 * sr)
        if len(x) < 3 * cf: return x
        a, b = x[:cf], x[-cf:]; w = np.linspace(0, 1, cf)[:, None]
        return np.concatenate([b * (1 - w) + a * w, x[cf:-cf]])
    s0 = max(0, int((st["start"] - 0.01) * sr)); s1 = min(len(x), int((st["end"] + (0.06 if kind == "hit" else 0.15)) * sr))
    y = x[s0:s1].copy()
    fi = min(len(y), int(0.003 * sr)); y[:fi] *= np.linspace(0, 1, fi)[:, None]
    fo = min(len(y), int((0.04 if kind == "hit" else 0.12) * sr)); y[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
    return y


def write_ogg(y, sr, path, mono):
    y = y / (np.abs(y).max() + 1e-9) * 0.89
    if mono: y = y.mean(axis=1, keepdims=True)
    pcm = (np.clip(y, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run([ffmpeg(), "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(sr), "-ac", str(y.shape[1]), "-i", "-",
                    "-c:a", "libopus", "-b:a", "96k" if y.shape[1] == 2 else "64k", "-ar", "48000", str(path)], input=pcm, check=True)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]; dry = "--dry" in sys.argv
    S = mod(args[0]).SFX; keys = args[1:] or list(S)
    OUT.mkdir(parents=True, exist_ok=True)
    D = json.loads(SOUNDS.read_text(encoding="utf-8")); report = {}
    for key in keys:
        s = S[key]; kind = s["kind"]; files = sorted((BASE / key).glob("*.wav"))
        if not files: print("no files", key); continue
        cand = []
        for p in files:
            sr, x = read2(p); sc, st = score(kind, sr, x); cand.append((sc, p, sr, x, st))
        cand.sort(key=lambda c: -c[0]); keep = [c for c in cand if c[0] > -1e5][:s.get("keep", 6)]
        if not keep: print("only noise for", key, "- make it again"); continue
        report[key] = [(round(float(c[0]), 1), c[1].name, {k: (float(v) if not isinstance(v, bool) else v) for k, v in c[4].items()}) for c in cand]
        rows, out = [], []
        for c in OUT.glob(f"{key}_*.ogg"):
            if not dry: c.unlink()
        for i, (sc, p, sr, x, st) in enumerate(keep, 1):
            y = trim(kind, sr, x, st)
            if not dry: write_ogg(y, sr, OUT / f"{key}_{i}.ogg", mono=kind in ("hit", "multi")); out.append(f"sfx/ai/{key}_{i}.ogg")
            m = y.mean(axis=1); st2, envv, spec = look.stats(sr, m); rows.append((f"{p.stem} score={sc:.1f}", st2, envv, spec))
        look.sheet(f"{key} ({kind}) kept {len(keep)}/{len(cand)}", rows, BASE / "_look" / f"pick_{key}.png")
        if not dry:
            e = D["sfx"].setdefault(key, {})
            e.update({"when": s["when"], "want": s["want"], "src": "ai", "files": out})
            e.setdefault("vol", 0.8)
            if kind == "loop": e["loop"] = True
        print(key, kind, "kept", len(keep), "of", len(cand), "best", round(keep[0][0], 1))
    (BASE / "_look" / "pick_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    if not dry:
        SOUNDS.write_text(json.dumps(D, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(SOUNDS)], check=True, stdin=subprocess.DEVNULL)


if __name__ == "__main__":
    main()
