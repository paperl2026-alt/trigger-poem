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
OUTPUT: art/raw/boss_cand.png
Background: transparent
PROMPT:
Boss monster-girl design candidates: three separate giant full-body characters in a single row on a fully transparent background, front view, identical scale, a wide empty gap between them, nothing cut off.
1: the possessed student council president: a tall elegant girl with long hair and a council armband, floating, holding a megaphone like a scepter, a huge cape made of dark ink shadow and torn paper.
2: the clock-tower girl: a giant girl personifying the school clock tower, a big clock face as a halo behind her head, a dress shaped like the tower, clock hands as a pair of swords.
3: the track-field queen: a giant athletic girl in a school gym uniform and headband, starting pistol in hand, running-track lanes curling around her like ribbons, a relay baton.
No background, no shadow.
STYLE: the same polished anime gacha-game art as a heroine design sheet: cute monster girls, the enemies of a cute light-gun game. Each one is a pretty girl first — a school object or a schoolgirl twisted by an evil god's invasion — mischievous and adorable, never gross, no gore, no tentacles, no gems, no robots. Possessed details are shown with dark ink-like shadow, glowing magenta eyes and torn-paper edges. No text, no letters.
