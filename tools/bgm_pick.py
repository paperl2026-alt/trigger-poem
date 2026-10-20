"""BGM, step 3 of 3 (docs/TECH.md 声音): picks one of ACE-Step's covers of each track (tools/bgm_ace.py) and puts it in the game as a
seamless loop.  python -I tools/bgm_pick.py [track ...] [--dry]
  Without hearing them: every art/raw/bgm_ai/<track>_k*.wav is measured against its guide (<track>_guide.wav, the music as written in
  tools/rounds/bgm_specs.py): how closely its beats fall where the guide's do (onset correlation), how closely its harmony follows the
  written chords bar by bar (chroma correlation), how far it lags behind the guide, whether it fades out or drops out somewhere. The best
  one (or the one named in PICK, after the user has listened) becomes the track: the loop runs from the start of section `loopFrom` of the
  spec (default: the second section when the first is a short intro of 8 bars or less, played once; else the whole piece) to the end of the last section (one section earlier when the cover
  fades out at the end), both points moved by the cover's own lag there; the last 80 ms of the loop are blended into the 80 ms just before
  its start so the jump back is seamless. Levelled to one loudness (-14 dB RMS; then measured, EBU R128, and its vol set so it plays at
  -12 LUFS - every track as loud as the others: user 2026-10-20, the loud ones buried the sounds), written as Ogg Opus to public/content/base/bgm/<track>.ogg and
  registered in content audio/sounds.json (music.<track>: files, loopStart, loopEnd, vol). art/raw/bgm_ai/_look/<track>.png shows the
  guide and every cover (envelope, spectrogram, the numbers); _look/pick_report.json keeps the numbers.
"""
import importlib.util, json, pathlib, re, subprocess, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = ROOT / "art" / "raw" / "bgm_ai"
OUT = ROOT / "public" / "content" / "base" / "bgm"
SOUNDS = ROOT / "public" / "content" / "base" / "audio" / "sounds.json"
# track -> the file name of the cover the user chose by ear (overrides the measured best): art/raw/bgm_ai/picks.json, written by
# tools/audition_apply.py from the listening page (sound.html)
PICKS = BASE / "picks.json"
PICK = json.loads(PICKS.read_text(encoding="utf-8")) if PICKS.exists() else {}
CF = 0.08


def mod(path):
    s = importlib.util.spec_from_file_location(pathlib.Path(path).stem, path); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m


look = mod(ROOT / "tools" / "sfx_look.py")
spm = mod(ROOT / "tools" / "sfx_pick.py")


def read2(p):   # stereo float (T, 2)
    sr, x = wavfile.read(str(p))
    x = x.astype(np.float32) / (32768.0 if x.dtype.kind == "i" else 1.0)
    if x.ndim == 1: x = np.stack([x, x], 1)
    return sr, x[:, :2]


def onsets(sr, m, hop=0.01):   # spectral flux, 10 ms steps
    f, t, Z = stft(m, sr, nperseg=2048, noverlap=2048 - int(sr * hop)); S = np.log1p(np.abs(Z) * 50)
    fl = np.maximum(0, np.diff(S, axis=1)).sum(0); fl = fl - np.convolve(fl, np.ones(50) / 50, "same")
    return np.maximum(fl, 0) / (fl.std() + 1e-9)


def chroma_bars(sr, m, bar, nbars, lag=0.0):
    f, t, Z = stft(m, sr, nperseg=8192, noverlap=8192 - 2048); S = np.abs(Z) ** 2
    ok = (f > 55) & (f < 2000); midi = 69 + 12 * np.log2(f[ok] / 440.0); pc = np.round(midi).astype(int) % 12
    C = np.zeros((12, S.shape[1]))
    for k in range(12): C[k] = S[ok][pc == k].sum(0)
    out = np.zeros((nbars, 12))
    for b in range(nbars):
        sel = (t >= b * bar + lag) & (t < (b + 1) * bar + lag)
        if sel.any(): v = C[:, sel].sum(1); out[b] = v / (np.linalg.norm(v) + 1e-9)
    return out


def lag_at(og, oc, t, span, beat=1.0):   # the cover's delay behind the guide around time t (seconds), from the onsets within +-span
    a, b = max(0, int((t - span) * 100)), min(len(og), int((t + span) * 100))   # (searched within less than half a beat: the music
    g = og[a:b]; best, bl = -1e9, 0; m = max(2, min(40, int(beat * 45)))           # repeats every beat, a whole beat off also fits)
    for L in range(-m, m + 1):
        c = oc[max(0, a + L):max(0, b + L)]
        if len(c) != len(g): continue
        v = float((g * c).sum())
        if v > best: best, bl = v, L
    return bl * 0.01


def measure(T, sr, x, og, gch, bar, edges):
    m = x.mean(1); oc = onsets(sr, m)
    n = min(len(og), len(oc)); lag = lag_at(og[:n], oc[:n], n * 0.005, n * 0.005, bar / 4)
    sh = int(round(lag * 100)); a = og[max(0, -sh):n - max(0, sh)]; b = oc[max(0, sh):n + min(0, sh)]; k = min(len(a), len(b))
    ocorr = float(np.corrcoef(a[:k], b[:k])[0, 1])
    nb = edges[-1]; cc = chroma_bars(sr, m, bar, nb, lag)
    chroma = float(np.mean([(gch[i] * cc[i]).sum() for i in range(nb)]))
    rms = np.array([np.sqrt(np.mean(m[int((i * bar + lag) * sr):int(((i + 1) * bar + lag) * sr)] ** 2) + 1e-12) for i in range(nb)])
    db = 20 * np.log10(rms + 1e-9); med = float(np.median(db))
    fade = bool(db[-2:].mean() < med - 12)
    holes = int((db[edges[1] if len(edges) > 2 else 0:] < med - 20).sum())
    clip = float((np.abs(x) > 0.995).mean())
    steady = float(np.std(db[edges[1] if len(edges) > 2 else 0:]))   # (a loop that is 20 dB quieter for half its length is no game music)
    score = ocorr * 4 + chroma * 6 - holes * 1.5 - clip * 200 - (2 if fade else 0) - max(0.0, steady - 4) * 0.5
    return dict(score=round(score, 2), onset=round(ocorr, 3), chroma=round(chroma, 3), lag=round(lag, 3), fade=fade, holes=holes, steady=round(steady, 1),
                clip=round(clip, 5), bar_db=[round(float(v - med), 1) for v in db]), oc


def loop_of(T, sr, x, og, oc, bar, edges, st):
    i0 = T.get("loopFrom", 1 if len(edges) > 2 and T["sections"][0]["bars"] <= 8 else 0)   # (a short first section is an intro played once)
    s_bar = edges[i0]; e_bar = edges[-1] if not st["fade"] or len(edges) <= i0 + 2 else edges[-2]
    Ls = s_bar * bar + lag_at(og, oc, s_bar * bar, 4 * bar, bar / 4); Le = e_bar * bar + lag_at(og, oc, min(e_bar * bar, len(og) * 0.01 - 2 * bar), 4 * bar, bar / 4)
    Ls = max(Ls, CF + 0.01); a, b = int(round(Ls * sr)), int(round(Le * sr)); c = int(CF * sr)
    y = x[:b].copy(); w = np.linspace(0, np.pi / 2, c)[:, None]
    y[b - c:b] = y[b - c:b] * np.cos(w) + x[a - c:a] * np.sin(w)
    fi = int(0.02 * sr); y[:fi] *= np.linspace(0, 1, fi)[:, None]
    # (as loud as the synthesized loops were and a little more: at -17 dB they were lost under the guns and the voices, user 2026-10-19)
    r = np.sqrt(np.mean(y[a:b] ** 2)); y = y * (10 ** (-14 / 20) / (r + 1e-9))
    y = np.where(np.abs(y) > 0.9, np.sign(y) * (0.9 + 0.09 * np.tanh((np.abs(y) - 0.9) / 0.09)), y)
    return y, a / sr, b / sr


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]; dry = "--dry" in sys.argv
    S = mod(ROOT / "tools" / "rounds" / "bgm_specs.py").TRACKS
    (BASE / "_look").mkdir(parents=True, exist_ok=True); OUT.mkdir(parents=True, exist_ok=True)
    rp = BASE / "_look" / "pick_report.json"; report = json.loads(rp.read_text(encoding="utf-8")) if rp.exists() else {}
    D = json.loads(SOUNDS.read_text(encoding="utf-8")); changed = False
    for name in args or list(S):
        T = S[name]; files = sorted(BASE.glob(f"{name}_k*.wav")); gp = BASE / f"{name}_guide.wav"
        if not files or not gp.exists(): print("nothing for", name); continue
        bar = 240.0 / T["bpm"]; edges = list(np.cumsum([0] + [s["bars"] for s in T["sections"]]))
        sr, g = read2(gp); og = onsets(sr, g.mean(1)); gch = chroma_bars(sr, g.mean(1), bar, edges[-1])
        st0, env0, spec0 = look.stats(sr, g.mean(1)); rows = [(f"{name} guide", st0, env0, spec0)]; cand = []
        for p in files:
            sr2, x = read2(p)
            if sr2 != sr: print("rate differs", p.name); continue
            st, oc = measure(T, sr, x, og, gch, bar, edges); cand.append((st["score"], p, x, st, oc))
            s1, e1, sp1 = look.stats(sr, x.mean(1))
            rows.append((f"{p.stem}  score={st['score']} onset={st['onset']} chroma={st['chroma']} lag={st['lag']} fade={st['fade']} holes={st['holes']}", s1, e1, sp1))
        look.sheet(f"{name} ({T['bpm']} bpm, {edges[-1]} bars)", rows, BASE / "_look" / f"{name}.png")
        cand.sort(key=lambda c: -c[0])
        pick = next((c for c in cand if c[1].name == PICK.get(name)), cand[0])
        y, ls, le = loop_of(T, sr, pick[2], og, pick[4], bar, edges, pick[3])
        report[name] = {"pick": pick[1].name, "loop": [round(ls, 3), round(le, 3)], "all": {c[1].name: c[3] for c in cand}}
        print(name, "pick", pick[1].name, "loop", round(ls, 2), "-", round(le, 2), "of", round(len(pick[2]) / sr, 2), "|",
              ", ".join(f"{c[1].stem}: {c[3]['score']} (on {c[3]['onset']} ch {c[3]['chroma']} lag {c[3]['lag']}{' FADE' if c[3]['fade'] else ''})" for c in cand))
        if dry: continue
        pcm = (np.clip(y, -1, 1) * 32767).astype("<i2").tobytes()
        subprocess.run([spm.ffmpeg(), "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(sr), "-ac", "2", "-i", "-",
                        "-c:a", "libopus", "-b:a", "128k", "-ar", "48000", str(OUT / f"{name}.ogg")], input=pcm, check=True)
        e = D.setdefault("music", {}).setdefault(name, {})
        e.update({"files": [f"bgm/{name}.ogg"], "loopStart": round(ls, 4), "loopEnd": round(le, 4), "src": "ace", "from": pick[1].stem,
                  "bpm": T["bpm"], "key": T["key"]})   # (the hits play along in its key, on its sixteenths: src/core/audio.js hitNote)
        lu = lufs(OUT / f"{name}.ogg"); e["lufs"] = lu; e["vol"] = round(10 ** ((-12 - lu) / 20), 2); changed = True
    rp.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    if changed:
        D["music"] = dict(sorted(D["music"].items()))
        SOUNDS.write_text(json.dumps(D, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(SOUNDS)], check=True, stdin=subprocess.DEVNULL)


def lufs(f):   # integrated loudness (ffmpeg ebur128)
    r = subprocess.run([spm.ffmpeg(), "-hide_banner", "-nostats", "-i", str(f), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)[-1])


if __name__ == "__main__":
    main()
