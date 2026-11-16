# Round 122: four prologue enemies again, each with a body plan nobody else in the roster has. R120 / R121 gave four of the seven the same
# answer - an object on many thin jointed legs in little shoes (desk, chair, clock, blackboard) - user: too much repetition, spider legs
# everywhere; a designer that only shuffles two or three possibilities ruins the game. tools/rounds/monster_pool.txt (481 harvested lines)
# was not opened for those rounds. Here each plan comes from what the object itself does, what the enemy does in the game, and a line of
# the pool; the column "holds itself up / moves" must differ in every row:
#   desk    spider      eight arched desk legs                    (its name; walks, hops, charges)                      R120, kept
#   chair   centipede   a long train of chairs, two rows of legs  (its name; zigzags)                                   R120, kept
#   book    moth        wings: the open book                      (its name; flies, dives)                              R120, kept
#   clock   snail       one fleshy foot, the dial is the shell    (hides = draws into the shell, rises = rears up)      pool: Wiwaxia's one slug-like foot
#   board   ray         a flat slab on rippling curtain fins      (hides = lies flat, rises = rears up; a ray's underside is a face)   pool: Nurikabe, Anomalocaris side flaps
#   ext     puffer      one swollen cylinder held up by pressure  (windup = swells, the gauge needle in the red, then blasts)          pool: exploding ant, Opabinia's hose trunk
#   drip    tadpole     swims by one whipping tail                (channel = sticks its needle into the boss)           pool: anglerfish, syringe mouthparts
MODE = "brief"
R = "art/raw/r122/"
BASE = "public/content/base/assets/enemy/"
EP0 = "public/content/base/levels/ep0/assets/enemy/"
HOW = """An enemy sprite for an anime horror shooting game: one frame, the whole creature, transparent background, nothing else in the picture (no ground, no shadow, no text, no effects).
The reference image is this enemy drawn as a small round mascot on a girl's legs: take its parts and its drawing style (line, colouring, shading) from it, and rebuild it as described below.
It is not shaped like a person: no head on shoulders, no trunk, no woman's legs or body anywhere in it. The object itself is the whole creature, and it is big - as tall as a grown person. The girl things on it are small against it and few.

"""
END = "\nNothing of it may be cut off by the picture's edge. No purple."
DESIGNS = {
    "clock": (EP0 + "clock_idle.webp", """The enemy: a wall clock that is the shell of a snail. Three-quarter view from the front. It has no legs and no feet.
- shell: the round clock from the reference, carried upright like a snail's shell with the dial facing us - the pale dial with a red lashed eye at each hour, the gold rim. It is about two thirds of the creature's height.
- body: one thick pale fleshy foot like a slug's, the same pale flesh as the clock hands in the reference. It comes out from under the rim, lies along the floor and rears up at the front; its front end is blunt, with no face - the dial is the face. Round the edge of the foot runs the black and white frill from the reference, like the ruffled edge of a snail's foot.
- from the centre of the dial the two clock hands that are thin pale arms with red nails reach far out of it; one holds the bundle of gold and red blade-like clock hands from the reference.
- behind, the brass pendulum on its rod drags along the floor from under the shell like a tail.
- trimmings from the reference: one red bow on top of the rim, some long dark brown curled hair with red bows hanging from behind the shell.
About as wide as it is tall."""),
    "board": (BASE + "board_idle.webp", """The enemy: a blackboard that glides like a ray, the flat fish, reared upright to show its underside. Seen from the front. It has no legs and no feet; it hangs just above the floor.
- body: one wide flat blackboard in its wooden frame, wider than tall. Drawn on it in white chalk, large, the face from the reference - bobbed hair, half-closed red eyes, red lips - the way a ray's underside looks like a face. Along the bottom edge the chalk tray, with the pink and white chalk pieces standing in a row on it like teeth, and the black eraser; under the tray a short dark lace frill.
- fins: the map-printed curtains from the reference grow out of the frame's two side edges as two broad fins, spread wide and rippling. A red bow on each top corner of the frame.
- tail: from the middle of the bottom edge hangs the big wooden blackboard compass from the reference, its two long legs with red tips trailing down like a forked tail.
- from behind the top edge reaches the jointed wooden arm from the reference - its forearm a wooden set square, its wooden hand with red nails holding one finger to the chalk lips.
With its fins about one and a half times as wide as it is tall."""),
    "ext": (EP0 + "ext_idle.webp", """The enemy: one huge fire extinguisher swollen like a puffer fish, hanging in the air. Seen from the front. It has no legs and no arms.
- body: a single red extinguisher cylinder blown up almost into a ball, bulging out between the black belts and the chain strapped round it, its worn label stretched. On its front the round red alarm bell with the small pink heart.
- on top: its brass valve head with one large round pressure gauge, the needle far in the red, and its red lever handle; round it, like a ruff, the tops of the smaller extinguishers from the reference with their red levers fanning out as a crest.
- trunk: one thick black hose from the valve head, as long as the body is tall, curling forward and ending in the pink lips from the reference.
- at each side one short black hose that turns into a long dark brown curled tail of hair tied with a big pink bow, as in the reference.
- round its underside the short white and black frill from the reference.
About as wide as it is tall."""),
    "drip": (EP0 + "drip_idle.webp", """The enemy: a glass drip bottle that swims through the air like a tadpole. Three-quarter view from the front. It has no legs, no arms and no hands, and it does not stand on anything.
- head: the upside-down glass bottle from the reference, half full of pink fluid, with the pink face inside it - one big lashed eye open, the other closed. The nurse cap with the red cross sits on its upturned bottom, red striped ribbons at both sides; the white frilled collar round its neck.
- tail: out of the bottle's mouth the pink fluid comes as one long thick tail, twice as long as the bottle, whipping in an S-curve and tapering to a point, a red bow near the tip.
- lure: from the top of the bottle rises a curved piece of the metal IV stand with its curled hook, arching forward over the face like an anglerfish's rod; from the hook dangles the small drip chamber with red fluid and the heart charm.
- needle: beside the tail a long thin pale pink tube comes out of the bottle's mouth, loops forward and ends in the red connector from the reference with a red bow, pointing ahead like a sting.
- a few thin pale pink tubes hang from the sides of the bottle like hair.
About twice as tall as it is wide."""),
}
JOBS = {f"R122_{k}": [(f"{R}{k}_{v}.png", [ref], HOW + d + END) for v in "ab"] for k, (ref, d) in DESIGNS.items()}
