# Round 39 (docs/DESIGN.md「战斗画面布局」etc., user 2026-10-17 fourth batch): everything for the NIKKE-like layout, at once.
#   R39_hud:     the battle HUD redone for the new layout (bottom outer corners + a thin bottom-centre strip), three directions
#   R39_rl_*:    chibi big-head reload stickers (they get slapped on irregularly beside her portrait)
#   R39_alert:   arcade-style big lettering (RELOAD!, CONTINUE?, ...) and screen cracks (being hit)
#   R39_glyph_*: the cat girl's lettering as art (sharp and cute), the nine kuji, the spell's characters
CAT, PINK = "art/ref/cat_sheet.png", "art/ref/pink_sheet.png"
BASE = "art/ref/hud/battle_clean3.png"
STYLE = "art/raw/r33/hud_a.png"
SKETCH = "art/ref/hud/layout_user.png"
NIKKE = "art/ref/hud/nikke_layout.webp"
NOTEXT = "No other text, letters or numbers than the ones asked for. "

HUD = ("Reference image 1 is a real in-game frame of this light-gun cover shooter (16:9, 1672x941): a school corridor, a desk monster in the "
       "middle, on the left the twin-tail gun girl 蔡蕾 (player 1, hot pink #ff5fa8) behind a grey locker, on the right the white-haired cat "
       "girl 庄乖 (player 2, violet #a66bff) behind a desk barricade. Reference image 2 is this game's approved HUD STYLE (red / black / white, "
       "Persona-5-like: tilted black slabs, jagged white outlines, red offset shadows, ransom-note lettering, halftone, chibi sticker "
       "portraits): copy its style and its kinds of elements, NOT its layout. Reference image 3 is the user's LAYOUT sketch: the big blue box "
       "(the whole upper and middle part of the screen) must stay COMPLETELY FREE for the monsters; the green boxes are the two girls (nothing "
       "may cover them); the HUD goes ONLY in the yellow boxes: each girl's panel in the bottom corner on her OUTER side (1P bottom-left, 2P "
       "bottom-right, mirrored), and a thin strip at the bottom centre between the girls. Reference image 4 is NIKKE's battle screen for the "
       "spirit of it (almost all of the screen is the battlefield, the HUD is compact and low). "
       "TASK: draw the HUD for this layout on top of reference image 1, keeping the game picture underneath exactly as it is (1672x941). "
       "Each girl's compact corner panel: a round chibi sticker portrait of her (a new cute face) with the skill-charge ring around it and the "
       "key hint 右键, a 1P / 2P tag, her name and Lv, a chunky HP bar with its number, her ammo (蔡蕾: a curved 40-round magazine gauge with "
       "the number 23/40; 庄乖: 8 small paper talismans with 6/8), three small Fever pips labelled 力 (flame, red-orange) 准 (crosshair, cyan) "
       "连 (chain, yellow-green). The bottom-centre strip: the stage name 走廊, the combo 27 连击!, the rank A ×1.8. Bold and readable but "
       "COMPACT: the panels stay inside the yellow corners (about 13% of the screen width and 25% of its height each), the strip stays low "
       "and thin. Nothing in the upper three quarters of the screen. Simplified Chinese. " + NOTEXT + "Design direction: ")
JOBS = {
    "R39_hud": [(f"art/raw/r39/hud_{k}.png", [BASE, STYLE, SKETCH, NIKKE], HUD + d, "OPAQUE") for k, d in {
        "a": "a vertical stack in each corner: the portrait on top breaking out of a tilted black card, the bars and ammo stacked below it.",
        "b": "a round portrait badge in the very corner with the bars wrapping around it in an arc, like a speedometer.",
        "c": "a P5 calling-card shard in each corner, tilted steeply, the portrait cut into the shard, the bars along its long edge.",
    }.items()],
}

# ---- chibi big-head reload stickers
RL = ("Reference image 1 is the character. Draw a sticker sheet on a transparent background, 3 x 3 grid, NINE chibi (super-deformed, big "
      "head, tiny body) BIG-HEAD CLOSE-UP stickers of her, each with a thick white sticker outline, one per cell, in reading order, each "
      "clearly a different moment while she RELOADS in a gunfight, cute and funny, manga symbols welcome (sweat drops, sparkles, steam, "
      "action lines). " + NOTEXT)
JOBS["R39_rl_pink"] = [(f"art/raw/r39/rl_pink_{k}.png", [PINK], "The black-haired twin-tail girl with pink and mint ribbons and a bunny hair "
    "clip, a pink frilly school blouse, fully clothed, and her pink-and-black compact submachine gun. " + RL + "The nine: 1 the empty magazine "
    "flying out, she gasps, 2 she bites a new magazine out of her pouch, 3 slamming it in with a big 'kachunk' pose, 4 a quick lip-gloss "
    "touch-up with a heart compact, 5 blowing on the hot barrel, 6 racking the bolt with a wink, 7 a peace sign and a tongue out, 8 fixing a "
    "ribbon in a panic, 9 hugging the reloaded gun with sparkles. " + d) for k, d in {"a": "Round chunky chibi style.", "b": "Sharper, more "
    "dynamic chibi style with tilted framing."}.items()]
JOBS["R39_rl_cat"] = [(f"art/raw/r39/rl_cat_{k}.png", [CAT], "The white-haired cat girl with cat ears, red glasses, a bell on a red ribbon, a "
    "white sailor uniform; her right arm is a big white fur ghost paw with red claws (draw the back of the paw with NO marks on it, plain "
    "white fur). " + RL + "The nine: she forms the nine kuji hand seals one after another (临 兵 斗 者 皆 阵 列 前 行), each a different hand "
    "shape with the paw and her normal hand, her face changing each time: serious, squinting, puffed cheeks, cat smile, determined, sleepy, "
    "proud, startled, triumphant. " + d) for k, d in {"a": "Round chunky chibi style.", "b": "Sharper, more dynamic chibi style with tilted "
    "framing."}.items()]

# ---- arcade alerts
ALERT = ("Reference image 1 is this game's HUD style (red / black / white, Persona-5-like, bold). Reference images 2 and 3 are old arcade "
         "light-gun games for the spirit of their big screen alerts. Draw a sheet on a transparent background, 3 x 3 grid, nine BIG bold "
         "lettering stickers, one per cell, each exactly the words given, letter-perfect, very readable, with thick outlines and depth, no "
         "background panels bigger than the word: ")
JOBS["R39_alert"] = [
    ("art/raw/r39/alert_words.png", [STYLE, "art/ref/hud/arcade_4.png", "art/ref/hud/arcade_5.png"], ALERT + "1 'RELOAD!' in P5 ransom-note "
     "style, 2 'RELOAD!' in chunky red-chrome arcade letters, 3 'RELOAD!' in a cute pink bubble-letter style, 4 'CONTINUE?' in P5 style, 5 "
     "'CONTINUE?' in arcade chrome letters, 6 'NO AMMO!' in P5 style, 7 'DANGER!!' in P5 style, 8 'OUCH!!' in a cute comic style, 9 'HIT!' in a "
     "jagged comic burst style."),
    ("art/raw/r39/alert_cracks.png", ["art/ref/hud/arcade_4.png"], "Reference image 1 shows an arcade light-gun game where a hit cracks the "
     "screen glass. Draw a sheet on a transparent background, 3 x 2 grid, six DIFFERENT shattered-glass crack patterns (a bullet impact "
     "point with radiating cracks and rings of small shards), white and light-cyan crack lines with thin dark edges, each centred in its "
     "cell, nothing else. " + NOTEXT),
]

# ---- the cat girl's lettering as art (one character per cell, letter-perfect)
LET = ("Draw a sheet on a transparent background, {g} grid, one Chinese character per cell, exactly these characters in this order, "
       "letter-perfect (correct strokes), big and centred, each with a thick outline: {chars}. Style: {style} " + NOTEXT)
SHARP = ("SHARP and fierce: slashing brush calligraphy with knife-edge strokes, ink splashes flying off, dramatic, like a demon-slaying "
         "talisman being written in one stroke; white characters with a black outline.")
CUTE = ("CUTE: round bubbly hand-lettered characters with soft puffy strokes, little cat ears or a paw print tucked into one stroke, a "
        "sparkle; white characters with a black outline.")
SPELL = "五星鎮彩光照玄冥千神萬聖護我真靈巨天猛獸制伏兵魔鬼亡身滅形所在之處奉迎急如律令"
JOBS["R39_glyph_mantra"] = [("art/raw/r39/gl_mantra_sharp.png", [], LET.format(g="3 x 2", chars="唵 嘛 呢 叭 咪 吽", style=SHARP)),
                            ("art/raw/r39/gl_mantra_cute.png", [], LET.format(g="3 x 2", chars="唵 嘛 呢 叭 咪 吽", style=CUTE))]
JOBS["R39_glyph_kuji"] = [("art/raw/r39/gl_kuji_sharp.png", [], LET.format(g="3 x 3", chars="临 兵 斗 者 皆 阵 列 前 行", style=SHARP)),
                          ("art/raw/r39/gl_kuji_cute.png", [], LET.format(g="3 x 3", chars="临 兵 斗 者 皆 阵 列 前 行", style=CUTE))]
JOBS["R39_glyph_spell"] = [(f"art/raw/r39/gl_spell_{i}.png", [], LET.format(g="3 x 3", chars=" ".join(SPELL[i * 9:i * 9 + 9]), style=SHARP))
                           for i in range((len(SPELL) + 8) // 9)]
