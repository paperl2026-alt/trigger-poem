// Rigid bodies (docs/TECH.md「物理」; user 2026-10-20: the whole game physical, not one demo): Rapier (@dimforge/rapier3d-compat: the
// WebAssembly inlined, loaded once at start-up, loadPhysics). One Physics per place (PanelWorld): the floor and its walls are fixed;
//  - the set's props, covers, hanging banners and the mechanisms that fall are bodies;
//  - every monster alive is a kinematic body that walks where it walks (it shoves what is in its way, what flies bounces off it);
//  - a monster killed, a thrown thing shot down, becomes a dynamic body knocked away by that shot: it tumbles, hits walls, props,
//    covers and other monsters, bounces and lies still; a crit breaks it into pieces that do the same; splinters and chips of wall too;
//  - things hitting each other hard enough make a sound there, louder the harder (contact force events).
// A body's origin is its object's pivot (the bottom middle of a standing drawing, or its middle), its box collider placed above / round
// it, so the object simply copies the body's place and turn every frame. Drawings never turn about the vertical (they would show their
// paper edge to the camera). Numbers: tuning/combat.json prop.phys. Time: the game's (a hit-stop slows the things too).
import * as THREE from 'three';
import { T } from '../core/content.js';
import { sound } from '../core/audio.js';

let R = null, loading = null;
export function loadPhysics() {
  return loading || (loading = import('@dimforge/rapier3d-compat').then(async (m) => { await m.init(); R = m; return m; }).catch((e) => { console.warn('physics', e); }));
}
export const physicsReady = () => !!R;

const V = new THREE.Vector3(), V2 = new THREE.Vector3(), Q = new THREE.Quaternion();
const vec = (v) => ({ x: v.x, y: v.y, z: v.z });
const rnd = (a, b) => a + Math.random() * (b - a);

export class Physics {
  // hall: the place's room (sets hall: x0 x1 z0 z1 h, left / right walls or not); root: where pieces and splinters are drawn
  constructor(hall, root) {
    this.P = T.combat.prop.phys;
    this.world = new R.World({ x: 0, y: -9.81, z: 0 });
    this.events = new R.EventQueue(true);
    this.root = root; this.things = []; this.chips = []; this.kin = new Map(); this.acc = 0; this.byCollider = new Map(); this.soundAt = 0;
    this.mine = new WeakSet();   // (the bodies made here: a body is only ever taken out of the world it was made in)
    const fixed = (hx, hy, hz, x, y, z) => this.world.createCollider(R.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z).setFriction(0.9).setRestitution(0.2));
    const H = hall || {}, x0 = H.x0 ?? -20, x1 = H.x1 ?? 20, z0 = H.z0 ?? 20, z1 = H.z1 ?? -40, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hw = (x1 - x0) / 2 + 4, hd = (z0 - z1) / 2 + 4;
    fixed(hw, 0.5, hd, cx, -0.5, cz);   // the floor
    // the walls the place has (an open yard has none at its sides: things roll off and fade), and a ceiling over a room
    if (H.left) fixed(0.5, 4, hd, x0 - 0.5, 4, cz);
    if (H.right) fixed(0.5, 4, hd, x1 + 0.5, 4, cz);
    if (H.z1 != null) fixed(hw, 4, 0.5, cx, 4, z1 - 0.5);
    if (H.ceil && H.h) fixed(hw, 0.5, hd, cx, H.h + 0.5, cz);
  }

  // ---- making bodies
  // obj (an Object3D whose position is its pivot) as a box w x h x d; o: { pivot: 'bottom' | 'center', type: 'dynamic' | 'fixed' |
  // 'kinematic', density, spin: false (no tumbling: it falls straight), sound: false (its hits make no sound), owner }
  add(obj, w, h, d, o = {}) {
    const P = this.P, q = obj.quaternion, type = o.type || 'dynamic';
    const desc = type === 'fixed' ? R.RigidBodyDesc.fixed() : type === 'kinematic' ? R.RigidBodyDesc.kinematicPositionBased() : R.RigidBodyDesc.dynamic();
    desc.setTranslation(obj.position.x, obj.position.y, obj.position.z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
      .setLinearDamping(P.damping).setAngularDamping(P.damping * 2).setCcdEnabled(type === 'dynamic');
    if (o.spin === false) desc.lockRotations(); else desc.enabledRotations(true, false, true);
    const body = this.world.createRigidBody(desc); this.mine.add(body);
    const dens = o.density ?? P.density;
    const cd = R.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setTranslation(0, o.pivot === 'center' ? 0 : h / 2, 0)
      .setDensity(dens).setFriction(P.friction).setRestitution(o.restitution ?? P.restitution);
    if (o.sound !== false && type === 'dynamic') cd.setActiveEvents(R.ActiveEvents.CONTACT_FORCE_EVENTS).setContactForceEventThreshold(P.soundForce * w * h * d * dens);
    const col = this.world.createCollider(cd, body);
    const t = { body, obj, type, w, h, d, big: w * h > 0.25, owner: o.owner };
    this.byCollider.set(col.handle, t);
    if (type !== 'fixed') this.things.push(t);
    return body;
  }
  // a kinematic body that goes where its object goes (a monster walking: what is in its way is shoved, what flies bounces off it)
  follow(obj, w, h, pivot = 'bottom') {
    if (this.kin.has(obj)) return;
    const body = this.add(obj, w, h, Math.max(0.2, w * 0.4), { type: 'kinematic', pivot, sound: false, spin: false });
    this.kin.set(obj, body);
  }
  unfollow(obj) { const b = this.kin?.get(obj); if (b) { this.kin.delete(obj); this.remove(b); } }
  remove(body) {
    if (!this.world || !this.mine.has(body)) return;   // (the place is gone already, or the body is another place's: a stale handle there could be anyone)
    this.mine.delete(body);
    const i = this.things.findIndex((t) => t.body === body);
    if (i >= 0) this.things.splice(i, 1);
    for (let k = 0; k < body.numColliders(); k++) this.byCollider.delete(body.collider(k).handle);
    this.world.removeRigidBody(body);
  }
  // a push at a world point (dir: a direction), k: how hard, as metres a second it would give the whole thing
  push(body, at, dir, k) {
    const m = body.mass();
    body.applyImpulseAtPoint(vec(V.copy(dir).multiplyScalar(m * k)), vec(at), true);
  }
  // knocked away by a shot: the shot's line (from the shooter through where it hit, level) and up, at the point it was hit (so it spins)
  knock(body, at, from, k, up) {
    V2.copy(at).sub(from).setY(0).normalize(); V2.y = up;
    this.push(body, at, V2, k);
    const m = body.mass();
    body.applyTorqueImpulse({ x: rnd(-1, 1) * m * 0.3 * k, y: 0, z: rnd(-1, 1) * m * 0.5 * k }, true);
  }

  // ---- pieces: a drawing broken into a grid of its own pieces, each a body flying from where it was hit (a crit)
  // src: the drawing's mesh (a paper material: its map / damage / light), w x h its size, pivot; uv: where it was hit; from: the shooter;
  // keep(u, v): is there anything drawn at this point of the picture (empty pieces are skipped)
  shatter(src, w, h, pivot, uv, from, k, keep) {
    const P = this.P, cols = Math.max(3, Math.min(6, Math.round(w / 0.25))), rows = Math.max(3, Math.min(7, Math.round(h / 0.25)));
    const pw = w / cols, ph = h / rows;
    src.updateMatrixWorld(true);
    const hit = src.localToWorld(V.set((uv.u - 0.5) * w, pivot === 'center' ? (uv.v - 0.5) * h : uv.v * h, 0)).clone();
    const dir = hit.clone().sub(from).setY(0).normalize(), q = src.getWorldQuaternion(new THREE.Quaternion());
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const u0 = i / cols, v0 = j / rows, uc = u0 + 0.5 / cols, vc = v0 + 0.5 / rows;
      if (keep && !keep(uc, vc)) continue;
      if (this.chips.length >= P.chipMax) this.dropChip(this.chips[0]);
      const geo = new THREE.PlaneGeometry(pw, ph), uvA = geo.attributes.uv;
      for (let n = 0; n < uvA.count; n++) uvA.setXY(n, u0 + uvA.getX(n) / cols, v0 + uvA.getY(n) / rows);
      // (a clone copies its textures too: point every one back at the original, or each piece uploads them all to the card again)
      const mat = src.material.clone(), U = mat.uniforms, S = src.material.uniforms;
      for (const key in U) if (S[key]?.value?.isTexture) U[key].value = S[key].value;
      if (U.lit) U.lit.value.copy(S.lit.value);
      if (U.reliefOn) U.reliefOn.value = 0;
      if (U.outlineOn) U.outlineOn.value = 0;
      if (U.flash) U.flash.value = 0.8;
      if (U.softOn) U.softOn.value = 0;
      mat.depthWrite = false;
      const mesh = new THREE.Mesh(geo, mat);
      src.localToWorld(mesh.position.set((uc - 0.5) * w, pivot === 'center' ? (vc - 0.5) * h : vc * h, 0));
      mesh.quaternion.copy(q); mesh.renderOrder = 4; this.root.add(mesh);
      const body = this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
        .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }).enabledRotations(true, false, true).setCcdEnabled(true));
      this.world.createCollider(R.ColliderDesc.cuboid(pw / 2, ph / 2, 0.02).setDensity(250).setFriction(0.6).setRestitution(0.35), body);
      // away from the hit point and along the shot
      V2.copy(mesh.position).sub(hit); const dd = V2.length() || 1; V2.divideScalar(dd);
      const sp = k * (0.5 + 0.6 / (0.4 + dd));
      body.setLinvel({ x: V2.x * sp * 0.8 + dir.x * sp, y: V2.y * sp * 0.6 + rnd(1, 2.5), z: V2.z * sp * 0.8 + dir.z * sp }, true);
      body.setAngvel({ x: rnd(-8, 8), y: 0, z: rnd(-12, 12) }, true);
      this.chips.push({ body, mesh, t: P.pieceLife * rnd(0.8, 1.2), own: true });
    }
  }
  // splinters / chips flying from a point: n little boxes in the colours given (one picked for each), bouncing about, gone after a while
  chipsAt(at, dir, n, colors, size = 1) {
    const P = this.P;
    for (let i = 0; i < n; i++) {
      if (this.chips.length >= P.chipMax) this.dropChip(this.chips[0]);
      const s = (0.04 + Math.random() * 0.09) * size, l = s * (1.5 + Math.random() * 2);
      const body = this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(at.x + (Math.random() - 0.5) * 0.3 * size, at.y + (Math.random() - 0.5) * 0.3 * size, at.z)
        .setAngvel({ x: (Math.random() - 0.5) * 30, y: (Math.random() - 0.5) * 30, z: (Math.random() - 0.5) * 30 }).setCcdEnabled(true));
      this.world.createCollider(R.ColliderDesc.cuboid(l / 2, s / 4, s / 2).setDensity(200).setFriction(0.6).setRestitution(0.45), body);
      const sp = (2 + Math.random() * 3.5) * Math.min(1.5, size);
      body.setLinvel({ x: dir.x * sp + (Math.random() - 0.5) * 3, y: 2 + Math.random() * 3, z: dir.z * sp + (Math.random() - 0.5) * 3 }, true);
      const mesh = new THREE.Mesh(this.chipGeo || (this.chipGeo = new THREE.BoxGeometry(1, 1, 1)), new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)], transparent: true, fog: false }));
      mesh.scale.set(l, s / 2, s); mesh.renderOrder = 4; this.root.add(mesh);
      this.chips.push({ body, mesh, t: P.chipLife * (0.7 + Math.random() * 0.6) });
    }
  }
  dropChip(c) {
    this.world.removeRigidBody(c.body); this.root.remove(c.mesh); c.mesh.material.dispose();
    if (c.own) c.mesh.geometry.dispose();
    this.chips.splice(this.chips.indexOf(c), 1);
  }

  // ---- a hanging thing on a pivot (a banner, a lantern): it swings when it is shot or hit; anchor: the world point it hangs from
  hang(obj, w, h, d, anchor) {
    const body = this.add(obj, w, h, d, { pivot: 'center', density: 120, sound: false });
    body.setAngularDamping(0.5); body.setLinearDamping(0.4);
    const fixedB = this.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(anchor.x, anchor.y, anchor.z));
    const loc = V.copy(anchor).sub(obj.position).applyQuaternion(Q.copy(obj.quaternion).invert());
    const joint = this.world.createImpulseJoint(R.JointData.spherical({ x: 0, y: 0, z: 0 }, vec(loc)), fixedB, body, true);
    return { body, joint };
  }
  unhang(h) { if (h.joint) { this.world.removeImpulseJoint(h.joint, true); h.joint = null; } }

  // ---- every frame: fixed steps of 1/60 s; the kinematic bodies go to where their objects are first
  step(dt) {
    this.acc = Math.min(this.acc + dt, 0.1);
    for (const [obj, b] of this.kin) { const p = obj.position; b.setNextKinematicTranslation({ x: p.x, y: p.y, z: p.z }); }
    let n = 0;
    while (this.acc >= 1 / 60 && n < 4) { this.world.timestep = 1 / 60; this.world.step(this.events); this.acc -= 1 / 60; n++; }
    // hard hits: a sound where it happened (not too many at once)
    this.events.drainContactForceEvents((e) => {
      const now = performance.now();
      if (now - this.soundAt < 70) return;
      const a = this.byCollider.get(e.collider1()), b = this.byCollider.get(e.collider2()), t = a && a.type === 'dynamic' ? a : b;
      if (!t || t.type !== 'dynamic') return;
      this.soundAt = now;
      const p = t.body.translation(), f = e.totalForceMagnitude() / Math.max(1, t.body.mass() * 60);
      sound(t.big ? 'thud' : 'shell', { pos: new THREE.Vector3(p.x, p.y, p.z), vol: Math.min(1, 0.25 + f * 0.2) });
    });
    for (const t of this.things) {
      if (t.type !== 'dynamic' || !t.body.isEnabled()) continue;
      const p = t.body.translation(), r = t.body.rotation();
      t.obj.position.set(p.x, p.y, p.z); t.obj.quaternion.set(r.x, r.y, r.z, r.w);
    }
    for (let i = this.chips.length - 1; i >= 0; i--) {
      const c = this.chips[i], p = c.body.translation(), r = c.body.rotation();
      c.mesh.position.set(p.x, p.y, p.z); c.mesh.quaternion.set(r.x, r.y, r.z, r.w);
      c.t -= dt;
      if (c.t < 0.5) { const u = c.mesh.material.uniforms; if (u?.opacity) u.opacity.value = Math.max(0, c.t / 0.5); else c.mesh.material.opacity = Math.max(0, c.t / 0.5); }
      if (c.t <= 0) this.dropChip(c);
    }
  }
  dispose() {
    for (const c of [...this.chips]) this.dropChip(c);
    this.chipGeo?.dispose();
    this.events.free();
    this.world.free(); this.world = null; this.kin.clear();
  }
}
