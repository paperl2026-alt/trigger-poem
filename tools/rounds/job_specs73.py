# Round 73 (DESIGN「总纲」: the monsters come in by the doors too, not only through holes they break - user 2026-10-20 "怪物只会破墙也
# 不会开门"): the prologue classroom's sliding doors as leaves of their own, to stand in its side-wall doorways (src/battle/panels.js
# buildWay, wall: left | right) and slide open when something comes through. Flat front views like the walls they stand in
# (art/raw/r28 FLAT): the normal school door and the same door after the evil energy has turned the school (the classroom's _x boards).
# Two tries each.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs28 import FLAT

R = "art/raw/r73/"
DOOR = ("The surface: ONE wooden sliding door of a Japanese high-school classroom, the whole door and nothing else, 0.9 m wide and 2 m "
        "tall: a sturdy light wooden frame, a large glass window in its upper half split by a thin wooden bar, a plain wooden lower panel, "
        "a small recessed metal finger pull at the side, a scuffed kick plate at the bottom. Paint the window glass solid pure magenta "
        "#FF00FF (it is cut out later); the background outside the door is fully transparent. ")
JOBS = {
    "R73_door": [(f"{R}cls_door_{v}.png", ["public/content/base/levels/ep0/assets/st0/door1.webp"],
                  "Reference image 1 is a wall of this classroom with its doors painted on it: paint the door in EXACTLY the same style, "
                  "colours, line work and light. " + FLAT + DOOR + "Warm late-afternoon light. Portrait 2:3 (the door fills the height; transparent on either side of it).") for v in "ab"],
    "R73_door_x": [(f"{R}cls_door_x_{v}.png", ["public/content/base/levels/ep0/assets/st0/door1_x.webp"],
                    "Reference image 1 is a wall of this classroom after an evil energy has turned it (purple and magenta, cracked, veined "
                    "with dark sigils): paint the door the same way, EXACTLY in that style and those colours. " + FLAT + DOOR + "Portrait 2:3 (the door fills the height; transparent on either side of it).") for v in "ab"],
}
