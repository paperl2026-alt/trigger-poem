"""The door opening (tools/rounds/sfx_specs94.py, user 2026-10-22: "开门声就做的更像开门声吧"): Small-SFX made every take of it a latch
and a clunk with near silence after - no hinge creak at all (art/raw/sfx_ai/_look/doorOpen.png) - so each kept take's latch and clunk
(up to its loudest hit, and a little of its ring) is joined to one of the creaks it made for the creak sound before (sfx_specs62, the
kept ones of art/raw/sfx_ai/_look/pick_creak.png), the creak coming in under the clunk's ring: "clack - creeeak".
Writes over public/content/base/sfx/ai/doorOpen_<n>.ogg (tools/sfx_pick.py doorOpen made and registered them first).
usage: python -I tools/rounds/sfx_door94.py"""
import json, pathlib, sys
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools")]
import sfx_pick  # noqa: E402

RAW = ROOT / "art" / "raw" / "sfx_ai"
CREAKS = ["creak_1224218638", "creak_15152289", "creak_1619014916", "creak_2114236587"]   # (sfx_pick's kept creaks, best first)


def ramp(n, up):
    r = np.linspace(0, 1, max(1, n), dtype=np.float32)[:, None]
    return r if up else 1 - r


def main():
    S = json.loads(sfx_pick.SOUNDS.read_text(encoding="utf-8"))["sfx"]["doorOpen"]
    for i, (take, ck) in enumerate(zip(S["from"], CREAKS), 1):
        sr, d = sfx_pick.read2(RAW / "doorOpen" / f"{take}.wav"); sr2, c = sfx_pick.read2(RAW / "creak" / f"{ck}.wav")
        assert sr == sr2
        hit = int(np.argmax(np.abs(d).max(axis=1)))   # (the clunk: its loudest moment)
        a = int(np.argmax(np.abs(d).max(axis=1) > 0.05 * np.abs(d).max()))   # (where it starts)
        cut = min(len(d), hit + int(0.45 * sr)); latch = d[max(0, a - int(0.02 * sr)):cut].copy()
        latch[-int(0.2 * sr):] *= ramp(int(0.2 * sr), False)
        c0 = int(np.argmax(np.abs(c).max(axis=1) > 0.05 * np.abs(c).max())); creak = c[c0:].copy()
        creak *= 0.55 * np.abs(latch).max() / (np.abs(creak).max() + 1e-9)   # (under the clunk, as loud as a door's hinges)
        creak[:int(0.12 * sr)] *= ramp(int(0.12 * sr), True); creak[-int(0.35 * sr):] *= ramp(int(0.35 * sr), False)
        at = hit - max(0, a - int(0.02 * sr)) + int(0.12 * sr)   # (it creaks open just after the clunk)
        y = np.zeros((max(len(latch), at + len(creak)), 2), np.float32); y[:len(latch)] += latch; y[at:at + len(creak)] += creak
        out = ROOT / "public" / "content" / "base" / S["files"][i - 1]
        sfx_pick.write_ogg(y, sr, out, False); print(out.name, f"{len(y) / sr:.2f}s", take, "+", ck)


if __name__ == "__main__":
    main()
