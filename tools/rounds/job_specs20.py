# Round 20: the chapter-select screen, strictly decomposed from the approved mockup art/ref/select_ref.png (1672x941:
# R19 layout A, 1P cat girl from v2, 2P girl from v1). Same method as the title (R15): Codex only separates what is there.
# Controls, text and bars are drawn by the game from measured boxes (art/ref/select_parts/boxes.json).
P = "art/ref/select_parts/"
MOCK = "art/ref/select_ref.png"
NOREDESIGN = "This is NOT a redesign task. "


def strict(what, extra=""):
    return ("Reference image 1 is a crop from an approved game UI mockup. " + NOREDESIGN +
            f"Reproduce ONLY the {what} exactly as it looks there: same shape, same proportions, same colors, same line weight. "
            "Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. " + extra)


JOBS = {
    "R20_layers": [
        ("art/raw/r20/sel_plate.png", [MOCK],
         "Reference image 1 is an approved game chapter-select screen. " + NOREDESIGN +
         "Output the SAME 16:9 image, pixel for pixel the same composition, shapes, colors and graphic style, with ONLY these removed: both girls inside the two "
         "character cards (paint the cards' red halftone backgrounds behind them), the dark '第1话' chapter card in the middle with its house picture (continue the "
         "white panel edge and the background behind it), and every piece of text, icon and control: the '回到标题' button, the coin counter, the gear, the two tabs "
         "'队伍' and '书包', 'CHAPTER 0' and the chapter title and subtitle text, the three stage rows, 'BEST 0', the red '出发！' slab, the two left / right arrows, "
         "the '1P' / '2P' name bars, the mastery rows with their bars, the outfit chips and the '交换 1P/2P' button. "
         "Where those were, continue the clean off-white panels, the white card bodies and the background. Keep the big tilted off-white chapter panel with its "
         "grunge edges and the red slash lines under the title, the white team panel with the two empty card frames and their red halftone windows, the sakura, "
         "the city silhouettes and the red and black background.", "OPAQUE"),
        ("art/raw/r20/sel_cat.png", [MOCK],
         "Reference image 1 is an approved game chapter-select screen. " + NOREDESIGN +
         "Output the SAME 16:9 image with ONLY the white-haired cat girl inside the left character card kept, exactly as she is drawn there (same pose looking back "
         "over her shoulder, same face, glasses, ears, bell, braid, the white fur paw with red claws, clothes), at exactly the same position and size, pixel for pixel. "
         "Do not move, redraw, restyle or re-pose her and do not continue her beyond what is visible. Everything else removed and fully transparent."),
        ("art/raw/r20/sel_pink.png", [MOCK],
         "Reference image 1 is an approved game chapter-select screen. " + NOREDESIGN +
         "Output the SAME 16:9 image with ONLY the black-haired twin-tail girl inside the right character card kept, together with the pink-and-black gatling gun "
         "she hugs, exactly as drawn there (same winking grin, ribbons, bunny clip, hearts, frilly dress), at exactly the same position and size, pixel for pixel. "
         "Do not move, redraw, restyle or re-pose her and do not continue her beyond what is visible. Everything else removed and fully transparent."),
        ("art/raw/r20/sel_next.png", [P + "next_card.png"],
         strict("dark grey chapter card with its black-and-white haunted house picture and its jagged white border", "Remove the text '第1话', '甜蜜之家', '制作中' and the padlock icon, and continue the house picture behind them.")),
    ],
    "R20_parts": [
        ("art/raw/r20/thumb1.png", [P + "thumb1.png"], strict("greyscale classroom picture that fades out to the left", "Remove the white '»' chevrons and continue the picture behind them.")),
        ("art/raw/r20/thumb2.png", [P + "thumb2.png"], strict("greyscale school corridor picture that fades out to the left", "Remove the white '»' chevrons and continue the picture behind them.")),
        ("art/raw/r20/thumb_boss.png", [P + "thumb_boss.png"], strict("greyscale picture with the round teddy-bear mascot silhouette that fades out to the left", "Remove the white '»' chevrons and the text and continue the picture behind them.")),
        ("art/raw/r20/icon_coin.png", [P + "coin.png"], strict("gold coin icon")),
        ("art/raw/r20/icon_gear_w.png", [P + "gear.png"], strict("black gear icon on its white tilted square tile")),
        ("art/raw/r20/icon_team.png", [P + "icon_team.png"], strict("white group-of-people icon")),
        ("art/raw/r20/icon_bag.png", [P + "icon_bag.png"], strict("black school bag icon")),
        ("art/raw/r20/icon_skull.png", [P + "skull.png"], strict("white skull icon with its black outline")),
        ("art/raw/r20/icon_crown.png", [P + "crown.png"], strict("black crown icon")),
        ("art/raw/r20/icon_swords.png", [P + "swords.png"], strict("black crossed swords icon")),
        ("art/raw/r20/icon_shirt.png", [P + "shirt.png"], strict("white T-shirt icon")),
        ("art/raw/r20/icon_lock.png", [P + "lock.png"], strict("black padlock icon")),
        ("art/raw/r20/icon_lock_big.png", [P + "lock_big.png"], strict("light grey padlock icon")),
        ("art/raw/r20/icon_swap.png", [P + "icon_swap.png"], strict("white two-arrows swap icon")),
        ("art/raw/r20/arrow_l.png", [P + "arrow_l.png"], strict("left-pointing triangle arrow (white with a black outline)")),
        ("art/raw/r20/arrow_r.png", [P + "arrow_r.png"], strict("right-pointing red triangle arrow with its white and black outline")),
        ("art/raw/r20/chevrons.png", [P + "row1.png"], strict("white double chevron '»' at the right end of the bar (only the chevron)", "Remove everything else.")),
    ],
}

# the clean plate: Codex fills ONLY the magenta areas (tools/plate_mask.py); the import keeps the mockup's own pixels elsewhere
JOBS["R20_fill"] = [
    ("art/raw/r20/sel_fill.png", [P + "plate_magenta.png"],
     "Reference image 1 is an approved game screen on which some areas have been painted solid magenta (#FF00FF). " + NOREDESIGN +
     "Output the SAME 16:9 image, same size, with ONLY the magenta areas filled in: continue exactly what surrounds each magenta area, as if nothing had "
     "ever been drawn there: the clean off-white paper of the panels and card bodies (with their faint paper texture), the panels' black grunge edges, the "
     "black-and-white jagged shards, the red halftone background, the red and black city silhouettes. Do not add any text, letters, numbers, icons, buttons, "
     "frames, characters or objects. Everything that is not magenta must stay exactly as it is, pixel for pixel.", "OPAQUE"),
]

# the exact footprint of the game-drawn controls (its alpha becomes the plate mask, so only what the controls cover is refilled)
JOBS["R20_ui"] = [
    ("art/raw/r20/sel_ui.png", [MOCK],
     "Reference image 1 is an approved game chapter-select screen. " + NOREDESIGN +
     "Output the SAME 16:9 image, same size, with ONLY the user-interface controls kept, exactly where and how they are: the '回到标题' button, the coin "
     "counter, the gear tile, the two tabs '队伍' and '书包', 'CHAPTER 0', the chapter title and subtitle lettering, the three stage rows, 'BEST 0', the red "
     "'出发！' slab with its white border and black shadow, the dark '第1话' chapter card, the two triangle arrows, the '1P' / '2P' name bars, the mastery rows "
     "with their bars, the outfit chips, and the '交换 1P/2P' button with its border and shadow. Do not move or resize anything. Everything else (the "
     "background, the panels, the card frames, the girls, the sakura, the red slash lines) removed and fully transparent."),
]

# the controls' plates without any lettering / icons / pictures: cut into pieces, they are the buttons' and rows' own art
JOBS["R20_uibase"] = [
    ("art/raw/r20/sel_uibase.png", ["art/raw/r20/sel_ui.png"],
     "Reference image 1 shows the user-interface controls of an approved game screen on a transparent background. " + NOREDESIGN +
     "Output the SAME image, same size, every control at exactly the same place and size, but with ALL lettering, numbers, icons and pictures removed from "
     "them: no text at all, no arrows, no skull, crown, coin, gear, people, bag, shirt, padlock or swords icons, no house picture, no greyscale stage "
     "pictures and no '»' chevrons. Keep each control's own shape exactly: its fill colour, its red halftone dots and grunge, its white border, its black "
     "outline and its black drop shadow; where the lettering or an icon was, continue the control's plain fill. For the three stage rows keep the red number "
     "block (black for the boss row) and the white bar, and continue the white bar where its picture was. Keep the grey tracks of the mastery bars empty "
     "(no red fill). Everything that is not a control stays fully transparent."),
]

# the controls without their lettering / icons: only the magenta strokes are repainted with the control's own fill (tools/text_mask.py)
JOBS["R20_notext"] = [
    ("art/raw/r20/sel_notext.png", [P + "notext_magenta.png"],
     "Reference image 1 is an approved game screen on which the lettering, numbers, icons, small pictures and bars have been painted solid magenta "
     "(#FF00FF). " + NOREDESIGN + "Output the SAME 16:9 image, same size, with ONLY the magenta pixels repainted: continue exactly the surface each magenta "
     "area sits on, as if nothing had ever been written or drawn there: the red slabs with their red halftone dots and grunge, the black slabs and bars, "
     "the white bars and panels with their faint paper texture, the grey and red chips, the card bodies, the panel paper, the background. Do not add any "
     "text, letters, numbers, icons, pictures or objects. Everything that is not magenta must stay exactly as it is, pixel for pixel.", "OPAQUE"),
]

# the next-chapter card keeps its own picture: only its lettering and padlock (magenta) are repainted
JOBS["R20_nextfill"] = [
    ("art/raw/r20/next_fill.png", [P + "next_magenta.png"],
     "Reference image 1 is a crop of an approved game screen: a dark chapter card with a black-and-white haunted house picture, on which the lettering and a "
     "padlock have been painted solid magenta (#FF00FF). " + NOREDESIGN + "Output the SAME image, same size, with ONLY the magenta pixels repainted, continuing "
     "the dark card and the house picture behind them. Do not add any text, letters, icons or objects. Everything that is not magenta stays exactly as it is.", "OPAQUE"),
]
