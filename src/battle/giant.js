// The prologue boss: the discipline committee girl turned colossal (bosses.json "dc", art tools/job_specs25.py).
// She is far too big for the screen: only parts of her are ever seen, rising from behind the school building in the yard painting.
//   Phase 1: head + two giant hands gripping the roof. Throws confiscated phones / manga (shoot them down or hide), slams a hand
//            onto one heroine's cover (must be interrupted: shoot the raised hand during its wind-up; it ignores cover and smashes
//            it), blows the whistle (a long wind-up nobody can stop: hide). The third eye opens after the whistle or a stopped
//            slam: the weak point.
//   Phase 2: transformed, climbs onto the roof (waist up, rule-tape hair). Tape lash volleys; raises her ruler arm: the armband
//            crest (weak point) shows only then; shoot it enough to break the slam, or hide; guards with crossed arms (crest
//            hidden, takes little damage) while her monsters come.
//   Phase 3: leans down over the yard, her face filling the top of the screen, mouth a megaphone: screams (hide), volleys,
//            monsters. The third eye stays open.
// One HP bar; parts only change the damage multiplier; poise / stagger interrupts like every enemy.
import * as THREE from 'three';
import { tex, meta } from '../core/assets.js';
import { paperMesh, DamageMap, attachDamage } from '../core/paper.js';
import { Ease } from '../core/tween.js';
import { sfx } from '../core/audio.js';
import { tr } from '../core/i18n.js';
import { Actor } from './enemies.js';
import { COL } from './fx.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const rr = (r) => (Array.isArray(r) ? rnd(r[0], r[1]) : r);
const K = (n) => `boss/dc_${n}`;

// where everything goes in the yard painting (painting px / metres), computed before the Actor is built
function layout(game, def) {
  const w = game.world, st = w.st, R = w.station(w.stId).roof || [330, 1372, 300];
  const cx = (R[0] + R[1]) / 2, ry = R[2];
  const dB = st.distAt(cx, ry + 30);                  // the building's front at the roof line
  const L = def.layout;
  const dHead = dB + L.headBehind, dHand = Math.max(2, dB - L.handFront);
  const headW = st.widthAt(dHead) * L.headW, handW = st.widthAt(dHand) * L.handW;
  return { st, cx, ry, dB, dHead, dHand, headW, handW, headH: headW * 941 / 1672, W: st.W };
}

export class DisciplineGiant extends Actor {
  constructor(game, def) {
    const Lo = layout(game, def);
    super(game, K('head'), Lo.headH, 'bottom');
    this.def = def; this.type = 'boss'; this.name = def.name; this.Lo = Lo;
    this.prefix = 'boss/dc_';
    this.hp = this.maxHp = def.hp;
    this.poise = 0; this.poiseCD = 0; this.staggerT = 0; this.seq = 0; this.phase = 1;
    this.busy = true; this.armor = false; this.guard = false; this.timer = def.firstDelay; this.pi = 0;
    this.locks = []; this.eyeT = 0;
    const st = Lo.st, g = game.world.scene;
    this.billboard = false;
    // head: rises from behind the roof (starts hidden below it)
    this.mesh.userData.part = 'head';
    this.headHome = st.atDist(Lo.cx, Lo.ry + def.layout.headDrop, Lo.dHead);
    this.face(this.root, this.headHome);
    this.root.position.copy(this.headHome).add(new THREE.Vector3(0, -Lo.headH * 0.9, 0));
    g.add(this.root);
    // the two hands grip the roof edge (in front of the building); the left one is the right hand mirrored
    this.hands = [-1, 1].map((side) => {
      const m = this.part(K('grip'), Lo.handW, 'center', `hand${side < 0 ? 'L' : 'R'}`);
      if (side < 0) m.scale.x = -1;
      const home = st.atDist(Lo.cx + side * Lo.W * def.layout.handX, Lo.ry + def.layout.handDrop, Lo.dHand);
      const hg = new THREE.Group(); hg.add(m); this.face(hg, home); hg.position.copy(home).add(new THREE.Vector3(0, -Lo.handW, 0));
      g.add(hg);
      return { side, m, g: hg, home, poise: 0, busy: false, lock: null };
    });
    // phase 2 / 3 bodies, hidden until their phase
    const d2 = Lo.dB * def.layout.p2Dist, w2 = st.widthAt(d2) * def.layout.p2W;   // in front of the building: she has climbed onto it
    this.p2 = this.part(K('p2_low'), w2, 'bottom', 'p2'); this.p2g = new THREE.Group(); this.p2g.add(this.p2);
    this.p2Home = st.atDist(Lo.cx, Lo.ry + def.layout.p2Drop, d2); this.face(this.p2g, this.p2Home);
    this.p2g.position.copy(this.p2Home).add(new THREE.Vector3(0, -w2 * 0.6, 0)); this.p2g.visible = false; g.add(this.p2g);
    const d3 = def.layout.p3Dist, w3 = st.widthAt(d3) * def.layout.p3W, h3 = w3 * 941 / 1672;
    this.p3 = this.part(K('p3'), w3, 'center', 'p3'); this.p3g = new THREE.Group(); this.p3g.add(this.p3);
    // leaning down right over the yard: in front of everything painted (the covers still draw over her)
    this.p3.material.depthTest = false; this.p3.renderOrder = 3;
    this.p3Home = st.atDist(Lo.W / 2, st.H * def.layout.p3Y, d3); this.face(this.p3g, this.p3Home);
    this.p3g.position.copy(this.p3Home).add(new THREE.Vector3(0, h3, 0)); this.p3g.visible = false; g.add(this.p3g);
    this.parts = [this.mesh, ...this.hands.map((h) => h.m), this.p2, this.p3];
    // she rises over the school
    sfx.roar(); game.post.shake(1.2);
    game.tweens.to(this.root.position, { y: this.headHome.y }, 2.2, { ease: Ease.outCubic });
    this.hands.forEach((h, i) => game.tweens.to(h.g.position, { y: h.home.y }, 0.9, { delay: 1.4 + i * 0.35, ease: Ease.outBack, onDone: () => { sfx.slam(); game.post.shake(0.9); } }));
    game.tweens.wait(2.6, () => { this.busy = false; });
  }
  // a separate animated part with its own damage marks
  part(key, width, pivot, name) {
    const t = tex[key], m = paperMesh(t, width, { pivot });
    m.userData.owner = this; m.userData.texKey = key; m.userData.part = name;
    const ar = t.image.width / t.image.height, dm = new DamageMap(1 / ar, 512);
    attachDamage(m, dm); m.userData.dm = dm; m.userData.w = width;
    return m;
  }
  face(obj, at) { const c = this.game.world.camPos; obj.rotation.y = Math.atan2(c.x - at.x, c.z - at.z); }
  setTex(m, name) { const k = K(name); if (!tex[k] || m.userData.texKey === k) return; m.userData.texKey = k; m.material.uniforms.map.value = tex[k]; }
  hitMeshes() { return this.alive ? this.parts.filter((m) => this.visibleMesh(m)) : []; }
  visibleMesh(m) { let o = m; while (o) { if (!o.visible) return false; o = o.parent; } return true; }
  later(s, fn) { const q = this.seq; this.game.tweens.wait(s, () => { if (this.alive && q === this.seq) fn(); }); }
  center() { const m = this.phase === 3 ? this.p3 : this.phase === 2 ? this.p2 : this.mesh; return m.localToWorld(new THREE.Vector3(0, m === this.mesh || m === this.p2 ? m.userData.size?.h * 0.6 || 3 : 0, 0.1)); }
  partPoint(m, u, v) {
    const sz = m.userData.size, bottom = m === this.mesh || m === this.p2;
    return m.localToWorld(new THREE.Vector3((u - 0.5) * sz.w, bottom ? v * sz.h : (v - 0.5) * sz.h, 0.05));
  }
  screen(m, u, v) { const p = this.game.world.project(this.partPoint(m, u, v)); return { x: p.x, y: this.game.H - p.y }; }
  screenBox() { const m = this.phase === 3 ? this.p3 : this.phase === 2 ? this.p2 : this.mesh; const a = this.screen(m, 0, 0), b = this.screen(m, 1, 1); return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(this.game.H - a.y, this.game.H - b.y), y1: Math.max(this.game.H - a.y, this.game.H - b.y) }; }

  // ---------------------------------------------------------------- damage
  weakAt(m, u, v) {
    const w = meta[m.userData.texKey]?.weak || [], ar = m.userData.size.w / m.userData.size.h;
    return w.some(([wu, wv, r]) => Math.hypot((u - wu) * ar, v - wv) < r * 1.15);
  }
  hit(info) {
    if (!this.alive) return;
    const m = info.part && info.part.userData.owner === this ? info.part : this.mesh, D = this.def;
    const { u, v } = info.uv, weak = this.weakAt(m, u, v);
    // the third eye is only a weak point while open; in phase 2 the crest only shows on the raised arm
    const open = weak && (m.userData.texKey !== K('head') && m.userData.texKey !== K('head_blow'));
    let mult = open ? D.weakMul : m.userData.part.startsWith('hand') ? D.handMul : D.bodyMul;
    if (this.guard) mult *= D.guardMul;
    const dmg = info.dmg * mult;
    info.dealt = dmg;
    this.lastHitBy = info.by;
    const dm = m.userData.dm || this.dm, k = 1 / (m.userData.w || this.w);
    if (info.kind === 'rifle') dm.hole(u, v, (info.crit ? 0.11 : 0.08) * k * 4); else if (info.kind === 'mantra') { dm.scorch(u, v, 0.25 * k * 4, 0.35); dm.hole(u, v, 0.07 * k * 4); } else dm.scorch(u, v, 0.3 * k * 4, 0.12);
    m.material.uniforms.flash.value = open ? 0.8 : 0.3;
    const p = this.partPoint(m, u, v), fx = this.game.fx;
    if (open) { fx.ink(p, 10, 3, COL.hot); fx.star(p, 3, COL.pink); } else if (info.kind === 'mantra') { fx.confetti(p, 6, 2.4, [COL.gold, COL.paper]); fx.star(p, 2, COL.gold); } else { fx.confetti(p, 3, 1.8); fx.star(p, 1, COL.white); }
    // a raised slamming hand gathers its own poise: enough and the slam breaks off
    const hand = this.hands.find((h) => h.m === m);
    if (hand && hand.lock && info.stagger) { hand.poise += info.stagger; if (hand.poise >= D.slam.poise) this.breakSlam(hand); }
    // the raised ruler arm: hits on the crest break the slam
    if (this.raising && open && info.stagger) { this.raisePoise += info.stagger * 1.5; if (this.raisePoise >= D.raise.poise) this.breakRaise(); }
    if (info.stagger && !this.armor && !this.busy && this.staggerT <= 0 && this.poiseCD <= 0) {
      this.poise += info.stagger * mult;
      if (this.poise >= D.poise) this.stagger();
    }
    this.damage(dmg, info.kind, info);
  }
  damage(dmg, kind, info) {
    if (!this.alive) return;
    this.hp -= dmg;
    if (info) this.game.onHit(this, kind, info);
    if (this.phase === 1 && this.hp < this.maxHp * this.def.phase2At) this.toPhase(2);
    else if (this.phase === 2 && this.hp < this.maxHp * this.def.phase3At) this.toPhase(3);
    if (this.hp <= 0) this.die();
  }
  stagger() {
    const g = this.game;
    this.seq++; this.clearLocks(); this.endAll();
    this.poise = 0; this.poiseCD = this.def.poiseCooldown; this.staggerT = this.def.staggerTime;
    if (this.phase === 1) { this.setTex(this.mesh, 'head_hurt'); this.openEye(this.def.staggerTime + 1.2); }
    this.shake(0.35);
    g.post.shake(0.9); sfx.roar();
    g.fx.stamp('don', g.W * 0.5, g.H * 0.7, 0.24, 0);
    this.timer = Math.max(this.timer, this.def.staggerTime + 0.6);
  }
  openEye(t) { if (this.phase === 1) { this.eyeT = t; this.setTex(this.mesh, 'head_eye'); } }
  shake(a) { const o = this.phase === 3 ? this.p3g : this.phase === 2 ? this.p2g : this.root; const x0 = o.position.x; this.game.tweens.run(0.5, (e) => { o.position.x = x0 + Math.sin(e * 40) * a * (1 - e); }); }

  // ---------------------------------------------------------------- locks (on-screen warnings that follow a part)
  addLock(type, slot, m, u, v, dur, size) {
    const L = this.game.fx.lock(type, slot); const o = { L, m, u, v, t: 0, dur, size };
    this.locks.push(o); return o;
  }
  dropLock(o) { if (!o) return; o.L.remove(); this.locks = this.locks.filter((x) => x !== o); }
  clearLocks() { for (const o of this.locks) o.L.remove(); this.locks = []; this.hands.forEach((h) => { h.lock = null; }); this.game.post.u.warn.value = 0; }
  endAll() {
    this.armor = false; this.raising = false; this.guard = false;
    // hands go back to the roof, the heads to their resting looks
    for (const h of this.hands) if (h.busy) { h.busy = false; this.setTex(h.m, 'grip'); this.game.tweens.kill(h.g.position); this.game.tweens.to(h.g.position, { x: h.home.x, y: h.home.y, z: h.home.z }, 0.6, { ease: Ease.outCubic }); h.g.scale.setScalar(1); }
    if (this.phase === 1 && this.eyeT <= 0) this.setTex(this.mesh, 'head');
    if (this.phase === 2) this.setTex(this.p2, 'p2_low');
  }

  // ---------------------------------------------------------------- frame
  update(dt, t) {
    if (!this.alive) return;
    const g = this.game;
    // damage marks and flash on every part, the painting's light
    for (const m of this.parts) { const u = m.material.uniforms; u.flash.value = Math.max(0, u.flash.value - dt * 6); (m.userData.dm || this.dm).update(dt); g.world.lightAt(this.root.position, u.lit.value); }
    this.poise = Math.max(0, this.poise - this.def.poise * this.def.poiseDrain * dt);
    this.poiseCD -= dt; this.staggerT -= dt;
    if (this.eyeT > 0) { this.eyeT -= dt; if (this.eyeT <= 0 && this.phase === 1 && !this.armor) this.setTex(this.mesh, 'head'); }
    if (this.staggerT <= 0 && this.phase === 1 && this.mesh.userData.texKey === K('head_hurt') && this.eyeT <= 0) this.setTex(this.mesh, 'head');
    // breathing: everything sways a little, slowly (she is enormous)
    const br = Math.sin(t * 0.9) * 0.012;
    this.root.scale.set(1, 1 + br, 1); this.p2g.scale.set(1, 1 + br, 1);
    if (this.phase === 3) this.p3g.rotation.z = Math.sin(t * 0.6) * 0.02;
    for (const o of this.locks) {
      o.t += dt;
      const s = this.screen(o.m, o.u, o.v);
      o.L.set(s.x, s.y, g.H * o.size, Math.min(1, o.t / o.dur), t);
    }
    g.post.u.warn.value = this.locks.some((o) => o.L.type === 'heavy') ? 0.3 + 0.3 * Math.abs(Math.sin(t * 8)) : Math.max(0, g.post.u.warn.value - dt);
    if (this.busy || this.staggerT > 0 || this.armor || this.raising) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    const P = this.def.patterns[this.phase - 1], move = P[this.pi++ % P.length];
    this[move]();
  }

  // ---------------------------------------------------------------- phase 1
  throwStuff() {
    const g = this.game, D = this.def.throw, h = this.hands[this.pi % 2];
    h.busy = true; this.setTex(h.m, 'throw');
    const up = h.home.clone().add(new THREE.Vector3(0, this.Lo.handW * 0.8, 0));
    g.tweens.to(h.g.position, { y: up.y }, 0.45, { ease: Ease.outBack });
    const n = rr(D.shots[this.phase - 1] || D.shots[0]);
    for (let i = 0; i < n; i++) this.later(0.5 + i * D.gap, () => {
      const kind = D.projectiles[i % D.projectiles.length];
      g.spawnProjectile(kind, h.g.position.clone(), { slot: g.pickTarget(h.side), time: D.flight, curve: (i % 2 ? 1 : -1) * D.curve, dmg: D.dmg });
      sfx.throwIt(0);
    });
    this.later(0.6 + n * D.gap, () => { h.busy = false; this.setTex(h.m, 'grip'); g.tweens.to(h.g.position, { y: h.home.y }, 0.5, { ease: Ease.outCubic }); });
    this.timer = 0.8 + n * D.gap + D.rest;
  }
  slam() {
    const g = this.game, D = this.def.slam, slot = g.pickTarget(this.pi % 2 ? 0.5 : -0.5), h = this.hands[slot === 1 ? 1 : 0];
    h.busy = true; h.poise = 0; this.setTex(h.m, 'slam');
    sfx.warn(); g.warnSlam();
    // the hand rises high over the building, then hangs there (the wind-up: shoot it to stop it)
    const high = h.home.clone().add(new THREE.Vector3(0, this.Lo.handW * 1.6, 0));
    g.tweens.to(h.g.position, { x: high.x, y: high.y, z: high.z }, D.windup * 0.6, { ease: Ease.outCubic });
    h.lock = this.addLock('melee', slot, h.m, 0.5, 0.5, D.windup, 0.16);
    this.later(D.windup, () => {
      this.dropLock(h.lock); h.lock = null;
      // down onto that heroine's cover: it comes all the way at the camera
      const cov = g.world.covers[slot], c = g.world.camPos;
      const to = new THREE.Vector3(cov ? cov.def.x : c.x + (slot ? 1 : -1), 0.3, cov ? cov.def.z - 0.4 : c.z - 1.6);
      g.tweens.to(h.g.position, { x: to.x, y: to.y, z: to.z }, D.fall, {
        ease: Ease.inQuad,
        onDone: () => {
          if (!this.alive) return;
          sfx.slam(); g.post.shake(1.6); g.post.flash(0.4, 0xffffff);
          g.fx.confetti(to, 30, 2.6, [COL.bone, COL.paper]);
          g.fx.stamp('don', g.W * (slot ? 0.7 : 0.3), g.H * 0.4, 0.3, 0);
          if (cov && g.world.breakCover) g.world.breakCover(cov);
          g.playerAttacked({ kind: 'melee', dmg: D.dmg, from: this, slot });
          this.later(0.7, () => { h.busy = false; this.setTex(h.m, 'grip'); g.tweens.to(h.g.position, { x: h.home.x, y: h.home.y, z: h.home.z }, 0.9, { ease: Ease.inOutQuad }); });
        },
      });
    });
    this.timer = D.windup + D.fall + D.rest;
  }
  breakSlam(h) {
    const g = this.game;
    this.seq++;
    this.dropLock(h.lock); h.lock = null; h.poise = 0; h.busy = false;
    g.tweens.kill(h.g.position);
    this.setTex(h.m, 'grip');
    g.tweens.to(h.g.position, { x: h.home.x, y: h.home.y, z: h.home.z }, 0.7, { ease: Ease.outBack });
    g.fx.stamp('don', g.W * 0.5, g.H * 0.72, 0.28, 0);
    g.post.shake(1); sfx.roar(); g.G.stop(0.12);
    g.hud.gl.stickers.say(g.players.find((p) => p.state === 'out') || g.players[0], 'stagger');
    this.setTex(this.mesh, 'head_hurt');
    this.staggerT = 1.2;
    this.later(1.0, () => this.openEye(this.def.eyeOpen));
    this.timer = 1.2 + this.def.eyeOpen * 0.7;
  }
  whistle() {
    const g = this.game, D = this.def.whistle;
    this.armor = true;
    this.setTex(this.mesh, 'head_blow');
    sfx.warn(); setTimeout(() => sfx.warn(), 300);
    const o = this.addLock('heavy', -1, this.mesh, 0.5, 0.62, D.windup, 0.24);
    this.later(D.windup, () => {
      this.dropLock(o);
      this.blast(D.dmg, 0.5, 0.62);
      this.armor = false;
      this.later(0.4, () => this.openEye(this.def.eyeOpen));
    });
    this.timer = D.windup + this.def.eyeOpen + D.rest;
  }
  blast(dmg, u, v, m = this.phase === 3 ? this.p3 : this.phase === 2 ? this.p2 : this.mesh) {
    const g = this.game;
    sfx.slam(); sfx.madness();
    g.post.flash(0.7, 0xff4fb0); g.post.shake(1.6);
    const p = this.partPoint(m, u, v);
    g.fx.confetti(p, 50, 6, [COL.pink, COL.white, COL.hot]); g.fx.star(p, 8, COL.pink);
    g.fx.stamp('gogogo', g.W * 0.5, g.H * 0.6, 0.32, 0);
    g.playerAttacked({ kind: 'ranged', dmg, from: this, heavy: true, slot: -1 });
  }

  // ---------------------------------------------------------------- phase changes
  toPhase(n) {
    const g = this.game;
    this.phase = n; this.seq++; this.clearLocks(); this.endAll();
    this.busy = true; this.pi = 0;
    sfx.roar(); sfx.madness();
    g.post.flash(0.9, 0xff3a8a); g.post.shake(1.5); g.G.stop(0.3);
    g.hud.gl.hold('phase', { text: tr(this.def.texts[`phase${n}`]), dur: 2.4 });   // transforming: nothing to shoot for a moment
    g.clearProjectiles && g.clearProjectiles();
    if (n === 2) {
      // head and hands sink behind the roof; she climbs up, transformed
      g.tweens.to(this.root.position, { y: this.headHome.y - this.Lo.headH }, 1.1, { ease: Ease.inCubic });
      this.hands.forEach((h) => g.tweens.to(h.g.position, { y: h.home.y - this.Lo.handW * 1.2 }, 0.8, { ease: Ease.inCubic }));
      g.tweens.wait(1.3, () => {
        this.root.visible = false; this.hands.forEach((h) => { h.g.visible = false; });
        this.p2g.visible = true;
        g.tweens.to(this.p2g.position, { y: this.p2Home.y }, 1.6, { ease: Ease.outBack, onDone: () => { this.busy = false; this.timer = 0.8; g.post.shake(1.2); sfx.slam(); } });
      });
    } else {
      // she leans down over the yard: the face comes down from the top of the screen
      g.tweens.to(this.p2g.position, { y: this.p2Home.y - this.p2.userData.size.h }, 1.0, { ease: Ease.inCubic });
      g.tweens.wait(1.1, () => {
        this.p2g.visible = false; this.p3g.visible = true;
        g.tweens.to(this.p3g.position, { y: this.p3Home.y }, 1.5, { ease: Ease.outCubic, onDone: () => { this.busy = false; this.timer = 0.6; sfx.roar(); g.post.shake(1); } });
      });
    }
    this.timer = 99;
  }

  // ---------------------------------------------------------------- phase 2
  lash() {
    const g = this.game, D = this.def.lash, n = rr(D.shots);
    this.setTex(this.p2, 'p2_low'); sfx.roar();
    for (let i = 0; i < n; i++) this.later(0.3 + i * D.gap, () => {
      const from = this.partPoint(this.p2, rnd(0.1, 0.9), rnd(0.55, 0.95));
      g.spawnProjectile(D.projectiles[i % D.projectiles.length], from, { slot: g.pickTarget(from.x - g.world.camPos.x), time: D.flight, curve: rnd(-2, 2), dmg: D.dmg });
      sfx.throwIt(0);
    });
    this.timer = 0.4 + n * D.gap + D.rest;
  }
  raise() {
    const g = this.game, D = this.def.raise;
    this.raising = true; this.raisePoise = 0;
    this.setTex(this.p2, 'p2');
    sfx.warn(); setTimeout(() => sfx.warn(), 300); g.warnSlam();
    const w = meta[K('p2')]?.weak?.[0] || [0.8, 0.4, 0.07];
    this.raiseLock = this.addLock('heavy', -1, this.p2, w[0], w[1], D.windup, 0.2);
    this.later(D.windup, () => {
      this.dropLock(this.raiseLock); this.raiseLock = null; this.raising = false;
      this.blast(D.dmg, 0.3, 0.3);
      for (const c of g.world.covers) if (c.hp !== undefined) { c.hp -= D.coverDmg; if (c.hp <= 0 && g.world.breakCover) g.world.breakCover(c); }
      this.later(0.6, () => this.setTex(this.p2, 'p2_low'));
    });
    this.timer = D.windup + D.rest;
  }
  breakRaise() {
    const g = this.game;
    this.seq++;
    this.dropLock(this.raiseLock); this.raiseLock = null; this.raising = false;
    this.setTex(this.p2, 'p2_low');
    this.shake(0.6);
    g.fx.stamp('don', g.W * 0.5, g.H * 0.7, 0.3, 0); g.post.shake(1.2); sfx.roar(); g.G.stop(0.15);
    g.hud.gl.stickers.say(g.players.find((p) => p.state === 'out') || g.players[0], 'stagger');
    this.staggerT = this.def.staggerTime;
    this.timer = this.def.staggerTime + 0.8;
  }
  guardUp() {
    const g = this.game, D = this.def.guard;
    this.guard = true; this.setTex(this.p2, 'p2_low');
    sfx.roar();
    this.summonWave(D.spawns);
    this.later(D.time, () => { this.guard = false; });
    this.timer = D.time + 0.6;
  }
  summonWave(spawns) {
    const g = this.game;
    spawns.forEach((s, i) => this.later(0.3 + i * 0.4, () => g.spawnEnemy({ ...s })));
  }

  // ---------------------------------------------------------------- phase 3
  scream() {
    const g = this.game, D = this.def.scream;
    this.armor = true;
    sfx.warn(); setTimeout(() => sfx.warn(), 250);
    const o = this.addLock('heavy', -1, this.p3, 0.47, 0.28, D.windup, 0.3);
    // the megaphone swells
    g.tweens.run(D.windup, (e) => { this.p3.scale.setScalar(1 + e * 0.04); });
    this.later(D.windup, () => { this.dropLock(o); this.p3.scale.setScalar(1); this.blast(D.dmg, 0.47, 0.28); this.armor = false; });
    this.timer = D.windup + D.rest;
  }
  volley() {
    const g = this.game, D = this.def.volley, n = rr(D.shots);
    for (let i = 0; i < n; i++) this.later(0.2 + i * D.gap, () => {
      g.spawnProjectile(D.projectiles[i % D.projectiles.length], this.partPoint(this.p3, rnd(0.35, 0.6), rnd(0.1, 0.35)), { slot: g.pickTarget(i % 2 ? 1 : -1), time: D.flight, curve: rnd(-2.5, 2.5), dmg: D.dmg });
      sfx.throwIt(0);
    });
    this.timer = 0.3 + n * D.gap + D.rest;
  }
  summon() { this.summonWave(this.def.summon.spawns); this.timer = this.def.summon.rest; }

  // ---------------------------------------------------------------- death
  die() {
    this.alive = false; this.seq++;
    this.clearLocks();
    const g = this.game;
    sfx.roar(); g.post.flash(1, 0xffffff); g.post.shake(1.6);
    const m = this.phase === 3 ? this.p3 : this.phase === 2 ? this.p2 : this.mesh;
    for (let i = 0; i < 10; i++) g.tweens.wait(i * 0.22, () => { const p = this.partPoint(m, rnd(0.2, 0.8), rnd(0.2, 0.9)); g.fx.confetti(p, 40, 5); g.fx.star(p, 5, COL.pink); sfx.shatter(rnd(-0.5, 0.5)); g.post.shake(0.8); });
    // she dissolves into petals and paper
    g.tweens.wait(1.2, () => {
      sfx.burnOut(0);
      for (const p of this.parts) p.material.uniforms.dOrigin.value.set(0.5, 0.7);
      g.tweens.run(2.4, (e) => { for (const p of this.parts) p.material.uniforms.dissolve.value = e; }, { onDone: () => this.dispose() });
    });
    g.onBossDead(this);
  }
  dispose() {
    for (const o of [this.root, ...this.hands.map((h) => h.g), this.p2g, this.p3g]) o.parent && o.parent.remove(o);
    for (const m of this.parts) { m.material.dispose(); m.geometry.dispose(); (m.userData.dm || this.dm).dispose(); }
    this.removed = true;
  }
}
