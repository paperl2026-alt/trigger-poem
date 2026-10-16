You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/ui_p5.png
OUTPUT: art/raw/r15/p5_plate.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 is an approved game title / settings screen. This is NOT a redesign task. Output the SAME 16:9 image, pixel for pixel the same composition, shapes, colors and graphic style, with ONLY these removed: both girls (paint the red and black shapes behind them naturally), and every UI element drawn on the white panel (the gear icon, all text, the red header slash, the speaker / globe / monitor icons, the toggles, sliders, percentages, the grey separator lines, the language and display tab bars, the red START slab and the black QUIT slab). Fill where the UI was with the same clean off-white panel; where the START / QUIT slabs were, continue the panel and the black-and-white jagged shards around it. Keep the white panel's exact outline and grunge edges, the white sakura, the city skyline and the ink flecks.
