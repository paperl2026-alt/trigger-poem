# Round 14: the title screen, STRICTLY decomposed from the user's approved mockup (art/ref/ui_user_mock.png).
# Every part is cut out of the mockup (art/ref/ui_parts/<name>.png, boxes in boxes.json, map in art/ref/ui_breakdown.jpg)
# and Codex only isolates / cleans that exact part: no redesign, no invented decoration. Lettering is the user's chosen
# style-1 bubble lettering (already made), so text is removed from the parts.
P = "art/ref/ui_parts/"
MOCK = "art/ref/ui_user_mock.png"


def strict(what, remove="", straighten=True, extra=""):
    return ("Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. "
            f"Reproduce ONLY the {what} from reference image 1 exactly as it looks there: the same outline and silhouette, the same torn or cut edges, "
            "the same colors, the same paper / material texture, the same line style, the same proportions and the same lighting. "
            + (f"Remove {remove} and fill where they were with the same material, so it looks untouched. " if remove else "")
            + f"Everything that is not part of the {what} must be fully transparent: no background, no board, no other objects, no cast shadow on a background. "
            "Do not add any new decoration, text, sticker, flower, glow, outline or frame. "
            + ("Show it flat from the front and straighten it so it is perfectly horizontal. " if straighten else "Keep its angle exactly as in the reference. ")
            + "Make the element fill most of the image while keeping its exact aspect ratio. " + extra)


def step(out, part, prompt, refs=None, opaque=False):
    s = (f"art/raw/r14/{out}.png", refs or [P + part + ".png"], prompt)
    return s + ("OPAQUE",) if opaque else s


JOBS = {
    "R14_a": [
        step("board", "board", strict("cork notice board with its light wooden frame",
             "every paper strip, note, photo, sticker, tape, rope, tassel, flower, pushpin and text on or around it", straighten=False,
             extra="The cork surface must be completely empty and continuous.")),
        step("strip_bgm", "strip_bgm", strict("long torn cream paper strip", "the music note icon, the word BGM, the paw stamp, the red rope slider, the bell, the metal rod, the cat sticker, the text 70% and any tape")),
        step("strip_sfx", "strip_sfx", strict("long torn cream paper strip", "the speaker icon, the word SFX, the paw stamp, the bullet bar, the bunny knob, the metal rod, the text 80% and any tape")),
        step("strip_lang", "strip_lang", strict("long torn cream paper strip", "the globe icon, the word 语言, the three small paper tags (中文, 日本語, English) and any tape")),
        step("strip_disp", "strip_disp", strict("long torn cream paper strip", "the monitor icon, the word 显示模式, the two small paper tags (无边框全屏, 窗口模式) and any tape")),
        step("chip_on_s", "chip_on_s", strict("small paper tag with the red hand-drawn marker frame and the red paw stamp (the SELECTED look)", "the text 中文 only (keep the red marker frame, the red underline scribble and the paw stamp)")),
        step("chip_off_s", "chip_off_s", strict("small light grey paper tag (the NOT SELECTED look)", "the text 日本語")),
        step("chip_on_w", "chip_on_w", strict("wide paper tag with the red hand-drawn marker frame and the red paw stamp (the SELECTED look)", "the text 无边框全屏 only (keep the red marker frame, the red underline scribble and the paw stamp)")),
        step("chip_off_w", "chip_off_w", strict("wide light grey paper tag (the NOT SELECTED look)", "the text 窗口模式")),
    ],
    "R14_b": [
        step("rope_red", "rope_slider", strict("red braided rope of the volume slider", "the bell, the metal rod and the cat sticker",
             extra="Lay the rope out as ONE perfectly straight horizontal braided rope of even thickness from the left edge to the right edge (no loop), same braid texture and red colors.")),
        step("rod_metal", "rope_slider", strict("silver metal rod of the volume slider", "the rope, the bell and the cat sticker",
             extra="Show it as ONE perfectly straight horizontal rod of even thickness from the left edge to the right edge, same metal shading.")),
        step("bell_knob", "rope_slider", strict("brass bell with the red bow (the slider knob)", "everything else", straighten=False)),
        step("cat_cap", "rope_slider", strict("round white cat face sticker at the right end of the slider", "everything else", straighten=False)),
        step("bar_frame", "bullet_bar", strict("pink-framed bar that holds the bullets", "all the bullets inside it, the bunny knob and the metal rod",
             extra="The inside of the bar is an empty slot.")),
        step("bullet", "bullet_bar", strict("one single brass cartridge standing upright exactly like the ones inside the bar", "everything else", straighten=False,
             extra="Only one cartridge, upright, centered.")),
        step("bunny_knob", "bullet_bar", strict("round bunny face knob", "everything else", straighten=False)),
        step("start_sheet", "start_sheet", strict("torn notebook sheet with the row of binder holes along its top edge",
             "the big text 开始游戏, the bunny doodle, the red zigzag scribble, the red cord and tassel, the sakura flowers and any tape (keep the two red paw stamps)")),
        step("start_cord", "start_cord", strict("red silk cord with the decorative knot, the red tassels and the small brass bells", "the paper, the flowers and everything else", straighten=False)),
        step("quit_note", "quit_note", strict("small paper note hanging from the brass bell pin with the red cord", "the text 离开游戏 only (keep the paw stamp, the bell pin and the cord)", straighten=False)),
    ],
    "R14_c": [
        step("cat_peek", "cat_peek", strict("white cat character peeking over the edge with its paws", "the flowers and everything else", straighten=False)),
        step("note_hw", "note_hw", strict("small handwritten paper note (keep its handwriting and the little cat doodle exactly)", "the brass pin, flowers and anything outside the note", straighten=False)),
        step("polaroid", "polaroid", strict("polaroid photo with its picture and handwriting (keep them exactly)", "anything outside the photo", straighten=False)),
        step("photo_small", "photo_small", strict("small photo print", "anything outside the photo", straighten=False)),
        step("tassel_left", "tassel_left", strict("red tassel with the brass bead", "everything else", straighten=False)),
        step("sakura_a", "sakura_a", strict("cluster of pink sakura flowers", "everything else", straighten=False)),
        step("pin", "pin", strict("brass pushpin", "everything else", straighten=False)),
        step("icon_note", "icon_note", strict("red music note icon", "everything else", straighten=False)),
        step("icon_speaker", "icon_speaker", strict("black speaker icon with its sound waves", "everything else", straighten=False)),
        step("icon_globe", "icon_globe", strict("black globe icon", "everything else", straighten=False)),
        step("icon_monitor", "icon_monitor", strict("black computer monitor icon", "everything else", straighten=False)),
        step("glass_text", "glass_text", strict("handwritten words 'Shoot for a sweeter tomorrow!' with the heart and the cat doodle, as drawn on the window glass (keep the handwriting exactly)", "the window, sky and everything behind the writing", straighten=False)),
    ],
    "R14_d": [
        ("art/raw/r14/scene_plate.png", [MOCK],
         "Reference image 1 is an approved game title screen mockup. This is NOT a redesign task. Output the SAME scene with the same camera, composition, colors, "
         "lighting and painting style, but with these removed and the room behind them painted in naturally: both girls, the cork board and everything on it "
         "(paper strips, notes, photos, ribbons, tassels, flowers on the board), the books and bullets in the foreground, the handwritten words on the window and on the paper sign at the right. "
         "Keep the classroom window, the sakura trees outside, the sky, the curtains, the black cats on the windowsill and the room. Same 16:9 framing.", "OPAQUE"),
        ("art/raw/r14/girls.png", [P + "girls.png", "art/ref/cat_sheet.png", "art/ref/pink_sheet.png"],
         "Reference image 1 is a crop from an approved game title screen mockup showing two girls. This is NOT a redesign task. Reproduce the two girls exactly as in reference image 1: "
         "the same poses (the white-haired cat-eared girl in front adjusting her red glasses, her big white furry cat-paw arm raised at the left; the black twin-tail girl behind resting her cheek on her hand), "
         "the same faces, expressions, outfits, colors, line art and lighting, the same framing and scale. References 2 and 3 are their official character sheets for details. "
         "Remove the books, bullets, sakura petals and everything in front of or behind them, and continue their bodies naturally down to the bottom edge. "
         "Everything that is not the two girls must be fully transparent. Do not add anything."),
        ("art/raw/r14/books.png", [P + "books.png"], strict("foreground stack of dark navy books with gold trim, the bunny label and the brass bullets lying on them", "the girls, petals and everything behind", straighten=False)),
    ],
}

# the plate split into two depth layers by Codex (the depth model mixes the window up with the back wall in this plate)
JOBS["R14_e"] = [
    ("art/raw/r14/scene_room.png", ["art/raw/r14/scene_plate.png"],
     "Reference image 1 is an approved game background. This is NOT a redesign task. Output the SAME image, pixel for pixel the same room, "
     "but make every window glass area fully transparent (the sakura trees, sky and buildings seen THROUGH the glass are removed), so a separate "
     "outside view can be placed behind it. Keep the window frames, curtains, the black cats sitting on the windowsill, the walls, desks and everything inside the room exactly as they are."),
    ("art/raw/r14/scene_out.png", ["art/raw/r14/scene_plate.png"],
     "Reference image 1 is an approved game background. This is NOT a redesign task. Output ONLY the view outside the window, exactly as it looks through "
     "the glass in reference image 1 (the same blooming sakura trees, the same sky and clouds, the same distant buildings, same colors and painting style), "
     "with the window frames, curtains, cats and the room removed, continued naturally to fill the whole 16:9 image.", "OPAQUE"),
]

# the girls again, with the mockup's exact framing (the first try drew them full-body, seated with knees up)
JOBS["R14_f"] = [
    ("art/raw/r14/girls2.png", [P + "girls.png", "art/ref/cat_sheet.png", "art/ref/pink_sheet.png"],
     "Reference image 1 is a crop from an approved game title screen mockup showing two girls. This is NOT a redesign task. Reproduce the two girls EXACTLY as in "
     "reference image 1, with EXACTLY the same framing, scale and position in the image: the same poses (the white-haired cat-eared girl in front adjusting her red glasses, "
     "her big white furry cat-paw arm raised at the left; the black twin-tail girl behind resting her cheek on her hand), the same faces, expressions, outfits, colors, line art and lighting. "
     "References 2 and 3 are their official character sheets for details. They are cut off by the bottom edge exactly where reference image 1 is cut. "
     "Where the books, bullets and petals covered them, paint only what is directly behind (the cat girl's dark obi sash with the brass bell and red cord knot, "
     "the pink girl's frilly pink lap): NO legs, NO knees, NO shoes. Everything that is not the two girls must be fully transparent. Do not add anything."),
]

# "English" again: in the lettering sheet a sakura sticker covered half of its 'h'
JOBS["R14_g"] = [
    ("art/raw/r14/en_english_clean.png", ["art/raw/letters_src/en_english.webp", "art/ref/lettering_style1.png"],
     "Reference image 1 is a word in an approved game lettering style. This is NOT a redesign task. Draw the same word English in EXACTLY the same lettering style, "
     "colors, outline thickness, gloss and letter shapes as reference image 1, but with NO decorations at all: no sakura, no sparkles, no sticker border. "
     "Every letter complete and fully visible, including the h. Fully transparent background."),
]
