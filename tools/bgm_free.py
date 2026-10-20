"""A BGM take made without a guide (tools/bgm_chant.py's sung chants: ACE-Step text2music) into the game as a seamless loop - the
guided covers go through tools/bgm_pick.py instead.  python -I tools/bgm_free.py <track> <take> [<take> ...] [--dry]
  <take>: a file name in art/raw/bgm_ai (its .json gives bpm and key). Without hearing them: where each take fades out (the 1 s loudness
  falls 12 dB under its median) is its end; the loop is the longest whole number of 4-bar phrases between a start in its first 4 - 16 s
  and that end whose two seams sound most alike (the 2 bars after the loop's start against the 2 bars after its end: the beats - spectral
  flux - and the harmony - chroma - frame by frame). The best take wins. Its last 80 ms are blended into the 80 ms before the loop's start;
  levelled, written as Ogg Opus to public/content/base/bgm/<track>.ogg and registered in content audio/sounds.json music.<track> like
  bgm_pick.py's (loopStart, loopEnd, its loudness and vol at -12 LUFS).
  2026-10-20: ep2_night = chant_night2 (user: "the inn one can go in"), episode 2's inn at night (tools/rounds/ep2_level.py)."""
import importlib.util, json, pathlib, subprocess, sys
import numpy as np
from scipy.signal import stft

ROOT = pathlib.Path(__file__).resolve().parents[1]
s = importlib.util.spec_from_file_location("bp", ROOT / "tools" / "bgm_pick.py"); BP = importlib.util.module_from_spec(s); s.loader.exec_module(BP)
BASE, OUT, SOUNDS = BP.BASE, BP.OUT, BP.SOUNDS
HOP = 0.01


def chroma_frames(sr, m):   # 12 x frames, 10 ms steps, each frame scaled to 1
    f, t, Z = stft(m, sr, nperseg=4096, noverlap=4096 - int(sr * HOP)); S = np.abs(Z) ** 2
    ok = (f > 55) & (f < 2000); pc = np.round(69 + 12 * np.log2(f[ok] / 440.0)).astype(int) % 12
    C = np.stack([S[ok][pc == k].sum(0) for k in range(12)])
    return C / (np.linalg.norm(C, axis=0, keepdims=True) + 1e-9)


def best_loop(sr, x, bpm):
    m = x.mean(1); bar = 240.0 / bpm
    on = BP.onsets(sr, m, HOP); ch = chroma_frames(sr, m); n = min(len(on), ch.shape[1]); on, ch = on[:n], ch[:, :n]
    hs = int(sr * HOP); e = (m[:len(m) // hs * hs].reshape(-1, hs) ** 2).mean(1)   # (loudness in 10 ms steps, over 1 s)
    rms = np.sqrt(np.convolve(e, np.ones(100) / 100, "same")); db = 20 * np.log10(rms + 1e-9)
    live = np.where(db > np.median(db) - 12)[0]; end = live[-1] * HOP if len(live) else len(m) / sr
    win = int(2 * bar / HOP); best = (-9, 0, 0)
    for s0 in np.arange(4.0, 16.0, HOP):
        i = int(s0 / HOP)
        for k in range(32, 3, -4):   # (the longest first: a short loop repeats too often)
            L = k * bar
            if s0 + L > end - 0.3: continue
            j = int((s0 + L) / HOP)
            if j + win >= n: continue
            a, b = on[i:i + win], on[j:j + win]
            so = float(np.dot(a - a.mean(), b - b.mean()) / (np.linalg.norm(a - a.mean()) * np.linalg.norm(b - b.mean()) + 1e-9))
            sc = float((ch[:, i:i + win] * ch[:, j:j + win]).sum(0).mean())
            score = 0.5 * so + 0.5 * sc + 0.004 * k
            if score > best[0]: best = (score, s0, s0 + L)
            break   # (per start: the longest that fits)
    return best, end


def main():
    a = [x for x in sys.argv[1:] if not x.startswith("--")]; dry = "--dry" in sys.argv
    name, takes = a[0], a[1:]
    res = []
    for tk in takes:
        meta = json.loads((BASE / tk).with_suffix(".json").read_text(encoding="utf-8"))
        sr, x = BP.read2(BASE / tk)
        (score, ls, le), end = best_loop(sr, x, meta["bpm"])
        print(tk, f"score={score:.3f} loop {ls:.2f} - {le:.2f} ({(le - ls) * meta['bpm'] / 240:.0f} bars) usable to {end:.1f} of {len(x) / sr:.1f} s")
        res.append((score, tk, meta, sr, x, ls, le))
    score, tk, meta, sr, x, ls, le = max(res, key=lambda r: r[0])
    print("pick", tk)
    if dry: return
    a0, b0, c = int(round(ls * sr)), int(round(le * sr)), int(BP.CF * sr)
    y = x[:b0].copy(); wv = np.linspace(0, np.pi / 2, c)[:, None]
    y[b0 - c:b0] = y[b0 - c:b0] * np.cos(wv) + x[a0 - c:a0] * np.sin(wv)
    fi = int(0.02 * sr); y[:fi] *= np.linspace(0, 1, fi)[:, None]
    r = np.sqrt(np.mean(y[a0:b0] ** 2)); y = y * (10 ** (-14 / 20) / (r + 1e-9))
    y = np.where(np.abs(y) > 0.9, np.sign(y) * (0.9 + 0.09 * np.tanh((np.abs(y) - 0.9) / 0.09)), y)
    pcm = (np.clip(y, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run([BP.spm.ffmpeg(), "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(sr), "-ac", "2", "-i", "-",
                    "-c:a", "libopus", "-b:a", "128k", "-ar", "48000", str(OUT / f"{name}.ogg")], input=pcm, check=True)
    D = json.loads(SOUNDS.read_text(encoding="utf-8")); lu = BP.lufs(OUT / f"{name}.ogg")
    D.setdefault("music", {})[name] = {"files": [f"bgm/{name}.ogg"], "loopStart": round(ls, 4), "loopEnd": round(le, 4), "src": "ace",
                                       "from": pathlib.Path(tk).stem, "bpm": meta["bpm"], "key": meta["key"], "lufs": lu, "vol": round(10 ** ((-12 - lu) / 20), 2)}
    D["music"] = dict(sorted(D["music"].items()))
    SOUNDS.write_text(json.dumps(D, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(SOUNDS)], check=True, stdin=subprocess.DEVNULL)
    print(name, "->", OUT / f"{name}.ogg", D["music"][name])


if __name__ == "__main__":
    main()
