# Round 38: the boss parts again (R36_b_* drew her whole upper body in nearly every picture, and form 3 was not seen from below).
# docs/DESIGN.md「Boss」: per form, only what the camera sees, each part a separate picture. The prompts now say what must NOT be in it.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]   # this folder and tools/
from job_specs36 import BP

ONLY_HAND = ("THIS PICTURE CONTAINS ONLY ONE HAND AND PART OF ONE FOREARM. Her head, face, hair, body, shoulders and the other hand are NOT in "
             "the picture at all: they are out of frame. ")
PARTS = {
    "f1_hand": ONLY_HAND + "A giant right hand gripping the edge of a flat roof (the roof itself is not drawn): seen from the front and slightly "
               "below, the four fingers curl over toward the viewer, long red ruler-tip nails, the wrist and forearm go straight down and are cut "
               "off by a perfectly straight horizontal line along the bottom of the picture.",
    "f1_hand_up": ONLY_HAND + "A giant right hand raised to slam down, palm toward the viewer, fingers spread wide, long red nails, the red armband "
                  "with the white shield crest around the wrist, the forearm going straight down and cut off by a straight horizontal line at the "
                  "bottom of the picture.",
    "f2_body": "Form 2, she stands on a roof and the camera is in the yard below: her figure from the WAIST UP, seen from below (strong upward "
               "perspective, her chin and the underside of her bust toward the viewer), cut off by a straight horizontal line at her waist. Her "
               "ARMS ARE NOT IN THIS PICTURE (cut cleanly at the shoulders): they are separate parts. Rule-tape hair whipping in the wind, the "
               "whistle on its cord, looking down with contempt.",
    "f2_arm_ruler": "Form 2: ONLY her LEFT ARM from the shoulder, raised overhead holding a giant wooden ruler, the red armband with the white "
                    "shield crest on the upper arm facing the viewer clearly; seen from below. Her head and body are NOT in the picture. The arm "
                    "is cut cleanly at the shoulder.",
    "f2_arms_cross": "Form 2: ONLY her two forearms crossed in front of her as a guard (no armband visible), seen from below; her head, face, "
                     "hair and body are NOT in the picture; the forearms are cut cleanly at both sides.",
    "f3_face": "Form 3: the camera lies on the ground looking STRAIGHT UP at the sky; she bends down over it from above, so we see her enormous "
               "face UPSIDE DOWN relative to her body: her chin at the TOP of the picture and her forehead with the open third eye toward the "
               "BOTTOM, her long hair hanging straight down toward the viewer on all sides like a curtain, a cruel smile. Only her face and hair; "
               "no shoulders, no hands, no body.",
    "f3_scream": "Same camera and framing as form 3's face (looking straight up, her face upside down: chin at the top, forehead at the bottom, "
                 "hair hanging toward the viewer), but her mouth has become the bell of a giant brass megaphone, wide open, screaming. Only her "
                 "face and hair.",
    "f3_hand": ONLY_HAND + "Form 3: one giant hand coming straight down at the viewer from above, palm toward the viewer, fingers spread, long red "
               "nails, extreme foreshortening; the forearm goes up out of the top edge of the picture.",
}
JOBS = {f"R38_{k}": [(f"art/raw/r38/b_{k}_{v}.png", ["art/raw/r25/master.png"], BP + d + f" Variation {v}.") for v in "abc"] for k, d in PARTS.items()}
