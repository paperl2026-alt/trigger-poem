You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/select_ref.png
OUTPUT: art/raw/r20/sel_ui.png
Background: transparent
PROMPT:
Reference image 1 is an approved game chapter-select screen. This is NOT a redesign task. Output the SAME 16:9 image, same size, with ONLY the user-interface controls kept, exactly where and how they are: the '回到标题' button, the coin counter, the gear tile, the two tabs '队伍' and '书包', 'CHAPTER 0', the chapter title and subtitle lettering, the three stage rows, 'BEST 0', the red '出发！' slab with its white border and black shadow, the dark '第1话' chapter card, the two triangle arrows, the '1P' / '2P' name bars, the mastery rows with their bars, the outfit chips, and the '交换 1P/2P' button with its border and shadow. Do not move or resize anything. Everything else (the background, the panels, the card frames, the girls, the sakura, the red slash lines) removed and fully transparent.
