"""Round 59 (tools/rounds/job_specs59.py, art/raw/r59): the chapter cards of the select screen. Each picture is cut to a tall strip and laid
into the shape of the mockup's episode-1 card (ui/sel_next_ep1: its outline and its jagged white border stay, only the picture inside is
new), so every card is the same card.
  card_ep0_<v>  -> ui/sel_card_ep0  (the prologue's card: episodes.json ep0 cover)
  card_soon_<v> -> ui/sel_card_soon (the placeholder the card shows while no arrow is hovered: ui/select.json next.placeholder)
  (the mockup's episode-1 card itself)    -> ui/sel_card_ep1
Each card in its chapter's own colours (user 2026-10-18: the three grey cards looked alike): the picture's greys mapped onto a
dark -> mid -> light ramp (TONE); the prologue the purple-magenta of its invasion, episode 1 honey amber, the placeholder a cold fog grey.
usage: python -I tools/rounds/r59_import.py"""
import json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r59"
A = ROOT / "public" / "content" / "base" / "assets"
PICK = {"ep0": "a", "soon": "a", "ep1": None}   # (None: the mockup card's own picture)
TONE = {"ep0": ((18, 6, 26), (150, 36, 120), (255, 214, 238)), "ep1": ((24, 11, 3), (196, 110, 30), (255, 234, 184)),
        "soon": ((7, 9, 12), (74, 90, 104), (224, 232, 240))}


def tone(gray, ramp, gamma=0.78):   # grey (0..255) -> the ramp's colours (lifted a little: the cards are dark)
    l = (gray / 255.0) ** gamma; d, m, h = (np.array(c, np.float32) for c in ramp)
    lo = (l < 0.5)[..., None]; a = (l * 2)[..., None]; b = ((l - 0.5) * 2)[..., None]
    return np.where(lo, d * (1 - a) + m * a, m * (1 - b) + h * b)
BORDER = 9   # px of the card's own edge kept (its jagged white border and the dark line inside it)


def card(src, base, ramp):
    b = np.asarray(base.convert("RGBA")).astype(np.float32); h, w = b.shape[:2]
    inside = ndimage.binary_erosion(b[..., 3] > 128, iterations=BORDER)
    ys, xs = np.nonzero(inside); bx = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1); bw, bh = bx[2] - bx[0], bx[3] - bx[1]
    im = (Image.open(src) if src else base).convert("L"); W, H = im.size
    cw = min(W, round(H * bw / bh)); x0 = (W - cw) // 2   # the middle strip, as tall as the picture
    if src: pic = np.asarray(im.crop((x0, 0, x0 + cw, H)).resize((bw, bh), Image.LANCZOS)).astype(np.float32) * 0.88   # (a touch darker, like the card)
    else: pic = np.asarray(im).astype(np.float32)[bx[1]:bx[3], bx[0]:bx[2]] * 1.25   # (the card's own picture, brighter: it is very dark)
    pic = tone(pic.clip(0, 255), ramp)
    soft = ndimage.gaussian_filter(inside.astype(np.float32), 1.0)[bx[1]:bx[3], bx[0]:bx[2]]
    out = b.copy(); region = out[bx[1]:bx[3], bx[0]:bx[2], :3]
    for c in range(3): region[..., c] = region[..., c] * (1 - soft) + pic[..., c] * soft
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))


if __name__ == "__main__":
    mp = A / "manifest.json"; raw = mp.read_bytes(); crlf = b"\r\n" in raw; man = json.loads(raw.decode("utf-8"))
    base = Image.open(A / "ui" / "sel_next_ep1.webp")
    for k, v in PICK.items():
        im = card(RAW / f"card_{k}_{v}.png" if v else None, base, TONE[k]); key = f"ui/sel_card_{k}"
        im.save(A / f"{key}.webp", quality=90, method=6)
        man[key] = {"dom": True, "src": f"assets/{key}.webp", "w": im.width, "h": im.height}; print(key, im.size)
    s = json.dumps(man, indent=1, sort_keys=True)
    mp.write_bytes((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))
    # the prologue's card, the placeholder
    ep = ROOT / "public" / "content" / "base" / "episodes.json"; raw = ep.read_bytes(); crlf = b"\r\n" in raw; E = json.loads(raw.decode("utf-8"))
    eps = E["episodes"] if "episodes" in E else E
    for e in (eps if isinstance(eps, list) else eps.values()):
        if isinstance(e, dict) and e.get("id") in ("ep0", "ep1"): e["cover"] = f"ui/sel_card_{e['id']}"
    t = json.dumps(E, ensure_ascii=False, indent=2) + "\n"; ep.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
    sl = ROOT / "public" / "content" / "base" / "ui" / "select.json"; raw = sl.read_bytes(); crlf = b"\r\n" in raw; S = json.loads(raw.decode("utf-8"))
    S["select"]["next"]["placeholder"] = "ui/sel_card_soon"
    t = json.dumps(S, ensure_ascii=False, indent=2) + "\n"; sl.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
