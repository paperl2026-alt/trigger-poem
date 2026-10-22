# Round 98 (user 2026-10-22, the lady of the house, episode 1's last boss):
#   R98_rest: her rest is a scene of its own, not the room and a beam of light ("夫人升天不配专门做个特别的动画和过场么 ... 夫人能翻一个道具，
#     变得稍微像人一点，最后母女团圆，然后幻化为粒子凭空四散么 ... codex能出素材的，关键帧可以出序列动作的"): five painted shots for a
#     storyboard (Game.storyboard): the rot falling off her as she holds the photo, her face as it was, her child running to her, the two of
#     them in each other's arms (the child facing her mother), and the two of them coming apart into light and petals.
#   R98_ghosts: the children's ghosts going round her in her last form ("从无辜天使到妖魔鬼怪的来回幻化，并且不要和护送孩子的资产重复"): three
#     lost little ghosts, each as an innocent angel and as a demon (the same child), nothing like her own child of the escort.
# tools/rounds/r98_import.py brings them in.
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs32 import NOFX

R = "art/raw/r98/"
STUDIO, LADY, MONSTER, CHILD = "art/raw/r56/sc_studio_a.png", "art/raw/r56/portrait1.png", "art/raw/r53/boss_f3_d.png", "art/raw/r69/soul_child_a.png"
SHOT = ("A painted cinematic shot for a game's ending scene, in EXACTLY the soft, rich painting style of reference image 1 (the lady's ruined "
        "painter's studio of this story: its colours, light and brushwork). Widescreen 16:9, full bleed, no frame, no panel borders, no text, "
        "no letters. Wholesome, tender, all-ages. ")
WOMAN = "the woman of the portrait in reference image 2 (her face, her long soft curly light-brown hair, her pale pink lace dress; no hat)"
GIRL = ("her little daughter, the girl of reference image 4 (about six, short soft white hair with a big white bow, an old-fashioned white "
        "lace dress, barefoot, a worn brown teddy bear), pale and glowing softly as a soul")
SHOTS = {
    1: ([STUDIO, LADY, MONSTER], "In the dark ruined studio, the monster of reference image 3 - the lady of the house rotted into melted gelato, honey "
        "and lace - kneels on the floor, hugging an old family photograph in a little frame to her chest with both hands, her head bowed. The "
        "rotten crust on her is cracking like old sugar glaze and flaking away, warm light shining out through the cracks. Medium shot."),
    2: ([STUDIO, LADY, MONSTER], "Close-up of her face as the last pieces of the rotten mask fall away from it like broken sugar: underneath is the "
        "gentle face of " + WOMAN + ", her eyes wet with tears, looking up, lips parted; a few honey-coloured flakes still drifting off her "
        "cheek and hair, soft light on her face."),
    3: ([STUDIO, LADY, MONSTER, CHILD], "She is " + WOMAN + " again, human, kneeling on the studio floor in a pool of soft light, opening her "
        "arms wide, crying and smiling. Running to her from the foreground, seen from behind, is " + GIRL + ", her arms reaching out to her "
        "mother, the teddy bear swinging in one hand. Petals in the air."),
    4: ([STUDIO, LADY, MONSTER, CHILD], WOMAN[0].upper() + WOMAN[1:] + " kneels and holds " + GIRL + " tight in her arms; the little girl's "
        "face rests on her mother's shoulder, turned toward the viewer, eyes closed, smiling; the mother's cheek against her hair, tears of "
        "happiness. The studio around them fades into warm white light and drifting pink petals. Close medium shot."),
    5: ([STUDIO, LADY, MONSTER, CHILD], "The mother and her little daughter, still in each other's arms, are coming apart into countless tiny "
        "motes of golden light and pink rose petals that rise and scatter upward and away; their two shapes are already half gone, just a soft "
        "outline in the light; the dark studio below, a beam of warm light from above. Wide shot, looking up a little."),
}
GHOSTS = ("Reference image 1 is NOT what to draw (it is the lady's own child: these must look nothing like her - no white bob, no teddy "
          "bear, no white lace dress). Draw a game sprite sheet in a soft anime painting style: THREE different little lost children's "
          "ghosts, in a 3 x 2 grid (three columns, two rows), one figure per cell, all at the same scale, each whole and well inside its "
          "cell, floating, legs fading into a wisp. Column 1: a small boy in an old sailor suit with a cap. Column 2: a girl with long dark "
          "braids in a gingham pinafore. Column 3: a chubby toddler in a romper with a pacifier. TOP ROW: each of them as an innocent little "
          "angel - pale, soft white and gold, a small halo, tiny feathered wings, closed eyes, a sweet sleeping smile. BOTTOM ROW: the SAME "
          "child below it turned into a demon - the same clothes and shape twisted and blackened, cracked grey skin, glowing red eyes, a "
          "mouth torn wide with needle teeth, small horns, ragged bat-like wings, claws. Fully transparent background, no floor, no text. ")
JOBS = {f"R98_rest{n}": [(f"{R}rest{n}_{v}.png", refs, SHOT + "Reference image 2 is the lady as she was in life; reference image 3 is "
                          "the monster she became" + (", reference image 4 her little daughter's soul" if len(refs) > 3 else "") + ". " + d +
                          f" Try {v}.", "OPAQUE") for v in "ab"] for n, (refs, d) in SHOTS.items()}
JOBS["R98_ghosts"] = [(f"{R}ghosts_{v}.png", [CHILD, "art/raw/r53/m_ghoul_a.png"], GHOSTS + NOFX + f"Landscape 3:2. Try {v}.") for v in "ab"]
