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
import { sfx, cry } from '../core/audio.js';
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
    // shootable: a white outline and glow (the frames have a transparent margin for it, tools/pad_frames.py)
    this.u.outlineOn.value = 1; this.u.mapTexel.value.set(1 / t.image.width, 1 / t.image.height);
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
    this.u.mapTexel.value.set(1 / tex[key].image.width, 1 / tex[key].image.height);
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
    const rdt = this.game.rdt ?? dt;   // (dt is the enemies' slower time, Game.update; the drawing itself lives in real time)
    this.flash = Math.max(0, this.flash - rdt * 6);
    this.u.flash.value = this.flash;
    this.dm.update(rdt);
    this.tickAnim(rdt);
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
// How it closes in (DESIGN「敌人要逼上来、要耐打、要多」, its "move": a wave's spawn, else the kind's "moves" per version, else "move"):
//   walk    straight at you, bobbing          hop     in arcing jumps with a pause between     zigzag  rolling from side to side, Z-wise
//   charge  slowly, then a red-ring rush from afar (kill it before it lands: it goes through cover)
//   burrow  sinks into the floor and bursts up again nearer (also how it enters: from under the floor)
//   float   (flyers) drifting every which way, a little nearer after every dive     step  (throwers) a few steps nearer after each throw
// Spawns stand back (tuning layout.json monster spawnMin / spawnFar) so there is ground to cover; whatever drawn prop is in the way gets
// smashed (PanelWorld.smashPropsNear).
// armor = the states it can't be staggered in (super armour): leaps, dives, throws, pounces, entrances.
// What else a kind can do (enemies.json, DESIGN「怪的行为要多样」, user 2026-10-18 "完全就是机械劳动"):
//   dashAt: 0.5      at half its HP it suddenly zips aside and on, with afterimages, untouchable meanwhile (fragile things)
//   enrage: k        the more it is hurt the faster it comes (speed x 1 + k at the end), reddening
//   evade: { n, rest, react, dist }   a sight resting on it (react s) makes it sidestep, untouchable; after n dodges it is out of
//                    breath for rest s; it never dodges while gathering an attack (that is when it can be caught)
//   phantoms: { n, shuffle, hits }    it stands among n - 1 copies of itself; all take shots, only it loses HP; a copy hit hits times
//                    melts away; after shuffle x its HP lost they all fade and come back shuffled (it in a new place)
//   dmg: n           what its bite / ram takes (else tuning combat.enemyHit; swarms bite less)
// A wave's entry can also have: count: n (that many, spread out: a swarm), from: 'statue' (it stands as a grey statue, not a target,
// until wake: seconds, or a wave event { kills / t, wake: true | n } wakes it: DESIGN「摆设活过来」), from: 'wall' | 'ceiling' (it
// breaks in through the side wall / the ceiling, leaving a hole: DESIGN「演出」), breakout: 0.4 (at that share of its HP it smashes
// through the far wall and is gone; the girls follow it through the hole: Game.breakoutAt)
const enemyHit = () => T.combat.enemyHit;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DEFAULT_MOVE = { walker: 'walk', flyer: 'float', thrower: 'step', crawler: 'crawl' };

export class Enemy extends Actor {
  constructor(game, s) {
    const def = C.enemies[s.type];
    // painted stations: "at" is a floor pixel of the painting -> world x / z on that floor
    if (s.at && game.world.at) { const w = game.world.at(s.at[0], s.at[1]); s = { ...s, x: w.x, z: w.z }; }
    const pivot = def.beh === 'flyer' || def.beh === 'crawler' ? 'center' : 'bottom';
    // one of its versions (docs/ART.md 多版本): the one least seen among its kind on the field right now, so a group never looks cloned
    const vs = def.variants || [def.sprite];
    const live = game.actors.filter((a) => a.alive && a.type === s.type).map((a) => a.sprite);
    const sprite = s.sprite || vs.map((v) => [v, live.filter((x) => x === v).length + Math.random() * 0.5]).sort((x, y) => x[1] - y[1])[0][0];
    super(game, `enemy/${sprite}_${def.first}`, def.h, pivot);
    this.sprite = sprite;
    this.move = s.move || def.moves?.[Math.max(0, vs.indexOf(sprite))] || def.move || DEFAULT_MOVE[def.beh];
    this.hopT = 0.3; this.zigSide = Math.random() < 0.5 ? 1 : -1;
    this.type = s.type;
    this.def = def;
    this.beh = def.beh;
    const B = T.behaviors;
    this.bp = { ...B.common, ...B[def.beh], ...def.params };   // this enemy's behaviour numbers
    this.frames = def.frames;
    this.hp = s.hp ?? def.hp;   // (a wave can make one tougher: the turning-around ghoul)
    this.maxHp = this.hp; this.invul = 0; this.aimT = 0; this.dodges = 0; this.tiredT = 0; this.lostRound = 0; this.breakout = s.breakout;
    this.tough = !!(s.tough || def.tough);   // never staggered, not pushed back by hits
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
    // docs/DESIGN.md「战斗画面布局」: close enough, whole, in the middle of the screen (PanelWorld.fit)
    if (world.fit && this.beh !== 'crawler' && this.beh !== 'flyer' && s.from !== 'drop' && s.from !== 'statue') {   // (flyers: their hovering spot, below)
      const ML = T.layout.monster;   // (it comes from further off and closes in: DESIGN「敌人要逼上来」; a wave's far: further still)
      const q = world.fit(new THREE.Vector3(s.x ?? 0, 0, s.z ?? world.camPos.z - 6), def.h, this.w * 0.8, false, s.near ? {} : { far: s.far ?? ML.spawnFar, min: ML.spawnMin });
      s = { ...s, x: q.x, z: q.z };
      if (this.beh === 'walker') {   // it comes straight down its clear lane toward the camera (not across the desks), to just beyond the cover
        const c = world.camPos, cd = cov.x !== undefined ? Math.hypot(cov.x - c.x, cov.z - c.z) : 2.8, qd = Math.hypot(q.x - c.x, q.z - c.z) || 1;
        const k = Math.min(1, (cd + (bp.goalBeforeCover ?? 1.1)) / qd);
        this.goal.set(c.x + (q.x - c.x) * k, 0, c.z + (q.z - c.z) * k);
      }
    }
    if (this.beh === 'flyer') {
      P.set(s.x ?? rnd(-2, 2), s.y ?? 3, s.z);
      const c = world.camPos, ceil = lv.ceilAt(c.z - 6);
      this.home = new THREE.Vector3(c.x + rnd(-bp.homeX, bp.homeX), Math.min(ceil - bp.ceilingGap, rr(bp.homeY)), c.z - rr(bp.homeZ));
      if (world.fit) world.fit(this.home, def.h, this.w * 0.8, true, { far: T.layout.monster.spawnFar, min: T.layout.monster.spawnMin });
      // a painted station: stay in front of the painted walls and inside the picture
      if (world.plates) {
        const d = Math.min(c.z - this.home.z, world.maxZ() * rnd(0.6, 0.9));
        this.home.z = c.z - d;
        this.home.x = c.x + Math.max(-0.45 * d, Math.min(0.45 * d, this.home.x - c.x));
        this.home.y = Math.max(0.6, Math.min(this.home.y, c.y + 0.3 * d));
      }
      this.shadowM = world.makeShadow(this.w * 0.35); world.scene.add(this.shadowM);
      this.play('fly', 14);
      game.etw.to(P, { x: this.home.x, y: this.home.y, z: this.home.z }, bp.enterTime, { ease: Ease.outCubic, onDone: () => { if (this.alive && this.state === 'enter') { this.state = 'hover'; this.timer = rr(bp.hoverFirst); } } });
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
    const tw = this.game.etw, P = this.root.position, walker = this.beh === 'walker', bp = this.bp;
    const ready = () => {
      if (!this.alive || this.state !== 'enter') return;
      if (this.def.phantoms && !this.phantoms) this.makePhantoms();
      if (walker) { this.state = 'walk'; this.play('walk', 7); } else if (this.def.hides) { this.state = 'hide'; this.play('hide'); } else { this.state = 'stand'; this.play('idle'); }
      this.timer = rr(bp.startDelay);
    };
    // a statue: grey stone, no outline, not a target, until it wakes (wake: seconds, or a wave event)
    if (s.from === 'statue') {
      P.set(s.x, s.y || 0, s.z); this.state = 'statue'; this.setFrame(this.prefix + (this.frames.idle || this.frames.walk || [this.def.first])[0]);
      this.u.outlineOn.value = 0; this.u.tint.value.setRGB(0.74, 0.72, 0.7); this.u.tintAmt.value = 0.8; this.statueReady = ready;
      if (s.wake != null) tw.wait(s.wake, () => this.wake());
      return;
    }
    // the turning-around scare (Game.scare): it waits, back turned, until turnAround()
    if (s.from === 'scare') { P.set(s.x, s.y || 0, s.z); this.state = 'scripted'; this.setFrame(this.prefix + (this.frames.scare || [this.def.first])[0]); return; }
    if (walker) this.play('walk', 7); else this.play('rise');
    if (s.from === 'burrow' || (this.move === 'burrow' && s.from !== 'drop')) { P.set(s.x, 0, s.z); this.burrowUp(ready); return; }
    if (s.from === 'drop') {
      P.set(s.x, lv.ceilAt(s.z) + 1, s.z);
      const pts = [new THREE.Vector3(0, this.h * 0.9, 0), new THREE.Vector3(0, 30, 0)];
      this.string = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xeee2c8, transparent: true, opacity: 0.85 }));
      this.inner.add(this.string);
      this.play('idle');
      tw.to(P, { y: 0 }, bp.dropTime, { ease: Ease.outBack, onDone: () => { this.game.fx.puff(P, 4); ready(); } });
    } else if ((s.from === 'wall' || s.from === 'ceiling') && this.game.world.addHole) {
      // it breaks in: a hole bursts open in the side wall (the side it stands on) or the ceiling, it leaps / drops down to its spot
      const g = this.game, Hd = g.world.set.hall, ceil = s.from === 'ceiling', side = s.side ?? (s.x < g.world.camPos.x ? -1 : 1);
      const sx = ceil ? s.x : side < 0 ? Hd.x0 + 0.25 : Hd.x1 - 0.25, sy = ceil ? Hd.h - 0.4 : 0.5;
      if (s.hole !== false) g.world.addHole(ceil ? 'ceil' : side < 0 ? 'left' : 'right', new THREE.Vector3(sx, ceil ? Hd.h : s.holeY ?? 1.1, s.z), s.holeSize ?? (ceil ? 1.7 : 2.0));
      P.set(sx, sy, s.z);
      const at = new THREE.Vector3(sx, ceil ? Hd.h - 0.2 : 1.1, s.z);
      g.fx.confetti(at, 26, 2.2, [COL.bone, COL.paper]); g.fx.puff(at, 8, COL.bone, 1.1); sfx.slam(); sfx.tear(0); g.post.shake(0.7);
      this.play(walker ? 'leap' : 'rise');
      tw.run(ceil ? 0.6 : 0.55, (e) => { P.x = sx + (s.x - sx) * e; P.y = ceil ? sy * (1 - e) : sy * (1 - e) + Math.sin(e * Math.PI) * 1.1; }, {
        ease: ceil ? Ease.outBounce : Ease.outQuad, onDone: () => { g.fx.puff(P, 5, COL.bone, 0.7); sfx.thud(0); if (walker) this.play('walk', 7); ready(); } });
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

  hitMeshes() { return this.alive && this.state !== 'statue' ? [this.mesh] : []; }
  update(dt, t) {
    this.baseUpdate(dt, t);
    if (!this.alive || this.state === 'scripted' || this.state === 'statue') return;
    const g = this.game;
    this.invul = Math.max(0, this.invul - dt);
    if (this.def.evade) this.updateEvade(dt);
    if (this.def.enrage) { const k = (this.rage() - 1) / this.def.enrage; this.u.tint.value.setRGB(1, 0.3, 0.25); this.u.tintAmt.value = 0.45 * k; if (k > 0.3 && Math.random() < dt * 4 * k) g.fx.puff(this.uvToWorld(rnd(0.3, 0.7), rnd(0.6, 0.95)), 1, COL.hot, 0.4); }
    if (this.dashPending && !this.moving && ['walk', 'stand', 'hover', 'hide'].includes(this.state)) { this.dashPending = false; this.dash(); }
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
      const wc = this.center(), c = g.world.project(wc);
      const b = this.screenBox();
      this.lock.set(c.x, g.H - c.y, Math.max(40, (b.y1 - b.y0) * 0.5), Math.min(1, this.timer0 > 0 ? 1 - this.timer / this.timer0 : 1), t, this.timer, b, wc);
    }
  }

  // the turning-around scare (docs/DESIGN.md 第 1 话 ⑰): frames.scare = back turned eating, its head lifting, looking over its shoulder,
  // its face over its shoulder, turned round, rising; then it fights like any other. then('face') when it shows its face, then('go') at the end
  turnAround(then) {
    const F = this.frames.scare || [], tw = this.game.tweens, at = [0, 1.0, 1.75, 2.35, 3.15, 3.55];
    F.forEach((f, i) => tw.wait(at[i] ?? i * 0.6, () => { if (!this.alive) return; this.setFrame(this.prefix + f); if (i === 3) then && then('face'); }));
    tw.wait(3.95, () => {
      if (!this.alive) return;
      if (this.beh === 'walker') { this.state = 'walk'; this.play('walk', 7); } else { this.state = 'stand'; this.play('idle'); }
      this.timer = rr(this.bp.startDelay);
      then && then('go');
    });
  }
  // the camera's horizontal forward (stations look any way: the classroom's second stop looks back)
  fwd() { const w = this.game.world, la = w.lookAt, c = w.camPos; if (!la) return { x: 0, z: -1 }; const x = la.x - c.x, z = la.z - c.z, d = Math.hypot(x, z) || 1; return { x: x / d, z: z / d }; }
  // what kind of attack its wind-up leads to (DESIGN「攻击分三种」): 'kill' = a ram you can only stop by killing / interrupting it (hiding
  // does not help: flyers' dives), 'hide' = a blast nothing stops (hide), null = an ordinary attack (a bite, a throw whose projectiles carry
  // their own marker): no marker
  // (a walker with "rush": its lunge is a ram, like the half-body ghoul crawling at you: kill it fast)
  markKind() { return this.def.blast ? 'hide' : this.beh === 'flyer' || this.beh === 'crawler' || this.rushes() ? 'kill' : null; }
  rushes() { return !!this.def.rush || this.move === 'charge'; }
  startWindup(time) {
    cry(this.type, 'windup');   // its cry, when recorded (content audio/sounds.json monsters)
    this.state = 'windup';
    this.timer = this.timer0 = time;
    if (this.beh !== 'walker') this.targetSlot = this.def.blast ? -1 : this.game.pickTarget(this.root.position.x - this.game.world.camPos.x);
    if (this.lock) this.lock.remove();
    this.mark = this.markKind();
    this.lock = this.mark ? this.game.fx.lock(this.mark, this.targetSlot) : null;
    if (this.beh !== 'walker') this.game.fx.charge(this, this.def.blast ? 0xff4fc8 : 0xffb04a);   // the glow it gathers (art has no effects drawn in)
    sfx.warn();
  }
  endWindup() { if (this.lock) { this.lock.remove(); this.lock = null; } }

  // ---- stagger: enough sustained hits interrupt whatever it was about to do
  // only a special attack being gathered ('kill') is broken off by hits: ordinary hits never freeze a monster (DESIGN「怪物挨打的样子」)
  canStagger() { return this.alive && !this.tough && this.state === 'windup' && this.mark === 'kill' && this.poiseCD <= 0 && !(this.bp.armor || []).includes(this.state); }
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
    if (this.beh === 'walker') { P.x += dx / d * bp.staggerPush; P.z += dz / d * bp.staggerPush; } else if (this.beh === 'flyer') { const f = this.fwd(); g.etw.kill(P); P.x += f.x * bp.staggerKnock[0]; P.z += f.z * bp.staggerKnock[0]; P.y += bp.staggerKnock[1]; }
  }
  recover() {
    this.inner.position.x = 0;
    const bp = this.bp;
    if (this.beh === 'walker') { this.state = 'walk'; this.play('walk', 7); } else if (this.beh === 'flyer') { this.state = 'hover'; this.timer = rr(bp.hoverAfterStun); this.play('fly', 14); } else if (this.beh === 'thrower') { this.state = 'stand'; this.timer = rr(bp.standAfterStun); this.play('idle'); } else { this.startWindup(bp.windupAfterStun); this.play('atk'); }
  }

  updateWalker(dt, t) {
    const g = this.game, P = this.root.position, tw = g.etw, bp = this.bp;
    if (this.state === 'walk') {
      if (this.moving) return;   // (a hop / roll / burrow under way)
      const dx = this.goal.x - P.x, dz = this.goal.z - P.z, d = Math.hypot(dx, dz), M = this.move;
      if ((M === 'hop' || M === 'zigzag' || M === 'burrow') && d > bp.windupDist + 0.4) {
        this.inner.position.y = 0;
        if ((this.hopT -= dt) <= 0) M === 'burrow' && d > bp.burrowMin ? this.burrowTo() : this.hop(M === 'zigzag');
        return;
      }
      const sp = this.def.speed * this.rage() * (M === 'charge' ? bp.chargeCreep : 1) * (0.7 + 0.6 * Math.abs(Math.sin(this.walkPhase)));
      if (d > 0.05) { P.x += dx / d * sp * dt; P.z += dz / d * sp * dt; g.world.smashPropsNear?.(P, this.w * 0.35); }
      this.walkPhase += dt * 7;
      this.inner.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.1;
      if (M === 'charge' && !this.charged && d < bp.chargeDist) {   // the rush: winds up from afar (red ring), then leaps the whole way
        this.charged = true; this.inner.position.y = 0; this.play('crouch'); this.startWindup(this.def.windup); sfx.dollScreech(0); return;
      }
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
        const cov = g.world.covers[this.targetSlot]?.def, c = g.world.camPos;
        // onto the barricade: just beyond it on the monster's side, whichever way the camera looks
        let tx = P.x, tz = P.z;
        if (cov) { const dx = cov.x - c.x, dz = cov.z - c.z, d = Math.hypot(dx, dz) || 1; tx = cov.x + dx / d * bp.leapOntoCover; tz = cov.z + dz / d * bp.leapOntoCover; }
        else { const dx = c.x - P.x, dz = c.z - P.z, d = Math.hypot(dx, dz) || 1; tx = P.x + dx / d * 1.5; tz = P.z + dz / d * 1.5; }
        const ty = cov ? cov.h * bp.leapHeight : 0.6, x0 = P.x, z0 = P.z, y0 = P.y, far = Math.hypot(tx - x0, tz - z0);
        const lt = bp.leapTime * Math.min(2.6, Math.max(1, far / 1.5));   // (a rush from afar takes longer: still shootable on the way)
        tw.run(lt, (e) => { if (!this.alive) return; P.x = x0 + (tx - x0) * e; P.z = z0 + (tz - z0) * e; P.y = y0 + (ty - y0) * e + Math.sin(e * Math.PI) * bp.leapArc * Math.min(2, far / 1.5); this.game.world.smashPropsNear?.(P, this.w * 0.35); }, {
          onDone: () => {
            if (!this.alive) return;
            this.state = 'bite';
            this.play('bite');
            g.post.shake(0.6);
            g.playerAttacked({ kind: this.rushes() ? 'ram' : 'bite', dmg: this.def.dmg ?? enemyHit(), from: this, slot: this.targetSlot });   // (an ordinary bite: cover stops it if she hides; a rush goes through)
            tw.wait(bp.biteHold, () => {
              if (!this.alive) return;
              this.state = 'recoil';
              this.play('recoil');
              const xx = P.x, zz = P.z, yy = P.y, cc = g.world.camPos, dd = Math.hypot(P.x - cc.x, P.z - cc.z) || 1, ux = (P.x - cc.x) / dd, uz = (P.z - cc.z) / dd;   // back, away from the camera
              tw.run(bp.recoilTime, (e) => { P.x = xx + ux * bp.recoilDist * e; P.z = zz + uz * bp.recoilDist * e; P.y = yy * (1 - e) + Math.sin(e * Math.PI) * 0.4; }, { ease: Ease.outCubic, onDone: () => { if (this.alive && this.state === 'recoil') { this.state = 'walk'; this.play('walk', 7); if (this.def.recharge) this.charged = false; } } });   // (recharge: it charges again from where it landed)
            });
          },
        });
      }
    }
  }

  // one arcing hop toward its goal (zigzag: a sideways roll, the sprite turning a full circle, the next one the other way)
  hop(zig) {
    const g = this.game, P = this.root.position, bp = this.bp, dx = this.goal.x - P.x, dz = this.goal.z - P.z, d = Math.hypot(dx, dz) || 1;
    const ux = dx / d, uz = dz / d, step = Math.min(d - bp.windupDist * 0.6, zig ? bp.rollStep : bp.hopStep);
    let tx = P.x + ux * step, tz = P.z + uz * step;
    if (zig) { this.zigSide = -this.zigSide; tx += -uz * bp.rollSide * this.zigSide; tz += ux * bp.rollSide * this.zigSide; }
    const H = g.world.set?.hall; if (H) { tx = Math.max(H.x0 + this.w * 0.5, Math.min(H.x1 - this.w * 0.5, tx)); }
    const x0 = P.x, z0 = P.z, dur = (zig ? bp.rollTime : bp.hopTime) / this.rage(), arc = zig ? bp.rollArc : bp.hopArc, spin = zig ? this.zigSide * Math.PI * 2 : 0;
    this.moving = true; this.play(zig ? 'walk' : 'leap');
    g.etw.run(dur, (e) => {
      if (!this.alive) return;
      P.x = x0 + (tx - x0) * e; P.z = z0 + (tz - z0) * e; this.inner.position.y = Math.sin(e * Math.PI) * arc; this.inner.rotation.z = spin * e;
      g.world.smashPropsNear?.(P, this.w * 0.35);
    }, { ease: zig ? Ease.inOutQuad : Ease.outQuad, onDone: () => {
      this.moving = false; this.inner.rotation.z = 0; this.inner.position.y = 0;
      if (!this.alive || this.state !== 'walk') return;
      this.play('crouch'); this.hopT = rr(zig ? bp.rollPause : bp.hopPause) / this.rage(); g.post.shake(0.12);
    } });
  }
  // into the floor and up again a few metres nearer (debris where it breaks out)
  burrowTo() {
    const g = this.game, P = this.root.position, bp = this.bp, dx = this.goal.x - P.x, dz = this.goal.z - P.z, d = Math.hypot(dx, dz) || 1;
    const step = Math.min(d - bp.windupDist, rr(bp.burrowStep)), side = rnd(-0.8, 0.8);
    this.moving = true; this.play('crouch'); g.fx.puff(P, 6, COL.bone, 0.8); sfx.thud(0);
    g.etw.to(this.inner.position, { y: -this.h * 1.1 }, 0.35, { ease: Ease.inQuad, onDone: () => {
      if (!this.alive) return;
      P.x += dx / d * step - dz / d * side; P.z += dz / d * step + dx / d * side;
      g.etw.wait(rr(bp.burrowUnder), () => { if (this.alive) this.burrowUp(() => { this.moving = false; if (this.alive) { this.play('walk', 7); this.hopT = rr(bp.hopPause); } }); });
    } });
  }
  burrowUp(then) {
    const g = this.game, P = this.root.position;
    this.inner.position.y = -this.h * 1.1;
    g.world.smashPropsNear?.(P, this.w * 0.6);
    g.fx.puff(P, 10, COL.bone, 1.1); g.fx.confetti(P, 14, 1.6, [COL.bone, COL.paper]); g.post.shake(0.4); sfx.thud(0); sfx.popup();
    this.play('leap');
    g.etw.to(this.inner.position, { y: 0 }, 0.4, { ease: Ease.outBack, onDone: () => { if (this.alive) then(); } });
  }

  updateFlyer(dt, t) {
    const g = this.game, P = this.root.position, bp = this.bp;
    if (this.state === 'hover') {
      if ((this.wanderT = (this.wanderT ?? 0) - dt) <= 0) {   // a new spot to drift to, every second or so
        this.wanderT = rr(bp.wanderEvery);
        this.wander = { x: rnd(-1, 1) * bp.swayX * 1.5, y: rnd(-1, 1) * bp.swayY * 1.6, z: rnd(-1, 1) * bp.wanderZ };
      }
      const W = this.wander || { x: 0, y: 0, z: 0 };
      P.x += (this.home.x + W.x - P.x) * dt * bp.wanderPull;
      P.y += (this.home.y + W.y + Math.sin(t * 2.1 + this.seed) * bp.swayY * 0.3 - P.y) * dt * bp.wanderPull;
      P.z += (this.home.z + W.z - P.z) * dt * bp.wanderPull;
      if (this.lastStep % 4 === 0) sfx.mothFlap(0);
      this.timer -= dt;
      if (this.timer <= 0) { this.startWindup(this.def.windup); this.play('windup'); }
    } else if (this.state === 'windup') {
      this.timer -= dt;
      { const f = this.fwd(); P.x += f.x * dt * bp.windupDrift; P.z += f.z * dt * bp.windupDrift; }   // (drawing back, away from the camera)
      if (this.timer <= 0) {
        this.endWindup();
        this.state = 'dive';
        this.play('dive');
        sfx.whoosh(0);
        const c = g.world.camPos, f = this.fwd(), side = (this.targetSlot ? bp.diveSide : -bp.diveSide) + rnd(-bp.diveJitter, bp.diveJitter);
        g.etw.to(P, { x: c.x - f.z * side + f.x * bp.diveStop, y: c.y - bp.diveDrop, z: c.z + f.x * side + f.z * bp.diveStop }, bp.diveTime, {
          ease: Ease.inQuad,
          onDone: () => {
            if (!this.alive) return;
            g.playerAttacked({ kind: 'ram', dmg: this.def.dmg ?? enemyHit(), from: this, slot: this.targetSlot });   // (a ram: hiding does not help)
            this.state = 'recoil';
            this.play('fly', 14);
            { // its next hover spot is a little nearer (never closer than near)
              const c = g.world.camPos, f = this.fwd(), dep = (this.home.x - c.x) * f.x + (this.home.z - c.z) * f.z, k = Math.min(bp.homeStep, Math.max(0, dep - bp.homeNear));
              this.home.x -= f.x * k; this.home.z -= f.z * k;
            }
            g.etw.to(P, { x: this.home.x, y: this.home.y, z: this.home.z }, bp.returnTime, { ease: Ease.outCubic, onDone: () => { if (this.alive && this.state === 'recoil') { this.state = 'hover'; this.timer = rr(bp.hoverAgain); } } });
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
      if (this.timer <= 0) { this.state = 'rise'; this.play('rise'); this.timer = bp.riseTime; sfx.popup(); this.inner.scale.set(1.1, 0.85, 1); this.game.etw.to(this.inner.scale, { x: 1, y: 1 }, 0.25, { ease: Ease.outBack }); }
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
        else if (this.def.summon && this.game.actors.filter((a) => a.alive && this.def.summon.some((q) => q.type === a.type)).length < (this.def.summonMax ?? 99)) {
          // it calls things up around itself instead of throwing (enemies.json summon: spawns, x / z relative; while fewer than summonMax
          // of them are up, else it throws)
          const P = this.root.position;
          this.def.summon.forEach((q, i) => this.game.etw.wait(i * 0.25, () => { if (this.alive) this.game.spawnEnemy({ ...q, x: P.x + (q.x || 0), z: P.z + (q.z || 0), near: true }); }));
          sfx.roar();
        } else {
          // a burst: several shots fanned out, a beat apart (each can be shot down)
          const n = this.def.burst || 1;
          for (let i = 0; i < n; i++) {
            this.game.etw.wait(i * 0.16, () => {
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
        if (this.stepIn()) return;
        if (this.def.hides) { this.state = 'hide'; this.play('hide'); this.timer = rr(bp.hideAfterThrow); } else { this.state = 'stand'; this.play('idle'); this.timer = rr(bp.standAfterThrow); }
      }
    } else if (this.state === 'advance') {
      this.inner.rotation.z = Math.sin(t * 9 + this.seed) * 0.05;
    }
  }
  // after a throw, a few steps nearer while it is still far (a hider ducks, slides along under cover and rises somewhere else)
  stepIn() {
    const g = this.game, P = this.root.position, bp = this.bp, c = g.world.camPos, f = this.fwd();
    const dep = (P.x - c.x) * f.x + (P.z - c.z) * f.z;
    if (dep <= bp.stopDist) return false;
    const step = Math.min(dep - bp.stopDist, rr(bp.stepDist)), side = rnd(-1, 1) * bp.stepSide, H = g.world.set?.hall;
    let tx = P.x - f.x * step - f.z * side, tz = P.z - f.z * step + f.x * side;
    if (H) tx = Math.max(H.x0 + this.w * 0.5, Math.min(H.x1 - this.w * 0.5, tx));
    const x0 = P.x, z0 = P.z, hider = this.def.hides, dur = rr(bp.stepTime);
    this.state = 'advance'; this.play(hider ? 'hide' : 'idle');
    g.etw.run(dur, (e) => { if (!this.alive) return; P.x = x0 + (tx - x0) * e; P.z = z0 + (tz - z0) * e; if (!hider) this.inner.position.y = Math.abs(Math.sin(e * Math.PI * 3)) * 0.12; g.world.smashPropsNear?.(P, this.w * 0.35); }, {
      ease: Ease.inOutQuad, onDone: () => {
        this.inner.position.y = 0; this.inner.rotation.z = 0;
        if (!this.alive || this.state !== 'advance') return;
        if (hider) { this.state = 'hide'; this.play('hide'); this.timer = rr(bp.hideAfterThrow) * 0.5; } else { this.state = 'stand'; this.play('idle'); this.timer = rr(bp.standAfterThrow) * 0.7; }
      } });
    return true;
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
        g.etw.to(P, { y: bp.dropY }, bp.dropTime, { ease: Ease.outBack, onDone: () => { if (this.alive) { this.startWindup(bp.firstWindup); this.play('atk'); } } });
      }
    } else if (this.state === 'windup') {
      this.timer -= dt;
      this.inner.scale.setScalar(1 + (1 - this.timer / this.timer0) * 0.15);
      if (this.timer <= 0) {
        this.endWindup();
        this.state = 'pounce';
        const z0 = P.z, y0 = P.y;
        const x0 = P.x, tx = c.x + (this.targetSlot ? bp.pounceSide : -bp.pounceSide);
        g.etw.run(bp.pounceTime, (e) => { P.z = z0 + (c.z - bp.pounceStop - z0) * e; P.y = y0 + (c.y - bp.pounceDrop - y0) * e; P.x = x0 + (tx - x0) * e; }, {
          ease: Ease.inQuad,
          onDone: () => {
            if (!this.alive) return;
            g.playerAttacked({ kind: 'ranged', dmg: enemyHit(), from: this, slot: this.targetSlot });
            this.inner.scale.setScalar(1);
            this.state = 'retreat';
            this.play('drop');
            g.etw.to(P, { z: c.z - bp.retreatDist, y: bp.retreatY }, bp.retreatTime, { ease: Ease.outCubic, onDone: () => { if (this.alive) { this.startWindup(bp.nextWindup); this.play('atk'); } } });
          },
        });
      }
    }
  }

  // info: { kind: rifle | mantra | beam, dmg (final, crit already applied), crit, stagger, stun, uv, by }
  hit(info) {
    if (!this.alive) return;
    if (this.invul > 0) {   // (zipping aside: the shot glances off, nothing is lost)
      info.dealt = 0; this.flash = Math.max(this.flash, 0.25);
      this.game.fx.star(this.uvToWorld(info.uv.u, info.uv.v), 0.35, COL.white); sfx.miss(0);
      return;
    }
    let dmg = info.dmg;
    if (this.def.hides && this.state === 'hide') dmg *= this.bp.hiddenDmgMul ?? 0.5;
    // throwing: it shrugs most of it off (DESIGN: the volley gets out, the player turns to shoot the things flying at her)
    const braced = this.beh === 'thrower' && (this.state === 'windup' || this.state === 'thrown');
    if (braced) dmg *= this.bp.throwArmor ?? 0.2;
    this.lastHitBy = info.by;
    this.paint(info);
    this.flash = braced ? 0.2 : info.kind === 'beam' ? 0.45 : 0.85;
    const heavy = info.crit || (info.stagger || 0) >= 10;
    if (heavy) this.hurtT = 0.12;
    const p = this.uvToWorld(info.uv.u, info.uv.v);
    const fx = this.game.fx;
    if (info.kind === 'rifle') { fx.confetti(p, info.crit ? 8 : 3, 0.7); fx.ink(p, info.crit ? 8 : 2, 0.8); fx.star(p, info.crit ? 0.6 : 0.25); }
    else if (info.kind === 'mantra') { fx.confetti(p, 8, 1, [COL.gold, COL.paper, COL.white]); fx.embers(p, 6, 0.25); fx.star(p, info.crit ? 1.1 : 0.7, COL.gold); }
    else fx.embers(p, 2, 0.15);
    if (info.stagger && this.canStagger()) {
      this.poise += info.stagger;
      if (this.poise >= this.def.poise) this.stagger(Math.min(0.45, info.stun || 0.45));
    }
    if (this.beh === 'walker' && this.state === 'walk' && !this.tough) { // a little push back per hit
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
    if (this.hp <= 0) { this.die(kind, info); return; }
    if (this.breakout && !this.fleeing && this.hp <= this.maxHp * this.breakout) { this.breakOut(); return; }
    if (this.def.dashAt && !this.dashed && this.hp <= this.maxHp * this.def.dashAt) { this.dashed = true; this.dashPending = true; }
    if (this.def.phantoms) { this.lostRound += dmg; if (this.lostRound >= this.maxHp * (this.def.phantoms.shuffle ?? 0.15)) { this.lostRound = 0; this.shuffle(); } }
  }

  // ---- DESIGN「怪的行为要多样」 (the kinds' dashAt / enrage / evade / phantoms; statues)
  rage() { const k = this.def.enrage; return k ? 1 + k * (1 - Math.max(0, this.hp) / this.maxHp) : 1; }
  // a zip to (dx, dz) metres in the camera's frame (x across, z toward the camera), untouchable meanwhile, afterimages behind it
  zip(lat, fw, dur, hop = 0.3) {
    const g = this.game, P = this.root.position, f = this.fwd(), H = g.world.set?.hall;
    let tx = P.x - f.z * lat - f.x * fw, tz = P.z + f.x * lat - f.z * fw;
    if (H) { tx = clamp(tx, H.x0 + this.w * 0.5, H.x1 - this.w * 0.5); tz = clamp(tz, H.z1 + 0.5, H.z0 - 0.5); }
    const c = g.world.camPos, dd = Math.hypot(tx - c.x, tz - c.z), near = T.layout.monster.near;
    if (dd < near) { tx = c.x + (tx - c.x) * near / dd; tz = c.z + (tz - c.z) * near / dd; }   // (never through the covers)
    const x0 = P.x, z0 = P.z, side = Math.sign(lat) || 1;
    if (this.home) { this.home.x += tx - x0; this.home.z += tz - z0; }
    this.invul = dur + 0.08; this.flash = 0.8; this.moving = true;
    sfx.whoosh(0); this.trail(dur);
    g.etw.run(dur, (e) => {
      if (!this.alive) return;
      P.x = x0 + (tx - x0) * e; P.z = z0 + (tz - z0) * e; this.inner.position.y = Math.sin(e * Math.PI) * hop; this.inner.rotation.z = -side * Math.sin(e * Math.PI) * 0.35;
      g.world.smashPropsNear?.(P, this.w * 0.35);
    }, { ease: Ease.outCubic, onDone: () => { this.moving = false; this.inner.rotation.z = 0; this.inner.position.y = 0; } });
  }
  dash() {   // 残血爆冲: aside and on
    this.zip((Math.random() < 0.5 ? -1 : 1) * rnd(1.6, 2.4), this.beh === 'walker' ? rnd(0.6, 1.4) : 0, 0.4, 0.45);
    this.game.fx.star(this.center(), 0.9, COL.gold); sfx.dollScreech(0);
  }
  // 躲瞄准: a player's sight resting on it makes it sidestep; it tires after a few; never while gathering an attack
  updateEvade(dt) {
    const E = this.def.evade;
    if (this.tiredT > 0) { this.tiredT -= dt; if (Math.random() < dt * 3) this.game.fx.star(this.uvToWorld(rnd(0.3, 0.7), 0.95), 0.3, COL.lime); if (this.tiredT <= 0) this.dodges = 0; return; }
    if (this.moving || this.invul > 0 || !['walk', 'stand', 'hover', 'hide'].includes(this.state)) { this.aimT = 0; return; }
    const g = this.game, b = g.box(this);
    const aimed = g.players.some((p) => (p.state === 'out' || p.activeOn) && p.aimX > b.x0 && p.aimX < b.x1 && p.aimY > b.y0 && p.aimY < b.y1);
    this.aimT = aimed ? this.aimT + dt : 0;
    if (this.aimT < (E.react ?? 0.18)) return;
    this.aimT = 0; this.dodges++;
    this.zigSide = -this.zigSide;
    this.zip(this.zigSide * (E.dist ?? 1.5) * rnd(0.8, 1.2), 0, 0.28, 0.2);
    if (this.dodges >= (E.n ?? 3)) { this.tiredT = E.rest ?? 2.6; this.flash = 0.4; }
  }
  // afterimages of the drawing where it was, fading
  trail(dur) {
    const g = this.game, n = Math.max(2, Math.round(dur / 0.07));
    for (let i = 0; i < n; i++) g.etw.wait(i * dur / n, () => {
      if (!this.alive) return;
      this.mesh.updateWorldMatrix(true, false);
      const m = new THREE.Mesh(this.mesh.geometry, this.mesh.material.clone()), U = m.material.uniforms;
      m.material.depthWrite = false; U.outlineOn.value = 0; U.flash.value = 0; U.tint.value.setRGB(1, 0.85, 0.45); U.tintAmt.value = 0.7; U.useDmg.value = 0;
      m.matrixAutoUpdate = false; m.matrix.copy(this.mesh.matrixWorld); g.world.scene.add(m);
      let t = 0;
      g.fx.add({ update: (dt) => { t += dt; U.opacity.value = 0.5 * (1 - t / 0.35); if (t >= 0.35) { m.parent && m.parent.remove(m); m.material.dispose(); return false; } return true; } });
    });
  }
  // 破墙而出 (a wave's breakout): hurt enough, it runs for the far wall, smashes through it and is gone (not a kill); the girls follow it
  // through the hole when the fight here is over, and it is waiting in the next room (its wave there: hp, from)
  breakOut() {
    const g = this.game, P = this.root.position, Hd = g.world.set?.hall;
    if (!Hd || !g.world.addHole) return;
    this.fleeing = true; this.invul = 99; this.endWindup(); this.state = 'flee'; this.u.outlineOn.value = 0; this.moving = true;
    g.etw.kill(P); g.etw.kill(this.inner.position);
    const tx = clamp(P.x, Hd.x0 + 1.2, Hd.x1 - 1.2), tz = Hd.z1 + 0.4, x0 = P.x, z0 = P.z, dur = Math.max(0.7, Math.hypot(tx - x0, tz - z0) / 7);
    sfx.roar(); cry(this.type, 'attack'); this.play(this.beh === 'walker' ? 'walk' : 'idle', 14);
    g.hud.gl.stickers.say(g.players[0], 'scare');
    g.etw.run(dur, (e) => { P.x = x0 + (tx - x0) * e; P.z = z0 + (tz - z0) * e; this.inner.position.y = Math.abs(Math.sin(e * Math.PI * 4)) * 0.25; g.world.smashPropsNear?.(P, this.w * 0.4); }, {
      ease: Ease.inQuad, onDone: () => {
        const at = new THREE.Vector3(tx, Math.min(Hd.h * 0.42, 1.3), Hd.z1);
        g.world.addHole('end', at, 2.6);
        sfx.slam(); sfx.tear(0); sfx.thud(0); g.post.shake(1.4); g.post.flash(0.3, 0xffffff);
        g.fx.confetti(at, 44, 2.8, [COL.bone, COL.paper]); g.fx.puff(at, 14, COL.bone, 1.4);
        this.alive = false; this.dispose();
        g.breakoutAt(tx, Hd.z1);
      } });
  }
  // a statue comes to life: it cracks, shakes the dust off, takes its colour back and goes
  wake() {
    if (!this.alive || this.state !== 'statue') return;
    const g = this.game, P = this.root.position;
    this.state = 'enter'; this.u.outlineOn.value = 1; this.flash = 1;
    sfx.tear(0); sfx.thud(0); g.post.shake(0.6); g.fx.puff(P, 10, COL.bone, 1.1); g.fx.confetti(this.center(), 16, 1.2, [COL.bone, COL.paper]);
    g.tweens.to(this.u.tintAmt, { value: 0 }, 0.5);
    this.inner.position.x = 0;
    g.etw.run(0.45, (e) => { this.inner.position.x = Math.sin(e * 40) * 0.05 * (1 - e); }, { onDone: () => { this.inner.position.x = 0; this.statueReady?.(); } });
  }
  // 幻影洗牌: n figures, only this one real; spawned once it is up, reshuffled after it loses a share of its HP
  makePhantoms() {
    const F = this.def.phantoms, g = this.game;
    this.phantoms = [];
    const slots = this.slots(F.n ?? 3), me = Math.floor(Math.random() * slots.length);
    this.root.position.x = slots[me].x; this.root.position.z = slots[me].z;
    if (this.home) { this.home.x = slots[me].x; this.home.z = slots[me].z; }
    slots.forEach((q, i) => { if (i !== me) { const ph = new Phantom(g, this, q.x - slots[me].x, q.z - slots[me].z); g.actors.push(ph); this.phantoms.push(ph); } });
  }
  slots(n) {   // n places across the room, at about its depth
    const g = this.game, P = this.root.position, f = this.fwd(), H = g.world.set?.hall, gap = Math.max(this.w * 1.15, 1.7);
    return Array.from({ length: n }, (_, i) => {
      const lat = (i - (n - 1) / 2) * gap;
      let x = P.x - f.z * lat, z = P.z + f.x * lat;
      if (H) x = clamp(x, H.x0 + this.w * 0.5, H.x1 - this.w * 0.5);
      return { x, z };
    }).sort(() => Math.random() - 0.5);
  }
  shuffle() {
    const g = this.game, all = [this, ...(this.phantoms || []).filter((p) => p.alive)];
    this.invul = 1.4; sfx.whoosh(0); sfx.madness();
    for (const a of all) { g.fx.ink(a.center(), 10, 1.2, COL.violet); g.tweens.to(a.u.opacity, { value: 0 }, 0.3); }
    g.etw.wait(0.6, () => {
      if (!this.alive) return;
      for (const p of this.phantoms || []) if (!p.removed) { p.alive = false; p.dispose(); }
      this.root.position.x = (g.world.camPos.x + this.root.position.x) / 2;   // (round the middle again, then spread)
      this.makePhantoms();
      for (const a of [this, ...this.phantoms]) { a.u.opacity.value = 0; g.tweens.to(a.u.opacity, { value: 1 }, 0.35); }
    });
  }
  die(kind, info) {
    this.alive = false;
    for (const p of this.phantoms || []) if (p.alive) p.melt();
    cry(this.type, 'die');
    this.u.outlineOn.value = 0;   // (the "can be shot" outline goes at once: DESIGN「怪物挨打的样子」)
    this.endWindup();
    this.game.tweens.kill(this.root.position); this.game.etw.kill(this.root.position);
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
// One of the copies a phantoms kind stands among: the same drawing doing the same thing at another place; shots land on it (it flickers)
// but take nothing from the real one; hit often enough it melts away. Not a monster of the wave (Game.checkWave skips it).
export class Phantom extends Actor {
  constructor(game, real, dx, dz) {
    super(game, real.mesh.userData.texKey, real.def.h, real.pivot);
    this.real = real; this.dx = dx; this.dz = dz; this.phantom = true; this.left = real.def.phantoms.hits ?? 10;
    this.frames = real.frames; this.prefix = real.prefix;
    if (real.shadowM) { this.shadowM = game.world.makeShadow(real.w * 0.4); game.world.scene.add(this.shadowM); }
    game.world.scene.add(this.root);
    this.sync();
  }
  sync() {
    const r = this.real, P = this.root.position, R = r.root.position;
    P.set(R.x + this.dx, R.y, R.z + this.dz);
    this.inner.position.copy(r.inner.position); this.inner.rotation.copy(r.inner.rotation); this.inner.scale.copy(r.inner.scale);
    this.setFrame(r.mesh.userData.texKey);
    if (this.shadowM) this.shadowM.position.set(P.x, 0.02, P.z);
  }
  update(dt, t) {
    this.baseUpdate(dt, t);
    if (!this.alive) return;
    if (!this.real.alive) { this.melt(); return; }
    this.sync();
    this.inner.position.x += (this.glitch = Math.max(0, (this.glitch || 0) - dt * 4)) * Math.sin(t * 90) * 0.06;
  }
  hit(info) {
    if (!this.alive) return;
    info.dealt = 0; this.lastHitBy = info.by;
    this.flash = 0.7; this.glitch = 1;
    this.game.fx.ink(this.uvToWorld(info.uv.u, info.uv.v), 3, 0.6, COL.violet); sfx.miss(0);
    if (--this.left <= 0) this.melt();
  }
  melt() {
    if (!this.alive) return;
    this.alive = false; this.u.outlineOn.value = 0;
    if (this.shadowM) this.shadowM.visible = false;
    this.game.fx.ink(this.center(), 14, 1.4, COL.violet); sfx.burnOut(0);
    this.dieBurn({ u: 0.5, v: 0.5 });
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
    // its sight: drawn on it and its hit zone (screen px, y down like the pointer): generous, it grows as it comes closer
    this.sightX = s.x; this.sightY = s.y; this.sightR = Math.max(this.game.H * T.combat.sightMin, (box.y1 - box.y0) * T.combat.sightK);
    this.lock.set(s.x, this.game.H - s.y, this.sightR, k, tt);
    if (k >= 1) {
      this.alive = false;
      this.lock.remove(); this.lock = null;
      const blocked = this.game.playerAttacked({ kind: 'shot', dmg: this.dmg, from: this, slot: this.targetSlot });   // (hiding does not help: shoot it down)
      if (blocked) this.game.tweens.to(this.root.position, { y: -1, x: this.root.position.x + (Math.random() - 0.5) * 3 }, 0.6, { ease: Ease.inQuad, onDone: () => this.dispose() });
      else this.dispose();
    }
  }
  hit(info) {
    if (!this.alive) return;
    this.alive = false;
    this.lastHitBy = info.by;
    this.lock.remove(true); this.lock = null; this.u.outlineOn.value = 0;
    info.dealt = 0;
    this.game.onHit(this, info.kind, info);
    if (this.kind === 'takoyaki') sfx.thud(0); else sfx.shatter(0);
    this.game.fx.ink(this.center(), 10, 1, this.kind === 'wisp' ? COL.violet : this.kind === 'balloon' ? COL.hot : COL.bone);
    this.dieShatter(info.uv, 0.8);
    this.game.onKill(this, 'pop', false);
  }
}
