# Round 90 (user 2026-10-22: episode 1 should have one kind of monster to a room, none repeated from room to room - new art where a room
# has no kind of its own, not ordinary monsters reused; and the monsters Codex drew all in one family of colours were hard to tell from the
# places): the cold store's own monster, the POPSICLE SKELETON (docs/DESIGN.md 第 1 话 5: a room full of bones, the coffin-shaped freezer,
# the popsicle skeleton's eyes turning), five designs to pick three from, in colours that stand out against the pale icy room.
# (the first new kind - a check of the look before the oven kitchen's, the honey tunnel's and the netherworld's are drawn)
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs53 import BASE, MON

R = "art/raw/r90/"
REFS = MON + ["art/raw/r53/m_ghoul_a.png"]   # (the approved direction, two approved sheets, and this episode's gelato ghoul for its look)
ROOM = ("It lives in a walk-in cold store of pale icy blue-white tiles, frost and grey steel: it must stand out against that at a glance - "
        "warm, saturated colours (cherry red, raspberry pink, lemon yellow, orange), never pale blue, white-grey or silver as its main "
        "colours. ")
KIND = ("walker that comes close and bites, like the gelato ghoul in reference image 4",
        "POPSICLE SKELETON, a skeleton made of frozen ice pops: its bones are wooden popsicle sticks bound with frost, its ribcage a row of "
        "half-eaten cherry and raspberry ice-pop bars, its spine a stack of lemon ice-pop chunks, its skull a big bitten ice pop with two "
        "dark eye sockets where glossy eyeballs roll loose, a wide jaw of popsicle-stick teeth with glossy pink lips; girlified: long "
        "twin-tail hair of dripping red-and-orange ice-pop syrup frozen into icicles, tied with big pink ribbons, a little frilly frost-stiff "
        "apron skirt, long eyelashes, legs of popsicle sticks in torn striped stockings and red Mary-Jane shoes; melted syrup drips from "
        "every joint.",
        "Poses, top row: 1 shambling forward, one leg mid-step, skull lolling, 2 shambling, the other step, 3 crouched low and tense, about "
        "to pounce; bottom row: 4 lunging straight at the viewer, bony arms reaching, jaw wide open, 5 biting right in front of the viewer, "
        "very close and big, 6 hurt, recoiling, ice-pop chunks breaking off, the eyeballs squeezed shut.")
beh, d, poses = KIND
JOBS = {f"R90_popsicle_{v}": [(f"{R}m_popsicle_{v}.png", REFS, BASE.replace("reference images 2 and 3 are approved", "reference images 2, 3 and 4 are approved")
                               .replace("Colours: honey amber, cream, sour pastel pink, pistachio, chocolate brown, tarnished gold; NOT dark green, NOT violet. ", "")   # (its own colours: ROOM)
                               + ROOM + f"The monster ({beh}): " + d + " " + poses + f" Variation {v}: its own design details, same idea, a clearly different take from the other variations.")]
        for v in "abcde"}
