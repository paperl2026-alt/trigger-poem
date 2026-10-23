# Round 113: R112's briefs exactly, minus the two reference images. In R112 GPT passed the briefs through almost word for word (its
# prompts in the Codex logs), yet the pictures came back with bows, tassels, ribbons, lace and gold trim that no brief asked for - the
# references (the pink heroine covered in bows, lace and hearts; the key art's monsters wearing bows; the cat girl's red tassels) are
# the likely source. One change only, so the difference shows. pawn_b is left out (its brief let a line of laughing human heads through).
import importlib.util, pathlib

_s = importlib.util.spec_from_file_location("r112", pathlib.Path(__file__).with_name("job_specs112.py"))
r112 = importlib.util.module_from_spec(_s)
_s.loader.exec_module(r112)

MODE = "brief"
R = "art/raw/r113/"
OLD = "Style: as reference image 1 and reference image 2 - the same anime line art and clean colouring - drawn simple"
NEW = "Style: Japanese anime game art - clean dark line art and flat cel colouring - drawn simple"


def brief(k):
    b = r112.brief(k, r112.DRAWS[k][0])
    assert OLD in b
    return b.replace(OLD, NEW)


JOBS = {f"R113_{p}": [(f"{R}{p}_{v}.png", [], brief(f"{p}_{v}")) for v in "ab" if f"{p}_{v}" != "pawn_b"] for p in r112.PIECES}
