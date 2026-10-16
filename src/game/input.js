// Controllers. Every frame each one produces the same intent for its Player:
//   x, y      reticle in CSS px (top-left origin)
//   fire      trigger held
//   hide      take-cover button held
//   skill     active-skill button pressed this frame
//   wantsOut  stay leaned out when not firing (pad / keys / AI: yes; mouse: no — releasing the button = cover)
// Mouse (1P): move = aim, hold left = lean out + fire, release = cover, right = skill. Nothing else.
// Gamepad (standard mapping): stick = aim, RT or A = fire, LT or LB = cover, Y or RB = skill, START = join as 2P / menu.
const dz = (v, d = 0.16) => (Math.abs(v) < d ? 0 : (v - Math.sign(v) * d) / (1 - d));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const PAD = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, BACK: 8, START: 9 };
export function getPads() { try { return navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { return []; } }

// Tracks every pad's buttons so edges (just pressed) are known.
export class PadBook {
  constructor() { this.prev = {}; this.now = {}; }
  poll() {
    const out = [];
    for (const gp of getPads()) {
      if (!gp) continue;
      const p = this.prev[gp.index] || [];
      const n = gp.buttons.map((b) => b.pressed || b.value > 0.35);
      this.prev[gp.index] = this.now[gp.index] || [];
      this.now[gp.index] = n;
      out.push({ gp, pressed: (i) => !!n[i] && !(this.prev[gp.index] || [])[i], held: (i) => !!n[i], any: n.some(Boolean) || gp.axes.some((a) => Math.abs(a) > 0.5), _p: p });
    }
    return out;
  }
}

function stickAim(c, gp, dt, game) {
  let ax = dz(gp.axes[2] ?? 0), ay = dz(gp.axes[3] ?? 0);
  if (!ax && !ay) { ax = dz(gp.axes[0] ?? 0); ay = dz(gp.axes[1] ?? 0); }
  const m = Math.min(1, Math.hypot(ax, ay));
  if (m > 0) {
    let speed = game.H * 1.7 * Math.pow(m, 1.8);
    if (game.overTarget(c.x, c.y)) speed *= 0.5; // aim-assist: friction over enemies
    c.x += ax / m * speed * dt; c.y += ay / m * speed * dt;
  } else {
    const t = game.overTarget(c.x, c.y);
    if (t) { c.x += (t.x - c.x) * Math.min(1, dt * 2.5); c.y += (t.y - c.y) * Math.min(1, dt * 2.5); } // gentle magnetism at rest
  }
  c.x = clamp(c.x, 0, game.W); c.y = clamp(c.y, 0, game.H);
}

// Player 1: mouse, or a gamepad if one is being used (Steam Deck / couch).
export class HybridCtrl {
  constructor(G) { this.G = G; this.kind = 'mouse'; this.x = G.W * 0.5; this.y = G.H * 0.45; this.pad = null; this.lastMouse = 0; this.skillQ = false; }
  update(dt, game, pads) {
    const P = this.G.pointer;
    const gp = this.pad !== null ? pads.find((p) => p.gp.index === this.pad) : null;
    if (P.moved) { this.lastMouse = performance.now(); P.moved = false; this.kind = 'mouse'; }
    if (gp && gp.any && performance.now() - this.lastMouse > 400) this.kind = 'pad';
    this.skill = this.skillQ; this.skillQ = false;
    if (this.kind === 'pad' && gp) {
      stickAim(this, gp.gp, dt, game);
      this.fire = gp.held(PAD.RT) || gp.held(PAD.A);
      this.hide = gp.held(PAD.LT) || gp.held(PAD.LB);
      this.skill = this.skill || gp.pressed(PAD.Y) || gp.pressed(PAD.RB);
      this.wantsOut = true;
      this.active = true;
    } else {
      this.x = P.x; this.y = P.y;
      this.fire = P.down;
      this.hide = false;
      this.wantsOut = false;
      this.active = P.active;
    }
  }
}

export class PadCtrl {
  constructor(G, index) { this.G = G; this.index = index; this.kind = 'pad'; this.x = G.W * 0.65; this.y = G.H * 0.45; this.wantsOut = true; this.active = true; }
  update(dt, game, pads) {
    const gp = pads.find((p) => p.gp.index === this.index);
    if (!gp) { this.fire = false; this.hide = true; this.skill = false; return; }
    stickAim(this, gp.gp, dt, game);
    this.fire = gp.held(PAD.RT) || gp.held(PAD.A);
    this.hide = gp.held(PAD.LT) || gp.held(PAD.LB);
    this.skill = gp.pressed(PAD.Y) || gp.pressed(PAD.RB);
  }
}

// 2P on the same keyboard: arrows aim, Enter fire, Right Shift cover, Backspace skill.
export class KeyCtrl {
  constructor(G) { this.G = G; this.kind = 'keys'; this.x = G.W * 0.65; this.y = G.H * 0.45; this.wantsOut = true; this.active = true; this.v = 0; }
  update(dt, game) {
    const k = this.G.keys;
    const ax = (k.ArrowRight ? 1 : 0) - (k.ArrowLeft ? 1 : 0), ay = (k.ArrowDown ? 1 : 0) - (k.ArrowUp ? 1 : 0);
    this.v = ax || ay ? Math.min(1, this.v + dt * 2.5) : 0;
    const sp = game.H * (0.35 + 1.1 * this.v) * (game.overTarget(this.x, this.y) ? 0.55 : 1);
    this.x = clamp(this.x + ax * sp * dt, 0, game.W); this.y = clamp(this.y + ay * sp * dt, 0, game.H);
    this.fire = !!(k.Enter || k.NumpadEnter);
    this.hide = !!k.ShiftRight;
    this.skill = !!k.Backspace && !this.bPrev; this.bPrev = !!k.Backspace;
  }
}

// Computer teammate: picks a target, drifts its reticle there with human-ish lag and wobble, shoots when roughly on,
// ducks when something it can block is about to hit it. "Okay, not great" by design.
export class AICtrl {
  constructor(G, player, skill = 0.5) {
    this.G = G; this.p = player; this.kind = 'ai'; this.skill = skill;
    this.x = G.W * 0.6; this.y = G.H * 0.45; this.wantsOut = true; this.active = true;
    this.target = null; this.reactT = 0; this.off = { x: 0, y: 0 }; this.hideT = 0; this.wob = Math.random() * 10;
  }
  update(dt, game) {
    const s = this.skill, me = this.p;
    this.skill = false;
    this.reactT -= dt; this.hideT -= dt; this.wob += dt;
    if (this.target && (!this.target.alive || this.target.removed)) this.target = null;
    if ((!this.target || this.reactT < -2.5) && this.reactT <= 0) {
      let best = null, bs = -1;
      for (const a of game.actors) {
        if (!a.alive || !a.hitMeshes().length) continue;
        const b = a.screenBox();
        if (b.x1 < 0 || b.x0 > game.W) continue;
        let sc = 1 + Math.random() * 0.8;
        if (a.lock) sc += a.lock.slot === me.slot ? 5 : 2;
        if (a.threat === 'shot') sc += 2.5;
        if (a.threat === 'melee' && a.lock) sc += 3;
        const cx = (b.x0 + b.x1) / 2;
        sc -= Math.abs(cx - me.baseX) / game.W * 1.5; // prefers its own side of the screen
        if (sc > bs) { bs = sc; best = a; }
      }
      if (best !== this.target) { this.target = best; this.reactT = 0.55 - s * 0.35 + Math.random() * 0.25; this.off = { x: (Math.random() - 0.5) * 0.5, y: (Math.random() - 0.5) * 0.5 }; }
      else this.reactT = 0.4;
    }
    let tx = me.baseX + (me.side < 0 ? 0.25 : -0.25) * game.W, ty = game.H * 0.45;
    if (this.target && this.reactT <= 0.25) {
      const b = this.target.screenBox();
      tx = (b.x0 + b.x1) / 2 + this.off.x * (b.x1 - b.x0) * (1 - s * 0.6);
      ty = b.y0 + (b.y1 - b.y0) * (0.45 + this.off.y * 0.4 * (1 - s * 0.6));
      this.off.x *= Math.exp(-dt * (0.6 + s)); this.off.y *= Math.exp(-dt * (0.6 + s));
    }
    const wob = game.H * 0.02 * (1.2 - s);
    this.x += (tx - this.x) * Math.min(1, dt * (2.5 + s * 4)) + Math.sin(this.wob * 3.1) * wob * dt * 6;
    this.y += (ty - this.y) * Math.min(1, dt * (2.5 + s * 4)) + Math.cos(this.wob * 2.3) * wob * dt * 6;
    // duck for blockable hits aimed at me (not always in time)
    for (const a of game.actors) {
      const L = a.lock;
      if (!L || (L.slot !== me.slot && L.slot !== -1) || L.type === 'melee') continue; // -1 = hits everyone
      if (L.p > 0.68 && L.p < 0.98 && this.hideT < -0.3 && Math.random() < (L.type === 'heavy' ? 0.95 : 0.55 + s * 0.3) && (!me.beaming || L.type === 'heavy')) this.hideT = 0.55;
    }
    this.hide = this.hideT > 0;
    let on = false;
    if (this.target) { const b = this.target.screenBox(); on = this.x > b.x0 && this.x < b.x1 && this.y > b.y0 && this.y < b.y1; }
    this.fire = on && !this.hide && this.reactT <= 0;
    if (me.charge >= 1 && (game.boss || game.actors.filter((a) => a.alive && a.type).length >= 2)) this.skill = true;
    if (me.beaming) this.fire = !!this.target; // keep the beam on target (it only ducks out of it for heavy hits)
  }
}
