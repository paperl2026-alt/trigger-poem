"""Where monsters can stand in a station painting: marks every grid point whose levelled world height is ~0 (the floor), with
labels every 8th point (painting px and world x / z), so waves can be written in painting pixels. -> art/_shots/map_<id>.jpg
usage: python -I tools/station_map.py <id> [...]"""
import sys, json, pathlib
import numpy as np
from PIL import Image, ImageDraw
ROOT = pathlib.Path(__file__).resolve().parent.parent
A = ROOT / "public" / "content" / "base" / "assets"
for sid in sys.argv[1:]:
    S = json.loads((A / "st" / f"{sid}.json").read_text())
    W, H = S["size"]; t = np.tan(np.radians(S["fov"]) / 2)
    dimg = np.asarray(Image.open(A / "st" / f"{sid}_plate_d.png").convert("RGB")).astype(np.float32)
    d = (dimg[..., 0] * 256 + dimg[..., 1]) / 65535; gh, gw = d.shape; g = S["grid"]
    z = 1 / (1 / S["far"] + d * (1 / S["near"] - 1 / S["far"]))
    px = np.arange(gw)[None, :] * g; py = np.arange(gh)[:, None] * g
    X = (px / (W - 1) - 0.5) * 2 * t * (W / H) * z; Y = (0.5 - py / (H - 1)) * 2 * t * z; Z = -z
    n = np.array([-np.tan(np.radians(S["roll"])), 1, np.tan(np.radians(S["pitch"]))]); n /= np.linalg.norm(n)
    # rotation taking n to +y (Rodrigues)
    up = np.array([0, 1, 0.]); v = np.cross(n, up); s = np.linalg.norm(v); c = n @ up
    K = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]]); R = np.eye(3) + K + K @ K * ((1 - c) / (s * s)) if s > 1e-9 else np.eye(3)
    P = np.stack([X, Y, Z], -1) @ R.T; P[..., 1] += S["camH"]
    floor = np.abs(P[..., 1]) < 0.06
    im = Image.open(A / "st" / f"{sid}_plate.webp").convert("RGB"); dr = ImageDraw.Draw(im)
    for j in range(0, gh, 3):
        for i in range(0, gw, 3):
            if floor[j, i]: dr.ellipse([i * g - 2, j * g - 2, i * g + 2, j * g + 2], fill=(0, 255, 120))
    for j in range(0, gh, 18):
        for i in range(0, gw, 24):
            if floor[j, i]:
                dr.ellipse([i * g - 5, j * g - 5, i * g + 5, j * g + 5], fill=(255, 255, 0))
                dr.text((i * g + 6, j * g - 6), f"{i*g},{j*g}\nx{P[j,i,0]:.1f} z{P[j,i,2]:.1f}", fill=(255, 255, 255))
    im.save(ROOT / "art" / "_shots" / f"map_{sid}.jpg", quality=85)
    fz = P[..., 2][floor]; print(sid, "floor pts", int(floor.sum()), "z range", round(float(fz.min()), 1), round(float(fz.max()), 1))
