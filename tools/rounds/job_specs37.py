# Round 37: the cat girl's beam special (docs/DESIGN.md「猫娘的必杀镭射」): the talisman glyphs a font cannot give, as plain brush shapes
# on a transparent background (the game colours them and animates them: tools/rounds/r37_import.py turns them into glyph masks).
# Also the R36 panels the safety filter refused, asked again in plainer words.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]   # this folder and tools/
from job_specs36 import STYLE, ASPECT, CAT, PINK, CATDESC, PINKDESC

INK = ("Pure solid black brush strokes only, on a fully transparent background: no paper, no talisman slip, no border, no colour, no shading, "
       "no texture, no glow, no red seal. Bold, confident Chinese calligraphy brush strokes with dry-brush edges, each item centred in its own "
       "cell with empty space around it. Draw a sprite sheet, 3 x 3 grid, nine items: ")
JOBS = {
    "R37_fu": [
        ("art/raw/r37/fu_words.png", [], INK + "1 the two characters 敕令 written vertically as one dramatic block, 2 the five characters 急急如律令 "
         "written vertically, 3 the single character 㗊 (four 口 in a square) huge and bold, 4 the character 敕, 5 the character 令, 6 the "
         "character 雷, 7 the character 鬼, 8 the character 罡, 9 the character 斬. Accurate characters, exactly as written here."),
        ("art/raw/r37/fu_seals_a.png", [], INK + "nine DIFFERENT Taoist talisman secret seals (fulu sigils): invented composite glyphs made of "
         "stacked radicals, hooked spirals, star-step zigzags (the Big Dipper's seven stars joined by lines), triple-hook 'three clear' marks, "
         "a long trailing tail at the bottom of each like a real fu talisman; they must NOT be readable characters, they are magic sigils."),
        ("art/raw/r37/fu_seals_b.png", [], INK + "nine DIFFERENT round magic seal glyphs: a circle of eight trigram bars, a spiral thunder sigil, a "
         "pentagram woven from one brush line, a nine-palace grid of dots, a whirlpool of hooked strokes, a sun sigil with rays, an eye inside "
         "a triangle of strokes, a cat-paw sigil drawn in calligraphic strokes, a lotus drawn in four strokes."),
    ],
    # the refused R36 panels again, plainer (no skirts mentioned, no leaping from behind)
    "R37_c": [
        ("art/raw/r36/c_j2_a.png", [CAT, PINK], "Reference images: 1 = the cat girl's design, 2 = the twin-tail girl's design; keep their designs "
         "exactly. " + STYLE + ASPECT["tall"] + " The panel: seen from outside the school building, the two girls jump out of a shattered "
         "second-floor window together, shown from the waist up with their arms forward like divers, glass shards sparkling around them, "
         "determined faces, sunset sky. Wholesome action scene.", "OPAQUE"),
        ("art/raw/r36/c_j2_b.png", [CAT, PINK], "Reference images: 1 = the cat girl's design, 2 = the twin-tail girl's design; keep their designs "
         "exactly. " + STYLE + ASPECT["tall"] + " The panel: a close view of the two girls' faces and shoulders in mid-air right after jumping "
         "through a broken window, hair streaming upward, glass sparkles around them, both shouting with determination. Wholesome action "
         "scene.", "OPAQUE"),
        ("art/raw/r36/c_m4_b.png", [CAT, PINK], "Reference images: 1 = the cat girl's design, 2 = the twin-tail girl's design; keep their designs "
         "exactly. " + STYLE + ASPECT["tall"] + " The panel: the two girls running side by side down a school corridor toward the viewer, seen "
         "from the front from the chest up, the cat girl's ghost paw glowing, the twin-tail girl holding her gun ready, motion lines.", "OPAQUE"),
        ("art/raw/r36/c_m4_c.png", [CAT, PINK], "Reference images: 1 = the cat girl's design, 2 = the twin-tail girl's design; keep their designs "
         "exactly. " + STYLE + ASPECT["tall"] + " The panel: a side view of the two girls sprinting down a school corridor, chest up, hair "
         "flying, speed lines, the corridor stretching behind them.", "OPAQUE"),
        ("art/raw/r36/c_i1_b.png", [], STYLE + ASPECT["wide"] + " The panel: an empty after-school classroom at sunset seen from the front "
         "corner, rows of desks and chairs with long shadows, a wall clock, nobody in the room.", "OPAQUE"),
    ],
}
