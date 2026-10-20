# Round 70 (docs/DESIGN.md「准星精简」; user 2026-10-20: the reticle was too big and hid what she aimed at -> simplify it, keep the cat ears
# and the bunny ears; then "the ears from Codex: the script-drawn ones sit wrong"): the two girls' new reticles as clean line art, each in
# two forms the game switches between (src/ui/glhud.js Reticle):
#   idle   four corner brackets round an empty middle and a small centre dot, her ears on top (the gun girl: bunny ears, the cat girl: cat ears)
#   lock   over something she can hit: smaller and closed in - the gun girl a small square, the cat girl a small triangle - the ears smaller
# White line art on a fully transparent background, the centre of the frame exactly in the centre of the picture (the aim point); the game
# draws it inverting whatever is behind it and puts a thin dark edge round it. Two tries of each to pick from.
import pathlib

R = "art/raw/r70/"
REF = ["art/raw/r35/ret_pink_a.png"]   # (only for the ears' character: this game's reticles had them)
BASE = ("A minimal aiming RETICLE for a game's HUD. Pure WHITE clean vector-like line art on a FULLY TRANSPARENT background: no fill, no "
        "shading, no outline of another colour, no glow, no text, no letters, no numbers, nothing else in the picture. Even line weight about "
        "one fortieth of the picture's width, rounded line ends. The reticle is centred: the CENTRE of its frame is exactly the centre of the "
        "picture, and the frame (without the ears) spans about the middle 46% of the picture's width; the middle of the frame is EMPTY except "
        "for the centre dot, so the player sees what is aimed at through it. Reference image 1 is an older reticle of this game: use it only "
        "for the character of the ears, do NOT copy its frame or its details. ")
DESIGNS = {
    "pink_idle": "Four separate L-shaped CORNER BRACKETS marking the corners of a square (like a camera's focus frame; the sides are open between "
                 "them), a small round dot in the exact centre. On top: a pair of tall RABBIT EARS drawn as simple rounded outlines, rising "
                 "from the top edge of the frame, one on each side of the middle (left ear a little bent forward at its tip), each about as "
                 "tall as the frame is wide, the inner line of each ear drawn too.",
    "pink_lock": "A SMALL closed-in square: four short L-shaped corner brackets drawn close together so they almost close the square, half "
                 "the size of a normal focus frame, a small dot in the exact centre. On top: a pair of SHORT rabbit ears (rounded outlines) "
                 "rising from the top edge, close together.",
    "cat_idle": "Four separate L-shaped CORNER BRACKETS marking the corners of a square (like a camera's focus frame; the sides are open between "
                "them), a small round dot in the exact centre. On top: a pair of pointed CAT EARS drawn as simple triangle outlines with a "
                "short inner line, standing on the top edge of the frame at its left and right thirds (like the ears on a cat's head), each "
                "about a third as tall as the frame.",
    "cat_lock": "A SMALL TRIANGLE pointing up, drawn as its three CORNERS only (three short V-shaped corner pieces, the middle of each side "
                "open), a small dot in the exact centre. On top: two small pointed CAT EARS (triangle outlines) on the two upper sides of the "
                "triangle, just below its top corner, like a cat's head.",
}
ROOT = pathlib.Path(__file__).resolve().parents[2]   # (only the pictures not made yet)
JOBS = {f"R70_{k}": [(f"{R}{k}_{v}.png", REF, BASE + d + " Square 1:1.") for v in "ab" if not (ROOT / f"{R}{k}_{v}.png").exists()]
        for k, d in DESIGNS.items()}
JOBS = {k: v for k, v in JOBS.items() if v}
