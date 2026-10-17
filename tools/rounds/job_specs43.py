# Round 43 (docs/PLAN.md 第七批):
#   R43_boss_s<n>:  the new prologue boss "???" (docs/DESIGN.md 序章 / Boss): the formless thing that fell on the school, possessing the
#                   discipline-committee girl, G-virus-like mutation x cosmic horror, five stages from infection to the core. Each stage one
#                   whole-body sprite sheet (3 x 2 poses, like the small monsters), three candidates.
#   R43_bproj:      its projectiles.
#   R43_m_<id>:     four new small monsters similar to the existing ones (same behaviour templates), three designs each.
#   R43_item_pig:   the eldritch piggy bank (bag item, the reward for clearing the prologue).
#   R43_cor_<key>:  the corridor's anomaly versions (<key>_x): the corridor comes after the classroom was hit, so it must look hit too.
#   R43_page_intro: the new opening page (the diary, the phone, the bell, the thing falling on the school).
# (the boss's own comic pages come after its design is picked: job_specs43b.py)
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs28 import FLAT
from job_specs23 import BASE as MBASE, REF as MREF
from job_specs41 import STYLE as PAGE_STYLE, REFS as PAGE_REFS, CATD, PINKD

CAT, PINK, GIRL = "art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/raw/r25/master.png"
MON = [MREF, "art/raw/r23/desk.png", "art/raw/r23/horn.png"]   # the approved monster direction + two approved sheets (style, line, colour)
A = "public/content/base/assets/"
JOBS = {}

# ---------------------------------------------------------------- the boss "???"
BOSS = ("Reference image 1 shows the approved art direction for this game's monsters; reference images 2 and 3 are approved monster sprite "
        "sheets of this game: draw in EXACTLY their art style (clean anime line art, full colour, sunset light turned violet, a thin white "
        "sticker outline around the figure). Reference image 4 is a schoolgirl (long straight black hair, dark blazer school uniform, pleated "
        "skirt, black stockings): she is the HOST of the monster; ignore her armband, whistle and anything she carries, they must NOT appear. "
        "THE MONSTER: a formless cosmic-horror THING that fell from the sky has possessed her and mutates her like the G-virus: iridescent oily "
        "black-violet flesh, clusters of glossy eyes of different sizes, mouths with teeth in the wrong places, pink glowing veins, dripping "
        "ooze, tendrils, her black hair merging into tendrils. It must look like a MONSTER first: grotesque, disgusting, uncanny, scary, "
        "sanity-draining, strong visual impact. Female body parts may be mixed into it (long legs in torn black stockings, slender pale arms "
        "with painted nails, glossy lips), but it is NOT a pretty girl with monster marks and it is not beautiful. No armband, no whistle, no "
        "megaphone, no school props. "
        "Draw a game sprite sheet: the SAME monster six times in a 3 x 2 grid (three columns, two rows), one pose per cell, all at the same "
        "scale, each pose complete (the whole body) and fully inside its own cell with clear empty space between cells, nothing crossing into "
        "another cell. Transparent background. No text, no letters, no numbers, no grid lines, no ground, no shadows, no effects around it. "
        "Poses, left to right, top row: 1 idle, 2 idle (breathing, eyes looking elsewhere), 3 moving sideways (shuffling / crawling / drifting "
        "to the side); bottom row: 4 winding up an attack, swelling, eyes and veins glowing pink, 5 attacking: spitting / flinging a volley "
        "straight at the viewer, the mouths wide open, 6 hurt, recoiling, eyes squeezed shut, ooze splashing. ")
STAGES = {
    1: "STAGE 1, INFECTION: still mostly the girl, standing hunched and twitching, but the thing has burst out of her back and right shoulder "
       "as a heavy mass of oily black-violet flesh studded with eyes; her right arm has become a long boneless limb that splits into many long "
       "fingers; her face is mostly hidden by her hair, one visible eye replaced by a cluster of small eyes; her skirt and stockings torn.",
    2: "STAGE 2, SPREAD: half of her is the mass now: her right side bulges into a huge distorted arm with a giant eye in its palm, extra "
       "slender pale female arms sprout from her back, her legs bend backwards like an animal's, black stockings stretched and torn, a second "
       "mouth with teeth opens along her ribs.",
    3: "STAGE 3, FULL MUTATION: she is swallowed: a lumbering hulk of flesh as big as a small truck, her pale upper body fused into its top like "
       "a ship's figurehead, arms hanging limp, her long hair grown into dozens of black tendrils; a huge vertical mouth with rows of teeth "
       "splits the bulk; it walks on many long female legs in torn black stockings and school loafers.",
    4: "STAGE 4, LOSS OF CONTROL: no stable shape: a hovering, writhing mass that keeps reshaping, faces and slender limbs surfacing and sinking "
       "back into it, rings of eyes, impossible sharp geometric angles in the flesh, tendrils lashing; it floats above the ground.",
    5: "STAGE 5, THE CORE: the mass has collapsed into a pulsating floating core: a huge glowing eye-orb wrapped in hair and ribs like a "
       "cocoon, the girl's body curled up asleep faintly visible inside it (she can still be saved), tendrils hanging below, chunks of flesh "
       "orbiting around it.",
}
for n, d in STAGES.items():
    JOBS[f"R43_boss_s{n}"] = [(f"art/raw/r43/boss_s{n}_{v}.png", MON + [GIRL], BOSS + d + f" Variation {v}: its own design details.") for v in "abc"]
JOBS["R43_bproj"] = [(f"art/raw/r43/bproj_{v}.png", MON, "Draw in EXACTLY the art style of reference images 2 and 3 (clean anime line art, full "
    "colour, a thin white sticker outline). A game sprite sheet on a transparent background, a 3 x 2 grid, one object per cell, each centred "
    "with empty space around it, no text, no effects around them: the projectiles a cosmic-horror monster spits: 1 a veined glossy eyeball "
    "trailing black-violet ooze, 2 a black-violet ooze blob with tiny teeth, 3 a writhing black hair tendril dart with a sharp tip, 4 a jagged "
    "pink-glowing tooth shard, 5 a small flesh orb with glossy lips, 6 a cluster of tiny eyes stuck together. Variation " + v + ".") for v in "ab"]

# ---------------------------------------------------------------- four new small monsters, like the existing ones
NEW = {
    "chair": ("walker, like the desk spider", "CHAIR CENTIPEDE, a long chain of school chairs fused seat to back like a centipede, the chair legs "
              "are its many legs ending in white frilly socks and black Mary-Jane shoes; its head is the front chair's backrest with long black "
              "braids and a big hair ribbon; the front seat opens like a mouth lined with thumbtacks; eyes with long lashes peek between the "
              "slats; a sailor scarf tied around its neck part.",
              "Poses, top row: 1 walking (legs mid-step), 2 walking (the other step), 3 crouched low and tense, about to pounce; bottom row: 4 "
              "leaping straight at the viewer, legs spread, mouth wide open, 5 biting right in front of the viewer, very close and big, 6 hurt, "
              "recoiling, slats rattling, eyes squeezed shut."),
    "book": ("flyer, like the test-paper ghost", "TEXTBOOK MOTH, a floating creature whose wings are open textbooks flapping their pages, the "
             "pages patterned with eye spots like a moth's wings, a body of rolled-up notebooks, ribbon bookmarks curling like twin tails, "
             "glossy lips on the spine, two dangling legs in knee socks and loafers.",
             "Poses, top row: 1 flying, wings up, 2 flying, wings down, 3 idle hover, coy, legs crossed; bottom row: 4 rearing back, wings "
             "folding into a sharp point (winding up), 5 diving straight at the viewer, a storm of torn pages ahead of it, 6 hurt, pages torn "
             "and scattering."),
    "clock": ("thrower that hides behind things and pops up, like the blackboard teacher", "WALL-CLOCK LADY, a big round school wall clock "
              "as her head and body, the numbers replaced by small blinking eyes, the two clock hands are long red-nailed fingers, she stands on "
              "two long legs in black tights and red heels, a pendulum swinging under her like a skirt, spare clock hands bundled in her arms.",
              "Poses, top row: 1 half sunk down behind the floor line, only the top of the clock visible (hiding), 2 rising up, 3 standing "
              "idle, coy, one heel lifted; bottom row: 4 winding up, a fan of sharp clock hands drawn back, eyes glowing, 5 throwing, clock "
              "hands flying out toward the viewer, 6 hurt, glass cracked, eyes squeezed, recoiling."),
    "ext": ("hovering blaster with one huge must-hide attack, like the PA siren", "FIRE-EXTINGUISHER SIREN, a hovering bouquet of red fire "
            "extinguishers bound together by their black hoses like a jellyfish body, two hoses hanging down like twin tails with big pink bows, "
            "one nozzle holds glossy pink lips, a fire-alarm bell as a heart on her chest, a frilly safety-pin bib.",
            "Poses, top row: 1 hovering, 2 hovering, hoses swaying differently, 3 idle, coy; bottom row: 4 inhaling, every extinguisher swelling "
            "and glowing pink, the lips puckered (a big long wind-up), 5 blasting a huge cone of pink foam straight at the viewer, 6 hurt, "
            "cans dented, hoses snapping."),
}
for k, (beh, d, poses) in NEW.items():
    JOBS[f"R43_m_{k}"] = [(f"art/raw/r43/m_{k}_{v}.png", [MREF, "art/raw/r23/desk.png", "art/raw/r23/paper.png"], MBASE + "Reference images 2 "
                           "and 3 are approved sheets of this game: match their art style exactly. The monster (" + beh + "): " + d + " " +
                           poses + f" Variation {v}: its own design details, same idea.") for v in "abc"]
JOBS["R43_mproj"] = [("art/raw/r43/mproj.png", [MREF, "art/raw/r23/proj.png"], "Same art style as reference image 2 (clean line art, thin white "
    "outline, full colour). A game sprite sheet on a transparent background, a 3 x 2 grid, one object per cell, centred with empty space around "
    "it, no text: 1 a long sharp red clock hand, 2 a short black clock hand, 3 a blob of pink extinguisher foam, 4 a burst of foam bubbles, 5 a "
    "torn textbook page folded into a dart, 6 a thumbtack.")]

# ---------------------------------------------------------------- the eldritch piggy bank
ITEMS = [A + "item/cat.webp", A + "item/anpan.webp", A + "item/charm.webp"]
JOBS["R43_item_pig"] = [(f"art/raw/r43/item_pig_{v}.png", ITEMS, "Reference images are this game's bag item icons: draw in EXACTLY their "
    "style (same rendering, outline, colours, size and framing). ONE item icon on a transparent background: an ELDRITCH PIGGY BANK: a "
    "glossy ceramic piggy bank that is wrong in an unnamable way: several coin-slot mouths that seem to breathe, a few cute glossy eyes in "
    "the wrong places, soft pink porcelain with a violet glow leaking through hairline cracks, little ribbon-like feelers, a gold coin half "
    "swallowed. Cute and creepy at once (kimo-kawaii), a bit grotesque. NOT an octopus, NOT Cthulhu, no tentacle face, no squid. No text."
    f" Variation {v}.") for v in "abcd"]

# ---------------------------------------------------------------- the corridor after the hit (anomaly versions)
WALLS = ["art/raw/r31/wallL4.png", "art/raw/r31/wallR2.png"]
STYLE = ("Reference images 1 and 2 are panels of this game's school corridor: paint in EXACTLY their style (painting technique, line work, "
         "colours, light, level of detail). Reference image 3 shows how this game paints a surface AFTER the anomaly hit (match that treatment). "
         "Reference image 4 is the calm version of THIS surface: keep its layout and every object exactly, only change what the anomaly does. ")
ANOM = ("ANOMALY VERSION: the same surface right after an evil violet energy struck the school: the light turned magenta-violet, glowing pink "
        "cracks run across it, a few dark violet eye sigils are smeared on it, a little violet goo drips, things on it are knocked askew. ")
GLASS = " Paint every window PANE as solid flat pure magenta #FF00FF, nothing else magenta."
COR = {}
for k in ["wallA", "wallB"] + [f"wallL{i}" for i in range(1, 9)]: COR[k] = ("wall", "")
for k in ["wallW"] + [f"wallR{i}" for i in range(1, 9)]: COR[k] = ("wall", GLASS)
for k in ["floor", "floor2", "floor3", "floor4"]: COR[k] = ("floor", " Seamless and tileable on all four edges.")
for k in ["ceil", "ceil2", "ceil3", "ceil4"]: COR[k] = ("ceil", " Seamless and tileable on all four edges.")
for k in ["end", "end2"]: COR[k] = ("wall", "")
ANOMREF = {"wall": "art/raw/r42/cls_door1_x.png", "floor": "art/raw/r42/cls_floor1_x.png", "ceil": "art/raw/r42/cls_ceil1_x.png"}
VIEW = {"wall": FLAT, "floor": FLAT.replace("front-on view", "top-down view looking straight down"), "ceil": FLAT.replace("front-on view", "view looking straight up")}
keys = list(COR)
for i in range(0, len(keys), 4):
    JOBS[f"R43_cor_{i // 4}"] = [(f"art/raw/r43/cor_{k}_x.png", WALLS + [ANOMREF[COR[k][0]], A + f"st3/{k}.webp"], STYLE + VIEW[COR[k][0]] + ANOM +
                                  COR[k][1] + " No people, no monsters, no text.", "OPAQUE") for k in keys[i:i + 4]]

# ---------------------------------------------------------------- the new opening page
JOBS["R43_page_intro"] = [(f"art/raw/r43/page_intro_{v}.png", [CAT, PINK], PAGE_REFS.format(boss="") + PAGE_STYLE +
    "Five panels, read left to right, top row then bottom row: 1 (top left) close-up of " + CATD + " at her desk reading her own little "
    "diary, the open page facing the viewer with a cute doodle of a limited sweet (a melon bread with a crown) and the words '今日 限定!!', "
    "her eyes shining; 2 (top right) close-up of " + PINKD + " scrolling her phone under the desk, the SCREEN FACING THE VIEWER showing an "
    "anime goods shop sale banner with a chubby plush mascot and the words 'SALE 限定', she bites her lip excitedly; 3 (middle, a narrow wide "
    "panel) the classroom wall clock hitting 17:00, the school bell ringing, the big lettering 'DING DONG♪'; 4 (bottom left) both girls "
    "springing up from their seats at the same moment on opposite sides of the empty classroom, bags in hand, not noticing each other; 5 "
    "(bottom right, big) the school building from outside at sunset: the sky tears open and a black-violet FORMLESS THING, an oily mass of "
    "eyes and tendrils, crashes down onto the roof like a meteor, violet shock rings, the big sound effect 'BOOOM!!'." +
    f" Variation {v}: its own panel layout and camera angles.", "OPAQUE") for v in "abc"]
