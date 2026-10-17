# Round 28: corridor tech validation (docs/DESIGN.md "场景的技术路线"): the corridor is built from flat panels in 3D; every panel gets a
# flat, front-on painting (an elevation of a wall, the floor seen from straight above). No perspective in the pictures: the 3D view makes it.
# Window panes are painted solid magenta and keyed out (tools/rounds/r28_import.py); the outside is its own far panorama.
REF = "art/ref/corridor_concept.png"
STYLE = ("Reference image 1 shows the approved painting style of this game (warm sunset light, detailed anime background painting); copy only its "
         "style, colours and light, not its composition. ")
FLAT = ("IMPORTANT: this is a flat texture for a 3D game: an orthographic, perfectly front-on view, NO perspective, no vanishing point, no camera "
        "angle, every horizontal line perfectly horizontal and every vertical line perfectly vertical; the picture IS the surface and fills the frame "
        "exactly edge to edge (no border, no wall corners, no floor or ceiling visible). No people, no monsters, no text, no letters, no numbers. ")
JOBS = {
    "R28_wallA": [("art/raw/r28/wallA.png", [REF], STYLE + FLAT +
        "The surface: one 4.5 m wide, 3 m tall section of a Japanese high-school corridor wall on the classroom side: a wooden sliding classroom "
        "door on the left third with a small glass window in it (the glass shows a dim classroom), above it a row of small transom windows, a blank "
        "classroom name plate sticking out above the door, to the right a cork notice board with blank pinned papers, a cream plaster wall with a "
        "pale green lower wainscot and a wooden skirting board, warm sunset light falling across it in soft diagonal stripes.", "OPAQUE")],
    "R28_wallB": [("art/raw/r28/wallB.png", [REF], STYLE + FLAT +
        "The surface: one 4.5 m wide, 3 m tall section of a Japanese high-school corridor wall on the classroom side: a row of inner windows into "
        "a classroom at head height (the glass shows the dim classroom with desks), under them a row of grey steel student lockers, a cream "
        "plaster wall with a pale green lower wainscot, a fire extinguisher box, warm sunset light falling across it in soft diagonal stripes.", "OPAQUE")],
    "R28_wallW": [("art/raw/r28/wallW.png", [REF], STYLE + FLAT +
        "The surface: one 4.5 m wide, 3 m tall section of a Japanese high-school corridor wall on the outside: two big windows side by side with "
        "white aluminium frames and a thick sill, a pink curtain gathered at one side; under the windows a cream wall with a radiator. "
        "Paint every window PANE (the glass area where the outside would be seen) as solid flat pure magenta #FF00FF, nothing else magenta.", "OPAQUE")],
    "R28_floor": [("art/raw/r28/floor.png", [REF], STYLE + FLAT.replace("front-on view", "top-down view looking straight down") +
        "The surface: 3 m by 3 m of a polished honey-coloured wooden school corridor floor (long boards running from top to bottom of the picture), "
        "seamless and tileable on all four edges, subtle warm reflections, a few scuffs.", "OPAQUE")],
    "R28_ceil": [("art/raw/r28/ceil.png", [REF], STYLE + FLAT.replace("front-on view", "view looking straight up") +
        "The surface: 3 m by 3 m of a school corridor ceiling: off-white acoustic ceiling tiles in a grid with one long fluorescent light fitting "
        "across the middle, seamless and tileable.", "OPAQUE")],
    "R28_end": [("art/raw/r28/end.png", [REF], STYLE + FLAT +
        "The surface: the 3.2 m wide, 3 m tall end wall of a school corridor: a big window in the upper half (paint the PANES as solid pure magenta "
        "#FF00FF), under it a bench and a potted plant painted flat against the wall, cream plaster, sunset light.", "OPAQUE")],
    "R28_out": [("art/raw/r28/outside.png", [REF], STYLE +
        "A wide panoramic view seen from a school's second-floor corridor windows at sunset: the school's sports ground with a red running track, "
        "trees, a chain-link fence, the other school building, a town and hills in the distance, a big glowing sunset sky with clouds. "
        "Eye-level horizon in the middle of the picture. No people, no text.", "OPAQUE")],
    "R28_decals": [("art/raw/r28/decals.png", [REF], "Same painting style as reference image 1. A sprite sheet on a transparent background, 3 x 2 grid, one "
        "item per cell with empty space around it, flat front-on, no text: 1 a dark violet eye sigil (a single stylised eye inside a jagged diamond) "
        "smeared like paint, 2 a tall hanging cloth banner with the same eye sigil, 3 a splash of glowing pink cracks, 4 a scatter of loose test papers "
        "seen from above, 5 a fallen school bag seen from above, 6 a pool of violet goo seen from above.")],
}
