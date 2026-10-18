# Round 63 (docs/DESIGN.md「第 2 话」钟楼惊宿; user 2026-10-18 "需要的美术资产 codex 多出出", "尽可能的复杂 多组合多运用"): everything the one long
# stage needs, painted after the concept paintings picked from R62 (art/raw/r62/sc_<place>_<pick>.png):
#   R63_<place>_*:  flat panels of the ten places (walls per side, floors, ceilings, the far wall with the way on as a doorway painted
#                   magenta, the wall they came in by); the four calm places (entrance, guest room, corridor, bath) also get the version
#                   after the lights go out (_x, painted over the calm one, so the boards can flip like episode 1's rot)
#   R63_cover_*:    barricades, never the same twice in the episode; R63_prop_*: the mechanisms and things standing in the places
#   R63_she_*:      more poses of "her" (main form a, true form e, scissor spider c) for the chase, the shaft, the final fight
#   R63_m_proj:     what the small monsters throw; R63_retry: R62 steps the image tool failed on
#   R63_page_*:     the opening and ending comic pages (three tries each); R63_res_*: the results illustration, the yukata picture
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs28 import FLAT
from job_specs32 import NOFX
from job_specs47 import STYLE as CSTYLE
from job_specs60 import OUTFIT
import job_specs62 as R62

R = "art/raw/r63/"; P62 = "art/raw/r62/"
PICK = {"genkan": "a", "kyakushitsu": "b", "rouka": "a", "furo": "b", "hiroma": "b", "nakaniwa": "a", "kura": "a", "chika": "a", "shoro": "b", "kane": "a"}
CON = lambda k, x=False: f"{P62}sc_{k}_{PICK[k]}{'_x' if x else ''}.png"
FLATREF = "art/raw/r31/wallL4.png"
GLASS = " Paint every window PANE and every open DOORWAY (anything you could see through into another space) as solid flat pure magenta #FF00FF, nothing else magenta."
STYLE = ("Reference image 1 is the concept painting of this place: match its look exactly (painting technique, line work, colours, light, "
         "materials, the kind of objects). Reference image 2 is an approved flat wall texture of this game: match how flat, clean and readable "
         "it is. ")
DARKX = ("Reference image 3 is the CALM version of this exact surface: repaint the SAME surface, same layout, every element in the same position "
         "and size, as it looks after the lights went out and the stalker woke: only paper lanterns and candles still burn (warm amber pools "
         "of light against deep indigo darkness), shoji paper slashed into long hanging ribbons, clean scissor cuts through screens, cushions "
         "and scrolls, cut red threads, strands of long black hair caught on things, a few small white paper dolls (katashiro) stuck on it. "
         "Still beautiful in a creepy-cute way, NOT dark green, NOT violet, NOT a gloomy grey palette. ")
DARK = ("The lights are out and the stalker is awake: only paper lanterns and candles burn (warm amber pools of light against deep indigo "
        "darkness); slashed shoji paper hanging in ribbons, clean scissor cuts, cut red threads, strands of black hair, a few small white "
        "paper dolls (katashiro) stuck on it. Creepy-cute, NOT dark green, NOT violet, NOT a gloomy grey palette. ")
DOWN, UP = FLAT.replace("front-on view", "top-down view looking straight down"), FLAT.replace("front-on view", "view looking straight up")
SHAPE = {"3:2": "Landscape 3:2.", "2:3": "Portrait 2:3.", "1:1": "Square 1:1."}
def shape(w, h):
    r = w / h
    return SHAPE["3:2"] if r > 1.25 else SHAPE["2:3"] if r < 0.8 else SHAPE["1:1"]

# W x h (metres), bay = wall section width; every surface is one of the three shapes the image tool makes
PLACES = {
    "genkan": dict(calm=True, W=7, h=4.2, bay=6.3,
        wall="the entrance hall of an old two-storey ryokan: dark polished cedar pillars and beams, cream plaster, a wooden wainscot",
        L=["a big glass display case standing against the wall (EMPTY inside: only a red cushion and a little name plate, the doll is drawn "
           "separately), a wall of antique Japanese clocks around it",
           "a whole wall of antique Japanese clocks: wadokei tower clocks, round pendulum clocks, small bracket clocks, all different",
           "a tall shoe cupboard of pale wood with small numbered doors (no readable numbers) and a vase of chrysanthemums on top"],
        R=["the front desk: a wooden reception counter with a brass call bell, a wooden key board with hanging wooden key tags (no text), "
           "a noren curtain with an inn crest (a bell inside a circle)",
           "a hanging scroll of a bell tower in mist in a tokonoma alcove, an ikebana arrangement, a paper andon lamp",
           "a wooden notice board with blank sheets of washi paper pinned to it (no writing), a bird stand without a bird, a folding screen"],
        floor="old polished dark wooden floorboards with a long red runner", ceil="a dark wooden coffered ceiling with paper lantern fixtures",
        end=["a wide wooden staircase going up to the second floor, polished steps and banister; at the top of the stairs an open doorway "
             "into the upstairs corridor"],
        back=["the inn's front entrance: a row of glass-and-wood sliding doors onto the night street (the glass is a see-through window), a "
              "raised wooden step with neat rows of guest slippers lined up below it"]),
    "kyakushitsu": dict(calm=True, W=5.4, h=3, bay=4.5,
        wall="a traditional eight-tatami ryokan guest room: shoji, fusuma with painted cranes, cedar posts, a ranma transom carved with waves",
        L=["fusuma sliding doors of an oshiire closet with painted cranes and a pine, closed",
           "a tokonoma alcove with a hanging scroll of a bell tower in the mist and a vase of camellias, a small tea chest beside it",
           "a low dressing table (kyodai) with a covered mirror, a clothes rack with two folded yukata and obi"],
        R=["shoji windows onto the night (the window panes see-through), a pair of low chairs and a little table in the window nook (hiroen)",
           "shoji windows onto the night, a paper andon lamp on the floor below them",
           "a wall with a hanging scroll of autumn leaves and a small shelf with a teapot"],
        floor="tatami mats with dark cloth borders, laid in the classic pattern", ceil="a pale wooden board ceiling with a square paper lamp",
        end=["fusuma sliding doors to the corridor, one of them slid open: an open doorway into the corridor"],
        back=["a shoji window wall onto the night with a low table in front of it, the two girls' travel bags and a phone charger on the floor"]),
    "rouka": dict(calm=True, W=3.6, h=3, bay=4.5,
        wall="the long upstairs corridor of an old ryokan: cedar posts, polished floor, round paper lanterns hanging from the beams",
        L=[f"the shoji front of a guest room with a small wooden room plate (no readable text), a pair of slippers set neatly at its door, variation {i}"
           for i in range(1, 4)] + ["a wooden pillar with a pendulum clock and a small shelf with a vase", "a fire bucket rack with red buckets and a paper lantern",
                                    "the fusuma front of a linen room with a crane painting"],
        R=[f"old wavy glass windows in wooden frames looking down on a rainy courtyard (the panes see-through), a low wooden railing, variation {i}"
           for i in range(1, 5)] + ["a window with a small potted bonsai on the sill", "a window and a hanging bamboo blind half rolled up"],
        floor="long polished dark wooden corridor floorboards", ceil="a dark wooden beamed ceiling with round paper lanterns",
        end=["the entrance of the family bath: a dark blue noren curtain with the hot spring symbol hanging in an open doorway"],
        back=["the fusuma doors of the girls' guest room, one slid open: an open doorway into the room"]),
    "furo": dict(calm=True, W=5.4, h=3.3, bay=4.95,
        wall="a private family bath: blue-and-white tiled walls, hinoki cypress wood trim, a wooden duckboard floor",
        L=["blue-and-white tiled wall with a row of brass taps and little wooden stools and buckets in front of it",
           "tiled wall with a mosaic of Mount Fuji and cranes", "tiled wall with a small high window (the pane see-through) and a bamboo shelf of soaps"],
        R=["a cedar wall with hooks and folded towels, a wooden bench", "tiled wall with a mosaic of carp and waves",
           "a wall of bamboo baskets on a shelf, a mirror"],
        floor="pale wooden duckboard slats over grey stone tiles, wet", ceil="a slatted cypress wood ceiling with a little steam vent",
        end=["a big square hinoki cypress bathtub against the tiled back wall with a heavy wooden lid laid half over it, the water dark"],
        back=["the changing room behind: a noren curtain hanging in an open doorway, bamboo baskets on a shelf beside it"]),
    "hiroma": dict(calm=False, W=12, h=4.5, bay=6.75,
        wall="a huge banquet hall of the ryokan: shoji walls lit from outside, gold folding screens, rows of hanging lanterns",
        L=["a long shoji wall lit from outside, a gold folding screen with cranes standing in front",
           "a long shoji wall lit from outside with tall candle stands", "a tokonoma stage with a huge hanging scroll of a bell and a big ikebana"],
        R=["a long shoji wall lit from outside, a gold folding screen with pines", "a long shoji wall with a row of lacquered rice chests",
           "a long shoji wall with a raised platform for musicians and a koto lying on it"],
        floor="a hundred tatami mats with dark borders", ceil="a high coffered ceiling with gilded corners and a big square skylight of old glass "
        "(the skylight panes see-through)",
        end=["big sliding doors at the far end, slid wide open: an open doorway onto a covered walkway in the rain"],
        back=["a plain plaster and wood wall of the banquet hall with a broken hanging scroll"]),
    "nakaniwa": dict(calm=False, W=3.2, h=3, bay=4.5, open=True,
        wall="a long covered wooden walkway (watari-rouka) on posts crossing a rainy courtyard garden at night",
        L=[f"a section of the walkway's side: two wooden posts, a low wooden railing at hip height, a hanging paper lantern; above the railing "
           f"and between the posts is open air (see-through), variation {i}" for i in range(1, 7)],
        R=[f"a section of the walkway's side: two wooden posts, a low wooden railing at hip height with a stone lantern beyond it, a hanging "
           f"paper lantern; above the railing and between the posts is open air (see-through), variation {i}" for i in range(1, 7)],
        floor="wet wooden walkway planks", ceil="the underside of a tiled roof: wooden rafters and battens",
        end=["the heavy iron-studded door of a white-plaster storehouse (kura) at the end of the walkway, standing open: an open doorway"],
        back=["the open sliding doors of the banquet hall behind, warm light, an open doorway"],
        outside=["a rainy Japanese courtyard garden at night seen from a walkway: a koi pond, stone lanterns, pines, a shishi-odoshi, the "
                 "inn's two-storey wings with lit shoji windows, a tall wooden bell tower rising behind the roofs",
                 "the other side of a rainy Japanese courtyard garden at night: a moss garden, a little stone bridge, bamboo, an old well, the "
                 "inn's roofs and lit windows"]),
    "kura": dict(calm=False, W=6, h=4.5, bay=6.75,
        wall="the inside of an old white-plaster storehouse (kura) with dark wooden beams",
        L=["shelves of paulownia boxes, old ledgers and scrolls", "stacks of round bamboo silkworm trays and old silk reels and looms",
           "a wall covered with dozens of antique Japanese clocks, all different"],
        R=["tansu chests stacked with iron fittings and a steep ladder staircase", "a wall covered with dozens of antique clocks and wooden clock gears",
           "old wedding kimono on stands and lacquered boxes"],
        floor="old wooden floorboards, one loose with a dark gap below it", ceil="thick dark wooden beams and a small barred window high up",
        end=["the back wall of the storehouse: a whole wall of antique clocks around a tall old wadokei tower clock"],
        back=["the heavy iron-studded storehouse door, shut"]),
    "chika": dict(calm=False, W=8, h=5, bay=7.5,
        wall="a limestone cave under the inn: pale stalactites, wet rock, mulberry branches and old candles along the walls",
        L=["wet limestone cave wall with stalactites and a niche of candles", "cave wall with straw-wrapped ice blocks of an old ice cellar",
           "cave wall with old silk cocoons stuck all over it", "cave wall with a shrine niche and paper streamers"],
        R=["cave wall with mulberry branches tied with red rope", "cave wall with stacked old lanterns", "cave wall with a dark cliff drop "
           "beside it and a wooden railing", "cave wall with a waterfall of silk threads"],
        floor="worn stone and packed earth, mulberry leaves strewn on it", ceil="a cave ceiling of pale stalactites",
        end=["at the end of the cave a wooden stage with red curtains drawn back like a shrine, rows of candles and offerings before a huge "
             "silk cushion, a cliff edge in front of it"],
        end_x=" The stage has burned: charred wood, the red curtains burned to tatters, ash; on one side an old wooden lift cage stands open "
              "in the rock (an open doorway into it).",
        back=["worn stone steps coming down from the storehouse above"]),
    "shoro": dict(calm=False, W=5, h=12, bay=4, rows=2,
        wall="the inside of a tall wooden bell tower: a vertical shaft with ladders, catwalks, ropes and huge wooden and brass clock gears",
        L=["a tall wooden wall of the tower shaft with a ladder and a huge clock gear", "a tall wooden wall of the shaft with ropes and pulleys",
           "a tall wooden wall of the shaft with a narrow catwalk and lanterns", "a tall wooden wall of the shaft with a big wooden escapement wheel"],
        R=["a tall wooden wall of the shaft with counterweights hanging on chains", "a tall wooden wall of the shaft with a small window "
           "onto the night (the pane see-through)", "a tall wooden wall of the shaft with gears and a stopped clock face seen from behind",
           "a tall wooden wall of the shaft with a ladder and paper charms"],
        floor="the dark bottom of the shaft: rubble and broken boards", ceil="the floor beams of the bell chamber above, a trapdoor"),
    "kane": dict(calm=False, W=12, h=6, bay=6, open=True,
        wall="the open top of the bell tower under a curved tiled roof, night, dawn about to break",
        L=[f"a section of the bell chamber's open side: thick wooden posts, a low wooden railing at hip height, the roof's curved eaves above; "
           f"above the railing and between the posts is open air (see-through), variation {i}" for i in range(1, 3)],
        R=[f"a section of the bell chamber's open side: thick wooden posts, a low wooden railing at hip height, paper charms tied to the posts; "
           f"above the railing and between the posts is open air (see-through), variation {i}" for i in range(1, 3)],
        floor=None, ceil="the underside of the curved tiled roof: dark rafters, the bell's huge wooden yoke",
        end=["a section of the bell chamber's open side with the big log striker hanging on ropes; open air beyond the railing (see-through)"],
        back=["the top of the ladder coming up into the bell chamber, a trapdoor, wooden posts; open air beyond (see-through)"],
        outside=["a misty Japanese mountain town at night seen from a high bell tower: tiled roofs, paper lanterns in the streets, forested "
                 "mountains, the sky at the horizon turning to the first pale pink of dawn",
                 "the other side of the misty mountain town from the bell tower: a river, a stone bridge, terraced houses, mountains, stars"]),
}
JOBS = {}
for k, P in PLACES.items():
    ref = CON(k); refx = CON(k, True) if P["calm"] else None
    look = STYLE if P["calm"] else STYLE + DARK
    def one(name, view, desc, shp, extra=""):
        base = f"{R}{k}_{name}.png"; out = [(base, [ref, FLATREF], look + view + "The surface: " + desc + " " + shp + GLASS + extra, "OPAQUE")]
        if P["calm"]:
            out.append((base.replace(".png", "_x.png"), [refx, FLATREF, base], STYLE.replace("Reference image 1 is the concept painting of this place",
                        "Reference image 1 is the concept painting of this place after the lights went out") + DARKX + view + "The surface: " + desc +
                        " " + shp + GLASS + extra, "OPAQUE"))
        return out
    rows = P.get("rows", 1); wh = P["h"] / rows
    wall = lambda d: f"one {P['bay']:.3g} m wide, {wh:.3g} m tall section of the wall of {P['wall']}: {d}."
    for side in "LR":
        JOBS[f"R63_{k}_{side}"] = sum([one(f"wall{side}{i}", FLAT, wall(d), shape(P["bay"], wh)) for i, d in enumerate(P[side], 1)], [])
    nf = 3 if len(P["L"]) >= 4 else 2
    fl = []
    if P.get("floor"): fl += sum([one(f"floor{i}", DOWN, f"{P['W']:.3g} m by {P['W']:.3g} m of the floor: {P['floor']}. Version {i}: its own "
                                       "details. Seamless and tileable on all four edges.", SHAPE["1:1"]) for i in range(1, nf + 1)], [])
    fl += sum([one(f"ceil{i}", UP, f"{P['W']:.3g} m by {P['W']:.3g} m of the ceiling: {P['ceil']}. Version {i}: its own details. Seamless and "
                   "tileable on all four edges.", SHAPE["1:1"]) for i in range(1, nf + 1)], [])
    JOBS[f"R63_{k}_flat"] = fl
    ends = []
    for i, d in enumerate(P.get("end", []), 1):
        ends += one(f"end{i}", FLAT, f"the {P['W']:.3g} m wide, {P['h']:.3g} m tall far wall of the place: {d}.", shape(P["W"], P["h"]))
        if P.get("end_x"):
            ends.append((f"{R}{k}_end{i}_b.png", [ref, FLATREF, f"{R}{k}_end{i}.png"], look + "Reference image 3 is this exact surface: repaint "
                         "the SAME surface, same layout, as it is later in the story." + P["end_x"] + " " + FLAT + shape(P["W"], P["h"]) + GLASS, "OPAQUE"))
    for i, d in enumerate(P.get("back", []), 1):
        ends += one(f"back{i}", FLAT, f"the {P['W']:.3g} m wide, {P['h']:.3g} m tall wall behind, where they came in: {d}.", shape(P["W"], P["h"]))
    for i, d in enumerate(P.get("outside", []), 1):
        ends.append((f"{R}{k}_outside{i}.png", [ref], STYLE.split("Reference image 2")[0] + d + ". A wide painted backdrop seen from eye level, "
                     "no people, no text, no magenta. " + SHAPE["3:2"], "OPAQUE"))
    if ends: JOBS[f"R63_{k}_end"] = ends
# the bell tower's floor: one big painting, not tiled (docs/DESIGN.md 第 2 话 决战: the wadokei dial is the magic circle)
JOBS["R63_kane_dial"] = [(f"{R}kane_dial{v}.png", [CON("kane"), FLATREF], STYLE + DARK + DOWN + "The surface: the whole 12 m by 12 m wooden floor of "
    "the bell chamber, which is one giant antique wadokei clock face: an outer ring of the twelve zodiac hour signs (rat, ox, tiger, rabbit, "
    "dragon, snake, horse, sheep, monkey, rooster, dog, boar) drawn as twelve round bronze plates evenly around the circle like a magic circle, "
    "an inner ring of engraved hour marks and patterns, inlaid brass and lacquer, the centre a bronze boss where the clock hands are fixed "
    "(do NOT paint the hands), the corners outside the circle plain wooden floorboards. Perfectly symmetric, seen straight down. " + SHAPE["1:1"],
    "OPAQUE") for v in "ab"]

# ---------------------------------------------------------------- covers (every one different in the episode)
COVER = ("Reference image 1 is the concept painting of the place: paint in EXACTLY its style. Draw ONE single game asset: a BARRICADE an "
         "anime girl crouches at in a third-person cover shooter. ALL rules are mandatory: (1) a perfectly straight-on front view of its "
         "long side, no top surface visible, no perspective, the top edge horizontal; (2) wide and chunky, about twice as wide as tall, one "
         "solid mass with NO holes or gaps to see through, a flat bottom edge; (3) it fills the picture from the left edge to the right edge, "
         "its bottom on the bottom edge, a 3:2 landscape picture; (4) fully transparent background, nothing else at all: no floor, no shadow, "
         "no wall, no people, no text, no letters, no numbers; (5) a little worn, a few clean scissor cuts in it. " + NOFX + "THE OBJECT: ")
COVERS = {
    "genkan": ["a long low wooden shoe bench with a row of guest slippers on it, seen from its long side",
               "the wooden reception counter's front panel with the inn's bell crest carved on it"],
    "rouka": ["a stack of folded futons and quilts tied with a cord", "a big lacquered linen chest (nagamochi) with iron fittings",
              "a row of wooden fire buckets on a low stand", "a fallen fusuma door lying on its side, its painted cranes facing the viewer"],
    "kyakushitsu": ["a low lacquered table tipped on its side, its top facing the viewer", "a stack of zabuton floor cushions four high"],
    "furo": ["a stack of wooden bath buckets and little stools", "a big wooden bath lid propped on its side"],
    "hiroma": ["a long row of low lacquered banquet tables pushed together with dishes still on them", "a gold folding screen lying on its side, "
               "its back of plain paper facing the viewer", "a stack of lacquered serving trays and rice tubs", "a big taiko drum on its stand seen from the side"],
    "nakaniwa": ["a pile of tied straw rice bales", "a low stone wall with moss and a little stone lantern base"],
    "kura": ["a heavy tansu chest of drawers with iron fittings, seen from the front", "a stack of paulownia boxes tied with purple cords",
             "a row of sake barrels wrapped in straw", "stacked bamboo silkworm trays tied together"],
    "chika": ["a row of straw-wrapped ice blocks", "a fallen wooden shrine offering table with candles", "a mound of silk cocoons and mulberry branches",
              "a stack of old lanterns and boxes"],
    "kane": ["the low wooden railing post base with paper charms", "a wooden toolbox of the bell keeper and coiled ropes"],
}
for k, objs in COVERS.items():
    JOBS[f"R63_cover_{k}"] = [(f"{R}cover_{k}{i}.png", [CON(k)], COVER + o) for i, o in enumerate(objs, 1)]

# ---------------------------------------------------------------- props / mechanisms (single drawings, relief added on import)
PROP = ("Reference image 1 is the concept painting of the place: paint in EXACTLY its style. ONE single game prop, seen from the front at eye "
        "level, whole, centred, on a fully transparent background: no floor, no shadow, no people, no text, no letters. " + NOFX + "THE PROP: ")
PROPS = {
    "genkan": [("case_doll", "a tall glass display case with a life-size ichimatsu doll inside: a girl doll with a blunt black bob, a white "
                "porcelain face and a red furisode, sitting on a red cushion, holding small golden scissors in her lap"),
               ("case_empty", "the same tall glass display case, its front glass smashed, EMPTY inside: only the red cushion, long strands of "
                "black hair and a few snipped red threads"),
               ("cage", "an old brass bird cage on a wooden stand with a black crow inside, the cage door shut with a little latch"),
               ("cage_open", "the same old brass bird cage on its stand, empty, its door hanging open"),
               ("bell_desk", "a small brass reception call bell on a wooden stand"),
               ("note", "a sheet of handwritten-looking washi paper pinned to a small wooden board with a red cord, but the paper is BLANK (no "
                "writing at all), a small inn crest stamp in red in one corner")],
    "rouka": [("lantern_hang", "a round paper lantern hanging from a short iron chain, the chain going straight up out of the picture"),
              ("noren", "a dark blue noren curtain hanging from a bamboo rod, split in two strips"),
              ("clock_pillar", "an old pendulum wall clock with a round face and a long glass pendulum case, on a short piece of cedar pillar")],
    "hiroma": [("lantern_big", "a big hanging lantern of wood and paper (a tsuri-doro) hanging from a thick chain, the chain going straight up out of the picture"),
               ("byobu", "a gold folding screen with painted cranes standing upright, four panels in a zigzag"),
               ("zen", "a low lacquered banquet tray table with a full feast of untouched dishes")],
    "nakaniwa": [("ishidoro", "a tall old stone lantern (ishi-doro) with moss"), ("amado", "a row of dark wooden storm shutters (amado) slid shut "
                 "between two posts, seen flat from the front, a big iron latch bar"),
                 ("shishi", "a bamboo shishi-odoshi water fountain on stones")],
    "kura": [("ledger", "an old open ledger book lying flat, its pages BLANK (no writing), a brush and an inkstone beside it"),
             ("clock_wadokei", "an antique wadokei tower clock in a tall wooden case with a single hand and a hanging weight"),
             ("hatch", "a square wooden floor hatch with an iron ring, closed")],
    "chika": [("kerosene", "an old rusty kerosene can with a spout, standing on a rock"), ("candles", "a cluster of tall lit candles on an "
              "iron stand, wax dripping (draw the flames small and simple, no glow)"), ("cocoon", "a huge silk cocoon cushion on a lacquered stand, empty and torn open")],
    "shoro": [("weight", "a heavy cast-iron counterweight hanging on a thick chain, the chain going straight up out of the picture"),
              ("gear", "a huge wooden and brass clock gear wheel seen flat from the front"), ("lift", "an old wooden lift platform with a "
              "railing and ropes going up out of the picture, seen from the front")],
    "kane": [("bell", "a giant bronze Japanese temple bell (bonsho) hanging from its wooden yoke, seen from the front, the yoke going up out "
              "of the picture"), ("striker", "the big wooden log striker of a temple bell hanging from two ropes, seen from the side"),
             ("hand", "a single huge ornate bronze clock hand lying flat, pointing up, seen from above"),
             ("crow", "a black crow flying with its wings spread, seen from the front")],
}
for k, items in PROPS.items():
    JOBS[f"R63_prop_{k}"] = [(f"{R}prop_{n}.png", [CON(k)], PROP + d) for n, d in items]
# the twelve zodiac plates of the dial (cut out of one sheet): each lights up in the final fight
JOBS["R63_prop_zodiac"] = [(f"{R}prop_zodiac.png", [CON("kane")], "Reference image 1 is the concept painting of the place: paint in EXACTLY its "
    "style. A sprite sheet of TWELVE round bronze plates in a 4 x 3 grid (four columns, three rows), each plate showing one of the twelve "
    "zodiac animals of a Japanese clock in relief, in order: rat, ox, tiger, rabbit, dragon, snake, horse, sheep, monkey, rooster, dog, boar; "
    "all the same size, seen straight from the front, clear empty space between them, transparent background, no text, no letters, no "
    "numbers. " + NOFX + SHAPE["3:2"])]
# decals laid on walls and floors
JOBS["R63_decals"] = [(f"{R}decals{v}.png", [CON("rouka", True)], "Reference image 1 is the concept painting of the place: paint in EXACTLY its "
    "style. A sprite sheet of six separate decals in a 3 x 2 grid, each fully inside its cell, transparent background, seen flat from the "
    "front: 1 a pair of inn slippers cut cleanly in half, 2 a white paper doll (katashiro) stuck flat, 3 a long tangle of black hair, 4 a long "
    "clean scissor slash through shoji paper with the paper hanging in ribbons, 5 cut red threads scattered, 6 two deep blade gouges in wood. "
    "No text. " + NOFX + SHAPE["3:2"]) for v in "ab"]

# ---------------------------------------------------------------- her other poses
SHE_EXTRA = {
    "a2": ("she_a", "Poses, top row: 1 getting up from the floor, half risen, blades scraping, head hanging, 2 standing still far away at the "
           "end of a corridor, facing the viewer, head tilted (staring), 3 peeking round a door frame, only the head, the scissor bow and one "
           "blade showing from the left edge of the cell; bottom row: 4 holding a girl's arm (draw only her own blade-arms closed around "
           "empty air at chest height, as if gripping), pulling, 5 stabbing one blade straight down into the floor, 6 recoiling, blades "
           "jammed and stuck in wood."),
    "e2": ("she_e", "Poses, top row: 1 hovering, the empty kimono swaying, 2 the sleeves spread wide, many paper dolls flying out of them "
           "(draw the dolls), 3 the mouth opening wide, gathering a big scream (wind-up); bottom row: 4 screaming straight at the viewer, mouth "
           "wide open, 5 both sleeve-blades sweeping across, 6 collapsing, the kimono deflating."),
    "c2": ("she_c", "THE SAME scissor spider doll, seen climbing up a vertical wooden wall toward the viewer who looks DOWN at her from "
           "above. Poses, top row: 1 climbing, legs spread on the wall, 2 climbing, the other step, 3 clinging still, head turned up toward "
           "the viewer; bottom row: 4 rearing up off the wall, blades raised (wind-up), 5 lunging up straight at the viewer, 6 losing her grip, "
           "falling backwards."),
}
for k, (src, poses) in SHE_EXTRA.items():
    JOBS.setdefault("R63_she", []).append((f"{R}she_{k}.png", [f"{P62}{src}.png"] + R62.MON[:3], "Reference image 1 is an approved sprite "
        "sheet of THIS monster: draw EXACTLY the same monster, same design, colours and art style, in new poses. Reference images 2 to 4 show "
        "this game's monster art style. " + R62.SHEET + poses))
# what the small monsters throw (cut from one sheet each)
JOBS["R63_m_proj"] = [(f"{R}m_proj.png", R62.MON[:3], R62.STYLE + "A sprite sheet of six separate small thrown objects in a 3 x 2 grid, each "
    "fully inside its cell, transparent background, each one as seen flying straight at the viewer: 1 a tiny red paper lantern with a "
    "lolling tongue, 2 a small kokeshi doll head with a too-wide painted smile, 3 a spinning wooden geta sandal, 4 a folded paper crane with "
    "sharp edges, 5 a red sewing pin cushion stuck with needles, 6 a small pair of golden scissors open. No text. " + NOFX + SHAPE["3:2"])]
# the R62 steps the image tool failed on (a path error, not a refusal)
JOBS["R63_retry"] = [st for job in ("R62_kaiko", "R62_m_kokeshi", "R62_m_surippa") for st in R62.JOBS[job] if st[0].endswith(("kaiko_a.png", "m_kokeshi_a.png", "m_surippa_a.png"))]

# ---------------------------------------------------------------- comic pages (only the two girls and monsters: DESIGN 漫画转场的规矩)
CREFS = ["art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/ref/pink_poses.png", CON("genkan"), f"{P62}she_a.png"]
WHO = ("Reference images: 1 = the white-haired cat girl's design (white messy hair, white cat ears, red-framed glasses, a white kimono-like "
       "top with wide sleeves, a black obi sash with red cords, a white fluffy cat tail; her right arm ends in a big white fluffy GHOST CAT PAW "
       "with red claws: show that paw from its PALM side or lowered at her side, never its back); keep her look exactly. 2 and 3 = the "
       "black-haired twin-tail girl's design: " + OUTFIT + " 4 = the entrance hall of the old ryokan in this story (its look). 5 = the "
       "stalker monster of this story (a living pair of Japanese scissors that is the inn's ichimatsu doll). NO other people anywhere: no "
       "staff, no guests, no men, no drivers. ")
PAGES = {
    "open": "FOUR panels in a 2 x 2 grid (two rows of two equal panels). The story: on a weekend the two girls take a trip to an old inn in a "
            "misty mountain town, booked because it was suspiciously cheap. "
            "PANEL 1: seen over the twin-tail girl's shoulder (we do NOT see her face), her phone screen shows a hotel booking page: a photo "
            "of an old Japanese inn with a bell tower and a big red stamp '1泊 ¥980!!' and '残り1室'; the cat girl's face leaning in beside "
            "her shoulder, eyes sparkling. "
            "PANEL 2: the two girls with travel bags walk up a misty stone-paved slope of an old mountain town at dusk, paper lanterns "
            "along the street, a tall wooden bell tower rising out of the mist above the roofs; no other people. "
            "PANEL 3: in front of the inn's dark wooden entrance with a noren curtain bearing a bell crest, nobody comes to greet them: "
            "on the counter only a brass call bell and a handwritten note; the twin-tail girl rings the bell, the cat girl's ears twitch "
            "toward the silent dark hall. A small sound effect 'チーン…' drawn in. "
            "PANEL 4: inside the entrance hall a tall glass display case holds a life-size ichimatsu doll in a red kimono holding small "
            "golden scissors in her lap; the twin-tail girl takes a cute selfie with it (we see the girls from the side, the phone's back "
            "toward us), behind them the doll's eyes have turned toward the girls. A small '…?' drawn in. "
            "No speech balloons, no other text than the words named here.",
    "end": "FOUR panels in a 2 x 2 grid (two rows of two equal panels). The story: dawn after the night in the bell tower; the inn is gone. "
           "PANEL 1: at the top of the wooden bell tower at dawn, the big temple bell still swinging, the two girls slumped against the "
           "railing exhausted, sweaty and dishevelled, the sky turning pink over the misty mountain town. A sound effect 'ゴーン…' drawn in. "
           "PANEL 2: wide shot from outside: where the inn stood there is only an old overgrown ruin of fallen beams and a collapsed "
           "storehouse; the bell tower stands alone; a black crow flies off from the tower. "
           "PANEL 3: the two girls in the ruined entrance, the twin-tail girl holding up her phone (its back toward us) and pouting, the cat "
           "girl lifting the lid of an empty, broken lacquered breakfast box (a small paper sign beside it: '朝食 7:00'), both crestfallen: "
           "no hot spring, no breakfast. "
           "PANEL 4: close-up on the ground among the ruins: a small broken ichimatsu doll lying face down with a pair of rusty little "
           "scissors beside it; behind it, out of focus, the two girls walking away down the slope; the doll's hand has moved a little. "
           "No speech balloons, no other text than the words named here.",
}
for name, page in PAGES.items():
    JOBS[f"R63_page_{name}"] = [(f"{R}page_{name}_{v}.png", CREFS, CSTYLE + WHO + page + f" Variation {v}: its own camera angles.", "OPAQUE") for v in "abc"]

# ---------------------------------------------------------------- results illustration and the yukata picture
JOBS["R63_res"] = [
    (f"{R}res_cover_ep2_{v}.png", CREFS[:3] + [CON("kane"), f"{P62}she_a.png"], CSTYLE + WHO.replace("4 = the entrance hall of the old ryokan in "
     "this story (its look)", "4 = the bell tower in this story") + "ONE single panel illustration, NO text at all: at dawn on top of the bell "
     "tower the two girls pose triumphantly by the swinging bronze bell (the cat girl's ghost paw raised palm-out, the twin-tail girl blowing "
     "on her gun's muzzle), below the tower the misty town, and far below a tiny defeated scissor doll falling away with a puff. " +
     SHAPE["2:3"] + f" Variation {v}.", "OPAQUE") for v in "ab"] + [
    (f"{R}res_outfit_yk_{v}.png", ["art/raw/r62/yk_cat_fire_a.png", "art/raw/r62/yk_pink_fire_b.png", CON("kyakushitsu")], "Reference images "
     "1 and 2 are the two heroines of this game in their summer yukata: draw EXACTLY these two girls in EXACTLY these yukata (the cat girl's "
     "right arm is the white ghost cat paw: show it from its palm side). ONE single cute illustration, NO text: the two girls in their "
     "yukata posing together in a ryokan room at night, the cat girl holding a paper fan, the twin-tail girl making a heart with one hand, "
     "a paper lantern behind them. Anime style, full colour, clean line art. " + SHAPE["1:1"] + f" Variation {v}.", "OPAQUE") for v in "ab"]
