# Round 91 (user 2026-10-22: one kind of monster to a room in episode 1, new art where a room has none of its own; colours that stand out
# from the place - after R90's popsicle skeleton passed in the game): the oven kitchen's, the honey tunnel's and the netherworld's own
# monsters, five designs each to pick three from, and the honey tunnel's great one (it bursts out of the floor and brings it down: the
# brute of tools/rounds/ep1_rework.py tunnel_fall), three designs to pick one from.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs53 import BASE, MON

R = "art/raw/r91/"
REFS = MON + ["art/raw/r53/m_ghoul_a.png"]   # (the approved direction, two approved sheets, and this episode's gelato ghoul for its look)
B = (BASE.replace("reference images 2 and 3 are approved", "reference images 2, 3 and 4 are approved")
     .replace("Colours: honey amber, cream, sour pastel pink, pistachio, chocolate brown, tarnished gold; NOT dark green, NOT violet. ", ""))
WALK = ("Poses, top row: 1 moving forward, mid-step, 2 moving forward, the other step, 3 crouched low and tense, about to pounce; bottom row: "
        "4 lunging straight at the viewer, reaching, mouth wide open, 5 biting right in front of the viewer, very close and big, 6 hurt, "
        "recoiling, pieces breaking off, eyes squeezed shut.")
KINDS = {
    "ginger": ("walker that runs at you and bites; some of them run at a wall and burst like a fire cracker",
               "It lives in a big old kitchen of warm orange brick, copper pans and the glow of an oven: it must stand out against that at a "
               "glance - charred BLACK and dark cocoa as its main colours with bright WHITE royal-icing lines and hot-pink sugar buttons, "
               "never orange or tan as its main colour. ",
               "BURNT GINGERBREAD GIRL, a gingerbread figure left in the oven far too long: charred black crackling biscuit body split open "
               "with glowing cracks, white icing piped on it as frilly collar, apron lace and a big bow, icing drawn into long eyelashes and a "
               "too-wide smile that has cracked open into a mouth of broken biscuit teeth; long twin braids of burnt caramel; gumdrop "
               "buttons; one arm snapped and dangling; little biscuit legs with icing stockings; crumbs and smoke-blackened sugar falling off.",
               WALK),
    "larva": ("small crawler that comes over the floor in numbers and bites",
              "It lives in a deep tunnel of dark amber honey: it must stand out against that at a glance - pale milky WHITE and soft "
              "cream-pink as its main colours, never amber, gold or brown as its main colour. ",
              "HONEY LARVA, a fat pale grub the size of a child, glossy milk-white segmented body dripping clear honey, crawling on many tiny "
              "stubby legs in white frilly socks; girlified: its front segment is a pale doll-like head with a little lace bonnet sunk into "
              "the flesh, long eyelashes over a cluster of glossy black eyes, a round mouth with pink glossy lips ringed with tiny teeth; "
              "frilly pink ribbons tied round its segments like a dress; a soft pink blush on its body.",
              "Poses, top row: 1 crawling forward, body bunched, 2 crawling forward, body stretched, 3 rearing up, about to lunge; bottom row: "
              "4 lunging straight at the viewer, mouth wide open, 5 biting right in front of the viewer, very close and big, 6 hurt, "
              "recoiling, honey splattering, eyes squeezed shut."),
    "tar": ("walker that wades out of the honey and comes at you",
            "It lives in an underworld field of shining orange honey under a peach sky: it must stand out against that at a glance - glossy "
            "BLACK tar with a dark cherry-red sheen as its main colours and hot-pink glowing eyes, never orange, honey or gold as its main "
            "colour. ",
            "TAR GUEST, a lost guest of the gelato cafe melted into black treacle: a tall drooping figure of glossy black syrup that keeps "
            "running down and reforming, long hair of black syrup to the floor, a melted sun hat with a pink ribbon still on it, a frilly "
            "collar and the lace of a summer dress sticking out of the tar, a half-eaten gelato cone still in one hand; a white porcelain-"
            "smooth face sliding inside the tar with hot-pink glowing eyes and glossy lips; long thin arms with dripping fingers.",
            WALK),
}
JOBS = {}
for k, (beh, room, d, poses) in KINDS.items():
    JOBS[f"R91_{k}"] = [(f"{R}m_{k}_{v}.png", REFS, B + room + f"The monster ({beh}): " + d + " " + poses +
                         f" Variation {v}: its own design details, same idea, a clearly different take from the other variations.") for v in "abcde"]
# the great one of the honey tunnel: the same larva grown huge (3.6 m), heavy, rearing up out of the floor and slamming down on them
GREAT = ("HONEY LARVA QUEEN, the honey larva grown huge and bloated: a towering pale milk-white grub rearing up, its segments bulging with "
         "honey, dozens of little larvae clinging to it, a lace bonnet and pink ribbons sunk into its flesh, long eyelashes over clusters of "
         "glossy black eyes, a huge round mouth with pink glossy lips ringed with teeth.")
JOBS["R91_larva_queen"] = [(f"{R}m_larva_queen_{v}.png", REFS, B + KINDS["larva"][1] + "The monster (a huge, very tough one that rises out "
                            "of the floor and brings the floor down with one slam): " + GREAT + " Poses, top row: 1 risen up, swaying, 2 "
                            "swaying the other way, 3 idle, looming, looking down at the viewer; bottom row: 4 rearing far back, about to "
                            "slam (winding up), 5 slamming down straight at the viewer, mouth wide open, 6 hurt, recoiling, honey spraying, "
                            "eyes squeezed shut." + f" Variation {v}: a clearly different take from the other variations.") for v in "abc"]
