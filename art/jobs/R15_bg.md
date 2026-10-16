You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/ref/ui_p5.png
OUTPUT: art/raw/r15/p5_back.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 is an approved game title / settings screen. This is NOT a redesign task. Output the SAME 16:9 image with the same composition, colors and graphic style, but with these removed and the background behind them painted in naturally: both girls, the whole white settings panel on the left (with every icon, text, toggle, slider, button and line on it), the white sakura flowers, the city silhouette at the bottom and the loose black ink flecks. Keep only the bold red and black diagonal shapes, the red halftone dot areas, the red window-grid shapes and the white gaps between the shapes, filling the whole frame.

STEP 2
Reference images: art/ref/ui_p5.png
OUTPUT: art/raw/r15/p5_panel.png
Background: transparent
PROMPT:
Reference image 1 is an approved game title / settings screen. This is NOT a redesign task. Output ONLY the big off-white panel on the left, exactly as in reference image 1: the same outline with its rough grunge / ink-splatter edges, the black and white jagged slashes along its edges and the halftone dot fringes. Remove everything drawn ON the panel (icons, text, toggles, sliders, tabs, lines, the red header slash, the red and black START / QUIT buttons) and fill there with the same clean off-white paper texture. Everything outside the panel fully transparent.

STEP 3
Reference images: art/ref/ui_p5.png
OUTPUT: art/raw/r15/p5_front.png
Background: transparent
PROMPT:
Reference image 1 is an approved game title / settings screen. This is NOT a redesign task. Output ONLY these foreground decorations exactly as and where they are in reference image 1, at the same position in a 16:9 frame: the white sakura flowers at the top right, the black city skyline silhouette along the bottom, and the loose black ink flecks and splatters. Everything else fully transparent.
