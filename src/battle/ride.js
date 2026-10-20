// High-speed stretches (docs/DESIGN.md「停留点不只是一个镜头、一种打法」, user 2026-10-20: no room to take cover in - a cart, a float, a lift
// or their own legs carry them on fast): the camera rushes along the stop's path, leaning into the bends, the air full of speed lines; no
// covers, no reloading (endless ammunition), each girl in her ride mode (characters/<id>.json ride: the gunner's rotary gun, the cat's
// rapid spell); things lying across the way must be shot to bits before they get there or the girls crash into them; monsters come at
// them from ahead, alongside and from behind (then the view turns round to face them). Owned by Game (game.ride).
//   station ride: { path: [[x, y, z], ...] (world points after where the camera is), speed (m/s), face: fwd | back, lean (how hard it
//                   banks), vehicle: cart (its front edge in the bottom of the picture, rails laid along the path), marks: [...] }
//   a mark, at metres along the path: { at, spawn: [wave entries placed by ahead (metres along the path from the camera; < 0 behind),
//     x (to the side), y], block: { k, h, ahead, x } (a thing lying across the way), face, speed, say, sfx, shake, burst: [dur, seq] }
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

const V = new THREE.Vector3(), V2 = new THREE.Vector3();
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
    this.marks = (R.marks || []).map((m) => ({ ...m, done: false })).sort((a, b) => a.at - b.at);
    this.blocks = []; this.clack = 0;
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
    this.speed += (this.target - this.speed) * Math.min(1, dt * 1.6);
    this.s = Math.min(this.len, this.s + this.speed * dt);
    for (const m of this.marks) if (!m.done && this.s >= m.at) { m.done = true; this.mark(m); }
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
    this.faceK += ((this.face === 'back' ? 1 : 0) - this.faceK) * Math.min(1, dt * 2.6);
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
    // monsters left far behind are gone (the chasers keep up: ahead < 0 on their mark)
    for (const a of g.actors) {
      if (!a.alive || !a.def || a.rideChaser) continue;
      V.subVectors(a.root.position, w.camPos); if (V.dot(tg) < -k.behind) { a.alive = false; a.dispose(); }
    }
    if (this.vehicleG) this.vehicleG.position.y = this.vehicleY + Math.sin(this.s * 2.3) * 0.012;
    if (this.s >= this.len - 0.01) this.end();
  }

  mark(m) {
    if (m.cam && this.girls) this.cam = { ...this.cam, ...m.cam };   // (the girls' own run: the camera goes round them)
    const g = this.g;
    if (m.spawn) for (const e of m.spawn) {
      const ahead = e.ahead ?? 14, P = this.at(this.s + ahead, e.x ?? rnd(-1, 1));
      const a = g.spawnEnemy({ ...e, x: P.x, z: P.z, y: e.y });
      if (ahead < 0) a.rideChaser = true;
    }
    if (m.block) this.block(m.block);
    if (m.face) this.face = m.face;
    if (m.speed != null) this.target = m.speed;
    // the rest of the mark is a director's cue (cues.js: say, sfx, shake, burst, hint, mv, act, cam ...); a line a moment late (not in the
    // very first frame of a stage: the HUD lays itself out first)
    const { at: _a, spawn: _s, block: _b, face: _f, speed: _v, done: _d, ...cue } = m;
    if (cue.say) { const { say, ...rest } = cue; g.cues.run(rest); g.tweens.wait(0.6, () => g.cues.run({ say, who: cue.who, force: true })); } else g.cues.run(cue);
  }
  // a thing lying across the way ahead (a set prop, breakable, a rigid body: src/battle/physics.js): shoot it to bits in time
  block(B) {
    const g = this.g, w = g.world, ahead = B.ahead ?? 24, P = this.at(this.s + ahead, B.x ?? 0), C = this.at(this.s);
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
