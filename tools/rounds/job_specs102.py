# Round 102 (user 2026-10-23: one qualified monster, made properly - GPT is an LLM: tell it the purpose, the method and the requirements;
# it reads the references and draws something of its own; the best model at its highest reasoning, tools/codex_job.sh): the PAWN of
# episode 1's chess garden (DESIGN 第 1 话 开头 4; PLAN A1) as the game's own six-pose monster sheet, ready to go into the game
# (tools/rounds/r23_import.py cuts a 3 x 2 sheet into enemy/<id>_<pose>). Two independent tries.
MODE = "brief"
R = "art/raw/r102/"
GIRLS = ["public/jiggle/pink_fire.png", "public/jiggle/cat_fire.png"]
PAWN = """WHAT THIS IS: one monster of our game, as the six-pose sprite sheet the game cuts apart and animates. The game: two anime heroines with guns hold a line while monsters come at them; each monster is a flat picture standing in a 3D place, seen from 8 to 12 metres away at a quarter to a third of the screen's height, and it must read in an instant. This one belongs to the second stage of episode 1: the formal garden behind an old western mansion that has become an ice-cream cafe - a sunny lawn laid out as a big black-and-white chessboard, green hedges, red and white roses, a marble fountain that has just begun to run with blood. Five marble garden statues of chess pieces stand round the board and come alive one by one to fight the girls. This is the first and weakest of them: THE PAWN.

THE REFERENCES: images 1 and 2 are our two heroines exactly as they appear in the game. Take ONLY their drawing: the anime line quality, the clean colouring with soft shading, the level of finish - so the monster plainly belongs to the same game. Do not draw the girls, their faces, hair, clothes or guns; the monster is a completely different design of its own.

THE DESIGN (keep to it): a living chess pawn that has taken a lady's shape - a statue first, a girl only in its grace.
- Head: a perfectly round, polished white marble ball - exactly the round top of a chess pawn - with a doll's face PAINTED on it like a porcelain doll's: two thin black closed-eye arcs, round soft pink cheeks, a small red painted smile. No hair, no ears, no nose: just the ball and the painted face. That painted face never moves; that is what is wrong about it.
- Neck: the pawn's flat round collar disc sits under the ball like a stiff ruff.
- Body: a slender, graceful lady's torso of white marble with a narrow waist, a black lacquer sash tied at the waist; elegant marble arms and slim hands with long fingers (five fingers each).
- Lower body: no legs - from the hips down a long skirt that flares out into the pawn's stepped round base; it glides over the ground.
- Weapon: a long thin spear, taller than itself, with a gilded gold spearhead and a small chequered black-and-white pennant under the head.
- Colours: white marble, black lacquer, a little gold, and the painted face's pink and red. Shadows a pale cool blue-grey. Nothing else.
- Proportions: about four heads tall (the ball is the head). One clear tall upright outline.
- Detail where it counts - the painted face, the collar, the hands, the spearhead - and large clean simple surfaces everywhere else. Smooth polished marble, a few fine cracks at most.

THE SHEET: three columns and two rows of cells, the same monster in every cell - the same design, size and scale, each pose whole inside its own cell with clear empty space around it and between the cells - facing the viewer, turned slightly to three-quarters, on a transparent background:
1 standing still, spear held upright beside it, the painted smile calm;
2 gliding forward, leaning in, the skirt trailing behind;
3 winding up: spear drawn far back, body twisted, a crack opening across the painted smile;
4 thrusting the spear straight at the viewer, the spearhead foreshortened and big, the ball head split open along the crack into a jagged black mouth;
5 hurt: thrown back, chips of marble flying off the ball and the shoulders, the painted eyes now wide open;
6 broken: snapped in two at the waist, the top half toppling, marble pieces falling.

CHECK BEFORE YOU SAVE: every cell the same monster; two arms and two hands with five fingers in every cell; no legs anywhere; the head is always the round ball with the painted face (never a real human face, never hair); nothing cut off; nothing melted, twisted or doubled; the background transparent."""
JOBS = {"R102_pawn": [(f"{R}pawn_{v}.png", GIRLS, PAWN + f"\n\n(Try {v} of two - an independent attempt.)") for v in "ab"]}
