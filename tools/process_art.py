"""Cut generated sheets into game sprites.
usage: python -I tools/process_art.py [job ...]
Writes public/assets/<group>/<name>.webp and public/assets/manifest.json
"""
import json, sys, pathlib
from PIL import Image
import numpy as np
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "raw"
OUT = ROOT / "public" / "assets"


def alpha_np(im):
    return np.asarray(im.getchannel("A"), dtype=np.float32)


def split_axis(a, n, axis, window=0.35):
    """Split a 2D alpha array into n bands along axis (1 = x, 0 = y) at low-density cuts."""
    prof = a.sum(axis=0 if axis == 1 else 1)
    L = len(prof)
    cuts = [0]
    for i in range(1, n):
        center = int(L * i / n)
        half = int(L / n * window)
        lo, hi = max(1, center - half), min(L - 1, center + half)
        seg = prof[lo:hi]
        m = seg.min()
        idx = np.where(seg <= m + 1e-3 + 0.02 * (seg.max() - m))[0]
        best = idx[np.argmin(np.abs(idx + lo - center))]
        cuts.append(int(best + lo))
    cuts.append(L)
    return [(cuts[i], cuts[i + 1]) for i in range(n)]


def bbox(a, thr=8):
    ys, xs = np.where(a > thr)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def keep_main(im, frac=0.004):
    """Drop tiny specks not connected to the main shapes."""
    a = alpha_np(im)
    lab, n = ndimage.label(a > 20, structure=np.ones((3, 3)))
    if n == 0:
        return im
    sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
    keep = np.zeros(n + 1, bool)
    keep[1:] = sizes >= sizes.sum() * frac
    km = ndimage.binary_dilation(keep[lab], iterations=3)
    arr = np.asarray(im).copy()
    arr[..., 3] = np.where(km, arr[..., 3], 0)
    return Image.fromarray(arr)


def sticker(im, r, color=(255, 255, 255), edge=None, edge_w=2.0):
    """Round sticker border of radius r px (optional thin dark outer line), then bleed colours into transparency."""
    arr = np.asarray(im).astype(np.float32)
    a = arr[..., 3] / 255.0
    if r > 0:
        pad = int(r + edge_w + 4)
        arr = np.pad(arr, ((pad, pad), (pad, pad), (0, 0)))
        a = arr[..., 3] / 255.0
        dist = ndimage.distance_transform_edt(a < 0.5)
        border = np.clip(r + 1.0 - dist, 0, 1)
        total = np.maximum(a, border)
        rgb = arr[..., :3] * a[..., None] + np.array(color, np.float32) * (1 - a[..., None])
        if edge is not None:
            outer = np.clip(r + edge_w + 1.0 - dist, 0, 1)
            line = np.clip(outer - border, 0, 1) * (1 - a)
            rgb = rgb * (1 - line[..., None]) + np.array(edge, np.float32) * line[..., None]
            total = np.maximum(total, outer)
        arr = np.dstack([rgb, total * 255])
        a = total
    # bleed: transparent pixels take the colour of the nearest opaque pixel (no dark/coloured fringes when filtered)
    solid = a > 0.5
    if solid.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
        rgb = arr[..., :3][iy, ix]
        arr[..., :3] = np.where(solid[..., None], arr[..., :3], rgb)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def save(im, group, name, max_side=None, max_h=None, pad=2, meta=None, manifest=None, quality=90, crop=True):
    if crop:
        bb = bbox(alpha_np(im))
        if bb is None:
            raise SystemExit(f"empty sprite {group}/{name}")
        x0, y0, x1, y1 = bb
        im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))
    scale = 1.0
    if max_side and max(im.size) > max_side:
        scale = max_side / max(im.size)
    if max_h and im.height * scale > max_h:
        scale = max_h / im.height
    if scale < 1:
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    d = OUT / group
    d.mkdir(parents=True, exist_ok=True)
    im.save(d / f"{name}.webp", "WEBP", quality=quality, method=6)
    entry = {"src": f"assets/{group}/{name}.webp", "w": im.width, "h": im.height}
    if meta:
        entry.update(meta)
    manifest[f"{group}/{name}"] = entry
    print(f"{group}/{name}: {im.size}")
    return entry


def cells(im, cols, rows=1, window=0.35):
    a = alpha_np(im)
    out = []
    for (y0, y1) in split_axis(a, rows, 0, window):
        band = a[y0:y1]
        for (x0, x1) in split_axis(band, cols, 1, window):
            out.append(im.crop((x0, y0, x1, y1)))
    return out


def tight(im):
    bb = bbox(alpha_np(im))
    return im.crop(bb)


def opaque(name, group, out_name, max_w, manifest, dom=False, quality=86):
    im = Image.open(RAW / f"{name}.png").convert("RGB")
    s = min(1.0, max_w / im.width)
    if s < 1:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    d = OUT / group
    d.mkdir(parents=True, exist_ok=True)
    im.save(d / f"{out_name}.webp", "WEBP", quality=quality, method=6)
    manifest[f"{group}/{out_name}"] = {"src": f"assets/{group}/{out_name}.webp", "w": im.width, "h": im.height, **({"dom": True} if dom else {})}
    print(f"{group}/{out_name}: {im.size}")


def load(name):
    return Image.open(RAW / f"{name}.png").convert("RGBA")


JOBS = {}


def job(fn):
    JOBS[fn.__name__] = fn
    return fn




# ------------------------------------------------------------------ shared: textures + animation frames
def seam_err(a, axis):
    if axis == 1:
        return float(np.abs(a[:, 0] - a[:, -1]).mean())
    return float(np.abs(a[0] - a[-1]).mean())


def seamless(im, axes="xy", blend=0.22):
    """Cross-fade with a half-rolled copy so opposite edges match."""
    a = np.asarray(im.convert("RGB")).astype(np.float32)
    h, w = a.shape[:2]
    rolled = np.roll(a, (h // 2 if "y" in axes else 0, w // 2 if "x" in axes else 0), axis=(0, 1))
    wx = np.clip(np.minimum(np.arange(w), w - 1 - np.arange(w)) / (w * blend), 0, 1) if "x" in axes else np.ones(w)
    wy = np.clip(np.minimum(np.arange(h), h - 1 - np.arange(h)) / (h * blend), 0, 1) if "y" in axes else np.ones(h)
    W = (wy[:, None] * wx[None, :])[..., None]
    return Image.fromarray(np.clip(a * W + rolled * (1 - W), 0, 255).astype(np.uint8))


def save_tex(im, name, m, size=1024):
    im = im.convert("RGB")
    if max(im.size) > size:
        s = size / max(im.size)
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    d = OUT / "tex"; d.mkdir(parents=True, exist_ok=True)
    im.save(d / f"{name}.webp", "WEBP", quality=88, method=6)
    m[f"tex/{name}"] = {"src": f"assets/tex/{name}.webp", "w": im.width, "h": im.height}
    print(f"tex/{name}: {im.size}")


# ------------------------------------------------------------------ heroines (TEMPORARY packs: the user is designing the final heroines)
HEROINES = {"tsubaki": (70, 14, 10), "kagura": (30, 12, 60)}
H_SHEETS = [("gun", ["cover", "aim"]), ("aim2", ["aim_out", "recoil"]), ("hurt", ["hurt", "reload"]), ("run", ["run", "run_b"]),
            ("cover2", ["peek", "taunt"]), ("misc", ["down", "victory"]), ("active", ["active", "active_out"]), ("sheet", ["front", "back"])]


@job
def heroines(m):
    """Pose packs (all drawn for the LEFT side; the game mirrors them for 2P). rawH = figure height in its source sheet."""
    for cid, edge in HEROINES.items():
        for sheet, names in H_SHEETS:
            f = f"{cid}_{sheet}"
            if not (RAW / f"{f}.png").exists():
                print("skip", f); continue
            for part, nm in zip(cells(load(f), 2), names):
                part = tight(keep_main(part, 0.003))
                rawH = part.height
                save(sticker(part, 7, edge=edge, edge_w=2.5), cid, nm, max_h=1100, manifest=m, meta={"rawH": rawH, "sheet": f})
        if (RAW / f"{cid}_cam.png").exists():
            for part, nm in zip(cells(load(f"{cid}_cam"), 4), ["cam_happy", "cam_scared", "cam_hype", "cam_hurt"]):
                save(sticker(tight(keep_main(part, 0.01)), 0), cid, nm, max_h=360, manifest=m, meta={"dom": True})
        if (RAW / f"{cid}_cutin.png").exists():
            save(sticker(tight(keep_main(load(f"{cid}_cutin"), 0.01)), 8, edge=edge, edge_w=3), cid, "cutin", max_side=1600, manifest=m)


# ------------------------------------------------------------------ round 7: episode 0 = the festival haunted house gets out of hand
@job
def fest(m):
    for name in ["hh_wall", "hh_floor", "hh_ceiling", "fest_wall", "fest_ground"]:
        f = RAW / f"tex_{name}.png"
        if not f.exists():
            print("skip", name); continue
        im = Image.open(f).convert("RGB").resize((1024, 1024), Image.LANCZOS)
        a = np.asarray(im).astype(np.float32)
        ex, ey = seam_err(a, 1), seam_err(a, 0)
        ax = ("x" if ex > 18 else "") + ("y" if ey > 18 and "wall" not in name else "")
        print(name, "seam err", round(ex, 1), round(ey, 1), "->", ax or "keep")
        save_tex(seamless(im, ax, 0.12) if ax else im, name, m)
    if (RAW / "bg_fest_yard.png").exists():
        opaque("bg_fest_yard", "bg", "fest_yard", 2048, m)
    if (RAW / "props_fest.png").exists():
        for part, nm in zip(cells(load("props_fest"), 3, 2), ["tomb", "lanternpole", "arch", "stall", "deskcloth", "mascothead"]):
            save(sticker(tight(keep_main(part, 0.02)), 4, color=(236, 226, 206)), "prop", nm, max_side=800, manifest=m)
    if (RAW / "covers_fest.png").exists():
        for part, nm in zip(cells(load("covers_fest"), 2), ["tombs", "stall"]):
            save(sticker(tight(keep_main(part, 0.02)), 6, color=(236, 226, 206)), "cover", nm, max_side=1400, manifest=m)


@job
def fest_enemies(m):
    anim_frames("enemy", "zomb", [("en_zomb_walk", 4, 1, ["w0", "w1", "w2", "w3"], 0.01), ("en_zomb_atk", 4, 1, ["a0", "a1", "a2", "a3"], 0.01)], 760, m)
    anim_frames("enemy", "sheet", [("en_sheet", 2, 2, ["f0", "f1", "f2", "f3"], 0.01)], 520, m, anchor="center")
    anim_frames("enemy", "lantern", [("en_lantern", 4, 1, ["p0", "p1", "p2", "p3"], 0.01)], 700, m)
    anim_frames("enemy", "umbrella", [("en_umbrella", 4, 1, ["c0", "c1", "d", "a"], 0.01)], 600, m, anchor="center")
    if (RAW / "proj_fest.png").exists():
        for part, nm in zip(cells(load("proj_fest"), 3), ["wisp", "takoyaki", "balloon"]):
            save(sticker(tight(keep_main(part, 0.01)), 4, color=(236, 226, 206)), "enemy", nm, max_side=360, manifest=m, meta={"hit": True})
    if (RAW / "boss_float.png").exists():
        anim_frames("boss", "f", [("boss_float", 4, 1, ["idle", "stomp", "throw", "stagger"], 0.004)], 1500, m, border=5)


@job
def hud(m):
    if (RAW / "icons_hud.png").exists():
        for part, nm in zip(cells(load("icons_hud"), 3, 2), ["heart", "heart_off", "flash_rifle", "flash_gatling", "flash_mantra", "spark"]):
            dom = nm.startswith("heart")
            save(sticker(tight(keep_main(part, 0.005)), 0), "hud", nm, max_side=256 if dom else 360, manifest=m, meta={"dom": True} if dom else None)
    if (RAW / "sfx_stamps.png").exists():
        for part, nm in zip(cells(load("sfx_stamps"), 3, 2), ["don", "ba", "zuba", "gyaa", "gogogo", "gaan"]):
            save(sticker(tight(keep_main(part, 0.005)), 0), "sfx2", nm, max_side=640, manifest=m)


@job
def calm(m):
    """Episode 0 'before' state: the peaceful after-school school (the anomaly is layered on in the engine)."""
    for name in ["class_wall", "class_floor", "school_ceiling", "corridor_wall", "yard"]:
        f = RAW / f"tex_{name}.png"
        if not f.exists():
            print("skip", name); continue
        im = Image.open(f).convert("RGB").resize((1024, 1024), Image.LANCZOS)
        a = np.asarray(im).astype(np.float32)
        ex, ey = seam_err(a, 1), seam_err(a, 0)
        ax = ("x" if ex > 18 else "") + ("y" if ey > 18 and "wall" not in name else "")
        save_tex(seamless(im, ax, 0.12) if ax else im, name, m)
    if (RAW / "bg_yard_calm.png").exists():
        opaque("bg_yard_calm", "bg", "yard_calm", 2048, m)
    if (RAW / "props_school.png").exists():
        for part, nm in zip(cells(load("props_school"), 3, 2), ["desk", "lectern", "chalkboard", "locker", "shoebox", "plant"]):
            save(sticker(tight(keep_main(part, 0.02)), 4, color=(236, 226, 206)), "prop", nm, max_side=700, manifest=m)
    if (RAW / "covers_school.png").exists():
        for part, nm in zip(cells(load("covers_school"), 2), ["desks", "vault"]):
            save(sticker(tight(keep_main(part, 0.02)), 6, color=(236, 226, 206)), "cover", nm, max_side=1400, manifest=m)
    if (RAW / "rips.png").exists():
        for i, part in enumerate(cells(load("rips"), 3, 2)):
            save(sticker(tight(keep_main(part, 0.01)), 0), "fx", f"rip{i}", max_side=700, manifest=m)


@job
def neko(m):
    """The user's cat-paw girl: five battle poses (transparent, drawn for the LEFT side: the paw is her right arm, image-right).
    They already carry their own sticker outline, so only bleed the colours."""
    roles = {"cat_pose1": "cover", "cat_pose2": "peek", "cat_pose3": "reload", "cat_pose4": "taunt", "cat_pose5": "aim"}
    for f, role in roles.items():
        src = ROOT / "art/ref" / f"{f}.png"
        if not src.exists():
            continue
        part = tight(keep_main(Image.open(src).convert("RGBA"), 0.002))
        save(sticker(part, 0), "neko", role, max_h=1200, manifest=m, meta={"rawH": part.height, "sheet": f})
    ref = Image.open(ROOT / "art/ref/cat_sheet.png").convert("RGBA")
    save(ref.crop((110, 0, 610, 430)), "neko", "cam_happy", max_h=360, manifest=m, crop=False, meta={"dom": True})
    save(ref.crop((80, 0, 620, 1024)), "neko", "front", max_h=1000, manifest=m, crop=False, meta={"dom": True})


def unwhite(im, tol=24):
    """User-supplied art on a flat page (white or light grey): clear the page colour connected to the image border."""
    a = np.asarray(im.convert("RGBA")).copy()
    rgb = a[..., :3].astype(int)
    h, w = rgb.shape[:2]
    page = np.median(np.array([rgb[2, 2], rgb[2, w - 3], rgb[h - 3, 2], rgb[h - 3, w - 3]]), axis=0)
    near = np.abs(rgb - page).max(axis=2) < tol
    lab, n = ndimage.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = ndimage.binary_dilation(np.isin(lab, list(border)), iterations=1)
    a[..., 3] = np.where(bg, 0, a[..., 3])
    return Image.fromarray(a)


@job
def pink(m):
    """The user's pink gunner, cut from their GPT pose sheet (2x2) until her full battle pack exists. Drawn aiming right = for the LEFT side."""
    f = ROOT / "art/ref/pink_poses.png"
    if not f.exists():
        return
    im = Image.open(f).convert("RGBA")  # the pose sheet came with a transparent background
    edge = (60, 20, 40)
    for part, nm in zip(cells(im, 2, 2), ["victory", "aim", "peek", "cover"]):
        part = tight(keep_main(part, 0.003))
        save(sticker(part, 6, edge=edge, edge_w=2.5), "pink", nm, max_h=1100, manifest=m, meta={"rawH": part.height, "sheet": "pink_poses"})
    ref = unwhite(Image.open(ROOT / "art/ref/pink_sheet.png"))
    save(sticker(ref.crop((150, 0, 560, 420)), 0), "pink", "cam_happy", max_h=360, manifest=m, crop=False, meta={"dom": True})
    save(tight(ref.crop((0, 0, 700, 1536))), "pink", "front", max_h=1000, manifest=m, meta={"dom": True})


@job
def ui_items(m):
    for raw, group, name, w in [("bg_clubroom", "bg", "clubroom", 1920)]:
        if (RAW / f"{raw}.png").exists():
            opaque(raw, group, name, w, m, dom=True, quality=86)
    if (RAW / "icons_items.png").exists():
        for part, nm in zip(cells(load("icons_items"), 4, 2), ["charm", "loader", "drum", "energy", "anpan", "cat", "armband", "bandaid"]):
            save(sticker(tight(keep_main(part, 0.01)), 0), "item", nm, max_side=256, manifest=m, meta={"dom": True})


if __name__ == "__main__":
    mp = OUT / "manifest.json"
    manifest = json.loads(mp.read_text()) if mp.exists() else {}
    names = sys.argv[1:] or list(JOBS)
    for n in names:
        JOBS[n](manifest)
    OUT.mkdir(parents=True, exist_ok=True)
    mp.write_text(json.dumps(manifest, indent=1, sort_keys=True))
