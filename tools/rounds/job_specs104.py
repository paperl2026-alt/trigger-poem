# Round 104 (user 2026-10-23, of R103's first three: "比例不一、画风不一致" - five separate jobs, each drawn its own way): the five chess
# monsters as ONE set in ONE picture - one style (our heroines' drawing), one scale, fixed proportions - so they are a set; R103's three
# finished ones given for their designs only. Once the set is right, each is drawn again alone at full size with this sheet as its model.
MODE = "brief"
R = "art/raw/r104/"
REFS = ["public/jiggle/pink_fire.png", "public/jiggle/cat_fire.png", "art/raw/r103/soldier.png", "art/raw/r103/knight.png", "art/raw/r103/queen.png"]
SET = """WHAT THIS IS: the five monsters of one stage of our game, drawn together as one matching set so they look like they come from the same game and the same artist. The game: two anime heroines with guns fight monsters that come at them; each monster is a flat full-body picture standing in a 3D place. Episode 1 is a homage to the Famicom horror game Sweet Home (a haunted western mansion, now an ice-cream cafe); in the mansion's sunny garden, five marble garden statues of chess pieces - each a woman - come alive. Each is unmistakably a WOMAN and unmistakably a MONSTER at once: a horror creature with a woman's body and grace, not a pretty girl holding an object, not an object with a face stuck on.

THE REFERENCES:
- Images 1 and 2 are our two heroines exactly as they appear in the game. This is THE STYLE for all five monsters: draw them with exactly this anime line art (the same line weight and clean outlines), the same clean colouring with soft gradient shading, the same light from the upper left, the same level of finish and detail. Do not draw the girls or anything of theirs.
- Images 3, 4 and 5 are earlier drawings of three of the monsters (the soldier, the knight, the queen). Keep their DESIGNS - silhouette, costume, colours, features - but NOT their drawing style or proportions: they were drawn in three different styles and scales, which is exactly what must not happen. Redraw them in the heroines' style, at the common scale below.

ONE SCALE, FIXED PROPORTIONS: all five stand on the same ground line, and a woman's head is the SAME SIZE in every one of them. Each woman's body is about FOUR heads tall from the top of her head to where her feet (or her lower body) begin - stylised, between a chibi and a real figure, like the heroines' slightly cute proportions shortened. What is not woman (the horse body, the tower skirt, the vines, the stretched neck) adds to that and makes some of them bigger than others.

THE FIVE, left to right:
1 THE SOLDIER (from image 3): a female foot-soldier in a stained off-white maid's uniform worn as armour, grey-white skin; her head inside a smooth round helmet like a pawn's ball head with one dark slit, long black hair spilling from under it; limp, boneless, head lolled to one side; both forearms end in long spear blades; torn white stockings. The smallest of the five.
2 THE KNIGHT (from image 4): from the waist up a woman knight in ivory armour with a torn red cape and long white hair, her helmet the knight chess piece's carved horse head, her pale jaw and red lips under it; from the waist down a gaunt black horse with four long legs and showing ribs; a long lance. Wide and long.
3 THE CHANCELLOR (new): a tall nun in deep teal robes with gold trims and the bishop's tall notched mitre; her pale neck stretches up like a snake, far longer than a person's, so her calm face looks down from high above; four thin arms from her robes, two holding swinging gold censers trailing pale smoke. Tall and thin.
4 THE CASTLE LADY (new): an elegant woman in long black opera gloves and pearls, her wide hat the rook's crown of square battlements; her long skirt is a round grey stone castle tower with arrow-slit windows, grey grasping hands and bloodshot eyes peering out of the slits; a red velvet curtain over one shoulder like a stole. The tallest and heaviest.
5 THE QUEEN (from image 5): a regal woman's body woven of green rose vines and red roses, a gown of vines trailing, a crown of thorns; her face white marble cracked down the middle, one half fallen away to show dark vines and a red eye inside; several thorny vine whips rising behind her. Tall and wide.

THE PICTURE: the five side by side in that order, standing, facing the viewer turned slightly to three-quarters, each whole with clear empty space around it and between them; transparent background; no ground, no shadows, no other objects, no text. Wide landscape.

CHECK BEFORE YOU SAVE: one style for all five, matching the heroines; the women's heads the same size in all five; each about four heads tall as a woman; designs as described; the right number of arms, hands, fingers, legs, eyes for each design; nothing melted, twisted, doubled or cut off; transparent background."""
JOBS = {"R104_set": [(f"{R}set_{v}.png", REFS, SET + f"\n\n(Try {v} of two - an independent attempt.)") for v in "ab"]}
