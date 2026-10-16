You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/cat_sheet.png
OUTPUT: art/raw/ui_cursors.png
Background: transparent
PROMPT:
Game mouse cursor sprite sheet on a fully transparent background, four separate items in one row with wide gaps, each about the same size, flat front view, thick dark plum outline so it reads on any background: 1) NORMAL: a small cute white fluffy cat paw pointing up-left with its index claw, little red claws, pink paw pads, a tiny red seal circle on the back of the paw; 2) HOVER: the same paw opened wide, pink paw pads glowing with tiny sparkles around; 3) PRESSED: the same paw pressed flat down like a stamp, squashed, with small impact lines; 4) GRAB: the same paw curled closed as if holding something. No text.
STYLE: polished anime background / game asset art, warm after-school sunset palette (peach, coral pink, cream, dusky violet shadows), soft painterly light, crisp clean edges.

STEP 2
Reference images: (none)
OUTPUT: art/raw/ui_fx_sprites.png
Background: transparent
PROMPT:
Game UI particle sprite sheet on a fully transparent background, every sprite separate with wide gaps, flat front view, soft glowing edges suitable for additive blending: three four-pointed twinkle stars (white-gold, pink, mint), two small glossy pink hearts, two red paw-print stamps, a soft round glowing light orb, a long soft diagonal light shaft streak, a tiny dust mote, two red ink splashes, a circular burst ring of short pink lines. No text.
STYLE: polished anime background / game asset art, warm after-school sunset palette (peach, coral pink, cream, dusky violet shadows), soft painterly light, crisp clean edges.
