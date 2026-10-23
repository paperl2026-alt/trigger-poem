# Round 109 (user 2026-10-23: monsters made of known things combined is fine - but who said pawn x woman = a land animal x plaster? the
# world's arthropods, molluscs and extinct animals have their own shapes, organs and bearing, and non-living things have properties; look
# them up instead of guessing): each chess piece x one real creature's anatomy x one property of a non-living thing; the feminine in the
# creature's own form (a mantle swaying like a skirt, cerata like hair, a dancer's swimming) - nothing stuck on.
MODE = "brief"
R = "art/raw/r109/"
REFS = ["art/ref/monster_ref.webp", "public/jiggle/pink_fire.png"]
HOW = """WHAT THIS IS: one monster of our game, its standing frame. The game: two anime heroines with guns fight monsters; each monster is a flat full-body picture standing in a 3D place. In episode 1 (a homage to the Famicom horror game Sweet Home) the haunted mansion's garden has a white marble chess set whose pieces become monsters. Each monster is one chess piece fused with the real anatomy of one strange real animal and one property of a non-living thing, exactly as described below - use your knowledge of that animal's real body (its organs, segments, mouthparts, how it moves) so it looks like that animal's anatomy, not a cartoon of it. Its feminine side is only in its own form and bearing as described (a mantle swaying like a skirt, flowing filaments like hair, a dancer's movement) - nothing stuck on: no bows, ribbons, lace, jewellery, no woman's body, no woman's face, eyes or mouth.

STYLE: as image 1 (our game's key picture) and image 2 (our heroine): the same anime line art and clean colouring, but drawn SIMPLE: big flat areas of colour, a few large clear shapes, a clean outline that reads from far away, very few small details, no texture, no grain, no noise. No effects drawn in (no glow, aura, smoke, sparks, particles, light rays). No eye patterns, no gems or crystals, no purple. Horror and blood are welcome. Draw only what is described; add nothing.

THE PICTURE: the one monster alone, whole, with empty space around it; transparent background; no ground, no shadow, no text.

THE MONSTER: """
DESIGNS = {
    "pawn": "THE PAWN x THE SEA PIG (the deep-sea sea cucumber Scotoplanes) x WET CLAY: a white marble chess pawn whose body has gone soft like wet, "
            "unfired clay, sagging and dented; underneath, a row of the sea pig's soft, stubby tube feet that it shuffles along on; its "
            "collar ring is a ring of the sea pig's fleshy papillae standing up; the rim of its base is a wavy fleshy mantle that sways like "
            "a skirt hem as it moves. A low, squat outline.",
    "knight": "THE KNIGHT x ANOMALOCARIS (the Cambrian predator) x EGGSHELL: the white marble chess knight's horse head is a hollow shell, "
              "cracked like an eggshell; where the horse's mouth should be is Anomalocaris's round mouth - a ring of toothed plates that "
              "opens and closes like a camera iris; its two spiny grasping frontal appendages curl out from under the jaw; along its neck "
              "instead of a mane runs a row of Anomalocaris's swimming flaps, rippling like long hair. It floats, swimming through the air. A "
              "long outline.",
    "bishop": "THE BISHOP x THE PORTUGUESE MAN O' WAR (a siphonophore colony) x STAINED GLASS: the chess bishop's mitre is the colony's gas "
              "float, made of translucent stained glass in white, red and amber leads, the bishop's slanted notch its crest; hanging from "
              "it a long curtain of stinging tentacles and clustered polyps like a long veil, drifting and swaying. A tall outline.",
    "rook": "THE ROOK x A HERMIT CRAB x SLIDING PUZZLE: a hermit crab living inside a broken white marble chess rook tower - its soft pale "
            "spiral abdomen showing through the cracks, two big uneven claws thrust out of the tower's gate, long thin jointed legs on which "
            "it walks on the very tips, like a ballerina en pointe; the tower's stone blocks are shifting out of place like the tiles of a "
            "sliding puzzle. A tall outline.",
    "queen": "THE QUEEN x THE SPANISH DANCER NUDIBRANCH (Hexabranchus sanguineus) x MELTING CANDLE WAX: the tall white marble chess queen "
             "melting from the top down like a candle, the wax running down into the nudibranch's huge deep-crimson mantle that billows and "
             "folds like a flamenco dancer's skirt; the points of her crown are the nudibranch's rhinophores; the gill plume on its back "
             "flows like long hair. A tall wide outline.",
}
JOBS = {f"R109_{k}": [(f"{R}{k}_{v}.png", REFS, HOW + d + f"\n\n(Try {v} of two - an independent attempt.)") for v in "ab"] for k, d in DESIGNS.items()}
