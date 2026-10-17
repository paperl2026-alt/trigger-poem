# Round 35: everything the battle HUD needs to go into the game (docs/PLAN.md "战斗 HUD 重新设计"), all at once:
#   R35_hud*:   the approved mockup R33 decomposed: each region redrawn as it is, without text / numbers / portraits, bars empty
#   R35_ammo:   the cat girl's ammo as talismans (user), three directions
#   R35_load*:  the "reloading" picture shown see-through over her side (user: a real picture, the stripes were unreadable), three each
#   R35_chibi*: the chibi sticker expressions for the portraits, 24 per girl
#   R35_ret*:   the reticle in every state of the girl (user: changes in shape and composition, not colour), three directions each
#   R35_fx*:    muzzle / strike / hit effect sprites (user: effects must be visible art, not a few frames of code)
# Rules for Codex (docs/ART.md): style from the reference pictures, every requirement spelled out, no effects drawn into other assets.
P = "art/ref/hud/parts/"
HUD = "art/raw/r33/hud_a.png"
CAT, PINK = "art/ref/cat_sheet.png", "art/ref/pink_sheet.png"


def strict(what, remove, keep=""):
    return ("Reference image 1 is a crop of an approved game HUD mockup (a 16:9 battle screen). This is NOT a redesign task. Output the SAME "
            "picture at the SAME size, pixel for pixel the same shapes, positions, colours, outlines and halftone, keeping ONLY " + what + ". "
            "REMOVE completely: " + remove + ". Where removed things covered HUD graphics, continue those graphics cleanly. Everything that is "
            "not HUD (the game picture behind: corridor, girls, monster) becomes fully transparent. " + keep)


NOTEXT = "every letter, number and Chinese character"
JOBS = {
    "R35_hud1": [
        ("art/raw/r35/left.png", [P + "a_left.png"], strict(
            "the HUD graphics (the pink splatter and halftone backing, the tilted black slabs with jagged white outlines and red offset shadows, "
            "the red 1P block, the round portrait frame with its segmented skill ring track, the white key tag, the HP bar slab and its empty track, "
            "the three Fever gauge tiles with their empty segment tracks, the ammo slab with its empty tick track)",
            NOTEXT + "; the chibi girl inside the round frame (leave the inside of the frame plain white); the heart icon; the flame, crosshair "
            "and chain icons; the bullet icon; every coloured fill (make the HP bar, the gauge segments, the skill ring and the ammo ticks all EMPTY "
            "dark grey tracks)")),
        ("art/raw/r35/center.png", [P + "a_center.png"], strict(
            "the HUD graphics (the small black stage-name slab with its white outline, the big red-black-white jagged combo burst, the black spiky "
            "rank burst with halftone)", NOTEXT + " (the stage name, 27, 连击!, A, ×1.8)")),
        ("art/raw/r35/right.png", [P + "a_right.png"], strict(
            "the HUD graphics (the violet splatter and halftone backing, the tilted black slabs with jagged white outlines and red offset shadows, "
            "the red 2P block, the round portrait frame with its segmented skill ring track, the white key tag, the HP bar slab and its empty track, "
            "the three Fever gauge tiles with their empty segment tracks, the ammo slab)",
            NOTEXT + "; the chibi cat girl inside the round frame (leave the inside plain white); the heart icon; the flame, crosshair and chain "
            "icons; the big paw icon and the eight small paw tokens; every coloured fill (bars, gauge segments and the skill ring EMPTY dark grey)")),
    ],
    "R35_hud2": [
        ("art/raw/r35/boss.png", [P + "b_boss.png"], strict(
            "the boss bar graphics (the long tilted black slab with its red and white jagged outline and splatter, the empty bar track, the three "
            "phase pip sockets, the square portrait frame)", NOTEXT + "; the monster portrait inside the square frame (leave it plain black); "
            "the red fill of the bar (make it an empty dark track); the weak point diamond marker")),
        ("art/raw/r35/down.png", [P + "b_down.png"], strict(
            "the countdown timer graphics (the round red-black-white segmented timer ring and its black disc)", NOTEXT + " (7, /9, 复活!); the "
            "greyed panel behind it")),
        ("art/raw/r35/hide.png", [P + "b_hide.png"], strict(
            "the warning graphics (the red-white jagged burst and the round countdown ring next to it)", NOTEXT + " (躲!, 3); the monster behind")),
        ("art/raw/r35/interrupt.png", [P + "c_interrupt.png"], strict(
            "the warning graphics (the black-red jagged speech-burst label and the round countdown ring under it)", NOTEXT + " (打断!, 2)")),
        ("art/raw/r35/tag.png", [P + "a_tag.png"], strict("the name tag graphics (the tilted black slab with its white and red outline)",
                                                        NOTEXT + " (课桌蜘蛛)")),
        ("art/raw/r35/icons.png", [P + "a_left.png", P + "a_right.png"],
         "Reference images 1 and 2 are crops of an approved game HUD. Draw a sprite sheet on a transparent background, 4 x 2 grid, one icon per "
         "cell, each centred and large, in EXACTLY the style they have in the references (same colours, outlines, shading): 1 the white heart "
         "icon of the HP bar, 2 the red-orange flame icon, 3 the cyan crosshair icon, 4 the yellow chain-link icon, 5 the pair of brass bullets "
         "of the ammo slab, 6 the violet heart icon, 7 a small red skull icon in the same style, 8 a small white lightning bolt icon in the "
         "same style. No text."),
    ],
    "R35_ammo": [
        (f"art/raw/r35/talisman_{k}.png", [HUD, CAT],
         "Reference image 1 is the approved battle HUD of this game (red / black / white, Persona-5-like, cute). Reference image 2 is the "
         "white-haired cat girl, whose shots are mantra spells cast with her ghost paw. Design her AMMO GAUGE: 8 shots shown as 8 TALISMANS "
         "(paper charms). Draw a sprite sheet on a transparent background, 3 x 2 grid, each cell centred, no other text than the brush marks on "
         "the talismans: 1 one talisman READY (bright, crisp), 2 one talisman SPENT (burnt to ash at one end, torn, dark), 3 one talisman "
         "glowing for her endless special (the same talisman, light pouring from it is NOT drawn, only its brighter colours), 4 a row of 8 "
         "ready talismans laid out as a gauge that fits under her HUD panel, 5 the same row with 5 ready and 3 spent, 6 the same row all spent. "
         "Every talisman in the sheet is the SAME design. Design direction: " + d)
        for k, d in {
            "a": "a classic tall yellow ofuda paper slip with a red brush seal and red brush strokes, a little red tassel at the bottom.",
            "b": "a small square paper charm with a pink paw-print seal in the middle, a tiny golden bell tied on with a red string.",
            "c": "a slim white paper talisman folded at the top like origami, a red circular seal, violet ink brush strokes, a frayed edge.",
        }.items()
    ],
    "R35_load": [
        (f"art/raw/r35/load_{who}_{k}.png", [HUD, ref],
         "Reference image 1 is the approved battle HUD of this game (red / black / white, Persona-5-like, cute, bold). Draw ONE single picture "
         "on a transparent background, centred, square: a big, instantly readable RELOADING illustration for " + desc + ", in the HUD's style "
         "(bold black outlines, red / white / her colour, halftone shading). It is shown huge and see-through over her side of the screen "
         "while she reloads, so it must read as 'reloading' at a glance from its SHAPES alone, with NO text, no letters, no numbers. "
         "Design direction: " + d)
        for who, ref, desc, dirs in [
            ("pink", PINK, "the black-haired twin-tail girl's pink gatling-style gun (her colour hot pink #ff5fa8)", {
                "a": "a big pink magazine being slammed into the gun from below, bold motion lines, a few cartridges flying in.",
                "b": "a big rotating ammo drum seen from the front, cartridges clicking into its chambers one after another, curved arrows.",
                "c": "a cute bunny-shaped loading spinner made of a ring of cartridges, the bunny ears are two big bullets."}),
            ("cat", CAT, "the white-haired cat girl's ghost paw that casts mantra spells with talismans (her colour violet #a66bff)", {
                "a": "a big calligraphy brush writing a new talisman, a splash of ink, the paper slip half written.",
                "b": "a fan of talismans being drawn out of a long kimono sleeve, a white fur paw pulling them.",
                "c": "a white fur ghost paw pressing a red paw-print seal stamp onto a talisman, impact lines."}),
        ] for k, d in dirs.items()
    ],
}
# ---- chibi expressions (24 per girl): the approved chibi style of the mockup's portraits
SHEET = ("Reference image 1 shows the approved CHIBI sticker portrait of this character from the game HUD: copy EXACTLY this chibi style "
         "(super-deformed big head, line weight, colouring, thick white sticker outline) and this character's look. Draw a sprite sheet on a "
         "transparent background, 4 x 3 grid, twelve DIFFERENT expressions of this same chibi character, one per cell, each a head-and-shoulders "
         "bust centred so it fits inside a round frame, all at the same size. Manga symbols (sweat drops, tears, swirl eyes, sparkle eyes, anger "
         "marks, blush lines, little hearts) are welcome as part of the face. No text, no letters. Very cute, exaggerated, lively. The twelve, "
         "left to right, top to bottom: ")
EXPR1 = ("1 calm smug grin, 2 focused shooting squint with tongue poking out, 3 wild excited shouting while shooting, 4 'ouch!' one eye shut "
         "with a small tear, 5 crying with waterfall tears, 6 cheering fist pump with sparkles (combo up), 7 fired up with flames in her eyes "
         "(Fever), 8 sparkling star eyes and drooling (special ready), 9 roaring with a huge open mouth (special on), 10 busy pout with a sweat "
         "drop (reloading), 11 blank shocked eyes with shock lines (out of ammo), 12 knocked out with swirl eyes and a little ghost floating out.")
EXPR2 = ("1 humming happily with eyes closed (walking), 2 out of breath with a sweat drop and tongue out (running), 3 nervously peeking (in "
         "cover), 4 bored yawn, 5 victory V sign with a wink, 6 smug 'ohoho' laugh with a hand at the mouth, 7 angry puffed cheeks, 8 scared "
         "with tiny pupils, 9 embarrassed deep blush, 10 sleepy drooping eyes, 11 heart eyes, 12 determined serious face with a sweat drop.")
JOBS["R35_chibi"] = [
    ("art/raw/r35/chibi_pink1.png", [P + "a_pink_face.png", P + "c_pink_face.png"], SHEET + EXPR1),
    ("art/raw/r35/chibi_pink2.png", [P + "a_pink_face.png", P + "c_pink_face.png"], SHEET + EXPR2),
    ("art/raw/r35/chibi_cat1.png", [P + "a_cat_face.png", P + "c_cat_face.png"], SHEET + EXPR1 + " She keeps her cat ears, red glasses, bell and "
     "white fur paw in every cell."),
    ("art/raw/r35/chibi_cat2.png", [P + "a_cat_face.png", P + "c_cat_face.png"], SHEET + EXPR2 + " She keeps her cat ears, red glasses, bell and "
     "white fur paw in every cell."),
]
# ---- reticles: every state of the girl, three directions each
RET = ("Reference image 1 is the approved battle HUD of this game; reference image 2 shows its current reticles. Design the AIMING RETICLE of "
       "{who} for this light-gun shooter. Draw a sprite sheet on a transparent background, 4 x 2 grid, one STATE per cell, flat bold graphic, "
       "no scene, no text. The eight states MUST differ in SHAPE and COMPOSITION, not only in colour, while clearly being one family: 1 aiming "
       "at nothing (calm, open), 2 locked on a monster (tightened, brackets snapped in, with a short stub where a leader line to a name tag "
       "starts), 3 firing (parts kicked outward by recoil, bloom), 4 reloading (a loading form: a ring or {ammo} filling up), 5 hiding in cover "
       "(cannot shoot: collapsed and small, a closed-eye or shield sign), 6 out of ammo (empty, broken, an X form), 7 Fever (much fancier: extra "
       "rings, spikes, {fever}), 8 her special ({special}). Each reticle is built from a few clean separate layers (outer ring, inner ring, "
       "brackets, ticks, centre mark) so the game can spin, scale and recombine them. Colours: {col}. Design direction: {d}")
for who, desc in [("pink", dict(who="player 1, the black-haired twin-tail gun girl", ammo="a magazine of cartridges", fever="hearts",
                                special="an endless gatling: a big spinning multi-barrel ring", col="hot pink #ff5fa8, white, black")),
                  ("cat", dict(who="player 2, the white-haired cat girl who shoots mantra spells from a ghost paw", ammo="a stack of talismans",
                               fever="paw prints and seal glyph marks", special="a mantra beam: a big turning seal circle",
                               col="violet #a66bff, gold, white, black"))]:
    dirs = ({"a": "kawaii heart scope: heart shapes, ribbons, bunny-ear brackets.", "b": "candy-coloured tactical sight: precise ticks, "
             "chevrons, crisp scales without numbers.", "c": "Persona-5 calling card: jagged red-black-white shards with pink accents."}
            if who == "pink" else
            {"a": "talisman seal / magic circle: concentric seal rings with brush strokes and seal marks.", "b": "paw and claw: a paw-pad "
             "centre, claw-mark brackets that close like a grabbing paw.", "c": "cat eye and bell: a slit pupil that narrows when locked, a "
             "bell charm, whisker ticks."})
    JOBS[f"R35_ret_{who}"] = [(f"art/raw/r35/ret_{who}_{k}.png", [HUD, P + "a_reticles.png"], RET.format(d=d, **desc)) for k, d in dirs.items()]
# ---- effect sprites (art bases the program animates)
FX = ("Reference image 1 is the current effect sprite of this game (style: bold anime effect art, clean shapes, bright). Draw a sprite sheet "
      "on a transparent background, 3 x 2 grid, six DIFFERENT {what}, each centred in its cell with empty space around it, no text, no "
      "letters. {how}")
JOBS["R35_fx"] = [
    ("art/raw/r35/fx_pink.png", ["public/content/base/assets/hud/flash_rifle.webp"], FX.format(what="muzzle flashes of a cute pink gun",
     how="Hot pink and white star-burst petals pointing to the RIGHT (the shot goes right), each shape clearly different.")),
    ("art/raw/r35/fx_pink_fever.png", ["public/content/base/assets/hud/flash_rifle.webp"], FX.format(what="FEVER muzzle flashes of a cute pink "
     "gun", how="Much more ornate than normal ones: deeper magenta and white, layered petals, little hearts and ribbon curls, pointing to the "
     "RIGHT.")),
    ("art/raw/r35/fx_cat.png", ["public/content/base/assets/hud/flash_mantra.webp"], FX.format(what="strike bursts of a ghost paw casting a "
     "mantra", how="Gold and violet: a paw-shaped shock burst, a seal circle breaking open, talisman shreds, each clearly different.")),
    ("art/raw/r35/fx_cat_fever.png", ["public/content/base/assets/hud/flash_mantra.webp"], FX.format(what="FEVER strike bursts of a ghost paw "
     "casting a mantra", how="Much more ornate: violet and gold flames in an unnatural colour, double seal circles, paw prints, talisman "
     "ribbons.")),
    ("art/raw/r35/fx_hit.png", ["public/content/base/assets/hud/flash_rifle.webp"], FX.format(what="hit impact bursts (a shot hitting a "
     "monster)", how="Three in hot pink and white (bullets), three in gold and violet (mantra spells); sharp star shapes, splinters, rings.")),
]
