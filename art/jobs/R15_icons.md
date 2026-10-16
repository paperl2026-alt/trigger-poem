You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/p5_parts/icon_gear.png
OUTPUT: art/raw/r15/icon_gear.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the black gear icon exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 2
Reference images: art/ref/p5_parts/icon_speaker.png
OUTPUT: art/raw/r15/icon_speaker.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the black speaker icon with its sound waves exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 3
Reference images: art/ref/p5_parts/icon_speaker_off.png
OUTPUT: art/raw/r15/icon_speaker_off.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the grey (disabled) speaker icon with its sound waves exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 4
Reference images: art/ref/p5_parts/icon_globe.png
OUTPUT: art/raw/r15/icon_globe.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the black globe icon exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 5
Reference images: art/ref/p5_parts/icon_monitor.png
OUTPUT: art/raw/r15/icon_monitor.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the black computer monitor icon exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 6
Reference images: art/ref/p5_parts/icon_exit.png
OUTPUT: art/raw/r15/icon_exit.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the white exit / log-out icon (a door bracket with an arrow) exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 7
Reference images: art/ref/p5_parts/icon_play.png
OUTPUT: art/raw/r15/icon_play.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the white play triangle exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 8
Reference images: art/ref/p5_parts/header_slash.png
OUTPUT: art/raw/r15/header_slash.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the red brush slash shapes under and left of the header (only the red shapes) exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. Remove the gear icon and the text.
