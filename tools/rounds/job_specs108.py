# Round 108 (user 2026-10-23: every design came out as the most direct association of a name or an example; and every design obeyed
# rules nobody asked for - it must be reasonable, logical, physically joined up, no supernatural power, no changing shape, an eye is an eye,
# the strangeness where you expect it, familiar enough, symmetrical, summed up in one sentence, fit for a pipeline): many small monster
# thumbnails, each a different road, to be picked by eye (the user names the numbers); the picked ones are then worked up. The chess set
# of episode 1's garden is their material, not their costume.
MODE = "brief"
R = "art/raw/r108/"
REFS = ["art/ref/monster_ref.webp", "public/jiggle/pink_fire.png"]
BRIEF = """WHAT THIS IS: a sheet of EIGHT small monster thumbnails for our game, for the director to pick from by eye - each one a completely different idea. The game: two anime heroines with guns fight monsters; in episode 1 (a homage to the Famicom horror game Sweet Home) the monsters of the haunted mansion's garden are made out of its marble chess set. The chess pieces (pawn, knight, bishop, rook, queen, king - white marble, black marble) are MATERIAL for the monsters, not their costume: do not dress anything up as a soldier, a knight, a priest or a queen.

WHAT MAKES A MONSTER HERE - break every one of these habits, on purpose:
- it does not have to make sense, follow logic or be physically possible: parts can float apart, hang from nothing, be cut through, pass through each other;
- it can be supernatural and it can be in the middle of changing shape - melting, unfolding, splitting, growing;
- nothing has to be what it seems: a part that looks like one thing is something else;
- the strange part is never where you expect it;
- it is unfamiliar - not a known creature with something added;
- it is asymmetrical;
- it cannot be summed up in one sentence;
- no two of the eight follow the same idea.
A monster first. It is never a woman's body (no chest, waist, hips, legs or figure of a woman) and never has a woman's face, eye or mouth stuck on it. Whatever is feminine about it is in its own shape and bearing - how it stands and moves, the sweep of its outline like a skirt or long hair or a dancer's line - never an accessory stuck on: no bows, ribbons, lace, frills or hair ornaments added as decoration (user 2026-10-23: a bow stuck on is no better than a woman's eye stuck on). No eye patterns, no gems or crystals, no purple. Horror and blood are welcome. Draw only monsters - nothing else.

STYLE: as image 1 (our game's key picture) and image 2 (our heroine): the same anime line art and clean colouring - but each monster drawn SIMPLE: big flat areas of colour, a few large clear shapes, a clean outline that reads at a glance from far away; very few small details; no texture, no grain, no noise, no clutter of little parts (DESIGN 怪的画风, user 2026-10-23: too many noisy details make them unusable). NO EFFECTS of any kind drawn in: no glow, no aura, no smoke, no mist, no sparks, no particles, no motion lines, no light rays (the game adds its own effects; user 2026-10-23: no effects stacked on effects) - just the monster itself.

THE SHEET: eight monsters in two rows of four, each whole inside its own cell with empty space around it, each with its number 1 to 8 written small and plain beneath it; plain light grey background. OPAQUE. Landscape."""
JOBS = {f"R108_{s}": [(f"{R}sheet4_{s}.png", REFS, BRIEF + f"\n\n(This is sheet {s} of five: make its eight ideas different from what the other sheets are likely to do - go further.)", "OPAQUE")] for s in "abcde"}
