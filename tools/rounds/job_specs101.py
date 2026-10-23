# Round 101 (user 2026-10-23, after R100 - "不怪也不人，毫无美学与设计感": the art direction is the reference the user gave - an anime
# illustration of a red-veiled bride under a gold crown, pale paper-doll servants in teal shadow either side (art/raw/ref_user/
# bride_red_gold.png): the faces, crowns and embroidery finely drawn, the rest let go; crimson and gold against cool teal; uncanny from the
# painted pale faces and calm smiles. And Year of the Ladybug's bright ward (ladybug_ward.png): the horror in a bright, beautiful place.
# Episode 1's second stage, the chess garden (DESIGN 第 1 话 开头 4): its five statues of women, each crowned with her own chess piece -
#   lineup_<v>  the five side by side as statues (the set's design, one sheet)
#   garden_<v>  the garden itself with them in it: the mood of the stage and of its comic page
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]

R = "art/raw/r101/"
BRIDE, WARD = "art/raw/ref_user/bride_red_gold.png", "art/raw/ref_user/ladybug_ward.png"
LOOK = ("Draw in the art style of reference image 1: a polished anime illustration with soft painterly rendering - glowing pale skin, the "
        "faces, crowns and embroidery drawn finely and carefully, everything else simplified and soft; rich saturated crimson and warm gold "
        "set against cool teal-green shadows; light falling on the faces. The uncanny feeling of reference image 1: pale painted faces "
        "with round red cheeks and red lips, calm smiles that feel wrong. ")
SET = ("FIVE GARDEN STATUES OF THE CHESS PIECES: each a slender young woman about four heads tall, carved in polished ivory-white marble, "
       "on a low square marble plinth; a pale painted face with round red cheeks and red lips, eyes closed, a calm smile; a sheer crimson "
       "veil draped over her head and shoulders; her own chess piece is her crown, in gilded gold with a little fine filigree. "
       "1 PAWN - the smallest: a plain round gold ball crown on her hair bun like the top of a pawn, a simple long dress with an apron, a "
       "long spear held upright. "
       "2 KNIGHT - a gold horse's head with a flowing mane rising from her helmet, a short armoured skirt over a long dress, a lance and a "
       "kite shield. "
       "3 BISHOP - a tall gold mitre crown split by the bishop's slanted notch, long robes with very wide sleeves, a censer swinging on a "
       "chain. "
       "4 ROOK - a gold crown of square castle battlements, broad and heavy, a tall tower-shaped shield as big as herself. "
       "5 QUEEN - the tallest: a gold coronet of tall points each tipped with a small ball, a gown with a long train, gold embroidered "
       "trims, a sceptre. "
       "All five clearly one matching set, each told apart at a glance by her crown and her outline. ")
JOBS = {
    "R101_lineup": [(f"{R}lineup_{v}.png", [BRIDE],
                     LOOK + SET + "Character design lineup: the five standing side by side in a row, left to right pawn, knight, bishop, rook, "
                     "queen, each whole from crown to plinth, front view, evenly spaced with clear gaps between them. Plain soft warm grey "
                     f"background. OPAQUE. Landscape 16:9. Try {v}.") for v in "abc"],
    "R101_garden": [(f"{R}garden_{v}.png", [BRIDE, WARD],
                     LOOK + "Reference image 2 shows the kind of scene: the horror in a bright, clean, beautiful place. "
                     "THE PLACE: the formal garden behind an old western mansion that is now an ice-cream cafe, on a bright sunny afternoon: a "
                     "lawn laid out as a big black-and-white chessboard, trimmed hedges, red and white roses, an old marble fountain in the "
                     "middle whose water is turning blood red from the top basin down. Around it, on plinths at the edges of the board: " +
                     SET + "Seen at eye level from the edge of the board, wide, the fountain in the middle distance. Bright high-key "
                     "daylight, fresh greens, sky blue, ivory marble, crimson veils and the red water as the strong colour; soft teal "
                     f"shadows. No people. OPAQUE. Landscape 16:9. Try {v}.") for v in "ab"],
}
