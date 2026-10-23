# Round 112 (user 2026-10-23: no self-limits - no role classes, no one-value-per-parameter, no fixed "three", no filtering for sense; the
# options must come from searching real material, not from my head; every enemy different): morphological analysis on the harvested
# pool tools/rounds/monster_pool.txt - each parameter gets a random number of lines drawn from the pool lines that speak to it, plus a
# random number of free lines; the five monsters of a set never share a line; the colour count is random too. Left out only what the user
# ruled out (DESIGN: no eyes, gems, purple, woman's body or face; no drawn effects). Behaviour (how it attacks, takes hits, dies) is drawn
# from the same pool's mechanisms and kept for the battle work.
import pathlib, random, re

MODE = "brief"
R = "art/raw/r112/"
REFS = ["art/ref/monster_ref.webp", "public/jiggle/pink_fire.png"]
SEED = 112
PIECES = ["pawn", "knight", "bishop", "rook", "queen"]

POOL = []  # (text without source, section)
sec = ""
for ln in pathlib.Path(__file__).with_name("monster_pool.txt").read_text(encoding="utf-8").splitlines():
    if ln.startswith("## "):
        sec = ln[3:]
    elif ln.strip() and not ln.startswith("#"):
        POOL.append((re.sub(r"\s*\[[^\]]*\]\s*$", "", ln).strip(), sec))

# the user's own rules (eyes, gems, purple, a woman's body or face, a face stuck on) and drawn effects (glow, fire, smoke, gas)
BANNED = re.compile(r"\b(eyes?|eyeballs?|eyed|gems?|jewel\w*|purple|woman'?s?|women|maiden|girl|faces? (on|in)|with a face|human faces|man's (face|head)|disfigured face|a face slit|glow\w*|luminescent|flam\w*|fire\w*|burning|smoke|gas|light)\b|目|眼|火", re.I)
LOOK = {k: re.compile(v, re.I) for k, v in {
    "Body": r"\b(body|torso|segment\w*|shell|skeleton|carapace|sphere|disc|ring|chain|tube|octahedron|bag|囊)\b|身|形",
    "Heads and neck": r"\b(heads?|skull|neck|crest|helmet)\b|首|头",
    "Limbs": r"\b(legs?|arms?|hands?|feet|foot|toe|fingers?|claws?|limbs?|paddles?|tentacles?)\b|足|臂|手",
    "Tail": r"\btails?\b|尾",
    "Mouth": r"\b(mouths?|jaws?|lips|bite|bites|mandibles|proboscis|throat|sucker|beak|swallow\w*)\b|口",
    "Teeth": r"\b(teeth|tooth|fangs?|tusks?|rasp|molars|incisors|canines)\b|牙",
    "Tongue": r"\btongues?\b|舌",
    "Surface": r"\b(skin|scales?|plates?|armou?r|hair|fur|feathers?|bristles|spines?|leathery|corrugated|scars?|furry|hairy|jelly|see-through)\b|毛|羽|鳞",
    "Made of (a thing)": r"\b(as its (whole )?body|is itself the body|animated|paper|cloth|cotton|stone|metal|rust|wires|wood\w*|straw|pillar|lute|koto|shamisen|gong|mirror|clock|kettle|teakettle|grater|jar|lantern|umbrella|screen|saddle|quiver|beads|masks?|netting|scrolls?|inkstone|futon|kimono|robe|coat|sandal|stirrup|cart|wheel|balloon|toy|pin|bells)\b|锅",
    "Fluids": r"\b(blood|slime|ooze\w*|drip\w*|ink|acid|fluid|goo|spray\w*|squirt\w*|drool\w*|oil|sap|nectar|corrosive|mucus)\b",
    "Moves by": r"\b(crawl\w*|walk\w*|hop\w*|swim\w*|fly|flies|drags?|dragging|roll\w*|creep\w*|climb\w*|stretch\w*|rotat\w*|undulat\w*|backstroke|prancing|wiggles)\b|飞|行",
    "What is still human": r"\b(human\w*|humanoid)\b|人手|似人|如人",
    "Feminine in its own form": r"\b(eggs?|larva\w*|young|infant|womb|placenta|umbilical|brood\w*|newborns?|mother|nursing|female|her|she|male|fuses?|lace|skirt|waist|veiled?|lap|hair|budding|copies|children|child)\b",
    "Caught in the middle of": r"\b(regrow\w*|regenerat\w*|splits?|unfurl\w*|unravel\w*|melts?|moults?|turns?|becomes?|swell\w*|burst\w*|grow\w*|hatch\w*|erupt\w*|transform\w*|chang\w*|sprout\w*|merg\w*|fus\w*|twist\w*)\b",
    "Weapon": r"\b(blades?|claws?|spikes?|spines?|drill|scythe|sickle|spear|whips?|hooks?|barb\w*|sword|tusks?|needle|stinger|axe|shield|pin)\b|斧|盾",
    "Weak point (soft, exposed)": r"\b(soft|core|decoy|heart|expos\w*|underside|unarmou?red|stops it|see-through)\b",
}.items()}
GAME = {k: re.compile(v, re.I) for k, v in {
    "attacks by": r"\b(spray\w*|squirt\w*|spit\w*|shoot\w*|shoots|catapult\w*|throws?|swallow\w*|wraps?|grip\w*|latch\w*|clamp\w*|snap\w*|suck\w*|drops?|bites?|stinks?|drill\w*|engulf\w*|crawls on|kick\w*|cut|heavy|absorb\w*|imitat\w*)\b",
    "when hit": r"\b(regrow\w*|regenerat\w*|splits?|burst\w*|recoil\w*|spasm|pulls? (back|them back)|decoy|plays dead|throws out|breaks off|sprays when|keeps|copies|swell\w*|budding|divides)\b",
    "dies by": r"\b(burst\w*|ruptur\w*|explo\w*|melts?|carbon|turns into|heavy stone|vanish\w*|collaps\w*|dies|merg\w*|unravel\w*|swarm|copies)\b",
}.items()}
COLOURS = ["white", "bone", "ivory", "blood red", "lipstick red", "scarlet", "candy pink", "flesh pink", "salmon", "black", "charcoal", "dark green",
           "moss green", "lime green", "olive", "orange", "rust", "amber", "yellow", "mustard", "sky blue", "teal", "turquoise", "navy", "brown",
           "chocolate", "tan", "grey", "silver", "gold", "copper", "cream"]
VOICES = ["laughing", "crying", "humming a tune", "breathing", "grinding teeth", "clicking", "wet sounds", "fragments of words", "singing",
          "screaming", "whispering", "gasping", "giggling", "sobbing", "chewing", "hissing"]

LINES = [t for t, s in POOL if not BANNED.search(t)]
GAME_LINES = [t for t, s in POOL]  # behaviour is not drawn into the picture
FEMALE = {t for t, s in POOL if s == "female monsters"}


def fits(par, t):
    return bool(LOOK[par].search(t)) or (par == "Feminine in its own form" and t in FEMALE)


def draw_set(rng):
    used, out = set(), {}
    for k in PIECES:
        look = {}
        for par in LOOK:
            cand = [t for t in LINES if fits(par, t) and t not in used]
            pick = rng.sample(cand, min(len(cand), rng.randint(1, 4)))
            used.update(pick)
            look[par] = pick
        free = [t for t in LINES if t not in used]
        look["Also"] = rng.sample(free, rng.randint(0, 5))
        used.update(look["Also"])
        look["Colours"] = [", ".join(rng.sample(COLOURS, rng.randint(2, 7)))]
        game = {}
        for par, rx in GAME.items():
            cand = [t for t in GAME_LINES if rx.search(t) and t not in used]
            pick = rng.sample(cand, min(len(cand), rng.randint(1, 3)))
            used.update(pick)
            game[par] = pick
        game["voice"] = rng.sample(VOICES, rng.randint(1, 3))
        out[k] = (look, game)
    return out


rng = random.Random(SEED)
DRAWS = {f"{k}_{v}": d for v in "ab" for k, d in draw_set(rng).items()}

HOW = """A monster sprite for a game: one standing frame, the whole monster, transparent background, nothing else in the picture (no ground, no shadow, no text).
Style: as reference image 1 and reference image 2 - the same anime line art and clean colouring - drawn simple: big flat areas of colour, large clear shapes, a clean outline readable from far away, no texture or noise. No effects (no glow, smoke, sparks, particles, light). No eyes, no gems, no purple. Not a woman's body. If it has a head, the whole monster is about four times the head's height. Nothing besides what is described.
Every line below is part of this one monster's body.

"""


def brief(k, look):
    out = [f"A monster made from a white marble chess {k.split('_')[0]} statue."]
    out += [f"{p}: " + "; ".join(v) + "." for p, v in look.items() if v]
    return HOW + "\n".join(out)


JOBS = {f"R112_{k}": [(f"{R}{k}_{v}.png", REFS, brief(k, DRAWS[f'{k}_{v}'][0])) for v in "ab"] for k in PIECES}

if __name__ == "__main__":
    print(len(POOL), "pool lines,", len(LINES), "drawable")
    for name, (look, game) in DRAWS.items():
        print(f"== {name}")
        for p, v in {**look, **game}.items():
            print(f"  {p}: " + " | ".join(v))
