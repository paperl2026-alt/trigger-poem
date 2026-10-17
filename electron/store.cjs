// Save files for the desktop build (docs/TECH.md「存档文件」). Every save is written to TWO places:
//   absolute: <user data>/saves  (%APPDATA%/Trigger Poem/saves: always writable; the folder Steam Cloud syncs)
//   relative: <folder of the exe>/saves  (next to the game; skipped quietly when the install folder is not writable)
// Each write goes to a temporary file first and is renamed into place (a crash mid-write never leaves half a file); the last three
// versions are kept beside it (<name>.bak1..3.json). A file carries a running number and a checksum; reading takes every copy in both
// places, drops the ones that do not parse or do not match their checksum, and returns the newest (highest number). So a broken or
// missing file in one place is covered by the other, or by an older version.
const fs = require('node:fs');
const path = require('node:path');

const KEEP = 3;
// FNV-1a, 32 bit: enough to tell a damaged file from a good one
function sum(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); }
const NAME = /^[a-z0-9._-]+$/i;

class Store {
  constructor(dirs) { this.dirs = dirs.map((d) => ({ dir: d, ok: null, err: null })); this.seq = {}; }
  file(dir, name, k = 0) { return path.join(dir, k ? `${name}.bak${k}.json` : `${name}.json`); }
  // every valid copy of a save, newest first: { data, seq, time, from }
  copies(name) {
    if (!NAME.test(name)) return [];
    const out = [];
    for (const D of this.dirs) for (let k = 0; k <= KEEP; k++) {
      const f = this.file(D.dir, name, k);
      try {
        const env = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (env && typeof env.data === 'string' && env.sum === sum(env.data)) { JSON.parse(env.data); out.push({ data: env.data, seq: env.seq || 0, time: env.time || '', from: f }); }
      } catch (e) { /* missing or broken: the other copies cover it */ }
    }
    return out.sort((a, b) => b.seq - a.seq || (b.time > a.time ? 1 : -1));
  }
  read(name) {
    const c = this.copies(name);
    this.seq[name] = Math.max(this.seq[name] || 0, c[0]?.seq || 0);
    return c[0] || null;
  }
  write(name, data) {
    if (!NAME.test(name) || typeof data !== 'string') return [];
    if (this.seq[name] == null) this.read(name);
    const seq = (this.seq[name] || 0) + 1; this.seq[name] = seq;
    const text = JSON.stringify({ game: 'trigger-poem', name, seq, time: new Date().toISOString(), sum: sum(data), data });
    const done = [];
    for (const D of this.dirs) {
      try {
        fs.mkdirSync(D.dir, { recursive: true });
        for (let k = KEEP; k >= 1; k--) {   // the older versions move one step back
          const from = this.file(D.dir, name, k - 1), to = this.file(D.dir, name, k);
          if (fs.existsSync(from)) fs.copyFileSync(from, to);
        }
        const tmp = `${this.file(D.dir, name)}.tmp`;
        fs.writeFileSync(tmp, text, 'utf8');
        fs.renameSync(tmp, this.file(D.dir, name));
        D.ok = true; D.err = null; done.push(D.dir);
      } catch (e) { D.ok = false; D.err = String(e.code || e.message); }
    }
    return done;
  }
  status() { return this.dirs.map((D) => ({ dir: D.dir, ok: D.ok, err: D.err })); }
}
module.exports = { Store, sum };
