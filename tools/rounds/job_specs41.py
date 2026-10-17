# Round 41 (docs/DESIGN.md「猫娘的字」「漫画转场的规矩」, user 2026-10-17 fifth batch):
#   R41_gl_<style>_<n>: the cat girl's lettering DESIGNED (no standard font): three directions, every character she uses
#   R41_page_<page>:    the prologue comics as whole manga pages drawn by Codex (lettering drawn in), three candidates each; the game cuts
#                       the panels out and animates them (tools/rounds/r41_import.py)
CAT, PINK, BOSS = "art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/raw/r25/master.png"

# ---------------------------------------------------------------- lettering
CHARS = "唵嘛呢叭咪吽临兵斗者皆阵列前行敕令㗊" + "五星鎮彩光照玄冥千神萬聖護我真靈巨天猛獸制伏兵魔鬼亡身滅形所在之處奉迎急如律令"
SHEETS = [CHARS[i:i + 9] for i in range(0, len(CHARS), 9)]
STYLES = {
    "seal": "MAGIC-SEAL lettering: each character is set inside a small hand-drawn magic seal ring (a thin double circle with tick marks and two "
            "tiny star nodes), some strokes end in small curled talisman hooks, one dot of each character is a tiny cat paw print; balanced "
            "medium strokes, neither bubbly-round nor long sharp brush tips.",
    "catbrush": "CAT-BRUSH lettering: soft ink-brush strokes of medium weight with gentle taper (not bubbly, not long knife tips), stroke ends "
                "curling like little cat tails, a pair of small pointed cat ears tucked onto the top stroke, a few tiny sparkles and ink dots.",
    "sigil": "SIGIL lettering: each character drawn like a cute magic sigil: double-line hollow strokes with small star or moon nodes where "
             "strokes meet, a faint pentagram or crescent tucked in a corner, slightly wobbly hand-drawn line, playful and mystical.",
}
LET = ("Design hand-lettered characters for a cute magic cat girl's spells in an anime game. NOT a standard font: designed lettering, "
       "mystical and cute at once. Draw a sheet on a transparent background, 3 x 3 grid, one character per cell, big and centred, in this "
       "order: {chars}. Each character recognisable but stylised. Colour: the lettering is pure WHITE with a thick clean BLACK outline, "
       "nothing else coloured, no background, no frame around the cell, no other text. Style: {style}")
JOBS = {f"R41_gl_{k}": [(f"art/raw/r41/gl_{k}_{i}.png", [], LET.format(chars=" ".join(sh), style=d)) for i, sh in enumerate(SHEETS)]
        for k, d in STYLES.items()}

# ---------------------------------------------------------------- whole manga pages
STYLE = ("Draw ONE whole page of a COLOUR MANGA, landscape 16:9. Simple, clean manga drawing style that matches the character sheets "
         "(clean ink lines, flat colours with SCREENTONE dots and hatching, a light paper texture, like a printed manga page, NOT a "
         "rendered CG illustration). Panels with thick black borders and white gutters, dynamic slanted panel cuts. Hand-lettered manga "
         "sound effects and short captions drawn INTO the art as part of the drawing (only the words given here, no speech balloons, no "
         "dialogue). Only the characters named here appear: no other people, no men, no boys, no teachers, no other students. The girls are "
         "fully clothed, wholesome and cute. ")
REFS = "Reference images: 1 = the white-haired cat girl's design, 2 = the black-haired twin-tail girl's design{boss}; keep their looks. "
CATD = "the white-haired cat girl (cat ears, red glasses, a bell on a red ribbon, white sailor uniform, a big white fur ghost paw for a right arm)"
PINKD = "the black-haired twin-tail girl (pink and mint ribbons, a bunny hair clip, a pink frilly blouse with a mint sailor collar, a cute pink gun)"
PAGES = {
    "intro": ("Five panels, read left to right, top row then bottom row: "
              "1 (wide, top left) an empty after-school classroom at sunset, only the two girls sitting far apart, a clock on the wall, a small "
              "caption '16:59'; 2 (top right) close-up of " + CATD + " resting her chin on her paw, doodling a round chubby limited plush toy "
              "in her notebook, the word '限定!!' written next to it with hearts; 3 (bottom left) " + PINKD + " holding up her phone with the "
              "SCREEN FACING THE VIEWER showing a tall strawberry parfait and the word 'LIMITED', her eyes sparkling; 4 (bottom middle, a "
              "narrow split panel) both girls' eyes snapping to the wall clock hitting 17:00, the big lettering '17:00!!'; 5 (bottom right) "
              "the school building struck from the sky by a huge violet beam, shock rings, the big sound effect 'BOOOM!!'."),
    "mid": ("Four panels: 1 (tall, left) " + CATD + " smashing the classroom sliding door off its rails with her giant paw, splinters, the "
            "sound effect 'BAAAN!!'; 2 (top middle) " + PINKD + " in the broken doorway reloading her gun with a wink, the sound effect "
            "'CLICK♡'; 3 (top right) a school corridor warping like a fish-eye lens, violet eye sigils on the walls, floating test papers, "
            "big question marks '???'; 4 (wide, bottom right) the two girls running side by side down the corridor toward the viewer, "
            "speed lines, the lettering 'GO GO!!'."),
    "boss": ("Four panels: 1 (top left) " + PINKD + " shooting a corridor window, the glass bursting, 'BANG!!'; 2 (tall, middle) the two "
             "girls diving out of the broken second-floor window together, arms forward, glass sparkles, 'JUMP!!'; 3 (bottom left) the two "
             "girls landing crouched in the schoolyard in a burst of dust, 'DOOON!!'; 4 (tall, right) looking up from the yard: a colossal "
             "girl's hand with long red ruler-tip nails gripping the school roof, a red armband with a white shield crest, a red 'WARNING' "
             "stamp."),
    "end": ("Four panels: 1 (top left, wide) the colossal discipline-committee girl dissolving into sparkles and paper petals, the stamp "
            "'PURIFIED 净化'; 2 (top middle) the discipline-committee girl back to normal size sitting dazed on the ground with swirl eyes "
            "and a little steam, '@_@'; 3 (top right) the two girls back to back making a V sign and a cool pose, 'CLEAR!!'; 4 (wide, "
            "bottom) chibi versions of the two girls dashing out of the school gate toward the sunset with a dust trail, one clutching a "
            "shopping bag, the other a parfait cup, the lettering '限定 GET♡'."),
}
for page, txt in PAGES.items():
    refs = [CAT, PINK] + ([BOSS] if page in ("boss", "end") else [])
    JOBS[f"R41_page_{page}"] = [(f"art/raw/r41/page_{page}_{v}.png", refs, REFS.format(boss=", 3 = the boss's design" if len(refs) > 2 else "") +
                                 STYLE + txt + f" Variation {v}: its own panel layout and camera angles.", "OPAQUE") for v in "abc"]
