You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/corridor_concept.png, art/raw/r28/wallA.png
OUTPUT: art/raw/r32/wallL1.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 shows the painting style of this game; copy only its style. IMPORTANT: this is a flat texture for a 3D game: an orthographic, perfectly front-on view, NO perspective, no vanishing point, no camera angle, every horizontal line perfectly horizontal and every vertical line perfectly vertical; the picture IS the surface and fills the frame exactly edge to edge (no border, no wall corners, no floor or ceiling visible). No people, no monsters, no text, no letters, no numbers. Reference image 2 is another section of the SAME corridor wall: keep EXACTLY its structure so the sections can be placed side by side in any order: the same height of the pale green lower wainscot and its top rail, the same wooden skirting board, the same ceiling molding line at the top, the same wall colour and the same light. At BOTH the left and the right edge there is a plain vertical cream concrete pillar strip about 4% of the picture width, identical on both sides. Do not copy its features: the features between the pillars are NEW, as described here: the rear sliding door of a classroom (wooden, with a small glass window showing a dim classroom), a blank class name plate sticking out above it, a small red fire alarm bell, the rest plain plaster with a few scuff marks.
