# Round 95 (user 2026-10-22: the nursery's little dolls were the coupe doll's own pictures - "图片又偷懒，codex额度无限的，你非得用一个素材复用":
# twitching to show they had not changed, and changed still the same picture): the little doll that walks at you, a monster of its own,
# nothing like the coupe doll that throws (enemy doll); the bat's sheet layout with the walker's poses (as R91). Five designs, three picked;
# tools/rounds/r95_import.py brings them in as enemy/dollkin[_b|_c]_<pose>.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs53 import BASE, MON
from job_specs91 import WALK

R = "art/raw/r95/"
REFS = MON + ["art/raw/r53/m2_doll_a.png"]   # (the approved direction, two approved sheets, and the coupe doll: what it must NOT look like)
B = (BASE.replace("Colours: honey amber, cream, sour pastel pink, pistachio, chocolate brown, tarnished gold; NOT dark green, NOT violet. ", ""))
ROOM = ("It lives in a pastel nursery of soft pink, mint and cream: it must stand out against that at a glance - BLACK lace and pale ivory "
        "porcelain with crimson ribbons as its main colours, never pastel pink or mint as its main colour. Reference image 4 is ANOTHER "
        "monster of the same room (the coupe doll that throws things): this one must look NOTHING like it - not a doll in a cup, not on a "
        "stand, no gelato coupe. ")
DOLL = ("WIND-UP MOURNING DOLL, a small antique porcelain baby doll the size of a toddler that walks by itself: a black lace christening "
        "gown and bonnet gone grey with dust, crimson ribbons, a cracked ivory porcelain face with one glass eye missing (a dark hole) and "
        "the other rolling, painted rosy cheeks, a little mouth that cracks open into rows of tiny teeth; a big brass wind-up key turning "
        "in its back; stiff jointed porcelain arms reaching out, one hand broken off showing a wire; little white socks and black Mary-Jane "
        "shoes; it toddles stiffly, tilting its head too far.")
JOBS = {"R95_dollkin": [(f"{R}m_dollkin_{v}.png", REFS, B + ROOM + "The monster (a small walker that comes at you in numbers and bites): " +
                         DOLL + " " + WALK + f" Variation {v}: its own design details, same idea, a clearly different take from the other variations.")
                        for v in "abcde"]}
