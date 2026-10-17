You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/raw/r33/hud_a.png, art/ref/hud/parts/a_reticles.png
OUTPUT: art/raw/r35/ret_pink_a.png
Background: transparent
PROMPT:
Reference image 1 is the approved battle HUD of this game; reference image 2 shows its current reticles. Design the AIMING RETICLE of player 1, the black-haired twin-tail gun girl for this light-gun shooter. Draw a sprite sheet on a transparent background, 4 x 2 grid, one STATE per cell, flat bold graphic, no scene, no text. The eight states MUST differ in SHAPE and COMPOSITION, not only in colour, while clearly being one family: 1 aiming at nothing (calm, open), 2 locked on a monster (tightened, brackets snapped in, with a short stub where a leader line to a name tag starts), 3 firing (parts kicked outward by recoil, bloom), 4 reloading (a loading form: a ring or a magazine of cartridges filling up), 5 hiding in cover (cannot shoot: collapsed and small, a closed-eye or shield sign), 6 out of ammo (empty, broken, an X form), 7 Fever (much fancier: extra rings, spikes, hearts), 8 her special (an endless gatling: a big spinning multi-barrel ring). Each reticle is built from a few clean separate layers (outer ring, inner ring, brackets, ticks, centre mark) so the game can spin, scale and recombine them. Colours: hot pink #ff5fa8, white, black. Design direction: kawaii heart scope: heart shapes, ribbons, bunny-ear brackets.

STEP 2
Reference images: art/raw/r33/hud_a.png, art/ref/hud/parts/a_reticles.png
OUTPUT: art/raw/r35/ret_pink_b.png
Background: transparent
PROMPT:
Reference image 1 is the approved battle HUD of this game; reference image 2 shows its current reticles. Design the AIMING RETICLE of player 1, the black-haired twin-tail gun girl for this light-gun shooter. Draw a sprite sheet on a transparent background, 4 x 2 grid, one STATE per cell, flat bold graphic, no scene, no text. The eight states MUST differ in SHAPE and COMPOSITION, not only in colour, while clearly being one family: 1 aiming at nothing (calm, open), 2 locked on a monster (tightened, brackets snapped in, with a short stub where a leader line to a name tag starts), 3 firing (parts kicked outward by recoil, bloom), 4 reloading (a loading form: a ring or a magazine of cartridges filling up), 5 hiding in cover (cannot shoot: collapsed and small, a closed-eye or shield sign), 6 out of ammo (empty, broken, an X form), 7 Fever (much fancier: extra rings, spikes, hearts), 8 her special (an endless gatling: a big spinning multi-barrel ring). Each reticle is built from a few clean separate layers (outer ring, inner ring, brackets, ticks, centre mark) so the game can spin, scale and recombine them. Colours: hot pink #ff5fa8, white, black. Design direction: candy-coloured tactical sight: precise ticks, chevrons, crisp scales without numbers.

STEP 3
Reference images: art/raw/r33/hud_a.png, art/ref/hud/parts/a_reticles.png
OUTPUT: art/raw/r35/ret_pink_c.png
Background: transparent
PROMPT:
Reference image 1 is the approved battle HUD of this game; reference image 2 shows its current reticles. Design the AIMING RETICLE of player 1, the black-haired twin-tail gun girl for this light-gun shooter. Draw a sprite sheet on a transparent background, 4 x 2 grid, one STATE per cell, flat bold graphic, no scene, no text. The eight states MUST differ in SHAPE and COMPOSITION, not only in colour, while clearly being one family: 1 aiming at nothing (calm, open), 2 locked on a monster (tightened, brackets snapped in, with a short stub where a leader line to a name tag starts), 3 firing (parts kicked outward by recoil, bloom), 4 reloading (a loading form: a ring or a magazine of cartridges filling up), 5 hiding in cover (cannot shoot: collapsed and small, a closed-eye or shield sign), 6 out of ammo (empty, broken, an X form), 7 Fever (much fancier: extra rings, spikes, hearts), 8 her special (an endless gatling: a big spinning multi-barrel ring). Each reticle is built from a few clean separate layers (outer ring, inner ring, brackets, ticks, centre mark) so the game can spin, scale and recombine them. Colours: hot pink #ff5fa8, white, black. Design direction: Persona-5 calling card: jagged red-black-white shards with pink accents.
