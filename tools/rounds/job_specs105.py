# Round 105 (user 2026-10-23, of R103's soldier: the stone-ball face, and hair coming out from under it like a person in a hood - make it
# a STONE MASK instead, one kind of mask to each monster; a mask is not GPT drawing a human face in a non-skin texture; the user's example:
# Majora's Mask, and the question how to hand an AI the design logic behind a reference rather than its look): the five chess monsters as
# one set, each with her own mask, the masks designed by the logic of the example (spelt out below), not its look.
MODE = "brief"
R = "art/raw/r105/"
REFS = ["public/jiggle/pink_fire.png", "art/raw/ref_user/majora_mask.png", "art/raw/r103/soldier.png", "art/raw/r103/knight.png",
        "art/raw/r103/queen.png"]   # (the image tool takes at most five)
SET = """WHAT THIS IS: the five monsters of one stage of our game, drawn together as one matching set (same style, same scale). The game: two anime heroines with guns fight monsters that come at them; each monster is a flat full-body picture standing in a 3D place. Episode 1 is a homage to the Famicom horror game Sweet Home (a haunted western mansion, now an ice-cream cafe); in the mansion's sunny garden, five marble garden statues of chess pieces - each a woman - come alive. Each is a woman's body - her own figure, her own long hair falling naturally behind her head - wearing a STONE MASK over her face, and the mask is the monster: it is what makes each one strange and tells them apart.

HOW TO DESIGN THE MASKS - the logic of reference image 2 (Majora's Mask), which is the example of what a monster mask should be. Take its LOGIC, never its look - no heart shape, no rainbow spikes, none of its colours or patterns:
1 its outline comes from another thing, not from a face (there a heart; here each mask's outline is taken from its own chess piece);
2 the only face-like feature is the eyes, and they are oversized, abstract and not human - no nose, no lips, no skin, no human face at all;
3 bold, flat, symmetrical painted patterns and strong colours;
4 one striking feature that makes the silhouette unforgettable (there a ring of spikes);
5 it is a made object - carved, painted, cracked stone - that you could hang on a wall.
The mask sits on the woman's face like a mask; her hair and the back of her head are her own and show around it.

THE OTHER REFERENCES:
- Image 1 is one of our two heroines exactly as she appears in the game: THE STYLE for all five - the same anime line art and line weight, the same clean colouring with soft gradient shading, the same light from the upper left, the same finish. Do not draw her.
- Images 3, 4 and 5 are earlier drawings of three of the monsters' BODIES (the soldier, the knight, the queen): keep those bodies' designs, but not their heads, their drawing style or their proportions.

ONE SCALE, FIXED PROPORTIONS: all five on the same ground line; a woman's head is the same size in every one; each woman's body is about FOUR heads tall (stylised, between a chibi and a real figure). What is not woman (the horse body, the tower skirt, the vines, the stretched neck) adds to that.

THE FIVE, left to right:
1 THE SOLDIER - body as image 3: a limp, boneless woman in a stained off-white maid's uniform worn as armour, grey-white skin, torn white stockings, both forearms ending in long spear blades; long black hair. MASK: a round stone disc with ONE huge staring eye in the middle, a ring of short iron studs all round its edge; ivory and black with a red iris. The smallest.
2 THE KNIGHT - body as image 4: from the waist up a woman knight in ivory armour with a torn red cape and long white hair; from the waist down a gaunt black horse with four long legs; a long lance. MASK: shaped like the knight chess piece's horse head seen from the side, the two eyes set wide apart on its sides like a horse's, a crest of sharp spikes running over its top like a mane; red and gold. Wide and long.
3 THE CHANCELLOR - a tall woman in deep teal robes with gold trims; her pale neck stretches up like a snake, far longer than a person's; four thin arms from her robes, two swinging gold censers trailing pale smoke. MASK: tall and narrow like the bishop's mitre, split down the middle by the bishop's slanted notch, and the notch is a vertical mouth lined with teeth; one long narrow eye on each side of it; teal and white with gold lines. Tall and thin.
4 THE CASTLE LADY - an elegant woman in long black opera gloves and pearls; her long skirt is a round grey stone castle tower with arrow-slit windows, grey hands and bloodshot eyes peering out of the slits; a red velvet curtain over one shoulder. MASK: a square block of stone topped by square battlements, three dark arrow slits for eyes, carved brick pattern; grey with orange-lit slits. The tallest and heaviest.
5 THE QUEEN - body as image 5: a regal woman's body woven of green rose vines and red roses, a gown of vines, thorny vine whips rising behind her. MASK: a crown shape - its points become the top of the mask - with a row of small eyes along the band and carved roses below; crimson and gold. Tall and wide.

THE PICTURE: the five side by side in that order, standing, facing the viewer turned slightly to three-quarters, each whole with clear empty space around it and between them; transparent background; no ground, no shadows, no other objects, no text. Wide landscape.

CHECK BEFORE YOU SAVE: every head is a woman's head with her own hair wearing a mask - no helmets, no ball heads, no human face showing; every mask follows the five points and none looks like reference image 2; one style matching the heroine; the heads the same size; about four heads tall; the right number of arms, hands, fingers, legs and eyes for each design; nothing melted, twisted, doubled or cut off; transparent background."""
JOBS = {"R105_set": [(f"{R}set_{v}.png", REFS, SET + f"\n\n(Try {v} of two - an independent attempt.)") for v in "ab"]}
