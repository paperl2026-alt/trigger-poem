"""What each monster's and each thrown thing's hit leaves on the screen (docs/DESIGN.md「挨打留视觉残留」, src/ui/scars.js): enemies.json /
projectiles.json "scar" (one kind or a list: all of them at once) and "scarColor" (a splash's colour), written into whichever pack holds
the entry (tools/packs.py: the base pack or a chapter's level pack). A kind not listed here gets the default of its attack (scars.js
scarFor: a bite -> bite, a rush -> claw, a shot -> crack, a ranged blast -> burn). Idempotent.
usage: python -I tools/rounds/scars.py"""
import pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)

ENEMIES = {
    # the prologue's school
    "zomb": ("bite", None), "desk": ("claw", None), "shoe": ("bite", None), "chair": ("claw", None),
    "sheet": ("ink", None), "paper": ("paper", None), "book": ("paper", None), "umbrella": ("bite", None),
    # episode 1's rotten-honey house: ice cream, honey, lace and dolls
    "ghoul": (["bite", "splat"], "#ffc8dc"), "crawler": (["claw", "splat"], "#e8a040"), "armor": ("claw", None),
    "double_cat": (["claw", "splat"], "#f0b040"), "double_pink": (["bite", "splat"], "#ffb0d0"),
    "scoopling": ("splat", "#fff0c0"), "teacup": ("splat", "#a0602a"), "doily": ("paper", None), "dollkin": ("bite", None),
    "bat": ("claw", None), "shade_bride": ("claw", None),
    # episode 2's inn
    "surippa": ("crack", None), "karakasa": ("bite", None), "futon": ("splat", "#f4f0e6"), "she": ("paper", None),
    "kaiko": ("splat", "#f8f6ee"), "katashiro": ("paper", None),
}
PROJECTILES = {
    "wisp": ("burn", None), "takoyaki": ("splat", "#c88040"), "balloon": ("splat", "#ff6aa0"), "shard": ("crack", None),
    "plane": ("paper", None), "phone": ("crack", None), "manga": ("paper", None), "hand": ("claw", None), "tack": ("crack", None),
    "eye": ("ink", None), "ooze": ("splat", "#e0a020"), "hair": ("claw", None), "chalk": ("splat", "#f0f0f0"), "tooth": ("bite", None),
    "lips": ("bite", None), "eyes": ("ink", None), "furniture": ("crack", None), "cherry": ("splat", "#d01830"), "scoop": ("splat", "#ffe0f0"),
    "lanternlet": ("burn", None), "kokehead": ("crack", None), "geta": ("crack", None), "crane": ("paper", None), "pins": ("crack", None),
    "scissors": ("paper", None),
}

# the look of their attacks in the room (docs/DESIGN.md「场景破坏和怪物特效」, tuning/vfx.json): a thrown thing's trail, a must-hide blast
# (enemies.json blast, merged in: vfx its look, charge the circle it draws while gathering, chance how often a wind-up is one, windup its
# own gathering time, dmg) - fire breathed, incense smoke and extinguisher foam left hanging, magic circles
TRAILS = {"wisp": "fireTrail", "lanternlet": "fireTrail", "ooze": "glowTrail", "balloon": "glowTrail", "eye": "inkTrail", "eyes": "inkTrail",
          "furniture": "smokeTrail", "geta": "smokeTrail", "kokehead": "smokeTrail", "chalk": "smokeTrail"}
BLASTS = {"horn": {"vfx": "blast"}, "ext": {"vfx": "foamSpray"}, "shadow": {"vfx": "darkMagic", "charge": "darkCharge"},
          "shade_mourner": {"vfx": "incenseSmoke"},
          "chochin": {"dmg": 24, "vfx": "fireBreath", "chance": 0.35, "windup": 1.6},
          "kokeshi": {"dmg": 24, "vfx": "curseMagic", "charge": "curseCharge", "chance": 0.3, "windup": 2.0}}

def looks():
    files = {}
    for cat, table, field in (("projectiles", TRAILS, "trail"), ("enemies", BLASTS, "blast")):
        for id, v in table.items():
            f = packs.data_file(cat, id)
            if not f: print("no", cat, id); continue
            D = files.get(f) or files.setdefault(f, packs.load(f))
            if field == "trail": D[id]["trail"] = v
            else: D[id]["blast"] = {**D[id].get("blast", {}), **v}
    for f, D in files.items(): packs.dump(f, D); print(f.relative_to(ROOT))

def apply(cat, table):
    files = {}
    for id, (scar, color) in table.items():
        f = packs.data_file(cat, id)
        if not f: print("no", cat, id); continue
        D = files.get(f) or files.setdefault(f, packs.load(f))
        D[id]["scar"] = scar
        if color: D[id]["scarColor"] = color
        else: D[id].pop("scarColor", None)
    for f, D in files.items(): packs.dump(f, D); print(f.relative_to(ROOT))

if __name__ == "__main__":
    apply("enemies", ENEMIES); apply("projectiles", PROJECTILES); looks()
