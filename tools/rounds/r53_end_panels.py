# The ending page (R53b page_end_b) is a plain 3 x 2 grid with an all-black panel that tools/comic_panels.py cannot see: its six panels
# are written by hand (gutters measured on the picture). Run after tools/rounds/r53_import.py comics.
# usage: python -I tools/rounds/r53_end_panels.py
import json, pathlib
p = pathlib.Path("public/content/base/comics.json"); raw = p.read_bytes(); crlf = b"\r\n" in raw; c = json.loads(raw.decode("utf-8"))
W, H = 1672, 941
xs = [(6, 550), (557, 1115), (1122, 1667)]; ys = [(6, 575), (579, 937)]
INS, KBS = ["punch", "slideL", "drop", "slideR"], ["in", "up", "out", "left"]
panels = []
for r, (y0, y1) in enumerate(ys):
    for (x0, x1) in xs:
        X0, X1, Y0, Y1 = round(x0 / W * 100, 2), round(x1 / W * 100, 2), round(y0 / H * 100, 2), round(y1 / H * 100, 2)
        i = len(panels)
        panels.append({"poly": [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], "at": round(0.15 + i, 2), "in": INS[i % 4], "kb": KBS[i % 4]})
panels[3]["at"] = panels[2]["at"] + 1.4   # the black panel holds a beat longer before the figure at the window
for q in panels[4:]: q["at"] += 0.4
c["ep1_end"][0]["panels"] = panels
t = json.dumps(c, ensure_ascii=False, indent=1) + "\n"
p.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
print("ok", len(panels))
