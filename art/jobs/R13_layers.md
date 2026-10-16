You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/raw/title_bg.png
OUTPUT: art/raw/title_sky.png
Background: OPAQUE (do not request transparency)
PROMPT:
Wide 16:9 painting, the FARTHEST background layer only: a warm pink and orange sunset sky with soft glowing clouds, the sun low near the horizon, a distant hazy town skyline and rows of blooming cherry trees far away at the bottom. No window, no walls, no room, no people, no text.
STYLE: polished anime background / game asset art, warm after-school sunset palette (peach, coral pink, cream, dusky violet shadows), soft painterly light, crisp clean edges.

STEP 2
Reference images: art/raw/title_bg.png
OUTPUT: art/raw/title_room.png
Background: transparent
PROMPT:
The MIDDLE layer of a game title background, 16:9: the inside wall of an empty Japanese classroom at sunset with a big row of tall windows across the right 60%, window frames, sheer curtains glowing in the light gathered at the window sides, a windowsill with two small black cats sitting on it, the left part a calm cream classroom wall. IMPORTANT: every window glass area is cut out and fully transparent (we will put the sky behind it), only the frames, curtains, walls and cats are painted. No people, no text.
STYLE: polished anime background / game asset art, warm after-school sunset palette (peach, coral pink, cream, dusky violet shadows), soft painterly light, crisp clean edges.

STEP 3
Reference images: art/raw/title_bg.png
OUTPUT: art/raw/title_front_desk.png
Background: transparent
PROMPT:
A NEAR foreground element for the bottom-right corner of a game title screen, on a fully transparent background: the corner of a wooden school desk seen from slightly above, a stack of textbooks with a bunny sticker, a pink pencil case, two shiny brass rifle cartridges lying on the desk, a few sakura petals. The desk corner is cut by the bottom and right edges of the image. No people, no text.
STYLE: polished anime background / game asset art, warm after-school sunset palette (peach, coral pink, cream, dusky violet shadows), soft painterly light, crisp clean edges.

STEP 4
Reference images: art/raw/title_bg.png
OUTPUT: art/raw/title_front_branch.png
Background: transparent
PROMPT:
A NEAR foreground element on a fully transparent background: a close-up cherry blossom branch with many pink flowers and buds, entering from the top-left corner, soft and slightly dreamy (it will be blurred as the nearest depth layer). No text.
STYLE: polished anime background / game asset art, warm after-school sunset palette (peach, coral pink, cream, dusky violet shadows), soft painterly light, crisp clean edges.
