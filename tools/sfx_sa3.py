"""Sound effects from Stable Audio 3 Small-SFX (local, CPU). docs/ART.md「声音」.

Runs in its own environment (not the game's): C:\\AI\\sa3\\venv\\Scripts\\python.exe -I tools/sfx_sa3.py <specs.py> [key ...] [--n N] [--force]
  specs.py: SFX = {key: dict(prompt=..., dur=seconds, n=variants, neg=optional negative prompt)} (tools/rounds/sfx_specsNN.py)
  -> art/raw/sfx_ai/<key>/<key>_<seed>.wav (raw 44.1 kHz stereo, not in git) + <key>/prompts.json
Model: C:\\AI\\sa3\\small-sfx (Stability AI Community License + Gemma terms, text/credits.json); code C:\\AI\\sa3\\src.
"""
import argparse, importlib.util, json, os, pathlib, random, sys, time

ROOT = pathlib.Path(__file__).resolve().parents[1]
SA3 = pathlib.Path(os.environ.get("SA3_ROOT", r"C:\AI\sa3"))
OUT = ROOT / "art" / "raw" / "sfx_ai"


def load_model():
    import torch
    from stable_audio_3 import model as M
    from stable_audio_3 import model_configs as MC
    cfg_path = SA3 / "small-sfx" / "model_config.json"
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    for c in cfg["model"]["conditioning"]["configs"]:   # the text encoder from the local copy, not the hub
        if c["type"] == "t5gemma":
            c["config"]["repo_id"] = str(SA3 / "small-sfx").replace("\\", "/")
    local = SA3 / "small-sfx" / "model_config.local.json"
    local.write_text(json.dumps(cfg, indent=1), encoding="utf-8")
    MC.models["small-sfx"] = type("Local", (), {"resolve": staticmethod(lambda: (str(local), str(SA3 / "small-sfx" / "model.safetensors")))})()
    M.all_models["small-sfx"] = MC.models["small-sfx"]
    torch.set_num_threads(os.cpu_count() or 12)
    return M.StableAudioModel.from_pretrained("small-sfx", device="cpu")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("specs"); ap.add_argument("keys", nargs="*")
    ap.add_argument("--n", type=int); ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    spec = importlib.util.spec_from_file_location("specs", a.specs); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    S = {k: v for k, v in mod.SFX.items() if not a.keys or k in a.keys}
    import soundfile as sf
    t0 = time.time(); model = load_model(); print(f"[init] {time.time() - t0:.0f}s", flush=True)
    for key, s in S.items():
        d = OUT / key; d.mkdir(parents=True, exist_ok=True)
        have = list(d.glob(f"{key}_*.wav"))
        n = (a.n or s.get("n", 6)) - (0 if a.force else len(have))
        log = {"prompt": s["prompt"], "dur": s["dur"], "neg": s.get("neg")}
        (d / "prompts.json").write_text(json.dumps(log, ensure_ascii=False, indent=1), encoding="utf-8")
        for i in range(max(0, n)):
            seed = random.randrange(1, 2**31 - 1); t1 = time.time()
            audio = model.generate(prompt="TrackType: SFX, " + s["prompt"], negative_prompt=s.get("neg"), duration=s["dur"], seed=seed)
            x = audio[0] if hasattr(audio, "shape") and len(audio.shape) == 3 else audio
            x = x.float().cpu().numpy().T if hasattr(x, "cpu") else x
            sf.write(str(d / f"{key}_{seed}.wav"), x, 44100)
            print(f"[{key} {i + 1}/{n}] {time.time() - t1:.1f}s", flush=True)
    print(f"[done] {time.time() - t0:.0f}s", flush=True)


if __name__ == "__main__":
    main()
