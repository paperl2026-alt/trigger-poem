# Round 24: the prologue's battle stations as painted 2.5D plates (docs/DESIGN.md, route classroom -> corridor -> schoolyard).
# One painting per station, seen from where the two heroines crouch: a low camera, a near cover object at the bottom-left (1P) and
# one at the bottom-right (2P), the floor open in the middle for the monsters to come at them. Style: the user's corridor concept.
# Step 1 (R24_*): the composition with its covers. Step 2 (R24x_*, written by tools/r24_jobs.py once step 1 exists): Codex
# separates the empty plate and each cover, exactly as for the corridor test (R22).
REF = "art/ref/corridor_concept.png"
STYLE = ("Reference image 1 is the approved concept art of this game (look only at its painting style, its warm sunset light, its colours, its "
         "camera height and the way the floor folds; ignore the characters and monsters in it). Paint a NEW background in exactly that style: a "
         "detailed anime background painting, 16:9, wide-angle perspective from a low camera (about the eye height of a crouching person), strong depth "
         "down the middle. In the near foreground at the bottom-left corner stands one sturdy cover object and at the bottom-right corner another one, "
         "both big and close to the camera, cut off by the frame edges, so two people could hide behind them; the middle of the floor between them is "
         "open and leads into the distance. No people, no monsters, no text, no letters, no numbers anywhere. ")
INVADED = ("The school has been hit by an unknown evil energy: dark purple-and-violet eye sigils (a single stylised eye inside a jagged diamond) "
           "are smeared on the walls, the light is a wrong pink-violet mixed with the sunset, small objects float in the air, thin glowing pink cracks "
           "run along the walls and floor, the floor boards fold up into sharp ridges here and there like in reference image 1. ")
JOBS = {
    "R24_cls1": [("art/raw/r24/cls1_calm.png", [REF], STYLE +
        "Place: an ordinary Japanese high-school classroom just before the end of the day, calm and peaceful, warm sunset light through the big windows on "
        "the left, seen from the back of the room toward the blackboard and the front door; neat rows of wooden desks and chairs, school bags hanging "
        "on desks, a clock above the blackboard, curtains. Near-left cover: two desks pushed together and tipped on their side, tops toward the camera. "
        "Near-right cover: a tall grey steel cleaning-tool locker lying on its side. Nothing abnormal at all.", "OPAQUE")],
    "R24_cls2": [("art/raw/r24/cls2.png", [REF], STYLE + INVADED +
        "Place: the same Japanese high-school classroom, now seen from the front, from beside the blackboard and the teacher's podium, looking toward the "
        "back of the room and its open back door to the corridor; desks and chairs pushed around and overturned, papers everywhere, windows on the right. "
        "Near-left cover: the wooden teacher's podium. Near-right cover: three desks stacked and toppled together.", "OPAQUE")],
    "R24_cor2": [("art/raw/r24/cor2.png", [REF], STYLE + INVADED +
        "Place: the far end of the school corridor where it opens into the school entrance hall with rows of wooden shoe lockers; at the back, the glass "
        "entrance doors glow with the pink-violet light of the schoolyard outside; notice boards and posters on the walls. Near-left cover: a red drinks "
        "vending machine tipped over on its side. Near-right cover: a big wooden notice board that has fallen over, propped at an angle.", "OPAQUE")],
    "R24_yard": [("art/raw/r24/yard.png", [REF], STYLE + INVADED +
        "Place: the school's sports ground at sunset, seen from the near edge of the ground: a red running track and a dirt field lead straight to the "
        "big four-storey school building that fills the whole back of the picture, with its clock on the front; the sky above the building is a huge "
        "violet-pink anomaly sky with a dark swirl. The upper half of the picture above the building's roof is mostly empty sky (something enormous "
        "will rise from behind the building there). Near-left cover: a wooden vaulting box with a white padded top. Near-right cover: a small wheeled "
        "metal cart for drawing white lines, with a sandbag on it.", "OPAQUE")],
}
# the invaded state of the first classroom station: the same painting, invaded
JOBS["R24_cls1i"] = [("art/raw/r24/cls1_inv.png", ["art/raw/r24/cls1_calm.png", REF],
    "Reference image 1 is an approved background painting. This is NOT a redesign task. Output the SAME painting, same size, same camera, same "
    "composition, every desk, wall, window and both cover objects exactly where they are, but the moment after the school has been hit by an unknown evil "
    "energy, in the style of reference image 2: " + INVADED + "A few chairs and school bags hover in the air. No people, no monsters, no text.", "OPAQUE")]
