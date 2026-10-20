"""Put the ONE canonical paw seal on every image of the cat girl's paw (generated art keeps redrawing it wrong).
The canonical seal (art/ref/cat_seal_decal.png) is cut from the user's design sheet (art/ref/cat_sheet.png, right side).
For each entry of art/seal_placements.json:
  1. the generated seal is erased: red line pixels inside "erase" [x0, y0, x1, y1] are filled from the fur around them;
  2. the canonical decal is laid on: its ring centre on "center" [x, y], ring diameter "ring" px, rotated "rot" degrees
     (counter-clockwise = the pendant swings to the right), optionally squashed by "squash" (along the pendant) or "sx" (across:
     a paw seen edge-on);
  3. the result goes to the base pack as ui/<out>.webp (or a PNG path with "png"), trimmed to its pixels unless "keep_frame".
An entry with "auto": true finds the generated seal itself (find_seal; "within" a box of the picture when it shows several paws): the ring of thin red lines on the fur (the claws are solid red
and are left out), its size, and which way its pendant hangs; "center" / "ring" / "rot" / "erase" are then filled in and printed.
"clip": [x0, y0, x1, y1] keeps the change inside that box (a paw cut off by a comic panel's border).
usage: python -I tools/seal_fix.py [name ...]   (no names = all)   --preview <dir> writes before/after crops
"""
import sys, json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
DECAL = ROOT / "art" / "ref" / "cat_seal_decal.png"
PLACE = ROOT / "art" / "seal_placements.json"
OUT = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)
RING_CENTER = (134, 145)   # ring centre inside the decal (px)
RING_D = 195               # ring diameter inside the decal (px)


def erase(a, box):
    x0, y0, x1, y1 = box
    sub = a[y0:y1, x0:x1].astype(np.float32)
    R, G, B, A = sub[..., 0], sub[..., 1], sub[..., 2], sub[..., 3]
    # seal lines are a saturated red; warm (peach) fur is not: judge by how far green falls behind red
    red = (R - G > 55) & (G < 170) & (A > 128)
    m = ndimage.binary_dilation(red, iterations=2)
    w = (~m & (A > 128)).astype(np.float32)
    rgb = sub[..., :3].copy()
    out = rgb.copy()
    # normalised blur, fine to coarse: each hole pixel takes the fur colour from the nearest scale that reaches it
    todo = m.copy()
    for sig in (1.5, 3, 6, 12, 24, 48):
        if not todo.any():
            break
        num = np.stack([ndimage.gaussian_filter(rgb[..., c] * w, sig) for c in range(3)], -1)
        den = ndimage.gaussian_filter(w, sig)
        ok = todo & (den > 0.2)
        out[ok] = num[ok] / den[ok][:, None]
        todo &= ~ok
    # a little fur grain back on the filled patch
    noise = ndimage.gaussian_filter(np.random.default_rng(1).normal(0, 6, out.shape[:2]), 0.8)[..., None]
    out[m] = np.clip(out[m] + noise[m], 0, 255)
    a[y0:y1, x0:x1, :3] = out.astype(np.uint8)
    return a


def find_seal(im):
    """the generated seal on a paw: the biggest tangle of thin saturated-red lines lying on white fur (the claws are solid red and are
    left out, so are the glasses and the cheeks: not on fur). Its densest spot is the ring's centre, its farthest point the pendant's
    end (the rotation), its reach away from the pendant the ring's size. Returns centre, ring diameter, rotation, erase box, or None."""
    a = np.asarray(im.convert("RGBA")).astype(np.int16)
    R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    red = (R - G > 55) & (G < 170) & (A > 128) & (R > 120)
    solid = ndimage.binary_dilation(ndimage.binary_opening(red, iterations=4), iterations=3)
    thin = red & ~solid
    fur = (A > 128) & (R > 200) & (G > 188) & (B > 188) & (np.abs(R - B) < 40)
    onfur = ndimage.uniform_filter(fur.astype(np.float32), 15)
    thin &= onfur > 0.35
    if thin.sum() < 40: return None
    lab, n = ndimage.label(ndimage.binary_dilation(thin, iterations=4))
    counts = ndimage.sum(thin, lab, range(1, n + 1))
    k = int(np.argmax(counts)) + 1
    comp = thin & (lab == k)
    if comp.sum() < 60: return None
    ys, xs = np.nonzero(comp)
    size = max(xs.max() - xs.min(), ys.max() - ys.min())
    H, W = comp.shape
    # the ring: the circle (centre inside the tangle) whose circumference is drawn the most
    dist = ndimage.distance_transform_edt(~comp)
    ang = np.linspace(0, 2 * np.pi, 72, endpoint=False)
    gy, gx = np.mgrid[ys.min():ys.max() + 1:2, xs.min():xs.max() + 1:2]
    gy, gx = gy.ravel(), gx.ravel()
    best = None
    for r in range(8, max(10, int(size * 0.45)), 1):
        px = np.clip((gx[:, None] + r * np.cos(ang)[None]).astype(int), 0, W - 1)
        py = np.clip((gy[:, None] + r * np.sin(ang)[None]).astype(int), 0, H - 1)
        cover = (dist[py, px] < 1.6).mean(1)
        j = int(np.argmax(cover))
        sc = cover[j] * (1 + r / 200)
        if cover[j] > 0.55 and (best is None or sc > best[0]): best = (sc, gx[j], gy[j], r)
    if best is None: return None
    _, cx, cy, r = best
    # the outer ring of the decal is the one that counts: if a bigger concentric circle is also well drawn, take it
    for r2 in range(int(r * 1.15), int(r * 1.8)):
        px = np.clip((cx + r2 * np.cos(ang)).astype(int), 0, W - 1); py = np.clip((cy + r2 * np.sin(ang)).astype(int), 0, H - 1)
        if (dist[py, px] < 1.6).mean() > 0.55: r = r2
    # the pendant: the direction out of the ring with the most line along it
    best = (-1, 0.0)
    for deg in range(0, 360, 10):
        t = np.radians(deg)
        rr = np.arange(r * 1.15, r * 3.2, 1.0)
        px = np.clip((cx + rr * np.sin(t)).astype(int), 0, W - 1); py = np.clip((cy + rr * np.cos(t)).astype(int), 0, H - 1)
        hits = (dist[py, px] < 2.0).sum()
        if hits > best[0]: best = (hits, deg)
    rot = float(best[1] if best[1] <= 180 else best[1] - 360)   # 0 = hanging straight down; + = swung to the right
    r = float(r)
    H, W = comp.shape; pad = max(4, int(r / 3))
    return {"center": [int(cx), int(cy)], "ring": int(round(r * 2)), "rot": round(rot, 1),
            "erase": [int(max(0, xs.min() - pad)), int(max(0, ys.min() - pad)), int(min(W, xs.max() + pad)), int(min(H, ys.max() + pad))]}


def stamp(im, p):
    d = Image.open(DECAL).convert("RGBA")
    s = p["ring"] / RING_D
    W, H = max(1, round(d.width * s * p.get("sx", 1))), max(1, round(d.height * s * p.get("squash", 1)))   # sx: seen edge-on (narrower across)
    d = d.resize((W, H), Image.LANCZOS)
    # small stamps lose their thin lines: firm the alpha up a little
    da = np.asarray(d).copy(); da[..., 3] = np.clip(da[..., 3].astype(np.float32) * p.get("ink", 2.2), 0, 255).astype(np.uint8)
    da[..., :3] = p.get("color", [206, 26, 46])   # the saturated seal red of the character art
    d = Image.fromarray(da)
    cx, cy = RING_CENTER[0] * s * p.get("sx", 1), RING_CENTER[1] * s * p.get("squash", 1)
    # rotate about the ring centre: pad so the centre is the image centre, then rotate
    pad = int(max(W, H) * 1.2)
    big = Image.new("RGBA", (pad * 2, pad * 2), (0, 0, 0, 0))
    big.paste(d, (round(pad - cx), round(pad - cy)))
    big = big.rotate(p.get("rot", 0), resample=Image.BICUBIC)
    if p.get("opacity", 1) < 1:
        a = np.asarray(big).copy(); a[..., 3] = (a[..., 3] * p["opacity"]).astype(np.uint8); big = Image.fromarray(a)
    # only on the paw: the decal never spills onto transparent pixels
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    layer.paste(big, (round(p["center"][0] - pad), round(p["center"][1] - pad)), big)
    la = np.asarray(layer).copy(); la[..., 3] = (la[..., 3].astype(np.float32) * (np.asarray(im)[..., 3] > 128)).astype(np.uint8)
    out = im.copy(); out.alpha_composite(Image.fromarray(la))
    return out


def run(name, p, preview=None):
    im = Image.open(ROOT / p["src"]).convert("RGBA")
    if "crop" in p:
        im = im.crop(tuple(p["crop"]))
    if p.get("auto"):   # ("within": [x0, y0, x1, y1] = look only there: a page with more than one paw gets one entry per paw)
        w = p.get("within")
        f = find_seal(im.crop(tuple(w)) if w else im)
        if not f: print(name, "no seal found"); return
        if w:
            f["center"] = [f["center"][0] + w[0], f["center"][1] + w[1]]
            f["erase"] = [f["erase"][0] + w[0], f["erase"][1] + w[1], f["erase"][2] + w[0], f["erase"][3] + w[1]]
        p = {**p, **f}
        print(name, "found", f)
    a = np.asarray(im).copy()
    boxes = p.get("erase", [])
    if boxes and not isinstance(boxes[0], list):
        boxes = [boxes]
    for box in boxes:
        a = erase(a, box)
    fixed = stamp(Image.fromarray(a), p)
    if "clip" in p:   # only inside this box (a paw cut off by a panel border: the decal must not run over the border)
        c = tuple(p["clip"]); base = im.copy(); base.paste(fixed.crop(c), c[:2]); fixed = base
    if preview:
        x0, y0, x1, y1 = boxes[0] if boxes else (0, 0, im.width, im.height)
        m = 30; box = (max(0, x0 - m), max(0, y0 - m), min(im.width, x1 + m), min(im.height, y1 + m))
        k = 360 / (box[3] - box[1])
        tiles = [x.crop(box).resize((round((box[2] - box[0]) * k), 360), Image.LANCZOS) for x in (im, fixed)]
        sheet = Image.new("RGBA", (tiles[0].width * 2 + 6, 360), (90, 90, 100, 255))
        for i, t in enumerate(tiles):
            bg = Image.new("RGBA", t.size, (90, 90, 100, 255)); bg.alpha_composite(t); sheet.paste(bg, (i * (t.width + 6), 0))
        sheet.convert("RGB").save(pathlib.Path(preview) / f"seal_{name}.jpg", quality=90)
    if "png" in p:
        fixed.save(ROOT / p["png"])
    else:
        out = fixed if p.get("keep_frame") else fixed.crop(fixed.getbbox())   # keep_frame: layers placed 1:1 on a mockup
        man = packs.manifest(); d = man.dir(f"ui/{p['out']}") / "assets"
        out.save(d / "ui" / f"{p['out']}.webp", quality=92, method=6)
        man[f"ui/{p['out']}"] = {**man.get(f"ui/{p['out']}", {}), "src": f"assets/ui/{p['out']}.webp", "w": out.width, "h": out.height, "dom": True, "seal": "canonical"}
        man.save()
    print(name, "ok")


if __name__ == "__main__":
    args = sys.argv[1:]
    prev = None
    if "--preview" in args:
        i = args.index("--preview"); prev = args[i + 1]; del args[i:i + 2]
    places = json.loads(PLACE.read_text(encoding="utf-8"))
    for name, p in places.items():
        if name.startswith("_") or (args and name not in args):
            continue
        run(name, p, prev)
