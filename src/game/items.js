// Backpack items: bought once with 刀盾, then usable forever. Each has a cost; the backpack's capacity limits the loadout.
// They are plain stat modifiers applied to both girls (the team shares one backpack). Data: content items.json.
// effects (any mix): hp (+max HP), reload (x reload time), mag (x magazine), charge (x skill charge), feverDecay (x Fever drain),
//                    feverStart (+start level), dd (x 刀盾 income), stageHeal (+HP after each small stage)
import { C } from '../core/content.js';

export const bagCost = (bag) => bag.reduce((a, id) => a + (C.items[id]?.cost || 0), 0);
export const bagHas = (bag, id) => bag.includes(id);
const MULT = ['reload', 'mag', 'charge', 'feverDecay', 'dd'];
// combined effects of everything in the bag: multipliers multiply, the rest add up
export function bagFx(bag) {
  const fx = { hp: 0, feverStart: 0, stageHeal: 0 };
  for (const k of MULT) fx[k] = 1;
  for (const id of bag) {
    for (const [k, v] of Object.entries(C.items[id]?.effects || {})) {
      if (MULT.includes(k)) fx[k] *= v; else fx[k] = (fx[k] || 0) + v;
    }
  }
  return fx;
}
