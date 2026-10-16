You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/cat_sheet.png, art/ref/cat_poses.png
OUTPUT: art/raw/cat_cover_aim.png
Background: transparent
PROMPT:
Image 1 is the official character design sheet and Image 2 shows more of the same girl: keep her face, hair, ears, glasses, outfit and tail exactly. She is an 18-year-old third-year high-school student with an adult figure. Short messy white hair with two thin braids, white cat ears with a red ribbon and a gold bell, red eyes behind thin red-framed glasses, a calm gentle smile. Outfit: a cream wafuku-style sailor top with wide kimono sleeves lined in mint green, a navy sailor collar, a navy obi sash with red cords, gold bells and tassels, a navy pleated skirt with a cream hem, black bike shorts, white frilly ankle socks with red ribbons, black platform geta sandals, a long fluffy white cat tail. IMPORTANT: her RIGHT arm (only the right one) is a big white furry cat paw with long red claws that burns with pale jade-green spirit flames; her LEFT hand is a normal human hand.
The camera is BEHIND her and slightly to her right at shoulder height — the over-the-shoulder rear view of the playable heroines in the game NIKKE: Goddess of Victory. She is on the RIGHT side of the screen, facing away from the viewer into the depth of the picture, turned slightly to the LEFT, her face only in lost profile.
Game character sprite sheet: two full-body figures of the same character side by side on a fully transparent background, identical scale (about 7.5 heads tall), a wide empty gap between them, nothing overlapping or cut off. No background, no floor, no ground shadow, no cover objects, no muzzle flash, no beams.
Left figure, TAKING COVER: crouched low, her right cat paw held close to her chest, head turned to the left showing a calm profile, tail curled on the floor.
Right figure, ATTACKING: standing in a wide stance, her RIGHT cat paw thrust forward at full arm's reach into the distance a little left of straight ahead, claws spread, jade-green spirit flame around the paw, tail swishing.
STYLE: polished anime gacha-game character art matching the reference design sheet: clean lineart, soft cel shading with smooth gradients, glossy highlights, pretty refined faces, crisp edges that cut out cleanly. No text, no letters, no logos, no watermark.
