# Round 71 (docs/ART.md 出图流程「连续动作先出头尾、再补中间」; user 2026-10-20: "不对的话你让 Codex 再出咯，少即是多，可以给头帧，要结尾，
# 再要中间补全……多试试吧"): the cat girl in the air (rig.aerial) as the middle frame of her
# jump, its two ends the approved take-off (r68/cat_leap_a) and landing (r68/cat_land_a) - her tail right in both.
# Three ways of asking, two tries each, to see which one Codex follows:
#   mid    both ends given: "the one frame exactly halfway between them", at the top of the jump firing down
#   next   only the take-off given: "the same jump a split second later", at its highest point firing down
#   edit   the take-off picture kept as it is, only her paw arm turned to point down at the ground ahead and fire
# Only what is seen is described (the tail where the skirt's edge hangs over it, as in the references), no body words, no "don't" about the
# tail (ART 出图规则). Her paw seal is made canonical afterwards (tools/seal_fix.py).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX

R = "art/raw/r71/"
LEAP, LAND, SHEET = "art/raw/r68/cat_leap_a.png", "art/raw/r68/cat_land_a.png", "art/ref/cat_sheet.png"
STYLE = ("Draw EXACTLY this girl (face, hair, every piece of her outfit, her cat paw) in EXACTLY the same painting style, line work and "
         "colouring, the same size and the same camera, seen from behind and slightly from the side, her whole body inside the picture with "
         "a margin, on a fully transparent background: no floor, no shadow, no other people, no text, no letters, no numbers. Modest, "
         "wholesome, all-ages game art, the camera at her shoulder height. ")
CAT = (" She is the cat girl: white bob hair with cat ears and red ribbons, a white sailor-collar kimono top with wide sleeves, a dark pleated "
       "skirt with a red obi, black platform geta with red cords. Her RIGHT arm is the huge white furry cat paw with red claws (she fires "
       "spells from its palm), the red seal on the back of the paw; her left hand is a normal hand. Her long fluffy white tail looks exactly "
       "as in the reference pictures of her jump: it shows below the side edge of her pleated skirt, the skirt hanging over its upper end "
       "like a curtain, and it sweeps out behind her in a long soft curve. ")
WAYS = {
    "mid": ([LEAP, LAND, SHEET],
            "Reference image 1 is the FIRST frame of her jump (the take-off) and reference image 2 the LAST frame (the landing); reference "
            "image 3 is her character sheet. Draw the ONE frame exactly HALFWAY between reference images 1 and 2 in the same jump: she is at "
            "the very top of the jump, floating for a moment, her knees tucked up, sleeves, skirt and hair lifting, her body tipped forward, "
            "the cat paw thrust forward and DOWN, its palm aimed at something on the ground ahead of her, firing. Everything in between the "
            "two references: her legs, her sleeves, her hair and her tail take the in-between positions of references 1 and 2. " + STYLE),
    "next": ([LEAP, SHEET],
             "Reference image 1 is a frame of her jump (the take-off) and reference image 2 her character sheet. Draw the NEXT frame of the "
             "same jump, a split second later: she has reached the highest point, floating for a moment, her knees tucked up, sleeves, skirt "
             "and hair lifting, her body tipped forward, the cat paw thrust forward and DOWN, its palm aimed at something on the ground ahead "
             "of her, firing. Her tail swings on from where it is in reference image 1, in the same place under the skirt's edge. " + STYLE),
    "edit": ([LEAP, SHEET],
             "Edit reference image 1 (reference image 2 is her character sheet). Keep reference image 1 EXACTLY as it is - the same girl, "
             "pose, legs, skirt, sleeves, hair, tail, size, framing and every colour - and change ONE thing only: her right arm with the "
             "big cat paw now points forward and DOWN, the palm of the paw aimed at something on the ground ahead of her, firing. "
             "Everything else stays the same pixel for pixel. "),
}
ROOT = pathlib.Path(__file__).resolve().parents[2]   # (only the pictures not made yet)
JOBS = {f"R71_cat_aerial_{w}": [(f"{R}cat_aerial_{w}_{v}.png", refs, p + CAT + NOFX + "Portrait 2:3.")
                                for v in "ab" if not (ROOT / f"{R}cat_aerial_{w}_{v}.png").exists()] for w, (refs, p) in WAYS.items()}
JOBS = {k: v for k, v in JOBS.items() if v}   # (one job per way of asking: they run side by side)
