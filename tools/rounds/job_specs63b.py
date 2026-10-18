# Round 63b: the steps of round 63 that did not come out (tools/rounds/job_specs63.py): the bath's after-the-lights-went-out versions
# named a concept painting R62 never made (sc_furo_b_x: the bath's concepts were only painted dark), so they use the dark one itself;
# and a few the image tool failed on with a path error (not refusals). Only the missing outputs are redone.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
import job_specs63 as R63

ROOT = pathlib.Path(__file__).resolve().parents[2]
JOBS = {}
for name, steps in R63.JOBS.items():
    for st in steps:
        out = st[0]
        if (ROOT / out).exists(): continue
        refs = [r.replace("sc_furo_b_x.png", "sc_furo_b.png") for r in st[1]]
        JOBS.setdefault(f"R63b_{name[4:]}", []).append((out, refs) + tuple(st[2:]))
