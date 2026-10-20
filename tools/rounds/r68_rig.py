"""Round 68's heroine actions into the game (DESIGN「女主动起来」; tools/rounds/job_specs68.py): the ones the game uses now - blind fire (a must-hide
attack coming and she keeps shooting: player.js blind) and the special up in the air (heroine.js: active -> aerial) - as jiggle poses, rig.blind
and rig.aerial (heroine.js ACTIONS). The side-on and the leaping ones wait for the stops that use them (side-on covers, steps between levels).
The cat girl's tail from under her skirt, the skirt over it: her flipping aerial drew it wrong four times (art/raw/r68/_wrong_tail);
her aerial is round 71's (tools/rounds/r71_rig.py).
usage: python -I tools/rounds/r68_rig.py [--overlay] [--dry]"""
import pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from rig_poses import install, tail  # noqa: E402   (the steps every round shares)

RAW = ROOT / "art" / "raw" / "r68"
PICK = {
    "cat_blind":   dict(src="cat_blind_a", anchor=0.42, muzzle=[0.85, 0.82], kick=1.0, tick=0.7),
    "pink_blind":  dict(src="pink_blind_a", anchor=0.5, muzzle=[0.97, 0.88], kick=0.42, tick=1.0),
    "pink_aerial": dict(src="pink_aerial_a", anchor=0.55, muzzle=[0.99, 0.62], kick=0.42, tick=1.0),
}
RIGS = {
    "cat_blind": {
        "noSkin": [[[0.15, 0.4], [1.0, 0.4], [1.0, 0.7], [0.15, 0.7]]],
        "lines": {"ground": 0.02, "hip": 0.28, "waist": 0.48, "chest": 0.6}, "waistPivot": [0.38, 0.48], "neckPivot": [0.48, 0.66],
        "parts": {
            "skirt": {"type": "hang", "top": 0.5, "bot": 0.22, "pow": 1.3, "test": "notskin", "minus": ["tail", "dangle"],
                      "poly": [[0.15, 0.35], [0.22, 0.48], [0.55, 0.48], [0.62, 0.4], [0.58, 0.3], [0.45, 0.26], [0.3, 0.24], [0.18, 0.27]]},
            "tail": tail([0.22, 0.32], [[0.26, 0.36], [0.22, 0.28], [0.16, 0.22], [0.2, 0.12], [0.15, 0.04], [0.0, 0.05], [0.0, 0.2], [0.06, 0.3], [0.15, 0.36]]),
            "hairA": {"type": "chain", "root": [0.4, 0.76], "poly": [[0.28, 0.8], [0.55, 0.8], [0.55, 0.66], [0.4, 0.62], [0.28, 0.68]]},
            "hairB": {"type": "chain", "root": [0.3, 0.6], "poly": [[0.24, 0.62], [0.34, 0.62], [0.34, 0.5], [0.24, 0.5]]},
            "earL": {"type": "rigid", "pivot": [0.52, 0.79], "poly": [[0.47, 0.83], [0.56, 0.83], [0.56, 0.77], [0.48, 0.77]]},
            "earR": {"type": "rigid", "pivot": [0.63, 0.79], "poly": [[0.6, 0.83], [0.67, 0.83], [0.67, 0.76], [0.6, 0.76]]},
            "dangle": {"type": "hang", "test": "red", "polys": [
                {"top": 0.47, "bot": 0.38, "poly": [[0.2, 0.48], [0.37, 0.48], [0.37, 0.37], [0.2, 0.37]]},
                {"top": 0.46, "bot": 0.38, "poly": [[0.6, 0.46], [0.73, 0.46], [0.73, 0.37], [0.6, 0.37]]},
                {"top": 0.44, "bot": 0.34, "poly": [[0.78, 0.44], [0.9, 0.44], [0.9, 0.33], [0.78, 0.33]]},
                {"top": 0.73, "bot": 0.63, "poly": [[0.44, 0.73], [0.5, 0.73], [0.5, 0.62], [0.44, 0.62]]}]},
            "sleeve": {"type": "hang", "top": 0.66, "bot": 0.4, "poly": [[0.52, 0.66], [0.8, 0.66], [0.86, 0.45], [0.75, 0.4], [0.6, 0.45]], "minus": ["dangle"]},
            "head": {"type": "rigid", "pivot": [0.48, 0.66], "poly": [[0.28, 0.85], [0.68, 0.85], [0.68, 0.64], [0.28, 0.64]]},
        },
    },
    "pink_blind": {
        "lines": {"ground": 0.02, "hip": 0.28, "waist": 0.47, "chest": 0.6}, "waistPivot": [0.45, 0.47], "neckPivot": [0.55, 0.72],
        "parts": {
            "skirt": {"type": "hang", "top": 0.62, "bot": 0.18, "pow": 1.2, "test": "notskin", "minus": ["hairA"],
                      "poly": [[0.08, 0.3], [0.12, 0.45], [0.25, 0.58], [0.4, 0.6], [0.48, 0.5], [0.5, 0.35], [0.45, 0.22], [0.3, 0.18], [0.15, 0.2]]},
            "hairA": {"type": "chain", "root": [0.42, 0.76], "test": "hair",
                      "poly": [[0.4, 0.82], [0.5, 0.8], [0.42, 0.68], [0.3, 0.62], [0.2, 0.5], [0.12, 0.35], [0.03, 0.3], [0.0, 0.45], [0.05, 0.6], [0.15, 0.7], [0.28, 0.78]]},
            "hairB": {"type": "chain", "root": [0.82, 0.5], "test": "hair", "poly": [[0.72, 0.65], [0.85, 0.65], [0.95, 0.5], [0.92, 0.35], [0.85, 0.3], [0.78, 0.4], [0.74, 0.55]]},
            "dangle": {"type": "hang", "test": "notskin", "minus": ["hairA"], "polys": [{"top": 0.85, "bot": 0.68, "poly": [[0.43, 0.86], [0.52, 0.86], [0.52, 0.67], [0.43, 0.67]]}]},
            "head": {"type": "rigid", "pivot": [0.55, 0.72], "poly": [[0.42, 0.88], [0.68, 0.88], [0.68, 0.72], [0.45, 0.72]]},
            "chest": {"type": "hang", "top": 0.6, "bot": 0.52, "poly": [[0.58, 0.6], [0.65, 0.6], [0.65, 0.52], [0.58, 0.52]]},
        },
    },
    "pink_aerial": {
        "lines": {"ground": 0.02, "hip": 0.45, "waist": 0.58, "chest": 0.68}, "waistPivot": [0.5, 0.58], "neckPivot": [0.65, 0.76],
        "parts": {
            "skirt": {"type": "hang", "top": 0.68, "bot": 0.38, "pow": 1.2, "test": "notskin", "minus": ["hairA"], "polys": [
                {"poly": [[0.03, 0.48], [0.05, 0.6], [0.15, 0.66], [0.35, 0.68], [0.48, 0.62], [0.45, 0.52], [0.38, 0.42], [0.25, 0.38], [0.12, 0.4]]},
                {"poly": [[0.66, 0.62], [0.72, 0.6], [0.74, 0.52], [0.68, 0.5]]}]},
            "hairA": {"type": "chain", "root": [0.55, 0.86], "test": "hair",
                      "poly": [[0.55, 0.95], [0.62, 0.9], [0.55, 0.82], [0.4, 0.85], [0.25, 0.82], [0.1, 0.78], [0.02, 0.82], [0.05, 0.92], [0.2, 0.98], [0.4, 0.99]]},
            "hairB": {"type": "chain", "root": [0.82, 0.75], "test": "hair", "poly": [[0.8, 0.8], [0.92, 0.8], [0.98, 0.68], [0.92, 0.6], [0.84, 0.62]]},
            "dangle": {"type": "hang", "test": "notskin", "minus": ["hairA"], "polys": [{"top": 0.85, "bot": 0.72, "poly": [[0.7, 0.86], [0.82, 0.86], [0.82, 0.71], [0.7, 0.71]]}]},
            "head": {"type": "rigid", "pivot": [0.7, 0.76], "poly": [[0.58, 0.95], [0.88, 0.95], [0.88, 0.75], [0.62, 0.75]]},
            "chest": {"type": "hang", "top": 0.66, "bot": 0.58, "poly": [[0.66, 0.66], [0.72, 0.66], [0.72, 0.58], [0.66, 0.58]]},
        },
    },
}
FLESH = {
    "cat_blind": {"masses": [[0.4, 0.28, 0.08, 0.06, 1, 0.55], [0.38, 0.45, 0.15, 0.06, 0.45, 0], [0.42, 0.55, 0.13, 0.08, 0.25, 0]],
                  "limbs": [[0.5, 0.33, 0.75, 0.33, 0.07, 0.85, 0.05]],
                  "pins": [[0.88, 0.8, 0.1, 0.08, 1], [0.4, 0.08, 0.1, 0.06, 1], [0.5, 0.08, 0.1, 0.06, 1], [0.75, 0.32, 0.08, 0.06, 0.8], [0.48, 0.75, 0.15, 0.09, 0.8]], "torso": [0.42, 0.56, 0.15, 0.09], "nose": [0.6, 0.68]},
    "pink_blind": {"masses": [[0.5, 0.3, 0.08, 0.06, 1, 0.55], [0.62, 0.56, 0.04, 0.035, 1, 0.6], [0.45, 0.45, 0.14, 0.06, 0.45, 0], [0.5, 0.55, 0.12, 0.07, 0.25, 0]],
                   "limbs": [[0.6, 0.42, 0.8, 0.45, 0.07, 0.85, 0.05], [0.5, 0.3, 0.6, 0.15, 0.06, 0.65, 0.05]],
                   "pins": [[0.82, 0.84, 0.12, 0.08, 1], [0.45, 0.15, 0.1, 0.06, 1], [0.62, 0.13, 0.1, 0.06, 1], [0.78, 0.45, 0.08, 0.06, 0.8], [0.55, 0.78, 0.12, 0.08, 0.8]], "torso": [0.55, 0.58, 0.12, 0.08], "nose": [0.62, 0.76]},
    "pink_aerial": {"masses": [[0.45, 0.5, 0.08, 0.06, 1, 0.55], [0.56, 0.48, 0.07, 0.06, 1, 0.55], [0.7, 0.62, 0.04, 0.035, 1, 0.6], [0.52, 0.58, 0.14, 0.06, 0.45, 0], [0.6, 0.66, 0.12, 0.07, 0.25, 0]],
                    "limbs": [[0.48, 0.44, 0.38, 0.3, 0.06, 0.85, 0.05], [0.58, 0.44, 0.75, 0.3, 0.06, 0.85, 0.05]],
                    "pins": [[0.9, 0.65, 0.12, 0.08, 1], [0.35, 0.3, 0.1, 0.07, 1], [0.92, 0.07, 0.1, 0.07, 1], [0.72, 0.85, 0.12, 0.08, 0.8]], "torso": [0.6, 0.64, 0.12, 0.08], "nose": [0.75, 0.8]},
}

if __name__ == "__main__":
    install(RAW, PICK, RIGS, FLESH)
