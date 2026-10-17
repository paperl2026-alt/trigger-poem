# Round 30: cover (barricade) art made for the job (docs/DESIGN.md「战斗」掩体, ART「掩体」). The first covers were reused props seen from above
# (a shoe rack, a bench): with the heroine behind them she looked as if she stood inside the furniture. These are drawn for it: the side
# that faces the player, straight on, at the height of its top edge, flat top, chunky, no gaps. In the game each one is nearer to the camera
# than the heroine and cut off by the bottom of the screen. Eight different objects at once; the best four go into the corridor.
REF = "art/ref/corridor_concept.png"
RULES = (
    "Reference image 1 shows the painting style of this game (detailed anime background painting, warm sunset light); copy ONLY its style, "
    "colours and light, nothing of its content. "
    "Draw ONE single game asset: a foreground BARRICADE that an anime girl crouches behind in a third-person cover shooter. The player sees it "
    "from directly behind the girl. ALL of these rules are mandatory, do not break any of them: "
    "(1) VIEW: a perfectly straight-on front view, camera at the height of the object's top edge. The top surface must NOT be visible at all, "
    "no view from above, no three-quarter angle, no perspective convergence; the top edge is a horizontal line. "
    "(2) SHAPE: wide and chunky, about twice as wide as it is tall, one solid mass with NO holes, gaps, legs or openings you could see through; "
    "a mostly flat, horizontal top edge (small bumps are fine); a flat straight bottom edge. "
    "(3) FRAMING: the object fills the picture from the left edge to the right edge, its bottom edge sits on the bottom edge of the picture; "
    "a 3:2 landscape picture with a little empty space only above it. "
    "(4) BACKGROUND: fully transparent. Nothing else at all: no floor, no cast shadow, no wall, no other objects, no people, no monsters, no "
    "text, no letters, no numbers, no logos. "
    "(5) STORY: it stands in a Japanese high school that a weird evil energy has just hit: a little battered and scuffed, with at most one "
    "small smear of glowing violet goo or one thin pink crack; the object itself must stay instantly readable. "
    "(6) LOOK: a clean dark ink outline around the whole object, soft painted shading, warm sunset light from the upper left. "
    "THE OBJECT: "
)
OBJ = {
    "desks": "three wooden-and-steel classroom desks tipped over onto their sides and pushed together side by side into one wall, their wooden "
             "desktops facing the viewer, steel frames visible only at the outer ends.",
    "lockers": "a grey steel two-door student locker unit knocked over onto its long side, lying horizontally, its plain back panel facing the "
               "viewer, dented, with a few name stickers.",
    "shoebox": "a long wooden school shoe cabinet (getabako) lying on its side horizontally, its solid plank back panel facing the viewer, "
               "with metal corner brackets.",
    "cart": "a school cleaning cart seen exactly from the side, its low body hidden behind a heavy grey canvas cover hanging to the floor, a "
            "bucket, a mop and a broom sticking up a little above the top.",
    "vault": "a wooden gym vaulting box (tobibako) with five stacked tiers seen exactly from the long side, the white padded leather top, two "
             "hand-hold slots painted shut.",
    "mats": "a stack of three thick blue gym mats folded in half and piled flat on top of each other, tied with a white strap, seen from the "
            "long side.",
    "bookcase": "a tall wooden classroom bookcase knocked over onto its side, lying horizontally, its plain solid wooden back panel facing the "
                "viewer, a few books spilling out over the top edge.",
    "lectern": "the teacher's big wooden lectern desk (kyotaku) turned over onto its side, its solid front modesty panel facing the viewer, a "
               "chalk box and an attendance book wedged on top.",
}
JOBS = {
    "R30_cov1": [(f"art/raw/r30/{k}.png", [REF], RULES + OBJ[k]) for k in ["desks", "lockers", "shoebox", "cart"]],
    "R30_cov2": [(f"art/raw/r30/{k}.png", [REF], RULES + OBJ[k]) for k in ["vault", "mats", "bookcase", "lectern"]],
}
