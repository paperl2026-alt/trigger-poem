"""Chanting BGM straight from ACE-Step 1.5 (user 2026-10-19: the chant does not have to be a TTS voice; let the music model sing it, with
as much arrangement as it can carry - like Kuon's Japanese chanting that never stops). text2music with Japanese lyrics: the words are
ours (traditional formulas that belong to nobody - 臨兵闘者皆陣列在前, 急急如律令 - and lines written for this game), written in kana so
the model reads them right; the caption names the instruments and the mood only, no other works.
Runs in ACE-Step's own environment:
  C:\\AI\\ACE-Step-1.5\\venv_cpu\\Scripts\\python.exe -u tools/bgm_chant.py [name ...] [--n 2]
  -> art/raw/bgm_ai/chant_<name>_<seed>.wav (+ .json); listened to on sound.html, picked into the game by tools/bgm_pick.py like the others."""
import argparse, importlib.util, json, os, pathlib, sys, time

ROOT = pathlib.Path(__file__).resolve().parents[1]
ACE = pathlib.Path(os.environ.get("ACESTEP_ROOT", r"C:\AI\ACE-Step-1.5"))
OUT = ROOT / "art" / "raw" / "bgm_ai"
sys.path.insert(0, str(ACE))
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
spec = importlib.util.spec_from_file_location("ba", ROOT / "tools" / "bgm_ace.py"); BA = importlib.util.module_from_spec(spec)
sys.argv, argv = [sys.argv[0]], sys.argv; spec.loader.exec_module(BA); sys.argv = argv
from acestep.inference import GenerationConfig, GenerationParams, generate_music  # noqa: E402
from acestep.llm_inference import LLMHandler  # noqa: E402
import torch  # noqa: E402

# the chant: kana, one formula per line; [tags] are the song's parts
KUJI = "りん ぴょう とう しゃ\nかい じん れつ ざい ぜん"
SPELL = "きゅうきゅう にょりつりょう\nきゅうきゅう にょりつりょう"
OURS = ("ときを きざめ はりの おと\nねむれ ねむれ かねの こえ\nひとつ ふたつ よるが ほどける\nみっつ よっつ ゆめが ほどける")
CHANTS = {
    # the haunted inn at night: a low monotone sutra-like chant that never stops, wood block, bell, drones (episode 2's dark stretches)
    "inn": dict(bpm=72, key="D minor", dur=120,
        caption="Japanese horror game soundtrack, an endless low monotone chant by a male and female choir in Japanese, ritual recitation, "
                "wooden fish block keeping a slow steady pulse, a deep temple bell, dark drones, distant taiko, eerie and hypnotic, "
                "cinematic ambient",
        lyrics=f"[intro]\n\n[verse]\n{KUJI}\n{OURS}\n\n[chorus]\n{SPELL}\n{KUJI}\n\n[verse]\n{OURS}\n{KUJI}\n\n[chorus]\n{SPELL}\n{SPELL}\n\n[outro]\n{KUJI}"),
    # a fight with the chant driving it: relentless rhythmic recitation over taiko, shamisen and an electronic beat
    "battle": dict(bpm=150, key="E minor", dur=110,
        caption="intense Japanese battle music driven by relentless rhythmic chanting in Japanese, a choir reciting fast incantations on "
                "the beat, pounding taiko drums, distorted shamisen riffs, electronic drums and bass, tense strings, dark and powerful",
        lyrics=f"[intro]\n\n[verse]\n{KUJI}\n{KUJI}\n{SPELL}\n\n[chorus]\n{SPELL}\n{KUJI}\n{SPELL}\n\n[bridge]\n{OURS}\n\n[chorus]\n{KUJI}\n{SPELL}\n{KUJI}\n\n[outro]\n{SPELL}"),
    # catchy and hypnotic: a chant you hum along to (the title / select screen idea the user liked: a chant that gets into your head)
    "hook": dict(bpm=124, key="A minor", dur=100,
        caption="hypnotic catchy chant song, two female voices chanting a mantra-like hook in Japanese, call and response, groovy "
                "electronic beat with taiko and handclaps, koto and synth arpeggios, playful and slightly eerie, catchy",
        lyrics=f"[intro]\n\n[verse]\n{OURS}\n\n[chorus]\n{KUJI}\n{SPELL}\n\n[verse]\n{OURS}\n\n[chorus]\n{KUJI}\n{SPELL}\n{KUJI}\n\n[outro]\n{SPELL}"),
}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("names", nargs="*"); ap.add_argument("--n", type=int, default=2)
    a = ap.parse_args()
    torch.set_num_threads(os.cpu_count() or 12)
    t0 = time.time()
    dit = BA.CpuBf16Handler()
    msg, ok = dit.initialize_service(project_root=str(ACE), config_path="acestep-v15-turbo", device="cpu")
    if not ok: sys.exit(f"DiT init failed: {msg}")
    llm = LLMHandler()
    print(f"[init] {time.time() - t0:.0f}s", flush=True)
    for name, T in CHANTS.items():
        if a.names and name not in a.names: continue
        for i in range(a.n):
            t1 = time.time()
            p = GenerationParams(task_type="text2music", caption=T["caption"], lyrics=T["lyrics"], instrumental=False, vocal_language="ja",
                                 bpm=T["bpm"], keyscale=T["key"], duration=T["dur"], shift=3.0, seed=-1, thinking=False)
            r = generate_music(dit, llm, p, GenerationConfig(batch_size=1, use_random_seed=True, audio_format="wav"), save_dir=str(OUT / "_raw"))
            if not r.success: print(f"[{name}] failed: {r.error}", flush=True); continue
            for au in r.audios:
                seed = au["params"].get("seed"); dst = OUT / f"chant_{name}_{seed}.wav"
                pathlib.Path(au["path"]).replace(dst)
                dst.with_suffix(".json").write_text(json.dumps({"track": f"chant_{name}", "seed": seed, **{k: T[k] for k in ("caption", "lyrics", "bpm", "key")}},
                                                               ensure_ascii=False, indent=1), encoding="utf-8")
                print(f"[{name}] {dst.name} {time.time() - t1:.0f}s", flush=True)
    print(f"[done] {time.time() - t0:.0f}s", flush=True)


if __name__ == "__main__":
    main()
