# Round 111 (user 2026-10-23: a monster is dozens of parameters, each a real choice - use the formula others use): morphological analysis
# (Zwicky box) - every parameter below with its options, drawn at random for each monster (the five never share an option where there are
# enough), so no design is the most direct association of its name; plus focal objects (a non-living material's properties forced onto it).
# Nothing is filtered for being reasonable. The brief sent says only what was drawn; the game-only parameters are kept for the battle work.
import random

MODE = "brief"
R = "art/raw/r111/"
REFS = ["art/ref/monster_ref.webp", "public/jiggle/pink_fire.png"]
SEED = 111
PIECES = {"pawn": "pawn", "knight": "knight", "bishop": "bishop", "rook": "rook", "queen": "queen"}

# drawn and drawn into the picture
LOOK = {
    "Outline": ["long and low, crawling", "tall and thin", "wide and squat", "hanging down from above", "leaning far forward at a slant",
                "a loose crowd of small parts moving as one", "top-heavy, narrow at the bottom", "curled into a ring"],
    "Bodies": ["one body", "one big body carrying many small ones", "several bodies joined by one strand of flesh",
               "pieces floating apart with gaps between them, moving together", "two bodies grown back to back"],
    "Body plan": ["segments in a chain", "radial: everything arranged around one opening", "a hard shell with the soft body inside showing",
                  "one long tube", "thin sheets folded over on themselves", "an outside skeleton with nothing filling it", "a bag swollen with fluid",
                  "a stalk with everything hanging off its top", "turned inside out: what should be inside is outside"],
    "Symmetry": ["left and right completely different", "symmetrical except one side is missing", "symmetrical",
                 "arranged around a centre like a flower", "twisted, as if wrung out"],
    "Caught in the middle of": ["melting", "unfolding", "splitting open", "growing more of itself", "half out of an old skin it is shedding",
                                "turning inside out", "collapsing in on itself"],
    "The chess piece": ["its whole outline is still the chess piece's", "the chess piece is its shell; it lives inside", "the chess piece is its head",
                        "the piece has broken and it came out of it, shards still on it", "it holds the piece half-swallowed in its mouth",
                        "only the piece's base is left; it grows out of the base", "it is built of many copies of the piece"],
    "Still human on it": ["one hand", "fingernails", "a heel and ankle", "a hairline with hair", "human teeth", "a navel", "knees", "nothing at all"],
    "Feminine in its own form": ["its outline sweeps out at the bottom like a long dress trailing on the ground",
                                 "long hair-like strands of its own body (filaments, roots, gills) hanging to the ground",
                                 "a waist pinched as thin as a wasp's", "it carries its young in pits in the skin of its back",
                                 "it lays: a trail of egg sacs behind it", "its openings are folded lips like a vulva",
                                 "its own flesh is coloured like make-up: lipstick red, blush pink",
                                 "it stands like a dancer: on its tips, turning, swaying", "a swelling like pregnancy with something moving inside",
                                 "it leaks milky fluid"],
    "Head": ["no head", "a head that is only a hole", "a smooth blank head", "its head hangs upside down", "its head is inside the body, seen through it",
             "two heads", "its head is a lump of hair", "many small heads"],
    "Mouth is": ["at its top", "in its belly", "underneath, facing the ground", "a long slit down its back", "its whole body: it is one mouth",
                 "in the palm of a hand", "several mouths in different places", "at the end of a long stalk"],
    "Mouth opens": ["up and down", "sideways, like an insect's mandibles", "in four petals", "like an iris, a ring closing", "by turning itself inside out",
                    "by shooting forward on a hinged arm, like a dragonfly larva's", "as a sucker disc", "by unzipping along a seam"],
    "Teeth": ["a full mouth of sharp teeth", "rotten, broken, gappy teeth", "rows of flat human-like teeth, like a sheepshead fish's", "baby teeth",
              "backward-pointing spines lining the throat all the way down", "a spiral whorl of teeth like a saw blade",
              "tusks growing up through its own face and curling back", "a rasping tongue covered in tiny teeth", "no teeth: a hard beak",
              "teeth on its tongue", "rings of hooked teeth in a round disc"],
    "Tongue": ["none", "very long", "a second head", "a hook", "several", "a parasite living where the tongue should be"],
    "Partly made of": ["glazed porcelain", "candle wax", "rubber", "stitched cloth", "glossy lacquer", "cast iron", "glass", "paper", "plaster",
                       "toy plastic", "knitted wool", "sugar icing", "cork"],
    "Living surface": ["hard glossy beetle shell", "wet soft membrane", "scales", "horn", "fur", "feathers", "warts", "loose wrinkled skin",
                       "see-through, the insides visible", "overlapping plates like a woodlouse's"],
    "Blood": ["bright red", "black", "bright pink", "acid green", "milky white", "oil", "paint", "melted wax", "ink", "honey", "orange"],
    "Its blood": ["seeps out all the time", "squirts from pores", "drips from every edge", "has dried in crusts all over"],
    "Moves by": ["crawling", "rolling", "hopping", "floating", "swimming through the air", "swinging, hanging from above", "looping like an inchworm",
                 "walking sideways", "walking on its very tips", "dragging itself along by its arms", "walking on its hands, upside down",
                 "cartwheeling", "sliding on one sucker foot", "rippling many small legs", "not moving: it grows toward you"],
    "Weapon": ["it is itself a blade: its whole body is edged", "it holds a fire poker", "it holds a kitchen knife", "it holds a hatchet",
               "a limb ends in a long needle", "its jaw is a hammer", "it spits", "it throws pieces of itself", "it fires its teeth", "no weapon"],
    "Weak point (a soft exposed place)": ["inside its mouth", "on its back", "a place that only opens when it attacks", "its human part",
                                          "a core showing through it", "a joint", "where it is splitting open", "the young it carries"],
}
COLOURS = ["white", "bone", "blood red", "lipstick red", "candy pink", "black", "dark green", "lime green", "orange", "yellow", "sky blue", "teal",
           "brown", "grey", "gold"]
# drawn for the battle work, not drawn into the picture
GAME = {
    "attack": ["leaps at the screen", "spits a spread of shots", "throws parts of itself", "calls up small ones", "grabs and drags a heroine away",
               "covers the screen", "bursts", "burrows and comes up somewhere else", "splits into several"],
    "warning": ["its mouth opens slowly", "it swells up", "it changes colour", "a sound", "it pulls in tight", "it goes completely still"],
    "hit": ["chips break off", "it leaks", "it pulls back in", "it gets faster", "it drops a part", "it flips over"],
    "death": ["shatters", "bursts", "melts", "deflates", "turns back to stone", "scatters into a swarm"],
    "voice": ["laughing", "crying", "humming a tune", "breathing", "grinding teeth", "clicking", "wet sounds", "fragments of words"],
}


def draw(table, keys, rng):
    # each parameter: the five monsters get different options when there are enough of them
    out = {k: {} for k in keys}
    for p, opts in table.items():
        picks = rng.sample(opts, len(keys)) if len(opts) >= len(keys) else [rng.choice(opts) for _ in keys]
        for k, o in zip(keys, picks):
            out[k][p] = o
    return out


rng = random.Random(SEED)
DRAWS = {}
for v in "ab":
    look, game = draw(LOOK, list(PIECES), rng), draw(GAME, list(PIECES), rng)
    for k in PIECES:
        look[k]["Colours"] = ", ".join(rng.sample(COLOURS, 3))
        DRAWS[f"{k}_{v}"] = (look[k], game[k])

HOW = """A monster sprite for a game: one standing frame, the whole monster, transparent background, nothing else in the picture (no ground, no shadow, no text).
Style: as reference image 1 and reference image 2 - the same anime line art and clean colouring - drawn simple: big flat areas of colour, a few large clear shapes, a clean outline readable from far away, few small details, no texture or noise. No effects (no glow, smoke, sparks, particles, light). No eyes, no gems, no purple. Not a woman's body. If it has a head, the whole monster is about four times the head's height. Nothing besides what is described.

"""


def brief(k, look):
    lines = [f"A monster made from a white marble chess {PIECES[k.split('_')[0]]} statue."] + [f"{p}: {o}." for p, o in look.items()]
    return HOW + "\n".join(lines)


JOBS = {f"R111_{k}": [(f"{R}{k}_{v}.png", REFS, brief(k, DRAWS[f'{k}_{v}'][0])) for v in "ab"] for k in PIECES}

if __name__ == "__main__":
    for name, (look, game) in DRAWS.items():
        print(f"== {name}")
        for p, o in {**look, **game}.items():
            print(f"  {p}: {o}")
