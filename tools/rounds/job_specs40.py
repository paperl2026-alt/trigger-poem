# Round 40: the NIKKE-like battle HUD (art/raw/r39/hud_a.png, picked: the most compact, inside the user's yellow boxes) taken apart like
# R35: each region redrawn as it is, without text, numbers, portraits and fills; the program draws those (src/ui/glhud.js).
P = "art/ref/hud/parts2/"
NOTEXT = "every letter, number and Chinese character"


def strict(what, remove):
    return ("Reference image 1 is a crop of an approved game HUD mockup (a 16:9 battle screen). This is NOT a redesign task. Output the SAME "
            "picture at the SAME size, pixel for pixel the same shapes, positions, colours, outlines and halftone, keeping ONLY " + what + ". "
            "REMOVE completely: " + remove + ". Where removed things covered HUD graphics, continue those graphics cleanly. Everything that is "
            "not HUD (the game picture behind: corridor floor, barricades, the girls' legs and feet) becomes fully transparent.")


JOBS = {"R40_hud": [
    ("art/raw/r40/L.png", [P + "L.png"], strict(
        "the HUD graphics (the pink splatter and halftone backing, the round portrait frame with its segmented ring track around it, the tilted "
        "black slabs with white outlines and red shadows, the red 1P block, the white key tag, the heart icon, the HP bar slab with its empty "
        "track, the bullet icon, the ammo slab, the three Fever tiles with their flame / crosshair / chain icons and their empty segment tracks)",
        NOTEXT + "; the chibi girl inside the round frame (leave the inside of the frame plain white); every coloured fill (make the HP bar, "
        "the ring segments and the Fever segments EMPTY dark grey tracks); the row of pink magazine ticks (leave the ammo slab plain black)")),
    ("art/raw/r40/R.png", [P + "R.png"], strict(
        "the HUD graphics (the violet splatter and halftone backing, the round portrait frame with its segmented ring track, the tilted black "
        "slabs with white outlines and red shadows, the violet 2P block, the white key tag, the heart icon, the HP bar slab with its empty "
        "track, the ammo slab, the three Fever tiles with their flame / crosshair / chain icons and their empty segment tracks)",
        NOTEXT + "; the chibi cat girl inside the round frame (leave the inside plain white); every coloured fill (HP bar, ring segments and "
        "Fever segments EMPTY dark grey tracks); the row of paper talismans (leave the ammo slab plain black)")),
    ("art/raw/r40/C.png", [P + "C.png"], strict(
        "the HUD graphics (the small black stage-name slab, the big red-black-white jagged combo burst with halftone, the jagged rank burst)",
        NOTEXT + " (the stage name, 27, 连击!, A, ×1.8)")),
]}
