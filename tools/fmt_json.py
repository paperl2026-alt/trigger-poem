"""Write content JSON the way the hand-made files look: two-space indent, small objects and lists of plain values on one line
({ "zh": "...", "en": "..." }), long ones broken over lines. Keeps the file's line endings.
usage: python -I tools/fmt_json.py <file.json> ..."""
import sys, json, pathlib

WIDTH = 150


def inline(v):
    if isinstance(v, dict):
        return "{ " + ", ".join(f"{json.dumps(k, ensure_ascii=False)}: {inline(x)}" for k, x in v.items()) + " }" if v else "{}"
    if isinstance(v, list):
        return "[" + ", ".join(inline(x) for x in v) + "]"
    return json.dumps(v, ensure_ascii=False)


def flat(v):   # only plain values (or small plain objects) inside
    if isinstance(v, dict): return all(not isinstance(x, (dict, list)) or (flat(x) and len(inline(x)) < 60) for x in v.values())
    if isinstance(v, list): return all(not isinstance(x, (dict, list)) or (flat(x) and len(inline(x)) < 60) for x in v)
    return True


def fmt(v, ind=0):
    pad = "  " * (ind + 1)
    if isinstance(v, (dict, list)) and flat(v) and len(inline(v)) + ind * 2 < WIDTH:
        return inline(v)
    if isinstance(v, dict):
        return "{\n" + ",\n".join(f"{pad}{json.dumps(k, ensure_ascii=False)}: {fmt(x, ind + 1)}" for k, x in v.items()) + "\n" + "  " * ind + "}"
    if isinstance(v, list):
        return "[\n" + ",\n".join(f"{pad}{fmt(x, ind + 1)}" for x in v) + "\n" + "  " * ind + "]"
    return json.dumps(v, ensure_ascii=False)


if __name__ == "__main__":
    for f in sys.argv[1:]:
        p = pathlib.Path(f); b = p.read_bytes(); crlf = b"\r\n" in b
        out = fmt(json.loads(b.decode("utf-8"))) + "\n"
        assert json.loads(out) == json.loads(b.decode("utf-8"))
        p.write_bytes((out.replace("\n", "\r\n") if crlf else out).encode("utf-8"))
        print(f)
