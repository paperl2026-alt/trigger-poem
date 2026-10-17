# Round 54 (docs/DESIGN.md「第 1 话」, docs/ART.md 场景 / 多版本): the flat panels of episode 1's seven places, each with its rotten
# version (<key>_x, painted over the real one so it lines up when the boards flip: the place turns real <-> rotten), plus covers, props
# and decals. The concept paintings of R53 (art/raw/r53/sc_<place>_a[_x].png) fix the look; an approved corridor panel fixes how flat a
# panel is. Sizes (sets/ep1.json hall): every surface is one of the three shapes Codex draws (3:2, 2:3, 1:1), so nothing is stretched.
#   shop 5.4 x 3.6 (bay 5.4: 3:2, end 3:2) / gallery 3.6 x 3.6 (bay 5.4, end 1:1) / garden 9 x 6 (bay 6: 1:1, end 3:2) /
#   cold 4.5 x 3 (bay 4.5, end 3:2) / oven 5.1 x 3.4 (bay 5.1, end 3:2) / hall 12 x 8 (bay 5.33: 2:3, end 3:2) / nether: floor only
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs28 import FLAT
from job_specs32 import NOFX

C53N = "art/raw/r53/sc_{}_a.png"
class _C53:   # the concept painting of each place (R53 called the garden room "fountain")
    @staticmethod
    def format(k): return C53N.format({"garden": "fountain"}.get(k, k))
C53 = _C53()
FLATREF = "art/raw/r31/wallL4.png"
GLASS = " Paint every window PANE (and any glass you could see through) as solid flat pure magenta #FF00FF, nothing else magenta."
STYLE = ("Reference image 1 is the concept painting of this place: match its look exactly (painting technique, line work, colours, light, "
         "materials, the kind of props). Reference image 2 is an approved flat wall texture of this game: match how flat, clean and readable "
         "it is. ")
ROT = {   # how far gone each place is (the deeper into the house, the worse)
    "light": "a little: a few honey drips from the top, a patch of peeling wallpaper, a sugar cobweb in a corner, the colours slightly sour",
    "medium": "clearly: honey and melted gelato dripping down, long curls of peeling wallpaper showing dark old wood underneath, sugar "
              "cobwebs, pastel mould blooms, things tilted",
    "heavy": "badly: thick honey and rotten gelato pouring down and pooling, wallpaper torn away to bare dark wood and stone, mould blooms "
             "everywhere, sugar cobwebs, cracks, things broken and tilted, melted candle wax",
}
XS = ("Reference image 3 is the REAL version of this exact surface: repaint the SAME surface, same layout, every element in the same "
      "position and size, as its ROTTEN version (the house's ghost has woken: the cafe turns back into a rotting old mansion), rotten {} . "
      "Warm honey-amber and sour pink light; still pretty in a creepy-cute way: NOT dark green, NOT violet, not a gloomy horror palette. ")
DOWN, UP = FLAT.replace("front-on view", "top-down view looking straight down"), FLAT.replace("front-on view", "view looking straight up")

PLACES = {
    "shop": dict(rot="light", W=5.4, h=3.6, bay=5.4,
        wall="an Italian gelato cafe inside a renovated old Western mansion, pastel cream-and-mint panelled walls with gilded mouldings",
        L=["a tall arched window with white lace curtains tied back with pink ribbons, a brass wall sconce beside it",
           "two narrow arched windows with a pastel framed print of a gelato cone between them, a little shelf with potted roses",
           "a tall arched window with half-drawn pink velvet curtains, climbing roses around it, a gilded wall clock",
           "a big gilded mirror flanked by two wall sconces, a cushioned pink bench along the wall below",
           "a tall arched window and a framed menu board WITHOUT any writing (only small painted gelato cones and stars), a plant stand",
           "two arched windows with lace curtains and a garland of pastel paper bunting between them"],
        R=["the serving wall behind the gelato counter: wooden shelves of waffle cones and glass jars of colourful toppings, a pink-and-"
           "white striped awning along the top, milk-glass pendant lamps",
           "the serving wall: shelves of syrup bottles and cake stands with macarons, a striped awning along the top, pendant lamps",
           "the serving wall: a big pastel mural of three gelato scoops on a cone (no text), shelves of cones below, a striped awning",
           "the serving wall: a glass-front fridge full of gelato tubs, a stack of pastel cups, a striped awning along the top",
           "the serving wall: a vintage cash register shelf, jars of sprinkles, hanging copper scoops, a striped awning along the top",
           "the serving wall: open shelves of teacups and gelato coupes, potted mint, a striped awning along the top, pendant lamps"],
        floor="polished pink and cream marble checkerboard floor with thin gold inlay lines between the squares",
        ceil="a cream coffered ceiling with gilded mouldings and small painted pastel roses in each coffer",
        end=["an ornate white-and-gold double door with oval windows in the centre, an arched transom above it, the panelled wall around it",
             "an ornate white-and-gold double door with tall glass panels and a stained-glass fanlight, two potted bay trees beside it"],
        outside="the view from the cafe window: an Italian hill town at sunset, cypress trees, terracotta roofs, a hazy pink sky"),
    "gallery": dict(rot="medium", W=3.6, h=3.6, bay=5.4,
        wall="a long old-mansion gallery corridor: cream damask wallpaper above a dark polished wood wainscot, a picture rail with EMPTY "
             "gilded picture hooks (the paintings are added separately), brass wall sconces",
        L=["the wallpaper and wainscot with two brass wall sconces and an empty stretch of wall between them",
           "a shallow window niche with a velvet seat and lace curtains",
           "a white marble bust of a lady on a pedestal between two sconces",
           "a narrow console table with a vase of roses and a candlestick",
           "a tall gilded mirror between two sconces",
           "a small marble fireplace with a clock on the mantel"],
        R=["the wallpaper and wainscot with a single wall sconce and a long empty stretch of wall",
           "a tall potted palm in a blue-and-white porcelain pot",
           "a cushioned bench under an empty stretch of wall",
           "a glass display cabinet of porcelain dolls and teacups",
           "a closed side door of carved dark wood",
           "a small round side table with a lamp and a vase"],
        floor="polished cream marble floor with a long red patterned carpet runner along the middle, the runner running from the top edge to "
              "the bottom edge and centred left to right",
        ceil="a barrel-vaulted cream ceiling with gilded ribs and soft painted clouds between them",
        end=["the end of the gallery: one tall arched window with heavy pink velvet curtains drawn aside",
             "the end of the gallery: a carved dark-wood double door with brass door knockers"],
        outside=None),
    "garden": dict(rot="medium", W=9, h=6, bay=6,
        wall="a mansion's glasshouse garden room: tall arched glass panes in white wrought-iron frames above a white marble wainscot",
        L=["potted lemon trees in front of the glass, climbing jasmine",
           "a marble bench with cushions under the glass, hanging lanterns",
           "a wall fountain with a stone lion's head spouting water into a basin, ivy",
           "a niche with a marble statue of a girl holding flowers",
           "a stone pillar wrapped in ivy between two glass panels, a stone urn of roses",
           "a closed wrought-iron gate to the outside garden between glass panels"],
        R=["potted orange trees in front of the glass, pink bougainvillea",
           "a white wicker sofa and a tea table under the glass",
           "tall shelves of potted ferns and orchids",
           "a niche with a marble statue of a woman holding a parasol",
           "a big birdcage on a stand and climbing roses",
           "a stone pillar with a hanging basket of flowers between glass panels"],
        floor="white and pale gold marble floor laid in a radiating star pattern, polished",
        ceil="a glass roof of white wrought-iron frames and arches",
        end=["the far wall: an arched doorway closed by a wrought-iron gate, between two EMPTY marble niches, hanging pink banners",
             "the far wall: an arched doorway with a carved stone frame and closed iron doors, two empty marble niches, ivy"],
        outside="the garden outside the glasshouse at sunset: cypresses, rose bushes, a gazebo, a pink and gold sky"),
    "cold": dict(rot="heavy", W=4.5, h=3, bay=4.5,
        wall="the cafe's basement cold storage in the mansion's old cellar: frosted stone walls, frosty pipes along the top, warm caged "
             "work lamps",
        L=["wooden shelves of waffle-cone boxes and paper cups, frost on the shelves",
           "a tangle of frosted pipes, valves and gauges, icicles",
           "a wall of shelved syrup bottles and jars of fruit",
           "an old fuse box and a caged lamp on the bare stone, a hanging coat hook with an apron",
           "steel racks of gelato tubs with handwritten-looking labels WITHOUT readable writing",
           "a bare stone wall with an arched niche and a frosted old crate"],
        R=["stacked wooden crates and sacks of sugar against the frosted stone",
           "steel shelves of cream cans and churns",
           "a frosted brick wall with an old ladder hanging on hooks",
           "a cork board with blank pinned papers, a frosted clock",
           "shelves of copper molds and ice-cream machine parts",
           "a frosted stone wall with a wine rack of dusty bottles"],
        floor="worn grey stone floor tiles with a drain grate, frost along the joints",
        ceil="a low brick barrel vault with frosted pipes running along it",
        end=["the far wall: a heavy old steel walk-in freezer door with a big lever handle, closed",
             "the far wall: a bricked-up arch with an old wooden coffin-shaped chest freezer standing in front of it"],
        outside=None),
    "oven": dict(rot="heavy", W=5.1, h=3.4, bay=5.1,
        wall="the old mansion kitchen turned into the cafe's bakery: cream tiles, dark wood, copper",
        L=["a wall of hanging copper pots and pans above a tiled counter",
           "shelves of glass jars, flour sacks and rolling pins",
           "a window with red-and-white checked curtains above a big stone sink",
           "an EMPTY cork board (the drawings are pinned separately) above a small table with a high chair",
           "a big wooden dresser full of plates and cake stands",
           "a bread rack full of loaves and a hanging bunch of herbs"],
        R=["an old iron stove with a kettle, a tiled wall behind it",
           "a long wooden work table against the wall with mixing bowls, cookie cutters and trays of cookies",
           "a window with lace curtains above a counter with cake tins",
           "shelves of spices and honey jars, a hanging garland of dried flowers",
           "a tall clock and a wall calendar WITHOUT any writing",
           "stacked baking trays and a flour bin"],
        floor="old terracotta floor tiles, worn and dusted with flour",
        ceil="dark wooden ceiling beams with hanging bunches of herbs and copper lamps",
        end=["the far wall: a huge old brick bread oven with a ROUND black cast-iron door (closed), stacked firewood on both sides",
             "the far wall: a huge old brick bread oven with a ROUND black cast-iron door (closed), a long wooden peel leaning beside it"],
        outside="a kitchen garden outside the window at sunset, herbs and a lemon tree"),
    "hall": dict(rot="heavy", W=12, h=8, bay=12 * 4 / 9,
        wall="the mansion's grand ballroom, used as the cafe's party hall: cream walls, gilded pilasters",
        L=["a very tall arched window with pink drapes and a gilded pelmet", "a wall candelabra between two gilded pilasters, a tall mirror",
           "a very tall arched window with lace curtains and pink drapes", "a huge gilded mirror reflecting chandelier light"],
        R=["a very tall arched window with pink drapes", "a tall gilded pier glass and a console with a cake tower",
           "a very tall arched window with white lace curtains", "a wall candelabra and a tall portrait of a rose garden (no people)"],
        floor="pink and dark-cherry marble checkerboard floor, polished like a mirror",
        ceil="a painted ceiling of a pink sunset sky with clouds inside gilded frames",
        end=["the far wall: a grand staircase splitting left and right with a red carpet, and above its landing a huge gilded frame with a "
             "portrait of the lady of the house in a wide hat (her face in the shadow of the brim)",
             "the far wall: a grand staircase splitting left and right with a red carpet, and above its landing a huge gilded frame with a "
             "portrait of the lady of the house seated, in a wide hat (her face in the shadow of the brim)"],
        end_x=" The huge gilded frame above the stairs is now EMPTY: only a torn, dark, dripping canvas, the lady has stepped out of it.",
        outside="a moonlit rose garden through the ballroom windows"),
}
SHAPE = {"3:2": "Landscape 3:2.", "2:3": "Portrait 2:3.", "1:1": "Square 1:1."}
def shape(w, h):
    r = w / h
    return SHAPE["3:2"] if r > 1.25 else SHAPE["2:3"] if r < 0.8 else SHAPE["1:1"]

JOBS = {}
for k, P in PLACES.items():
    ref, rot = C53.format(k), ROT[P["rot"]]
    refx = ref.replace("_a.png", "_a_x.png")
    def pair(name, view, desc, shp, extra="", xextra=""):
        real = f"art/raw/r54/{k}_{name}.png"
        return [(real, [ref, FLATREF], STYLE + view + "The surface: " + desc + " " + shp + extra, "OPAQUE"),
                (real.replace(".png", "_x.png"), [refx, FLATREF, real], STYLE.replace("Reference image 1 is the concept painting of this "
                 "place", "Reference image 1 is the concept painting of this place gone rotten") + XS.format(rot) + view + "The surface: " +
                 desc + " " + shp + extra + xextra, "OPAQUE")]
    wall = lambda d: f"one {P['bay']:.2g} m wide, {P['h']:.2g} m tall section of the wall of {P['wall']}: {d}."
    for side in "LR":
        for i, d in enumerate(P[side], 1):
            JOBS[f"R54_{k}_{side}{i}"] = pair(f"wall{side}{i}", FLAT, wall(d), shape(P["bay"], P["h"]), GLASS)
    JOBS[f"R54_{k}_flat"] = sum([pair(f"floor{i}", DOWN, f"{P['W']:.2g} m by {P['W']:.2g} m of the floor: {P['floor']}. Version {i}: its own "
                                       "details. Seamless and tileable on all four edges.", SHAPE["1:1"]) for i in (1, 2, 3)], []) + \
                              sum([pair(f"ceil{i}", UP, f"{P['W']:.2g} m by {P['W']:.2g} m of the ceiling: {P['ceil']}. Version {i}: its own "
                                       "details. Seamless and tileable on all four edges.", SHAPE["1:1"], GLASS if k == "garden" else "")
                                   for i in (1, 2, 3)], [])
    JOBS[f"R54_{k}_end"] = sum([pair(f"end{i}", FLAT, f"the {P['W']:.2g} m wide, {P['h']:.2g} m tall end wall of the room: {d}.",
                                     shape(P["W"], P["h"]), GLASS, P.get("end_x", "")) for i, d in enumerate(P["end"], 1)], [])
    if P.get("outside"):
        JOBS[f"R54_{k}_outside"] = pair("outside", "", P["outside"] + ". A wide painted backdrop, no people, no text.", SHAPE["3:2"])

# ---------------------------------------------------------------- the netherworld floor (always rotten)
JOBS["R54_nether_floor"] = [(f"art/raw/r54/nether_floor{i}.png", ["art/raw/r53b/nether_a.png", FLATREF], STYLE + DOWN + "The surface: "
    "a floor of thick, slowly melting gelato and honey clouds, pastel cream, pink and amber swirls, a few floating spoons and cone "
    f"fragments half sunk into it. Version {i}. Seamless and tileable on all four edges. Square 1:1.", "OPAQUE") for i in (1, 2, 3)]

# ---------------------------------------------------------------- covers (docs/ART.md 掩体: every one different in one episode)
COVER = ("Reference image 1 is the concept painting of the place: paint in EXACTLY its style. Draw ONE single game asset: a BARRICADE an "
         "anime girl crouches at in a third-person cover shooter. ALL rules are mandatory: (1) a perfectly straight-on front view of its "
         "long side, no top surface visible, no perspective, the top edge horizontal; (2) wide and chunky, about twice as wide as tall, "
         "one solid mass with NO holes or gaps to see through, a flat bottom edge; (3) it fills the picture from the left edge to the "
         "right edge, its bottom on the bottom edge, a 3:2 landscape picture; (4) fully transparent background, nothing else at all: no "
         "floor, no shadow, no wall, no people, no text, no letters, no numbers; (5) sticky with a little honey and melted gelato, a bit "
         "worn. " + NOFX + "THE OBJECT: ")
COVERS = {
    "shop": ["a marble cafe table tipped on its side, its round top facing the viewer, and two curly iron chairs piled against it",
             "a section of the glass gelato display counter, its mint-and-gold front panel facing the viewer, the glass top straight",
             "the marble serving counter's front, white marble with gilded trim, a tip jar on top",
             "a pink velvet banquette sofa seen from the back, buttoned and tufted",
             "a vintage pastel ice-cream cart with a striped canopy folded down, seen from its long side",
             "a stack of pink-and-cream pastry boxes tied with ribbons, two high and four wide"],
    "gallery": ["a carved antique chest of drawers lying on its side, its back panel facing the viewer",
                "a long velvet gallery bench and a fallen gilded picture frame leaning on it",
                "an overturned console table with its marble top facing the viewer",
                "a heavy wooden linen chest with brass corners",
                "a fallen tall gilded mirror lying on its side, its wooden back facing the viewer",
                "a row of three blue-and-white porcelain planters with trimmed box hedges"],
    "garden": ["a long marble bench with a carved backrest seen from the back",
               "a low stone planter wall full of trimmed lemon shrubs",
               "a white wicker sofa seen from the back with pink cushions over the top",
               "a stone garden balustrade section with an urn on top",
               "an overturned wrought-iron garden table with its round top facing the viewer",
               "a pile of terracotta pots and sacks of potting soil"],
    "cold": ["an old white chest freezer seen from its long side, frosted",
             "a wall of stacked wooden crates of cones",
             "a steel shelf unit tipped onto its side, its solid back facing the viewer",
             "a row of tall steel cream churns and cans",
             "stacked sacks of sugar and flour",
             "an old wooden ice box seen from the side, brass hinges"],
    "oven": ["a heavy wooden kitchen table tipped on its side, its top facing the viewer",
             "a big butcher block with a rack of hanging copper pots",
             "a wall of stacked flour sacks",
             "a cast-iron stove seen from the side",
             "a long bread rack covered by a hanging cloth",
             "stacked firewood logs in a neat pile"],
    "hall": ["a long banquet table with a white cloth hanging to the floor and a cake tower on it, seen from its long side",
             "an overturned pink velvet chaise longue, its back facing the viewer",
             "a grand piano's side panel, black lacquer, lid closed",
             "a row of gilded ballroom chairs knocked over in a pile",
             "a low wall of stacked wrapped gift boxes with ribbons",
             "a marble balustrade section from the staircase"],
}
for k, objs in COVERS.items():
    JOBS[f"R54_cover_{k}"] = [(f"art/raw/r54/cover_{k}{i}.png", [C53.format(k).replace("_a.png", "_a_x.png")], COVER + o) for i, o in
                              enumerate(objs, 1)]

# ---------------------------------------------------------------- props that stand in the places (relief drawings)
PROP = ("Reference image 1 is the concept painting of the place: paint in EXACTLY its style. ONE single game prop standing on the ground, "
        "seen from the front at eye level, whole, centred, on a fully transparent background: no floor, no shadow, no people, no text. " +
        NOFX + "THE PROP: ")
PROPS = {
    "shop": ["a little round marble cafe table with two curly white iron chairs with pink cushions",
             "a little round marble cafe table with one chair and a vase of roses on it",
             "a section of the long glass gelato display counter, full of colourful gelato trays, seen from the front",
             "a tall gilded floor lamp with a pink fringed shade"],
    "garden": ["the round marble fountain with a statue of a young mother holding up a gelato cone, water spouting from two lion heads into "
               "the basin", "a decorative suit of knight armour on a stand, empty-handed, cream and gold enamel",
               "a big potted lemon tree in a terracotta pot", "a wrought-iron lantern on a tall post"],
    "cold": ["a chest freezer with a frosted glass lid full of gelato tubs", "a tall steel shelf of cones and cups",
             "a pile of bones made of popsicle sticks and broken wafer, with a frilly bonnet on top"],
    "oven": ["a heavy kitchen table with mixing bowls and a rolling pin", "a high chair for a little child, painted white with pink roses"],
    "hall": ["a tall silver candelabra with burning candles", "a round party table with a white cloth and a three-tier gelato tower"],
}
for k, objs in PROPS.items():
    JOBS[f"R54_prop_{k}"] = [(f"art/raw/r54/prop_{k}{i}.png", [C53.format(k)], PROP + o) for i, o in enumerate(objs, 1)]

# ---------------------------------------------------------------- decals that grow when the place rots (anomaly: true)
DEC = ("Reference image 1 is the concept painting of the place gone rotten: paint in EXACTLY its style. A sprite sheet on a transparent "
       "background, a 3 x 2 grid, one decal per cell, each centred with empty space around it, flat front view, no text except where asked. "
       + NOFX)
JOBS["R54_decals"] = [
    ("art/raw/r54/dec_drips.png", ["art/raw/r53/sc_gallery_a_x.png"], DEC + "Six different HONEY AND MELTED GELATO DRIPS running down a "
     "wall from a top edge: long sticky drips of amber honey, pink and pistachio gelato, different widths and lengths."),
    ("art/raw/r54/dec_rot.png", ["art/raw/r53/sc_cold_a_x.png"], DEC + "Six different rot decals for walls: 1 a big curl of peeling cream "
     "wallpaper, 2 a pastel mould bloom, 3 a sugar cobweb across a corner, 4 a crack with honey oozing out, 5 a patch of torn damask "
     "wallpaper showing dark wood, 6 a splash of rotten gelato."),
    ("art/raw/r54/dec_floor.png", ["art/raw/r53/sc_oven_a_x.png"], DEC + "Six different floor decals seen from straight above: 1 a puddle "
     "of melted gelato, 2 a puddle of honey with bubbles, 3 a pile of popsicle-stick bones, 4 scattered broken waffle cones, 5 a trail of "
     "pink syrup drips, 6 crushed cherries and wafers."),
    ("art/raw/r54/dec_words.png", ["art/raw/r53/sc_gallery_a_x.png"], DEC + "Six messages scrawled on a wall with a finger in thick dripping "
     "dark red syrup, like the blood writing in an old horror game: 1 'あそぼ', 2 'あそぼ あそぼ', 3 'かえして', 4 'ずっといっしょ', 5 a "
     "child's drawing of a smiling face, 6 a long smeared handprint trail. Only these words, written in shaky hiragana."),
]
