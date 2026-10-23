# Round 110 (user 2026-10-23: a monster is dozens of decisions - what is on its face, what teeth and how the mouth opens, where it stops
# being human and what is still human, where its weak point is and why, whether it holds a weapon, looks like one or is one, its surface,
# its blood, how it moves - each one chosen; Alien chose every one): the five chess-garden monsters with every one of those decided, each
# tied to episode 1's house (Sweet Home homage: the children's graves dug up in the back garden, the daughter's toys, mourning, the oven
# the daughter died in, the garden itself). The brief sent says only what to draw (HEAD_BRIEF: no history, no reasons).
MODE = "brief"
R = "art/raw/r110/"
REFS = ["art/ref/monster_ref.webp", "public/jiggle/pink_fire.png"]
HOW = """A monster sprite for a game: one standing frame, the whole monster, transparent background, nothing else in the picture (no ground, no shadow, no text).
Style: as reference image 1 and reference image 2 - the same anime line art and clean colouring - drawn simple: big flat areas of colour, a few large clear shapes, a clean outline readable from far away, few small details, no texture or noise. No effects (no glow, smoke, sparks, particles, light). No gems, no purple. Not a woman's body. Nothing besides what is described.

"""
DESIGNS = {
    "pawn": """A group of four chess-pawn monsters huddled close together, a low, wide outline.
Each is a small white marble chess pawn that is a gravestone, weathered, chipped, clods of wet black earth stuck to it.
No face. Its round top is cracked open like an eggshell; in the crack sits a small lump of raw red flesh.
Its base is split across horizontally into a wide mouth full of crooked, gappy, too-small baby teeth with dirt between them.
From under the base reach many long thin pale things, half tree roots, half little fingers, dragging it over the ground; a few of the fingertips still have chipped pale pink nail polish.
Blood: thick, black-red, like wet earth.
Colours: white marble, black earth, off-white teeth, pale pink, dark red.""",
    "knight": """A chess-knight monster, a long, tall outline.
A white marble chess knight's horse head mounted on two curved rocking-horse rockers, sharpened along their lower edge into long blades; it stands rocked far forward on them.
The horse's neck is split open down its length, and inside runs a human spine - pale vertebrae, wet and red at the edges.
Its mane is long, wet, dark human hair, roughly plaited.
Its muzzle opens in four flaps like an insect's mandibles; inside, huge flat horse molars in rows.
Its eye sockets are empty holes.
Red paint, like a toy's, runs down it from the split neck and drips from the rockers instead of blood.
Colours: white marble, glossy red paint, dark hair, pale bone.""",
    "bishop": """A chess-bishop monster, a tall, thin outline, floating just above the ground.
A tall white marble chess bishop whose top is a huge closed lily bud of marble petals; the bud is half open, its petals peeled back like lips - their inner faces wet dark red and lined with rows of tiny backward-hooked teeth.
From the middle of the flower reaches a long, thin, pale pistil like a tongue, its tip clotted with sticky yellow pollen, dripping.
Below the bishop's collar, instead of a base, hangs a long wet black membrane like a widow's mourning veil, ragged at the hem, trailing.
Two long thin pale arms with too many joints come out from under the membrane, each holding a bunch of white funeral lilies.
Colours: white marble, dark red, pollen yellow, glossy black, lily white.""",
    "rook": """A chess-rook monster, a tall, heavy outline.
A white marble chess rook cracked all over, streaked black with soot; through the cracks shows the brick of an oven inside it.
Its battlements are a chimney crown, blackened.
Its base is pulled in at the middle like a corset-cinched waist, then flares out.
At its foot an arched cast-iron oven door hangs open as its mouth; inside, glowing-red brick and rows of black iron baking racks set like teeth.
It stands on four short cast-iron claw-and-ball feet.
Colours: white marble, soot black, brick orange, deep red, black iron.""",
    "queen": """A chess-queen monster, the tallest, a tall, wide outline.
A huge topiary hedge clipped into the shape of a chess queen, dense dark green leaves; its roots, torn out of the ground, drag behind it.
Its crown is a ring of giant open garden-shear blades, steel, pointing up and out.
Down its front the hedge is parted like curtains, showing the inside: wet, raw red, lined with rose thorns like teeth; deep in the middle, one red rose.
Red roses grow out of it here and there where the hedge is torn, like wounds; red sap runs from them.
Colours: dark green, raw red, rose red, steel grey, brown roots.""",
}
JOBS = {f"R110_{k}": [(f"{R}{k}_{v}.png", REFS, HOW + d) for v in "ab"] for k, d in DESIGNS.items()}
