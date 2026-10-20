# Round 67 (DESIGN「掩体」: covers can be things that fall - user 2026-10-20 agreed, after batch 23's reference research): covers that come
# crashing down from above into their place as the girls arrive (PanelWorld.coverBody, cover "fall": true), two for each episode,
# things that really hang overhead and could fall: painted after an approved cover of that place, same barricade rules as every cover.
#   R67_covers: cover_<name>.png -> cover/fall_<name> (tools/rounds/r67_import.py)
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX

R = "art/raw/r67/"
COVER = ("Reference image 1 is an approved barricade of this game, in this place: paint in EXACTLY its style (painting technique, line work, "
         "colours, materials, how worn it is). Draw ONE single game asset: a BARRICADE an anime girl crouches at in a third-person cover "
         "shooter: a big thing that has just FALLEN DOWN from the ceiling and now lies on the floor. ALL rules are mandatory: (1) a perfectly "
         "straight-on front view of its long side, no perspective, the top edge roughly horizontal; (2) wide and chunky, about twice as wide as "
         "tall, one solid mass with NO holes or gaps to see through, a flat bottom edge resting on the floor line; (3) it fills the picture "
         "from the left edge to the right edge, its bottom on the bottom edge, a 3:2 landscape picture; (4) fully transparent background, "
         "nothing else at all: no floor, no shadow, no dust, no wall, no people, no text, no letters, no numbers; (5) battered from the fall: "
         "dents, a crack, bent parts. " + NOFX + "THE OBJECT: ")
FALL = {
    "light": ("art/raw/covers_school.png", "a long school ceiling light fixture (a steel housing with two long fluorescent tubes, one cracked) that fell "
              "with a piece of ceiling board still bolted to it, lying on its long side"),
    "locker": ("art/raw/covers_school.png", "a grey steel school locker cabinet that toppled over and lies on its back, its doors dented, seen from its long side"),
    "chandelier": ("art/raw/r54/cover_hall1.png", "a big brass and crystal chandelier of an old Western mansion that crashed down and lies on its side, its "
                   "arms bent, crystal drops scattered on top of it, its chain coiled beside it, seen as one long heap"),
    "wardrobe": ("art/raw/r54/cover_hall1.png", "a heavy carved dark-wood wardrobe of an old Western mansion that toppled over and lies on its back, one door "
                 "cracked open a little, seen from its long side"),
    "beam": ("art/raw/r63/cover_hiroma1.png", "a thick old cedar ceiling beam of a Japanese inn that crashed down with a paper lantern still hanging off it "
             "(the lantern crushed against the floor), splinters at the broken ends"),
    "ranma": ("art/raw/r63/cover_rouka1.png", "a heavy carved wooden ranma transom panel (waves and cranes) that fell from above the sliding doors with "
              "a broken piece of the wooden lintel still attached, lying on its long edge"),
}
ROOT = pathlib.Path(__file__).resolve().parents[2]   # (only the pictures not made yet)
JOBS = {"R67_covers": [(f"{R}cover_{n}.png", [ref], COVER + d) for n, (ref, d) in FALL.items() if not (ROOT / f"{R}cover_{n}.png").exists()]}
