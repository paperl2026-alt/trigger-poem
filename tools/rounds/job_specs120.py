# Round 120: the other six prologue enemies rebuilt with the monster's own body (user chose R119 "own": the object's own anatomy is head,
# trunk and legs; girl things are only trimmings). The three that stand (blackboard, extinguisher, drip stand) get the boss's measured
# build like the clock; here the trunk runs through part 5 (the R119 clocks came out with a short case and legs of 44-47%). The two that
# crawl (desk spider, chair centipede) and the one that flies (book moth) get an animal's build instead - low and wide, many long legs,
# small shoes - since their body was the furniture already and what made them mascots was the round ball on short legs in giant shoes.
MODE = "brief"
R = "art/raw/r120/"
BOSS = "public/content/base/levels/ep0/assets/boss/qq_s1_idle0.webp"
BASE = "public/content/base/assets/enemy/"
EP0 = "public/content/base/levels/ep0/assets/enemy/"
END = "\nNothing of it may be cut off by the picture's edge. No purple."
UP = """An enemy sprite for an anime horror shooting game: one standing frame, the whole figure seen from the front, transparent background, nothing else in the picture (no ground, no shadow, no text, no effects).
Two reference images. The first is this enemy drawn as a two-heads-tall mascot: take its parts and its drawing style (line, colouring, shading) from it. The second is only for the build of the figure: take nothing else from it - not its tentacles, eyes, hair, uniform, colours or pose.
Build, as measured on the second reference. Divide the whole height into eight equal parts from top to bottom:
- parts 1 and 2 (the top quarter): the head;
- parts 3, 4 and 5: the trunk, with shoulders, and arms that hang down to part 5;
- parts 6, 7 and 8: what it stands on.
- as a whole it is broad: with hair and arms about two thirds as wide as it is tall, widest in the middle - not a ball on two sticks.
Measure this on the result and draw again if it is off.

"""
LOW = """An enemy sprite for an anime horror shooting game: one frame, the whole creature, transparent background, nothing else in the picture (no ground, no shadow, no text, no effects).
The reference image is this enemy drawn as a small round mascot: take its parts and its drawing style (line, colouring, shading) from it, and rebuild it as described below.

"""
DESIGNS = {
    "board": (BASE + "board_idle.webp", UP, """The enemy: a tall standing blackboard that walks. Its body is the blackboard; there is no woman's body anywhere in it.
- head: a wooden-framed blackboard panel with the face from the first reference drawn on it in white chalk - bobbed hair, half-closed red eyes, red lips. A red bow on each top corner.
- trunk: a second, wider wooden-framed blackboard panel directly under the first, joined to it; bare dark board with wiped chalk smears. Along its bottom edge the chalk tray from the first reference with the pink and white chalk pieces and the black eraser; a short dark lace frill hangs under the tray.
- from the trunk's two top corners hang the map-printed curtains from the first reference, down both sides, each tied with a red bow.
- arms: from one top corner of the trunk the jointed wooden arm from the first reference - its forearm is a wooden set square, its wooden hand has red nails and holds one finger to the chalk lips; from the other corner the big wooden blackboard compass with red tips, hanging down.
- it stands on the blackboard stand's own two thick wooden legs, set apart, each wearing a red high-heeled shoe with an ankle bow; the shoes big and heavy, about one part long."""),
    "ext": (EP0 + "ext_idle.webp", UP, """The enemy: a fire extinguisher that walks. Its body is the extinguisher; there is no woman's body anywhere in it.
- head: a tight cluster of brass extinguisher valve heads with their round pressure gauges, their red lever handles fanning out upward like a crest.
- from the head, down both sides: thick black hoses that turn into long dark brown curled hair toward the ends, each tied with a big pink bow, as in the first reference.
- trunk: one big red extinguisher cylinder with its worn label; two smaller extinguishers strapped to its sides with black belts and a chain; on its chest the round red alarm bell with the small pink heart.
- arms: a black hose from each shoulder; one ends in the pink lips from the first reference, the other in a black discharge horn.
- round the bottom of the trunk the white and black frilled skirt from the first reference.
- it stands on two smaller red extinguisher cylinders as legs, set apart, each with the white ruffled leg warmer at its lower end and a big heavy black strap shoe with a red bow, about one part long."""),
    "drip": (EP0 + "drip_idle.webp", UP, """The enemy: an IV drip stand that has come alive. Its body is the stand, the bottle and the bag; there is no woman's body anywhere in it, and it has no legs.
- head: the upside-down glass bottle from the first reference, half full of pink fluid, with the pink face inside it - one big lashed eye open, the other closed - the nurse cap with the red cross on top, red striped ribbons at both sides.
- from the head, down both sides as far as part 6: long pale pink hair made of thin tubes, with red bows.
- trunk: the stand's metal pole runs down through the middle of the whole figure like a spine. At shoulder height its crossbar with the two curled hooks. Hanging on the pole between the hooks, one large clear IV bag full of pink fluid is the body; it wears the white frilled collar and the white frilled apron from the first reference. From one hook hangs the small drip chamber with red fluid and the heart charm.
- arms: a thin tube of pink fluid from each shoulder, each ending in a small white-gloved hand with a red bow at the wrist; one hand held up to the mouth.
- from the bottom of the bag hangs the long pink tube from the first reference, looping, with the red bow and the red connector at its end.
- it stands on the pole, which goes on down to the stand's own base with five black caster wheels; the base is wide, about as wide as the trunk."""),
    "desk": (BASE + "desk_walk0.webp", LOW, """The enemy: a spider made of school desks, in three-quarter view from the front like the reference. Its body is the furniture; there is no woman's body anywhere in it.
Low and wide: with its legs about one and a half times as wide as it is tall.
- head: the front desk from the reference - its lid lifted as the upper jaw, both jaws full of the pointed teeth, the long red ribbon tongue, the drawers below with one red lashed eye in each. About a third of the body's length.
- body: behind the head a bigger heap of two more desks and the chair jammed together, hanging low between the legs.
- legs: eight long metal desk legs, four a side, each with one bend; the bends rise higher than the top of the body and the feet are planted wide apart, like a spider's. Each foot wears a white frilled sock and a black strap shoe with a red bow; a shoe is small against the body - about as long as one drawer front is wide.
- trimmings from the reference: the long black wavy hair spilling out between the desks with red bows, the sailor collar and red scarf under the jaw, the grey pleated skirt round the underside of the body."""),
    "chair": (EP0 + "chair_walk0.webp", LOW, """The enemy: a centipede made of school chairs, in three-quarter view like the reference. Its body is the furniture; there is no woman's body anywhere in it.
Long and low: about two and a half times as long as it is tall, the body in a slight S-curve, the head at the right and raised higher than the rest.
- head: the front chair from the reference - its seat and back as two jaws lined with brass tacks for teeth, the long red tongue, one red eye looking out between the slats. A red bow on top; two long dark brown braids with red bows hang from it; the sailor collar and red scarf under the jaw.
- body: seven more chairs in a row behind it, joined seat to seat, a little smaller toward the tail; a black scaly underbelly; a red bow on some of the chair backs.
- legs: every chair has its pair of chrome tube legs, splayed out to the sides with one bend like a centipede's, so that many legs run along both sides. Each foot wears a white frilled sock and a black strap shoe with a red bow; a shoe is small against the body - about half as long as a chair seat is wide."""),
    "book": (EP0 + "book_idle.webp", LOW, """The enemy: a moth made of a schoolbook, in flight, seen from the front. Its body is the book; there is no woman's body anywhere in it.
Wider than tall: about one and a half times as wide as it is tall.
- wings: the open book from the reference - its two halves spread wide, the hard brown covers behind, the yellowed pages fanned out, one big red ring eyespot on each wing.
- thorax, in the middle between the wings: the book's brown leather spine with the red lips from the reference.
- on top of the thorax two red bows, and from them two long red ribbon bookmarks curling up and outward as the antennae; more red ribbon trails behind, as in the reference.
- abdomen: under the thorax, where the mascot has a girl's legs, a long fat abdomen instead, made of rings of ruffled yellowed paper like the reference's paper skirt, tapering to a point. Thorax and abdomen together are about three quarters of the whole height.
- legs: one pair of thin jointed legs of twisted paper hanging under the thorax, each foot in a white frilled sock and a small black strap shoe with a red bow.
- no loose pages flying apart from it."""),
}
JOBS = {f"R120_{k}": [(f"{R}{k}_{v}.png", [ref, BOSS] if how is UP else [ref], how + d + END) for v in "ab"]
        for k, (ref, how, d) in DESIGNS.items()}
