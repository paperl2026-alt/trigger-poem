// Fever: three meters that reward staying out and shooting. Each has levels 0..3.
//   伤害 dmg   fed by damage dealt      -> damage multiplier
//   准头 acc   fed by hits (misses nibble) -> crit rate + crit multiplier (the ONLY source of crits)
//   连击 combo fed by kills in a chain    -> faster reloads
// Not shooting for a while (hiding included) drains dmg + acc; a broken kill chain drains combo; getting hit knocks all three down.
export const FEVER_KEYS = ['dmg', 'acc', 'combo'];
const CRIT_RATE = [0, 0.1, 0.2, 0.32];
const CRIT_MUL = [1.5, 1.5, 1.75, 2];
const DMG_MUL = [1, 1.15, 1.3, 1.45];
const RELOAD_MUL = [1, 0.8, 0.65, 0.5];
const TOP = 3.999;

export class Fever {
  constructor(w, { slowDecay = false, startLv = 0 } = {}) {
    this.w = w;
    this.v = { dmg: startLv, acc: startLv, combo: startLv };
    this.floor = startLv;
    this.decay = slowDecay ? 0.6 : 1;
    this.idle = 0; this.chainT = 0;
    this.ups = [];     // level-up events for the HUD
    this.lv = { dmg: startLv, acc: startLv, combo: startLv };
  }
  level(k) { return Math.min(3, Math.floor(this.v[k])); }
  get dmgMul() { return DMG_MUL[this.level('dmg')]; }
  get critRate() { return CRIT_RATE[this.level('acc')]; }
  get critMul() { return CRIT_MUL[this.level('acc')]; }
  get reloadMul() { return RELOAD_MUL[this.level('combo')]; }
  get full() { return FEVER_KEYS.every((k) => this.level(k) >= 3); }
  add(k, d) { this.v[k] = Math.max(0, Math.min(TOP, this.v[k] + d)); }

  shot() { this.idle = 0; }
  hit(dealt) {
    const w = this.w;
    this.add('dmg', dealt / (w.dmg / w.rate * 4.5)); // ~4.5 s of steady hitting per level
    this.add('acc', w.rate * 0.33);
  }
  miss() { this.add('acc', -this.w.rate * 0.12); }
  kill() { this.add('combo', 0.45); this.chainT = 3.2; }
  hurt() { for (const k of FEVER_KEYS) this.add(k, -0.9); }

  update(dt) {
    this.idle += dt;
    if (this.idle > 1.4) for (const k of ['dmg', 'acc']) if (this.v[k] > this.floor) this.v[k] = Math.max(this.floor, this.v[k] - dt * 0.35 * this.decay);
    this.chainT -= dt;
    if (this.chainT <= 0 && this.v.combo > this.floor) this.v.combo = Math.max(this.floor, this.v.combo - dt * 0.5 * this.decay);
    for (const k of FEVER_KEYS) {
      const l = this.level(k);
      if (l > this.lv[k]) this.ups.push(k);
      this.lv[k] = l;
    }
  }
}
