You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/hud/parts/b_boss.png
OUTPUT: art/raw/r35/boss.png
Background: transparent
PROMPT:
Reference image 1 is a crop of an approved game HUD mockup (a 16:9 battle screen). This is NOT a redesign task. Output the SAME picture at the SAME size, pixel for pixel the same shapes, positions, colours, outlines and halftone, keeping ONLY the boss bar graphics (the long tilted black slab with its red and white jagged outline and splatter, the empty bar track, the three phase pip sockets, the square portrait frame). REMOVE completely: every letter, number and Chinese character; the monster portrait inside the square frame (leave it plain black); the red fill of the bar (make it an empty dark track); the weak point diamond marker. Where removed things covered HUD graphics, continue those graphics cleanly. Everything that is not HUD (the game picture behind: corridor, girls, monster) becomes fully transparent. 

STEP 2
Reference images: art/ref/hud/parts/b_down.png
OUTPUT: art/raw/r35/down.png
Background: transparent
PROMPT:
Reference image 1 is a crop of an approved game HUD mockup (a 16:9 battle screen). This is NOT a redesign task. Output the SAME picture at the SAME size, pixel for pixel the same shapes, positions, colours, outlines and halftone, keeping ONLY the countdown timer graphics (the round red-black-white segmented timer ring and its black disc). REMOVE completely: every letter, number and Chinese character (7, /9, 复活!); the greyed panel behind it. Where removed things covered HUD graphics, continue those graphics cleanly. Everything that is not HUD (the game picture behind: corridor, girls, monster) becomes fully transparent. 

STEP 3
Reference images: art/ref/hud/parts/b_hide.png
OUTPUT: art/raw/r35/hide.png
Background: transparent
PROMPT:
Reference image 1 is a crop of an approved game HUD mockup (a 16:9 battle screen). This is NOT a redesign task. Output the SAME picture at the SAME size, pixel for pixel the same shapes, positions, colours, outlines and halftone, keeping ONLY the warning graphics (the red-white jagged burst and the round countdown ring next to it). REMOVE completely: every letter, number and Chinese character (躲!, 3); the monster behind. Where removed things covered HUD graphics, continue those graphics cleanly. Everything that is not HUD (the game picture behind: corridor, girls, monster) becomes fully transparent. 

STEP 4
Reference images: art/ref/hud/parts/c_interrupt.png
OUTPUT: art/raw/r35/interrupt.png
Background: transparent
PROMPT:
Reference image 1 is a crop of an approved game HUD mockup (a 16:9 battle screen). This is NOT a redesign task. Output the SAME picture at the SAME size, pixel for pixel the same shapes, positions, colours, outlines and halftone, keeping ONLY the warning graphics (the black-red jagged speech-burst label and the round countdown ring under it). REMOVE completely: every letter, number and Chinese character (打断!, 2). Where removed things covered HUD graphics, continue those graphics cleanly. Everything that is not HUD (the game picture behind: corridor, girls, monster) becomes fully transparent. 

STEP 5
Reference images: art/ref/hud/parts/a_tag.png
OUTPUT: art/raw/r35/tag.png
Background: transparent
PROMPT:
Reference image 1 is a crop of an approved game HUD mockup (a 16:9 battle screen). This is NOT a redesign task. Output the SAME picture at the SAME size, pixel for pixel the same shapes, positions, colours, outlines and halftone, keeping ONLY the name tag graphics (the tilted black slab with its white and red outline). REMOVE completely: every letter, number and Chinese character (课桌蜘蛛). Where removed things covered HUD graphics, continue those graphics cleanly. Everything that is not HUD (the game picture behind: corridor, girls, monster) becomes fully transparent. 

STEP 6
Reference images: art/ref/hud/parts/a_left.png, art/ref/hud/parts/a_right.png
OUTPUT: art/raw/r35/icons.png
Background: transparent
PROMPT:
Reference images 1 and 2 are crops of an approved game HUD. Draw a sprite sheet on a transparent background, 4 x 2 grid, one icon per cell, each centred and large, in EXACTLY the style they have in the references (same colours, outlines, shading): 1 the white heart icon of the HP bar, 2 the red-orange flame icon, 3 the cyan crosshair icon, 4 the yellow chain-link icon, 5 the pair of brass bullets of the ammo slab, 6 the violet heart icon, 7 a small red skull icon in the same style, 8 a small white lightning bolt icon in the same style. No text.
