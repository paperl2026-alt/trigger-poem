# Round 114 (user 2026-10-23: random piling is just more parts and parts in the wrong place - search how real monsters are made): what
# the designers actually did (Silent Hill's creatures, the Xenomorph, Evil Within 2's Lament, Madoka's witches - LOG 2026-10-23) is one
# body and a few hard treatments of it: the face hidden or removed; the body sealed, caged or bound; cut, joined or overlapped; an opening
# it already has turned into the mouth; the attack grows out of the treatment and the weak point is where the treatment gives way; each
# life stage a different body; motion out of step with everything else. Here the body is the chess statue itself (sealed = statue,
# unsealed = the next stage); each of the five gets different treatments, a different attack and weak point. No reference images
# (R113: they carried bows, lace and tassels in); the style in words.
MODE = "brief"
R = "art/raw/r114/"
HOW = """A monster sprite for a game: one standing frame, the whole monster, transparent background, nothing else in the picture (no ground, no shadow, no text).
Style: anime game art - a clean dark outline, flat cel colouring with one shadow tone, bright clear colours, big simple shapes, few small details, no texture or noise. No effects (no glow, smoke, sparks, particles, light). No eyes, no gems, no purple. Not a woman's body. Nothing besides what is described.

"""
DESIGNS = {
    "pawn": """A monster made from a white marble chess pawn statue, as tall as a person.
The whole pawn, from the top of its round head down to its base, is split down the middle into two halves, held a hand's width apart by strands of wet red flesh.
Both cut faces are lined edge to edge with rows of small baby teeth; between the halves is glossy pink-red wet flesh. The edges of the split are swollen and soft, like lips.
It stands tilted on the rim of its base. Bright pink blood runs down from the split and drips off the base.
No face anywhere.
Colours: white marble, bright pink, deep red, off-white teeth.""",
    "knight": """A monster made from a black marble chess knight statue (a horse's head and neck on a round base).
The horse head has no face: its front is smooth and blank - no eyes, no nostrils, no mouth.
The whole head and neck are bound tight in strips of white cloth wound round and round; along the line where a mouth would be, the cloth is soaked dark red, and a few loose ends of cloth hang down.
Instead of a base it stands high on six long, thin, pale human arms with too many joints, palms flat on the ground like feet.
A tall outline.
Colours: black marble, white cloth, dark red, pale skin.""",
    "bishop": """A monster made from a tall white marble chess bishop statue.
The slanted cut in its mitre has split open into a tall vertical mouth with swollen red lips, lined with rows of sharp teeth. Out of it hangs a long red tongue, and at the tongue's tip is a second, small mouth full of teeth.
Below the collar its body is turned inside out: wet red muscle and pale ribs on the outside, a few chips of white marble still stuck to it.
It has no legs: its bottom is one wide, soft, pink sucker foot spread on the ground.
Red blood drips from the lips and from the tongue. A tall, thin outline.
Colours: white marble, red, pink, bone.""",
    "rook": """A monster made from a black marble chess rook (a castle tower).
Its walls are gone: the tower is a cage of thick black iron bars, with the black marble crown of battlements on top and the black marble base below.
The battlements point inward and are teeth, a ring of them around a dark hole at the top.
Inside, filling the cage, a pale curled-up mass of soft skin pressed against the bars, bulging out between them. Long black hair pours out between the bars and hangs to the ground.
Black-red blood smears the bars. A tall, heavy outline.
Colours: black marble, black iron, pale skin, black hair, dark red.""",
    "queen": """A monster made from the tallest white marble chess queen statue.
Its crown is a ring of long pale fingers pointing up, spread open like petals, showing a round throat that goes straight down, lined all the way down with rings of backward-pointing teeth.
The narrow neck of the piece is long and soft, like a throat.
Its flared base is swollen into a huge translucent milky sac; inside it, small curled white pawn-shaped young press against the skin.
It does not stand on a base: the sac is carried on rows of short soft tube feet underneath, like a sea cucumber's.
Milky fluid and red blood leak from the bottom of the sac. A tall, wide outline.
Colours: white marble, milky white, pale pink, red, bone.""",
}
# for the battle work (not drawn): each attack grows out of the body's treatment, each weak point is where it gives way
GAME = {
    "pawn": "statue: a closed pawn. Slides tilted on its rim, stops dead, then splits open with a jerk. Close: the halves clap shut on you. Far: spits a spread of baby teeth. Weak point: the wet flesh inside, only while open.",
    "knight": "statue: the knight on its base; the arms unfold from under it. Walks on the arms fast and smooth while the head stays perfectly still. Attack: the cloth strips unwind and lash at the screen. Weak point: the blood-soaked mouth line where the cloth slips.",
    "bishop": "statue: the notch closed. Glides on its sucker foot without any other part moving. Attack: the tongue shoots out and the small mouth bites. Weak point: the small mouth at the tongue's tip, while the tongue is out.",
    "rook": "statue: marble walls that crack and fall away to the bars. Does not walk: turns in place and slides. Attack: the hair lashes out, grabs a heroine and drags her. The bars stop shots; weak point: the soft mass where it bulges between the bars, and the hole at the top.",
    "queen": "statue: the fingers closed into a crown. Carried rippling on the tube feet. Attack: births the small pawn-young, which crawl at you; the throat pulls in. Weak point: the translucent sac.",
}
JOBS = {f"R114_{k}": [(f"{R}{k}_{v}.png", [], HOW + d) for v in "ab"] for k, d in DESIGNS.items()}
