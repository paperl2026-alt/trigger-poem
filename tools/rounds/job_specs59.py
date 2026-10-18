# Round 59 (user 2026-10-18, chapter select): the little chapter card between the arrows shows the chapter an arrow leads to while it is
# hovered, and a placeholder the rest of the time. The prologue has no card of its own yet, and the placeholder is new. Painted like the
# mockup's episode-1 card (art/raw/r20/sel_next.png: a dark grey black-and-white manga picture with heavy screentone); only the picture:
# tools/rounds/r59_import.py lays it into that card's shape and jagged white border. No text.
#   R59_card_ep0:  the prologue (after school, the school building at dusk)          -> ui/sel_card_ep0
#   R59_card_soon: the placeholder (the two of them walking into a fog, a town unknown) -> ui/sel_card_soon
CARD = "art/raw/r20/sel_next.png"
STYLE = ("Reference image 1 is a chapter card of this game: paint EXACTLY in its style: a black-and-white manga illustration, dark grey, heavy "
         "screentone dots, crisp ink lines, moody, a little eerie, with soft light only in a few places. Portrait 2:3, but everything that "
         "matters stays inside the middle 40% of the width (the picture is cut down to a tall narrow strip): a tall vertical composition. "
         "No border, no frame, no text, no letters, no numbers, no padlock. THE PICTURE: ")
JOBS = {
    "R59_card_ep0": [(f"art/raw/r59/card_ep0_{v}.png", [CARD], STYLE + "a Japanese high school building at dusk seen from the empty schoolyard, "
                      "a clock on its front, rows of windows, one window glowing, cherry trees in bloom on both sides, crows on the roof, the sky "
                      "darkening above, a few cherry petals falling down the strip" + f". Variation {v}.", "OPAQUE") for v in "ab"],
    "R59_card_soon": [(f"art/raw/r59/card_soon_{v}.png", [CARD], STYLE + "a narrow road climbing into thick fog toward a strange town on a hill whose "
                       "shapes cannot be made out, only dim towers and a faint light; on the road, small, seen from behind, two girls walking side by "
                       "side: one with cat ears, a fluffy cat tail and one big fluffy paw, one with long twin tails and big bows; something unseen "
                       "waits in the fog" + f". Variation {v}.", "OPAQUE") for v in "ab"],
}
