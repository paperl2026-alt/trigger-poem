# Round 66 (user 2026-10-20: the whole game physical, "先做物理"; docs/TECH.md「物理」): episode 2's places had no loose things in them, only
# the mechanisms. Four different everyday things of an old ryokan for each of the ten places, single drawings like R63's props: they
# stand about in the rooms as rigid bodies (rock when shot, fly and tumble when broken, shoved by the monsters). Painted after each
# place's concept painting (R62 picks), never the same thing twice in the episode (DESIGN「美术不许偷懒复用」).
#   R66_<place>: prop_<place>_<name>.png -> prop/ep2s_<place>_<name> (tools/rounds/r66_import.py; relief added there)
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX
from job_specs63 import CON

R = "art/raw/r66/"
PROP = ("Reference image 1 is the concept painting of the place: paint in EXACTLY its style (painting technique, line work, colours, "
        "materials). ONE single game prop, seen from the front at eye level, slightly from above, whole and complete, centred, standing on its "
        "own base, on a fully transparent background: no floor, no shadow, no people, no text, no letters, no numbers. Solid and clearly "
        "readable as one object, the kind of thing that could be knocked over and tumble. " + NOFX + "THE PROP: ")
PROPS = {
    "genkan": [("umbrella", "an old round ceramic umbrella stand with three closed red and indigo oiled-paper wagasa umbrellas in it"),
               ("hibachi", "a round blue-and-white porcelain hibachi brazier on a small wooden stand, a pair of iron fire chopsticks in the ash"),
               ("tanuki", "a cheerful glazed shigaraki tanuki statue with a straw hat and a sake flask, about knee high"),
               ("getabox", "a low wooden geta rack with three pairs of wooden geta clogs on it")],
    "kyakushitsu": [("chabudai", "a low round lacquered tea table with a teapot, two yunomi cups and a small plate of manju on it"),
                    ("zaisu", "a legless lacquered floor chair (zaisu) with a flat red cushion on it"),
                    ("andon", "a square paper andon floor lamp in a black wooden frame (unlit, no glow)"),
                    ("zabuton", "a neat stack of four square zabuton floor cushions, purple and gold, the top one with a tassel at each corner")],
    "rouka": [("bucket", "a round wooden fire bucket with a red painted band and a rope handle"),
              ("vase", "a small dark wooden side table with a tall celadon vase of white chrysanthemums"),
              ("towels", "a woven bamboo laundry basket full of neatly folded white towels"),
              ("tray", "a wooden room-service tray stand with a covered lacquer bowl and a pot of tea")],
    "furo": [("oke", "a stack of three round hinoki wooden bath buckets, one leaning on the stack"),
             ("stool", "a low hinoki wooden bath stool"),
             ("yuzu", "a shallow wooden tub full of floating yellow yuzu fruit"),
             ("bottles", "a little wooden caddy with three round ceramic bottles of shampoo and soap (no labels, no writing)")],
    "hiroma": [("taru", "a big wooden sake barrel (komodaru) wrapped in woven straw with a red and gold crest (no readable letters), its lid on"),
               ("shamisen", "a shamisen standing upright on a small lacquered stand, its plectrum hanging on a cord"),
               ("ozen", "a low red lacquered banquet tray table (ozen) with a whole grilled fish and little bowls, different from any other"),
               ("lantern", "a tall standing floor lantern (andon) of wood and paper with a painted plum branch (unlit, no glow)")],
    "nakaniwa": [("bonsai", "a gnarled pine bonsai in a shallow glazed pot on a wooden stand"),
                 ("bench", "a weathered wooden garden bench with a red felt cloth over it"),
                 ("watering", "a copper watering can and a bamboo rake leaning on a stone"),
                 ("koi", "a round glazed ceramic koi bowl (suiban) on a low stand with water lilies")],
    "kura": [("nagamochi", "an old wooden storage chest (nagamochi) with black iron fittings and a pole through its handles"),
             ("boxes", "a stack of three plain wooden storage boxes tied with cotton cords, no writing on them"),
             ("kame", "a big brown glazed earthenware storage jar (kame) with a wooden lid"),
             ("mino", "an old straw raincoat (mino) and straw hat hanging on a wooden stand")],
    "chika": [("crate", "an old wooden crate with rope handles, slightly broken at one corner"),
              ("wheel", "a broken wooden cart wheel leaning on a rock"),
              ("barrel", "a squat wooden barrel with iron hoops and a coil of rope on top"),
              ("jizo", "a small mossy stone jizo statue with a faded red bib, on a rough stone base")],
    "shoro": [("toolbox", "an open wooden carpenter's toolbox with old hand tools (a saw, mallet, chisels) in it"),
              ("cogs", "a stack of three spare brass and wood clock cog wheels lying on a small wooden pallet"),
              ("oilcan", "a tall copper oil can with a long spout next to a bundle of oily rags"),
              ("spool", "a big wooden spool wound with thick hemp rope")],
    "kane": [("saisen", "a wooden offering box (saisen-bako) with a slatted top and an iron-bound front, no writing"),
             ("shimenawa", "a coiled thick sacred straw rope (shimenawa) with white zigzag paper streamers, lying in a loose heap"),
             ("drum", "a small taiko drum on a wooden stand with two sticks resting on it"),
             ("incense", "a bronze incense burner on three legs with a few sticks of incense in it (no smoke)")],
}
# (only the pictures not made yet: a run the image tool turned away, its usage limit reached, is simply made again)
ROOT = pathlib.Path(__file__).resolve().parents[2]
JOBS = {f"R66_{k}": [(f"{R}prop_{k}_{n}.png", [CON(k)], PROP + d) for n, d in items if not (ROOT / f"{R}prop_{k}_{n}.png").exists()] for k, items in PROPS.items()}
JOBS = {k: v for k, v in JOBS.items() if v}
