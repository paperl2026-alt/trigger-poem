You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: public/content/base/assets/hud/flash_rifle.webp
OUTPUT: art/raw/r35/fx_pink.png
Background: transparent
PROMPT:
Reference image 1 is the current effect sprite of this game (style: bold anime effect art, clean shapes, bright). Draw a sprite sheet on a transparent background, 3 x 2 grid, six DIFFERENT muzzle flashes of a cute pink gun, each centred in its cell with empty space around it, no text, no letters. Hot pink and white star-burst petals pointing to the RIGHT (the shot goes right), each shape clearly different.

STEP 2
Reference images: public/content/base/assets/hud/flash_rifle.webp
OUTPUT: art/raw/r35/fx_pink_fever.png
Background: transparent
PROMPT:
Reference image 1 is the current effect sprite of this game (style: bold anime effect art, clean shapes, bright). Draw a sprite sheet on a transparent background, 3 x 2 grid, six DIFFERENT FEVER muzzle flashes of a cute pink gun, each centred in its cell with empty space around it, no text, no letters. Much more ornate than normal ones: deeper magenta and white, layered petals, little hearts and ribbon curls, pointing to the RIGHT.

STEP 3
Reference images: public/content/base/assets/hud/flash_mantra.webp
OUTPUT: art/raw/r35/fx_cat.png
Background: transparent
PROMPT:
Reference image 1 is the current effect sprite of this game (style: bold anime effect art, clean shapes, bright). Draw a sprite sheet on a transparent background, 3 x 2 grid, six DIFFERENT strike bursts of a ghost paw casting a mantra, each centred in its cell with empty space around it, no text, no letters. Gold and violet: a paw-shaped shock burst, a seal circle breaking open, talisman shreds, each clearly different.

STEP 4
Reference images: public/content/base/assets/hud/flash_mantra.webp
OUTPUT: art/raw/r35/fx_cat_fever.png
Background: transparent
PROMPT:
Reference image 1 is the current effect sprite of this game (style: bold anime effect art, clean shapes, bright). Draw a sprite sheet on a transparent background, 3 x 2 grid, six DIFFERENT FEVER strike bursts of a ghost paw casting a mantra, each centred in its cell with empty space around it, no text, no letters. Much more ornate: violet and gold flames in an unnatural colour, double seal circles, paw prints, talisman ribbons.

STEP 5
Reference images: public/content/base/assets/hud/flash_rifle.webp
OUTPUT: art/raw/r35/fx_hit.png
Background: transparent
PROMPT:
Reference image 1 is the current effect sprite of this game (style: bold anime effect art, clean shapes, bright). Draw a sprite sheet on a transparent background, 3 x 2 grid, six DIFFERENT hit impact bursts (a shot hitting a monster), each centred in its cell with empty space around it, no text, no letters. Three in hot pink and white (bullets), three in gold and violet (mantra spells); sharp star shapes, splinters, rings.
