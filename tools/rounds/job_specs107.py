# Round 107 (user 2026-10-23, DESIGN「怪物」: the monster's body is the monster - never a woman's body, never a woman's face, eye or mouth
# stuck on a thing; girlish touches only as trimmings; the photo-frame and megaphone monsters of art/ref/monster_ref.webp are the approach;
# no eyes, gems or purple as decoration; horror and blood are wanted): episode 1's chess garden - five chess-piece monsters, each built of
# its chess piece and other things, one standing frame each.
MODE = "brief"
R = "art/raw/r107/"
REFS = ["art/ref/monster_ref.webp", "public/jiggle/pink_fire.png"]
HOW = """WHAT THIS IS: one monster of our game, its standing frame. The game: two anime heroines with guns fight monsters; each monster is a flat full-body picture standing in a 3D place. In episode 1 (a homage to the Famicom horror game Sweet Home) the haunted mansion's garden has a chess set of marble pieces that come alive. This is one of them.

THE REFERENCES: image 1 is our game's key picture, showing exactly the kind of monster we want: the megaphone cluster and the photo-frame creature are things - megaphones, picture frames - built into a creature, with girlish trimmings (bows, ribbons, a schoolgirl's touches) on top. That is the approach: the monster's BODY is made of things, it is a monster first, and the girlish part is only decoration. Draw it in the same style as image 1 and image 2 (our heroine): the same anime line art, clean colouring and soft shading.

THE RULES: no woman's body (no chest, waist, hips, legs or figure of a woman), no woman's face, eyes or mouth stuck on it; no eye patterns, no gems or crystals, no purple. It is a horror game: blood and frightening shapes are wanted - draw them as described, never softened. Draw only what the design says; add nothing else.

THE PICTURE: the one monster alone, whole, with empty space around it; transparent background; no ground, no shadow, no text.

THE MONSTER: """
DESIGNS = {
    "soldier": "THE SOLDIER: three white marble chess pawns joined one behind the other into a caterpillar crawling forward, a long low "
               "outline; under them a row of carved wooden table legs for feet, each in a frilly white ankle sock and a little black "
               "patent shoe; the front pawn wears a toy soldier's tall shako hat with a red ribbon bow, and a long steel hatpin sticks "
               "out ahead of it like a lance.",
    "knight": "THE KNIGHT: a huge white marble chess knight's horse head impaled on a carousel horse's twisted brass pole, bouncing on it; "
              "its mane braided into plaits tied with silk ribbons; a lady's riding hat with a little veil perched crookedly on its head; "
              "its mouth split open back to the ears, full of stone teeth, blood running from the corners. A tall outline.",
    "bishop": "THE BISHOP: a white marble chess bishop hanging upside down from several iron chains, swinging like a censer; red-hot coals "
              "burning inside the slanted notch of its mitre with smoke pouring out; a ring of lace hem hanging round it, and strings of "
              "pearls dangling from the chains. A tall outline.",
    "rook": "THE ROOK: a white marble chess rook, a squat castle tower walking on a ring of short stubby stone feet; lace curtains in its "
            "arrow-slit windows, a big ribbon bow tied round its battlements, little flower boxes under the windows; its whole top of "
            "battlements opens as a mouth - a ring of stone teeth, blood inside. A tall heavy outline.",
    "queen": "THE QUEEN: the tallest white marble chess queen, her base spread into a huge wire crinoline hoop with pearls strung on it and "
             "a folding fan tucked in; the points of her crown bent inward like stone claws; broken pawn pieces caught under the hoop, "
             "dragged along in a smear of blood. A tall wide outline.",
}
JOBS = {f"R107_{k}": [(f"{R}{k}_{v}.png", REFS, HOW + d + f"\n\n(Try {v} of two - an independent attempt.)") for v in "ab"] for k, d in DESIGNS.items()}
