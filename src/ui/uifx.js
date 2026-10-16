// UI effect layer for menus: a canvas of sprite particles (twinkles when something is hovered, stamps / hearts / a burst ring
// on clicks, falling petals, dust drifting in the light). Sprites are content images (ui/fx_*, ui/petal*, ui/heart ...),
// so a pack can re-skin them. Coordinates are the canvas' own pixels; ambient particles can carry a parallax depth.
import { url, meta } from '../core/assets.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const cache = {};
function sprite(key) {
  if (!key || !meta[key]) return null;
  if (!cache[key]) { const im = new Image(); im.src = url(key); cache[key] = im; }
  return cache[key];
}
const STARS = ['ui/fx_star_gold', 'ui/fx_star_pink', 'ui/fx_star_mint'];
const PETALS = ['ui/petal1', 'ui/petal2', 'ui/petal3', 'ui/petal4', 'ui/petal5'];

export class UiFx {
  // shift(depth) -> [dx, dy]: the current parallax offset for that depth (ambient particles follow the scene)
  constructor(parent, w, h, shift = () => [0, 0]) {
    this.cv = document.createElement('canvas');
    this.cv.className = 'uifx';
    this.cv.width = w; this.cv.height = h;
    Object.assign(this.cv.style, { position: 'absolute', left: '0', top: '0', width: `${w}px`, height: `${h}px`, pointerEvents: 'none' });
    parent.appendChild(this.cv);
    this.g = this.cv.getContext('2d');
    this.w = w; this.h = h; this.shift = shift;
    this.ps = [];
  }
  // p: { key, x, y, size, vx, vy, ay, drag, rot, vr, life, s0, s1, a, fadeIn, blend, depth, wob }
  add(p) {
    const q = { t: 0, life: 1, vx: 0, vy: 0, ay: 0, drag: 0, rot: 0, vr: 0, s0: 1, s1: 1, a: 1, fadeIn: 0.08, blend: 'source-over', depth: 0, wob: 0, ph: Math.random() * 6, ...p };
    q.img = sprite(q.key);
    if (q.img) this.ps.push(q);
    return q;
  }
  // ---- recipes
  // twinkles popping around a box (hover)
  hover(x, y, w, h, n = 4) {
    for (let i = 0; i < n; i++) {
      const side = Math.floor(Math.random() * 4), u = Math.random();
      const px = side < 2 ? x + u * w : side === 2 ? x : x + w, py = side < 2 ? (side ? y + h : y) : y + u * h;
      this.add({ key: pick(STARS), x: px, y: py, size: rnd(26, 46), s0: 0.1, s1: 1.1, life: rnd(0.45, 0.7), vr: rnd(-2, 2), vy: rnd(-30, -10), blend: 'lighter', fadeIn: 0.3 });
    }
  }
  // a stamp + a little shower of hearts / paw prints / twinkles (click)
  click(x, y, big = false) {
    const k = big ? 1.8 : 1;
    this.add({ key: 'ui/fx_ring', x, y, size: 150 * k, s0: 0.25, s1: 1.3, life: 0.42, blend: 'lighter', a: 0.9, fadeIn: 0 });
    this.add({ key: 'ui/fx_orb', x, y, size: 160 * k, s0: 0.6, s1: 1.4, life: 0.3, blend: 'lighter', a: 0.8, fadeIn: 0 });
    const n = big ? 22 : 8;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), sp = rnd(160, 420) * k;
      this.add({ key: pick(['ui/fx_heart_s', 'ui/fx_paw_s', ...STARS, ...(big ? PETALS : [])]), x, y, size: rnd(22, 40) * (big ? 1.3 : 1), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, ay: 520, drag: 2.2, vr: rnd(-6, 6), rot: rnd(-1, 1), life: rnd(0.6, 1.0) * (big ? 1.4 : 1), s0: 0.5, s1: 1, blend: Math.random() < 0.5 ? 'lighter' : 'source-over', fadeIn: 0 });
    }
  }
  // a red paw-print stamp left where a paper button was pressed
  stamp(x, y) { this.add({ key: 'ui/fx_paw', x, y, size: 64, s0: 1.7, s1: 1, life: 0.8, rot: rnd(-0.5, 0.5), fadeIn: 0, a: 0.85, ease: 'snap' }); }
  // golden sparks off metal (bell, cartridges)
  sparks(x, y, n = 5) {
    for (let i = 0; i < n; i++) {
      const a = rnd(-Math.PI, 0), sp = rnd(120, 300);
      this.add({ key: 'ui/fx_star_gold', x, y, size: rnd(18, 30), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, ay: 600, drag: 1.5, life: rnd(0.4, 0.7), s0: 1, s1: 0.2, blend: 'lighter', fadeIn: 0 });
    }
  }
  hearts(x, y, n = 3) {
    for (let i = 0; i < n; i++) this.add({ key: Math.random() < 0.7 ? 'ui/fx_heart_s' : 'ui/fx_heart', x: x + rnd(-40, 40), y: y + rnd(-20, 20), size: rnd(30, 52), vx: rnd(-30, 30), vy: rnd(-140, -80), drag: 0.8, life: rnd(0.9, 1.3), s0: 0.3, s1: 1, wob: 2.4, fadeIn: 0.15 });
  }
  // one falling petal; depth: 0 far .. 1.4 very near (bigger, faster, more parallax)
  petal(depth) {
    const s = 14 + depth * 34;
    return this.add({ key: pick(PETALS), x: rnd(-100, this.w + 300), y: -60, size: rnd(0.8, 1.2) * s, vx: rnd(-60, -25) * (0.6 + depth), vy: rnd(40, 70) * (0.6 + depth), vr: rnd(-1.6, 1.6), rot: rnd(0, 6), life: 30, depth, wob: 1.2, a: depth > 1 ? 0.75 : 0.95, fadeIn: 0.02, kill: 'below' });
  }
  // a mote of dust twinkling in a light shaft
  dust(x0, y0, x1, y1, depth = 0.3) {
    return this.add({ key: 'ui/fx_dust', x: rnd(x0, x1), y: rnd(y0, y1), size: rnd(10, 22), vx: rnd(-8, 8), vy: rnd(-10, 4), life: rnd(3, 6), depth, blend: 'lighter', a: rnd(0.4, 0.9), fadeIn: 0.3, wob: 0.6, twinkle: true });
  }
  get count() { return this.ps.length; }

  update(dt) {
    const g = this.g;
    g.clearRect(0, 0, this.w, this.h);
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const p = this.ps[i];
      p.t += dt;
      const k = p.t / p.life;
      if (k >= 1 || (p.kill === 'below' && p.y > this.h + 80)) { this.ps.splice(i, 1); continue; }
      const dr = Math.exp(-p.drag * dt);
      p.vx *= dr; p.vy = p.vy * dr + p.ay * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (!p.img.complete || !p.img.naturalWidth) continue;
      const fi = p.fadeIn ? Math.min(1, k / p.fadeIn) : 1, fo = p.kill === 'below' ? 1 : Math.min(1, (1 - k) * 4);
      let a = p.a * fi * fo;
      if (p.twinkle) a *= 0.55 + 0.45 * Math.sin(p.t * 5 + p.ph);
      let s = p.s0 + (p.s1 - p.s0) * (p.ease === 'snap' ? 1 - Math.pow(1 - Math.min(1, k * 5), 3) : 1 - Math.pow(1 - k, 2));
      const [dx, dy] = p.depth ? this.shift(p.depth) : [0, 0];
      const wob = p.wob ? Math.sin(p.t * p.wob * 2 + p.ph) * 12 * p.wob : 0;
      const w = p.size * s, h = w * p.img.naturalHeight / p.img.naturalWidth;
      g.save();
      g.globalAlpha = Math.max(0, Math.min(1, a));
      g.globalCompositeOperation = p.blend;
      g.translate(p.x + dx + wob, p.y + dy);
      g.rotate(p.rot);
      g.drawImage(p.img, -w / 2, -h / 2, w, h);
      g.restore();
    }
  }
  dispose() { this.cv.remove(); this.ps.length = 0; }
}
