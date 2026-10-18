"""The out-of-stage sounds (docs/DESIGN.md「声音」, user round 13: the free library ones are not good enough): one family of sounds made
here from scratch, matching the red-black-white paper-collage UI and the cute side of the game: paper (snaps, slides, page flips, rubber
stamps) and glassy little bells. Each sound is a function below; rendered at 48 kHz, a touch of room, peak -1 dBFS, written as Ogg Opus
with ffmpeg (tools/ffmpeg) to public/content/base/sfx/ui/<name>.ogg and registered in audio/sounds.json sfx.<key>.files.
usage: python -I tools/ui_sfx.py [name ...]      (no names = all)
       python -I tools/ui_sfx.py --wav <dir>      also keep .wav copies there (to listen to)"""
import sys, json, pathlib, subprocess
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
PACK = ROOT / "public" / "content" / "base"
SR = 48000
rng = np.random.default_rng(7)


def t_(d): return np.arange(int(d * SR)) / SR


def tail(x, k=0.2):   # every piece ends in a smooth fade (an abrupt end clicks)
    n = max(8, int(len(x) * k)); x = x.copy(); x[-n:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, n)); return x


def env(n, a, d, curve=5.0):   # attack a s, then exponential decay over the rest (curve: how fast)
    x = np.arange(n) / SR; e = np.minimum(1, x / max(a, 1e-4))
    return e * np.exp(-curve * np.maximum(0, x - a) / max(d, 1e-3))


def bell(f, d=0.6, v=1.0, bright=1.0):   # a small glass bell: inharmonic partials, each dying faster than the last
    x = t_(d); out = np.zeros_like(x)
    for r, a, k in ((1, 1, 1), (2.76, 0.45 * bright, 1.8), (5.40, 0.22 * bright, 3.0), (8.93, 0.10 * bright, 4.5)):
        out += a * np.sin(2 * np.pi * f * r * x + rng.uniform(0, 6)) * np.exp(-k * 4.5 * x / d)
    return tail(v * out * np.minimum(1, x / 0.002), 0.3)


def noise(d, lo, hi, a=0.002, decay=0.1, curve=5.0, sweep=None):   # band-limited noise (FFT mask), optional band sweep start->end
    n = int(d * SR); w = rng.standard_normal(n)
    if sweep:   # in short overlapping chunks, the band moving
        out = np.zeros(n); hop = 512; win = np.hanning(1024)
        for s0 in range(0, n, hop):
            seg = np.zeros(1024); m = min(1024, n - s0); seg[:m] = w[s0:s0 + m]
            k = s0 / n; l = lo + (sweep[0] - lo) * k; h = hi + (sweep[1] - hi) * k
            F = np.fft.rfft(seg * win); fr = np.fft.rfftfreq(1024, 1 / SR); F[(fr < l) | (fr > h)] = 0
            y = np.fft.irfft(F); out[s0:s0 + m] += y[:m]
        w = out
    else:
        F = np.fft.rfft(w); fr = np.fft.rfftfreq(n, 1 / SR); F[(fr < lo) | (fr > hi)] = 0; w = np.fft.irfft(F, n)
    w /= max(1e-6, np.abs(w).max())
    return tail(w * env(n, a, decay, curve))


def tone(f0, d, f1=None, shape="sine", a=0.003, decay=None, curve=5.0):
    x = t_(d); f = f0 if f1 is None else f0 * (f1 / f0) ** (x / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    w = np.sin(ph) if shape == "sine" else np.sign(np.sin(ph)) * 0.6 if shape == "square" else 2 * (ph / (2 * np.pi) % 1) - 1
    return tail(w * env(len(x), a, decay or d, curve))


def lowpass(x, fc):
    F = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / SR); F *= 1 / np.sqrt(1 + (fr / fc) ** 4); return np.fft.irfft(F, len(x))


def mix(*parts):   # (offset s, signal, gain)
    n = max(int(o * SR) + len(s) for o, s, g in parts); out = np.zeros(n)
    for o, s, g in parts: i = int(o * SR); out[i:i + len(s)] += g * s
    return out


def room(x, amt=0.12, size=0.35):   # a small bright room: decaying noise impulse response
    n = int(size * SR); ir = rng.standard_normal(n) * np.exp(-6 * np.arange(n) / n); ir[0] = 0
    wet = np.convolve(x, ir) * amt / np.sqrt(n) * 6
    out = np.zeros(len(x) + n); out[:len(x)] += x; out[:len(wet)] += wet
    return out


def snap(d=0.03, hi=9000):   # a paper snap: very short bright noise burst with a little body
    return mix((0, noise(d, 1800, hi, a=0.0005, decay=d * 0.4), 1.0), (0, tone(420, d, 180, decay=d * 0.5), 0.35))


# ---------------------------------------------------------------- the sounds
def move():      # the cursor moves onto something: a tiny tick and a far little glint
    return mix((0, snap(0.018, 12000), 0.5), (0.004, bell(3136, 0.12, 0.25, 0.4), 1))
def ok():        # yes: a paper snap and two quick bright bells going up
    return room(mix((0, snap(0.03), 0.8), (0.0, bell(1568, 0.45, 0.6), 1), (0.06, bell(2349, 0.55, 0.55), 1)))
def back():      # back: a paper slide away and two soft bells going down
    return room(mix((0, noise(0.12, 900, 5000, a=0.01, decay=0.07, sweep=(400, 2500)), 0.35), (0.0, bell(1760, 0.3, 0.4, 0.6), 1), (0.07, bell(1175, 0.4, 0.4, 0.6), 1)))
def deny():      # locked / can't: two muffled low bumps
    b = lowpass(tone(220, 0.09, 180, "square", decay=0.06), 900)
    return mix((0, b, 0.7), (0.11, b, 0.6), (0, snap(0.015, 3000), 0.3))
def page():      # a page turns: a flutter of paper, then it lands
    fl = noise(0.22, 1500, 9000, a=0.04, decay=0.12, sweep=(600, 5000))
    crk = mix(*[(o, noise(0.012, 3000, 11000, a=0.0003, decay=0.004), 1) for o in (0.05, 0.09, 0.15, 0.18)])
    return room(mix((0, fl, 0.6), (0, crk, 0.25), (0.2, snap(0.04, 6000), 0.5)), 0.08)
def tab():       # a card slides across and clicks into place
    return mix((0, noise(0.1, 1200, 7000, a=0.02, decay=0.06, sweep=(2500, 9000)), 0.45), (0.085, snap(0.022), 0.7), (0.09, bell(2637, 0.18, 0.25, 0.5), 1))
def toggle():    # a switch / a slider step
    return mix((0, snap(0.015, 10000), 0.4), (0, bell(2093, 0.12, 0.35, 0.3), 1), (0.035, bell(2637, 0.12, 0.3, 0.3), 1))
def swap():      # the two trade places: two swishes crossing and a little chime
    a = noise(0.26, 700, 6000, a=0.08, decay=0.12, sweep=(1500, 9000)); b = noise(0.26, 700, 6000, a=0.08, decay=0.12, sweep=(300, 2500))
    return room(mix((0, a, 0.5), (0.07, b, 0.5), (0.22, bell(1976, 0.4, 0.4), 1), (0.26, bell(2637, 0.45, 0.35), 1)))
def start():     # let's go: a rubber stamp, a run of bells up, a sparkle that hangs in the air
    st = mix((0, tone(110, 0.25, 55, decay=0.12, curve=4), 0.9), (0, noise(0.12, 200, 2500, a=0.001, decay=0.05), 0.5), (0, snap(0.04), 0.6))
    run = mix(*[(0.08 + i * 0.055, bell(f, 0.9, 0.5), 1) for i, f in enumerate((1047, 1319, 1568, 2093, 2637))])
    sp = mix(*[(0.35 + rng.uniform(0, 0.6), bell(rng.uniform(3500, 6000), 0.3, 0.12, 0.2), 1) for _ in range(14)])
    return room(mix((0, st, 1), (0, run, 0.9), (0, sp, 1)), 0.18, 0.6)
def stamp():     # a heavy rubber stamp on paper (results, buying)
    return room(mix((0, tone(90, 0.3, 45, decay=0.14, curve=4), 1.0), (0, noise(0.16, 150, 3000, a=0.001, decay=0.06), 0.6),
                    (0.005, noise(0.08, 2500, 9000, a=0.001, decay=0.03), 0.3)), 0.1)
def count():     # a number ticking up
    return mix((0, snap(0.012, 8000), 0.35), (0, bell(2794, 0.08, 0.2, 0.2), 1))
def item():      # something got: a quick sparkle up
    return room(mix(*[(i * 0.045, bell(f, 0.6, 0.45), 1) for i, f in enumerate((1568, 1976, 2349, 3136))],
                    *[(0.15 + rng.uniform(0, 0.35), bell(rng.uniform(4000, 6500), 0.25, 0.1, 0.2), 1) for _ in range(8)]), 0.15, 0.5)
def levelup():   # stronger: a little fanfare of bells over a soft swell
    sw = noise(0.6, 300, 4000, a=0.35, decay=0.15, curve=3) * 0.25
    notes = [(0, 1047), (0.1, 1319), (0.2, 1568), (0.32, 2093), (0.32, 2637)]
    return room(mix((0, sw, 1), *[(o, bell(f, 1.0, 0.5), 1) for o, f in notes]), 0.2, 0.7)
def comicpage():   # a comic page lands on the table
    return room(mix((0, noise(0.18, 400, 6000, a=0.03, decay=0.06, sweep=(1500, 8000)), 0.5), (0.15, tone(140, 0.12, 70, decay=0.05), 0.5),
                    (0.15, noise(0.06, 800, 5000, a=0.001, decay=0.02), 0.5)), 0.08)
def comicpanel():  # a panel slides in
    return mix((0, noise(0.16, 1200, 8000, a=0.06, decay=0.06, sweep=(3000, 10000)), 0.35), (0.12, snap(0.015, 7000), 0.3))
def victory():   # the stage is cleared: a bright little jingle
    mel = [(0, 1047), (0.12, 1319), (0.24, 1568), (0.36, 2093), (0.6, 1976), (0.72, 2093), (0.9, 2637)]
    pad = sum(tone(f, 1.6, decay=1.2, curve=3, a=0.05) for f in (523, 659, 784)) * 0.12
    return room(mix((0.9, pad, 1), *[(o, bell(f, 0.9, 0.55), 1) for o, f in mel],
                    *[(1.0 + rng.uniform(0, 0.8), bell(rng.uniform(4000, 6500), 0.3, 0.1, 0.2), 1) for _ in range(12)]), 0.2, 0.8)
def defeat():    # down: a slow sad fall of soft bells
    mel = [(0, 1568), (0.3, 1397), (0.6, 1245), (0.95, 1047)]
    pad = sum(tone(f, 1.8, decay=1.4, curve=3, a=0.1) for f in (262, 311, 392)) * 0.1
    return room(mix((0.9, pad, 1), *[(o, bell(f, 1.2, 0.45, 0.5), 1) for o, f in mel]), 0.25, 0.9)

SOUNDS = {   # sounds.json sfx key -> (function, volume)
    "uiMove": (move, 0.5), "ui": (ok, 0.7), "uiBack": (back, 0.65), "uiDeny": (deny, 0.7), "uiPage": (page, 0.7), "uiTab": (tab, 0.6),
    "uiToggle": (toggle, 0.55), "uiSwap": (swap, 0.7), "uiStart": (start, 0.85), "stamp": (stamp, 0.85), "count": (count, 0.4),
    "item": (item, 0.75), "levelUp": (levelup, 0.8), "comicPage": (comicpage, 0.7), "panel": (comicpanel, 0.5),
    "victory": (victory, 0.8), "defeat": (defeat, 0.75),
}
WANT = {"uiMove": "光标移到按钮 / 选项上", "ui": "确定", "uiBack": "返回", "uiDeny": "锁着 / 不行", "uiPage": "翻页（选关的行、背包）", "uiTab": "切换标签",
        "uiToggle": "开关 / 滑条一格", "uiSwap": "两人换位", "uiStart": "开始游戏 / 出发", "stamp": "盖章（结算、买东西）", "count": "数字往上跳",
        "item": "拿到道具", "levelUp": "升级", "comicPage": "漫画翻到新的一页", "panel": "漫画一格滑进来", "victory": "小关通过", "defeat": "失败"}


def ffmpeg():
    f = sorted((ROOT / "tools" / "ffmpeg").glob("*/bin/ffmpeg.exe"))
    if not f: raise SystemExit("no ffmpeg: unzip an ffmpeg build into tools/ffmpeg")
    return str(f[-1])


if __name__ == "__main__":
    a = sys.argv[1:]; wav = None
    if "--wav" in a: i = a.index("--wav"); wav = pathlib.Path(a[i + 1]); del a[i:i + 2]; wav.mkdir(parents=True, exist_ok=True)
    sp = PACK / "audio" / "sounds.json"; raw = sp.read_bytes(); crlf = b"\r\n" in raw; S = json.loads(raw.decode("utf-8"))
    for key, (fn, vol) in SOUNDS.items():
        if a and key not in a: continue
        x = fn(); x = x * (10 ** (-1 / 20) / max(1e-6, np.abs(x).max()))
        fo = int(0.01 * SR); x[-fo:] *= np.linspace(1, 0, fo)
        pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
        rel = f"sfx/ui/{fn.__name__}.ogg"; out = PACK / rel; out.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([ffmpeg(), "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        "-c:a", "libopus", "-b:a", "64k", str(out)], input=pcm.tobytes(), check=True)
        if wav:
            import wave
            with wave.open(str(wav / f"{fn.__name__}.wav"), "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
        e = S["sfx"].setdefault(key, {})
        e.update({"when": WANT[key], "want": "统一的一套：纸（拍、滑、翻页、盖章）+ 玻璃小铃，配剪报风界面和卖萌", "src": "tools/ui_sfx.py", "files": [rel], "vol": vol})
        e.pop("rate", None); e.pop("len", None)
        print(f"{key:<10} {rel:<26} {len(x) / SR:.2f}s")
    t = json.dumps(S, ensure_ascii=False, indent=2) + "\n"
    sp.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(sp)], check=True, stdin=subprocess.DEVNULL)
