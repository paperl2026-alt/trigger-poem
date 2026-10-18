# Round 56b (docs/DESIGN.md「第 1 话」, redone 2026-10-18): the nursery's and the painter's studio's flat panels, painted after the concepts
# picked from R56 (art/raw/r56/sc_nursery_a.png, sc_studio_a.png). The house never turns back once it has rotted, so these two places have
# their rotten look only (no _x pairs). Plus covers and props for them and for the honey tunnel (the pit, now three stops long), and the
# comic page of the four shadows flowing back and the lady stepping out of the painting.
#   nursery 4.5 x 3 (bay 4.5: 3:2, end 3:2) / studio 9 x 6 (bay 6: 1:1, end 3:2)
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs54 import STYLE, FLAT, DOWN, UP, FLATREF, SHAPE, shape, COVER, PROP
from job_specs41 import CATD
from job_specs47 import STYLE as PAGE_STYLE
from job_specs53b import PINKD2

CONCEPT = {"nursery": "art/raw/r56/sc_nursery_a.png", "studio": "art/raw/r56/sc_studio_a.png", "tunnel": "art/raw/r55/pit_wall2.png"}
ROTTEN = (" The room has rotted like the rest of the house, exactly as in reference image 1: honey and melted gelato dripping, peeling "
          "wallpaper, pastel mould, sugar cobwebs, candle light; creepy but pretty, warm honey-amber and sour pink, NOT dark green, NOT violet.")
PLACES = {
    "nursery": dict(W=4.5, h=3, bay=4.5,
        wall="a little girl's nursery in the old mansion: pastel pink-and-cream striped wallpaper painted with small moons and rabbits, a "
             "white wainscot",
        L=["shelves full of antique porcelain dolls in party dresses sitting in rows, all facing the room",
           "a tall window with ruffled pink curtains (the glass foggy and amber, nothing visible outside), a window seat with plush toys",
           "a painted mural of a crescent moon and rabbits jumping over clouds, a small wall lamp with a frilled shade",
           "a white dresser with a music box and an oval mirror on it, a child's crayon drawings pinned above it (no text)",
           "a tall wardrobe painted with roses, one door open a crack, only darkness inside",
           "shelves of stuffed animals and a row of tiny shoes on the bottom shelf"],
        R=["a dollhouse on a low table against the wall, toy blocks around it",
           "a tall window with lace curtains (the glass foggy and amber, nothing visible outside), a hanging mobile of stars",
           "more shelves of porcelain dolls, some with cracked faces, all facing the room",
           "a small fireplace with a lace-trimmed mantel and a clock, a little rocking chair beside it",
           "a coat rack with little dresses and bonnets hanging on it",
           "a closed small closet door, a child's height marks scratched on its frame (only short lines, no numbers)"],
        floor="a faded pink floral carpet over old wooden floorboards, a few toy blocks and doll shoes lying on it",
        ceil="a pale blue ceiling painted with small stars, little clouds and a crescent moon, faded and water-stained",
        end=["the far wall: a small white child's bed with a lace canopy against the wall, and above it a big framed sepia photograph of a "
             "young mother hugging her little daughter, both smiling",
             "the far wall: the small canopy bed between two tall windows with pink curtains drawn, a big framed sepia photograph of a "
             "young mother and her little daughter above the bed"]),
    "studio": dict(W=9, h=6, bay=6,
        wall="an old painter's studio deep under the mansion: tall walls of dark panelled wood and faded rose plaster splattered with paint",
        L=["a tall arched window of dirty amber glass (nothing visible through it), a paint-splattered ladder leaning on the wall",
           "canvases leaning against the wall several deep, their painted sides turned to the wall (only their backs and stretchers show)",
           "shelves of paint jars, brushes in pots, plaster busts and rolled canvases",
           "a long bare stretch of splattered wall with an empty picture rail and hooks",
           "a tall cabinet of pigment jars and a stone sink stained with every colour",
           "charcoal sketches of a lady's hands and face pinned up all over the wall, overlapping (no text)"],
        R=["a tall arched window of dirty amber glass (nothing visible through it), a long faded curtain on a rail",
           "a model's low platform against the wall with a draped velvet cloth and a cushion",
           "a long bare stretch of splattered wall with an empty picture rail and hooks",
           "stacks of empty gilded picture frames leaning against the wall",
           "plaster casts of a horse's head and of classical vases under draped dust sheets",   # (a woman's statue was refused)
           "a coat stand with a painter's smock and a wide lady's hat, a tall mirror beside it"],
        floor="old wooden floorboards splattered with paint of every colour, dried drips of honey between the boards",
        ceil="a high skylight of black iron frames and dirty amber glass panes (nothing visible through the glass), cobwebs in the corners",
        end=["the far wall of the studio: a HUGE EMPTY gilded picture frame, taller than a person, hanging in the middle over a low platform, "
             "its canvas blank and stained with honey, easels and candles on both sides",
             "the far wall of the studio: the same HUGE EMPTY gilded picture frame in the middle, dusty sheets fallen at its foot, candles"]),
}
FLATR = STYLE.replace("Reference image 1 is the concept painting of this place", "Reference image 1 is the concept painting of this room")
JOBS = {}


def one(k, name, view, desc, shp):
    return (f"art/raw/r56/{k}_{name}.png", [CONCEPT[k], FLATREF], FLATR + view + "The surface: " + desc + " " + shp + ROTTEN, "OPAQUE")


for k, P in PLACES.items():
    wall = lambda d: f"one {P['bay']:.2g} m wide, {P['h']:.2g} m tall section of the wall of {P['wall']}: {d}."
    for side in "LR":
        steps = [one(k, f"wall{side}{i}", FLAT, wall(d), shape(P["bay"], P["h"])) for i, d in enumerate(P[side], 1)]
        JOBS[f"R56b_{k}_{side}a"], JOBS[f"R56b_{k}_{side}b"] = steps[:3], steps[3:]
    JOBS[f"R56b_{k}_floor"] = [one(k, f"floor{i}", DOWN, f"{P['W']:.2g} m by {P['W']:.2g} m of the floor: {P['floor']}. Version {i}: its own "
                                   "details. Seamless and tileable on all four edges.", SHAPE["1:1"]) for i in (1, 2, 3)]
    JOBS[f"R56b_{k}_ceil"] = [one(k, f"ceil{i}", UP, f"{P['W']:.2g} m by {P['W']:.2g} m of the ceiling: {P['ceil']}. Version {i}: its own "
                                  "details. Seamless and tileable on all four edges.", SHAPE["1:1"]) for i in (1, 2, 3)]
    JOBS[f"R56b_{k}_end"] = [one(k, f"end{i}", FLAT, f"the {P['W']:.2g} m wide, {P['h']:.2g} m tall end wall of the room: {d}.",
                                 shape(P["W"], P["h"])) for i, d in enumerate(P["end"], 1)]

# ---------------------------------------------------------------- covers (docs/ART.md 掩体: every one different in one episode)
COVERS = {
    "nursery": ["a white toy chest painted with rabbits and moons, lid closed, seen from its long side",
                "a low white bookcase packed with picture books and plush toys, seen from the front",
                "a long cushioned window-seat bench with a frilly pink skirt down to the floor",
                "a toy play kitchen counter painted pastel, seen from the front, its little oven door closed"],
    "studio": ["a long paint table with a stained cloth hanging to the floor, jars and brushes on top",
               "a model's chaise longue in faded rose velvet seen from the back",
               "a stack of big canvases leaning together, their wooden backs and stretchers facing the viewer",
               "a heavy wooden crate for shipping paintings, iron corners, no writing"],
    "tunnel": ["a fallen slab of earth and tree roots dripping with honey",
               "a broken kitchen dresser that fell down the shaft, lying on its side, its back facing the viewer, honey over it",
               "a mound of giant broken honeycomb chunks",
               "a heap of broken toys, bones and wafer pieces stuck together with honey"],
}
for k, objs in COVERS.items():
    JOBS[f"R56b_cover_{k}"] = [(f"art/raw/r56/cover_{k}{i}.png", [CONCEPT[k]], COVER + o) for i, o in enumerate(objs, 1)]

# ---------------------------------------------------------------- props (they stand in the room and can be shot to pieces)
PROPS = {
    "nursery": ["a rocking horse painted white with a pink mane and a ribbon bridle",
                "three little chairs in a half circle with an antique porcelain doll sitting on each, seen from behind",
                "a little round tea-party table with tiny teacups and a teddy bear guest on a chair"],
    "studio": ["a wooden easel with a big canvas covered by a dusty white sheet",
               "a tall brass candelabra with dripping candles",
               "a painter's taboret cart with palettes, tubes of paint and brushes"],
    "tunnel": ["a huge chunk of honeycomb standing on end, dripping honey",
               "a fallen copper pot and a sack of flour half sunk in a puddle of honey"],
}
for k, objs in PROPS.items():
    JOBS[f"R56b_prop_{k}"] = [(f"art/raw/r56/prop_{k}{i}.png", [CONCEPT[k]], PROP + o) for i, o in enumerate(objs, 1)]

# ---------------------------------------------------------------- the four shadows flow back; the lady steps out of the painting
CAT = "art/ref/cat_sheet.png"
JOBS["R56b_page_merge"] = [(f"art/raw/r56/page_merge_{v}.png", [CAT, CONCEPT["studio"], "art/raw/r53/boss_f1_e.png", "art/raw/r56/portrait1_x.png"],
    PAGE_STYLE + "Reference images: 1 = the white-haired cat girl's design; keep her look exactly. 2 = the rotten painter's studio, 3 = the "
    "lady of the house as a monster (her colours, lace veil and cake-like gown), 4 = one of the emptied portraits. "
    "Layout: a 2 x 2 grid of four equal rectangular panels. Reading order: top left, top right, bottom left, bottom right. "
    "PANEL 1: in the studio of reference image 2, four defeated tall shadow-women melt into puddles of black syrup on the paint-stained "
    "floor; the two girls (" + CATD + " and " + PINKD2 + ") stand panting in the foreground, seen from behind. "
    "PANEL 2: the four puddles of black syrup crawl across the floor and climb up into ONE HUGE EMPTY gilded picture frame on the far wall, "
    "pouring into its blank canvas like ink; four small emptied portraits hang around it. "
    "PANEL 3: a close-up of the huge frame: the black syrup has painted itself into a portrait of the elegant lady of the house in a wide "
    "hat, her face hidden in the shadow of the brim; a pale gloved hand dripping honey reaches OUT of the canvas, over the frame; the "
    "lettering 'ズ…'. "
    "PANEL 4: the lady steps fully out of the painting as the monster of reference image 3, towering over the two girls who stand ready to "
    "fight in the foreground; the frame behind her is empty and torn; the lettering 'ズズズ…'." + f" Variation {v}.", "OPAQUE") for v in "abc"]

# reruns of single pictures (a tool error or a refusal); each job only the one step
for job, out in (("R56b_nursery_Ra", "nursery_wallR1"), ("R56b_studio_Ra", "studio_wallR1"), ("R56b_studio_Rb", "studio_wallR5")):
    JOBS[f"R56b_fix_{out}"] = [s for s in JOBS[job] if s[0].endswith(out + ".png")]
