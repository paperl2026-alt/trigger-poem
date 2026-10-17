# Round 48 (docs/PLAN.md 第八批): the special-attack markers, replacing the R44 / R46 sights (user: "类似 tato 这样的边框（不要盖住敌人，就是给
# 敌人抱个边）"; the quick-kill / quick-hide words flash and melt away, "Hit 滅ぼせ 快打 轮流出现"):
#   R48_frame_kill: ornamental crest pieces that hug a monster (or a flying thing) that must be killed / shot down quickly
#   R48_frame_hide: crest pieces of a different family, around a monster whose attack cannot be stopped: hide
#   R48_words_kill / R48_words_hide: brush lettering that flashes up beside it
CREST = "art/ref/hud/crest_ref.png"
KILL = "art/ref/hud/killquick_ref.webp"
FRAME = ("Reference image 1 shows ornamental crest TATTOO designs (heart crests with wings, thorns, flourishes): use that DESIGN LANGUAGE "
         "(symmetrical ornamental crest shapes, flowing tapered lines, hearts, wings, thorns), as clean flat graphic art. Reference image 2 is "
         "this game's mood for these markers (neon pink on dark). Draw a sheet on a transparent background, a 3 x 2 grid, one piece per cell, "
         "each centred with clear empty space around it, nothing crossing into another cell, no grid lines, no text, NO glow, NO blur (the game "
         "adds the glow), solid flat colour with a thin white core line. These pieces will be placed AROUND a monster on screen to frame it "
         "without covering it, so every piece is thin and open in the middle. ")
FRAMES = {
    "kill": ("Colour: hot pink / magenta (#ff2e93) with white highlights. Style: cute but sinister heart-crest tattoo with small bat wings and "
             "a tiny cat-ear motif. Cells: 1 the TOP piece: a wide horizontal crest (a heart in the centre with wings spreading left and right, "
             "flourishes curling DOWN at both ends), 2 the BOTTOM piece: a wide horizontal crest (a small inverted heart with flourishes curling "
             "UP at both ends), 3 the LEFT piece: a tall vertical flourish (curls and a thorn line, opening toward the right), 4 the RIGHT piece: "
             "the mirror of the left piece, 5 a small ROUND crest wreath (a ring of tiny hearts and thorns, empty inside) to hug a small flying "
             "object, 6 a tiny heart crest mark."),
    "hide": ("Colour: deep crimson red (#e0102a) and black with thin white lines. Style: a menacing crest of thorns, bat wings and a spiked "
             "halo, clearly a different family from soft hearts: angular and dangerous. Cells: 1 the TOP piece: a wide horizontal thorn crest with "
             "a spiked eye-like diamond in the centre, wings spreading, ends curling DOWN, 2 the BOTTOM piece: a wide horizontal thorn crest, ends "
             "curling UP, 3 the LEFT piece: a tall vertical thorn flourish opening toward the right, 4 the RIGHT piece: the mirror of the left "
             "piece, 5 a small ROUND thorn wreath, empty inside, 6 a tiny exclamation-mark crest."),
}
WORDS = ("Reference image 1 shows the wanted lettering mood: rough fast brush strokes, white letters with ragged hot-pink edges and splatter, "
         "very slanted and dynamic, like a slash. Draw a sheet on a transparent background, a 3 x 3 grid, ONE word per cell, each centred with "
         "empty space around it, nothing crossing into another cell, no grid lines, NO glow and NO background (the game adds the glow). Exactly "
         "these words, nothing else written: ")
WORDLISTS = {
    "kill": "1 'Hit!', 2 '滅ぼせ!!', 3 '快打!!!', 4 '撃て!', 5 'BREAK!', 6 '打它!!', 7 '止めろ!', 8 'KILL IT!', 9 '早く!'. Colours: white with hot pink edges.",
    "hide": "1 '躲!', 2 '避けろ!', 3 'HIDE!', 4 '快躲!!', 5 '伏せて!', 6 'COVER!', 7 '危ない!', 8 'DUCK!', 9 '隠れて!'. Colours: white with deep crimson red edges and black splatter.",
}
JOBS = {}
for k, d in FRAMES.items():
    JOBS[f"R48_frame_{k}"] = [(f"art/raw/r48/frame_{k}_{v}.png", [CREST, KILL], FRAME + d + f" Variation {v}.") for v in "abc"]
for k, d in WORDLISTS.items():
    JOBS[f"R48_words_{k}"] = [(f"art/raw/r48/words_{k}_{v}.png", [KILL], WORDS + d + f" Variation {v}.") for v in "ab"]
