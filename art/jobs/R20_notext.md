You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/select_parts/notext_magenta.png
OUTPUT: art/raw/r20/sel_notext.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 is an approved game screen on which the lettering, numbers, icons, small pictures and bars have been painted solid magenta (#FF00FF). This is NOT a redesign task. Output the SAME 16:9 image, same size, with ONLY the magenta pixels repainted: continue exactly the surface each magenta area sits on, as if nothing had ever been written or drawn there: the red slabs with their red halftone dots and grunge, the black slabs and bars, the white bars and panels with their faint paper texture, the grey and red chips, the card bodies, the panel paper, the background. Do not add any text, letters, numbers, icons, pictures or objects. Everything that is not magenta must stay exactly as it is, pixel for pixel.
