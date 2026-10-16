// Minimal tween / timer system driven by the game loop (scaled time so hit-stop works).
export const Ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  outBack: (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

export class Tweens {
  constructor() { this.list = []; }
  // to(obj, {prop: value}, dur, {ease, delay, onUpdate, onDone})
  to(obj, props, dur, opt = {}) {
    const tw = { obj, props, dur: Math.max(1e-4, dur), t: -(opt.delay || 0), ease: opt.ease || Ease.outQuad, from: null, onUpdate: opt.onUpdate, onDone: opt.onDone, dead: false };
    this.list.push(tw);
    return tw;
  }
  // generic value animation
  run(dur, fn, opt = {}) {
    const tw = { obj: null, props: null, dur: Math.max(1e-4, dur), t: -(opt.delay || 0), ease: opt.ease || Ease.linear, onUpdate: fn, onDone: opt.onDone, dead: false };
    this.list.push(tw);
    return tw;
  }
  wait(dur, fn) { return this.run(dur, null, { onDone: fn }); }
  kill(obj) { for (const t of this.list) if (t.obj === obj) t.dead = true; }
  update(dt) {
    const list = this.list;
    for (let i = 0; i < list.length; i++) {
      const tw = list[i];
      if (tw.dead) continue;
      tw.t += dt;
      if (tw.t < 0) continue;
      if (tw.obj && !tw.from) {
        tw.from = {};
        for (const k in tw.props) tw.from[k] = tw.obj[k];
      }
      const p = Math.min(1, tw.t / tw.dur);
      const e = tw.ease(p);
      if (tw.obj) for (const k in tw.props) tw.obj[k] = tw.from[k] + (tw.props[k] - tw.from[k]) * e;
      tw.onUpdate && tw.onUpdate(e, p);
      if (p >= 1) { tw.dead = true; tw.onDone && tw.onDone(); }
    }
    if (list.length > 64) this.list = list.filter((t) => !t.dead);
    else for (let i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1);
  }
  clear() { this.list.length = 0; }
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
