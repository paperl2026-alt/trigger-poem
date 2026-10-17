# Round 53 (docs/DESIGN.md「第 1 话」腐蜜之家): the user said "monsters first, two extra candidates of each to pick from; same art style
# as the current monsters, monster first".
#   R53_m_<id>:      six new small monsters (Italian gelato café x old Western mansion), five designs each (three are used).
#   R53_mproj:       what they throw (flying furniture, cherries, wafers), two sheets.
#   R53_scene_<id>:  concept paintings of the six places, each as a REAL version (a bright, cute gelato café / mansion) and a CORRUPTED
#                    version painted over the real one (rotten honey: melted, mouldy gelato, peeling wallpaper), two candidates each. They
#                    fix the look before the flat panels are made (docs/ART.md: a whole-scene painting is only a style reference).
#   R53_boss_f<n>:   the boss "Madame Rotten Honey", three forms, five candidates each.
# (the turning-around ghoul sheet and the comic pages come after the designs are picked: job_specs53b.py)
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs23 import REF as MREF

MON = [MREF, "art/raw/r23/desk.png", "art/raw/r43/m_clock_a.png"]   # the approved monster direction + two approved sheets
JOBS = {}

# ---------------------------------------------------------------- six small monsters
BASE = ("Reference image 1 shows the approved art direction for this game's monsters (the megaphone cluster and the photo-frame creature "
        "are right); reference images 2 and 3 are approved monster sprite sheets of this game: draw in EXACTLY their art style (clean anime "
        "line art, full colour, rich detail, a thin white sticker outline around the figure). "
        "THE MONSTER is a creepy, clearly abnormal creature made from the things of an Italian gelato cafe inside an old Western mansion, "
        "rotting like old honey and melted gelato (sticky drips, mouldy pastel colours, cracked wafer, tarnished brass), and it is girlified "
        "through its whole body (long hair, ribbons, frills, skirt-like parts, stockinged legs, cute shoes, eyelashes, glossy lips, coy "
        "feminine body language). It must look like a MONSTER first: NOT a normal pretty girl wearing an object, NOT an object with a woman's "
        "face stuck on it. Colours: honey amber, cream, sour pastel pink, pistachio, chocolate brown, tarnished gold; NOT dark green, NOT "
        "violet. "
        "Draw a game sprite sheet: the SAME monster six times in a 3 x 2 grid (three columns, two rows), one pose per cell, all at the same "
        "scale, each pose complete (the whole body) and fully inside its own cell with clear empty space between cells, nothing crossing into "
        "another cell. Transparent background. No text, no letters, no numbers, no grid lines, no ground, no cast shadows. NO EFFECTS: no "
        "glow, no sparkles, no motion lines, no smoke or steam clouds, no light rays around it (the game adds every effect itself). ")
NEW = {
    "ghoul": ("walker that comes close and bites, like the desk spider in reference image 2",
              "GELATO GHOUL, a shambling zombie made of rotting gelato: its body is a slumped stack of melting gelato scoops (pistachio gone "
              "grey, sour strawberry pink, chocolate oozing like old sauce) on a cracked waffle-cone ribcage; long hair of dripping honey syrup "
              "with a frilly cafe-maid headband sunk into it; a half-melted face, one eye sliding down the cheek, glossy lips, a gelato spoon "
              "stuck between its teeth; thin arms with long fingers like ice-cream spoons; legs in torn white frilly stockings and pink "
              "Mary-Jane shoes; a ruffled cafe apron hanging in rags.",
              "Poses, top row: 1 shambling forward, one leg mid-step, head lolling, 2 shambling, the other step, 3 crouched low and tense, about "
              "to pounce; bottom row: 4 lunging straight at the viewer, arms reaching, mouth wide open, 5 biting right in front of the viewer, "
              "very close and big, 6 hurt, recoiling, scoops splattering off, eyes squeezed shut."),
    "bat": ("small flyer that comes in swarms, like a flying test-paper ghost",
            "WAFER BAT, a small flying monster: its wings are fan-shaped gelato wafers with frilly paper-doily edges, its body is a round scoop "
            "of rotten berry gelato with a cherry-stalk tail, big glossy eyes with long lashes, a tiny fanged mouth with pink lips, two little "
            "dangling legs in white socks and black Mary-Jane shoes, a bow on its head.",
            "Poses, top row: 1 flying, wings up, 2 flying, wings down, 3 hanging upside down from its feet, wings folded like a skirt (idle); "
            "bottom row: 4 wings pulled back, about to dive (winding up), 5 diving straight at the viewer, mouth open, fangs bared, 6 hurt, a "
            "wafer wing cracked, eyes squeezed shut."),
    "chandelier": ("floating poltergeist that throws furniture, like the photo-frame creature",
                   "CHANDELIER POLTERGEIST, a big antique crystal chandelier floating in the air like a jellyfish: its curved brass arms are long "
                   "slender female arms in lace gloves holding dripping candles, its hanging crystal drops are long earrings and braids of "
                   "honey-blonde hair, in its centre a cracked porcelain face with heavy lashes and red lips, under it a long frilly skirt of "
                   "lace and sticky sugar threads; it clutches cafe chairs and teacups in its arms.",
                   "Poses, top row: 1 hovering, 2 hovering, swaying the other way, 3 idle, coy, arms crossed; bottom row: 4 winding up: two arms "
                   "raising a cafe chair high overhead, 5 throwing: the chair and teacups flying straight at the viewer, arms flung forward, "
                   "6 hurt, crystals snapping off, the porcelain face cracking."),
    "armor": ("decoration that suddenly comes alive and advances slowly, very tough",
              "ARMOR MAIDEN, an ornate suit of decorative knight armour from the mansion hall, enamelled cream and gold like a fancy dessert: the "
              "breastplate shaped like a corset with lace trim, a long skirt of armour plates like layered wafer rolls, a lance shaped like a "
              "long gelato cone; through the slit of the closed visor many eyes with long lashes stare out, long honey-blonde hair spills out of "
              "the helmet with a big ribbon, melted gelato oozes from every joint.",
              "Poses, top row: 1 standing perfectly still like a museum decoration, lance upright, visor dark (pretending), 2 the same stance but "
              "the eyes have opened in the visor and the head turns toward the viewer, 3 stepping forward slowly and heavily; bottom row: 4 "
              "raising the lance overhead (winding up), 5 thrusting the lance straight at the viewer, very close, 6 hurt, plates dented, ooze "
              "splashing, staggering back."),
    "doll": ("hides behind counters, pops up and throws things, like the clock lady in reference image 3",
             "COUPE DOLL, an antique bisque porcelain doll sitting inside a giant gelato coupe glass like a bathtub, her lower body melted into "
             "rotten gelato; a cracked porcelain face with glass eyes and a sweet smile that is too wide, long ringlet curls, a bonnet with "
             "ribbons, a frilly dress soaked with syrup; she holds wafer sticks and cherries to throw and a long-handled sundae spoon.",
             "Poses, top row: 1 hiding: sunk down behind the bottom edge, only the top of her bonnet and her eyes peeking over it, 2 rising up, "
             "3 idle, coy, head tilted; bottom row: 4 winding up to throw, arm drawn back, a fistful of cherries, 5 throwing cherries and wafer "
             "sticks straight at the viewer, 6 hurt, porcelain cracking, the glass chipped, eyes squeezed shut."),
    "espresso": ("hovering blaster with one huge must-hide attack, like the fire-extinguisher siren",
                 "ESPRESSO SIREN, a big shiny brass espresso machine floating in the air, laced into a cafe-apron corset; its two steam wands are "
                 "long twin tails ending in pink bows, its round pressure gauges are her eyes with long lashes, the group head is a mouth with "
                 "glossy lips, little cups dangle from her like a charm bracelet, a garland of coffee beans like a necklace, two legs in dark "
                 "stockings and high heels dangling below.",
                 "Poses, top row: 1 hovering, 2 hovering, swaying, 3 idle, coy, legs crossed; bottom row: 4 inhaling: body swelling, every gauge "
                 "needle in the red zone, lips puckered (a long wind-up), 5 blasting: mouth wide open straight at the viewer, steam wands flung "
                 "wide, body recoiling (do NOT draw the steam itself), 6 hurt, brass dented, a gauge glass cracked, eyes squeezed shut."),
}
for k, (beh, d, poses) in NEW.items():
    JOBS[f"R53_m_{k}"] = [(f"art/raw/r53/m_{k}_{v}.png", MON, BASE + f"The monster ({beh}): " + d + " " + poses +
                           f" Variation {v}: its own design details, same idea, a clearly different take from the other variations.")
                          for v in "abcde"]
for v in "ab":
    JOBS.setdefault("R53_mproj", []).append((f"art/raw/r53/mproj_{v}.png", [MREF, "art/raw/r23/proj.png"], "Same art style as reference image "
        "2 (clean anime line art, full colour, a thin white sticker outline). A game sprite sheet on a transparent background, a 3 x 2 grid, "
        "one object per cell, each centred with empty space around it, no text, no effects, no motion lines: things a haunted gelato cafe "
        "throws at you: 1 a small cafe chair with curly iron legs, tumbling, 2 a porcelain teacup with its saucer, 3 a brass candlestick with "
        "a dripping candle, 4 a glossy cherry with its stalk, 5 a rolled wafer stick, 6 a scoop of rotten pink gelato with a little face. "
        f"Variation {v}."))

# ---------------------------------------------------------------- the six places, real and corrupted
SCENE = ("Concept painting for one location of a cute Japanese bishoujo rail-shooter game. Paint in EXACTLY the style of reference image 1 "
         "(painting technique, line work, colour handling, level of detail). Landscape 3:2. The view is from about 1.1 m above the floor, "
         "looking straight down the length of the room, the far wall in the centre (the player stands here and fights things coming from the "
         "far end). Pretty and readable, rich in props, nothing blocking the centre of the view. No people, no characters, no monsters, no "
         "animals, no text, no letters, no signs with writing. ")
REAL = "THE REAL VERSION: bright, cute and inviting, warm afternoon light, clean pastel colours. "
CORRUPT = ("Reference image 2 is the REAL version of this exact place: repaint the SAME place, same camera, same layout, every wall, door, "
           "window and prop in the same position, as the CORRUPTED version: the house's ghost has woken and the cafe is turning back into a "
           "rotting old mansion: ROTTEN HONEY everywhere: gelato melted into thick sticky drips and puddles, pastel mould blooms, fermenting "
           "honey bubbling out of cracks, the wallpaper peeling off in long curls to show the old mansion's dark wood and stone underneath, "
           "cobwebs spun from sugar, candles melted down, furniture slightly twisted and tilted. Light: warm honey-amber and sour pink "
           "candlelight. It must stay beautiful in a creepy-cute way (this is a bishoujo game): NOT dark green, NOT violet, NOT a gloomy "
           "horror palette. ")
PLACES = {
    "shop": "An Italian gelateria built inside a renovated old Western mansion: a long glass gelato display counter full of colourful "
            "trays of gelato on the right, a marble serving counter, pastel striped awning over the counter, little round cafe tables and "
            "curly iron chairs on the left, a big chandelier, tall arched windows with lace curtains, an ornate double door at the far end.",
    "gallery": "A long mansion gallery corridor: big framed paintings on both walls (a young mother and her little child sharing a gelato, a "
               "garden, a lake, a family portrait; the faces painted softly), wall sconces, a long patterned runner carpet, a tall window "
               "at the far end.",
    "fountain": "The mansion's great hall turned into the cafe's garden room: a round marble fountain in the middle with a statue of a "
                "mother holding a gelato cone, two decorative knight armour suits standing on either side of the far doorway, potted "
                "lemon trees, a glass roof, part of the floor broken away with wooden planks laid over the gap.",
    "cold": "The basement cold storage of the cafe: rows of old chest freezers and gelato tubs, hanging frosted pipes, shelves of waffle "
            "cones and syrup bottles, an old wooden coffin-shaped freezer chest at the far end, frost on the stone walls, warm work lamps.",
    "oven": "The old mansion's kitchen turned into the cafe's bakery: a huge old brick oven with a round iron door at the far end, copper "
            "pots, flour sacks, rolling pins, a long wooden work table, a child's crayon drawings pinned on the wall (a mother and a little "
            "child, a cone of gelato; no letters).",
    "hall": "The mansion's grand ballroom used as the cafe's party hall: a huge staircase splitting left and right at the far end, a "
            "gigantic chandelier, a polished checkered floor, long tables with tiered gelato towers and cakes, tall windows, a portrait of the "
            "lady of the house over the stairs (an elegant woman, face hidden by a hat brim).",
}
for k, d in PLACES.items():
    steps = []
    for v in "ab":
        real = f"art/raw/r53/sc_{k}_{v}.png"
        steps.append((real, ["art/ref/corridor_concept.png"], SCENE + REAL + "THE PLACE: " + d + f" Variation {v}.", "OPAQUE"))
        steps.append((f"art/raw/r53/sc_{k}_{v}_x.png", ["art/ref/corridor_concept.png", real], SCENE + CORRUPT + "THE PLACE: " + d, "OPAQUE"))
    JOBS[f"R53_scene_{k}"] = steps

# ---------------------------------------------------------------- the boss "Madame Rotten Honey"
BOSS = ("Reference image 1 shows the approved art direction for this game's monsters; reference images 2 and 3 are approved monster sprite "
        "sheets of this game: draw in EXACTLY their art style (clean anime line art, full colour, rich detail, a thin white sticker outline). "
        "THE BOSS: the ghost of the lady of an old Western mansion that has become a gelato cafe; she lost her little child long ago and "
        "wants to keep every guest forever as a playmate for it. Her whole body is fused with the rotting sweets of the house (melted gelato, "
        "fermented honey, cracked wafer and porcelain, tarnished silver). It must look like a MONSTER first: grotesque, uncanny, "
        "sanity-draining, strong visual impact, but in honey amber, cream, sour pastel pink and tarnished gold (NOT dark green, NOT violet). "
        "Female features run through it (a lace mourning veil, an elegant tiered gown, long gloved arms, glossy lips, long hair), but it is "
        "NOT a pretty lady in a costume. Original design: no wild black hair, no plain red dress. "
        "Draw a game sprite sheet: the SAME boss six times in a 3 x 2 grid, one pose per cell, all at the same scale, each pose complete (the "
        "whole body) and fully inside its own cell with clear empty space between cells. Transparent background. No text, no letters, no "
        "grid lines, no ground, no shadows, NO EFFECTS (no glow, no sparkles, no smoke, no light rays). "
        "Poses, left to right, top row: 1 idle, 2 idle (breathing, looking elsewhere), 3 drifting sideways; bottom row: 4 winding up an "
        "attack, swelling, 5 attacking straight at the viewer, 6 hurt, recoiling. ")
FORMS = {
    1: "FORM 1, THE HOSTESS: a towering lady whose ballroom gown is a melting multi-tier gelato cake that drips down to the floor; her pale "
       "upper body in a lace mourning veil, her face a cracked porcelain mask with honey leaking from the eye holes like tears; very long "
       "arms in lace gloves whose fingers end in silver serving spoons; candles stuck in her piled-up honey-blonde hair; she carries a silver "
       "tray with a single gelato cone on it.",
    2: "FORM 2, THE MOTHER: the cake gown has burst open and many little sad ghost wisps shaped like small ice-cream cones with tiny crying "
       "faces cling all over her body and arms (the lost playmates); her porcelain mask has split down the middle and a huge screaming mouth "
       "opens behind it; extra long gloved arms reach out from her back; honey pours from her like a waterfall.",
    3: "FORM 3, THE GRIEF: she has collapsed into a huge pulsing mound of rotten honey and melted gelato shaped like an empty baby cradle made "
       "of waffle cone, with her real face rising from it (a young, gentle, sad mother's face, uncanny and too big), cradling an empty "
       "baby bonnet in long thin arms; the little cone-shaped wisps orbit around her.",
}
for n, d in FORMS.items():
    JOBS[f"R53_boss_f{n}"] = [(f"art/raw/r53/boss_f{n}_{v}.png", MON, BOSS + d + f" Variation {v}: its own design details, a clearly "
                               "different take from the other variations.") for v in "abcde"]

# ---------------------------------------------------------------- a fix found while checking the prologue comics
# The intro page (R47 c), panel 4 (both girls dashing out of the classroom): the cat girl has two ordinary hands, but her right arm is
# the cat-paw demon hand (DESIGN 主角; panel 1 of the same page shows it). Only that panel is cropped (fix_intro4_src.png = the page from
# 64% of its height down, left half) and repainted; tools/rounds/r53_fix_intro.py pastes it back as art/raw/r47/page_intro_c2.png.
JOBS["R53_fix_intro"] = [(f"art/raw/r53/fix_intro4_{v}.png", ["art/raw/r53/fix_intro4_src.png", "art/ref/cat_sheet.png"],
    "Reference image 1 is one panel of this game's comic page. Repaint it EXACTLY as it is (same composition, same framing, same aspect "
    "ratio, same characters, same poses, same classroom, the same 'ダッ' lettering, same line work and colours) with ONE change only: the "
    "white-haired cat girl's RIGHT arm, the one gripping the school bag's handle on the left side of the picture, must be her demon "
    "cat-paw arm exactly as designed in reference image 2: a big white fluffy cat-paw forearm and hand with long red claws coming out of "
    "her wide sleeve, gripping the bag's handle. Show the paw from the side or from the palm side so that the BACK of the paw is not "
    "visible (no symbol, no circle, no seal on it). Her other hand stays a normal hand. Change nothing else: no new objects, no new text, "
    f"no effects, no glow. Variation {v}.", "OPAQUE") for v in "ab"]

# ---------------------------------------------------------------- reruns after the first look (Claude's review)
# chandelier a-e: all of them are a pretty girl wearing a chandelier (a full human face and body) - exactly what docs/DESIGN.md「怪物」
# forbids. doll a-e: a cute little girl sitting in a sundae glass, not creepy at all. Stricter descriptions, three more each.
NEW2 = {
    "chandelier": ("floating poltergeist that throws furniture, like the photo-frame creature",
                   "CHANDELIER POLTERGEIST. THE CHANDELIER ITSELF IS THE WHOLE BODY: a big antique brass-and-crystal chandelier floating in "
                   "the air. ABSOLUTELY NO human head, NO human face, NO human torso, NO girl inside or under it. Its eyes are a ring of glossy "
                   "eyeballs with long lashes set into the brass frame between the candles; its mouth is a round opening with glossy red lips "
                   "and crystal teeth in the bottom of the frame; its brass candle arms bend like long thin limbs and end in small lace-gloved "
                   "hands; its hanging crystal drops are tangled with long honey-blonde hair and red ribbons; a frilly lace skirt of sticky "
                   "sugar threads hangs from the bottom ring, and two thin legs in white stockings and red Mary-Jane shoes dangle out of it; "
                   "melted candle wax and rotten honey drip everywhere. It hugs cafe chairs and teacups with its arms."),
    "doll": ("hides behind counters, pops up and throws things, like the clock lady in reference image 3",
             "COUPE DOLL, a broken antique bisque porcelain doll that has rotted into a giant gelato coupe glass, CREEPY, NOT cute: half of "
             "her porcelain face has broken away and the hollow inside of her head is full of melted gelato oozing out of the hole; two glass "
             "eyes of different sizes, one rolled up; a painted smile that has cracked open far too wide, showing a row of tiny wafer teeth; "
             "ball-jointed doll limbs with visible joints, one arm on backwards; matted ringlet curls, a stained bonnet, a frilly dress "
             "soaked with syrup; her lower body is melted into the rotten gelato in the glass; she holds wafer sticks and cherries to throw."),
}
POSES2 = {"chandelier": NEW["chandelier"][2], "doll": NEW["doll"][2]}
for k, (beh, d) in NEW2.items():
    JOBS[f"R53_m2_{k}"] = [(f"art/raw/r53/m2_{k}_{v}.png", MON, BASE + f"The monster ({beh}): " + d + " " + POSES2[k] +
                            f" Variation {v}: its own design details, a clearly different take from the other variations.") for v in "abc"]
