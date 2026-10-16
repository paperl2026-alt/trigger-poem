# Round 18: mockups of the chapter-select screen in the approved red / black / white title style (art/ref/ui_p5.png),
# for the user to choose / approve BEFORE anything is built (same method as the title: the approved mockup is the standard).
MOCK = "art/ref/ui_p5.png"
STYLE = ("Reference image 1 is the approved title / settings screen of this game. Design the NEXT screen of the same game, the chapter-select "
         "screen, in exactly the same visual language: the same bold red / black / white Persona-5-like comic style, the same off-white grunge paper "
         "panels with jagged black-and-white shard edges, red halftone dots, the same slanted red and black slab buttons with a white border and a black "
         "drop shadow, the same heavy black sans-serif Chinese lettering, the same icons style. The two girls are exactly the two girls of reference image 1 "
         "(the white-haired cat girl with red glasses, cat ears, a bell and a big white fur paw arm with red claws; the black-haired girl with pink and mint "
         "ribbons, bunny hair clip and a pink frilly dress), same faces, same outfits. 16:9, 1672x941. All text in Simplified Chinese exactly as written below, "
         "nothing else written. ")
CONTENT = ("Content: a top bar with a slanted black button '◀ 回到标题' at the top left, a coin counter '1,280' and a gear icon at the top right. "
           "The current chapter: big 'CHAPTER 0', title '第0话 放学后的限定蜜瓜包', subtitle '教学关 · 文化祭鬼屋失控', a list of three stages "
           "'1  3年A班 鬼屋', '2  文化祭走廊', and a skull-marked boss row 'BOSS  暴走吉祥物花车', a small 'BEST 0' score, and a big red slanted "
           "slab button '出发！'. The next chapter shown locked: '第1话 甜蜜之家' with a padlock and '制作中'. Left / right arrows to switch chapters. "
           "Two tabs '队伍' (selected) and '书包'. Two character cards: '1P 神乐 · 灵能猫爪' (the cat girl) and '2P 椿 · 物理净化' (the black-haired girl), "
           "each with '熟练度 Lv1' and a red progress bar, two outfit chips '制服' (selected) and '满破形态' (locked, padlock), and one button '交换 1P/2P'. ")
JOBS = {
    "R18_select": [
        ("art/raw/r18/select_a.png", [MOCK], STYLE + CONTENT +
         "Layout A: the chapter as a big tilted off-white panel on the left half (stage list, best score, the big red '出发！' slab at its bottom), the locked "
         "next chapter as a smaller dark card peeking out behind it, the arrows at its sides; on the right half the two tabs and the two character cards "
         "side by side, each card showing its girl from the waist up, overlapping the card's top edge.", "OPAQUE"),
        ("art/raw/r18/select_b.png", [MOCK], STYLE + CONTENT +
         "Layout B: the chapters as a row of big slanted cards across the upper half (chapter 0 large and highlighted in front, chapter 1 dark and locked "
         "beside it, arrows at both ends), the stage list and the '出发！' slab under the highlighted card; the two girls standing large on the right, "
         "with their two compact character cards and the tabs along the bottom right.", "OPAQUE"),
    ],
}
