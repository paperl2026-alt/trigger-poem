# Round 61 (user 2026-10-18 第十七批 9: "漫画你太执着于转场二字了，应该是承上启下……比如你突然出现怪物 融化的喵娘和地雷妹，这些为啥？"): a page
# that tells WHY the honey tunnel has melted copies of the two girls (docs/DESIGN.md「第 1 话」: the house wants playmates for the
# lady's little daughter, so it makes them; the copies are its first try at the two of them). After the fall page, before the tunnel.
#   R61_page_double -> comic/ep1p_double (tools/rounds/r61_import.py), four panels in a 2 x 2 grid
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs47 import STYLE
from job_specs60 import OUTFIT

REFS = ["art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/raw/r61/ref_fall.png", "art/raw/r61/ref_double_cat.png", "art/raw/r61/ref_double_pink.png"]
WHO = ("Reference images: 1 = the white-haired cat girl's design (white messy hair, white cat ears, red-framed glasses, a white kimono-like top "
       "with wide sleeves, a black obi sash with red cords, a white fluffy cat tail; her right arm ends in a big white fluffy GHOST CAT PAW with "
       "red claws: in this page show that paw from its PALM side or lowered at her side, never its back); keep her look exactly. 2 = the "
       "black-haired twin-tail girl's design: " + OUTFIT + " 3 = a page of this same manga (the girls falling into this honey tunnel): match "
       "its drawing style, colours and the tunnel exactly: a cave of dark tree roots, bones and honeycomb, everything dripping with golden honey, "
       "warm amber light. 4 and 5 = the MELTED COPIES of the two girls (monsters made of melting gelato and honey that look like the girls: "
       "hollow black eyes, too-wide grins, dripping); draw them like that. ")
PAGE = (STYLE + WHO + "FOUR panels in a 2 x 2 grid (two rows of two equal panels). The story of this page: after falling into the honey, the two "
        "girls see that their reflections in the honey do not copy them; the reflections rise up as melted copies of them and slip away deeper "
        "into the tunnel. "
        "PANEL 1 (top left): in the honey tunnel, the two girls pick themselves up out of a waist-deep pool of thick golden honey, sticky honey "
        "dripping from their hair and clothes, annoyed: the twin-tail girl wrings honey out of one twin tail with a disgusted face, the cat girl "
        "shakes honey off her ghost paw (palm side), her ears flattened. A small sound effect 'ベタ…' drawn in. "
        "PANEL 2 (top right): a close-up looking down at the honey pool's glossy surface: in it the REFLECTIONS of the two girls, upside down, but "
        "the reflections are WRONG: they are NOT copying the girls, they grin widely with hollow black eyes, looking straight up at the viewer. At "
        "the very top edge of the panel, the real girls' heads seen from behind, looking down at the pool. A small '…?' drawn in. "
        "PANEL 3 (bottom left): the honey bulges and two dripping figures rise out of the pool: the MELTED COPIES of the cat girl and of the "
        "twin-tail girl (exactly like reference images 4 and 5), honey and melted gelato running off them, smiling, reaching out with sticky "
        "hands; on the root wall behind them, a child's crayon drawing scrawled in red and pink: a little girl in a dress holding hands with two "
        "stick-figure girls, one with cat ears and one with twin tails, hearts around them (no words). "
        "PANEL 4 (bottom right): the two melted copies giggle and sink back into the honey, sliding away down the dark tunnel, only their grins "
        "and a few drips left; in the foreground the real cat girl and twin-tail girl turn to look at each other in shock, sweat drops, the "
        "twin-tail girl gripping her black-and-pink gun. A small '!?' drawn in. "
        "No speech balloons, no other text than the sound effects named here.")
JOBS = {"R61_page_double": [("art/raw/r61/page_double_" + v + ".png", REFS, PAGE + " Variation " + v + ": its own camera angles.", "OPAQUE") for v in "abc"]}
