// Loads the content exactly as the game does (src/core/content.js loadContent: the base pack, its level packs, the mods) from the files on
// disk and writes what the game would end up with (C) as one JSON - to compare two layouts of the same content (tools/level_packs.py:
// before / after moving a chapter into its level pack nothing may change but where the files are).
// usage: node tools/node/dump_content.mjs <out.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const pub = path.join(root, 'public');
globalThis.fetch = async (url) => {
  const f = path.join(pub, decodeURIComponent(String(url)));
  if (!fs.existsSync(f)) return { ok: false, status: 404, json: async () => null };
  const t = fs.readFileSync(f, 'utf8');
  return { ok: true, status: 200, json: async () => JSON.parse(t) };
};
const { C, loadContent } = await import(pathToFileURL(path.join(root, 'src/core/content.js')).href);
await loadContent('');
// urls are compared by the file they point at (the same picture moved to a level pack has a new url, which is the point)
const real = (u) => { const f = path.join(pub, u); return fs.existsSync(f) ? `${fs.statSync(f).size}:${path.basename(u)}` : `MISSING:${u}`; };
const out = {};
for (const [k, v] of Object.entries(C)) {
  if (k === 'packs') { out.packs = v.map((p) => p.id); continue; }
  if (k === 'assets') { out.assets = Object.fromEntries(Object.entries(v).sort().map(([kk, e]) => { const { url, src, ...rest } = e; return [kk, { ...rest, file: real(url) }]; })); continue; }
  out[k] = v;
}
// sound files: the url they resolve to -> the file they point at
const fix = (o) => {
  if (Array.isArray(o)) return o.map(fix);
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fix(v)]));
  if (typeof o === 'string' && /\.(ogg|wav|mp3)$/.test(o)) return real(o);
  return o;
};
out.sounds = fix(out.sounds);
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('content:', Object.keys(out.assets).length, 'pictures,', out.errors.length, 'errors', out.errors.slice(0, 5));
