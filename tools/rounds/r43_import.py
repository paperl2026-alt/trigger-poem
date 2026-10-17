"""Round 43 (tools/rounds/job_specs43.py, art/raw/r43) -> the content pack.
  boss       boss_s<n>_<v>.png (3 x 2 poses, the picked version per stage) -> boss/qq_s<n>_<pose>   (sliced like the small monsters)
  monsters   m_<kind>_<v>.png (a / b / c)                                 -> enemy/<kind>_<pose>, enemy/<kind>_b_<pose>, enemy/<kind>_c_<pose>
  shots      mproj.png, bproj_<v>.png (3 x 2)                             -> enemy/p_<name>
  item       item_pig_<v>.png (the picked one)                            -> item/pig
  corridor   cor_<key>_x.png                                              -> st3/<key>_x  (same size as the calm board; window panes keyed out;
                                                                             floors / ceilings tileable with the calm version's edges)
  page       page_intro_<v>.png (the picked one)                          -> comic/ep0p_intro + comics.json ep0_intro
Then: python -I tools/relief.py "boss/qq_*" "enemy/chair*" "enemy/book*" "enemy/clock*" "enemy/ext*"
      python -I tools/pad_frames.py "boss/qq_*" "enemy/chair*" "enemy/book*" "enemy/clock*" "enemy/ext*"
usage: python -I tools/rounds/r43_import.py [boss] [monsters] [shots] [item] [corridor] [page]"""
import sys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r43"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r23_import import cells, frames
from r28_import import key_magenta, tileable
from r31_import import same_edges
from comic_panels import panels

BOSS = {1: ("b", "bottom"), 2: ("c", "bottom"), 3: ("a", "bottom"), 4: ("b", "center"), 5: ("c", "center")}   # picked version, anchor
BPOSES = ["idle0", "idle1", "move", "windup", "attack", "hurt"]
MON = {   # kind -> poses (the behaviour template's frame names, like the R23 monster it follows), anchor
    "chair": (["walk0", "walk1", "crouch", "leap", "bite", "hurt"], "bottom"),
    "book": (["fly0", "fly1", "idle", "windup", "dive", "hurt"], "center"),
    "clock": (["hide", "rise", "idle", "windup", "throw", "hurt"], "bottom"),
    "ext": (["hover0", "hover1", "idle", "windup", "blast", "hurt"], "center"),
}
SHOTS = {"mproj": ["hand", "hand2", "foam", "bubbles", "dart", "tack"], "bproj_a": ["eye", "ooze", "hair", "tooth", "lips", "eyes"],
         "bproj_b": ["eye_b", "ooze_b", "hair_b", "tooth_b", "lips_b", "eyes_b"]}
PIG = "c"
PAGE = ("c", 5)


def put(man, key, im, q=90, **extra):
    (A / key).parent.mkdir(parents=True, exist_ok=True)
    im.save(A / f"{key}.webp", quality=q, method=6)
    man[key] = {**{k: v for k, v in man.get(key, {}).items() if k == "relief"}, "src": f"assets/{key}.webp", "w": im.width, "h": im.height, **extra}


def boss(man):
    for n, (v, anchor) in BOSS.items():
        for name, can, extra in frames(RAW / f"boss_s{n}_{v}.png", BPOSES, anchor):
            put(man, f"boss/qq_s{n}_{name}", can, hit=True, **extra)
        print("boss stage", n, can.size, extra)


def monsters(man):
    for kind, (poses, anchor) in MON.items():
        for v in "abc":
            src = RAW / f"m_{kind}_{v}.png"
            if not src.exists(): print("missing", src.name); continue
            pre = kind if v == "a" else f"{kind}_{v}"
            for name, can, extra in frames(src, poses, anchor, 2 if kind == "clock" else 0):
                put(man, f"enemy/{pre}_{name}", can, hit=True, **extra)
            print(pre, can.size, extra)


def shots(man):
    for sheet, names in SHOTS.items():
        for name, im in zip(names, cells(RAW / f"{sheet}.png")):
            if im is None: print("empty", sheet, name); continue
            s = min(1, 360 / max(im.size)); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
            put(man, f"enemy/p_{name}", im, hit=True); print("enemy/p_" + name, im.size)


def item(man):
    im = Image.open(RAW / f"item_pig_{PIG}.png").convert("RGBA")
    im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox())
    s = min(1, 512 / max(im.size)); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    put(man, "item/pig", im, dom=True); print("item/pig", im.size)


def corridor(man):
    for src in sorted(RAW.glob("cor_*_x.png")):
        k = src.stem[4:-2]; base = man.get(f"st3/{k}")
        if not base: print("no calm board for", k); continue
        im = Image.open(src); W, H = base["w"], base["h"]
        if k.startswith(("floor", "ceil")):
            calm = Image.open(A / f"st3/{k}.webp").convert("RGB")
            t = same_edges(tileable(im.convert("RGB").resize((W, H), Image.LANCZOS)), calm)
            put(man, f"st3/{k}_x", t)
        elif base.get("keyed") or k == "wallW" or k.startswith("wallR"):
            put(man, f"st3/{k}_x", key_magenta(im.resize((W, H), Image.LANCZOS)), keyed=True)
        else:
            put(man, f"st3/{k}_x", im.convert("RGB").resize((W, H), Image.LANCZOS))
        print(f"st3/{k}_x")


def page(man):
    v, n = PAGE
    src = RAW / f"page_intro_{v}.png"
    put(man, "comic/ep0p_intro", Image.open(src).convert("RGB").resize((1920, round(1920 * Image.open(src).height / Image.open(src).width)), Image.LANCZOS), q=88)
    cp = ROOT / "public" / "content" / "base" / "comics.json"; raw = cp.read_bytes(); crlf = b"\r\n" in raw
    comics = json.loads(raw.decode("utf-8"))
    ps, _ = panels(src, expect=n)
    at, out = 0.15, []
    for i, p in enumerate(ps):
        out.append({"poly": p["poly"], "at": round(at, 2), "in": ["punch", "slideL", "drop", "slideR", "punch"][i % 5], "kb": ["in", "up", "out", "left", "in"][i % 5]})
        at += 1.0
    comics["ep0_intro"] = [{"page": "comic/ep0p_intro", "panels": out}]
    txt = json.dumps(comics, ensure_ascii=False, indent=1) + "\n"
    cp.write_bytes((txt.replace("\n", "\r\n") if crlf else txt).encode("utf-8"))
    print("intro page", len(out), "panels")


if __name__ == "__main__":
    what = sys.argv[1:] or ["boss", "monsters", "shots", "item", "corridor", "page"]
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    for w in what: globals()[w](man)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
