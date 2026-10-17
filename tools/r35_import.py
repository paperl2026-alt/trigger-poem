"""Round 35 (tools/job_specs35.py, art/raw/r35) -> the content pack, for the battle HUD (src/ui/glhud.js):
  ui/hud_<left|center|right|boss|down|hide|interrupt|tag>   the approved mockup R33 taken apart (no text, bars empty), positions = the
                                                            mockup crops in art/ref/hud/parts (ui/battle.json "layers")
  ui/hud_ic_<name>                                          icons
  ui/talisman_<a|b|c>_<ready|spent|glow>                    the cat girl's ammo (three directions)
  ui/ret_<pink|cat>_<a|b|c>_<state>                         reticles, eight states each
  ui/chibi_<pink|cat>_<n>                                   chibi expressions 1..24
  ui/load_<pink|cat>_<a|b|c>                                reloading pictures
  fx/<sheet>_<i>                                            effect sprites
usage: python -I tools/r35_import.py"""
import sys, json, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "raw" / "r35"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path.insert(0, str(ROOT / "tools"))
from r23_import import cells

STATES = ["idle", "lock", "fire", "reload", "cover", "empty", "fever", "special"]
ICONS = ["heart", "flame", "aim", "chain", "bullets", "heart2", "skull", "bolt"]


def save(man, key, im, maxs=None, q=90, **extra):
    if maxs and max(im.size) > maxs:
        s = maxs / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    (A / key).parent.mkdir(parents=True, exist_ok=True)
    im.save(A / f"{key}.webp", quality=q, method=6)
    man[key] = {"src": f"assets/{key}.webp", "w": im.width, "h": im.height, **extra}
    return im


def no_lines(im):
    """remove ruled grid lines a sheet was drawn with (long thin light lines across it)"""
    a = np.asarray(im.convert("RGBA")).copy()
    light = (a[..., 3] > 0) & (a[..., :3].min(-1) > 150)
    rows = light.mean(1) > 0.45; cols = light.mean(0) > 0.45
    for m, ax in ((rows, 0), (cols, 1)):
        idx = np.nonzero(m)[0]
        for i in idx:
            for d in (-2, -1, 0, 1, 2):
                j = min(max(i + d, 0), (a.shape[0] if ax == 0 else a.shape[1]) - 1)
                if ax == 0: a[j, light[j], 3] = 0
                else: a[light[:, j], j, 3] = 0
    return Image.fromarray(a)


if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    # the mockup taken apart
    for n in ["left", "center", "right", "boss", "down", "hide", "interrupt", "tag"]:
        im = Image.open(RAW / f"{n}.png").convert("RGBA")
        if n == "hide":   # a piece of the reticle above it came along: away
            a = np.asarray(im).copy(); H, W = a.shape[:2]
            a[: int(H * 0.28), int(W * 0.42): int(W * 0.84), 3] = 0
            im = Image.fromarray(a)
        save(man, f"ui/hud_{n}", im, maxs=1600)
    for name, im in zip(ICONS, cells(RAW / "icons.png", 4, 2)):
        if im is not None: save(man, f"ui/hud_ic_{name}", im, maxs=256)
    for k in "abc":
        sheet = RAW / f"talisman_{k}.png"
        tmp = RAW / f"_talisman_{k}_clean.png"; no_lines(Image.open(sheet)).save(tmp)
        for name, im in zip(["ready", "spent", "glow"], cells(tmp, 3, 2)[:3]):
            if im is not None: save(man, f"ui/talisman_{k}_{name}", im, maxs=360)
    for who in ("pink", "cat"):
        for k in "abc":
            for st, im in zip(STATES, cells(RAW / f"ret_{who}_{k}.png", 4, 2)):
                if im is not None: save(man, f"ui/ret_{who}_{k}_{st}", im, maxs=320)
            f = RAW / f"load_{who}_{k}.png"
            if f.exists(): save(man, f"ui/load_{who}_{k}", Image.open(f).convert("RGBA"), maxs=900)
        n = 0
        for sheet in (1, 2):
            f = RAW / f"chibi_{who}{sheet}.png"
            if not f.exists(): print("missing", f.name); n += 12; continue
            for im in cells(f, 4, 3):
                n += 1
                if im is not None: save(man, f"ui/chibi_{who}_{n}", im, maxs=360)
    for f in sorted(RAW.glob("fx_*.png")):
        for i, im in enumerate(cells(f, 3, 2)):
            if im is not None: save(man, f"fx/{f.stem[3:]}_{i}", im, maxs=420)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
    print("ok")
