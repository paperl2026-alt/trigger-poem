// Fever: three meters that reward staying out and shooting. Each has levels 0..3.
//   伤害 dmg   fed by damage dealt      -> damage multiplier
//   准头 acc   fed by hits (misses nibble) -> crit rate + crit multiplier (the ONLY source of crits)
//   连击 combo fed by kills in a chain    -> faster reloads
// docs/DESIGN.md「连击 / Fever 不会因为过场清零」: nothing drains outside the fight (update() only runs in it); in it, after idleDelay seconds
// without a hit all three slide down, faster and faster (idleAccel); the next hit stops the slide. Getting hit knocks all three down.
// All numbers: content tuning/fever.json.
import { T } from '../core/content.js';

export const FEVER_KEYS = ['dmg', 'acc', 'combo'];
const F = () => T.fever;

export class Fever {
  constructor(w, { slowDecay = 1, startLv = 0 } = {}) {
    this.w = w;
    this.v = { dmg: startLv, acc: startLv, combo: startLv };
    this.floor = startLv;
    this.decay = slowDecay;   // item effect: multiplier on the drain (1 = normal)
    this.idle = 0; this.chainT = 0;
    this.ups = [];     // level-up events for the HUD
    this.lv = { dmg: startLv, acc: startLv, combo: startLv };
  }
  level(k) { return Math.min(F().maxLevel, Math.floor(this.v[k])); }
  get dmgMul() { return F().dmgMul[this.level('dmg')]; }
  get critRate() { return F().critRate[this.level('acc')]; }
  get critMul() { return F().critMul[this.level('acc')]; }
  get reloadMul() { return F().reloadMul[this.level('combo')]; }
  get full() { return FEVER_KEYS.every((k) => this.level(k) >= F().maxLevel); }
  add(k, d) { this.v[k] = Math.max(0, Math.min(F().maxLevel + 0.999, this.v[k] + d)); }

  shot() {}   // shooting alone doesn't hold the Fever: hitting does
  hit(dealt) {
    this.idle = 0;
    const w = this.w;
    this.add('dmg', dealt / (w.dmg / w.rate * F().dmgSecondsPerLevel)); // seconds of steady hitting per level
    this.add('acc', w.rate * F().accPerShot);
  }
  miss() { this.add('acc', -this.w.rate * F().accMissPerShot); }
  kill() { this.idle = 0; this.add('combo', F().comboPerKill); }
  hurt() { this.idle = 0; for (const k of FEVER_KEYS) this.add(k, F().hurtGain ?? 0); }   // a hit taken gives a chunk (DESIGN「Fever 大方」)

  update(dt) {
    this.idle += dt;
    const over = this.idle - F().idleDelay;
    if (over > 0) {
      const rate = F().idleDrain * (1 + over * F().idleAccel) * this.decay;   // slides faster the longer she doesn't hit
      for (const k of FEVER_KEYS) if (this.v[k] > this.floor) this.v[k] = Math.max(this.floor, this.v[k] - dt * rate);
    }
    for (const k of FEVER_KEYS) {
      const l = this.level(k);
      if (l > this.lv[k]) this.ups.push(k);
      this.lv[k] = l;
    }
  }
}
