# Round 76 (user 2026-10-20: the ghost hands of Madame's coffin form looked wrong - an arm suddenly cut off, and her own hands still on her;
# "the arms reaching in from the left and right of the screen, a new asset, an eye in the middle of the palm so the player clearly sees
# where to hit"): the long arm that reaches in from the edge of the picture through a rip (src/battle/madame.js drag), as she is now (her
# rotting-honey colours, after her pictures in the studio), in two poses: reaching (the hand open, the eye in its palm staring) and gripping
# (the fingers closed round something). Drawn reaching in from the LEFT; the right side is the same picture mirrored. Two tries each.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX

R = "art/raw/r76/"
REFS = ["public/content/base/levels/ep1/assets/boss/md_s3_idle0.webp"]
BASE = ("Reference image 1 is the monster this arm belongs to (a rotting-honey ghost lady): draw in EXACTLY its art style, line work and colours "
        "(clean anime line art, full colour, a thin white sticker outline round the whole shape). Transparent background. No text, no letters, "
        "no numbers, no ground, no shadow. THE ARM: one very long, thin, pale ghostly woman's arm, reaching straight in horizontally from the LEFT "
        "edge of the picture - the arm runs off the left edge (cut by the picture's edge, as if it comes out of a rift there), long enough to "
        "cross most of the picture; honey-coloured rot creeping along it, honey dripping from it in long strings, a frayed lace cuff at the wrist; "
        "at its right end the hand, larger than life. In the MIDDLE OF THE PALM, facing the viewer, ONE LARGE STARING EYE (round, bloodshot white, "
        "an amber-honey iris, long lashes) - the most striking thing in the picture. ")
POSES = {
    "reach": "The hand OPEN, fingers spread wide and long, reaching forward to grab, the palm and its eye turned toward the viewer.",
    "grip": "The hand CLOSED round something (an empty space: whatever it holds is not drawn), fingers curled tight, the back of the hand toward "
            "the viewer and the palm's eye peeking out between the fingers, the arm pulling down and back toward the left.",
}
JOBS = {f"R76_arm_{k}": [(f"{R}arm_{k}_{v}.png", REFS, BASE + d + " " + NOFX + "Landscape 3:2.") for v in "ab"] for k, d in POSES.items()}
