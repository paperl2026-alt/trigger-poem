# Round 36 (docs/DESIGN.md, 2026-10-17 third batch): everything at once, several candidates of each so the best can be picked.
#   R36_rl_*:  reload close-ups: the cat girl's nine hand seals (临兵斗者皆阵列前行), the gun girl's nine reload / make-up / cute close-ups
#   R36_bub_*: sticker speech bubbles (empty: the game sets the words), heroines' and monsters'
#   R36_c_*:   the prologue comics redone: Claude's panel plan, three candidates per panel (no other people, never men, no text)
#   R36_b_*:   the boss by camera: per form, only the parts that camera sees, each part on its own picture
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]   # this folder and tools/
from job_specs25 import LOOK as BOSS_LOOK

CAT, PINK, HUD = "art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/raw/r33/hud_a.png"
BOSS = "art/raw/r25/master.png"
PEOPLE = ("ONLY the characters named here appear in the picture: no other people at all, no men, no boys, no teachers, no other students, "
          "no faces in the background. ")
NOTEXT = "No text, no letters, no numbers, no speech balloons, no sound-effect lettering. "
CATDESC = ("The white-haired cat girl from reference image 1: cat ears, red-rimmed glasses, a bell on a red ribbon, a white sailor uniform with "
           "a navy collar and wide sleeves; her RIGHT arm is a big white fur ghost paw with long red claws and a red pentagram seal on the back "
           "of the paw; her left hand is a normal hand. ")
PINKDESC = ("The black-haired twin-tail girl from reference image 1: long wavy black twin tails with pink and mint ribbons and a bunny hair clip, "
            "pink eyes, a pink frilly school blouse with a mint sailor collar and a frilly pink skirt, fully clothed, cute and wholesome; her gun is "
            "a pink-and-black compact submachine gun with a bunny sticker. ")

# ---------------------------------------------------------------- reload close-ups (3 x 3 sheets, nine cells in order)
SHEET9 = ("Draw a sprite sheet on a transparent background, 3 x 3 grid, NINE separate close-up vignettes, one per cell, in reading order, each "
          "fully inside its cell with empty space between cells. Each vignette is a dynamic anime close-up (extreme crop, dramatic angle, motion "
          "lines welcome) that will flash on screen for a fraction of a second, so it must read instantly. " + NOTEXT + "Anime colour, bold clean ink "
          "lines. ")
SEALS = ("The nine are the nine kuji-in hand seals she forms in a quick sequence to reload her spells, in this order: 1 临 rin, 2 兵 pyo, 3 斗 to, "
         "4 者 sha, 5 皆 kai, 6 阵 jin, 7 列 retsu, 8 前 zai, 9 行 zen; each cell shows her hands forming that seal (her furry ghost paw and her "
         "normal hand together, fingers interlocked or pointing as in the kuji-in mudras, each seal clearly a different hand shape), with a slice "
         "of her face (an eye behind her glasses, a cat ear, the bell) in some cells, light violet aura lines around the hands. ")
PINK9 = ("The nine are quick close-ups of her reloading between shots, mixed with cute moments, in this order: 1 the empty magazine dropping out "
         "of the gun, 2 her hand pulling a fresh pink magazine from a frilly pouch at her waist, 3 slamming the magazine in with her palm, 4 a quick "
         "touch-up of lip gloss in a tiny heart-shaped compact mirror, 5 her hand smoothing down the frilly hem of her skirt, 6 racking the charging "
         "handle with a wink, 7 a peace sign next to her winking eye, 8 fixing a twin-tail ribbon, 9 the gun raised and ready with a heart sparkle. ")
CAM_DIRS = {"a": "Framing: tight crops from the front, big hands.", "b": "Framing: varied angles (from below, from the side, over the shoulder).",
            "c": "Framing: very close crops with a strong diagonal tilt and speed lines."}
JOBS = {
    "R36_rl_cat": [(f"art/raw/r36/rl_cat_{k}.png", [CAT], CATDESC + SHEET9 + SEALS + d) for k, d in CAM_DIRS.items()],
    "R36_rl_pink": [(f"art/raw/r36/rl_pink_{k}.png", [PINK], PINKDESC + SHEET9 + PINK9 + d) for k, d in CAM_DIRS.items()],
}

# ---------------------------------------------------------------- sticker speech bubbles (empty)
BUB = ("Reference image 1 is the approved battle HUD of this game (red / black / white, Persona-5-like, cute, bold). Draw a sticker sheet on a "
       "transparent background, 3 x 2 grid, six DIFFERENT EMPTY speech-bubble stickers, one per cell, each with a thick white sticker outline and a "
       "small drop shadow, the inside left EMPTY for words the game adds later. " + NOTEXT + "The six: ")
JOBS["R36_bub"] = [
    ("art/raw/r36/bub_cute.png", [HUD], BUB + "cute bubbles for two cute heroines: 1 a round pink bubble with a heart-shaped tail, 2 a puffy cloud "
     "bubble with sparkles, 3 a star-shaped bubble, 4 a bunny-ear bubble, 5 a cat-head bubble with ears, 6 a wobbly embarrassed bubble with blush "
     "lines."),
    ("art/raw/r36/bub_shout.png", [HUD], BUB + "loud battle bubbles: 1 a jagged red-black explosion burst, 2 a spiky impact burst, 3 a tilted P5-style "
     "slab with a torn edge, 4 a lightning-bolt bubble, 5 a scared shaky bubble with sweat drops, 6 a manga anger-mark bubble."),
    ("art/raw/r36/bub_monster.png", [HUD], BUB + "creepy bubbles for monsters: 1 a dripping violet goo bubble, 2 a glitchy broken bubble with "
     "pixel shards, 3 a bubble made of torn paper, 4 a bubble with a stitched seam and an eye, 5 a crackling static bubble, 6 a bubble with "
     "thorny tendrils."),
]

# ---------------------------------------------------------------- the prologue comics: Claude's panel plan, three candidates per panel
STYLE = ("Colour manga panel, anime cel shading, bold ink outlines, screentone shading, dynamic composition, sunset light turning violet after "
         "the anomaly. " + PEOPLE + NOTEXT + "Fill the whole picture edge to edge (it is cropped into a panel). ")
# (key, references, aspect, content)
PANELS = [
    # page 1: after school, each girl remembers today's limited item, the school is hit
    ("i1", [CAT, PINK], "wide", "An after-school classroom at sunset seen from the back corner, rows of empty desks and chairs, long shadows; only "
     "two girls in the whole room, small in the picture, sitting far apart: the white-haired cat girl near the front window, the black-haired "
     "twin-tail girl at the back. A wall clock above the blackboard."),
    ("i2", [CAT], "square", CATDESC + "Close-up: she rests her chin on her ghost paw at her desk, looking down at an open notebook; the notebook page "
     "faces the viewer and shows her own cute doodle of a limited-edition plush toy (a round chubby creature, not a real brand) circled many "
     "times in red, with little stars; her eyes sparkle."),
    ("i3", [PINK], "square", PINKDESC + "Close-up: she holds her phone up in front of her face with the SCREEN FACING THE VIEWER; the screen shows a "
     "picture of a towering pink strawberry parfait with sparkles and a red countdown bar (no text); behind the phone her eyes go wide and "
     "starry, drooling slightly in a cute way."),
    ("i4", [CAT, PINK], "wide", "Split panel: left half the cat girl's eyes snapping sideways, right half the twin-tail girl's eyes snapping "
     "sideways, both toward a wall clock in the middle whose hands are about to hit the hour; sweat drops; speed lines."),
    ("i5", [], "wide", "Outside: a three-storey Japanese high-school building at sunset, a huge violet beam of energy striking the roof from the sky, "
     "shock rings, the sky turning violet, windows flashing; no people anywhere."),
    # page 2: classroom -> corridor
    ("m1", [CAT], "square", CATDESC + "Her huge white fur ghost paw smashes the classroom sliding door off its rails toward the viewer, splinters "
     "flying, her eyes glowing behind her glasses."),
    ("m2", [PINK], "tall", PINKDESC + "She stands in the broken doorway reloading her gun with a confident wink; behind her, inside the dark "
     "classroom, silhouettes of creepy desk monsters with glowing eyes."),
    ("m3", [], "wide", "A school corridor stretching impossibly long and warping like a fish-eye lens, violet eye sigils painted on the walls, "
     "torn posters, floating test papers; no people."),
    ("m4", [CAT, PINK], "tall", "The two girls running down the corridor seen from behind, side by side, the cat girl's paw glowing, the twin-tail "
     "girl's twin tails flying, motion lines."),
    # page 3: corridor -> schoolyard (window break and leap)
    ("j1", [PINK], "square", PINKDESC + "Close-up: she fires at a corridor window, the glass bursting outward into glittering shards, muzzle flash."),
    ("j2", [CAT, PINK], "tall", "Seen from outside the building: the two girls leap out of a shattered second-floor window side by side, glass "
     "shards sparkling around them, both fully clothed, skirts fluttering modestly, determined faces, the sunset sky behind."),
    ("j3", [CAT, PINK], "wide", "The two girls land crouched in the schoolyard in a burst of dust, one knee down, superhero landing, the school "
     "building behind them."),
    ("j4", [BOSS], "wide", "Looking up from the schoolyard: a colossal girl's hand with long red ruler-like nails grips the edge of the school "
     "roof, a red armband with a white shield crest on the wrist, its huge shadow falling over the yard; only the hand is seen."),
    # page 4: ending
    ("e1", [BOSS], "wide", "The colossal discipline-committee girl dissolving into sparkles, petals and floating paper, her stern face softening, "
     "violet light breaking apart; seen from the yard."),
    ("e2", [BOSS], "square", "The discipline-committee girl back to normal size, sitting dazed on the schoolyard ground, her red armband askew, "
     "swirly eyes, a little steam above her head, cute."),
    ("e3", [CAT, PINK], "wide", "The two girls back to back at sunset in the yard, the twin-tail girl making a V sign, the cat girl striking a "
     "cool pose with her paw, both smiling, sparkles."),
    ("e4", [CAT, PINK], "wide", "Chibi gag: the two girls in super-deformed style dashing out of the school gate toward the sunset with a huge dust "
     "trail, one clutching a shopping bag, the other a parfait cup."),
]
ASPECT = {"wide": "Landscape 3:2 picture.", "square": "Square picture.", "tall": "Portrait 2:3 picture."}
for key, refs, asp, txt in PANELS:
    intro = ("Reference images: " + ", ".join(f"{i + 1} = {'the cat girl' if r == CAT else 'the twin-tail girl' if r == PINK else 'the boss'}'s design"
                                               for i, r in enumerate(refs)) + "; keep their designs exactly. ") if refs else ""
    JOBS[f"R36_c_{key}"] = [(f"art/raw/r36/c_{key}_{v}.png", refs, intro + STYLE + ASPECT[asp] + " The panel: " + txt +
                             f" Variation {v}: a different camera angle and composition from the other variations.", "OPAQUE") for v in "abc"]

# ---------------------------------------------------------------- the boss by camera (docs/DESIGN.md「Boss」)
BP = ("Reference image 1 is the approved design of this boss: keep her face, hair, uniform, armband, colours and style exactly. " + BOSS_LOOK +
      "Draw ONLY the part described, on a transparent background, at high resolution, nothing else in the picture (no building, no ground, no "
      "sky, no effects, no glow drawn around her), cleanly cut where described. " + NOTEXT)
FORMS = {
    # form 1: the camera stands in the yard looking at the school building; she hides behind it; only what is above the roof line shows
    "f1_head": "Form 1, seen from the schoolyard: the TOP HALF of her giant head peeking over a roof: hair, blunt bangs, the closed third-eye slit on "
               "her forehead, her sharp red eyes glaring down; everything below her nose is cut off by a perfectly straight horizontal line along "
               "the bottom of the picture (the roof hides it). Front view, slightly from below.",
    "f1_head_eye": "Same as form 1's head (the top half of her giant head over a straight horizontal cut at the bottom), but the third eye on her "
                   "forehead is OPEN wide, a big glowing pink eye inside a jagged diamond, her own eyes furious.",
    "f1_hand": "Form 1: ONE giant right hand gripping a roof edge, seen from the front and slightly below: the fingers curl over toward the viewer, "
               "long red ruler-tip nails, the wrist cut off by a perfectly straight horizontal line along the bottom of the picture (the building "
               "hides the arm).",
    "f1_hand_up": "Form 1: ONE giant hand raised high to slam down, palm toward the viewer, fingers spread, long red nails, the red armband on "
                  "the wrist, the forearm cut off by a straight horizontal line at the bottom of the picture.",
    # form 2: the camera tilts up; she has climbed onto the roof; waist up
    "f2_idle": "Form 2, seen from the yard looking up: she stands on the roof, visible from the WAIST UP (cut off by a straight horizontal line at "
               "the bottom), arms down at her sides, rule-tape hair whipping in the wind, the whistle on its cord, looking down with contempt.",
    "f2_raise": "Form 2, same framing (waist up, straight cut at the bottom): she raises a giant wooden ruler overhead with her left arm, so the red "
                "armband with the white shield crest on her left upper arm faces the viewer clearly.",
    "f2_guard": "Form 2, same framing (waist up, straight cut at the bottom): she crosses both arms in front of her chest in a guard, hiding the "
                "armband, her face cold and smug.",
    # form 3: she leans down over the yard; the camera is on the ground looking straight up
    "f3_face": "Form 3, seen from the ground looking straight UP at her: she leans down over the yard so her enormous upside-down-ish face fills the "
               "picture, her long hair hanging down on both sides like curtains, third eye open, mouth closed in a cruel smile; strong "
               "foreshortening.",
    "f3_scream": "Form 3, same framing as her face looking down at the viewer from above, but her mouth has turned into the bell of a giant brass "
                 "megaphone, wide open, screaming; third eye open.",
    "f3_hand": "Form 3: one giant hand reaching down toward the viewer from above, fingers spread, long red nails, strong foreshortening, the arm cut "
               "off by the top edge of the picture.",
}
for k, d in FORMS.items():
    JOBS[f"R36_b_{k}"] = [(f"art/raw/r36/b_{k}_{v}.png", [BOSS], BP + d + f" Variation {v}.") for v in "ab"]
