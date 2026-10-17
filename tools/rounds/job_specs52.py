# Round 52 (docs/PLAN.md 第九批「书包」): look proposals for the school-bag page. The layout is fixed by the game (tools/rounds/
# bag_wireframe.py -> art/ref/bag/wireframe.png): Codex only gives it a look, four different directions, with NO lettering (every word and
# number is the game's; docs/DESIGN.md: Codex lettering is not used). The picked look is later split into its parts.
REFS = ["art/ref/bag/select_now.png", "art/ref/bag/wireframe.png", "art/ref/bag/items.png"]
P = ("Reference image 1 is this game's chapter-select screen: red, black and white, Persona-5-like, halftone dots, torn paper, slanted "
     "plates, a red city silhouette. Design the SAME screen with its right half turned into the SCHOOL BAG page (the inventory where the "
     "player equips items before a mission). Landscape 16:9 (1536 x 864). "
     "Keep the whole left half (back button, chapter title, stage rows, BEST, the big red start button, the next-chapter card) and the top "
     "bar (coin counter, gear) exactly as in reference image 1. The two tabs at the top of the right half stay where they are, but now the "
     "right tab (the school-bag tab with the briefcase icon) is the selected one (red) and the left tab (team) is white. "
     "Reference image 2 is the WIREFRAME of the bag page: follow its boxes EXACTLY, same positions, same sizes, nothing added or moved: "
     "the YELLOW strip at the top = the bag's COST capacity: a label plate on the left, a row of 20 small slots of which 7 are lit (filled) "
     "and 13 empty, a number plate, and a red expand button at the right end; "
     "the BLUE boxes = a 3 x 3 grid of item slots, each slot holding one item picture, with a small level tag at its top-right corner and "
     "one to three cost dots along its bottom; the first slot is equipped: it has a round red badge at its top-left corner; "
     "the thin BLUE strip under the grid = page arrows (left / right) and two page dots; "
     "the PURPLE strip at the bottom = what is equipped now: a label plate and six small slots, the first three holding small copies of "
     "item pictures; "
     "the GREEN card on the right = the selected item's detail: a big picture of the selected item (the piggy bank), a name plate, a level / "
     "cost plate, an effect plate, three areas for three short paragraphs of item text (like an item description in Dark Souls / Elden "
     "Ring), and two red buttons at the bottom (equip, upgrade). "
     "Reference image 3 shows the nine items: put exactly these pictures in the nine slots (drawn the same, sticker style): the eldritch "
     "piggy bank (selected and equipped), the lucky cat, the speed loader, the drum magazine, the energy drink, the anpan, the armband, the "
     "heart band-aid, the charm. "
     "ABSOLUTELY NO LETTERING ANYWHERE in the bag page: no letters, no numbers, no Japanese or Chinese characters, no fake text. The game "
     "writes every word and number itself: leave every text area as an EMPTY plate or strip of the right size (the paragraph areas may "
     "show a few very faint blank ruled lines). The badges and buttons are plain shapes without letters. "
     "It must look like a polished, stylish game UI (not cheap, not cluttered, not a web page): bold shapes, clear hierarchy, every slot "
     "readable. ")
LOOK = {
    "a": "LOOK A, 'Persona 5 straight': the bag page in exactly the select screen's language: slanted black and white plates with red, "
         "torn paper edges, halftone, the item slots as slightly tilted white sticker cards with a black shadow, the selected slot red.",
    "b": "LOOK B, 'inside the school bag': the panel is the open school bag's inner lining (dark red tartan fabric and black leather "
         "trim with stitching); the item slots are stitched fabric pockets, the cost slots are little round enamel pins on a strap, the "
         "detail card is a paper tag clipped inside, the buttons are leather tabs; still red / black / white.",
    "c": "LOOK C, 'manga page': the panel is a printed manga page: black panel borders, screentone, speed lines; each item slot is a "
         "small manga panel, the selected one with a red burst behind it; the detail card is a big panel framed like an ornate item "
         "card; red as the only spot colour.",
    "d": "LOOK D, 'cursed relic catalogue': an elegant dark item menu like Dark Souls / Elden Ring, made cute and in this game's colours: "
         "black panel with thin red and white ornamental filigree, diamond-cut slot frames with a soft inner glow, the selected slot "
         "outlined in bright red, the detail card like a framed museum label; refined and calm, few decorations.",
}
JOBS = {f"R52_bag_{v}": [(f"art/raw/r52/bag_{v}.png", REFS, P + LOOK[v], "OPAQUE")] for v in "abcd"}
