// High-speed stretches (docs/DESIGN.md「停留点不只是一个镜头、一种打法」, user 2026-10-20: no room to take cover in - a cart, a float, a lift
// or their own legs carry them on fast): the camera rushes along the stop's path, leaning into the bends, the air full of speed lines; no
// covers, no reloading (endless ammunition), each girl in her ride mode (characters/<id>.json ride: the gunner's rotary gun, the cat's
// rapid spell); things lying across the way must be shot to bits before they get there or the girls crash into them; monsters come at
// them from ahead, alongside and from behind (then the view turns round to face them). Owned by Game (game.ride).
//   station ride: { path: [[x, y, z], ...] (world points after where the camera is), speed (m/s), face: fwd | back, lean (how hard it
//                   banks), vehicle: cart (its front edge in the bottom of the picture, rails laid along the path), marks: [...] }
//   a mark, at metres along the path: { at, spawn: [wave entries placed by ahead (metres along the path from the camera; < 0 behind),
//     x (to the side), y], block: { k, h, ahead, x } (a thing lying across the way), face, speed, say, sfx, shake, burst: [dur, seq],
//     hold (true or seconds: the run slows almost to a stop until what this mark sent is beaten, or that long - tuning ride.holdSpeed /
//     holdMax), cut: { face, color, n, hide } (a cut hidden in smoke: the picture fills with it and the view is turned while nothing shows;
//     whip: true - a quick whip round instead, streaking), hole: { on, ahead, y, size } (a hole bursts in a wall there: panels.js addHole),
//     glimpse: { k, ahead, x | at: [x, z], h, life, lunge } (a picture standing there a moment: the thing chasing them), hole.at / n (a
//     set's own wall: PanelWorld.holeAt), glimpse.delay / flip (later; mirrored), bossSay: { who, kind, tag } (its line, in its voice),
//     insert: { k, side: -1 | 1, life } or a list (a cut-in: a slanted comic panel with a girl's face slides in from her side of the
//     screen and out - the girls are out of the first-person picture; ride.js Insert) }; block.out: a hall.ways
//     id - the thing is flung out of that doorway into the way (a rigid body: it tumbles and lands across it)
//   a mark with t instead of at: that many seconds after the run began (the opening, before it moves)
//   ride.outro: { at (metres before the end), time, speed, color } - no stopping at the end: flat out, the HUD gone, the picture fading
//   out (post fade) before the next step's comic takes over (user 2026-10-21: the chase stopped dead at the end)
//   foe: { k, at: [x, z] | ahead, x, h, life, step } - the thing itself standing there to be shot at, nothing getting through (sparks, a
//   clang, its picture flinching): the girls find out it is not to be beaten here (user 2026-10-21: they talk back, try a few shots, go)
//   ride.carry: what the marks send BEHIND them runs after the camera (moved on as far as it goes, its own moves on top); what comes from
//   ahead stays where it is, the run slowing for it (hold) - user 2026-10-20, after The House of the Dead 2: the camera stops at an
//   encounter, the monsters come at it
// Whatever gets within ride.blast metres in front of the camera goes up right there, its attack landing (user 2026-10-20: "they flew past
// the camera with their warnings still up, nothing to shoot, the damage taken anyway - it should blow up at a distance from the player").
// The girls' own run (DESIGN「这是轨道射击，要的是表现力」: they are in the place, the camera films them): ride.girls: { spread (metres
// between them) } - the path is where THEY run (its points on the floor), they run along it in the 3D scene (player.js toWorld), and the
// camera keeps to a place beside them that the marks direct: cam: { back (metres behind them; < 0: ahead of them, looking back),
// side (metres to their right; < 0 left), up (metres above the floor), ahead (where it looks: metres along the way from them), lookUp,
// ease (how fast it gets there) } - the first one on ride.cam, then any mark's cam: from behind, round to the side, out in front...
// Numbers: content tuning/combat.json ride.
import * as THREE from 'three';
import { tex as TEX, meta as META } from '../core/assets.js';
import { sfx, sound } from '../core/audio.js';
import { T } from '../core/content.js';
import { FR } from '../core/particles.js';

const V = new THREE.Vector3(), V2 = new THREE.Vector3(), VD = new THREE.Vector3();
const rnd = (a, b) => a + Math.random() * (b - a);
const K = () => T.combat.ride;

export class Ride {
  constructor(game) { this.g = game; this.on = false; this.bank = 0; }

  run(S, then) {
    const g = this.g, w = g.world, R = S.ride;
    this.S = S; this.R = R; this.then = then; this.on = true;
    const girls = this.girls = !!R.girls;
    const pts = girls ? R.path.map((p) => new THREE.Vector3(...p)) : [w.camPos.clone(), ...R.path.map((p) => new THREE.Vector3(...p))];
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); this.len = this.curve.getLength(); this.s = 0;
    this.speed = 0; this.target = R.speed ?? K().speed; this.face = R.face || 'fwd'; this.faceK = this.face === 'back' ? 1 : 0;
    this.marks = (R.marks || []).map((m) => ({ ...m, done: false })).sort((a, b) => (a.at ?? -1) - (b.at ?? -1));
    this.blocks = []; this.clack = 0; this.hold = null; this.carry = !!R.carry; this.t = 0; this.whipK = 0;
    if (girls) { const c = { back: 2.6, side: 0, up: 1.45, ahead: 8, lookUp: 0.9, ease: 1.6, ...(R.cam || {}) }; this.cam = c; this.camNow = { ...c }; }
    g.combat = true; g.riding = true; g.settled = true;
    // the girls jump up into the cart from below the picture (out of cover, up and shooting from now on)
    // (away: not in the picture yet at a stage's start)
    g.players.forEach((p, i) => { if (p.state === 'down' || (p.slot && !g.p2on())) return; p.state = 'out'; p.soft?.kick(1.2); g.tweens.to(p, { y0: 0 }, 0.45, { delay: 0.1 + i * 0.08 }); });
    if (R.vehicle) this.vehicle(R.vehicle);
    sfx.whoosh(0); g.post.shake(0.6);
  }
  // where a girl's feet are on her own run (girls: spread apart across the way), and the way she faces
  girlSpot(slot, out) { const sp = (this.R.girls?.spread ?? 1.1) / 2; return this.at(this.s, slot ? sp : -sp, null, out); }
  heading(out) { return out.copy(this.tg || this.curve.getTangentAt(0)); }
  // a point on the path s metres along, x to the side (right of the way on), y above it (or at y if abs)
  at(s, x = 0, y = null, out = new THREE.Vector3()) {
    const u = Math.max(0, Math.min(1, s / this.len)), t = this.curve.getTangentAt(Math.min(0.999, u));
    this.curve.getPointAt(u, out);
    out.x += -t.z * x; out.z += t.x * x;
    if (y != null) out.y = y;
    return out;
  }

  update(dt) {
    if (!this.on) return;
    const g = this.g, w = g.world, R = this.R, k = K();
    if (g.lull) return;
    this.t += dt;
    const O = R.outro;
    if (O && !this.outroOn && this.len - this.s <= (O.at ?? 12)) {   // (the end: flat out into a fade, never a dead stop)
      this.outroOn = true; this.hold = null; this.target = Math.max(this.target, O.speed ?? this.target);
      g.post.u.fadeColor.value.set(O.color ?? '#000000'); g.tweens.to(g.post.u.fade, { value: 1 }, O.time ?? 0.9); g.hud.show(false);
    }
    if (this.hold) {   // (held: what the mark sent beaten, or the time up -> on again)
      const Hd = this.hold; Hd.t += dt;
      if (Hd.t > Hd.max || !Hd.list.some((a) => a.alive)) { this.target = Hd.resume; this.hold = null; } else this.target = k.holdSpeed ?? 1.2;
    }
    this.speed += (this.target - this.speed) * Math.min(1, dt * 1.6);
    const s0 = this.s;
    this.s = Math.min(this.len, this.s + this.speed * dt);
    if (this.carry && this.s > s0) {   // (the ones running along: moved on as far as the camera, their own moves on top)
      this.at(this.s, 0, null, V).sub(this.at(s0, 0, null, V2));
      for (const a of g.actors) if (a.alive && a.rideCarry) { a.root.position.x += V.x; a.root.position.z += V.z; }
    }
    for (const m of this.marks) if (!m.done && (m.t != null ? this.t >= m.t : this.s >= m.at)) { m.done = true; this.mark(m); }
    // the girls' own run: the camera where the marks put it about them (behind, beside, ahead), looking where they direct
    if (this.girls) {
      const u = this.s / this.len, tg = this.curve.getTangentAt(Math.min(0.999, u)), P = this.curve.getPointAt(u, V2), c = this.camNow, to = this.cam, e = Math.min(1, dt * (to.ease ?? 1.6));
      // round them, never through them: how far and from which side ease apart (the shorter way round), at least clear of the girls
      const rNow = Math.hypot(c.back, c.side), aNow = Math.atan2(c.side, c.back), rTo = Math.max(K().girlsCamMin ?? 2.6, Math.hypot(to.back ?? 0, to.side ?? 0)), aTo = Math.atan2(to.side ?? 0, to.back ?? 0);
      let da = aTo - aNow; da = Math.atan2(Math.sin(da), Math.cos(da));
      const r = Math.max(K().girlsCamMin ?? 2.6, rNow + (rTo - rNow) * e), ang = aNow + da * e;
      c.back = Math.cos(ang) * r; c.side = Math.sin(ang) * r;
      for (const k of ['up', 'ahead', 'lookUp']) c[k] += ((to[k] ?? 0) - c[k]) * e;
      w.camPos.set(P.x - tg.x * c.back - tg.z * c.side, P.y + c.up, P.z - tg.z * c.back + tg.x * c.side);
      w.lookAt.set(P.x + tg.x * c.ahead, P.y + c.lookUp, P.z + tg.z * c.ahead);
      w.rideBank = 0; this.tg = tg;
      for (const b of this.blocks) if (!b.done && this.s >= b.at - 1.0) { b.done = true; if (!b.q.broken) this.crash(b); }
      for (const a of g.actors) { if (!a.alive || !a.def || a.rideChaser) continue; V.subVectors(a.root.position, P); if (V.dot(tg) < -k.behind) { a.alive = false; a.dispose(); } }
      if (this.s >= this.len - 0.01) this.end();
      return;
    }
    // the camera on the path; looking ahead, or round behind (it swings round through the side)
    const u = this.s / this.len, tg = this.curve.getTangentAt(Math.min(0.999, u));
    this.curve.getPointAt(u, w.camPos);
    w.camPos.y += Math.sin(this.s * 2.3) * 0.025 + (Math.random() - 0.5) * 0.01 * this.speed / 8;   // (the rails' judder)
    const fT = this.face === 'back' ? 1 : 0;   // (a whip: fast; done, the ordinary ease)
    this.faceK += (fT - this.faceK) * Math.min(1, dt * (this.whipK || 2.6)); if (Math.abs(fT - this.faceK) < 0.01) this.whipK = 0;
    const yaw = Math.atan2(tg.x, tg.z) + Math.PI * this.faceK * (R.turnSide ?? 1);
    w.lookAt.set(w.camPos.x + Math.sin(yaw) * 12, w.camPos.y - 0.15, w.camPos.z + Math.cos(yaw) * 12);
    // banking into the bends (how fast the way turns), harder the faster
    const t2 = this.curve.getTangentAt(Math.min(0.999, u + 0.015)), turn = tg.x * t2.z - tg.z * t2.x;
    this.bank += (-turn * (R.lean ?? k.lean) * this.speed - this.bank) * Math.min(1, dt * 3);
    w.rideBank = this.bank * (this.faceK > 0.5 ? -1 : 1);
    // speed lines out from the middle of the picture, more the faster
    const fx = g.fx, W = g.W, H = g.H;
    this.lineAcc = (this.lineAcc || 0) + this.speed * k.lines * dt;
    while (this.lineAcc >= 1) {
      this.lineAcc -= 1;
      const a = Math.random() * Math.PI * 2, r = H * rnd(0.25, 0.55), sp = H * rnd(1.6, 3) * this.speed / 8;
      fx.oAdd.emit({ x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: a, life: rnd(0.12, 0.22), size: H * rnd(0.03, 0.06), size1: H * 0.1, color: [1, 1, 1], a: 0.55, a1: 0, frame: FR.STREAK });
    }
    // the rails' clack, quicker the faster
    this.clack -= dt * this.speed; if (this.clack <= 0) { this.clack = 2.4; if (R.vehicle) sfx.thud?.(0); }
    // a thing across the way still standing when they get there: a crash
    for (const b of this.blocks) if (!b.done && this.s >= b.at - 1.0) { b.done = true; if (!b.q.broken) this.crash(b); }
    // monsters left far behind are gone (the chasers keep up: ahead < 0 on their mark); the ones that reach the camera go up there
    VD.subVectors(w.lookAt, w.camPos).setY(0).normalize();
    for (const a of g.actors) {
      if (!a.alive || !a.def || a.boss) continue;
      V.subVectors(a.root.position, w.camPos);
      const d = V.x * VD.x + V.z * VD.z;
      if (d < (k.blast ?? 2.6) && d > -2) { this.blast(a); continue; }
      if (!a.rideChaser && V.dot(tg) < -k.behind) { a.alive = false; a.dispose(); }
    }
    if (this.vehicleG) this.vehicleG.position.y = this.vehicleY + Math.sin(this.s * 2.3) * 0.012;
    if (this.s >= this.len - 0.01) this.end();
  }

  mark(m) {
    if (m.cam && this.girls) this.cam = { ...this.cam, ...m.cam };   // (the girls' own run: the camera goes round them)
    const g = this.g;
    const sent = [];
    if (m.spawn) for (const e of m.spawn) {
      const ahead = e.ahead ?? 14, P = this.at(this.s + ahead, e.x ?? rnd(-1, 1));
      const a = g.spawnEnemy({ ...e, x: P.x, z: P.z, y: e.y });
      if (e.window) this.glass(P.z, e.y ?? 1.8, (e.x ?? 0) < 0 ? -1 : 1);   // (in through a window: it bursts)
      if (ahead < 0) a.rideChaser = true;
      if (this.carry && (e.carry ?? ahead < 0)) a.rideCarry = true;
      sent.push(a);
    }
    if (m.block) this.block(m.block);
    if (m.hole) this.hole(m.hole);
    if (m.foe) this.foe(m.foe);
    if (m.bossSay) {   // (the thing chasing them says its line - bosses.json / text/stickers.json bosses.<who>.<kind> - in its voice, its slab up top)
      const B = m.bossSay, W = g.W, H = g.H;
      g.hud.gl.stickers.boss({ id: B.who, tag: B.tag ?? '？？？', screenBox: () => ({ x0: W * 0.4, x1: W * 0.6, y0: H * 0.2, y1: H * 0.6 }) }, B.kind);
    }
    if (m.glimpse) for (const G of [].concat(m.glimpse)) G.delay ? g.tweens.wait(G.delay, () => this.on && this.glimpse(G)) : this.glimpse(G);
    if (m.insert) for (const I of [].concat(m.insert)) I.delay ? g.tweens.wait(I.delay, () => this.on && this.insert(I)) : this.insert(I);
    if (m.face) this.face = m.face;
    if (m.speed != null) { this.target = m.speed; if (this.hold) this.hold.resume = m.speed; }
    if (m.hold && sent.length) { this.hold = { list: sent, t: 0, max: m.hold === true ? (K().holdMax ?? 10) : m.hold, resume: this.hold?.resume ?? this.target }; this.target = K().holdSpeed ?? 1.2; }
    if (m.cut) this.cut(m.cut);
    // the rest of the mark is a director's cue (cues.js: say, sfx, shake, burst, hint, mv, act, cam ...); a line a moment late (not in the
    // very first frame of a stage: the HUD lays itself out first)
    const { at: _a, t: _t, spawn: _s, block: _b, face: _f, speed: _v, done: _d, hold: _h, cut: _c, hole: _o, glimpse: _g, bossSay: _y, insert: _n, foe: _e, ...cue } = m;
    if (cue.say) { const { say, ...rest } = cue; g.cues.run(rest); g.tweens.wait(0.6, () => g.cues.run({ say, who: cue.who, force: true })); } else g.cues.run(cue);
  }
  // a cut hidden in smoke (user 2026-10-20: not a smooth swing round - "a lot of smoke or particles making a sudden screen, and when it
  // clears, a new view"): a burst of smoke over the whole picture; while nothing shows the view is turned (no swing), the ones left on
  // the side it turned from are lost in it; smoke left hanging in the new view, thinning
  cut(Cu) {
    const g = this.g, fx = g.fx, W = g.W, H = g.H, hx = Cu.color ?? '#c8b8cc', c = new THREE.Color(hx), col = [c.r, c.g, c.b];
    if (Cu.whip) {   // (a whip round: fast, streaks across the picture the way it turns)
      this.face = Cu.face; this.whipK = Cu.rate ?? 9; sfx.whoosh(0); g.post.shake(0.3); this.leave(Cu.face);
      const dir = (Cu.face === 'back' ? 1 : -1) * (this.R.turnSide ?? 1);
      for (let i = 0; i < 40; i++) fx.oAdd.emit({ x: rnd(0, W), y: rnd(0, H), vx: dir * H * rnd(4, 7), vy: 0, rot: 0, life: rnd(0.12, 0.25), size: H * rnd(0.08, 0.16), size1: H * 0.2, color: [1, 1, 1], a: 0.5, a1: 0, frame: FR.STREAK });
      return;
    }
    for (let i = 0; i < (Cu.n ?? 52); i++) {
      const x = rnd(-0.1, 1.1) * W, y = rnd(-0.1, 1.1) * H, sz = H * rnd(0.35, 0.7), sh = rnd(0.82, 1.05);
      fx.oNorm.emit({ x, y, vx: (x - W / 2) * rnd(0.15, 0.5), vy: (y - H / 2) * rnd(0.15, 0.5), life: rnd(1.0, 1.5), size: sz * 0.55, size1: sz * 1.5,
        rot: rnd(0, 6.28), vrot: rnd(-0.7, 0.7), color: col.map((v) => v * sh), a: 1, a1: 0, frame: FR.SMOKE });
    }
    sfx.whoosh(0); g.post.shake(0.6);
    g.tweens.wait(Cu.hide ?? 0.3, () => {
      if (!this.on) return;
      if (Cu.face) {
        this.face = Cu.face; this.faceK = Cu.face === 'back' ? 1 : 0; this.leave(Cu.face);
      }
      g.vfx?.veil({ n: 16, dist: [1.2, 4], size: [1.2, 2.6], life: [1.0, 2.2], a: 0.55, color: hx }, 1);
    });
  }
  // turned round: the ones on the side it turned from are left behind (lost in the dust, or run from)
  leave(face) {
    const g = this.g, tg = this.curve.getTangentAt(Math.min(0.999, this.s / this.len)), sg = face === 'back' ? -1 : 1;
    for (const a of g.actors) if (a.alive && a.def && !a.boss && V.subVectors(a.root.position, g.world.camPos).dot(tg) * sg < 0) { g.fx.puff(a.root.position, 4, 0xd8c8b0, 1); a.alive = false; a.dispose(); }
  }
  // it got to them: its attack lands right there and it goes up - never past the camera with its warning still on
  blast(a) {
    const g = this.g, P = a.root.position.clone(); P.y = Math.max(P.y, 0.9);
    g.vfx?.play('blast', P, { scale: 0.6 }); g.fx.puff(P, 8, 0xd8c8b0, 1.2); g.post.shake(1.0); sfx.slam();
    g.playerAttacked({ kind: 'ram', dmg: a.def.dmg ?? T.combat.enemyHit, from: a, slot: a.targetSlot ?? -1 });
    a.alive = false; a.dispose();
  }
  // a hole bursting in a wall (the thing breaking through after them: its dust is what a cut hides behind)
  hole(Ho) {
    if (Ho.at) this.g.world.holeAt?.(new THREE.Vector3(...Ho.at), new THREE.Vector3(...(Ho.n || [0, 0, -1])).normalize(), Ho.size ?? 2.6);   // (a set's own wall)
    else { const P = this.at(this.s + (Ho.ahead ?? -6), Ho.x ?? 0); this.g.world.addHole?.(Ho.on ?? 'left', new THREE.Vector3(P.x, Ho.y ?? 1.5, P.z), Ho.size ?? 2.6); }
    sfx.slam(); sfx.roar(); this.g.post.shake(1.3);
  }
  // the thing chasing them, seen a moment: its picture standing there, lunging at them, gone into the dust
  glimpse(G) {
    const g = this.g, t = TEX[G.k]; if (!t) return;
    const h = G.h ?? 3.2, m = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0, color: 0xd8c8d8 }));
    m.scale.set(h * t.image.width / t.image.height * (G.flip ? -1 : 1), h, 1);
    const c = g.world.camPos, P = G.at ? new THREE.Vector3(G.at[0], 0, G.at[1]) : this.at(this.s + (G.ahead ?? -6), G.x ?? 0);   // (at: [x, z] in the place)
    const Q = V2.set(c.x - P.x, 0, c.z - P.z).normalize().multiplyScalar(G.lunge ?? 1.5).add(P).clone();   // (it lunges at them)
    m.position.set(P.x, h / 2, P.z); m.renderOrder = 5; g.world.scene.add(m);   // (after the holes it broke out of: they are behind it)
    g.tweens.run(G.life ?? 3, (e) => {
      m.material.opacity = Math.min(1, e * 8, (1 - e) * 4);
      const k = 1 - Math.pow(1 - Math.min(1, e * 2), 3); m.position.x = P.x + (Q.x - P.x) * k; m.position.z = P.z + (Q.z - P.z) * k;
    }, { onDone: () => { m.removeFromParent(); m.material.dispose(); } });
  }
  // the thing standing there, shot at: a picture in the place that takes the shots and shrugs them off (an actor of sorts: Game shoots
  // what g.actors offers; no def, so no wave, no lock, no blast counts it), stepping slowly closer; gone after life seconds
  foe(F) {
    const g = this.g, t = TEX[F.k]; if (!t) return;
    const h = F.h ?? 3.2, w = h * t.image.width / t.image.height, c = g.world.camPos;
    const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, alphaTest: 0.05, color: 0xffffff, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat), P = F.at ? new THREE.Vector3(F.at[0], 0, F.at[1]) : this.at(this.s + (F.ahead ?? -5), F.x ?? 0);
    m.position.set(P.x, h / 2, P.z); m.rotation.y = Math.atan2(c.x - P.x, c.z - P.z); m.userData.texKey = F.k; m.renderOrder = 5; g.world.scene.add(m);
    const dir = V2.set(c.x - P.x, 0, c.z - P.z).normalize().clone(), t0 = { k: 0, tick: 0 };
    const a = { alive: true, removed: false, prop: true, foe: true, root: m, mesh: m,
      hitMeshes: () => (a.alive ? [m] : []),
      center: () => m.position.clone(),
      uvToWorld: (u, v) => m.localToWorld(new THREE.Vector3((u - 0.5) * w, (v - 0.5) * h, 0.05)),
      screenBox: () => { const q = [[-w / 2, -h / 2], [w / 2, h / 2]].map(([x, y]) => g.world.project(m.localToWorld(new THREE.Vector3(x, y, 0)))); return { x0: Math.min(q[0].x, q[1].x), x1: Math.max(q[0].x, q[1].x), y0: Math.min(q[0].y, q[1].y), y1: Math.max(q[0].y, q[1].y) }; },
      hit: (info) => {   // (nothing gets through: sparks off it, a clang now and then, it flinches a little and comes on)
        info.dealt = 0; const p = a.uvToWorld(info.uv?.u ?? 0.5, info.uv?.v ?? 0.5);
        g.fx.star(p, 0.5, 0xffffff); g.fx.confetti(p, 2, 0.8, [0xffffff, 0xd8c8b0]); t0.k = 1;
        if (t0.tick <= 0) { sfx.clang(); t0.tick = 0.2; }
      },
      update: (dt) => {
        t0.tick -= dt; t0.k = Math.max(0, t0.k - dt * 6);
        m.position.addScaledVector(dir, (F.step ?? 0.15) * dt);
        m.scale.setScalar(1 + 0.02 * t0.k + 0.015 * Math.sin(performance.now() / 260)); mat.color.setRGB(1, 1 - 0.35 * t0.k, 1 - 0.35 * t0.k);
      },
      dispose: () => { a.removed = true; m.removeFromParent(); mat.dispose(); m.geometry.dispose(); },
    };
    g.actors.push(a);
    g.tweens.wait(F.life ?? 6, () => { if (!a.alive) return; a.alive = false; g.tweens.run(0.4, (e) => { mat.opacity = 1 - e; }, { onDone: () => a.dispose() }); });
  }
  // a cut-in: a slanted comic panel with a girl's face (her colour striped behind her), sliding in from her side, a moment, sliding out
  insert(I) {
    const g = this.g, t = TEX[I.k]; if (!t) return;
    const W = g.W, H = g.H, side = I.side ?? -1, pw = W * (I.w ?? 0.3), ph = H * (I.h ?? 0.62), pa = pw / ph, ar = t.image.width / t.image.height;
    const col = new THREE.Color(I.color ?? (side < 0 ? '#ff7ac0' : '#8ec8ff'));
    const u = { map: { value: t }, a: { value: 1 }, col: { value: col }, pa: { value: pa }, side: { value: side }, zoom: { value: 1.12 }, time: { value: 0 },
      fit: { value: new THREE.Vector3(pa > ar ? 1 : pa / ar, pa > ar ? ar / pa : 1, pa > ar ? 1 - ar / pa / 2 : 0.5) } };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D map; uniform float a, pa, side, zoom, time; uniform vec3 col, fit; varying vec2 vUv;
        void main(){
          float x = vUv.x + 0.16 * (vUv.y - 0.5) * side;   // (slanted sides)
          if (x < 0.0 || x > 1.0) discard;
          float e = min(min(x, 1.0 - x) * pa, min(vUv.y, 1.0 - vUv.y));
          vec3 bg = col * (0.72 + 0.28 * step(0.5, fract((vUv.x * pa + vUv.y) * 7.0 - time * 1.5)));
          vec2 q = (vec2(x, vUv.y) - vec2(0.5, 0.5)) * fit.xy / zoom + vec2(0.5, fit.z);
          vec4 p = (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) ? vec4(0.0) : texture2D(map, q);
          vec3 c = mix(bg, p.rgb, p.a);
          c = e < 0.006 ? vec3(0.05) : e < 0.016 ? vec3(1.0) : c;   // (a white edge, black outside it)
          gl_FragColor = vec4(c, a);
        }` }));
    m.renderOrder = 60; m.frustumCulled = false; m.scale.set(pw, ph, 1);
    const x1 = side < 0 ? pw * 0.55 + W * 0.02 : W - pw * 0.55 - W * 0.02, x0 = side < 0 ? -pw : W + pw, y = H * (I.y ?? 0.6);
    m.position.set(x0, y, 0); g.overlay.add(m); sfx.whoosh(side * 0.5);
    const life = I.life ?? 1.4;
    g.tweens.run(life + 0.45, (e) => {
      const s = e * (life + 0.45);
      const k = s < 0.2 ? 1 - Math.pow(1 - s / 0.2, 3) : s > life + 0.2 ? 1 - Math.pow((s - life - 0.2) / 0.25, 2) : 1;
      m.position.x = x0 + (x1 - x0) * k; u.zoom.value = 1.12 - 0.12 * Math.min(1, s / life); u.time.value = s;
    }, { onDone: () => { m.removeFromParent(); m.geometry.dispose(); m.material.dispose(); } });
  }
  // a window bursting as something comes in through it (the glass flying into the corridor)
  glass(z, y, side) {
    const g = this.g, Hd = g.world.set?.hall; if (!Hd) return;
    const P = new THREE.Vector3(side < 0 ? Hd.x0 + 0.1 : Hd.x1 - 0.1, y, z);
    g.fx.confetti(P, 26, 2.4, [0xdff4ff, 0xa8d8f0, 0xffffff]); g.world.phys?.chipsAt(P, new THREE.Vector3(-side, 0.3, 0), 10, [0xcfeaff, 0xa8d0e8, 0xffffff], 0.35);
    sound('shatter') || sfx.shatter(side < 0 ? -0.5 : 0.5);
  }
  // a thing lying across the way ahead (a set prop, breakable, a rigid body: src/battle/physics.js): shoot it to bits in time; out: flung
  // out of a doorway (its door slides open) - it tumbles across the floor and comes to rest in the way
  block(B) {
    const g = this.g, w = g.world, C = this.at(this.s);
    if (B.out && w.wayPoints?.(B.out)) {
      const Wp = w.wayPoints(B.out), side = Wp.W.wall === 'right' ? -1 : 1, x0 = Wp.door[0] + side * 0.35, z0 = Wp.door[2];
      w.door(B.out, true, 0.25); sfx.slam(); g.post.shake(0.6);
      w.makeProp({ k: B.k, h: B.h ?? 1.0, x: x0, z: z0, fx: C.x, fz: C.z, hp: B.hp });
      const q = w.props[w.props.length - 1];
      if (q.body && w.phys) w.phys.push(q.body, new THREE.Vector3(x0, (B.h ?? 1) * 0.8, z0), new THREE.Vector3(side, 0.5, rnd(-0.15, 0.15)).normalize(), B.fling ?? 5);
      else g.tweens.to(q.m.position, { x: (B.x ?? 0) }, 0.6, { ease: (e) => e * (2 - e) });
      g.fx.puff(new THREE.Vector3(x0, 0.6, z0), 6, 0xd8c8b0, 1);
      this.blocks.push({ q, at: this.s + Math.max(3, C.z - z0) });
      q.m.material.uniforms.outlineOn.value = 1;
      return;
    }
    const ahead = B.ahead ?? 24, P = this.at(this.s + ahead, B.x ?? 0);
    w.makeProp({ k: B.k, h: B.h ?? 1.2, x: P.x, z: P.z, fx: C.x, fz: C.z, hp: B.hp });
    const q = w.props[w.props.length - 1];
    this.blocks.push({ q, at: this.s + ahead });
    q.m.material.uniforms.outlineOn.value = 1;
  }
  crash(b) {
    const g = this.g;
    g.post.shake(1.8); g.post.flash(0.5, 0xffffff); sfx.slam(); g.G.stop(0.12);
    for (const p of g.players) if (p.state !== 'down' && p.state !== 'away' && (p.slot === 0 || g.p2on())) g.playerAttacked({ kind: 'ram', dmg: K().crashDmg, from: null, slot: p.slot });
    g.world.breakProp?.(b.q, g.world.camPos);
    this.speed *= 0.5;
  }
  // the cart: its front edge in the bottom of the picture (in front of the girls), rails along the way
  vehicle(kind) {
    const g = this.g, w = g.world, cam = w.camera;
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#5a3418'; x.fillRect(0, 0, 512, 128);
    for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#6e4220' : '#64391c'; x.fillRect(0, i * 32 + 2, 512, 28); }
    x.fillStyle = '#2a1a10'; for (const bx of [24, 488]) x.fillRect(bx - 10, 0, 20, 128);
    x.fillStyle = '#3a3a40'; x.fillRect(0, 0, 512, 10); x.fillRect(0, 118, 512, 10);
    x.fillStyle = '#c8a050'; for (let i = 0; i < 8; i++) { x.beginPath(); x.arc(40 + i * 62, 64, 5, 0, 7); x.fill(); }
    // its painted front (station ride.front: a picture key, its manifest "rim" = where its top edge is from the picture's top): as wide
    // as the view, its rim at RIM of the screen height (the girls' thighs); without one, a plain plank band
    const art = this.R.front && TEX[this.R.front], RIM = 0.17, D = 1.05;
    const half = D * Math.tan(THREE.MathUtils.degToRad(w.baseFov / 2)), Wv = 2 * half * cam.aspect * 1.04;
    const tex = art ? null : new THREE.CanvasTexture(c); if (tex) tex.colorSpace = THREE.SRGBColorSpace;
    let pw = 2.2, ph = 0.55, y0 = -0.61;
    if (art) { pw = Wv; ph = Wv * art.image.height / art.image.width; const top = (RIM * 2 - 1) * half + (META[this.R.front]?.rim ?? 0.5) * ph; y0 = top - ph / 2; }
    const gr = new THREE.Group(), m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: art || tex, transparent: !!art, depthTest: false, depthWrite: false, fog: false }));
    m.renderOrder = 15; gr.add(m); gr.position.set(0, y0, -D); cam.add(gr); this.vehicleG = gr; this.vehicleTex = tex; this.vehicleY = y0;
    m.layers.set(2);   // (drawn after the girls: they stand IN the cart, its front over their legs - Game.render)
    if (kind === 'cart') {
      // the rails: two thin rods and the sleepers along the path, on the floor
      const pts = []; for (let s = 0; s <= this.len; s += 1) pts.push(s);
      const rail = (side) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((s) => this.at(s, side * 0.42, 0.06))), Math.ceil(this.len), 0.035, 5), new THREE.MeshBasicMaterial({ color: 0x6a6a74 }));
      const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 0.06, 0.18), new THREE.MeshBasicMaterial({ color: 0x5a3a20 }), Math.ceil(this.len / 0.9));
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion();
      for (let i = 0; i < sl.count; i++) { const s = i * 0.9, p = this.at(s, 0, 0.02), t = this.curve.getTangentAt(Math.min(0.999, s / this.len)); Q.setFromAxisAngle(V2.set(0, 1, 0), Math.atan2(t.x, t.z)); M.compose(p, Q, V.set(1, 1, 1)); sl.setMatrixAt(i, M); }
      this.rails = [rail(-1), rail(1), sl]; for (const r of this.rails) w.scene.add(r);
    }
  }
  end() {
    const g = this.g, w = g.world;
    this.on = false; g.riding = false; w.rideBank = 0;
    // the ones still on the way are left behind as the cart shoots out (a puff where they were): the stop is over
    for (const a of g.actors) if (a.alive && a.def && !a.boss) { g.fx.puff(a.root.position, 6, 0xd8c8b0, 1); a.alive = false; a.dispose(); }
    if (this.vehicleG) { this.vehicleG.parent?.remove(this.vehicleG); this.vehicleG.children.forEach((m) => { m.geometry.dispose(); m.material.dispose(); }); this.vehicleTex?.dispose(); this.vehicleG = null; }
    for (const r of this.rails || []) { r.parent?.remove(r); r.geometry.dispose(); r.material.dispose(); } this.rails = null;
    const then = this.then; this.then = null; then && then();
  }
}
