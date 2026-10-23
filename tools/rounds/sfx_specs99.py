# Round 99 of the sound effects (user 2026-10-23: "目前所有敌人蓄力攻击时，没啥特别音效吧。这种提醒音效bus应该临时盖过其他BGM、语音啥的几秒"):
# a monster or a boss gathering itself for an attack - one sound for every wind-up, made with Stable Audio 3 Small-SFX (tools/sfx_sa3.py),
# picked by tools/sfx_pick.py; it plays on the "alert" group, which ducks the music, the voices and the rest while it sounds (src/core/
# audio.js alert). A must-hide attack plays it lower (rate).
# SFX[key] = dict(prompt, dur (s), n (variants generated), kind, keep, when, want) - as tools/rounds/sfx_specs62.py
SFX = {
    "windupWarn": dict(kind="long", dur=2.0, n=12, keep=4, bus="alert", when="怪 / Boss 开始蓄力攻击（要打断的、要躲的）", want="一听就知道「它在蓄力、要来了」：上升的充能尖啸，最后一声清脆的警示叮",
                       prompt="an anime energy charge-up warning sound: a shimmering electric whine rising fast in pitch for one second, "
                              "ending in a single bright sharp warning ping, clean, punchy, close mic, no music"),
}
