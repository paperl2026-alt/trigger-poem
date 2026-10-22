# Round 94 of the sound effects (user 2026-10-22: "开门声就做的更像开门声吧" - the door close-up between two places had the cartoon creak
# of the toy set): a real door opening, made with Stable Audio 3 Small-SFX (tools/sfx_sa3.py), picked by tools/sfx_pick.py; played by the
# door close-up (src/ui/door.js) and by the swinging doors of a room's doorways (PanelWorld.setDoor).
# SFX[key] = dict(prompt, dur (s), n (variants generated), kind, keep, when, want) - as tools/rounds/sfx_specs62.py
SFX = {
    "doorOpen": dict(kind="long", dur=4.0, n=12, keep=4, when="开门（两个地方之间的开门特写、门洞里的门打开）", want="真的木门打开：门闩咔哒一声，合页长长地吱呀，门扇慢慢摆开",
                     prompt="an old heavy wooden mansion door being opened slowly: a metal latch clicks, then the rusty iron hinges creak long and low "
                            "as the door swings open, a soft draught, indoors, a large quiet hall, realistic foley, close mic"),
}
