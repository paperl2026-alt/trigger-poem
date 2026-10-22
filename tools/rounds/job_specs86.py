# Round 86 (user 2026-10-22: episode 1 still has many of those grey-white enemies standing still at the start - too abstract): the
# cold store's ice-cream ghouls (ghoul, ghoul_b, ghoul_c) as they stand before they wake - frozen solid in a block of ice - on the
# monster's own framing so the two swap in place (tools/rounds/r86_import.py -> enemy/<variant>_disguise; Enemy.wake shudders it, the
# ice bursts and it melts into the monster).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX

R = "art/raw/r86/"
E = "public/content/base/levels/ep1/assets/enemy/"
BASE = ("Reference image 1 is a monster of this game: a melting ice-cream zombie. Draw the SAME zombie FROZEN SOLID inside a tall block of "
        "clear blue-white ice standing on the floor, as it is kept in the mansion's cold store before it wakes - in EXACTLY the same art "
        "style, line work and colours as reference image 1, at the SAME size, position and framing (the block filling the picture the way the "
        "monster does, its bottom on the bottom edge), so the two pictures can swap in place. The zombie is plainly visible through the ice, "
        "standing still with its arms hanging, its colours a little paler and bluer through the ice; the block of ice has straight cut "
        "sides with rounded worn edges, white frost and frozen drips on its surface, a few cracks, icicles hanging from its top edge. "
        "Nothing moving. Fully transparent background outside the block of ice: no floor, no shadow, no text. ")
JOBS = {f"R86_ghoul{v or '_a'}": [(f"{R}ghoul{v}_disguise.png", [f"{E}ghoul{v}_walk0.webp"], BASE + NOFX)] for v in ("", "_b", "_c")}
