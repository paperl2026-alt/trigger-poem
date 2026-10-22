// The honey maggot (episode 1, the end of the tunnel; bosses.json "maggot", beh "worm"; DESIGN 第 1 话; user 2026-10-19: a giant boss that
// is not a person, built in 3D, without broken limbs - R-Type's coiling worms, bigger than the screen): a real 3D body, a head with a
// ring of teeth and a row of segments, each carrying a glowing sac of the house's rotten honey. It never fits in the narrow tunnel: it
// bores in through one wall and out through another, only the stretch between the two holes showing, the rest still inside the earth.
//   - its route: from outside the room (in the end wall, a side wall, the ceiling) through a hole, weaving across the room, out through
//     another hole; the body follows the head's trail (a snake: each segment where the head was so many metres ago)
//   - in the open (the netherworld; user 2026-10-22: it popped up out of nowhere, froze in mid-air and skipped, lunged into their faces,
//     nobody could find where to hit it): it keeps out in front, 11 m and more away, and never stops half-way along a move. Where it will
//     come up the ground shakes and spits dirt first (rumble); then either it crosses - out of the ground, a high arc across the view,
//     down into the ground again - or it rises like a cobra out of a hole, its mouth at them, sways there and spits two big slow globs
//     (shoot them down) or gathers a great gulp of honey (get down) and spews it, then goes back down the way it came
//   - where to hit it is plain: a big glowing sac of honey on every segment, always on the side facing the camera (full damage, they
//     burst); its open mouth while it is up (more); its flesh takes a little of every shot (the bar always moves)
//   - dying: the body falls apart, every segment a body of its own in the physics (src/battle/physics.js), rings of light, a pillar
// Its flesh is drawn by its own toon shader (three bands of light, a warm glow through the skin at its edges, rings and veins) with
// inked outlines (inverted hulls), to sit with the paper drawings. Numbers: bosses.json maggot.
import * as THREE from 'three';
import { sfx, sound } from '../core/audio.js';
import { NOISE_GLSL } from '../core/paper.js';
import { COL } from './fx.js';
import { Mark3D } from './marks3d.js';
import { tr } from '../core/i18n.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const V = new THREE.Vector3(), V2 = new THREE.Vector3(), AD = new THREE.Vector3(), AD2 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion();

const SKIN_VERT = `varying vec3 vN; varying vec3 vV; varying vec3 vW; varying vec3 vL;
void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vV = -mv.xyz;
  vN = normalize(mat3(viewMatrix) * mat3(modelMatrix) * normal); gl_Position = projectionMatrix * mv; }`;
const SKIN_FRAG = `uniform vec3 col; uniform vec3 dark; uniform vec3 glowC; uniform float glow; uniform float flash; uniform float time; uniform float rings;
varying vec3 vN; varying vec3 vV; varying vec3 vW; varying vec3 vL;
${NOISE_GLSL}
void main(){
  vec3 n = normalize(vN), v = normalize(vV), l = normalize(vec3(-0.4, 0.8, 0.5));
  float d = dot(n, l);
  float band = d > 0.45 ? 1.0 : d > -0.05 ? 0.72 : 0.48;                // three bands of light
  float rim = pow(1.0 - max(0.0, dot(n, v)), 2.5);                      // light through the skin at the edges
  float ring = rings > 0.5 ? smoothstep(0.75, 0.95, abs(sin(vL.z * 9.0))) : 0.0;   // the ridges round a segment
  float vein = smoothstep(0.62, 0.7, fbm(vW.xz * 2.2 + vW.y * 1.3 + time * 0.05));
  vec3 c = mix(dark, col, band);
  c = mix(c, dark * 0.6, ring * 0.6 + vein * 0.35);
  c += glowC * (rim * 0.55 + glow);
  c = mix(c, vec3(1.0), flash);
  gl_FragColor = vec4(c, 1.0);
}`;

export class WormBoss {
  constructor(game, def) {
    this.game = game; this.def = def; this.type = 'boss'; this.name = def.name; this.alive = true; this.removed = false;
    this.root = new THREE.Group(); game.world.scene.add(this.root);
    const W = def.worm, n = W.segments;
    this.hp = this.maxHp = W.sacHp * n + W.headHp; this.stage = 1;
    this.hall = game.world.set.hall;
    this.mats = [];
    const skin = (c, d, rings = 1) => { const m = new THREE.ShaderMaterial({ uniforms: { col: { value: new THREE.Color(c) }, dark: { value: new THREE.Color(d) }, glowC: { value: new THREE.Color(0xffb040) },
      glow: { value: 0 }, flash: { value: 0 }, time: { value: 0 }, rings: { value: rings } }, vertexShader: SKIN_VERT, fragmentShader: SKIN_FRAG }); this.mats.push(m); return m; };
    const ink = new THREE.MeshBasicMaterial({ color: 0x1a0c08, side: THREE.BackSide }); this.mats.push(ink);
    const outline = (geo, s = 1.06) => { const o = new THREE.Mesh(geo, ink); o.scale.setScalar(s); return o; };
    this.geos = [new THREE.SphereGeometry(1, 28, 18), new THREE.SphereGeometry(1, 16, 12), new THREE.ConeGeometry(1, 1, 6).rotateX(-Math.PI / 2), new THREE.TorusGeometry(1, 0.22, 10, 28)];
    const [SPH, SAC, TOOTH, LIP] = this.geos;
    // the segments, tapering toward the tail; each with its sac on its back
    this.segs = [];
    for (let i = 0; i < n; i++) {
      const r = W.radius * (1 - 0.45 * i / (n - 1)), g = new THREE.Group();
      // (its flesh dark against the netherworld's bright sweets - user 2026-10-22: it melted into them)
      const body = new THREE.Mesh(SPH, skin(0x7a3a5a, 0x2a0e1e)); body.scale.set(r, r * 0.92, r * 1.15); g.add(body, outline(SPH)); g.children[1].scale.set(r * 1.06, r * 0.98, r * 1.22);
      const sac = new THREE.Mesh(SAC, skin(0xffe066, 0xe0901a, 0)); sac.scale.setScalar(r * (W.sacSize ?? 0.58)); sac.position.set(0, r * 0.78, 0); g.add(sac);
      body.userData.owner = sac.userData.owner = this; body.userData.seg = sac.userData.seg = i; sac.userData.sac = true;
      this.root.add(g);
      this.segs.push({ g, body, sac, r, hp: W.sacHp, live: true, phase: Math.random() * 6 });
    }
    // the head: a blunt end, a lipped mouth ringed with teeth, opening to spit and to strike
    const hr = W.radius * 1.15, head = new THREE.Group();
    const skull = new THREE.Mesh(SPH, skin(0x8a4466, 0x2e1022, 0)); skull.scale.set(hr, hr * 0.95, hr * 1.05); head.add(skull, outline(SPH)); head.children[1].scale.set(hr * 1.06, hr * 1.01, hr * 1.11);
    const lip = new THREE.Mesh(LIP, skin(0xd04a40, 0x5a1010, 0)); lip.position.z = hr * 0.88; lip.scale.setScalar(hr * 0.55); head.add(lip);
    const maw = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: 0x1a0204 })); maw.position.z = hr * 0.86; maw.scale.setScalar(hr * 0.5); head.add(maw); this.mats.push(maw.material); this.geos.push(maw.geometry);
    this.core = new THREE.Mesh(SAC, skin(0xff5a3a, 0x7a1010, 0)); this.core.position.z = hr * 0.93; this.core.scale.setScalar(hr * 0.26); head.add(this.core);   // (in the middle of its mouth, in sight from the front: lit while it is up)
    this.teeth = new THREE.Group(); this.teeth.position.z = hr * 0.9;
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, tth = new THREE.Mesh(TOOTH, skin(0xfff4e0, 0xa89a80, 0)); tth.position.set(Math.cos(a) * hr * 0.5, Math.sin(a) * hr * 0.5, 0.05); tth.scale.set(hr * 0.09, hr * 0.09, hr * 0.32); tth.lookAt(Math.cos(a) * hr * 0.2, Math.sin(a) * hr * 0.2, hr * 0.6); this.teeth.add(tth); }
    head.add(this.teeth);
    skull.userData.owner = lip.userData.owner = this.core.userData.owner = this; this.core.userData.core = true; skull.userData.mouth = lip.userData.mouth = true;
    this.root.add(head); this.head = head; this.hr = hr; this.skull = skull;
    // the trail the body follows; in the open it starts out of sight under the ground (the intro brings it up: intro)
    this.trail = []; this.spacing = W.spacing; this.speed = W.speed; this.t = 0; this.cool = W.attackEvery[1];
    this.bodyLen = this.spacing * (n + 1);
    if (this.hall.left?.length || this.hall.right?.length) { this.state = 'route'; this.newRoute('end'); for (let i = 0; i < 400; i++) this.trail.unshift(this.route.getPointAt(0).clone().addScaledVector(this.outDir, -i * 0.05)); this.u = 0; }
    else { this.state = 'under'; this.wait = 99; this.next = 'rise'; this.sink(this.spot(14, 0)); }
    this.place();
  }
  // a spot on the ground in front of the camera: d metres ahead, l to the side
  spot(d, l) {
    const g = this.game, cam = g.world.camPos, f = V.subVectors(g.world.lookAt, cam).setY(0).normalize(), sx = -f.z, sz = f.x;
    return new THREE.Vector3(cam.x + f.x * d + sx * l, 0, cam.z + f.z * d + sz * l);
  }
  // the whole of it straight down under a spot (out of sight: its next way out starts from there)
  sink(p) {
    this.trail.length = 0;
    for (let d = 0; d <= this.bodyLen + 4; d += 0.1) this.trail.push(new THREE.Vector3(p.x, -6 - d, p.z));
    this.head.position.copy(this.trail[0]);
  }

  // ---- the route: from outside the room through a hole in one surface, weaving across, out through another
  // from: 'end' | 'left' | 'right' | 'ceil'
  newRoute(from) {
    if (!(this.hall.left?.length || this.hall.right?.length)) { this.newBreach(); return; }
    const H = this.hall, g = this.game, cz = g.world.camPos.z, near = cz - 3.5, far = Math.max(H.z1 + 0.6, cz - 11);
    const inside = () => new THREE.Vector3(rnd(H.x0 + 0.6, H.x1 - 0.6), rnd(0.8, Math.min(H.h - 0.7, 3.4)), rnd(far, near));
    const holeAt = (on) => on === 'end' ? new THREE.Vector3(rnd(H.x0 + 0.7, H.x1 - 0.7), rnd(1, H.h - 1.2), H.z1)
      : on === 'ceil' ? new THREE.Vector3(rnd(H.x0 + 0.7, H.x1 - 0.7), H.h, rnd(far, near))
      : new THREE.Vector3(on === 'left' ? H.x0 : H.x1, rnd(0.9, H.h - 1), rnd(far, near));
    const outOf = (on, p) => p.clone().add(on === 'end' ? V.set(0, 0, -3) : on === 'ceil' ? V.set(0, 3, 0) : V.set(on === 'left' ? -3 : 3, 0, 0));
    const exits = ['end', 'left', 'right', 'ceil'].filter((s) => s !== from);
    const to = exits[Math.floor(Math.random() * exits.length)];
    const a = holeAt(from), b = holeAt(to), pts = [outOf(from, a), a];
    for (let k = 0; k < 2 + Math.floor(Math.random() * 2); k++) pts.push(inside());
    pts.push(b, outOf(to, b));
    this.route = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); this.routeLen = this.route.getLength(); this.u = 0;
    this.outDir = V2.subVectors(a, pts[0]).normalize().clone(); this.exitSide = to;
    // the holes it bursts through (a crash, dust) - the far one when it gets there
    this.holes = [{ on: from, p: a, done: false, at: pts[0].distanceTo(a) / this.routeLen }, { on: to, p: b, done: false, at: 1 - b.distanceTo(pts[pts.length - 1]) / this.routeLen }];
  }
  // in the open (no walls: the netherworld) it breaches: up out of the ground somewhere in front of the camera, a high arc through the air,
  // down into another hole (Tremors, R-Type's worms)
  newBreach(a) {
    // (across the view, well out in front, from one side to the other; down at the far hole it goes on straight down until the tail is
    // under too - no part of it left hanging in the air)
    const b = this.spot(rnd(13, 19), -Math.sign(this.sideOf(a) || 1) * rnd(5, 8));
    const mid = a.clone().lerp(b, 0.5), hi = rnd(4.5, 7);
    const pts = [a.clone().setY(-6), a.clone(), a.clone().lerp(mid, 0.5).setY(hi * 0.8), mid.clone().setY(hi), mid.clone().lerp(b, 0.5).setY(hi * 0.8), b.clone(), b.clone().setY(-6), b.clone().setY(-6 - this.bodyLen)];
    this.route = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); this.routeLen = this.route.getLength(); this.u = 0;
    this.outDir = new THREE.Vector3(0, 1, 0); this.exitSide = 'floor';
    const L1 = new THREE.CatmullRomCurve3(pts.slice(0, 7), false, 'centripetal').getLength();
    this.holes = [{ on: 'floor', p: a, done: false, at: 6 / this.routeLen }, { on: 'floor', p: b, done: false, at: (L1 - 6) / this.routeLen }];
  }
  // up out of a hole like a cobra, leaning a little toward them, its mouth at them
  newRise(a) {
    const f = V.subVectors(this.game.world.camPos, a).setY(0).normalize();
    const top = a.clone().addScaledVector(f, 1.1).setY(this.def.worm.riseH ?? 3.4);
    const pts = [a.clone().setY(-6), a.clone().setY(-1), a.clone().addScaledVector(f, 0.4).setY(1.6), top];
    this.route = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); this.routeLen = this.route.getLength(); this.u = 0; this.top = top.clone();
    this.holes = [{ on: 'floor', p: a, done: false, at: 5 / this.routeLen }];
  }
  sideOf(p) { const g = this.game, cam = g.world.camPos, f = V2.subVectors(g.world.lookAt, cam).setY(0).normalize(); return (p.x - cam.x) * -f.z + (p.z - cam.z) * f.x; }
  // where it will come up next: the ground there shakes and spits dirt first (the warning that it is coming, and where)
  rumble(kind, at) {
    const g = this.game;
    const a = at || (kind === 'rise' ? this.spot(rnd(11, 15), rnd(-4.5, 4.5)) : this.spot(rnd(13, 19), (Math.random() < 0.5 ? -1 : 1) * rnd(5, 8)));
    this.sink(a); this.state = 'rumble'; this.wait = this.def.worm.rumble ?? 0.9; this.next = kind; this.at = a;
    g.fx.shockRing(a.clone().setY(0.05), 1.8, 0xc89a60, 0.9); g.post.shake(0.5); sound('rumble', { pos: a.clone() }) || sfx.thud(0);
  }
  // out of sight a moment before the next way up
  goUnder(next) { this.state = 'under'; this.wait = rnd(0.6, 1.2); this.next = next; }
  hole(h) {
    const g = this.game, P = h.p;
    if (g.world.addHole) g.world.addHole(h.on === 'end' ? 'end' : h.on, P.clone(), this.def.worm.radius * 3.2);
    g.fx.confetti(P.clone(), 30, 2.4, [COL.bone, 0x7a5030]); g.vfx.play('breach', P.clone().setY(0.2), { scale: 1.4 });   // (and its hole bursts: panels addHole)
    sound('woodBreak', { pos: P.clone() }) || sfx.slam();
  }

  // ---- every frame
  update(dt, t) {
    if (!this.alive) { return; }
    const g = this.game, W = this.def.worm, half = this.liveSacs() <= this.segs.length / 2;
    for (const m of this.mats) if (m.uniforms) { m.uniforms.time.value = t; m.uniforms.flash.value = Math.max(0, m.uniforms.flash.value - dt * 5); }
    if ((g.lull || !g.combat) && !this.scripted) { this.place(); return; }
    const sp = this.speed * (half ? W.angry : 1);
    if (this.state === 'under') { this.wait -= dt; if (this.wait <= 0) this.rumble(this.next); }
    else if (this.state === 'rumble') {
      this.wait -= dt; if (Math.random() < dt * 14) g.fx.puff(this.at.clone().add(V.set(rnd(-0.8, 0.8), 0.1, rnd(-0.8, 0.8))), 3, 0xc89a60, 0.9);
      if (this.wait <= 0) { this.state = this.next; this.next === 'rise' ? this.newRise(this.at) : this.newBreach(this.at); }
    } else if (this.state === 'cross' || this.state === 'rise') {
      const deep = this.head.position.y < -5.5 && this.u > 0.5;   // (down again: the rest of it slides under quickly)
      this.u = Math.min(1, this.u + sp * (deep ? 2.5 : 1) * dt / this.routeLen);
      for (const h of this.holes) if (!h.done && this.u >= h.at) { h.done = true; this.hole(h); }
      this.route.getPointAt(this.u, this.head.position);
      if (this.u >= 1) { if (this.state === 'cross') this.goUnder('rise'); else { this.state = 'up'; this.upT = 0; this.acts = this.stage > 1 ? 2 : 1; this.cool = 0.7; } }
    } else if (this.state === 'up') {
      // swaying where it stands; it attacks from there, then goes back down the way it came
      this.upT += dt; this.head.position.copy(this.top).add(V.set(Math.sin(t * 1.3) * 0.25, Math.sin(t * 2.1) * 0.12, 0));
      if (!this.busy && !this.scripted) { this.cool -= dt; if (this.cool <= 0) { if (this.acts-- > 0) { Math.random() < 0.5 ? this.spray() : this.spitAt(); } else this.state = 'sink'; } }
    } else if (this.state === 'sink') {
      let d = sp * 0.9 * dt;
      while (d > 0 && this.trail.length > 2) { const L = this.trail[0].distanceTo(this.trail[1]); if (L <= d) { this.trail.shift(); d -= L; } else { this.trail[0].lerp(this.trail[1], d / L); d = 0; } }
      this.head.position.copy(this.trail[0]);
      if (this.head.position.y < -4) { this.sink(this.head.position.clone().setY(0)); this.goUnder('cross'); }
    }
    if (this.state === 'route') {
      this.u = Math.min(1, this.u + sp * dt / this.routeLen);
      for (const h of this.holes) if (!h.done && this.u >= h.at) { h.done = true; this.hole(h); }
      this.route.getPointAt(this.u, this.head.position);
      this.cool -= dt;
      const inRoom = this.holes[0].done && !this.holes[1].done;
      if (inRoom && this.cool <= 0) { this.cool = rnd(...W.attackEvery) * (half ? 0.6 : 1); Math.random() < (half ? 0.6 : 0.45) ? this.rear() : this.spitAt(); }
      if (this.u >= 1) this.newRoute(this.exitSide);
    } else if (this.state === 'strike') {
      // the strike: the head along a line at the camera and back to where it left the route
      const S = this.strike; S.t += dt;
      const k = S.t < S.go ? S.t / S.go : S.t < S.go + S.hold ? 1 : Math.max(0, 1 - (S.t - S.go - S.hold) / S.back);
      this.head.position.lerpVectors(S.from, S.to, k * k * (3 - 2 * k));
      if (!S.hit && S.t >= S.go) { S.hit = true; this.bite(); }
      if (S.t >= S.go + S.hold + S.back) { this.state = 'route'; this.teeth.scale.setScalar(1); }
    } else if (this.state === 'rear' || this.state === 'spit') this.head.position.y += Math.sin(t * 9) * 0.004;
    // the trail (not while it sways where it stands, nor going back down its own way)
    if (this.state !== 'up' && this.state !== 'sink' && this.state !== 'under' && this.state !== 'rumble') { this.trail.unshift(this.head.position.clone()); if (this.trail.length > 900) this.trail.length = 900; }
    this.place();
    // sacs pulse with the rot inside; the core glows once it is all that is left
    for (const s of this.segs) if (s.live) s.sac.material.uniforms.glow.value = 0.75 + 0.3 * Math.sin(t * 3 + s.phase);   // (lit: what to shoot)
    this.core.material.uniforms.glow.value = this.state === 'up' ? 0.7 + 0.3 * Math.sin(t * 6) : half ? 0.5 + 0.4 * Math.sin(t * 6) : 0.1;   // (its mouth lit while it is up: hit it there)
    if (this.lock) { const c = g.world.project(this.head.position), b = this.screenBox(); this.lock.set(c.x, g.H - c.y, Math.max(60, (b.y1 - b.y0) * 0.3), Math.min(1, this.rearT / W.rear), t, W.rear - this.rearT, b, this.head.position); this.rearT += dt;
      this.mark3?.set(this.head.position, this.hr * 1.3, Math.min(1, this.rearT / W.rear), t, [g.fx.victimAt(0, new THREE.Vector3()), g.fx.victimAt(1, new THREE.Vector3())], g.fx.res(), dt); }
  }
  // the body: each segment on the trail so many metres behind the head, facing along it
  place() {
    let i = 0, acc = 0, want = this.spacing;
    const tr = this.trail;
    this.head.lookAt(V.copy(this.head.position).add(this.aimDir()));
    for (let k = 1; k < tr.length && i < this.segs.length; k++) {
      acc += tr[k].distanceTo(tr[k - 1]);
      if (acc >= want) {
        const s = this.segs[i];
        s.g.position.copy(tr[k]);
        V2.subVectors(tr[Math.max(0, k - 2)], tr[Math.min(tr.length - 1, k + 2)]);
        if (V2.lengthSq() > 1e-6) { M4.lookAt(V.set(0, 0, 0), V2, UP); s.g.quaternion.setFromRotationMatrix(M4); s.g.rotateY(Math.PI); }
        i++; want += this.spacing;
      }
    }
    for (; i < this.segs.length; i++) this.segs[i].g.position.copy(tr[tr.length - 1]);
    // every sac on the side of its segment that faces the camera (they are what to shoot: always in sight)
    const cam = this.game.world.camPos;
    for (const s of this.segs) {
      if (!s.live) continue;
      V.subVectors(cam, s.g.position).applyQuaternion(Q4.copy(s.g.quaternion).invert()); V.z = 0;
      if (V.lengthSq() < 1e-6) V.set(0, 1, 0);
      s.sac.position.copy(V.normalize()).multiplyScalar(s.r * 0.9);
    }
  }
  // which way the head points: along its way, or at the camera while it rears, spits, strikes
  aimDir() {
    if (this.state === 'up' || this.state === 'sink' || this.state === 'strike' || this.state === 'rear' || this.state === 'spit') return AD.subVectors(this.game.world.camPos, this.head.position).normalize();   // (going back down it still faces them)
    if (this.state !== 'route' && this.state !== 'cross' && this.state !== 'rise') return AD.set(0, 1, 0);
    const u = Math.min(0.999, this.u + 0.01); return AD.subVectors(this.route.getPointAt(u, AD2), this.head.position).normalize();
  }
  liveSacs() { return this.segs.filter((s) => s.live).length; }

  // ---- attacks
  // rearing: it stops and draws back, its mouth opening; a "get down" ring on it (fx.lock hide); then it strikes
  rear() {
    const g = this.game, W = this.def.worm;
    this.state = 'rear'; this.rearT = 0;
    this.lock = g.fx.lock('hide', -1, { quiet: true }); this.mark3?.remove(); this.mark3 = new Mark3D(g.world.scene, 'bossHide');   // (its own 3D warning: marks3d.js)
    sound('dollScreech', { pos: this.head.position.clone() }) || sfx.roar();
    g.tweens.to(this.teeth.scale, { x: 1.6, y: 1.6, z: 1 }, W.rear * 0.8);
    g.etw.wait(W.rear, () => {
      if (!this.alive) return;
      this.lock?.remove(); this.lock = null; this.mark3?.remove(); this.mark3 = null;
      const from = this.head.position.clone(), cam = g.world.camPos, to = V.copy(cam).add(V2.subVectors(from, cam).setY(0).normalize().multiplyScalar(2.2)).setY(cam.y + 0.1).clone();
      this.strike = { from, to, t: 0, go: 0.28, hold: 0.25, back: 0.6, hit: false };
      this.state = 'strike'; sfx.whoosh(0);
    });
  }
  bite() {
    const g = this.game;
    g.post.shake(1.6); sfx.slam(); g.fx.confetti(this.head.position.clone(), 20, 1.8, [0xffc060, COL.bone]);
    for (const p of g.players) if (p.state !== 'away' && (p.slot === 0 || g.p2on())) g.playerAttacked({ kind: 'heavy', heavy: true, dmg: this.def.worm.biteDmg, from: this, slot: p.slot });
  }
  // spitting (from where it stands up): its mouth opens, big slow globs of honey, one at each girl in turn (shoot them down)
  spitAt() {
    const g = this.game, W = this.def.worm;
    this.busy = true;
    g.tweens.to(this.teeth.scale, { x: 1.5, y: 1.5, z: 1 }, 0.4);
    for (let k = 0; k < W.spits; k++) g.etw.wait(0.6 + k * 0.7, () => { if (!this.alive || this.state !== 'up') return; sfx.throwIt?.(0);
      g.spawnProjectile(W.glob, this.head.position.clone().addScaledVector(this.aimDir(), this.hr), { size: W.globSize ?? 0.8, time: W.globTime ?? 2.1, slot: g.p2on() ? k % 2 : 0 }); });
    g.etw.wait(0.9 + W.spits * 0.7, () => { this.busy = false; this.cool = 1.0; g.tweens.to(this.teeth.scale, { x: 1, y: 1, z: 1 }, 0.3); });
  }
  // its great gulp (from where it stands up): it rears back with its mouth wide (get down - its own 3D warning), then spews a flood of
  // honey at them; hidden, they are safe
  spray() {
    const g = this.game, W = this.def.worm;
    this.busy = true; this.rearT = 0;
    this.lock = g.fx.lock('hide', -1, { quiet: true }); this.mark3?.remove(); this.mark3 = new Mark3D(g.world.scene, 'bossHide');
    sound('dollScreech', { pos: this.head.position.clone() }) || sfx.roar();
    g.tweens.to(this.teeth.scale, { x: 1.7, y: 1.7, z: 1 }, W.rear * 0.8);
    g.etw.wait(W.rear, () => {
      this.lock?.remove(); this.lock = null; this.mark3?.remove(); this.mark3 = null;
      if (!this.alive || this.state !== 'up') { this.busy = false; return; }
      const cam = g.world.camera, to = cam.position.clone().add(cam.getWorldDirection(new THREE.Vector3()).multiplyScalar(1.1)).add(V.set(0, -0.35, 0));
      const from = this.head.position.clone().addScaledVector(this.aimDir(), this.hr), h = g.vfx.play('honeySpray', from, { to });
      g.post.shake(1.2); sfx.slam();
      g.etw.wait(Math.max(0.05, (h.arrive || 0) * 0.8), () => { if (g.combat) g.playerAttacked({ kind: 'ranged', dmg: W.sprayDmg ?? 24, from: this, heavy: true, slot: -1 }); });
      g.etw.wait(1.0, () => { this.busy = false; this.cool = 1.0; g.tweens.to(this.teeth.scale, { x: 1, y: 1, z: 1 }, 0.4); });
    });
  }

  // ---- hits: only the sacs (and, with every sac gone, the core in its mouth); the flesh shrugs them off
  hitMeshes() {
    if (!this.alive) return [];
    const out = [this.skull, this.core];
    for (const s of this.segs) { out.push(s.body); if (s.live) out.push(s.sac); }
    return out;
  }
  hit(info) {
    if (!this.alive) return;
    const g = this.game, part = info.part, W = this.def.worm, at = part ? part.getWorldPosition(new THREE.Vector3()) : this.head.position.clone();
    this.lastHitBy = info.by;
    const seg = part?.userData.seg != null ? this.segs[part.userData.seg] : null;
    let dmg = 0;
    if (part?.userData.sac && seg?.live) {   // a sac: full, and it bursts
      dmg = Math.min(seg.hp, info.dmg); seg.hp -= dmg; part.material.uniforms.flash.value = 0.9;
      g.fx.star(at, 0.8, COL.gold); g.fx.confetti(at, 4, 0.9, [0xffd070, 0xffa030]);
      if (seg.hp <= 0) this.burst(seg);
    } else if ((part?.userData.core || part?.userData.mouth) && (this.state === 'up' || this.liveSacs() === 0)) {   // its open mouth while it is up
      dmg = info.dmg * (W.mouthMul ?? 1.5); this.core.material.uniforms.flash.value = 1; this.skull.material.uniforms.flash.value = 0.5; g.fx.star(at, 1.2, COL.hot);
    } else {   // its flesh: a little of every shot gets through (the bar always moves); now and then a girl says to shoot the sacs
      dmg = info.dmg * (W.fleshMul ?? 0.3); g.fx.star(at, 0.4, COL.white); if (part?.material?.uniforms) part.material.uniforms.flash.value = 0.25;
      if (performance.now() - (this.armorSaid || 0) > 12000) { this.armorSaid = performance.now(); g.hud.gl.stickers.say(info.by || g.players[0], 'armor', 1); }
    }
    info.dealt = dmg; this.hp = Math.max(0, this.hp - dmg);
    g.onHit(this, info.kind, info);
    if (this.hp <= 0) this.die();
  }
  // a sac bursts: honey everywhere, the segment goes dark and limp
  burst(seg) {
    const g = this.game, at = seg.sac.getWorldPosition(new THREE.Vector3());
    seg.live = false; seg.sac.visible = false;
    const u = seg.body.material.uniforms; u.col.value.set(0x4a2a34); u.dark.value.set(0x1a0a10);
    g.fx.confetti(at, 26, 2.2, [0xffc040, 0xffe090, 0xa06020]); g.fx.ink(at, 10, 1.4, 0xd08a20); g.fx.shockRing(at, 1.6, 0xffc060, 0.45);
    g.post.shake(0.7); sound('splash', { pos: at }) || sfx.shatter(0); g.G.stop(0.06);
    g.world.phys?.chipsAt(at, V.set(0, 1, 0), 6, [0xffc040, 0xe0a030, 0x8a5020], 0.8);
    if (this.liveSacs() === Math.floor(this.segs.length / 2)) { this.stage = 2; sfx.roar(); g.post.styleBurst(1.2, [1, 3, 5], 0.14, 0x1e0a00, 0xffb040); }
    if (this.liveSacs() === 0) this.core.material.uniforms.flash.value = 1;
  }

  // ---- the end: it comes apart, every segment falling as a body of its own
  die() {
    const g = this.game; this.alive = false; this.lock?.remove(); this.lock = null; this.mark3?.remove(); this.mark3 = null;
    g.cues.run(this.def.cues?.die);   // (bosses.json cues.die)
    sfx.roar(); g.post.flash(1, 0xffffff); g.post.shake(2); g.post.styleBurst(1.0, [6, 1, 5, 2], 0.16, 0x200a00, 0xffe0a0);
    const ph = this.phys = g.world.phys, P = this.head.position.clone();
    for (let i = 0; i < 4; i++) g.tweens.wait(i * 0.3, () => g.fx.shockRing(P, 3 + i * 2.5, i % 2 ? 0xffc060 : 0xffffff, 0.8));
    g.fx.pillar(P, 8, this.hr * 0.8, 0xffe0b0, 1.6);
    if (ph) {
      for (const s of [...this.segs.map((x) => ({ g: x.g, r: x.r })), { g: this.head, r: this.hr }]) {
        s.g.updateMatrixWorld(true);
        const b = ph.add(s.g, s.r * 1.6, s.r * 1.6, s.r * 1.8, { pivot: 'center', density: 120 });
        ph.knock(b, s.g.position.clone().add(V.set(rnd(-0.3, 0.3), 0.3, 0)), g.world.camPos, rnd(1.5, 4), 0.8);
        (this.bodies || (this.bodies = [])).push(b);
      }
    }
    for (let i = 0; i < 12; i++) g.tweens.wait(i * 0.15, () => { const s = this.segs[Math.floor(Math.random() * this.segs.length)]; g.fx.confetti(s.g.position.clone(), 18, 2, [0xffc040, COL.bone]); sfx.shatter(rnd(-0.4, 0.4)); });
    g.tweens.wait(5, () => g.tweens.run(1, (e) => { for (const m of this.mats) if (m.uniforms) m.uniforms.flash.value = e * 0.3; this.root.scale.setScalar(1 - e * 0.02); }, { onDone: () => this.dispose() }));
    g.onBossDead(this);
  }
  dispose() {
    if (this.removed) return;
    this.removed = true; this.lock?.remove(); this.mark3?.remove();
    for (const b of this.bodies || []) this.phys?.remove(b);   // (the physics of the place it died in, not of wherever the game is now)
    this.root.parent?.remove(this.root);
    for (const m of this.mats) m.dispose(); for (const geo of this.geos) geo.dispose();
  }

  // ---- what the rest of the game asks of a boss
  intro(then) {
    const g = this.game, C = this.def.closeup;
    g.cues.run(this.def.cues?.intro);   // (bosses.json cues.intro)
    if (this.state === 'route') { g.cine({ on: { uvToWorld: () => this.head.position }, dist: 3.6, up: -0.6, in: 0.9, hold: 3.2, out: 0.8, lull: true, orbit: 0.7, dolly: 16, title: this.title() }, then); sfx.roar(); g.post.shake(1.2); return; }
    // (user 2026-10-22: the old close look went under the floor after it - it was still underground): it comes up out of the ground in
    // front of them, roars, and its picture is shown up close (bosses.json closeup: a comic page, Game.vignette); then the fight and a
    // word on where to hit it
    this.scripted = true; this.rumble('rise', this.spot(14, 0));
    const wait = () => {
      if (this.state !== 'up') { g.tweens.wait(0.1, wait); return; }
      sfx.roar(); g.post.shake(1.2);
      g.tweens.wait(0.6, () => g.vignette({ k: C?.k, title: this.name, sub: C?.sub, color: C?.color, dur: C?.hold ?? 2.2 }, () => {
        this.scripted = false; this.cool = 1.2; then?.(); if (C?.hint) g.tweens.wait(0.4, () => g.hint(C.hint));
      }));
    };
    wait();
  }
  title() { return tr(this.name || '') || null; }
  uvToWorld() { return this.head.position; }
  center() { return this.head.position.clone(); }
  distToCam() { return this.head.position.distanceTo(this.game.world.camPos); }
  // the part a beam sweeping past (sx, sy on the screen, y down) within r px catches: a sac still there, or the core once they are gone
  partAt(sx, sy, r) {
    const g = this.game; let best = null, bd = r;
    const parts = this.liveSacs() ? this.segs.filter((s) => s.live).map((s) => s.sac) : [this.core];
    for (const m of parts) { const s = g.world.project(m.getWorldPosition(V)); if (s.z > 1) continue; const d = Math.hypot(s.x - sx, s.y - sy); if (d < bd) { bd = d; best = m; } }
    return best;
  }
  // the AI partner aims at its open mouth while it is up, else at the nearest sac in sight (none left: the mouth)
  aimAt() {
    const g = this.game;
    if (this.state === 'up') { const s = g.world.project(this.core.getWorldPosition(V)); return { x: s.x, y: s.y }; }
    let best = null, bd = Infinity;
    for (const q of this.segs) {
      if (!q.live) continue; const p = q.sac.getWorldPosition(V), s = g.world.project(p);
      if (s.z > 1 || s.x < 0 || s.x > g.W || s.y < 0 || s.y > g.H || p.y < 0.2) continue;
      const d = p.distanceTo(g.world.camPos); if (d < bd) { bd = d; best = { x: s.x, y: s.y }; }
    }
    if (best) return best;
    const s = g.world.project(this.core.getWorldPosition(V)); return { x: s.x, y: s.y };
  }
  screenBox() {
    const g = this.game; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const o of [this.head, ...this.segs.map((s) => s.g)]) { const s = g.world.project(o.position); if (s.z > 1) continue; x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y); }
    if (x0 === Infinity) { const s = g.world.project(this.head.position); return { x0: s.x - 1, x1: s.x + 1, y0: s.y - 1, y1: s.y + 1 }; }
    return { x0: x0 - 30, x1: x1 + 30, y0: y0 - 30, y1: y1 + 30 };
  }
}
