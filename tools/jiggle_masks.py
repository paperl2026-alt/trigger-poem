"""Weight maps for the layered sprite deformation (jiggle tech validation).
usage: python -I tools/jiggle_masks.py [overlay_dir]
For each pose sprite in public/jiggle/<pose>.png writes <pose>_w0.._w3.png (4 RGB maps = 12 weight channels) and <pose>_rig.json.

Channels (all uv of the unmirrored sprite, v from the bottom):
  0 skin   1 gloss  2 skirt  3 tail     | skin: bare skin (for sweat) · gloss: the art's own highlights on skin · hems hang
  4 hairA  5 hairB  6 earL   7 earR     | chains: geodesic distance from the root (0 root -> 1 tip); ears: rigid 1
  8 dangle 9 sleeve 10 head  11 chest   | tassels / sleeve hems hang; head rigid; chest hangs
Each part = polygon(s) & opaque pixels [& a colour test] [& connected to its root], then feathered so neighbours blend.
"""
import json, sys, pathlib
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIR = ROOT / "public" / "jiggle"
CH = ["skin", "gloss", "skirt", "tail", "hairA", "hairB", "earL", "earR", "dangle", "sleeve", "head", "chest"]

# ---- colour tests (on 0..255 int arrays)
def white_fur(c): return (c.min(axis=2) > 205) & ((c.max(axis=2) - c.min(axis=2)) < 40)
def dark_hair(c): return (c.max(axis=2) < 125)
def not_skin(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    skin = (r > 190) & (r >= g) & (g >= b - 5) & ((r - b) > 22) & ((r - b) < 110)
    return ~skin
def reddish(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    return ((r > 110) & (r > g + 45) & (r > b + 30)) | ((r > 150) & (g > 105) & (b < 110) & (r > b + 60))
def skirt_cloth(c): return not_skin(c) & ~white_fur(c) | (c.max(axis=2) < 140)
TESTS = {"fur": white_fur, "hair": dark_hair, "notskin": not_skin, "red": reddish, "cloth": skirt_cloth}

# ---- authored rigs. type: hang (top->bottom v), chain (root uv), rigid
RIGS = {
    "cat_fire": {
        "noSkin": [[[0.16, 0.56], [1.0, 0.56], [1.0, 0.9], [0.16, 0.9]]],
        "lines": {"ground": 0.02, "hip": 0.52, "waist": 0.655, "chest": 0.78}, "waistPivot": [0.48, 0.655], "neckPivot": [0.47, 0.82],
        "parts": {
            "skirt": {"type": "hang", "top": 0.64, "bot": 0.47, "pow": 1.3, "test": "notskin", "minus": ["tail", "dangle"],
                      "poly": [[0.26, 0.50], [0.30, 0.57], [0.35, 0.64], [0.60, 0.645], [0.66, 0.62], [0.785, 0.575], [0.775, 0.53], [0.70, 0.465], [0.62, 0.465], [0.50, 0.47], [0.36, 0.465], [0.28, 0.485]]},
            "tail": {"type": "chain", "root": [0.475, 0.51], "test": "fur", "solo": True,
                     "poly": [[0.42, 0.535], [0.535, 0.535], [0.535, 0.46], [0.47, 0.43], [0.40, 0.40], [0.30, 0.375], [0.22, 0.36], [0.18, 0.33], [0.21, 0.26], [0.15, 0.23], [0.0, 0.235], [0.0, 0.37], [0.08, 0.41], [0.2, 0.43], [0.32, 0.455], [0.40, 0.49]]},
            "hairA": {"type": "chain", "root": [0.37, 0.835], "poly": [[0.33, 0.84], [0.405, 0.84], [0.375, 0.72], [0.30, 0.715], [0.265, 0.75]]},
            "hairB": {"type": "chain", "root": [0.495, 0.835], "poly": [[0.465, 0.84], [0.535, 0.84], [0.54, 0.735], [0.49, 0.725], [0.465, 0.76]]},
            "earL": {"type": "rigid", "pivot": [0.455, 0.935], "poly": [[0.405, 1.0], [0.485, 1.0], [0.485, 0.93], [0.415, 0.92]]},
            "earR": {"type": "rigid", "pivot": [0.58, 0.93], "poly": [[0.545, 1.0], [0.645, 1.0], [0.635, 0.915], [0.555, 0.915]]},
            "dangle": {"type": "hang", "test": "red", "polys": [
                {"top": 0.665, "bot": 0.585, "poly": [[0.405, 0.67], [0.495, 0.67], [0.495, 0.58], [0.405, 0.58]]},
                {"top": 0.655, "bot": 0.595, "poly": [[0.655, 0.66], [0.745, 0.66], [0.745, 0.59], [0.655, 0.59]]},
                {"top": 0.565, "bot": 0.49, "poly": [[0.175, 0.57], [0.265, 0.57], [0.265, 0.485], [0.175, 0.485]]}]},
            "sleeve": {"type": "hang", "top": 0.69, "bot": 0.575, "poly": [[0.11, 0.68], [0.32, 0.69], [0.32, 0.575], [0.2, 0.585], [0.11, 0.62]], "minus": ["dangle"]},
            "head": {"type": "rigid", "pivot": [0.47, 0.82], "poly": [[0.27, 1.0], [0.67, 1.0], [0.67, 0.82], [0.27, 0.82]]},
        },
    },
    "cat_cover": {
        "noSkin": [[[0.22, 0.4], [1.0, 0.4], [1.0, 0.85], [0.22, 0.85]]],
        "lines": {"ground": 0.02, "hip": 0.36, "waist": 0.55, "chest": 0.68}, "waistPivot": [0.55, 0.55], "neckPivot": [0.6, 0.73],
        "parts": {
            "skirt": {"type": "hang", "top": 0.535, "bot": 0.28, "pow": 1.3, "test": "notskin", "minus": ["tail", "dangle"],
                      "poly": [[0.18, 0.30], [0.20, 0.38], [0.28, 0.47], [0.38, 0.54], [0.66, 0.535], [0.72, 0.45], [0.745, 0.36], [0.70, 0.31], [0.60, 0.315], [0.50, 0.30], [0.40, 0.30], [0.30, 0.28], [0.22, 0.28]]},
            "tail": {"type": "chain", "root": [0.48, 0.33], "test": "fur", "solo": True,
                     "poly": [[0.42, 0.365], [0.53, 0.365], [0.53, 0.28], [0.40, 0.235], [0.25, 0.215], [0.13, 0.19], [0.16, 0.12], [0.26, 0.08], [0.23, 0.0], [0.04, 0.0], [0.0, 0.12], [0.0, 0.275], [0.1, 0.295], [0.25, 0.295], [0.38, 0.32]]},
            "hairA": {"type": "chain", "root": [0.55, 0.735], "poly": [[0.505, 0.74], [0.585, 0.74], [0.575, 0.635], [0.51, 0.63]]},
            "earL": {"type": "rigid", "pivot": [0.615, 0.925], "poly": [[0.575, 1.0], [0.655, 1.0], [0.655, 0.92], [0.585, 0.915]]},
            "earR": {"type": "rigid", "pivot": [0.735, 0.92], "poly": [[0.695, 1.0], [0.785, 1.0], [0.78, 0.91], [0.705, 0.91]]},
            "dangle": {"type": "hang", "test": "red", "polys": [
                {"top": 0.565, "bot": 0.455, "poly": [[0.39, 0.57], [0.505, 0.57], [0.505, 0.45], [0.39, 0.45]]},
                {"top": 0.345, "bot": 0.245, "poly": [[0.775, 0.35], [0.87, 0.35], [0.87, 0.24], [0.775, 0.24]]},
                {"top": 0.56, "bot": 0.52, "poly": [[0.64, 0.565], [0.69, 0.565], [0.69, 0.515], [0.64, 0.515]]}]},
            "sleeve": {"type": "hang", "top": 0.56, "bot": 0.40, "poly": [[0.17, 0.56], [0.33, 0.56], [0.30, 0.40], [0.19, 0.42]], "minus": ["dangle"]},
            "head": {"type": "rigid", "pivot": [0.6, 0.73], "poly": [[0.45, 1.0], [0.80, 1.0], [0.80, 0.72], [0.45, 0.72]]},
        },
    },
    "pink_fire": {
        "lines": {"ground": 0.02, "hip": 0.55, "waist": 0.64, "chest": 0.75}, "waistPivot": [0.48, 0.64], "neckPivot": [0.55, 0.83],
        "parts": {
            "skirt": {"type": "hang", "top": 0.66, "bot": 0.44, "pow": 1.2, "test": "notskin", "minus": ["hairA"], "polys": [
                {"poly": [[0.07, 0.52], [0.15, 0.585], [0.25, 0.625], [0.38, 0.665], [0.43, 0.64], [0.40, 0.575], [0.33, 0.545], [0.30, 0.47], [0.25, 0.445], [0.15, 0.455], [0.07, 0.49]]},
                {"poly": [[0.55, 0.665], [0.63, 0.665], [0.71, 0.56], [0.73, 0.45], [0.655, 0.445], [0.585, 0.50]]}]},
            "hairA": {"type": "chain", "root": [0.45, 0.93], "test": "hair",
                      "poly": [[0.40, 0.99], [0.50, 0.95], [0.43, 0.80], [0.32, 0.72], [0.26, 0.62], [0.20, 0.555], [0.09, 0.535], [0.0, 0.58], [0.0, 0.76], [0.10, 0.83], [0.21, 0.87], [0.32, 0.92]]},
            "hairB": {"type": "chain", "root": [0.66, 0.68], "test": "hair", "poly": [[0.62, 0.72], [0.70, 0.72], [0.77, 0.62], [0.81, 0.50], [0.75, 0.42], [0.655, 0.46], [0.625, 0.60]]},
            "dangle": {"type": "hang", "test": "notskin", "polys": [{"top": 0.925, "bot": 0.82, "poly": [[0.44, 0.93], [0.53, 0.93], [0.53, 0.815], [0.44, 0.815]]}], "minus": ["hairA"]},
            "head": {"type": "rigid", "pivot": [0.55, 0.83], "poly": [[0.41, 1.0], [0.67, 1.0], [0.68, 0.83], [0.45, 0.83]]},
            "chest": {"type": "hang", "top": 0.755, "bot": 0.665, "poly": [[0.582, 0.755], [0.65, 0.755], [0.655, 0.675], [0.6, 0.665], [0.582, 0.70]]},
        },
    },
    "pink_cover": {
        "lines": {"ground": 0.0, "hip": 0.38, "waist": 0.55, "chest": 0.68}, "waistPivot": [0.5, 0.55], "neckPivot": [0.6, 0.79],
        "parts": {
            "skirt": {"type": "hang", "top": 0.60, "bot": 0.22, "pow": 1.2, "test": "notskin", "minus": ["hairA"],
                      "poly": [[0.10, 0.27], [0.12, 0.38], [0.20, 0.47], [0.30, 0.55], [0.42, 0.60], [0.46, 0.50], [0.38, 0.44], [0.30, 0.44], [0.27, 0.36], [0.25, 0.24], [0.18, 0.215], [0.12, 0.235]]},
            "hairA": {"type": "chain", "root": [0.47, 0.95], "test": "hair",
                      "poly": [[0.42, 0.99], [0.50, 0.93], [0.45, 0.80], [0.38, 0.72], [0.33, 0.60], [0.30, 0.50], [0.20, 0.40], [0.08, 0.40], [0.0, 0.50], [0.02, 0.62], [0.10, 0.72], [0.20, 0.82], [0.30, 0.90]]},
            "hairB": {"type": "chain", "root": [0.655, 0.615], "test": "hair", "poly": [[0.615, 0.635], [0.71, 0.635], [0.74, 0.50], [0.69, 0.43], [0.62, 0.47]]},
            "dangle": {"type": "hang", "test": "notskin", "polys": [{"top": 0.92, "bot": 0.775, "poly": [[0.44, 0.925], [0.53, 0.925], [0.53, 0.77], [0.44, 0.77]]}], "minus": ["hairA"]},
            "head": {"type": "rigid", "pivot": [0.6, 0.79], "poly": [[0.44, 1.0], [0.73, 1.0], [0.73, 0.78], [0.5, 0.78]]},
            "chest": {"type": "hang", "top": 0.685, "bot": 0.595, "poly": [[0.60, 0.685], [0.668, 0.685], [0.673, 0.60], [0.60, 0.598]]},
        },
    },
}

# rigs drawn by the round tools (tools/rounds/r69_rig.py ...: public/jiggle/rigs.json), besides the ones above
if (DIR / "rigs.json").exists(): RIGS.update(json.loads((DIR / "rigs.json").read_text()))


def poly_mask(poly, W, H):
    im = Image.new("L", (W, H), 0)
    ImageDraw.Draw(im).polygon([(u * W, (1 - v) * H) for u, v in poly], fill=255)
    return np.asarray(im) > 0


def geodesic(mask, root, W, H, step=4):
    """distance from root inside mask (downsampled flood), normalised 0..1"""
    m = mask[::step, ::step]
    h, w = m.shape
    ry, rx = int((1 - root[1]) * H / step), int(root[0] * W / step)
    ry, rx = min(h - 1, max(0, ry)), min(w - 1, max(0, rx))
    if not m[ry, rx]:  # snap the root onto the mask
        ys, xs = np.where(m)
        if len(xs) == 0:
            return np.zeros_like(mask, dtype=np.float32)
        k = np.argmin((ys - ry) ** 2 + (xs - rx) ** 2); ry, rx = ys[k], xs[k]
    dist = np.full(m.shape, -1, np.int32)
    front = np.zeros_like(m); front[ry, rx] = True
    reached = front.copy(); d = 0
    st = ndimage.generate_binary_structure(2, 2)
    while front.any():
        dist[front] = d
        nxt = ndimage.binary_dilation(front, st) & m & ~reached
        reached |= nxt; front = nxt; d += 1
    dist = dist.astype(np.float32)
    dist[dist < 0] = np.nan
    dmax = np.nanmax(dist) if np.isfinite(np.nanmax(dist)) else 1
    out = np.nan_to_num(dist / max(1, dmax), nan=0.0)
    out = np.kron(out, np.ones((step, step), np.float32))[:H, :W]
    return out * mask


def build(pose, rig, overlay_dir=None):
    im = Image.open(DIR / f"{pose}.png").convert("RGBA")
    W, H = im.size
    a = np.asarray(im).astype(int)
    rgb, alpha = a[..., :3], a[..., 3] > 40
    vv = 1 - (np.arange(H)[:, None] + 0.5) / H + np.zeros((1, W))
    raw = {}   # unfeathered masks (for "minus")
    vals = {}
    order = sorted(rig["parts"], key=lambda k: 0 if rig["parts"][k]["type"] != "hang" or k in ("dangle",) else 1)
    solo = {}
    for name in order:
        p = rig["parts"][name]
        polys = p.get("polys") or [{"poly": p["poly"], "top": p.get("top"), "bot": p.get("bot")}]
        val = np.zeros((H, W), np.float32)
        mask_all = np.zeros((H, W), bool)
        for sub in polys:
            m = poly_mask(sub["poly"], W, H) & alpha
            if "test" in p:
                m &= TESTS[p["test"]](rgb)
            for other in p.get("minus", []):
                if other in raw:
                    m &= ~ndimage.binary_dilation(raw[other], iterations=3)
            if p["type"] == "hang":
                top, bot = sub.get("top") or p["top"], sub.get("bot") or p["bot"]
                t = np.clip((top - vv) / max(1e-3, top - bot), 0, 1)
                t = t * t * (3 - 2 * t)
                val = np.maximum(val, (t ** p.get("pow", 1.0)) * m)
            mask_all |= m
        if p["type"] == "chain" and "test" in p:
            # the colour test drops the part's own dark ink outline: take it back (dark pixels hugging the part)
            ink = rgb.max(axis=2) < 110
            for _ in range(2):
                mask_all |= ndimage.binary_dilation(mask_all, iterations=3) & alpha & ink
            mask_all |= ndimage.binary_dilation(mask_all, iterations=1) & alpha & poly_mask(polys[0]["poly"], W, H)
        if p["type"] == "chain":
            # keep only what connects to the root
            lab, n = ndimage.label(ndimage.binary_closing(mask_all, iterations=2))
            ry, rx = int((1 - p["root"][1]) * H), int(p["root"][0] * W)
            ys, xs = np.where(lab > 0)
            if len(xs):
                k = np.argmin((ys - ry) ** 2 + (xs - rx) ** 2)
                mask_all = (lab == lab[ys[k], xs[k]]) & alpha
            val = geodesic(mask_all, p["root"], W, H)
        elif p["type"] == "rigid":
            val = mask_all.astype(np.float32)
        if p["type"] == "chain":
            # spread the chain's weight into the transparent space around it (nearest-pixel value), so the empty mesh
            # around a swinging tail / hair moves with it instead of shearing a seam; never over opaque non-chain pixels
            near = ndimage.distance_transform_edt(~mask_all, return_indices=True)
            dist, (iy, ix) = near
            spread = val[iy, ix] * np.clip(1 - dist / (H * 0.06), 0, 1)
            if p.get("solo"):
                # a solo chain (the tail) must not drag the body it swings past: its weight is zero on every other opaque
                # pixel and fades in only well clear of them (> ~1.5 mesh cells), so no triangle spans tail space + leg
                d_other = ndimage.distance_transform_edt(~(alpha & ~mask_all))
                keep = np.clip((d_other - H * 0.012) / (H * 0.02), 0, 1)
                spread *= keep
                solo[name] = np.maximum(keep, ndimage.binary_dilation(mask_all, iterations=2))
            val = np.where(mask_all, val, np.where(alpha, 0, spread))
        raw[name] = mask_all
        vals[name] = val
    # skin (bare skin, for sweat) and gloss (the art's own highlights on that skin), from colour
    r_, g_, b_ = rgb[..., 0].astype(np.float32), rgb[..., 1].astype(np.float32), rgb[..., 2].astype(np.float32)
    rr = np.maximum(r_, 1)
    skin = alpha & (r_ > 150) & (r_ >= g_) & (g_ >= b_ - 4) & (g_ / rr > 0.68) & (g_ / rr < 0.93) & (b_ / rr > 0.55) & (b_ / rr < 0.9)
    skin = ndimage.binary_opening(skin, iterations=2)
    lab, n = ndimage.label(skin)
    if n:
        sizes = ndimage.sum(skin, lab, range(1, n + 1))
        skin = np.isin(lab, 1 + np.where(sizes > W * H * 0.0015)[0])
    for other in ("head",):
        if other in raw:
            skin &= ~raw[other]
    for poly in rig.get("noSkin", []):  # pale clothing that looks like skin
        skin &= ~poly_mask(poly, W, H)
    inner = ndimage.distance_transform_edt(alpha) > H * 0.012   # not the white sticker outline
    lum = 0.3 * r_ + 0.59 * g_ + 0.11 * b_
    loc = ndimage.uniform_filter(lum, size=int(H * 0.03))
    gloss = skin & inner & (lum > loc + 12) & (lum > 220)
    vals["skin"] = ndimage.binary_erosion(skin, iterations=1).astype(np.float32)
    vals["gloss"] = gloss.astype(np.float32)
    raw["skin"], raw["gloss"] = skin, gloss
    rig["parts"].setdefault("skin", {"type": "rigid", "pivot": [0.5, 0.5]})
    rig["parts"].setdefault("gloss", {"type": "rigid", "pivot": [0.5, 0.5]})
    # feather: blend into the neighbours so nothing tears
    sig = H * 0.008
    chans = []
    for name in CH:
        v = vals.get(name)
        if v is None:
            chans.append(np.zeros((H, W), np.float32)); continue
        sg = sig * 0.35 if name in ("skin", "gloss") else sig if rig["parts"][name]["type"] != "rigid" else sig * 1.5
        f = ndimage.gaussian_filter(v, sg)
        if name in solo:
            f = f * solo[name]
        chans.append(np.clip(f, 0, 1))
    # 4 RGB maps x 3 channels (no alpha: browsers may wipe the colour of fully transparent pixels)
    for i in range(4):
        rgb3 = np.stack(chans[i * 3:(i + 1) * 3], axis=-1)
        Image.fromarray((rgb3 * 255 + 0.5).astype(np.uint8)).save(DIR / f"{pose}_w{i}.png")
    # rig json: pivots / roots / soft-mass centres (uv)
    info = {"lines": rig["lines"], "waistPivot": rig["waistPivot"], "neckPivot": rig["neckPivot"], "parts": {}}
    for name in CH:
        if name not in rig["parts"]:
            continue
        p = rig["parts"][name]
        ys, xs = np.where(raw[name])
        cen = [float(xs.mean() / W), float(1 - ys.mean() / H)] if len(xs) else [0.5, 0.5]
        piv = p.get("pivot") or p.get("root") or cen
        info["parts"][name] = {"ch": CH.index(name), "type": p["type"], "pivot": piv, "center": cen}
    (DIR / f"{pose}_rig.json").write_text(json.dumps(info, indent=1))
    if overlay_dir:
        colors = np.array([[255, 40, 90], [255, 150, 0], [40, 120, 255], [0, 230, 120], [200, 60, 255], [255, 230, 0],
                           [0, 255, 255], [0, 200, 200], [255, 0, 255], [120, 255, 60], [255, 255, 255], [255, 120, 180]], np.float32)
        base = np.asarray(Image.alpha_composite(Image.new("RGBA", im.size, (50, 60, 55, 255)), im).convert("RGB")).astype(np.float32) * 0.55
        for i, name in enumerate(CH):
            w = chans[i][..., None]
            base = base * (1 - w * 0.7) + colors[i] * w * 0.7
        out = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(out)
        for name, pi in info["parts"].items():
            x, y = pi["pivot"][0] * W, (1 - pi["pivot"][1]) * H
            d.ellipse([x - 7, y - 7, x + 7, y + 7], outline=(255, 255, 255), width=3)
        for k in ("hip", "waist", "chest"):
            y = (1 - rig["lines"][k]) * H
            d.line([(0, y), (W, y)], fill=(255, 255, 255), width=1)
        s = 1100 / H
        out.resize((round(W * s), 1100)).save(pathlib.Path(overlay_dir) / f"ov_{pose}.jpg", quality=88)
    print(pose, "ok", {n: int(raw[n].sum()) for n in raw})


if __name__ == "__main__":
    # --pose=<pose>[_<outfit>] (repeatable): only those; an outfit (tools/rounds/r62_yukata.py: cat_fire_yk) uses its pose's rig
    only = [a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--pose=")]
    od = next((a for a in sys.argv[1:] if not a.startswith("--")), None)
    for pose in only or RIGS:
        build(pose, RIGS.get(pose) or RIGS["_".join(pose.split("_")[:2])], od)   # (its own rig, else the one it is a variant of: <who>_<pose>_yk)
