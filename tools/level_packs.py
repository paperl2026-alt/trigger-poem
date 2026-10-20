"""Level packs (docs/TECH.md「关卡包」; user 2026-10-20: every level its own asset index and config tables, read when it loads - good for
DLC later too): one pack per chapter, public/content/base/levels/<ep>/ - level.json (like pack.json: its data files and its manifest),
episode.json, sets.json, comics.json, bosses.json, enemies.json, projectiles.json (only what is its own) and assets/ with its pictures.
  migrate   moves the chapters out of the base pack, once: an entry (set, comic, boss, monster, shot) goes to the chapter whose episode is
            the only one reaching it; a picture goes where the only content using it is (or, used by nothing, a chapter's own key like
            ep1/… goes to that chapter); everything shared stays in the base pack. Keys and ids stay the same, only files move.
  sync      after a tool that still writes into the base pack: moves the chapter's own new pictures into its level pack (tools/packs.py)
  check     every manifest entry's file is there, no key in two packs, every data file a pack lists exists
usage: python -I tools/level_packs.py migrate | sync | check"""
import json, pathlib, shutil, sys
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "tools")]
import packs  # noqa: E402
from packs import BASE, load, dump  # noqa: E402

CATS = ["sets", "comics", "bosses", "enemies", "projectiles"]
MOVE = ["episodes", *CATS]
SKIP = {"_doc", "beh", "name", "title", "sub", "blurb", "texts"}   # (groups.js SKIP, but a chapter's cover / thumb are its own)
FILE = {"episodes": "episode.json", "sets": "sets.json", "comics": "comics.json", "bosses": "bosses.json", "enemies": "enemies.json", "projectiles": "projectiles.json"}


def base_data():
    P = load(BASE / "pack.json"); D = {}; src = defaultdict(dict)   # src[cat][id] = the file it came from
    for cat, files in P["data"].items():
        D.setdefault(cat, {})
        for f in files:
            d = load(BASE / f)
            for k, v in d.items():
                if k.startswith("_"): continue
                D[cat][k] = v; src[cat][k] = f
    return P, D, src


def walker(D, man):
    def add(k, keys):
        if k not in man or k in keys: return
        keys.add(k)
        if man[k].get("relief"): add(man[k]["relief"], keys)
        add(f"{k}_x", keys)

    def collect(o, keys, seen):
        if isinstance(o, str):
            add(o, keys)
            for cat in CATS:
                d = D.get(cat, {}).get(o)
                if d is None or f"{cat}:{o}" in seen: continue
                seen.add(f"{cat}:{o}")
                collect(d, keys, seen)
                if cat == "enemies":
                    fr = {d.get("first"), *[x for v in (d.get("frames") or {}).values() for x in (v if isinstance(v, list) else [v])]}
                    for v in d.get("variants") or [d.get("sprite", o)]:
                        for f in fr:
                            if f: add(f"enemy/{v}_{f}", keys)
                if cat == "projectiles":
                    for k in d.get("keys", []): add(f"enemy/{k}", keys)
                if cat == "bosses":
                    pre = f"{d.get('sprite') or f'boss/{o}'}_"
                    for k in man:
                        if k.startswith(pre): add(k, keys)
            return
        if isinstance(o, list):
            for v in o: collect(v, keys, seen)
            return
        if isinstance(o, dict):
            for k, v in o.items():
                if k not in SKIP: collect(v, keys, seen)
    return collect


def migrate():
    if packs.levels(): sys.exit("already migrated (pack.json has levels)")
    P, D, src = base_data()
    man = load(BASE / "assets" / "manifest.json")
    collect = walker(D, man)
    eps = [k for k, e in D["episodes"].items() if not e.get("debug") and not e.get("hidden")]
    keys, reach = {}, {}
    for ep in eps:
        keys[ep], reach[ep] = set(), set(); collect(D["episodes"][ep], keys[ep], reach[ep])
    # what the base pack itself still uses: the heroines, items, screens, theme, tuning, text, the debug chapters
    bk, br = set(), set()
    for cat in ["characters", "items", "ui", "theme", "tuning", "text"]:
        collect(D.get(cat, {}), bk, br)
    for k, e in D["episodes"].items():
        if k not in eps: collect(e, bk, br)
    by = defaultdict(set)
    for ep in eps:
        for r in reach[ep]: by[r].add(ep)
    for r in br: by[r].add("base")
    own = {}   # "cat:id" -> chapter
    for ep in eps: own[f"episodes:{ep}"] = ep
    for r, who in by.items():
        if len(who) == 1 and "base" not in who: own[r] = next(iter(who))
    # entries nobody reaches stay in the base pack; their pictures count as the base pack's
    for cat in CATS:
        for k in D.get(cat, {}):
            if f"{cat}:{k}" not in by: collect(k, bk, set())
    used = defaultdict(set)
    for ep in eps:
        for k in keys[ep]: used[k].add(ep)
    for k in bk: used[k].add("base")
    pic = {}
    for k in man:
        u = used.get(k, set())
        if packs.chapter_of(k) in eps: pic[k] = packs.chapter_of(k)   # (a chapter's own key is always in its pack: packs.sync)
        elif len(u) == 1 and "base" not in u: pic[k] = next(iter(u))
    # keys sharing one file go together: to the chapter one of them is named for, else the base pack
    files = defaultdict(list)
    for k, e in man.items(): files[e["src"]].append(k)
    for ks in files.values():
        if len({pic.get(k, "base") for k in ks}) < 2: continue
        named = [packs.chapter_of(k) for k in ks if packs.chapter_of(k) in eps]
        for k in ks:
            if named: pic[k] = named[0]
            else: pic.pop(k, None)

    # ---- write the level packs
    order = {ep: i + 1 for i, ep in enumerate(sorted(eps, key=lambda e: D["episodes"][e].get("no", 99)))}
    for ep in eps:
        d = packs.pack_dir(ep); d.mkdir(parents=True, exist_ok=True)
        data = {}
        for cat in MOVE:
            ids = [k for k in D.get(cat, {}) if own.get(f"{cat}:{k}") == ep]
            if not ids: continue
            out = {"_doc": f"第 {D['episodes'][ep].get('no', ep)} 话关卡包的 {cat}（格式和本体的同名文件一样，docs/TECH.md「关卡包」）。"}
            for k in ids: out[k] = D[cat][k]
            dump(d / FILE[cat], out); data[cat] = [FILE[cat]]
        m = {k: man[k] for k in sorted(man) if pic.get(k) == ep}
        for k, e in m.items():
            s, t = BASE / e["src"], d / e["src"]
            if s.exists(): t.parent.mkdir(parents=True, exist_ok=True); shutil.move(str(s), str(t))
        dump(d / "assets" / "manifest.json", m, manifest=True)
        E = D["episodes"][ep]
        dump(d / "level.json", {
            "_doc": "关卡包（docs/TECH.md「关卡包」）：一话的流程、场景、漫画、Boss、只有这一话出现的怪和飞行物，和它自己的图（assets/manifest.json，src 相对这个文件夹，key 和本体一样）。格式和 pack.json 一样，本体载入后接着载入；模组 / DLC 也可以带自己的关卡包。",
            "id": ep, "name": E.get("title", {}), "version": "0.1.0", "order": order[ep], "requires": ["base"],
            "data": data, "assets": "assets/manifest.json"})
        print(ep, {c: len(v) for c, v in ((c, [k for k in D.get(c, {}) if own.get(f'{c}:{k}') == ep]) for c in MOVE)}, len(m), "pictures")
    # ---- the base pack without them
    left = {k: e for k, e in man.items() if k not in pic}
    dump(BASE / "assets" / "manifest.json", left, manifest=True)
    for cat in MOVE:
        for f in list(P["data"].get(cat, [])):
            d = load(BASE / f); keep = {k: v for k, v in d.items() if k.startswith("_") or own.get(f"{cat}:{k}") is None}
            if len([k for k in keep if not k.startswith("_")]) == 0:
                (BASE / f).unlink(); P["data"][cat].remove(f)
            elif len(keep) != len(d):
                dump(BASE / f, keep)
    P["levels"] = [f"levels/{ep}" for ep in sorted(eps, key=lambda e: order[e])]
    dump(BASE / "pack.json", P)
    print("base keeps", len(left), "pictures")


def check():
    bad = 0; seen = {}
    for pid in packs.packs():
        PF = load(packs.pack_file(pid)); d = packs.pack_dir(pid)
        for cat, fs in PF.get("data", {}).items():
            for f in fs:
                if not (d / f).exists(): print("missing data file", pid, f); bad += 1
        mf = d / PF.get("assets", "assets/manifest.json")
        m = load(mf) if mf.exists() else {}
        for k, e in m.items():
            if k in seen: print("key in two packs", k, seen[k], pid); bad += 1
            seen[k] = pid
            if not (d / e["src"]).exists(): print("missing file", pid, k, e["src"]); bad += 1
            if pid == "base" and packs.chapter_of(k) in packs.levels(): print("a chapter's own key in the base pack (run sync)", k); bad += 1
    print("check:", "ok" if not bad else f"{bad} problems", len(seen), "pictures in", len(packs.packs()), "packs")
    return bad


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
    if cmd == "migrate": migrate(); check()
    elif cmd == "sync": packs.sync(); check()
    else: sys.exit(1 if check() else 0)
