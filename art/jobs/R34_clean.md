You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/raw/r23/horn.png
OUTPUT: art/raw/r34/horn.png
Background: transparent
PROMPT:
Reference image 1 is an approved game sprite sheet (3 x 2 poses of one monster on a transparent background). This is NOT a redesign task. Output the SAME sprite sheet, pixel for pixel the same monster, poses, positions, sizes, colours and line work, on a transparent background, with ONLY these removed: every glowing pink sound wave, ring of sound, light burst, glow and sparkle around the horns in the bottom row (wind-up and blast poses). Where they covered the monster, continue the monster as it is drawn in the other poses. Keep the horns, lips, cables, bows and frills exactly.

STEP 2
Reference images: art/raw/r23/frame.png
OUTPUT: art/raw/r34/frame.png
Background: transparent
PROMPT:
Reference image 1 is an approved game sprite sheet (3 x 2 poses of one monster on a transparent background). This is NOT a redesign task. Output the SAME sprite sheet, pixel for pixel the same monster, poses, positions, sizes, colours and line work, on a transparent background, with ONLY these removed: every flying mirror shard, light burst, glow and sparkle in the bottom row (wind-up and firing poses), and the loose photo falling out in the last pose. Where they covered the monster, continue the monster as it is drawn in the other poses.

STEP 3
Reference images: art/raw/r23/board.png
OUTPUT: art/raw/r34/board.png
Background: transparent
PROMPT:
Reference image 1 is an approved game sprite sheet (3 x 2 poses of one monster on a transparent background). This is NOT a redesign task. Output the SAME sprite sheet, pixel for pixel the same monster, poses, positions, sizes, colours and line work, on a transparent background, with ONLY these removed: every flying chalk stick, chalk dust cloud, motion streak, glow and sparkle around the monster (keep the chalk stick it holds in its hand in the wind-up pose). Where they covered the monster, continue the monster as it is drawn in the other poses.
