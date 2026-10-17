"""Unpacks downloaded sound-effect zips (docs/ART.md「声音」): every audio file inside goes to <out>/<zip name>/<file name> (no folders kept
from inside the zip, so nothing can land outside <out>). Only .mp3 / .ogg / .wav / .m4a; other files are skipped.
usage: python -I tools/sfx_unpack.py <out folder> <zip> [zip ...]"""
import sys, zipfile, pathlib, re

AUDIO = re.compile(r"\.(mp3|ogg|wav|m4a)$", re.I)

if __name__ == "__main__":
    out = pathlib.Path(sys.argv[1]).resolve()
    for z in sys.argv[2:]:
        z = pathlib.Path(z)
        dest = out / re.sub(r"[^A-Za-z0-9_.-]", "_", z.stem)
        dest.mkdir(parents=True, exist_ok=True)
        n = 0
        with zipfile.ZipFile(z) as f:
            for info in f.infolist():
                if info.is_dir(): continue
                raw = info.filename
                try: raw = raw.encode("cp437").decode("cp932")   # Japanese names in old zips
                except (UnicodeEncodeError, UnicodeDecodeError): pass
                name = re.sub(r'[\\/:*?"<>|]', "_", raw.replace("\\", "/").split("/")[-1])
                if not AUDIO.search(name): continue
                target = (dest / name).resolve()
                if target.parent != dest.resolve(): continue
                target.write_bytes(f.read(info)); n += 1
        print(f"{z.name}: {n} files -> {dest.relative_to(out)}")
