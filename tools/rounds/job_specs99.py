# Round 99 (user 2026-10-23, the bosses' weak point: beside the red ring the game draws round it, an arrow a little bigger than the one in
# their sketch, jabbing at the ring and back again; "不要SVG，codex让GPT出合适的素材" - a picture, not a drawn shape; it moves round the
# ring to stay off the boss): the arrow as a picture, pointing RIGHT (the game turns it to the ring: src/ui/weakArrow.js), in the game's
# look - the red of its danger reticle, a thick white sticker edge so it reads on any colour. Three tries; tools/rounds/r99_import.py.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]

R = "art/raw/r99/"
REFS = ["art/raw/r46/sight_hide_a.png"]   # (the red danger reticle, R46)
ARROW = ("A single game UI pointer arrow, pointing straight to the RIGHT, alone in the middle of the picture with wide empty margins: a "
         "chunky, slightly curved hand-drawn comic arrow like the 'look here!' arrows of Japanese manga and arcade games - a fat tapering "
         "body with a big bold triangular head, its tail a little ragged as if dashed off with a brush; vivid scarlet-to-hot-pink colour with "
         "a darker crimson inner line and a small glossy highlight, a THICK clean white sticker outline all round it and a thin dark outline "
         "outside that, so it reads on any background. Flat, crisp, no text, no letters, no numbers, no other shapes, no glow, no shadow, no "
         "sparkles. Fully transparent background. Landscape 3:2. ")
JOBS = {"R99_arrow": [(f"{R}arrow_{v}.png", REFS, ("Reference image 1 is this game's red danger reticle: the same red and the same "
                                                    "sticker-edged arcade look. " if REFS else "") + ARROW + f"Try {v}.") for v in "abc"]}
