# Round 26: the prologue comics (docs/DESIGN.md "第一关"), NO text at all (no speech bubbles, no captions, no sound-effect letters).
# Pages are laid out by content comics.json; each panel is its own picture. Characters must be on model (design sheets); the cat girl's
# demon paw seal is checked / fixed afterwards (tools/seal_fix.py).
CAT, PINK, BOSS = "art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/raw/r25/master.png"
STYLE = ("A single panel of a full-colour Japanese manga, anime art style, bold clean ink lines, screentone shading, dramatic composition, warm sunset "
         "palette. Absolutely NO text: no speech bubbles, no captions, no sound-effect lettering, no letters or numbers anywhere, any sign or screen is blank "
         "or shows only pictures. ")
CATD = ("the white-haired cat girl from the cat design sheet (cat ears, red glasses, a bell, a white fur demon-paw right arm with red claws and the red seal "
        "on its back, a white cat tail, sailor top with long kimono-like sleeves, navy pleated skirt with a red sash)")
PINKD = ("the black-haired twin-tail girl from the pink design sheet (long wavy black hair with pink and mint ribbons, a bunny hair clip, heart earrings, a "
         "pink frilly school blouse with a mint sailor collar and a pink pleated skirt, fully clothed)")


def panel(name, refs, aspect, desc):
    return (f"art/raw/r26/{name}.png", refs, STYLE + f"Picture shape: {aspect}. " + desc, "OPAQUE")


PANELS = [
    # ---- ep0_intro, page 1
    ("i1", [], "wide 16:9", "Establishing shot: a Japanese high school building at the end of the school day, the big clock on its front, golden sunset, crows "
     "flying, long shadows over the sports ground. Calm and nostalgic."),
    ("i2", [CAT], "square", f"Inside a classroom by the window: {CATD} sits at her desk, secretly reading a notebook under the desk; the notebook shows a cute "
     "drawing of a limited-edition chibi mascot figure (an original cute round creature, not any real character) circled many times in red, little "
     "sparkles in her eyes, her tail swishing with excitement."),
    ("i3", [PINK], "square", f"In another classroom: {PINKD} hides her smartphone under her desk; the phone screen shows a picture of a gorgeous limited "
     "strawberry parfait (picture only); she is drooling with heart-shaped eyes, cheeks flushed."),
    ("i4", [CAT, PINK], "wide 21:9", "A split panel, two close-ups side by side divided by a diagonal line: on the left the cat girl's white fur demon paw "
     "clenching into a determined fist (the red seal on its back); on the right the black-haired girl's hand squeezing her phone; both fiery with resolve."),
    # ---- ep0_intro, page 2
    ("i5", [CAT, PINK], "wide 16:9", f"The school bell ringing hard; split in two diagonal halves: {CATD} and {PINKD}, in two different classrooms, both "
     "leaping up from their chairs at the same instant, bags in hand, ready to sprint out. Speed lines."),
    ("i6", [], "tall 9:16", "From the sports ground looking up: the sky above the school tears open and a gigantic pillar of violet-pink energy with a "
     "stylised eye inside a jagged diamond at its heart strikes the school roof; shock rings, debris, windows bursting with light."),
    ("i7", [], "wide 16:9", "Inside a classroom bathed in violet light: the silhouettes of students and a teacher twisting and warping into strange shapes, "
     "one merging with a desk, one dissolving into flying test papers, one teacher stretching into a blackboard; eerie, horror-tinged but stylish."),
    ("i8", [CAT, PINK], "square", f"In a violet-lit corridor full of eye sigils, {CATD} and {PINKD} back to back for the first time, strangers, startled "
     "and then grinning: the cat girl's demon paw blazes with golden mantra light, the black-haired girl swings out a pink-and-black rifle. Heroic."),
    # ---- ep0_mid (classroom -> corridor)
    ("m1", [CAT, PINK], "wide 16:9", "The two girls kicking open a classroom's sliding back door together, the door flying off, dust and papers bursting out."),
    ("m2", [], "tall 9:16", "A school corridor stretching impossibly long into the distance, walls covered with eye sigils, framed class photos whose "
     "faces all turn to stare, shoe lockers breathing; the far end glowing pink."),
    ("m3", [CAT, PINK], "wide 21:9", "Close-up of the two girls' eyes side by side glancing at each other, a quick nod: the cat girl's red eyes behind red "
     "glasses on the left, the black-haired girl's pink eyes on the right."),
    # ---- ep0_boss (before the schoolyard)
    ("b1", [CAT, PINK], "wide 16:9", "The two girls bursting out through the school's glass entrance doors onto the sports ground, glass shards flying, "
     "the violet sky swirling above."),
    ("b2", [BOSS], "tall 9:16", "Low angle from the sports ground: enormous fingers with long red nails curl over the edge of the school building's roof "
     "from behind, cracking it, the clock on the building trembling."),
    ("b3", [BOSS], "wide 16:9", "The colossal discipline committee girl from reference image 1 rises from behind the school building, only her head, "
     "shoulders and hands visible above the roof, looking down with contempt, her whistle between her lips, red armband, rule-tape hair; the two tiny "
     "heroines seen from behind in the foreground."),
    ("b4", [BOSS], "wide 21:9", "Extreme close-up: the third eye on the giant girl's forehead (from reference image 1) snapping open, glowing violet-pink, "
     "a slit pupil."),
    # ---- ep0_end
    ("e1", [BOSS], "wide 16:9", "The colossal discipline committee girl dissolving into countless glowing pink petals and paper scraps over the school, "
     "her expression calm and almost relieved; the violet sky clearing back into sunset."),
    ("e2", [], "wide 16:9", "The sports ground after the battle: ordinary students and a teacher lying asleep on the field, back to normal, peaceful, sunset."),
    ("e3", [CAT], "square", f"{CATD} on her knees in front of an empty shop shelf where the limited figure should have been, a blank paper sign hanging, "
     "comically devastated, white soul leaving her mouth."),
    ("e4", [PINK], "square", f"{PINKD} on her knees in front of an empty cafe display tray, crying a comical waterfall of tears."),
    ("e5", [CAT, PINK], "wide 16:9", "Sunset, the two girls sitting together on a riverside bench sharing one cheap ice pop snapped in two, laughing; "
     "a tiny violet eye hidden in the clouds that nobody notices."),
]
JOBS = {f"R26_{n}": [panel(n, refs, asp, d)] for n, refs, asp, d in PANELS}
# retries after the image service refused: same panels, the gunner described in her plain school uniform, no design sheet (its
# sheer outfit trips the filter), cute and fully clothed
RETRY = ["i3", "m1", "b1", "e4"]
for _n, _refs, _asp, _d in PANELS:
    if _n in RETRY:
        JOBS[f"R26r_{_n}"] = [panel(_n, [r for r in _refs if r != PINK], _asp, _d + " Everyone is fully clothed in school uniform; cute, wholesome, comedic.")]
# second retry: the comedy wording (drooling, flushed, kicking in skirts) was what tripped the filter
JOBS["R26s_i3"] = [panel("i3", [], "square", "In another classroom: a cheerful black-haired twin-tail schoolgirl with pink and mint ribbons and a bunny hair clip, in a pink "
                  "school blouse with a mint sailor collar, sits at her desk peeking at her smartphone hidden under the desk; the phone screen shows a picture of a "
                  "gorgeous strawberry parfait (picture only); her eyes sparkle with excitement, chibi comedy style, wholesome.")]
JOBS["R26s_m1"] = [panel("m1", [CAT], "wide 16:9", "Two schoolgirls shoving open a classroom's sliding back door together with their shoulders, the door "
                  "bursting off its rail, dust and papers flying out: the white-haired cat girl with cat ears, red glasses and a white fur demon-paw arm, and a "
                  "black-haired twin-tail girl in a pink school blouse holding a pink-and-black rifle. Dynamic, heroic, wholesome.")]
JOBS["R26s_b1"] = [panel("b1", [CAT], "wide 16:9", "Exactly TWO schoolgirls (no one else) bursting out through a school's glass entrance doors onto the sports ground, "
                  "glass shards flying, the violet sky swirling above, dynamic action seen from the front: on the left the white-haired cat girl from reference image 1 "
                  "(cat ears, red glasses, white fur demon-paw arm with red claws, white cat tail); on the right a DIFFERENT girl with long wavy BLACK twin tails, pink and "
                  "mint ribbons, a bunny hair clip, a pink school blouse with a mint sailor collar, holding a pink-and-black rifle. Wholesome, heroic.")]
