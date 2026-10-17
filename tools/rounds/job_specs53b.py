# Round 53b (docs/DESIGN.md「第 1 话」, 2026-10-18 user: the homage has to be ACTED — every famous scene of Sweet Home recognisable at
# 70-80%, done the gelato-cafe way; the numbers ① … ⑰ are docs/episodes/sweet_home.md「恐怖演出」).
#   R53b_turn:      the gelato ghoul of the turning-around scene (⑰ / Resident Evil's first zombie): back turned eating -> turning -> facing
#   R53b_m_<id>:    the new monsters the scenes need: the half-body crawler (④), the shadow (the film's shadow that burns a man in half),
#                   the two melted-gelato doubles of the heroines (⑮ the spirits that look like the party)
#   R53b_door_<n>:  the first-person door close-ups between stages (①): a doorway (opening = solid black) + its door leaf / leaves alone
#   R53b_fresco:    the gallery paintings (the photographed frescoes), each real + rotten with the syrup message
#   R53b_crayon:    the kitchen's crayon drawings that tell the truth without words (⑪), real + rotten
#   R53b_props:     the coffin freezer + its lid + the skeleton's eyes (⑫), the barrier's seals (⑬), the ghost hands that grab the camera
#                   (⑥), the boss's three objects (photo -> diary -> coffin), the netherworld backdrop and its floating things (⑮)
#   R53b_page_<id>: the comic pages (opening ①②, sweeping the glass ②, the selfie with the painting, burning the web ③, the fountain ⑨,
#                   the boss leaving her portrait, the ending ⑰), three candidates each
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs53 import MON, BASE, NEW
from job_specs41 import CATD, PINKD
from job_specs47 import STYLE as PAGE_STYLE

CAT, PINK = "art/ref/cat_sheet.png", "art/ref/pink_sheet.png"
GHOUL = "art/raw/r53/m_ghoul_a.png"
JOBS = {}

# ---------------------------------------------------------------- the turning-around ghoul
JOBS["R53b_turn"] = [(f"art/raw/r53b/turn_{v}.png", MON + [GHOUL], BASE.replace("THE MONSTER is", "THE MONSTER (exactly the one in reference "
    "image 4, same design, same colours) is") + "The monster: the GELATO GHOUL of reference image 4. This sheet is its famous TURNING-AROUND "
    "scene, all six cells at the same scale, the camera behind it and slightly above. Poses, top row: 1 crouched on the floor with its BACK to "
    "the viewer, hunched over, eating out of a big tub of gelato held in its lap (we see only its back: the honey hair, the apron bow, the "
    "spine of waffle-cone ribs, the heels of its shoes), 2 the same, but it has stopped eating and its head is lifting, still seen from "
    "behind, 3 its head turned over its shoulder in profile, one sliding eye looking back at the viewer, the rest of the body still turned "
    "away; bottom row: 4 the head turned further, the rotten face over its shoulder looking straight at the viewer, gelato smeared around its "
    "mouth, a spoon in its teeth, 5 the whole body turned around, still crouching, facing the viewer, mouth opening, 6 rising up from the "
    f"crouch, arms lifting toward the viewer. Variation {v}.") for v in "abc"]

# ---------------------------------------------------------------- monsters the scenes need
NEW_B = {
    "crawler": (MON + [GHOUL], "crawls fast at you along the floor; must be shot before it gets there",
        "HALF-BODY GHOUL: only the UPPER HALF of a gelato ghoul like reference image 4 (same materials and colours): it has no legs, its body "
        "ends below the ribs in a torn mess of melted gelato and cracked waffle cone, and it drags itself across the floor on its long arms "
        "with spoon-like fingers, leaving a trail of melted gelato and honey; long honey hair dragging, a frilly headband, a rotten face with "
        "a wide mouth.",
        "Poses, top row: 1 crawling, one arm reaching forward, 2 crawling, the other arm, 3 head raised, looking at the viewer (idle); bottom "
        "row: 4 rearing up on its arms, about to lunge (winding up), 5 lunging straight at the viewer, mouth wide open, very close, 6 hurt, "
        "flattened, gelato splattering."),
    "shadow": (MON, "a shadow that glides along walls and floors; its attack sweeps across the whole room and can only be hidden from",
        "THE SHADOW: a living SHADOW, flat like a silhouette cut from black paper but alive: the shadow of a tall lady in a wide-brimmed hat "
        "and a long ballgown, impossibly long thin arms and fingers, the hem of the gown melting into sticky drips; it is a flat deep "
        "burgundy-black shape with a thin uneven honey-gold rim along its edge (drawn, not glowing), two small pale eyes in the shadow of the "
        "hat, a thin crescent of a smile.",
        "Poses, top row: 1 gliding to the side, gown trailing, 2 standing tall, arms hanging, 3 tilting its head, curious (idle); bottom row: "
        "4 stretching one arm far to the side, the hand opening (winding up), 5 the arm sweeping across horizontally at waist height, "
        "stretched long and flat like a blade, 6 hurt, the silhouette torn and flickering apart."),
    "double_pink": (MON + [PINK], "a copy of the twin-tail girl that walks and shoots at you",
        "MELTED DOUBLE: a monster that is a life-size STATUE-COPY of the twin-tail girl in reference image 4 (her silhouette, twin tails with "
        "ribbons, frilly blouse with sailor collar, skirt, shoes), but made entirely of rotten pastel gelato and dripping wax: everything "
        "melts and sags, the colours are sickly pinks and creams, the face is a smooth melting mask with two HOLLOW EMPTY EYE HOLES and a "
        "too-wide grin; it holds a melting gelato-cone pistol. Fully clothed shapes, nothing revealing; uncanny, not pretty.",
        "Poses, top row: 1 standing, head tilted, 2 swaying, dripping, 3 walking sideways; bottom row: 4 raising the cone pistol (winding "
        "up), 5 shooting straight at the viewer, 6 hurt, half of it melting away."),
    "double_cat": (MON + [CAT], "a copy of the cat girl that lunges at you with its paw",
        "MELTED DOUBLE: a monster that is a life-size STATUE-COPY of the white-haired cat girl in reference image 4 (her silhouette, cat ears, "
        "glasses, sailor uniform, tail, the giant fur paw for a right arm), but made entirely of rotten pastel gelato and dripping wax: "
        "everything melts and sags, sickly creams and pinks, the face is a smooth melting mask with two HOLLOW EMPTY EYE HOLES behind empty "
        "glasses frames and a too-wide grin; the giant paw is a melting scoop of gelato with wafer claws. Fully clothed shapes; uncanny, not "
        "pretty.",
        "Poses, top row: 1 standing, head tilted, 2 swaying, dripping, 3 walking sideways; bottom row: 4 raising the melting paw high "
        "(winding up), 5 swiping the paw straight at the viewer, very close, 6 hurt, half of it melting away."),
}
for k, (refs, beh, d, poses) in NEW_B.items():
    JOBS[f"R53b_m_{k}"] = [(f"art/raw/r53b/m_{k}_{v}.png", refs, BASE + f"The monster ({beh}): " + d + " " + poses +
                            f" Variation {v}: its own design details, a clearly different take from the other variations.") for v in "abcde"]

# ---------------------------------------------------------------- the door close-ups
DOORSTYLE = ("Paint in the style of reference image 1 (this game's concept painting of the place: same painting technique, colours, light "
             "and materials). Orthographic, perfectly front-on, NO perspective; no people, no monsters, no text. ")
DOORS = {
    1: ("art/raw/r53/sc_shop_a_x.png", "an ornate white-and-gold double door of the gelato cafe in the old mansion, carved panels, oval windows "
        "(their glass painted dark honey-amber), gilded handles, sticky honey dripping from the lintel", 2),
    2: ("art/raw/r53/sc_gallery_a_x.png", "a carved dark-wood mansion double door with brass door knockers shaped like gelato cones, peeling "
        "wallpaper around it, sugar cobwebs in the corners", 2),
    3: ("art/raw/r53/sc_fountain_a_x.png", "a tall glasshouse door of white wrought iron with frosted glass panes (painted milky amber), ivy and "
        "dripping honey on the frame", 2),
    4: ("art/raw/r53/sc_cold_a_x.png", "a heavy old steel walk-in freezer door with a big lever handle, rivets, frost and dripping syrup", 1),
    5: ("art/raw/r53/sc_oven_a_x.png", "an old kitchen swing door of painted wood with a round porthole window (glass painted dark amber), pinned "
        "crayon drawings beside it", 1),
    6: ("art/raw/r53/sc_oven_a_x.png", "the round black cast-iron door of a huge old brick bread oven, rivets, a big iron latch, set in the "
        "soot-stained brick (the doorway is ROUND)", 1),
    7: ("art/raw/r53/sc_hall_a_x.png", "a gigantic gilded ballroom double door, very tall, with carved roses and cherries, pink drapes on both "
        "sides, honey dripping from the gilding", 2),
}
for n, (ref, d, leaves) in DOORS.items():
    steps = []
    for v in "ab":
        frame = f"art/raw/r53b/door{n}_frame_{v}.png"
        steps.append((frame, [ref], DOORSTYLE + "Landscape 3:2. THE DOORWAY of " + d + ", seen straight on, centred, filling most of the "
                      "picture, with the wall around it. The DOOR ITSELF IS NOT THERE: the doorway opening is filled with SOLID FLAT PURE BLACK "
                      "(#000000), a clean shape with crisp edges, nothing drawn inside it. " + f"Variation {v}.", "OPAQUE"))
        steps.append((f"art/raw/r53b/door{n}_leaf_{v}.png", [ref, frame], DOORSTYLE + "Reference image 2 shows a doorway whose opening is solid "
                      "black. Draw ONLY THE CLOSED DOOR that fits exactly into that opening: " + d + (", both leaves closed side by side" if leaves
                      == 2 else ", one leaf") + ", seen straight on, exactly the shape of the black opening, nothing else: no wall, no frame "
                      "around it, no floor. Transparent background."))
    JOBS[f"R53b_door{n}"] = steps

# ---------------------------------------------------------------- the gallery paintings (the frescoes photographed)
FRESCO = ("A framed painting hanging in an old Western mansion, seen straight on (orthographic, no perspective, no wall, transparent "
          "background around the frame): an ornate gilded frame, inside it a soft romantic oil painting in pastel colours. No text, no "
          "people other than those described; no men. ")
ROT = ("Reference image 1 is this exact painting: repaint the SAME painting, same frame, same composition, ROTTEN: honey and melted gelato "
       "drip down over it from the top of the frame, the paint has bubbled and peeled, the faces of the people in it are smeared away "
       "into blank pale ovals, and across the painting the word 'あそぼ' is written in thick dripping red syrup, like a message scrawled with "
       "a finger. Transparent background around the frame. ")
SUBJECTS = {
    1: "a young mother in a wide hat and a pale dress sharing a gelato cone with her little daughter on a garden bench (both faces soft)",
    2: "a little girl on a garden swing under a lemon tree, her mother pushing the swing",
    3: "the old mansion seen across a calm lake at sunset, a little white pavilion on an island in the lake",
    4: "a still life: crystal coupes of gelato, lemons, roses and a silver spoon on a lace tablecloth",
    5: "the lady of the house alone, standing in an elegant gown, her face hidden in the shadow of a wide hat brim",
    6: "the mother and her little daughter baking at a big brick oven, flour on their hands, a tray of cookies",
}
for n, d in SUBJECTS.items():   # one job per painting (the rotten one is painted over the real one)
    real = f"art/raw/r53b/fresco{n}.png"
    JOBS[f"R53b_fresco{n}"] = [(real, ["art/raw/r53/sc_gallery_a.png"], FRESCO + "The painting: " + d + ". Portrait orientation 2:3."),
                               (f"art/raw/r53b/fresco{n}_x.png", [real], ROT)]

# ---------------------------------------------------------------- the crayon drawings that tell the truth (⑪, no words)
CRAYON = ("A child's crayon drawing on a sheet of slightly crumpled drawing paper, pinned with a pushpin, seen straight on (no perspective, "
          "transparent background around the paper): naive wobbly lines, bright wax-crayon colours, a 5-year-old's drawing. No letters, "
          "no words, no numbers. Landscape 3:2. The drawing: ")
CRAY = {
    1: "a tall mother in a long dress and a big hat baking cookies with a small girl with a hair ribbon, both smiling, a sun with a face",
    2: "the small girl with the hair ribbon holding an ice-cream cone, playing beside a big brick oven drawn as a red box with a round black door",
    3: "the big brick oven with huge orange and red scribbled flames, and only a little pink hair ribbon lying on the floor in front of it",
    4: "the tall mother alone, kneeling, crying big blue tears, holding a little bonnet in her arms, dark scribbled clouds over her",
}
ROTC = ("Reference image 1 is this exact drawing: the SAME drawing, now ROTTEN: smeared with honey and melted gelato, the paper stained "
        "brown and curling, angry dark red crayon scribbled hard over it, the faces scratched out. Transparent background. ")
for n, d in CRAY.items():
    real = f"art/raw/r53b/crayon{n}.png"
    JOBS[f"R53b_crayon{n}"] = [(real, [], CRAYON + d + "."), (f"art/raw/r53b/crayon{n}_x.png", [real], ROTC)]

# ---------------------------------------------------------------- props for the scenes
PROPSTYLE = ("Paint in the style of reference image 1 (this game's concept painting of the place). A single game prop on a transparent "
             "background, centred, front view at eye level, no floor, no cast shadow, no effects, no text. ")
PROPS = [
    ("art/raw/r53b/coffin_box.png", ["art/raw/r53/sc_cold_a_x.png"], PROPSTYLE + "An old wooden chest freezer shaped like a COFFIN with brass "
     "fittings and frost, its LID REMOVED (open, seen from the front and a little above so the inside shows): lying inside on a bed of melted "
     "gelato is a small SKELETON made of popsicle sticks and wafer bones, wearing a frilly bonnet, its skull with two EMPTY round eye sockets "
     "(nothing in them).", ),
    ("art/raw/r53b/coffin_lid.png", ["art/raw/r53/sc_cold_a_x.png", "art/raw/r53b/coffin_box.png"], PROPSTYLE + "ONLY THE LID of the coffin "
     "freezer in reference image 2, alone, seen straight on from the front as if standing upright: wood, brass corners, frost, a little "
     "cross-shaped brass ornament."),
    ("art/raw/r53b/eyes.png", [], "Two glossy cartoon eyeballs side by side on a transparent background, each with a pink iris and a black "
     "pupil, white with thin red veins, clean anime line art, no glow, no text."),
    ("art/raw/r53b/seals.png", ["art/raw/r53/sc_oven_a_x.png"], PROPSTYLE.replace("A single game prop", "A sheet of four game props in a 2 x 2 "
     "grid, each centred with empty space around it,") + "Four round WAX SEALS of dark honey wax, each stamped with a lady's profile cameo and "
     "a rose, a torn pink ribbon hanging from each; four slightly different ones."),
    ("art/raw/r53b/hands_a.png", [], "Two long pale ghostly lady's HANDS with lace cuffs and long nails, reaching down from the top edge of the "
     "picture toward the viewer, fingers spread wide, seen from the front, clean anime line art, honey dripping from the cuffs, transparent "
     "background, no glow, no text. Landscape 3:2."),
    ("art/raw/r53b/hands_b.png", [], "Two long pale ghostly lady's HANDS with black lace gloves, reaching in from the left and right edges toward "
     "the viewer as if to grab them, clean anime line art, transparent background, no glow, no text. Landscape 3:2."),
    ("art/raw/r53b/ritual.png", ["art/raw/r53/sc_hall_a_x.png"], PROPSTYLE.replace("A single game prop", "A sheet of three game props side by "
     "side, each centred with empty space around it,") + "1 a gilded oval PHOTO FRAME holding an old sepia photograph of a smiling young "
     "mother hugging her little daughter (faces soft), 2 a small DIARY with a lace-covered cover and a heart-shaped lock, 3 a tiny white "
     "COFFIN-SHAPED box like a cake box, tied with a pink ribbon."),
    ("art/raw/r53b/nether_a.png", ["art/raw/r53/sc_hall_a_x.png"], "Concept painting in the style of reference image 1: the NETHERWORLD inside "
     "the oven: an endless honey-amber void, a sea of slowly melting gelato clouds far below, waffle cones, spoons, teacups and broken "
     "portrait frames floating at different distances, a huge pale moon like a scoop of vanilla, warm and dreamlike but wrong. No people, no "
     "monsters, no text. Landscape 3:2.", "OPAQUE"),
    ("art/raw/r53b/nether_b.png", ["art/raw/r53/sc_hall_a_x.png"], "Concept painting in the style of reference image 1: the NETHERWORLD inside "
     "the oven: an endless honey-amber void of drifting syrup mist, floating islands of broken checkered ballroom floor, floating gelato "
     "cones and teacups, long ribbons drifting, a huge pale moon. No people, no monsters, no text. Landscape 3:2.", "OPAQUE"),
    ("art/raw/r53b/nether_bits.png", ["art/raw/r53/sc_hall_a_x.png"], PROPSTYLE.replace("A single game prop", "A sheet of nine game props in a "
     "3 x 3 grid, each centred with empty space around it,") + "floating things of the netherworld: a waffle cone, a silver spoon, a teacup, "
     "a broken gilded frame, a melting gelato scoop, a ribbon, a candle, a cherry, a lace glove."),
]

JOBS["R53b_coffin"] = PROPS[:3]                      # the box, its lid (painted to match the box), the eyes
for i, st in enumerate(PROPS[3:]): JOBS[f"R53b_prop{i + 1}"] = [st]

# ---------------------------------------------------------------- comic pages
REFS2 = "Reference images: 1 = the white-haired cat girl's design, 2 = the black-haired twin-tail girl's design; keep their looks exactly. "
PAGES = {
    "intro": (REFS2 + "Reference image 3 = the gelato cafe's look (inside). ", [CAT, PINK, "art/raw/r53/sc_shop_a.png"],
        "Layout: three rows. Row 1: one wide panel across the page. Row 2: two equal panels. Row 3: two equal panels. Reading order: row 1, "
        "row 2 left, row 2 right, row 3 left, row 3 right. "
        "PANEL 1 (row 1, wide): an establishing shot like an old horror film's opening: at sunset, a lonely old Western mansion stands at the "
        "top of a grassy hill at the end of a long path lined with dark cypress trees; it has been turned into a cute gelato cafe: pink-and-"
        "white striped awnings, bunting flags, a hanging sign shaped like a gelato cone; tiny in the frame, the two girls walk up the path, "
        "seen from BEHIND; the lettering 'NEW OPEN'. "
        "PANEL 2 (row 2 left): a first-person close-up of the mansion's ornate double front door with stained-glass windows; a girl's hand in "
        "a pink frilly sleeve pushes it open; a crack of warm golden light inside; the sound 'ギィ…'. "
        "PANEL 3 (row 2 right): inside the bright, cute cafe (like reference image 3): a long glass display counter full of colourful gelato "
        "trays; " + CATD + " and " + PINKD + " press their hands against the glass, eyes sparkling, hearts around them; the lettering "
        "'LIMITED!'. "
        "PANEL 4 (row 3 left): behind them the front door SLAMS SHUT by itself: the door, a jangling bell above it, motion lines, the two girls "
        "jumping in surprise in the foreground; the sound 'バタンッ!!'. "
        "PANEL 5 (row 3 right): a close-up of the door's glass pane: in its REFLECTION a tall woman in a lace mourning veil and an elegant gown "
        "stands right behind the girls, her face hidden by the veil, one gloved hand raised; the room itself, in front of the glass, is empty "
        "(she is only in the reflection); no lettering."),
    "glass": (REFS2, [CAT, PINK, "art/raw/r53/sc_shop_a_x.png"],
        "Layout: three equal tall panels side by side. Reading order: left to right. The place looks like reference image 3 (the cafe gone "
        "rotten: honey drips, peeling wallpaper). "
        "PANEL 1: the cafe's inner door is blocked by a HEAP OF SHATTERED GLASS from the gelato display, glass shards and melted gelato "
        "everywhere; " + PINKD + " stands in front of it, hands on her hips, pouting. "
        "PANEL 2: " + CATD + " crouches and sweeps her giant white fur ghost paw across the floor like the nozzle of a VACUUM CLEANER; the "
        "glass shards and gelato are sucked toward the paw in streaks; the sound 'ズゴゴゴゴ'. "
        "PANEL 3: the floor is clean, the door is free; the cat girl proudly holds up her paw with a smug face; the twin-tail girl claps; "
        "sparkles; the sound 'ピカッ'."),
    "photo": ("", [PINK, CAT, "art/raw/r53/sc_gallery_a_x.png", "art/raw/r53b/fresco1.png"],
        "Reference images: 1 = the twin-tail girl, 2 = the cat girl, 3 = the mansion gallery (rotten), 4 = the painting on the wall. Layout: "
        "two equal panels side by side. "
        "PANEL 1: in the gallery, " + PINKD + " takes a SELFIE with her smartphone held up in front of her (the screen faces HER, the reader "
        "sees the back of the phone), posing with a peace sign in front of the big framed painting of reference image 4; the cat girl peeks "
        "in from the side; a camera FLASH bursts from the phone; the sound 'パシャ'. "
        "PANEL 2: the same painting, close up, in the white light of the flash: the faces in it have smeared away into blank pale ovals and "
        "across it, in thick dripping red syrup, is written 'あそぼ'; honey runs down the frame; no other lettering."),
    "web": (REFS2, [CAT, PINK, "art/raw/r53/sc_gallery_a_x.png"],
        "Layout: three equal tall panels side by side. Reading order: left to right. The place looks like reference image 3. "
        "PANEL 1: a doorway closed by a thick, glittering web of spun sugar and candy floss stretched across it like ropes, drops of rotten "
        "gelato stuck in it; the two girls looking at it, the twin-tail girl poking it with one finger. "
        "PANEL 2: " + CATD + " raises her giant fur paw; a small orange flame burns on the tip of one red claw and touches the web; the sound "
        "'ボッ'. "
        "PANEL 3: the web melts into burning caramel that drips and falls away, the doorway is open; " + PINKD + " sniffs the air with a happy "
        "face; the lettering 'いい匂い♡'."),
    "fountain": (REFS2, [CAT, PINK, "art/raw/r53/sc_fountain_a.png"],
        "Layout: a 2 x 2 grid of four equal rectangular panels. Reading order: top left, top right, bottom left, bottom right. The place looks "
        "like reference image 3 (a glasshouse hall with a round marble fountain whose statue is a mother holding a gelato cone). "
        "PANEL 1: the fountain spouts pink STRAWBERRY SYRUP instead of water; " + PINKD + " leans over the basin with sparkling, greedy eyes. "
        "PANEL 2: she drinks from her cupped hands, eyes closed in bliss, hearts around her; the lettering 'つめた～い♡'. "
        "PANEL 3: a close-up of the marble statue's face: thick RED TEARS run down from its stone eyes; the syrup in the basin turns dark, "
        "blackish red; the lettering '…'. "
        "PANEL 4: the twin-tail girl SPITS it out in a comic spray, 'ブーッ!!', while " + CATD + " recoils with a disgusted face; the syrup in "
        "her hands is dark red."),
    "boss": (REFS2 + "Reference image 3 = the ballroom, 4 = the boss. ", [CAT, PINK, "art/raw/r53/sc_hall_a_x.png", "art/raw/r53/boss_f1_e.png"],
        "Layout: three equal tall panels side by side. Reading order: left to right. "
        "PANEL 1: the grand ballroom of reference image 3: over the split staircase hangs a huge portrait of the lady of the house in a wide "
        "hat, her face in shadow; the two girls stand tiny at the bottom of the stairs, looking up. "
        "PANEL 2: a close-up of the portrait: the painted lady's gloved hand slowly reaches OUT of the picture, the paint stretching like "
        "honey; the sound 'ズ…'. "
        "PANEL 3: the boss of reference image 4 steps out of the empty frame into the ballroom, towering over the girls, honey pouring from "
        "her; the sound 'ズズズ…'."),
    "end": (REFS2 + "Reference image 3 = the cafe, 4 = the gelato ghoul. ", [CAT, PINK, "art/raw/r53/sc_shop_a.png", GHOUL],
        "Layout: a 3 x 2 grid of six equal rectangular panels (three columns, two rows). Reading order: top row left to right, then bottom "
        "row left to right. "
        "PANEL 1: the old mansion collapses in a cloud of honey and dust; the two girls burst out of the front door running toward the reader; "
        "the sound 'ゴゴゴゴ'. "
        "PANEL 2: back in the real world: the gelato cafe of reference image 3 lies in ruins: the glass display counter is smashed and every "
        "tray of gelato has melted into puddles; the two girls kneel on the floor holding EMPTY waffle cones, crying comically with waterfall "
        "tears. "
        "PANEL 3: " + PINKD + " holds her phone up for a SELFIE of the two of them (the screen faces the girls; the reader sees them from the "
        "front): peace signs with their empty cones, teary forced smiles; the sound 'パシャ'. "
        "PANEL 4: a completely BLACK panel, nothing in it. "
        "PANEL 5: inside the ruined cafe at dusk, a figure stands with its BACK to the reader by a tall window, slumped, a frilly maid "
        "headband in its honey-coloured hair, an apron bow, honey dripping from it (the gelato ghoul of reference image 4, seen from behind); "
        "the small lettering '…?'. "
        "PANEL 6: a close-up: the figure's head has turned over its shoulder toward the reader: the rotten melted gelato face of reference "
        "image 4, one eye sliding down, a spoon between its teeth; no lettering."),
}
for k, (refs, imgs, d) in PAGES.items():
    JOBS[f"R53b_page_{k}"] = [(f"art/raw/r53b/page_{k}_{v}.png", imgs, PAGE_STYLE + refs + d + f" Variation {v}.", "OPAQUE") for v in "abc"]

# ---------------------------------------------------------------- reruns
# page_web a/b were refused by the safety filter with the twin-tail girl's design sheet as a reference (docs/ART.md: her sheer pink dress
# trips it): her sheet is left out and her clothes are written out plainly. page_photo ran before fresco1 existed. page_end a: a tool error.
PINKD2 = ("the black-haired twin-tail girl (long black twin tails with pink and mint ribbons, a bunny hair clip, a long-sleeved pink frilly "
          "blouse with a mint sailor collar and a knee-length pink skirt, fully clothed, wholesome)")
REFS1 = "Reference images: 1 = the white-haired cat girl's design; keep her look exactly. "
JOBS["R53b_page_web2"] = [(f"art/raw/r53b/page_web_{v}.png", [CAT, "art/raw/r53/sc_gallery_a_x.png"], PAGE_STYLE + REFS1 +
    PAGES["web"][2].replace("reference image 3", "reference image 2").replace(PINKD, PINKD2).replace("the two girls looking at it, the "
    "twin-tail girl poking it with one finger", "the two girls looking at it, the twin-tail girl pointing at it") + f" Variation {v}.",
    "OPAQUE") for v in "ab"]
JOBS["R53b_page_photo2"] = [(f"art/raw/r53b/page_photo_{v}.png", [CAT, "art/raw/r53/sc_gallery_a_x.png", "art/raw/r53b/fresco1.png"], PAGE_STYLE +
    "Reference images: 1 = the white-haired cat girl's design (keep her look exactly), 2 = the mansion gallery (rotten), 3 = the painting on "
    "the wall. " + PAGES["photo"][2].split(" Layout: ", 1)[1].replace("reference image 4", "reference image 3").replace(PINKD, PINKD2) +
    f" Variation {v}.", "OPAQUE") for v in "abc"]
JOBS["R53b_page_end2"] = [("art/raw/r53b/page_end_a.png",) + JOBS["R53b_page_end"][0][1:]]
