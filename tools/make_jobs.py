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

# A spec with MODE = "brief" (user 2026-10-23: GPT is an LLM, not a diffusion model - tell it what is wanted; let it write its own prompts,
# look at what it got and draw again; it must not add anything, soften the horror, use its prompt template or copy its own earlier tries).
# What is sent is only how to work and what to draw: no dates, no user quotes, no history, no reasons - Codex starts from nothing every time
# (user 2026-10-23: meta in the prompt is noise, as if GPT were chatting with you).
HEAD_BRIEF = """Make the images below with your image generation tool and save them. For each TASK:
- Read the brief and look at the reference images; take from each only what the brief says.
- Write the image prompt from the brief's content only. Add nothing that is not in it. Do not use a prompt template.
- Blood, gore and horror as described are intended: keep them as described. If the tool refuses, save its message to OUTPUT with the extension .refused.txt.
- Generate, then look at the result at full size: drawing mistakes (smudges, melted parts, doubled lines, stray fragments), anything cut off, the background, and every requirement of the brief. A monster does not have to be realistic or anatomically correct. If something is wrong, generate again from the task's reference images only - never from your own earlier results. At most 6 attempts; keep the best.
- Save the final PNG to OUTPUT (relative to the working directory); keep the transparency when the background is transparent. Do not write code or any other file.
At the end reply with one line per task: path, size, attempts, problems left.
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
