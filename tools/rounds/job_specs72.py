# Round 72 (DESIGN「这是轨道射击，要的是表现力」; user 2026-10-20: the two of them in the 3D scene, every scene its own camera language -
# not the same crouch / stand at the bottom of the screen over and over): the girls in the place are seen from wherever the camera is
# (src/battle/player.js toWorld), so a running stretch the camera films from beside them or from ahead needs them drawn from there:
#   run_side    running flat out toward the RIGHT of the picture, seen exactly from her right side (the camera tracking alongside),
#               firing ahead (to the right)
#   run_front   running flat out straight toward the viewer (the camera backing away in front of them), firing past the viewer
# Full-body stills like her running one from behind (r69 run_fire, the reference), each to get its own jiggle rig. Two tries each.
# Only what is seen is described (the cat girl's tail where the skirt's edge hangs over it, as in the references; ART 出图规则).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX
from job_specs60 import OUTFIT

R = "art/raw/r72/"
BASE = ("Reference image 1 is this heroine running in this game (seen from behind) and reference image 2 her character sheet: draw EXACTLY "
        "this girl (face, hair, every piece of her outfit, her weapon) in EXACTLY the same painting style, line work and colouring as "
        "reference image 1, the same build and proportions. A full-body picture, her whole body inside the picture with a margin, on a "
        "fully transparent background: no floor, no shadow, no wall, no other people, no text, no letters, no numbers. Modest, wholesome, "
        "all-ages game art: her clothes cover her fully, nothing revealing, the camera at her waist height. ")
VIEW = {
    "run_side": "Seen EXACTLY FROM HER RIGHT SIDE, a clean side profile like a camera tracking alongside her: she runs flat out toward "
                "the RIGHT edge of the picture, caught mid-stride, her body leaning forward into the run, ",
    "run_front": "Seen FROM THE FRONT, a little from below, like a camera backing away just ahead of her: she runs flat out straight "
                 "toward the viewer, caught mid-stride, leaning forward, her face fierce and determined, ",
}
WHO = {
    "cat": dict(refs=["art/raw/r69/cat_run_fire_a.png", "art/ref/cat_sheet.png", "art/raw/r69/cat_ride_fire_b.png"],
                act={"run_side": "her RIGHT arm - the huge white cat paw - thrust straight forward to the right, palm open, firing a spell "
                                 "ahead; her hair, ears, wide sleeves and skirt streaming back to the left, her long white tail streaming "
                                 "back to the left behind her from under the back edge of her pleated skirt, the skirt hanging over its "
                                 "upper end like a curtain",
                     "run_front": "her RIGHT arm - the huge white cat paw - thrust forward toward the viewer past the side of the picture, "
                                  "palm open, firing; her hair, ears and wide sleeves streaming back; the tip of her long white tail "
                                  "swinging out to one side from behind her"},
                note=" She is the cat girl: white bob hair with cat ears and red ribbons, thin red-framed glasses, a white sailor-collar "
                     "kimono top with wide sleeves, a dark pleated skirt with a red obi, black platform geta with red cords. Her RIGHT arm "
                     "is the huge white furry cat paw with red claws, the red seal on the back of the paw; her left hand is a normal hand."),
    "pink": dict(refs=["art/raw/r69/pink_run_fire_b.png", "art/ref/pink_sheet.png"],
                 act={"run_side": "her pink bunny rifle held at her shoulder with both hands, aimed straight ahead to the right, firing; "
                                  "her long twin tails and her long lace coat streaming back to the left",
                      "run_front": "her pink bunny rifle held level at her hip with both hands, its muzzle aimed past the viewer, firing; "
                                   "her long twin tails and her long lace coat streaming back behind her"},
                 note=" She is the twin-tail girl with the pink bunny rifle. " + OUTFIT),
}
ROOT = pathlib.Path(__file__).resolve().parents[2]   # (only the pictures not made yet)
JOBS = {f"R72_{who}_{v}": [(f"{R}{who}_{v}_{x}.png", W["refs"], BASE + VIEW[v] + W["act"][v] + "." + W["note"] + " " + NOFX + "Portrait 2:3.")
                           for x in "ab" if not (ROOT / f"{R}{who}_{v}_{x}.png").exists()] for who, W in WHO.items() for v in VIEW}
JOBS = {k: v for k, v in JOBS.items() if v}
