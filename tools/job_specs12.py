# Round 12: title + settings screen pieces. Lettering = the style the user picked (art/ref/lettering_style1.png):
# chubby round bubble letters, coral pink gradient fill, thick dark plum outline, white glossy highlight stripe, cat ears /
# paw-print dot / bell as small accents. Characters are NOT drawn here (the screen layers approved standing art).
L1 = ("LETTERING STYLE (exactly like the reference image): chubby round bubble letters, coral pink fill with a soft vertical gradient, "
      "a thick dark plum outline, a white glossy highlight stripe on each stroke, a thin white sticker border around the whole word. "
      "Cute and artistic, a game logo look, not a computer font. Every word must be spelled exactly as given, nothing else written anywhere.")
SHEET = ("Transparent background. Each word is a separate sticker with a wide empty gap around it, all words the same letter height, "
         "laid out in a neat grid, perfectly straight (not rotated), flat front view. ")
CRAFT = ("STYLE: polished anime game UI asset art, hand-made craft look, warm after-school sunset palette (cream paper, coral pink, peach, "
         "dusky violet) with red and dark plum accents. Crisp clean edges.")
REF = ["art/ref/lettering_style1.png"]
JOBS = {
    "R12_title": [
        ("art/raw/title_bg.png", ["art/ref/ui_user_mock.png"],
         "Wide 16:9 background painting for a game title screen: inside an empty Japanese high-school classroom at sunset, seen from the back. "
         "The right 55% is a big window wall: cherry blossom trees outside, a warm pink and orange sunset sky with soft clouds, two small black cat silhouettes sitting on the windowsill, "
         "sheer curtains glowing. The left 45% is a calmer, slightly darker cream classroom wall with a chalkboard edge (a big notice board will be placed there later, keep it simple). "
         "A few wooden desks in the lower part, sakura petals drifting, warm light shafts. No people, no characters, no text, no letters, no logos.\n" + CRAFT, "OPAQUE"),
        ("art/raw/ui_corkboard.png", ["art/ref/ui_user_mock.png"],
         "A large empty cork notice board with a light wooden frame, seen perfectly straight-on, portrait proportion 4 wide by 5 tall, "
         "four brass pushpins in the corners, a couple of short washi tape strips and a few sakura petals stuck on the wooden frame. "
         "The cork area itself is completely empty: no papers, no text. Transparent background around the board.\n" + CRAFT),
        ("art/raw/ui_letters_zh.png", REF,
         SHEET + "Eight Chinese words in two columns and four rows: 开始游戏 (draw this one twice as large as the others, with small cat ears on the first character and a paw print), "
         "离开游戏, 设置, 语言, 显示模式, 无边框全屏, 窗口模式, 中文.\n" + L1),
        ("art/raw/ui_letters_ja.png", REF,
         SHEET + "Eight Japanese words in two columns and four rows: スタート (draw this one twice as large as the others, with small cat ears and a paw print), "
         "ゲーム終了, 設定, 言語, 表示モード, フルスクリーン, ウィンドウ, 日本語.\n" + L1),
        ("art/raw/ui_letters_en.png", REF,
         SHEET + "Ten English words in two columns and five rows: START (draw this one twice as large as the others, with small cat ears on the S and a paw print), "
         "QUIT, SETTINGS, LANGUAGE, DISPLAY, FULLSCREEN, WINDOW, English, BGM, SFX.\n" + L1),
        ("art/raw/ui_digits.png", REF,
         "Transparent background. Eleven separate characters in one straight row with wide equal gaps, all the same height: 0 1 2 3 4 5 6 7 8 9 %. "
         "Simple and very readable (no cat ears or extra decorations), flat front view.\n" + L1),
        ("art/raw/ui_logo_zh.png", REF,
         "Transparent background. A game title logo in two lines, centered: a small first line 相对希望少女们的 and a big second line 扣击诗. "
         "Extra decorations woven into the logo: small cat ears on 扣, a brass bullet as an accent, a paw print, a red cord with a bell hanging from the last character, a few sakura petals. "
         "Exactly these characters, nothing else written.\n" + L1),
        ("art/raw/ui_logo_en.png", REF,
         "Transparent background. A game title logo in two lines, centered: a small first line GIRLS OF RELATIVE HOPE and a big second line TRIGGER POEM. "
         "Extra decorations woven into the logo: small cat ears on the T, a brass bullet as an accent, a paw print, a red cord with a bell, a few sakura petals. "
         "Exactly these words, nothing else written.\n" + L1),
        ("art/raw/ui_logo_ja.png", REF,
         "Transparent background. A game title logo in two lines, centered: a small first line 相対希望少女たちの and a big second line 引鉄詩 with small ruby text トリガーポエム above it. "
         "Extra decorations woven into the logo: small cat ears on 引, a brass bullet as an accent, a paw print, a red cord with a bell, a few sakura petals. "
         "Exactly these characters, nothing else written.\n" + L1),
        ("art/raw/ui_icons.png", ["art/ref/ui_user_mock.png"],
         "Game UI sticker sheet on a transparent background, every item separate with wide empty gaps, flat front view, each with a thin white sticker border: "
         "a music note, a speaker with sound waves, a globe, a computer monitor (these four as chunky hand-drawn dark plum doodle icons), "
         "three washi tape strips (pink with sakura, mint with dots, cream with tiny paw prints), three brass pushpins, a red paw-print stamp, "
         "five loose sakura petals, a small smiling white cat face sticker, a small pink heart. No text anywhere.\n" + CRAFT),
    ],
}
