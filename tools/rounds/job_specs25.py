# Round 25: the prologue boss, the DISCIPLINE COMMITTEE GIANT (风纪委员), fought in the schoolyard.
# User: the boss is HUGE; the screen only ever holds a part of her, never her whole figure. Girlified monster like the small ones.
# Phases (src/battle/boss.js "giant"): 1 head + hands over the school roof, the third eye (weak point) mostly shut;
# 2 transformed, climbs onto the roof, rule-tape hair, ruler arms, weak point = armband crest, only bare when she raises an arm;
# 3 leans down over the yard, the face fills the top of the screen, mouth = a huge megaphone, the eye wide open.
# Step 1: the master design (R25_master). Step 2 (R25_parts): every animated part, drawn with the master as reference, each on its own
# transparent image at high resolution so it can be animated (tools/rounds/r25_import.py).
import pathlib
REF = "art/ref/monster_ref.webp"
MASTER = "art/raw/r25/master.png"
LOOK = ("The character: the school's DISCIPLINE COMMITTEE girl turned into a colossal monster: a prim, beautiful, stern high-school girl with very "
        "long straight black hair with blunt bangs, sharp red eyes, a navy blazer school uniform with a white collar, a red armband with a white shield "
        "crest (no letters) on her left upper arm, a silver whistle on a red cord; ANOMALY: she is as tall as a building; a third eye in the shape of a "
        "stylised eye inside a jagged diamond sits on her forehead (closed it is a thin glowing pink slit); long strands of her hair turn into red-and-black "
        "striped rule tape; her fingernails are long and red like rulers' tips; thin glowing pink cracks run over her skin like seams. Girlified monster, "
        "uncanny but beautiful. Same anime art style as reference image 1: clean line art, full colour, sunset and violet anomaly light. No text, no letters. ")
JOBS = {
    "R25_master": [(MASTER, [REF], LOOK +
        "Draw her rising from BEHIND a building: only her head, shoulders and upper chest are visible above a straight horizontal roof line along the "
        "bottom of the picture (everything below that line is cut off cleanly), both giant hands grip the roof edge in front of her, her hair spilling over "
        "the roof; she looks down at the viewer with contempt, the whistle between her lips. Front view, slightly from below. Transparent background "
        "around her; the roof itself is NOT drawn, just her body ending at that straight line. 16:9.")],
}
P = lambda out, desc: (out, [MASTER, REF], "Reference image 1 is the approved design of this boss. Keep her face, hair, uniform, armband, colours, "
                       "line style and anomaly details exactly the same. " + LOOK + desc + " Transparent background, the part fills most of the picture.")
JOBS["R25_parts"] = [
    P("art/raw/r25/head.png", "Draw ONLY her head, neck, shoulders and upper chest exactly as in reference image 1 (the same angle, front view, slightly "
      "from below), ending at a straight horizontal line across the chest, WITHOUT her hands and without the hands' fingers in front of her; her hair "
      "flows down on both sides. Third eye closed (a thin pink slit). Whistle between her lips. 16:9."),
    P("art/raw/r25/head_eye.png", "Draw ONLY her head, neck, shoulders and upper chest, the same angle and framing as reference image 1, without her "
      "hands, ending at a straight horizontal line across the chest; her forehead third eye is WIDE OPEN, a big glowing pink-violet eye with a slit pupil, "
      "light pouring from it; her two normal eyes narrowed, furious. 16:9."),
    P("art/raw/r25/head_blow.png", "Draw ONLY her head, neck, shoulders and upper chest, same angle and framing as reference image 1, without her hands, "
      "ending at a straight horizontal line across the chest: she blows the whistle with all her strength, cheeks puffed, eyes squeezed shut, a shock "
      "of pink sound rings bursting out of the whistle toward the viewer. Third eye closed. 16:9."),
    P("art/raw/r25/head_hurt.png", "Draw ONLY her head, neck, shoulders and upper chest, same angle and framing as reference image 1, without her hands, "
      "ending at a straight horizontal line across the chest: staggered and hurt, head knocked back and to the side, hair whipping, the whistle "
      "falling from her lips, one eye shut, cracks glowing brighter. 16:9."),
    P("art/raw/r25/hand_grip.png", "Draw ONLY her giant RIGHT hand gripping the edge of a roof (the roof is not drawn: the fingers curl over a straight "
      "horizontal edge at the bottom), seen from the front, long red ruler-tip nails, the uniform blazer cuff at the wrist; nothing else. Square picture."),
    P("art/raw/r25/hand_slam.png", "Draw ONLY her giant RIGHT hand coming down flat to slam the ground, palm facing down and toward the viewer, fingers "
      "spread, seen from in front and slightly below, enormous and foreshortened, the blazer cuff at the wrist, motion lines; nothing else. Square picture."),
    P("art/raw/r25/hand_throw.png", "Draw ONLY her giant RIGHT hand raised, about to hurl a fistful of confiscated smartphones and manga volumes (blank "
      "covers, no text) at the viewer, seen from the front, the blazer cuff at the wrist; nothing else. Square picture."),
    P("art/raw/r25/p2.png", "PHASE 2, transformed: she has climbed onto the roof and is visible down to the waist (cut off by a straight horizontal line "
      "at the waist), much more monstrous: all of her hair has become writhing red-and-black rule-tape tentacles spreading wide behind her like wings, "
      "her forearms have become two huge wooden rulers with red-nailed fingers at their ends, her blazer torn open at the shoulders, the armband on "
      "her left upper arm swollen and glowing with its shield crest pulsing pink (her weak point), the third eye half open, the whistle crushed in her "
      "teeth. Front view, slightly from below, raising her left ruler-arm high to slam. 16:9."),
    P("art/raw/r25/p2_low.png", "PHASE 2, transformed (same as described: rule-tape tentacle hair spreading like wings, ruler forearms, torn blazer, "
      "glowing armband crest on her left upper arm, third eye half open), visible down to the waist (cut off by a straight horizontal line at the waist), "
      "BOTH ruler-arms lowered and crossed in front of her chest so the armband crest is hidden behind her arms, guarding, glaring. Front view, "
      "slightly from below. 16:9."),
    P("art/raw/r25/p3.png", "PHASE 3: an extreme close-up of her face leaning down over the viewer from above, so close that her face fills the whole width "
      "of the picture, cut off by the picture edges: her mouth opened impossibly wide into the bell of a huge brass megaphone, her third eye WIDE "
      "open and glowing (weak point), her normal eyes wild, rule-tape hair hanging down around the edges like a curtain, cracks blazing pink. 16:9."),
]
# one job per part, so they run in parallel
for _st in JOBS.pop("R25_parts"):
    JOBS["R25_p_" + pathlib.Path(_st[0]).stem] = [_st]
