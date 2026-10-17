# Round 46 (user, round 7: "需要击落的东西自带一个准星，不需要玩家瞄准；需要玩家躲的，带另外一种准星"): two SIGHTS that sit on the threats
# themselves, like the lock-on sights of arcade light-gun games:
#   R46_sight_shot:  on everything flying at the girls that can be shot down: a friendly target sight (shoot here; it is a big target, no
#                    precise aiming needed); amber / gold
#   R46_sight_hide:  on a monster about to unleash an attack that cannot be shot down: a hostile danger sight (it has locked on to YOU:
#                    duck); red / black, clearly a different shape family
# Each a sheet of separate layers the program spins, scales, closes in and recombines (like this game's player reticles, R35).
HUD, RET = "art/raw/r39/hud_a.png", "art/raw/r35/ret_pink_a.png"
BASE = ("Reference image 1 is this game's battle HUD and reference image 2 a sheet of its player reticles: match their graphic style (bold, "
        "clean, P5-like, thick black outline and a white sticker edge, flat colours, halftone accents). Draw a sheet on a transparent "
        "background, a 3 x 2 grid, one item per cell, each centred with clear empty space around it, nothing crossing into another cell, no grid "
        "lines, no text, no glow, no light effects. ")
KINDS = {
    "shot": ("A TARGET SIGHT that appears on a projectile flying at the player and says 'shoot me down, I'm an easy target': friendly, "
             "inviting, game-like. Colours: amber / gold (#ffb21f), white, black. Its shapes: round, with four short inward ticks and small "
             "rotating arrowheads. Cells: 1 the outer ring with tick marks, 2 the inner ring (thinner, broken into segments), 3 four small "
             "inward-pointing arrowheads arranged in a square (one piece), 4 the centre mark (a small diamond dot), 5 the whole sight assembled, "
             "6 a small 'BREAK' starburst icon used when it is shot down."),
    "hide": ("A DANGER SIGHT that appears on a monster about to unleash an attack that CANNOT be shot down, saying 'it has locked on to you: "
             "take cover!': hostile, aggressive, a completely different shape family from a round target: angular, a hexagon / jagged sawtooth "
             "frame, hazard stripes, spikes pointing outward. Colours: red (#ff1f4a), black, white. Cells: 1 the outer angular frame with hazard "
             "stripes, 2 the inner jagged ring, 3 four outward spikes arranged in a cross (one piece), 4 the centre mark (an exclamation mark in a "
             "small triangle), 5 the whole sight assembled, 6 a small icon of a chibi girl ducking behind a wall (meaning 'hide')."),
}
JOBS = {f"R46_sight_{k}": [(f"art/raw/r46/sight_{k}_{v}.png", [HUD, RET], BASE + d + f" Variation {v}: its own design.") for v in "abc"]
        for k, d in KINDS.items()}
