# Round 88 (user 2026-10-22: the number of the lady's paintings and photos in the studio comic pages did not match from panel to panel or
# with the place - redo them, and better not to need a count of the paintings at all, or every panel differing gives it away): the two
# studio pages again (comic/ep1p_studio, comic/ep1p_merge: tools/rounds/r88_import.py), told in close views of one thing at a time - one
# portrait, one shadow, the syrup, the lady - never a row of paintings to count; the shadow that drops out first is the R87 hostess.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs41 import CATD
from job_specs47 import STYLE as PAGE_STYLE
from job_specs53b import PINKD2

R = "art/raw/r88/"
CAT = "art/ref/cat_sheet.png"
STUDIO = "art/raw/r56/sc_studio_a.png"
LADY = "art/raw/r53/boss_f1_e.png"
WHO = ("Reference images: 1 = the white-haired cat girl's design; keep her look exactly. 2 = the rotten painter's studio of this story (its "
       "look). 3 = the lady of the house as a monster (her colours, lace veil and cake-like gown). ")
NOCOUNT = ("NEVER show a row or a set of paintings that could be counted: wherever paintings are in sight they are only dark gilded frames lost "
           "in shadow at the edges of the panel, cut off by the panel border. ")
PAGES = {
    "studio": ([CAT, STUDIO, LADY, "art/raw/r87/shade_hostess.png"], WHO + "4 = the first shadow that steps out (its look). ",
        "Layout: a 2 x 2 grid of four equal rectangular panels. Reading order: top left, top right, bottom left, bottom right. " + NOCOUNT +
        "PANEL 1: seen from behind the two girls (" + CATD + " and " + PINKD2 + "), small in the foreground, they step into the dim rotten "
        "painter's studio of reference image 2: a high skylight, easels, paint-stained floor, gilded frames high on the walls lost in the dark; "
        "the lettering '…'. "
        "PANEL 2: a close view of ONE big portrait in a gilded frame, filling the panel: the elegant lady of the house painted in it, smiling "
        "sweetly; her painted eyes have turned to look down out of the picture. "
        "PANEL 3: an extreme close-up of the same painted face: thick black syrup oozing out of the canvas, the paint of her face melting and "
        "running down; the lettering 'ドロ…'. "
        "PANEL 4: seen from below, the shadow of reference image 4 drops out of that frame toward the floor, dark against the candlelight, "
        "its strange shape plainly not a person; the canvas behind it left blank; the lettering 'ズ…'."),
    "merge": ([CAT, STUDIO, LADY], WHO,
        "Layout: a 2 x 2 grid of four equal rectangular panels. Reading order: top left, top right, bottom left, bottom right. " + NOCOUNT +
        "PANEL 1: the two girls (" + CATD + " and " + PINKD2 + ") stand panting in the foreground, seen from behind; before them the floor "
        "of the studio is splashed with spreading pools of black syrup, all that is left of the beaten shadows; the lettering 'ハァ…'. "
        "PANEL 2: a low view along the floor: the black syrup crawls in streams across the paint-stained boards toward the far end of the room. "
        "PANEL 3: the far wall: ONE huge empty gilded picture frame, the black syrup climbing up into it and filling the blank canvas with the "
        "dark silhouette of a woman; the lettering 'ズ…'. "
        "PANEL 4: the lady of the house as the monster of reference image 3 steps out of the huge frame toward the girls, her gown pouring "
        "over the frame's edge; the lettering 'ズズズ…'."),
}
JOBS = {f"R88_page_{k}": [(f"{R}page_{k}.png", imgs, PAGE_STYLE + refs + d, "OPAQUE")] for k, (imgs, refs, d) in PAGES.items()}

# (a precise edit tried for the studio page's first panel - its paw looked to be on the wrong arm; it was not: the edit is not used)
JOBS["R88_fix_studio"] = [(f"{R}page_studio_b.png", [f"{R}page_studio.png", CAT],
    "PRECISE EDIT. Reference image 1 is a finished comic page: keep it EXACTLY as it is - the same layout, panels, drawing, colours and "
    "lettering, every pixel unchanged - except for ONE thing in the TOP-LEFT panel: the white-haired cat girl (reference image 2 is her "
    "design), seen from behind on the left, must have her big white fluffy ghost-cat paw with red claws as her RIGHT arm, which is on the "
    "side of her body toward the middle of the panel, next to the black-haired girl; her LEFT arm, on the outer side toward the panel's "
    "left edge, is an ordinary girl's hand in a white sleeve hanging at her side. Nothing else changes.", "OPAQUE")]
