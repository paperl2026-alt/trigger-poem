# Round 92 (user 2026-10-22: the first episode's opening comic suddenly shows the lady's shadow and then cuts to the ghoul turning round,
# for no reason - either no shadow, or something moving far off and, coming closer, it is the ghoul; and the ending's crying over no
# ice cream is odd - they knew there was none from the start: the end should be a long sigh of relief and they go, no sudden black panel,
# calling back the opening - something moving far off, closer, and it is the ghoul turning round again): the two pages again, with both
# girls' design sheets and the twin-tail girl's outfit (docs/ART.md); tools/rounds/r92_import.py brings them in.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs47 import STYLE as PAGE_STYLE
from job_specs60 import OUTFIT
from job_specs53b import GHOUL

R = "art/raw/r92/"
SHOP = "art/raw/r53/sc_shop_a.png"
REFS = ["art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/ref/pink_poses.png", SHOP, GHOUL]
WHO = ("Reference images: 1 = the white-haired cat girl's design (white messy hair, white cat ears, red-framed glasses, a white kimono-like "
       "top with wide sleeves, a black obi sash with red cords, a white fluffy cat tail; her RIGHT arm ends in a big white fluffy GHOST CAT "
       "PAW with red claws); keep her look exactly. 2 and 3 = the black-haired twin-tail girl's design: " + OUTFIT + " 4 = the cute gelato "
       "cafe inside the old mansion (its look). 5 = the gelato ghoul, a monster of this story (its look). ")
GIRLS = "the two girls (the cat girl of reference image 1 and the twin-tail girl of reference images 2 and 3)"
PAGES = {
    "intro": ("Layout: three rows. Row 1: one wide panel across the page. Row 2: two equal panels. Row 3: two equal panels. Reading order: "
              "row 1, row 2 left, row 2 right, row 3 left, row 3 right. "
              "PANEL 1 (row 1, wide): an establishing shot like an old horror film's opening: at sunset, a lonely old Western mansion stands "
              "at the top of a grassy hill at the end of a long path lined with dark cypress trees; it has been turned into a cute gelato "
              "cafe: pink-and-white striped awnings, bunting flags, a hanging sign shaped like a gelato cone; tiny in the frame, " + GIRLS +
              " walk up the path, seen from BEHIND; the lettering 'NEW OPEN'. "
              "PANEL 2 (row 2 left): a first-person close-up of the mansion's ornate double front door with stained-glass windows; a girl's "
              "hand in a pink frilly sleeve pushes it open; a crack of warm golden light inside; the sound 'ギィ…'. "
              "PANEL 3 (row 2 right): inside the bright, cute cafe (like reference image 4): a long glass display counter full of colourful "
              "gelato trays; " + GIRLS + " press their hands against the glass, eyes sparkling, hearts around them; the lettering 'LIMITED!'. "
              "PANEL 4 (row 3 left): behind them the front door SLAMS SHUT by itself: the door, a jangling bell above it, motion lines, the "
              "two girls jumping in surprise in the foreground; the sound 'バタンッ!!'. "
              "PANEL 5 (row 3 right): the two girls seen from behind, small in the foreground, peering down the long dim cafe toward its far "
              "end: far away, behind the last counter in the shadows, something MOVES - only a vague hunched shape and a dripping bit of a "
              "frilly headband half hidden behind the counter, too far and too dark to make out; a little sound mark 'ガサ…' by it and a "
              "small '…?' over the girls. Nobody else anywhere: NO veiled woman, no reflection, no ghost, no face."),
    "end": ("Layout: a 3 x 2 grid of six equal rectangular panels (three columns, two rows). Reading order: top row left to right, then bottom "
            "row left to right. "
            "PANEL 1: the old mansion collapses in a cloud of honey and dust; " + GIRLS + " burst out of the front door running toward the "
            "reader; the sound 'ゴゴゴゴ'. "
            "PANEL 2: outside on the grassy hill in the soft light of dawn, the two girls have dropped down to sit on the grass, worn out "
            "and dusty, letting out a long sigh of relief, eyes closed, little puffs of breath; relaxed smiles; the lettering 'ふぅ…'. "
            "PANEL 3: seen from BEHIND, the two girls walk away down the path side by side in the morning light, the cat girl stretching her "
            "arms, the twin-tail girl's hands behind her back; the ruined cafe small on the hilltop behind them; calm and quiet, no tears. "
            "PANEL 4: a long shot of the ruined cafe on the hilltop from far away: in one dark broken window, something MOVES - a tiny "
            "hunched shape, too far to make out; a little sound mark 'ガサ…'. "
            "PANEL 5: closer: inside the ruined cafe by that window, a figure crouches with its BACK to the reader, slumped over a fallen "
            "gelato tray, eating, a frilly maid headband in its honey-coloured hair, an apron bow, honey dripping from it (the gelato ghoul of "
            "reference image 5, seen from behind); the small lettering '…?'. "
            "PANEL 6: a close-up: the figure's head has turned over its shoulder toward the reader: the rotten melted gelato face of reference "
            "image 5, one eye sliding down, a spoon between its teeth; no lettering. "
            "No completely black panel; no crying; no empty cones."),
}
JOBS = {f"R92_page_{k}": [(f"{R}page_{k}_{v}.png", REFS, PAGE_STYLE + WHO + d + f" Variation {v}.", "OPAQUE") for v in "abc"] for k, d in PAGES.items()}
