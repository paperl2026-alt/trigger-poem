# Round 121: the four prologue enemies that stand upright, without a person's shape. R119 / R120 gave the clock, blackboard, extinguisher
# and drip stand a head, a trunk, two arms and two legs: a person made of the object, which is still a person (user: forcing the monsters
# into a human shape is not right). In R120 the desk spider and chair centipede, built like animals, came out as monsters; the two-panel
# blackboard on two legs came out as a toy robot. Here each of the four is one creature of its own, the object itself, built like an
# animal that fits its parts; what shows its size is how small the girl things on it are.
MODE = "brief"
R = "art/raw/r121/"
BASE = "public/content/base/assets/enemy/"
EP0 = "public/content/base/levels/ep0/assets/enemy/"
HOW = """An enemy sprite for an anime horror shooting game: one frame, the whole creature, transparent background, nothing else in the picture (no ground, no shadow, no text, no effects).
The reference image is this enemy drawn as a small round mascot on a girl's legs: take its parts and its drawing style (line, colouring, shading) from it, and rebuild it as described below.
It is not shaped like a person: no head on shoulders, no trunk, no woman's legs or body anywhere in it. The object itself is the whole creature, and it is big - as tall as a grown person. The girl things on it are small against it and few.

"""
END = "\nNothing of it may be cut off by the picture's edge. No purple."
DESIGNS = {
    "clock": (EP0 + "clock_idle.webp", """The enemy: a wall clock that walks like a long-legged spider crab, seen from the front.
- body: the round clock from the reference, upright and facing us like a crab's shell - the pale dial with a red lashed eye at each hour, the gold rim, and on the dial the two clock hands that are thin pale arms with red nails; they reach out of the dial. The dial is about half the creature's height.
- legs: six long thin legs growing from behind the rim, three a side, each made of a gold and red blade-like clock hand from the reference, with one bend; the bends rise higher than the top of the dial and the feet are planted wide apart. Each foot wears a white frilled sock and a red heeled shoe; a shoe is small - about a sixth of the dial's width.
- under the dial the brass pendulum hangs on its rod between the legs.
- trimmings from the reference: one red bow on top of the rim, some long dark brown curled hair with red bows hanging from behind the dial."""),
    "board": (BASE + "board_idle.webp", """The enemy: a blackboard that walks sideways like a crab, seen from the front.
- body: one wide blackboard in its wooden frame, upright and facing us, wider than tall. Drawn on it in white chalk, large, the face from the reference - bobbed hair, half-closed red eyes, red lips. Along the bottom edge the chalk tray, with the pink and white chalk pieces standing in a row on it like teeth, and the black eraser.
- claws: two arms held up at the board's sides like a crab's claws. One is the jointed wooden arm from the reference - its forearm a wooden set square, its wooden hand with red nails; the other is the big wooden blackboard compass with red tips, open like a pincer.
- legs: six thin jointed wooden legs made of rulers and pointer sticks with brass hinges, three a side under the board, bent and planted wide. Each foot wears a red high-heeled shoe with an ankle bow; a shoe is small - about a tenth of the board's width.
- trimmings from the reference: a red bow on each top corner, the map-printed curtains hanging from the top corners down both sides.
With claws and legs it is about one and a half times as wide as it is tall."""),
    "ext": (EP0 + "ext_idle.webp", """The enemy: a bundle of fire extinguishers that hangs in the air like a jellyfish, seen from the front. It has no legs.
- body: five red extinguisher cylinders bound upright into one bundle with black belts and a chain, their worn labels showing; on top the brass valve heads with round pressure gauges and the red lever handles fanning out like a crest; on the front the round red alarm bell with the small pink heart.
- round the bottom of the bundle a short white and black frill, like the reference's skirt.
- tentacles: from under the frill hang eight long black hoses, as long as the bundle is tall, curling. One ends in the pink lips from the reference. Two end in black discharge horns. Two turn into long dark brown curled hair tied with a pink bow each. Two end in a white ruffled leg warmer and a small black strap shoe with a red bow, dangling. One hangs loose.
About one and a half times as tall as it is wide."""),
    "drip": (EP0 + "drip_idle.webp", """The enemy: an IV drip stand that rolls by itself, with a ghost hanging on it. Seen from the front. Tall and narrow: about twice as tall as it is wide.
- the stand: the metal pole from the reference, as tall as the whole picture, on its base with five black caster wheels; at the top the crossbar with two curled hooks.
- the ghost: from one hook hangs the upside-down glass bottle from the reference, half full of pink fluid, with the pink face inside it - one big lashed eye open, the other closed. The bottle is about a third of the whole height. The nurse cap with the red cross sits on its upturned bottom, red striped ribbons at both sides. Round the bottle's neck the white frilled collar and a small white frilled apron.
- out of the bottle's mouth the pink fluid runs down in one long thick drip that does not fall: the ghost's tail, with a red bow on it, ending in a point above the base.
- tubes: several long thin pale pink tubes hang from the bottle and the hooks like hair. Two of them end in a small white-gloved hand with a red bow at the wrist: one holds the pole, the other is raised to the face. One long tube loops down and ends in the red connector with a red bow from the reference.
- from the other hook hangs the small drip chamber with red fluid and the heart charm."""),
}
JOBS = {f"R121_{k}": [(f"{R}{k}_{v}.png", [ref], HOW + d + END) for v in "ab"] for k, (ref, d) in DESIGNS.items()}
