// Heroines. A character = one gun profile + one active skill that fits her (no passives).
// Art: every pose is drawn for the LEFT of the screen (rear view, attacking toward the right); as 2P (right side) it is mirrored.
// A new outfit (or the limit-break form) is a whole new pose pack under its own prefix, never part-swapped.
// Per pose, all in uv of the unmirrored sprite (v from the bottom):
//   muzzle  where shots leave        anchor  u of the body's centre line (she stands on it, not on her gun / paw)
//   soft    jiggle / sway regions [u, v, rx, ry, kind] (kinds in soft.js)
// size: { pose, h } = world height in metres of one reference pose; every other pose of the pack scales with it (same source scale).
// Data: content characters/<id>.json (one file per heroine).
import { C, T } from '../core/content.js';
import { levelOf } from '../core/save.js';
import { bagFx } from './items.js';

// Final per-run stats: base gun + mastery + backpack.
export function buildStats(id, xp, bag) {
  const c = C.characters[id], M = T.economy.mastery, fx = bagFx(bag);
  const w = { ...c.weapon }, a = { ...c.active, charge: { ...c.active.charge } };
  const lv = levelOf(xp);
  w.dmg *= 1 + M.dmgPerLv * (lv - 1);
  // mastery also sharpens her crits (DESIGN「难度和局外成长」): added to the accuracy Fever's rate and multiplier
  w.critAdd = (M.critPerLv || 0) * (lv - 1); w.critMulAdd = (M.critMulPerLv || 0) * (lv - 1);
  w.reload *= (1 - M.reloadPerLv * (lv - 1)) * fx.reload;
  w.mag = Math.round(w.mag * fx.mag);
  for (const k in a.charge) a.charge[k] *= fx.charge;
  return { w, a, lv, limit: lv >= M.maxLv, hp: Math.round((T.combat.playerHp + fx.hp) * fx.hpMul) };
}
