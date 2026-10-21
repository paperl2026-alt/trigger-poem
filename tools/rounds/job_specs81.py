# Round 81 (DESIGN 第 1 话 按总纲重做时各处加的巧思: the gallery's far door looks near, walked to it the gallery stretches and the door
# turns into a mouth): the gallery's end door (R74 door2: frame + leaves, in the episode 1 pack) as a living mouth, on the door frame's
# own canvas so it lies exactly over it (tools/rounds/r81_import.py): shut (the two leaves clenched jaws) and open (the doorway a gaping
# maw, the throat with its uvula: the weak spot). One try each (Codex's daily allowance).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX

R = "art/raw/r81/"
A = "public/content/base/levels/ep1/assets/ep1/"
BASE = ("Reference image 1 is this game's mansion doorway (a carved wooden arched door frame, gilded ornaments, ice-cream-cone door knockers, "
        "pink cobwebs); reference image 2 is its two closed door leaves. Draw EXACTLY this same doorway - the same carved arch and posts, the "
        "same gilded crest on top, the same knockers, in EXACTLY the same art style, colours and warm light - at the SAME size, proportions "
        "and framing as reference image 1 (the frame filling the picture the same way, its feet at the bottom edge), but turned into a "
        "living monster's MOUTH: the carved wood swollen into glossy dark-red gums and lips, a few bloodshot eyes opened in the carving of the "
        "frame. Fully transparent background outside the door frame: no wall, no floor, no text, no letters. ")
POSES = {
    "shut": "CLENCHED SHUT: the two door leaves have become a pair of jaws pressed together - a row of big uneven white teeth interlocked "
            "down the middle where the two leaves meet, thick honey-coloured drool oozing between the teeth and running down, the knockers "
            "now rings through the lips.",
    "open": "GAPING WIDE OPEN: the doorway is a monstrous maw - rows of big uneven white teeth all round the inside of the arch, long strands "
            "of honey-coloured drool hanging across the opening, a huge pink tongue lolling out over the threshold toward the viewer, deep "
            "inside a dark red throat with a fleshy uvula hanging at the back. The opening is filled by the throat (opaque).",
}
JOBS = {f"R81_{k}": [(f"{R}door_mouth_{k}.png", [f"{A}door2_room.webp", f"{A}door2_leaf.webp"], BASE + d + " " + NOFX + "Square 1:1.")]
        for k, d in POSES.items()}
