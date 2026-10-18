"""A demo of what the girls' synthesized voices can do in music (user 2026-10-18: title / select BGM in the spirit of Red Alert 3's Soviet
march or Metaphor's chanting battle theme; the TTS voices chanting, the two voices taking turns; Buddhist, Taoist and Cthulhu chants in a
medley). The voices come from AivisSpeech (tools/voice_aivis.py, the engine must be running: `python -I tools/voice_aivis.py start`), cut
tight, tuned onto the tonic (both voices speak around G4, so the piece is in G minor and the chant sits on G like a monk's monotone) and
stretched onto the beat; the backing (a heavy march: taiko, snare, bass, a low "oh" choir, brass stabs, strings, temple block, gong, bells)
is synthesized here. Nothing is copied from either reference: only the kind of thing (march weight, ritual chanting, a short motif hammered).
Who says what (docs/ART.md 声音: the gun girl's voice licence bans religious use, so the Buddhist / Taoist chants are the cat girl's; the
gun girl has the Cthulhu chant (fiction, no religion) and the shouts).
usage: python -I tools/bgm_chant.py <out-name>     -> art/raw/bgm/<out-name>.ogg (+ .wav, not in git)"""
import sys, pathlib, subprocess
import numpy as np
from scipy import signal

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import voice_aivis as VA

SR = 48000
BPM = 140
B = 60 / BPM            # one beat
BAR = 4 * B
TONIC = 392.0           # G4: where the chant sits
rng = np.random.default_rng(3)


def ffmpeg():
    return sorted((ROOT / "tools" / "ffmpeg").glob("*/bin/ffmpeg.exe"))[-1]


# ---------------------------------------------------------------- voice
def resample(a, k):   # play k times faster (pitch up by k, length / k)
    n = max(2, int(len(a) / k)); return np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a)


def atempo(a, t):   # length / t, pitch kept (ffmpeg WSOLA)
    fs = []
    while t > 2: fs.append("atempo=2"); t /= 2
    while t < 0.5: fs.append("atempo=0.5"); t /= 0.5
    fs.append(f"atempo={t:.5f}")
    r = subprocess.run([str(ffmpeg()), "-hide_banner", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        "-filter:a", ",".join(fs), "-f", "f32le", "-"], input=a.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).astype(np.float64)


def f0(a):
    n = int(0.04 * SR); out = []
    for s in range(0, len(a) - n, n // 2):
        x = a[s:s + n] * np.hanning(n)
        if np.sqrt((x ** 2).mean()) < 0.03: continue
        c = np.correlate(x, x, "full")[n - 1:]; lo, hi = int(SR / 600), int(SR / 120)
        k = lo + np.argmax(c[lo:hi])
        if c[k] > 0.4 * c[0]: out.append(SR / k)
    return float(np.median(out)) if out else TONIC


_V, _cache = VA.voices(), {}
def say(who, text, style="ノーマル", speed=1.2, into=0.0):
    """one clip of her voice, tight, at SR, tuned onto the tonic (or an octave above / below it when nearer)"""
    key = (who, text, style, speed, into)
    if key not in _cache:
        sid = VA.styles(_V[who]["model"])[style]
        x, sr = VA.synth(VA.query(text, sid, {"speed": speed, "intonation": into}), sid)
        a = resample(VA.tight(x, sr), SR / sr)
        f = f0(a); k = TONIC / f
        a = atempo(resample(a, k), 1 / k) if abs(np.log2(k)) > 0.01 else a   # (pitch to the tonic, length kept)
        _cache[key] = a
    return _cache[key]


def fit(a, beats):   # stretched / squeezed to last that many beats
    return atempo(a, len(a) / SR / (beats * B))


# ---------------------------------------------------------------- the mix
DUR = 18 * BAR + 4.0
N = int(DUR * SR)
music = np.zeros((2, N)); voice = np.zeros((2, N)); hall = np.zeros((2, N))   # hall: what goes to the reverb


def put(buf, a, t, g=1.0, pan=0.0, wet=0.0):
    i = int(t * SR)
    if i >= N: return
    a = a[:N - i] * g; L, R = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    buf[0, i:i + len(a)] += a * L; buf[1, i:i + len(a)] += a * R
    if wet: hall[0, i:i + len(a)] += a * L * wet; hall[1, i:i + len(a)] += a * R * wet


def at(bar, beat=0.0): return bar * BAR + beat * B


def chant(a, t, g=1.0, pan=0.0, crowd=False, deep=False, wet=0.35):
    """her voice; crowd = doubled into a little choir (copies a few ms apart, a hair sharp / flat, spread); deep = an octave-down copy
    under it (the formants drop too: something not human)"""
    put(voice, a, t, g, pan, wet)
    if crowd:
        for d, k, p in ((0.017, 1.006, -0.55), (0.029, 0.994, 0.55), (0.041, 1.003, 0.0)):
            put(voice, atempo(resample(a, k), 1 / k), t + d, g * 0.45, max(-1, min(1, pan + p)), wet * 1.3)
    if deep: put(voice, atempo(resample(a, 0.5), 2.0), t, g * 0.55, pan, wet * 1.5)


# ---------------------------------------------------------------- instruments
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=0.003, k=6.0): x = tt(d); return np.minimum(1, x / a) * np.exp(-k * x)
def band(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x)
def low(x, f, order=2): return signal.sosfilt(signal.butter(order, f, "lowpass", fs=SR, output="sos"), x)
def high(x, f, order=2): return signal.sosfilt(signal.butter(order, f, "highpass", fs=SR, output="sos"), x)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)


def taiko(v=1.0):
    x = tt(0.9); f = 48 + 50 * np.exp(-x * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 4.5)
    skin = low(rng.standard_normal(len(x)), 900) * np.exp(-x * 30) * 0.5
    return v * (body + skin)
def snare(v=1.0):
    x = tt(0.25); return v * (band(rng.standard_normal(len(x)), 1500, 7000) * np.exp(-x * 16) * 0.9 + np.sin(2 * np.pi * 190 * x) * np.exp(-x * 30) * 0.5)
def hat(v=1.0):
    x = tt(0.06); return v * high(rng.standard_normal(len(x)), 7000) * np.exp(-x * 60) * 0.5
def block(v=1.0):   # the temple's wooden fish (mokugyo)
    x = tt(0.18); return v * (np.sin(2 * np.pi * 540 * x) + 0.6 * np.sin(2 * np.pi * 1290 * x)) * np.exp(-x * 34) * np.minimum(1, x / 0.001)
def gong(v=1.0):
    x = tt(5.0); out = np.zeros_like(x)
    for r, a, k in ((1, 1, 0.6), (1.47, 0.6, 0.8), (2.09, 0.5, 1.0), (2.56, 0.35, 1.3), (3.21, 0.3, 1.6), (4.17, 0.2, 2.2)):
        for dt in (-0.4, 0.4): out += a * np.sin(2 * np.pi * (82 * r + dt) * x) * np.exp(-x * k)
    return v * out * np.minimum(1, x / 0.04) * 0.4
def bell(f=2400, v=1.0):
    x = tt(1.6); out = sum(a * np.sin(2 * np.pi * f * r * x) * np.exp(-x * k) for r, a, k in ((1, 1, 2.5), (2.76, 0.4, 5), (5.4, 0.2, 9)))
    return v * out * np.minimum(1, x / 0.002)
def saw(f, d, n=4, det=0.12):   # a few slightly detuned saws
    x = tt(d); return sum(signal.sawtooth(2 * np.pi * f * 2 ** (det * (i - (n - 1) / 2) / 12) * x + rng.uniform(0, 6)) for i in range(n)) / n
def brass(m, d=0.55, v=1.0):   # a stab: harmonics that die faster the higher they are (a closing filter)
    x = tt(d); f = mtof(m); out = np.zeros_like(x)
    for h in range(1, 24):
        if f * h > 9000: break
        out += np.sin(2 * np.pi * f * h * x * (1 + 0.0015 * np.sin(2 * np.pi * 5 * x))) / h * np.exp(-x * (2 + 1.6 * h))
    return v * out * np.minimum(1, x / 0.012)
def bass(m, d, v=1.0):
    return v * low(saw(mtof(m), d, 2, 0.05), 380) * env(d, 0.004, 5)
def string(m, d, v=1.0):
    return v * low(saw(mtof(m), d, 3, 0.08), 2400) * env(d, 0.01, 7)


CH = {"Gm": [55, 58, 62], "Eb": [51, 55, 58], "D": [50, 54, 57], "Cm": [48, 51, 55]}   # (low choir voicings, MIDI)
BARS = ["Gm", "Gm", "Gm", "Eb", "Gm", "D", "Cm", "D", "Eb", "D", "Gm", "Eb", "Cm", "D", "Gm", "Eb", "Cm", "D"]


def backing():
    for b, c in enumerate(BARS):
        root, full = CH[c][0], b >= 2
        # drums: the intro is a slow procession (taiko on 1 and 3), then the march
        for k in range(4):
            if k in (0, 2) or (full and k == 3 and b % 2): put(music, taiko(1.0 if k == 0 else 0.75), at(b, k), 0.9, 0, 0.15)
            if full and k in (1, 3): put(music, snare(0.8), at(b, k), 0.5, 0.1, 0.2)
            if full: put(music, hat(0.6), at(b, k + 0.5), 0.35, 0.3)
            put(music, block(1.0 if k == 0 else 0.7), at(b, k), 0.28, -0.25, 0.25)
        if full and b % 4 == 3:   # a march roll into the next phrase
            for i in range(8): put(music, snare(0.35 + 0.08 * i), at(b, 2 + i * 0.25), 0.45, 0.1, 0.15)
        # the low "oh" choir: the chord held for the bar
        if b >= 0:
            pad = sum(saw(mtof(m - 12 + 12 * (j == 2)), BAR + 0.15, 4, 0.18) for j, m in enumerate(CH[c]))
            pad *= np.minimum(1, tt(BAR + 0.15) / 0.25) * np.minimum(1, (BAR + 0.15 - tt(BAR + 0.15)) / 0.15)
            put(music, pad, at(b), 0.16, 0, 0.5)
        if full:
            for k in range(8): put(music, bass(root - 12 if k % 2 == 0 else root, B * 0.45), at(b, k * 0.5), 0.55)
        if b >= 6 and b < 14:   # strings: an urgent 16th ostinato through the Taoist and Cthulhu parts
            arp = [CH[c][0] + 12, CH[c][1] + 12, CH[c][2] + 12, CH[c][1] + 12]
            for i in range(16): put(music, string(arp[i % 4], B * 0.22), at(b, i * 0.25), 0.11, 0.35 * (1 if i % 2 else -1), 0.2)
        if b in (2, 6, 9, 14, 17) or b >= 14:   # brass hits on the big downbeats, a fanfare rhythm in the climax
            hits = [0] if b < 14 else [0, 1.5, 2.5, 3]
            for k in hits:
                for m in (root + 12, root + 19, root + 24): put(music, brass(m, 0.5, 1 if k == 0 else 0.7), at(b, k), 0.14, 0, 0.3)
    put(music, gong(1.0), at(0), 0.7, 0, 0.4); put(music, gong(0.8), at(17, 2), 0.7, 0, 0.4)
    for b in (1, 5, 9, 13, 16): put(music, bell(2350, 0.8), at(b, 3.5), 0.2, 0.4, 0.5)


# ---------------------------------------------------------------- the chant medley (bar, beat)
CAT, PINK = "cat", "pink"
def voices():
    c = lambda text, style="ノーマル", speed=1.25: say(CAT, text, style, speed)
    p = lambda text, style="Positive", speed=1.25: say(PINK, text, style, speed)
    # 0-1  intro: the nine seals (臨兵闘者皆陣列在前, Taoist / onmyodo), one syllable an 8th, then the gun girl counts them in
    for i, s in enumerate(["りん", "ぴょう", "とう", "しゃ", "かい", "じん", "れつ", "ざい", "ぜんっ"]):
        chant(c(s), at(0, i * 0.5), 1.0, -0.15, crowd=(i == 8))
    chant(p("せーのっ!"), at(1, 2.5), 1.0, 0.2)
    # 2-5  Buddhist: 唵 嘛 呢 叭 咪 吽 on the beats, the gun girl answering on the offbeats ("突" from her gun, はっ)
    om = ["おん", "ま", "に", "ぱ", "ど", "め", "ふむっ"]
    for rep in (0, 2):
        for i, s in enumerate(om): chant(c(s), at(2 + rep, i), 1.0, -0.2, crowd=(rep == 2))
        for k, s in ((7, "とぅっ!"), (7.5, "とぅっ!")): chant(p(s, speed=1.4), at(2 + rep, k), 0.9, 0.3)
        for k in (0.5, 2.5, 4.5): chant(p("はっ!", speed=1.4), at(2 + rep, k), 0.55, 0.35)
    # 6-9  the fire mantra (のうまく さんまんだ…, esoteric Buddhist) racing over the strings, doubled and with something deep under it;
    #      then 急急如律令 (Taoist) one syllable a beat, and the gun girl's pun: 了解! (りょーかい, "roger")
    chant(fit(c("のうまく さんまんだ ばざらだん かん"), 7), at(6), 1.0, -0.15, crowd=True, deep=True)
    for i, s in enumerate(["きゅう", "きゅう", "にょ", "りつ", "りょうっ!"]): chant(c(s), at(8, i * (1 if i < 4 else 1)), 1.0, -0.2, crowd=(i == 4))
    chant(p("りょーかいっ!"), at(9, 2), 1.0, 0.25)
    # 10-13 Cthulhu: the gun girl's long call with a deep thing under it, then the two of them trading いあ!, together on the last line
    chant(fit(p("ふんぐるい むぐるうなふ くとぅるふ るるいえ うがふなぐる ふたぐん", "ノーマル", 1.2), 7.5), at(10), 1.0, 0.2, deep=True)
    for k in range(4): chant((p if k % 2 == 0 else c)("いあ!"), at(12, k), 1.0, 0.3 if k % 2 == 0 else -0.3)
    for f, pan in ((p, 0.25), (c, -0.25)): chant(fit(f("くとぅるふ ふたぐん!"), 3), at(13), 0.85, pan, crowd=True)
    # 14-17 the climax: the heart sutra's last line (Buddhist) by the cat girl as a crowd, the gun girl cheering on the offbeats; then
    #       the two of them trading shouts and one more 急急如律令 into the gong (and round again)
    chant(fit(c("ぎゃーてい ぎゃーてい ハーラーぎゃーてい ハラソーぎゃーてい"), 7), at(14), 1.0, -0.15, crowd=True)
    for k in (0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5): chant(p("とぅっ!", speed=1.4), at(14, k), 0.6, 0.35)
    chant(fit(c("ぼーじー そわかっ!"), 2), at(16), 1.0, -0.15, crowd=True)
    chant(p("せーのっ!"), at(16, 2.5), 1.0, 0.25)
    chant(fit(c("きゅうきゅう にょりつりょうっ!"), 2), at(17), 1.0, -0.15, crowd=True, deep=True)
    chant(p("とぅっ!", speed=1.4), at(17, 2.5), 0.9, 0.3); chant(p("とぅっ!", speed=1.4), at(17, 3), 0.9, 0.3)


def main(name):
    backing(); voices()
    # the temple hall: a long dark reverb fed by what asked for it
    n = int(2.6 * SR); x = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-x * 2.4); ir = np.stack([low(ir[0], 5000), low(ir[1], 5000)])
    wet = np.stack([signal.fftconvolve(hall[i], ir[i])[:N] for i in range(2)]) * 0.012
    # the music steps back under the voices (a soft side-chain)
    e = np.abs(voice).max(0); e = signal.sosfilt(signal.butter(1, 6, "lowpass", fs=SR, output="sos"), e); e = e / max(1e-6, e.max())
    # and leaves the voices their band (1 - 3.5 kHz, about -5 dB there)
    m = music - 0.45 * np.stack([band(music[0], 1000, 3500), band(music[1], 1000, 3500)])
    mix = m * 0.62 * (1 - 0.4 * e) + voice * 1.25 + wet * 0.8
    mix = np.tanh(mix / np.abs(mix).max() * 1.6) / np.tanh(1.6) * 10 ** (-1 / 20)   # (a little glue, peak -1 dB)
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype(np.int16)
    out = ROOT / "art" / "raw" / "bgm"; out.mkdir(parents=True, exist_ok=True)
    import wave
    with wave.open(str(out / f"{name}.wav"), "wb") as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    subprocess.run([str(ffmpeg()), "-hide_banner", "-loglevel", "error", "-y", "-i", str(out / f"{name}.wav"), "-c:a", "libopus", "-b:a", "128k",
                    str(out / f"{name}.ogg")], check=True)
    print(out / f"{name}.ogg", f"{DUR:.1f}s")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "chant_demo")
