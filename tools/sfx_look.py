"""Look at generated sound effects without hearing them (docs/ART.md「声音」): python -I tools/sfx_look.py [key ...]
For every art/raw/sfx_ai/<key>/*.wav: measures (length, peak, loudness, where the sound starts and how long it rings, brightness)
and draws one sheet per key (art/raw/sfx_ai/_look/<key>.png): each variant a row, waveform envelope on the left, a log-frequency
spectrogram on the right, its numbers written over it. stats.json next to the sheets keeps the numbers (tools/sfx_pick.py reads it).
"""
import json, pathlib, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = ROOT / "art" / "raw" / "sfx_ai"
LOOK = BASE / "_look"


def read(p):
    sr, x = wavfile.read(str(p))
    x = x.astype(np.float32)
    if x.dtype.kind == "i" or np.abs(x).max() > 2: x = x / 32768.0
    if x.ndim > 1: x = x.mean(axis=1)
    return sr, x


def stats(sr, x):
    a = np.abs(x); pk = float(a.max() + 1e-9)
    hop = int(sr * 0.01); n = len(x) // hop
    env = np.array([a[i * hop:(i + 1) * hop].max() for i in range(n)]) / pk if n else np.zeros(1)
    loud = np.nonzero(env > 10 ** (-30 / 20))[0]
    start = float(loud[0] * 0.01) if len(loud) else 0.0
    end = float(loud[-1] * 0.01) if len(loud) else 0.0
    rms = float(np.sqrt(np.mean(x ** 2)) + 1e-9)
    f, t, Z = stft(x, sr, nperseg=1024, noverlap=768); S = np.abs(Z)
    cen = float((f[:, None] * S).sum() / (S.sum() + 1e-9))
    attack = float(np.argmax(env > 0.5) * 0.01 - start) if (env > 0.5).any() else 0.0
    # how much of the sounding part is near-silent gaps (several separate hits vs one)
    seg = env[int(start * 100):int(end * 100) + 1]
    gaps = float((seg < 10 ** (-24 / 20)).mean()) if len(seg) else 0.0
    return dict(len=round(len(x) / sr, 2), peak_db=round(20 * np.log10(pk), 1), rms_db=round(20 * np.log10(rms), 1),
                start=round(start, 2), end=round(end, 2), attack=round(attack, 3), centroid=round(cen), gaps=round(gaps, 2),
                crest=round(20 * np.log10(pk / rms), 1)), env, (f, t, S)


def sheet(key, rows, out):
    W, RH, LW = 1400, 120, 420
    im = Image.new("RGB", (W, RH * len(rows) + 30), (16, 16, 20)); d = ImageDraw.Draw(im)
    d.text((8, 8), key, fill=(255, 220, 120))
    for r, (name, st, env, (f, t, S)) in enumerate(rows):
        y0 = 30 + r * RH
        e = np.interp(np.linspace(0, len(env) - 1, LW), np.arange(len(env)), env)
        for i, v in enumerate(e):
            h = int(v * (RH - 24) / 2); d.line([(i, y0 + RH // 2 - h), (i, y0 + RH // 2 + h)], fill=(120, 200, 255))
        # log-frequency spectrogram 40 Hz .. 20 kHz
        fl = np.geomspace(40, 20000, RH - 10); idx = np.clip(np.searchsorted(f, fl), 0, len(f) - 1)
        Sd = 20 * np.log10(S[idx] + 1e-7); Sd = np.clip((Sd - Sd.max() + 70) / 70, 0, 1)
        img = (Sd[::-1] * 255).astype(np.uint8)
        sp = Image.fromarray(img).resize((W - LW - 10, RH - 10)).convert("RGB")
        sp = Image.merge("RGB", (sp.split()[0], sp.split()[0].point(lambda v: v * 0.7), sp.split()[0].point(lambda v: 255 - v if v > 10 else 0)))
        im.paste(sp, (LW + 10, y0 + 5))
        d.text((4, y0 + 2), f"{name}", fill=(255, 255, 255))
        d.text((4, y0 + RH - 14), " ".join(f"{k}={v}" for k, v in st.items()), fill=(255, 200, 160))
        d.line([(0, y0 + RH - 1), (W, y0 + RH - 1)], fill=(60, 60, 70))
    im.save(out)


def main(keys):
    LOOK.mkdir(parents=True, exist_ok=True)
    sp = LOOK / "stats.json"; ALL = json.loads(sp.read_text(encoding="utf-8")) if sp.exists() else {}
    dirs = [BASE / k for k in keys] if keys else sorted(p for p in BASE.iterdir() if p.is_dir() and not p.name.startswith("_"))
    for d in dirs:
        rows = []
        for p in sorted(d.glob("*.wav")):
            sr, x = read(p); st, env, spec = stats(sr, x); rows.append((p.stem, st, env, spec)); ALL.setdefault(d.name, {})[p.name] = st
        if rows: sheet(d.name, rows, LOOK / f"{d.name}.png"); print(d.name, len(rows))
    sp.write_text(json.dumps(ALL, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
