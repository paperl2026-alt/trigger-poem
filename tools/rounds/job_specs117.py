# Round 117: R116 again with its misses pinned down. R116 (four heads spelled out, no large chest / heels, no purple): the zombie kept the
# reference's dense, bloody style but stayed at five and a half heads; the student hit four heads but turned into a cute little girl with
# thin lines; teacher b went back to seven heads and a pretty woman; teacher a came closest (four and a half heads, dense, bloody, creepy)
# but took the reference's red hair ribbons and added flying papers. Zombie b and student b were refused.
MODE = "brief"
R = "art/raw/r117/"
REFS = ["public/content/base/levels/ep0/assets/boss/qq_chase_run_a.webp"]
HOW = """An enemy sprite for an anime horror shooting game: one standing frame, the whole figure, transparent background, nothing else in the picture (no ground, no shadow, no text).
The reference image is only for the drawing style: draw the whole figure with the same dense line work, heavy rendering, colouring and shading as the reference. Do not edit it, trace it or take anything else from it - not its character, pose, face, hair, ribbons, clothes, tentacles, eyes or colours. Draw a new figure from scratch.
Proportions: the head is one quarter of the whole height - from the top of the head to the soles of the feet the figure is four head-heights tall. Not adult proportions (seven or eight heads), not a two-head chibi. Measure it on the result and draw again if it is not four heads.
With the big head it is still a frightening horror enemy, not cute.
No large chest, no high heels. No purple anywhere. No effects (no flying papers, glow, smoke, particles).

"""
DESIGNS = {
    "zombie": "The enemy: a zombie.",
    "teacher": "The enemy: a female teacher.",
    "student": "The enemy: a female student.",
}
JOBS = {f"R117_{k}": [(f"{R}{k}_{v}.png", REFS, HOW + d) for v in "ab"] for k, d in DESIGNS.items()}
