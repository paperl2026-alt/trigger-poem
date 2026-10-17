# Round 49 (docs/PLAN.md 第八批): the RESULTS screen designed as a manga page (user: "UI 看起来都像是漫画……不要四平八稳的网页风格",
# references: a manga magazine's table of contents and its next-issue preview spread). Mockups first, the user picks, then it is split into
# layers (docs/DESIGN.md: every screen gets a mockup before it is built).
REFS = ["art/ref/ui/manga_preview.webp", "art/ref/ui/manga_contents.png", "art/ref/cat_sheet.png", "art/ref/pink_sheet.png",
        "art/raw/r43/item_pig_c.png", "art/ref/select_ref.png"]
P = ("Reference image 1 is a Japanese manga magazine's next-issue preview spread and reference image 2 a manga magazine's table of contents: "
     "design this game screen in EXACTLY that kind of graphic language: a printed manga page, black ink and white paper with screentone dots, "
     "hatching, speed lines and focus lines, hand-lettered titles, bursts and starbursts, egg / speech-bubble shaped callouts, panel borders, "
     "with ONE spot colour (red, like reference image 6, this game's chapter-select screen). It must NOT look like a web or app UI: no rounded "
     "rectangles, no flat cards, no progress-bar widgets, no icons in boxes, no gradients. "
     "Reference images 3 and 4 are the two heroines (the white-haired cat girl with the ghost paw, the black-haired twin-tail gun girl): draw "
     "them NEW, in manga style, celebrating (dynamic poses: a V sign and a wink, a fist pump, back to back). Reference image 5 is an item: an "
     "eldritch piggy bank. "
     "THE SCREEN (landscape 16:9, 1536 x 864): the RESULTS page shown after clearing a chapter. It must contain, laid out like a magazine page "
     "with panels and callouts: a huge hand-lettered 'CLEAR!!' title; the chapter name '第0话 放学后的限定蜜瓜包' in a manga-magazine title "
     "plate; a callout box 'CLEAR TIME 6:52' with a smaller 'BEST 6:12' and a starburst 'NEW RECORD!'; one panel per heroine with her portrait "
     "and an egg-shaped or bubble callout reading '历战值 +80' with a burst 'LEVEL UP!'; the currency shown as a big sound-effect number "
     "'+720' next to a gold coin and the small word '伍德刀盾'; a small panel with the piggy bank and a starburst 'NEW ITEM!'; a page-turn "
     "style tab at the bottom right reading 'BACK ▶'. Keep every number and word exactly as given, legible, in clear areas (the game will "
     "later write its own numbers into the same spots). ")
JOBS = {"R49_results": [(f"art/raw/r49/results_{v}.png", REFS, P + f"Variation {v}: its own page layout.", "OPAQUE") for v in "abcd"]}
