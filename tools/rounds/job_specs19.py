# Round 19: chapter-select mockup A (approved layout, art/raw/r18/select_a.png) with NEW girls on the two character cards.
# User rule: character art is never reused, so the poses already used anywhere are listed in the prompt as forbidden.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]   # this folder and tools/
from check_art_reuse import used_poses

USED = "; ".join(p for _, _, p in used_poses())
NOREDESIGN = "This is NOT a redesign of the screen. "


def prompt(cat, pink):
    return ("Reference image 1 is the approved chapter-select screen of this game. " + NOREDESIGN +
            "Output the SAME screen: same layout, same panels, same texts, buttons, icons, colors and style, pixel for pixel, EXCEPT the two girls inside the "
            "two character cards on the right, which are drawn NEW, waist-up, filling their card like now and overlapping its top edge a little. "
            "Character designs: reference image 2 is the white-haired cat girl (1P 神乐), reference image 3 the black-haired twin-tail girl (2P 椿); keep their faces, "
            "hair, eyes, outfits and colors exactly as in those sheets, and the cat girl's red paw seal exactly as drawn on her sheet. "
            f"New poses: 1P 神乐: {cat}. 2P 椿: {pink}. "
            f"These poses are ALREADY USED elsewhere in the game and must NOT be repeated or resembled: {USED}. "
            "16:9, 1672x941.")


JOBS = {
    "R19_select_a": [
        ("art/raw/r19/select_a_v1.png", ["art/raw/r18/select_a.png", "art/ref/cat_sheet.png", "art/ref/pink_sheet.png"],
         prompt("facing the viewer, the white fur ghost paw raised beside her cheek with the red claws spread wide like a cat's swipe, the red seal on its back faintly glowing, "
                "her other hand on her hip, a small confident smirk, glasses glinting",
                "the pink-and-black gatling gun propped on her shoulder with both arms hooked over it, leaning sideways, one eye closed in a wink and a big open grin, "
                "twin tails swinging"), "OPAQUE"),
        ("art/raw/r19/select_a_v2.png", ["art/raw/r18/select_a.png", "art/ref/cat_sheet.png", "art/ref/pink_sheet.png"],
         prompt("three-quarter view looking back over her shoulder at the viewer, cat ears perked, the white fur paw held low and curled loosely in front of her chest, "
                "a sleepy half-lidded look with a tiny yawn, the bell on her ribbon swinging",
                "hugging a big pink bunny plushie under one arm and holding up a strawberry milk carton with a straw toward the viewer, cheeks puffed, pouting playfully"), "OPAQUE"),
    ],
}
