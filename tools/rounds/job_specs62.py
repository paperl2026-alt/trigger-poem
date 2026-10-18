# Round 62 (docs/DESIGN.md「第 2 话」钟楼惊宿, the user 2026-10-18: "Codex 多出出", "和风浴衣试试看 codex 能不能维持不变的情况下局部更改"):
# the first designs of episode 2 (a homage to the SFC game Clock Tower, set in an old Japanese inn), several directions each to pick from.
#   R62_she_*:    "she", the stalker that cannot be killed: a giant pair of Japanese scissors that became the ichimatsu doll of the inn's
#                 glass case; five different directions, each a 3 x 2 sheet of the six poses the game needs.
#   R62_kaiko_*:  the giant silkworm "okaiko-sama" kept under the house (the original's giant baby Dan), three directions.
#   R62_m_*:      six kinds of small monsters (paper dolls she cuts, lantern ghosts, the missing guests' slippers, umbrella ghosts, a
#                 futon, kokeshi dolls), five designs each (three are used: docs/ART.md 多版本).
#   R62_sc_*:     concept paintings of the ten places of the one long stage, two candidates each; the first three places also get the
#                 version after the lights go out (painted over the calm one).
#   R62_yk_*:     the user's test: can Codex redraw the four battle sprites (public/jiggle/<who>_<cover|fire>.png) in a yukata while
#                 everything else stays put, so the jiggle rig still fits? Three tries each; references are the sprites on a flat grey
#                 2:3 canvas (art/raw/r62/ref_*.png, offsets in ref_meta.json).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs23 import REF as MREF

R = "art/raw/r62/"
MON = [MREF, "art/raw/r23/desk.png", "art/raw/r43/m_clock_a.png", "art/raw/r56/m_cup_a.png"]
JOBS = {}

SHEET = ("Draw a game sprite sheet: the SAME monster six times in a 3 x 2 grid (three columns, two rows), one pose per cell, all at the "
         "same scale, each pose complete (the whole body) and fully inside its own cell with clear empty space between cells, nothing "
         "crossing into another cell. Transparent background. No text, no letters, no numbers, no grid lines, no ground, no cast "
         "shadows. NO EFFECTS: no glow, no sparkles, no motion lines, no smoke, steam or fire, no light rays around it (the game adds "
         "every effect itself). ")
STYLE = ("Reference image 1 shows the approved art direction for this game's monsters (the megaphone cluster and the photo-frame "
         "creature are right); reference images 2, 3 and 4 are approved monster sprite sheets of this game: draw in EXACTLY their art "
         "style (clean anime line art, full colour, rich detail, a thin white sticker outline around the figure). ")
INN = ("It belongs to an old traditional Japanese inn (ryokan) in a misty mountain town, a house that has rung the town's time bell for "
       "two hundred years and is full of antique Japanese clocks. It must look like a MONSTER first: NOT a normal pretty girl wearing an "
       "object, NOT an object with a woman's face stuck on it; it is girlified through its whole body (long hair, ribbons, kimono "
       "sleeves, obi bows, frills, stockinged or tabi-socked legs, cute footwear, eyelashes, glossy lips, coy feminine body language). "
       "Colours: lacquer red, washi-paper ivory, ink black, aged cedar brown, faded indigo, tarnished brass, a little cherry pink; NOT "
       "dark green, NOT violet. Creepy-cute, Japanese ghost-story mood. ")

# ---------------------------------------------------------------- she (the stalker)
SHE_POSES = ("Poses, top row: 1 standing perfectly still and upright like a doll on display, pretending to be an ornament, 2 walking "
             "toward the viewer, mid-step, 3 walking, the other step; bottom row: 4 winding up: the scissor blades spread wide open high "
             "above, about to snip (a long, clearly telegraphed wind-up), 5 lunging and snipping straight at the viewer, very close and "
             "big, blades crossing, 6 knocked down: collapsed on the floor in a twisted heap, blades splayed, stunned (she will get up "
             "again). ")
SHE_ROLE = ("THE MONSTER is the stalker of this episode, about 2.3 metres tall: she cannot be killed, only knocked down for a moment, and "
            "she chases the heroines through the whole inn snipping her blades. She is the inn's lucky ichimatsu doll (a traditional "
            "Japanese play doll with a blunt black bob and a red furisode kimono) fused with a giant pair of scissors. ")
SHE = {
    "a": "WALKING NIGIRI-BASAMI: a giant pair of traditional Japanese nigiri-basami spring scissors (one U-shaped bow of black forged steel "
         "with two long blades) standing upright on its two blade tips as legs; the U-shaped bow at the top is her head and hunched "
         "back, draped with a glossy black blunt-bob doll wig like a hood; under the straight bangs a narrow white porcelain doll face "
         "split down the middle where the two blades meet, black glass eyes, tiny red lips; a red furisode kimono with very long "
         "swinging sleeves is tied around the pivot like a short dress, the sleeves hanging down like arms; a big red obi bow at the "
         "back; tiny black lacquered pokkuri sandals on the blade tips.",
    "b": "ICHIMATSU WITH SHEAR ARMS: a life-size ichimatsu doll in a red furisode with a white crane pattern, glossy black blunt-bob "
         "hair, a white porcelain face with a tiny painted mouth and black glass eyes, her neck too long and bent sideways; instead of "
         "hands her two long sleeves end in enormous tailoring shears (tachi-basami) whose blades drag on the floor; under the kimono "
         "hem there are no feet, the hem sways just above the floor; hairline cracks run across the porcelain.",
    "c": "SCISSOR SPIDER DOLL: her body is dozens of old scissors of every kind (sewing shears, nigiri-basami, bonsai scissors) bundled "
         "at a red obi knot like a spider, their blades as eight long legs; on top an ichimatsu doll's head and shoulders with long "
         "straight black hair falling around the bundle, a red kanzashi hairpin, a red kimono collar and long sleeves draped over the "
         "scissor legs like a skirt.",
    "d": "GARDEN-SHEARS STILT GIRL: an ichimatsu doll in a short red furisode riding on top of a giant pair of ueki-basami garden "
         "pruning shears that she uses as two tall stilt-legs, her own little legs in white tabi dangling above the shears' handles; "
         "black blunt-bob hair, porcelain face, a red obi with a huge bow, a third pair of small sewing scissors in her hands; the "
         "shears' handles are wrapped in red cord like her kimono ties.",
    "e": "EMPTY FURISODE: a floating red furisode kimono with no body inside, standing up by itself; its two very long sleeves end in "
         "the blades of giant scissors; out of the empty collar spills a mass of glossy black blunt-bob hair with one big black glass "
         "eye and a red-lipped mouth that opens sideways like scissor blades; a red obi with a huge bow; a white crane and cherry pattern "
         "on the kimono, the hem dragging.",
}
for k in "abcde":
    JOBS.setdefault(f"R62_she_{'ab' if k in 'ab' else 'cde'}", []).append(
        (f"{R}she_{k}.png", MON, STYLE + SHE_ROLE + INN + "Design direction: " + SHE[k] + " " + SHEET + SHE_POSES))

# ---------------------------------------------------------------- okaiko-sama (the original's giant baby Dan)
KAIKO_ROLE = ("THE MONSTER is the stalker's twin, hidden under the inn: a huge silkworm larva the size of a room (the inn was a "
              "silk-raising farmhouse long ago), revered as okaiko-sama and fed with the guests; gluttonous like a giant baby. It is "
              "girlified like a baby girl: swaddled in a silk cocoon like a baby blanket, a red bib, long black hair growing from the "
              "head, a tiny red ribbon, big glossy eyes with lashes, chubby tiny hands among its many little legs. ")
KAIKO_POSES = ("Poses, top row: 1 asleep, curled up on a cushion of silk and mulberry leaves, 2 waking: rearing up, eyes snapping open, "
               "3 crawling fast toward the viewer (the chase); bottom row: 4 rearing back, mouth gaping (winding up to lunge), 5 lunging "
               "with its mouth wide open straight at the viewer, very close, 6 hurt: writhing, the cocoon torn, eyes squeezed shut. ")
KAIKO = {
    "a": "pale ivory white segmented body with soft folds like a baby's skin, the cocoon swaddle wrapped around its middle with a red cord",
    "b": "translucent milky body with darker veins, the head looks like a huge baby-doll head with a bald crown and long black hair at "
         "the back, many little pink feet",
    "c": "a body ringed with faded indigo and ivory bands like an old kimono, a big lacquered red bib, long black hair in a single braid",
}
for k in "abc":
    JOBS.setdefault("R62_kaiko", []).append(
        (f"{R}kaiko_{k}.png", MON, STYLE + KAIKO_ROLE + INN + "Design direction: " + KAIKO[k] + ". " + SHEET + KAIKO_POSES))

# ---------------------------------------------------------------- six small monsters, five designs each
NEW = {
    "katashiro": ("small paper flyer that comes in big swarms and dies from one shot",
                  "KATASHIRO PAPER DOLL, a small flat paper doll cut out of shoji paper by the stalker's scissors (a Shinto katashiro "
                  "figure: a simple person shape with a round head and spread arms), come alive: scissor-cut zigzag edges, a painted "
                  "red-lipped smile and lashes, a little paper bob haircut, a paper kimono with a red string tied as an obi, little "
                  "legs that flutter like ribbons.",
                  "Poses, top row: 1 fluttering up, 2 fluttering down, 3 stuck flat against a wall, still (idle); bottom row: 4 folding "
                  "its arms back, about to dive (winding up), 5 diving straight at the viewer, arms out, 6 hurt: torn half through, "
                  "crumpling."),
    "chochin": ("floating lantern ghost that spits small things the player must shoot down",
                "CHOCHIN-OBAKE, a classic Japanese paper-lantern ghost: an old split red-and-ivory paper lantern with a long lolling "
                "tongue and one big eye in the split; girlified: long black hair streaming from the top cap, a red ribbon, lashes on the "
                "eye, glossy lips around the split mouth, two long kimono sleeves hanging from its sides as arms, a tassel like a skirt.",
                "Poses, top row: 1 hovering, 2 hovering, swaying, 3 idle, coy, sleeves covering the mouth; bottom row: 4 inhaling: the "
                "lantern swelling, cheeks puffed (winding up), 5 spitting straight at the viewer, mouth wide (do NOT draw what it "
                "spits), 6 hurt: the paper torn, ribs showing, eye squeezed shut."),
    "surippa": ("small runner that comes in packs, low health",
                "LOST SLIPPERS, a pair of inn guest slippers (red or indigo with the inn's crest) that walk by themselves on thin legs "
                "in white tabi socks: the slipper toe is a mouth with tiny sharp teeth and a pink tongue, lashes on the strap, a ribbon "
                "tied on, one slipper cut cleanly in half by scissors and sewn back with red thread.",
                "Poses, top row: 1 standing neatly side by side like slippers waiting at a door (idle), 2 running, 3 running, the other "
                "step; bottom row: 4 crouching, about to leap (winding up), 5 leaping and biting straight at the viewer, 6 hurt: "
                "flipped over, legs kicking."),
    "karakasa": ("hopper that bounces from side to side in zigzags",
                 "KARAKASA-OBAKE, the classic one-legged umbrella ghost: an old oiled-paper umbrella (wagasa) with one big eye and a "
                 "long tongue; girlified: the umbrella's ribs and paper hang like a frilly skirt and long black hair, a red obi bow at "
                 "the handle, the single leg in a white stocking and a tall lacquered geta, lashes, glossy lips.",
                 "Poses, top row: 1 standing on its one leg, closed like a folded umbrella (idle), 2 hopping, opened up, 3 landing; "
                 "bottom row: 4 spinning and crouching, about to spring (winding up), 5 springing straight at the viewer, tongue out, "
                 "6 hurt: paper torn, ribs bent."),
    "futon": ("big slow blocker that soaks up a lot of shots",
              "FUTON-MUSUME, a thick old futon rolled up and tied like a giant cocoon, walking on two legs in white tabi; girlified: "
              "long black hair spilling out of the top roll, a buckwheat pillow as a head with one sleepy eye and a drooling mouth, "
              "the quilt pattern like a red-and-indigo furisode, an obi cord tied round its middle, lashes, glossy lips.",
              "Poses, top row: 1 lying flat on the floor like a laid-out futon (idle), 2 standing up, rolling forward, 3 waddling, the "
              "other step; bottom row: 4 rearing back, unrolling wide (winding up), 5 falling on the viewer like a wave of quilt, very "
              "close, 6 hurt: stuffing bursting out, eye squeezed shut."),
    "kokeshi": ("pops up from behind furniture and throws things",
                "KOKESHI, a tall wooden kokeshi doll from the inn's souvenir shelf: a round head with painted black bob hair and a red "
                "kanzashi, a long limbless body painted with red and black chrysanthemums; girlified and wrong: the painted smile too "
                "wide, real glossy lips, real lashes, the head can turn all the way round, two thin wooden arms that unfold from the "
                "body when it attacks.",
                "Poses, top row: 1 hiding: sunk behind the bottom edge, only the top of the head and the painted eyes peeking over, 2 "
                "rising up, 3 idle, head turned half around; bottom row: 4 winding up to throw, a thin arm drawn back holding a small "
                "kokeshi, 5 throwing straight at the viewer, 6 hurt: the paint cracking, the head split."),
}
for mid, (role, look, poses) in NEW.items():
    for k in "abcde":
        JOBS.setdefault(f"R62_m_{mid}", []).append(
            (f"{R}m_{mid}_{k}.png", MON, STYLE + f"THE MONSTER ({role}): " + look + " " + INN +
             {"a": "", "b": "Make this design clearly different from the obvious one: a different silhouette and proportions. ",
              "c": "Make this design taller and creepier, more wrong. ", "d": "Make this design rounder and cuter, but still a monster. ",
              "e": "Make this design older and more worn, patched and tied with red thread. "}[k] + SHEET + poses))

# ---------------------------------------------------------------- concept paintings of the ten places
CREF = ["art/raw/r53/sc_gallery_a.png", "art/ref/corridor_concept.png"]
CSTYLE = ("Reference images 1 and 2 are approved concept paintings of this game: match their painting technique exactly (anime "
          "background art, rich detail, clean line work, painterly light, the camera at a person's eye height looking along the "
          "length of the space). Paint a CONCEPT PAINTING of a place in this game, wide, 3:2. No people, no characters, no monsters, no "
          "text, no letters. ")
CALM = ("Night, the inn at peace: warm amber light from paper lanterns, andon lamps and pendant lamps, deep indigo night outside, "
        "polished old cedar wood, tatami, washi paper, red lacquer accents; cosy, a little lonely and eerie: too quiet, every clock "
        "ticking. ")
DARK = ("The inn after the lights went out and the stalker woke: only paper lanterns and candles still burn, warm amber pools of "
        "light against deep indigo darkness; shoji paper slashed into long hanging ribbons, clean scissor cuts in everything (screens, "
        "curtains, cushions, hanging scrolls), cut red threads, long strands of black hair caught on things, little white paper dolls "
        "(katashiro) stuck on walls and pillars; still beautiful in a creepy-cute way, NOT dark green, NOT violet, NOT a gloomy grey "
        "palette. ")
XS = ("Reference image 3 is the calm version of this exact place: repaint the SAME place, same camera, same layout, every object in the "
      "same position and size, as it looks after the lights went out and the stalker woke. ")
PLACES = {
    "genkan": (True, "the entrance hall and front desk of a two-storey old ryokan: a raised wooden step with rows of guest slippers "
               "lined up neatly, a big glass display case with a life-size ichimatsu doll in a red kimono holding small scissors, a "
               "bird cage with a black crow, a whole wall of antique Japanese clocks (wadokei tower clocks and pendulum clocks), a "
               "wooden reception counter with a brass call bell and a notice board of handwritten paper notes (squiggles only, no "
               "readable text), a polished staircase going up, noren curtains"),
    "rouka": (True, "a long wooden upstairs corridor: shoji sliding doors of guest rooms along one side, each with a pair of slippers "
              "set neatly in front of it, old glass windows along the other side looking down on a rainy courtyard, round paper "
              "lanterns hanging from the ceiling beams, a pendulum clock on a pillar, the corridor running far into the dark"),
    "kyakushitsu": (True, "an eight-tatami guest room: two futons laid out side by side, a low table with a tea set and wagashi, a "
                    "tokonoma alcove with a hanging scroll of a bell tower and a vase of flowers, an oshiire closet with sliding "
                    "fusuma doors, shoji windows, two travel bags and a phone charger in the corner"),
    "furo": (False, "a private family bath: a big square hinoki cypress-wood bathtub with a heavy wooden lid laid half over it, the "
             "water dark, wooden buckets and stools, blue-and-white tiled walls, a small high window, a changing area beyond a noren "
             "curtain with bamboo baskets (do not paint steam)"),
    "hiroma": (False, "a huge banquet hall: a hundred tatami mats, long rows of low lacquered tables set with a full feast that nobody "
               "ate, gold folding screens (byobu) with cranes, rows of hanging lanterns, shoji walls all around lit from outside, a "
               "big square skylight of old glass in the coffered ceiling"),
    "nakaniwa": (False, "a rainy inner courtyard garden at night: a koi pond, stone lanterns, a shishi-odoshi bamboo fountain, a long "
                 "covered wooden walkway (watari-rouka) on posts crossing the garden to a white-plaster storehouse, paper lanterns "
                 "along the walkway, wet tiled roofs all around (paint the rain as fine lines only, no mist)"),
    "kura": (False, "the inside of an old storehouse (kura): thick white plaster walls, a heavy iron-studded door, steep wooden "
             "ladder-stairs, shelves of paulownia boxes and old ledgers, tansu chests, stacks of round bamboo silkworm trays, and one "
             "whole wall covered with dozens of antique Japanese clocks, all stopped"),
    "chika": (False, "under the house: worn stone steps down to an old ice cellar with straw-wrapped blocks, opening into a limestone "
              "cave with stalactites, mulberry branches laid along the path, and at the far end a wooden stage with red curtains "
              "drawn back like a shrine, rows of candles and offerings before a huge empty silk cushion, a cliff edge to one side"),
    "shoro": (False, "inside a tall wooden bell tower: a hanging wooden lift platform on thick ropes with counterweights, a long "
              "vertical shaft, huge wooden and brass clock gears turning on the walls, ladders and catwalks, the camera looking "
              "down the shaft into the dark"),
    "kane": (False, "the top of the bell tower under its curved tiled roof: a giant bronze temple bell (bonsho) hanging in the middle "
             "with its log striker on ropes; the whole round floor is a giant wadokei clock face, the twelve zodiac hour signs in a "
             "ring like a magic circle, two huge clock hands; open sides looking out over the misty mountain town at night, the sky "
             "just starting to turn to dawn at the horizon"),
}
for place, (calm, desc) in PLACES.items():
    for k in "ab":
        if calm:
            JOBS.setdefault(f"R62_sc_{place}", []).append((f"{R}sc_{place}_{k}.png", CREF, CSTYLE + "The place: " + desc + ". " + CALM,
                                                           "OPAQUE"))
            JOBS.setdefault(f"R62_scx_{place}", []).append((f"{R}sc_{place}_{k}_x.png", CREF + [f"{R}sc_{place}_{k}.png"],
                                                            CSTYLE + XS + "The place: " + desc + ". " + DARK, "OPAQUE"))
        else:
            JOBS.setdefault(f"R62_sc_{place}", []).append((f"{R}sc_{place}_{k}.png", CREF, CSTYLE + "The place: " + desc + ". " + DARK,
                                                           "OPAQUE"))

# ---------------------------------------------------------------- yukata test on the battle sprites
YK = {
    "cat": ("art/ref/cat_sheet.png",
            "a short summer yukata in her colours: ivory-white cotton with a pattern of pale mint and red cherry blossoms and small "
            "golden bells, the hem at mid-thigh with a navy frill peeking out, wide yukata sleeves on her LEFT arm only (her right arm "
            "is the white furry cat-paw arm and stays exactly as it is, with the red seal on the back of the paw untouched), a navy "
            "obi with a big red bow at the back and red tassel cords with golden bells, her black bike shorts unchanged, white frilly "
            "socks, black platform pokkuri sandals with red straps (the same size and position as the shoes now)"),
    "pink": ("art/ref/pink_sheet.png",
             "a short frilly summer yukata in her colours: baby-pink cotton with a pattern of white lace hearts and mint cherry blossoms, "
             "a white lace frill along the hem at the upper thigh, wide sleeves with pink ribbons, a mint-green obi with a huge "
             "pale-yellow bow at the back, the heart garter on her thigh, white frilly ankle socks, pink lacquered platform pokkuri "
             "sandals with clear mint soles (the same size and position as the shoes now); cute, wholesome, fully covered"),
}
for who, (sheet, outfit) in YK.items():
    for pose in ("cover", "fire"):
        for k in "abc":
            JOBS.setdefault(f"R62_yk_{who}_{pose}", []).append(
                (f"{R}yk_{who}_{pose}_{k}.png", [f"{R}ref_{who}_{pose}.png", sheet],
                 "Reference image 1 is an approved game sprite of this character on a flat grey background. Redraw THE SAME IMAGE at "
                 "the same canvas size and framing, with ONLY her clothes changed. Everything else must stay exactly as it is, aligned "
                 "to the pixel: the same pose, the same body outline and proportions, every limb in the same position and size, the "
                 "same head, face, expression, hair, hair ornaments, ears, tail, hands and legs, the same weapon, the same art style, "
                 "line art and colours. Do not move, scale, rotate or re-pose anything. Reference image 2 is her character sheet: "
                 "keep her character exactly. Change ONLY her outfit into " + outfit + ". The new clothes must hug the same body in "
                 "the same pose, follow the same folds of movement, and must not cover more of the canvas than needed. Transparent "
                 "background (the flat grey of reference image 1 is not part of the picture). No text, no effects."))
