# Round 69 (DESIGN「停留点不只是一个镜头、一种打法」, user 2026-10-20: the camera goes everywhere now, so the girls' pictures must go with
# the place - not just the crouch and the stand behind a cover at every kind of stop; Codex is paid up, ask for whatever is needed): the
# battle heroines' pose sets for the other kinds of stop (tuning/shots.json players.set -> characters/<id>.json rig.sets), full-body
# stills seen from behind like their cover / fire poses (public/jiggle/<who>_<cover|fire>.png, which they are painted after), each to get
# its own jiggle rig (tools/jiggle_masks.py):
#   ride_fire   riding (a mine cart, a float, a lift: always up, no reloading): braced against the wind and the speed, firing her ride
#               weapon - the twin-tail girl a huge pink rotary machine gun, the cat girl her rapid spell (both palms, the paw in front)
#   run_fire    running flat out (the prologue's dash): mid-stride, leaning forward, firing ahead as she runs
#   scope_cover sniping from far off (escort stops): down on one knee behind a low parapet, looking far ahead, ready
#   scope_fire  the same, aiming at something far away: the twin-tail girl's rifle with a long scope at her eye, the cat girl looking
#               along her outstretched paw through the ring of her left hand
# and the cart's front wall (vehicle/cart_front: seen from inside, the girls stand behind it) and the child's soul the girls guard in
# episode 1 (ep1/soul_child: the escort, src/battle/escort.js). Two tries of each to pick from. Never a pose used before
# (tools/check_art_reuse.py --poses). The cat girl's paw seal is made canonical afterwards (tools/seal_fix.py).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX
from job_specs60 import OUTFIT

R = "art/raw/r69/"
BASE = ("Reference image 1 is this heroine's approved battle picture in this game and reference image 2 her character sheet: draw EXACTLY "
        "this girl (face, hair, every piece of her outfit, her weapon) in EXACTLY the same painting style, line work and colouring as "
        "reference image 1. A full-body picture of her seen FROM BEHIND, slightly from the side, the way the camera of a third-person "
        "shooter sees its heroine (like reference image 1), her whole body inside the picture with a margin, on a fully transparent "
        "background: no floor, no shadow, no vehicle, no wall or cover drawn, no other people, no text, no letters, no numbers. Modest, "
        "wholesome, all-ages game art: her clothes cover her fully, nothing revealing, the camera at her shoulder height, never looking "
        "up under her skirt or coat. A NEW pose, not the one in reference image 1: ")
WHO = {
    "cat": dict(refs=["public/jiggle/cat_fire.png", "art/ref/cat_sheet.png"],
                note=" She is the cat girl: white bob hair with cat ears and red ribbons, a white sailor-collar kimono top with wide sleeves, "
                     "a dark pleated skirt with a red obi, a long white tail, black platform geta with red cords. Her RIGHT arm is the huge "
                     "white furry cat paw with red claws (her weapon: she fires spells from its palm), the red seal on the back of the paw; "
                     "her left hand is a normal hand. Her long fluffy white tail looks exactly as in reference image 1: it shows below the "
                     "side edge of her pleated skirt, the skirt hanging over its upper end like a curtain, and it sweeps away from her in "
                     "a long soft curve.",
                act={"ride_fire": "standing braced with her feet wide apart as if on a speeding cart, leaning forward into a strong "
                                  "headwind, hair, ears, wide sleeves, skirt and tail all blown straight back, her RIGHT cat paw thrust "
                                  "far forward with its palm open, her LEFT hand pressed against the back of the paw to steady it, "
                                  "casting with all her strength",
                     "run_fire": "running flat out away from the viewer, caught mid-stride with one geta off the ground, her body "
                                 "leaning far forward, sleeves and tail streaming back, her RIGHT cat paw stretched forward ahead of "
                                 "her, palm open, as she runs",
                     "scope_cover": "down on one knee, very still, her body low, looking far into the distance with her LEFT hand "
                                    "shading her eyes, the cat paw resting on her raised knee, her tail curled round her feet",
                     "scope_fire": "down on one knee, her RIGHT cat paw stretched straight out ahead at shoulder height, palm open, "
                                   "aiming at something very far away, her LEFT hand curled into a ring held in front of her right eye "
                                   "like a spyglass, her head tilted to look along the paw"}),
    "pink": dict(refs=["public/jiggle/pink_fire.png", "art/ref/pink_sheet.png"],
                 note=" She is the twin-tail girl with the pink bunny rifle. " + OUTFIT,
                 act={"ride_fire": "standing braced with her feet wide apart as if on a speeding cart, leaning forward into a strong "
                                   "headwind, twin tails and the lace coat blown straight back, holding a HUGE pink six-barrel rotary "
                                   "machine gun (a toy-like gatling with pink and white plating, a round drum magazine and little bunny "
                                   "ears on top) at her hip with both hands, its barrels pointing forward, leaning into the recoil",
                      "run_fire": "running flat out away from the viewer, caught mid-stride with one shoe off the ground, her body "
                                  "leaning far forward, twin tails and coat streaming back, the pink bunny rifle held forward with "
                                  "both hands, firing ahead as she runs",
                      "scope_cover": "down on one knee, very still, her body low, the pink bunny rifle (now with a long telescopic "
                                     "sight on top) held upright against her shoulder, looking far into the distance",
                      "scope_fire": "down on one knee, the pink bunny rifle with a long telescopic sight on top shouldered and aimed "
                                    "straight ahead, her right eye at the scope, her left elbow on her raised knee, perfectly still, "
                                    "aiming at something very far away"}),
}
ROOT = pathlib.Path(__file__).resolve().parents[2]   # (only the pictures not made yet)
JOBS = {f"R69_{who}_{a}": [(f"{R}{who}_{a}_{v}.png", W["refs"], BASE + d + "." + W["note"] + " " + NOFX + "Portrait 2:3.")
                            for v in "ab" if not (ROOT / f"{R}{who}_{a}_{v}.png").exists()] for who, W in WHO.items() for a, d in W["act"].items()}
JOBS["R69_things"] = [(f"{R}{n}_{v}.png", refs, p) for n, refs, p in [
    ("cart_front", ["art/ref/pink_sheet.png"],
     "Game art, painted, the same soft anime painting style as reference image 1 (only for the style: do NOT draw the girl). The FRONT WALL "
     "of an old wooden mine cart seen from INSIDE the cart, from where its passengers stand, straight on: the top part of its thick "
     "dark wooden planks with rusty iron bands and big rivets along the rim, a chipped iron corner at each end, golden honey dripping "
     "over the top edge in a few thick drops, a small iron lantern hook on the rim. Only the cart wall, filling the whole width of the "
     "picture, its top edge a little below the middle; above it fully transparent background (nothing behind it: no tunnel, no track). "
     "No people, no text. " + NOFX + "Landscape 3:2."),
    ("soul_child", ["art/ref/cat_sheet.png"],
     "Game art, painted, the same soft anime painting style as reference image 1 (only for the style: do NOT draw the cat girl). The "
     "soul of a little girl of about six, seen from BEHIND and a little from the side, walking slowly away from the viewer: an "
     "old-fashioned white lace dress with a big ribbon at the back, short soft hair, barefoot, hugging a worn teddy bear to her chest "
     "(one bear ear showing over her shoulder). She is pale, almost white, as if made of soft light, but drawn as a solid clean figure "
     "(the game makes her glow): no glow, no sparkles. Whole body inside the picture with a margin, fully transparent background, no "
     "floor, no shadow, no text. Portrait 2:3."),
] for v in "ab" if not (ROOT / f"{R}{n}_{v}.png").exists()]
JOBS = {k: v for k, v in JOBS.items() if v}   # (one job per pose: they run side by side)
