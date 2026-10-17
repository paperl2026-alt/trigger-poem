// The one save file: currency (伍德刀盾), unlocked episodes / items / characters, backpack loadout, mastery.
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
// stage unlocks (docs/DESIGN.md 局外「小关解锁」): SAVE.eps[ep].stages = how many of its stages are open (1 = only the first)
export function stagesOpen(epId) { return Math.max(1, SAVE.eps[epId]?.stages || 1); }
export function openStage(epId, n) {
  const r = SAVE.eps[epId] || (SAVE.eps[epId] = { open: true, cleared: false, best: null });
  if ((r.stages || 1) < n) { r.stages = n; persist(); return true; }
  return false;
}
// items (DESIGN 局外「背包道具可以升级」): a reward is given once; an item with levels goes up one level for its price
export function giveItem(id) {
  if (!SAVE.items.includes(id)) SAVE.items.push(id);
  SAVE.itemLv = SAVE.itemLv || {}; SAVE.itemLv[id] = SAVE.itemLv[id] || 1;
  persist();
}
export function itemLevel(id) { return SAVE.itemLv?.[id] || 1; }
export function nextLevel(id) { const L = C.items[id]?.levels; const lv = itemLevel(id); return L && lv < L.length ? { lv: lv + 1, ...L[lv] } : null; }
export function upgradeItem(id) {
  const n = nextLevel(id);
  if (!n || SAVE.dd < (n.price || 0)) return false;
  SAVE.dd -= n.price || 0; SAVE.itemLv[id] = n.lv; persist();
  return true;
}
export function nextCap() { return T.economy.bagCapSteps.find(([c]) => c > SAVE.cap) || null; }
