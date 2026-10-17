"""The battle heroines = the jiggle tech poses (docs/DESIGN.md "主角动起来靠晃动技术"): two NIKKE-style stills per heroine (cover,
fire) with their part weights, rig and flesh data, from public/jiggle (where the jiggle validation keeps them) into the content pack:
images -> assets/jig/, data -> characters/<id>.json "rig". The cat girl's paw seal is made canonical first (art/seal_placements.json
"jig_cat_cover", "jig_cat_fire"; the originals are kept in art/raw/jig_src).
usage: python -I tools/jig_import.py"""
import json, pathlib, shutil, subprocess, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
J = ROOT / "public" / "jiggle"
A = ROOT / "public" / "content" / "base" / "assets"
CH = ROOT / "public" / "content" / "base" / "characters"
SRC = ROOT / "art" / "raw" / "jig_src"
# per pose: the body's centre line (u), the muzzle (u, v from the bottom) and the gun feel (from the validation, src/jiggle/main.js)
POSES = {
    "cat_cover": {"anchor": 0.55}, "cat_fire": {"anchor": 0.48, "muzzle": [0.92, 0.83], "kick": 1.0, "tick": 0.7},
    "pink_cover": {"anchor": 0.45}, "pink_fire": {"anchor": 0.45, "muzzle": [0.9, 0.82], "kick": 0.42, "tick": 1.0},
}
SEALS = {"jig_cat_cover": {"pose": "cat_cover", "center": [870, 429], "ring": 52, "rot": -4},
         "jig_cat_fire": {"pose": "cat_fire", "center": [837, 283], "ring": 51, "rot": -24, "erase": [792, 250, 870, 372]}}
FILE = {"cat": "cat", "pink": "pink"}

if __name__ == "__main__":
    SRC.mkdir(parents=True, exist_ok=True); (A / "jig").mkdir(exist_ok=True)
    meta = json.loads((J / "meta.json").read_text()); flesh = json.loads((J / "flesh.json").read_text())
    # canonical seal on the cat poses (from the untouched originals)
    pl = ROOT / "art" / "seal_placements.json"; P = json.loads(pl.read_text(encoding="utf-8"))
    for key, s in SEALS.items():
        src = SRC / f"{s['pose']}.png"
        if not src.exists(): shutil.copy(J / f"{s['pose']}.png", src)
        cx, cy = s["center"]; d = s["ring"]; r = d // 2 + 5
        P[key] = {"src": str(src.relative_to(ROOT)).replace("\\", "/"), "erase": s.get("erase") or [cx - r, cy - r, cx + r, cy + round(d * 1.5)],
                  "center": [cx, cy], "ring": d, "rot": s["rot"], "png": f"public/jiggle/{s['pose']}.png"}
    pl.write_text(json.dumps(P, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "seal_fix.py"), *SEALS, "--preview", str(ROOT / "art" / "_shots")], check=True)
    man = json.loads((A / "manifest.json").read_text())
    rigs = {}
    for pose, info in POSES.items():
        who, name = pose.split("_")
        keys = []
        for f in [pose] + [f"{pose}_w{i}" for i in range(4)]:
            shutil.copy(J / f"{f}.png", A / "jig" / f"{f}.png")
            im = Image.open(J / f"{f}.png")
            man[f"jig/{f}"] = {"src": f"assets/jig/{f}.png", "w": im.width, "h": im.height, **({"data": True} if "_w" in f else {})}
            keys.append(f"jig/{f}")
        rig = json.loads((J / f"{pose}_rig.json").read_text())
        rigs.setdefault(who, {})[name] = {"img": keys[0], "w": keys[1:], "rig": rig, "flesh": flesh[pose], "h": meta[pose]["h"], "canvasH": meta[pose]["canvasH"], **info}
    (A / "manifest.json").write_text(json.dumps(man, indent=1, sort_keys=True))
    for who, r in rigs.items():
        f = CH / f"{FILE[who]}.json"; d = json.loads(f.read_text(encoding="utf-8")); c = d[who]
        c["rig"] = r
        d["_doc"] = d.get("_doc", "") + ("" if "rig：" in d.get("_doc", "") else " rig：战斗里的主角立绘（晃动技术，src/jiggle）：cover 躲掩体、fire 射击两张图，各带部件权重图 w、骨架 rig、软肉 flesh、身体中线 anchor、枪口 muzzle、枪的手感 kick / tick；由 tools/jig_import.py 生成，不要手改。")
        f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(who, list(r))
