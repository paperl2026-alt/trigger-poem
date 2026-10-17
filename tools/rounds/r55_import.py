"""Round 55 (tools/rounds/job_specs55.py, art/raw/r55; docs/DESIGN.md 第 1 话) -> the content pack.
  pit     pit_wall<n> (2:3), pit_floor<n> (tileable, edges matched to floor 1)  -> ep1/pit_wall<n>, ep1/pit_floor<n>
  paw     paw_<v> (the picked one)                                              -> ep1/paw   (the haul out of the pit, Game.enterFrom)
  armor   armor_lance_<v> (the picked one)                                      -> prop/ep1_armor_lance, padded to the empty-handed armour's
          (prop/ep1_garden2) aspect so the mechanism can flip one into the other in place
usage: python -I tools/rounds/r55_import.py"""
import sys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "r55"
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from r28_import import tileable
from r31_import import same_edges
from r54_import import save, trimmed

PAW, ARMOR = "b", "a"

if __name__ == "__main__":
    mp = A / "manifest.json"; man = json.loads(mp.read_text())
    for i in (1, 2, 3, 4):
        save(man, f"ep1/pit_wall{i}", Image.open(RAW / f"pit_wall{i}.png").convert("RGB").resize((1024, 1536), Image.LANCZOS))
    base = tileable(Image.open(RAW / "pit_floor1.png").convert("RGB").resize((1024, 1024), Image.LANCZOS))
    save(man, "ep1/pit_floor1", base)
    save(man, "ep1/pit_floor2", same_edges(tileable(Image.open(RAW / "pit_floor2.png").convert("RGB").resize((1024, 1024), Image.LANCZOS)), base))
    paw = trimmed(Image.open(RAW / f"paw_{PAW}.png").convert("RGBA"))
    if max(paw.size) > 1200: s = 1200 / max(paw.size); paw = paw.resize((round(paw.width * s), round(paw.height * s)), Image.LANCZOS)
    save(man, "ep1/paw", paw)
    ref = Image.open(A / "prop" / "ep1_garden2.webp")
    arm = trimmed(Image.open(RAW / f"armor_lance_{ARMOR}.png").convert("RGBA"))
    ar = ref.width / ref.height   # the same canvas shape as the empty-handed armour, bottom-aligned and centred
    W, H = (round(arm.height * ar), arm.height) if arm.width / arm.height < ar else (arm.width, round(arm.width / ar))
    can = Image.new("RGBA", (W, H), (0, 0, 0, 0)); can.alpha_composite(arm, ((W - arm.width) // 2, H - arm.height))
    can = can.resize((ref.width, ref.height), Image.LANCZOS)
    save(man, "prop/ep1_armor_lance", can)
    mp.write_text(json.dumps(man, indent=1, sort_keys=True))
    print("pit walls, floors, paw", paw.size, "armor", can.size)
