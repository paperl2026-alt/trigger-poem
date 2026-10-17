You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/raw/r31/wallL4.png, art/raw/r31/wallR2.png
OUTPUT: art/raw/r32/dec_sigils.png
Background: transparent
PROMPT:
Reference images 1 and 2 are pictures of this game's corridor: paint in EXACTLY their style. A sprite sheet on a transparent background, 3 x 2 grid, one item per cell with empty space around it, flat front-on, no text, no letters. NO effects of any kind drawn in: no glow, no light rays, no sparkles, no shine highlights, no magic, no goo, no smoke, no motion lines; the game adds all effects itself. Plain, matte, flat colour base shapes only. Six DIFFERENT items: six different dark violet evil eye sigils painted on a wall like wet paint: a single eye in a jagged diamond, three eyes in a triangle, an eye with spikes like a sun, an eye inside a crescent, a spiral with an eye in the centre, an eye with paint drips.

STEP 2
Reference images: art/raw/r31/wallL4.png, art/raw/r31/wallR2.png
OUTPUT: art/raw/r32/dec_banners.png
Background: transparent
PROMPT:
Reference images 1 and 2 are pictures of this game's corridor: paint in EXACTLY their style. A sprite sheet on a transparent background, 3 x 2 grid, one item per cell with empty space around it, flat front-on, no text, no letters. NO effects of any kind drawn in: no glow, no light rays, no sparkles, no shine highlights, no magic, no goo, no smoke, no motion lines; the game adds all effects itself. Plain, matte, flat colour base shapes only. Six DIFFERENT items: six different tall hanging cloth banners in dark violet and crimson with an eye emblem: a torn one, a long thin pennant, one with tassels, one ragged at the bottom, one with a pair of eyes, a swallow-tailed one.

STEP 3
Reference images: art/raw/r31/wallL4.png, art/raw/r31/wallR2.png
OUTPUT: art/raw/r32/dec_floor.png
Background: transparent
PROMPT:
Reference images 1 and 2 are pictures of this game's corridor: paint in EXACTLY their style. A sprite sheet on a transparent background, 3 x 2 grid, one item per cell with empty space around it, flat front-on, no text, no letters. NO effects of any kind drawn in: no glow, no light rays, no sparkles, no shine highlights, no magic, no goo, no smoke, no motion lines; the game adds all effects itself. Plain, matte, flat colour base shapes only. Six DIFFERENT items: six different things lying on a floor seen from straight above: scattered test papers, an open school bag spilling pencils, a single indoor shoe, a broken pair of glasses, a puddle of dark violet goo (matte, flat colour), a trail of goo footprints.

STEP 4
Reference images: art/raw/r31/wallL4.png, art/raw/r31/wallR2.png
OUTPUT: art/raw/r32/dec_wall.png
Background: transparent
PROMPT:
Reference images 1 and 2 are pictures of this game's corridor: paint in EXACTLY their style. A sprite sheet on a transparent background, 3 x 2 grid, one item per cell with empty space around it, flat front-on, no text, no letters. NO effects of any kind drawn in: no glow, no light rays, no sparkles, no shine highlights, no magic, no goo, no smoke, no motion lines; the game adds all effects itself. Plain, matte, flat colour base shapes only. Six DIFFERENT items: six different marks on a wall seen front-on: dark crack lines spreading from a point, dark violet paint dripping down, a torn poster hanging by one pin, deep claw scratches, a splash of dark violet paint, a cluster of small eye sigils like a rash.
