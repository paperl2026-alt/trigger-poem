# Round 83 (user 2026-10-21: the chandelier and the knight standing there in grey are odd - the player can't tell what they are; have
# Codex paint the ordinary thing it was, then it shakes and turns into the monster by program animation): the ordinary, lifeless thing
# each of episode 1's chandelier and armour monsters was before it came alive, one per variant (a, b, c), on the monster's own framing so
# the two swap in place (tools/rounds/r83_import.py -> enemy/<variant>_disguise; enemies.js frames.disguise, Enemy.wake).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX

R = "art/raw/r83/"
E = "public/content/base/levels/ep1/assets/enemy/"
BASE = ("Reference image 1 is a monster of this game. Draw the ORDINARY, LIFELESS object it was before it came alive - a piece of furniture "
        "of an old honey-and-sweets themed mansion - in EXACTLY the same art style, line work, colours and warm light as reference image 1, "
        "at the SAME size, position and framing (the object filling the picture the same way the monster does), so that the two pictures can "
        "swap in place. Fully transparent background, nothing else in the picture: no floor, no wall, no shadow, no text. ")
ARMOR = ("A decorative suit of plate armour standing upright and perfectly still on a low square wooden display plinth, like the armour "
         "displays lining a castle hall: the SAME golden armour pieces as the reference (the same helmet with its visor CLOSED, the same "
         "breastplate, pauldrons, gauntlets and the same layered waffle-cone patterned armoured skirt), standing straight and symmetrical, "
         "the long ice-cream-cone lance held upright at its side resting on the plinth. It is EMPTY and dead: polished clean metal, no hair "
         "at all, no ribbons fluttering, nothing dripping, no face, no eyes, nothing alive.")
CHAND = ("An ordinary ornate golden crystal chandelier hanging still, seen from slightly below: the SAME gilded frame, curved arms and the "
         "same number of lit white candles as the reference, strings of clear crystal drops hanging from it, a short golden chain going up "
         "out of the top edge of the picture. It is an ordinary lamp and dead: no face, no eyes, no mouth, no teeth, no hair, no arms, no "
         "hands, no legs, no shoes, no ribbons, nothing dripping.")
JOBS = {}
for v in ("", "_b", "_c"):
    JOBS[f"R83_armor{v or '_a'}"] = [(f"{R}armor{v}_disguise.png", [f"{E}armor{v}_wake.webp"], BASE + ARMOR + " " + NOFX)]
    JOBS[f"R83_chandelier{v or '_a'}"] = [(f"{R}chandelier{v}_disguise.png", [f"{E}chandelier{v}_hover0.webp"], BASE + CHAND + " " + NOFX)]
