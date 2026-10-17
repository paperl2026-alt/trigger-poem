# Round 32: clean art again, by the new rules (docs/ART.md: style from reference pictures, no light direction, NO effects drawn in;
# glow / goo shine / sparks / sound waves are the program's job).
#   R32_cov*: covers (R30 had glowing cracks and goo drawn in): twelve objects, the corridor's own wall pictures as the style reference.
#   R32_dec, R32_wall: the corridor decals as plain base shapes (R31's glowed), and the left wall R31 lost to a tool error.
#   R32_m*: every prologue monster in two more versions (docs/ART.md 多版本): the same kind, a different individual, the same six poses in
#   the same order as its R23 sheet, no attack effects drawn.
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from job_specs28 import FLAT
from job_specs31 import JOIN, LEFT
from job_specs23 import BASE as MBASE

WALLS = ["art/raw/r31/wallL4.png", "art/raw/r31/wallR2.png"]
NOFX = ("NO effects of any kind drawn in: no glow, no light rays, no sparkles, no shine highlights, no magic, no goo, no smoke, no motion "
        "lines; the game adds all effects itself. ")
COVER = (
    "Reference images 1 and 2 are pictures of this game's corridor: paint in EXACTLY their style (the same painting technique, line work, "
    "colours and level of detail). "
    "Draw ONE single game asset: a BARRICADE an anime girl crouches at in a third-person cover shooter. ALL rules are mandatory: "
    "(1) a perfectly straight-on front view of its long side, no top surface visible, no perspective, the top edge horizontal; "
    "(2) wide and chunky, about twice as wide as tall, one solid mass with NO holes or gaps to see through, a flat bottom edge; "
    "(3) it fills the picture from the left edge to the right edge, its bottom on the bottom edge, a 3:2 landscape picture; "
    "(4) fully transparent background, nothing else at all: no floor, no shadow, no wall, no people, no text, no letters, no numbers; "
    "(5) a bit scuffed and worn from school life, clean otherwise. " + NOFX + "THE OBJECT: ")
OBJ = {
    "desks": "three classroom desks tipped onto their sides and pushed together into one wall, the wooden desktops facing the viewer.",
    "lockers": "a grey steel two-door student locker unit lying on its long side, its plain back panel facing the viewer, dented, a few stickers.",
    "shoebox": "a long wooden school shoe cabinet lying on its side, its plank back panel facing the viewer, metal corner brackets.",
    "cart": "a school cleaning cart seen from the side, its body hidden behind a heavy grey canvas cover hanging to the floor, a bucket rim "
            "just showing above.",
    "vault": "a wooden gym vaulting box with five stacked tiers seen from the long side, a white padded leather top.",
    "mats": "a stack of three thick blue gym mats folded and piled flat, tied with a white strap, seen from the long side.",
    "bookcase": "a wooden classroom bookcase lying on its side, its plain solid back panel facing the viewer, book spines peeking over the top.",
    "lectern": "the teacher's big wooden lectern desk turned over on its side, its solid front panel facing the viewer.",
    "boxes": "a wall of taped brown cardboard moving boxes stacked two high and three wide, some labelled with blank stickers.",
    "piano": "an old upright school piano seen from the back: the plain wooden back panel with its bracing, the top edge straight.",
    "sofa": "a worn teachers' lounge sofa seen from the back: the padded backrest in faded green vinyl, a crocheted blanket over it.",
    "planter": "a long wooden flower planter box full of low trimmed hedge shrubs, the box side facing the viewer, the shrub tops even.",
}
DEC = ("Reference images 1 and 2 are pictures of this game's corridor: paint in EXACTLY their style. A sprite sheet on a transparent "
       "background, 3 x 2 grid, one item per cell with empty space around it, flat front-on, no text, no letters. " + NOFX +
       "Plain, matte, flat colour base shapes only. Six DIFFERENT items: ")
JOBS = {
    "R32_cov1": [(f"art/raw/r32/c_{k}.png", WALLS, COVER + OBJ[k]) for k in ["desks", "lockers", "shoebox", "cart"]],
    "R32_cov2": [(f"art/raw/r32/c_{k}.png", WALLS, COVER + OBJ[k]) for k in ["vault", "mats", "bookcase", "lectern"]],
    "R32_cov3": [(f"art/raw/r32/c_{k}.png", WALLS, COVER + OBJ[k]) for k in ["boxes", "piano", "sofa", "planter"]],
    "R32_dec": [
        ("art/raw/r32/dec_sigils.png", WALLS, DEC + "six different dark violet evil eye sigils painted on a wall like wet paint: a single eye in a "
         "jagged diamond, three eyes in a triangle, an eye with spikes like a sun, an eye inside a crescent, a spiral with an eye in the centre, "
         "an eye with paint drips."),
        ("art/raw/r32/dec_banners.png", WALLS, DEC + "six different tall hanging cloth banners in dark violet and crimson with an eye emblem: a torn "
         "one, a long thin pennant, one with tassels, one ragged at the bottom, one with a pair of eyes, a swallow-tailed one."),
        ("art/raw/r32/dec_floor.png", WALLS, DEC + "six different things lying on a floor seen from straight above: scattered test papers, an open "
         "school bag spilling pencils, a single indoor shoe, a broken pair of glasses, a puddle of dark violet goo (matte, flat colour), a "
         "trail of goo footprints."),
        ("art/raw/r32/dec_wall.png", WALLS, DEC + "six different marks on a wall seen front-on: dark crack lines spreading from a point, dark violet "
         "paint dripping down, a torn poster hanging by one pin, deep claw scratches, a splash of dark violet paint, a cluster of small eye "
         "sigils like a rash."),
    ],
    "R32_wall": [("art/raw/r32/wallL1.png", ["art/ref/corridor_concept.png", "art/raw/r28/wallA.png"],
                  "Reference image 1 shows the painting style of this game; copy only its style. " + FLAT + JOIN + LEFT["wallL1"], "OPAQUE")],
}

# ---- monsters: two more versions of each, the same six poses in the same order as the R23 sheet
MREF = "art/ref/monster_ref.webp"
MV = ("Reference image 2 is the existing sprite sheet of this monster KIND. Draw the SAME KIND of monster as a DIFFERENT INDIVIDUAL: "
      "instantly recognisable as the same kind and the same role in a fight, but clearly not a copy (different materials, colours, "
      "number of legs or parts, hair, accessories, as described). Keep EXACTLY the six poses of reference image 2 in the same order and the "
      "same 3 x 2 layout, at the same scale. " + NOFX + "Draw only the monster in every pose: attacks (thrown objects, sound waves, shards, "
      "papers flying) are NOT drawn, the game draws them. The new individual: ")
MON = {
    "desk": ["made of old dark-varnished wooden desks and a wooden chair, only four legs ending in white canvas indoor shoes with pink toe "
             "caps, lid-jaws lined with wooden rulers as teeth, two thick black braids hanging from the drawers tied with pink ribbons, one "
             "huge lashed eye in the top drawer, a cardigan sleeve wrapped around it.",
             "made of bright blue plastic-and-steel desks, eight thin legs ending in glossy red loafers with knee socks, jaws lined with "
             "broken protractors, wavy blonde hair spilling from the gaps, heart stickers, a big bow on its back, many small eyes peeking "
             "from pencil cases."],
    "board": ["a rolling whiteboard on two long legs in sheer stockings and navy pumps, the only face drawn in blue and red marker, arms "
              "of telescopic pointers with manicured nails, a skirt of magnet-pinned handouts, hair of hanging marker cords.",
              "a small old easel chalkboard on three spindly easel legs in fishnet tights and kitten heels, a winking chalk face, arms of "
              "chalk-holder tongs, a pleated skirt of stacked chalk erasers, hair of hanging strings with paper tags."],
    "paper": ["a ghost of pink and blue sticky notes and love letters, sealed envelopes with heart seals as its eyes, ribbon hair, a frilled "
              "skirt of folded origami.",
              "a ghost of torn manga pages with screentone patterns (no readable text, only scribbles), empty speech-balloon shapes as its "
              "eyes, a long scarf of film strip, hair of curled paper streamers."],
    "shoe": ["a short wide wooden shoe cabinet on six legs in striped stockings and ballet flats, doors as eyelids over blue eyes, a mouth "
             "with rows of sneakers as teeth, two hair buns made of rolled gym socks.",
             "a tall grey steel locker on two long legs in black tights and platform boots, one door a big eye with red lashes, a mouth "
             "slot full of keys like teeth, long hair of tangled jump ropes, a name tag earring."],
    "horn": ["a cluster of white plastic loudspeaker boxes held by a body of coiled phone cords, two coiled-cord twin tails with polka-dot "
             "bows, lips inside the largest speaker, a microphone stand leg in a white stocking.",
             "one giant old horn speaker on a pole like a flower stem, its bell framed by petals of smaller horns, the pole wrapped in "
             "frills like a dress, cables as long wavy hair, lips deep inside the bell."],
    "frame": ["a cluster of hand mirrors and compact mirrors held together by pearl necklaces, each mirror showing one eye, a hairbrush "
              "tail, a lace veil.",
              "a cluster of gold graduation-photo frames and rolled diplomas, the photos showing parts of the same smile (mouths only), "
              "ribbons and a mortarboard tassel."],
}
for k, vs in MON.items():
    JOBS[f"R32_m_{k}"] = [(f"art/raw/r32/m_{k}_{chr(98 + i)}.png", [MREF, f"art/raw/r23/{k}.png"], MBASE + MV + v) for i, v in enumerate(vs)]
