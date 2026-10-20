"""New heroine poses into the game, the same way for every round (tools/rounds/r68_rig.py, r69_rig.py, ...): each picked picture becomes a jiggle
pose like her cover / fire ones (src/jiggle): the cat girl's paw seal made canonical (tools/seal_fix.py: found by itself, or placed by hand with
a pick's "seal"), trimmed into public/jiggle/<pose>.png (meta.json, flesh.json), its rig (the parts' areas, uv with v from the bottom) written to
public/jiggle/rigs.json (tools/jiggle_masks.py reads it besides its own), the weight maps made, and the pose put into characters/<id>.json
rig.<name> (and rig.sets when a round gives the sets that use it); nothing else of the rig is touched.
The cat girl's tail comes out from under her skirt, the skirt over it (DESIGN 主角): pictures that drew it otherwise are not picked.
  install(raw_dir, PICK, RIGS, FLESH, SETS=None)   PICK: pose -> { src (picture name in raw_dir), anchor, muzzle, kick, tick, seal }
  flags on the command line: --overlay (art/_shots/ov_<pose>.jpg to check the parts), --dry (the masks only, not into the content)"""
import json, pathlib, shutil, subprocess, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402

J = ROOT / "public" / "jiggle"
CH = {"cat": "cat", "pink": "pink"}

def tail(root, poly): return {"type": "chain", "root": root, "test": "fur", "solo": True, "poly": poly}

def install(raw, PICK, RIGS, FLESH, SETS=None):
    overlay, dry = "--overlay" in sys.argv, "--dry" in sys.argv
    # 1. the pictures: the paw seal made canonical, trimmed to the figure
    pl = ROOT / "art" / "seal_placements.json"; P = json.loads(pl.read_text(encoding="utf-8"))
    seals = []
    for pose, info in PICK.items():
        src = raw / f"{info['src']}.png"
        if pose.startswith("cat_"):
            key = f"jig_{pose}"; P[key] = {"src": str(src.relative_to(ROOT)).replace("\\", "/"), **(info.get("seal") or {"auto": True}), "png": f"public/jiggle/{pose}.png", "keep_frame": True}; seals.append(key)
        else: shutil.copy(src, J / f"{pose}.png")
    pl.write_text(json.dumps(P, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if seals: subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "seal_fix.py"), *seals], check=True, stdin=subprocess.DEVNULL)
    meta = json.loads((J / "meta.json").read_text()); flesh = json.loads((J / "flesh.json").read_text())
    for pose, info in PICK.items():
        im = Image.open(J / f"{pose}.png").convert("RGBA"); canvasH = im.height; im = im.crop(im.getbbox()); im.save(J / f"{pose}.png")
        meta[pose] = {"src": f"{raw.name}/{info['src']}", "w": im.width, "h": im.height, "canvasH": canvasH}
        flesh[pose] = FLESH[pose]
    (J / "meta.json").write_text(json.dumps(meta, indent=1)); (J / "flesh.json").write_text(json.dumps(flesh, indent=1))
    # 2. the rigs and the weight maps
    rp = J / "rigs.json"; R = json.loads(rp.read_text()) if rp.exists() else {}
    R.update({k: v for k, v in RIGS.items() if k in PICK}); rp.write_text(json.dumps(R, indent=1))
    args = [f"--pose={p}" for p in PICK] + ([str(ROOT / "art" / "_shots")] if overlay else [])
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "jiggle_masks.py"), *args], check=True, stdin=subprocess.DEVNULL)
    if dry: return
    # 3. into the content: jig/<pose> pictures (the base pack: the heroines are everybody's), characters/<id>.json rig.<name> (+ rig.sets)
    man = packs.manifest(); A = packs.BASE / "assets" / "jig"
    rigs = {}
    for pose, info in PICK.items():
        who, name = pose.split("_", 1); keys = []
        for f in [pose] + [f"{pose}_w{i}" for i in range(4)]:
            shutil.copy(J / f"{f}.png", A / f"{f}.png"); im = Image.open(J / f"{f}.png")
            man[f"jig/{f}"] = {"src": f"assets/jig/{f}.png", "w": im.width, "h": im.height, **({"data": True} if "_w" in f else {})}; keys.append(f"jig/{f}")
        rig = json.loads((J / f"{pose}_rig.json").read_text())
        rigs.setdefault(who, {})[name] = {"img": keys[0], "w": keys[1:], "rig": rig, "flesh": flesh[pose], "h": meta[pose]["h"], "canvasH": meta[pose]["canvasH"],
                                          **{k: v for k, v in info.items() if k not in ("src", "seal")}}
    man.save()
    for who, r in rigs.items():
        f = packs.data_file("characters", CH[who]); d = packs.load(f); c = d[CH[who]]
        c["rig"].update(r)
        if SETS and who in SETS: c["rig"]["sets"] = SETS[who]
        f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(who, sorted(r), "sets", sorted(c["rig"].get("sets", {})))
