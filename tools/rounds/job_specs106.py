# Round 106 (user 2026-10-23: R105's set - ugly, its style matching nothing; generating from references does not hold our style): each of
# the five chess monsters made by EDITING one of our heroine's own in-game pictures (public/jiggle/pink_run_front.png, the game's drawing)
# into the monster - an edit keeps the base picture's line, colouring and finish far better than drawing anew from references, and one base
# for all five keeps them one set. Designs as R105 (the masks), the heroine herself edited away entirely.
MODE = "brief"
R = "art/raw/r106/"
BASE = "public/jiggle/pink_run_front.png"
HOW = """WHAT THIS IS: one monster of our game, its standing frame, made by EDITING reference image 1. The game: two anime heroines with guns fight monsters; each monster is a flat full-body picture standing in a 3D place. Episode 1 is a homage to the Famicom horror game Sweet Home (a haunted western mansion, now an ice-cream cafe); in its sunny garden five marble garden statues of chess pieces - each a woman - come alive. This is one of them: a woman's body with her own hair, wearing a STONE MASK that is the monster.

HOW: reference image 1 is a picture from our game, drawn in exactly the style every monster must have. Use it as the picture to EDIT, not as loose inspiration: keep its drawing EXACTLY - the same line art and line weight, the same clean colouring, the same soft shading, the same light, the same level of finish - and change WHAT is drawn: turn the girl in it completely into the monster below. Nothing of the girl may remain: not her face, her twin tails, her hair colour, her bows, her clothes, her shoes or her gun. Change her pose to the monster's pose. Remove the dark background: transparent.

THE MASK (the monster's face): a carved and painted stone mask that covers the whole face - its outline taken from the woman's chess piece, not from a face; the only face-like feature its eyes, oversized and abstract, not human; no nose, no lips, no skin showing on it; bold flat symmetrical painted patterns in strong colours; one striking feature that makes the outline unforgettable. Her own hair and the back of her head show around it.

PROPORTIONS: the woman about four heads tall, stylised like our heroines (slightly cute, not realistic, not a chibi).

CHECK BEFORE YOU SAVE: the drawing style is the same as reference image 1; nothing of the original girl is left; one monster only; the right number of arms, hands, fingers, legs and eyes for the design; nothing melted, twisted, doubled or cut off; the whole figure inside the picture; transparent background.

THE MONSTER: """
DESIGNS = {
    "soldier": "THE SOLDIER: a limp, boneless woman in a stained off-white maid's uniform worn as armour, grey-white skin, torn white stockings, "
               "both forearms ending in long spear blades instead of hands; long straight black hair; her head lolled to one side. MASK: a "
               "round stone disc with one huge staring eye in the middle and a ring of short iron studs round its edge; ivory and black, a red "
               "iris. Pose: standing slumped, blades hanging, about to lurch forward.",
    "knight": "THE KNIGHT: from the waist up a woman knight in ivory armour with a torn red cape and long white hair; from the waist down a gaunt "
              "black horse with four long legs; a long lance. MASK: shaped like the knight chess piece's horse head seen from the side, the eyes "
              "set wide apart on its sides like a horse's, a crest of sharp spikes over its top like a mane; red and gold. Pose: standing side-on, "
              "lance lowered, ready to charge. A long horizontal figure.",
    "bishop": "THE CHANCELLOR: a tall woman in deep teal robes with gold trims; her pale neck stretched up far longer than a person's; four thin "
              "arms, two of them swinging gold censers trailing pale smoke. MASK: tall and narrow like the bishop's mitre, split down the middle "
              "by the bishop's slanted notch, the notch a vertical mouth lined with teeth, one long narrow eye on each side of it; teal and "
              "white with gold lines. Pose: standing tall, arms spread, censers swinging.",
    "rook": "THE CASTLE LADY: an elegant woman in long black opera gloves and pearls; her long skirt is a round grey stone castle tower with "
            "arrow-slit windows, grey hands and bloodshot eyes peering out of the slits; a red velvet curtain over one shoulder. MASK: a square "
            "block of stone topped by square battlements, three dark arrow slits for eyes glowing orange inside, carved brick pattern; grey. "
            "Pose: standing tall and heavy, one gloved hand raised. The biggest figure.",
    "queen": "THE QUEEN: a regal woman's body woven of green rose vines and red roses, a gown of vines trailing, thorny vine whips rising behind "
             "her. MASK: a crown shape whose points form the top of the mask, a row of small eyes along its band, carved roses below; crimson "
             "and gold. Pose: standing regal, vine whips raised.",
}
JOBS = {f"R106_{k}": [(f"{R}{k}_{v}.png", [BASE], HOW + d + f"\n\n(Try {v} of two - an independent attempt.)") for v in "ab"] for k, d in DESIGNS.items()}
