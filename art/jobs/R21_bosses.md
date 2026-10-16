You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/monster_ref.webp
OUTPUT: art/raw/r21/b_coach.png
Background: transparent
PROMPT:
Reference image 1 shows the approved art direction for this game's monsters: look at how the photo-frame / mirror girl and the megaphone girl are made, a strange creature that as a whole is clearly a cute girlified monster (body, silhouette, hair, clothes, pose all girl-like), not an object with a woman's face stuck on it. Same anime art style as reference image 1, clean line art with a white sticker outline, full colour. Draw a character concept sheet on a plain light grey background: the same boss in three forms side by side from left to right, each larger than the one before. No text, no labels, no letters anywhere. 16:9. The schoolyard boss, option A: the PE teacher warped by the energy. Form 1: a tall sporty woman in a track jersey with a whistle and a starting pistol, summoning hurdles. Form 2: she fuses with the vaulting box, the mats and the hurdles into a big charging beast-girl, her glowing whistle core hidden deep inside the vaulting box. Form 3: the running track lanes become huge ribbons around her and the field lines glow, the core now exposed on her chest.

STEP 2
Reference images: art/ref/monster_ref.webp
OUTPUT: art/raw/r21/b_flag.png
Background: transparent
PROMPT:
Reference image 1 shows the approved art direction for this game's monsters: look at how the photo-frame / mirror girl and the megaphone girl are made, a strange creature that as a whole is clearly a cute girlified monster (body, silhouette, hair, clothes, pose all girl-like), not an object with a woman's face stuck on it. Same anime art style as reference image 1, clean line art with a white sticker outline, full colour. Draw a character concept sheet on a plain light grey background: the same boss in three forms side by side from left to right, each larger than the one before. No text, no labels, no letters anywhere. 16:9. The schoolyard boss, option B: the student council president warped together with the school's flagpole and flag. Form 1: an elegant girl with the council armband holding the school flag like a spear. Form 2: the flag becomes a vast cape that wraps and hides her glowing crest-shaped core, the flagpole a giant lance. Form 3: a towering form with flag-banner wings and the school crest opened like an eye on her chest.
