"""BGM, step 1 of 2 (docs/DESIGN.md「BGM」: written after the references' style, not drawn by an AI from nothing; docs/TECH.md 声音): the
music Claude wrote (tools/rounds/bgm_specs.py: per section the chords bar by bar, the melody note by note, the groove, the instruments)
rendered as a plain guide track with the synth instruments of tools/bgm_theme.py and a few of its own (plucked strings like a shamisen /
koto, a breathy flute, a temple bell, a ticking clock). Step 2 (tools/bgm_ace.py) has ACE-Step 1.5 play it again with real instruments
(its "cover": the guide's melody, harmony and form, the caption's sound).
After the last section the guide goes on into a tail: the first bars of the section the loop goes back to (spec loopFrom, default the
second; `tail` bars, default 8). ACE-Step rounds a piece off a few bars before the end of what it is given: the ending falls in the tail,
the written sections stay whole, and the tail is the music as it goes on after the loop's jump (tools/bgm_pick.py).
usage: python -I tools/bgm_guide.py [track ...]   -> art/raw/bgm_ai/<track>_guide.wav (48 kHz stereo, not in git)"""
import sys, wave, pathlib, importlib.util, re
import numpy as np
from scipy import signal

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "art" / "raw" / "bgm_ai"
spec = importlib.util.spec_from_file_location("bt", ROOT / "tools" / "bgm_theme.py"); BT = importlib.util.module_from_spec(spec)
sys.path.insert(0, str(ROOT / "tools")); spec.loader.exec_module(BT)
SR = BT.SR; tt = BT.tt; mtof = BT.mtof; low = BT.low; high = BT.high; band = BT.band
rng = np.random.default_rng(11)

NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
QUAL = {"": [0, 4, 7], "m": [0, 3, 7], "7": [0, 4, 7, 10], "m7": [0, 3, 7, 10], "maj7": [0, 4, 7, 11], "sus4": [0, 5, 7], "sus2": [0, 2, 7],
        "dim": [0, 3, 6], "aug": [0, 4, 8], "5": [0, 7], "m6": [0, 3, 7, 9], "add9": [0, 4, 7, 14]}
def chord(sym, octave=3):
    m = re.match(r"([A-G])([#b]?)(.*)$", sym); r = NOTE[m.group(1)] + {"#": 1, "b": -1, "": 0}[m.group(2)]
    root = 12 * (octave + 1) + r
    return [root + i for i in QUAL[m.group(3)]]
def note(s):   # "D5", "Eb4", "F#3" -> MIDI
    m = re.match(r"([A-G])([#b]?)(-?\d)$", s); return 12 * (int(m.group(3)) + 1) + NOTE[m.group(1)] + {"#": 1, "b": -1, "": 0}[m.group(2)]


# ---------------------------------------------------------------- instruments of its own
def pluck(m, d, v=1.0, bright=0.6):   # Karplus-Strong (as one recursive filter): a shamisen / koto string
    f = mtof(m); N = max(2, int(round(SR / f))); n = int(d * SR)
    x = np.zeros(n); x[:N] = rng.uniform(-1, 1, min(N, n))
    g = 0.5 * (0.982 + 0.016 * bright)
    a = np.zeros(N + 2); a[0] = 1; a[N] = -g; a[N + 1] = -g
    y = signal.lfilter([1.0], a, x)
    tx = tt(d)
    return v * (y + 0.3 * high(y, 2500)) * np.minimum(1, (d - tx) / 0.03).clip(0) * 0.7
def flute(m, d, v=1.0):   # a breathy flute / shakuhachi
    x = tt(d); f = mtof(m) * (1 + 0.004 * np.sin(2 * np.pi * 5.2 * x) * np.minimum(1, x / 0.4))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.25 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    breath = band(rng.standard_normal(len(x)), mtof(m) * 0.8, mtof(m) * 3) * 0.35
    return v * (tone + breath) * np.minimum(1, x / 0.06) * np.minimum(1, (d - x) / 0.08).clip(0)
def tbell(v=1.0, f=110):   # a temple bell (bonsho): long, beating partials
    x = tt(7.0); out = np.zeros_like(x)
    for r, a, k in ((1, 1, 0.35), (2.0, 0.5, 0.5), (2.76, 0.6, 0.6), (3.9, 0.3, 0.9), (5.4, 0.2, 1.3)):
        for dt in (-0.6, 0.6): out += a * np.sin(2 * np.pi * (f * r + dt) * x) * np.exp(-x * k)
    return v * out * np.minimum(1, x / 0.01) * 0.35
def tick(v=1.0, hi=True):   # a clock tick
    x = tt(0.05); return v * band(rng.standard_normal(len(x)), 2500 if hi else 1500, 7000) * np.exp(-x * 160)
def lead(inst, m, d, v):
    return {"flute": lambda: flute(m, d, v), "brass": lambda: BT.brass_hold(m, d, v * 0.7), "musicbox": lambda: BT.musicbox(m, v)[:int(d * SR) + int(0.8 * SR)],
            "koto": lambda: pluck(m, max(d, 1.2), v, 0.75), "shamisen": lambda: pluck(m, max(d, 0.6), v, 0.45), "strings": lambda: BT.string(m, d, v),
            "epiano": lambda: BT.epiano(m, d, v), "chip": lambda: BT.chip(m, d, v), "choir": lambda: BT.choir([m], d, v)}[inst]()


# ---------------------------------------------------------------- the arranger
class Track:
    def __init__(self, T):
        self.T = T; self.B = 60 / T["bpm"]; self.bar = T.get("meter", 4) * self.B
        i0 = T.get("loopFrom", 1 if len(T["sections"]) > 1 else 0); L0 = T["sections"][i0]
        self.secs = T["sections"] + [dict(L0, bars=min(T.get("tail", 8), L0["bars"]))]
        self.bars = sum(s["bars"] for s in self.secs); self.N = int((self.bars * self.bar + 6) * SR)
        self.L = np.zeros(self.N); self.R = np.zeros(self.N)
    def put(self, x, t, v=1.0, pan=0.0):
        i = int(t * SR); x = x[:max(0, self.N - i)]
        self.L[i:i + len(x)] += x * v * (1 - max(0, pan)); self.R[i:i + len(x)] += x * v * (1 + min(0, pan))
    def render(self):
        t0 = 0.0; mb = self.T.get("meter", 4)
        for S in self.secs:
            ch = S.get("chords", ["Dm"]); n = S["bars"]
            chords = [ch[i % len(ch)] for i in range(n)]
            for b in range(n):
                tb = t0 + b * self.bar; c = chord(chords[b], 3)
                self.groove(S.get("drums"), tb, b, n, S)
                if S.get("bass"):
                    for k in range(mb * 2 if S["bass"] == "eighth" else mb if S["bass"] == "quarter" else 1):
                        step = self.bar / (mb * 2) if S["bass"] == "eighth" else self.B if S["bass"] == "quarter" else self.bar
                        m = c[0] - 12 + (12 if S["bass"] == "eighth" and k % 4 == 2 else 0)
                        self.put(BT.bass(m, step * 0.95, 0.55), tb + k * step)
                if S.get("pad"):
                    pad = BT.choir(c, self.bar, 0.22) if S["pad"] == "choir" else sum(BT.string(m + 12, self.bar, 0.12) for m in c)
                    self.put(pad, tb, 1.0, 0.0)
                if S.get("arp"):
                    inst, step = S["arp"], self.B / 2
                    seq = [c[0] + 12, c[1] + 12, c[2] + 12, c[1] + 24 if len(c) > 2 else c[0] + 24]
                    for k in range(mb * 2):
                        m = seq[k % len(seq)]
                        x = pluck(m, 0.5, 0.35, 0.5) if inst in ("koto", "shamisen") else BT.string(m, step * 0.9, 0.18) if inst == "strings" else BT.chip(m, step * 0.8, 0.2)
                        self.put(x, tb + k * step, 1.0, -0.3 if k % 2 else 0.3)
                if S.get("ostinato"):
                    for k, m in enumerate(S["ostinato"]):
                        if m: self.put(pluck(note(m), 0.45, 0.55, 0.45), tb + k * self.B / 2, 1.0, -0.2)
                if S.get("ticks"):
                    for k in range(mb * 2): self.put(tick(0.5 if k % 2 else 0.8, k % 2 == 0), tb + k * self.B / 2, 1.0, 0.4 if k % 2 else -0.4)
                if S.get("bell") and b % S["bell"] == 0: self.put(tbell(0.9), tb)
            # the melody: notes in beats from the section's start
            if S.get("melody"):
                tm = t0
                for nt, beats in S["melody"]:
                    d = beats * self.B
                    if nt: self.put(lead(S.get("lead", "flute"), note(nt), d * 0.98, 0.55), tm, 1.0, 0.05)
                    tm += d
            t0 += n * self.bar
        y = np.stack([self.L, self.R])
        y = y / (np.abs(y).max() + 1e-9) * 0.85
        return y[:, :int((self.bars * self.bar + 0.05) * SR)]
    def groove(self, kind, tb, b, n, S):
        B = self.B
        if not kind: return
        fill = b == n - 1
        if kind == "taiko":
            for k, v in ((0, 1.0), (1.5, 0.6), (2, 0.9), (3, 0.5), (3.5, 0.7)): self.put(BT.taiko(v * 0.9), tb + k * B)
            if fill: [self.put(BT.taiko(0.6 + 0.1 * i), tb + (2 + i * 0.5) * B) for i in range(4)]
            for k in range(8): self.put(BT.block(0.18), tb + k * B / 2, 1.0, 0.5)
        elif kind == "rock":
            for k in (0, 2.5): self.put(BT.kick(0.9), tb + k * B)
            for k in (1, 3): self.put(BT.snare(0.7), tb + k * B)
            for k in range(8): self.put(BT.hat(0.35 if k % 2 else 0.5), tb + k * B / 2, 1.0, 0.3)
            if fill: [self.put(BT.snare(0.4 + 0.1 * i), tb + (3 + i * 0.25) * B) for i in range(4)]
        elif kind == "march":
            for k in (0, 2): self.put(BT.kick(0.8), tb + k * B)
            for k in range(16): self.put(BT.snare(0.25 if k % 4 else 0.55, 0.12), tb + k * B / 4, 1.0, -0.2)
        elif kind == "soft":
            self.put(BT.kick(0.5), tb); self.put(BT.shaker(0.4), tb + 1 * B); self.put(BT.shaker(0.4), tb + 3 * B); self.put(BT.block(0.3), tb + 2.5 * B)
        elif kind == "waltz":
            self.put(BT.kick(0.6), tb); self.put(BT.hat(0.4), tb + B); self.put(BT.hat(0.4), tb + 2 * B)
        elif kind == "heart":
            for k in (0, 0.35, 2, 2.35): self.put(BT.kick(0.55 if k in (0, 2) else 0.35), tb + k * B)


def write(path, y):
    pcm = (np.clip(y.T, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    spec = importlib.util.spec_from_file_location("bs", ROOT / "tools" / "rounds" / "bgm_specs.py"); S = importlib.util.module_from_spec(spec); spec.loader.exec_module(S)
    OUT.mkdir(parents=True, exist_ok=True)
    for name, T in S.TRACKS.items():
        if len(sys.argv) > 1 and name not in sys.argv[1:]: continue
        y = Track(T).render(); write(OUT / f"{name}_guide.wav", y)
        print(name, f"{y.shape[1] / SR:.1f}s", T["bpm"], "bpm")
