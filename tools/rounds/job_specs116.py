# Round 116: R115 again with what it got wrong pinned down. R115 (prologue boss as the style reference, "about four heads tall"): all
# five came out seven to eight heads tall; the women were given a large chest (and heels) nobody asked for; purple crept into eyes and
# hair; two came out as plain anime girls with thin lines instead of the reference's dense rendering. The teacher b was refused four times.
MODE = "brief"
R = "art/raw/r116/"
REFS = ["public/content/base/levels/ep0/assets/boss/qq_chase_run_a.webp"]
HOW = """An enemy sprite for an anime horror shooting game: one standing frame, the whole figure, transparent background, nothing else in the picture (no ground, no shadow, no text).
The reference image is only for the drawing style: match its line art, its dense rendering, its colouring and shading, and its amount of detail closely. Do not edit it, trace it or take anything else from it - not its character, pose, face, hair, clothes, tentacles, eyes or colours. Draw a new figure from scratch.
Proportions: the head is one quarter of the whole height - from the top of the head to the soles of the feet the figure is four head-heights tall. Not adult proportions (seven or eight heads), not a two-head chibi. Measure it on the result and draw again if it is not four heads.
No large chest, no high heels. No purple anywhere.

"""
DESIGNS = {
    "zombie": "The enemy: a zombie.",
    "teacher": "The enemy: a female teacher.",
    "student": "The enemy: a female student.",
}
JOBS = {f"R116_{k}": [(f"{R}{k}_{v}.png", REFS, HOW + d) for v in "ab"] for k, d in DESIGNS.items()}
