# Round 24, step 2: every station painting (tools/rounds/job_specs24.py) separated into its empty plate and its two near cover objects,
# the same way as the corridor test (R22): the plate keeps the camera and everything else exactly, only the covers are painted out;
# each cover is kept exactly where and how it is, everything else transparent.
NOREDESIGN = "This is NOT a redesign task. "
SRC = {"cls1c": "art/raw/r24/cls1_calm.png", "cls1i": "art/raw/r24/cls1_inv.png", "cls2": "art/raw/r24/cls2.png", "cor2": "art/raw/r24/cor2.png",
       "yard": "art/raw/r24/yard.png"}
JOBS = {}
for k, src in SRC.items():
    JOBS[f"R24x_{k}_plate"] = [(f"art/raw/r24x/{k}_plate.png", [src],
        "Reference image 1 is an approved background painting. " + NOREDESIGN + "Output the SAME painting, same size, same camera, pixel for pixel the "
        "same, with ONLY the two big near cover objects removed (the one in the bottom-left corner and the one in the bottom-right corner), and the floor, "
        "walls and everything behind them painted in naturally, continuing the scene. Everything else stays exactly as it is.", "OPAQUE")]
    for side, where in (("L", "bottom-left"), ("R", "bottom-right")):
        JOBS[f"R24x_{k}_{side}"] = [(f"art/raw/r24x/{k}_cover{side}.png", [src],
            "Reference image 1 is an approved background painting. " + NOREDESIGN + f"Output the SAME image, same size, with ONLY the big near cover "
            f"object in the {where} corner kept, exactly as it is drawn there (same shape, colours, light, every detail), at exactly the same position "
            "and size. Everything else fully transparent.")]
