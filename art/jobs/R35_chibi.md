You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/hud/parts/a_pink_face.png, art/ref/hud/parts/c_pink_face.png
OUTPUT: art/raw/r35/chibi_pink1.png
Background: transparent
PROMPT:
Reference image 1 shows the approved CHIBI sticker portrait of this character from the game HUD: copy EXACTLY this chibi style (super-deformed big head, line weight, colouring, thick white sticker outline) and this character's look. Draw a sprite sheet on a transparent background, 4 x 3 grid, twelve DIFFERENT expressions of this same chibi character, one per cell, each a head-and-shoulders bust centred so it fits inside a round frame, all at the same size. Manga symbols (sweat drops, tears, swirl eyes, sparkle eyes, anger marks, blush lines, little hearts) are welcome as part of the face. No text, no letters. Very cute, exaggerated, lively. The twelve, left to right, top to bottom: 1 calm smug grin, 2 focused shooting squint with tongue poking out, 3 wild excited shouting while shooting, 4 'ouch!' one eye shut with a small tear, 5 crying with waterfall tears, 6 cheering fist pump with sparkles (combo up), 7 fired up with flames in her eyes (Fever), 8 sparkling star eyes and drooling (special ready), 9 roaring with a huge open mouth (special on), 10 busy pout with a sweat drop (reloading), 11 blank shocked eyes with shock lines (out of ammo), 12 knocked out with swirl eyes and a little ghost floating out.

STEP 2
Reference images: art/ref/hud/parts/a_pink_face.png, art/ref/hud/parts/c_pink_face.png
OUTPUT: art/raw/r35/chibi_pink2.png
Background: transparent
PROMPT:
Reference image 1 shows the approved CHIBI sticker portrait of this character from the game HUD: copy EXACTLY this chibi style (super-deformed big head, line weight, colouring, thick white sticker outline) and this character's look. Draw a sprite sheet on a transparent background, 4 x 3 grid, twelve DIFFERENT expressions of this same chibi character, one per cell, each a head-and-shoulders bust centred so it fits inside a round frame, all at the same size. Manga symbols (sweat drops, tears, swirl eyes, sparkle eyes, anger marks, blush lines, little hearts) are welcome as part of the face. No text, no letters. Very cute, exaggerated, lively. The twelve, left to right, top to bottom: 1 humming happily with eyes closed (walking), 2 out of breath with a sweat drop and tongue out (running), 3 nervously peeking (in cover), 4 bored yawn, 5 victory V sign with a wink, 6 smug 'ohoho' laugh with a hand at the mouth, 7 angry puffed cheeks, 8 scared with tiny pupils, 9 embarrassed deep blush, 10 sleepy drooping eyes, 11 heart eyes, 12 determined serious face with a sweat drop.

STEP 3
Reference images: art/ref/hud/parts/a_cat_face.png, art/ref/hud/parts/c_cat_face.png
OUTPUT: art/raw/r35/chibi_cat1.png
Background: transparent
PROMPT:
Reference image 1 shows the approved CHIBI sticker portrait of this character from the game HUD: copy EXACTLY this chibi style (super-deformed big head, line weight, colouring, thick white sticker outline) and this character's look. Draw a sprite sheet on a transparent background, 4 x 3 grid, twelve DIFFERENT expressions of this same chibi character, one per cell, each a head-and-shoulders bust centred so it fits inside a round frame, all at the same size. Manga symbols (sweat drops, tears, swirl eyes, sparkle eyes, anger marks, blush lines, little hearts) are welcome as part of the face. No text, no letters. Very cute, exaggerated, lively. The twelve, left to right, top to bottom: 1 calm smug grin, 2 focused shooting squint with tongue poking out, 3 wild excited shouting while shooting, 4 'ouch!' one eye shut with a small tear, 5 crying with waterfall tears, 6 cheering fist pump with sparkles (combo up), 7 fired up with flames in her eyes (Fever), 8 sparkling star eyes and drooling (special ready), 9 roaring with a huge open mouth (special on), 10 busy pout with a sweat drop (reloading), 11 blank shocked eyes with shock lines (out of ammo), 12 knocked out with swirl eyes and a little ghost floating out. She keeps her cat ears, red glasses, bell and white fur paw in every cell.

STEP 4
Reference images: art/ref/hud/parts/a_cat_face.png, art/ref/hud/parts/c_cat_face.png
OUTPUT: art/raw/r35/chibi_cat2.png
Background: transparent
PROMPT:
Reference image 1 shows the approved CHIBI sticker portrait of this character from the game HUD: copy EXACTLY this chibi style (super-deformed big head, line weight, colouring, thick white sticker outline) and this character's look. Draw a sprite sheet on a transparent background, 4 x 3 grid, twelve DIFFERENT expressions of this same chibi character, one per cell, each a head-and-shoulders bust centred so it fits inside a round frame, all at the same size. Manga symbols (sweat drops, tears, swirl eyes, sparkle eyes, anger marks, blush lines, little hearts) are welcome as part of the face. No text, no letters. Very cute, exaggerated, lively. The twelve, left to right, top to bottom: 1 humming happily with eyes closed (walking), 2 out of breath with a sweat drop and tongue out (running), 3 nervously peeking (in cover), 4 bored yawn, 5 victory V sign with a wink, 6 smug 'ohoho' laugh with a hand at the mouth, 7 angry puffed cheeks, 8 scared with tiny pupils, 9 embarrassed deep blush, 10 sleepy drooping eyes, 11 heart eyes, 12 determined serious face with a sweat drop. She keeps her cat ears, red glasses, bell and white fur paw in every cell.
