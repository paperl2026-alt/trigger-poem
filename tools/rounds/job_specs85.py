# Round 85 (user 2026-10-22: episode 1 still has many of those grey-white enemies standing still at the start - too abstract): the
# ordinary, lifeless doll each of episode 1's sundae-doll monsters (doll, doll_b, doll_c) was before it came alive, on the monster's own
# framing so the two swap in place (tools/rounds/r85_import.py -> enemy/<variant>_disguise; Enemy.wake shudders it and melts it into the
# monster - as R83 did for the chandelier and the armour).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX

R = "art/raw/r85/"
E = "public/content/base/levels/ep1/assets/enemy/"
BASE = ("Reference image 1 is a monster of this game: a rotten doll sitting in a giant ice-cream sundae glass. Draw the ORDINARY, LIFELESS "
        "antique doll it was before it came alive - a pretty, clean porcelain doll of an old sweets-themed mansion - in EXACTLY the same art "
        "style, line work, colours and warm light as reference image 1, at the SAME size, position and framing (filling the picture the same "
        "way), so the two pictures can swap in place: the SAME sundae glass she sits in (clean, the ice cream in it neat and fresh, nothing "
        "dripping), the SAME dress, bonnet, ribbons and shoes, the same hair colour in neat curls; she sits up straight and still with her "
        "hands in her lap, a calm closed-mouth doll's smile, clear glass eyes, smooth unbroken porcelain skin. Nothing rotten, no cracks, no "
        "stains, no teeth showing, nothing alive. Fully transparent background, nothing else in the picture: no floor, no shadow, no text. ")
JOBS = {f"R85_doll{v or '_a'}": [(f"{R}doll{v}_disguise.png", [f"{E}doll{v}_idle.webp"], BASE + NOFX)] for v in ("", "_b", "_c")}
