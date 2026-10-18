# Round 56 (docs/DESIGN.md「第 1 话」, redone 2026-10-18 after the user's round-13 notes): one route through the mansion, the story told
# plainly, one turn only (lightly corrupted things first, then the house rots for good), a painter's studio where the lady's portraits
# come alive one by one.
#   R56_page_<id>:   comic pages (turn = the turning-around ghoul on its own page; nursery; fall = into the oven and down; studio = the veiled
#                    canvases unveiled; merge = the four shadows flow back and the lady steps out of one painting), 3 candidates each
#   R56_m_<id>:      three lightly corrupted small things (gelato scoop, teacup, lace doily), 4 versions each (3 used)
#   R56_shade_<id>:  the studio's four shadows (hostess, mourner, mother, bride), each its own look and attack, 3 candidates each
#   R56_<set>_concept: the nursery's and the studio's look (rotten only: the house never turns back), then R56b_* (job_specs56b.py) the
#                    panels, covers and props painted after them
#   R56_portrait<n>: the lady's four portraits in the studio + each one emptied (the shadow has stepped out), R56_door<n>: two more doors
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs53 import MON, BASE
from job_specs41 import CATD
from job_specs47 import STYLE as PAGE_STYLE
from job_specs53b import PINKD2, DOORSTYLE

CAT = "art/ref/cat_sheet.png"
GHOUL = "art/raw/r53/m_ghoul_a.png"
JOBS = {}
R1 = "Reference images: 1 = the white-haired cat girl's design; keep her look exactly. "

# ---------------------------------------------------------------- comic pages
PAGES = {
    "turn": ([CAT, "art/raw/r53/sc_shop_a.png", GHOUL], R1 + "Reference image 2 = the bright gelato cafe, 3 = the gelato ghoul. ",
        "Layout: three equal tall panels side by side. Reading order: left to right. A famous horror-film turning-around scene, played slowly. "
        "PANEL 1: inside the bright, cute gelato cafe of reference image 2, seen from behind the two girls (" + CATD + " and " + PINKD2 + "), "
        "small in the foreground with their backs to the reader; far ahead, behind the glass counter, a figure crouches on the floor with its "
        "BACK to them, hunched over, eating out of a big gelato tub (frilly maid headband in honey-coloured hair, an apron bow); the lettering "
        "'…?'. "
        "PANEL 2: a closer shot of the crouching figure from behind: it has STOPPED eating, its spoon frozen in the air, its head lifting a "
        "little; drops of gelato fall; a silent panel. "
        "PANEL 3: a close-up of the figure's head turned over its shoulder straight at the reader: the rotten melted gelato face of the "
        "monster in reference image 3, one eye sliding down the cheek, a spoon between its teeth; heavy black screentone shadows; the "
        "lettering 'ゾッ'."),
    "nursery": ([CAT, "art/raw/r53/m2_doll_a.png", "art/raw/r53/sc_gallery_a_x.png"], R1 + "Reference image 2 = the antique porcelain doll monster "
        "(its style of doll), 3 = the rotten mansion's look. ",
        "Layout: a 2 x 2 grid of four equal rectangular panels. Reading order: top left, top right, bottom left, bottom right. A child's "
        "bedroom in the rotten mansion, sad and eerie, warm candle light (NOT dark green, NOT violet). "
        "PANEL 1: the two girls (" + CATD + " and " + PINKD2 + ") push open a small pastel door with a painted moon on it and peek in, "
        "uneasy. "
        "PANEL 2: the room: a small white child's bed with a lace canopy; around it, SITTING IN A CIRCLE on little chairs, a dozen antique "
        "dolls in dusty party dresses, all facing the bed as if keeping the sleeping child company; a music box on the floor plays (small "
        "musical notes drawn in the air); toys everywhere. "
        "PANEL 3: a close-up of three of the dolls' faces: under the cracked porcelain, each face is a CRYING real child's face with tears "
        "running down (they were children once); the lettering 'たすけて…' written small and faint in the air. "
        "PANEL 4: over the shoulder of the white-haired cat girl (her back to the reader): on the wall above the bed hangs an old framed "
        "photograph of a young mother hugging her little daughter, and under it a small pink diary lies open on the bed; the cat girl's fur "
        "paw reaches for the diary (palm side, no symbol on the paw)."),
    "fall": ([CAT, "art/raw/r53/sc_oven_a_x.png", "art/raw/r55/pit_wall2.png"], R1 + "Reference image 2 = the rotten kitchen with its brick oven, 3 "
        "= the sticky honey tunnel underneath. ",
        "Layout: three rows. Row 1: one wide panel. Row 2: two equal panels. Reading order: row 1, row 2 left, row 2 right. "
        "PANEL 1 (wide): in the rotten kitchen of reference image 2, the huge brick oven's round black iron door swings open BY ITSELF "
        "with a burst of hot amber light and a howling wind sucking inward; flour, crayon drawings and copper pans fly toward it; the two "
        "girls (" + CATD + " and " + PINKD2 + ") are pulled off their feet toward the opening, hair and skirts blown forward; the "
        "lettering 'ゴォォォ'. "
        "PANEL 2: inside the oven: there is NO back wall, only a bottomless dark shaft dripping with honey; the two girls fall down it, "
        "screaming, seen from below. "
        "PANEL 3: they land with a sticky splash in a tunnel of dripping honey and earth like reference image 3, honey everywhere, pink "
        "light ahead; the lettering 'ベチャッ'."),
    "studio": ([CAT, "art/raw/r53/sc_hall_a_x.png", "art/raw/r53/boss_f1_e.png"], R1 + "Reference image 2 = the rotten mansion's look, 3 = the lady "
        "of the house as a monster (her colours, lace veil and cake-like gown). ",
        "Layout: a 2 x 2 grid of four equal rectangular panels. Reading order: top left, top right, bottom left, bottom right. "
        "PANEL 1: the two girls (" + CATD + " and " + PINKD2 + ") step into a large old PAINTER'S STUDIO: a high skylight, easels, jars of "
        "brushes, paint-stained floor, and four huge canvases standing around the room, each covered by a dusty white sheet. "
        "PANEL 2: all four sheets slide off at once in a gust; the sound 'バサッ'. "
        "PANEL 3: the four uncovered paintings side by side, all portraits of the same elegant lady of the house in four moods: a hostess "
        "holding a silver tray of gelato, a mourner in a black veil, a mother cradling a doll, a bride in a long veil; their painted eyes "
        "all turn toward the girls. "
        "PANEL 4: a close-up of the hostess portrait: a long black SHADOW of the lady peels itself out of the painting and steps onto the "
        "floor, leaving the canvas empty behind it; the lettering 'ズ…'."),
}
for k, (imgs, refs, d) in PAGES.items():
    JOBS[f"R56_page_{k}"] = [(f"art/raw/r56/page_{k}_{v}.png", imgs, PAGE_STYLE + refs + d + f" Variation {v}.", "OPAQUE") for v in "abc"]

# ---------------------------------------------------------------- lightly corrupted small things (before the house turns)
LIGHT = ("THIS ONE IS ONLY LIGHTLY CORRUPTED: a small thing of the cafe that has just come alive and is still mostly cute and clean, "
         "pastel and shiny, only a little wrong (too many teeth, eyes in the wrong places, a drip of something dark), much less grotesque "
         "than a full monster; small (about knee height). ")
SMALL = {
    "scoop": ("walker that waddles at you and nips", "GELATO SCOOP CRITTER: a single round scoop of pastel gelato (strawberry, pistachio or "
              "vanilla) on a short wafer cone used as a little body, two tiny legs in frilly socks and Mary-Jane shoes, big glossy eyes with "
              "lashes, a small mouth with a row of tiny sharp teeth, a cherry like a hair bow.",
              "Poses, top row: 1 waddling, one leg up, 2 waddling, the other leg, 3 crouched, about to jump; bottom row: 4 jumping at the "
              "viewer, 5 biting right in front of the viewer, mouth wide, 6 hurt, scoop squashed, eyes squeezed shut."),
    "cup": ("walker that hops at you", "TEACUP HOPPER: a porcelain teacup with a lid, on its saucer like a skirt, hopping on two little legs in "
            "white stockings; a pair of eyes peeks out from under the lid, the handle is a curled ponytail with a ribbon, a little steam of "
            "tea drips like drool (no smoke effect).",
            "Poses, top row: 1 standing, 2 mid-hop in the air, 3 crouched before a hop; bottom row: 4 leaping at the viewer, 5 the lid "
            "flipped open like a mouth full of sugar-cube teeth right in front of the viewer, 6 hurt, a crack in the cup."),
    "doily": ("small flyer that swoops at you", "LACE DOILY GHOST: a round white lace doily floating like a small ghost or jellyfish, its "
              "frilly edge fluttering, two big eyes and a tiny smile in its middle, ribbon streamers trailing like tentacles, a little "
              "cherry on top.",
              "Poses, top row: 1 floating, edges up, 2 floating, edges down, 3 idle, coy, tilting; bottom row: 4 curling up to dive "
              "(winding up), 5 diving at the viewer, mouth open, 6 hurt, the lace torn."),
}
for k, (beh, d, poses) in SMALL.items():
    JOBS[f"R56_m_{k}"] = [(f"art/raw/r56/m_{k}_{v}.png", MON, BASE + LIGHT + f"The monster ({beh}): " + d + " " + poses +
                           f" Variation {v}: its own design details, a clearly different take from the other variations.") for v in "abcd"]

# ---------------------------------------------------------------- the four shadows of the studio (one small boss each)
SHADE = ("THE MONSTER is a living SHADOW that has stepped out of a portrait of the lady of the house: flat like a silhouette cut from "
         "deep burgundy-black paper but alive, with a thin uneven honey-gold rim along its whole edge (drawn, not glowing), two small pale "
         "eyes, the hem of its clothes melting into sticky drips; elegant and terrifying, much taller than a person. ")
SHADES = {
    "hostess": ("throws volleys of things", "THE HOSTESS: her shadow holds a silver serving tray piled with teacups and gelato coupes high on "
                "one hand, a lace cap, a long apron-gown.",
                "Poses, top row: 1 standing, tray up, 2 gliding sideways, 3 bowing coldly (idle); bottom row: 4 drawing the tray back "
                "(winding up), 5 flinging the cups and coupes at the viewer in a fan, 6 hurt, the silhouette torn."),
    "mourner": ("hovers and sends out a wail that can only be hidden from", "THE MOURNER: her shadow wears a long black mourning veil to the "
                "floor, floats above the ground, holds a black handkerchief, her pale eyes weeping long white streaks.",
                "Poses, top row: 1 floating, 2 floating, veil swirling, 3 bowed in grief (idle); bottom row: 4 throwing her head back, "
                "mouth opening wide (winding up a wail), 5 wailing straight at the viewer, the veil blown back (draw no sound waves), 6 hurt."),
    "mother": ("calls little dolls and throws them", "THE MOTHER: her shadow cradles a porcelain doll in her arms like a baby, rocking it, more "
               "small dolls hang from her skirts on strings.",
               "Poses, top row: 1 rocking the doll, 2 gliding, 3 singing to the doll (idle); bottom row: 4 holding the doll up high (winding "
               "up), 5 throwing dolls at the viewer, 6 hurt."),
    "bride": ("rushes at you across the room", "THE BRIDE: her shadow wears a wedding veil and a very long train that pours behind her like "
              "black syrup, holding a wilted bouquet; long thin arms.",
              "Poses, top row: 1 standing, veil lowered, 2 walking, train flowing, 3 lifting the veil (idle); bottom row: 4 crouching, about "
              "to rush (winding up), 5 rushing straight at the viewer, arms reaching, very close, 6 hurt."),
}
for k, (beh, d, poses) in SHADES.items():
    JOBS[f"R56_shade_{k}"] = [(f"art/raw/r56/shade_{k}_{v}.png", MON + ["art/raw/r53b/m_shadow_a.png"], BASE.replace("THE MONSTER is", "(Reference image 4 "
        "is this game's shadow monster: the same kind of silhouette.) THE MONSTER is") + SHADE + f"The monster ({beh}): " + d + " " + poses +
        f" Variation {v}: its own design details.") for v in "abc"]

# ---------------------------------------------------------------- the nursery and the studio: their look first (panels follow in 56b)
CONCEPT = ("Concept painting for one location of a cute Japanese bishoujo rail-shooter game. Paint in EXACTLY the style of reference image 1 "
           "(painting technique, line work, colour handling, level of detail, the same rotten-honey corruption). Landscape 3:2. The view is "
           "from about 1.1 m above the floor, looking straight down the length of the room, the far wall in the centre. Rich in props, "
           "nothing blocking the centre of the view. No people, no characters, no monsters, no text. The room has rotted like the rest of "
           "the house: honey and melted gelato dripping, pastel mould, peeling wallpaper, sugar cobwebs, candle light; creepy but pretty, "
           "warm honey-amber and sour pink, NOT dark green, NOT violet. ")
JOBS["R56_nursery_concept"] = [(f"art/raw/r56/sc_nursery_{v}.png", ["art/raw/r53/sc_gallery_a_x.png"], CONCEPT + "THE ROOM: a little girl's "
    "nursery in the old mansion: pastel striped wallpaper with painted moons and rabbits, a small white bed with a lace canopy at the far end, "
    "shelves full of antique dolls along both walls, a rocking horse, a dollhouse, a music box, toy blocks, a small round tea-party table "
    f"with tiny chairs, a tall window with ruffled curtains. Variation {v}.", "OPAQUE") for v in "ab"]
JOBS["R56_studio_concept"] = [(f"art/raw/r56/sc_studio_{v}.png", ["art/raw/r53/sc_hall_a_x.png"], CONCEPT + "THE ROOM: an old painter's studio "
    "deep under the mansion: a high sloping skylight of iron and glass (the glass dirty and amber, nothing visible through it), wooden "
    "floor splattered with paint, easels, jars of brushes, rolls of canvas, a paint table, a chaise longue for a model, and along the walls "
    f"big empty gilded picture frames and canvases leaning against each other. Variation {v}.", "OPAQUE") for v in "ab"]

PORTRAIT = ("A large framed oil portrait in an ornate gilded frame, seen straight on (orthographic, no perspective, transparent background "
            "around the frame), portrait orientation 2:3. The painting: the elegant lady of an old Western mansion, honey-blonde hair, a "
            "pale gentle face, painted in soft romantic oils; the paint is a little bubbled and dripping honey at the bottom of the frame. "
            "No text. Her pose: ")
POSES = {1: "a hostess in a cream gown and lace cap, holding a silver tray with gelato coupes, smiling politely",
         2: "a mourner in a black dress and a long black veil, holding a handkerchief, tears on her cheeks",
         3: "a mother in a soft pink dress cradling a porcelain doll like a baby, looking down at it lovingly",
         4: "a bride in a white wedding dress and long veil, holding a bouquet of roses, a faraway look"}
for n, d in POSES.items():
    full = f"art/raw/r56/portrait{n}.png"
    JOBS[f"R56_portrait{n}"] = [(full, ["art/raw/r53b/fresco5.png"], PORTRAIT + d + "."),
                                (f"art/raw/r56/portrait{n}_x.png", [full], "Reference image 1 is a framed portrait. Repaint the SAME frame exactly "
                                 "(same size, same gilding, same position), but the canvas inside is now EMPTY: the figure of the lady is gone, "
                                 "leaving only the painted background with a lady-shaped blank, torn, scorched outline where she stood, and "
                                 "honey dripping out of the frame. Transparent background around the frame. No text.")]

for n, ref, d, leaves in ((8, "art/raw/r56/sc_nursery_a.png", "a small pastel nursery door painted with a crescent moon and stars, a little "
                           "brass doorknob, a paper sign shape on it WITHOUT any writing, scratches and honey drips", 1),
                          (9, "art/raw/r53/sc_hall_a_x.png", "a heavy old iron-bound wooden door at the end of an earthen honey tunnel, "
                           "paint-stained, a painter's palette nailed to it, roots and honey around the frame", 1)):
    steps = []
    for v in "a":
        frame = f"art/raw/r56/door{n}_frame_{v}.png"
        steps.append((frame, [ref], DOORSTYLE + "Landscape 3:2. THE DOORWAY of " + d + ", seen straight on, centred, filling most of the "
                      "picture, with the wall around it. The DOOR ITSELF IS NOT THERE: the doorway opening is filled with SOLID FLAT PURE BLACK "
                      "(#000000), a clean shape with crisp edges, nothing drawn inside it.", "OPAQUE"))
        steps.append((f"art/raw/r56/door{n}_leaf_{v}.png", [ref, frame], DOORSTYLE + "Reference image 2 shows a doorway whose opening is solid "
                      "black. Draw ONLY THE CLOSED DOOR that fits exactly into that opening: " + d + ", one leaf, seen straight on, exactly the "
                      "shape of the black opening, nothing else. Transparent background."))
    JOBS[f"R56_door{n}"] = steps
