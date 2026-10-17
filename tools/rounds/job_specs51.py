# Round 51 (docs/PLAN.md 第八批「结算界面漫画化」): ONLY the pictures for the results page. The page layout is fixed by the game
# (the user: "我专门找那种十分规则规整的结算页面，便于列表和元素扩充……你是 harness"): a manga-magazine table of contents (art/ref/ui/
# manga_contents.png): masthead, a vertical RESULT bar, regular entry rows (square thumbnail + lines + dotted leader + number), a
# 特集 bar with one row per new item, a two-column list of numbers. Every word and number is written by the game; these pictures have
# NO lettering at all. Each picture goes into a box of a fixed shape: the cover panel 2:3 portrait, the thumbnails square.
NOTEXT = ("ABSOLUTELY NO TEXT ANYWHERE: no letters, no numbers, no Japanese or Chinese characters, no sound-effect lettering, no speech "
          "bubbles, no captions, no signature, no logo, no watermark, no panel border, no frame (the game draws its own border). ")
INK = ("Style: a printed Japanese manga page, black ink line art on white paper, screentone dots for shading, crisp confident lines, "
       "with ONE spot colour only, a strong red (#d8141e), used sparingly for accents (eyes, ribbons, claws, a few hearts). No other "
       "colours, no gradients, no painterly rendering, no glow. ")
CAT = ("THE CAT GIRL (reference image 1, draw her NEW, do not copy a pose): white messy hair, white cat ears, red-framed glasses, red "
       "eyes, a little bell and a red knotted cord in her hair, a white kimono-like top with wide sleeves and a black obi sash with red "
       "cords, a white fluffy cat tail; her right arm ends in a big white fluffy ghost cat paw with red claws, and on the BACK of that "
       "paw sits the red seal of reference image 3 (red circle, five-pointed star, four small glyphs on the ring, three diamond tips, a "
       "hanging cloud knot and tassel) drawn exactly like reference image 3. ")
PINK = ("THE GUN GIRL (reference image 2, draw her NEW, do not copy a pose): long black hair in twin tails with big pink-white bows, a "
        "white bunny hair clip and a pink bandage hair pin, red eyes, a frilly pastel lolita (jirai-kei) dress with lace and a big bow "
        "on the chest, a heart pendant, a black-and-pink handgun. ")
COVER = ("A full-page manga illustration for the CLEAR page of a game, PORTRAIT 2:3 (1024 x 1536). " + CAT + PINK +
         "THE SCENE: the two of them celebrating a victory together, close to the viewer, from the knees up, filling the page: the cat "
         "girl in front on the left with a big grin and one eye winking, giving a V sign with her normal left hand and raising the ghost "
         "paw (its back with the seal toward the viewer); the gun girl just behind her on the right, laughing, one fist pumped in the air, "
         "the handgun held up safely in the other hand. Both faces in the upper half, fully visible, nothing important within 6% of any "
         "edge (the edges may be trimmed). Background: white paper with radiating speed lines from behind them, a few screentone "
         "bursts, a few small red hearts and sparkles, a hint of a school rooftop and sky in screentone at the very top. " + INK + NOTEXT)
FACE = ("A square thumbnail portrait (1024 x 1024) like the small character pictures beside each entry of a manga magazine's table of "
        "contents (reference image {r}): head and shoulders only, facing slightly to the side, centred, the head filling about 70% of the "
        "square, plain white background with a light screentone patch behind the head, simple and clean, readable when shown very "
        "small. ")
PIG = ("A square thumbnail (1024 x 1024) like the small pictures beside each entry of a manga magazine's table of contents (reference "
       "image 2): THE ELDRITCH PIGGY BANK of reference image 1 (a round pink piggy bank with many red eyes, a fanged mouth biting a gold "
       "coin, little tentacles, cracks), drawn NEW as manga ink art, three-quarter view, centred, filling about 75% of the square, on "
       "plain white paper with a small screentone burst behind it, a couple of sparkles. ")
R = {"cat": "art/ref/cat_sheet.png", "pink": "art/ref/pink_sheet.png", "seal": "art/ref/cat_seal_decal.png",
     "toc": "art/ref/ui/manga_contents.png", "spread": "art/ref/ui/manga_preview.webp", "pig": "art/raw/r43/item_pig_c.png"}
JOBS = {
    "R51_cover": [(f"art/raw/r51/cover_{v}.png", [R["cat"], R["pink"], R["seal"], R["spread"], R["toc"]],
                   "Reference images 4 and 5 are manga magazine pages: match their ink, screentone and line quality. " + COVER
                   + f"Variation {v}: its own pose details and camera angle.", "OPAQUE") for v in "abc"],
    "R51_thumbs": [
        *[(f"art/raw/r51/face_cat_{v}.png", [R["cat"], R["toc"], R["seal"]],
           FACE.format(r=2) + CAT + "Only her head and shoulders: the paw is not in the picture. "
           f"Expression: {e}. " + INK + NOTEXT, "OPAQUE") for v, e in (("a", "a big happy grin with one eye winking"), ("b", "a proud smug smile, fang showing"))],
        *[(f"art/raw/r51/face_pink_{v}.png", [R["pink"], R["toc"]],
           FACE.format(r=2) + PINK.replace("reference image 2", "reference image 1") + "Only her head and shoulders. "
           f"Expression: {e}. " + INK + NOTEXT, "OPAQUE") for v, e in (("a", "laughing with one eye winking"), ("b", "a sweet smile with a little heart near her cheek"))],
        *[(f"art/raw/r51/item_pig_{v}.png", [R["pig"], R["toc"]], PIG + INK + NOTEXT + f"Variation {v}.", "OPAQUE") for v in "ab"],
    ],
}
