# Round 44 (docs/PLAN.md 第七批, user: the warnings must be designed art, not program-drawn boxes and plain text; the program adds the shader
# motion): the battle warnings, each kind its own design so they never look alike (docs/DESIGN.md「危险提示」):
#   R44_warn_<kind>: a 3 x 3 sheet per kind: its lettering in Chinese / English / Japanese (two wordings each), a bracket corner, a countdown
#                    dial base, a pointer   (interrupt = electric cyan, hide = red, shoot-down = amber), three candidates each
#   R44_edge_<kind>: a tall narrow strip that sits along a screen edge (red = must hide, amber = something flying at you, dark red = low HP)
REF = ["art/raw/r39/alert_words.png", "art/raw/r39/hud_a.png"]
BASE = ("Reference image 1 is this game's approved arcade alert lettering (RELOAD!, DANGER!!, HIT! ...) and reference image 2 its battle HUD "
        "(red / black / white, Persona-5-like, bold, cute): match that style exactly: thick white sticker outline, black outline, bold slanted "
        "hand lettering, halftone dots, sharp comic shapes. Draw a sheet on a transparent background, a 3 x 3 grid, one item per cell, each centred "
        "with clear empty space around it, nothing crossing into another cell, no grid lines. Flat graphic art only: no glow, no light rays, no "
        "blur, no background scene. ")
KINDS = {
    "interrupt": ("ELECTRIC CYAN (#38d8ff) with white and black, sharp crosshair / target motifs: it means 'shoot this monster NOW to stop its "
                  "attack'. ", ["'打断!'", "'BREAK IT!'", "'止めろ!'", "'打它!'", "'SHOOT IT!'", "'撃て!'"],
                  "7 one TOP-LEFT corner of a targeting bracket (an L-shaped piece with tick marks and a small notch), 8 a round countdown dial "
                  "base: a thin ring with tick marks and an empty centre, 9 a small sharp pointer chevron pointing DOWN."),
    "hide": ("RED (#ff1f4a) with black and white, hazard stripes, a small silhouette of a girl ducking behind a low wall worked into the "
             "lettering: it means 'a huge attack is coming, take cover'. ", ["'躲!'", "'HIDE!'", "'隠れて!'", "'快躲!'", "'TAKE COVER!'", "'伏せて!'"],
             "7 a small icon: a cute chibi girl's head ducking behind a wall with a sweat drop, 8 a round countdown dial base: a thin ring with "
             "hazard tick marks and an empty centre, 9 a small hazard triangle with an exclamation mark."),
    "shot": ("AMBER (#ffb21f) with black and white, a small target ring and a little projectile streak worked in: it means 'something is "
             "flying at you, shoot it down'. ", ["'击落!'", "'SHOOT DOWN!'", "'撃ち落とせ!'", "'打下来!'", "'INCOMING!'", "'来るよ!'"],
             "7 a small crosshair ring, 8 a small incoming-arrow icon pointing at the viewer, 9 a small burst star."),
}
JOBS = {}
for k, (look, words, rest) in KINDS.items():
    cells = ", ".join(f"{i + 1} the lettering {w}" for i, w in enumerate(words))
    JOBS[f"R44_warn_{k}"] = [(f"art/raw/r44/warn_{k}_{v}.png", REF, BASE + "This sheet: " + look + "Cells in reading order: " + cells + ", " +
                              rest + f" Exactly those words, nothing else written. Variation {v}: its own lettering design.") for v in "abc"]
EDGE = ("Reference image 1 is this game's alert lettering style and reference image 2 its battle HUD: match their graphic style. Draw ONE tall "
        "narrow vertical border ornament on a transparent background, about 1 : 4 (width : height), meant to run along the LEFT edge of the game "
        "screen (its left side is the straight screen edge, its right side is ragged and fades into thin pieces toward the right): flat bold "
        "graphic shapes only, no glow, no blur, no text. ")
EDGES = {"red": "Red (#ff1f4a), black and white: jagged hazard chevrons, torn warning-tape pieces and small exclamation triangles.",
         "amber": "Amber (#ffb21f), black and white: rows of small arrow chevrons pointing inward, little target rings and streak marks.",
         "vein": "Dark crimson (#b3001e) and black: organic veins and cracks with a few small heart shapes, like a pulse running up the edge."}
for k, d in EDGES.items():
    JOBS[f"R44_edge_{k}"] = [(f"art/raw/r44/edge_{k}_{v}.png", REF, EDGE + d + f" Variation {v}.") for v in "ab"]
