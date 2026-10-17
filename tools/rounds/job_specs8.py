# Round 8 (checkpoint for the user): NIKKE-style battle poses of the user's two heroine designs + monster-girl and boss candidates
# for episode 0 (a calm after-school sunset, suddenly invaded by an evil god; no tentacles, no gems, no giant eyes).
STYLE = ("STYLE: polished anime gacha-game character art matching the reference design sheet: clean lineart, soft cel shading with smooth gradients, "
         "glossy highlights, pretty refined faces, crisp edges that cut out cleanly. No text, no letters, no logos, no watermark.")
AGE = "She is an 18-year-old third-year high-school student with an adult figure."

PINK = ("Very long wavy black hair in high twin tails tied with pink-and-mint ribbons, a white bunny hair clip, small heart charms dangling, pink eyes, a sweet sly smile. "
        "Outfit: a sheer white lace see-through cover-up dress with puffy frilled sleeves over a glossy pink lace leotard bodysuit with a yellow bow and heart buckles, a mint sailor collar, "
        "a pink heart garter on her left thigh, white frilly ankle socks, pink patent platform mary-janes with clear mint soles. "
        "Weapon: a chunky black-and-pink compact gatling rifle with a round drum magazine and a white bunny sticker.")
CAT = ("Short messy white hair with two thin braids, white cat ears with a red ribbon and a gold bell, red eyes behind thin red-framed glasses, a calm gentle smile. "
       "Outfit: a cream wafuku-style sailor top with wide kimono sleeves lined in mint green, a navy sailor collar, a navy obi sash with red cords, gold bells and tassels, "
       "a navy pleated skirt with a cream hem, black bike shorts, white frilly ankle socks with red ribbons, black platform geta sandals, a long fluffy white cat tail. "
       "IMPORTANT: her RIGHT arm (only the right one) is a big white furry cat paw with long red claws that burns with pale jade-green spirit flames; her LEFT hand is a normal human hand.")

LEFT = ("The camera is BEHIND her and slightly to her left at shoulder height — the over-the-shoulder rear view of the playable heroines in the game NIKKE: Goddess of Victory. "
        "She is on the LEFT side of the screen, facing away from the viewer into the depth of the picture, turned slightly to the RIGHT, her face only in lost profile.")
RIGHT = ("The camera is BEHIND her and slightly to her right at shoulder height — the over-the-shoulder rear view of the playable heroines in the game NIKKE: Goddess of Victory. "
         "She is on the RIGHT side of the screen, facing away from the viewer into the depth of the picture, turned slightly to the LEFT, her face only in lost profile.")
SHEET = ("Game character sprite sheet: two full-body figures of the same character side by side on a fully transparent background, identical scale (about 7.5 heads tall), "
         "a wide empty gap between them, nothing overlapping or cut off. No background, no floor, no ground shadow, no cover objects, no muzzle flash, no beams.")

MON = ("STYLE: the same polished anime gacha-game art as a heroine design sheet: cute monster girls, the enemies of a cute light-gun game. Each one is a pretty girl first — "
       "a school object or a schoolgirl twisted by an evil god's invasion — mischievous and adorable, never gross, no gore, no tentacles, no gems, no robots. "
       "Possessed details are shown with dark ink-like shadow, glowing magenta eyes and torn-paper edges. No text, no letters.")


def mons(out, items):
    return (f"art/raw/{out}.png", [], "Monster-girl design candidates: three separate full-body characters in a single row on a fully transparent background, "
            "front view, identical scale, a wide empty gap between them, nothing cut off.\n" + "\n".join(f"{i + 1}: {d}" for i, d in enumerate(items)) + "\nNo background, no shadow.\n" + MON)


JOBS = {
    "P8_pink": [("art/raw/pink_cover_aim.png", ["art/ref/pink_sheet.png", "art/ref/pink_poses.png"],
                 "Image 1 is the official character design sheet and Image 2 shows more of the same girl: keep her face, hair, outfit and gun exactly. " + AGE + " " + PINK + "\n" + LEFT + "\n" + SHEET +
                 "\nLeft figure, TAKING COVER: crouched low on one knee, hugging the gun upright to her chest, head turned to the right showing a sly profile, twin tails pooling down her back.\n"
                 "Right figure, FIRING: standing in a wide stance, leaning forward slightly, gun shouldered and aimed into the distance a little right of straight ahead, twin tails swinging.\n" + STYLE)],
    "P8_cat": [("art/raw/cat_cover_aim.png", ["art/ref/cat_sheet.png", "art/ref/cat_poses.png"],
                "Image 1 is the official character design sheet and Image 2 shows more of the same girl: keep her face, hair, ears, glasses, outfit and tail exactly. " + AGE + " " + CAT + "\n" + RIGHT + "\n" + SHEET +
                "\nLeft figure, TAKING COVER: crouched low, her right cat paw held close to her chest, head turned to the left showing a calm profile, tail curled on the floor.\n"
                "Right figure, ATTACKING: standing in a wide stance, her RIGHT cat paw thrust forward at full arm's reach into the distance a little left of straight ahead, claws spread, "
                "jade-green spirit flame around the paw, tail swishing.\n" + STYLE)],
    "M8_a": [mons("mon_cand_a", [
        "A possessed classmate: a cute schoolgirl in a sailor uniform sleepwalking with arms out, dark ink shadow streaming from her hair and skirt hem, glowing magenta eyes, a dreamy smile.",
        "A shoe-locker girl: a girl wearing a wooden school shoe locker as a box costume up to her chest, its little doors flapping, holding indoor shoes ready to throw, cheeky grin.",
        "A PA-speaker girl: a girl wearing a big school loudspeaker horn as a hat with cable pigtails, holding a microphone, shouting with a wide open mouth.",
    ])],
    "M8_b": [mons("mon_cand_b", [
        "A ghost senpai: a translucent floating schoolgirl ghost with a long trailing scarf instead of legs, pale glow, waving playfully.",
        "A chalkboard girl: a girl with a blackboard-eraser hair ornament and a chalk-tray belt, chalk dust swirling, holding sticks of colored chalk like darts.",
        "A curtain girl: a girl wrapped in a classroom window curtain like a hooded cape, hanging upside down from the curtain rail, long hair dangling, grinning.",
    ])],
    "M8_boss": [("art/raw/boss_cand.png", [], "Boss monster-girl design candidates: three separate giant full-body characters in a single row on a fully transparent background, front view, "
                 "identical scale, a wide empty gap between them, nothing cut off.\n"
                 "1: the possessed student council president: a tall elegant girl with long hair and a council armband, floating, holding a megaphone like a scepter, a huge cape made of dark ink shadow and torn paper.\n"
                 "2: the clock-tower girl: a giant girl personifying the school clock tower, a big clock face as a halo behind her head, a dress shaped like the tower, clock hands as a pair of swords.\n"
                 "3: the track-field queen: a giant athletic girl in a school gym uniform and headband, starting pistol in hand, running-track lanes curling around her like ribbons, a relay baton.\n"
                 "No background, no shadow.\n" + MON)],
}
