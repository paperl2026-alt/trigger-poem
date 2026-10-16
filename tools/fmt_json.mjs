// Re-indents content JSON so it stays easy to read and edit by hand: anything that fits on one line
// (number arrays, a spawn entry, a soft region) is kept on one line, bigger things are expanded.
// usage: node tools/fmt_json.mjs [dir-or-file ...]   (default: public/content)
import fs from 'node:fs';
import path from 'node:path';

const WIDTH = 140;
// one-line form with a space after commas and colons (strings are left exactly as they are)
function oneLine(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(oneLine).join(', ')}]`;
  if (!Object.keys(v).length) return '{}';
  return `{ ${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${oneLine(x)}`).join(', ')} }`;
}
function fmt(v, ind = '') {
  const one = oneLine(v);
  if (v === null || typeof v !== 'object' || one.length + ind.length <= WIDTH) return one;
  const next = ind + '  ';
  if (Array.isArray(v)) return `[\n${v.map((x) => next + fmt(x, next)).join(',\n')}\n${ind}]`;
  return `{\n${Object.entries(v).map(([k, x]) => `${next}${JSON.stringify(k)}: ${fmt(x, next)}`).join(',\n')}\n${ind}}`;
}
function walk(p) {
  if (fs.statSync(p).isDirectory()) { for (const f of fs.readdirSync(p)) if (f !== 'assets') walk(path.join(p, f)); return; }
  if (!p.endsWith('.json')) return;
  const s = fs.readFileSync(p, 'utf8');
  const o = JSON.parse(s);
  const t = fmt(o) + '\n';
  if (t !== s) { fs.writeFileSync(p, t); console.log('formatted', p); }
}
const args = process.argv.slice(2);
for (const a of args.length ? args : ['public/content']) walk(a);
