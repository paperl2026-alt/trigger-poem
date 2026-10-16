"""Title girls = the girls of the mockup itself (art/ref/ui_p5.png): Codex only separated them from the background
(tools/job_specs17.py -> art/raw/r17/girls_ref.png, same 1672x941 frame, checked: 0 px offset to the mockup), then
tools/seal_fix.py put the canonical seal on the paw (entry t_girls_ref -> ui/t_girls_ref).
This step only repeats the last row / column 16 px past the bottom and right edge, where the girls run out of the frame,
so the parallax shift never opens a gap there. Nothing inside the frame changes.
usage: python -I tools/seal_fix.py t_girls_ref && python -I tools/r17_import.py"""
import json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "content" / "base" / "assets"
PAD = 16
W0, H0 = 1672, 941
MOCK = ROOT / "art" / "ref" / "ui_p5.png"
# In the mockup the red / black halftone shapes along the bottom lie IN FRONT of the girls (the pink dress stops there).
# Codex drew the clothes on down to the frame edge, so where the mockup does not show them the mockup's own pixels are put
# back (skyline, red / black shape), exactly as in the mockup. Region to look in, mockup px:
OCCLUDE = (560, 680, W0, H0)

if __name__ == "__main__":
    p = OUT / "ui" / "t_girls_ref.webp"
    a = np.asarray(Image.open(p).convert("RGBA"))
    assert a.shape[:2] == (H0, W0), f"run seal_fix t_girls_ref first (needs the full {W0}x{H0} frame, got {a.shape[1]}x{a.shape[0]})"
    m = np.asarray(Image.open(MOCK).convert("RGB")).astype(np.float32)
    x0, y0, x1, y1 = OCCLUDE
    # where the mockup does not show the girl, it shows something else: the colour differs a lot from the cut-out there.
    # Blurred first so line art and small redraw differences do not count; only big areas reaching the bottom edge are taken.
    d = np.abs(m[y0:y1, x0:x1] - a[y0:y1, x0:x1, :3].astype(np.float32)).max(-1)
    d = ndimage.gaussian_filter(d, 4)
    hide = (d > 70) & (a[y0:y1, x0:x1, 3] > 0)
    hh, ww = hide.shape
    hide = np.pad(hide, ((0, 12), (0, 12)), mode="edge")     # so the clean-up does not eat the frame edge
    hide = ndimage.binary_opening(ndimage.binary_closing(hide, iterations=4), iterations=4)[:hh, :ww]
    lab, n = ndimage.label(hide)
    keep = [i for i in range(1, n + 1) if (lab == i).sum() > 5000]   # the skyline and the red / black shape, not specks
    shape = ndimage.binary_fill_holes(np.isin(lab, keep))
    # the blur widened the areas: trim them back to where the mockup really differs, so no halo of the plate shows round them
    raw = ndimage.binary_dilation(ndimage.gaussian_filter(np.abs(m[y0:y1, x0:x1] - a[y0:y1, x0:x1, :3].astype(np.float32)).max(-1), 1.2) > 60, iterations=1)
    shape &= raw
    soft = ndimage.gaussian_filter(shape.astype(np.float32), 1.0)
    # filled with the mockup's own pixels there (the plate's copy of those shapes sits a few px off and would show a red halo)
    a = a.copy(); al = a[y0:y1, x0:x1, 3:].astype(np.float32) / 255; k = soft[..., None]
    rgb = a[y0:y1, x0:x1, :3].astype(np.float32)
    a_out = k + al * (1 - k)
    a[y0:y1, x0:x1, :3] = ((m[y0:y1, x0:x1] * k + rgb * al * (1 - k)) / np.maximum(a_out, 1e-4)).clip(0, 255).astype(np.uint8)
    a[y0:y1, x0:x1, 3] = (a_out[..., 0] * 255).astype(np.uint8)
    print("occluded", int(shape.sum()), "px")
    a = np.pad(a, ((0, PAD), (0, PAD), (0, 0)), mode="edge")
    Image.fromarray(a).save(p, quality=92, method=6)
    mp = OUT / "manifest.json"; man = json.loads(mp.read_text())
    man["ui/t_girls_ref"] = {"src": "assets/ui/t_girls_ref.webp", "w": a.shape[1], "h": a.shape[0], "dom": True, "seal": "canonical"}
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
    print("ui/t_girls_ref", a.shape[1], a.shape[0], f"-> box [0, 0, {W0 + PAD}, {H0 + PAD}]")
