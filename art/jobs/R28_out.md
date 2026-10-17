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
OUTPUT: art/raw/r28/outside.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 shows the approved painting style of this game (warm sunset light, detailed anime background painting); copy only its style, colours and light, not its composition. A wide panoramic view seen from a school's second-floor corridor windows at sunset: the school's sports ground with a red running track, trees, a chain-link fence, the other school building, a town and hills in the distance, a big glowing sunset sky with clouds. Eye-level horizon in the middle of the picture. No people, no text.
