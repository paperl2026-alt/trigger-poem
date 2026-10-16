// NIKKE-style secondary motion on the heroine sprites. Each pose has up to 6 elliptical regions (authored in characters.js:
// soft: { pose: [[u, v, rx, ry, kind], ...] }, uv of the unmirrored sprite, v from the bottom). Every region is a damped
// spring that bends the painted sprite in the vertex shader (paper.js): it shifts, and swells / tightens as it moves.
//   butt   two cheeks with slightly different frequencies so they bounce out of sync; widen when pushed down, tighten on the rebound
//   chest  the same for front-facing poses
//   skirt  hem lags and flutters; hair: slow wide swing; tail / tailtip: a travelling wag (the tip lags and swings wider)
//   ear    a quick twitch every few seconds
// Drivers: idle (breathing, weight shift from hip to hip, wag), kicks (shots, popping up / ducking, hits, landing) and inertia
// against the sprite's own motion (recoil shove, run bob).
// spring settings per region kind: content tuning/soft.json (T.softKinds)
import { T } from '../core/content.js';
const TAU = Math.PI * 2;
const N = 6;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);

export class Soft {
  constructor(player) {
    this.p = player;
    this.s = Array.from({ length: N }, (_, i) => ({ x: 0, y: 0, vx: 0, vy: 0, ph: i * 1.7 + Math.random(), tw: rnd(1, 4) }));
    this.prev = null; this.vel = { x: 0, y: 0 };
    this.imp = 0; this.impX = 0;
  }
  // strength ~1 = a solid bounce; dirX nudges it sideways (screen space, + = right)
  kick(strength, dirX = 0) { this.imp = Math.min(3, this.imp + strength); this.impX += dirX * strength; }
  regions() { const soft = this.p.c.soft; return soft ? soft[this.p.pose] || null : null; }
  // m: the visible pose mesh; motion: its own offset (x, y) in sprite heights, for inertia
  update(dt, t, m, mx, my) {
    const u = m.material.uniforms;
    const regs = this.regions();
    if (!regs || dt <= 0) { u.softOn.value = 0; this.prev = null; return; }
    dt = Math.min(dt, 1 / 30);
    let ax = 0, ay = 0;
    if (this.prev) {
      const vx = (mx - this.prev.x) / dt, vy = (my - this.prev.y) / dt;
      ax = clamp((vx - this.vel.x) / dt, -60, 60);
      ay = clamp((vy - this.vel.y) / dt, -60, 60);
      this.vel.x = vx; this.vel.y = vy;
    }
    this.prev = { x: mx, y: my };
    const imp = this.imp, impX = clamp(this.impX, -2, 2);
    this.imp = 0; this.impX = 0;
    const sign = this.p.mirror ? -1 : 1;
    u.softOn.value = 1;
    for (let i = 0; i < N; i++) {
      const r = regs[i], sp = this.s[i];
      if (!r) { u.softA.value[i].set(0, 0, 1e-3, 1e-3); u.softD.value[i].set(0, 0, 0); continue; }
      const K = T.softKinds[r[4]] || T.softKinds.butt;
      const w = TAU * K.f * (1 + 0.09 * (i % 3));
      if (imp && K.amp) {
        sp.vy -= imp * K.amp * w * K.impY * rnd(0.85, 1.15);
        sp.vx += (impX * sign * 0.6 + rnd(-0.5, 0.5) * imp) * K.amp * w * K.impX;
      }
      // where the spring wants to rest right now
      let tx = 0, ty = 0;
      const ph = sp.ph;
      if (K.idle === 'hips') { tx = Math.sin(t * TAU * 0.42) * 0.007; ty = Math.sin(t * TAU * 0.84 + ph) * 0.0035; }
      else if (K.idle === 'breath') ty = Math.sin(t * TAU * 0.36) * 0.005;
      else if (K.idle === 'drift') tx = Math.sin(t * TAU * 0.3 + ph) * 0.009;
      else if (K.idle === 'wag') { const a = t * TAU * 0.55 - K.lag; tx = Math.sin(a) * K.wag[0]; ty = Math.cos(a * 2) * K.wag[1]; }
      else if (K.idle === 'twitch') { sp.tw -= dt; if (sp.tw <= 0) { sp.tw = rnd(1.8, 4.5); sp.vx += rnd(0.22, 0.32) * (Math.random() < 0.5 ? -1 : 1); sp.vy += 0.1; } }
      tx -= ax * 0.0006 * K.impX; ty -= ay * 0.0006 * K.impY; // lag behind the body's own acceleration
      sp.vx += (w * w * (tx - sp.x) - 2 * K.z * w * sp.vx) * dt;
      sp.vy += (w * w * (ty - sp.y) - 2 * K.z * w * sp.vy) * dt;
      sp.x += sp.vx * dt; sp.y += sp.vy * dt;
      const L = Math.hypot(sp.x, sp.y);
      if (L > K.max) { sp.x *= K.max / L; sp.y *= K.max / L; sp.vx *= 0.6; sp.vy *= 0.6; }
      // pushed down -> spreads wider; springing up -> tightens
      const z = K.swell ? clamp(-sp.y * K.swell, -0.18, 0.28) : 0;
      u.softA.value[i].set(r[0], r[1], r[2], r[3]);
      u.softD.value[i].set(sp.x * sign, sp.y, z); // springs live in screen space; the mirrored sprite's local x is flipped
    }
  }
}
