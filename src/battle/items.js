// Backpack items (docs/DESIGN.md「书包」): bought once with 伍德刀盾 (or given as a reward), kept forever, levelled up with 伍德刀盾.
// Each has a cost; what is equipped (SAVE.bag) may not cost more than the bag's capacity (SAVE.cap, expanded with 伍德刀盾 from 1 to 20).
// They are plain stat modifiers applied to both girls (the team shares one bag). Data: content items.json, tuning/economy.json "bag".
// effects (any mix): hp (+max HP), hpMul (x max HP), reload (x reload time), mag (x magazine), charge (x skill charge), feverDecay (x Fever
//                    drain), feverStart (+start level), dd (x 刀盾 income), stageHeal (+HP after each small stage)
// An item's "effects" are its Lv1 numbers; "grow" takes them to "to" at Lv "max" (straight, "exp": the same factor every level, or "pow":
// slow at first and faster toward the top, the way there raised to the power "pow")
// and prices each next level: price[0] x price[1]^(lv-1), rounded to a tidy number.
import { C, T } from '../core/content.js';
import { SAVE, persist } from '../core/save.js';

const MULT = ['hpMul', 'reload', 'mag', 'charge', 'feverDecay', 'dd'];
const INT = ['feverStart'];
// prices end on 5 / 50 / 500 so they read cleanly
export const tidy = (v) => { const s = v < 1000 ? 5 : v < 10000 ? 50 : 500; return Math.max(s, Math.round(v / s) * s); };

export const itemLevel = (id) => SAVE.itemLv?.[id] || 1;
export const itemMax = (id) => C.items[id]?.grow?.max || 1;
export function itemFxAt(id, lv = itemLevel(id)) {
  const it = C.items[id]; if (!it) return {};
  const g = it.grow, out = {};
  const k = g && g.max > 1 ? (Math.min(lv, g.max) - 1) / (g.max - 1) : 0;
  for (const [key, v0] of Object.entries(it.effects || {})) {
    const v1 = g?.to?.[key] ?? v0;
    let v = g?.curve === 'exp' ? v0 * Math.pow(v1 / v0, k) : v0 + (v1 - v0) * (g?.curve === 'pow' ? Math.pow(k, g.pow ?? 2) : k);
    if (INT.includes(key)) v = Math.round(v);
    out[key] = v;
  }
  return out;
}
// the price of the next level (null at the top)
export function itemPrice(id, lv = itemLevel(id)) {
  const g = C.items[id]?.grow; if (!g || lv >= g.max) return null;
  return tidy(g.price[0] * Math.pow(g.price[1], lv - 1));
}
export function nextLevel(id) { const lv = itemLevel(id), price = itemPrice(id, lv); return price == null ? null : { lv: lv + 1, price, fx: itemFxAt(id, lv + 1) }; }
// the item's one-line effect with its numbers at a level: {key} = the value (×1.20, +20 ...), {key%} = how many percent it changes
export function itemDesc(id, lv = itemLevel(id), tr = (x) => x) {
  const it = C.items[id], fx = itemFxAt(id, lv);
  return tr(it.desc).replace(/\{(\w+)(%?)\}/g, (m, k, pct) => {
    const v = fx[k]; if (v == null) return m;
    if (pct) return `${Math.round(Math.abs(v - 1) * 100)}%`;
    return MULT.includes(k) ? v.toFixed(2) : `${Math.round(v)}`;
  });
}

export const bagCost = (bag) => bag.reduce((a, id) => a + (C.items[id]?.cost || 0), 0);
export const bagHas = (bag, id) => bag.includes(id);
// combined effects of everything in the bag at their levels: multipliers multiply, the rest add up
export function bagFx(bag) {
  const fx = { hp: 0, feverStart: 0, stageHeal: 0 };
  for (const k of MULT) fx[k] = 1;
  for (const id of bag) for (const [k, v] of Object.entries(itemFxAt(id))) { if (MULT.includes(k)) fx[k] *= v; else fx[k] = (fx[k] || 0) + v; }
  return fx;
}

// ---- the bag and the shop (all with 伍德刀盾; each returns true when it happened)
const B = () => T.economy.bag;
export const capMax = () => B().max;
// the price of one more capacity (null at the top)
export function capPrice(cap = SAVE.cap) { return cap >= B().max ? null : tidy(B().price[0] * Math.pow(B().price[1], cap - B().start)); }
export function upgradeCap() {
  const p = capPrice(); if (p == null || SAVE.dd < p) return false;
  SAVE.dd -= p; SAVE.cap += 1; persist(); return true;
}
export function giveItem(id) {
  if (!SAVE.items.includes(id)) SAVE.items.push(id);
  SAVE.itemLv = SAVE.itemLv || {}; SAVE.itemLv[id] = SAVE.itemLv[id] || 1;
  persist();
}
export function buyItem(id) {
  const it = C.items[id]; if (!it || it.reward || SAVE.items.includes(id) || SAVE.dd < (it.price || 0)) return false;
  SAVE.dd -= it.price || 0; giveItem(id); return true;
}
export function upgradeItem(id) {
  const n = nextLevel(id); if (!n || !SAVE.items.includes(id) || SAVE.dd < n.price) return false;
  SAVE.dd -= n.price; SAVE.itemLv[id] = n.lv; persist(); return true;
}
// E: equip / take off; equipping fails ('full') when the costs would go over the capacity
export function toggleEquip(id) {
  if (!SAVE.items.includes(id)) return 'locked';
  if (SAVE.bag.includes(id)) { SAVE.bag = SAVE.bag.filter((x) => x !== id); persist(); return 'off'; }
  if (bagCost(SAVE.bag) + (C.items[id].cost || 0) > SAVE.cap) return 'full';
  SAVE.bag.push(id); persist(); return 'on';
}
