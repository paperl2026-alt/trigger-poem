"""The prologue's intro page, panel 4 (R47 c): the cat girl had two ordinary hands; R53 repainted that panel with her paw arm
(tools/rounds/job_specs53.py R53_fix_intro, version b). This pastes it back over the page -> art/raw/r47/page_intro_c2.png; then the
canonical paw seal of panel 1 goes on it (tools/seal_fix.py r47_intro_c2) and tools/rounds/r47_import.py uses it.
usage: python -I tools/rounds/r53_fix_intro.py"""
import pathlib, subprocess, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw"
PICK = "b"

page = Image.open(RAW / "r47" / "page_intro_c.png").convert("RGB")
W, H = page.size
box = (0, int(H * 0.64), int(W * 0.5), H)   # the same box job_specs53 cropped (fix_intro4_src.png)
fix = Image.open(RAW / "r53" / f"fix_intro4_{PICK}.png").convert("RGB").resize((box[2] - box[0], box[3] - box[1]), Image.LANCZOS)
page.paste(fix, box[:2])
page.save(RAW / "r47" / "page_intro_c2.png")
print("-> art/raw/r47/page_intro_c2.png")
subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "seal_fix.py"), "r47_intro_c2"], check=True, stdin=subprocess.DEVNULL)
subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "rounds" / "r47_import.py")], check=True, stdin=subprocess.DEVNULL)
