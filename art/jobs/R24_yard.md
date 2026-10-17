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
OUTPUT: art/raw/r24/yard.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 is the approved concept art of this game (look only at its painting style, its warm sunset light, its colours, its camera height and the way the floor folds; ignore the characters and monsters in it). Paint a NEW background in exactly that style: a detailed anime background painting, 16:9, wide-angle perspective from a low camera (about the eye height of a crouching person), strong depth down the middle. In the near foreground at the bottom-left corner stands one sturdy cover object and at the bottom-right corner another one, both big and close to the camera, cut off by the frame edges, so two people could hide behind them; the middle of the floor between them is open and leads into the distance. No people, no monsters, no text, no letters, no numbers anywhere. The school has been hit by an unknown evil energy: dark purple-and-violet eye sigils (a single stylised eye inside a jagged diamond) are smeared on the walls, the light is a wrong pink-violet mixed with the sunset, small objects float in the air, thin glowing pink cracks run along the walls and floor, the floor boards fold up into sharp ridges here and there like in reference image 1. Place: the school's sports ground at sunset, seen from the near edge of the ground: a red running track and a dirt field lead straight to the big four-storey school building that fills the whole back of the picture, with its clock on the front; the sky above the building is a huge violet-pink anomaly sky with a dark swirl. The upper half of the picture above the building's roof is mostly empty sky (something enormous will rise from behind the building there). Near-left cover: a wooden vaulting box with a white padded top. Near-right cover: a small wheeled metal cart for drawing white lines, with a sandbag on it.
