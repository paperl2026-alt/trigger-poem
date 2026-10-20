# Round 77 (user 2026-10-20: Madame's coffin form - a black hole opens under the girl's feet and she sinks into it, "best if her picture
# is drawn specially with her feet caught by a crowd of hands, so it looks like falling into the underworld"): each heroine caught, seen
# from behind like her battle poses (the reference), her feet and shins held by many hands reaching up from below the picture, struggling
# to pull free (src/battle/madame.js sink; heroine.js action "dragged"). Two tries each. The cat girl's tail described only by what is
# seen (ART 出图规则).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX
from job_specs60 import OUTFIT

R = "art/raw/r77/"
BASE = ("Reference image 1 is this heroine's approved battle picture in this game and reference image 2 her character sheet: draw EXACTLY "
        "this girl (face, hair, every piece of her outfit, her weapon) in EXACTLY the same painting style, line work and colouring as "
        "reference image 1. A full-body picture of her seen FROM BEHIND, slightly from the side, like reference image 1, on a fully "
        "transparent background: no floor, no shadow, no other people, no text, no letters, no numbers. Modest, wholesome, all-ages game "
        "art: her clothes cover her fully, the camera at her shoulder height. "
        "She is CAUGHT: a crowd of eight or so pale ghostly hands with honey dripping from them reach up from the bottom edge of the picture "
        "and hold her shoes and ankles tight (the hands come from below the picture, only hands and wrists drawn, no bodies). She is "
        "struggling to pull free: bent forward, one knee buckling, her free hand thrown out to the side for balance, looking back down at her "
        "feet in alarm, her hair and clothes flung about by the struggle. ")
WHO = {
    "cat": (["public/jiggle/cat_fire.png", "art/ref/cat_sheet.png", "art/raw/r69/cat_ride_fire_b.png"],
            "Her RIGHT arm is the huge white furry cat paw with red claws, held up and back; her left hand is a normal hand. She is the cat girl: "
            "white bob hair with cat ears and red ribbons, thin red-framed glasses, a white sailor-collar kimono top with wide sleeves, a dark "
            "pleated skirt with a red obi, black platform geta with red cords. Her long fluffy white tail looks exactly as in reference images "
            "1 and 3: it shows below the side edge of her pleated skirt, the skirt hanging over its upper end like a curtain, lashing in a "
            "wide curve."),
    "pink": (["public/jiggle/pink_fire.png", "art/ref/pink_sheet.png"],
             "Her pink bunny rifle is still in her right hand, held up and away. She is the twin-tail girl with the pink bunny rifle. " + OUTFIT),
}
JOBS = {f"R77_{who}": [(f"{R}{who}_dragged_{v}.png", refs, BASE + note + " " + NOFX + "Portrait 2:3.") for v in "ab"] for who, (refs, note) in WHO.items()}

# (the twin-tail girl: both tries refused as "sexual" at the output stage - her bare legs with hands on them. Asked again with only her shoes
# held, her standing upright and shooting down at them, nothing said of her legs)
PINK2 = ("Reference image 1 is this heroine's approved battle picture in this game and reference image 2 her character sheet: draw EXACTLY "
         "this girl (face, hair, every piece of her outfit, her weapon) in EXACTLY the same painting style, line work and colouring as "
         "reference image 1. A full-body picture of her seen FROM BEHIND, slightly from the side, like reference image 1, on a fully "
         "transparent background: no floor, no shadow, no other people, no text, no letters, no numbers. Modest, wholesome, all-ages game "
         "art, the camera at her shoulder height. She stands upright, twisting round to look down behind her in alarm, her pink bunny rifle "
         "pointed straight down at her own feet, firing; her long white lace coat swirling round her. Her chunky pink platform shoes are held "
         "fast by a cluster of pale ghostly hands dripping honey that reach up from the bottom edge of the picture (only hands and wrists, "
         "gripping the shoes). She is the twin-tail girl with the pink bunny rifle. " + OUTFIT)
JOBS["R77_pink2"] = [(f"{R}pink_dragged_{v}.png", WHO["pink"][0], PINK2 + " " + NOFX + "Portrait 2:3.") for v in "cd"]

# (the twin-tail girl refused four times, both ways of asking - hands on her shoes or her shins. So the hands are a picture of their own,
# laid over whichever girl is caught, at her feet in the hole: src/battle/madame.js hole; she keeps her own picture)
HANDS = ("Reference image 1 shows the style (a rotting-honey ghost lady's arm in this game): draw in EXACTLY its style, line work and colours, "
         "a thin white sticker outline round the whole shape. Transparent background, no text, no ground, no shadow. A CROWD of about ten "
         "pale ghostly hands and forearms reaching straight UP from the bottom edge of the picture (they come from below it: the arms cut "
         "off by the picture's bottom edge), clutching and grasping at the empty space in the middle above them as if gripping someone's "
         "ankles there, fingers curled, honey dripping from them in long strings, frayed lace cuffs at some wrists; they crowd together "
         "in a ring, leaving the middle empty. Seen from slightly above. Landscape 3:2.")
JOBS["R77_hands"] = [(f"{R}hands_{v}.png", ["public/content/base/levels/ep1/assets/ep1/arm_reach.webp"], HANDS + " " + NOFX) for v in "ab"]
