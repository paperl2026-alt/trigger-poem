# Round 68 (DESIGN「女主动起来」, user 2026-10-20: "掩体和女主动作都做"): the battle heroines' new actions, NIKKE-style full-body stills seen from
# behind like their cover / fire poses (public/jiggle/<who>_<cover|fire>.png, which they are painted after), each to get its own jiggle
# rig (tools/jiggle_masks.py) and go into characters/<who>.json:
#   blind      ducking behind the cover with a hand over her head, firing blind over the top (a must-hide attack and she keeps shooting)
#   sidehide   her back to a tall cover standing at her side (a pillar, a cabinet), weapon ready (side-on covers)
#   sidefire   leaning out past that cover's edge, firing
#   leap       in mid-air, jumping up onto something / down from it (the ways between stops), weapon forward
#   land       landing in a crouch, one hand on the floor
#   aerial     her special: flipping through the air, firing down at them
# Two tries of each to pick from. Never a pose used before (tools/check_art_reuse.py --poses; the battle poses: cover, leaning out,
# reload, taunt, firing, skill, hurt, down, running, victory). The cat girl's paw seal is made canonical afterwards (tools/seal_fix.py).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX
from job_specs60 import OUTFIT

R = "art/raw/r68/"
BASE = ("Reference image 1 is this heroine's approved battle picture in this game and reference image 2 her character sheet: draw EXACTLY "
        "this girl (face, hair, every piece of her outfit, her weapon) in EXACTLY the same painting style, line work and colouring as "
        "reference image 1. A full-body picture of her seen FROM BEHIND, slightly from the side, the way the camera of a third-person "
        "cover shooter sees its heroine (like reference image 1), her whole body inside the picture with a margin, on a fully transparent "
        "background: no floor, no shadow, no cover or wall drawn, no other people, no text, no letters, no numbers. A NEW pose, not "
        "the one in reference image 1: ")
WHO = {
    "cat": dict(refs=["public/jiggle/cat_fire.png", "art/ref/cat_sheet.png"],
                note=" She is the cat girl: white bob hair with cat ears and red ribbons, a white sailor-collar kimono top with wide sleeves, "
                     "a dark pleated skirt with a red obi, a long white tail, black platform geta with red cords. Her RIGHT arm is the huge "
                     "white furry cat paw with red claws (her weapon: she fires spells from its palm), the red seal on the back of the paw; "
                     "her left hand is a normal hand.",
                act={"blind": "crouching very low on both feet, curled up small, eyes squeezed shut, her LEFT hand pressed over the top of "
                              "her head, her RIGHT cat paw thrust straight up and forward above her head, its palm pointing forward over an "
                              "imagined barricade in front of her: firing blind without looking",
                     "sidehide": "standing upright side-on, her left shoulder and back pressed flat against an imagined tall wall on her "
                                 "left (not drawn), the cat paw held up close to her chest ready, looking back over her right shoulder",
                     "sidefire": "leaning out to the RIGHT past the edge of an imagined tall pillar on her left (not drawn), her body tilted "
                                 "sideways, the right cat paw stretched out forward aiming at something far ahead",
                     "leap": "in mid-air in a big jump forward and up, knees pulled up, kimono sleeves, skirt, hair and tail flying up, the "
                             "cat paw stretched forward",
                     "land": "landing from a jump in a deep crouch, one knee nearly on the ground, her LEFT hand flat on the ground, the cat "
                             "paw held out to the side for balance, sleeves and skirt still settling",
                     "aerial": "flipping through the air sideways, her body almost horizontal, legs swung up behind her, the cat paw "
                               "pointing down and forward at something below, her tail curling round"}),
    "pink": dict(refs=["public/jiggle/pink_fire.png", "art/ref/pink_sheet.png"],
                 note=" She is the twin-tail girl with the pink bunny rifle. " + OUTFIT,
                 act={"blind": "crouching very low behind cover, curled up small, eyes squeezed shut, holding her pink rifle with both "
                               "arms straight up above her head, its muzzle tilted forward over an imagined barricade in front of her: "
                               "firing blind without looking, her head ducked between her arms",
                      "sidehide": "standing upright side-on, her right shoulder and back pressed flat against an imagined tall wall on "
                                  "her right (not drawn), the rifle held upright in front of her chest, looking back over her left shoulder",
                      "sidefire": "leaning out to the LEFT past the edge of an imagined tall pillar on her right (not drawn), her body "
                                  "tilted sideways, the rifle at her shoulder aiming far ahead",
                      "leap": "in mid-air in a big jump forward and up, knees pulled up, twin tails and the lace coat flying up, the "
                              "rifle held forward with both hands",
                      "land": "landing from a jump in a deep crouch, one knee nearly on the ground, her left hand flat on the ground, "
                              "the rifle in her right hand pointing forward, the coat still settling",
                      "aerial": "spinning through the air sideways, her body almost horizontal, the twin tails swinging round, "
                                "firing the rifle down and forward at something below"}),
}
ROOT = pathlib.Path(__file__).resolve().parents[2]   # (only the pictures not made yet)
JOBS = {f"R68_{who}_{a}": [(f"{R}{who}_{a}_{v}.png", W["refs"], BASE + d + "." + W["note"] + " " + NOFX + "Portrait 2:3.")
                            for v in "ab" if not (ROOT / f"{R}{who}_{a}_{v}.png").exists()] for who, W in WHO.items() for a, d in W["act"].items()}
JOBS = {k: v for k, v in JOBS.items() if v}   # (one job per action: they run side by side)
