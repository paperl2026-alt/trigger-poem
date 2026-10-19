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

# the chant: kana in units of two or three syllables, said over and over (user 2026-10-19: two syllables, three at most - long phrases
# never get into your head; the first takes were too slow, too solemn, and the men's voices were wrong: girls only, faster, playful-eerie)
U_KUJI = "りん ぴょう とう しゃ\nかい じん れつ ざい ぜん\nりん ぴょう とう しゃ\nかい じん れつ ざい ぜん"
U_SPELL = "きゅう きゅう\nにょ りつ りょう\nきゅう きゅう\nにょ りつ りょう"
U_SNIP = "チョキ チョキ\nカチ カチ\nチョキ チョキ\nゴーン"
U_ON = "オン ソワカ\nオン ソワカ\nねむれ ねむれ\nねむれ ねむれ"
GIRLS = "female vocals only, two cute high-pitched girls' voices, absolutely no male voice, no deep voice"
CHANTS = {
    # the first takes the user judged (2026-10-19): only the hook passed, barely; kept so the page still has them
    "hook": dict(bpm=124, key="A minor", dur=100, old=True,
        caption="hypnotic catchy chant song, two female voices chanting a mantra-like hook in Japanese, call and response, groovy "
                "electronic beat with taiko and handclaps, koto and synth arpeggios, playful and slightly eerie, catchy",
        lyrics="[intro]\n\n[verse]\nときを きざめ はりの おと\nねむれ ねむれ かねの こえ\n\n[chorus]\nりん ぴょう とう しゃ\nかい じん れつ ざい ぜん\nきゅうきゅう にょりつりょう\n\n[outro]\nきゅうきゅう にょりつりょう"),
    # the hook again, faster, in short units
    "hook2": dict(bpm=142, key="A minor", dur=96,
        caption=f"hypnotic catchy chant pop song, {GIRLS}, chanting short repeated syllables in Japanese like a playground chant, call and "
                "response, bouncy electronic beat with taiko and handclaps, koto plucks, chiptune arpeggios, playful, cute and a little eerie, very catchy",
        lyrics=f"[intro]\n\n[verse]\n{U_KUJI}\n\n[chorus]\n{U_SPELL}\n{U_ON}\n\n[verse]\n{U_SNIP}\n\n[chorus]\n{U_SPELL}\n{U_ON}\n\n[outro]\n{U_SPELL}"),
    # a fight driven by the chant: fast, the girls spitting the syllables on the beat
    "battle2": dict(bpm=172, key="E minor", dur=96,
        caption=f"fast energetic Japanese battle song, {GIRLS}, rapid rhythmic chanting of short syllables on every beat, glitchy "
                "stutter vocal chops, pounding taiko and electronic drums, distorted shamisen riffs, synth bass, intense, cute and crazy",
        lyrics=f"[intro]\n\n[verse]\n{U_KUJI}\n{U_SNIP}\n\n[chorus]\n{U_SPELL}\n{U_SPELL}\n\n[verse]\n{U_ON}\n{U_KUJI}\n\n[chorus]\n{U_SPELL}\n{U_SNIP}\n\n[outro]\n{U_SPELL}"),
    # the inn at night: still the girls, still quick, whispered and sing-song instead of solemn
    "night2": dict(bpm=128, key="D minor", dur=100,
        caption=f"eerie cute Japanese horror pop, {GIRLS}, whispered sing-song chanting of short repeated syllables, music box melody, "
                "ticking clock percussion, soft taiko, koto, dark synth pads, hypnotic and creepy-cute, steady groove, not slow",
        lyrics=f"[intro]\n\n[verse]\n{U_ON}\n{U_SNIP}\n\n[chorus]\n{U_KUJI}\n\n[verse]\n{U_SPELL}\n{U_ON}\n\n[chorus]\n{U_KUJI}\n{U_SNIP}\n\n[outro]\n{U_ON}"),
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
        if (a.names and name not in a.names) or (not a.names and T.get("old")): continue
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
