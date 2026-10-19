"""Monster cries from a speech voice, mangled (user 2026-10-19: the howls, screams and curses should be a TTS voice made electric / warped
- better than cheap screams, and any number of them). A line is spoken by the local AivisSpeech engine (tools/voice_aivis.py), then each
family of monsters has its own chain (numpy / scipy only):
  girl  (dolls, shadows, the futon girl, the blackboard woman): a little higher, glitch stutter on the first syllable, a reversed-echo
        swell before it, a faint ring modulation, a ghost an octave down under it
  paper (paper dolls, exam sheets, wafers, doilies): whispered - a noise-carrier vocoder - over a thin high-passed voice, fluttering
  wood  (desks, frames, chandeliers, kokeshi): a little lower, ring modulation, a wooden comb resonance, driven
  beast (zombies, crawlers, the slippers, the silkworm): far lower, driven, a growl tremolo, a sub layer, a saw-carrier vocoder layer
Every variant draws its own settings (seeded), the act decides the words (windup: a gathering laugh / taunt, attack: a shriek, hurt: a
yelp, die: a long wail fading out). Output: art/raw/monster_vo/<family>_<act>/<n>.wav (not in git) + _look sheets; picked into the game
with tools/sfx_pick.py-style keys later (sounds.json sfx cry_<family>_<act>, which src/core/audio.js cry() already falls back to).
usage: python -I tools/monster_voice.py [--model <aivm uuid>] [--style <name>] [--n 6] [family ...]
  The voice: --model (an installed AivisHub model). The heroines' own models are only for trying the chains out (never for the game)."""
import argparse, importlib.util, json, pathlib, sys, zlib
import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "art" / "raw" / "monster_vo"
sp = importlib.util.spec_from_file_location("va", ROOT / "tools" / "voice_aivis.py"); VA = importlib.util.module_from_spec(sp); sp.loader.exec_module(VA)

WORDS = {
    "girl":  {"windup": ["みーつけた", "あそぼ", "うふふふふ", "こっちおいで"], "attack": ["キャアアッ", "いっしょに!", "ちょうだい!", "シャアッ"],
              "hurt": ["いたい", "ぎゃっ", "いやっ"], "die": ["かえりたい", "あああぁぁぁ", "どうして"]},
    "paper": {"windup": ["さらさらさら", "くすくすくす", "ひらひら"], "attack": ["シャッ", "キリッ", "サッ"], "hurt": ["くしゃっ", "ぴっ"],
              "die": ["ひらひらひら", "さよなら"]},
    "wood":  {"windup": ["ギギギギ", "カタカタカタ", "コトコト"], "attack": ["ガッ!", "バキッ", "ドンッ"], "hurt": ["ゴッ", "ギッ"],
              "die": ["ギイィィィ", "おわり"]},
    "beast": {"windup": ["グルルルル", "おなかすいた", "ハァ ハァ"], "attack": ["ガアアッ!", "たべる!", "グアッ"], "hurt": ["グッ", "ギャッ"],
              "die": ["グオオオオ", "アアアア"]},
}


# ---------------------------------------------------------------- the effects
def tape(x, semis):   # pitch and speed together (a deeper voice is slower: scarier), like a tape running slow / fast
    r = 2 ** (semis / 12); n = int(len(x) / r)
    return signal.resample(x, n) if n > 8 else x


def ring(x, sr, f, mix=1.0):
    t = np.arange(len(x)) / sr; return x * (1 - mix) + x * np.sin(2 * np.pi * f * t) * mix


def drive(x, k):
    return np.tanh(k * x) / np.tanh(k)


def comb(x, sr, ms, fb):
    d = max(1, int(sr * ms / 1000)); y = x.copy()
    for i in range(d, len(y)): y[i] += fb * y[i - d]
    return y


def env_follow(x, sr, hz=60):
    b, a = signal.butter(2, hz / (sr / 2)); return np.maximum(0, signal.filtfilt(b, a, np.abs(x)))


def vocoder(x, sr, carrier, bands=22, lo=90, hi=7000):
    edges = np.geomspace(lo, min(hi, sr / 2 * 0.95), bands + 1); y = np.zeros_like(x)
    for f0, f1 in zip(edges[:-1], edges[1:]):
        sos = signal.butter(2, [f0 / (sr / 2), f1 / (sr / 2)], btype="band", output="sos")
        e = env_follow(signal.sosfilt(sos, x), sr); y += signal.sosfilt(sos, carrier[:len(x)]) * e
    return y


def saw_chord(n, sr, f0, rng):
    t = np.arange(n) / sr; y = np.zeros(n)
    for r in (1, 1.5, 2.01, 2.99):
        f = f0 * r * (1 + rng.uniform(-0.004, 0.004)); y += signal.sawtooth(2 * np.pi * f * t) / r
    return y


def stutter(x, sr, rng):   # the first syllable caught and repeated: a glitch "ki-ki-ki"
    g = int(sr * rng.uniform(0.045, 0.085)); k = int(rng.integers(2, 5))
    if len(x) < 2 * g: return x
    grain = x[:g] * np.hanning(g)
    return np.concatenate([np.concatenate([grain] * k), x])


def rev_swell(x, sr, rng, secs=1.0):   # a reversed echo rising into the line (the curse whispered before it is said)
    n = int(sr * secs); ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 6, n))
    wet = signal.fftconvolve(x[::-1], ir)[::-1]; wet = wet / (np.abs(wet).max() + 1e-9) * 0.5
    return np.concatenate([wet[:len(wet) - len(x)], wet[len(wet) - len(x):] * 0.3 + x])


def tremolo(x, sr, f, depth):
    t = np.arange(len(x)) / sr; return x * (1 - depth + depth * (0.5 + 0.5 * np.sin(2 * np.pi * f * t)))


def hp(x, sr, f):
    return signal.sosfilt(signal.butter(2, f / (sr / 2), btype="high", output="sos"), x)


def pad_mix(*layers):
    n = max(len(l) for l in layers); return sum(np.pad(l, (0, n - len(l))) for l in layers)


# ---------------------------------------------------------------- the families
def mangle(fam, act, x, sr, rng):
    if fam == "girl":
        y = tape(x, rng.uniform(2, 5) if act != "die" else rng.uniform(-1, 2))
        if act in ("windup", "attack") and rng.random() < 0.7: y = stutter(y, sr, rng)
        ghost = tape(y, -12) * 0.35
        y = pad_mix(y, ghost)
        y = ring(y, sr, rng.uniform(25, 60), 0.25)
        if act in ("windup", "die"): y = rev_swell(y, sr, rng, 0.8 if act == "windup" else 1.4)
        if act == "attack": y = drive(y * 1.5, 2.2)
    elif fam == "paper":
        y0 = tape(x, rng.uniform(1, 4)); noise = rng.standard_normal(len(y0))
        whisper = vocoder(y0, sr, noise, bands=26, lo=400, hi=9000)
        y = pad_mix(whisper / (np.abs(whisper).max() + 1e-9), hp(y0, sr, 1800) * 0.35)
        y = tremolo(y, sr, rng.uniform(12, 22), 0.5)
        if act == "die": y = rev_swell(y, sr, rng, 1.2)
    elif fam == "wood":
        y = tape(x, rng.uniform(-5, -2))
        y = ring(y, sr, rng.uniform(70, 120), 0.6)
        y = comb(y / (np.abs(y).max() + 1e-9), sr, rng.uniform(6, 12), 0.65)
        y = drive(y / (np.abs(y).max() + 1e-9), 2.5)
        if act == "windup": y = tremolo(y, sr, rng.uniform(8, 14), 0.6)
    else:   # beast
        y0 = tape(x, rng.uniform(-12, -8))
        y0 = drive(y0 / (np.abs(y0).max() + 1e-9) * 1.4, 3.0)
        y0 = tremolo(y0, sr, rng.uniform(24, 36), 0.45)
        sub = tape(y0, -7) * 0.5
        voc = vocoder(y0, sr, saw_chord(len(y0), sr, rng.uniform(40, 60), rng), bands=18, lo=60, hi=5000)
        y = pad_mix(y0, sub, voc / (np.abs(voc).max() + 1e-9) * 0.4)
        if act == "die": y = rev_swell(y, sr, rng, 1.6)
    # a soft start, a long natural tail (the reverb tails are part of it: nothing cut short), -1 dBFS
    y = y.astype(np.float64); fi = int(0.004 * sr); y[:fi] *= np.linspace(0, 1, fi)
    fo = int(min(len(y) * 0.2, 0.15 * sr)); y[-fo:] *= np.linspace(1, 0, fo) ** 2
    return y * (10 ** (-1 / 20) / (np.abs(y).max() + 1e-9))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("fams", nargs="*"); ap.add_argument("--model"); ap.add_argument("--style", default="ノーマル")
    ap.add_argument("--n", type=int, default=6); ap.add_argument("--test", action="store_true")
    a = ap.parse_args()
    model = a.model or VA.voices()["cat"]["model"]   # (the heroine's model only to try the chains out: --test)
    if not a.model and not a.test: sys.exit("give --model <the monsters' voice> (the heroines' voices are not for monsters; --test to try the chains with one)")
    sid = VA.styles(model).get(a.style) or list(VA.styles(model).values())[0]
    out = OUT / ("_test" if a.test else "")
    for fam in a.fams or list(WORDS):
        for act, words in WORDS[fam].items():
            d = out / f"{fam}_{act}"; d.mkdir(parents=True, exist_ok=True)
            for i in range(a.n):
                rng = np.random.default_rng(zlib.crc32(f"{fam}{act}{i}".encode()))
                w = words[i % len(words)]
                q = VA.query(w, sid, {"speed": float(rng.uniform(0.85, 1.15)), "intonation": float(rng.uniform(1.0, 1.8))})
                x, sr = VA.synth(q, sid)
                y = mangle(fam, act, x.astype(np.float64), sr, rng)
                wavfile.write(str(d / f"{i + 1}.wav"), sr, (np.clip(y, -1, 1) * 32767).astype(np.int16))
            print(fam, act, a.n, flush=True)
    (out / "_made.json").write_text(json.dumps({"model": model, "style": a.style, "test": a.test}, ensure_ascii=False), encoding="utf-8")
    # the listening page (sound.html) reads what there is from here
    idx = {d.name: sorted(f.name for f in d.glob("*.wav")) for d in sorted(out.iterdir()) if d.is_dir()}
    (out / "_index.json").write_text(json.dumps(idx, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
