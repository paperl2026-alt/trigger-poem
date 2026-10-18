"""BGM, step 2 of 2 (docs/TECH.md 声音): ACE-Step 1.5 (local, CPU) plays the guide of tools/bgm_guide.py again with real instruments: its
"cover" task keeps the guide's melody, harmony and form (strength = how closely) and takes its sound from the caption (tools/rounds/
bgm_specs.py). Runs in ACE-Step's own environment:
  C:\\AI\\ACE-Step-1.5\\venv_cpu\\Scripts\\python.exe -I tools/bgm_ace.py [track ...] [--k 0.55,0.75] [--n 1]
  -> art/raw/bgm_ai/<track>_k<strength>_<seed>.wav (+ .json: what it was asked); tools/bgm_pick.py makes the game's loops of them.
The CPU path follows the user's own script (../bgm/gen_bgm.py: bf16 on CPU; the iGPU is blocked by Windows Smart App Control)."""
import argparse, importlib.util, json, os, pathlib, sys, time, wave

ROOT = pathlib.Path(__file__).resolve().parents[1]
ACE = pathlib.Path(os.environ.get("ACESTEP_ROOT", r"C:\AI\ACE-Step-1.5"))
OUT = ROOT / "art" / "raw" / "bgm_ai"
sys.path.insert(0, str(ACE))
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
import torch  # noqa: E402
from acestep.handler import AceStepHandler  # noqa: E402
from acestep.inference import GenerationConfig, GenerationParams, generate_music  # noqa: E402
from acestep.llm_inference import LLMHandler  # noqa: E402


class CpuBf16Handler(AceStepHandler):   # (upstream keeps float32 on the CPU; bf16 halves the memory and is about twice as fast on Zen 5)
    @property
    def dtype(self): return self._dtype
    @dtype.setter
    def dtype(self, value):
        if value == torch.float32 and os.environ.get("ACESTEP_CPU_FP32") != "1": value = torch.bfloat16
        self._dtype = value


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("tracks", nargs="*"); ap.add_argument("--k", default="0.6,0.8"); ap.add_argument("--n", type=int, default=1)
    a = ap.parse_args()
    spec = importlib.util.spec_from_file_location("bs", ROOT / "tools" / "rounds" / "bgm_specs.py"); S = importlib.util.module_from_spec(spec); spec.loader.exec_module(S)
    torch.set_num_threads(os.cpu_count() or 12)
    t0 = time.time()
    dit = CpuBf16Handler()
    msg, ok = dit.initialize_service(project_root=str(ACE), config_path="acestep-v15-turbo", device="cpu")
    if not ok: sys.exit(f"DiT init failed: {msg}")
    llm = LLMHandler()   # (not loaded: a cover takes its codes from the guide, the language model is not used)
    print(f"[init] {time.time() - t0:.0f}s", flush=True)
    for name, T in S.TRACKS.items():
        if a.tracks and name not in a.tracks: continue
        guide = OUT / f"{name}_guide.wav"
        with wave.open(str(guide)) as w: dur = w.getnframes() / w.getframerate()
        for k in [float(x) for x in a.k.split(",")]:
            for i in range(a.n):
                t1 = time.time()
                p = GenerationParams(task_type="cover", src_audio=str(guide), audio_cover_strength=k, caption=T["caption"], lyrics="[Instrumental]",
                                     instrumental=True, bpm=T["bpm"], keyscale=T["key"], duration=round(dur, 2), shift=3.0, seed=-1, thinking=False)
                cfg = GenerationConfig(batch_size=1, use_random_seed=True, audio_format="wav")
                r = generate_music(dit, llm, p, cfg, save_dir=str(OUT / "_raw"))
                if not r.success: print(f"[{name} k{k}] failed: {r.error}", flush=True); continue
                for au in r.audios:
                    seed = au["params"].get("seed"); dst = OUT / f"{name}_k{k:.2f}_{seed}.wav"
                    pathlib.Path(au["path"]).replace(dst)
                    dst.with_suffix(".json").write_text(json.dumps({"track": name, "k": k, "seed": seed, "caption": T["caption"], "bpm": T["bpm"], "key": T["key"]}, ensure_ascii=False, indent=1), encoding="utf-8")
                    print(f"[{name} k{k}] {dst.name} {time.time() - t1:.0f}s", flush=True)
    print(f"[done] {time.time() - t0:.0f}s", flush=True)


if __name__ == "__main__":
    main()
