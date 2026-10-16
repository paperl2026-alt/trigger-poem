# Round 7: episode 0 redone as "the cultural-festival haunted house gets out of hand" + new HUD / FX / SFX art
# (replacing every MVP leftover). Heroine-dependent art (comics, key art, cover, busts) waits for the redesign pick.
FEST = ("STYLE: polished cute-creepy anime game art with soft cel shading and rich color. A Japanese high school the evening before its cultural festival, "
        "taken over by the class's own haunted-house attraction: black cardboard panels, hand-painted glow-in-the-dark ghosts, paper lanterns, fake cobwebs, "
        "string lights, cheap festival decorations — now possessed by an evil god leaking in: glowing violet light, real eyes opening in the paintings, violet ghost fire. "
        "Saturated magenta, violet and teal glow paint against warm orange lantern light. Spooky but cute and comedic, never gory. No text, no letters, no numbers.")
TILE = "Seamless tileable texture for a 3D game, perfectly square, seen perfectly flat and head-on with no perspective, evenly lit, the pattern repeats seamlessly across all four edges. "
MON = ("STYLE: polished cute-creepy anime game monster sprite with soft cel shading and a bold readable silhouette, made of school-festival haunted-house materials "
       "(cardboard, bedsheets, paper, cheap paint) come alive with glowing violet eyes. Comedic and cute, never gory. No text, no letters.")


def row(n, desc, frames, size, ref=None, style=MON):
    return (f"Animation sprite sheet: {n} frames of the same monster in a single row, left to right, on a fully transparent background, identical scale, lowest points on one shared baseline, "
            "a wide empty gap between frames, nothing cut off or touching. The monster FACES THE VIEWER. " + (ref or "") + f"\nThe monster ({size}): {desc}\n" +
            "\n".join(f"Frame {i + 1}: {f}" for i, f in enumerate(frames)) +
            "\nThe poses must differ STRONGLY with big silhouette changes, squash and stretch, like key frames of a stop-motion animation.\nNo background, no shadow, no effects.\n" + style)


SAME = "Image 1 shows this same monster: keep its design exactly."
ZOMBIE = ("a life-size cardboard standee of a zombie schoolboy that the students painted for the haunted house, now walking: flat cardboard body hinged with packing tape at the joints, "
          "crayon-and-marker face with stitches and a goofy open mouth, eye holes glowing violet, a festival happi coat painted on")
LANTERN = "a chochin-obake: a red-and-white paper festival lantern yokai with one huge eye and a long licking tongue, standing on stubby wooden legs, lit violet from inside"
UMBRELLA = "a karakasa-obake: an old oil-paper umbrella yokai with one big eye, a long tongue and a single leg in a wooden geta sandal, decorated with festival ribbons"
FLOAT = ("a giant papier-mache festival float of the school mascot: a chubby round cat-tanuki head as big as a truck with tiny arms, riding on a wooden float cart hung with paper lanterns "
         "and festival tassels; its painted eyes now glow violet and it grins with paper teeth")

JOBS = {
    "F7_env": [
        ("art/raw/tex_hh_wall.png", [], TILE + "A classroom wall turned into a haunted-house attraction: black cardboard panels taped together, hand-painted glowing ghosts and big eyes in teal and magenta glow paint, "
         "paper chains, a strip of fake cobweb, and a real violet eye opening between the panels.\n" + FEST, "OPAQUE"),
        ("art/raw/tex_hh_floor.png", [], TILE + "Old wooden school floorboards strewn with paper leaves, confetti, fake cobweb strands, taped arrow markers and small puddles of violet glow.\n" + FEST, "OPAQUE"),
        ("art/raw/tex_hh_ceiling.png", [], TILE + "A school ceiling hidden under draped black cloth, fake spider webs, hanging paper bats and strings of tiny lights.\n" + FEST, "OPAQUE"),
        ("art/raw/tex_fest_wall.png", [], TILE + "A school corridor wall decorated for the festival: paper flower garlands, colorful blank posters and paper lanterns — the posters' painted faces have grown real violet eyes and purple veins creep between them.\n" + FEST, "OPAQUE"),
        ("art/raw/tex_fest_ground.png", [], TILE + "A dirt schoolyard at dusk seen from above: scattered festival confetti, paper lantern light pools, cables, footprints, and cracks leaking violet ghost light.\n" + FEST, "OPAQUE"),
        ("art/raw/bg_fest_yard.png", [], "Wide horizontal background painting seen head-on from standing eye level: a Japanese high school building at dusk dressed for the cultural festival — banners, strings of paper lanterns, "
         "food stalls and a festival stage in front — while the sky above is torn open by one gigantic violet eye with tentacle-shaped clouds swirling around it. The lower part is open dirt yard, no people.\n" + FEST, "OPAQUE"),
        ("art/raw/props_fest.png", [], "Game prop sprite sheet: six separate objects in a 3 by 2 grid on a fully transparent background, each complete with a wide empty gap, seen head-on.\n"
         "1: a cardboard tombstone with a painted cute ghost. 2: a tall pole strung with glowing paper lanterns. 3: a cardboard haunted-house entrance arch with painted eyes and fake cobwebs. "
         "4: a wooden festival food stall with a striped awning and lanterns. 5: school desks stacked and draped with black cloth and cobwebs. 6: a big mascot-costume head on a stand.\nNo background, no shadow.\n" + FEST),
        ("art/raw/covers_fest.png", [], "Game sprite sheet: two separate low barricades on a fully transparent background, side by side with a wide gap, each complete, seen from behind at close range and slightly above, wide and low.\n"
         "Left: a row of cardboard tombstones and fake paper rocks taped together. Right: a wooden festival stall counter stacked with takoyaki boxes and lanterns.\nNo background, no shadow, no people.\n" + FEST),
    ],
    "F7_mon": [
        ("art/raw/en_zomb_walk.png", [], row(4, ZOMBIE, ["stiff step forward with the left foot, arms out like a puppet", "hopping up, cardboard flexing, arms flung up",
                                                          "stiff step with the right foot, head tilted", "hunched low, bending at the tape hinges"], "human-sized")),
        ("art/raw/en_zomb_atk.png", ["art/raw/en_zomb_walk.png"], row(4, ZOMBIE, ["crouched low, coiled like a spring", "leaping at the viewer, arms spread wide",
                                                                                  "extreme lunge right at the viewer, mouth wide open, foreshortened and bigger", "knocked backward, cardboard bending and flapping"], "human-sized", SAME)),
        ("art/raw/en_sheet.png", [], "Animation sprite sheet: 4 frames of the same flying monster in a 2 by 2 grid on a fully transparent background, identical scale, each centered in its cell, front view, facing the viewer.\n"
         "The monster: a classic white bedsheet ghost costume come alive, two eye holes glowing violet, a derpy face drawn on with marker, a tiny festival headband, a trailing hem.\n"
         "Frame 1 billowing up. Frame 2 floating level. Frame 3 sinking with the hem flaring. Frame 4 diving at the viewer, sheet stretched, mouth wide open, foreshortened.\nNo background, no shadow, no effects.\n" + MON),
        ("art/raw/en_lantern.png", [], row(4, LANTERN, ["idle, eye glancing sideways, tongue lolling", "winding up, swelling and glowing bright, eye narrowed",
                                                        "spitting a ghost-fire wisp at the viewer (draw no fire), mouth wide open", "hurt, paper torn, eye spinning"], "human-sized")),
        ("art/raw/en_umbrella.png", [], row(4, UMBRELLA, ["hanging upside down from the ceiling, tongue out", "upside down, swinging the other way",
                                                          "dropping down right side up, canopy flaring", "pouncing at the viewer, canopy wide open, tongue out, foreshortened"], "child-sized")),
        ("art/raw/proj_fest.png", [], "Three separate projectile sprites in a row on a fully transparent background with wide gaps, each complete, front view:\n"
         "1: a violet hitodama ghost-fire wisp with a cute angry face. 2: a hot takoyaki ball with a toothpick, steam and angry eyes. 3: a round festival balloon with a scary grin.\nNo background.\n" + MON),
        ("art/raw/boss_float.png", [], "Animation sprite sheet: 4 frames of the same giant boss in a single row on a fully transparent background, identical scale, bottoms on one baseline, a gap between frames, nothing cut off, facing the viewer.\n"
         f"The boss: {FLOAT}.\n"
         "Frame 1 idle, grinning, lanterns swaying. Frame 2 rearing up on the cart about to slam down. Frame 3 mouth wide open spitting a takoyaki at the viewer, foreshortened. "
         "Frame 4 staggered, papier-mache cracking, lanterns falling, eyes spinning.\nNo background, no shadow, no effects.\n" + MON),
    ],
    "F7_ui": [
        ("art/raw/icons_hud.png", [], "Game UI sprite sheet: six separate elements in a 3 by 2 grid on a fully transparent background, each centered in its cell with a wide gap.\n"
         "1: a glossy candy-red heart with a tiny white paper talisman stuck on it (full health). 2: the same heart as an empty dark outline, cracked (lost health). "
         "3: a bright orange-white rifle muzzle flash star seen from the side. 4: a huge triple muzzle flash burst for a rotary gatling. "
         "5: a golden radiant burst ring of light (for a psychic palm blast). 6: a white-pink comic hit spark star.\n"
         "STYLE: crisp anime game UI and effects art, bold clean shapes, saturated, glowing, readable at small size. No text, no letters."),
        ("art/raw/sfx_stamps.png", [], "Comic sound-effect lettering sheet: six separate hand-drawn manga onomatopoeia in a 3 by 2 grid on a fully transparent background, each centered in its cell with a wide gap.\n"
         "Write exactly these Japanese katakana, one per cell: 1 「ドン！」 2 「バババババ」 3 「ズバッ」 4 「ギャー！」 5 「ゴゴゴ」 6 「ガーン」.\n"
         "STYLE: thick bouncy manga sound-effect letters with heavy black outlines, white inner stroke and bright fills (hot pink, yellow, cyan, violet), tilted and energetic, speed lines around them."),
    ],
}
