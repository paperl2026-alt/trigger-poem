# Round 84 (user 2026-10-22: the honey maggot's close-up went under the floor after it - better a close-up of its picture): a painted
# picture of episode 1's honey maggot boss (3D in the game: src/battle/worm.js) for its entrance close-up page (Game.vignette,
# bosses.json maggot.closeup.k), after a screenshot of the 3D one as it rears up out of the ground. Two different takes.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX

R = "art/raw/r84/"
REF3D = [f"{R}ref_maggot_up.jpg", f"{R}ref_maggot_cross.jpg"]
STYLE = "public/content/base/levels/ep1/assets/enemy/armor_wake.webp"
BASE = ("Reference images 1 and 2 are screenshots of this game's giant honey maggot boss (a simple 3D model): its shape and colours are the "
        "standard - a huge segmented worm, its body DARK PLUM-PURPLE with darker ring ridges round every segment, a big round bright "
        "YELLOW glowing sac of honey bulging from the side of each segment, a blunt round head whose front is a wide round mouth: a thick red "
        "lip ring lined with a ring of white pointed teeth, a glowing red-orange ball deep in the throat. Reference image 3 is an approved "
        "monster of this game: paint in EXACTLY its art style (line work, rendering, colours, finish). Draw ONE picture of the maggot alone, "
        "rearing up out of a hole in the ground like a cobra, the front of its head with the open mouth turned toward the viewer, about four "
        "of its segments showing above the ground with their yellow sacs toward the viewer, thick golden honey dripping from its mouth and "
        "sacs, broken ground and crumbs round the hole at the bottom. The SAME colours as the screenshots (dark plum-purple body, bright "
        "yellow sacs, red lip, white teeth), but painted with detail: glossy wet skin, the sacs translucent with honey inside. Fully "
        "transparent background, nothing else in the picture: no sky, no scenery, no text, no frame. ")
TAKES = {
    "a": "Seen from slightly below, the head filling the upper part of the picture, mouth wide open straight at the viewer.",
    "b": "Seen from the front and a little to the side, the body curving in an S as it rises, the head tilted, mouth open in a shriek.",
}
JOBS = {f"R84_maggot_{k}": [(f"{R}maggot_{k}.png", REF3D + [STYLE], BASE + d + " " + NOFX)] for k, d in TAKES.items()}
