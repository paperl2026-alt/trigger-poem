# Round 115 (user 2026-10-24: it is an anime "paper doll" game - take the prologue boss as the style reference only, not as an image to
# diffuse from, and have GPT draw about four-heads-tall enemies: a zombie, a female teacher, a female student and the like).
MODE = "brief"
R = "art/raw/r115/"
REFS = ["public/content/base/levels/ep0/assets/boss/qq_chase_run_a.webp"]
HOW = """An enemy sprite for an anime horror shooting game: one standing frame, the whole figure, transparent background, nothing else in the picture (no ground, no shadow, no text).
The reference image is only for the drawing style: its line art, colouring, shading and amount of detail. Do not edit it, trace it or take anything else from it - not its character, pose, face, hair, clothes, tentacles, eyes or colours. Draw a new figure from scratch.
Proportions: about four heads tall.

"""
DESIGNS = {
    "zombie": "The enemy: a zombie.",
    "teacher": "The enemy: a female teacher.",
    "student": "The enemy: a female student.",
}
JOBS = {f"R115_{k}": [(f"{R}{k}_{v}.png", REFS, HOW + d) for v in "ab"] for k, d in DESIGNS.items()}
