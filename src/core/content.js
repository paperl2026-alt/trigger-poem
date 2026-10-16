// Content packs. The game itself is the "base" pack (public/content/base). DLC and Workshop packs use exactly the same
// format and load on top of it, so the code never hard-codes game data: it reads C.* at use time, after loadContent().
//
//   <pack>/pack.json   { id, name, version, order, enabled, requires: [ids], data: { <category>: [files] }, assets: "assets/manifest.json" }
//
// Categories:
//   collections  characters enemies projectiles bosses items episodes comics sets
//                every file is a map  id -> entry.  A later pack's entry with an id that already exists is deep-merged
//                over it (a mod can change a single number); a new id adds a new entry.
//   objects      tuning text theme ui — plain objects, deep-merged the same way (ui = screen layouts).
//   Arrays are always replaced, never merged.
// Assets: each pack's manifest maps keys ("enemy/zomb_w0") to files relative to the pack; a later pack with the same key
// replaces the image (re-skin mods).
// Where packs come from: the base pack in the build, then every folder in "mods" (next to the exe, or the project root
// in development), listed by /__mods.json and loaded in pack.order (then id) order.
// Broken or missing files never stop the game: problems are collected in C.errors (shown in the debug menu).

export const COLLECTIONS = ['characters', 'enemies', 'projectiles', 'bosses', 'items', 'episodes', 'comics', 'sets'];
export const OBJECTS = ['tuning', 'text', 'theme', 'ui'];

export const C = { packs: [], assets: {}, errors: [] };
for (const k of [...COLLECTIONS, ...OBJECTS]) C[k] = {};

// defaults: an entry from any pack is laid over these, so a missing field never crashes the game
const DEFAULTS = {
  characters: { order: 99, color: '#ffffff', edge: [0, 0, 0], poses: {}, cam: {}, anchor: {}, muzzle: {}, soft: {}, size: { pose: 'aim', h: 1.6 },
    weapon: { kind: 'rifle', rate: 0.1, dmg: 10, mag: 30, reload: 1.2, spread: 0.006, pierce: 0, stagger: 3, stun: 0.5, ramp: 0, rampMax: 0, sfx: 'smg', kick: 1, tracer: '#ffffff' },
    active: { kind: 'gatling', dur: 5, charge: {} } },
  enemies: { beh: 'walker', hp: 50, h: 1.5, speed: 1.5, windup: 0.9, poise: 20, frames: {}, params: {} },
  projectiles: { keys: [], size: 0.8, spin: 0 },
  bosses: { hp: 2000, poise: 300, h: 8, eyeMul: 1.5, bodyMul: 0.75 },
  items: { order: 99, cost: 1, price: 100, effects: {} },
  episodes: { steps: [], unlocks: [] },
  comics: [],
  sets: {},
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
export function merge(a, b) {
  if (!isObj(a) || !isObj(b)) return structuredClone(b);
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = isObj(v) && isObj(a[k]) ? merge(a[k], v) : structuredClone(v);
  return out;
}
// "#rrggbb" -> 0xrrggbb (three.js / WebGL colours)
export const hexNum = (v) => (typeof v === 'string' && v[0] === '#' ? parseInt(v.slice(1), 16) : v);

// entries of a collection in display order (order / no, then id)
export function list(cat) {
  return Object.values(C[cat]).sort((a, b) => (a.order ?? a.no ?? 99) - (b.order ?? b.no ?? 99) || String(a.id).localeCompare(String(b.id)));
}
export const T = C.tuning; // shorthand: T.combat, T.fever, T.economy ...

// portable build: every content file is embedded as window.__NOA_CONTENT[url]
const EMB = typeof window !== 'undefined' ? window.__NOA_CONTENT : null;
async function getJson(url) {
  if (EMB) { if (!(url in EMB)) throw new Error(`not embedded: ${url}`); return structuredClone(EMB[url]); }
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
const note = (msg) => { C.errors.push(msg); console.warn('[content]', msg); };

async function loadPack(base) {
  const pack = await getJson(`${base}pack.json`);
  pack.base = base;
  for (const req of pack.requires || []) if (!C.packs.some((p) => p.id === req)) { note(`${pack.id}: needs pack "${req}", skipped`); return; }
  for (const [cat, files] of Object.entries(pack.data || {})) {
    if (!C[cat] || cat === 'packs' || cat === 'assets' || cat === 'errors') { note(`${pack.id}: unknown category "${cat}"`); continue; }
    for (const f of files) {
      let d;
      try { d = await getJson(base + f); } catch (e) { note(`${pack.id}/${f}: ${e.message}`); continue; }
      for (const [id, v] of Object.entries(d)) {
        if (id.startsWith('_')) continue; // "_doc" etc.: comments for people editing the file
        C[cat][id] = C[cat][id] === undefined ? structuredClone(v) : merge(C[cat][id], v);
      }
    }
  }
  if (pack.assets) {
    try {
      const m = await getJson(base + pack.assets);
      // src paths are relative to the pack folder
      for (const [k, e] of Object.entries(m)) C.assets[k] = { ...e, url: /^(data:|https?:|\/)/.test(e.src) ? e.src : base + e.src };
    } catch (e) { note(`${pack.id}/${pack.assets}: ${e.message}`); }
  }
  C.packs.push(pack);
}

// fill defaults + normalise colours after all packs are in
function finish() {
  for (const cat of COLLECTIONS) {
    for (const [id, e] of Object.entries(C[cat])) {
      C[cat][id] = Array.isArray(e) ? e : merge(DEFAULTS[cat] || {}, e);
      if (!Array.isArray(e)) C[cat][id].id = id;
    }
  }
  for (const c of Object.values(C.characters)) { c.hex = hexNum(c.color); c.weapon.tracer = hexNum(c.weapon.tracer); }
  if (C.theme.threat) for (const k in C.theme.threat) C.theme.threat[k] = hexNum(C.theme.threat[k]);
}

export async function loadContent(baseUrl = '') {
  await loadPack(`${baseUrl}content/base/`);
  let mods = [];
  try { mods = EMB ? [] : await getJson(`${baseUrl}__mods.json`); } catch (e) { /* no mods folder */ }
  const packs = [];
  for (const id of mods) {
    try { const p = await getJson(`${baseUrl}mods/${id}/pack.json`); if (p.enabled !== false) packs.push({ id, order: p.order ?? 100 }); } catch (e) { note(`mods/${id}: ${e.message}`); }
  }
  packs.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  for (const p of packs) {
    try { await loadPack(`${baseUrl}mods/${p.id}/`); } catch (e) { note(`mods/${p.id}: ${e.message}`); }
  }
  finish();
  return C;
}
