// The prologue boss: the discipline committee girl turned colossal (bosses.json "dc", art tools/rounds/job_specs42.py b1_ / b2_ / b3_).
// She is far too big for the screen: the schoolyard (sets/ep0.json ep0_yard) only ever shows parts of her, each its own drawing, and
// every form has its own set of them (docs/DESIGN.md「Boss」).
//   Form 1: her head peeks over the school roof (the building hides her face below the eyes), two hands grip the roof edge, hair
//           hangs down the front. Throws confiscated phones / manga (shoot them down or hide); raises a hand high to slam it onto one
//           heroine's cover (shoot the raised hand to break it off, or it smashes the cover); blows the whistle (nobody can stop it:
//           hide). After a whistle or a broken slam the third eye opens: the weak point.
//   Form 2 (after the transformation page): she rises behind the school, waist up, the roof cracks, the camera tilts up to her.
//           Arms hang over the building; she raises the ruler (the armband crest shows only then: the weak point; shoot it enough
//           to break the swing, or hide), lashes tape (volleys), points at one girl (one heavy strike at her: she hides), crosses
//           her arms (guard: little damage) while her monsters come.
//   Form 3 (after the second page): she leans down over the yard, her face filling the sky, hair hanging around the view, hands
//           reaching down. The third eye stays open (always the weak point). Screams through the megaphone (hide), volleys, grabs at
//           a cover (shoot the hand to stop it), monsters.
// One HP bar; parts only change the damage multiplier. Hits never cut holes: hit spots change colour (paper.js solid damage).
// Places (metres in the yard): bosses.json dc.layout; each drawing's size and anchor: dc.parts; weak spots: dc.weak.
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
const V = new THREE.Vector3();

// the versions of one look that exist: 'b1_head_calm' -> boss/dc3_b1_head_calm_a, _b ... (minus the ones dc.skip leaves out)
function versions(def, look) {
  return ['a', 'b', 'c', 'd'].map((v) => `${look}_${v}`).filter((n) => tex[`boss/dc3_${n}`] && !(def.skip || []).includes(n)).map((n) => `boss/dc3_${n}`);
}

// One drawn piece of her (a head, a hand, a lock of hair): a group placed at its anchor, so it turns and sways about it; it shows one
// look at a time (each look a version picked at random when shown), and keeps its damage marks across looks.
class Part {
  constructor(boss, name, parent, { hit = true, mirror = false } = {}) {
    this.boss = boss; this.name = name; this.hit = hit; this.mirror = mirror;
    this.g = new THREE.Group(); parent.add(this.g);
    this.meshes = {}; this.m = null; this.look = null; this.dm = null; this.poise = 0;
  }
  show(look) {
    if (this.look === look && this.m) return this;
    const ks = versions(this.boss.def, look);
    if (!ks.length) { console.warn('boss: no drawing for', look); return this; }
    const key = ks[Math.floor(Math.random() * ks.length)];
    this.look = look;
    if (this.m) this.m.visible = false;
    this.m = this.meshes[key] || (this.meshes[key] = this.make(key, look));
    this.m.visible = true;
    return this;
  }
  make(key, look) {
    // its size and anchor: the entry of dc.parts that names the most of this look ('b1_hand_grip' for 'b1_hand_grip_l')
    const B = this.boss, pk = Object.keys(B.def.parts).filter((k) => look === k || look.startsWith(`${k}_`)).sort((x, y) => y.length - x.length)[0];
    const P = B.def.parts[pk] || { w: 4, a: [0.5, 0.5] };
    const t = tex[key], M = meta[key] || {}, pad = M.pad || [0, 0, 0, 0];
    const W = t.image.width, H = t.image.height, dw = W - pad[0] - pad[2], dh = H - pad[1] - pad[3];
    const k = P.w / dw, mw = W * k, mh = H * k;
    const m = paperMesh(t, mw, { pivot: 'center', segs: M.relief ? [64, Math.max(8, Math.round(64 * H / W))] : null });
    if (M.relief) setRelief(m, tex[M.relief], Math.min(P.w, dh * k) * (P.relief ?? 0.05));
    // the anchor (a point of the drawn area, 0..1 from its left / bottom) sits on the group's origin
    const ax = (pad[0] + P.a[0] * dw) * k - mw / 2, ay = (pad[3] + P.a[1] * dh) * k - mh / 2;
    m.position.set(this.mirror ? ax : -ax, -ay, 0);
    if (this.mirror) m.scale.x = -1;
    if (!this.dm) this.dm = new DamageMap(mh / mw, 512);
    attachDamage(m, this.dm, true);
    const u = m.material.uniforms;
    u.outlineOn.value = this.hit ? 1 : 0; u.mapTexel.value.set(1 / W, 1 / H);
    m.userData.owner = B; m.userData.texKey = key; m.userData.part = this;
    m.userData.box = { pad, W, H, dw, dh, k };
    m.visible = false;
    this.g.add(m);
    return m;
  }
  // the drawn size of the current look (metres)
  get w() { const b = this.m.userData.box; return b.dw * b.k; }
  get h() { const b = this.m.userData.box; return b.dh * b.k; }
  // a point of the current drawing (0..1 from the left / bottom of its drawn area) in the world
  at(u, v, out = new THREE.Vector3()) {
    const b = this.m.userData.box, x = (b.pad[0] + u * b.dw - b.W / 2) * b.k, y = (b.pad[3] + v * b.dh - b.H / 2) * b.k;
    out.set(this.m.position.x + (this.mirror ? -x : x), this.m.position.y + y, 0.08);
    return this.g.localToWorld(out);
  }
  // a hit's uv on the picture -> the drawn area (0..1)
  drawn(u, v) { const b = this.m.userData.box; return { u: (u * b.W - b.pad[0]) / b.dw, v: (v * b.H - b.pad[3]) / b.dh }; }
  shown() { let o = this.g; while (o) { if (!o.visible) return false; o = o.parent; } return true; }
  dispose() { for (const m of Object.values(this.meshes)) { m.geometry.dispose(); m.material.dispose(); } if (this.dm) this.dm.dispose(); }
}

export class DisciplineGiant extends Actor {
  constructor(game, def) {
    super(game, versions(def, 'b1_head_calm')[0], 1, 'center');
    // (the Actor's own mesh is not used: every piece of her is a Part)
    this.inner.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.dm.dispose();
    this.def = def; this.type = 'boss'; this.name = def.name; this.billboard = false;
    this.hp = this.maxHp = def.hp;
    this.poise = 0; this.poiseCD = 0; this.staggerT = 0; this.seq = 0; this.phase = 1;
    this.busy = true; this.armor = false; this.guard = false; this.raising = false; this.timer = def.firstDelay; this.pi = 0;
    this.locks = []; this.eyeT = 0; this.blinkT = rnd(2, 4); this.moodT = 0; this.hurtSum = 0;
    this.parts = [];
    const w = game.world, L = def.layout;
    this.school = w.named?.school || null;
    // the roof edge, and the line of sight over it: whatever stands behind the building is hidden below that line
    this.roof = this.school ? this.school.y + this.school.h * L.roof : 12.4;
    this.front = this.school ? this.school.z : -22;
    this.cam = w.camPos.clone();
    w.scene.add(this.root);
    this.F = [null, new THREE.Group(), new THREE.Group(), new THREE.Group()];
    this.F.slice(1).forEach((g, i) => { this.root.add(g); g.visible = i === 0; });
    this.build1(); this.build2(); this.build3();
    this.enter1();
  }
  part(name, form, opts) { const p = new Part(this, name, this.F[form], opts); this.parts.push(p); return p; }
  hiddenBelow(z) { const c = this.cam; return c.y + (this.roof - c.y) * (z - c.z) / (this.front - c.z); }

  // ---------------------------------------------------------------- the three forms
  build1() {
    const L = this.def.layout.f1, F = this.front, R = this.roof;
    // the head: its top so that the line of sight over the roof cuts it at hideV (her eyes just clear the roof)
    const head = this.head = this.part('head', 1).show('b1_head_calm');
    const hz = F + L.head.z, top = this.hiddenBelow(hz) + (1 - L.head.hideV) * head.h;
    this.headHome = new THREE.Vector3(L.head.x || 0, top, hz);
    head.g.position.copy(this.headHome);
    // hair hanging over the roof edge, down the front of the building
    this.hair = [-1, 1].map((s) => {
      const p = this.part(`hair${s < 0 ? 'L' : 'R'}`, 1, { hit: false }).show(s < 0 ? 'b1_hair_l' : 'b1_hair_r');
      p.home = new THREE.Vector3(s * L.hair.x, R + L.hair.y, F + L.hair.z); p.g.position.copy(p.home); p.side = s;
      return p;
    });
    // the two hands gripping the roof edge
    this.hands = [-1, 1].map((s) => {
      const p = this.part(`hand${s < 0 ? 'L' : 'R'}`, 1).show(s < 0 ? 'b1_hand_grip_l' : 'b1_hand_grip_r');
      p.home = new THREE.Vector3(s * L.hands.x, R + L.hands.y, F + L.hands.z); p.g.position.copy(p.home); p.side = s; p.busy = false; p.lock = null;
      p.grip = s < 0 ? 'b1_hand_grip_l' : 'b1_hand_grip_r';
      return p;
    });
  }
  build2() {
    const L = this.def.layout.f2, F = this.front;
    const body = this.body = this.part('body', 2).show('b2_body_idle');
    const bz = F + L.body.z, top = this.hiddenBelow(bz) + (1 - L.body.hideV) * body.h;
    this.bodyHome = new THREE.Vector3(0, top, bz);
    body.g.position.copy(this.bodyHome);
    const sh = (s) => new THREE.Vector3(s * L.shoulder[0], top - L.shoulder[1], bz + L.shoulder[2]);
    // arms: hanging over the building by default; the right one (screen right) does the moves
    this.arms = [-1, 1].map((s) => {
      const p = this.part(`arm${s < 0 ? 'L' : 'R'}`, 2, { mirror: s < 0 }).show('b2_arm_down');
      p.home = sh(s).add(new THREE.Vector3(0, 0, L.armZ)); p.g.position.copy(p.home); p.side = s;
      return p;
    });
    // the arm doing a move (the ruler, the lash, pointing): its own piece, standing in for the hanging arm on that side
    this.act = this.part('act', 2); this.act.show('b2_arm_ruler'); this.act.g.visible = false;
    this.guardArms = this.part('guard', 2); this.guardArms.show('b2_arms_guard'); this.guardArms.g.visible = false;
    this.guardArms.g.position.set(0, top - L.guard[1], bz + L.guard[2]);
    this.tapes = [-1, 1].map((s) => {
      const p = this.part(`tape${s < 0 ? 'L' : 'R'}`, 2, { hit: false }).show(s < 0 ? 'b2_tape_l' : 'b2_tape_r');
      p.home = new THREE.Vector3(s * L.tape[0], top - L.tape[1], bz + L.tape[2]); p.g.position.copy(p.home); p.side = s;
      return p;
    });
  }
  build3() {
    const L = this.def.layout.f3;
    const face = this.face = this.part('face', 3).show('b3_face_cruel');
    this.faceHome = new THREE.Vector3(...L.face); face.g.position.copy(this.faceHome);
    // the third eye: its own piece over the forehead, always the weak point
    this.eye = new Part(this, 'eye', face.g); this.parts.push(this.eye); this.eye.show('b3_eye');
    this.curtains = [-1, 1].map((s) => {
      const p = this.part(`curtain${s < 0 ? 'L' : 'R'}`, 3, { hit: false }).show(s < 0 ? 'b3_curtain_l' : 'b3_curtain_r');
      p.home = new THREE.Vector3(s * L.curtain[0], L.curtain[1], L.curtain[2]); p.g.position.copy(p.home); p.side = s;
      return p;
    });
    this.claws = [-1, 1].map((s) => {
      const p = this.part(`claw${s < 0 ? 'L' : 'R'}`, 3).show(s < 0 ? 'b3_hand_down_l' : 'b3_hand_down_r');
      p.home = new THREE.Vector3(s * L.claw[0], L.claw[1], L.claw[2]); p.g.position.copy(p.home); p.side = s; p.busy = false; p.lock = null;
      return p;
    });
    this.fitEye();
  }
  // the eye piece sits on the painted forehead eye of whichever face is showing (dc.eyeAt, drawn-area coordinates)
  fitEye() {
    const short = this.face.m.userData.texKey.replace('boss/dc3_', ''), e = this.def.eyeAt[short] || [0.48, 0.9];
    const p = this.face.at(e[0], e[1], V); this.face.g.worldToLocal(p);
    this.eye.g.position.set(p.x, p.y, this.def.layout.f3.eyeZ);
  }

  // form 1 comes up over the school
  enter1() {
    const g = this.game, tw = g.etw;
    sfx.roar(); g.post.shake(1.2);
    this.head.g.position.y = this.headHome.y - this.head.h * 0.95;
    tw.to(this.head.g.position, { y: this.headHome.y }, 2.2, { ease: Ease.outCubic });
    for (const h of this.hair) { h.g.scale.y = 0.01; tw.to(h.g.scale, { y: 1 }, 0.9, { delay: 1.2, ease: Ease.outBack }); }
    this.hands.forEach((h, i) => {
      h.g.position.y = h.home.y - h.h * 1.3;
      tw.to(h.g.position, { y: h.home.y }, 0.9, { delay: 1.4 + i * 0.35, ease: Ease.outBack, onDone: () => { sfx.slam(); g.post.shake(0.9); g.fx.confetti(h.home.clone(), 18, 2.4, [COL.bone, COL.paper]); } });
    });
    tw.wait(2.6, () => { this.busy = false; });
  }

  // ---------------------------------------------------------------- hits
  main() { return this.phase === 3 ? this.face : this.phase === 2 ? this.body : this.head; }
  center() { const p = this.main(); return p.at(0.5, 0.55); }
  uvToWorld(u, v) { return this.main().at(u, v); }
  screen(p, u, v) { const s = this.game.world.project(p.at(u, v, V)); return { x: s.x, y: this.game.H - s.y }; }
  screenBox() {
    const p = this.main(), w = this.game.world;
    const b = p.m.userData.box, pts = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v]) => w.project(p.at((u * b.W - b.pad[0]) / b.dw, (v * b.H - b.pad[3]) / b.dh, V)));
    return { x0: Math.min(...pts.map((q) => q.x)), x1: Math.max(...pts.map((q) => q.x)), y0: Math.min(...pts.map((q) => q.y)), y1: Math.max(...pts.map((q) => q.y)) };
  }
  hitMeshes() { return this.alive ? this.parts.filter((p) => p.hit && p.m && p.shown()).map((p) => p.m) : []; }
  // is this spot of this part a weak point right now?
  weakAt(p, u, v) {
    if (p === this.eye) return true;
    const short = p.m.userData.texKey.replace('boss/dc3_', ''), w = this.def.weak[short];
    if (!w) return false;
    const d = p.drawn(u, v), ar = p.w / p.h;
    return Math.hypot((d.u - w[0]) * ar, d.v - w[1]) < w[2];
  }
  hit(info) {
    if (!this.alive) return;
    const D = this.def, p = info.part?.userData?.part && info.part.userData.owner === this ? info.part.userData.part : this.main();
    const { u, v } = info.uv, weak = this.weakAt(p, u, v);
    let mult = weak ? D.weakMul : /^(hand|claw)/.test(p.name) ? D.handMul : D.bodyMul;
    if (this.guard && !weak) mult *= D.guardMul;
    const dmg = info.dmg * mult;
    info.dealt = dmg;
    this.lastHitBy = info.by;
    // the mark: colour changes on the spot (never a hole), bigger for the mantra
    const k = 1 / Math.max(1, p.w * 0.25);
    if (info.kind === 'rifle') p.dm.hole(u, v, (info.crit ? 0.11 : 0.08) * k); else if (info.kind === 'mantra') { p.dm.scorch(u, v, 0.25 * k, 0.35); p.dm.hole(u, v, 0.07 * k); } else p.dm.scorch(u, v, 0.3 * k, 0.12);
    p.m.material.uniforms.flash.value = weak ? 0.9 : 0.35;
    const d = p.drawn(u, v), at = p.at(d.u, d.v), fx = this.game.fx;
    if (weak) { fx.ink(at, 10, 3, COL.hot); fx.star(at, 3, COL.pink); } else if (info.kind === 'mantra') { fx.confetti(at, 6, 2.4, [COL.gold, COL.paper]); fx.star(at, 2, COL.gold); } else { fx.confetti(at, 3, 1.8); fx.star(at, 1, COL.white); }
    // a raised hand (slam / grab) gathers its own poise: enough and the move breaks off
    if (p.lock && info.stagger) { p.poise += info.stagger; if (p.poise >= (this.phase === 3 ? D.grab.poise : D.slam.poise)) this.breakHand(p); }
    // the raised ruler: hits on the crest break the swing
    if (this.raising && weak && info.stagger) { this.raisePoise += info.stagger * 1.5; if (this.raisePoise >= D.raise.poise) this.breakRaise(); }
    if (info.stagger && !this.armor && !this.busy && this.staggerT <= 0 && this.poiseCD <= 0) {
      this.poise += info.stagger * mult;
      if (this.poise >= D.poise) this.stagger();
    }
    this.hurtSum += dmg;
    this.damage(dmg, info.kind, info);
  }
  damage(dmg, kind, info) {
    if (!this.alive) return;
    this.hp -= dmg;
    if (info) this.game.onHit(this, kind, info);
    if (this.hp <= 0) { this.die(); return; }
    if (this.phase === 1 && this.hp < this.maxHp * this.def.phase2At) this.toPhase(2);
    else if (this.phase === 2 && this.hp < this.maxHp * this.def.phase3At) this.toPhase(3);
  }
  stagger() {
    const g = this.game;
    this.seq++; this.clearLocks(); this.endAll();
    this.poise = 0; this.poiseCD = this.def.poiseCooldown; this.staggerT = this.def.staggerTime;
    this.mood('hurt', this.def.staggerTime);
    if (this.phase === 1) this.openEye(this.def.staggerTime + 1.2);
    this.shake(0.35);
    g.post.shake(0.9); sfx.roar();
    g.fx.stamp('don', g.W * 0.5, g.H * 0.7, 0.24, 0);
    this.timer = Math.max(this.timer, this.def.staggerTime + 0.6);
  }
  // her face for a while: hurt / angry / the blow of the whistle... (each form has its own drawings)
  mood(m, t) {
    this.moodT = t; this.moodNow = m;
    if (this.phase === 1) this.head.show(this.eyeT > 0 && m !== 'whistle' ? 'b1_head_eye' : `b1_head_${m}`);
    else if (this.phase === 2) this.body.show(`b2_body_${m === 'angry' ? 'roar' : m}`);
    else { this.face.show(`b3_face_${m === 'angry' ? 'rage' : m}`); this.fitEye(); }
  }
  restFace() {
    this.moodNow = null;
    if (this.phase === 1) this.head.show(this.eyeT > 0 ? 'b1_head_eye' : 'b1_head_calm');
    else if (this.phase === 2) this.body.show('b2_body_idle');
    else { this.face.show(this.hp < this.maxHp * 0.15 ? 'b3_face_rage' : 'b3_face_cruel'); this.fitEye(); }
  }
  openEye(t) { if (this.phase === 1) { this.eyeT = t; this.head.show('b1_head_eye'); } }
  shake(a) {
    const o = this.F[this.phase], x0 = o.position.x;
    this.game.etw.run(0.5, (e) => { o.position.x = x0 + Math.sin(e * 40) * a * (1 - e); });
  }

  // ---------------------------------------------------------------- locks (warnings that follow a part)
  addLock(type, slot, p, u, v, dur, size) { const o = { L: this.game.fx.lock(type, slot), p, u, v, t: 0, dur, size }; this.locks.push(o); return o; }
  dropLock(o) { if (!o) return; o.L.remove(); this.locks = this.locks.filter((x) => x !== o); }
  clearLocks() {
    for (const o of this.locks) o.L.remove();
    this.locks = [];
    for (const h of [...this.hands, ...this.claws]) h.lock = null;
    this.raiseLock = null;
    this.game.post.u.warn.value = 0;
  }
  // everything back to rest (a stagger, a broken move, a new form)
  endAll() {
    const tw = this.game.etw;
    this.armor = false; this.raising = false; this.guard = false;
    for (const h of [...this.hands, ...this.claws]) if (h.busy) {
      h.busy = false; tw.kill(h.g.position); tw.kill(h.g.rotation);
      if (h.grip) h.show(h.grip);
      tw.to(h.g.position, { x: h.home.x, y: h.home.y, z: h.home.z }, 0.6, { ease: Ease.outCubic }); h.g.rotation.set(0, 0, 0);
    }
    if (this.phase === 2) this.armsRest();
    this.restFace();
  }
  armsRest() {
    for (const a of this.arms) { a.show('b2_arm_down'); a.g.visible = true; a.g.position.copy(a.home); a.g.rotation.set(0, 0, 0); }
    this.guardArms.g.visible = false;
    this.act.g.visible = false; this.act.g.rotation.set(0, 0, 0); this.act.g.scale.setScalar(1);
  }
  // one arm does a move: its drawing (a look) at that shoulder, plus an offset (dc.layout.f2.moves)
  armMove(look, side) {
    const M = this.def.layout.f2.moves[look], a = this.arms[side < 0 ? 0 : 1];
    a.g.visible = false;
    this.act.show(look); this.act.g.visible = true;
    this.act.g.position.copy(a.home).add(new THREE.Vector3(...M.at)); this.act.g.rotation.set(0, 0, 0); this.act.g.scale.setScalar(1);
    return this.act;
  }

  // ---------------------------------------------------------------- frame
  update(dt, t) {
    if (!this.alive) return;
    const g = this.game;
    for (const p of this.parts) if (p.m) { const u = p.m.material.uniforms; u.flash.value = Math.max(0, u.flash.value - dt * 6); p.dm.update(dt); g.world.lightAt(this.root.position, u.lit.value); }
    this.poise = Math.max(0, this.poise - this.def.poise * this.def.poiseDrain * dt);
    this.poiseCD -= dt; this.staggerT -= dt;
    this.idle(dt, t);
    for (const o of this.locks) {
      o.t += dt;
      const s = this.screen(o.p, o.u, o.v);
      o.L.set(s.x, s.y, g.H * o.size, Math.min(1, o.t / o.dur), t);
    }
    g.post.u.warn.value = this.locks.some((o) => o.L.type === 'heavy') ? 0.3 + 0.3 * Math.abs(Math.sin(t * 8)) : Math.max(0, g.post.u.warn.value - dt);
    if (this.busy || this.staggerT > 0 || this.armor || this.raising) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    const P = this.def.patterns[this.phase - 1], move = P[this.pi++ % P.length];
    this[move]();
  }
  // alive between the moves: she breathes, blinks, her hair sways; her face goes back to rest after a mood; hurt a lot quickly = angry
  idle(dt, t) {
    const br = Math.sin(t * 0.9) * 0.012;
    if (this.phase === 1) {
      this.head.g.scale.set(1, 1 + br, 1);
      for (const h of this.hair) h.g.rotation.z = Math.sin(t * 0.8 + h.side) * 0.035;
      for (const h of this.hands) if (!h.busy) h.g.scale.set(1, 1 + Math.sin(t * 1.7 + h.side) * 0.02, 1);
      if (this.eyeT > 0) { this.eyeT -= dt; if (this.eyeT <= 0 && !this.armor && !this.moodNow) this.restFace(); }
      // a blink now and then (not while the eye is open or she is doing something with her face)
      this.blinkT -= dt;
      if (this.blinkT <= 0 && !this.moodNow && this.eyeT <= 0 && !this.armor) { this.head.show('b1_head_blink'); this.blinkT = rnd(2.4, 4.6); this.later(0.16, () => { if (!this.moodNow && this.eyeT <= 0) this.restFace(); }); }
    } else if (this.phase === 2) {
      this.body.g.scale.set(1, 1 + br, 1);
      for (const p of this.tapes) p.g.rotation.z = Math.sin(t * 1.1 + p.side * 2) * 0.06;
      for (const a of this.arms) if (a.look === 'b2_arm_down') a.g.rotation.z = Math.sin(t * 0.7 + a.side) * 0.03;
    } else if (this.phase === 3) {
      this.F[3].rotation.z = Math.sin(t * 0.6) * 0.012;
      this.eye.g.scale.setScalar(1 + Math.sin(t * 5) * 0.06);
      this.eye.m.material.uniforms.flash.value = Math.max(this.eye.m.material.uniforms.flash.value, 0.1 + 0.1 * Math.sin(t * 5));
      for (const c of this.curtains) c.g.rotation.z = Math.sin(t * 0.5 + c.side) * 0.025;
      for (const c of this.claws) if (!c.busy) c.g.position.y = c.home.y + Math.sin(t * 1.2 + c.side) * 0.25;
    }
    if (this.moodT > 0) { this.moodT -= dt; if (this.moodT <= 0 && !this.armor && !this.raising) this.restFace(); }
    // a lot of damage in a short time: she gets angry for a moment
    this.hurtSum = Math.max(0, this.hurtSum - dt * this.maxHp * 0.02);
    if (this.hurtSum > this.maxHp * 0.04 && !this.moodNow && !this.armor && !this.raising && !this.busy) { this.hurtSum = 0; this.mood('angry', 1.4); }
  }
  later(s, fn) { const q = this.seq; this.game.etw.wait(s, () => { if (this.alive && q === this.seq) fn(); }); }

  // ---------------------------------------------------------------- form 1
  throwStuff() {
    const g = this.game, D = this.def.throw, h = this.hands[this.pi % 2];
    h.busy = true; h.show('b1_hand_throw');
    const up = h.home.clone().add(new THREE.Vector3(0, this.def.layout.f1.throwUp, 0.4));
    g.etw.to(h.g.position, { y: up.y, z: up.z }, 0.45, { ease: Ease.outBack });
    const n = Math.round(rr(D.shots[0]));
    for (let i = 0; i < n; i++) this.later(0.55 + i * D.gap, () => {
      const kind = D.projectiles[i % D.projectiles.length];
      h.g.rotation.z = h.side * (i % 2 ? 0.12 : -0.12);
      g.spawnProjectile(kind, h.at(0.3, 0.8), { slot: g.pickTarget(h.side), time: D.flight, curve: (i % 2 ? 1 : -1) * D.curve, dmg: D.dmg });
      sfx.throwIt(0);
    });
    this.later(0.7 + n * D.gap, () => { h.busy = false; h.g.rotation.z = 0; h.show(h.grip); g.etw.to(h.g.position, { y: h.home.y, z: h.home.z }, 0.5, { ease: Ease.outCubic }); });
    this.timer = 0.9 + n * D.gap + D.rest;
  }
  slam() {
    const g = this.game, D = this.def.slam, slot = g.pickTarget(this.pi % 2 ? 0.5 : -0.5), h = this.hands[slot === 1 ? 1 : 0];
    h.busy = true; h.poise = 0; h.show('b1_hand_raise');
    this.mood('angry', D.windup);
    sfx.warn(); g.warnSlam();
    // the hand rises high over the roof and hangs there (the wind-up: shoot it to stop it)
    const high = h.home.clone().add(new THREE.Vector3(-h.side * 1.5, this.def.layout.f1.slamUp, 1));
    g.etw.to(h.g.position, { x: high.x, y: high.y, z: high.z }, D.windup * 0.6, { ease: Ease.outCubic });
    g.etw.to(h.g.rotation, { z: h.side * 0.25 }, D.windup * 0.6, { ease: Ease.outCubic });
    h.lock = this.addLock('melee', slot, h, 0.5, 0.55, D.windup, 0.16);
    this.later(D.windup, () => this.handDown(h, slot, D, () => { h.show(h.grip); }));
    this.timer = D.windup + D.fall + D.rest;
  }
  // a raised hand comes down onto one heroine's cover: all the way at the camera
  handDown(h, slot, D, back) {
    const g = this.game;
    this.dropLock(h.lock); h.lock = null;
    const cov = g.world.covers[slot], c = g.world.camPos;
    const to = new THREE.Vector3(cov ? cov.def.x : c.x + (slot ? 1 : -1), 0.6, cov ? cov.def.z - 0.6 : c.z - 2);
    g.etw.to(h.g.rotation, { z: 0 }, D.fall);
    g.etw.to(h.g.position, { x: to.x, y: to.y, z: to.z }, D.fall, {
      ease: Ease.inQuad,
      onDone: () => {
        if (!this.alive) return;
        sfx.slam(); g.post.shake(1.6); g.post.flash(0.4, 0xffffff);
        g.fx.confetti(to, 30, 2.6, [COL.bone, COL.paper]);
        g.fx.stamp('don', g.W * (slot ? 0.7 : 0.3), g.H * 0.4, 0.3, 0);
        if (cov && g.world.breakCover) g.world.breakCover(cov);
        g.playerAttacked({ kind: 'melee', dmg: D.dmg, from: this, slot });
        this.later(0.7, () => { h.busy = false; back && back(); g.etw.to(h.g.position, { x: h.home.x, y: h.home.y, z: h.home.z }, 0.9, { ease: Ease.inOutQuad }); });
      },
    });
  }
  // shot enough while raised: the hand flinches back, she reels (form 1: the eye opens)
  breakHand(h) {
    const g = this.game;
    this.seq++;
    this.dropLock(h.lock); h.lock = null; h.poise = 0; h.busy = false;
    g.etw.kill(h.g.position); g.etw.kill(h.g.rotation); h.g.rotation.set(0, 0, 0);
    if (h.grip) h.show(h.grip);
    g.etw.to(h.g.position, { x: h.home.x, y: h.home.y, z: h.home.z }, 0.7, { ease: Ease.outBack });
    g.fx.stamp('don', g.W * 0.5, g.H * 0.72, 0.28, 0);
    g.post.shake(1); sfx.roar(); g.G.stop(0.12);
    g.hud.gl.stickers.say(g.players.find((p) => p.state === 'out') || g.players[0], 'stagger');
    this.mood('hurt', 1.2);
    this.staggerT = 1.2;
    if (this.phase === 1) this.later(1.0, () => this.openEye(this.def.eyeOpen));
    this.timer = 1.2 + this.def.eyeOpen * 0.7;
  }
  whistle() {
    const g = this.game, D = this.def.whistle;
    this.armor = true;
    this.mood('whistle', D.windup + 0.3);
    sfx.warn(); setTimeout(() => sfx.warn(), 300);
    const w = this.def.layout.f1.whistleAt;
    const o = this.addLock('heavy', -1, this.head, w[0], w[1], D.windup, 0.24);
    this.later(D.windup, () => {
      this.dropLock(o);
      this.blast(D.dmg, this.head, w[0], w[1]);
      this.armor = false;
      this.later(0.4, () => { this.moodNow = null; this.openEye(this.def.eyeOpen); });
    });
    this.timer = D.windup + this.def.eyeOpen + D.rest;
  }
  blast(dmg, p, u, v) {
    const g = this.game;
    sfx.slam(); sfx.madness();
    g.post.flash(0.7, 0xff4fb0); g.post.shake(1.6);
    const at = p.at(u, v);
    g.fx.confetti(at, 50, 6, [COL.pink, COL.white, COL.hot]); g.fx.star(at, 8, COL.pink);
    g.fx.stamp('gogogo', g.W * 0.5, g.H * 0.6, 0.32, 0);
    g.playerAttacked({ kind: 'ranged', dmg, from: this, heavy: true, slot: -1 });
  }

  // ---------------------------------------------------------------- form changes: she sinks away, the transformation page, the new form
  toPhase(n) {
    const g = this.game, tw = g.etw;
    this.phase = n; this.seq++; this.clearLocks();
    this.busy = true; this.pi = 0; this.armor = false; this.raising = false; this.guard = false;
    sfx.roar(); sfx.madness();
    g.post.flash(0.9, 0xff3a8a); g.post.shake(1.5); g.G.stop(0.3);
    g.clearProjectiles && g.clearProjectiles();
    const old = this.F[n - 1];
    tw.to(old.position, { y: n === 2 ? -14 : -24 }, 1.1, { ease: Ease.inCubic });
    tw.wait(1.2, () => {
      old.visible = false;
      g.interlude(this.def.comics?.[n], () => this.reveal(n));
    });
    this.timer = 99;
  }
  reveal(n) {
    const g = this.game, tw = g.etw, L = this.def.layout;
    // the camera tilts up to her (the covers move with the view so they still stand before the girls)
    const look = this.def.look[n - 1], S = g.S;
    if (S) { S.look = look; g.world.placeCovers && g.world.placeCovers(g.players); }
    tw.to(g.world.lookAt, { x: look[0], y: look[1], z: look[2] }, 1.4, { ease: Ease.inOutCubic });
    g.hud.gl.hold('phase', { text: tr(this.def.texts[`phase${n}`]), dur: 2.6 });   // transforming: nothing to shoot for a moment
    const F = this.F[n]; F.visible = true;
    if (n === 2) {
      // the roof cracks under her: the building is damaged from now on
      const sc = this.school;
      if (sc && tex[L.f2.schoolAfter]) { sc.m.material.map = tex[L.f2.schoolAfter]; sc.m.material.needsUpdate = true; sc.m.userData.texKey = L.f2.schoolAfter; }
      F.position.y = -16;
      tw.to(F.position, { y: 0 }, 1.7, { delay: 0.3, ease: Ease.outBack, onDone: () => { g.post.shake(1.4); sfx.slam(); this.mood('angry', 1.2); } });
      tw.wait(0.4, () => { g.post.shake(1.2); sfx.slam(); if (sc) for (let i = 0; i < 6; i++) g.fx.confetti(new THREE.Vector3(rnd(-12, 12), this.roof, this.front + 0.5), 20, 4, [COL.bone, COL.paper]); });
      this.armsRest();
    } else {
      F.position.y = 18;
      tw.to(F.position, { y: 0 }, 1.6, { delay: 0.2, ease: Ease.outCubic, onDone: () => { g.post.shake(1); sfx.roar(); this.mood('scream', 0.9); } });
    }
    tw.wait(2.4, () => { this.busy = false; this.timer = 0.8; g.combat = true; });
  }

  // ---------------------------------------------------------------- form 2
  lash() {
    const g = this.game, D = this.def.lash, n = Math.round(rr(D.shots)), a = this.armMove('b2_arm_lash', 1);
    this.mood('angry', 0.6 + n * D.gap);
    sfx.roar();
    g.etw.run(0.4 + n * D.gap, (e) => { a.g.rotation.z = Math.sin(e * Math.PI * 3) * 0.12; });
    for (let i = 0; i < n; i++) this.later(0.3 + i * D.gap, () => {
      const from = (i % 2 ? this.tapes[i % 4 < 2 ? 0 : 1] : a).at(rnd(0.15, 0.85), rnd(0.2, 0.8));
      g.spawnProjectile(D.projectiles[i % D.projectiles.length], from, { slot: g.pickTarget(from.x - g.world.camPos.x), time: D.flight, curve: rnd(-2, 2), dmg: D.dmg });
      sfx.throwIt(0);
    });
    this.later(0.5 + n * D.gap, () => this.armsRest());
    this.timer = 0.5 + n * D.gap + D.rest;
  }
  raise() {
    const g = this.game, D = this.def.raise;
    this.raising = true; this.raisePoise = 0;
    const a = this.armMove('b2_arm_ruler', -1);
    a.g.rotation.z = 0.25; g.etw.to(a.g.rotation, { z: 0 }, 0.5, { ease: Ease.outBack });
    this.mood('angry', D.windup);
    sfx.warn(); setTimeout(() => sfx.warn(), 300); g.warnSlam();
    const short = a.m.userData.texKey.replace('boss/dc3_', ''), w = this.def.weak[short] || [0.3, 0.18];
    this.raiseLock = this.addLock('heavy', -1, a, w[0], w[1], D.windup, 0.2);
    this.later(D.windup, () => {
      this.dropLock(this.raiseLock); this.raiseLock = null; this.raising = false;
      // the ruler comes down across the yard
      g.etw.to(a.g.rotation, { z: -0.9 }, 0.18, { ease: Ease.inQuad, onDone: () => {
        this.blast(D.dmg, a, 0.7, 0.8);
        for (const c of g.world.covers) if (c && c.hp !== undefined) { c.hp -= D.coverDmg; if (c.hp <= 0 && g.world.breakCover) g.world.breakCover(c); }
        this.later(0.6, () => this.armsRest());
      } });
    });
    this.timer = D.windup + D.rest;
  }
  breakRaise() {
    const g = this.game;
    this.seq++;
    this.dropLock(this.raiseLock); this.raiseLock = null; this.raising = false;
    this.armsRest();
    this.mood('hurt', this.def.staggerTime);
    this.shake(0.6);
    g.fx.stamp('don', g.W * 0.5, g.H * 0.7, 0.3, 0); g.post.shake(1.2); sfx.roar(); g.G.stop(0.15);
    g.hud.gl.stickers.say(g.players.find((p) => p.state === 'out') || g.players[0], 'stagger');
    this.staggerT = this.def.staggerTime;
    this.timer = this.def.staggerTime + 0.8;
  }
  // she points at one girl: a heavy strike at her alone after the wind-up (that girl hides)
  point() {
    const g = this.game, D = this.def.point, slot = g.pickTarget(this.pi % 2 ? 0.6 : -0.6), a = this.armMove('b2_arm_point', 1);
    a.g.scale.setScalar(0.6); g.etw.to(a.g.scale, { x: 1, y: 1, z: 1 }, 0.4, { ease: Ease.outBack });
    this.mood('angry', D.windup);
    sfx.warn();
    const o = this.addLock('heavy', slot, a, 0.35, 0.45, D.windup, 0.2);
    this.later(D.windup, () => {
      this.dropLock(o);
      g.post.flash(0.5, 0xff4fb0); g.post.shake(1.3); sfx.slam();
      g.fx.stamp('don', g.W * (slot ? 0.7 : 0.3), g.H * 0.45, 0.3, 0);
      g.playerAttacked({ kind: 'ranged', dmg: D.dmg, from: this, heavy: true, slot });
      this.later(0.5, () => this.armsRest());
    });
    this.timer = D.windup + D.rest;
  }
  guardUp() {
    const D = this.def.guard;
    this.guard = true;
    for (const a of this.arms) a.g.visible = false;
    this.guardArms.g.visible = true; this.guardArms.show('b2_arms_guard');
    this.guardArms.g.scale.setScalar(0.7); this.game.etw.to(this.guardArms.g.scale, { x: 1, y: 1, z: 1 }, 0.35, { ease: Ease.outBack });
    sfx.roar();
    this.summonWave(D.spawns);
    this.later(D.time, () => { this.guard = false; this.armsRest(); });
    this.timer = D.time + 0.6;
  }
  summonWave(spawns) {
    const g = this.game;
    spawns.forEach((s, i) => this.later(0.3 + i * 0.4, () => g.spawnEnemy({ ...s })));
  }

  // ---------------------------------------------------------------- form 3
  scream() {
    const g = this.game, D = this.def.scream;
    this.armor = true;
    this.mood('scream', D.windup + 0.4);
    sfx.warn(); setTimeout(() => sfx.warn(), 250);
    const m = this.def.layout.f3.screamAt;
    const o = this.addLock('heavy', -1, this.face, m[0], m[1], D.windup, 0.3);
    g.etw.run(D.windup, (e) => { this.face.g.scale.setScalar(1 + e * 0.05); });
    this.later(D.windup, () => { this.dropLock(o); this.face.g.scale.setScalar(1); this.blast(D.dmg, this.face, m[0], m[1]); this.armor = false; });
    this.timer = D.windup + D.rest;
  }
  volley() {
    const g = this.game, D = this.def.volley, n = Math.round(rr(D.shots));
    this.mood('rage', 0.4 + n * D.gap);
    for (let i = 0; i < n; i++) this.later(0.2 + i * D.gap, () => {
      const src = i % 3 === 2 ? this.claws[i % 2] : this.face;
      g.spawnProjectile(D.projectiles[i % D.projectiles.length], src.at(rnd(0.3, 0.7), rnd(0.2, 0.5)), { slot: g.pickTarget(i % 2 ? 1 : -1), time: D.flight, curve: rnd(-2.5, 2.5), dmg: D.dmg });
      sfx.throwIt(0);
    });
    this.timer = 0.3 + n * D.gap + D.rest;
  }
  // a hand reaches up, then grabs down at one girl's cover (shoot the hand to stop it)
  grab() {
    const g = this.game, D = this.def.grab, slot = g.pickTarget(this.pi % 2 ? 0.5 : -0.5), h = this.claws[slot === 1 ? 1 : 0];
    h.busy = true; h.poise = 0;
    this.mood('rage', D.windup);
    sfx.warn(); g.warnSlam();
    const high = h.home.clone().add(new THREE.Vector3(-h.side * 0.8, this.def.layout.f3.grabUp, 0.5));
    g.etw.to(h.g.position, { x: high.x, y: high.y, z: high.z }, D.windup * 0.6, { ease: Ease.outCubic });
    h.lock = this.addLock('melee', slot, h, 0.5, 0.4, D.windup, 0.16);
    this.later(D.windup, () => this.handDown(h, slot, D));
    this.timer = D.windup + D.fall + D.rest;
  }
  summon() { this.summonWave(this.def.summon.spawns); this.timer = this.def.summon.rest; }

  // ---------------------------------------------------------------- death
  die() {
    this.alive = false; this.seq++;
    this.clearLocks();
    const g = this.game, p = this.main();
    if (this.phase === 3) this.face.show('b3_face_hurt');
    sfx.roar(); g.post.flash(1, 0xffffff); g.post.shake(1.6);
    for (let i = 0; i < 10; i++) g.etw.wait(i * 0.22, () => { const q = p.at(rnd(0.2, 0.8), rnd(0.2, 0.9)); g.fx.confetti(q, 40, 5); g.fx.star(q, 5, COL.pink); sfx.shatter(rnd(-0.5, 0.5)); g.post.shake(0.8); });
    // she dissolves into petals and paper
    g.etw.wait(1.2, () => {
      sfx.burnOut(0);
      const ms = this.parts.flatMap((q) => Object.values(q.meshes));
      for (const m of ms) m.material.uniforms.dOrigin.value.set(0.5, 0.7);
      g.etw.run(2.4, (e) => { for (const m of ms) m.material.uniforms.dissolve.value = e; }, { onDone: () => this.dispose() });
    });
    g.onBossDead(this);
  }
  dispose() {
    if (this.removed) return;
    this.root.parent && this.root.parent.remove(this.root);
    for (const p of this.parts) p.dispose();
    this.removed = true;
  }
}
