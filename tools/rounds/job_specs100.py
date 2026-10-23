# Round 100 (user 2026-10-23, DESIGN「怪的画风」: the chibi monsters were hard to look at - a lump of detail, noise, a mess; from now on
# about four heads tall, one big upright or long-and-low outline, flat colour, few details; PLAN「第 1 话开头重做」A1): the style test on one
# monster only - the pawn of the chess garden (episode 1's second stage), as the marble statue and as the thing come alive, side by side.
# Three directions, two tries each; the user picks one and it becomes the standard for every monster after. Not imported: a test.
# (The old monster prompts asked for "rich detail" and gave the old chibi sheets as the style: neither is used here.)
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]

R = "art/raw/r100/"
REFS = ["art/ref/monster_ref.webp"]
IDEA = ("Reference image 1 shows only the IDEA of this game's monsters (the megaphone cluster and the photo-frame creature: a strange thing "
        "first, with girlish touches) - not the level of detail to copy. ")
PAWN = ("THE MONSTER: the PAWN of a living chess set in a haunted mansion garden - a chess pawn piece that has become a creepy girl-shaped "
        "monster. Her whole body IS the pawn: the pawn's round ball top is her head (a smooth ball with a small doll face), the pawn's collar "
        "ring is a stiff round ruff at her neck, the narrow turned waist is her waist, and the pawn's wide stepped base is a long bell-shaped "
        "skirt down to the ground with no legs showing - she glides. Long hair falls down her back like carved ribbons. She holds a long thin "
        "spear upright beside her, taller than herself. About four heads tall, slim, one clear tall upright outline. ")
FORMS = ("Two figures side by side, the same height, the same pose, both seen from the front three-quarter view, full body, standing on the "
         "ground: on the LEFT the MARBLE STATUE form - all smooth white-grey marble, eyes closed, a few cracks, a little moss at the hem, on a "
         "low square stone plinth; on the RIGHT the same figure COME ALIVE - the marble shell cracking and falling away in a few big flakes, "
         "underneath glossy black lacquer with thin crimson lines like veins, eyes open and glowing crimson, mouth open in a scream, the spear "
         "lowered to strike. Plain empty background, nothing else in the picture. Landscape 3:2. ")
LESS = ("LARGE FLAT AREAS OF COLOUR AND BIG SIMPLE SHAPES: only a few details on the whole figure, every detail big enough to read from far "
        "away; smooth clean surfaces; no texture noise, no fine patterns, no tiny ornaments, no clutter, no glow, no effects, no text. ")
STYLE = {
    "a": "STYLE: clean TV-anime monster design: crisp clean line art of even weight, cel shading with one shadow tone (two at most), "
         "bright clean colours. ",
    "b": "STYLE: bold flat graphic style: thick dark outlines, pure flat colours with no gradients and almost no shading, a strong "
         "silhouette, like a bold modern game sprite or a sticker. ",
    "c": "STYLE: manga ink style: confident black ink lines and solid black areas, a little simple hatching in the shadows, flat muted colour "
         "with crimson as the only strong colour, like a coloured page of a horror manga. ",
}
JOBS = {f"R100_pawn_{s}": [(f"{R}pawn_{s}{v}.png", REFS, IDEA + PAWN + FORMS + LESS + STYLE[s] + f"Try {v}.") for v in "12"] for s in "abc"}
# (tries 1-2 read as a pretty girl dressed as a chess piece - DESIGN「怪物」: a monster first, NOT a pretty girl wearing an object - so the
# design again, monster first: the ball head is the pawn's own ball, a mannequin's slits for a face, the girlish touch only in two carved
# braids; come alive, the ball splits into a toothed mouth with one crimson eye in it - the weak point. Tries 3-4, the same three styles)
PAWN2 = ("THE MONSTER: a living chess PAWN of a haunted mansion garden - a creepy thing first, only a little girlish. Its body is a tall chess "
         "pawn piece: a big smooth ball for a head on a round collar ring, a narrow waist, a wide stepped base like a long bell skirt down to "
         "the ground, gliding with no legs. The ball head has no hair and no ordinary face: only two narrow carved eye slits and a small "
         "carved mouth line, like a mannequin's head. The girlish touch: two long carved braids hang from the back of the ball down to the "
         "base, a ribbon at each end, and slender lady's hands. Two thin jointed arms like a wooden mannequin's hold a long thin spear "
         "upright, taller than itself. About four heads tall (the ball is the head), one clear tall upright outline. ")
FORMS2 = ("Two figures side by side, the same height, seen from the front three-quarter view, full body, standing on the ground: on the LEFT "
          "the MARBLE STATUE form - all smooth white-grey marble, a few cracks, a little moss at the hem, on a low square stone plinth; on "
          "the RIGHT the same figure COME ALIVE - the marble shell falling away in a few big flakes, underneath glossy black lacquer with "
          "thin crimson lines like veins, the ball head split wide open across its middle like a mouth full of white teeth with one big "
          "crimson eye glaring from inside it, the spear lowered to strike. Plain flat light grey background of one even colour, nothing "
          "else in the picture. Landscape 3:2. ")
JOBS.update({f"R100_pawn2_{s}": [(f"{R}pawn_{s}{v}.png", REFS, IDEA + PAWN2 + FORMS2 + LESS + STYLE[s] + f"Try {v}.") for v in "34"] for s in "abc"})
