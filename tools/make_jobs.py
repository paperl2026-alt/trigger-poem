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

def build(specs_path, only=None):
    spec = importlib.util.spec_from_file_location("specs", specs_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    for name, steps in mod.JOBS.items():
        if only and name not in only:
            continue
        out = [HEAD]
        for i, st in enumerate(steps, 1):
            o, refs, p = st[0], st[1], st[2]
            if SHEET.search(p) and "SPACING (required)" not in p: p = p.rstrip() + GAP
            opaque = len(st) > 3 and st[3] == "OPAQUE"
            out.append(f"\nSTEP {i}\nReference images: {', '.join(refs) if refs else '(none)'}\nOUTPUT: {o}\n{'Background: OPAQUE (do not request transparency)' if opaque else 'Background: transparent'}\nPROMPT:\n{p}\n")
        pathlib.Path(f"art/jobs/{name}.md").write_text("".join(out), encoding="utf-8")
        print(name, len(steps))

if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2:] or None)
