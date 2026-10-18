# Round 57 (docs/DESIGN.md「书包」, user 2026-10-18): the reward for clearing episode 1 (腐蜜之家): 诡谲甜筒 / おあずけコーン / Scream Cone,
# the one gelato the girls never got to eat (the end comic's empty cone), as a bag item icon in the piggy bank's style.
#   R57_item_cone: 4 candidates -> item/cone (tools/rounds/r57_import.py)
JOBS = {}
PIG = "public/content/base/assets/item/pig.webp"
GELATO = "art/raw/r56/m_scoop_b.png"
JOBS["R57_item_cone"] = [(f"art/raw/r57/item_cone_{v}.png", [PIG, GELATO], "Reference image 1 is this game's bag item icon: draw in EXACTLY its "
    "style (same rendering, thick dark outline, glossy colours, sticker-like, same size and framing). Reference image 2 shows the pastel gelato "
    "of this chapter (its colours and drips). ONE item icon on a transparent background: a CURSED GELATO CONE from a haunted gelato cafe in an "
    "old Western mansion: a waffle cone baked a little too dark, two round scoops (strawberry pink and honey gold) that look freshly scooped and "
    "never melt, a cherry on top, a small red ribbon tied around the cone like a little girl's hair ribbon, thick honey dripping down the side; "
    "just slightly wrong: one tiny glossy eye peeking out of the pink scoop, the honey drips shaped like tiny handprints. Cute and a little "
    "creepy (kimo-kawaii), sweet and tempting, NOT gory. No text." + f" Variation {v}.") for v in "abcd"]
