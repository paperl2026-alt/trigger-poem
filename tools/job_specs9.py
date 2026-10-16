# Round 9: episode-0 environment pieces for "calm after-school sunset -> sudden invasion" (no tentacles, no gems, no giant eyes).
CALM = ("STYLE: polished anime background art, warm and peaceful late-afternoon light (cream, wood brown, sunset orange, soft pink sky), "
        "clean shapes with slight paper grain like a hand-made paper diorama. No text, no letters, no people.")
TILE = "Seamless tileable texture for a 3D game, perfectly square, seen perfectly flat and head-on with no perspective, evenly lit, the pattern repeats seamlessly across all four edges. "
JOBS = {
    "R9_env": [
        ("art/raw/bg_yard_calm.png", [], "Wide horizontal background painting seen head-on from standing eye level: a peaceful Japanese high school building across an empty schoolyard at sunset, "
         "a clock on the facade, rows of windows glowing orange, a running track and a sports-equipment shed, cherry trees at the sides, long soft shadows, a calm pink-orange sky with a few clouds. "
         "The lower part is open dirt yard.\n" + CALM, "OPAQUE"),
        ("art/raw/rips.png", [], "Game effect sprite sheet: six separate torn-paper rips in a 3 by 2 grid on a fully transparent background, each centered in its cell with a wide gap, all different shapes "
         "(long jagged slashes, a round burst, a zigzag crack). Each is a hole torn through a sheet of paper with curled white fibrous paper edges, revealing a deep black-violet void "
         "full of tiny magenta and cyan sparkles and drifting paper scraps inside.\nSTYLE: crisp anime game effect art, high contrast, readable at small size. No text, no eyes, no tentacles, no gems."),
    ],
    "R9_tex": [
        ("art/raw/tex_class_wall.png", [], TILE + "A Japanese classroom wall: cream plaster upper part with a row of tall sliding windows showing a calm orange sunset sky over rooftops, a wooden wainscot along the bottom. Nothing spooky: no figures, no faces, no eyes, no silhouettes in the windows.\n" + CALM, "OPAQUE"),
        ("art/raw/tex_class_floor.png", [], TILE + "Polished wooden school floorboards running vertically, a few scuffs, warm sunset light. Nothing spooky: no figures, no faces, no eyes, no shadows of creatures.\n" + CALM, "OPAQUE"),
        ("art/raw/tex_corridor_wall.png", [], TILE + "School corridor wall: pale mint-green lower half, cream upper half, a high strip of windows with a calm sunset sky, a cork bulletin board with blank colorful paper notices and pins. Nothing spooky: no figures, no faces, no eyes, no silhouettes in the windows.\n" + CALM, "OPAQUE"),
    ],
}
