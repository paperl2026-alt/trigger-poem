# Round 42b: form 3's calm / cruel face again, framed like the other form-3 faces (seen from below looking up at her, chin at the bottom).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs42 import BP, F3, BOSS
JOBS = {"R42b_face": [(f"art/raw/r42/b3_face_cruel_{v}.png", [BOSS, "art/raw/r42/b3_face_rage_a.png"], BP + F3 + "Reference image 2 is another "
        "face of this form: keep EXACTLY its framing, angle, size and hair. The part: the same face, but calm with a cold cruel smile, the "
        "third eye open. Only her face and hair." + f" Variation {v}.") for v in "cd"]}
