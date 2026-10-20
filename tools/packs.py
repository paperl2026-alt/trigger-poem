"""Where the content lives (docs/TECH.md「关卡包」): the base pack public/content/base and, inside it, one level pack per chapter
levels/<id>/ (a pack of its own: level.json lists its data files like pack.json, assets/manifest.json its pictures; src paths are relative
to the pack folder, keys are the same everywhere). Tools read and write content through this module, never through a fixed path:
  manifest()          every pack's pictures as one dict-like view: m[key] -> entry, m.path(key) -> the file on disk, m[key] = entry adds
                      or changes a key in the pack it belongs to (owner), m.put(key, entry, like=other) a new key into other's pack,
                      m.dir(key) -> the folder its src is relative to, m.save()
  owner(key)          the pack a key belongs in: where it already is; else a chapter's own key (ep1/…, cover/ep1_…, prop/ep2s_…) -> that
                      chapter's level pack if there is one; else the base pack
  pack_dir(pid)       a pack's folder ('base' or a level id)
  data_file(cat, id)  the file an entry is in (sets ep1_mine -> levels/ep1/sets.json); new_file(cat, id) where a new one goes
  load(p) / dump(p, d)  JSON: dump keeps the file's line endings and formats it like the hand-made files (fmt_json); manifests stay sorted
  sync()              tools that still write the old way (into the base pack's assets and manifest): moves every key that belongs to a
                      chapter, with its file, into that chapter's level pack. Idempotent; tools/level_packs.py sync runs it
"""
import json, pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = ROOT / "public" / "content" / "base"
sys.path[:0] = [str(ROOT / "tools")]
from fmt_json import fmt  # noqa: E402

OWN = re.compile(r"^(?:[^/]+/)?(ep\d+)[a-z]?[_/]")   # ep1/…, cover/ep1_…, prop/ep2s_… (a chapter's own pictures)


def load(p):
    return json.loads(pathlib.Path(p).read_bytes().decode("utf-8"))


def dump(p, d, manifest=False):
    p = pathlib.Path(p); p.parent.mkdir(parents=True, exist_ok=True)
    crlf = p.exists() and b"\r\n" in p.read_bytes()
    t = (json.dumps(d, indent=1, sort_keys=True) if manifest else fmt(d)) + "\n"
    p.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))


def levels():
    """the level pack ids, in the order pack.json lists them"""
    return [pathlib.PurePosixPath(l).name for l in load(BASE / "pack.json").get("levels", [])]


def pack_dir(pid):
    return BASE if pid == "base" else BASE / "levels" / pid


def pack_file(pid):
    return BASE / "pack.json" if pid == "base" else pack_dir(pid) / "level.json"


def packs():
    return ["base", *levels()]


def chapter_of(key):
    m = OWN.match(key)
    return m.group(1) if m else None


class Manifest:
    def __init__(self):
        self.pk = {}       # pack id -> its manifest dict
        self.where = {}    # key -> pack id
        self.dirty = set()
        for pid in packs():
            f = pack_dir(pid) / "assets" / "manifest.json"
            self.pk[pid] = load(f) if f.exists() else {}
            for k in self.pk[pid]: self.where.setdefault(k, pid)
            if pid != "base": self.where.update({k: pid for k in self.pk[pid]})

    def owner(self, key):
        if key in self.where: return self.where[key]
        ch = chapter_of(key)
        return ch if ch in self.pk else "base"

    def __contains__(self, key): return key in self.where
    def __getitem__(self, key): return self.pk[self.where[key]][key]
    def get(self, key, d=None): return self[key] if key in self else d
    def keys(self): return self.where.keys()
    def items(self): return ((k, self[k]) for k in self.where)
    def __iter__(self): return iter(self.where)
    def __len__(self): return len(self.where)

    def __setitem__(self, key, entry):
        pid = self.owner(key)
        self.pk[pid][key] = entry; self.where[key] = pid; self.dirty.add(pid)

    def put(self, key, entry, like=None):
        """a key that goes with another one (a picture's relief, its _x version): into that one's pack when it is new"""
        pid = self.where.get(key) or (self.owner(like) if like else self.owner(key))
        self.pk[pid][key] = entry; self.where[key] = pid; self.dirty.add(pid)

    def setdefault(self, key, entry):
        if key not in self: self[key] = entry
        return self[key]

    def pop(self, key, *d):
        if key not in self.where: return d[0] if d else None
        pid = self.where.pop(key); self.dirty.add(pid); return self.pk[pid].pop(key)

    def dir(self, key):
        """the folder a key's src is relative to (its pack's folder): where to write its file"""
        return pack_dir(self.owner(key))

    def path(self, key):
        return self.dir(key) / self[key]["src"]

    def save(self):
        for pid in sorted(self.dirty): dump(pack_dir(pid) / "assets" / "manifest.json", self.pk[pid], manifest=True)
        self.dirty.clear()


def manifest():
    return Manifest()


def data_files(pid, cat):
    P = load(pack_file(pid))
    return [pack_dir(pid) / f for f in P.get("data", {}).get(cat, [])]


def data_file(cat, id):
    """the file holding entry <id> of a category (the last pack that has it: a level pack's entry wins)"""
    hit = None
    for pid in packs():
        for f in data_files(pid, cat):
            if f.exists() and id in load(f): hit = f
    return hit


def collection(cat):
    """a category as the game sees it: every pack's entries, a later pack's over an earlier one's (whole entries, no deep merge)"""
    out = {}
    for pid in packs():
        for f in data_files(pid, cat):
            if f.exists(): out.update({k: v for k, v in load(f).items() if not k.startswith("_")})
    return out


def new_file(cat, id):
    """where a new entry goes: an existing file with it; else the chapter's level pack (an id like ep1_…) if it has a file of that category"""
    f = data_file(cat, id)
    if f: return f
    ch = chapter_of(id) or (id if id in levels() else None)
    if ch in levels():
        fs = data_files(ch, cat)
        if fs: return fs[0]
    fs = data_files("base", cat)
    return fs[0] if fs else None


def sync(verbose=True):
    """keys a tool wrote into the base pack that belong to a chapter's level pack: move them (manifest entry and file)"""
    m = manifest(); moved = 0
    for key in [k for k, pid in m.where.items() if pid == "base"]:
        ch = chapter_of(key)
        if ch not in m.pk: continue
        e = m.pk["base"].pop(key); src = BASE / e["src"]; dst = pack_dir(ch) / e["src"]
        if src.exists():
            dst.parent.mkdir(parents=True, exist_ok=True); shutil.move(str(src), str(dst))
        m.pk[ch][key] = e; m.where[key] = ch; m.dirty |= {"base", ch}; moved += 1
        if e.get("relief") and e["relief"] in m.where and m.where[e["relief"]] == "base":
            r = m.pk["base"].pop(e["relief"]); rs = BASE / r["src"]
            if rs.exists():
                (pack_dir(ch) / r["src"]).parent.mkdir(parents=True, exist_ok=True); shutil.move(str(rs), str(pack_dir(ch) / r["src"]))
            m.pk[ch][e["relief"]] = r; m.where[e["relief"]] = ch
    m.save()
    if verbose and moved: print(f"packs.sync: {moved} pictures moved into their level packs")
    return moved
