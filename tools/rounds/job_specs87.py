# Round 87 (user 2026-10-22: the shadows of the studio could not be told apart - GPT's pictures had too much detail, a mass of noise -
# and why are they all people? one that loves children a pram crossed with a person, a raging one a beast on all fours crossed with a
# person): the studio's four shadows again, each a silhouette of its own that reads at a glance, simple and clean, one colour each.
# 3 x 2 six-pose sheets like R56 (tools/rounds/r87_import.py cuts them into the same pose names, so enemies.json frames still fit).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs53 import MON

R = "art/raw/r87/"
BASE = ("Reference images 1 to 3 are this game's approved monster art: draw in their art style (clean anime line art, full colour, a thin "
        "white sticker outline around the figure) BUT FAR SIMPLER: one bold, clear silhouette that reads at a glance from far away, big flat "
        "areas of colour, very few details, NO busy texture, NO noise, no tiny ornaments scattered all over, no clutter. "
        "THE MONSTER is one of the four SHADOWS of the lady of an old rotten honey-and-sweets mansion: her shadow turned into a monster, its "
        "body dark (black and deep burgundy) with ONE strong colour of its own as described, two small pale eyes, honey-gold drips at its "
        "edges. It is NOT a person standing there: its body shape is a crossing of a thing and a woman, as described, so that it looks "
        "completely different from the other three at a glance. "
        "Draw a game sprite sheet: the SAME monster six times in a 3 x 2 grid (three columns, two rows), one pose per cell, all at the same "
        "scale, each pose complete (the whole body) and fully inside its own cell with clear empty space between cells, nothing crossing into "
        "another cell. Transparent background. No text, no letters, no numbers, no grid lines, no ground, no cast shadows. NO EFFECTS: no "
        "glow, no sparkles, no motion lines, no smoke, no light rays (the game adds every effect itself). ")
SHADES = {
    "hostess": "THE HOSTESS (its colour: candy pink and silver): a tall thin shadow-woman whose lower body IS a three-tier silver tea trolley on "
               "little wheels; four long thin arms, holding a teapot and plates of gelato; a lace maid's cap. Poses, top row: 1 rolling "
               "forward, 2 rolling sideways, 3 bowing as she pours tea; bottom row: 4 two arms drawn back with a plate each (winding up), "
               "5 flinging the two plates at the viewer, 6 hurt, bent back.",
    "mourner": "THE MOURNER (its colour: violet, with white lilies): a floating black mourning veil like a giant jellyfish - a dome of black "
               "lace with a pale weeping face under it, long black veil streamers and ribbons trailing below it instead of a body or legs, a "
               "few white funeral lilies caught in the lace; it floats above the ground. Poses, top row: 1 floating, 2 floating, the "
               "streamers swirling, 3 drooping in grief; bottom row: 4 swelling up, the veil billowing wide, face tilted back (winding up), "
               "5 wailing straight at the viewer, the streamers blown back, 6 hurt, crumpled.",
    "mother":  "THE MOTHER (its colour: pale baby blue and cream): a shadow-mother grown into an old-fashioned pram - her body rises out of "
               "the pram's hood, the pram's big spoked wheels where her legs would be, long arms rocking a swaddled bundle, a little mobile of "
               "toys hanging from the hood. Poses, top row: 1 rocking the bundle, 2 rolling forward, 3 singing to the bundle, head bowed; "
               "bottom row: 4 lifting a rattle high (winding up), 5 throwing the rattle at the viewer, 6 hurt, the pram tipping.",
    "bride":   "THE BRIDE (its colour: white, with blood-red roses): a jilted bride turned into a beast that runs on all fours like a big "
               "hound - long thin limbs, a torn white wedding veil and a long train, a wilted bouquet of red roses in its teeth, a bodice on "
               "a beast's ribcage, no human face to see under the veil. Poses, top row: 1 standing on all fours, 2 prowling, mid-step, 3 "
               "rearing up on its hind legs, head tilted; bottom row: 4 crouched low, about to pounce, 5 lunging straight at the viewer, jaws "
               "open, very close and big, 6 hurt, recoiling.",
}
JOBS = {f"R87_shade_{k}": [(f"{R}shade_{k}.png", MON, BASE + d)] for k, d in SHADES.items()}
