# Round 47 (docs/PLAN.md 第八批): the prologue's four comic pages redrawn (user: no nonsense camera — the reader never sees a phone screen and
# the girl's face from the front at once; either a thought bubble or an over-the-shoulder view; plain rectangular panel grids, no panel inside
# a panel, so each panel can be animated by itself). Very long, explicit panel-by-panel prompts (user: GPT needs every detail spelled out).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs41 import CATD, PINKD

CAT, PINK, GIRL = "art/ref/cat_sheet.png", "art/ref/pink_sheet.png", "art/raw/r25/master.png"
S1, S5 = "art/raw/r43/boss_s1_b.png", "art/raw/r43/boss_s5_c.png"
STYLE = ("Draw ONE whole page of a COLOUR MANGA, landscape 16:9 (1536 x 864). Simple, clean manga drawing style that matches the character "
         "sheets: clean black ink lines, flat colours with SCREENTONE dots and hatching, a light printed-paper texture, like a printed manga page, "
         "NOT a rendered CG illustration. "
         "PANEL LAYOUT RULES (very important): every panel is a perfect axis-aligned RECTANGLE with a thick straight black border; panels sit on a "
         "regular grid separated by straight white gutters of the same width everywhere; NO slanted panel borders, NO diagonal cuts, NO panel inside "
         "another panel, NO inset panels, NO overlapping panels, nothing (no character, no lettering) crosses a panel border or a gutter; each panel "
         "shows exactly ONE moment from ONE camera. "
         "CAMERA RULES (very important): never show a phone screen or a book page AND the face of the person looking at it from the front in the "
         "same panel. If the reader sees what is on a screen or a page, the camera is BEHIND the character, looking over her shoulder, and her face "
         "is NOT visible. If the reader sees her face, what she is thinking of is shown in a cloud-shaped THOUGHT BUBBLE above her head and the "
         "screen / page faces away from the reader. "
         "Hand-lettered manga sound effects and short words are drawn INTO the art (only the words given here; no speech balloons with dialogue). "
         "Only the characters named here appear: no other people, no men, no boys, no teachers, no other students. The girls are fully clothed, "
         "wholesome and cute. ")
REFS2 = "Reference images: 1 = the white-haired cat girl's design, 2 = the black-haired twin-tail girl's design; keep their looks exactly. "
REFS5 = ("Reference images: 1 = the white-haired cat girl's design, 2 = the black-haired twin-tail girl's design, 3 = the discipline-committee "
         "girl (long straight black hair, dark blazer uniform; ignore her armband and whistle, they must not appear), 4 = the monster she turns "
         "into (stage 1), 5 = its final core; keep all their looks exactly. ")
PAGES = {
    "intro": (REFS2, [CAT, PINK],
        "Layout: three rows. Row 1: two equal panels side by side. Row 2: one wide panel across the page (shorter). Row 3: two equal panels side "
        "by side. Reading order: row 1 left, row 1 right, row 2, row 3 left, row 3 right. "
        "PANEL 1 (row 1 left): inside an after-school classroom at sunset, " + CATD + " sits at her desk by the window, seen from the front at a "
        "slight angle, upper body and desk visible. She holds her small pink diary open in front of her with both hands, the diary's COVER faces "
        "the reader (the pages face her, the reader cannot see the pages). Her eyes sparkle, mouth open in an excited smile. Above her head, a "
        "large cloud-shaped THOUGHT BUBBLE (puffy outline, with three small circles trailing down to her head) contains a cute drawing of a "
        "golden melon bread wearing a tiny crown, with sparkles, and the handwritten words '今日限定!!'. "
        "PANEL 2 (row 1 right): an OVER-THE-SHOULDER shot from directly behind " + PINKD + ": her back, the back of her head, one twin tail with "
        "its pink and mint ribbon and her right shoulder fill the left third of the panel; her FACE IS NOT VISIBLE. Past her shoulder we see her "
        "right hand holding a smartphone low under the desk, the SCREEN facing the reader (because we look from behind her), showing an online "
        "anime-goods shop: a chubby pink bunny plush mascot, a red 'SALE' banner and the word '限定'. A tiny heart floats up from her head. "
        "PANEL 3 (row 2, wide): a close-up of the round white classroom wall clock showing exactly five o'clock (minute hand straight up, hour "
        "hand on 5), a square school loudspeaker beside it, motion lines around the clock, and big hand-lettered 'DING DONG♪' across the panel. "
        "PANEL 4 (row 3 left): a wide view of the classroom: the two girls jump up from their seats at the same moment, the cat girl by the "
        "window on the left, the twin-tail girl by the door on the right, far apart, both grabbing their school bags, not looking at each other; "
        "speed lines and the sound effect 'ダッ' next to each girl. "
        "PANEL 5 (row 3 right): outside, the school building seen from the schoolyard at sunset; the sky above it tears open and a black-violet "
        "FORMLESS THING, an oily mass of tentacles with many glowing eyes, crashes down onto the school roof like a meteor; violet shock rings, "
        "flying debris, and the huge lettering 'BOOOM!!'."),
    "mid": (REFS2, [CAT, PINK],
        "Layout: a 2 x 2 grid of four equal rectangular panels. Reading order: top left, top right, bottom left, bottom right. "
        "PANEL 1: inside the classroom, now tinted violet with glowing pink cracks: " + CATD + " swings her giant white ghost paw and smashes the "
        "classroom's wooden sliding door off its rails; splinters fly toward the reader; the sound effect 'BAAAN!!'. "
        "PANEL 2: " + PINKD + " stands in the broken doorway, seen from the front, reloading her pink gun with a confident wink, a small heart "
        "pops beside her; the sound effect 'カチャ♡'. "
        "PANEL 3: the school corridor seen straight down its length, warped like a fish-eye lens, violet eye sigils smeared on the walls, test "
        "papers floating in the air, no people; the lettering '???'. "
        "PANEL 4: the two girls running side by side down the corridor toward the reader, determined faces, speed lines, the lettering 'GO GO!!'."),
    "boss": (REFS5, [CAT, PINK, GIRL, S1, S5],
        "Layout: a 2 x 2 grid of four equal rectangular panels. Reading order: top left, top right, bottom left, bottom right. "
        "PANEL 1: in the violet corridor, " + PINKD + " seen from the side, shoots a big window; the glass bursts outward; 'BANG!!'. "
        "PANEL 2: outside the second floor of the school at dusk: the two girls leap out of the broken window side by side, arms forward, glass "
        "shards sparkling around them; 'JUMP!!'. "
        "PANEL 3: the schoolyard: the two girls land crouched on the ground in a burst of dust, seen from the front; 'DOOON!!'. "
        "PANEL 4: the middle of the violet-lit schoolyard: the discipline-committee girl stands alone with her back half turned to the reader, "
        "head hanging, while the black-violet formless thing from the sky pours down into her like oily smoke; a mass of dark flesh full of eyes "
        "and toothed mouths bursts out of her back and right shoulder (like reference image 4); creepy and horrifying; the lettering '？？？'."),
    "end": (REFS5, [CAT, PINK, GIRL, S1, S5],
        "Layout: a 2 x 2 grid of four equal rectangular panels. Reading order: top left, top right, bottom left, bottom right. "
        "PANEL 1: the monster's glowing core (like reference image 5) cracks open and dissolves into white light and pink paper petals; a red "
        "hanko stamp with '净化' and the small word 'PURIFIED'. "
        "PANEL 2: the discipline-committee girl lies asleep on the ground of the schoolyard, back to normal, unhurt, peaceful, petals around her. "
        "PANEL 3: seen from behind the two girls (their backs to the reader, standing in the schoolyard): the dark violet power leaves the school "
        "as several black-violet streaks that shoot up into the evening sky and scatter in DIFFERENT directions over the town; ominous; the small "
        "caption '……'. "
        "PANEL 4: a shopping street at night: chibi versions of the two girls sit slumped in front of two different shop windows side by side, a "
        "sweets shop and an anime goods shop, each window with a 'SOLD OUT' sign; both cry waterfall tears; the lettering '限定…売り切れ…'."),
}
JOBS = {f"R47_page_{k}": [(f"art/raw/r47/page_{k}_{v}.png", refs, R + STYLE + txt + f" Variation {v}: its own camera angles inside the same layout.", "OPAQUE")
                          for v in "abc"] for k, (R, refs, txt) in PAGES.items()}
