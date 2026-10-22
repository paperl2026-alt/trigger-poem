# Round 94 (user 2026-10-22: "飞行怪不知道为啥你全部删除了 ... 把敌人数又减少了许多" - one kind of monster to a room had turned every swarm
# of wafer bats into the room's walker, capped; and one kind to a room, no kind twice): each room of episode 1 its own small swarm flyer
# (like the wafer bat, which stays the shop's), coming in the numbers the bats did; colours that stand out from the place (as R90 / R91).
# Three designs each; tools/rounds/r94_import.py brings in the picked ones as enemy/<kind>[_b|_c]_<pose> (the bat's six poses).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs53 import BASE, MON

R = "art/raw/r94/"
REFS = MON + ["art/raw/r53/m_bat_a.png"]   # (the approved direction, two approved sheets, and the shop's wafer bat: the size and kind of thing)
B = (BASE.replace("reference images 2 and 3 are approved", "reference images 2, 3 and 4 are approved")
     .replace("Colours: honey amber, cream, sour pastel pink, pistachio, chocolate brown, tarnished gold; NOT dark green, NOT violet. ", ""))
FLY = ("Poses, top row: 1 flying, wings up, 2 flying, wings down, 3 hovering in place, looking at the viewer (idle); bottom row: 4 wings "
       "pulled back, about to dive (winding up), 5 diving straight at the viewer, very close and big, mouth open, 6 hurt, a wing cracked, "
       "eyes squeezed shut.")
KINDS = {
    "moth": ("the portrait gallery's",
             "It flies in a gallery of warm pink plaster, peach and gold baroque frames: it must stand out against that at a glance - deep NAVY "
             "and white as its main colours, never pink, peach or gold as its main colour. ",
             "PORTRAIT MOTH, a small moth whose four wings are little torn oil-painting canvases in broken frames, each painted with one sweet "
             "lady's eye that looks at you; a fuzzy navy body with a white lace collar; a porcelain-doll face with long lashes, glossy lips "
             "and tiny fangs; feathery antennae like a bow; two dangling legs in white stockings and navy Mary-Jane shoes."),
    "helm": ("the knights' hall's",
             "It flies in a hall of grey stone and old gold armour: it must stand out against that at a glance - bright SCARLET and white as "
             "its main colours, never grey, gold or brown as its main colour. ",
             "PLUMED HELM FAIRY, a small knight's visored helmet flying on scarlet stained-glass butterfly wings, a long scarlet plume "
             "flowing out of it like a ponytail, two glowing eyes with long lashes in the visor slit and glossy lips behind the half-open "
             "visor, a tiny chain-mail frill like a skirt under it, two dangling legs in white stockings and red shoes."),
    "cherry": ("the cold store's",
               "It flies in a frozen store room of icy pale blue and white: it must stand out against that at a glance - deep CHERRY RED "
               "and dark chocolate as its main colours, never blue or white as its main colour. ",
               "FROZEN CHERRY BAT, a small bat whose body is a black cherry dipped in a cracked dark-chocolate shell, its wings thin red "
               "cherry-candy glass with frost only along their edges, a cherry-stalk tail with a leaf bow; big glossy eyes with long lashes, "
               "a tiny fanged mouth with glossy lips; two dangling legs in white frilly socks and brown shoes."),
    "plane": ("the nursery's",
              "It flies in a pastel nursery of soft pink, mint and cream: it must stand out against that at a glance - a white paper body "
              "covered in bold BLACK and CRIMSON crayon, never pastel as its main colour. ",
              "CRAYON PAPER PLANE, a folded paper plane covered in a small child's black and crimson crayon scribbles that has grown a "
              "scribbled face on its nose: huge crayon-drawn eyes with spiky lashes, a jagged crayon mouth full of teeth; crimson crayon "
              "ribbons trailing from its wing tips like pigtails; two little paper-doll legs in scribbled socks dangling under it."),
    "sugarfly": ("the oven kitchen's",
                 "It flies in a kitchen of warm orange brick, copper pans and an oven's glow: it must stand out against that at a glance - "
                 "icy CYAN and white blown sugar as its main colours, never orange, copper or brown as its main colour. ",
                 "SPUN-SUGAR FLY, a small fly made of blown sugar glass: a round sugar-bauble head with a cute face, big glossy eyes with "
                 "long lashes, glossy lips and a candy-straw proboscis; wings of thin spun-sugar threads like lace; a striped cyan-and-white "
                 "candy body like a little bodice; frilly white pantaloon legs; a cyan ribbon on its head."),
    "deathmoth": ("the honey tunnel's",
                  "It flies in a deep tunnel of dark amber honey: it must stand out against that at a glance - VIOLET-BLACK and white as its "
                  "main colours, never amber, gold or brown as its main colour. ",
                  "DEATH'S-HEAD MOTH GIRL, a fuzzy violet-black moth with a white fur ruff like a frilly collar, white lace patterns on its "
                  "wings that make a girl's skull face, black glossy eyes with long white lashes, a little mouth with fangs and glossy lips, "
                  "honey drops clinging to its fur, two dangling legs in white stockings and black shoes."),
}
JOBS = {f"R94_{k}": [(f"{R}m_{k}_{v}.png", REFS, B + room + f"The monster ({where} small flyer that comes in swarms): " + d + " " + FLY +
                      f" Variation {v}: its own design details, same idea, a clearly different take from the other variations.") for v in "abc"]
        for k, (where, room, d) in KINDS.items()}
