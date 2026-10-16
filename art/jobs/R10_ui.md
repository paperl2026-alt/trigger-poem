You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/ui_paper.png, art/ref/ui_p5.png, art/ref/cat_sheet.png, art/ref/pink_sheet.png
OUTPUT: art/raw/ui_mock_A.png
Background: OPAQUE (do not request transparency)
PROMPT:
Full-screen 16:9 title-and-settings screen of an anime light-gun shooter game, one single finished UI mockup image.
COMPOSITION (from reference 2): a bold diagonal split. The left 45% holds the menu: tilted torn-paper slips stacked top to bottom (BGM row, SFX row, language row 中文 / 日本語 / English, display row 无边框全屏 / 窗口模式), and at the lower left a huge torn paper sheet with 开始游戏 tied with red cord. A small 离开游戏 paper tag at the very bottom-left corner. A wide diagonal band of halftone dots and ink splatter separates it from the right side. The right 55%: the two heroines waist-up, leaning together on a classroom desk by a window at sunset, relaxed and cute.
MATERIALS (from reference 1): every UI element is a hand-made physical craft object: torn notebook and drawing paper with fibrous edges, washi tape strips, red silk cord with tassels, a brass cat bell as the BGM slider knob, a row of brass bullets as the SFX volume bar with a bunny sticker as its knob, bunny-face ON/OFF stickers as toggles, red paw-print stamps, a few sakura petals. Absolutely no flat vector widgets, no phone-style toggle switches, no plain line sliders, no icon fonts.
TEXT: hand-lettered Chinese labels drawn on the paper with brush pen and marker, chunky and playful, each label clearly readable: 开始游戏, BGM, SFX, 中文, 日本語, English, 无边框全屏, 窗口模式, 离开游戏, 70%, 80%. The lettering is hand-drawn, not a standard computer font.
CHARACTERS: the two heroines exactly as designed in references 3 and 4 (the white-haired cat-eared girl with red glasses, braid, bell hair ornament and the big white furry cat-paw right arm with red claws; the girl with very long black twin tails, pink and mint ribbons, bunny hair clip and pink frilly sheer outfit). Both are 18-year-old young women.
LAYOUT RULES: clean and readable despite the craft materials. Generous spacing, every element large, few elements, nothing overlapping the faces. Clear hierarchy: 开始游戏 is by far the biggest and most eye-catching, the settings rows are medium, 离开游戏 is a small tag in a corner.
STYLE: polished anime key-visual quality, loud and playful, warm after-school sunset palette (peach, coral pink, cream paper, dusky violet shadows) with red and black accents for punch.

STEP 2
Reference images: art/ref/ui_paper.png, art/ref/ui_p5.png, art/ref/cat_sheet.png, art/ref/pink_sheet.png
OUTPUT: art/raw/ui_mock_B.png
Background: OPAQUE (do not request transparency)
PROMPT:
Full-screen 16:9 title-and-settings screen of an anime light-gun shooter game, one single finished UI mockup image.
COMPOSITION (from reference 2): the right 50% is a big dynamic half-body shot of the two heroines side by side against a sunset classroom window, the cat-eared girl in front adjusting her glasses with her normal hand, the twin-tail girl behind her resting her cheek on her hand. The left 50% is a big cork board at a slant, with the menu pinned on it as torn paper slips and sticky notes: BGM row, SFX row, language row 中文 / 日本語 / English, display row 无边框全屏 / 窗口模式, and across the lower part a huge torn sheet with 开始游戏 held by washi tape and a red cord. A small 离开游戏 tag hangs from a pushpin in the bottom-left corner. Strong diagonal red and black paint strokes with halftone dots frame the board.
MATERIALS (from reference 1): every UI element is a hand-made physical craft object: torn notebook and drawing paper with fibrous edges, washi tape strips, red silk cord with tassels, a brass cat bell as the BGM slider knob, a row of brass bullets as the SFX volume bar with a bunny sticker as its knob, bunny-face ON/OFF stickers as toggles, red paw-print stamps, a few sakura petals. Absolutely no flat vector widgets, no phone-style toggle switches, no plain line sliders, no icon fonts.
TEXT: hand-lettered Chinese labels drawn on the paper with brush pen and marker, chunky and playful, each label clearly readable: 开始游戏, BGM, SFX, 中文, 日本語, English, 无边框全屏, 窗口模式, 离开游戏, 70%, 80%. The lettering is hand-drawn, not a standard computer font.
CHARACTERS: the two heroines exactly as designed in references 3 and 4 (the white-haired cat-eared girl with red glasses, braid, bell hair ornament and the big white furry cat-paw right arm with red claws; the girl with very long black twin tails, pink and mint ribbons, bunny hair clip and pink frilly sheer outfit). Both are 18-year-old young women.
LAYOUT RULES: clean and readable despite the craft materials. Generous spacing, every element large, few elements, nothing overlapping the faces. Clear hierarchy: 开始游戏 is by far the biggest and most eye-catching, the settings rows are medium, 离开游戏 is a small tag in a corner.
STYLE: polished anime key-visual quality, loud and playful, warm after-school sunset palette (peach, coral pink, cream paper, dusky violet shadows) with red and black accents for punch.
