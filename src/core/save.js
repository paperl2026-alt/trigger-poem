// The one save file: currency (刀盾), unlocked episodes / items / characters, backpack loadout, mastery.
// Everything unlocked is permanent; there are no consumables and no other currencies.
// The starting save, the mastery table and the backpack expansions are content (tuning/economy.json);
// initSave() runs once the content packs are loaded.
import { C, T } from './content.js';

const KEY = 'noa.save.v1';
// ids renamed when the heroines' data moved to content packs (old saves keep their progress)
const RENAMED = { tsubaki: 'pink', kagura: 'cat' };

export const SAVE = {};
const fresh = () => structuredClone(T.economy.newSave);

export function initSave() {
  const def = fresh();
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { /* storage blocked */ }
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
  // characters added by packs get a slot
  for (const id of Object.keys(C.characters)) if (!SAVE.chars[id]) SAVE.chars[id] = { open: true, xp: 0, outfit: 'base' };
}
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(SAVE)); } catch (e) { /* storage blocked */ } }
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

// ---- backpack capacity upgrades
export function nextCap() { return T.economy.bagCapSteps.find(([c]) => c > SAVE.cap) || null; }
