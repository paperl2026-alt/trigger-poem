# Round 29: battle HUD mockups (docs/PLAN.md "战斗 HUD 重新设计"; DESIGN「UI」: every screen is designed as a mockup first, then decomposed).
# Base = a clean in-game frame of the corridor validation without any HUD (art/ref/hud/battle_clean.png, 1672x941). Two different layout
# concepts in the approved red / black / white style (title and select screens); each concept in two states, the second made from the first
# so the two show one design: A = a normal fight, B = danger (boss fight, low HP, reload, full Fever, skill ready, must-hide attack).
# Fever and the skill are shown on the heroines and the screen edges in the game itself (no banners): the HUD only keeps small gauges.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]   # this folder and tools/
from check_art_reuse import used_poses

BASE = "art/ref/hud/battle_clean.png"
STYLE_REF = "art/ref/select_ref.png"
CAT, PINK = "art/ref/cat_sheet.png", "art/ref/pink_sheet.png"
USED = "; ".join(p for _, _, p in used_poses()) + ("; 庄乖 looking back over her shoulder with a sleepy half-lidded yawn, paw curled at her chest; "
                                                    "蔡蕾 with the gatling gun propped on her shoulder, winking with a big open grin")

COMMON = (
    "Reference image 1 is a real in-game frame of this game (a light-gun rail shooter): a school corridor at sunset, a monster in the distance, "
    "on the left the black-haired twin-tail girl 蔡蕾 (player 1, colour hot pink #ff5fa8) shooting her gatling gun, on the right the white-haired "
    "cat girl 庄乖 (player 2, colour violet #a66bff) attacking with her white fur ghost paw. Reference image 2 is the approved chapter-select "
    "screen of the same game: use its red / black / white graphic style (Persona 5-like: tilted black slabs with white outlines, red accents, "
    "jagged cut-paper shapes, ransom-note lettering, halftone dots, bold italic type). Reference images 3 and 4 are the two girls' design sheets. "
    "TASK: design the battle HUD and draw it on top of reference image 1. Keep the game picture underneath exactly as it is (same corridor, same "
    "girls, same monster, same framing, 16:9, 1672x941); only add the HUD. "
    "The HUD must look DESIGNED and theatrical like an anime game: chunky graphic shapes, strong silhouettes, dynamic tilt, cute and loud, "
    "readable at a glance. NOT a flat web page, NOT thin lines with tiny text, NOT generic sci-fi HUD. Loud does not mean big: keep the middle "
    "of the screen clear for aiming, do not cover the girls' faces and bodies more than a little, keep every element close to the screen edges. "
    "Fever and the special skill are shown in the game by a glow around each girl and a glow licking in from her side of the screen, so there "
    "are NO banners, NO cut-in strips and NO text across the middle of the screen. "
    "Text in Simplified Chinese where there is text. Use 1P / 2P, the names 蔡蕾 and 庄乖, Lv numbers. "
    "Every element the HUD has, for EACH girl (1P on her left side, 2P mirrored on the right side): "
    "a small portrait of her face inside the skill button (a NEW face drawing, not one of these already used poses: " + USED + "), "
    "the skill charge shown around the portrait, the skill key hint (右键) under it, a 1P / 2P tag, her name and Lv; "
    "her HP (a number plus a gauge that clearly shows damage just taken); "
    "her ammo (current / magazine, the gun's magazine as a row of bullets or shells or a big number, with a reload state); "
    "three small Fever gauges with one-character labels 力 准 连, each with its level (Lv1, Lv2, MAX). "
    "Shared elements: the combo counter (a big number and 连击!); the rank / score badge (a letter rank S A B C with a score multiplier like ×2.5); "
    "damage numbers popping off a hit monster; each player's aiming reticle in her colour (1P pink, 2P violet) on the monster; "
    "the enemy attack warnings attached to the monster that is winding up: one kind means SHOOT IT NOW to interrupt the attack (打断!), the "
    "other kind means it cannot be stopped and you must TAKE COVER (躲!), both with a countdown ring; the boss health bar (boss name 风纪委员, "
    "several phase segments, a weak point marker). "
)

STATE_A = (
    "THIS PICTURE shows a normal fight: both girls healthy (HP around 80%), 1P has 23 / 40 ammo, 2P has 6 / 8, combo 27, rank A ×1.8, Fever 1P "
    "力 Lv2 准 Lv1 连 Lv1, 2P 力 Lv1, skill charge half full for both, damage numbers popping off the desk monster, both reticles on it, the "
    "monster winding up an attack that can be interrupted (打断! marker with its countdown ring on it). No boss bar in this picture. "
)
STATE_B = (
    "Reference image 5 is the SAME HUD design in a normal fight: keep its design exactly (same shapes, positions, sizes, colours, lettering, "
    "the same portraits). THIS PICTURE shows the same HUD in a danger state: a boss fight (the boss health bar with the name 风纪委员 is shown, "
    "in phase 2 of 3, a weak point marker), 1P with very low HP (12) flashing, 1P reloading (装填! with a reload progress), 2P with full Fever "
    "(all three gauges MAX) and her skill fully charged (必杀OK! on her skill button, it shines), the combo just broken back to 0, rank B ×1.2, "
    "and the monster winding up an attack that cannot be stopped (躲! must-hide warning with its countdown ring). The two portraits show worried "
    "/ excited expressions this time (still new drawings). "
)

V1 = ("LAYOUT CONCEPT 1 'calling card': each girl's panel sits in the TOP corner on her side (1P top-left, 2P top-right) as one tilted black "
      "slab with a jagged white outline and a red offset shadow, the round skill button with her portrait at the outer end; the ammo is shown at "
      "the BOTTOM corner on her side, next to her gun, as big ransom-note numbers on a torn red label with the bullets as a fan of small slanted "
      "bars; combo and rank stacked at the right of the upper middle like a stamped calling card; the boss bar is a long torn black-and-red ribbon "
      "across the top centre. ")
V2 = ("LAYOUT CONCEPT 2 'manga page': each girl's panel sits in the BOTTOM outer corner on her side (1P bottom-left, 2P bottom-right) as a "
      "manga panel inset with a heavy black border, white gutter and red screentone, broken diagonally, the portrait popping out of the panel "
      "frame; HP as a thick jagged red slash along the panel's top edge, ammo as a vertical stack of shells up the screen edge with the number in "
      "a sound-effect lettering burst, Fever gauges as three small tilted tabs on the panel; combo as a big jagged speech burst near the top "
      "left of centre, rank as a small round stamp; the boss bar is a thick tilted black slab at the top with red segment cuts and the boss "
      "name in ransom-note letters. ")

REFS = [BASE, STYLE_REF, CAT, PINK]
JOBS = {
    "R29_hud1": [
        ("art/raw/r29/hud1_a.png", REFS, COMMON + V1 + STATE_A, "OPAQUE"),
        ("art/raw/r29/hud1_b.png", REFS + ["art/raw/r29/hud1_a.png"], COMMON + V1 + STATE_B, "OPAQUE"),
    ],
    "R29_hud2": [
        ("art/raw/r29/hud2_a.png", REFS, COMMON + V2 + STATE_A, "OPAQUE"),
        ("art/raw/r29/hud2_b.png", REFS + ["art/raw/r29/hud2_a.png"], COMMON + V2 + STATE_B, "OPAQUE"),
    ],
}
