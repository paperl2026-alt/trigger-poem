# Round 75 (user 2026-10-20: the prologue boss's fourth form calls up small monsters that heal her - the girls must kill them while they
# fight her, or she heals back and returns to her third form; "these monsters: your call whether Codex draws them"): the IV-drip spirit
# from the school nurse's office, a healer that floats beside the boss and feeds her through its tube (src/battle/thing.js heal), in the
# prologue monsters' style. Three designs (all used, as the kind's variants enemy/drip, drip_b, drip_c), each a 3 x 2 sheet of its poses.
# Imported by tools/rounds/r75_import.py.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs23 import REF as MREF

R = "art/raw/r75/"
MON = [MREF, "art/raw/r23/desk.png", "art/raw/r43/m_clock_a.png"]   # the approved monster direction + two approved prologue sheets
BASE = ("Reference image 1 shows the approved art direction for this game's monsters; reference images 2 and 3 are approved monster sprite "
        "sheets of this game: draw in EXACTLY their art style (clean anime line art, full colour, rich detail, a thin white sticker outline "
        "around the figure). THE MONSTER is a creepy, clearly abnormal creature made from the things of a Japanese high school's nurse's "
        "office, and it is girlified through its whole body (long hair, ribbons, frills, eyelashes, glossy lips, coy feminine body language). "
        "It must look like a MONSTER first: NOT a normal pretty girl holding an object. "
        "IV DRIP SPIRIT: a big transparent IV drip bag floating in the air, the bag is her head and body, half full of a glowing pink fluid in "
        "which her big sleepy eyes with long lashes float, a nurse's cap pinned on top of the bag with a little red cross, long pale-pink hair "
        "made of tangled drip tubes trailing below her, one long tube ending in a needle that she holds like a tail or a whip, a frilly "
        "white nurse's apron hung under the bag like a skirt, two thin arms in white gloves holding a rolling drip stand like a walking staff. "
        "Colours: clear plastic, pastel pink, nurse white, a touch of mint and red. "
        "Draw a game sprite sheet: the SAME monster six times in a 3 x 2 grid (three columns, two rows), one pose per cell, all at the same "
        "scale, each pose complete and fully inside its own cell with clear empty space between cells. Transparent background. No text, no "
        "letters, no numbers, no grid lines, no ground, no cast shadows. NO EFFECTS: no glow around it, no sparkles, no motion lines, no "
        "light rays (the game adds every effect itself). "
        "Poses, top row: 1 floating, 2 floating, swaying the other way, 3 idle, coy, head tilted; bottom row: 4 feeding: leaning to the "
        "side, its needle-tube stretched out sideways (toward something just outside the cell), its fluid pumping, 5 winding up, the "
        "needle-tube drawn back like a whip, 6 hurt, the bag dented and leaking, eyes squeezed shut.")
JOBS = {"R75_drip": [(f"{R}drip_{v}.png", MON, BASE + f" Variation {v}: its own design details, same idea, a clearly different take "
                      "from the other variations.") for v in "abcd"]}
