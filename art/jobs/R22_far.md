You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/raw/r22/outside_magenta.png
OUTPUT: art/raw/r22/corridor_far.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 shows the view through some windows (sky, clouds, buildings, trees, a fence and a red running track at sunset); everything else has been painted solid magenta (#FF00FF). This is NOT a redesign task. Output the SAME image, same size, with ONLY the magenta areas repainted: continue the outside landscape seen through the windows across the whole frame, in the same light, colours, painting style, perspective and scale, as if there were no wall and no window frames: more sky and clouds above, the buildings, trees, fence and running track continuing left and down. No window frames, no curtains, no corridor, no text. Everything that is not magenta stays exactly as it is, pixel for pixel.
