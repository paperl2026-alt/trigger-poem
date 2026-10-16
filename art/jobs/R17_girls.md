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
OUTPUT: art/raw/r17/girls_ref.png
Background: transparent
PROMPT:
Reference image 1 is an approved game title / settings screen. This is NOT a redesign task. Output the SAME 16:9 image with ONLY the two anime girls kept, exactly as they are drawn in reference image 1: the same pose, the same faces, hair, ears, glasses, hands, the raised white fur paw arm with red claws, clothes, bells, ribbons and colors, at exactly the same position and size in the frame, pixel for pixel. Do not move, redraw, restyle or re-pose them. Where a small part of a girl is hidden behind the black city silhouette at the bottom or behind the white sakura flowers, continue that part of the girl as it obviously continues. Everything else (the white settings panel with all its UI, the red and black background, the sakura, the city silhouette, the ink flecks) removed and fully transparent.
