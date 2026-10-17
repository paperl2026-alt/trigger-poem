You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/corridor_concept.png
OUTPUT: art/raw/r28/wallA.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 shows the approved painting style of this game (warm sunset light, detailed anime background painting); copy only its style, colours and light, not its composition. IMPORTANT: this is a flat texture for a 3D game: an orthographic, perfectly front-on view, NO perspective, no vanishing point, no camera angle, every horizontal line perfectly horizontal and every vertical line perfectly vertical; the picture IS the surface and fills the frame exactly edge to edge (no border, no wall corners, no floor or ceiling visible). No people, no monsters, no text, no letters, no numbers. The surface: one 4.5 m wide, 3 m tall section of a Japanese high-school corridor wall on the classroom side: a wooden sliding classroom door on the left third with a small glass window in it (the glass shows a dim classroom), above it a row of small transom windows, a blank classroom name plate sticking out above the door, to the right a cork notice board with blank pinned papers, a cream plaster wall with a pale green lower wainscot and a wooden skirting board, warm sunset light falling across it in soft diagonal stripes.
