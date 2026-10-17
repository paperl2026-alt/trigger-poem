# Round 42 (docs/PLAN.md 第六批): the prologue moves onto PanelWorld (flat panels in real 3D, like the corridor), and the boss gets a full set
# of parts for each of its three forms. Everything in several versions (docs/ART.md 多版本).
#   R42_cls_*:   the classroom: window wall, corridor-side wall, front wall (blackboard), floor, ceiling — calm AND anomaly versions of each
#                (the anomaly version is the same surface after the evil energy hit: when it strikes, the boards flip over to it)
#   R42_yard_*:  the schoolyard: the school building's front, the side fences with trees, the ground, the sky
#   R42_prop:    classroom props (desks, chairs, lectern ...) for relief standing in the room
#   R42_onoma:   kill onomatopoeia lettering stickers
#   R42_b1/2/3_*: the boss by camera (docs/DESIGN.md「Boss」): each form's own complete set of parts
#   R42_tf_*:    the boss's transformations as whole manga pages (three candidates each)
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]   # this folder and tools/
from job_specs28 import FLAT
from job_specs25 import LOOK as BOSS_LOOK
from job_specs41 import STYLE as PAGE_STYLE, CATD, PINKD

CAT, PINK, BOSS = "art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/raw/r25/master.png"
WALLS = ["art/raw/r31/wallL4.png", "art/raw/r31/wallR2.png"]   # the corridor's approved painting style
STYLE = ("Reference images 1 and 2 are panels of this game's school corridor: paint in EXACTLY their style (painting technique, line work, "
         "colours, light, level of detail). ")
ANOM = (" ANOMALY VERSION: the same surface right after an evil violet energy struck the school: the light turned magenta-violet, glowing pink "
        "cracks run across it, a few dark violet eye sigils are smeared on it, a little violet goo drips, things on it are knocked askew; it "
        "must still be the same surface with the same layout. ")
GLASS = (" Paint every window PANE (where the outside would be seen through the glass) as solid flat pure magenta #FF00FF, nothing else "
         "magenta; frames, sills and curtains stay normal.")
SKY = " Paint the SKY (everything above and behind the fence and trees) as solid flat pure magenta #FF00FF, nothing else magenta."
NOP = "No people, no monsters, no text, no letters, no numbers. "

CLS = {   # (key, size note, description)
    "win": ("a 4 m wide, 3 m tall section of a Japanese classroom's WINDOW wall: two big windows with white aluminium frames, cream curtains "
            "tied at the sides, a radiator and a low cabinet under the windows with a potted plant", GLASS),
    "door": ("a 4 m wide, 3 m tall section of a Japanese classroom's CORRIDOR-side wall: a wooden sliding door with a small glass window, "
             "transom windows above, a row of coat hooks with a few bags, a class rules poster with blank lines", ""),
    "back": ("a 4 m wide, 3 m tall section of a Japanese classroom's wall with a row of small wooden cubby lockers with bags in them, a cork "
             "board above with blank pinned papers and drawings", ""),
    "front": ("the whole 8 m wide, 3 m tall FRONT wall of a Japanese classroom: a big green blackboard in the middle with faint chalk "
              "doodles (no letters), a teacher's platform step under it, a round wall clock above, a TV on a bracket in the corner, a "
              "loudspeaker box, a flag-shaped class motto plate with no letters", ""),
}
JOBS = {}
for key, (desc, extra) in CLS.items():
    n = 1 if key == "front" else 3
    JOBS[f"R42_cls_{key}"] = (
        [(f"art/raw/r42/cls_{key}{i}.png", WALLS, STYLE + FLAT + "The surface: " + desc + f". Version {i}: its own details." + extra, "OPAQUE") for i in range(1, n + 1)] +
        [(f"art/raw/r42/cls_{key}{i}_x.png", WALLS + [f"art/raw/r42/cls_{key}{i}.png"], STYLE + "Reference image 3 is the calm version of this "
          "surface. " + FLAT + "The surface: " + desc + "." + ANOM + extra, "OPAQUE") for i in range(1, n + 1)])
JOBS["R42_cls_flat"] = [
    ("art/raw/r42/cls_floor1.png", WALLS, STYLE + FLAT.replace("front-on view", "top-down view looking straight down") + "The surface: 3 m by 3 m "
     "of a classroom's polished light wooden floor, boards running from top to bottom, seamless and tileable on all four edges, a few scuffs.", "OPAQUE"),
    ("art/raw/r42/cls_floor2.png", WALLS, STYLE + FLAT.replace("front-on view", "top-down view looking straight down") + "The surface: 3 m by 3 m "
     "of the same classroom wooden floor with an eraser, a pencil and a crumpled paper lying on it, seamless and tileable.", "OPAQUE"),
    ("art/raw/r42/cls_floor1_x.png", WALLS + ["art/raw/r42/cls_floor1.png"], STYLE + "Reference image 3 is the calm version. " +
     FLAT.replace("front-on view", "top-down view looking straight down") + "The surface: the same classroom floor." + ANOM + " Seamless and tileable.", "OPAQUE"),
    ("art/raw/r42/cls_ceil1.png", WALLS, STYLE + FLAT.replace("front-on view", "view looking straight up") + "The surface: 3 m by 3 m of a "
     "classroom ceiling: white acoustic tiles, two long fluorescent light fittings across, seamless and tileable.", "OPAQUE"),
    ("art/raw/r42/cls_ceil1_x.png", WALLS + ["art/raw/r42/cls_ceil1.png"], STYLE + "Reference image 3 is the calm version. " +
     FLAT.replace("front-on view", "view looking straight up") + "The surface: the same classroom ceiling, one light flickering dead." + ANOM, "OPAQUE"),
]
# ---- the schoolyard (the boss fight, after the anomaly: violet sunset)
YSTYLE = STYLE + "Light: a sunset sky turned violet and magenta by the anomaly. "
JOBS["R42_yard"] = [
    ("art/raw/r42/yard_front1.png", WALLS, YSTYLE + FLAT + "The surface: the whole front of a three-storey Japanese high-school building seen "
     "straight on, 28 m wide and 13 m tall: rows of classroom windows on three floors, an entrance with glass doors in the middle at ground "
     "level, a clock on the top centre, a flat roof with a straight railing along the top edge (the roof line must be a perfectly straight "
     "horizontal line near the very top of the picture), a few violet cracks and eye sigils. Paint the sky above the roof as solid pure "
     "magenta #FF00FF. " + NOP, "OPAQUE"),
    ("art/raw/r42/yard_front2.png", WALLS + ["art/raw/r42/yard_front1.png"], YSTYLE + "Reference image 3 is the same building: keep it exactly, "
     "only more damaged (broken windows glowing pink inside, cracks across the walls, rubble at the base). " + FLAT + "Sky above the roof solid "
     "pure magenta #FF00FF. " + NOP, "OPAQUE"),
] + [(f"art/raw/r42/yard_side{i}.png", WALLS, YSTYLE + FLAT + "The surface: a 9 m wide, 13 m tall side of a schoolyard seen straight on: a "
       "3 m tall green chain-link fence along the bottom, " + d + " behind it." + SKY + NOP, "OPAQUE") for i, d in
     [(1, "a row of cherry trees in bloom"), (2, "a tall baseball backstop net and a storage shed"), (3, "a row of tall trees and a bike shed"),
      (4, "a basketball hoop and cherry trees")]] + [
    ("art/raw/r42/yard_ground1.png", WALLS, YSTYLE + FLAT.replace("front-on view", "top-down view looking straight down") + "The surface: 4 m "
     "by 4 m of a schoolyard's packed sandy ground, footprints, a faded white line, seamless and tileable on all four edges.", "OPAQUE"),
    ("art/raw/r42/yard_ground2.png", WALLS, YSTYLE + FLAT.replace("front-on view", "top-down view looking straight down") + "The surface: 4 m "
     "by 4 m of the same sandy schoolyard ground with glowing pink cracks and a little violet goo, seamless and tileable.", "OPAQUE"),
    ("art/raw/r42/yard_sky.png", WALLS, YSTYLE + "A wide panoramic SKY at an anomaly sunset: violet and magenta clouds, a huge glowing eye-shaped "
     "rift in the sky, distant town rooftops and hills along the very bottom edge. No people, no text.", "OPAQUE"),
]
# ---- classroom props (stand in the room as relief drawings)
JOBS["R42_prop"] = [("art/raw/r42/prop_" + k + ".png", WALLS, STYLE + "Draw ONE single object on a fully transparent background, "
    "straight-on front view from slightly above, the whole object visible, nothing else, no floor, no shadow, no text: " + d) for k, d in [
    ("desk1", "a Japanese school desk with its chair pushed in, a school bag hanging on the side."),
    ("desk2", "a Japanese school desk with its chair pulled out at an angle, a notebook and pencil case on the desk."),
    ("desk3", "a Japanese school desk knocked over on its side with the chair fallen next to it, papers spilled."),
    ("desk4", "two school desks pushed together with chairs, lunch boxes on them."),
    ("lectern", "the teacher's wooden lectern desk with an attendance book and a chalk box on it."),
    ("cabinet", "a grey steel cleaning-tools cabinet with a broom sticking out of the half-open door."),
]]
# ---- kill onomatopoeia stickers
ONO = ("Reference image 1 is this game's HUD style (red / black / white, Persona-5-like, bold, cute). Draw a sheet on a transparent background, "
       "3 x 3 grid, nine bold manga SOUND-EFFECT lettering stickers, one per cell, each with a thick white sticker outline, exactly the words "
       "given, dynamic tilted hand lettering with impact lines: ")
JOBS["R42_onoma"] = [
    ("art/raw/r42/ono_a.png", ["art/raw/r33/hud_a.png"], ONO + "1 'POP!', 2 'BOOM!', 3 'ZAP!', 4 'POW!', 5 'BAM!', 6 'KO!', 7 'CRASH!', 8 'POOF♡', 9 'WHAM!'."),
    ("art/raw/r42/ono_b.png", ["art/raw/r33/hud_a.png"], ONO + "1 'ドン!', 2 'バキッ!', 3 'ポン♡', 4 'ズドン!', 5 'パァン!', 6 'ギャー!', 7 'ゴゴゴ', 8 'キラ☆', 9 'ドカーン!'."),
    ("art/raw/r42/ono_c.png", ["art/raw/r33/hud_a.png"], ONO + "1 '净化!', 2 '砰!', 3 '啪!', 4 '轰!', 5 '咻~', 6 '叮♡', 7 '嘭!', 8 '哗啦!', 9 '完美!'."),
]
# ---- the boss: every form its own full set of parts (only what that form's camera sees)
BP = ("Reference image 1 is the approved design of this boss: keep her face, hair, uniform, armband, colours and style exactly. " + BOSS_LOOK +
      "Draw ONLY the part described, on a transparent background, at high resolution, nothing else in the picture (no building, no ground, no "
      "sky, no glow, no effects), cleanly cut where described. No text. ")
F1 = ("FORM 1, the camera stands in the schoolyard looking at the school building; she hides behind it and peeks over the flat roof. ")
F2 = ("FORM 2, transformed: she has climbed onto the roof and stands there; the camera in the yard looks up at her; her hair has become "
      "streaming red-and-black striped rule tape, thin glowing pink cracks run over her skin. ")
F3 = ("FORM 3, she leans down over the whole schoolyard; the camera lies on the ground looking straight UP at the sky and her. ")
HEAD1 = "the TOP HALF of her giant head peeking over a roof, cut off by a perfectly straight horizontal line just under her nose; "
PARTS = {
    "b1": [("head_calm", HEAD1 + "calm, cold eyes looking down, the third-eye slit on her forehead closed."),
           ("head_angry", HEAD1 + "angry glaring eyes, brows down, the third-eye slit closed."),
           ("head_blink", HEAD1 + "eyes closed (blinking), the third-eye slit closed."),
           ("head_eye", HEAD1 + "the third eye on her forehead WIDE OPEN, a big glowing pink eye inside a jagged diamond, her own eyes furious."),
           ("head_hurt", HEAD1 + "flinching in pain, one eye squeezed shut, a tear."),
           ("head_whistle", "her giant head from the forehead down to the chin peeking over a roof, cut off by a straight horizontal line at "
                            "the chin, blowing the silver whistle hard, cheeks puffed, eyes squeezed."),
           ("hair_l", "ONLY a long lock of her straight black hair spilling down over a roof edge on the left, hanging straight down, cut at the "
                      "top by a straight line. No face."),
           ("hair_r", "ONLY a long lock of her straight black hair spilling down over a roof edge on the right, hanging straight down, cut at "
                      "the top by a straight line. No face."),
           ("hand_grip_l", "ONLY her giant LEFT hand gripping a roof edge (the roof not drawn), fingers curled over toward the viewer, long red "
                           "nails, the wrist cut by a straight horizontal line at the bottom. No head, no body."),
           ("hand_grip_r", "ONLY her giant RIGHT hand gripping a roof edge (the roof not drawn), fingers curled over toward the viewer, long red "
                           "nails, the wrist cut by a straight horizontal line at the bottom. No head, no body."),
           ("hand_raise", "ONLY one giant hand raised high to slam down, palm toward the viewer, fingers spread, the red armband with the white "
                          "shield crest on the wrist, the forearm cut by a straight horizontal line at the bottom. No head, no body."),
           ("hand_throw", "ONLY one giant hand holding up a confiscated pink smartphone between two fingers, about to throw it, the forearm "
                          "cut by a straight horizontal line at the bottom. No head, no body.")],
    "b2": [("body_idle", "her figure from the WAIST UP standing on a roof seen from below, NO ARMS (cut cleanly at the shoulders), the whistle "
                         "on its cord, looking down with contempt, cut by a straight horizontal line at the waist."),
           ("body_hurt", "the same waist-up figure with no arms, flinching in pain, hair tape whipping, cut at the waist."),
           ("body_roar", "the same waist-up figure with no arms, roaring with her mouth wide open, the third eye open and glowing, cut at the waist."),
           ("arm_ruler", "ONLY her LEFT ARM from the shoulder, raised overhead holding a giant wooden ruler, the red armband with the white "
                         "shield crest on the upper arm facing the viewer clearly. No head, no body."),
           ("arm_down", "ONLY her LEFT ARM from the shoulder hanging down at her side, relaxed, the armband turned away. No head, no body."),
           ("arm_point", "ONLY her RIGHT ARM from the shoulder pointing straight at the viewer, long red nails. No head, no body."),
           ("arm_lash", "ONLY her RIGHT ARM from the shoulder swinging sideways, a long red-and-black rule tape whip trailing from her hand. "
                        "No head, no body."),
           ("arms_guard", "ONLY her two forearms crossed in front of her as a guard, seen from below. No head, no body."),
           ("tape_l", "ONLY a long streaming lock of red-and-black striped rule tape (her hair) whipping in the wind, curling, from upper right "
                      "to lower left."),
           ("tape_r", "ONLY a long streaming lock of red-and-black striped rule tape (her hair) whipping in the wind, curling, from upper left "
                      "to lower right.")],
    "b3": [("face_cruel", "her enormous face seen from straight below, UPSIDE DOWN: her chin at the TOP of the picture, her forehead with the "
                          "open third eye toward the BOTTOM, a cruel smile; only her face, no hair curtain, no shoulders, no hands."),
           ("face_scream", "the same upside-down face seen from below, her mouth turned into the bell of a giant brass megaphone, wide open, "
                           "screaming; only her face."),
           ("face_hurt", "the same upside-down face seen from below, wincing in pain, the third eye squeezed; only her face."),
           ("face_rage", "the same upside-down face seen from below, furious, teeth bared, cracks of pink light across her skin; only her face."),
           ("curtain_l", "ONLY a wide curtain of her long black-and-red-striped hair hanging straight down toward the viewer from above, seen "
                         "from below, the left side."),
           ("curtain_r", "ONLY a wide curtain of her long black-and-red-striped hair hanging straight down toward the viewer from above, seen "
                         "from below, the right side."),
           ("hand_down_l", "ONLY one giant hand coming straight down at the viewer from above, palm toward the viewer, fingers spread, long "
                           "red nails, extreme foreshortening, the forearm going up out of the top edge. No head."),
           ("hand_down_r", "ONLY one giant hand coming down at the viewer from above at a slant, fingers curled like a claw, long red nails, "
                           "the forearm going up out of the top edge. No head."),
           ("eye", "ONLY her third eye: a big glowing pink eye inside a jagged diamond, seen straight on, nothing else.")],
}
FORM = {"b1": F1, "b2": F2, "b3": F3}
for form, parts in PARTS.items():
    for k, d in parts:
        JOBS[f"R42_{form}_{k}"] = [(f"art/raw/r42/{form}_{k}_{v}.png", [BOSS], BP + FORM[form] + "The part: " + d + f" Variation {v}.") for v in "ab"]
# ---- the transformations as whole manga pages
TF = {
    "tf12": "Three to four panels: 1 the colossal discipline-committee girl's hands slip off the school roof as she sinks behind the building; "
            "2 a burst of violet light behind the building; 3 she rises and plants a foot on the roof, transformed, her hair now streaming "
            "red-and-black rule tape, pink cracks of light on her skin; 4 she stands on the roof waist up, glaring down, the lettering "
            "'PHASE 2'.",
    "tf23": "Three to four panels: 1 the transformed giant girl on the roof clutches her head, cracks of light spreading; 2 she leans forward "
            "over the edge; 3 the view from the ground looking straight up: her huge face hanging over the whole schoolyard, hair falling like "
            "curtains, the third eye blazing, the lettering 'FINAL PHASE'; 4 " + CATD + " and " + PINKD + " looking up from the yard, "
            "gripping their weapons.",
}
for k, txt in TF.items():
    JOBS[f"R42_{k}"] = [(f"art/raw/r42/{k}_{v}.png", [CAT, PINK, BOSS], "Reference images: 1 = the cat girl's design, 2 = the twin-tail "
                         "girl's design, 3 = the boss's design; keep their looks. " + PAGE_STYLE + txt + f" Variation {v}.", "OPAQUE") for v in "abc"]
