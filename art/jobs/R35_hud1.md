You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/hud/parts/a_left.png
OUTPUT: art/raw/r35/left.png
Background: transparent
PROMPT:
Reference image 1 is a crop of an approved game HUD mockup (a 16:9 battle screen). This is NOT a redesign task. Output the SAME picture at the SAME size, pixel for pixel the same shapes, positions, colours, outlines and halftone, keeping ONLY the HUD graphics (the pink splatter and halftone backing, the tilted black slabs with jagged white outlines and red offset shadows, the red 1P block, the round portrait frame with its segmented skill ring track, the white key tag, the HP bar slab and its empty track, the three Fever gauge tiles with their empty segment tracks, the ammo slab with its empty tick track). REMOVE completely: every letter, number and Chinese character; the chibi girl inside the round frame (leave the inside of the frame plain white); the heart icon; the flame, crosshair and chain icons; the bullet icon; every coloured fill (make the HP bar, the gauge segments, the skill ring and the ammo ticks all EMPTY dark grey tracks). Where removed things covered HUD graphics, continue those graphics cleanly. Everything that is not HUD (the game picture behind: corridor, girls, monster) becomes fully transparent. 

STEP 2
Reference images: art/ref/hud/parts/a_center.png
OUTPUT: art/raw/r35/center.png
Background: transparent
PROMPT:
Reference image 1 is a crop of an approved game HUD mockup (a 16:9 battle screen). This is NOT a redesign task. Output the SAME picture at the SAME size, pixel for pixel the same shapes, positions, colours, outlines and halftone, keeping ONLY the HUD graphics (the small black stage-name slab with its white outline, the big red-black-white jagged combo burst, the black spiky rank burst with halftone). REMOVE completely: every letter, number and Chinese character (the stage name, 27, 连击!, A, ×1.8). Where removed things covered HUD graphics, continue those graphics cleanly. Everything that is not HUD (the game picture behind: corridor, girls, monster) becomes fully transparent. 

STEP 3
Reference images: art/ref/hud/parts/a_right.png
OUTPUT: art/raw/r35/right.png
Background: transparent
PROMPT:
Reference image 1 is a crop of an approved game HUD mockup (a 16:9 battle screen). This is NOT a redesign task. Output the SAME picture at the SAME size, pixel for pixel the same shapes, positions, colours, outlines and halftone, keeping ONLY the HUD graphics (the violet splatter and halftone backing, the tilted black slabs with jagged white outlines and red offset shadows, the red 2P block, the round portrait frame with its segmented skill ring track, the white key tag, the HP bar slab and its empty track, the three Fever gauge tiles with their empty segment tracks, the ammo slab). REMOVE completely: every letter, number and Chinese character; the chibi cat girl inside the round frame (leave the inside plain white); the heart icon; the flame, crosshair and chain icons; the big paw icon and the eight small paw tokens; every coloured fill (bars, gauge segments and the skill ring EMPTY dark grey). Where removed things covered HUD graphics, continue those graphics cleanly. Everything that is not HUD (the game picture behind: corridor, girls, monster) becomes fully transparent. 
