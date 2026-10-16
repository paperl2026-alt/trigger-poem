// Bosses. One HP bar each; body parts only change the damage multiplier (eyes hurt more), nothing has to be broken first.
// Sustained hits build stagger, which interrupts the current attack; some moves are super armour (can't be interrupted).
//   float — the runaway mascot float of the school festival (episode 0): spits takoyaki and balloons, rolls around,
//           rears up and slams the yard, calls the haunted house's ghosts.
import * as THREE from 'three';
import { meta } from '../engine/assets.js';
import { Ease } from '../engine/tween.js';
import { sfx } from '../engine/audio.js';
import { Actor } from './enemies.js';
import { COL } from './fx.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const EYE_MULT = 1.5, BODY_MULT = 0.75;

// shared boss behaviour: eyes from sprite meta, part multipliers, poise / stagger, one HP bar, death
class BossBase extends Actor {
  init(hp, poise) {
    this.hp = this.maxHp = hp;
    this.poiseMax = poise; this.poise = 0; this.poiseCD = 0;
    this.staggerT = 0; this.busy = false; this.armor = false; this.seq = 0;
    this.phase2 = false;
    this.poseT = 0;
  }
  pose(name, hold) { this.setFrame(this.prefix + name); this.poseT = hold; }
  eyes() { return meta[this.mesh.userData.texKey]?.eyes || []; }
  // an attack step scheduled with later() is dropped if the boss gets staggered in between
  later(s, fn) { const q = this.seq; this.game.tweens.wait(s, () => { if (this.alive && q === this.seq) fn(); }); }
  hit(info) {
    if (!this.alive) return;
    const { u, v } = info.uv;
    let eye = -1;
    this.eyes().forEach((e, i) => { if (Math.hypot(u - e[0], (v - e[1]) / this.ar) < e[2] * 1.15) eye = i; });
    const mult = eye >= 0 ? EYE_MULT : BODY_MULT;
    const dmg = info.dmg * mult;
    info.dealt = dmg;
    this.lastHitBy = info.by;
    this.paint(info);
    this.flash = eye >= 0 ? 0.7 : 0.25;
    const p = this.uvToWorld(u, v);
    const fx = this.game.fx;
    if (eye >= 0) { fx.ink(p, 8, 2.2, COL.hot); fx.star(p, 2, COL.pink); } else if (info.kind === 'mantra') { fx.confetti(p, 6, 1.6, [COL.gold, COL.paper]); fx.star(p, 1.6, COL.gold); } else if (info.kind === 'rifle') { fx.confetti(p, 3, 1.2); fx.star(p, 0.8); } else fx.embers(p, 3, 0.5);
    if (info.stagger && !this.armor && !this.busy && this.staggerT <= 0 && this.poiseCD <= 0) {
      this.poise += info.stagger * mult;
      if (this.poise >= this.poiseMax) this.stagger();
    }
    this.damage(dmg, info.kind, info);
  }
  damage(dmg, kind, info) {
    if (!this.alive) return;
    this.hp -= dmg;
    if (info) this.game.onHit(this, kind, info);
    if (!this.phase2 && this.hp < this.maxHp * 0.5) this.toPhase2();
    if (this.hp <= 0) this.die();
  }
  baseTick(dt) {
    this.poise = Math.max(0, this.poise - this.poiseMax * 0.12 * dt);
    this.poiseCD -= dt;
    this.staggerT -= dt;
    this.poseT -= dt;
  }
  stagger() {
    const g = this.game;
    this.seq++;
    this.poise = 0;
    this.poiseCD = 4;
    this.staggerT = 1.6;
    this.pose('stagger', 1.6);
    this.flash = 1;
    this.endAttack();
    g.post.shake(0.8);
    g.fx.stamp('don', g.W * 0.5, g.H * 0.7, 0.24, 0);
    g.fx.star(this.uvToWorld(0.5, 0.85), 3, COL.lime);
    sfx.roar();
    this.timer = Math.max(this.timer || 0, 1.8);
  }
  endAttack() {}
  die() {
    this.alive = false;
    this.seq++;
    this.endAttack();
    const g = this.game;
    sfx.roar();
    this.pose('stagger', 9);
    g.post.flash(1, 0xffffff);
    g.post.shake(1.4);
    for (let i = 0; i < 8; i++) {
      g.tweens.wait(i * 0.22, () => {
        const p = this.uvToWorld(rnd(0.25, 0.75), rnd(0.3, 0.9));
        g.fx.confetti(p, 34, 3); g.fx.ink(p, 14, 3); g.fx.star(p, 3, COL.pink);
        sfx.shatter(rnd(-0.5, 0.5)); g.post.shake(0.7);
      });
    }
    g.tweens.wait(1.3, () => { this.dieBurn({ u: 0.5, v: 0.8 }); sfx.burnOut(0); });
    g.onBossDead(this);
  }
}

// ------------------------------------------------------------------ the runaway mascot float (episode 0)
export class MascotFloat extends BossBase {
  constructor(game) {
    super(game, 'boss/f_idle', 8.5, 'bottom');
    this.type = 'boss';
    this.name = { zh: '暴走吉祥物花车', en: 'THE RUNAWAY MASCOT FLOAT', ja: '暴走マスコット山車' };
    this.prefix = 'boss/f_';
    this.init(2600, 380);
    const c = game.world.camPos;
    this.home = new THREE.Vector3(c.x, 0, c.z - 21);
    this.root.position.set(this.home.x + 14, 0, this.home.z - 6);
    this.pattern = ['spit', 'stomp', 'summon', 'spit', 'stomp', 'spit'];
    this.pi = 0;
    this.timer = 2.6;
    this.stompLock = null;
    game.world.scene.add(this.root);
    this.shadowM = game.world.makeShadow(this.w * 0.6);
    this.root.add(this.shadowM);
    // it comes rolling in from the side of the yard, lanterns swinging
    this.busy = true;
    this.run(this.home.x, this.home.z, 1.6, () => { this.busy = false; this.pose('stomp', 0.8); game.post.shake(1); sfx.slam(); });
  }
  run(x, z, dur, done) {
    const P = this.root.position, x0 = P.x, z0 = P.z;
    let hop = 0;
    this.game.tweens.run(dur, (e, k) => {
      P.x = x0 + (x - x0) * e; P.z = z0 + (z - z0) * e;
      P.y = Math.abs(Math.sin(k * dur * 9)) * 0.5;
      const s = Math.floor(k * dur * 9 / Math.PI);
      if (s !== hop) { hop = s; sfx.thud((P.x - this.game.world.camPos.x) * 0.05); this.game.post.shake(0.25); }
      this.inner.rotation.z = Math.sin(k * dur * 9) * 0.05;
    }, { ease: Ease.inOutQuad, onDone: () => { P.y = 0; this.inner.rotation.z = 0; done && done(); } });
  }
  endAttack() {
    if (this.stompLock) { this.stompLock.remove(); this.stompLock = null; this.lock = null; }
    this.armor = false;
    this.game.post.u.warn.value = 0;
    const P = this.root.position;
    if (P.y > 0.01) this.game.tweens.to(P, { y: 0 }, 0.25, { ease: Ease.inQuad });
  }
  update(dt, t) {
    this.baseUpdate(dt, t);
    if (!this.alive) return;
    const g = this.game;
    this.baseTick(dt);
    if (this.poseT <= 0 && !this.busy && !this.armor) this.setFrame(this.prefix + 'idle');
    if (this.stompLock) {
      this.stompT += dt;
      const s = g.world.project(this.uvToWorld(0.5, 0.05));
      this.stompLock.set(s.x, g.H - s.y, g.H * 0.18, Math.min(1, this.stompT / this.stompDur), t);
      g.post.u.warn.value = 0.35 + 0.35 * Math.abs(Math.sin(t * (6 + this.stompT * 6)));
    }
    if (this.staggerT > 0 || this.busy || this.armor) return;
    if (this.phase2) this.inner.position.y = Math.abs(Math.sin(t * 6)) * 0.15; // can't stand still any more
    this.timer -= dt;
    if (this.timer > 0) return;
    const move = this.pattern[this.pi++ % this.pattern.length];
    if (move === 'spit') this.spit();
    else if (move === 'stomp') this.stomp();
    else this.summon();
  }
  spit() {
    const g = this.game, n = this.phase2 ? 5 : 3;
    this.pose('throw', 0.5 + n * 0.32);
    sfx.roar();
    for (let i = 0; i < n; i++) {
      this.later(0.35 + i * (this.phase2 ? 0.28 : 0.38), () => {
        this.pose('throw', 0.4);
        g.spawnProjectile(i % 3 === 2 ? 'balloon' : 'takoyaki', this.uvToWorld(rnd(0.42, 0.58), 0.62), { time: this.phase2 ? 1.5 : 1.8, slot: g.pickTarget(i % 2 ? 1 : -1), curve: (i % 2 ? 1 : -1) * 2.5, dmg: 20 });
        sfx.throwIt(0);
      });
    }
    this.timer = (this.phase2 ? 2.4 : 3.2) + n * 0.3;
    // after spitting it rolls to a new spot
    this.later(0.6 + n * 0.35, () => { if (this.staggerT <= 0) { this.busy = true; this.run(this.home.x + rnd(-3.2, 3.2), this.home.z + rnd(-1.5, 1.5), this.phase2 ? 0.7 : 1.0, () => { this.busy = false; }); } });
  }
  // jumps up and slams the yard: can't be interrupted, hit everyone not in cover
  stomp() {
    const g = this.game, P = this.root.position;
    this.armor = true;
    this.pose('stomp', 9);
    this.stompDur = this.phase2 ? 1.3 : 1.6;
    this.stompT = 0;
    this.stompLock = this.lock = g.fx.lock('heavy', -1);
    sfx.warn(); setTimeout(() => sfx.warn(), 300);
    g.warnSlam();
    g.tweens.to(P, { y: 2.6 }, this.stompDur * 0.85, { ease: Ease.outCubic });
    this.later(this.stompDur, () => {
      if (this.stompLock) { this.stompLock.remove(); this.stompLock = null; this.lock = null; }
      g.post.u.warn.value = 0;
      g.tweens.to(P, { y: 0 }, 0.14, {
        ease: Ease.inQuad,
        onDone: () => {
          if (!this.alive) return;
          sfx.slam();
          g.post.shake(1.4);
          const c = g.world.camPos;
          for (const x of [-2, 0, 2]) g.fx.confetti(new THREE.Vector3(c.x + x, 0.3, c.z - 4), 18, 1.8, [COL.bone, COL.paper]);
          g.fx.stamp('don', g.W * 0.5, g.H * 0.75, 0.3, 0);
          g.playerAttacked({ kind: 'ranged', dmg: 30, from: this, heavy: true, slot: -1 });
          this.armor = false;
          this.pose('idle', 0.4);
        },
      });
    });
    this.timer = this.stompDur + (this.phase2 ? 1.4 : 2.0);
  }
  summon() {
    const g = this.game;
    sfx.roar();
    this.pose('stomp', 1.2);
    g.post.shake(0.5);
    const z = this.home.z + 3;
    const spawns = [{ type: 'sheet', x: -3, y: 3, z }, { type: 'sheet', x: 3, y: 3.4, z }, { type: 'zomb', from: 'far', x: rnd(-2, 2), z: z - 1 }];
    if (this.phase2) spawns.push({ type: 'sheet', x: 0, y: 4, z }, { type: 'zomb', from: 'far', x: rnd(-2, 2), z: z - 2 });
    spawns.forEach((s, i) => this.later(0.3 + i * 0.35, () => g.spawnEnemy({ ...s, x: s.x + this.home.x })));
    this.timer = 4.2;
  }
  toPhase2() {
    this.phase2 = true;
    this.busy = true;
    this.seq++;
    const g = this.game;
    this.endAttack();
    this.pose('stagger', 2);
    sfx.roar();
    g.post.shake(1);
    g.tweens.wait(0.9, () => {
      if (!this.alive) return;
      this.pose('stomp', 1);
      this.flash = 1; g.post.flash(0.8, 0xff3a2a); sfx.slam(); sfx.madness();
      g.fx.stamp('gogogo', g.W * 0.5, g.H * 0.75, 0.3, 0);
      this.inner.scale.setScalar(1.12);
      g.tweens.to(this.inner.scale, { x: 1, y: 1, z: 1 }, 0.6, { ease: Ease.outBack });
      this.busy = false;
      this.timer = 0.8;
    });
  }
}

export const BOSSES = { float: MascotFloat };
