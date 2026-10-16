# Round 6: heroine redesign candidates (the user picks one per role before full pose packs are made).
# Target look: premium gacha-game splash quality (NIKKE-like appeal): fair skin, slim with a feminine figure, long legs, pretty faces.
HERO_STYLE = ("STYLE: top-tier anime gacha game character art, splash-illustration quality: clean thin lineart, soft cel shading with smooth gradients, "
              "glossy hair highlights, detailed sparkling eyes with long lashes, pretty refined face, polished and attractive, crisp edges that cut out cleanly. "
              "Avoid: thick crude outlines, flat cheap colors, muscular build, tan skin, band-aids, chibi proportions, text, letters, logos, watermarks.")
BODY = ("She is an 18-year-old third-year high-school student, fair skin, slim waist with a feminine adult figure, long slender legs, about 7.5 heads tall. "
        "Camera at eye level.")


def cand(out, desc):
    return (f"art/raw/{out}.png", [], "Character design candidate on a fully transparent background: two full-body views of the same girl side by side at identical scale with a wide gap. "
            f"Left: front view, confident standing pose. Right: back view.\n{BODY}\n{desc}\nNo background, no floor shadow, no effects.\n{HERO_STYLE}")


T = "a spirit-purifying gunner girl (role: fast-firing rifle). Weapon: a sleek white-and-vermilion assault rifle with a drum magazine and small paper talismans tied to the barrel."
K = ("a psychic girl who summons an oni spirit hand (role: fires mantra syllables from the palm). Her own hands are normal and pretty; her left hand wears a black fingerless glove "
     "wrapped with a red paper talisman. In the front view she raises that hand and a big translucent glowing spirit hand floats over it: sleek elegant oni hand made of "
     "pink-violet ghost flame with small cute horns at the wrist, golden sutra rings orbiting it, cool and cute rather than gross.")
JOBS = {
    "C6_a": [
        cand("cand_t1", T + " Jet-black very long high ponytail tied with a red-and-white shrine cord, sharp crimson eyes, confident smile. White sailor uniform with a red scarf, navy pleated skirt, black thigh-high socks, black loafers."),
        cand("cand_k1", K + " Very long straight silver hair with a black hairband, half-lidded violet eyes, faint smile. Oversized cream cardigan over a white shirt with a red ribbon, plaid pleated skirt, black tights, brown loafers."),
    ],
    "C6_b": [
        cand("cand_t2", T + " Long chestnut hair in a high side ponytail with a red ribbon, warm amber eyes, cheerful grin. Open beige blazer, white shirt, red ribbon tie, red plaid pleated skirt, white thigh-high socks, white sneakers."),
        cand("cand_k2", K + " Long glossy black hime-cut hair, crimson eyes, cool expression. Black sailor uniform with a white scarf, black pleated skirt, black thigh-high socks, a long white glove on the right hand."),
    ],
    "C6_c": [
        cand("cand_t3", T + " Long dark-red twin tails with black ribbons, golden eyes, playful smirk. Black sailor uniform with a red scarf, short black pleated skirt, black tights, red-trimmed boots."),
        cand("cand_k3", K + " Long lavender-white hair in a loose side braid, golden eyes, gentle sleepy smile. Navy blazer, white shirt, gold ribbon, grey plaid pleated skirt, white thigh-high socks, brown loafers."),
    ],
}
