# Round 55 (docs/DESIGN.md「第 1 话」): the last two famous scenes that still had no pictures.
#   R55_pit_*:   the pit in the glasshouse floor (Sweet Home ⑦: someone falls into a hole ringed by ghosts and is hauled out with a rope):
#                the walls of the pit seen from inside (honey-soaked earth, roots, old bones, half-buried teacups), its floor; flat panels like
#                every place (job_specs54 rules), always rotten (no real version)
#   R55_paw:     the cat girl's paw reaching down into the pit from above to pull the view up (palm side, so no seal shows)
#   R55_armor:   the decorative armour that took the gelato-cone lance (Sweet Home: give the armour its lance and it steps aside): the same
#                armour as prop/ep1_garden2, now holding the lance upright, standing aside
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs28 import FLAT
from job_specs32 import NOFX

REF = "art/raw/r53/sc_fountain_a_x.png"
FLATREF = "art/raw/r31/wallL4.png"
STYLE = ("Reference image 1 is the concept painting of the rotten glasshouse above this pit: match its look exactly (painting technique, "
         "line work, colours, light, materials). Reference image 2 is an approved flat wall texture of this game: match how flat, clean and "
         "readable it is. ")
PIT = ("the inside wall of a deep round pit that opened in the floor of a rotting mansion glasshouse: damp earth soaked with dark honey and "
       "melted gelato, roots hanging down, old bones and broken teacups half buried in the earth, cracked marble floor slabs jutting out at "
       "the top edge, sticky drips running down, a few faint pale ghostly faces pressed into the earth like masks (no bodies, no text). "
       "Warm honey-amber light from above fading to deep amber shadow at the bottom; creepy but pretty (NOT dark green, NOT violet). ")
JOBS = {
    "R55_pit": [(f"art/raw/r55/pit_wall{i}.png", [REF, FLATREF], STYLE + FLAT + "The surface: one 3 m wide, 4.5 m tall section of " + PIT +
                 f"Version {i}: its own details. Portrait 2:3.", "OPAQUE") for i in (1, 2, 3, 4)] +
               [(f"art/raw/r55/pit_floor{i}.png", [REF, FLATREF], STYLE + FLAT.replace("front-on view", "top-down view looking straight down") +
                 "The surface: 3 m by 3 m of the bottom of that pit: honey mud, bones, shattered waffle cones, a lost lace glove, rose petals. "
                 f"Version {i}. Seamless and tileable on all four edges. Square 1:1.", "OPAQUE") for i in (1, 2)],
    "R55_paw": [(f"art/raw/r55/paw_{v}.png", ["art/ref/cat_sheet.png"], "Reference image 1 is the design of the white-haired cat girl: her right "
                 "arm is a big white fluffy cat-paw ghost arm with long red claws. Draw ONLY that arm, reaching straight DOWN from the top edge "
                 "of the picture toward the viewer as if into a pit to grab them: the wide white sleeve at the top edge, the big fluffy white "
                 "paw open with its PALM facing the viewer (pink paw pads, red claws spread), seen from below. The BACK of the paw must NOT be "
                 "visible (no seal, no symbol, no circle anywhere). Clean anime line art in the style of reference image 1, transparent "
                 f"background, nothing else, no text, no effects, no glow. Portrait 2:3. Variation {v}.") for v in "ab"],
    "R55_armor": [(f"art/raw/r55/armor_lance_{v}.png", ["art/raw/r53/sc_fountain_a.png", "public/content/base/assets/prop/ep1_garden2.webp"],
                   "Reference image 1 is the concept painting of the place: paint in EXACTLY its style. Reference image 2 is a decorative suit "
                   "of knight armour standing on its stand: draw the SAME armour (same shape, colours, enamel, size, stand), now holding a long "
                   "lance shaped like a gelato cone upright in its right gauntlet, the lance's foot resting on the stand, standing to "
                   "attention, its helmet turned a little to the side as if stepping aside to let someone pass. ONE single game prop seen from "
                   "the front at eye level, whole, centred, on a fully transparent background: no floor, no shadow, no people, no text. " +
                   NOFX + f"Variation {v}.") for v in "ab"],
}
