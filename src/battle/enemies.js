// Data: content enemies.json (types), projectiles.json, tuning/behaviors.json (the numbers of each behaviour template;
// an enemy type can override any of them in its own "params").
// Paper monsters living in the 3D level. Each is a camera-facing cut-out (turns around Y to face the lens),
// animated as a stop-motion flipbook of strongly different key frames, lit by nearby candles, fogged by distance.
// Hits paint holes / cuts / scorch; deaths: knock (falls flat), shatter, slice, burn.
import * as THREE from 'three';
import { tex, alphaAt, meta } from '../core/assets.js';
import { paperMesh, DamageMap, attachDamage, setRelief } from '../core/paper.js';
import { makeShatter } from '../core/particles.js';
import { Ease } from '../core/tween.js';
import { sfx } from '../core/audio.js';
import { C, T } from '../core/content.js';
import { COL } from './fx.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const rr = (r) => (Array.isArray(r) ? rnd(r[0], r[1]) : r); // [a, b] = random between, a number = itself
const STEP = 1 / 12;
const V = new THREE.Vector3();


export class Actor {
  constructor(game, key, h, pivot = 'bottom') {
    this.game = game;
    const t = tex[key];
    this.ar = t.image.width / t.image.height;
    const figH = meta[key]?.figH || 1;
    this.h = h / figH; this.w = this.h * this.ar;
    this.pivot = pivot;
    // drawings with a relief map (tools/relief.py) get a dense mesh and real volume
    this.relief = !!meta[key]?.relief;
    this.mesh = paperMesh(t, this.w, { pivot, segs: this.relief ? [64, Math.max(8, Math.round(64 / this.ar))] : null });
    if (this.relief) setRelief(this.mesh, tex[meta[key].relief], this.reliefAmt());
    this.mesh.userData.owner = this;
    this.mesh.userData.texKey = key;
    this.dm = new DamageMap(1 / this.ar, this.w > 4 ? 512 : 256);
    attachDamage(this.mesh, this.dm, true);   // hurt spots change colour, never hole (DESIGN「Boss」)
    this.inner = new THREE.Group();
    this.inner.add(this.mesh);
    this.root = new THREE.Group();
    this.root.add(this.inner);
    this.alive = true;
    this.removed = false;
    this.flash = 0;
    this.seed = Math.random() * 100;
    this.u = this.mesh.material.uniforms;
    this.burnT = 0;
    this.lastStep = -1;
    this.billboard = true;
    this.anim = null;
    this.prefix = key.replace(/_[^_/]+$/, '_');
    this.litC = new THREE.Color(1, 1, 1);
  }
  reliefAmt() { return Math.min(this.w, this.h) * 0.32; }
  setFrame(key) {
    if (this.mesh.userData.texKey === key || !tex[key]) return;
    this.mesh.userData.texKey = key;
    this.u.map.value = tex[key];
    if (this.relief) { const r = tex[meta[key]?.relief]; if (r) { this.u.relief.value = r; this.u.reliefTexel.value.set(1 / r.image.width, 1 / r.image.height); } }
  }
  play(name, fps = 8, loop = true) {
    const frames = (this.frames && this.frames[name]) || [name];
    if (this.anim && this.anim.name === name) return;
    this.anim = { name, frames, fps, loop, t: 0 };
    this.setFrame(this.prefix + frames[0]);
  }
  tickAnim(dt) {
    const a = this.anim;
    if (!a) return;
    a.t += dt;
    let i = Math.floor(a.t * a.fps);
    i = a.loop ? i % a.frames.length : Math.min(a.frames.length - 1, i);
    this.setFrame(this.prefix + a.frames[i]);
  }
  uvToWorld(u, v) {
    V.set((u - 0.5) * this.w, this.pivot === 'bottom' ? v * this.h : (v - 0.5) * this.h, 0.02);
    return this.mesh.localToWorld(V.clone());
  }
  center() { return this.uvToWorld(0.5, 0.5); }
  screenBox() {
    const w = this.game.world;
    const a = w.project(this.uvToWorld(0, 0)), b = w.project(this.uvToWorld(1, 1)), c = w.project(this.uvToWorld(0, 1)), d = w.project(this.uvToWorld(1, 0));
    return { x0: Math.min(a.x, b.x, c.x, d.x), x1: Math.max(a.x, b.x, c.x, d.x), y0: Math.min(a.y, b.y, c.y, d.y), y1: Math.max(a.y, b.y, c.y, d.y) };
  }
  hitMeshes() { return this.alive ? [this.mesh] : []; }
  stepped(t) { const s = Math.floor((t + this.seed) / STEP); const changed = s !== this.lastStep; this.lastStep = s; return changed; }
  distToCam() { const c = this.game.world.camPos; return Math.hypot(this.root.position.x - c.x, this.root.position.z - c.z); }
  baseUpdate(dt, t) {
    this.flash = Math.max(0, this.flash - dt * 6);
    this.u.flash.value = this.flash;
    this.dm.update(dt);
    this.tickAnim(dt);
    if (this.billboard) {
      const c = this.game.world.camera.position, p = this.root.position;
      this.root.rotation.y = Math.atan2(c.x - p.x, c.z - p.z);
    }
    this.game.world.lightAt(this.root.position, this.litC);
    this.u.lit.value.lerp(this.litC, Math.min(1, dt * 8));
    if (this.stepped(t)) { // stop-motion "boil"
      this.mesh.rotation.z = rnd(-0.014, 0.014);
      this.mesh.position.x = rnd(-0.012, 0.012) * this.w;
    }
  }
  paint(info) {
    const { u, v } = info.uv;
    const k = 1 / this.w; // mark sizes are in metres
    if (info.kind === 'rifle') this.dm.hole(u, v, (info.crit ? 0.11 : 0.08) * k);
    else if (info.kind === 'mantra') { this.dm.scorch(u, v, 0.2 * k, 0.35); this.dm.hole(u, v, 0.07 * k); }
    else if (info.kind === 'beam') this.dm.scorch(u, v, 0.3 * k, 0.12);
    else if (info.kind === 'blade' && info.cut) this.dm.cut(info.cut, Math.min(0.03, 0.05 * k));
  }
  dispose() {
    if (this.lock) { this.lock.remove(); this.lock = null; }
    this.root.parent && this.root.parent.remove(this.root);
    if (this.shadowM) this.shadowM.parent && this.shadowM.parent.remove(this.shadowM);
    this.dm.dispose();
    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
    this.removed = true;
  }

  // ---------------- deaths ----------------
  dieKnock() {
    const tw = this.game.tweens, fx = this.game.fx;
    fx.confetti(this.center(), 18, 1.1);
    if (this.pivot === 'center') {
      const y0 = this.root.position.y;
      tw.run(0.85, (e) => { this.root.position.y = y0 * (1 - e) + 0.3 * e; this.inner.rotation.z = e * 8; this.inner.rotation.x = -e * 1.2; }, { ease: Ease.inQuad });
    } else {
      tw.to(this.inner.rotation, { x: -1.52 }, 0.42, { ease: Ease.inQuad, onDone: () => { sfx.thud(); fx.puff(this.root.position, 5, COL.bone, 0.7); tw.to(this.inner.rotation, { x: -1.3 }, 0.1, { onDone: () => tw.to(this.inner.rotation, { x: -1.52 }, 0.12) }); } });
    }
    tw.run(0.45, (e) => { this.u.opacity.value = 1 - e; }, { delay: 1.2, onDone: () => this.dispose() });
  }
  dieShatter(uv, power = 1) {
    const fx = this.game.fx;
    this.mesh.visible = false;
    const sh = makeShatter(this.u.map.value, this.w, this.h, { cols: 12, impact: [uv.u, uv.v], power, pivot: this.pivot });
    sh.position.copy(this.mesh.position);
    this.inner.add(sh);
    fx.confetti(this.uvToWorld(uv.u, uv.v), 28, 1.6);
    fx.ink(this.uvToWorld(uv.u, uv.v), 16, 1.5);
    let t = 0;
    fx.add({ update: (dt) => { t += dt; sh.material.uniforms.t.value = t; sh.material.uniforms.flash.value = Math.max(0, 0.6 - t * 3); if (t > 1.5) { sh.geometry.dispose(); sh.material.dispose(); this.dispose(); return false; } return true; } });
  }
  dieSlice(uv, dir) {
    const fx = this.game.fx;
    const asp = this.w / this.h;
    let dx = dir.x, dy = dir.y;
    const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
    const nx = -dy, ny = dx;
    const c = -(nx * uv.u * asp + ny * uv.v);
    const halves = [1, -1].map((side) => {
      const mat = this.mesh.material.clone();
      mat.uniforms.map.value = this.u.map.value;
      mat.uniforms.dmg.value = this.dm.tex;
      mat.uniforms.lit.value.copy(this.u.lit.value);
      mat.uniforms.slice.value.set(nx, ny, c);
      mat.uniforms.sliceOn.value = side;
      mat.uniforms.flash.value = 0.9;
      const m = new THREE.Mesh(this.mesh.geometry, mat);
      m.position.copy(this.mesh.position);
      this.inner.add(m);
      return { m, vx: nx * side * rnd(1.4, 2.4) * this.h * 0.5, vy: (ny * side * rnd(1.4, 2.2) + 1.4) * this.h * 0.5, vr: side * rnd(1.5, 3.2) };
    });
    this.mesh.visible = false;
    const p = this.uvToWorld(uv.u, uv.v);
    fx.confetti(p, 24, 1.4, [COL.paper, COL.white, COL.pink]);
    fx.ink(p, 18, 1.6);
    fx.star(p, 1.3, COL.pink);
    let t = 0;
    fx.add({
      update: (dt) => {
        t += dt;
        for (const h of halves) {
          h.vy -= 9 * dt * this.h * 0.5;
          h.m.position.x += h.vx * dt; h.m.position.y += h.vy * dt;
          h.m.rotation.z += h.vr * dt;
          h.m.material.uniforms.flash.value = Math.max(0, 0.9 - t * 4);
          h.m.material.uniforms.opacity.value = t > 0.9 ? Math.max(0, 1 - (t - 0.9) / 0.4) : 1;
        }
        if (t > 1.35) { halves.forEach((h) => h.m.material.dispose()); this.dispose(); return false; }
        return true;
      },
    });
  }
  dieBurn(uv) {
    const fx = this.game.fx;
    this.u.dOrigin.value.set(uv.u, uv.v);
    let t = 0;
    const dur = 1.3;
    fx.add({
      update: (dt) => {
        t += dt;
        const d = Math.min(1, t / dur);
        this.u.dissolve.value = d;
        for (let i = 0; i < 4; i++) {
          const a = Math.random() * 6.28, r = d * 1.6 / 0.9 * rnd(0.85, 1.05);
          const fu = uv.u + Math.cos(a) * r / (this.w / this.h), fv = uv.v + Math.sin(a) * r;
          if (alphaAt(this.mesh.userData.texKey, fu, fv) > 100) { const p = this.uvToWorld(fu, fv); fx.embers(p, 1, 0.05); if (Math.random() < 0.5) fx.ash(p, 1, 0.05); }
        }
        if (t > dur + 0.1) { this.dispose(); return false; }
        return true;
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Behaviour templates: walker (melee leaper), flyer (diver), thrower (ranged), crawler (ceiling pouncer).
// armor = the states it can't be staggered in (super armour): leaps, dives, throws, pounces, entrances.
const enemyHit = () => T.combat.enemyHit;

export class Enemy extends Actor {
  constructor(game, s) {
    const def = C.enemies[s.type];
    // painted stations: "at" is a floor pixel of the painting -> world x / z on that floor
    if (s.at && game.world.at) { const w = game.world.at(s.at[0], s.at[1]); s = { ...s, x: w.x, z: w.z }; }
    const pivot = def.beh === 'flyer' || def.beh === 'crawler' ? 'center' : 'bottom';
    // one of its versions (docs/ART.md 多版本): the one least seen among its kind on the field right now, so a group never looks cloned
    const vs = def.variants || [def.sprite];
    const live = game.actors.filter((a) => a.alive && a.type === s.type).map((a) => a.sprite);
    const sprite = vs.map((v) => [v, live.filter((x) => x === v).length + Math.random() * 0.5]).sort((x, y) => x[1] - y[1])[0][0];
    super(game, `enemy/${sprite}_${def.first}`, def.h, pivot);
    this.sprite = sprite;
    this.type = s.type;
    this.def = def;
    this.beh = def.beh;
    const B = T.behaviors;
    this.bp = { ...B.common, ...B[def.beh], ...def.params };   // this enemy's behaviour numbers
    this.frames = def.frames;
    this.hp = def.hp;
    this.state = 'enter';
    this.timer = 0;
    this.hurtT = 0;
    this.lock = null;
    this.poise = 0; this.poiseCD = 0; this.stunT = 0;
    this.walkPhase = Math.random() * 6;
    const world = game.world, lv = world.level;
    const bp = this.bp;
    this.threat = bp.threat;
    this.targetSlot = game.pickTarget(s.x ?? 0);
    const cov = world.covers[this.targetSlot]?.def || { x: 0, z: world.camPos.z - 2.8 };
    const side = this.targetSlot ? 1 : -1;
    // walk up toward the targeted player's barricade, but stay near the middle so the player sprites don't hide it
    this.goal = new THREE.Vector3(world.camPos.x + side * rr(bp.goalSpread || [0.15, 0.6]), 0, cov.z - (bp.goalBeforeCover ?? 1.1));
    world.scene.add(this.root);
    const P = this.root.position;
    if (this.beh === 'flyer') {
      P.set(s.x ?? rnd(-2, 2), s.y ?? 3, s.z);
      const c = world.camPos, ceil = lv.ceilAt(c.z - 6);
      this.home = new THREE.Vector3(c.x + rnd(-bp.homeX, bp.homeX), Math.min(ceil - bp.ceilingGap, rr(bp.homeY)), c.z - rr(bp.homeZ));
      // a painted station: stay in front of the painted walls and inside the picture
      if (world.plates) {
        const d = Math.min(c.z - this.home.z, world.maxZ() * rnd(0.6, 0.9));
        this.home.z = c.z - d;
        this.home.x = c.x + Math.max(-0.45 * d, Math.min(0.45 * d, this.home.x - c.x));
        this.home.y = Math.max(0.6, Math.min(this.home.y, c.y + 0.3 * d));
      }
      this.shadowM = world.makeShadow(this.w * 0.35); world.scene.add(this.shadowM);
      this.play('fly', 14);
      game.tweens.to(P, { x: this.home.x, y: this.home.y, z: this.home.z }, bp.enterTime, { ease: Ease.outCubic, onDone: () => { if (this.alive && this.state === 'enter') { this.state = 'hover'; this.timer = rr(bp.hoverFirst); } } });
      sfx.whoosh(0);
    } else if (this.beh === 'crawler') {
      const roomH = s.y ?? lv.ceilAt(s.z);
      P.set(s.x, roomH - bp.ceilingGap, s.z);
      if (!this.def.drawnUpsideDown) this.inner.rotation.z = Math.PI; // clinging to the ceiling
      this.play('crawl', 9);
      this.state = 'crawl';
      this.shadowM = world.makeShadow(this.w * 0.4); world.scene.add(this.shadowM);
    } else {
      this.shadowM = world.makeShadow(this.w * 0.5);
      this.root.add(this.shadowM);
      this.enter(s, lv);
    }
  }

  enter(s, lv) {
    const tw = this.game.tweens, P = this.root.position, walker = this.beh === 'walker', bp = this.bp;
    const ready = () => {
      if (!this.alive || this.state !== 'enter') return;
      if (walker) { this.state = 'walk'; this.play('walk', 7); } else if (this.def.hides) { this.state = 'hide'; this.play('hide'); } else { this.state = 'stand'; this.play('idle'); }
      this.timer = rr(bp.startDelay);
    };
    if (walker) this.play('walk', 7); else this.play('rise');
    if (s.from === 'drop') {
      P.set(s.x, lv.ceilAt(s.z) + 1, s.z);
      const pts = [new THREE.Vector3(0, this.h * 0.9, 0), new THREE.Vector3(0, 30, 0)];
      this.string = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xeee2c8, transparent: true, opacity: 0.85 }));
      this.inner.add(this.string);
      this.play('idle');
      tw.to(P, { y: 0 }, bp.dropTime, { ease: Ease.outBack, onDone: () => { this.game.fx.puff(P, 4); ready(); } });
    } else if (s.from === 'pop') {
      P.set(s.x, s.y || 0, s.z);
      this.inner.rotation.x = -Math.PI / 2;
      sfx.popup();
      tw.to(this.inner.rotation, { x: 0 }, bp.popTime, { ease: Ease.outBack, onDone: ready });
    } else {
      P.set(s.x, s.y || 0, s.z);
      ready();
    }
  }

  update(dt, t) {
    this.baseUpdate(dt, t);
    if (!this.alive) return;
    const g = this.game;
    this.hurtT -= dt;
    this.poiseCD -= dt;
    this.poise = Math.max(0, this.poise - this.def.poise * this.bp.poiseDrain * dt);
    if (this.shadowM && this.pivot === 'center') this.shadowM.position.set(this.root.position.x, 0.02, this.root.position.z);
    if (this.state === 'stun') {
      this.stunT -= dt;
      this.inner.position.x = Math.sin(t * 38) * 0.03 * Math.min(1, this.stunT * 3);
      if (Math.random() < dt * 5) g.fx.star(this.uvToWorld(rnd(0.3, 0.7), rnd(0.75, 0.95)), 0.35, COL.lime);
      if (this.stunT <= 0) this.recover();
      return;
    }
    if (this.hurtT > 0) this.setFrame(this.prefix + this.frames.hurt[0]);
    if (this.beh === 'walker') this.updateWalker(dt, t);
    else if (this.beh === 'flyer') this.updateFlyer(dt, t);
    else if (this.beh === 'thrower') this.updateThrower(dt, t);
    else this.updateCrawler(dt, t);
    if (this.lock) {
      const c = g.world.project(this.center());
      const b = this.screenBox();
      this.lock.set(c.x, g.H - c.y, Math.max(40, (b.y1 - b.y0) * 0.5), Math.min(1, this.timer0 > 0 ? 1 - this.timer / this.timer0 : 1), t, this.timer);
    }
  }

  startWindup(time) {
    this.state = 'windup';
    this.timer = this.timer0 = time;
    if (this.beh !== 'walker') this.targetSlot = this.def.blast ? -1 : this.game.pickTarget(this.root.position.x - this.game.world.camPos.x);
    if (this.lock) this.lock.remove();
    this.lock = this.game.fx.lock(this.threat, this.targetSlot);
    if (this.beh !== 'walker') this.game.fx.charge(this, this.def.blast ? 0xff4fc8 : 0xffb04a);   // the glow it gathers (art has no effects drawn in)
    sfx.warn();
  }
  endWindup() { if (this.lock) { this.lock.remove(); this.lock = null; } }

  // ---- stagger: enough sustained hits interrupt whatever it was about to do
  canStagger() { return this.alive && this.state !== 'stun' && this.poiseCD <= 0 && !(this.bp.armor || []).includes(this.state); }
  stagger(time) {
    const g = this.game;
    this.endWindup();
    this.state = 'stun';
    this.stunT = time;
    this.poise = 0;
    this.poiseCD = time + this.bp.poiseCooldown;
    this.play('hurt');
    this.flash = 1;
    this.inner.scale.setScalar(1);
    this.inner.position.y = 0;
    g.fx.star(this.uvToWorld(0.5, 0.85), 0.9, COL.lime);
    sfx.thud(0);
    const P = this.root.position, c = g.world.camPos, dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz) || 1;
    const bp = this.bp;
    if (this.beh === 'walker') { P.x += dx / d * bp.staggerPush; P.z += dz / d * bp.staggerPush; } else if (this.beh === 'flyer') { g.tweens.kill(P); P.z -= bp.staggerKnock[0]; P.y += bp.staggerKnock[1]; }
  }
  recover() {
    this.inner.position.x = 0;
    const bp = this.bp;
    if (this.beh === 'walker') { this.state = 'walk'; this.play('walk', 7); } else if (this.beh === 'flyer') { this.state = 'hover'; this.timer = rr(bp.hoverAfterStun); this.play('fly', 14); } else if (this.beh === 'thrower') { this.state = 'stand'; this.timer = rr(bp.standAfterStun); this.play('idle'); } else { this.startWindup(bp.windupAfterStun); this.play('atk'); }
  }

  updateWalker(dt, t) {
    const g = this.game, P = this.root.position, tw = g.tweens, bp = this.bp;
    if (this.state === 'walk') {
      const dx = this.goal.x - P.x, dz = this.goal.z - P.z, d = Math.hypot(dx, dz);
      const sp = this.def.speed * (0.7 + 0.6 * Math.abs(Math.sin(this.walkPhase)));
      if (d > 0.05) { P.x += dx / d * sp * dt; P.z += dz / d * sp * dt; }
      this.walkPhase += dt * 7;
      this.inner.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.1;
      if (d < bp.windupDist) {
        this.play('crouch');
        this.startWindup(this.def.windup);
        this.inner.position.y = 0;
        sfx.dollScreech(0); g.warnClose();
      }
    } else if (this.state === 'windup') {
      this.timer -= dt;
      this.inner.position.x = Math.sin(t * 50) * 0.02;
      if (this.timer <= 0) {
        this.endWindup();
        this.state = 'leap';
        this.play('leap');
        // jump onto the barricade, right in your face
        const cov = g.world.covers[this.targetSlot]?.def;
        const tz = cov ? cov.z - bp.leapOntoCover : P.z + 1.5, ty = cov ? cov.h * bp.leapHeight : 0.6, z0 = P.z, y0 = P.y;
        tw.run(bp.leapTime, (e) => { P.z = z0 + (tz - z0) * e; P.y = y0 + (ty - y0) * e + Math.sin(e * Math.PI) * bp.leapArc; }, {
          onDone: () => {
            if (!this.alive) return;
            this.state = 'bite';
            this.play('bite');
            g.post.shake(0.6);
            g.playerAttacked({ kind: 'melee', dmg: enemyHit(), from: this, slot: this.targetSlot });
            tw.wait(bp.biteHold, () => {
              if (!this.alive) return;
              this.state = 'recoil';
              this.play('recoil');
              const zz = P.z, yy = P.y;
              tw.run(bp.recoilTime, (e) => { P.z = zz - bp.recoilDist * e; P.y = yy * (1 - e) + Math.sin(e * Math.PI) * 0.4; }, { ease: Ease.outCubic, onDone: () => { if (this.alive && this.state === 'recoil') { this.state = 'walk'; this.play('walk', 7); } } });
            });
          },
        });
      }
    }
  }

  updateFlyer(dt, t) {
    const g = this.game, P = this.root.position, bp = this.bp;
    if (this.state === 'hover') {
      P.x += (this.home.x + Math.sin(t * 1.3 + this.seed) * bp.swayX - P.x) * dt * 2;
      P.y += (this.home.y + Math.sin(t * 2.1 + this.seed) * bp.swayY - P.y) * dt * 2;
      P.z += (this.home.z - P.z) * dt * 2;
      if (this.lastStep % 4 === 0) sfx.mothFlap(0);
      this.timer -= dt;
      if (this.timer <= 0) { this.startWindup(this.def.windup); this.play('windup'); }
    } else if (this.state === 'windup') {
      this.timer -= dt;
      P.z -= dt * bp.windupDrift;
      if (this.timer <= 0) {
        this.endWindup();
        this.state = 'dive';
        this.play('dive');
        sfx.whoosh(0);
        const c = g.world.camPos;
        g.tweens.to(P, { x: c.x + (this.targetSlot ? bp.diveSide : -bp.diveSide) + rnd(-bp.diveJitter, bp.diveJitter), y: c.y - bp.diveDrop, z: c.z - bp.diveStop }, bp.diveTime, {
          ease: Ease.inQuad,
          onDone: () => {
            if (!this.alive) return;
            g.playerAttacked({ kind: 'ranged', dmg: enemyHit(), from: this, slot: this.targetSlot });
            this.state = 'recoil';
            this.play('fly', 14);
            g.tweens.to(P, { x: this.home.x, y: this.home.y, z: this.home.z }, bp.returnTime, { ease: Ease.outCubic, onDone: () => { if (this.alive && this.state === 'recoil') { this.state = 'hover'; this.timer = rr(bp.hoverAgain); } } });
          },
        });
      }
    }
  }

  updateThrower(dt, t) {
    const bp = this.bp;
    this.timer -= dt;
    if (this.state === 'hide') {
      this.inner.position.y = 0;
      if (this.timer <= 0) { this.state = 'rise'; this.play('rise'); this.timer = bp.riseTime; sfx.popup(); this.inner.scale.set(1.1, 0.85, 1); this.game.tweens.to(this.inner.scale, { x: 1, y: 1 }, 0.25, { ease: Ease.outBack }); }
    } else if (this.state === 'rise') {
      if (this.timer <= 0) { this.state = 'stand'; this.play('idle'); this.timer = rr(bp.standAfterRise); }
    } else if (this.state === 'stand') {
      this.inner.rotation.z = Math.sin(t * 1.7 + this.seed) * 0.04;
      if (this.timer <= 0) { this.startWindup(this.def.windup); this.play('windup'); }
    } else if (this.state === 'windup') {
      this.inner.rotation.z = -0.06;
      if (this.timer <= 0) {
        this.endWindup();
        this.play('throw');
        if (this.def.blast) this.blast();
        else {
          // a burst: several shots fanned out, a beat apart (each can be shot down)
          const n = this.def.burst || 1;
          for (let i = 0; i < n; i++) {
            this.game.tweens.wait(i * 0.16, () => {
              if (!this.alive) return;
              this.game.spawnProjectile(this.def.proj, this.uvToWorld(bp.throwFrom[0], bp.throwFrom[1]), { slot: this.targetSlot, curve: n > 1 ? (i - (n - 1) / 2) * 1.6 : 0 });
              sfx.throwIt(0);
            });
          }
        }
        this.state = 'thrown';
        this.timer = bp.throwRecover + (this.def.burst ? this.def.burst * 0.16 : 0);
      }
    } else if (this.state === 'thrown') {
      if (this.timer <= 0) {
        if (this.def.hides) { this.state = 'hide'; this.play('hide'); this.timer = rr(bp.hideAfterThrow); } else { this.state = 'stand'; this.play('idle'); this.timer = rr(bp.standAfterThrow); }
      }
    }
  }

  // a must-hide attack: everyone not behind cover is hit (cover takes it, and a little gets through)
  blast() {
    const g = this.game, B = this.def.blast;
    sfx.slam(); sfx.madness();
    g.post.flash(0.55, 0xff5ac8);
    g.post.shake(1.2);
    const p = this.uvToWorld(0.5, 0.5), s = g.world.project(p);
    g.fx.soundWave(s.x, g.H - s.y, 0xff4fc8);   // the wave itself is the program's (the art has none drawn in)
    g.fx.confetti(p, 30, 2.4, [COL.pink, COL.white, COL.hot]);
    g.fx.star(p, 3, COL.pink);
    g.fx.stamp('gogogo', g.W * 0.5, g.H * 0.62, 0.26, 0);
    g.playerAttacked({ kind: 'ranged', dmg: B.dmg, from: this, heavy: true, slot: -1 });
  }

  updateCrawler(dt, t) {
    const g = this.game, P = this.root.position, c = g.world.camPos, bp = this.bp;
    if (this.state === 'crawl') {
      P.z += dt * bp.crawlSpeed;
      P.x += Math.sin(t * 3 + this.seed) * dt * bp.wiggle;
      if (P.z > c.z - bp.dropDist) {
        this.state = 'drop';
        this.play('drop');
        this.inner.rotation.z = 0;
        const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 30, 0)];
        this.string = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xeee2c8, transparent: true, opacity: 0.8 }));
        this.inner.add(this.string);
        sfx.whoosh(0);
        g.tweens.to(P, { y: bp.dropY }, bp.dropTime, { ease: Ease.outBack, onDone: () => { if (this.alive) { this.startWindup(bp.firstWindup); this.play('atk'); } } });
      }
    } else if (this.state === 'windup') {
      this.timer -= dt;
      this.inner.scale.setScalar(1 + (1 - this.timer / this.timer0) * 0.15);
      if (this.timer <= 0) {
        this.endWindup();
        this.state = 'pounce';
        const z0 = P.z, y0 = P.y;
        const x0 = P.x, tx = c.x + (this.targetSlot ? bp.pounceSide : -bp.pounceSide);
        g.tweens.run(bp.pounceTime, (e) => { P.z = z0 + (c.z - bp.pounceStop - z0) * e; P.y = y0 + (c.y - bp.pounceDrop - y0) * e; P.x = x0 + (tx - x0) * e; }, {
          ease: Ease.inQuad,
          onDone: () => {
            if (!this.alive) return;
            g.playerAttacked({ kind: 'ranged', dmg: enemyHit(), from: this, slot: this.targetSlot });
            this.inner.scale.setScalar(1);
            this.state = 'retreat';
            this.play('drop');
            g.tweens.to(P, { z: c.z - bp.retreatDist, y: bp.retreatY }, bp.retreatTime, { ease: Ease.outCubic, onDone: () => { if (this.alive) { this.startWindup(bp.nextWindup); this.play('atk'); } } });
          },
        });
      }
    }
  }

  // info: { kind: rifle | mantra | beam, dmg (final, crit already applied), crit, stagger, stun, uv, by }
  hit(info) {
    if (!this.alive) return;
    let dmg = info.dmg;
    if (this.def.hides && this.state === 'hide') dmg *= this.bp.hiddenDmgMul ?? 0.5;
    this.lastHitBy = info.by;
    this.paint(info);
    this.flash = info.kind === 'beam' ? 0.45 : 0.85;
    const heavy = info.crit || (info.stagger || 0) >= 10;
    if (heavy) this.hurtT = 0.12;
    const p = this.uvToWorld(info.uv.u, info.uv.v);
    const fx = this.game.fx;
    if (info.kind === 'rifle') { fx.confetti(p, info.crit ? 8 : 3, 0.7); fx.ink(p, info.crit ? 8 : 2, 0.8); fx.star(p, info.crit ? 0.6 : 0.25); }
    else if (info.kind === 'mantra') { fx.confetti(p, 8, 1, [COL.gold, COL.paper, COL.white]); fx.embers(p, 6, 0.25); fx.star(p, info.crit ? 1.1 : 0.7, COL.gold); }
    else fx.embers(p, 2, 0.15);
    if (info.stagger && this.canStagger()) {
      this.poise += info.stagger;
      if (this.poise >= this.def.poise) this.stagger(info.stun || 0.5);
    }
    if (this.beh === 'walker' && this.state === 'walk') { // a little push back per hit
      const c = this.game.world.camPos, P = this.root.position, dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz) || 1;
      const k = this.bp.hitPush?.[info.kind] ?? this.bp.hitPush?.rifle ?? 0.04;
      P.x += dx / d * k; P.z += dz / d * k;
    }
    info.dealt = dmg;
    this.damage(dmg, info.kind, info);
  }
  damage(dmg, kind, info, dot = false) {
    if (!this.alive) return;
    this.hp -= dmg;
    if (!dot) this.game.onHit(this, kind, info);
    if (this.hp <= 0) this.die(kind, info);
  }
  die(kind, info) {
    this.alive = false;
    this.endWindup();
    this.game.tweens.kill(this.root.position);
    if (this.string) this.game.tweens.to(this.string.position, { y: 20 }, 0.6);
    if (this.shadowM && this.pivot === 'center') this.shadowM.visible = false;
    const uv = info?.uv || { u: 0.5, v: 0.55 };
    const crit = info?.crit;
    // rifle: knocked flat / shattered on a crit. mantra + beam: purified (burns away in gold) / shattered on a crit
    const how = crit ? 'shatter' : kind === 'mantra' || kind === 'beam' ? 'burn' : 'knock';
    if (how === 'burn') this.dieBurn(uv);
    else if (how === 'shatter') this.dieShatter(uv, 1.2);
    else this.dieKnock();
    if (how === 'burn') sfx.burnOut(0); else if (how === 'shatter') sfx.shatter(0); else sfx.paperRip(0);
    this.game.onKill(this, how, crit);
  }
}

// ---------------------------------------------------------------------------
export class Projectile extends Actor {
  constructor(game, kind, from, opts = {}) {
    const P = C.projectiles[kind], bp = T.behaviors.projectile;
    super(game, `enemy/${P.keys[Math.floor(Math.random() * P.keys.length)]}`, opts.size || P.size, 'center');
    this.kind = kind;
    this.hp = 1;
    this.root.position.copy(from);
    this.from = from.clone();
    const c = game.world.camPos;
    this.threat = 'shot';
    this.targetSlot = opts.slot ?? game.pickTarget(from.x - c.x);
    const side = (this.targetSlot ? 1 : -1) * rr(bp.side);
    this.to = new THREE.Vector3(c.x + side, c.y + rr(bp.dropY), c.z - bp.stop);
    this.ctrl = this.from.clone().lerp(this.to, 0.5).add(new THREE.Vector3((Math.random() - 0.5) * bp.wobble + (opts.curve || 0), opts.arc ?? P.arc ?? bp.arc, 0));
    this.T = opts.time || bp.time;
    this.t = 0;
    this.spin = P.spin;
    this.dmg = opts.dmg || enemyHit();
    this.lock = game.fx.lock('shot', this.targetSlot);
    game.world.scene.add(this.root);
  }
  update(dt, tt) {
    this.baseUpdate(dt, tt);
    if (!this.alive) return;
    this.t += dt;
    const k = Math.min(1, this.t / this.T);
    const a = this.from, b = this.ctrl, c = this.to, m = 1 - k;
    this.root.position.set(m * m * a.x + 2 * m * k * b.x + k * k * c.x, m * m * a.y + 2 * m * k * b.y + k * k * c.y, m * m * a.z + 2 * m * k * b.z + k * k * c.z);
    this.inner.rotation.z += this.spin * dt;
    if (this.kind === 'orb') this.inner.scale.setScalar(1 + Math.sin(tt * 20) * 0.06);
    const s = this.game.world.project(this.root.position);
    const box = this.screenBox();
    this.lock.set(s.x, this.game.H - s.y, Math.max(36, (box.y1 - box.y0) * 0.7), k, tt);
    if (k >= 1) {
      this.alive = false;
      this.lock.remove(); this.lock = null;
      const blocked = this.game.playerAttacked({ kind: 'ranged', dmg: this.dmg, from: this, slot: this.targetSlot });
      if (blocked) this.game.tweens.to(this.root.position, { y: -1, x: this.root.position.x + (Math.random() - 0.5) * 3 }, 0.6, { ease: Ease.inQuad, onDone: () => this.dispose() });
      else this.dispose();
    }
  }
  hit(info) {
    if (!this.alive) return;
    this.alive = false;
    this.lastHitBy = info.by;
    this.lock.remove(); this.lock = null;
    info.dealt = 0;
    this.game.onHit(this, info.kind, info);
    if (this.kind === 'takoyaki') sfx.thud(0); else sfx.shatter(0);
    this.game.fx.ink(this.center(), 10, 1, this.kind === 'wisp' ? COL.violet : this.kind === 'balloon' ? COL.hot : COL.bone);
    this.dieShatter(info.uv, 0.8);
    this.game.onKill(this, 'pop', false);
  }
}
