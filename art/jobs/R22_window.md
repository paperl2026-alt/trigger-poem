You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/raw/r22/corridor_plate.png
OUTPUT: art/raw/r22/corridor_nowin.png
Background: transparent
PROMPT:
Reference image 1 is an approved empty school corridor. This is NOT a redesign task. Output the SAME image, same size, pixel for pixel the same, except that every window pane through which the outside is seen (the sky, clouds, buildings, trees, fence and running track outside the big windows on the right, and any other window showing the outside) is made fully transparent. Keep the window frames, mullions, curtains, sills and everything inside the corridor exactly as they are.

STEP 2
Reference images: art/raw/r22/corridor_plate.png
OUTPUT: art/raw/r22/corridor_outside.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 is an approved empty school corridor. This is NOT a redesign task. Output ONLY the view outside the windows, as one continuous wide landscape picture in the same sunset light and painting style: the same sky, clouds, school buildings, trees, fence and red running track, at the same place, size and perspective as seen through the windows, and continue that landscape naturally behind the window frames, mullions and curtains so it is complete. Everything below and left of the windows (the corridor itself) fully transparent.
