# Round 79 (user 2026-10-21, the prologue chase's opening: "why do they run the moment she speaks - they can talk back a line or two;
# maybe they try a couple of shots, find she is not one to beat easily, and go round for now"): the girls' faces for the cut-ins as they
# talk back to her (src/battle/ride.js insert; tools/rounds/ep0_rework.py dash) - defiant, weapon up. Same framing as round 78's
# (job_specs78.py GIRL): one girl, waist up, from the front, transparent background. Two tries each.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX
from job_specs78 import GIRL, WHO

R = "art/raw/r79/"
RETORT = {
    "pink": "She TALKS BACK, defiant and annoyed: one hand on her hip, chin up, a sassy pout with her tongue sticking out a little, her "
            "pink gun pointed forward past the viewer's shoulder, her twin tails swinging.",
    "cat": "She TALKS BACK, cool and provoking: a smug sideways glare over her red glasses, one corner of her mouth up, her big white paw "
           "raised beside her face with the red claws spread, her cat ears pricked forward.",
}
JOBS = {f"R79_{who}_retort": [(f"{R}{who}_retort_{v}.png", WHO[who][0], GIRL + WHO[who][1] + " " + RETORT[who] + " " + NOFX + "Portrait 3:4.")
                              for v in "ab"] for who in RETORT}

# (the cat girl's a / b pushed her glasses up with her paw raised: the title screen's pose - tools/check_art_reuse.py --poses - so again, a
# pose of her own, the used ones named)
USED = "Already used, do NOT repeat: pushing up her glasses with a finger while her paw is raised in front of her chest. "
CAT2 = ("She TALKS BACK, cocky and provoking: she points ONE red claw of her big white paw straight at the viewer like an accusing finger, "
        "her other (normal) hand on her hip, head tilted, a cat-like grin showing one little fang, her tail of white hair swinging. ")
JOBS["R79_cat_retort2"] = [(f"{R}cat_retort_{v}.png", WHO["cat"][0], GIRL + WHO["cat"][1] + " " + CAT2 + USED + NOFX + "Portrait 3:4.") for v in "cd"]
