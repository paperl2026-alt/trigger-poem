"""Round 77's caught cat girl into the game (tools/rounds/job_specs77.py; DESIGN 第 1 话 10 棺材形态): rig.dragged (heroine.js action
"dragged", player.js while madame.js has her in the hole): her shoes held by a crowd of hands from below, struggling, her paw raised.
Picked b. The twin-tail girl's were refused every time: she keeps her own picture, the hands laid over her (madame.js hole).
usage: python -I tools/rounds/r77_rig.py [--overlay] [--dry]"""
import pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
from rig_poses import install, tail  # noqa: E402   (the steps every round shares)

RAW = ROOT / "art" / "raw" / "r77"
PICK = {"cat_dragged": dict(src="cat_dragged_b", anchor=0.56, muzzle=[0.23, 0.94], kick=1.0, tick=0.7)}
RIGS = {
    "cat_dragged": {
        "noSkin": [[[0.12, 0.48], [0.96, 0.48], [0.96, 0.82], [0.12, 0.82]]],
        "lines": {"ground": 0.02, "hip": 0.47, "waist": 0.62, "chest": 0.72}, "waistPivot": [0.5, 0.62], "neckPivot": [0.62, 0.72],
        "parts": {
            "skirt": {"type": "hang", "top": 0.65, "bot": 0.47, "pow": 1.3, "test": "notskin", "minus": ["tail", "dangle"],
                      "poly": [[0.2, 0.58], [0.3, 0.66], [0.62, 0.66], [0.72, 0.6], [0.7, 0.5], [0.55, 0.47], [0.38, 0.47], [0.24, 0.5]]},
            "tail": tail([0.32, 0.52], [[0.35, 0.55], [0.2, 0.56], [0.08, 0.55], [0.02, 0.48], [0.03, 0.38], [0.1, 0.33], [0.25, 0.33], [0.28, 0.4],
                                        [0.18, 0.45], [0.2, 0.5], [0.33, 0.49]]),
            "hairA": {"type": "chain", "root": [0.65, 0.88], "poly": [[0.48, 0.93], [0.82, 0.93], [0.84, 0.74], [0.66, 0.7], [0.5, 0.74]]},
            "hairB": {"type": "chain", "root": [0.47, 0.85], "poly": [[0.43, 0.88], [0.51, 0.88], [0.51, 0.75], [0.43, 0.75]]},
            "earL": {"type": "rigid", "pivot": [0.55, 0.89], "poly": [[0.5, 0.96], [0.6, 0.96], [0.6, 0.88], [0.5, 0.88]]},
            "earR": {"type": "rigid", "pivot": [0.78, 0.84], "poly": [[0.73, 0.97], [0.87, 0.97], [0.87, 0.82], [0.73, 0.82]]},
            "dangle": {"type": "hang", "test": "red", "polys": [
                {"top": 0.67, "bot": 0.58, "poly": [[0.32, 0.67], [0.49, 0.67], [0.49, 0.58], [0.32, 0.58]]},
                {"top": 0.68, "bot": 0.6, "poly": [[0.1, 0.68], [0.2, 0.68], [0.2, 0.6], [0.1, 0.6]]},
                {"top": 0.52, "bot": 0.43, "poly": [[0.75, 0.52], [0.82, 0.52], [0.82, 0.43], [0.75, 0.43]]},
                {"top": 0.92, "bot": 0.84, "poly": [[0.64, 0.92], [0.72, 0.92], [0.72, 0.84], [0.64, 0.84]]}]},
            "sleeve": {"type": "hang", "top": 0.8, "bot": 0.48, "minus": ["dangle"], "polys": [
                {"top": 0.8, "bot": 0.6, "poly": [[0.1, 0.8], [0.32, 0.8], [0.32, 0.62], [0.12, 0.6]]},
                {"top": 0.72, "bot": 0.48, "poly": [[0.66, 0.72], [0.92, 0.66], [0.95, 0.5], [0.8, 0.48], [0.68, 0.58]]}]},
            "head": {"type": "rigid", "pivot": [0.62, 0.72], "poly": [[0.46, 0.96], [0.86, 0.96], [0.86, 0.72], [0.48, 0.72]]},
        },
    },
}
FLESH = {
    "cat_dragged": {"masses": [[0.44, 0.44, 0.08, 0.05, 1, 0.55], [0.57, 0.44, 0.08, 0.05, 1, 0.55], [0.5, 0.6, 0.15, 0.06, 0.45, 0], [0.56, 0.68, 0.12, 0.07, 0.25, 0]],
                    "limbs": [[0.43, 0.46, 0.34, 0.25, 0.06, 0.85, 0.05], [0.58, 0.46, 0.78, 0.26, 0.06, 0.85, 0.05]],
                    "pins": [[0.22, 0.88, 0.1, 0.08, 1], [0.33, 0.18, 0.1, 0.08, 1], [0.78, 0.17, 0.1, 0.08, 1], [0.92, 0.53, 0.06, 0.05, 1], [0.64, 0.82, 0.15, 0.09, 0.8]],
                    "torso": [0.52, 0.66, 0.14, 0.09], "nose": [0.7, 0.8]},
}

if __name__ == "__main__":
    install(RAW, PICK, RIGS, FLESH)
