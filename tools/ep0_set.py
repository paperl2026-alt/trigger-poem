"""The prologue's painted set (content sets/school_p.json): station paintings (tools/build_station.py -> assets/st/<id>.json) plus the
hand-written waves. Waves place monsters on the painting itself: "at": [px, py] is a floor pixel of the 1672-wide painting (see
art/_shots/map_<id>.jpg, tools/station_map.py), "y" lifts floating monsters off the floor (metres).
The deepest a monster may stand (maxZ) is measured from the painting's floor so nothing walks into the painted walls.
usage: python -I tools/ep0_set.py"""
import json, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
A = ROOT / "public" / "content" / "base" / "assets"
OUT = ROOT / "public" / "content" / "base" / "sets" / "school_p.json"

W = lambda t, type, at, **k: {"t": t, "type": type, "at": at, **k}
STATIONS = {
    # classroom, back of the room: calm until the energy hits (the painting's calm version fades out), tutorial
    "cls1": {"invade": True, "tutorial": True, "waves": [
        [W(0.6, "desk", [480, 560], from_="pop"), W(2.4, "desk", [1250, 560], from_="pop")],
        [W(0, "paper", [300, 520], y=1.5), W(0.8, "paper", [1340, 520], y=1.7), W(1.6, "desk", [770, 600], from_="pop")],
        [W(0, "board", [770, 520], from_="pop"), W(1.2, "desk", [384, 600], from_="pop"), W(2.6, "paper", [1150, 520], y=1.6)],
    ]},
    # classroom, front by the podium
    "cls2": {"waves": [
        [W(0.3, "board", [480, 600], from_="pop"), W(1.4, "board", [1150, 600], from_="pop")],
        [W(0, "desk", [672, 580], from_="pop"), W(0.7, "desk", [960, 580], from_="pop"), W(1.5, "paper", [288, 560], y=1.4)],
        [W(0, "horn", [768, 540], y=1.0, from_="pop"), W(1.2, "desk", [480, 620], from_="pop"), W(2.2, "desk", [1150, 620], from_="pop")],
    ]},
    # corridor (the user's concept)
    "cor1": {"waves": [
        [W(0.4, "shoe", [480, 520], from_="pop"), W(1.8, "shoe", [1150, 520], from_="pop")],
        [W(0, "frame", [768, 540], y=0.9, from_="pop"), W(0.8, "paper", [300, 560], y=1.2), W(1.5, "paper", [1250, 560], y=1.3)],
        [W(0, "horn", [672, 540], y=0.9, from_="pop"), W(0.9, "shoe", [384, 600], from_="pop"), W(2.0, "shoe", [1150, 600], from_="pop")],
    ]},
    # corridor end / entrance hall
    "cor2": {"waves": [
        [W(0.3, "shoe", [960, 450], from_="pop"), W(1.0, "shoe", [1056, 470], from_="pop"), W(2.0, "frame", [480, 600], y=1.0, from_="pop")],
        [W(0, "board", [288, 600], from_="pop"), W(0.6, "board", [1440, 600], from_="pop"), W(1.4, "paper", [768, 520], y=1.6), W(2.2, "paper", [1152, 520], y=1.5)],
        [W(0, "horn", [768, 520], y=1.2, from_="pop"), W(0.8, "desk", [480, 620], from_="pop"), W(1.6, "shoe", [1152, 560], from_="pop"), W(2.6, "frame", [1344, 600], y=1.0, from_="pop")],
    ]},
    # schoolyard: the boss rises behind the school building
    "yard": {"boss": True, "roof": [330, 1372, 300]},   # roof line of the school building: x from, x to, y (painting px)
}


def floor_depth(sid):
    S = json.loads((A / "st" / f"{sid}.json").read_text())
    Wp, Hp = S["size"]; t = np.tan(np.radians(S["fov"]) / 2); g = S["grid"]
    dimg = np.asarray(Image.open(A / "st" / f"{sid}_plate_d.png").convert("RGB")).astype(np.float32)
    d = (dimg[..., 0] * 256 + dimg[..., 1]) / 65535
    z = 1 / (1 / S["far"] + d * (1 / S["near"] - 1 / S["far"]))
    gh, gw = d.shape; px = np.arange(gw)[None, :] * g; py = np.arange(gh)[:, None] * g
    X = (px / (Wp - 1) - 0.5) * 2 * t * (Wp / Hp) * z; Y = (0.5 - py / (Hp - 1)) * 2 * t * z; Z = -z
    # the same levelling as src/battle/plates.js: the fitted floor normal turned to +y
    n = np.array([-np.tan(np.radians(S["roll"])), 1, np.tan(np.radians(S["pitch"]))]); n /= np.linalg.norm(n)
    up = np.array([0, 1, 0.]); v = np.cross(n, up); sn = np.linalg.norm(v); c = n @ up
    K = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    R = np.eye(3) + K + K @ K * ((1 - c) / (sn * sn)) if sn > 1e-9 else np.eye(3)
    P = np.stack([X, Y, Z], -1) @ R.T; P[..., 1] += S["camH"]
    fl = np.abs(P[..., 1]) < 0.06; zl = P[..., 2]
    return S, float(np.percentile(-zl[fl], 97)) if fl.any() else 6.0


if __name__ == "__main__":
    out = {"_doc": "序章的手绘 2.5D 场景（每个战斗点一张画，tools/build_station.py 生成 scene，tools/ep0_set.py 生成本文件，不要手改 scene）。"
                   "waves 里 at 是这张画上的地板像素位置（1672 宽），y 是浮空怪离地高度（米），from 出场方式，t 出场时间（秒）。maxZ 怪最远站多远（米，按地板自动量）。",
           "school_p": {"plates": True, "sky": "#2a1438", "fog": "#7a4a6a", "fogDensity": 0.02, "ceiling": 2.6, "stations": {}}}
    for sid, st in STATIONS.items():
        S, maxz = floor_depth(sid)
        waves = [[{("from" if k == "from_" else k): v for k, v in s.items()} for s in w] for w in st.get("waves", [])]
        out["school_p"]["stations"][sid] = {"scene": S, "maxZ": round(maxz, 2), **{k: v for k, v in st.items() if k != "waves"}, "waves": waves}
        print(sid, "maxZ", round(maxz, 2))
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
