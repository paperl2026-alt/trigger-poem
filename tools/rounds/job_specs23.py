# Round 23: the prologue's small monsters, final game sprites (docs/DESIGN.md "怪物").
# User correction (2026-10-17): NOT "a pretty girl wearing an object". A MONSTER first, clearly an anomaly (wrong anatomy, uncanny,
# creepy), that is girlified ("怪物娘化"): feminine silhouette cues, hair, ribbons, skirt-like parts, stockinged legs, shoes, lashes,
# lipstick, coy body language, spread over the monster's body. A woman's face stuck on an object does NOT count.
# Reference: art/ref/monster_ref.webp (the megaphone cluster and the photo-frame thing are the right direction).
# Each sheet = one monster in six poses (3 x 2 grid), sliced by tools/rounds/r23_import.py into enemy/<id>_<pose>.
REF = "art/ref/monster_ref.webp"
BASE = ("Reference image 1 shows the approved art direction for this game's monsters: the megaphone cluster and the photo-frame creature are right: "
        "a creepy, clearly abnormal MONSTER made from school things, that is girlified through its whole body (hair, ribbons, frills, skirt-like parts, "
        "stockinged legs, cute shoes, eyelashes, glossy lips, coy feminine body language), NOT a normal pretty girl wearing an object, and NOT an object "
        "with a woman's face stuck on it. Same anime art style as reference image 1: clean line art, full colour, sunset-lit, a thin white sticker outline. "
        "Draw a game sprite sheet: the SAME monster six times in a 3 x 2 grid (three columns, two rows), one pose per cell, all at the same scale, each pose "
        "complete and fully inside its own cell with clear empty space between cells, nothing crossing into another cell. Transparent background. "
        "No text, no letters, no numbers, no grid lines. ")
JOBS = {
    "R23_m1": [("art/raw/r23/desk.png", [REF], BASE +
        "The monster: DESK SPIDER, a heap of classroom desks and chairs fused into one crawling creature on six long chair-leg legs that end in "
        "black Mary-Jane school shoes with white frilly socks; the top desk's lid opens like jaws lined with sharpened pencils as teeth and a long red "
        "ribbon for a tongue; long glossy black hair pours out of the desk drawers and drags on the floor; several drawers are half open with eyes with long "
        "lashes peeking out; a sailor-uniform scarf is tied around its neck part; a pleated skirt of desk lids hangs around its body. "
        "Poses, left to right, top row: 1 walking (legs mid-step), 2 walking (the other step), 3 crouched low and tense, about to pounce, lid-jaws shut; "
        "bottom row: 4 leaping straight at the viewer, legs spread, jaws wide open, 5 biting right in front of the viewer, very close and big, 6 hurt, "
        "recoiling, drawers rattling, eyes squeezed shut.")],
    "R23_m2": [("art/raw/r23/board.png", [REF], BASE +
        "The monster: BLACKBOARD TEACHER, a tall green classroom blackboard standing on two long elegant legs in black stockings and red high heels; "
        "the chalk drawing on the board is a woman's face that moves (chalk lines, lipstick drawn in red chalk), it is the only face; her arms are long "
        "wooden rulers and set squares with red-polished fingernails at the tips; a tight pencil skirt made from the chalk tray and eraser; loose chalk and "
        "chalk dust swirl around her; her long hair is made of hanging pull-down map scrolls. "
        "Poses, top row: 1 half sunk down behind the floor line, only the top of the board visible (hiding), 2 rising up, 3 standing idle, coy, one heel "
        "lifted; bottom row: 4 winding up, ruler-arm pulled back holding a fan of chalk sticks, the chalk face grinning, 5 throwing, chalk sticks flying "
        "out toward the viewer, 6 hurt, the chalk face smeared, board cracked, recoiling.")],
    "R23_m3": [("art/raw/r23/paper.png", [REF], BASE +
        "The monster: TEST-PAPER GHOST, a swirling vortex of exam sheets and homework pages shaped like a floating ghost girl with no body inside, only "
        "paper: no real face, the red-pen circled zeros on the papers act as its eyes, red check marks like a smile; very long hair made of paper strips "
        "and torn ruled lines; a ribbon of red correction tape; a frilled paper skirt that ends in sharp folded paper-plane points; it floats. "
        "Poses, top row: 1 floating, 2 floating, papers fluttering differently, 3 idle hover, coy, hair curling; bottom row: 4 rearing back, gathering its "
        "papers into a tight sharp cone (winding up), 5 diving straight at the viewer, a storm of paper planes ahead of it, 6 hurt, papers torn and scattering.")],
    "R23_m4": [("art/raw/r23/shoe.png", [REF], BASE +
        "The monster: SHOE-LOCKER MIMIC, a tall row of school shoe lockers standing on four long legs in white over-knee socks and brown loafers; the "
        "locker doors are its eyelids, opening onto big glossy eyes with long lashes and pink eyeshadow; the biggest locker opens like a mouth full of "
        "rows of white indoor school slippers as teeth; a skirt of hanging gym bags and drawstring bags with ribbons; long pigtails made of shoelaces "
        "with bows. "
        "Poses, top row: 1 walking, 2 walking, the other step, 3 crouched, about to pounce, all doors snapping shut; bottom row: 4 leaping at the viewer, "
        "mouth-locker wide open, 5 biting right in front of the viewer, very close and big, 6 hurt, doors banging, slippers falling out.")],
    "R23_m5": [("art/raw/r23/horn.png", [REF], BASE +
        "The monster: PA-SYSTEM SIREN, a hovering cluster of old brass school megaphone horns growing out of one another like a bouquet, held together by "
        "a jellyfish-like body of tangled speaker cables; two long cables hang down like twin tails with big pink bows; one horn holds glossy lips with "
        "pink lipstick deep inside it; a frilly loudspeaker-grille bib; a microphone dangling like an earring; small heart-shaped speaker cones. "
        "Poses, top row: 1 hovering, 2 hovering, horns turned differently, 3 idle, cables swaying, coy; bottom row: 4 inhaling, every horn swelling and "
        "glowing pink, the lips puckered, a big long wind-up, 5 blasting a huge visible pink sound wave straight at the viewer, 6 hurt, horns dented, "
        "cables snapping.")],
    "R23_m6": [("art/raw/r23/frame.png", [REF], BASE +
        "The monster: PORTRAIT SWARM, a floating cluster of the corridor's framed class photos and a cracked full-length mirror, held together by red "
        "ribbons like a body; every frame shows the same pale girl's face from a different wrong angle, all staring; the mirror in the middle is its torso and "
        "reflects a dress that is not there; ribbons trail down like a long skirt and hair; it floats without legs. "
        "Poses, top row: 1 floating, 2 floating, frames rotated differently, 3 idle, frames tilting coyly; bottom row: 4 all frames turning to aim at the "
        "viewer, mirror glowing (winding up), 5 firing a spray of sharp mirror shards at the viewer, 6 hurt, frames cracking, a photo falling out.")],
    "R23_proj": [("art/raw/r23/proj.png", [REF], "Same anime art style as reference image 1, clean line art with a thin white outline, full colour. "
        "A game sprite sheet on a transparent background, a 3 x 2 grid, one object per cell, each centred with empty space around it, no text: "
        "1 a stick of white chalk with chalk dust, 2 a sharp shard of mirror glass with a pink glint, 3 a folded paper plane made from a test paper with a red circle, "
        "4 a confiscated smartphone with a pink case, 5 a confiscated manga volume (blank cover, no text), 6 a glowing pink ring of sound.")],
}
