"""One battle station of a painted 2.5D stage (docs/DESIGN.md "场景的 3D 感", src/battle/plates.js) into the content pack.
Input: the empty plate painting, its two near cover objects (full-frame transparent cut-outs), optionally the same plate in another
state (calm, before the invasion), optionally window holes + a far layer (the outside seen through them).
Depth Anything V2 Small gives the depth of the plate and of the plate with its covers; both become displaced grids (16-bit depth
packed in the R / G channels of a small PNG: R = high byte, G = low byte of the inverse depth 0..1).
The floor is found by a plane fit over the lower middle of the picture: the station is then turned so the floor is level (y = 0)
and the camera sits at its measured height; the game spawns monsters on that floor.
usage: python -I tools/build_station.py <id> <plate.png> <coverL.png> <coverR.png> [--alt alt.png] [--holes holes.png --hole-x 0.6 --far far.png]
  -> public/content/base/assets/st/<id>_*.{webp,png}, manifest entries, and the station's "scene" block (printed + saved to
     public/content/base/assets/st/<id>.json, which tools/ep0_set.py merges into the set)."""
import sys, json, pathlib, argparse
import numpy as np
import torch
from PIL import Image
from scipy import ndimage
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "content" / "base" / "assets"
MODEL = ROOT / "tools" / "models" / "depth-anything-v2-small"
GRID = 4                     # one vertex every GRID px of the 1672 px wide painting
W0 = 1672                    # paintings are worked on at this width
NEAR, FAR, FOV = 1.4, 15.0, 52.0
_proc = _model = None


def depth(im):
    global _proc, _model
    if _model is None:
        _proc = AutoImageProcessor.from_pretrained(MODEL); _model = AutoModelForDepthEstimation.from_pretrained(MODEL).eval()
    with torch.no_grad():
        pred = _model(**_proc(images=im.convert("RGB"), return_tensors="pt")).predicted_depth
    d = torch.nn.functional.interpolate(pred[None], size=im.size[::-1], mode="bicubic", align_corners=False)[0, 0].numpy()
    d = (d - d.min()) / max(d.max() - d.min(), 1e-6)
    return ndimage.gaussian_filter(d, 1.2).astype(np.float32)


def grid(a, step=GRID):
    H, W = a.shape
    ys = np.linspace(0, H - 1, (H - 1) // step + 1); xs = np.linspace(0, W - 1, (W - 1) // step + 1)
    return ndimage.map_coordinates(a, np.meshgrid(ys, xs, indexing="ij"), order=1).astype(np.float32)


def pack16(g):
    v = (np.clip(g, 0, 1) * 65535).astype(np.uint16)
    return Image.fromarray(np.dstack([(v >> 8).astype(np.uint8), (v & 255).astype(np.uint8), np.zeros_like(v, np.uint8)]), "RGB")


def unproject(px, py, d, W, H):
    """camera space (x right, y up, z toward the viewer) of painting pixels, the same formula as src/battle/plates.js"""
    t = np.tan(np.radians(FOV) / 2)
    z = 1 / (1 / FAR + np.maximum(0, d) * (1 / NEAR - 1 / FAR))
    return np.stack([(px / (W - 1) - 0.5) * 2 * t * (W / H) * z, (0.5 - py / (H - 1)) * 2 * t * z, -z], -1)


def floor_fit(d, W, H):
    """RANSAC plane through the lower middle of the picture (the floor); returns unit normal (pointing up) and the camera height"""
    ys, xs = np.mgrid[int(H * 0.62):H:6, int(W * 0.22):int(W * 0.78):6]
    P = unproject(xs.ravel().astype(np.float32), ys.ravel().astype(np.float32), d[ys.ravel(), xs.ravel()], W, H)
    rng = np.random.default_rng(0); best = (0, None)
    for _ in range(600):
        a, b, c = P[rng.choice(len(P), 3, replace=False)]
        n = np.cross(b - a, c - a); L = np.linalg.norm(n)
        if L < 1e-6: continue
        n /= L
        if n[1] < 0: n = -n
        if n[1] < 0.75: continue                     # within ~40 degrees of level
        dist = np.abs((P - a) @ n)
        k = (dist < 0.05).sum()
        if k > best[0]: best = (k, (n, a))
    n, a = best[1]
    inl = np.abs((P - a) @ n) < 0.05
    # refine on the inliers
    Q = P[inl]; c = Q.mean(0); _, _, vt = np.linalg.svd(Q - c); n = vt[2]
    if n[1] < 0: n = -n
    h = abs(c @ n)
    return n, float(h), float(inl.mean())


def tint(img):
    """the light a monster standing in this picture should take: the picture's mean colour, normalised, half way to white"""
    a = np.asarray(img.convert("RGB")).astype(np.float32) / 255
    m = a[int(a.shape[0] * 0.25):int(a.shape[0] * 0.8), int(a.shape[1] * 0.2):int(a.shape[1] * 0.8)].reshape(-1, 3).mean(0)
    m = m / max(m.mean(), 1e-3)
    return [round(float(v), 3) for v in (0.55 + 0.45 * m) * 0.95]


def save(key, im, **extra):
    mp = OUT / "manifest.json"; man = json.loads(mp.read_text())
    (OUT / key).parent.mkdir(parents=True, exist_ok=True)
    ext = "png" if extra.pop("png", False) else "webp"
    if ext == "png": im.save(OUT / f"{key}.png", optimize=True)
    else: im.save(OUT / f"{key}.webp", quality=extra.pop("q", 90), method=6)
    man[key] = {"src": f"assets/{key}.{ext}", "w": im.width, "h": im.height, **extra}
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("id"); ap.add_argument("plate"); ap.add_argument("coverL"); ap.add_argument("coverR")
    ap.add_argument("--alt"); ap.add_argument("--altL"); ap.add_argument("--altR")
    ap.add_argument("--holes"); ap.add_argument("--hole-x", type=float, default=0.0); ap.add_argument("--far")
    A = ap.parse_args()
    sid = A.id
    plate = Image.open(A.plate).convert("RGB")
    W, H = W0, round(W0 * plate.height / plate.width); plate = plate.resize((W, H), Image.LANCZOS)
    covers = [Image.open(c).convert("RGBA").resize((W, H), Image.LANCZOS) for c in (A.coverL, A.coverR)]
    comp = plate.convert("RGBA")
    for c in covers: comp.alpha_composite(c)
    dp = depth(plate)
    dc = depth(comp.convert("RGB"))
    # the composite's depth onto the plate's scale, fitted where both see the same thing
    cov_any = np.zeros((H, W), bool)
    for c in covers: cov_any |= np.asarray(c)[..., 3] > 100
    keep = ~ndimage.binary_dilation(cov_any, iterations=12)
    a, b = np.polyfit(dc[keep][::29], dp[keep][::29], 1)
    dc = a * dc + b
    scene = {"size": [W, H], "grid": GRID, "near": NEAR, "far": FAR, "fov": FOV}
    # windows (optional): panes become holes, the glass flush with the frame, the outside on a far layer
    plate_rgba = plate.convert("RGBA")
    if A.holes:
        ha = np.asarray(Image.open(A.holes).convert("RGBA").resize((W, H)))[..., 3] < 128
        ha[:, : int(A.hole_x * W)] = False
        lab, n = ndimage.label(ha); sizes = ndimage.sum(ha, lab, range(1, n + 1))
        holes = np.isin(lab, 1 + np.where(sizes > 400)[0])
        ring = ~ndimage.binary_dilation(holes, iterations=6)
        idx = ndimage.distance_transform_edt(~ring, return_distances=False, return_indices=True)
        dp = np.where(holes | ~ring, ndimage.gaussian_filter(dp[idx[0], idx[1]], 4), dp)
        soft = ndimage.gaussian_filter((~holes).astype(np.float32), 0.8)
        plate_rgba.putalpha(Image.fromarray((soft * 255).astype(np.uint8)))
        save(f"st/{sid}_far", Image.open(A.far).convert("RGB").resize((W, H), Image.LANCZOS), q=86)
        scene["farImg"] = f"st/{sid}_far"
    n, h, frac = floor_fit(dp, W, H)
    pitch = float(np.degrees(np.arctan2(n[2], n[1])))   # rotation about x that levels the floor
    roll = float(np.degrees(np.arctan2(-n[0], n[1])))
    scene.update({"camH": round(h, 3), "pitch": round(pitch, 2), "roll": round(roll, 2), "floorFit": round(frac, 3), "lit": tint(plate)})
    save(f"st/{sid}_plate", plate_rgba, q=90)
    g = grid(dp); save(f"st/{sid}_plate_d", pack16(g), png=True)
    scene["plate"] = {"img": f"st/{sid}_plate", "depth": f"st/{sid}_plate_d", "dims": [int(g.shape[1]), int(g.shape[0])]}
    if A.alt:
        alt = Image.open(A.alt).convert("RGB").resize((W, H), Image.LANCZOS)
        save(f"st/{sid}_alt", alt, q=88); scene["alt"] = f"st/{sid}_alt"
    scene["covers"] = []
    alts = [A.altL, A.altR]
    for i, (c, side) in enumerate(zip(covers, ("L", "R"))):
        al = np.asarray(c)[..., 3]
        lab, nn = ndimage.label(al > 100); sizes = ndimage.sum(al > 100, lab, range(1, nn + 1))
        solid = ndimage.binary_dilation(np.isin(lab, 1 + np.where(sizes > 0.05 * sizes.max())[0]), iterations=3)
        al = np.where(solid, al, 0).astype(np.uint8); c.putalpha(Image.fromarray(al))
        ys, xs = np.nonzero(al > 20)
        x0, y0 = max(0, xs.min() - GRID), max(0, ys.min() - GRID); x0 -= x0 % GRID; y0 -= y0 % GRID
        x1, y1 = min(W, xs.max() + GRID + 1), min(H, ys.max() + GRID + 1)
        d = dc[y0:y1, x0:x1]
        inside = ndimage.binary_erosion(al[y0:y1, x0:x1] > 160, iterations=5)
        if inside.any():
            idx = ndimage.distance_transform_edt(~inside, return_distances=False, return_indices=True)
            d = ndimage.gaussian_filter(d[idx[0], idx[1]], 2.0)
        key = f"st/{sid}_cover{side}"
        save(key, c.crop((x0, y0, x1, y1)), q=92, hit=True)
        gc = grid(d); save(f"{key}_d", pack16(gc), png=True)
        ent = {"img": key, "depth": f"{key}_d", "box": [int(x0), int(y0), int(x1), int(y1)], "dims": [int(gc.shape[1]), int(gc.shape[0])]}
        if alts[i]:
            ac = Image.open(alts[i]).convert("RGBA").resize((W, H), Image.LANCZOS).crop((x0, y0, x1, y1))
            ac.putalpha(c.crop((x0, y0, x1, y1)).getchannel("A"))
            save(f"{key}_alt", ac, q=92); ent["alt"] = f"{key}_alt"
        scene["covers"].append(ent)
    (OUT / "st" / f"{sid}.json").write_text(json.dumps(scene, indent=1))
    print(sid, json.dumps({k: scene[k] for k in ("camH", "pitch", "roll", "floorFit", "lit")}))
