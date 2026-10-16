You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/select_parts/thumb1.png
OUTPUT: art/raw/r20/thumb1.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the greyscale classroom picture that fades out to the left exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. Remove the white '»' chevrons and continue the picture behind them.

STEP 2
Reference images: art/ref/select_parts/thumb2.png
OUTPUT: art/raw/r20/thumb2.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the greyscale school corridor picture that fades out to the left exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. Remove the white '»' chevrons and continue the picture behind them.

STEP 3
Reference images: art/ref/select_parts/thumb_boss.png
OUTPUT: art/raw/r20/thumb_boss.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the greyscale picture with the round teddy-bear mascot silhouette that fades out to the left exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. Remove the white '»' chevrons and the text and continue the picture behind them.

STEP 4
Reference images: art/ref/select_parts/coin.png
OUTPUT: art/raw/r20/icon_coin.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the gold coin icon exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 5
Reference images: art/ref/select_parts/gear.png
OUTPUT: art/raw/r20/icon_gear_w.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the black gear icon on its white tilted square tile exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 6
Reference images: art/ref/select_parts/icon_team.png
OUTPUT: art/raw/r20/icon_team.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the white group-of-people icon exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 7
Reference images: art/ref/select_parts/icon_bag.png
OUTPUT: art/raw/r20/icon_bag.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the black school bag icon exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 8
Reference images: art/ref/select_parts/skull.png
OUTPUT: art/raw/r20/icon_skull.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the white skull icon with its black outline exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 9
Reference images: art/ref/select_parts/crown.png
OUTPUT: art/raw/r20/icon_crown.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the black crown icon exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 10
Reference images: art/ref/select_parts/swords.png
OUTPUT: art/raw/r20/icon_swords.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the black crossed swords icon exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 11
Reference images: art/ref/select_parts/shirt.png
OUTPUT: art/raw/r20/icon_shirt.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the white T-shirt icon exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 12
Reference images: art/ref/select_parts/lock.png
OUTPUT: art/raw/r20/icon_lock.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the black padlock icon exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 13
Reference images: art/ref/select_parts/lock_big.png
OUTPUT: art/raw/r20/icon_lock_big.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the light grey padlock icon exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 14
Reference images: art/ref/select_parts/icon_swap.png
OUTPUT: art/raw/r20/icon_swap.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the white two-arrows swap icon exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 15
Reference images: art/ref/select_parts/arrow_l.png
OUTPUT: art/raw/r20/arrow_l.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the left-pointing triangle arrow (white with a black outline) exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 16
Reference images: art/ref/select_parts/arrow_r.png
OUTPUT: art/raw/r20/arrow_r.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the right-pointing red triangle arrow with its white and black outline exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. 

STEP 17
Reference images: art/ref/select_parts/row1.png
OUTPUT: art/raw/r20/chevrons.png
Background: transparent
PROMPT:
Reference image 1 is a crop from an approved game UI mockup. This is NOT a redesign task. Reproduce ONLY the white double chevron '»' at the right end of the bar (only the chevron) exactly as it looks there: same shape, same proportions, same colors, same line weight. Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. Remove everything else.
