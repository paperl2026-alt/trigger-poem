# Round 96 (user 2026-10-22: after a boss the girls "jumped" in their shooting pose, bobbing on the spot - make a jump of its own, facing
# the player and the camera, a celebration): each girl's victory jump as three keyframes in ONE picture (the same girl three times, so
# she stays the same): crouched to spring, at the top of the jump arms flung up, landed in a pose. Facing the camera, whole body, two
# tries each; tools/rounds/r96_import.py cuts them apart (ui/win_<girl>_<frame>) for the victory moment (src/battle/victory.js).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX
from job_specs60 import OUTFIT

R = "art/raw/r96/"
SHEET = ("Draw a game sprite sheet: the SAME girl THREE times in one row (three columns, one row), one pose per cell, all at the same "
         "scale, each pose her whole body from head to shoes fully inside its own cell, facing the viewer (the camera in front of her at her "
         "chest height), on a fully transparent background: no floor, no shadow, no other people, no text, no letters, no numbers. Modest, "
         "wholesome, all-ages game art in EXACTLY the painting style, line work and colouring of the reference pictures. "
         "The three cells are the keyframes of ONE happy victory jump: 1 she crouches, knees bent, arms swung back, beaming, about to spring "
         "up; 2 at the very top of the jump, feet off the ground and tucked, both arms flung up high, hair, sleeves and skirt flying, laughing "
         "with her eyes shut; 3 she has landed, one foot lifted behind, a cute victory pose to the viewer, winking. ")
GIRLS = {
    "cat": (["art/ref/cat_sheet.png"],
            "Reference image 1 is her character sheet: draw EXACTLY this girl - white messy bob hair, white cat ears with red ribbons and a "
            "bell, red-framed glasses, a white kimono-like top with wide sleeves and a navy sailor collar, a black obi with red cords, a navy "
            "pleated skirt, black platform geta with red cords, a long fluffy white cat tail. ONE of her arms, her right one, ends in a big "
            "white fluffy ghost cat paw with red claws; her other hand is an ordinary girl's hand - in every pose exactly one paw and one "
            "hand. The red seal is only on the BACK of the paw: where its palm or its pink paw pads face the viewer, no seal shows. In cell 3 "
            "she holds the paw up beside her face, its pads to the viewer, the other hand on her hip. "),
    "pink": (["art/ref/pink_sheet.png", "art/ref/pink_poses.png"],
             "Reference images 1 and 2 are her character sheet and poses: draw EXACTLY this girl - long wavy black twin tails with pink-and-"
             "mint ribbon bows and a white bunny hair clip, pink eyes. " + OUTFIT + " She keeps her cute pink gun in one hand all through the "
             "jump; in cell 3 she holds it up beside her cheek, the other hand making a V sign. "),
}
JOBS = {f"R96_{k}": [(f"{R}win_{k}_{v}.png", refs, SHEET + d + NOFX + f"Landscape 3:2. Try {v}.") for v in "ab"] for k, (refs, d) in GIRLS.items()}
