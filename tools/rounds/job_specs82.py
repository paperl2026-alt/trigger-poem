# Round 82 (user 2026-10-21: a close-up is a scene of its own - shots, a pose of its own, rhythm - not the game's sprite pasted on a page):
# the first storyboarded close-up, episode 2's rainy walkway (nk3) "she wades across": after a wide shot of the pond in the game itself,
# two painted shots cut in hard - her geta stepping down into the water, then her face up close - and back to the game (Game.storyboard,
# src/ui/storyboard.js). Painted shots, full bleed, 16:9; two different takes on each (Codex's daily allowance).
import sys, pathlib
sys.path[:0] = [str(pathlib.Path(__file__).resolve().parent), str(pathlib.Path(__file__).resolve().parent.parent)]

R = "art/raw/r82/"
SHE = "art/raw/r62/she_a.png"
POND = "art/raw/r62/sc_nakaniwa_a.png"
BASE = ("Reference image 1 is the approved design of this story's monster: a life-size ichimatsu doll in a red floral kimono with long ruffled "
        "sleeves, red ribbons, red tassels and golden bells; her two legs are the two long stained steel blades of a giant pair of Japanese "
        "scissors, ending in tall black lacquered pokkuri geta with red thong straps and white ruffled sock cuffs; the scissors' two black "
        "lacquered handle loops rise behind her head like horns; a pale porcelain doll face with blunt black bangs and long black hair. Keep "
        "her look EXACTLY. Reference image 2 is the place: an old Japanese inn's garden pond at night in the rain, lit by orange paper "
        "lanterns along a covered walkway. Paint in EXACTLY the painting style, colours and night light of reference image 2. "
        "Draw ONE single cinematic shot, landscape 16:9 (1536 x 864), full bleed: no panel borders, no frame, no white margins, no text, no "
        "letters, no signature, no other people. ")
SHOTS = {
    "feet_a": "CLOSE-UP at the level of the water, the camera just above the surface of the dark pond: ONE of her tall black lacquered "
              "pokkuri geta (red thong strap, white ruffled sock cuff) stepping DOWN into the black water in the middle of the frame, the "
              "long stained steel scissor blade that is her leg rising out of the TOP edge of the frame; rings of ripples spreading from it "
              "across the surface, raindrops hitting the water everywhere, the hem of the red floral kimono with one golden bell and red "
              "tassels hanging just above the water at the top of the frame, broken orange lantern reflections in the ripples, two koi "
              "darting away to the side. Only the foot, the blade and the hem are in the shot: her body and face are OUT of the shot.",
    "feet_b": "LOW SIDE VIEW at the level of the water: her two tall black lacquered pokkuri geta wading through the dark pond from left to "
              "right, the water up to the geta's straps, the two long stained steel scissor blades that are her legs rising out of the TOP "
              "edge of the frame, the hem of the red floral kimono with golden bells and red tassels trailing just above the water; a wake "
              "of ripples behind her, raindrops hitting the water everywhere, a stone lantern and the lit walkway out of focus far behind, "
              "broken orange reflections in the water. Only the feet, the blades and the hem are in the shot: her body and face are OUT of "
              "the shot.",
    "face_a": "EXTREME CLOSE-UP of HER FACE seen from slightly below, filling the right two-thirds of the frame: the pale porcelain doll face "
              "with blunt black bangs, a thin crack running down the porcelain from her forehead over one cheek, long wet black hair "
              "hanging in strands across the face so that only ONE dark red doll eye shows between the strands, small closed red lips, "
              "raindrops beading on the porcelain and dripping from the hair, her red flower hair ornament and red ribbons at the edge of "
              "the frame, the two black lacquered scissor-handle loops rising behind her head blurred out of focus. Behind her: the dark "
              "rainy night, the walkway's orange paper lanterns blurred out of focus on the left. Expression: still and empty, the one "
              "visible eye staring straight at the viewer. The eye is a plain painted doll's eye (not glowing).",
    "face_b": "EXTREME CLOSE-UP of HER FACE in three-quarter view, the head tilted far to one side like a doll's, filling the middle of the "
              "frame: the pale porcelain doll face with blunt black bangs, a thin crack running down the porcelain across one eye, long wet "
              "black hair plastered across half the face, ONE dark red doll eye looking sideways straight at the viewer, small closed red "
              "lips, rain running down the porcelain like tears, a golden bell and red ribbons hanging at the edge of the frame, the black "
              "lacquered scissor-handle loops behind her head out of focus. Behind her: the dark rainy night, orange paper lanterns blurred "
              "out of focus. Expression: still and empty. The eye is a plain painted doll's eye (not glowing).",
}
JOBS = {f"R82_{k}": [(f"{R}she_{k}.png", [SHE, POND], BASE + d, "OPAQUE")] for k, d in SHOTS.items()}
