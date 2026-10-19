"""The fight's sound effects, cartoon / arcade style (user 2026-10-19: the realistic hits all failed - nothing realistic, everything that can
be heard in a fight cartoon, think slot machines and claw machines; a rapid fire is a toy gun's short sound played again and again like an
old game, not a phrase going up and down; these plain effects only need to be clear, short and plainly apart from the music and the
voices). Every sound is made here from oscillators and noise (bright squares and sines with quick pitch sweeps, springs, cork pops, coins,
buzzers, ratchets, slide whistles, wood blocks), a few takes of each (TAKES, each a little different), rendered at 48 kHz, peak -1 dBFS,
written as Ogg Opus to public/content/base/sfx/toy/<key>_<n>.ogg and registered in audio/sounds.json sfx.<key> (src "toy"; the beds loop
seamlessly). The menus' sounds (tools/ui_sfx.py), the girls' voices and the monsters' cries (tools/monster_voice.py) are not made here.
usage: python -I tools/toy_sfx.py [key ...]  [--wav <dir>]"""
import sys, json, pathlib, subprocess, importlib.util
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
PACK = ROOT / "public" / "content" / "base"
OUT = PACK / "sfx" / "toy"
sp = importlib.util.spec_from_file_location("ui", ROOT / "tools" / "ui_sfx.py"); U = importlib.util.module_from_spec(sp); sp.loader.exec_module(U)
SR = U.SR
rng = np.random.default_rng(11)
t_, tail, env, noise, mix, lowpass = U.t_, U.tail, U.env, U.noise, U.mix, U.lowpass


# ---------------------------------------------------------------- the toy box
def osc(f0, d, f1=None, shape="sine", duty=0.5, a=0.002, decay=None, curve=5.0, vib=0.0, vibf=0.0, glide="exp"):
    """one voice: frequency from f0 to f1 (exponential or linear glide), optional vibrato; sine / square (duty) / tri / saw"""
    x = t_(d)
    if f1 is None: f = np.full_like(x, f0)
    elif glide == "exp": f = f0 * (f1 / f0) ** (x / d)
    else: f = f0 + (f1 - f0) * x / d
    if vib: f = f * (1 + vib * np.sin(2 * np.pi * vibf * x))
    ph = np.cumsum(f) / SR % 1.0
    if shape == "sine": w = np.sin(2 * np.pi * ph)
    elif shape == "square": w = np.where(ph < duty, 0.6, -0.6)
    elif shape == "tri": w = 2 * np.abs(2 * ph - 1) - 1
    else: w = 2 * ph - 1
    return tail(w * env(len(x), a, decay or d, curve), 0.15)


def click(hi=8000, d=0.006, v=1.0):      # a plastic tick
    return v * noise(d, 2500, hi, a=0.0003, decay=d * 0.4)


def bonk(f=760, d=0.07, v=1.0):          # a wood block "pok"
    return v * mix((0, osc(f, d, f * 0.82, "sine", decay=d * 0.6), 1.0), (0, osc(f * 2.7, d * 0.5, None, "sine", decay=d * 0.2), 0.35),
                   (0, click(6000, 0.004), 0.5))


def boing(f=300, d=0.35, depth=0.35, rate=16, v=1.0):   # a spring: the pitch wobbling and dying away
    x = t_(d); wob = 1 + depth * np.exp(-6 * x / d) * np.sin(2 * np.pi * rate * x)
    ff = f * wob * (1 + 0.6 * np.exp(-25 * x))
    ph = np.cumsum(ff) / SR; w = np.sin(2 * np.pi * ph) + 0.25 * np.sin(4 * np.pi * ph)
    return v * tail(w * env(len(x), 0.002, d, 4.0), 0.2)


def coin(lo=988, hi=1319, v=1.0):        # the coin: two square notes, the second ringing
    return v * mix((0, osc(lo, 0.06, None, "square", 0.5, decay=0.06, curve=1.0), 0.7), (0.06, osc(hi, 0.32, None, "square", 0.5, decay=0.32, curve=4.0), 0.7))


def zipper(f0, f1, d, rate=55, v=1.0):   # a zip / a ratchet sweep: a saw gated fast
    x = t_(d); g = (np.sin(2 * np.pi * rate * x) > 0).astype(float) * 0.85 + 0.15
    return v * tail(osc(f0, d, f1, "saw", decay=d, curve=2.0) * g, 0.2)


def whistle(f0, f1, d, vib=0.03, v=1.0):  # a slide whistle
    return v * mix((0, osc(f0, d, f1, "sine", a=0.01, decay=d, curve=1.5, vib=vib, vibf=7, glide="lin"), 1.0),
                   (0, noise(d, 1500, 6000, a=0.01, decay=d, curve=2.0), 0.06))


def squeak(f=1300, d=0.12, v=1.0):       # a rubber toy: up and back down
    x = t_(d); ff = f * (1 + 0.55 * np.sin(np.pi * x / d))
    ph = np.cumsum(ff) / SR; return v * tail(np.sin(2 * np.pi * ph) * env(len(x), 0.003, d, 3.0), 0.25)


def buzz(f=196, d=0.14, v=1.0):          # a claw machine's buzzer
    x = t_(d); w = osc(f, d, None, "square", 0.5, a=0.002, decay=d, curve=0.7) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 30 * x)))
    return v * tail(lowpass(w, 3500), 0.15)


def blip(f, d=0.035, shape="square", v=1.0):
    return v * osc(f, d, None, shape, 0.5, decay=d, curve=3.0)


def jingle(notes, step=0.06, d=0.14, shape="square", v=1.0):   # a little run of notes (a win)
    return v * mix(*[(i * step, osc(f, d, None, shape, 0.5, decay=d, curve=3.0), 0.6) for i, f in enumerate(notes)])


def m2f(m): return 440 * 2 ** ((m - 69) / 12)


def loop_of(make, secs):   # a seamless bed: what spills past the end comes back in at the start
    n = int(secs * SR); out = np.zeros(n)
    for o, s, g in make(secs):
        i = int(o * SR) % n; seg = g * s
        for k in range(0, len(seg), n):
            part = seg[k:k + n]; j = (i + k) % n; m = min(len(part), n - j); out[j:j + m] += part[:m]; out[:len(part) - m] += part[m:]
    return out


# ---------------------------------------------------------------- the sounds: key -> fn(v) (v: 0..1, which take), and its group / gap / vol
R = lambda v, a, b: a + (b - a) * v   # (the take's own value between a and b)
S = {}
def snd(key, takes=4, vol=0.8, gap=None, loop=None, when=""):
    def deco(fn): S[key] = dict(fn=fn, takes=takes, vol=vol, gap=gap, loop=loop, when=when); return fn
    return deco

# her gun and his - the shots
@snd("gun", 5, 0.5, 0.04, when="地雷妹的枪每一发（玩具光线枪「啾」）")
def _(v): f = R(v, 1700, 2300); return mix((0, osc(f, 0.05, f * 0.45, "square", 0.25, decay=0.05, curve=2.5), 1.0), (0, click(9000, 0.004), 0.4))
@snd("cannon", 5, 0.7, 0.05, when="猫娘每一发（软木塞枪「嘭」）")
def _(v): f = R(v, 280, 360); return mix((0, osc(f, 0.07, f * 2.2, "sine", decay=0.07, curve=2.0), 1.0), (0, noise(0.03, 1200, 5000, decay=0.015), 0.5), (0.01, blip(f * 3, 0.03, "tri"), 0.25))
@snd("shell", 4, 0.45, 0.06, when="弹壳落地（小玩具硬币「叮」）")
def _(v): f = R(v, 3800, 4800); return mix((0, osc(f, 0.07, None, "sine", decay=0.07, curve=4), 0.8), (0.035, osc(f * 1.33, 0.05, None, "sine", decay=0.05, curve=4), 0.4))
@snd("empty", 3, 0.6, when="没子弹了（干扳机「咔哒」）")
def _(v): return mix((0, click(7000, 0.008), 1.0), (0.05, click(5000, 0.008), 0.8), (0.05, blip(R(v, 300, 380), 0.03, "square"), 0.35))
@snd("reload", 3, 0.6, when="装填（上发条「咔咔咔」+「嘭」）")
def _(v):
    parts = [(i * 0.045, mix((0, click(8000, 0.005), 1.0), (0, blip(R(v, 900, 1100) * (1 + i * 0.08), 0.02, "square"), 0.3)), 0.8) for i in range(6)]
    return mix(*parts, (0.3, bonk(R(v, 700, 820), 0.08), 0.9))
# hits on the monsters (Game.onHit: src/core/audio.js hitNote)
@snd("hitPink", 5, 0.55, 0.045, when="地雷妹打中（泡泡「啵」）")
def _(v): f = R(v, 1100, 1500); return mix((0, osc(f * 0.6, 0.045, f * 1.4, "sine", decay=0.045, curve=3), 1.0), (0, click(9000, 0.004), 0.5))
@snd("hitCat", 5, 0.65, 0.05, when="猫娘打中（木鱼「咚」）")
def _(v): return mix((0, bonk(R(v, 620, 780), 0.08), 1.0), (0, osc(R(v, 1600, 1900), 0.04, None, "square", 0.3, decay=0.04), 0.15))
@snd("crit", 4, 0.6, 0.06, when="暴击（老虎机「叮叮」）")
def _(v): f = R(v, 1760, 2093); return mix((0, blip(f, 0.04, "square"), 0.7), (0.045, osc(f * 1.5, 0.16, None, "square", 0.5, decay=0.16, curve=4), 0.6), (0, click(9000, 0.004), 0.4))
@snd("kill", 4, 0.7, when="打倒一只（金币「叮——」）")
def _(v): k = R(v, 0.95, 1.06); return mix((0, coin(988 * k, 1319 * k), 1.0), (0, osc(500 * k, 0.05, 1100 * k, "sine", decay=0.05), 0.7))
@snd("hit", 4, 0.55, 0.05, when="别的打中（软软「噗」）")
def _(v): f = R(v, 700, 950); return mix((0, osc(f, 0.06, f * 1.6, "tri", decay=0.06, curve=3), 1.0), (0, click(8000, 0.004), 0.4))
@snd("coverHit", 4, 0.6, when="掩体挨打（木块「啵咚」）")
def _(v): return mix((0, bonk(R(v, 420, 520), 0.09), 1.0), (0, osc(160, 0.08, 90, "sine", decay=0.08), 0.6))
@snd("clang", 4, 0.55, when="打到硬的（玩具铃「当」）")
def _(v): f = R(v, 1900, 2400); return mix((0, U.bell(f, 0.25, 1.0, 1.4), 1.0), (0, click(9000, 0.004), 0.5))
@snd("miss", 4, 0.45, when="打空（「咻」）")
def _(v): return whistle(R(v, 1600, 1900), R(v, 700, 900), 0.08)
# the girls (no voice: the toy side of it)
@snd("hurt", 4, 0.7, when="她挨打（玩具锤「哔扣」）")
def _(v): return mix((0, squeak(R(v, 1200, 1500), 0.1), 1.0), (0, noise(0.04, 600, 4000, decay=0.02), 0.5), (0.0, osc(220, 0.08, 120, "sine", decay=0.08), 0.6))
@snd("run", 6, 0.35, when="跑动的脚步（玩具「嗒」）")
def _(v): return bonk(R(v, 900, 1250), 0.035, 1.0)
@snd("popup", 4, 0.45, when="探身 / 怪冒出来（弹簧「啵嘤」）")
def _(v): return mix((0, osc(R(v, 380, 460), 0.1, R(v, 900, 1100), "sine", decay=0.1, curve=2), 1.0), (0, click(7000, 0.004), 0.4))
@snd("clear", 3, 0.75, when="清场 / 复活（老虎机中奖）")
def _(v): r = [72, 76, 79, 84] if v < 0.5 else [74, 77, 81, 86]; return mix((0, jingle([m2f(m) for m in r], 0.07, 0.16), 1.0), (0.3, coin(1319, 1760), 0.6))
@snd("viewer", 3, 0.5, when="翻看照片 / 图鉴（「啪啦」）")
def _(v): return zipper(R(v, 900, 1100), R(v, 1800, 2200), 0.07, 90)
# the monsters' doings (their voices are the cries; these are the cartoon noises around them)
@snd("warn", 3, 0.55, when="要来了（抓娃娃机「哔哔」）")
def _(v): f = R(v, 185, 220); return mix((0, buzz(f, 0.11), 1.0), (0.15, buzz(f, 0.11), 1.0))
@snd("roar", 3, 0.6, when="大招 / 冲过来（玩具喇叭「叭——」）")
def _(v): f = R(v, 150, 180); return lowpass(osc(f, 0.35, f * 0.8, "saw", a=0.02, decay=0.35, curve=1.5, vib=0.05, vibf=9), 2400)
@snd("madness", 3, 0.6, when="异变 / 发狂（老虎机滚轮「咕噜噜」）")
def _(v): return mix(*[(i * 0.03, blip(m2f(R(v, 96, 100) - i * 1.5), 0.025, "square"), 0.5) for i in range(14)])
@snd("dollScreech", 3, 0.5, when="人偶尖叫（橡皮玩具「叽」）")
def _(v): return squeak(R(v, 1600, 2000), 0.18)
@snd("mothFlap", 3, 0.4, when="翅膀扑腾（「啪嗒啪嗒」）")
def _(v): return mix(*[(i * 0.05, noise(0.025, 800, 3500, decay=0.012), 0.8) for i in range(4)])
@snd("throwIt", 4, 0.5, when="扔东西（「咻嗯」）")
def _(v): return whistle(R(v, 900, 1100), R(v, 1500, 1800), 0.12)
@snd("whoosh", 4, 0.45, when="闪开 / 冲刺（滑笛往上）")
def _(v): return whistle(R(v, 500, 650), R(v, 1400, 1700), 0.15)
@snd("thud", 4, 0.65, when="落地 / 摔倒（「咚」+ 弹簧）")
def _(v): return mix((0, osc(R(v, 200, 240), 0.12, 85, "sine", decay=0.12), 1.0), (0.03, boing(R(v, 260, 320), 0.22, 0.3), 0.5))
@snd("slam", 3, 0.7, when="撞 / 砸（「嘭!」+ 弹簧）")
def _(v): return mix((0, noise(0.06, 200, 3000, decay=0.03), 0.8), (0, osc(140, 0.12, 60, "sine", decay=0.12), 1.0), (0.04, boing(R(v, 180, 230), 0.3, 0.4), 0.6))
@snd("shatter", 3, 0.55, when="碎掉（玩具玻璃「叮铃铃」）")
def _(v): return mix(*[(i * 0.022, U.bell(R(v, 2500, 2800) * (1.12 ** (i % 5)) * (1 + 0.04 * rng.standard_normal()), 0.18, 1.0, 1.2), 0.45) for i in range(7)])
@snd("paperRip", 3, 0.5, when="纸撕开（拉链「哔——」往上）")
def _(v): return zipper(R(v, 500, 650), R(v, 1400, 1800), 0.1, 70)
@snd("tear", 3, 0.5, when="布撕开（拉链往下）")
def _(v): return zipper(R(v, 1500, 1800), R(v, 500, 650), 0.13, 60)
@snd("slash", 4, 0.5, when="刀光（「唰」+「叮」）")
def _(v): return mix((0, noise(0.06, 3000, 11000, decay=0.04, sweep=(6000, 12000)), 0.6), (0.02, U.bell(R(v, 3000, 3600), 0.12, 0.8), 0.6))
@snd("burnOut", 3, 0.55, when="烧掉（「噗咻」）")
def _(v): return mix((0, noise(0.3, 400, 6000, decay=0.25, curve=3, sweep=(200, 2000)), 0.6), (0, osc(R(v, 600, 700), 0.08, 1200, "sine", decay=0.08), 0.5))
@snd("crackle", 3, 0.4, when="噼啪（小爆裂）")
def _(v): return mix(*[(R(v, 0, 0.02) + i * 0.05, mix((0, click(9000, 0.004), 1.0), (0, osc(R(v, 1500, 2500), 0.02, None, "sine", decay=0.02), 0.5)), 0.7) for i in range(3)])
@snd("creak", 3, 0.45, when="吱呀（门、地板）")
def _(v): return osc(R(v, 700, 900), 0.25, R(v, 1000, 1200), "tri", a=0.02, decay=0.25, curve=1.5, vib=0.06, vibf=23)
@snd("doorSlam", 3, 0.7, when="门砸上（木头「哐当」）")
def _(v): return mix((0, bonk(R(v, 300, 380), 0.1), 1.0), (0.07, bonk(R(v, 260, 320), 0.1), 0.8), (0, osc(120, 0.15, 60, "sine", decay=0.15), 0.6))
@snd("shutter", 3, 0.55, when="快门（玩具相机「咔嚓」）")
def _(v): return mix((0, click(9000, 0.006), 1.0), (0.02, zipper(R(v, 1800, 2200), 2600, 0.05, 120), 0.7), (0.09, click(7000, 0.006), 0.8))
@snd("grab", 3, 0.6, when="被抓住（「咕叽」）")
def _(v): return mix((0, squeak(R(v, 700, 850), 0.15), 1.0), (0, noise(0.08, 300, 2500, decay=0.05), 0.4))
# episode 2: her scissors, the inn, the clocks, the bell
@snd("snip", 5, 0.55, 0.08, when="她的剪刀（「咔嚓」两下）")
def _(v): f = R(v, 2600, 3200); return mix((0, click(10000, 0.005), 1.0), (0, blip(f, 0.02, "square"), 0.3), (0.06, click(10000, 0.005), 0.9), (0.06, blip(f * 1.2, 0.025, "square"), 0.3))
@snd("snipFar", 4, 0.35, 0.1, when="远处的剪刀")
def _(v): return lowpass(S["snip"]["fn"](v), 2500)
@snd("bladeOpen", 3, 0.6, when="张开剪刀蓄力（「锵——」）")
def _(v): return mix((0, noise(0.15, 3000, 12000, decay=0.12, sweep=(5000, 12000)), 0.4), (0.03, osc(R(v, 1800, 2100), 0.3, R(v, 2800, 3200), "square", 0.3, decay=0.3, curve=3), 0.5))
@snd("bladeDrag", 3, 0.45, when="剪刀拖地（棘轮「咕噜噜」）")
def _(v): return zipper(R(v, 400, 480), R(v, 300, 360), 0.3, 40)
@snd("stab", 3, 0.6, when="刺（「噗」+「叮」）")
def _(v): return mix((0, osc(R(v, 500, 600), 0.06, 1000, "sine", decay=0.06), 1.0), (0.02, U.bell(R(v, 2600, 3000), 0.1, 0.7), 0.5))
@snd("sheKnock", 3, 0.75, when="她被打倒（「哔扣——」金星）")
def _(v): return mix((0, osc(180, 0.1, 80, "sine", decay=0.1), 1.0), (0.02, boing(R(v, 330, 400), 0.4, 0.4, 18), 0.7), (0.1, jingle([m2f(m) for m in (91, 88, 95)], 0.06, 0.1, "sine"), 0.4))
@snd("sheRise", 3, 0.55, when="她爬起来（「嗖嗯嗯」往上）")
def _(v): return osc(R(v, 200, 240), 0.3, R(v, 600, 700), "tri", a=0.03, decay=0.3, curve=1.5, vib=0.08, vibf=11)
@snd("shoji", 3, 0.45, when="拉门（「唰啦」）")
def _(v): return mix((0, noise(0.16, 1500, 7000, a=0.02, decay=0.14, curve=2.5), 0.6), (0.15, bonk(R(v, 900, 1050), 0.04), 0.6))
@snd("fusumaOpen", 3, 0.45, when="隔扇拉开")
def _(v): return noise(0.18, 900, 5000, a=0.03, decay=0.16, curve=2, sweep=(1500, 7000))
@snd("fusumaSlam", 3, 0.6, when="隔扇甩上（「啪!」）")
def _(v): return mix((0, bonk(R(v, 500, 600), 0.07), 1.0), (0, noise(0.04, 1000, 6000, decay=0.02), 0.6))
@snd("amado", 3, 0.6, when="雨户（「咔啦啦——哐」）")
def _(v): return mix((0, zipper(R(v, 300, 360), R(v, 380, 440), 0.3, 30), 0.8), (0.3, bonk(R(v, 280, 330), 0.1), 1.0))
@snd("woodBreak", 3, 0.7, when="木头碎了（「啪咔咔」+ 弹簧）")
def _(v): return mix((0, bonk(R(v, 500, 600), 0.06), 1.0), (0.05, bonk(R(v, 420, 500), 0.06), 0.9), (0.1, bonk(R(v, 350, 420), 0.06), 0.8), (0.12, boing(260, 0.25, 0.3), 0.4))
@snd("beamFall", 3, 0.7, when="东西掉下来（下落哨 +「咚」）")
def _(v): return mix((0, whistle(R(v, 1600, 1800), R(v, 400, 500), 0.4), 0.7), (0.4, osc(160, 0.15, 60, "sine", decay=0.15), 1.0), (0.42, boing(220, 0.2, 0.3), 0.5))
@snd("weightDrop", 3, 0.7, when="秤砣落下")
def _(v): return mix((0, whistle(R(v, 1400, 1600), R(v, 350, 420), 0.35), 0.7), (0.35, bonk(R(v, 200, 240), 0.12), 1.0))
@snd("stoneLantern", 3, 0.7, when="石灯笼倒了（「咚——」）")
def _(v): return mix((0, osc(R(v, 110, 130), 0.3, 55, "sine", decay=0.3), 1.0), (0, noise(0.08, 200, 2000, decay=0.04), 0.6), (0.05, boing(170, 0.3, 0.25), 0.5))
@snd("tiles", 3, 0.5, when="瓦片哗啦（「咔啦咔啦」）")
def _(v): return mix(*[(i * R(v, 0.035, 0.045), bonk(R(v, 1100, 1300) * (0.93 ** i), 0.03), 0.7) for i in range(7)])
@snd("clockChime", 3, 0.6, when="挂钟报时（布谷「咕咕」）")
def _(v): k = R(v, 0.97, 1.04); return mix((0, osc(880 * k, 0.16, 860 * k, "tri", a=0.01, decay=0.16, curve=2.5), 0.8), (0.2, osc(698 * k, 0.22, 680 * k, "tri", a=0.01, decay=0.22, curve=2.5), 0.8))
@snd("clocksAll", 2, 0.6, when="所有钟一起响")
def _(v): return mix(*[(i * 0.13 + R(v, 0, 0.03), S["clockChime"]["fn"]((i * 0.37) % 1), 0.45) for i in range(6)], *[(0.05 + i * 0.21, U.bell(R(v, 1800, 2200) * (1.06 ** i), 0.4, 0.8), 0.25) for i in range(5)])
@snd("bellSmall", 3, 0.55, when="前台的小铃（「叮」）")
def _(v): return U.bell(R(v, 2400, 2700), 0.45, 1.0, 1.3)
@snd("bellToll", 2, 0.8, when="大钟（卡通的「咚——」）")
def _(v): return mix((0, U.bell(R(v, 196, 220), 2.2, 1.0, 1.3), 1.0), (0, osc(R(v, 98, 110), 1.6, None, "sine", decay=1.6, curve=2.5), 0.6))
@snd("shishiOdoshi", 3, 0.6, when="添水（竹子「空」）")
def _(v): return mix((0, bonk(R(v, 520, 600), 0.12), 1.0), (0.12, bonk(R(v, 520, 600), 0.1), 0.25))
@snd("splash", 3, 0.55, when="水（「扑通」）")
def _(v): return mix((0, osc(R(v, 900, 1100), 0.12, 300, "sine", decay=0.12), 1.0), (0.02, noise(0.1, 800, 5000, decay=0.06), 0.4))
@snd("bathLid", 3, 0.6, when="浴桶盖子（「啪空」）")
def _(v): return mix((0, bonk(R(v, 600, 700), 0.06), 1.0), (0.04, osc(R(v, 400, 460), 0.08, 800, "sine", decay=0.08), 0.6))
@snd("crow", 3, 0.6, when="乌鸦（玩具喇叭「嘎」）")
def _(v): return lowpass(mix((0, osc(R(v, 420, 480), 0.18, 380, "saw", a=0.01, decay=0.18, curve=1.5, vib=0.04, vibf=30), 1.0), (0.22, osc(R(v, 420, 480), 0.14, 360, "saw", a=0.01, decay=0.14, curve=1.5, vib=0.04, vibf=30), 0.8)), 3200)
@snd("cage", 3, 0.55, when="笼子（「咔当」）")
def _(v): return mix((0, click(8000, 0.006), 1.0), (0.01, U.bell(R(v, 1300, 1500), 0.15, 0.8), 0.6), (0.08, bonk(600, 0.05), 0.6))
@snd("kerosene", 3, 0.7, when="灯油烧起来（「轰呼」）")
def _(v): return mix((0, noise(0.4, 150, 3000, a=0.05, decay=0.35, curve=2, sweep=(300, 6000)), 0.7), (0.02, osc(R(v, 90, 110), 0.3, 200, "sine", decay=0.3), 0.6))
@snd("slurp", 3, 0.5, when="お蚕様（「咕啾咕啾」）")
def _(v): return mix(*[(i * 0.08, osc(R(v, 300, 380) * (1 + 0.1 * i), 0.07, R(v, 600, 700), "sine", decay=0.07), 0.6) for i in range(3)])
@snd("ropeCreak", 3, 0.45, when="绳子吱呀")
def _(v): return osc(R(v, 500, 600), 0.35, R(v, 650, 750), "tri", a=0.05, decay=0.35, curve=1.2, vib=0.08, vibf=17)
@snd("katashiroSwarm", 2, 0.45, when="一群纸人（「啪啦啪啦」）")
def _(v): return mix(*[(i * 0.045 + R(v, 0, 0.02) * (i % 2), noise(0.03, 1200, 6000, decay=0.015), 0.5) for i in range(18)])
# the beds (loops): quiet, a steady texture under the fight
@snd("clockTick", 2, 0.35, loop=True, when="钟（玩具「嘀嗒」）")
def _(v): return loop_of(lambda s: [(i * 0.5, bonk(1500 if i % 2 == 0 else 1150, 0.03), 0.6) for i in range(int(s / 0.5))], 4.0)
@snd("rain", 2, 0.25, loop=True, when="雨（细细的「滴答」）")
def _(v): return loop_of(lambda s: [(rng.uniform(0, s), osc(rng.uniform(2200, 4200), 0.025, None, "sine", decay=0.02), rng.uniform(0.15, 0.4)) for _ in range(int(s * 26))], 4.0)
@snd("fireLoop", 2, 0.3, loop=True, when="火（噼啪）")
def _(v): return loop_of(lambda s: [(rng.uniform(0, s), click(rng.uniform(5000, 9000), 0.004), rng.uniform(0.3, 0.8)) for _ in range(int(s * 9))]
                       + [(0, noise(s, 200, 1200, a=0.3, decay=s * 4, curve=0.2), 0.12)], 4.0)
@snd("heartbeat", 2, 0.5, loop=True, when="心跳（「咚咚」）")
def _(v): return loop_of(lambda s: [(i * 0.8 + o, osc(f, 0.09, f * 0.6, "sine", decay=0.09), g) for i in range(int(s / 0.8)) for o, f, g in ((0, 90, 1.0), (0.18, 80, 0.7))], 4.0)
@snd("gears", 2, 0.35, loop=True, when="齿轮（棘轮「咔哒咔哒」）")
def _(v): return loop_of(lambda s: [(i * 0.125, mix((0, click(7000, 0.005), 1.0), (0, blip(700 if i % 2 else 820, 0.015, "square"), 0.3)), 0.6) for i in range(int(s / 0.125))], 4.0)
@snd("lift", 2, 0.35, loop=True, when="吊梯的马达（「嗡——」）")
def _(v): return loop_of(lambda s: [(0, lowpass(osc(110, s, None, "saw", a=0.01, decay=s * 10, curve=0.1, vib=0.02, vibf=6), 900), 0.5)], 4.0)
@snd("crawl", 2, 0.4, loop=True, when="爬（「啪叽啪叽」）")
def _(v): return loop_of(lambda s: [(i * 0.4, osc(260, 0.08, 520, "sine", decay=0.08), 0.6) for i in range(int(s / 0.4))], 4.0)


def ffmpeg():
    f = sorted((ROOT / "tools" / "ffmpeg").glob("*/bin/ffmpeg.exe")); return str(f[-1])


def write(y, path):
    y = y / (np.abs(y).max() + 1e-9) * 0.89
    pcm = (np.clip(y, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run([ffmpeg(), "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "libopus", "-b:a", "64k", str(path)], input=pcm, check=True)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]; wav = sys.argv[sys.argv.index("--wav") + 1] if "--wav" in sys.argv else None
    if wav: args = [a for a in args if a != wav]
    OUT.mkdir(parents=True, exist_ok=True)
    sp = PACK / "audio" / "sounds.json"; D = json.loads(sp.read_text(encoding="utf-8"))
    for key, s in S.items():
        if args and key not in args: continue
        for f in OUT.glob(f"{key}_*.ogg"): f.unlink()
        files = []
        for i in range(s["takes"]):
            y = np.asarray(s["fn"](i / max(1, s["takes"] - 1) if s["takes"] > 1 else 0.5), dtype=np.float64)
            if not s["loop"]: y = U.room(y, 0.05, 0.12)[:len(y) + int(0.08 * SR)]
            write(y, OUT / f"{key}_{i + 1}.ogg"); files.append(f"sfx/toy/{key}_{i + 1}.ogg")
            if wav: pathlib.Path(wav).mkdir(parents=True, exist_ok=True); import wave as W; w = W.open(str(pathlib.Path(wav) / f"{key}_{i + 1}.wav"), "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(y / (np.abs(y).max() + 1e-9) * 0.89, -1, 1) * 32767).astype("<i2").tobytes()); w.close()
        e = D["sfx"].get(key) or {}
        e = {"when": s["when"] or e.get("when", ""), "want": "卡通 / 街机（老虎机、抓娃娃机）的音效：短、清楚、和 BGM 台词分得开", "src": "toy", "files": files, "vol": s["vol"]}
        if s["gap"]: e["gap"] = s["gap"]
        if s["loop"]: e["loop"] = True
        D["sfx"][key] = e
        print(key, len(files))
    sp.write_text(json.dumps(D, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "fmt_json.py"), str(sp)], check=True, stdin=subprocess.DEVNULL)


if __name__ == "__main__":
    main()
