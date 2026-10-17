# Round 11: UI kit, answering the user's notes on the title/settings mock (art/ref/ui_user_mock.png):
#  - the rope-knot BGM slider is a good idea but must be buildable: straight cord pieces the code can crop + a bell knob
#  - characters are never redrawn inside UI art (the paw seal came out wrong): the title screen layers approved character art
#  - every interactive piece needs a normal and a highlighted (selected / hover) look
#  - lettering must be cuter and more artistic: real logo-style lettering, not a plain marker font
STYLE = ("STYLE: polished anime game UI asset art, hand-made craft look (torn paper, washi tape, red silk cord, brass), warm sunset palette "
         "(cream paper, coral pink, peach, dusky violet) with red and dark plum accents. Crisp clean edges, readable at small size.")
JOBS = {
    "R11_ui": [
        ("art/raw/ui_lettering_styles.png", ["art/ref/ui_user_mock.png"],
         "A lettering style sheet for an anime game logo/button: the Chinese words 开始游戏 written four times, stacked in four rows with wide gaps, each row in a different CUTE ARTISTIC hand-lettered logo style. "
         "Row 1: chubby round bubble letters, coral pink fill with a soft gradient, thick dark plum outline, a white glossy highlight stripe on each stroke, small cat ears growing from the top of 开 and a paw print as a dot. "
         "Row 2: bouncy hand-drawn marker letters with an offset drop shadow in mint green, letters slightly rotated and jumping up and down, tiny hearts and sparkles tucked between them. "
         "Row 3: thick brush-pen calligraphy turned cute: rounded stroke ends, red ink with a cream inner line, a tiny bell and red cord tied around the last character. "
         "Row 4: Japanese pop-style shoujo manga logo lettering: tall soft letters with a double outline (white inside, plum outside), pastel pink to peach gradient, star sparkles. "
         "Every row has exactly the four characters 开始游戏 written correctly, nothing else written anywhere. Plain light cream paper background.\n" + STYLE, "OPAQUE"),
        ("art/raw/ui_slider_kit.png", ["art/ref/ui_user_mock.png"],
         "Game UI parts sheet on a fully transparent background, every part separate with wide empty gaps, all seen perfectly flat and straight-on with no perspective, horizontal parts perfectly horizontal: "
         "1) a long straight braided red silk cord segment, uniform thickness along its whole length (the FILLED part of a volume slider); "
         "2) the same straight braided cord but pale cream white and slightly faded (the EMPTY part of the slider); "
         "3) a decorative red Chinese knot with a short tassel, to cap the left end of the cord; 4) a matching knot with tassel for the right end; "
         "5) a round brass cat bell with a small red bow on top (the slider knob), seen from the front; "
         "6) one shiny brass rifle cartridge standing upright (a FILLED step of a sound-effects volume bar); "
         "7) the same cartridge as an empty pale outline sketch on paper, faded (an EMPTY step); "
         "8) a round white bunny-face sticker with a thick white border (a second knob style). No text anywhere.\n" + STYLE),
        ("art/raw/ui_states_kit.png", ["art/ref/ui_user_mock.png"],
         "Game UI button states sheet on a fully transparent background, every item separate with wide empty gaps, flat straight-on view. Three rows, each row shows the SAME blank torn-paper tab in three states, left to right: NORMAL, HIGHLIGHTED, PRESSED. "
         "Row 1: a small rectangular torn paper tab held by a strip of washi tape (for language / display options). "
         "Row 2: a large torn sketchbook sheet with a red silk cord and tassel (the big start button). "
         "Row 3: a small paper luggage tag hanging on a red string (the quit button). "
         "NORMAL: pale cream paper, flat, slightly faded, quiet. "
         "HIGHLIGHTED: the paper lifts and tilts a little toward the viewer with a soft drop shadow, brighter warm paper, a hand-drawn red marker circle scribbled around the edge, a red paw-print stamp in one corner, a soft pink glow outline. "
         "PRESSED: squashed slightly flatter, the paw stamp freshly inked darker, a little ink splash. The tabs are blank: no letters, no text anywhere.\n" + STYLE),
    ],
}
