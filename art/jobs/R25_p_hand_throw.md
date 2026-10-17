You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/raw/r25/master.png, art/ref/monster_ref.webp
OUTPUT: art/raw/r25/hand_throw.png
Background: transparent
PROMPT:
Reference image 1 is the approved design of this boss. Keep her face, hair, uniform, armband, colours, line style and anomaly details exactly the same. The character: the school's DISCIPLINE COMMITTEE girl turned into a colossal monster: a prim, beautiful, stern high-school girl with very long straight black hair with blunt bangs, sharp red eyes, a navy blazer school uniform with a white collar, a red armband with a white shield crest (no letters) on her left upper arm, a silver whistle on a red cord; ANOMALY: she is as tall as a building; a third eye in the shape of a stylised eye inside a jagged diamond sits on her forehead (closed it is a thin glowing pink slit); long strands of her hair turn into red-and-black striped rule tape; her fingernails are long and red like rulers' tips; thin glowing pink cracks run over her skin like seams. Girlified monster, uncanny but beautiful. Same anime art style as reference image 1: clean line art, full colour, sunset and violet anomaly light. No text, no letters. Draw ONLY her giant RIGHT hand raised, about to hurl a fistful of confiscated smartphones and manga volumes (blank covers, no text) at the viewer, seen from the front, the blazer cuff at the wrist; nothing else. Square picture. Transparent background, the part fills most of the picture.
