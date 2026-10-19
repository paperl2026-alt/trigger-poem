# Round 65 (user 2026-10-19 batch 23): episode 2's house rules as a comic page of their own - the note in the stage was read by nobody.
# One page, six panels: the note on the front desk, then each rule acted out by the two girls (and her), so it reads without words; the
# only words are the ones painted on the note and the sound effects (DESIGN: the words are drawn by Codex into the comic, never added on).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]
from job_specs63 import CSTYLE, WHO, CREFS

R = "art/raw/r65/"
JOBS = {}
PAGE = ("SIX panels: three columns and two rows of equal panels, thin white gutters, landscape 3:2 page. The story: the inn's proprietress "
        "never shows herself; she left the guests a handwritten note of house rules, and every rule is a warning about the scissor doll. "
        "PANEL 1: close-up on the dark wooden front desk: under a brass call bell a sheet of washi paper with a handwritten note in black "
        "brush ink; its title written clearly '時守屋 ご宿泊の皆さまへ', below it six short lines numbered 一 二 三 四 五 六 (the lines "
        "themselves small and not readable), signed '女将' at the bottom; the twin-tail girl's hand holds up a phone light over it, the cat "
        "girl's ears peek in from the side of the panel. "
        "PANEL 2 (rule 一): a whole wall of old Japanese clocks all striking at once, a big drawn sound effect 'ゴーン…'; inside the guest "
        "room the two girls crouch behind a sliding door that is only open a crack, wide-eyed, NOT stepping out; a big red brush-stroke "
        "number 一 in the panel's corner. "
        "PANEL 3 (rule 二): a dark corridor; on a lit shoji screen the shadow of a walking pair of huge Japanese scissors with a doll's "
        "hair, the sound effect 'チョキ…チョキ…' drawn in; the two girls squeezed together inside a closet, peeking through the gap, "
        "hands over each other's mouths; a red number 二 in the corner. "
        "PANEL 4 (rule 三): the scissor doll (reference 5) fallen flat on the floor, face down, her black hair spread out; the two girls "
        "running past her toward the viewer, the cat girl's big fluffy ghost paw covering the twin-tail girl's eyes so she will not look at "
        "the doll's face; a red number 三 in the corner. "
        "PANEL 5 (rules 四 and 五): a paper lantern falling and a wooden rain shutter (amado) slamming shut between the girls and the "
        "looming shadow of the scissor doll; the twin-tail girl shooting the lantern's cord; in the panel's corner a small round Japanese "
        "clock face whose hand jumps forward (time earned), red numbers 四 五. "
        "PANEL 6 (rule 六): dawn: the wooden bell tower against a pink sunrise sky, a big bronze temple bell swinging, sound effect "
        "'ゴーン'; in front, hanging from a nail, a wooden room key tag and a small wooden sign 'チェックアウト' crossed out with a red "
        "brush stroke, a red number 六. "
        "Horror with a cute edge, clear storytelling, every panel easy to read at a glance. No speech balloons, no other text than the "
        "words named here.")
JOBS["R65_page_rules"] = [(f"{R}page_rules_{v}.png", CREFS, CSTYLE + WHO + PAGE + f" Variation {v}: its own camera angles.", "OPAQUE") for v in "abc"]
