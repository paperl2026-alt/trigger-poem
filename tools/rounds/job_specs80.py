# Round 80 (user 2026-10-21, the prologue boss: "her attacks must have weight and each its own look, not just her moving to and fro -
# have Codex make the key frames of her attacks, different for each form, as many as it takes, each adjusted to its form"): key frames
# for the five forms' attacks (src/battle/thing.js; DESIGN 序章 Boss 五个形态), drawn from the form's approved frames (R43, in the
# prologue pack: boss/qq_s<n>_idle0 / _attack): the same creature, size and framing; one try each (Codex's daily allowance).
#   s1 pound:  up (rearing, arms and tendrils high), down (slammed down)
#   s2 throw:  wind (twisted back, tendrils coiled back), fling (whipped forward, mouths open)
#   s3 slide:  slide (the whole mass sliding sideways, leaning into it, trailing - mirrored for the other way), strike (the great mouth
#              lunging forward)
#   s4 summon: (rearing up, tendrils raised like a crown, calling)
#   s5 charge: gather (contracted tight, the ribs closed), release (burst wide open, the eye wide)
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX

R = "art/raw/r80/"
B = "public/content/base/levels/ep0/assets/boss/"
BASE = ("Reference images 1 and 2 are two approved frames of this game's boss in this form: draw EXACTLY this same creature (every part of "
        "it: the possessed schoolgirl inside, the black-violet flesh, the eyes, the toothed mouths, the tendrils, the pink veins) in EXACTLY "
        "the same art style, line work and colours, a thin white sticker outline round the whole figure, at the SAME size and framing as the "
        "reference frames: the whole figure in the picture with a margin all round, its lowest point near the bottom edge. Fully transparent "
        "background: no floor, no shadow, no text, no letters. ")
POSES = {
    (1, "pound_up"): "THE MOMENT BEFORE A SLAM: she rears up tall, both arms and all the tendrils raised high over her head, coiled and tense, "
                     "about to smash down; the eyes all wide.",
    (1, "pound_down"): "THE SLAM: she has smashed down - bent far forward, both arms and the tendrils slammed down to the ground in front of "
                       "her, hair flung forward.",
    (2, "throw_wind"): "WINDING UP A THROW: the whole mass twisted back to one side, the tendrils coiled far back like a sling, the girl's arms "
                       "drawn back.",
    (2, "throw_fling"): "THE THROW: the tendrils whipped forward toward the viewer, the mass lunging after them, every mouth wide open.",
    (3, "slide"): "SLIDING SIDEWAYS FAST to the viewer's left: the whole mass leaning hard into the slide, low, its tendrils and hair "
                  "streaming out behind it to the right.",
    (3, "strike"): "THE STRIKE: the great mouth lunging straight at the viewer with the jaws open as wide as they go, the tendrils thrown "
                   "forward round it.",
    (4, "summon"): "CALLING HER SERVANTS: rearing up, the tendrils raised high and spread like a crown, the mouths open in a howl, the arms "
                   "flung up.",
    (5, "gather"): "GATHERING POWER: contracted as tight as it can, the ribs closed over the eye, the tendrils wrapped in close, trembling.",
    (5, "release"): "THE RELEASE: burst wide open - the ribs flung apart, the great eye wide, every tendril and limb flung out in all "
                    "directions.",
}
JOBS = {f"R80_s{n}_{k}": [(f"{R}s{n}_{k}.png", [f"{B}qq_s{n}_idle0.webp", f"{B}qq_s{n}_attack.webp"], BASE + d + " " + NOFX + "Square 1:1.")]
        for (n, k), d in POSES.items()}

# (the slide: refused at the output stage - "sexual, violence" - her legs and skirt thrown sideways; again with only her head and shoulders
# showing above the mass that carries her)
SLIDE2 = ("SLIDING SIDEWAYS FAST to the viewer's left: the whole great mass of flesh, mouths and tendrils leaning hard into the slide like a "
          "wave, low to the ground, everything streaming out behind it to the right; of the girl only her head and shoulders show, sunk in "
          "the top of the mass, her hair streaming back.")
JOBS["R80_s3_slide2"] = [(f"{R}s3_slide.png", [f"{B}qq_s3_idle0.webp", f"{B}qq_s3_move.webp"], BASE + SLIDE2 + " " + NOFX + "Square 1:1.")]
