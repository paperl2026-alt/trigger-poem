# Round 78 (user 2026-10-20, the prologue chase: "for the camera work and the staging, if you need the heroines' or the boss's front, side
# or other pictures and expressions, have Codex make them - when something is missing, make the asset first instead of patching with what
# there is; in The House of the Dead a shot shows only a few faces - make those"): the pictures the chase's shots need
# (tools/rounds/ep0_rework.py dash, src/battle/ride.js glimpse / insert):
#   R78_qq_<pose>: the possessed discipline-committee girl (form 1, as in the yard fight) as the chase sees her: running straight at
#                  the camera down a corridor; coming round a corner (half of her out from behind it); lunging at the camera from close.
#   R78_<girl>_<moment>: the two girls' faces for the cut-in shots (they are out of the picture in the first-person run): each turning to
#                  look back over her shoulder as she runs; each startled, the moment the thing bursts in behind them. From the waist up
#                  (no tail to get wrong), seen from the front, on transparent backgrounds.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX
from job_specs60 import OUTFIT

R = "art/raw/r78/"
QQ = ["public/content/base/levels/ep0/assets/boss/qq_s1_move.webp", "public/content/base/levels/ep0/assets/boss/qq_s1_idle0.webp"]
BOSS = ("Reference images 1 and 2 are this game's monster, the possessed schoolgirl '???': draw EXACTLY this creature - her face hidden by "
        "her long straight black hair, her dark school blazer and pleated skirt, torn black stockings, and the mass of black-violet tendrils, "
        "glossy eyes and toothed mouths growing from her back and shoulders - in EXACTLY the same art style, line work and colours (clean anime "
        "line art, full colour, a thin white sticker outline round the whole figure). Fully transparent background: no floor, no wall, no "
        "shadow, no text, no letters. ")
POSES = {
    "run": "She RUNS STRAIGHT AT THE VIEWER, seen from the front at the viewer's eye level: the full figure from head to feet, one leg "
           "forward in mid-stride, both arms swinging forward with the clawed fingers spread, her hair and the tendrils streaming back and "
           "reaching forward round her, all the eyes on the tendrils staring at the viewer. Fast and menacing. Portrait 2:3.",
    "corner": "She comes ROUND A CORNER: only the right half of her is in the picture - the rest of her is cut off by the picture's LEFT "
              "edge, as if she is behind the corner of a wall there (draw no wall). She leans out sideways from that edge: one clawed hand "
              "grips the picture's left edge at shoulder height, her head tilts out with one eye showing through her hair, staring at the "
              "viewer; tendrils curl out round the edge above and below her. Her full height, head to feet. Portrait 2:3.",
    "lunge": "She LUNGES AT THE VIEWER from very close: her upper body fills the picture, leaning at the viewer in strong perspective, one "
             "clawed hand reaching straight at the viewer, huge in the foreground, her face just behind it with the mouth open; hair and "
             "tendrils flying forward round her and off the picture's edges. Landscape 3:2.",
}
JOBS = {f"R78_qq_{k}": [(f"{R}qq_{k}_{v}.png", QQ, BOSS + d + " " + NOFX) for v in "ab"] for k, d in POSES.items()}

# ---------------------------------------------------------------- the girls' cut-ins
GIRL = ("Reference image 1 is this heroine's character sheet and reference image 2 more of her approved pictures: draw EXACTLY this girl "
        "(face, hair, every piece of her outfit) in EXACTLY the same anime style, line work and colouring. ONE girl only, from the WAIST UP "
        "(the picture's bottom edge cuts across her waist), seen from the FRONT, close, filling the picture; fully transparent background: no "
        "scenery, no floor, no other people, no text, no letters. Modest, wholesome, all-ages game art. ")
WHO = {
    "cat": (["art/ref/cat_sheet.png", "art/ref/cat_poses.png"],
            "She is the white-haired cat girl: a white bob with cat ears and red ribbons, thin RED-FRAMED GLASSES on her face (the red frame "
            "clearly visible), a white sailor-collar kimono top with wide sleeves, a red obi; her RIGHT arm is a huge white furry cat paw with "
            "red claws, her left hand a normal hand."),
    "pink": (["art/ref/pink_sheet.png", "art/ref/pink_poses.png"],
             "She is the twin-tail girl with the pink bunny gun: " + OUTFIT),
}
MOMENTS = {
    "lookback": {"cat": "She is RUNNING and glances back over her shoulder: sharp-eyed and tense, teeth gritted, her cat ears flattened back, "
                        "her big paw raised at her side ready to strike, her hair flung by the run.",
                 "pink": "She is RUNNING and twists round to look back over her shoulder in fright: eyes wide, mouth open in a cry, her long "
                         "twin tails flying, her pink gun held in her right hand."},
    "startled": {"cat": "She has just spun round and seen something terrible behind the viewer: eyes wide behind her red glasses, her cat "
                        "ears standing straight up, her paw thrown up in front of her, her hair flung out by the sudden turn.",
                 "pink": "She has just spun round and seen something terrible behind the viewer: huge eyes, a scream, both hands up near her "
                         "face with the pink gun in one of them, her twin tails flung out by the sudden turn."},
}
for mo, by in MOMENTS.items():
    for who, (refs, desc) in WHO.items():
        JOBS[f"R78_{who}_{mo}"] = [(f"{R}{who}_{mo}_{v}.png", refs, GIRL + desc + " " + by[who] + " " + NOFX + "Portrait 3:4.") for v in "ab"]
