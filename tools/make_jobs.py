# Builds Codex image job files from prompt specs in tools/rounds/job_specs.py
import pathlib, sys, re, importlib.util

# a picture of several things that tools cut apart afterwards (a sheet / a grid of items): they must stand well apart (user 2026-10-19:
# cut-outs caught pieces of their neighbours, or lost their own parts at the cell lines). Added to every such prompt
SHEET = re.compile(r"\b(\d+\s*x\s*\d+|grid|sheet|separate (small )?(objects|items|things|poses))\b", re.I)
GAP = (" SPACING (required): every item stays whole and well INSIDE its own cell, with wide empty gaps of plain background between "
       "items (at least a fifth of a cell) and along the picture's edges; no item may touch, overlap or reach into a neighbour's cell, "
       "no part of any item may be cut off by the picture's edge.")

HEAD = """You are an image-production worker for a game project. Your only job is to generate the images below with your built-in image generation tool and save them. Rules:
- Pass each PROMPT to the image tool exactly as written. Do not paraphrase, shorten, or add any style words of your own.
- Each step lists reference images: pass them to the tool as referenced_image_paths (local paths). If the list is empty, pass none.
- Request a transparent background unless the step says OPAQUE.
- After each generation, copy the produced PNG to the given OUTPUT path (relative to the current working directory). Keep the alpha channel.
- Do not write code, do not create or edit any other files, do not run anything else.
- If a generation is refused or fails, write the exact message to OUTPUT with the extension .refused.txt and continue with the next step.
- At the end, reply with one line per saved file: path, pixel width x height.
"""

# A spec with MODE = "brief" (user 2026-10-23: GPT is an LLM, not a diffusion model - tell it the purpose, the method and the requirements
# as you would tell an LLM; let it understand the references and draw something of its own, not pass a prompt on word for word): each step
# is a brief; Codex writes its own prompts, looks at what it got and draws again until it is right.
HEAD_BRIEF = """You are the lead artist making finished assets for a game: a light-gun rail shooter with two anime heroines who fight monsters on screen. Each TASK below is a brief: what the asset is, how the game uses it, its design and its requirements. Work like a careful professional artist:
1. Read the brief and look closely at every reference image. Each brief says what to take from each reference - take only that. Never copy a reference's character, costume, face or composition unless the brief says so: what you draw is its own new design.
2. Write the prompt for your image generation tool from the brief's own content only. Do not use any prompt template or skill format (no "Use case:", no "Constraints:/Avoid:" lists). Add NOTHING the brief does not ask for: no style, quality, mood, texture, dirt, stains, wear, damage, ornaments, extra details, body-shape words or proportion figures of your own. Pass the task's reference images as referenced_image_paths.
3. Generate, then inspect the result yourself, carefully and at full size: drawing mistakes (smudged or melted patches, doubled or broken lines, stray fragments, garbled details), anything cut off by the edges, the background, and every requirement in the brief. A monster does NOT have to be realistic, polished, anatomically correct or beautiful: wrong proportions, extra or missing limbs and twisted shapes are fine when they are the design - judge it against the brief and the reference style, not against a normal human body or your own taste. If anything is wrong, generate again. Every attempt starts again from the task's own reference images only - NEVER pass one of your own earlier attempts as a reference (each copy of a copy drifts further from the references). Up to 6 attempts per task; keep the best one that meets every requirement.
4. Save the final PNG to the task's OUTPUT path (relative to the current working directory); keep the alpha channel when the background is transparent. Do not write code and do not create or edit any other files.
5. At the end reply with one line per task: path, pixel width x height, attempts used, and anything you could not get right.
"""


def build(specs_path, only=None):
    spec = importlib.util.spec_from_file_location("specs", specs_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    brief = getattr(mod, "MODE", "") == "brief"
    for name, steps in mod.JOBS.items():
        if only and name not in only:
            continue
        out = [HEAD_BRIEF if brief else HEAD]
        for i, st in enumerate(steps, 1):
            o, refs, p = st[0], st[1], st[2]
            if SHEET.search(p) and "SPACING (required)" not in p: p = p.rstrip() + GAP
            opaque = len(st) > 3 and st[3] == "OPAQUE"
            out.append(f"\n{'TASK' if brief else 'STEP'} {i}\nReference images: {', '.join(refs) if refs else '(none)'}\nOUTPUT: {o}\n"
                       f"{'Background: OPAQUE (do not request transparency)' if opaque else 'Background: transparent'}\n{'BRIEF' if brief else 'PROMPT'}:\n{p}\n")
        pathlib.Path(f"art/jobs/{name}.md").write_text("".join(out), encoding="utf-8")
        print(name, len(steps))

if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2:] or None)
