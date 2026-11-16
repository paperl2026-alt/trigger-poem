# Round 123: six prologue enemies with one thing wrong each, pushed all the way, and no care for whether it could live or stand.
# User: think about how to combine; do not chase plausibility; a monster does not need feet that are feet and a head that is a head.
# Up to R122 every part kept doing its own job (shoes on feet, eyes looking, legs walking, a mouth in a face) and only the kind of body
# was swapped (person, spider, jellyfish, snail...): a part doing its own job is what makes a mascot or an animal. What is combined here:
# which part x what job it does x how it is wrong. One main wrongness per enemy; no two enemies share one; the same part-in-a-job pair
# is not used twice ("a shoe on a foot that walks" at most once in the roster):
#   clock  cut loose     its empty shoes walk on the floor, the clock floats above them on two braids like a balloon
#   board  off the page  the chalk drawing climbs out: hollow chalk-outline arms carry the board
#   ext    wrong size    the discharge horn is as big as a doorway, the lips tiny deep inside it, the extinguishers small behind
#   drip   upside down   the whole drip stand hangs inverted in the air and everything on it falls upward
#   desk   wrong job     it stands and walks on its tongue; its legs dangle in their shoes and never touch the floor
#   chair  stacked       eight chairs piled into one tower, every one a mouth with a tongue hanging out
# (the book stays the R120 moth for now.)
MODE = "brief"
R = "art/raw/r123/"
BASE = "public/content/base/assets/enemy/"
EP0 = "public/content/base/levels/ep0/assets/enemy/"
HOW = """An enemy sprite for an anime horror shooting game: one frame, the whole creature, transparent background, nothing else in the picture (no ground, no shadow, no text, no effects).
The reference image is this enemy drawn as a small round mascot on a girl's legs: take its parts and its drawing style (line, colouring, shading) from it, and rebuild it as described below.
It is not shaped like a person or like an animal, and there are no woman's legs or body anywhere in it. It makes no anatomical or physical sense, and that is intended: draw it exactly as described and do not make it more sensible. It is big - as tall as a grown person; the girl things on it are small against it.

"""
END = "\nNothing of it may be cut off by the picture's edge. No purple."
DESIGNS = {
    "clock": (EP0 + "clock_idle.webp", """The enemy: a wall clock that floats like a balloon, walked along by its own empty shoes. Seen from the front. Tall: about twice as tall as it is wide.
- at the bottom, on the floor: the two red heeled shoes with the white frilled socks from the reference, a step apart as if walking. They are empty - there are no legs in them.
- out of each shoe, where the leg would be, rises one long dark brown braid with a red bow, pulled taut like a balloon string, up to the clock.
- at the top, floating: the round clock from the reference - the pale dial with a red lashed eye at each hour, the gold rim, a red bow on top. The two clock hands that are thin pale arms with red nails reach out of the dial; one holds the bundle of gold and red blade-like clock hands. The brass pendulum hangs under the clock between the two braids.
- nothing else joins the clock to the shoes: between them there is only air and the two braids."""),
    "board": (BASE + "board_idle.webp", """The enemy: a blackboard whose chalk drawing is climbing out of it. Seen from the front. It has no legs.
- the blackboard from the reference in its wooden frame, wide, hanging in the air above the floor, tipped a little forward. A red bow on each top corner, the map-printed curtains hanging from the top corners down both sides. Along the bottom edge the chalk tray with the pink and white chalk pieces and the black eraser.
- drawn on the board in white chalk, large: the face from the reference - bobbed hair, half-closed red eyes, red lips.
- the drawing does not stay on the board. Two long arms drawn in the same white chalk line come out of the board, over the bottom of the frame, and reach down to the floor, where their hands are planted: they carry the board, the way someone climbs out of a window. Outside the board they are still only a drawing - white chalk outlines standing in the air, hollow, nothing inside the lines, one sees through them. Chalk dust falls from them. One drawn hand holds a real piece of pink chalk.
- strands of the chalk-drawn hair spill out over the frame as loose white lines too.
- leave out the reference's wooden arm, compass and legs.
About as tall as it is wide."""),
    "ext": (EP0 + "ext_idle.webp", """The enemy: a fire extinguisher whose discharge horn has grown enormous. Three-quarter view from the front. It hangs in the air; it has no legs and no arms.
- the horn: one black funnel-shaped discharge horn as big as a doorway, its wide mouth turned toward us, its rim cut into big jagged teeth. It is by far the biggest thing in the picture, about two thirds of it.
- deep inside the horn, small and far back in the dark where the hose opens: the pink lips from the reference, pursed.
- behind the horn's narrow end, small against it: the bundle of red extinguishers from the reference with their brass valves, gauges and red levers, bound with black belts and a chain; on it the round red alarm bell with the small pink heart; round the bundle's bottom the white and black frill.
- from the bundle two black hoses trail behind, turning into long dark brown curled hair tied with a big pink bow each."""),
    "drip": (EP0 + "drip_idle.webp", """The enemy: an IV drip stand that hangs upside down in the air; for it, up is down. Seen from the front. Tall and narrow: about twice as tall as it is wide. No legs, no arms, no hands.
- at the top of the picture the stand's base, upside down, its five black caster wheels in the air like a crown.
- from the base the metal pole runs straight down; at its lower end the crossbar with the two curled hooks.
- from one hook the glass bottle from the reference hangs upward: it rises from the hook into the air beside the pole, as if it were falling toward the sky. It is half full of pink fluid with the pink face inside it - one big lashed eye open, the other closed - and has the nurse cap with the red cross, the red striped ribbons and the white frilled collar.
- everything loose on it falls upward as well: long thin pale pink tubes stream up from the bottle like hair, with red bows; the small drip chamber with the heart charm hangs upward from the other hook; a few round drops of pink fluid rise from the bottle; one tube ends in the red connector from the reference.
- it touches nothing: below the hooks there is only air."""),
    "desk": (BASE + "desk_walk0.webp", """The enemy: school desks that stand and walk on their tongue. Three-quarter view from the front. About one and a half times as tall as it is wide.
- up in the air: the heap of desks and the chair from the reference. The front desk's lid is lifted as the upper jaw, both jaws full of the pointed teeth; in the drawers below, one red lashed eye each.
- out of the open jaws comes one enormous thick red tongue, longer than the whole heap of desks. It goes down to the floor, where its end lies flat like a foot. The whole creature is balanced on this tongue alone.
- the metal desk legs do not reach the floor: they hang in the air under the desks, each in a white frilled sock and a black strap shoe with a red bow, toes pointed, dangling.
- trimmings from the reference: the long black wavy hair spilling out between the desks with red bows, the sailor collar and red scarf under the jaw, the grey pleated skirt round the underside of the heap."""),
    "chair": (EP0 + "chair_walk0.webp", """The enemy: school chairs stacked into one tall swaying tower of mouths. Seen from the front. Tall: about two and a half times as tall as it is wide, leaning a little in a slight S-curve.
- eight chairs from the reference stacked one on top of the other. Every chair is a mouth facing us: its seat and its back are two jaws lined with brass tacks for teeth, open, and out of every one hangs a long red tongue - eight tongues down the front of the tower.
- only the top chair has the red eye from the reference, looking out between its slats; a red bow on top; the two long dark brown braids with red bows hang down both sides of the tower; the sailor collar and red scarf under the top chair's jaw.
- all the way up, the chrome tube legs of the chairs stick straight out to the left and right like the bristles of a brush, each ending in a white frilled sock and a black strap shoe with a red bow, in the air.
- the tower stands on the four shoes of the bottom chair alone."""),
}
JOBS = {f"R123_{k}": [(f"{R}{k}_{v}.png", [ref], HOW + d + END) for v in "ab"] for k, (ref, d) in DESIGNS.items()}
