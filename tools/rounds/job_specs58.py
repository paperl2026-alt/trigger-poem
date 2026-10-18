# Round 58 (user 2026-10-18): the results page's cover picture per chapter, and a defeat results page (both girls down) whose cover is
# one of several defeat pictures at random. Same rules as R51 (tools/rounds/job_specs51.py): manga ink on white with one red, 2:3
# portrait, NO lettering at all (the game writes every word), the cat paw's seal canonical (tools/seal_fix.py after). At most 5 reference
# images a step (the image tool's limit).
#   R58_cover_ep1:      episode 1 (腐蜜之家) cleared, 3 candidates            -> res/cover_ep1
#   R58_lose_<scene>:   four defeat scenes, 2 candidates each (3+ are used)  -> res/lose_<n>
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs51 import NOTEXT, INK, CAT, PINK, R

REFS = [R["cat"], R["pink"], R["seal"], R["spread"], R["toc"]]
HEAD = "Reference images 4 and 5 are manga magazine pages: match their ink, screentone and line quality. "
PAGE = "A full-page manga illustration for the results page of a game, PORTRAIT 2:3 (1024 x 1536). " + CAT + PINK
EDGE = " Faces fully visible, nothing important within 6% of any edge (the edges may be trimmed). "
JOBS = {}
JOBS["R58_cover_ep1"] = [(f"art/raw/r58/cover_ep1_{v}.png", REFS[:4] + ["art/raw/r57/item_cone_a.png"], HEAD.replace("Reference images 4 and 5 are "
    "manga magazine pages: match their", "Reference image 4 is a manga magazine page: match its") + "Reference image 5 is the gelato cone "
    "the girls won. " + PAGE + "THE SCENE (they have just beaten the haunted gelato-cafe mansion): the two of them close to the viewer, from the "
    "knees up, triumphant and a bit battered, honey and gelato splashed on their clothes: the gun girl in front lifts the cursed gelato cone of "
    "reference image 5 high like a trophy, beaming, the little eye in its scoop winking; the cat girl beside her gives a V sign with her normal "
    "hand and raises the ghost paw (its back with the seal toward the viewer), a smug grin. Behind them, small, the ruined old Western mansion "
    "collapsing into a heap of melted gelato and honey drips at dawn, and high in the sky, faint and peaceful, the veiled lady of the house "
    "holding her little daughter's hand, both waving goodbye. Radiating speed lines, a few screentone bursts, small red hearts and sparkles."
    + EDGE + INK + NOTEXT + f" Variation {v}: its own pose details and camera angle.", "OPAQUE") for v in "abc"]
LOSE = {
    "ko": "the two girls knocked out in a comic heap on the floor, one on top of the other, spiral swirly eyes, little stars and tiny birds "
          "circling their heads, a small chibi ghost of each of them floating up out of her mouth, the cat girl's glasses askew, torn paper "
          "scraps all around; at the edges of the page the silhouettes of grinning monsters peek in",
    "dragged": "the cat girl being dragged away across the floor by many pale ghostly hands grabbing her ankles and her tail, clawing at the "
               "floor with her ghost paw (its back with the seal toward the viewer), outraged; the gun girl in the foreground crying comically "
               "with streams of tears, reaching out to her with both arms",
    "flag": "the two girls sitting back to back on the floor, worn out and battered (a few scuffs, a torn ribbon, nothing revealing), the gun "
            "girl's eye makeup running down her cheeks, the cat girl's glasses cracked, her ears drooping; a tiny white flag stuck in the "
            "floor between them; a small dark rain cloud right above their heads",
    "loom": "the two girls hugging each other in terror, small at the bottom of the page, while a gigantic shadow monster with many glowing "
            "eyes and a huge toothy grin fills the whole page above them, its long fingers closing in around them",
}
for k, d in LOSE.items():
    JOBS[f"R58_lose_{k}"] = [(f"art/raw/r58/lose_{k}_{v}.png", REFS, HEAD + PAGE + "THE SCENE (they have been defeated: the GAME OVER page, "
        "comic and cute rather than grim, no blood, no gore): " + d + "." + EDGE + INK + NOTEXT + f" Variation {v}: its own composition.",
        "OPAQUE") for v in "ab"]

JOBS["R58_fix_ko_a"] = [x for x in JOBS["R58_lose_ko"] if x[0].endswith("_a.png")]   # (a tool error the first time)
