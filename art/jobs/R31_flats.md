You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/corridor_concept.png, art/raw/r28/floor.png
OUTPUT: art/raw/r31/floor2.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 shows the approved painting style of this game (warm sunset light, detailed anime background painting); copy only its style, colours and light, not its composition. IMPORTANT: this is a flat texture for a 3D game: an orthographic, perfectly top-down view looking straight down, NO perspective, no vanishing point, no camera angle, every horizontal line perfectly horizontal and every vertical line perfectly vertical; the picture IS the surface and fills the frame exactly edge to edge (no border, no wall corners, no floor or ceiling visible). No people, no monsters, no text, no letters, no numbers. Reference image 2 is this corridor's floor: keep EXACTLY its boards (same width, same direction from top to bottom, same honey colour, same polish) so this tile can sit next to it; only change the wear as described: a few black rubber heel scuffs and one strip of faded yellow tape across.

STEP 2
Reference images: art/ref/corridor_concept.png, art/raw/r28/floor.png
OUTPUT: art/raw/r31/floor3.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 shows the approved painting style of this game (warm sunset light, detailed anime background painting); copy only its style, colours and light, not its composition. IMPORTANT: this is a flat texture for a 3D game: an orthographic, perfectly top-down view looking straight down, NO perspective, no vanishing point, no camera angle, every horizontal line perfectly horizontal and every vertical line perfectly vertical; the picture IS the surface and fills the frame exactly edge to edge (no border, no wall corners, no floor or ceiling visible). No people, no monsters, no text, no letters, no numbers. Reference image 2 is this corridor's floor: keep EXACTLY its boards (same width, same direction from top to bottom, same honey colour, same polish) so this tile can sit next to it; only change the wear as described: one board a little darker and worn, a small metal drain plate, faint water rings.

STEP 3
Reference images: art/ref/corridor_concept.png, art/raw/r28/floor.png
OUTPUT: art/raw/r31/floor4.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 shows the approved painting style of this game (warm sunset light, detailed anime background painting); copy only its style, colours and light, not its composition. IMPORTANT: this is a flat texture for a 3D game: an orthographic, perfectly top-down view looking straight down, NO perspective, no vanishing point, no camera angle, every horizontal line perfectly horizontal and every vertical line perfectly vertical; the picture IS the surface and fills the frame exactly edge to edge (no border, no wall corners, no floor or ceiling visible). No people, no monsters, no text, no letters, no numbers. Reference image 2 is this corridor's floor: keep EXACTLY its boards (same width, same direction from top to bottom, same honey colour, same polish) so this tile can sit next to it; only change the wear as described: freshly waxed and extra glossy with warm reflections, a few scratches.

STEP 4
Reference images: art/ref/corridor_concept.png, art/raw/r28/ceil.png
OUTPUT: art/raw/r31/ceil2.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 shows the approved painting style of this game (warm sunset light, detailed anime background painting); copy only its style, colours and light, not its composition. IMPORTANT: this is a flat texture for a 3D game: an orthographic, perfectly view looking straight up, NO perspective, no vanishing point, no camera angle, every horizontal line perfectly horizontal and every vertical line perfectly vertical; the picture IS the surface and fills the frame exactly edge to edge (no border, no wall corners, no floor or ceiling visible). No people, no monsters, no text, no letters, no numbers. Reference image 2 is this corridor's ceiling: keep EXACTLY its tile grid and the long fluorescent light fitting in the same place across the middle, so this tile can sit next to it; only change as described: one tube of the light is dark and broken, a small brown water stain on one tile.

STEP 5
Reference images: art/ref/corridor_concept.png, art/raw/r28/ceil.png
OUTPUT: art/raw/r31/ceil3.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 shows the approved painting style of this game (warm sunset light, detailed anime background painting); copy only its style, colours and light, not its composition. IMPORTANT: this is a flat texture for a 3D game: an orthographic, perfectly view looking straight up, NO perspective, no vanishing point, no camera angle, every horizontal line perfectly horizontal and every vertical line perfectly vertical; the picture IS the surface and fills the frame exactly edge to edge (no border, no wall corners, no floor or ceiling visible). No people, no monsters, no text, no letters, no numbers. Reference image 2 is this corridor's ceiling: keep EXACTLY its tile grid and the long fluorescent light fitting in the same place across the middle, so this tile can sit next to it; only change as described: a square air vent grille in one tile and a round smoke detector.

STEP 6
Reference images: art/ref/corridor_concept.png, art/raw/r28/ceil.png
OUTPUT: art/raw/r31/ceil4.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 shows the approved painting style of this game (warm sunset light, detailed anime background painting); copy only its style, colours and light, not its composition. IMPORTANT: this is a flat texture for a 3D game: an orthographic, perfectly view looking straight up, NO perspective, no vanishing point, no camera angle, every horizontal line perfectly horizontal and every vertical line perfectly vertical; the picture IS the surface and fills the frame exactly edge to edge (no border, no wall corners, no floor or ceiling visible). No people, no monsters, no text, no letters, no numbers. Reference image 2 is this corridor's ceiling: keep EXACTLY its tile grid and the long fluorescent light fitting in the same place across the middle, so this tile can sit next to it; only change as described: a sprinkler head, a speaker grille, one tile slightly pushed up and askew.

STEP 7
Reference images: art/ref/corridor_concept.png, art/raw/r28/end.png
OUTPUT: art/raw/r31/end2.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 shows the approved painting style of this game (warm sunset light, detailed anime background painting); copy only its style, colours and light, not its composition. IMPORTANT: this is a flat texture for a 3D game: an orthographic, perfectly front-on view, NO perspective, no vanishing point, no camera angle, every horizontal line perfectly horizontal and every vertical line perfectly vertical; the picture IS the surface and fills the frame exactly edge to edge (no border, no wall corners, no floor or ceiling visible). No people, no monsters, no text, no letters, no numbers. The surface: the 3.2 m wide, 3 m tall end wall of a school corridor: a stairwell opening is NOT allowed; instead a big window in the upper half (paint the PANES as solid pure magenta #FF00FF), under it a glass display case with a model of the school and a row of potted plants, cream plaster, sunset light.
