// Which pictures each stage needs (docs/TECH.md「图片按小关加载」). Every picture decodes to w × h × 4 bytes (+ mipmaps) whatever its
// file size, so the game never holds everything at once: the core (UI, HUD, effects, the heroines: whatever no stage claims) stays
// loaded; a stage's own pictures (its set, the monsters of its waves, their shots, its boss) are loaded before it starts and released
// after the next one has started (src/core/assets.js loadKeys / releaseExcept, src/battle/game.js). Worked out from the content itself,
// so a mod's new chapter is split the same way.
//   stageKeys(ep, st)  the pictures of one stage (an episodes.json step with stage / boss)
//   coreKeys()         the pictures no stage of any episode claims
//   stageKeysAt(ep, st, place)  a stage through several places (episode 2): only the place it is in and the next one (Game.streamPlaces)
import { C, isStage } from './content.js';
import { meta } from './assets.js';

// keys whose values are no picture and no id of other content (a behaviour named like a monster must not pull that monster in), and the
// select screen's pictures of a chapter (they belong to the core)
const SKIP = new Set(['_doc', 'beh', 'cover', 'thumb', 'name', 'title', 'sub', 'blurb', 'texts']);
const CATS = ['sets', 'comics', 'bosses', 'enemies', 'projectiles'];
const OWN = /^(?:[^/]+\/)?(ep\d+)[_/]/;   // ep1/…, cover/ep1_…, prop/ep1_…: a chapter's own pictures, used by its data or not

function add(k, keys) {
  if (!meta[k] || keys.has(k)) return;
  keys.add(k);
  if (meta[k].relief) add(meta[k].relief, keys);
  add(`${k}_x`, keys);   // the rotten / anomaly version a board flips to
}
function collect(o, keys, seen) {
  if (typeof o === 'string') {
    add(o, keys);
    for (const cat of CATS) {
      const d = C[cat]?.[o];
      if (!d || seen.has(`${cat}:${o}`)) continue;
      seen.add(`${cat}:${o}`);
      collect(d, keys, seen);
      if (cat === 'enemies') {
        const frames = new Set([d.first, ...Object.values(d.frames || {}).flat()]);
        for (const v of d.variants || [d.sprite]) for (const f of frames) add(`enemy/${v}_${f}`, keys);
      }
      if (cat === 'projectiles') for (const k of d.keys || []) add(`enemy/${k}`, keys);
      if (cat === 'bosses') { const pre = `${d.sprite || `boss/${o}`}_`; for (const k in meta) if (k.startsWith(pre)) add(k, keys); }
    }
    return;
  }
  if (Array.isArray(o)) { for (const v of o) collect(v, keys, seen); return; }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (!SKIP.has(k)) collect(v, keys, seen);
}

const cache = new Map();
export function stageKeys(ep, st) {
  const id = `${ep.id}:${ep.steps.indexOf(st)}`;
  if (cache.has(id)) return cache.get(id);
  const keys = new Set();
  collect({ ...st, set: st.set || ep.set }, keys, new Set());
  for (const k of [...keys]) if (k.startsWith('comic/')) keys.delete(k);   // (comic pages are shown as plain images, never textures)
  cache.set(id, keys);
  return keys;
}
// a stage through several places (an episodes.json step with places: episode 2's inn, ten of them; all held at once took ~1.9 GB of the
// graphics card): the boards, props and covers of the place it is in and of the next one; the monsters, their shots, her forms and
// whatever no place claims stay for the whole stage. Game.streamPlaces lets the places behind go and loads the next one as they walk on
const setCache = new Map();
export function setKeys(id) { if (!setCache.has(id)) { const keys = new Set(); collect(id, keys, new Set()); setCache.set(id, keys); } return setCache.get(id); }
export const placeOf = (st, station) => st.places?.find((p) => C.sets[p]?.stations?.[station]) || st.places?.[0];
export function stageKeysAt(ep, st, place) {
  const all = stageKeys(ep, st);
  if (!st.places?.length) return all;
  const i = Math.max(0, st.places.indexOf(place)), near = new Set(st.places.slice(i, i + 2).flatMap((p) => [...setKeys(p)]));
  return new Set([...all].filter((k) => near.has(k) || k.startsWith('enemy/') || !st.places.some((p) => setKeys(p).has(k))));
}
// the pictures of the outfits the team is wearing (characters/<id>.json rigs, e.g. the yukata: user 2026-10-18): outfit/… pictures are
// never core, they load only when worn. outfitOf(id) = the outfit a girl wears (SAVE.chars[id].outfit)
export function outfitKeys(team, outfitOf) {
  const keys = new Set();
  for (const id of team || []) { const R = C.characters[id]?.rigs?.[outfitOf(id)]; if (R) for (const P of Object.values(R)) for (const k of [P.img, ...(P.w || [])]) add(k, keys); }
  return keys;
}
// the next stage from step i on (a run starting on a comic page or a door starts loading the stage after it)
export const stageFrom = (ep, i) => ep.steps.slice(Math.max(0, i)).find(isStage) || null;
// the stage whose place a run starting at step i is in: the next one, or after the last one (the ending comic) the last one
export const stageAt = (ep, i) => stageFrom(ep, i) || ep.steps.slice(0, Math.max(0, i)).reverse().find(isStage) || null;

let core = null;
export function coreKeys() {
  if (core) return core;
  const claimed = new Set();
  for (const ep of Object.values(C.episodes)) for (const st of ep.steps || []) if (isStage(st)) for (const k of stageKeys(ep, st)) claimed.add(k);
  core = new Set(Object.keys(meta).filter((k) => !claimed.has(k) && !OWN.test(k) && !k.startsWith('comic/') && !k.startsWith('outfit/')));
  // a chapter's own pictures that no stage of it uses yet stay out of the core too (OWN), and so does everything only old data uses
  const data = new Set();
  for (const cat of CATS) for (const id of Object.keys(C[cat] || {})) collect(id, data, new Set());
  for (const k of data) if (!claimed.has(k)) core.delete(k);
  return core;
}
