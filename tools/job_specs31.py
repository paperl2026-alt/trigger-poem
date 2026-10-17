# Round 31: the corridor in many versions (docs/DESIGN.md「美术不许偷懒复用」, ART「多版本」). R28 had one right wall repeated 8 times, two
# left walls taking turns, one floor, one ceiling, six decals over and over. Now: 8 new left-wall sections, 8 new right-wall sections,
# 3 more floors and ceilings, another end wall, and four decal sheets (24 decals). Same FLAT rules as R28 (tools/job_specs28.py).
# Every wall section must join any other side by side: same wainscot / skirting / top lines as the R28 section given as reference 2, and a
# plain pillar strip at both edges. Floors and ceilings keep the R28 layout (the import also blends their edges into the R28 tile).
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from job_specs28 import REF, STYLE, FLAT

JOIN = ("Reference image 2 is another section of the SAME corridor wall: keep EXACTLY its structure so the sections can be placed side by "
        "side in any order: the same height of the pale green lower wainscot and its top rail, the same wooden skirting board, the same "
        "ceiling molding line at the top, the same wall colour and the same light. At BOTH the left and the right edge there is a plain "
        "vertical cream concrete pillar strip about 4% of the picture width, identical on both sides. Do not copy its features: the features "
        "between the pillars are NEW, as described here: ")
GLASS = (" Paint every window PANE (the glass area where the outside would be seen) as solid flat pure magenta #FF00FF, nothing else magenta; "
         "window frames, sills and curtains stay normal.")
LEFT = {   # the classroom side of the corridor
    "wallL1": "the rear sliding door of a classroom (wooden, with a small glass window showing a dim classroom), a blank class name plate "
              "sticking out above it, a small red fire alarm bell, the rest plain plaster with a few scuff marks.",
    "wallL2": "a long cork bulletin board crowded with club recruitment posters (each poster only a cute drawing, no letters), pinned "
              "handouts and a school calendar grid with no numbers, a hand sanitizer bottle on a little shelf below.",
    "wallL3": "a glass trophy cabinet built into the wall, full of gold cups, plaques and folded pennants, a small framed photo of a team.",
    "wallL4": "a row of inner windows into a music room at head height (the glass shows a dim piano and music stands), under them a row of "
              "cubby shelves with indoor shoes and gym bags.",
    "wallL5": "the sliding door of a science lab with frosted glass, a red fire hose cabinet with a white door next to it, a fire "
              "extinguisher on the floor in front of it.",
    "wallL6": "a wide plain plaster wall with a big hand-painted mural of a sunflower field done by students, a little torn at one corner.",
    "wallL7": "a stainless steel drinking fountain and sink row against the wall, a long mirror above it, a mop and a bucket hanging on hooks.",
    "wallL8": "a wall of grey steel lockers (two rows), a few doors ajar, stickers on some, a forgotten umbrella hooked on one handle.",
}
RIGHT = {  # the window side, the panes keyed out (the outside panorama shows through)
    "wallR1": "two big windows with white aluminium frames and a thick sill, a pink curtain half drawn on the left window, a radiator below.",
    "wallR2": "two big windows, the right one slid half open, a cream curtain tied back, three small potted plants and a watering can on the "
              "sill, a radiator below.",
    "wallR3": "two big windows with beige roll blinds pulled half way down (the blinds are NOT magenta, only the uncovered glass is), a "
              "radiator below.",
    "wallR4": "one big window in the middle with a pink curtain on each side, a row of small stainless steel hand-washing sinks below it "
              "with soap nets hanging from the taps.",
    "wallR5": "two big windows, a round wall clock with no numbers on the pillar between them, strings of colourful origami cranes hanging "
              "down one window, a radiator below.",
    "wallR6": "two big windows, one pane cracked in a star pattern (the crack lines are white, the glass around them still magenta), a "
              "strip of tape across it, a radiator below.",
    "wallR7": "two big windows with a sheer white curtain blowing slightly inward on the right one, a fire escape pictogram sign (green "
              "running figure, no letters) above, a radiator below.",
    "wallR8": "two big windows, a stack of folded chairs leaning under the left one, a broom propped in the corner, a radiator below.",
}
FLOOR = ("Reference image 2 is this corridor's floor: keep EXACTLY its boards (same width, same direction from top to bottom, same honey "
         "colour, same polish) so this tile can sit next to it; only change the wear as described: ")
CEIL = ("Reference image 2 is this corridor's ceiling: keep EXACTLY its tile grid and the long fluorescent light fitting in the same place "
        "across the middle, so this tile can sit next to it; only change as described: ")
DECAL = ("Same painting style as reference image 1. A sprite sheet on a transparent background, 3 x 2 grid, one item per cell with empty "
         "space around it, flat front-on, no text, no letters. Six DIFFERENT items, each clearly not a copy of another: ")
JOBS = {
    "R31_left": [(f"art/raw/r31/{k}.png", [REF, "art/raw/r28/wallA.png"], STYLE + FLAT + JOIN + v, "OPAQUE") for k, v in LEFT.items()],
    "R31_right": [(f"art/raw/r31/{k}.png", [REF, "art/raw/r28/wallW.png"], STYLE + FLAT + JOIN + v + GLASS, "OPAQUE") for k, v in RIGHT.items()],
    "R31_flats": [
        ("art/raw/r31/floor2.png", [REF, "art/raw/r28/floor.png"], STYLE + FLAT.replace("front-on view", "top-down view looking straight down") + FLOOR +
         "a few black rubber heel scuffs and one strip of faded yellow tape across.", "OPAQUE"),
        ("art/raw/r31/floor3.png", [REF, "art/raw/r28/floor.png"], STYLE + FLAT.replace("front-on view", "top-down view looking straight down") + FLOOR +
         "one board a little darker and worn, a small metal drain plate, faint water rings.", "OPAQUE"),
        ("art/raw/r31/floor4.png", [REF, "art/raw/r28/floor.png"], STYLE + FLAT.replace("front-on view", "top-down view looking straight down") + FLOOR +
         "freshly waxed and extra glossy with warm reflections, a few scratches.", "OPAQUE"),
        ("art/raw/r31/ceil2.png", [REF, "art/raw/r28/ceil.png"], STYLE + FLAT.replace("front-on view", "view looking straight up") + CEIL +
         "one tube of the light is dark and broken, a small brown water stain on one tile.", "OPAQUE"),
        ("art/raw/r31/ceil3.png", [REF, "art/raw/r28/ceil.png"], STYLE + FLAT.replace("front-on view", "view looking straight up") + CEIL +
         "a square air vent grille in one tile and a round smoke detector.", "OPAQUE"),
        ("art/raw/r31/ceil4.png", [REF, "art/raw/r28/ceil.png"], STYLE + FLAT.replace("front-on view", "view looking straight up") + CEIL +
         "a sprinkler head, a speaker grille, one tile slightly pushed up and askew.", "OPAQUE"),
        ("art/raw/r31/end2.png", [REF, "art/raw/r28/end.png"], STYLE + FLAT +
         "The surface: the 3.2 m wide, 3 m tall end wall of a school corridor: a stairwell opening is NOT allowed; instead a big window in the "
         "upper half (paint the PANES as solid pure magenta #FF00FF), under it a glass display case with a model of the school and a "
         "row of potted plants, cream plaster, sunset light.", "OPAQUE"),
    ],
    "R31_decals": [
        ("art/raw/r31/dec_sigils.png", [REF, "art/raw/r28/decals.png"], DECAL +
         "six different dark violet evil eye sigils painted on a wall, smeared like wet paint: a single eye in a jagged diamond, three eyes "
         "in a triangle, an eye with rays like a sun, an eye inside a crescent, a spiral with an eye in the centre, an eye crying drips."),
        ("art/raw/r31/dec_banners.png", [REF, "art/raw/r28/decals.png"], DECAL +
         "six different tall hanging cloth banners in dark violet and crimson with evil eye emblems: a torn one, a long thin pennant, one "
         "with tassels, one burnt at the bottom, a pair of eyes, a swallow-tailed one."),
        ("art/raw/r31/dec_floor.png", [REF, "art/raw/r28/decals.png"], DECAL +
         "six different things lying on a floor seen from straight above: scattered test papers, an open school bag spilling pencils, a "
         "single indoor shoe, a broken pair of glasses, a pool of glowing violet goo, a trail of goo footprints."),
        ("art/raw/r31/dec_wall.png", [REF, "art/raw/r28/decals.png"], DECAL +
         "six different marks on a wall seen front-on: glowing pink cracks spreading from a point, violet goo dripping down, a torn poster "
         "hanging by one pin, deep claw scratches, a splash of violet goo, a cluster of small eye sigils like a rash."),
    ],
}
