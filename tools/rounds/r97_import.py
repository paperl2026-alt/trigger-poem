"""Round 97 (tools/rounds/job_specs97.py: the escort's child walking, and her door) into the episode 1 pack:
  soul_walk_<v>        its 3 x 2 sheet -> ep1/soul_walk_<walk0|walk1|walk2|walk3|look|flinch> on one canvas, feet on the bottom
                       (src/battle/escort.js plays them)
  soul_door_<v>        the door standing alone in the field -> ep1/soul_door (trimmed; escort.js: where she is going)
  soul_doorframe_<v>   its doorway with her beside it, the opening solid black -> ep1/door10_frame (manifest "hole")
  soul_leaf_<v>        the closed leaf for that opening -> ep1/door10_leaf (the door close-up after the escort, src/ui/door.js)
usage: python -I tools/rounds/r97_import.py"""
import pathlib, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402
from r23_import import cells  # noqa: E402
from r53_import import put, canvas, trim, fit, hole  # noqa: E402

R97 = ROOT / "art" / "raw" / "r97"
PICK = {"walk": "a", "door": "b", "frame": "b", "leaf": "a"}
POSES = ["walk0", "walk1", "walk2", "walk3", "look", "flinch"]


def add(man, key, im, **kw):
    if key not in man: man.pk["ep1"][key] = {}; man.where[key] = "ep1"
    put(man, key, im, **kw)


def main():
    man = packs.manifest()
    for name, can, extra in canvas(list(zip(POSES, cells(R97 / f"soul_walk_{PICK['walk']}.png"))), "bottom"):
        add(man, f"ep1/soul_walk_{name}", can, q=92, **extra)
    print("soul_walk", can.size)
    door = trim(Image.open(R97 / f"soul_door_{PICK['door']}.png").convert("RGBA"), 0)
    add(man, "ep1/soul_door", fit(door, 1200), q=92); print("soul_door", door.size)
    fr = Image.open(R97 / f"soul_doorframe_{PICK['frame']}.png").convert("RGB"); hb = hole(fr)
    add(man, "ep1/door10_frame", fit(fr, 1800), q=88, hole=hb); print("door10_frame", fr.size, "hole", hb)
    if PICK["leaf"]:
        leaf = trim(Image.open(R97 / f"soul_leaf_{PICK['leaf']}.png").convert("RGBA"), 0)
        add(man, "ep1/door10_leaf", fit(leaf, 1400), q=90); print("door10_leaf", leaf.size)
    man.save()


if __name__ == "__main__":
    main()
