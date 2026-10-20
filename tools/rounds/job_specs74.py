# Round 74 (DESIGN「总纲」: the monsters come in by the doors too - user 2026-10-20 "怪物只会破墙也不会开门"; episode 1 redone so): the
# rotten-honey house's doors, as leaves of their own to stand in the side-wall doorways of its rooms (src/battle/panels.js buildWay,
# wall: left | right) and swing open when something comes through, each with its frame: the house's panelled double doors and a plain
# single servants' door, as they are and after the honey-rot has got into the house (the rooms' _x boards). Flat front views like the walls
# they stand in (art/raw/r28 FLAT). Two tries each.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs28 import FLAT

R = "art/raw/r74/"
REF = "public/content/base/levels/ep1/assets/ep1/gallery_wallL1.webp"
REFX = "public/content/base/levels/ep1/assets/ep1/gallery_wallL1_x.webp"
DOORS = {
    "double": "ONE pair of tall panelled double doors of an elegant Western mansion, the whole doorway and nothing else, 1.5 m wide and "
              "2.6 m tall: two cream-white leaves with raised gilded panels and slim brass lever handles meeting in the middle, a carved "
              "cream-and-gold frame round them with a small ornamental crest on top",
    "single": "ONE single panelled door of an elegant Western mansion, the whole doorway and nothing else, 0.95 m wide and 2.3 m tall: a "
              "dark polished wood leaf with four raised panels and a brass knob, a simple cream frame round it",
}
JOBS = {}
for k, d in DOORS.items():
    JOBS[f"R74_{k}"] = [(f"{R}door_{k}_{v}.png", [REF], "Reference image 1 is a wall of this mansion: paint the door in EXACTLY the same "
                         "style, colours, line work and warm afternoon light. " + FLAT + "The surface: " + d + ". Nothing around it: the "
                         "background outside the frame is fully transparent. Portrait 2:3 (the doorway fills the height).") for v in "ab"]
    JOBS[f"R74_{k}_x"] = [(f"{R}door_{k}_x_{v}.png", [REFX], "Reference image 1 is a wall of this mansion after a rotting honey has got into "
                           "it (sticky amber honey running down, sugar crust, rot): paint the door the same way, EXACTLY in that style and "
                           "those colours. " + FLAT + "The surface: " + d + ", honey oozing from its seams and dripping down it. Nothing "
                           "around it: the background outside the frame is fully transparent. Portrait 2:3 (the doorway fills the height).") for v in "ab"]
