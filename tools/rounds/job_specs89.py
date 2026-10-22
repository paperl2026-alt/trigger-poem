# Round 89 (user 2026-10-22: in the comic page before the lady, the twin-tail girl's clothes are wrong): R88's two studio pages again,
# the same panels, with both girls' design sheets as references and the twin-tail girl's outfit written out as docs/ART.md says
# (job_specs60 OUTFIT: her romper and open lace coat, never a dress); tools/rounds/r88_import.py imports them (R89 first, R88 if missing).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs47 import STYLE as PAGE_STYLE
from job_specs60 import OUTFIT
import job_specs88 as R88

R = "art/raw/r89/"
REFS = ["art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/ref/pink_poses.png", R88.STUDIO, R88.LADY]
WHO = ("Reference images: 1 = the white-haired cat girl's design (white messy hair, white cat ears, red-framed glasses, a white kimono-like "
       "top with wide sleeves, a black obi sash with red cords, a white fluffy cat tail; her RIGHT arm ends in a big white fluffy GHOST CAT "
       "PAW with red claws); keep her look exactly. 2 and 3 = the black-haired twin-tail girl's design: " + OUTFIT + " 4 = the rotten "
       "painter's studio of this story (its look). 5 = the lady of the house as a monster (her colours, lace veil and cake-like gown). ")
GIRLS = "the two girls (the cat girl of reference image 1 and the twin-tail girl of reference images 2 and 3)"
PAGES = {
    # (at most five references: the lady as a monster is not on this page - only her portrait; the first shadow is the fifth)
    "studio": (REFS[:4] + ["art/raw/r87/shade_hostess.png"], WHO.replace(" 5 = the lady of the house as a monster (her colours, lace veil and cake-like gown). ", " ") + "5 = the first shadow that steps out (its look). ",
        R88.PAGES["studio"][2].replace("the two girls (" + R88.CATD + " and " + R88.PINKD2 + ")", GIRLS).replace("reference image 4", "reference image 5")
        .replace("reference image 2", "reference image 4")),
    "merge": (REFS, WHO,
        R88.PAGES["merge"][2].replace("the two girls (" + R88.CATD + " and " + R88.PINKD2 + ")", GIRLS).replace("reference image 3", "reference image 5")),
}
JOBS = {f"R89_page_{k}": [(f"{R}page_{k}.png", imgs, PAGE_STYLE + refs + d, "OPAQUE")] for k, (imgs, refs, d) in PAGES.items()}
