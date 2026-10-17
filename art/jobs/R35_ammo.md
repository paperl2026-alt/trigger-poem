You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/raw/r33/hud_a.png, art/ref/cat_sheet.png
OUTPUT: art/raw/r35/talisman_a.png
Background: transparent
PROMPT:
Reference image 1 is the approved battle HUD of this game (red / black / white, Persona-5-like, cute). Reference image 2 is the white-haired cat girl, whose shots are mantra spells cast with her ghost paw. Design her AMMO GAUGE: 8 shots shown as 8 TALISMANS (paper charms). Draw a sprite sheet on a transparent background, 3 x 2 grid, each cell centred, no other text than the brush marks on the talismans: 1 one talisman READY (bright, crisp), 2 one talisman SPENT (burnt to ash at one end, torn, dark), 3 one talisman glowing for her endless special (the same talisman, light pouring from it is NOT drawn, only its brighter colours), 4 a row of 8 ready talismans laid out as a gauge that fits under her HUD panel, 5 the same row with 5 ready and 3 spent, 6 the same row all spent. Every talisman in the sheet is the SAME design. Design direction: a classic tall yellow ofuda paper slip with a red brush seal and red brush strokes, a little red tassel at the bottom.

STEP 2
Reference images: art/raw/r33/hud_a.png, art/ref/cat_sheet.png
OUTPUT: art/raw/r35/talisman_b.png
Background: transparent
PROMPT:
Reference image 1 is the approved battle HUD of this game (red / black / white, Persona-5-like, cute). Reference image 2 is the white-haired cat girl, whose shots are mantra spells cast with her ghost paw. Design her AMMO GAUGE: 8 shots shown as 8 TALISMANS (paper charms). Draw a sprite sheet on a transparent background, 3 x 2 grid, each cell centred, no other text than the brush marks on the talismans: 1 one talisman READY (bright, crisp), 2 one talisman SPENT (burnt to ash at one end, torn, dark), 3 one talisman glowing for her endless special (the same talisman, light pouring from it is NOT drawn, only its brighter colours), 4 a row of 8 ready talismans laid out as a gauge that fits under her HUD panel, 5 the same row with 5 ready and 3 spent, 6 the same row all spent. Every talisman in the sheet is the SAME design. Design direction: a small square paper charm with a pink paw-print seal in the middle, a tiny golden bell tied on with a red string.

STEP 3
Reference images: art/raw/r33/hud_a.png, art/ref/cat_sheet.png
OUTPUT: art/raw/r35/talisman_c.png
Background: transparent
PROMPT:
Reference image 1 is the approved battle HUD of this game (red / black / white, Persona-5-like, cute). Reference image 2 is the white-haired cat girl, whose shots are mantra spells cast with her ghost paw. Design her AMMO GAUGE: 8 shots shown as 8 TALISMANS (paper charms). Draw a sprite sheet on a transparent background, 3 x 2 grid, each cell centred, no other text than the brush marks on the talismans: 1 one talisman READY (bright, crisp), 2 one talisman SPENT (burnt to ash at one end, torn, dark), 3 one talisman glowing for her endless special (the same talisman, light pouring from it is NOT drawn, only its brighter colours), 4 a row of 8 ready talismans laid out as a gauge that fits under her HUD panel, 5 the same row with 5 ready and 3 spent, 6 the same row all spent. Every talisman in the sheet is the SAME design. Design direction: a slim white paper talisman folded at the top like origami, a red circular seal, violet ink brush strokes, a frayed edge.
