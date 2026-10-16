// The one save file: currency (刀盾), unlocked episodes / items / characters, backpack loadout, mastery.
// Everything unlocked is permanent; there are no consumables and no other currencies.
const KEY = 'noa.save.v1';
const DEF = {
  dd: 0,                       // 刀盾
  eps: { ep0: { open: true, cleared: false, best: null } },
  chars: { tsubaki: { open: true, xp: 0, outfit: 'base' }, kagura: { open: true, xp: 0, outfit: 'base' } },
  team: ['kagura', 'tsubaki'], // 1P (left), 2P / AI (right): the cat girl's packs are drawn for the left after mirroring
  items: [],                   // owned item ids
  bag: [],                     // equipped item ids
  cap: 4,                      // backpack capacity (cost units)
  seenTutorial: false,
};

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!s) return structuredClone(DEF);
    return { ...structuredClone(DEF), ...s, eps: { ...DEF.eps, ...s.eps }, chars: { ...structuredClone(DEF.chars), ...s.chars } };
  } catch (e) { return structuredClone(DEF); }
}
export const SAVE = load();
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(SAVE)); } catch (e) { /* storage blocked */ } }
export function resetSave() { const d = structuredClone(DEF); for (const k of Object.keys(SAVE)) delete SAVE[k]; Object.assign(SAVE, d); persist(); }

// ---- mastery: playing a character levels her up; every level adds a little gun stat, Lv MAX unlocks the limit-break form
export const MAX_LV = 10;
const XP_AT = [0, 0, 120, 280, 480, 740, 1060, 1440, 1900, 2440, 3080]; // xp needed to reach level i
export function levelOf(xp) { let l = 1; while (l < MAX_LV && xp >= XP_AT[l + 1]) l++; return l; }
export function levelProgress(xp) {
  const l = levelOf(xp);
  if (l >= MAX_LV) return { lv: l, frac: 1 };
  return { lv: l, frac: (xp - XP_AT[l]) / (XP_AT[l + 1] - XP_AT[l]) };
}

// ---- backpack capacity upgrades
export const CAP_STEPS = [[5, 300], [6, 600], [7, 1000], [8, 1500]];
export function nextCap() { return CAP_STEPS.find(([c]) => c > SAVE.cap) || null; }
