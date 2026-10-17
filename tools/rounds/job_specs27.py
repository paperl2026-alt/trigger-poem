# Round 27: the heroines' missing battle poses (characters/<id>.json "poses"), drawn to match the poses already in the game
# (public/content/base/assets/neko|pink/*.webp, the ones the jiggle work was done on). Battle poses are seen from behind / the side,
# NIKKE-style, full body, drawn for the LEFT side of the screen (the game mirrors them for the right).
A = "public/content/base/assets/"
SHEET = {"neko": "art/ref/cat_sheet.png", "pink": "art/ref/pink_sheet.png"}
WHO = {
    "neko": "the white-haired cat girl (cat ears, red glasses, white fur demon-paw right arm with red claws and the red seal on its back, white cat tail, "
            "sailor top with long kimono sleeves, navy pleated skirt with a red sash, platform shoes)",
    "pink": "the black-haired twin-tail gunner girl (long wavy black hair with pink and mint ribbons, bunny hair clip, sheer pink frilly lace dress over a "
            "pink leotard, mint platform shoes, a pink-and-black rifle with a bunny charm)",
}


def pose(who, out, refs, desc):
    r = [A + f"{who}/{k}.webp" for k in refs] + [SHEET[who]]
    n = len(refs)
    return (f"art/raw/r27/{who}_{out}.png", r,
            f"Reference images 1 to {n} are approved battle sprites of {WHO[who]}; reference image {n + 1} is her character design sheet. "
            "This is NOT a redesign: draw the SAME girl in exactly the same art style, line weight, colours, shading, proportions and scale as the "
            f"battle sprites, as a NEW battle sprite: {desc} Full body, the whole figure inside the picture, a thin white sticker outline like the "
            "reference sprites, transparent background, no text, no effects except the ones described.")


JOBS = {}
for who, out, refs, desc in [
    ("neko", "aim_out", ["aim", "cover"], "kneeling behind cover, seen from behind, turned toward the LEFT and thrusting her demon paw out to the left, "
     "palm open, a small green mantra glow at the palm."),
    ("neko", "recoil", ["aim", "cover"], "the same as reference image 1 (kneeling, seen from behind, demon paw thrust out to the right) but at the moment "
     "of firing: her body jolted back by the recoil, hair and tail flung back, the paw glowing bright."),
    ("neko", "hurt", ["cover", "aim"], "hit by an attack while crouching, seen from behind and the side: flinching, shoulders hunched, eyes squeezed shut, "
     "one hand up to protect her face, tail puffed up."),
    ("neko", "down", ["cover", "aim"], "knocked down: sitting on the floor with her legs to one side, propping herself up on one arm, dazed, swirly eyes, "
     "seen from behind and the side."),
    ("neko", "run", ["cover", "aim"], "running forward AWAY from the viewer (seen from behind), mid-stride, left foot forward, demon paw swinging, tail streaming."),
    ("neko", "run_b", ["cover", "aim"], "running forward AWAY from the viewer (seen from behind), mid-stride, right foot forward, the other step, tail streaming."),
    ("neko", "victory", ["cover", "aim"], "standing, turned three-quarters toward the viewer looking back over her shoulder with a smug cat smile, making a "
     "V sign with her normal hand, demon paw on her hip."),
    ("neko", "active", ["aim", "cover"], "her skill: kneeling, seen from behind, thrusting the demon paw forward to the right with both arms braced, a huge "
     "golden mantra circle blazing in front of the palm, hair and sleeves blown back by the force."),
    ("neko", "active_out", ["aim", "cover"], "her skill toward the LEFT: kneeling, seen from behind, thrusting the demon paw out to the left with both arms "
     "braced, a huge golden mantra circle blazing in front of the palm, hair and sleeves blown back."),
    ("pink", "taunt", ["cover", "peek"], "crouching behind cover, seen from behind and the side, looking back over her shoulder at the viewer, winking and "
     "sticking her tongue out, making a little heart with one hand, rifle hugged under the other arm."),
    ("pink", "aim_out", ["aim", "cover"], "kneeling, seen from behind and the side, aiming her rifle toward the LEFT, cheek on the stock, ready to fire."),
    ("pink", "recoil", ["aim", "cover"], "the same as reference image 1 (kneeling, aiming her rifle to the right) at the moment of firing: kicked back by the "
     "recoil, twin tails flying, a spent shell flying out."),
    ("pink", "hurt", ["cover", "aim"], "hit by an attack while crouching, seen from behind and the side: flinching, eyes squeezed shut, tears, hugging her rifle."),
    ("pink", "down", ["cover", "aim"], "knocked down: sitting on the floor with her legs splayed, rifle on her lap, dazed, swirly eyes, seen from the side."),
    ("pink", "reload", ["cover", "aim"], "crouching behind cover, seen from behind and the side, slamming a fresh pink drum magazine into her rifle, "
     "an empty magazine falling."),
    ("pink", "run", ["cover", "aim"], "running forward AWAY from the viewer (seen from behind), mid-stride, left foot forward, rifle held across her chest, "
     "twin tails streaming."),
    ("pink", "run_b", ["cover", "aim"], "running forward AWAY from the viewer (seen from behind), mid-stride, right foot forward, the other step."),
    ("pink", "active", ["aim", "cover"], "her skill: standing braced, seen from behind and the side, firing a huge pink-and-black rotary gatling gun to the "
     "right, a long belt of bullets, a big muzzle blaze, her whole body shaking with the recoil."),
    ("pink", "active_out", ["aim", "cover"], "her skill toward the LEFT: standing braced, seen from behind and the side, firing a huge pink-and-black "
     "rotary gatling gun to the left, a big muzzle blaze."),
]:
    JOBS[f"R27_{who}_{out}"] = [pose(who, out, refs, desc)]
