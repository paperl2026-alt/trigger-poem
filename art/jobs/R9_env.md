You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: (none)
OUTPUT: art/raw/bg_yard_calm.png
Background: OPAQUE (do not request transparency)
PROMPT:
Wide horizontal background painting seen head-on from standing eye level: a peaceful Japanese high school building across an empty schoolyard at sunset, a clock on the facade, rows of windows glowing orange, a running track and a sports-equipment shed, cherry trees at the sides, long soft shadows, a calm pink-orange sky with a few clouds. The lower part is open dirt yard.
STYLE: polished anime background art, warm and peaceful late-afternoon light (cream, wood brown, sunset orange, soft pink sky), clean shapes with slight paper grain like a hand-made paper diorama. No text, no letters, no people.

STEP 2
Reference images: (none)
OUTPUT: art/raw/rips.png
Background: transparent
PROMPT:
Game effect sprite sheet: six separate torn-paper rips in a 3 by 2 grid on a fully transparent background, each centered in its cell with a wide gap, all different shapes (long jagged slashes, a round burst, a zigzag crack). Each is a hole torn through a sheet of paper with curled white fibrous paper edges, revealing a deep black-violet void full of tiny magenta and cyan sparkles and drifting paper scraps inside.
STYLE: crisp anime game effect art, high contrast, readable at small size. No text, no eyes, no tentacles, no gems.
