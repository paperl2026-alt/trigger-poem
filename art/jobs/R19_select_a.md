You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.

STEP 1
Reference images: art/raw/r18/select_a.png, art/ref/cat_sheet.png, art/ref/pink_sheet.png
OUTPUT: art/raw/r19/select_a_v1.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 is the approved chapter-select screen of this game. This is NOT a redesign of the screen. Output the SAME screen: same layout, same panels, same texts, buttons, icons, colors and style, pixel for pixel, EXCEPT the two girls inside the two character cards on the right, which are drawn NEW, waist-up, filling their card like now and overlapping its top edge a little. Character designs: reference image 2 is the white-haired cat girl (1P 神乐), reference image 3 the black-haired twin-tail girl (2P 椿); keep their faces, hair, eyes, outfits and colors exactly as in those sheets, and the cat girl's red paw seal exactly as drawn on her sheet. New poses: 1P 神乐: facing the viewer, the white fur ghost paw raised beside her cheek with the red claws spread wide like a cat's swipe, the red seal on its back faintly glowing, her other hand on her hip, a small confident smirk, glasses glinting. 2P 椿: the pink-and-black gatling gun propped on her shoulder with both arms hooked over it, leaning sideways, one eye closed in a wink and a big open grin, twin tails swinging. These poses are ALREADY USED elsewhere in the game and must NOT be repeated or resembled: 神乐：右手食指推红框眼镜，白毛鬼手举在胸前、爪尖朝上，头微歪，面无表情；椿：右手托腮、身体前倾靠在神乐身后，眼神慵懒; 战斗用的各个姿势（掩体、探身、换弹、挑衅、射击、技能、受击、倒地、跑动、胜利）. 16:9, 1672x941.

STEP 2
Reference images: art/raw/r18/select_a.png, art/ref/cat_sheet.png, art/ref/pink_sheet.png
OUTPUT: art/raw/r19/select_a_v2.png
Background: OPAQUE (do not request transparency)
PROMPT:
Reference image 1 is the approved chapter-select screen of this game. This is NOT a redesign of the screen. Output the SAME screen: same layout, same panels, same texts, buttons, icons, colors and style, pixel for pixel, EXCEPT the two girls inside the two character cards on the right, which are drawn NEW, waist-up, filling their card like now and overlapping its top edge a little. Character designs: reference image 2 is the white-haired cat girl (1P 神乐), reference image 3 the black-haired twin-tail girl (2P 椿); keep their faces, hair, eyes, outfits and colors exactly as in those sheets, and the cat girl's red paw seal exactly as drawn on her sheet. New poses: 1P 神乐: three-quarter view looking back over her shoulder at the viewer, cat ears perked, the white fur paw held low and curled loosely in front of her chest, a sleepy half-lidded look with a tiny yawn, the bell on her ribbon swinging. 2P 椿: hugging a big pink bunny plushie under one arm and holding up a strawberry milk carton with a straw toward the viewer, cheeks puffed, pouting playfully. These poses are ALREADY USED elsewhere in the game and must NOT be repeated or resembled: 神乐：右手食指推红框眼镜，白毛鬼手举在胸前、爪尖朝上，头微歪，面无表情；椿：右手托腮、身体前倾靠在神乐身后，眼神慵懒; 战斗用的各个姿势（掩体、探身、换弹、挑衅、射击、技能、受击、倒地、跑动、胜利）. 16:9, 1672x941.
