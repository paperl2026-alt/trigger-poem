"""Round 71's cat girl in the air into the game (tools/rounds/job_specs71.py): rig.aerial (heroine.js ACTIONS): the top of her jump, between the
take-off and the landing (R68), for the jumps in the places (DESIGN「女主动起来」; not her special: user 2026-10-20). Asked as the frame halfway between the approved take-off and landing (ART
出图流程「连续动作先出头尾、再补中间」): mid, a - at the top of the jump, tipped forward, the paw firing down, the tail out from under the skirt.
usage: python -I tools/rounds/r71_rig.py [--overlay] [--dry]"""
import pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from rig_poses import install, tail  # noqa: E402   (the steps every round shares)

RAW = ROOT / "art" / "raw" / "r71"
PICK = {"cat_aerial": dict(src="cat_aerial_mid_a", anchor=0.5, muzzle=[0.92, 0.45], kick=1.0, tick=0.7)}
RIGS = {
    "cat_aerial": {
        "noSkin": [[[0.15, 0.56], [1.0, 0.56], [1.0, 0.78], [0.15, 0.78]]],
        "lines": {"ground": 0.02, "hip": 0.45, "waist": 0.6, "chest": 0.7}, "waistPivot": [0.5, 0.6], "neckPivot": [0.62, 0.76],
        "parts": {
            "skirt": {"type": "hang", "top": 0.6, "bot": 0.38, "pow": 1.3, "test": "notskin", "minus": ["tail", "dangle"],
                      "poly": [[0.16, 0.52], [0.25, 0.6], [0.55, 0.62], [0.68, 0.55], [0.75, 0.47], [0.62, 0.43], [0.45, 0.4], [0.3, 0.38], [0.2, 0.44]]},
            "tail": tail([0.45, 0.47], [[0.47, 0.5], [0.3, 0.51], [0.15, 0.5], [0.06, 0.47], [0.0, 0.38], [0.0, 0.3], [0.05, 0.23], [0.15, 0.19],
                                        [0.27, 0.19], [0.33, 0.25], [0.29, 0.32], [0.21, 0.36], [0.19, 0.42], [0.28, 0.45], [0.4, 0.44], [0.47, 0.44]]),
            "hairA": {"type": "chain", "root": [0.58, 0.88], "poly": [[0.44, 0.92], [0.7, 0.92], [0.72, 0.8], [0.56, 0.76], [0.44, 0.8]]},
            "hairB": {"type": "chain", "root": [0.47, 0.8], "poly": [[0.48, 0.84], [0.48, 0.76], [0.36, 0.75], [0.26, 0.76], [0.26, 0.89], [0.36, 0.89]]},
            "earL": {"type": "rigid", "pivot": [0.6, 0.9], "poly": [[0.55, 1.0], [0.65, 1.0], [0.65, 0.89], [0.55, 0.89]]},
            "earR": {"type": "rigid", "pivot": [0.72, 0.85], "poly": [[0.67, 0.97], [0.78, 0.97], [0.78, 0.83], [0.67, 0.83]]},
            "dangle": {"type": "hang", "test": "red", "polys": [
                {"top": 0.66, "bot": 0.58, "poly": [[0.13, 0.66], [0.24, 0.66], [0.24, 0.58], [0.13, 0.58]]},
                {"top": 0.64, "bot": 0.54, "poly": [[0.3, 0.64], [0.46, 0.64], [0.46, 0.54], [0.3, 0.54]]},
                {"top": 0.65, "bot": 0.59, "poly": [[0.61, 0.65], [0.67, 0.65], [0.67, 0.59], [0.61, 0.59]]},
                {"top": 0.49, "bot": 0.4, "poly": [[0.77, 0.49], [0.87, 0.49], [0.87, 0.4], [0.77, 0.4]]},
                {"top": 0.85, "bot": 0.76, "poly": [[0.59, 0.85], [0.66, 0.85], [0.66, 0.76], [0.59, 0.76]]}]},
            "sleeve": {"type": "hang", "top": 0.77, "bot": 0.47, "minus": ["dangle"], "polys": [
                {"top": 0.77, "bot": 0.62, "poly": [[0.18, 0.77], [0.42, 0.77], [0.42, 0.64], [0.2, 0.62]]},
                {"top": 0.72, "bot": 0.47, "poly": [[0.62, 0.72], [0.75, 0.68], [0.84, 0.55], [0.8, 0.47], [0.7, 0.52], [0.62, 0.62]]}]},
            "head": {"type": "rigid", "pivot": [0.62, 0.76], "poly": [[0.44, 1.0], [0.8, 1.0], [0.8, 0.76], [0.44, 0.76]]},
        },
    },
}
FLESH = {
    "cat_aerial": {"masses": [[0.45, 0.46, 0.07, 0.05, 1, 0.55], [0.56, 0.45, 0.07, 0.05, 1, 0.55], [0.5, 0.58, 0.15, 0.06, 0.45, 0], [0.55, 0.68, 0.13, 0.08, 0.25, 0]],
                   "limbs": [[0.45, 0.42, 0.42, 0.28, 0.06, 0.85, 0.05], [0.56, 0.42, 0.66, 0.42, 0.06, 0.85, 0.05]],
                   "pins": [[0.9, 0.47, 0.1, 0.08, 1], [0.07, 0.74, 0.06, 0.05, 1], [0.38, 0.12, 0.1, 0.07, 1], [0.52, 0.3, 0.08, 0.06, 1], [0.62, 0.88, 0.15, 0.09, 0.8]], "torso": [0.55, 0.66, 0.15, 0.09], "nose": [0.72, 0.8]},
}

if __name__ == "__main__":
    install(RAW, PICK, RIGS, FLESH)
