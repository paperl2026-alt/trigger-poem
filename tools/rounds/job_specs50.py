# Round 50 (docs/PLAN.md 第八批): the tiny DODGE warning above the stage label (bottom centre of the battle HUD, the small '走廊' plate).
# User: "'走廊'那个场景的上面一点可以提示下闪避，非常小的一个示意（参考图只是参考图，需要codex出其他可能的几种提醒，中日英来回切换，
# 前方高能反应 or 战斗人员也请避离 和 其他对应的meme". Their reference: a small yellow LED dot-matrix 'POLICE LINE' sign with a checkered
# border. These are DESIGN SHEETS to pick a look from; the game draws the chosen one itself (its own dot-matrix lettering, not these letters).
P = ("A design sheet of SMALL warning signs for a video game HUD, laid out as a clean 3 x 2 grid of six different designs on a plain dark "
     "charcoal background, each design centred in its cell with lots of empty space around it, nothing overlapping. Each sign is a wide, "
     "thin strip (about 6 : 1), meant to sit tiny just above a stage-name label at the bottom centre of the screen, and to light up for a "
     "second when the player must take cover from an attack that cannot be shot down. "
     "The starting point is a yellow LED dot-matrix sign reading POLICE LINE with a black and yellow checkered border, glowing on black; "
     "design OTHER possibilities in the same spirit: glowing, bold, readable at a glance at a very small size, simple shapes, strong "
     "contrast, no characters, no illustrations, no gradients-heavy app look. All lettering must be built from LED dots or square pixels "
     "(a dot-matrix / pixel display), never a smooth computer font. ")
SHEETS = {
    "a": ("Ideas for the six cells: 1) yellow LED dots on black, checkered border, text '前方高能反应'; 2) red LED dots, hazard-stripe "
          "ends, text 'HIGH ENERGY AHEAD'; 3) violet LED dots in a thin frame with blinking corner dots, text '前方高エネルギー反応'; "
          "4) amber dot-matrix scrolling-ticker look with arrows at both ends, text '战斗人员也请避离'; 5) white-on-red emergency tape "
          "strip with dot lettering, text 'COMBATANTS EVACUATE TOO'; 6) yellow police-tape strip with dot lettering, text '戦闘員も退避せよ'."),
    "b": ("Ideas for the six cells: 1) a tiny train-station departure board, amber dots, text '这不是演习'; 2) a stadium scoreboard "
          "strip, red dots, text 'THIS IS NOT A DRILL'; 3) a cyan-and-violet LED band with a pulsing bar under it, text '全員退避!!'; "
          "4) a yellow-black striped barrier bar with a small dot-matrix window, text '大招来袭 快躲'; 5) a pink LED strip with a heart "
          "dot icon at each end, text 'DUCK!! DUCK!!'; 6) a red rotating-beacon style strip, dots, text '伏せろ!!'."),
}
JOBS = {f"R50_dodge_{k}": [(f"art/raw/r50/dodge_{k}.png", [], P + v, "OPAQUE")] for k, v in SHEETS.items()}
