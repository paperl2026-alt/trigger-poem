# Round 13: title screen depth layers (mouse parallax, like the stacked backgrounds of old scrolling games), cursors and
# UI effect sprites. Same world as art/raw/title_bg.png: an empty classroom at sunset, cherry blossoms outside.
CRAFT = ("STYLE: polished anime background / game asset art, warm after-school sunset palette (peach, coral pink, cream, dusky violet shadows), "
         "soft painterly light, crisp clean edges.")
REF = ["art/raw/title_bg.png"]
JOBS = {
    "R13_layers": [
        ("art/raw/title_sky.png", REF,
         "Wide 16:9 painting, the FARTHEST background layer only: a warm pink and orange sunset sky with soft glowing clouds, the sun low near the horizon, "
         "a distant hazy town skyline and rows of blooming cherry trees far away at the bottom. No window, no walls, no room, no people, no text.\n" + CRAFT, "OPAQUE"),
        ("art/raw/title_room.png", REF,
         "The MIDDLE layer of a game title background, 16:9: the inside wall of an empty Japanese classroom at sunset with a big row of tall windows across the right 60%, "
         "window frames, sheer curtains glowing in the light gathered at the window sides, a windowsill with two small black cats sitting on it, the left part a calm cream classroom wall. "
         "IMPORTANT: every window glass area is cut out and fully transparent (we will put the sky behind it), only the frames, curtains, walls and cats are painted. "
         "No people, no text.\n" + CRAFT),
        ("art/raw/title_front_desk.png", REF,
         "A NEAR foreground element for the bottom-right corner of a game title screen, on a fully transparent background: the corner of a wooden school desk seen from slightly above, "
         "a stack of textbooks with a bunny sticker, a pink pencil case, two shiny brass rifle cartridges lying on the desk, a few sakura petals. "
         "The desk corner is cut by the bottom and right edges of the image. No people, no text.\n" + CRAFT),
        ("art/raw/title_front_branch.png", REF,
         "A NEAR foreground element on a fully transparent background: a close-up cherry blossom branch with many pink flowers and buds, entering from the top-left corner, "
         "soft and slightly dreamy (it will be blurred as the nearest depth layer). No text.\n" + CRAFT),
    ],
    "R13_cursor_fx": [
        ("art/raw/ui_cursors.png", ["art/ref/cat_sheet.png"],
         "Game mouse cursor sprite sheet on a fully transparent background, four separate items in one row with wide gaps, each about the same size, flat front view, "
         "thick dark plum outline so it reads on any background: "
         "1) NORMAL: a small cute white fluffy cat paw pointing up-left with its index claw, little red claws, pink paw pads, a tiny red seal circle on the back of the paw; "
         "2) HOVER: the same paw opened wide, pink paw pads glowing with tiny sparkles around; "
         "3) PRESSED: the same paw pressed flat down like a stamp, squashed, with small impact lines; "
         "4) GRAB: the same paw curled closed as if holding something. No text.\n" + CRAFT),
        ("art/raw/ui_fx_sprites.png", [],
         "Game UI particle sprite sheet on a fully transparent background, every sprite separate with wide gaps, flat front view, soft glowing edges suitable for additive blending: "
         "three four-pointed twinkle stars (white-gold, pink, mint), two small glossy pink hearts, two red paw-print stamps, a soft round glowing light orb, "
         "a long soft diagonal light shaft streak, a tiny dust mote, two red ink splashes, a circular burst ring of short pink lines. No text.\n" + CRAFT),
    ],
}
