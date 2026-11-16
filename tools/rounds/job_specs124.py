# Round 124: three prologue enemies designed the way the retrieved designers say they work (tools/rounds/monster_methods.txt, D and B4),
# not by combining parts and not by dice:
#   1. first what it does, then the whole form grows into the shape of doing that (Kuuga: "runs fast" -> a sprinter's outline;
#      Siren Head: "what if that sound came from a creature"; Dead Space: how you fight it and how it looks are one thing);
#   2. the object's own parts become the organs - find where the two things already have the same shape and join them there
#      (hishiwo), do not stick legs and eyes onto the object (Kuuga's hermit crab wears its shell as a cloth wound round the head);
#   3. one simple form with a structure, not a heap (Narita Tohl).
# What each one throws is a part of itself:
#   ext    it screams foam            -> tanks = lungs (they swell and crumple), hose = windpipe, horn = the only mouth, no eyes
#   clock  it is wound up and lets go -> it stands on its spring, the bow is its winding key, the braids are its weight chains,
#                                        far too many hands grow from the centre pin and it shoots them
#   board  it spits chalk             -> a three-part folding blackboard = jaws opening sideways, chalk sticks = teeth, eraser = tongue
# No legs on any of the three, and three different ways of holding itself up: hanging in the air, a spring, a rolling stand.
MODE = "brief"
R = "art/raw/r124/"
BASE = "public/content/base/assets/enemy/"
EP0 = "public/content/base/levels/ep0/assets/enemy/"
HOW = """An enemy sprite for an anime horror shooting game: one frame, the whole creature, transparent background, nothing else in the picture (no ground, no shadow, no text, no effects).
The reference image is this enemy drawn as a small round mascot on a girl's legs: take its parts and its drawing style (line, colouring, shading) from it, and rebuild it as described below.
The object itself is the whole creature. It is not shaped like a person or like an animal: no woman's body, legs or arms anywhere, and no animal legs. It is big - taller than a grown person - and it is dangerous, not cute. The girl things on it are few and small against it.
Flat colours in big clear areas and few details: no added ornament, engraving, jewels or patterns.

"""
END = "\nNothing of it may be cut off by the picture's edge. No purple."
DESIGNS = {
    "ext": (EP0 + "ext_idle.webp", """The enemy: fire extinguishers that have grown into a pair of lungs with a windpipe. It hangs in the air and breathes; what it breathes out is foam. Three-quarter view from the front. Taller than wide.
- the two lungs: two huge red extinguisher tanks hanging side by side, by far the biggest things in the picture. They are steel, yet they breathe like lungs: the left one is swollen round and tight like a balloon, the right one is sucked in, dented and creased. Black belts go round them like ribs.
- along one seam of the swollen tank the red steel has split, and wet pink flesh bulges out of the split.
- on top, where the two tanks join: the brass valve block with its red levers and one round pressure gauge, the needle far in the red.
- out of the valve block rises one thick black ribbed hose - the windpipe. It goes up, bends over forward like a swan's neck and ends in the big black discharge horn, a wide funnel turned toward us: this is its only mouth, and it has no eyes and no face anywhere. Inside the horn there is only the dark ribbed throat going down. Thick pink-white froth hangs from the horn's rim in long strings and drips.
- below the tanks there is nothing: no legs, no arms. Only the pull-pins on their rings and a short chain dangle from the tanks' bottoms.
- the girl things, all small: one big pink bow tied round the hose just below the horn; the white frill from the reference as a collar round the valve block; the round red alarm bell with the pink heart hanging on the chain like a pendant; two hanks of long dark brown curled hair hanging down behind the tanks, each tied with a pink bow."""),
    "clock": (EP0 + "clock_idle.webp", """The enemy: a wall clock that stands up on its own wound-up spring and has far too many hands. Three-quarter view from the front. Tall: about twice as tall as it is wide.
- at the bottom, standing on the floor: its spring - one thick band of dark blue steel coiled into a cone-shaped spiral spring, wide at the floor and narrowing upward, four turns, like the spring of a jack-in-the-box. This is all it stands on: no legs, no feet, no shoes, no arms.
- on top of the spring, tipped forward so that it looks down at us: the round clock from the reference - gold rim, pale dial, one red lashed eye at each hour. It is big, a good third of the creature's height.
- the hands: instead of two hands, about thirty of the gold-and-red blade-like clock hands from the reference grow out of the dial's centre pin, of all lengths, pointing in every direction like the spines of a sea urchin, many reaching far out past the rim. The twelve eyes look out between them.
- under the clock hangs the brass pendulum. Left and right of it the two long dark brown braids from the reference hang straight down like the chains of a clock's weights; a brass pine-cone clock weight is tied to the end of each braid with a small red bow.
- stuck in the top of the clock: a big red winding key shaped like a bow - two loops on a short stem. It takes the place of the reference's bow.
- behind the dial the back of the clock is open and a few brass gear wheels show; black oil runs down the spring.
- the white frill from the reference only as one narrow ruffle behind the gold rim."""),
    "board": (BASE + "board_idle.webp", """The enemy: a folding classroom blackboard that is a pair of jaws opening sideways; the chalk is its teeth, and it spits them. Seen from the front. Wider than tall.
- the board: a blackboard in three parts in wooden frames - a wide middle board and two side wings hinged to its left and right edges, like a three-part folding screen. The two wings stand half open, swung toward us, like the two halves of a Venus flytrap.
- the teeth: along the free edge of each wing (the edge away from the hinge), from top to bottom, a row of sticks of chalk stands out like teeth - white ones and pink ones, some snapped short, pointing inward across the gap. Chalk dust trickles from them.
- the middle board, deep between the wings: dark slate; on it the face from the reference drawn large in white chalk - the bobbed hair, the half-closed eyes, the lips in red chalk. It is only a drawing. Part of it has been wiped to a grey smear. Four long white scratch lines run down across the slate.
- the tongue: the black felt eraser from the reference, grown long, lolls out over the chalk tray at the bottom of the middle board.
- it stands on a steel rolling stand: two upright steel tubes with a crossbar, on four small black caster wheels. No legs, no feet, no shoes, no arms, no hands.
- the girl things, all small: a red bow on each top corner of the middle board; the map-printed curtains from the reference hanging from the outer sides of the two wings like sleeves; a short white frill along the bottom of the chalk tray."""),
}
JOBS = {f"R124_{k}_{v}": [(f"{R}{k}_{v}.png", [ref], HOW + d + END)] for k, (ref, d) in DESIGNS.items() for v in "ab"}
