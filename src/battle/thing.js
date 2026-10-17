// The prologue boss "???" (docs/DESIGN.md 序章 / Boss, bosses.json "qq", art R43 boss/qq_s<n>_<pose>): the formless thing that fell on the
// school, possessing the discipline-committee girl and mutating her like the G-virus, five stages from infection to the core.
// Not a giant made of parts: one whole drawing at a time (idle / move / wind-up / attack / hurt), middle-sized, whole on the screen, drifting
// back and forth across the yard and throwing things (DESIGN「Boss」). One move at a time, with breathers between (DESIGN「关卡编排要有起伏」):
//   volley  things spat at the girls one after another (shoot them down: the amber edge)
//   lunge   it gathers itself (blue brackets: shoot it enough and it is interrupted) and lunges at one girl's cover
//   burst   a long wind-up nothing stops (the red edge: hide), then a blast over everyone
//   summon  (later stages) a few small monsters of one kind
//   move    it drifts somewhere else (the breather)
// Weak while it winds up and attacks (the mouths and eyes open: the outline turns pink); its last stage, the core, is weak all the time.
// Hits change its colour, never hole it (paper.js solid damage). Between stages it convulses, splashes ooze and the next mutation grows out
// (no comic: the fight keeps its rhythm).
import * as THREE from 'three';
import { tex, meta } from '../core/assets.js';
import { paperMesh, DamageMap, attachDamage, setRelief } from '../core/paper.js';
import { Ease } from '../core/tween.js';
import { sfx } from '../core/audio.js';
import { tr } from '../core/i18n.js';
import { Actor } from './enemies.js';
import { COL } from './fx.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const rr = (r) => (Array.isArray(r) ? rnd(r[0], r[1]) : r);
const FRAMES = { idle: ['idle0', 'idle1'], move: ['move', 'idle0'], windup: ['windup'], attack: ['attack'], hurt: ['hurt'] };

export class TheThing extends Actor {
  constructor(game, def) {
    const S0 = def.stages[0];
    super(game, `boss/qq_s1_idle0`, S0.h, S0.float ? 'center' : 'bottom');
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
    const S = this.S, key = `boss/qq_s${n + 1}_idle0`, t = tex[key];
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
    this.prefix = `boss/qq_s${n + 1}_`; this.anim = null; this.play('idle', 3);
    this.root.position.y = S.float ? S.y : 0;
    this.shadowM.scale.setScalar(this.w * 0.6);
  }

  // ---------------------------------------------------------------- hits
  weakNow() { return this.S.core || this.state === 'windup' || this.state === 'attack'; }
  hit(info) {
    if (!this.alive) return;
    const D = this.def, weak = this.weakNow();
    const dmg = info.dmg * (weak ? D.weakMul : D.bodyMul);
    info.dealt = dmg; this.lastHitBy = info.by;
    this.paint(info);
    this.flash = Math.max(this.flash, weak ? 0.7 : 0.3);
    const p = this.uvToWorld(info.uv.u, info.uv.v), fx = this.game.fx;
    if (weak) { fx.ink(p, 8, 2.6, COL.hot); fx.star(p, 2.5, COL.pink); } else fx.confetti(p, 3, 1.6);
    // a lunge being gathered breaks off when hit enough
    if (this.state === 'windup' && this.move === 'lunge' && info.stagger) { this.poise += info.stagger; if (this.poise >= D.lunge.poise) this.interrupt(); }
    this.hp -= dmg;
    this.game.onHit(this, info.kind, info);
    if (this.hp <= 0) { this.die(); return; }
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
  later(s, fn) { const q = this.seq; this.game.etw.wait(s, () => { if (this.alive && q === this.seq) fn(); }); }

  // ---------------------------------------------------------------- frame
  update(dt, t) {
    if (!this.alive) { this.baseUpdate(dt, t); return; }
    this.baseUpdate(dt, t);
    const g = this.game, P = this.root.position;
    this.root.rotation.y = Math.atan2(g.world.camPos.x - P.x, g.world.camPos.z - P.z);
    if (this.S.float) P.y = this.S.y + Math.sin(t * 1.3) * 0.18;
    this.shadowM.position.set(P.x, 0.03, P.z);
    // weak: the outline glows pink and pulses; otherwise white
    const wk = this.weakNow();
    this.u.outlineCol.value.setRGB(1, wk ? 0.35 + 0.25 * Math.sin(t * 9) : 1, wk ? 0.7 : 1);
    // breathing
    this.inner.scale.y += ((1 + Math.sin(t * 2.1) * 0.025) - this.inner.scale.y) * Math.min(1, dt * 6);
    if (this.lock) {
      const c = g.world.project(this.center()), b = g.box(this);
      this.lock.set(c.x, g.H - c.y, Math.max(40, (b.y1 - b.y0) * 0.5), Math.min(1, 1 - this.timer / this.timer0), t, this.timer);
      this.timer -= dt;
      return;
    }
    if (this.busy || this.mutating || this.state === 'hurt') return;
    this.timer -= dt;
    if (this.timer > 0) return;
    const P2 = this.S.pattern, mv = P2[this.pi++ % P2.length];
    this.move = mv; this[mv]();
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
    g.fx.charge(this, threat === 'heavy' ? 0xff4fc8 : 0xffb04a);
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
    this.windup(D.windup, 'melee', slot, () => {
      // it throws itself at that girl's cover and comes back
      const P = this.root.position, home = P.clone(), cov = g.world.covers[slot], c = g.world.camPos;
      const to = new THREE.Vector3(cov ? cov.def.x : c.x + (slot ? 1 : -1), P.y, cov ? cov.def.z - 1.2 : c.z - 3);
      this.attackPose(D.time + 0.4);
      g.etw.to(P, { x: to.x, z: to.z }, D.time, { ease: Ease.inQuad, onDone: () => {
        if (!this.alive) return;
        sfx.slam(); g.post.shake(1.3); g.fx.confetti(to, 20, 2.2, [COL.hot, COL.bone]);
        if (cov && cov.hp !== undefined) { cov.hp -= D.coverDmg; if (cov.hp <= 0 && g.world.breakCover) g.world.breakCover(cov); }
        g.playerAttacked({ kind: 'melee', dmg: D.dmg, from: this, slot });
        g.etw.to(P, { x: home.x, z: home.z }, 0.9, { delay: 0.3, ease: Ease.inOutQuad });
      } });
    });
    this.timer = D.windup + D.time + 1.4 + rr(this.def.rest);
  }
  burst() {
    const g = this.game, D = this.def.burst;
    this.armor = true;
    this.windup(D.windup, 'heavy', -1, () => {
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

  // ---------------------------------------------------------------- the next mutation: it convulses, splashes ooze, grows into the next stage
  mutate(n) {
    const g = this.game, tw = g.etw;
    this.mutating = true; this.seq++; this.endWindup(); this.armor = false;
    g.clearProjectiles && g.clearProjectiles();
    this.state = 'hurt'; this.play('hurt');
    sfx.roar(); sfx.madness(); g.post.flash(0.8, 0xff3a8a); g.post.shake(1.4); g.G.stop(0.25);
    g.hud.gl.hold('phase', { text: tr(this.def.texts[`s${n + 1}`] || this.def.texts.mutate), dur: 2.2 });
    let k = 0;
    tw.run(1.4, (e) => {
      this.inner.position.x = Math.sin(e * 70) * 0.12 * (1 - e);
      this.inner.scale.set(1 + Math.sin(e * 40) * 0.08, 1 - Math.sin(e * 40) * 0.06, 1);
      if (e * 6 > k) { k++; const p = this.uvToWorld(rnd(0.2, 0.8), rnd(0.2, 0.9)); g.fx.ink(p, 10, 3, COL.hot); g.fx.confetti(p, 12, 2.5, [COL.hot, 0x2a0a2a]); }
    }, { onDone: () => {
      this.inner.position.x = 0;
      this.setStage(n);
      this.inner.scale.set(0.7, 0.7, 1); this.flash = 1;
      tw.to(this.inner.scale, { x: 1, y: 1 }, 0.9, { ease: Ease.outBack, onDone: () => { this.mutating = false; this.pi = 0; this.timer = 1.2; this.state = 'idle'; this.play('idle', 3); } });
      g.post.shake(1.2); sfx.slam();
      if (n === this.def.wreckAt && g.world.named?.school && tex[this.def.schoolAfter]) {   // it smashes the school: the building is damaged from now on
        const sc = g.world.named.school; sc.m.material.map = tex[this.def.schoolAfter]; sc.m.material.needsUpdate = true; sc.m.userData.texKey = this.def.schoolAfter;
        for (let i = 0; i < 5; i++) g.fx.confetti(new THREE.Vector3(rnd(-10, 10), rnd(4, 11), sc.z + 0.5), 20, 4, [COL.bone, COL.paper]);
      }
    } });
  }

  // ---------------------------------------------------------------- purified
  die() {
    this.alive = false; this.seq++; this.endWindup();
    const g = this.game;
    sfx.roar(); g.post.flash(1, 0xffffff); g.post.shake(1.6);
    this.play('hurt');
    for (let i = 0; i < 10; i++) g.tweens.wait(i * 0.2, () => { const q = this.uvToWorld(rnd(0.2, 0.8), rnd(0.2, 0.9)); g.fx.confetti(q, 40, 5); g.fx.star(q, 5, COL.pink); sfx.shatter(rnd(-0.5, 0.5)); g.post.shake(0.8); });
    g.tweens.wait(1.2, () => {
      sfx.burnOut(0);
      this.u.dOrigin.value.set(0.5, 0.6);
      g.tweens.run(2.2, (e) => { this.u.dissolve.value = e; }, { onDone: () => this.dispose() });
    });
    g.onBossDead(this);
  }
}
