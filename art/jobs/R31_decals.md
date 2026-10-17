You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/corridor_concept.png, art/raw/r28/decals.png
OUTPUT: art/raw/r31/dec_sigils.png
Background: transparent
PROMPT:
Same painting style as reference image 1. A sprite sheet on a transparent background, 3 x 2 grid, one item per cell with empty space around it, flat front-on, no text, no letters. Six DIFFERENT items, each clearly not a copy of another: six different dark violet evil eye sigils painted on a wall, smeared like wet paint: a single eye in a jagged diamond, three eyes in a triangle, an eye with rays like a sun, an eye inside a crescent, a spiral with an eye in the centre, an eye crying drips.

STEP 2
Reference images: art/ref/corridor_concept.png, art/raw/r28/decals.png
OUTPUT: art/raw/r31/dec_banners.png
Background: transparent
PROMPT:
Same painting style as reference image 1. A sprite sheet on a transparent background, 3 x 2 grid, one item per cell with empty space around it, flat front-on, no text, no letters. Six DIFFERENT items, each clearly not a copy of another: six different tall hanging cloth banners in dark violet and crimson with evil eye emblems: a torn one, a long thin pennant, one with tassels, one burnt at the bottom, a pair of eyes, a swallow-tailed one.

STEP 3
Reference images: art/ref/corridor_concept.png, art/raw/r28/decals.png
OUTPUT: art/raw/r31/dec_floor.png
Background: transparent
PROMPT:
Same painting style as reference image 1. A sprite sheet on a transparent background, 3 x 2 grid, one item per cell with empty space around it, flat front-on, no text, no letters. Six DIFFERENT items, each clearly not a copy of another: six different things lying on a floor seen from straight above: scattered test papers, an open school bag spilling pencils, a single indoor shoe, a broken pair of glasses, a pool of glowing violet goo, a trail of goo footprints.

STEP 4
Reference images: art/ref/corridor_concept.png, art/raw/r28/decals.png
OUTPUT: art/raw/r31/dec_wall.png
Background: transparent
PROMPT:
Same painting style as reference image 1. A sprite sheet on a transparent background, 3 x 2 grid, one item per cell with empty space around it, flat front-on, no text, no letters. Six DIFFERENT items, each clearly not a copy of another: six different marks on a wall seen front-on: glowing pink cracks spreading from a point, violet goo dripping down, a torn poster hanging by one pin, deep claw scratches, a splash of violet goo, a cluster of small eye sigils like a rash.
