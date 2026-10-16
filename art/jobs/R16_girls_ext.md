You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/p5_parts/girls_pad.png
OUTPUT: art/raw/r16/girls_ext.png
Background: transparent
PROMPT:
Reference image 1 shows two anime girls on a transparent background, already approved. This is NOT a redesign task. The drawing is cut off by straight lines: the white fluffy fur sleeve on the left girl is cut by a vertical line at the left, and both girls' bodies and clothes are cut by a horizontal line near the bottom, with empty space below and to the left. Output the SAME image at the same framing, with the same two girls exactly as drawn (same faces, pose, colors, clothes, line art, the red seal on the fur sleeve), and ONLY continue the drawing naturally past those straight cuts: the fur sleeve continues to the left and downward, the kimono, sash, bells, tassels and the pink dress continue down to the very bottom edge of the image. No new objects, no hands or legs added, no background. Everything that is not the girls stays fully transparent.
