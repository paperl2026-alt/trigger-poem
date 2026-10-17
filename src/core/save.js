// The one save file: currency (伍德刀盾), unlocked episodes / items / characters, backpack loadout, mastery.
// Everything unlocked is permanent; there are no consumables and no other currencies.
// The starting save and the mastery table are content (tuning/economy.json); items and the bag: battle/items.js.
//
// initSave() runs once the content packs are loaded.
import { C, T } from './content.js';
import { readStored, writeStored } from './store.js';

const KEY = 'noa.save.v1';   // (the localStorage copy; the desktop build's files: core/store.js)
// the save's format version. When a change needs old saves converted: raise it and add the step to MIGRATE; before converting, the
// old save is kept as it was (a file "save.v<old>", docs/TECH.md「存档文件」), so a development step can always be gone back to.
export const SAVE_VERSION = 2;
const MIGRATE = {
  1: (s) => s,   // 1 -> 2: the bag became files + versions; nothing in the save itself changed
};
// ids renamed when the heroines' data moved to content packs (old saves keep their progress)
const RENAMED = { tsubaki: 'pink', kagura: 'cat' };

export const SAVE = {};
const fresh = () => structuredClone(T.economy.newSave);

export function initSave() {
  const def = fresh();
  let s = null;
  const got = readStored('save', KEY);
  try { s = got ? JSON.parse(got.data) : null; } catch (e) { s = null; }
  if (s && (s.v || 1) < SAVE_VERSION) {
    writeStored(`save.v${s.v || 1}`, `${KEY}.v${s.v || 1}`, got.data);   // the save as it was, before converting
    for (let v = s.v || 1; v < SAVE_VERSION; v++) s = (MIGRATE[v] || ((x) => x))(s);
  }
  if (s) {
    for (const [o, n] of Object.entries(RENAMED)) if (s.chars?.[o] && !s.chars[n]) { s.chars[n] = s.chars[o]; delete s.chars[o]; }
    if (s.team) s.team = s.team.map((id) => RENAMED[id] || id);
    // anything a removed mod added is dropped instead of breaking the game
    s.team = (s.team || []).filter((id) => C.characters[id]);
    if (s.team.length < 2) s.team = def.team;
    s.items = (s.items || []).filter((id) => C.items[id]);
    s.bag = (s.bag || []).filter((id) => C.items[id]);
  }
  Object.assign(SAVE, def, s || {}, s ? { eps: { ...def.eps, ...s.eps }, chars: { ...def.chars, ...s.chars } } : {});
  SAVE.cap = Math.max(SAVE.cap || 0, T.economy.bag.start);   // (the bag's capacity: battle/items.js)
  SAVE.v = SAVE_VERSION;
  // characters added by packs get a slot
  for (const id of Object.keys(C.characters)) if (!SAVE.chars[id]) SAVE.chars[id] = { open: true, xp: 0, outfit: 'base' };
}
export function persist() { writeStored('save', KEY, JSON.stringify(SAVE)); }
export function resetSave() { for (const k of Object.keys(SAVE)) delete SAVE[k]; Object.assign(SAVE, fresh()); persist(); }

// ---- mastery: playing a character levels her up; every level adds a little gun stat, Lv MAX unlocks the limit-break form
const M = () => T.economy.mastery;
export const maxLv = () => M().maxLv;
export function levelOf(xp) { const { maxLv: max, xpAt } = M(); let l = 1; while (l < max && xp >= xpAt[l + 1]) l++; return l; }
export function levelProgress(xp) {
  const l = levelOf(xp), { maxLv: max, xpAt } = M();
  if (l >= max) return { lv: l, frac: 1 };
  return { lv: l, frac: (xp - xpAt[l]) / (xpAt[l + 1] - xpAt[l]) };
}

// stage unlocks (docs/DESIGN.md 局外「小关解锁」): SAVE.eps[ep].stages = how many of its stages are open (1 = only the first)
export function stagesOpen(epId) { return Math.max(1, SAVE.eps[epId]?.stages || 1); }
export function openStage(epId, n) {
  const r = SAVE.eps[epId] || (SAVE.eps[epId] = { open: true, cleared: false, best: null });
  if ((r.stages || 1) < n) { r.stages = n; persist(); return true; }
  return false;
}
