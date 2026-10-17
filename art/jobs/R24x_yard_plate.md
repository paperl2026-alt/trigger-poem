You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/raw/r24/yard.png
OUTPUT: art/raw/r24x/yard_plate.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 is an approved background painting. This is NOT a redesign task. Output the SAME painting, same size, same camera, pixel for pixel the same, with ONLY the two big near cover objects removed (the one in the bottom-left corner and the one in the bottom-right corner), and the floor, walls and everything behind them painted in naturally, continuing the scene. Everything else stays exactly as it is.
