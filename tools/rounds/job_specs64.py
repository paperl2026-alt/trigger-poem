# Round 64 (user 2026-10-19): what the girls turn into when they go down, and the words over it (docs/DESIGN.md「阵亡」):
#   the cat girl is a tsukumogami: down, she falls back into the thing she once was, an old handmade cat doll with a talisman on it;
#   her word is 再临 (she comes again). The twin-tail girl is an artificial human (a homunculus, NOT a robot): down, her body is gone in
#   pink sparkles, only her clothes lie in a heap with a black-and-white memorial photo of her; her word is 重生 (born again).
#   The words in the arcade lettering of round 39 (CONTINUE? in the P5 cut-out style for her, chrome for the cat girl).
# Every picture is ONE thing alone with a wide empty margin (user 2026-10-19: cut-outs from sheets caught pieces of their neighbours).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs60 import OUTFIT

R = "art/raw/r64/"
ALONE = (" ONE single object alone in the middle of the picture on a plain transparent background, with a WIDE empty margin all around it "
         "(at least an eighth of the picture on every side): nothing touches or crosses the edges, nothing else anywhere in the picture.")
JOBS = {}

# ---------------------------------------------------------------- the words
WORD = ("Reference image 1 is an arcade-style lettering made for this game ('CONTINUE?'). Paint a NEW lettering in EXACTLY the same style: "
        "the same letter construction, colours, outline thickness, highlights, tilt and decoration, at the same quality. ")
JOBS["R64_words"] = [
    (f"{R}word_rebirth_{v}.png", [f"{R}ref_alert_continue_p5.png"], WORD + "It says 重生 (two big Chinese characters, written correctly: 重 and 生), "
     "each character cut out of black and red paper like a ransom note, with a small latin 'REBIRTH!' running along under them in the same "
     "cut-out style." + ALONE + " Landscape 3:2. Variation " + v + ".") for v in "abc"] + [
    (f"{R}word_readvent_{v}.png", [f"{R}ref_alert_continue_chrome.png"], WORD + "It says 再临 (two big Chinese characters, written correctly: "
     "再 and 临), in the same glossy red chrome bevelled letters with white sparkles, with a small latin 'RE:ADVENT!' in the same chrome "
     "under them." + ALONE + " Landscape 3:2. Variation " + v + ".") for v in "abc"]

# ---------------------------------------------------------------- what they turn into
CAT = ("Reference image 1 is the white-haired cat girl's design (white messy hair, white cat ears, red-framed glasses, a white kimono-like "
       "top with wide sleeves, a black obi sash with red cords, a white fluffy cat tail, her right arm a big white fluffy ghost cat paw with "
       "red claws). Reference image 2 is the red seal on the back of that paw: copy it EXACTLY wherever the paw's back shows. ")
JOBS["R64_down_cat"] = [
    (f"{R}down_cat_{v}.png", ["art/ref/cat_sheet.png", "art/ref/cat_seal_decal.png"], CAT +
     "She is secretly a tsukumogami, a spirit born of an old object; when she is knocked out she falls back into the thing she once was: "
     "an OLD HANDMADE CAT DOLL, a little cursed cloth doll about the size of a cushion. It has her look in doll form: a white cloth body with "
     "visible stitches and a patch, her white messy hair as a tuft of white yarn, white cat ears, tiny red-framed glasses slipped crooked, a "
     "scrap of her white kimono top and black obi with red cords, a fluffy white tail, one oversized white fluffy paw lying limp with its "
     "back up showing the red seal. A paper talisman (ofuda, with simple brush strokes, no readable words) is stuck on its forehead, a red "
     "string is wound around its body, its eyes are two stitched X marks. It sits slumped over sideways on the floor. Cute and a little "
     "eerie, like a haunted doll, NOT gory, no blood. Anime style matching the reference, clean line art, full colour, soft shading."
     + ALONE + " Square 1:1. Variation " + v + ".") for v in "abc"]
PINK = ("Reference images 1 and 2 are the black-haired twin-tail girl's design: " + OUTFIT + " ")
JOBS["R64_down_pink"] = [
    (f"{R}down_pink_{v}.png", ["art/ref/pink_sheet.png", "art/ref/pink_poses.png"], PINK +
     "She is secretly an artificial human (a homunculus made by alchemy, NOT a robot, no machinery); when she is knocked out her body "
     "is simply gone in a puff of pink sparkles: ONLY HER CLOTHES are left, lying in an empty collapsed heap on the floor, exactly her outfit "
     "(the baby-pink romper, the long white lace coat spread out flat, the mint sailor collar, the pale-yellow bow with the pink rose, the "
     "heart garter, the frilly socks, the pink platform Mary Janes tipped over, her two pink hair ribbons), nobody inside them. Standing "
     "propped up against the heap: a black-and-white framed memorial photo of her (her smiling face and twin tails, making a peace sign, "
     "in black and white) with black ribbon bows on the frame's top corners, like a funeral portrait. A few small pink sparkles and hearts "
     "still floating up from the clothes. Funny-cute, NOT gory, no body, no blood. Anime style, clean line art, full colour, soft shading."
     + ALONE + " Square 1:1. Variation " + v + ".") for v in "abc"]
