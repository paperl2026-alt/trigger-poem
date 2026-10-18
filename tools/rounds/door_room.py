"""The door a room ends at, standing in the room (user 2026-10-18 第十七批: "开的门一定是要通往下一个小关卡+适合站在目前小关上的 ... 门也可以
往前作为一个小关最后需要抵达的地方先出现下"): the SAME door the close-up opens (episodes.json door step: frame + leaf, src/ui/door.js),
cut out of the close-up's doorway picture: the doorway and some wall round it, its black opening made transparent (the leaf stands
behind it in the room, panels.js hall.door), the left, right and top edges fading out so it melts into the room's end wall; the
bottom edge is the floor line. -> ep1/door<n>_room (+ manifest: w, h, hole = the opening in the cut, 0..1)
usage: python -I tools/rounds/door_room.py"""
import json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[2]
A = ROOT / "public" / "content" / "base" / "assets"
DOORS = [1, 3, 4, 9]
SIDE, TOP, FADE = 0.55, 0.32, 0.16   # wall kept beside / above the opening (x its width / height), fading over this share of the cut

if __name__ == "__main__":
    mp = A / "manifest.json"; raw = mp.read_bytes(); crlf = b"\r\n" in raw; man = json.loads(raw.decode("utf-8"))
    for n in DOORS:
        key = f"ep1/door{n}_frame"; im = Image.open(A / f"{key}.webp").convert("RGB"); W, H = im.size
        hx0, hy0, hx1, hy1 = man[key]["hole"]
        hw, hh = (hx1 - hx0) * W, (hy1 - hy0) * H
        x0, x1 = max(0, round(hx0 * W - SIDE * hw)), min(W, round(hx1 * W + SIDE * hw))
        y0, y1 = max(0, round(hy0 * H - TOP * hh)), min(H, round(hy1 * H + 2))
        a = np.asarray(im.crop((x0, y0, x1, y1))).astype(np.float32); h, w = a.shape[:2]
        # the opening: the dark region connected to the middle of the hole
        lum = a.mean(axis=2); dark = lum < 42
        lab, _ = ndimage.label(dark); cy, cx = round((hy0 + hy1) / 2 * H) - y0, round((hx0 + hx1) / 2 * W) - x0
        hole = lab == lab[min(h - 1, cy), min(w - 1, cx)] if dark[min(h - 1, cy), min(w - 1, cx)] else np.zeros_like(dark)
        hole = ndimage.binary_dilation(hole, iterations=2)
        alpha = 1 - ndimage.gaussian_filter(hole.astype(np.float32), 1.0)
        # fade the left, right and top edges
        fx = np.minimum(np.arange(w) / (FADE * w), (w - 1 - np.arange(w)) / (FADE * w)).clip(0, 1)
        fy = (np.arange(h) / (FADE * h)).clip(0, 1)
        alpha *= np.minimum(fx[None, :], fy[:, None]) ** 0.8
        out = np.dstack([a, (alpha * 255)]).clip(0, 255).astype(np.uint8)
        dst = f"ep1/door{n}_room"
        Image.fromarray(out, "RGBA").save(A / f"{dst}.webp", quality=90, method=6)
        man[dst] = {"src": f"assets/{dst}.webp", "w": w, "h": h, "hole": [round((hx0 * W - x0) / w, 4), round((hy0 * H - y0) / h, 4),
                                                                          round((hx1 * W - x0) / w, 4), round((hy1 * H - y0) / h, 4)]}
        print(dst, w, h, man[dst]["hole"])
    s = json.dumps(man, indent=1, sort_keys=True)
    mp.write_bytes((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))
