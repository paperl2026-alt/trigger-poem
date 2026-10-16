"""2.5D scene data for the depth test page (depth.html): a painted background plate + its Depth Anything depth, and cut-out cover
pieces with their own depth, sampled on grids as Float32 so the page can build displaced meshes (real parallax when the
camera moves, no "2D card with a thickness").
Depth Anything gives relative inverse depth up to scale and shift per image; the covers' depth (taken from the concept image,
where they still stand) is brought onto the plate's scale by a straight-line fit over the pixels both images share (floor,
walls), so they stand at the right distance in front of it.
usage: python -I tools/depth_mesh.py <name> <plate.png> <plate_depth.png> <concept_depth.png> [cover.png ...]
  -> public/proto/<name>/plate.webp, plate.bin, <cover>.webp, <cover>.bin, scene.json"""
import sys, json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
GRID = 4          # one mesh vertex every GRID px of the painting


def load_depth(p, size):
    d = np.asarray(Image.open(p)).astype(np.float32)
    d = d / (65535.0 if d.max() > 255 else 255.0)
    if d.shape[::-1] != size: d = np.asarray(Image.fromarray(d).resize(size, Image.BILINEAR))
    return d


def grid(a, step):
    """sample a full-size map at the mesh vertices (pixel centres every step px, both ends included)"""
    H, W = a.shape
    ys = np.linspace(0, H - 1, (H - 1) // step + 1); xs = np.linspace(0, W - 1, (W - 1) // step + 1)
    return ndimage.map_coordinates(a, np.meshgrid(ys, xs, indexing="ij"), order=1).astype(np.float32)


if __name__ == "__main__":
    name, plate_p, pd_p, cd_p = sys.argv[1:5]; covers = sys.argv[5:]
    out = ROOT / "public" / "proto" / name; out.mkdir(parents=True, exist_ok=True)
    plate = Image.open(plate_p).convert("RGB"); W, H = plate.size
    dp = ndimage.gaussian_filter(load_depth(pd_p, (W, H)), 1.2)
    dc = ndimage.gaussian_filter(load_depth(cd_p, (W, H)), 1.2)
    # shared pixels: everything no cover / figure stood on, judged by where the two depth maps agree in rank
    covered = np.zeros((H, W), bool)
    for c in covers: covered |= np.asarray(Image.open(c).convert("RGBA").resize((W, H)))[..., 3] > 100
    keep = ~ndimage.binary_dilation(covered, iterations=12)
    a, b = np.polyfit(dc[keep][::37], dp[keep][::37], 1)
    resid = np.abs(dp - (a * dc + b))[keep]; good = keep.copy(); good[keep] = resid < np.percentile(resid, 70)
    a, b = np.polyfit(dc[good][::23], dp[good][::23], 1)
    print(f"concept depth -> plate depth: {a:.3f} x + {b:.3f}")
    plate.save(out / "plate.webp", quality=90, method=6)
    gp = grid(dp, GRID); gp.tofile(out / "plate.bin")
    scene = {"size": [W, H], "grid": GRID, "plate": {"img": "plate.webp", "depth": "plate.bin", "dims": [int(gp.shape[1]), int(gp.shape[0])]}, "covers": []}
    for c in covers:
        im = Image.open(c).convert("RGBA").resize((W, H)); al = np.asarray(im)[..., 3]
        # the piece itself: its big solid part (faint specks Codex left around it do not count)
        lab, n = ndimage.label(al > 100); sizes = ndimage.sum(al > 100, lab, range(1, n + 1))
        solid = ndimage.binary_dilation(np.isin(lab, 1 + np.where(sizes > 0.05 * sizes.max())[0]), iterations=3)
        al = np.where(solid, al, 0).astype(np.uint8); im.putalpha(Image.fromarray(al))
        ys, xs = np.nonzero(al > 20); x0, y0, x1, y1 = max(0, xs.min() - GRID), max(0, ys.min() - GRID), min(W, xs.max() + GRID + 1), min(H, ys.max() + GRID + 1)
        x0, y0, x1, y1 = int(x0 - x0 % GRID), int(y0 - y0 % GRID), int(x1), int(y1)
        n = pathlib.Path(c).stem
        im.crop((x0, y0, x1, y1)).save(out / f"{n}.webp", quality=92, method=6)
        d = (a * dc + b)[y0:y1, x0:x1]
        # the cover is one clean relief: its depth is taken well inside its outline (edge pixels mix in the wall behind it) and
        # carried outward to the edge of its box (nearest inside value), so no vertex at the outline drops back to the wall
        inside = ndimage.binary_erosion(al[y0:y1, x0:x1] > 160, iterations=5)
        if inside.any():
            idx = ndimage.distance_transform_edt(~inside, return_distances=False, return_indices=True)
            d = d[idx[0], idx[1]]
            d = ndimage.gaussian_filter(d, 2.0)
        gc = grid(d, GRID); gc.tofile(out / f"{n}.bin")
        scene["covers"].append({"name": n, "img": f"{n}.webp", "depth": f"{n}.bin", "box": [x0, y0, x1, y1], "dims": [int(gc.shape[1]), int(gc.shape[0])]})
    (out / "scene.json").write_text(json.dumps(scene, indent=1))
    print("->", out)
