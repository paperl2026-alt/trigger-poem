# Round 29b: concept 1's danger state again: the first try (R29_hud1 step 2) kept the normal-fight values. Same prompt, with every change
# spelled out as a checklist compared with the normal-fight picture.
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from job_specs29 import COMMON, V1, STATE_B, REFS

CHECK = ("CHANGES compared with reference image 5, ALL of them must be clearly visible: (1) 1P HP number 12 / 400, her HP gauge almost empty "
         "and flashing red; (2) 1P reloading: her ammo shows 0 / 40 with the bullets greyed out and a big 装填! sticker with a reload progress "
         "ring on her ammo label; (3) 2P all three Fever gauges full and labelled MAX, glowing; (4) 2P skill fully charged: the ring around her "
         "portrait full and shining with a big 必杀OK! sticker on it; (5) the boss health bar 风纪委员 at the top centre, phase 2 of 3, weak point "
         "marker; (6) combo 0, rank B ×1.2; (7) the 躲! must-hide warning with its countdown ring on the monster instead of 打断!; (8) the two "
         "portraits with new worried (1P) and excited (2P) expressions. Everything else exactly as in reference image 5. ")
JOBS = {"R29_hud1b": [("art/raw/r29/hud1_b2.png", REFS + ["art/raw/r29/hud1_a.png"], COMMON + V1 + STATE_B + CHECK, "OPAQUE")]}
