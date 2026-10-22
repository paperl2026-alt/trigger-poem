# Round 97 (user 2026-10-22, the escort: "为啥孩子又是原地上下抽搐，codex就不能出点资产你做下假动图么" - the child's soul only bobbed
# up and down as one still picture; and the door she walks into in the field and the door that opens after it did not match - "codex你
# 试着让它出孩子灵魂守望下，然后你开门做动画"): her walk as keyframes (the camera walks beside her: seen from the side, going right), and
# ONE door for both: standing alone in the netherworld's field (the escort's goal: ep1/soul_door, a cut-out), and the same door as the
# door close-up after it (its doorway with her standing beside it, looking up at it, waiting - frame - and its closed leaf).
# tools/rounds/r97_import.py brings them in.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX
from job_specs53b import DOORSTYLE

R = "art/raw/r97/"
CHILD = "art/raw/r69/soul_child_a.png"
NETHER = "art/raw/r53b/nether_a.png"
WHO = ("the soul of a little girl of about six (reference image {ref}, seen there from behind: keep her EXACTLY - short soft white hair with a "
       "big white bow, an old-fashioned white lace dress with a big ribbon at the back, barefoot, hugging a worn brown teddy bear); she is "
       "pale, almost white, as if made of soft light, a gentle sad little face, but drawn as a solid clean figure (the game makes her glow)")
DOOR = ("a small old door painted white, its paint cracked and peeling, a little round window of pale amber glass near the top, a tarnished "
        "brass knob, a garland of faded paper flowers a child made hung over it - standing ALONE out in the open sweets field of the "
        "netherworld with no wall around it: just the door in its own plain white door frame, set in the ground, a thin line of warm light "
        "glowing through the cracks round its edges")
JOBS = {
    "R97_walk": [(f"{R}soul_walk_{v}.png", [CHILD, "art/ref/cat_sheet.png"],
                  "Game art in the soft anime painting style of the reference pictures (reference image 2 only for the style: do NOT draw the "
                  "cat girl). Draw a game sprite sheet of " + WHO.format(ref=1) + ": the SAME girl six times in a 3 x 2 grid (three columns, two rows), one "
                  "pose per cell, all at the same scale, her whole body inside each cell, seen from her LEFT SIDE (in profile) as she walks "
                  "slowly to the RIGHT of the picture, hugging the teddy bear. Top row: 1 walking, left foot forward, 2 walking, feet passing, "
                  "3 walking, right foot forward. Bottom row: 4 walking, feet passing again, the dress swaying the other way, 5 stopped, "
                  "looking back over her shoulder toward the viewer, frightened, 6 flinching, hit, eyes squeezed shut, hugging the bear tight. "
                  "Fully transparent background, no floor, no shadow, no text. " + NOFX + f"Landscape 3:2. Try {v}.") for v in "ab"],
    "R97_door": [
        (f"{R}soul_door_{v}.png", [NETHER, CHILD], DOORSTYLE + "Draw ONLY " + DOOR + ", closed, seen straight on, its whole frame and the "
         "door from the ground up, nothing around it: fully transparent background, no field, no sky, no floor. Portrait 2:3. " + NOFX + f"Try {v}.")
        for v in "ab"] + [
        (f"{R}soul_doorframe_{v}.png", [NETHER, CHILD], DOORSTYLE.replace("no people, ", "") + "Landscape 3:2. THE DOORWAY of " + DOOR +
         ", seen straight on, centred, filling the middle of the picture, the field and the sky of reference image 1 all round it. Beside the "
         "doorway, on its left, stands " + WHO.format(ref=2) + " - seen from the front-left, her face to the door, looking up at it, waiting, the bear in her "
         "arms. The DOOR ITSELF IS NOT THERE: the doorway opening inside its frame is filled with SOLID FLAT PURE BLACK (#000000), a clean "
         "shape with crisp edges, nothing drawn inside it. " + f"Try {v}.", "OPAQUE") for v in "ab"],
}

# the closed leaf that fits the doorway of the picked doorframe (b), the same door as the field's (soul_door b): after the frame, as R56
JOBS["R97_leaf"] = [(f"{R}soul_leaf_{v}.png", [f"{R}soul_doorframe_b.png", f"{R}soul_door_b.png"], DOORSTYLE + "Reference image 1 shows a "
                     "doorway whose opening is solid black. Draw ONLY THE CLOSED DOOR LEAF that fits exactly into that black opening - the door "
                     "of reference image 2 (its peeling white paint, its little round amber window near the top, its brass knob and keyhole), "
                     "without its frame and without the flower garland, one leaf, seen straight on, exactly the shape of the black opening, "
                     "nothing else. Transparent background. Portrait. " + NOFX + f"Try {v}.") for v in "ab"]
