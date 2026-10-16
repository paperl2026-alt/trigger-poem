You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/raw/r22/cover_bench_prev.png
OUTPUT: art/raw/r22/cover_bench.png
Background: transparent
PROMPT:
Reference image 1 shows a low wooden bench with a shoe shelf, and a white-haired cat girl crouching on and in front of it, on a transparent background. This is NOT a redesign task. Output the SAME image, same size, the bench at exactly the same position, size, shape, colours and light, but with the girl completely REMOVED (no girl, no hair, no tail, no clothes, no shoes of hers): continue the bench and its shoe shelf where she covered it, as it obviously continues, with the indoor slippers on its shelves. Everything that is not the bench stays fully transparent.
