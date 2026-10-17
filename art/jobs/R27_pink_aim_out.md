You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: public/content/base/assets/pink/aim.webp, public/content/base/assets/pink/cover.webp, art/ref/pink_sheet.png
OUTPUT: art/raw/r27/pink_aim_out.png
Background: transparent
PROMPT:
Reference images 1 to 2 are approved battle sprites of the black-haired twin-tail gunner girl (long wavy black hair with pink and mint ribbons, bunny hair clip, sheer pink frilly lace dress over a pink leotard, mint platform shoes, a pink-and-black rifle with a bunny charm); reference image 3 is her character design sheet. This is NOT a redesign: draw the SAME girl in exactly the same art style, line weight, colours, shading, proportions and scale as the battle sprites, as a NEW battle sprite: kneeling, seen from behind and the side, aiming her rifle toward the LEFT, cheek on the stock, ready to fire. Full body, the whole figure inside the picture, a thin white sticker outline like the reference sprites, transparent background, no text, no effects except the ones described.
