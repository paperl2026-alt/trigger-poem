"""Round 79's retort faces into the prologue's level pack (tools/rounds/job_specs79.py) the same way as round 78's (r78_import.py run):
ep0/cut_<girl>_retort_<v>; the twin-tail girl's cut at the waist, the cat girl's only with the canonical paw seal on (tools/seal_fix.py,
art/seal_placements.json r79_*, art/raw/r79/seal/).
usage: python -I tools/rounds/r79_import.py [name ...]"""
import pathlib, sys
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent)]
import r78_import  # noqa: E402

if __name__ == "__main__":
    r78_import.run(r78_import.ROOT / "art" / "raw" / "r79", set(sys.argv[1:]))
