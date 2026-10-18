"""The theme song (user 2026-10-18): a long brainwashing loop for the title and the chapter select (6-7 minutes), a medley of themed
sections, the two girls' synthesized voices carrying it: chanting, speaking in rhythm, and "sung" the way a 人力ボカロ / 鬼畜 remix makes
speech sing (each syllable of their TTS voice moved onto a note of the melody and stretched to its length). Spirit, not copies: the
anthem has the weight and crowd of a grand march anthem (the user's Red Alert 3 / Metaphor references) with lyrics of our own; nothing
of either reference's melody or words is used.
  intro     taiko, gong, temple block; the nine seals
  anthem    the Empire of Cute: a march, our own lyrics sung by the two in turn, together on the chorus, a wordless "aaah" at the end
  chant     Buddhist / Taoist / Cthulhu chants in a medley (the cat girl has the Buddhist / Taoist ones: the gun girl's voice licence bans
            religious use, docs/ART.md 声音; she has the Cthulhu one and the shouts)
  jk        school day idol pop: the chime (the Westminster quarters, public domain), morning, late, the canteen bread, a sung hook
  remix     「相対性」remix (the user's reference: 相対性理論's remix album 『正しい相対性理論』, 2011): deadpan flat half-sung lines of our
            own (relativity jokes) with each syllable jumping left / right, a beat of everyday sounds (a spoon on glass, a pencil tap, paper,
            a camera shutter), buffer-repeat glitches; then the game's title chopped up (stutters, pitch steps, a reversed word), a tape stop
  sweets    lo-fi: electric piano, music box, vinyl, the two lazily eating (and the gelato they never got in episode 1)
  horror    drone, heartbeat, an out-of-tune music box, something deep
  finale    the anthem's chorus again, everything in a heap, the last chorus a tone up, back to the start (the file loops seamlessly)
The voices come from AivisSpeech (tools/voice_aivis.py; the engine must be running: `python -I tools/voice_aivis.py start`); the music is
synthesized here (numpy / scipy).
usage: python -I tools/bgm_theme.py [name] [--only <section>]   -> art/raw/bgm/<name>.ogg (game) + .mp3 (to listen to) + .wav (not in git)"""
import sys, wave, pathlib, subprocess
import numpy as np
from scipy import signal

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import voice_aivis as VA

SR = 48000
rng = np.random.default_rng(7)
FF = str(sorted((ROOT / "tools" / "ffmpeg").glob("*/bin/ffmpeg.exe"))[-1])


# ================================================================ sound helpers
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=0.003, k=6.0): x = tt(d); return np.minimum(1, x / a) * np.exp(-k * x)
def sos(kind, f, order=2): return signal.butter(order, f, kind, fs=SR, output="sos")
def band(x, lo, hi, order=2): return signal.sosfilt(sos("bandpass", [lo, hi], order), x)
def low(x, f, order=2): return signal.sosfilt(sos("lowpass", f, order), x)
def high(x, f, order=2): return signal.sosfilt(sos("highpass", f, order), x)
def fade(a, i=0.004, o=0.02):
    a = a.copy(); ni, no = min(len(a), int(i * SR)), min(len(a), int(o * SR))
    if ni: a[:ni] *= np.linspace(0, 1, ni)
    if no: a[-no:] *= np.linspace(1, 0, no)
    return a


def resample(a, k):   # played k times faster: pitch x k, length / k (the formants move too)
    n = max(2, int(len(a) / k)); return np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a)


def atempo(a, t):   # length / t, pitch kept (ffmpeg's WSOLA)
    if abs(t - 1) < 0.02: return a
    fs = []
    while t > 2: fs.append("atempo=2"); t /= 2
    while t < 0.5: fs.append("atempo=0.5"); t /= 0.5
    fs.append(f"atempo={t:.5f}")
    r = subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-filter:a", ",".join(fs),
                        "-f", "f32le", "-"], input=a.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).astype(np.float64)


def f0(a):   # median pitch of the voiced parts
    n = int(0.03 * SR); out = []
    for s in range(0, max(1, len(a) - n), n // 2):
        x = a[s:s + n] * np.hanning(len(a[s:s + n]))
        if len(x) < n or np.sqrt((x ** 2).mean()) < 0.03: continue
        c = np.correlate(x, x, "full")[n - 1:]; lo, hi = int(SR / 700), int(SR / 120)
        k = lo + np.argmax(c[lo:hi])
        if c[k] > 0.4 * c[0]: out.append(SR / k)
    return float(np.median(out)) if out else 392.0


# ================================================================ the voices
_V = VA.voices(); _ids = {}; _raw = {}; _sung = {}
def raw(who, text, style, speed, into):
    """her clip, cut tight, at SR"""
    key = (who, text, style, speed, into)
    if key not in _raw:
        if who not in _ids: _ids[who] = VA.styles(_V[who]["model"])
        sid = _ids[who][style]
        x, sr = VA.synth(VA.query(text, sid, {"speed": speed, "intonation": into}), sid)
        a = resample(VA.tight(x, sr), SR / sr)
        _raw[key] = (a, f0(a))
    return _raw[key]


SMALL = set("ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ")
def moras(text):
    out = []
    for ch in text.replace(" ", ""):
        if (ch in SMALL or ch in "ーっッ") and out: out[-1] += ch
        else: out.append(ch)
    return out


def sing(who, mora, midi, dur, style):
    """one syllable of her voice on a note: said alone (with a long vowel when the note is long), moved onto the note, stretched to it"""
    key = (who, mora, midi, round(dur, 3), style)
    if key not in _sung:
        long = dur > 0.32 and not mora.endswith(("っ", "ッ"))
        a, f = raw(who, mora + ("ー" * min(3, int(dur / 0.3)) if long else ""), style, 1.3, 0.0)
        b = resample(a, mtof(midi) / f)
        _sung[key] = fade(atempo(b, len(b) / SR / dur))
    return _sung[key]


def speak(who, text, style="Positive", speed=1.15, into=1.0, fit=None, tune=None):
    """a spoken line (her own intonation); fit = at most that many seconds (squeezed); tune = moved onto that note (a chant)"""
    a, f = raw(who, text, style, speed, into)
    if tune is not None: a = atempo(resample(a, mtof(tune) / f), mtof(tune) / f)
    if fit and len(a) / SR > fit: a = atempo(a, len(a) / SR / fit)
    return fade(a, 0.002, 0.03)


def fit_notes(notes, n):
    """a melody template [(midi, beats)] fitted to n syllables: the shortest neighbours merged / the longest notes split"""
    notes = list(notes)
    while len(notes) > n:
        i = min(range(len(notes) - 1), key=lambda k: notes[k][1] + notes[k + 1][1])
        notes[i:i + 2] = [(notes[i][0], notes[i][1] + notes[i + 1][1])]
    while len(notes) < n:
        i = max(range(len(notes)), key=lambda k: notes[k][1])
        m, b = notes[i]; notes[i:i + 1] = [(m, b / 2), (m, b / 2)]
    return notes


def tpl(pitches, beats):
    if isinstance(beats, (int, float)): beats = [beats] * len(pitches)
    assert len(pitches) == len(beats), (len(pitches), len(beats))
    return list(zip(pitches, beats))


# ================================================================ instruments
def taiko(v=1.0):
    x = tt(0.9); f = 48 + 50 * np.exp(-x * 18)
    return v * (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 4.5) + low(rng.standard_normal(len(x)), 900) * np.exp(-x * 30) * 0.5)
def snare(v=1.0, d=0.25):
    x = tt(d); return v * (band(rng.standard_normal(len(x)), 1500, 7000) * np.exp(-x * 16) * 0.9 + np.sin(2 * np.pi * 190 * x) * np.exp(-x * 30) * 0.5)
def hat(v=1.0, d=0.06):
    x = tt(d); return v * high(rng.standard_normal(len(x)), 7000) * np.exp(-x * 60) * 0.5
def kick(v=1.0):
    x = tt(0.42); f = 45 + 120 * np.exp(-x * 28)
    return v * (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 7) + high(rng.standard_normal(len(x)), 3000) * np.exp(-x * 220) * 0.25)
def clap(v=1.0):
    x = tt(0.3); n = band(rng.standard_normal(len(x)), 900, 3200); e = np.zeros_like(x)
    for d in (0, 0.011, 0.022): e += (x >= d) * np.exp(-(x - d).clip(0) * 140)
    return v * n * (e + 0.35 * np.exp(-x * 16))
def shaker(v=1.0):
    x = tt(0.09); return v * band(rng.standard_normal(len(x)), 5000, 11000) * np.minimum(1, x / 0.012) * np.exp(-x * 45) * 0.6
def block(v=1.0):
    x = tt(0.18); return v * (np.sin(2 * np.pi * 540 * x) + 0.6 * np.sin(2 * np.pi * 1290 * x)) * np.exp(-x * 34) * np.minimum(1, x / 0.001)
def gong(v=1.0, f=82):
    x = tt(5.0); out = np.zeros_like(x)
    for r, a, k in ((1, 1, 0.6), (1.47, 0.6, 0.8), (2.09, 0.5, 1.0), (2.56, 0.35, 1.3), (3.21, 0.3, 1.6), (4.17, 0.2, 2.2)):
        for dt in (-0.4, 0.4): out += a * np.sin(2 * np.pi * (f * r + dt) * x) * np.exp(-x * k)
    return v * out * np.minimum(1, x / 0.04) * 0.4
def bell(f=2400, v=1.0, d=1.6):
    x = tt(d); out = sum(a * np.sin(2 * np.pi * f * r * x) * np.exp(-x * k) for r, a, k in ((1, 1, 2.5), (2.76, 0.4, 5), (5.4, 0.2, 9)))
    return v * out * np.minimum(1, x / 0.002)
def chime(m, v=1.0):   # a tubular school chime
    x = tt(2.4); f = mtof(m)
    out = sum(a * np.sin(2 * np.pi * f * r * x) * np.exp(-x * k) for r, a, k in ((1, 1, 1.2), (2.0, 0.5, 2.0), (3.0, 0.3, 3.0), (4.2, 0.25, 4)))
    return v * out * np.minimum(1, x / 0.003)
def musicbox(m, v=1.0, detune=0.0):
    x = tt(1.4); f = mtof(m) * 2 ** (detune / 1200)
    return v * (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * f * 3.02 * x) * np.exp(-x * 6) + 0.15 * np.sin(2 * np.pi * f * 5.1 * x) * np.exp(-x * 12)) * np.exp(-x * 3) * np.minimum(1, x / 0.002)
def saw(f, d, n=4, det=0.12):
    x = tt(d); return sum(signal.sawtooth(2 * np.pi * f * 2 ** (det * (i - (n - 1) / 2) / 12) * x + rng.uniform(0, 6)) for i in range(n)) / n
def brass(m, d=0.55, v=1.0):
    x = tt(d); f = mtof(m); out = np.zeros_like(x)
    for h in range(1, 24):
        if f * h > 9000: break
        out += np.sin(2 * np.pi * f * h * x * (1 + 0.0015 * np.sin(2 * np.pi * 5 * x))) / h * np.exp(-x * (2 + 1.6 * h))
    return v * out * np.minimum(1, x / 0.012)
def brass_hold(m, d, v=1.0):   # a held brass note (the melody over the anthem)
    x = tt(d); f = mtof(m); out = np.zeros_like(x); vib = 1 + 0.003 * np.sin(2 * np.pi * 5.5 * x) * np.minimum(1, x / 0.3)
    for h in range(1, 18):
        if f * h > 8000: break
        out += np.sin(2 * np.pi * f * h * x * vib) / h ** 1.2
    return v * out * np.minimum(1, x / 0.03) * np.minimum(1, (d - x) / 0.06).clip(0)
def bass(m, d, v=1.0): return v * low(saw(mtof(m), d, 2, 0.05), 380) * env(d, 0.004, 5)
def subbass(m, d, v=1.0): x = tt(d); return v * np.sin(2 * np.pi * mtof(m) * x) * np.minimum(1, x / 0.01) * np.minimum(1, (d - x) / 0.05).clip(0)
def string(m, d, v=1.0): return v * low(saw(mtof(m), d, 3, 0.08), 2400) * env(d, 0.01, 7)
def chip(m, d, v=1.0, duty=0.5): x = tt(d); return v * signal.square(2 * np.pi * mtof(m) * x, duty) * env(d, 0.002, 9) * 0.5
def epiano(m, d, v=1.0):
    x = tt(d); f = mtof(m); I = 2.0 * np.exp(-x * 3.5) + 0.25
    y = np.sin(2 * np.pi * f * x + I * np.sin(2 * np.pi * f * x)) + 0.12 * np.sin(2 * np.pi * f * 14 * x) * np.exp(-x * 40)
    return v * y * np.minimum(1, x / 0.004) * np.exp(-x * 1.6) * np.minimum(1, (d - x) / 0.08).clip(0)
def choir(ms, d, v=1.0):   # a low "oh" choir: detuned saws through the formants of "o"
    pad = sum(saw(mtof(m), d, 4, 0.18) for m in ms)
    pad = 1.0 * band(pad, 330, 560) + 0.55 * band(pad, 680, 980) + 0.15 * band(pad, 2400, 3000)
    x = tt(d); return v * pad * np.minimum(1, x / 0.25) * np.minimum(1, (d - x) / 0.15).clip(0) * 2.2
def drone(d, v=1.0):
    x = tt(d); y = low(saw(mtof(31), d, 5, 0.3) + 0.7 * saw(mtof(38), d, 5, 0.3), 380) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.13 * x))
    return v * y * np.minimum(1, x / 2.0) * np.minimum(1, (d - x) / 1.0).clip(0)
def wind(d, v=1.0):
    x = tt(d); n = band(rng.standard_normal(len(x)), 300, 1400) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.21 * x + 1) ** 2)
    return v * n * np.minimum(1, x / 1.5) * np.minimum(1, (d - x) / 1.0).clip(0)
def vinyl(d, v=1.0):
    x = tt(d); hiss = low(rng.standard_normal(len(x)), 4000) * 0.06
    pops = np.zeros_like(x); idx = rng.integers(0, len(x), int(d * 9)); pops[idx] = rng.uniform(-1, 1, len(idx)); pops = band(pops, 1000, 6000) * 3
    return v * (hiss + pops)
def riser(d, v=1.0):
    x = tt(d); n = rng.standard_normal(len(x)); out = np.zeros_like(x); seg = int(0.05 * SR)
    for s in range(0, len(x), seg):
        f = 400 + 6000 * (s / len(x)) ** 2; out[s:s + seg] = band(n[s:s + seg], f, min(f * 2, 20000))
    return v * out * (x / d) ** 2
def wobble(m, d, rate, v=1.0):
    x = tt(d); y = saw(mtof(m), d, 3, 0.15); lo_ = low(y, 300); hi_ = band(y, 600, 2400)
    w = 0.5 + 0.5 * np.sin(2 * np.pi * rate * x - np.pi / 2)
    return v * (lo_ * 1.0 + hi_ * w * 1.2) * env(d, 0.005, 0.8)


# everyday sounds as a drum kit (the remix: a spoon on glass, a pencil on a desk, paper, a camera shutter)
def spoon(v=1.0): x = tt(0.35); return v * (bell(3150, 1, 0.35) * np.exp(-x * 9) + high(rng.standard_normal(len(x)), 6000) * np.exp(-x * 300) * 0.4)
def pencil(v=1.0): x = tt(0.08); return v * (np.sin(2 * np.pi * 1020 * x) + 0.5 * np.sin(2 * np.pi * 2450 * x)) * np.exp(-x * 70) * np.minimum(1, x / 0.0005)
def paper(v=1.0):
    x = tt(0.25); f = 50 + 60 * np.exp(-x * 30)
    return v * (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 14) + band(rng.standard_normal(len(x)), 400, 3500) * np.exp(-x * 40) * 0.6)
def shutter(v=1.0):
    x = tt(0.12); n = band(rng.standard_normal(len(x)), 2500, 9000)
    return v * n * ((x < 0.02) * np.exp(-x * 150) + (x >= 0.06) * np.exp(-(x - 0.06).clip(0) * 120))


# chords (MIDI, a low voicing for pads / bass; the root is the first)
CH = {"Gm7": [55, 58, 62, 65], "D7": [50, 54, 57, 60], "Gm": [55, 58, 62], "Eb": [51, 55, 58], "D": [50, 54, 57], "Cm": [48, 51, 55], "F": [53, 57, 60], "Bb": [46, 50, 53],
      "Ebmaj7": [51, 55, 58, 62], "Cm7": [48, 51, 55, 58], "Fm7": [53, 56, 60, 63], "Bb7": [46, 50, 53, 56]}
def chord(name, tr=0): return [m + tr for m in CH[name]]


# ================================================================ a section: its own tempo, buffers, reverb
class Sec:
    def __init__(s, name, bpm, bars, tail=3.5):
        s.name, s.B = name, 60 / bpm; s.BAR = 4 * s.B; s.bars = bars; s.len = bars * s.BAR
        s.N = int((s.len + tail) * SR)
        s.music = np.zeros((2, s.N)); s.voice = np.zeros((2, s.N)); s.hall = np.zeros((2, s.N))
    def at(s, bar, beat=0.0): return bar * s.BAR + beat * s.B
    def put(s, buf, a, t, g=1.0, pan=0.0, wet=0.0):
        i = int(t * SR)
        if i >= s.N or i < 0: return
        a = a[:s.N - i] * g; L, R = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
        buf[0, i:i + len(a)] += a * L; buf[1, i:i + len(a)] += a * R
        if wet: s.hall[0, i:i + len(a)] += a * L * wet; s.hall[1, i:i + len(a)] += a * R * wet
    def mus(s, a, t, g=1.0, pan=0.0, wet=0.15): s.put(s.music, a, t, g, pan, wet)
    def vox(s, a, t, g=1.0, pan=0.0, wet=0.3, crowd=False, deep=False):
        s.put(s.voice, a, t, g, pan, wet)
        if crowd:   # a little choir: copies a few ms apart, a hair sharp / flat, spread
            for d, k, p in ((0.017, 1.006, -0.55), (0.029, 0.994, 0.55), (0.041, 1.003, 0.0)):
                s.put(s.voice, resample(a, k), t + d, g * 0.45, max(-1, min(1, pan + p)), wet * 1.3)
        if deep: s.put(s.voice, atempo(resample(a, 0.5), 2.0), t, g * 0.55, pan, wet * 1.5)   # an octave down, formants too: not human
    def line(s, who, text, notes, bar, beat=0.0, tr=0, g=1.0, pan=0.0, style=None, crowd=False, deep=False, stacc=0.92, hop=0.0):
        """a sung line: the syllables of text on the notes [(midi, beats)] from (bar, beat); hop = each syllable jumps that far left / right"""
        style = style or ("Positive" if who == "pink" else "ノーマル")
        ms = moras(text); t = s.at(bar, beat)
        for i, (m, (midi, b)) in enumerate(zip(ms, fit_notes(notes, len(ms)))):
            p = max(-1, min(1, pan + (hop * (1 if i % 2 else -1) if hop else 0)))
            s.vox(sing(who, m, midi + tr, b * s.B * stacc, style), t, g, p, crowd=crowd, deep=deep); t += b * s.B
    def say(s, who, text, bar, beat=0.0, g=1.0, pan=None, beats=None, style=None, speed=1.15, into=1.0, crowd=False, deep=False, tune=None, wet=0.3):
        """a spoken line from (bar, beat), squeezed into that many beats when it is longer"""
        style = style or ("Positive" if who == "pink" else "ノーマル")
        pan = (0.25 if who == "pink" else -0.25) if pan is None else pan
        a = speak(who, text, style, speed, into, fit=beats * s.B * 0.95 if beats else None, tune=tune)
        s.vox(a, s.at(bar, beat), g, pan, wet, crowd, deep)
        return a
    def mix(s, voice_gain=1.25, music_gain=0.62, duck=0.4, ir=2.6, ir_k=2.4, ir_lp=5000, wet_gain=1.0, vfilter=None, stop=None):
        n = int(ir * SR); x = np.arange(n) / SR
        irs = rng.standard_normal((2, n)) * np.exp(-x * ir_k); irs = np.stack([low(irs[0], ir_lp), low(irs[1], ir_lp)])
        wet = np.stack([signal.fftconvolve(s.hall[i], irs[i])[:s.N] for i in range(2)]) * 0.012 * wet_gain
        v = s.voice
        if vfilter: v = np.stack([vfilter(v[0]), vfilter(v[1])])
        e = np.abs(v).max(0); e = signal.sosfilt(sos("lowpass", 6, 1), e); e = e / max(1e-6, e.max())
        m = s.music - 0.45 * np.stack([band(s.music[0], 1000, 3500), band(s.music[1], 1000, 3500)])   # (the voices' band left to them)
        out = m * music_gain * (1 - duck * e) + v * voice_gain + wet
        for (bar, beat, sl, reps) in getattr(s, "glitches", []):   # a slice of sl beats played reps times (a buffer-repeat glitch)
            i0, n = int(s.at(bar, beat) * SR), int(sl * s.B * SR); piece = out[:, i0:i0 + n].copy()
            for r in range(1, reps): out[:, i0 + r * n:i0 + (r + 1) * n] = piece[:, :max(0, min(n, out.shape[1] - i0 - r * n))]
        if stop: out = tapestop(out, s.at(*stop[0]), stop[1])
        return out


def tapestop(y, t0, dur):   # from t0 the tape slows to a halt over dur seconds, then silence
    i0, n = int(t0 * SR), int(dur * SR)
    rate = np.linspace(1, 0, n); pos = i0 + np.cumsum(rate)
    out = y.copy()
    for c in range(2):
        seg = np.interp(pos, np.arange(y.shape[1]), y[c]); out[c, i0:i0 + n] = seg[:max(0, min(n, y.shape[1] - i0))]
        out[c, i0 + n:] = 0
    return out


CAT, PINK = "cat", "pink"


# ================================================================ the sections
def march(s, bars_chords, start=0, taiko_only=False, rolls=True, brass_hits=(), tr=0, g=1.0):
    """the march: taiko, snare, hats, temple block, bass, the "oh" choir, brass stabs on the given bars"""
    for k, c in enumerate(bars_chords):
        b = start + k; root = chord(c, tr)[0]
        for q in range(4):
            if q in (0, 2) or (not taiko_only and q == 3 and b % 2): s.mus(taiko(1.0 if q == 0 else 0.75), s.at(b, q), 0.9 * g)
            if not taiko_only and q in (1, 3): s.mus(snare(0.8), s.at(b, q), 0.5 * g, 0.1, 0.2)
            if not taiko_only: s.mus(hat(0.6), s.at(b, q + 0.5), 0.35 * g, 0.3)
            s.mus(block(1.0 if q == 0 else 0.7), s.at(b, q), 0.25 * g, -0.25, 0.25)
        if rolls and not taiko_only and b % 4 == 3:
            for i in range(8): s.mus(snare(0.35 + 0.08 * i), s.at(b, 2 + i * 0.25), 0.45 * g, 0.1, 0.15)
        s.mus(choir([m - 12 + 12 * (j == 2) for j, m in enumerate(chord(c, tr))], s.BAR + 0.15), s.at(b), 0.11 * g, 0, 0.5)
        if not taiko_only:
            for k8 in range(8): s.mus(bass(root - 12 if k8 % 2 == 0 else root, s.B * 0.45), s.at(b, k8 * 0.5), 0.55 * g)
        if b in brass_hits:
            for m in (root + 12, root + 19, root + 24): s.mus(brass(m, 0.5), s.at(b), 0.14 * g, 0, 0.3)


def intro():
    s = Sec("intro", 140, 8)
    march(s, ["Gm", "Gm", "Gm", "Gm", "Eb", "Eb", "D", "D"], taiko_only=True)
    s.mus(gong(1.0), 0, 0.7, 0, 0.4); s.mus(bell(2350, 0.8), s.at(3, 3.5), 0.2, 0.4, 0.5)
    s.say(PINK, "ねぇ… はじまるよ", 2, 0, 0.8, style="ノーマル", speed=1.0, into=0.6)
    s.say(CAT, "…にゃ", 3, 2, 0.8, style="ねむたい", speed=1.0)
    for i, m in enumerate(["りん", "ぴょう", "とう", "しゃ", "かい", "じん", "れつ", "ざい", "ぜんっ"]):
        s.vox(speak(CAT, m, "ノーマル", 1.25, 0.0, tune=67), s.at(4, i * 0.5), 1.0, -0.15, crowd=(i == 8))
    for k, m in ((0, 62), (0.5, 67), (1, 67), (1.5, 70), (2, 74)): s.mus(brass_hold(m, s.B * 0.45), s.at(6, k), 0.12, 0, 0.3)
    s.mus(brass_hold(72, s.B * 1.8), s.at(6, 2.5), 0.12, 0, 0.3); s.mus(brass_hold(66, s.B * 1.8), s.at(7, 0), 0.12, 0, 0.3)
    s.say(PINK, "せーのっ!", 7, 2.5, 1.0)
    return s


# the anthem's tunes (G minor; our own)
VERSE = [tpl([62, 67, 67, 69, 70, 69, 67, 69, 70, 72, 70, 67], [0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2]),
         tpl([70, 70, 69, 67, 65, 65, 67, 69, 70, 72, 74, 72, 70, 69], [0.5] * 12 + [1, 1]),
         tpl([74, 74, 75, 74, 72, 70, 72, 74, 70, 69, 67, 69, 70], [0.5] * 10 + [1, 1, 1]),
         tpl([74, 72, 70, 72, 70, 69, 70, 69, 67, 66, 67], [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 2])]
CHORUS = [tpl([74, 74, 75, 77, 75, 74, 72, 74, 75, 74, 72, 70, 74], [0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 1]),
          tpl([72, 72, 70, 72, 74, 72, 70, 67, 69, 70, 72, 70, 69, 67], [0.5] * 12 + [1, 1]),
          tpl([74, 74, 75, 74, 72, 74, 75, 77, 79, 77, 75, 74], [0.5] * 8 + [1, 1, 1, 1]),
          tpl([74, 72, 70, 72, 74, 74, 72, 70, 69, 70, 67, 66, 67], [0.5] * 8 + [0.5, 0.5, 1, 1, 1])]
V1 = [(PINK, "かわいいわ せかいお すくう"), (CAT, "ようかいも あくりょうも まとめて"), (PINK, "ひきがね ひいたら うたになる"), (CAT, "もえて もえて もえつきろ")]
V2 = [(PINK, "つくえも くつばこも こわくない"), (CAT, "じぇらーとの やかたも おてのもの"), (PINK, "よるが あけるまで うちまくれ"), (CAT, "にゃんと いっても さいきょうだ")]
CH_LY = ["そうたい きぼうの しょうじょたち", "ひきがね うたえ とりがーぽえむ", "おばけも まものも ひれふせ", "かわいいわ ぜったい せいぎだ"]
VERSE_CH = ["Gm", "Gm", "Eb", "D", "Gm", "Cm", "D", "Gm"]
CHORUS_CH = ["Gm", "Eb", "Cm", "D", "Eb", "F", "D", "Gm"]


def chorus(s, bar, tr=0, brass_melody=False):
    for i, text in enumerate(CH_LY):
        for who, pan in ((PINK, 0.3), (CAT, -0.3)): s.line(who, text, CHORUS[i], bar + 2 * i, tr=tr, g=0.8, pan=pan, crowd=True)
        if brass_melody:
            t = s.at(bar + 2 * i)
            for m, b in CHORUS[i]: s.mus(brass_hold(m + tr - 12, b * s.B * 0.9), t, 0.08, 0, 0.3); t += b * s.B


def verse(s, bar, lines):
    for i, (who, text) in enumerate(lines):
        s.line(who, text, VERSE[i], bar + 2 * i, pan=0.25 if who == PINK else -0.25)
        other = CAT if who == PINK else PINK   # the other one answers on the last offbeat
        s.vox(speak(other, "はっ!", "Positive" if other == PINK else "ノーマル", 1.4, 1.0), s.at(bar + 2 * i + 1, 3.5), 0.5, -0.4 if other == CAT else 0.4)


def anthem():
    s = Sec("anthem", 140, 40)
    march(s, ["Gm", "Eb", "Cm", "D"], 0, brass_hits=(0, 2))
    t = s.at(0)
    for m, b in CHORUS[0] + CHORUS[3]: s.mus(brass_hold(m - 12, b * s.B * 0.9), t, 0.12, 0, 0.3); t += b * s.B   # the fanfare: the chorus tune on brass
    march(s, VERSE_CH, 4, brass_hits=(4,)); verse(s, 4, V1)
    march(s, CHORUS_CH, 12, brass_hits=(12, 14, 16, 18)); chorus(s, 12)
    march(s, VERSE_CH, 20, brass_hits=(20,)); verse(s, 20, V2)
    march(s, CHORUS_CH, 28, brass_hits=(28, 30, 32, 34)); chorus(s, 28, brass_melody=True)
    march(s, ["Gm", "Eb", "D", "Gm"], 36, brass_hits=(36, 37, 38, 39))
    for who, pan in ((PINK, 0.3), (CAT, -0.3)):   # the wordless "aaah"
        s.line(who, "あ", [(74, 8)], 36, g=0.75, pan=pan, crowd=True, deep=(who == CAT), stacc=0.97)
        s.line(who, "あ", [(67, 8)], 38, g=0.75, pan=pan, crowd=True, stacc=0.97)
    s.mus(gong(0.9), s.at(39, 2), 0.6, 0, 0.4)
    return s


def chant():
    s = Sec("chant", 140, 18)
    march(s, ["Gm", "Gm", "Gm", "Eb", "Gm", "D", "Cm", "D", "Eb", "D", "Gm", "Eb", "Cm", "D", "Gm", "Eb", "Cm", "D"], brass_hits=(2, 6, 9, 14, 15, 16, 17))
    for b in range(6, 14):
        c = chord(["Cm", "D", "Eb", "D", "Gm", "Eb", "Cm", "D"][b - 6]); arp = [c[0] + 12, c[1] + 12, c[2] + 12, c[1] + 12]
        for i in range(16): s.mus(string(arp[i % 4], s.B * 0.22), s.at(b, i * 0.25), 0.11, 0.35 * (1 if i % 2 else -1), 0.2)
    c = lambda text, sp=1.25: speak(CAT, text, "ノーマル", sp, 0.0, tune=67)
    p = lambda text, sp=1.25, st="Positive": speak(PINK, text, st, sp, 0.0, tune=67)
    for i, m in enumerate(["おん", "ま", "に", "ぱ", "ど", "め", "ふむっ"]):
        for rep in (0, 2): s.vox(c(m), s.at(rep, i), 1.0, -0.2, crowd=(rep == 2))
    for rep in (0, 2):
        for k in (7, 7.5): s.vox(p("とぅっ!", 1.4), s.at(rep, k), 0.9, 0.3)
        for k in (0.5, 2.5, 4.5): s.vox(p("はっ!", 1.4), s.at(rep, k), 0.55, 0.35)
    s.vox(atempo(c("のうまく さんまんだ ばざらだん かん"), 1), s.at(4), 0)   # (cached for the fit below)
    a = c("のうまく さんまんだ ばざらだん かん"); s.vox(atempo(a, len(a) / SR / (7 * s.B)), s.at(6), 1.0, -0.15, crowd=True, deep=True)
    for i, m in enumerate(["きゅう", "きゅう", "にょ", "りつ", "りょうっ!"]): s.vox(c(m), s.at(8, i), 1.0, -0.2, crowd=(i == 4))
    s.vox(speak(PINK, "りょーかいっ!", "Positive", 1.2, 1.0), s.at(9, 2), 1.0, 0.25)
    a = p("ふんぐるい むぐるうなふ くとぅるふ るるいえ うがふなぐる ふたぐん", 1.2, "ノーマル"); s.vox(atempo(a, len(a) / SR / (7.5 * s.B)), s.at(10), 1.0, 0.2, deep=True)
    for k in range(4): s.vox((p if k % 2 == 0 else c)("いあ!"), s.at(12, k), 1.0, 0.3 if k % 2 == 0 else -0.3)
    for f, pan in ((p, 0.25), (c, -0.25)): a = f("くとぅるふ ふたぐん!"); s.vox(atempo(a, len(a) / SR / (3 * s.B)), s.at(13), 0.85, pan, crowd=True)
    a = c("ぎゃーてい ぎゃーてい ハーラーぎゃーてい ハラソーぎゃーてい"); s.vox(atempo(a, len(a) / SR / (7 * s.B)), s.at(14), 1.0, -0.15, crowd=True)
    for k in (0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5): s.vox(p("とぅっ!", 1.4), s.at(14, k), 0.6, 0.35)
    a = c("ぼーじー そわかっ!"); s.vox(atempo(a, len(a) / SR / (2 * s.B)), s.at(16), 1.0, -0.15, crowd=True)
    s.say(PINK, "せーのっ!", 16, 2.5)
    a = c("きゅうきゅう にょりつりょうっ!"); s.vox(atempo(a, len(a) / SR / (2 * s.B)), s.at(17), 1.0, -0.15, crowd=True, deep=True)
    for k in (2.5, 3): s.vox(p("とぅっ!", 1.4), s.at(17, k), 0.9, 0.3)
    s.music[:, :int(0.02 * SR)] *= 1   # (nothing: the gong of the anthem's end rings into it)
    return s


# the school day (B-flat major, 168: idol pop)
WEST = [[74, 72, 70, 65], [70, 74, 72, 65], [74, 70, 72, 65], [65, 72, 74, 70]]   # the Westminster quarters (public domain), in B-flat
HOOK = [tpl([70, 70, 72, 74, 74, 72, 70, 72, 74, 77, 74, 72, 70], [0.5] * 12 + [2]),
        tpl([77, 77, 75, 74, 72, 74, 75, 77, 79, 77, 75, 74, 72], [0.5] * 12 + [2]),
        tpl([74, 74, 72, 70, 69, 70, 72, 74, 72, 70, 69, 67, 65], [0.5] * 12 + [2]),
        tpl([70, 72, 74, 75, 77, 75, 74, 72, 74, 72, 70, 69, 70], [0.5] * 8 + [0.5, 0.5, 1, 1, 1])]
HOOK_LY = [(PINK, "ほうかご なにする どこいくの"), (CAT, "ぷりとって じぇらーと たべにいこ"), (PINK, "あしたの てすとわ しらないもん"), (None, "きょうも せかいわ かわいいな")]


def pop(s, b0, bars, full=True):
    cyc = ["Bb", "F", "Gm", "Eb"]
    for k in range(bars):
        b = b0 + k; c = chord(cyc[b % 4]); root = c[0]
        for q in range(4):
            s.mus(kick(1.0), s.at(b, q), 0.75 if full else 0.5)
            if full: s.mus(hat(0.8, 0.05), s.at(b, q + 0.5), 0.35, 0.3); s.mus(shaker(0.6), s.at(b, q + 0.25), 0.2, -0.3); s.mus(shaker(0.6), s.at(b, q + 0.75), 0.2, -0.3)
            if full and q in (1, 3): s.mus(clap(1.0), s.at(b, q), 0.55, 0, 0.25)
        for k8 in range(8): s.mus(bass(root - 12 + (12 if k8 % 2 else 0), s.B * 0.4), s.at(b, k8 * 0.5), 0.5 if full else 0.3)
        for m in c: s.mus(epiano(m + 12, s.BAR * 0.95), s.at(b), 0.13, 0, 0.2)
        if full:
            arp = [c[0] + 24, c[1] + 24, c[2] + 24, c[1] + 24]
            for i in range(16): s.mus(chip(arp[i % 4], s.B * 0.2, duty=0.25), s.at(b, i * 0.25), 0.06, 0.4 * (1 if i % 2 else -1), 0.1)


def jk():
    s = Sec("jk", 168, 48)
    for k, ph in enumerate(WEST[:2]):
        for i, m in enumerate(ph): s.mus(chime(m), s.at(k * 2, i * 2), 0.32, 0.15 * (1 if i % 2 else -1), 0.5)
    pop(s, 0, 4, full=False)
    s.say(PINK, "あっ チャイム!", 3, 2, 0.9)
    pop(s, 4, 40)
    for (b, q, who, text, beats) in [(4, 0, PINK, "おはよー!", 3), (5, 0, CAT, "…ねむい", 3), (6, 0, PINK, "ちこく ちこくー!", 4), (7, 0, CAT, "はしれー!", 3),
                                     (8, 0, PINK, "おはよー!", 2), (8, 2, CAT, "おはよー", 2), (9, 0, PINK, "まってー!", 3), (10, 0, CAT, "セーフ!", 3),
                                     (11, 0, PINK, "やったー!", 3),
                                     (12, 0, PINK, "こうばいの", 2), (12, 2, PINK, "メロンパン!", 2), (13, 0, CAT, "ラスいち!", 3), (14, 0, PINK, "じゃんけん…", 3),
                                     (16, 0, CAT, "かった!", 2), (16, 2, PINK, "まけたー!", 2), (17, 0, PINK, "わけて?", 3), (18, 0, CAT, "やだ", 3), (19, 0, PINK, "ケチー!", 3)]:
        s.say(who, text, b, q, beats=beats, style=("ねむたい" if text == "…ねむい" else None))
    for who, pan in ((PINK, 0.3), (CAT, -0.3)): s.say(who, "ぽん!", 15, 0, 0.9, pan=pan, beats=2, crowd=True)
    s.vox(speak(PINK, "お", "Positive", 1.3, 1.0), s.at(6, 3.5), 0.0)   # (warm-up)
    for b in (20, 36):
        for i, (who, text) in enumerate(HOOK_LY):
            if who: s.line(who, text, HOOK[i], b + 2 * i, pan=0.25 if who == PINK else -0.25)
            else:
                for w, pan in ((PINK, 0.3), (CAT, -0.3)): s.line(w, text, HOOK[i], b + 2 * i, g=0.8, pan=pan, crowd=(b == 36))
        s.line(PINK, "ほうかご", HOOK[0][:4], b + 6, 3.0, g=0.5, pan=0.5)   # (an echo)
    talk = [(PINK, "テストはんい!"), (CAT, "しらなーい"), (PINK, "やばーい!"), (CAT, "それなー"), (PINK, "ノート みせて!"), (CAT, "やだー"),
            (PINK, "おねがーい!"), (CAT, "…しかたないにゃ")]
    for i, (who, text) in enumerate(talk * 2): s.say(who, text, 28 + i // 2, (i % 2) * 2, beats=2)
    for k, ph in enumerate(WEST[2:]):
        for i, m in enumerate(ph): s.mus(chime(m), s.at(44 + k * 2, i * 2), 0.32, 0.15 * (1 if i % 2 else -1), 0.5)
    s.say(PINK, "かえろっか", 44, 0, beats=3); s.say(CAT, "ん", 45, 0, beats=2, style="ねむたい")
    for who, pan in ((PINK, 0.3), (CAT, -0.3)): s.say(who, "またあしたー!", 46, 0, pan=pan, beats=4, crowd=True)
    return s


def chop(a, n=0.09): return fade(a[:int(n * SR)], 0.002, 0.015)
FLAT = [(67, 0.5)] * 12 + [(62, 1), (67, 1)]   # a deadpan line: one note, a drop at its end
FLAT2 = [(67, 0.5)] * 8 + [(70, 0.5)] * 4 + [(67, 2)]
DEADPAN = [(PINK, "そうたいてきに きぼうわ ひきがね", FLAT), (CAT, "ぜったいてきに ねこわ かわいい", FLAT2),
           (PINK, "ひかりより はやく あいにきて", FLAT), (CAT, "じかんが のびても まってるにゃ", FLAT2)]
def remix():
    s = Sec("remix", 120, 24)
    cyc = ["Gm7", "Ebmaj7", "Cm7", "D7"]
    for b in range(23):
        c = chord(cyc[b % 4]); root = c[0]
        # the beat of everyday sounds: paper for the kick, a pencil for the hats, a spoon on glass on the offbeats, a shutter for the snare
        for q, v in ((0, 1.0), (1.75, 0.6), (2.5, 0.9)): s.mus(paper(v), s.at(b, q), 0.9)
        for q in (1, 3): s.mus(shutter(1.0), s.at(b, q), 0.6, 0.15, 0.1)
        for i in range(8): s.mus(pencil(0.6 + 0.4 * (i % 2)), s.at(b, i * 0.5 + 0.25), 0.35, 0.5 * (1 if i % 2 else -1))
        if b >= 4:
            for q in (0.5, 2.0, 3.5): s.mus(spoon(0.8), s.at(b, q), 0.22, -0.4, 0.3)
            s.mus(subbass(root - 12, s.B * 1.5), s.at(b), 0.55); s.mus(subbass(root - 12, s.B * 1.2), s.at(b, 2.5), 0.45)
            for q in (0, 1.5, 3):   # quirky electric-piano stabs
                for m in c: s.mus(epiano(m + 12, s.B * 0.4), s.at(b, q), 0.1, 0, 0.2)
        if 12 <= b < 20: s.mus(wobble(root - 24, s.BAR, 2 / s.B), s.at(b), 0.25)
    # 0-3: the beat alone, then the title stutters in
    def stut(who, text, bar, beat, reps=3, step=0.25, rise=0, pan=0.0, g=1.0):
        a = speak(who, text, "Positive" if who == PINK else "ノーマル", 1.25, 1.0)
        for i in range(reps): s.vox(resample(chop(a), 2 ** (rise * i / 12)), s.at(bar, beat + i * step), g * 0.9, pan * (1 if i % 2 else -1))
        s.vox(a, s.at(bar, beat + reps * step), g, pan)
    stut(PINK, "そうたい", 3, 0, reps=6, step=0.25, pan=0.5)
    # 4-11: the deadpan verse, every syllable jumping left / right
    for i, (who, text, notes) in enumerate(DEADPAN):
        s.line(who, text, notes, 4 + 2 * i, pan=0.15 if who == PINK else -0.15, hop=0.6, stacc=0.85)
    # 12-15: the game's title chopped up
    stut(PINK, "そうたい", 12, 0, pan=0.3); stut(CAT, "きぼうの", 12, 2, pan=-0.3)
    s.say(PINK, "しょうじょ", 13, 0, beats=1.5); s.vox(resample(speak(CAT, "しょうじょ", "ノーマル", 1.25, 1.0), 2 ** (5 / 12)), s.at(13, 2), 0.9, -0.3)
    stut(PINK, "とりがー", 14, 0, reps=6, step=0.25, rise=1, pan=0.3)
    s.say(CAT, "ポエム!", 15, 0, beats=1.5)
    pm = speak(CAT, "ポエム", "ノーマル", 1.25, 1.0); s.vox(pm[::-1].copy(), s.at(15, 2), 0.9, -0.2)
    # 16-19: the two together, deadpan, glitching
    for w, pan in ((PINK, 0.3), (CAT, -0.3)):
        for k in (16, 18): s.line(w, "そうたい ぜったい かわいい ぜったい", [(67, 0.5)] * 14 + [(62, 1)], k, g=0.8, pan=pan, hop=0.4, stacc=0.85)
    s.glitches = [(17, 3, 0.25, 4), (19, 2, 0.125, 8)]
    # 20-22: her gun, the mantra, いあ; 23: the tape stops
    g = speak(PINK, "とぅっ!", "Positive", 1.4, 1.0)
    for i in range(16): s.vox(chop(g, 0.11), s.at(20, i * 0.25), 0.75, 0.6 * (1 if i % 2 else -1))
    om = speak(CAT, "おん", "ノーマル", 1.25, 0.0, tune=67)
    for i in range(4): s.vox(om, s.at(21, i * 0.5), 0.9, -0.3)
    s.say(CAT, "まにぱどめふむ", 21, 2, beats=2, into=0.0)
    for k in (0, 1, 2, 3): s.say(PINK if k % 2 == 0 else CAT, "いあ!", 22, k, beats=1)
    s.mus(riser(s.BAR), s.at(22), 0.25)
    s.stop = ((23, 0), 2 * s.B)
    return s


# sweets: lo-fi (E-flat major, 84)
MBOX = [(75, 1), (79, 0.5), (82, 0.5), (84, 1), (82, 1), (79, 1), (77, 0.5), (75, 0.5), (77, 2), (70, 1), (75, 1), (79, 1), (77, 1), (75, 4)]
def sweets():
    s = Sec("sweets", 84, 32, tail=4.0)
    cyc = ["Ebmaj7", "Cm7", "Fm7", "Bb7"]
    sw = 0.08   # the swing (of a beat)
    for b in range(32):
        c = chord(cyc[b % 4])
        s.mus(kick(0.8), s.at(b, 0), 0.55); s.mus(kick(0.6), s.at(b, 2.5 + sw), 0.45)
        for q in (1, 3): s.mus(low(snare(0.7, 0.3), 3500), s.at(b, q), 0.35, 0.1, 0.3)
        for i in range(8): s.mus(shaker(0.5 + 0.3 * (i % 2 == 0)), s.at(b, i * 0.5 + (sw if i % 2 else 0)), 0.2, -0.35)
        for j, m in enumerate(c): s.mus(epiano(m + 12, s.BAR * 0.98), s.at(b, j * 0.03), 0.12, 0.1 * (j - 1.5), 0.3)
        s.mus(subbass(c[0] - 12, s.B * 1.8), s.at(b), 0.5); s.mus(subbass(c[0] - 12, s.B * 1.3), s.at(b, 2.5 + sw), 0.4)
    for b0 in (8, 24):
        t = s.at(b0)
        for m, bt in MBOX * 2: s.mus(musicbox(m), t, 0.12, 0.3, 0.6); t += bt * s.B
    s.mus(vinyl(s.len + 3.5), 0, 0.5)
    lines = [(2, CAT, "はふぅ…"), (4, PINK, "あまーい…"), (6, CAT, "ゴロゴロ…"), (8, PINK, "とろけるー…"), (10, CAT, "もうひとくち だけ…"),
             (12, PINK, "ジェラート… たべたかったなー"), (14, CAT, "…また いこ"), (16, PINK, "うん… やくそく"), (20, CAT, "おいしい…"),
             (22, PINK, "しあわせー…"), (26, CAT, "もぐもぐ…"), (28, PINK, "…ねむくなってきた"), (30, CAT, "おやすみ… にゃ")]
    for b, who, text in lines:
        s.say(who, text, b, 0.5, 0.95, style=("ねむたい" if who == CAT else "ノーマル"), speed=0.95, into=1.2, wet=0.55)
    for w, pan in ((PINK, 0.3), (CAT, -0.3)): s.say(w, "いただきまーす", 24, 0.5, 0.85, pan=pan, style=("ねむたい" if w == CAT else "Positive"), speed=1.0)
    s.line(PINK, "ふんふーんふん ふーん", tpl([75, 79, 82, 79, 77, 75], [1, 1, 1, 1, 2, 2]), 18, style="ノーマル", g=0.7, pan=0.3)
    return s


LULL = [(79, 1), (78, 1), (79, 1), (74, 1), (75, 1), (74, 1), (72, 2)]   # a little lullaby of our own, played out of tune
def horror():
    s = Sec("horror", 140, 16)
    s.mus(drone(s.len + 2), 0, 0.5, 0, 0.3); s.mus(wind(s.len + 2), 0, 0.25, 0.2, 0.4)
    for b in range(16):
        k = 1 + (b >= 12)
        for i in range(k): s.mus(kick(0.9), s.at(b, i * 2), 0.6); s.mus(kick(0.6), s.at(b, i * 2 + 0.45), 0.45)
    t = s.at(2)
    for rep in range(2):
        for m, bt in LULL: s.mus(musicbox(m, detune=rng.uniform(-40, 40)), t, 0.16, -0.3, 0.7); t += bt * s.B
    for b in (5, 11): s.mus(bell(1180, 0.8, 3.0), s.at(b, 3), 0.15, 0.4, 0.8)
    s.say(CAT, "…だれ?", 2, 0, 0.8, into=0.5, speed=0.95, wet=0.6)
    for b in (4, 6): s.say(PINK, "いあ…", b, 0, 0.9, style="ノーマル", speed=0.8, into=0.0, deep=True, wet=0.7)
    for i, m in enumerate(["りん…", "ぴょう…", "とう…", "しゃ…"]): s.vox(speak(CAT, m, "ノーマル", 0.9, 0.0, tune=67), s.at(8, i), 0.8, -0.3, wet=0.6)
    a = speak(PINK, "ふたぐん", "ノーマル", 1.0, 0.0); s.vox(a[::-1].copy(), s.at(10), 0.8, 0.3, wet=0.7)
    s.say(PINK, "くとぅるふ…", 12, 0, 0.9, style="ノーマル", speed=0.85, into=0.0, deep=True, wet=0.7)
    s.say(CAT, "…きた", 13, 0, 0.9, wet=0.6)
    s.say(PINK, "いやーっ!", 14, 0, 1.0, style="Negative"); s.say(CAT, "シャーッ!", 14, 2, 1.0, beats=2)
    s.mus(riser(s.BAR * 2), s.at(14), 0.3)
    for i in range(16): s.mus(snare(0.3 + 0.04 * i), s.at(15, i * 0.25), 0.5, 0.1, 0.15)
    return s


def finale():
    s = Sec("finale", 140, 32)
    s.mus(gong(1.0), 0, 0.5, 0, 0.4)
    march(s, CHORUS_CH, 0, brass_hits=(0, 2, 4, 6)); chorus(s, 0, brass_melody=True)
    march(s, ["Gm", "Eb", "Cm", "D", "Gm", "Eb", "Cm", "D"], 8, brass_hits=(8, 12))
    # everything in a heap: the chant, her gun, いあ, the school, the sweets
    for i, m in enumerate(["おん", "ま", "に", "ぱ", "ど", "め", "ふむっ"]): s.vox(speak(CAT, m, "ノーマル", 1.25, 0.0, tune=67), s.at(8, i), 1.0, -0.25)
    for k in (7, 7.5): s.vox(speak(PINK, "とぅっ!", "Positive", 1.4, 0.0, tune=67), s.at(8, k), 0.9, 0.3)
    s.say(PINK, "それなー!", 10, 0, beats=2); s.say(CAT, "あまーい…", 10, 2, beats=2, style="ねむたい")
    s.say(PINK, "おはよー!", 11, 0, beats=2); s.say(CAT, "いあ!", 11, 2, beats=1); s.say(PINK, "いあ!", 11, 3, beats=1)
    a = speak(CAT, "ぎゃーてい ぎゃーてい", "ノーマル", 1.25, 0.0, tune=67); s.vox(atempo(a, len(a) / SR / (4 * s.B)), s.at(12), 1.0, -0.2, crowd=True)
    s.say(PINK, "りょーかいっ!", 13, 0, beats=2); s.say(CAT, "メロンパン!", 13, 2, beats=2)
    for i in range(8): s.vox(chop(speak(PINK, "とりがー", "Positive", 1.25, 1.0)), s.at(14, i * 0.25), 0.8, 0.3)
    for w, pan in ((PINK, 0.3), (CAT, -0.3)): s.say(w, "せーのっ!", 15, 2, 1.0, pan=pan, beats=2, crowd=True)
    # the last chorus a tone up
    up = ["Gm", "Eb", "Cm", "D", "Eb", "F", "D", "Gm"]
    march(s, up, 16, brass_hits=(16, 18, 20, 22), tr=2); chorus(s, 16, tr=2, brass_melody=True)
    march(s, ["Gm", "Eb", "D", "Gm"], 24, brass_hits=(24, 25, 26, 27), tr=2)
    for who, pan in ((PINK, 0.3), (CAT, -0.3)):
        s.line(who, "あ", [(76, 8)], 24, g=0.75, pan=pan, crowd=True, deep=(who == CAT), stacc=0.97)
        s.line(who, "あ", [(69, 8)], 26, g=0.75, pan=pan, crowd=True, stacc=0.97)
    s.mus(gong(1.0, 92), s.at(27, 2), 0.7, 0, 0.4)
    # back down to G minor, quietly, into the start again (the file loops)
    march(s, ["Gm", "Gm", "Eb", "D"], 28, taiko_only=True, g=0.8)
    s.say(CAT, "…きゅうきゅう にょりつりょう", 30, 0, 0.7, beats=4, into=0.0, wet=0.6)
    return s


SECTIONS = {"intro": intro, "anthem": anthem, "chant": chant, "jk": jk, "remix": remix, "sweets": sweets, "horror": horror, "finale": finale}
MIXES = {"sweets": dict(voice_gain=1.15, music_gain=0.7, duck=0.25, ir=1.8, ir_k=3.5, ir_lp=3500,
                        vfilter=lambda x: np.tanh(2.0 * low(high(x, 250), 4200)) / 2.0 * 1.4),
         "horror": dict(ir=3.5, ir_k=1.6, wet_gain=1.4), "jk": dict(ir=1.6, ir_k=3.5, wet_gain=0.7), "remix": dict(ir=1.4, ir_k=4, wet_gain=0.6)}


def render(name, only=None):
    order = [only] if only else list(SECTIONS)
    parts, t = [], 0.0
    for k in order:
        s = SECTIONS[k](); m = s.mix(**MIXES.get(k, {}), stop=getattr(s, "stop", None))
        parts.append((t, m)); print(f"{k:7} {s.len:6.1f}s  from {t:6.1f}s", flush=True); t += s.len
    total = t; N = int(total * SR); out = np.zeros((2, N + int(6 * SR)))
    for t0, m in parts: i = int(t0 * SR); out[:, i:i + m.shape[1]] += m
    if not only:   # the tail past the end rings on over the start: the file loops seamlessly
        tail = out[:, N:]; out = out[:, :N]; out[:, :tail.shape[1]] += tail
    out = np.tanh(out / np.abs(out).max() * 1.6) / np.tanh(1.6) * 10 ** (-1 / 20)
    pcm = (np.clip(out.T, -1, 1) * 32767).astype(np.int16)
    dst = ROOT / "art" / "raw" / "bgm"; dst.mkdir(parents=True, exist_ok=True)
    w = dst / f"{name}.wav"
    with wave.open(str(w), "wb") as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-i", str(w), "-c:a", "libopus", "-b:a", "128k", str(dst / f"{name}.ogg")], check=True)
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-i", str(w), "-c:a", "libmp3lame", "-b:a", "192k", str(dst / f"{name}.mp3")], check=True)
    print(dst / f"{name}.ogg", f"{out.shape[1] / SR:.1f}s ({out.shape[1] / SR / 60:.1f} min)")


if __name__ == "__main__":
    a = sys.argv[1:]; only = None
    if "--only" in a: i = a.index("--only"); only = a[i + 1]; del a[i:i + 2]
    render(a[0] if a else "theme", only)
