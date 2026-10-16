You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/pink_sheet.png, art/ref/pink_poses.png
OUTPUT: art/raw/pink_cover_aim.png
Background: transparent
PROMPT:
Image 1 is the official character design sheet and Image 2 shows more of the same girl: keep her face, hair, outfit and gun exactly. She is an 18-year-old third-year high-school student with an adult figure. Very long wavy black hair in high twin tails tied with pink-and-mint ribbons, a white bunny hair clip, small heart charms dangling, pink eyes, a sweet sly smile. Outfit: a sheer white lace see-through cover-up dress with puffy frilled sleeves over a glossy pink lace leotard bodysuit with a yellow bow and heart buckles, a mint sailor collar, a pink heart garter on her left thigh, white frilly ankle socks, pink patent platform mary-janes with clear mint soles. Weapon: a chunky black-and-pink compact gatling rifle with a round drum magazine and a white bunny sticker.
The camera is BEHIND her and slightly to her left at shoulder height — the over-the-shoulder rear view of the playable heroines in the game NIKKE: Goddess of Victory. She is on the LEFT side of the screen, facing away from the viewer into the depth of the picture, turned slightly to the RIGHT, her face only in lost profile.
Game character sprite sheet: two full-body figures of the same character side by side on a fully transparent background, identical scale (about 7.5 heads tall), a wide empty gap between them, nothing overlapping or cut off. No background, no floor, no ground shadow, no cover objects, no muzzle flash, no beams.
Left figure, TAKING COVER: crouched low on one knee, hugging the gun upright to her chest, head turned to the right showing a sly profile, twin tails pooling down her back.
Right figure, FIRING: standing in a wide stance, leaning forward slightly, gun shouldered and aimed into the distance a little right of straight ahead, twin tails swinging.
STYLE: polished anime gacha-game character art matching the reference design sheet: clean lineart, soft cel shading with smooth gradients, glossy highlights, pretty refined faces, crisp edges that cut out cleanly. No text, no letters, no logos, no watermark.
