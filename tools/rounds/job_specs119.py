# Round 119: the wall-clock enemy again, with the build measured on the boss instead of "long legs". R118 kept the mascot (an object
# that is head and body in one) and stretched its legs: the object sat straight on the hips with no trunk, the legs took 59% of the
# height (the boss: 46%) and were thin and crossed - a ball on two sticks. Measured on the boss standing frame (and on R116 teacher a /
# R117 student a, which read right): head about the top quarter, trunk with shoulders and arms down to a little past the middle, sturdy
# legs under half the height, big shoes, the whole about two thirds as wide as tall. Only the clock, in two readings of what the trunk is:
# "own" - the clock's own case (the monster's body is the monster); "girl" - a girl's body with the clock for a head (like the boss).
MODE = "brief"
R = "art/raw/r119/"
CLOCK = "public/content/base/levels/ep0/assets/enemy/clock_idle.webp"
BOSS = "public/content/base/levels/ep0/assets/boss/qq_s1_idle0.webp"
HOW = """An enemy sprite for an anime horror shooting game: one standing frame, the whole figure seen from the front, transparent background, nothing else in the picture (no ground, no shadow, no text, no effects).
Two reference images. The first is this enemy drawn as a two-heads-tall mascot: take its parts and its drawing style (line, colouring, shading) from it. The second is only for the build of the figure: take nothing else from it - not its tentacles, eyes, hair, uniform, colours or pose.
Build, as measured on the second reference. Divide the whole height into eight equal parts from top to bottom:
- parts 1 and 2 (the top quarter): the head;
- parts 3, 4 and the top of 5: the trunk, with shoulders, and arms that hang down to part 5;
- the rest, a little under half the height: the legs. Sturdy legs set apart, big heavy shoes about one part long. Not long thin legs, not crossed.
- as a whole it is broad: with hair and arms about two thirds as wide as it is tall, widest in the middle - not a ball on two sticks.
Measure this on the result and draw again if it is off.
No purple.

"""
PARTS = """- head: the round clock dial from the first reference - pale dial, a red eye with lashes at each hour, the two clock hands that are thin pale arms with red nails, the gold rim, the red bow on top.
- the long dark brown curled hair with red bows hangs from behind the dial down both sides.
"""
DESIGNS = {
    "own": """The enemy: a pillar clock that walks. Its body is the clock; there is no woman's body anywhere in it.
""" + PARTS + """- trunk: the clock's own long wooden case under the dial - dark wood, a glass door, the brass pendulum from the first reference hanging inside it. Two thin pale arms like the clock hands come out of the sides of the case; one holds the bundle of gold and red blade-like clock hands from the first reference.
- legs: the case's own two thick carved wooden legs, wearing the white frilled socks and the red heeled shoes from the first reference.
- the black and white frill from the first reference runs round the bottom edge of the case.""",
    "girl": """The enemy: a girl whose head has become a clock. She has no face of her own.
""" + PARTS + """- trunk: her body in the black and white frilled dress from the first reference, now a whole dress with a bodice and sleeves, the brass pendulum hanging from the dial down her chest. One hand holds the bundle of gold and red blade-like clock hands from the first reference.
- legs: dark tights, the white frilled socks and the red heeled shoes from the first reference.
No large chest, no bare thighs.""",
}
JOBS = {f"R119_clock_{k}": [(f"{R}clock_{k}_{v}.png", [CLOCK, BOSS], HOW + d) for v in "ab"] for k, d in DESIGNS.items()}
