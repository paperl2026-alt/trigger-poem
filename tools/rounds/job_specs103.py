# Round 103 (user 2026-10-23: five monsters, chess piece x woman - unmistakably women, unmistakably monsters; their looks only for now,
# nothing about how they fight; borrow freely from existing works): episode 1's second stage (DESIGN 第 1 话 开头 4, PLAN B4) - five
# garden statues come alive. One standing frame each, as the game uses it (a flat full-body figure, transparent), to settle the looks.
MODE = "brief"
R = "art/raw/r103/"
GIRLS = ["public/jiggle/pink_fire.png", "public/jiggle/cat_fire.png"]
COMMON = """WHAT THIS IS: one monster of our game, its standing frame. The game: two anime heroines with guns fight monsters that come at them; each monster is a flat full-body picture standing in a 3D place, seen from 8 to 12 metres away at a quarter to a third of the screen's height, so it must read in an instant. This one belongs to episode 1 (a homage to the Famicom horror game Sweet Home: a haunted western mansion, now an ice-cream cafe): in the mansion's sunny formal garden - green hedges, red and white roses, a black-and-white chessboard lawn - five marble garden statues of chess pieces, each a woman, come alive and attack. This is one of them.

THE REFERENCES: images 1 and 2 are our two heroines exactly as they appear in the game. Take ONLY their drawing: the anime line quality, the clean colouring with soft shading, the level of finish - so the monster belongs to the same game. Do not draw the girls or anything of theirs.

WHAT IT MUST BE: unmistakably a WOMAN and unmistakably a MONSTER at the same time - a horror creature with a woman's body, figure and grace, not a pretty girl holding or wearing an object, and not an object with a woman's face stuck on it. Its chess piece shows in its shape. About four heads tall where it is a woman (a stylised figure, not a chibi). One clear outline. Its own colours, standing out against a sunny green garden. Fine detail only where it counts (face, hands, the piece's shape, the horrible part); large clean surfaces elsewhere; no noisy texture.

THE PICTURE: the one monster alone, whole from top to bottom with empty space all round, standing, facing the viewer turned slightly to three-quarters, ready - transparent background, no ground, no shadow, no other objects, no text.

CHECK BEFORE YOU SAVE: one monster only; the right number of arms, hands, fingers, legs, eyes for the design; nothing melted, twisted, doubled or cut off; clearly a woman and clearly a monster; the background transparent.

THE DESIGN: """
DESIGNS = {
    "soldier": "THE PAWN - THE SOLDIER GIRL, in the spirit of Silent Hill's faceless nurses: a female foot-soldier in a stained off-white maid's "
               "uniform worn as armour, grey-white skin; her head is hidden inside a smooth round helmet shaped like a pawn's ball head, a "
               "narrow dark slit across it, long black hair spilling out from under it; her body unnaturally limp and boneless, head lolled "
               "to one side as if her neck is broken; both forearms end not in hands but in long spear blades; slim legs in torn white "
               "stockings. Colours: off-white, grey skin, black hair, dark dried-blood red.",
    "knight": "THE KNIGHT - THE CENTAUR KNIGHT, in the spirit of Bloodborne's Lady Maria and of a centaur: from the waist up a tall woman knight "
              "in fluted ivory armour, a long flowing ponytail and a torn red cape; her helmet is the knight chess piece - a carved horse's "
              "head with a mane - and her pale jaw and red lips show under it; from the waist down she has become a horse: a gaunt black "
              "horse body and four long legs, ribs showing; she holds a long lance. A long horizontal outline. Colours: ivory, black, red.",
    "bishop": "THE BISHOP - THE CHANCELLOR NUN, in the spirit of Bloodborne's Vicar Amelia and the rokurokubi of Japanese folklore: a very "
              "tall nun in long deep teal robes with gold trims, wearing the bishop's tall mitre with its slanted notch; her pale neck "
              "stretches up and out like a snake, far longer than a person's, so her serene face looks down from high above; from her "
              "robes reach four thin arms - two holding swinging gold censers trailing pale smoke, two with long fingers spread. A tall "
              "vertical outline. Colours: deep teal, gold, white skin, grey smoke.",
    "rook": "THE ROOK - THE CASTLE LADY, in the spirit of Resident Evil Village's Lady Dimitrescu: a giant elegant woman, far taller than a "
            "person, in long black opera gloves and pearls; her wide hat is the rook's crown of square battlements; her long skirt is a "
            "round stone castle tower with arrow-slit windows, and out of the slits reach grey grasping hands and stare bloodshot eyes; a "
            "red velvet curtain hangs over one shoulder like a stole. A tall heavy outline. Colours: slate grey stone, black, pearl white, "
            "crimson.",
    "queen": "THE QUEEN - THE ROSE QUEEN, in the spirit of the Red Queen of Alice: Madness Returns: a regal woman's body woven out of the "
             "garden's green rose vines and red roses, a long gown of vines trailing behind; a crown of thorns; her face is white marble "
             "cracked down the middle, one half crumbling away to show the dark tangle of vines inside; several long thorny vine whips "
             "rise behind her like arms. A tall wide outline. Colours: deep green, rose red, marble white.",
}
JOBS = {f"R103_{k}": [(f"{R}{k}.png", GIRLS, COMMON + d)] for k, d in DESIGNS.items()}
