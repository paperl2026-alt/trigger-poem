// The prologue boss "???" (docs/DESIGN.md 序章 / Boss, bosses.json "qq", art R43 boss/qq_s<n>_<pose>): the formless thing that fell on the
// school, possessing the discipline-committee girl and mutating her like the G-virus, five stages from infection to the core.
// Not a giant made of parts: one whole drawing at a time (idle / move / wind-up / attack / hurt), middle-sized, whole on the screen, drifting
// back and forth across the yard and throwing things (DESIGN「Boss」). One move at a time, with breathers between (DESIGN「关卡编排要有起伏」):
//   volley  things spat at the girls one after another (shoot them down: the amber edge)
//   lunge   it gathers itself (blue brackets: shoot it enough and it is interrupted) and lunges at one girl's cover
//   burst   a long wind-up nothing stops (the red edge: hide), then a blast over everyone
//   summon  (later stages) a few small monsters of one kind
//   move    it drifts somewhere else (the breather)
// Only its core takes damage (a ring marks it), and nothing gets through while it attacks (DESIGN「Boss」, 2026-10-18).
// Hits change its colour, never hole it (paper.js solid damage). Between stages it convulses, splashes ooze and the next mutation grows out
// (no comic: the fight keeps its rhythm).
import * as THREE from 'three';
import { tex, meta } from '../core/assets.js';
import { paperMesh, DamageMap, attachDamage, setRelief } from '../core/paper.js';
import { Ease } from '../core/tween.js';
import { sfx } from '../core/audio.js';
import { tr } from '../core/i18n.js';
import { Actor, Enemy } from './enemies.js';
import { Gimmick } from './gimmick.js';
import { COL } from './fx.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const rr = (r) => (Array.isArray(r) ? rnd(r[0], r[1]) : r);
const FRAMES = { idle: ['idle0', 'idle1'], move: ['move', 'idle0'], windup: ['windup'], attack: ['attack'], hurt: ['hurt'] };

export class TheThing extends Actor {
  constructor(game, def) {
    const S0 = def.stages[0];
    super(game, `${def.sprite || 'boss/qq'}_s1_idle0`, S0.h, S0.float ? 'center' : 'bottom');
    this.def = def; this.type = 'boss'; this.name = def.name;
    this.hp = this.maxHp = def.hp;
    this.frames = FRAMES; this.bp = { throwFrom: [0.5, 0.55] };
    this.stage = 0; this.seq = 0; this.pi = 0; this.timer = def.firstDelay; this.busy = true;
    this.state = 'idle'; this.timer0 = 1; this.poise = 0; this.poiseCD = 0; this.lock = null; this.armor = false;
    const w = game.world;
    this.cam = w.camPos.clone();
    this.zone = def.zone;   // where it moves: x range, z range (metres in the yard)
    this.root.position.set(0, 0, this.zone.z[1]);
    w.scene.add(this.root);
    this.shadowM = w.makeShadow(1); w.scene.add(this.shadowM);
    this.setStage(0);
    // it rises out of the ground
    const P = this.root.position, y0 = P.y;
    P.y = y0 - this.h * 0.9; this.inner.scale.set(0.6, 0.6, 1);
    game.etw.to(P, { y: y0 }, 1.6, { ease: Ease.outBack });
    game.etw.to(this.inner.scale, { x: 1, y: 1 }, 1.6, { ease: Ease.outBack, onDone: () => { this.busy = false; } });
    sfx.roar(); game.post.shake(1);
  }
  get S() { return this.def.stages[this.stage]; }
  phases() { return this.def.stages.length; }

  // ---------------------------------------------------------------- a stage's drawing set: a new mesh (its own size and shape)
  setStage(n) {
    this.stage = n;
    const S = this.S, key = `${this.def.sprite || 'boss/qq'}_s${n + 1}_idle0`, t = tex[key];
    if (!t) { console.warn('boss: no frames for stage', n + 1); return; }
    const figH = meta[key]?.figH || 1, pivot = S.float ? 'center' : 'bottom';
    this.pivot = pivot; this.ar = t.image.width / t.image.height; this.h = S.h / figH; this.w = this.h * this.ar;
    const old = this.mesh;
    this.inner.remove(old); old.geometry.dispose(); old.material.dispose(); this.dm.dispose();
    this.relief = !!meta[key]?.relief;
    this.mesh = paperMesh(t, this.w, { pivot, segs: this.relief ? [64, Math.max(8, Math.round(64 / this.ar))] : null });
    if (this.relief) setRelief(this.mesh, tex[meta[key].relief], Math.min(this.w, this.h) * 0.12);
    this.mesh.userData.owner = this; this.mesh.userData.texKey = key;
    this.dm = new DamageMap(1 / this.ar, 512); attachDamage(this.mesh, this.dm, true);
    this.u = this.mesh.material.uniforms;
    this.u.outlineOn.value = 1; this.u.mapTexel.value.set(1 / t.image.width, 1 / t.image.height);
    this.inner.add(this.mesh);
    this.prefix = `${this.def.sprite || 'boss/qq'}_s${n + 1}_`; this.anim = null; this.play('idle', 3);
    this.root.position.y = S.float ? S.y : 0;
    this.shadowM.scale.setScalar(this.w * 0.6);
  }

  // ---------------------------------------------------------------- her child's things (bosses.json "ritual"; docs/DESIGN.md 第 1 话 10;
  // in Sweet Home the lady is laid to rest by showing her the photo, then the diary, then her child's coffin). In her last form the three
  // come out and swing back and forth before her, each on its own beat, and now and then one of them swings in front of her core and
  // takes the shots meant for her. Nothing hurts them. Each counts down, at an uneven pace, to a blow of its own at one of the girls (the
  // red "shoot it" ring: hiding does not help); a shot knocks it back and starts its count again, and she cries out (they are her child's).
  // Her core is open in the gaps between them. When her strength is gone she sinks down and the three hang still in a row: shown to her
  // in the right order (her words tell which) each one flies into her arms; with the last her child comes back to her and she is at rest.
  // A wrong one floats back.
  ritual() {
    const g = this.game, R = this.def.ritual, P = this.root.position;
    this.ritualNext = 0; this.stuck = 0; this.talkT = 0;
    this.keeps = R.items.map((k, i) => {
      const gm = new Keepsake(g, this, i, { id: `ritual${i}`, k, on: 'air', x: P.x, y: this.S.h * 0.5, z: P.z, w: R.w ?? 1.3, station: g.stationId });
      gm.inner.scale.setScalar(0.01); g.tweens.to(gm.inner.scale, { x: 1, y: 1, z: 1 }, 0.6, { delay: i * 0.35, ease: Ease.outBack });
      g.actors.push(gm); return gm;
    });
    this.guardT = rr(R.guard.every);
    sfx.clear(); g.post.flash(0.3, 0xfff0c8);
    this.say('keep');
  }
  // one of them is shot: nothing happens to it but a knock (its count starts again) and her cry; once she is down, it is shown to her
  keepHit(k, info) {
    const g = this.game, R = this.def.ritual;
    info.dealt = 0; k.flash = 1;
    const p = k.uvToWorld(info.uv.u, info.uv.v);
    g.fx.star(p, 0.6, COL.white); g.fx.confetti(p, 3, 0.9, [COL.white, COL.bone]);
    if ((this.tickT || 0) <= 0) { sfx.clang(); this.tickT = 0.18; }
    if (this.grief) { this.offer(k.i, k); return; }
    k.knock();
    if (this.talkT <= 0) { this.talkT = R.talkGap ?? 7; this.say(R.lines[k.i]); }
  }
  // her strength is gone (only once her child's things are out): she sinks down, and they hang still in a row before her
  grieve() {
    const g = this.game, P = this.root.position;
    this.grief = true; this.seq++; this.endWindup(); this.markCore(false); this.armor = false; this.hp = 0;
    g.clearProjectiles();
    for (const a of g.actors) if (a instanceof Enemy && a.alive) a.die('mantra', { uv: { u: 0.5, v: 0.5 } });   // (what she called up goes with her)
    this.state = 'hurt'; this.play('hurt'); this.flash = 1;
    sfx.roar(); g.post.flash(0.5, 0xffffff); g.post.shake(1);
    g.etw.kill(P); g.tweens.to(P, { y: -this.S.h * 0.15 }, 1.4, { ease: Ease.outQuad });
    for (const k of this.keeps) k.still();
    this.stuck = 0; this.say('kneel');
  }
  offer(i, gm) {
    const g = this.game, R = this.def.ritual;
    if (!this.alive || gm.mode !== 'still') return;
    if (i !== this.ritualNext) {   // not that one yet: it shakes and floats back
      sfx.miss(); if (this.talkT <= 0) { this.talkT = 3; this.say('wrong'); }
      g.tweens.run(0.4, (e) => { gm.inner.position.x = Math.sin(e * 40) * 0.08 * (1 - e); });
      return;
    }
    const n = ++this.ritualNext; this.stuck = 0;
    gm.mode = 'offered'; gm.u.outlineOn.value = 0;
    const P = gm.root.position, to = this.uvToWorld(0.5, 0.55);   // (into her arms)
    g.tweens.to(P, { x: to.x, y: to.y, z: to.z + 0.3 }, 0.9, { ease: Ease.inOutQuad, onDone: () => {
      gm.act({ gone: true });
      if (!this.alive) return;
      this.flash = 1; g.post.flash(0.4, 0xfff0c8); sfx.clear();
      g.fx.confetti(to, 24, 2.4, [COL.pink, COL.white]);
      if (n < R.items.length) { this.talkT = 0; this.say(`offer${n}`); return; }
      this.rest();
    } });
  }
  // the last one: a small light rises from where the coffin went into her arms - her child back with her - and she is at rest
  rest() {
    const g = this.game, to = this.uvToWorld(0.5, 0.6), from = to.clone().setY(0.3), q = new THREE.Vector3();
    this.seq++; this.say('rest');
    let k = 0;
    g.tweens.run(2.6, (e) => {
      if (e * 30 < k) return; k++;
      q.lerpVectors(from, to, e); q.x += Math.sin(e * 9) * 0.25;
      g.fx.star(q, 0.9, COL.white); if (k % 3 === 0) g.fx.confetti(q, 3, 0.5, [COL.white, COL.pink]);
    }, { onDone: () => { if (this.alive) this.die(true); } });
  }
  say(kind) { this.game.hud.gl.stickers.boss?.(this, kind); }

  // ---------------------------------------------------------------- hits
  // DESIGN「Boss」(2026-10-18): only its core takes damage (each form's "core": [u, v] on its drawing, radius r of its height; a ring
  // marks it); everything else glances off. While it attacks nothing gets through; its wind-up is the opening (and hits on the core
  // there can break a lunge off)
  hitMeshes() { return this.alive && !this.grief ? [this.mesh] : []; }   // (down and grieving: not a target any more, only her child's things)
  weakNow() { return !this.mutating && !this.grief && this.state !== 'attack'; }
  onCore(uv) {
    const c = this.S.core; if (!c) return true;
    return Math.hypot((uv.u - c[0]) * this.w / this.h, uv.v - c[1]) < (c[2] ?? 0.11);
  }
  glance(info) {   // a shot that does nothing: sparks and a tick
    info.dealt = 0;
    const p = this.uvToWorld(info.uv.u, info.uv.v), fx = this.game.fx;
    fx.star(p, 0.5, COL.white); fx.confetti(p, 2, 0.8, [COL.white, COL.bone]);
    if ((this.tickT || 0) <= 0) { sfx.clang(); this.tickT = 0.18; }
  }
  hit(info) {
    if (!this.alive || this.mutating) return;
    if (this.grief) { this.glance(info); return; }
    const D = this.def;
    if (!this.weakNow() || !this.onCore(info.uv)) { this.glance(info); return; }
    const dmg = info.dmg * (D.coreMul ?? 1);
    info.dealt = dmg; this.lastHitBy = info.by;
    this.paint(info);
    this.flash = Math.max(this.flash, 0.7);
    const p = this.uvToWorld(info.uv.u, info.uv.v), fx = this.game.fx;
    fx.ink(p, 8, 2.6, COL.hot); fx.star(p, 2.5, COL.pink);
    // a lunge being gathered breaks off when its core is hit enough
    if (this.state === 'windup' && this.move === 'lunge' && info.stagger) { this.poise += info.stagger; if (this.poise >= D.lunge.poise) this.interrupt(); }
    this.hp -= dmg;
    if (D.ritual && !this.keeps) this.hp = Math.max(this.hp, 1);   // (her child's things come out before her end)
    this.game.onHit(this, info.kind, info);
    if (this.hp <= 0) { if (this.keeps) this.grieve(); else this.die(); return; }
    // the next mutation
    const next = this.def.stages.findIndex((s, i) => i > this.stage && this.hp <= this.maxHp * s.at);
    if (next > this.stage && !this.mutating) this.mutate(next);
  }
  interrupt() {
    const g = this.game;
    this.seq++; this.endWindup(); this.poise = 0;
    this.state = 'hurt'; this.play('hurt'); this.flash = 1;
    g.fx.stamp('don', g.W * 0.5, g.H * 0.68, 0.26, 0); g.post.shake(0.9); sfx.roar(); g.G.stop(0.1);
    g.hud.gl.stickers.say(g.players.find((p) => p.state === 'out') || g.players[0], 'stagger');
    this.later(this.def.stunTime, () => { this.state = 'idle'; this.play('idle', 3); });
    this.timer = this.def.stunTime + 0.8;
  }
  endWindup() { if (this.lock) { this.lock.remove(); this.lock = null; } }
  // where the AI partner aims (src/core/input.js): the core, on screen (y down like screenBox)
  aimAt() { const c = this.S.core; if (!c) return null; const g = this.game, sc = g.world.project(this.uvToWorld(c[0], c[1])); return { x: sc.x, y: sc.y }; }
  // the ring round the core (the small kill ring: shoot inside it), gone while it attacks or changes
  markCore(on, t) {
    const g = this.game;
    if (!on) { if (this.coreMark) { this.coreMark.remove(); this.coreMark = null; } return; }
    if (!this.coreMark) this.coreMark = g.fx.orbit('shot', -1);
    const c = this.S.core, wc = this.uvToWorld(c[0], c[1]), sc = g.world.project(wc), top = g.world.project(this.uvToWorld(c[0], c[1] + (c[2] ?? 0.11)));
    this.coreMark.set(sc.x, g.H - sc.y, Math.max(18, Math.abs(top.y - sc.y)), 0.2, t, 9, null, null);
  }
  later(s, fn) { const q = this.seq; this.game.etw.wait(s, () => { if (this.alive && q === this.seq) fn(); }); }

  // ---------------------------------------------------------------- frame
  update(dt, t) {
    if (!this.alive) { this.baseUpdate(dt, t); return; }
    this.baseUpdate(dt, t);
    const g = this.game, P = this.root.position;
    this.root.rotation.y = Math.atan2(g.world.camPos.x - P.x, g.world.camPos.z - P.z);
    if (this.S.float) P.y = this.S.y + Math.sin(t * 1.3) * 0.18;
    this.shadowM.position.set(P.x, 0.03, P.z);
    // attacking: the outline goes hard white (nothing gets through); otherwise its usual white, and the core is ringed
    const wk = this.weakNow();
    this.u.outlineCol.value.setRGB(1, 1, 1);
    this.tickT = (this.tickT || 0) - dt;
    this.markCore(wk && this.S.core, t);
    if (this.keeps) this.keepTick(dt);
    // breathing
    this.inner.scale.y += ((1 + Math.sin(t * 2.1) * 0.025) - this.inner.scale.y) * Math.min(1, dt * 6);
    if (this.lock) {
      const wc = this.center(), c = g.world.project(wc), b = g.box(this);
      this.lock.set(c.x, g.H - c.y, Math.max(40, (b.y1 - b.y0) * 0.5), Math.min(1, 1 - this.timer / this.timer0), t, this.timer, b, wc);
      this.timer -= dt;
      return;
    }
    if (this.busy || this.mutating || this.grief || this.state === 'hurt') return;
    this.timer -= dt;
    if (this.timer > 0) return;
    const P2 = this.S.pattern, mv = P2[this.pi++ % P2.length];
    this.move = mv; this[mv]();
  }

  // her child's things: now and then one of them goes in front of her core for a while
  keepTick(dt) {
    const R = this.def.ritual;
    this.talkT -= dt;
    if (this.grief) {   // stuck on which to show her: she says it again
      this.stuck += dt;
      if (this.stuck > (R.hint ?? 9) && this.talkT <= 0) { this.stuck = 0; this.talkT = 4; this.say(this.ritualNext ? `offer${this.ritualNext}` : 'kneel'); }
      return;
    }
    if (this.mutating || !this.game.combat) return;
    this.guardT -= dt;
    if (this.guardT > 0) return;
    const on = this.keeps.find((k) => k.mode === 'guard'), free = this.keeps.filter((k) => k.mode === 'swing');
    if (on) { on.mode = 'swing'; this.guardT = rr(R.guard.every); }
    else if (free.length) { free[Math.floor(Math.random() * free.length)].mode = 'guard'; this.guardT = rr(R.guard.time); }
    else this.guardT = 0.5;
  }

  // ---------------------------------------------------------------- moves
  drift() {
    const g = this.game, Z = this.zone, P = this.root.position;
    let x = rnd(Z.x[0], Z.x[1]); if (Math.abs(x - P.x) < 1.5) x = P.x > 0 ? Z.x[0] * 0.7 : Z.x[1] * 0.7;
    const z = rnd(Z.z[0], Z.z[1]), d = Math.hypot(x - P.x, z - P.z), time = Math.max(1.2, d / this.def.speed);
    this.state = 'move'; this.play('move', 4);
    g.etw.to(P, { x, z }, time, { ease: Ease.inOutQuad, onDone: () => { if (this.alive && this.state === 'move') { this.state = 'idle'; this.play('idle', 3); } } });
    this.timer = time + rr(this.def.rest);
  }
  windup(time, threat, slot, then) {
    const g = this.game;
    this.state = 'windup'; this.timer = this.timer0 = time; this.poise = 0;
    this.play('windup');
    this.lock = g.fx.lock(threat, slot);
    g.fx.charge(this, threat === 'hide' ? 0xff4fc8 : 0xffb04a);
    sfx.warn();
    this.later(time, () => { this.endWindup(); then(); });
  }
  attackPose(dur) {
    this.state = 'attack'; this.play('attack');
    this.later(dur, () => { if (this.state === 'attack') { this.state = 'idle'; this.play('idle', 3); } });
  }
  volley() {
    const g = this.game, D = this.def.volley, n = Math.round(rr(this.S.shots || D.shots)), kinds = D.projectiles;
    this.attackPose(0.4 + n * D.gap);
    for (let i = 0; i < n; i++) this.later(0.3 + i * D.gap, () => {
      const from = this.uvToWorld(rnd(0.35, 0.65), rnd(0.45, 0.7));
      g.spawnProjectile(kinds[(i + this.stage) % kinds.length], from, { slot: g.pickTarget(from.x - g.world.camPos.x), time: D.flight, curve: rnd(-2, 2), dmg: D.dmg });
      sfx.throwIt(0);
    });
    this.timer = 0.6 + n * D.gap + rr(this.def.rest);
  }
  lunge() {
    const g = this.game, D = this.def.lunge, slot = g.pickTarget(this.root.position.x - g.world.camPos.x);
    this.windup(D.windup, 'kill', slot, () => {
      // it throws itself at that girl's cover and comes back
      const P = this.root.position, home = P.clone(), cov = g.world.covers[slot], c = g.world.camPos;
      const to = new THREE.Vector3(cov ? cov.def.x : c.x + (slot ? 1 : -1), P.y, cov ? cov.def.z - 1.2 : c.z - 3);
      this.attackPose(D.time + 0.4);
      g.etw.to(P, { x: to.x, z: to.z }, D.time, { ease: Ease.inQuad, onDone: () => {
        if (!this.alive) return;
        sfx.slam(); g.post.shake(1.3); g.fx.confetti(to, 20, 2.2, [COL.hot, COL.bone]);
        if (cov && cov.hp !== undefined) { cov.hp -= D.coverDmg; if (cov.hp <= 0 && g.world.breakCover) g.world.breakCover(cov); }
        g.playerAttacked({ kind: 'ram', dmg: D.dmg, from: this, slot });
        g.etw.to(P, { x: home.x, z: home.z }, 0.9, { delay: 0.3, ease: Ease.inOutQuad });
      } });
    });
    this.timer = D.windup + D.time + 1.4 + rr(this.def.rest);
  }
  burst() {
    const g = this.game, D = this.def.burst;
    this.armor = true;
    this.windup(D.windup, 'hide', -1, () => {
      this.armor = false; this.attackPose(0.8);
      sfx.slam(); sfx.madness(); g.post.flash(0.6, 0xff3aa0); g.post.shake(1.6);
      const p = this.center(); g.fx.confetti(p, 50, 6, [COL.pink, COL.hot, COL.white]); g.fx.star(p, 8, COL.pink);
      g.fx.stamp('gogogo', g.W * 0.5, g.H * 0.6, 0.3, 0);
      g.playerAttacked({ kind: 'ranged', dmg: D.dmg, from: this, heavy: true, slot: -1 });
    });
    this.timer = D.windup + 1.2 + rr(this.def.rest);
  }
  summon() {
    const g = this.game, list = this.S.summon || this.def.summon;
    this.attackPose(0.8); sfx.roar();
    list.forEach((s, i) => this.later(0.4 + i * 0.7, () => g.spawnEnemy({ ...s })));
    this.timer = 1.2 + list.length * 0.7 + this.def.summonRest;
  }

  // ---------------------------------------------------------------- the next mutation (DESIGN「Boss」: about 2 s, nobody can shoot):
  // it convulses and splashes ooze, a white flash, the next form bursts out and grows in. Real time (not the enemies' slower clock).
  mutate(n) {
    const g = this.game, tw = g.tweens, M = this.def.mutate || { shake: 1.1, grow: 0.8 };
    this.mutating = true; this.seq++; this.endWindup(); this.armor = false;
    g.lull = true;
    g.clearProjectiles && g.clearProjectiles();
    this.state = 'hurt'; this.play('hurt');
    sfx.roar(); sfx.madness(); g.post.flash(0.8, 0xff3a8a); g.post.shake(1.4); g.G.stop(0.25);
    g.hud.gl.hold('phase', { text: tr(this.def.texts[`s${n + 1}`] || this.def.texts.mutate), dur: M.shake + M.grow + 0.2 });
    let k = 0;
    tw.run(M.shake, (e) => {
      this.flash = Math.max(this.flash, e > 0.7 ? (e - 0.7) / 0.3 : 0.25 * Math.max(0, Math.sin(e * 30)));
      this.inner.position.x = Math.sin(e * 70) * 0.12 * (1 - e);
      this.inner.scale.set(1 + Math.sin(e * 40) * 0.08, 1 - Math.sin(e * 40) * 0.06, 1);
      if (e * 6 > k) { k++; const p = this.uvToWorld(rnd(0.2, 0.8), rnd(0.2, 0.9)); g.fx.ink(p, 10, 3, COL.hot); g.fx.confetti(p, 12, 2.5, [COL.hot, 0x2a0a2a]); }
    }, { onDone: () => {
      this.inner.position.x = 0;
      this.setStage(n);
      this.inner.scale.set(0.45, 0.45, 1); this.flash = 1;
      g.post.flash(0.45, 0xffffff);
      for (let i = 0; i < 8; i++) { const q = this.uvToWorld(rnd(0.1, 0.9), rnd(0.1, 0.9)); g.fx.confetti(q, 14, 3.5, [COL.hot, 0x2a0a2a, COL.bone]); }
      tw.to(this.inner.scale, { x: 1, y: 1 }, M.grow, { ease: Ease.outBack, onDone: () => { this.mutating = false; g.lull = false; this.pi = 0; this.timer = 1.2; this.state = 'idle'; this.play('idle', 3); } });
      if (this.def.ritual && n === this.def.stages.length - 1) tw.wait(M.grow + 1.2, () => this.alive && this.ritual());
      g.post.shake(1.2); sfx.slam();
      if (n === this.def.wreckAt && g.world.named?.school && tex[this.def.schoolAfter]) {   // it smashes the school: the building is damaged from now on
        const sc = g.world.named.school; sc.m.material.map = tex[this.def.schoolAfter]; sc.m.material.needsUpdate = true; sc.m.userData.texKey = this.def.schoolAfter;
        for (let i = 0; i < 5; i++) g.fx.confetti(new THREE.Vector3(rnd(-10, 10), rnd(4, 11), sc.z + 0.5), 20, 4, [COL.bone, COL.paper]);
      }
    } });
  }

  // ---------------------------------------------------------------- purified
  die(calm) {   // (calm: laid to rest - her child back with her - not torn apart)
    this.alive = false; this.seq++; this.endWindup(); this.markCore(false);
    for (const o of this.keeps || []) if (o.alive) o.act({ gone: true });
    const g = this.game;
    if (calm) { sfx.clear(); g.post.flash(0.8, 0xfff6e8); } else { sfx.roar(); g.post.flash(1, 0xffffff); g.post.shake(1.6); this.play('hurt'); }
    for (let i = 0; i < 10; i++) g.tweens.wait(i * 0.2, () => { const q = this.uvToWorld(rnd(0.2, 0.8), rnd(0.2, 0.9)); if (calm) { g.fx.confetti(q, 14, 1.5, [COL.white, COL.pink]); g.fx.star(q, 2, COL.white); return; } g.fx.confetti(q, 40, 5); g.fx.star(q, 5, COL.pink); sfx.shatter(rnd(-0.5, 0.5)); g.post.shake(0.8); });
    g.tweens.wait(1.2, () => {
      sfx.burnOut(0);
      this.u.dOrigin.value.set(0.5, 0.6);
      g.tweens.run(2.2, (e) => { this.u.dissolve.value = e; }, { onDone: () => this.dispose() });
    });
    g.onBossDead(this);
  }
}

// one of her child's things (TheThing.ritual): swings before her, guards her core now and then, counts down to its blow; can't be hurt
class Keepsake extends Gimmick {
  constructor(game, boss, i, g) {
    super(game, g);
    const R = boss.def.ritual, S = R.swing;
    this.boss = boss; this.i = i; this.billboard = true; this.mode = 'swing'; this.q = 0; this.knockT = 0;
    this.ph = i * 2.1 + rnd(0, 1); this.sp = rr(S.speed); this.amp = rr(S.x); this.yk = S.y[i % S.y.length];
    this.to = this.root.position.clone(); this.rate = 1; this.rateT = 0;
    this.restart(rr(S.first ?? R.fuse));
  }
  live() { return this.alive && this.game.combat && this.mode !== 'offered'; }
  hit(info) { if (this.live()) this.boss.keepHit(this, info); }
  // a new count to its next blow, at one of the girls
  restart(s) {
    const g = this.game;
    this.fuse = this.fuse0 = s ?? rr(this.boss.def.ritual.fuse);
    this.slot = g.pickTarget(this.root.position.x - g.world.camPos.x);
    if (this.ring) this.ring.slot = this.slot;
  }
  ringOff() { if (this.ring) { this.ring.remove(); this.ring = null; } }
  // shot: knocked back a little, spinning, and its count starts again (a blow on its way is stopped)
  knock() {
    const g = this.game;
    if (this.mode === 'strike') { this.q++; g.tweens.kill(this.root.position); this.mode = 'swing'; }
    this.restart();
    if (this.knockT > 0) return;
    this.knockT = 0.45;
    g.tweens.run(0.45, (e) => { this.inner.rotation.y = Math.sin(e * Math.PI * 2) * 0.7 * (1 - e); this.inner.position.z = -Math.sin(e * Math.PI) * 0.6; },
      { onDone: () => { this.inner.rotation.y = 0; this.inner.position.z = 0; } });
  }
  // she is down: it stops where it is and waits to be shown to her
  still() { this.q++; this.game.tweens.kill(this.root.position); this.mode = 'still'; this.ringOff(); this.flash = 1; }
  // its count ran out: a shiver, then it flies at that girl and strikes (bosses.json ritual.strike), and swings back to its place
  strike() {
    const g = this.game, B = this.boss, A = B.def.ritual.strike[this.i] || B.def.ritual.strike[0], P = this.root.position, q = ++this.q;
    this.mode = 'strike'; this.ringOff();
    const c = g.world.camPos, to = new THREE.Vector3(c.x + (this.slot ? 1 : -1) * 1.1, 1.5, c.z - 2.4);
    g.tweens.run(0.35, (e) => { this.inner.position.x = Math.sin(e * 50) * 0.07; }, { onDone: () => {
      this.inner.position.x = 0;
      if (q !== this.q || !this.alive) return;
      g.tweens.to(P, { x: to.x, y: to.y, z: to.z }, 0.32, { ease: Ease.inQuad, onDone: () => {
        if (q !== this.q || !this.alive) return;
        const p = this.center();
        if (A.flash) g.post.flash(0.7, 0xffffff);
        if (sfx[A.sfx]) sfx[A.sfx](); else sfx.slam();
        g.post.shake(A.all ? 1.2 : 0.8); g.fx.confetti(p, 18, 2.5, A.all ? [COL.bone, COL.hot] : [COL.paper, COL.pink]);
        g.playerAttacked({ kind: 'shot', dmg: A.dmg, from: this, slot: A.all ? -1 : this.slot });
        this.mode = 'back';
        g.tweens.to(P, { x: this.to.x, y: this.to.y, z: this.to.z }, 0.7, { ease: Ease.outQuad, onDone: () => { if (q === this.q) { this.mode = 'swing'; this.restart(); } } });
      } });
    } });
  }
  update(dt, t) {
    if (!this.alive) return;
    this.baseUpdate(dt, t);
    this.knockT -= dt;
    const g = this.game, B = this.boss, R = B.def.ritual, P = this.root.position;
    if (this.mode === 'strike' || this.mode === 'back' || this.mode === 'offered') return;
    // toward the camera from her: the things hang between her and the girls
    const bp = B.root.position, cam = g.world.camera.position, dx = cam.x - bp.x, dz = cam.z - bp.z, dl = Math.hypot(dx, dz) || 1, fx = dx / dl, fz = dz / dl;
    this.ph += dt * this.sp;
    if (this.mode === 'still') {   // in a row before her, waiting to be shown to her (the one she is waiting for glows once it takes long)
      const off = (this.i - (B.keeps.length - 1) / 2) * (R.rowGap ?? 2);
      this.to.set(bp.x + fx * R.near * 1.4 - fz * off, (R.rowY ?? 2) + Math.sin(t * 1.5 + this.i) * 0.08, bp.z + fz * R.near * 1.4 + fx * off);
      if (B.ritualNext === this.i && B.stuck > (R.hint ?? 9) * 0.5) this.flash = Math.max(this.flash, 0.35 + 0.35 * Math.sin(t * 6));
    } else if (this.mode === 'guard') {   // before her core, between it and the girls
      const c = B.uvToWorld(B.S.core[0], B.S.core[1]);
      this.to.set(c.x + fx * R.near, c.y, c.z + fz * R.near);
    } else {   // swinging back and forth before her, a lazy figure of eight
      const s = Math.sin(this.ph);
      this.to.set(bp.x + fx * R.near - fz * s * this.amp, B.S.h * this.yk + Math.sin(this.ph * 2) * 0.35, bp.z + fz * R.near + fx * s * this.amp);
    }
    P.lerp(this.to, 1 - Math.exp(-dt * (this.mode === 'guard' ? 7 : 4)));
    this.inner.rotation.z = Math.cos(this.ph) * 0.18;   // (hanging, like a pendulum)
    // its count, at an uneven pace (the pace changes every second or so)
    if (this.mode === 'still' || !g.combat || B.mutating || B.grief || !B.alive) { this.ringOff(); return; }
    this.rateT -= dt; if (this.rateT <= 0) { this.rateT = rnd(0.7, 1.8); this.rate = rnd(R.pace[0], R.pace[1]); }
    this.fuse -= dt * this.rate;
    if (this.fuse <= 0) { this.strike(); return; }
    if (!this.ring) this.ring = g.fx.lock('shot', this.slot);
    const wc = this.center(), c = g.world.project(wc), b = this.screenBox();
    this.ring.set(c.x, g.H - c.y, Math.max(22, (b.y1 - b.y0) * 0.5), 1 - this.fuse / this.fuse0, t, this.fuse, b, wc);
  }
  dispose() { this.ringOff(); super.dispose(); }
}

