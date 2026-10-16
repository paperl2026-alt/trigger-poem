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
OUTPUT: art/raw/r20/sel_plate.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 is an approved game chapter-select screen. This is NOT a redesign task. Output the SAME 16:9 image, pixel for pixel the same composition, shapes, colors and graphic style, with ONLY these removed: both girls inside the two character cards (paint the cards' red halftone backgrounds behind them), the dark '第1话' chapter card in the middle with its house picture (continue the white panel edge and the background behind it), and every piece of text, icon and control: the '回到标题' button, the coin counter, the gear, the two tabs '队伍' and '书包', 'CHAPTER 0' and the chapter title and subtitle text, the three stage rows, 'BEST 0', the red '出发！' slab, the two left / right arrows, the '1P' / '2P' name bars, the mastery rows with their bars, the outfit chips and the '交换 1P/2P' button. Where those were, continue the clean off-white panels, the white card bodies and the background. Keep the big tilted off-white chapter panel with its grunge edges and the red slash lines under the title, the white team panel with the two empty card frames and their red halftone windows, the sakura, the city silhouettes and the red and black background.

STEP 2
Reference images: art/ref/select_ref.png
OUTPUT: art/raw/r20/sel_cat.png
Background: transparent
PROMPT:
Reference image 1 is an approved game chapter-select screen. This is NOT a redesign task. Output the SAME 16:9 image with ONLY the white-haired cat girl inside the left character card kept, exactly as she is drawn there (same pose looking back over her shoulder, same face, glasses, ears, bell, braid, the white fur paw with red claws, clothes), at exactly the same position and size, pixel for pixel. Do not move, redraw, restyle or re-pose her and do not continue her beyond what is visible. Everything else removed and fully transparent.

STEP 3
Reference images: art/ref/select_ref.png
OUTPUT: art/raw/r20/sel_pink.png
Background: transparent
PROMPT:
Reference image 1 is an approved game chapter-select screen. This is NOT a redesign task. Output the SAME 16:9 image with ONLY the black-haired twin-tail girl inside the right character card kept, together with the pink-and-black gatling gun she hugs, exactly as drawn there (same winking grin, ribbons, bunny clip, hearts, frilly dress), at exactly the same position and size, pixel for pixel. Do not move, redraw, restyle or re-pose her and do not continue her beyond what is visible. Everything else removed and fully transparent.

STEP 4
Reference images: art/ref/select_parts/next_card.png
OUTPUT: art/raw/r20/sel_next.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the dark grey chapter card with its black-and-white haunted house picture and its jagged white border exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. Remove the text '第1话', '甜蜜之家', '制作中' and the padlock icon, and continue the house picture behind them.
