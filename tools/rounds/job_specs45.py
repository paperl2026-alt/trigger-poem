# Round 45 (docs/PLAN.md 第七批): the prologue's boss pages for the new boss "???" (docs/DESIGN.md 序章): the page before the boss fight
# and the ending page, whole manga pages (three candidates each), the boss drawn after its approved stage sheets (R43).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs41 import STYLE as PAGE_STYLE, CATD, PINKD

CAT, PINK, GIRL = "art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/raw/r25/master.png"
S1, S5 = "art/raw/r43/boss_s1_b.png", "art/raw/r43/boss_s5_c.png"
REFS = ("Reference images: 1 = the white-haired cat girl's design, 2 = the black-haired twin-tail girl's design, 3 = the discipline-committee "
        "girl (long straight black hair, dark blazer uniform; ignore her armband and whistle, they must not appear), 4 = the monster she turns into "
        "(stage 1), 5 = its final core; keep all their looks. ")
PAGES = {
    "boss": "Four panels: 1 (top left) " + PINKD + " shooting a corridor window, the glass bursting, 'BANG!!'; 2 (tall, middle) the two girls "
            "diving out of the broken second-floor window together, glass sparkles, 'JUMP!!'; 3 (bottom left) the two girls landing crouched in "
            "the violet-lit schoolyard in a burst of dust, 'DOOON!!'; 4 (tall, right) the discipline-committee girl standing alone in the middle "
            "of the yard with her back half turned, head hanging, while the black-violet formless THING from the sky pours down into her like oily "
            "smoke: her shadow is full of eyes, a mass of flesh and eyes is bursting out of her back and shoulder (like reference image 4), creepy "
            "and horrifying, the lettering '？？？'.",
    "end": "Four panels: 1 (top left, wide) the monster's glowing core cracking open and dissolving into light and paper petals, the stamp "
           "'PURIFIED 净化'; 2 (top right) the discipline-committee girl lying asleep on the ground, back to normal, unhurt; 3 (middle, wide) the "
           "dark violet power escaping her as several black-violet streaks that shoot up into the evening sky and scatter in DIFFERENT "
           "directions, leaving trails, ominous, the small caption '……'; 4 (bottom, wide) chibi versions of the two girls in front of two "
           "different shop windows with 'SOLD OUT' signs (a sweets shop and an anime goods shop), both crying waterfall tears, deflated, the "
           "lettering '限定…売り切れ…'.",
}
JOBS = {f"R45_page_{k}": [(f"art/raw/r45/page_{k}_{v}.png", [CAT, PINK, GIRL, S1, S5], REFS + PAGE_STYLE + t +
                           f" Variation {v}: its own panel layout and camera angles.", "OPAQUE") for v in "abc"] for k, t in PAGES.items()}
