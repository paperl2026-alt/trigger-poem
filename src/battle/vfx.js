// The effects of things breaking and of the monsters' power (docs/DESIGN.md「场景破坏和怪物特效」; user 2026-10-20: walls burst through,
// floors broken, the monsters' fire, smoke and magic - "the effects feel missing"; after Unreal's destruction: the flash, chunks tumbling
// away, dust rising and slowly spreading, sparks and embers). Every effect is a preset in tuning/vfx.json, played by name where things
// happen (a wall's hole, the floor giving way, a blast, a thrown thing's trail; a level or a monster's data can name its own), made of
// parts, all of them in the world (depth, distance, hidden behind things):
//   flash   a burst of light where it happens (additive glow) { color, size, life }
//   debris  chunks of what broke, real rigid bodies (physics.js chipsAt), falling and bouncing { n, size, colors, k }
//   dust    a cloud that rises and spreads slowly, its puffs growing and fading { n, size: [a, b], grow, life: [a, b], color, rise, spread }
//   sparks  hot streaks flung out along the blow, falling { n, speed, color, life }
//   embers  glowing bits drifting up, swaying { n, color, life, rise }
//   fire    tongues of flame licking up { n, size, life, color }
//   ring    a ring of light racing out over the floor (fx.shockRing) { r, color, s }
//   shake / flash2d (the screen) / sound
// and the monsters' big attacks (DESIGN「场景破坏和怪物特效」: fire, smoke and magic with body, not a picture):
//   stream  a breath / spray / bolt pouring out of it at the girls (o.to), its puffs growing on the way, poured over time seconds
//           { kind fire / smoke / foam / glow, n, time, speed, size: [a, b], grow, colors, spread (how wide at the girls' end), a }
//   veil    what is left hanging in front of the camera when it gets there, thinning slowly (smoke, foam)
//           { n, color, size: [a, b], life: [a, b], a, dist: [a, b] metres ahead }
//   circle  a magic circle drawn in the air in front of it while it gathers (o.life: its wind-up), turning faster and faster; it flares
//           when the attack goes off, fizzles when it is cut short { r, color, spin }
//   beam    a blast of light with body from it toward the girls (o.to; research: R-Type's charged blast - a column of light, rings of
//           light racing along it, glowing at both ends): it shoots out, holds, thins away { r, color, core, rings, time, speed, short }
//   cone    a cone of fire with body from its mouth toward the girls (the research's flame cone), licking forward { r0, r1, color, core,
//           time, short }. Both are real volumes (VOL_FRAG marches through them), so they read from the side and head-on alike, and stop
//           `short` metres before the girls (the stream's particles do the last stretch), aimed `aside` metres past the lens toward the girl
//           on the far side of the frame (head-on it would be a haze). Only the monsters' and bosses' blows use them -
//           never the girls' own weapons
// play(name, at, { n: the way it faces (a wall's normal, a blow's direction), scale, color, to, life }) -> { arrive (s: when a stream gets
// to the girls), stop(flare) }; trail(name, at, dt, { dir }) for things that move (a thrown thing's fire or smoke); update(dt) every frame.
import * as THREE from 'three';
import { T, hexNum } from '../core/content.js';
import { FR } from '../core/particles.js';
import { sound, sfx } from '../core/audio.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const rr = (v, d) => (Array.isArray(v) ? rnd(v[0], v[1]) : v ?? d);
const C3 = new THREE.Color(), UP = new THREE.Vector3(0, 1, 0), D = new THREE.Vector3(), Q = new THREE.Vector3();
const rgb = (hex) => { C3.set(hexNum(hex)); return [C3.r, C3.g, C3.b]; };
const F2 = new THREE.Vector3(), R2 = new THREE.Vector3(), U2 = new THREE.Vector3();

// a beam / cone of light with body (VFX.vol), in the cylinder's own space (y 0 at its foot .. 1 at its far end, its radius r0 .. r1): from
// where the camera's ray enters its box to the back face, 12 steps, light gathered where it passes - thick in the middle, white in the core,
// noise streaming along it, rings of light racing out along a beam; a fire cone licks forward, white-hot near the mouth
const VOL_VERT = `varying vec3 vL; varying vec3 vW;
void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const VOL_FRAG = `uniform float time, a, rings, fire, speed, len, r0, r1; uniform vec3 c1, c2, camL; varying vec3 vL; varying vec3 vW;
float h1(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
void main(){
  vec3 d = vL - camL; float rm = max(r0, r1);
  vec3 lo = (vec3(-rm, 0.0, -rm) - camL) / d, hi = (vec3(rm, 1.0, rm) - camL) / d;
  vec3 tn = min(lo, hi); float t0 = clamp(max(max(tn.x, tn.y), tn.z), 0.0, 1.0);
  float stepW = length(vW - cameraPosition) * (1.0 - t0) / 12.0;
  float acc = 0.0, hot = 0.0;
  for (int i = 0; i < 12; i++) {
    vec3 p = camL + d * mix(t0, 1.0, (float(i) + 0.5) / 12.0);
    float R = mix(r0, r1, p.y), q = length(p.xz) / R;
    if (q >= 1.0 || p.y < 0.0 || p.y > 1.0) continue;
    float ends = smoothstep(0.0, 0.04, p.y) * smoothstep(1.0, 0.8, p.y);
    float flow = n2(vec2(p.x * 5.0 / R, p.y * len * 1.4 - time * speed * 3.0)) * 0.5 + n2(vec2(p.z * 5.0 / R + 7.0, p.y * len * 2.2 - time * speed * 4.5)) * 0.5;
    float k, h;
    if (fire > 0.5) {
      float f2 = n2(vec2((p.x + p.z) * 9.0 / R, p.y * len * 4.0 - time * speed * 7.0));   // (tongues: finer, faster)
      float lick = smoothstep(0.3, 0.62, flow * 0.65 + f2 * 0.35 + (1.0 - p.y) * 0.32 - q * 0.35);
      k = lick * (1.0 - q * q) * (1.0 - p.y * 0.45) * 3.0; h = k * (1.0 - q) * (1.0 - p.y * 0.7) * 1.4;
    } else {
      float core = exp(-q * q * 10.0), ring = rings > 0.0 ? smoothstep(0.8, 1.0, fract(p.y * rings * len * 0.15 - time * speed)) * smoothstep(0.35, 0.85, q) : 0.0;
      k = (1.0 - q * q) * (0.3 + 0.7 * flow) * 0.6 + core * 1.2 + ring * 1.2; h = core * 1.2 + ring * 0.6;
    }
    float w = ends * stepW / max(0.05, R);
    acc += k * w; hot += h * w;
  }
  float I = 1.0 - exp(-acc * 0.9);
  vec3 col = mix(c2, c1, clamp(hot / max(acc, 1e-3), 0.0, 1.0));
  gl_FragColor = vec4(col * I * a * 1.3, 1.0);
}`;
// the magic circle: rings, a band of runes, a turning broken ring and a six-pointed star, drawn round as it gathers (draw 0..1)
const CIRCLE_FRAG = `
uniform vec3 col; uniform float draw, alpha, flare, time; varying vec2 vUv;
float ring(float r, float c, float w) { return smoothstep(w, 0.0, abs(r - c)); }
float seg(vec2 p, vec2 a, vec2 b, float w) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return smoothstep(w, 0.0, length(pa - ba * h)); }
void main() {
  vec2 p = vUv * 2.0 - 1.0; float r = length(p); if (r > 1.0) discard;
  float an = (atan(p.y, p.x) + 3.14159265) / 6.2831853, on = step(an, draw);
  float v = (ring(r, 0.95, 0.014) + ring(r, 0.87, 0.009) + ring(r, 0.5, 0.012)) * on;
  float id = floor(an * 40.0), h = fract(sin(id * 12.9898) * 43758.5453), f = fract(an * 40.0);
  v += step(0.885, r) * step(r, 0.935) * step(0.15, f) * step(f, 0.45 + 0.4 * h) * step(abs(r - 0.91), 0.01 + 0.012 * h) * on;
  v += ring(r, 0.66, 0.016) * step(0.35, fract(an * 6.0 + time * 0.3)) * on;
  float s = 0.0;
  for (int k = 0; k < 3; k++) {
    float a0 = 1.5708 + float(k) * 2.0944, a1 = a0 + 2.0944;
    s += seg(p, 0.87 * vec2(cos(a0), sin(a0)), 0.87 * vec2(cos(a1), sin(a1)), 0.012);
    s += seg(p, 0.87 * vec2(cos(a0 + 3.14159), sin(a0 + 3.14159)), 0.87 * vec2(cos(a1 + 3.14159), sin(a1 + 3.14159)), 0.012);
  }
  v += s * smoothstep(0.55, 1.0, draw);
  v += 0.35 * exp(-abs(r - 0.95) * 18.0) * draw + flare * 0.5 * exp(-r * 2.5);
  gl_FragColor = vec4(col * (1.0 + flare * 1.5), clamp(v, 0.0, 1.0) * alpha);
}`;
const CIRCLE_VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export class VFX {
  constructor(game) { this.g = game; this.acc = new Map(); this.jobs = []; this.circles = []; this.vols = []; }
  get P() { return T.vfx || {}; }

  play(name, at, o = {}) {
    const V = this.P[name], h = { arrive: 0, circles: [], stop: (flare) => { for (const c of h.circles) this.end(c, flare); } }; if (!V || !at) return h;
    const g = this.g, fx = g.fx, s = (o.scale ?? 1) * (V.scale ?? 1), n = D.copy(o.n || UP).normalize();
    if (V.stream && o.to) {
      const S = V.stream, from = at.clone(), to = o.to.clone(); h.arrive = from.distanceTo(to) / (S.speed ?? 9);
      this.jobs.push({ t: 0, T: S.time ?? 0.5, n: Math.round((S.n ?? 40) * Math.min(1.5, s)), k: 0, S, from, to, s });
    }
    if (V.veil) { const W = V.veil; this.jobs.push({ wait: W.delay ?? h.arrive, fn: () => this.veil(W, s) }); }
    if (V.circle) h.circles.push(this.circle(V.circle, at, o.life ?? V.circle.life ?? 1.5, s));
    if (V.beam && o.to) this.vol(false, V.beam, at, o.to, s);
    if (V.cone && o.to) this.vol(true, V.cone, at, o.to, s);
    if (V.flash) { const F = V.flash; fx.wAdd.emit({ x: at.x, y: at.y, z: at.z, life: F.life ?? 0.18, size: (F.size ?? 2) * s, size1: (F.size ?? 2) * s * 1.4, color: rgb(o.color ?? F.color ?? '#fff0d0'), a: 1, a1: 0, frame: FR.GLOW }); }
    if (V.flash2d) g.post.flash(V.flash2d[0], hexNum(V.flash2d[1]));
    if (V.shake) g.post.shake(V.shake * Math.min(1.5, s));
    if (V.sound) { if (!sound(V.sound, { pos: at })) sfx[V.sound]?.(0); }
    if (V.ring) g.fx.shockRing(at.clone().setY(Math.max(0.02, at.y - 0.6 * s)), V.ring.r * s, hexNum(V.ring.color ?? '#ffffff'), V.ring.s ?? 0.6);
    if (V.debris) {
      const B = V.debris, cols = (B.colors || ['#a89080', '#6a5a50', '#d8c8b0']).map(hexNum);
      const ph = g.world.phys;
      if (ph?.chipsAt) ph.chipsAt(at, n.clone().multiplyScalar(B.k ?? 1).add(Q.set(0, B.up ?? 0.6, 0)), Math.round((B.n ?? 12) * Math.min(1.5, s)), cols, (B.size ?? 1) * s);
      else for (let i = 0; i < (B.n ?? 12); i++) fx.wNorm.emit({ x: at.x, y: at.y, z: at.z, vx: n.x * rnd(1, 4) + rnd(-2, 2), vy: rnd(1, 4), vz: n.z * rnd(1, 4) + rnd(-2, 2), grav: 9, life: rnd(0.8, 1.4), size: rnd(0.05, 0.14) * s, color: rgb(B.colors?.[i % B.colors.length] ?? '#a89080'), frame: FR.SHARD, vrot: rnd(-8, 8) });
    }
    if (V.dust) {
      const U = V.dust, col = rgb(o.dust ?? U.color ?? '#c0b4a0');
      for (let i = 0; i < Math.round((U.n ?? 16) * Math.min(1.6, s)); i++) {
        const sp = (U.spread ?? 1.2) * s, a = rnd(0, 6.283), r = rnd(0, sp);
        const sz = rr(U.size, 0.8) * s;
        fx.wNorm.emit({ x: at.x + Math.cos(a) * r * 0.5, y: at.y + rnd(-0.3, 0.3) * s, z: at.z + Math.sin(a) * r * 0.5,
          vx: n.x * rnd(0.3, 1.6) + Math.cos(a) * rnd(0.2, 0.9), vy: rnd(0.05, U.rise ?? 0.4), vz: n.z * rnd(0.3, 1.6) + Math.sin(a) * rnd(0.2, 0.9),
          drag: 1.4, life: rr(U.life, 2.5), size: sz, size1: sz * (U.grow ?? 2.4), rot: rnd(0, 6.28), vrot: rnd(-0.4, 0.4),
          color: col, a: U.a ?? 0.55, a1: 0, frame: FR.SMOKE });
      }
    }
    if (V.sparks) {
      const K = V.sparks, col = rgb(K.color ?? '#ffb060');
      for (let i = 0; i < Math.round((K.n ?? 20) * Math.min(1.5, s)); i++) {
        const v = (K.speed ?? 6) * rnd(0.4, 1.1);
        Q.set(n.x + rnd(-0.8, 0.8), n.y + rnd(-0.3, 0.9), n.z + rnd(-0.8, 0.8)).normalize().multiplyScalar(v);
        fx.wAdd.emit({ x: at.x, y: at.y, z: at.z, vx: Q.x, vy: Q.y, vz: Q.z, grav: 7, drag: 0.6, life: rr(K.life, 0.5), size: 0.08 * s, size1: 0.02, color: col, a: 1, a1: 0, frame: FR.STREAK, rot: Math.atan2(Q.y, Math.hypot(Q.x, Q.z)) });
      }
    }
    if (V.embers) {
      const E = V.embers, col = rgb(E.color ?? '#ff9040');
      for (let i = 0; i < (E.n ?? 10); i++) fx.wAdd.emit({ x: at.x + rnd(-0.5, 0.5) * s, y: at.y + rnd(-0.3, 0.3), z: at.z + rnd(-0.5, 0.5) * s, vx: rnd(-0.4, 0.4), vy: rnd(0.3, E.rise ?? 1.2), vz: rnd(-0.4, 0.4),
        drag: 0.8, flutter: 3, life: rr(E.life, 2.2), size: rnd(0.03, 0.07) * s, size1: 0.01, color: col, a: 1, a1: 0, frame: FR.GLOW });
    }
    if (V.fire) {
      const Fi = V.fire, col = rgb(Fi.color ?? '#ffa040');
      for (let i = 0; i < (Fi.n ?? 14); i++) fx.wAdd.emit({ x: at.x + rnd(-0.35, 0.35) * s, y: at.y + rnd(-0.1, 0.2) * s, z: at.z + rnd(-0.35, 0.35) * s, vx: n.x * rnd(0, 1.5), vy: rnd(0.8, 2.2), vz: n.z * rnd(0, 1.5),
        drag: 1.2, life: rr(Fi.life, 0.8), size: (Fi.size ?? 0.5) * s * rnd(0.6, 1.2), size1: 0.05, color: col, a: 0.95, a1: 0, frame: Math.random() < 0.5 ? FR.FLAME1 : FR.FLAME2, rot: rnd(-0.3, 0.3) });
    }
    return h;
  }
  // one puff of a stream: out of its mouth, flying straight to a point round the girls (spread wide), growing, gone as it gets there
  pour(j) {
    const S = j.S, fx = this.g.fx, end = Q.copy(j.to), sp = (S.spread ?? 1) * j.s;
    F2.copy(j.to).sub(j.from).normalize(); R2.crossVectors(F2, UP).normalize(); U2.crossVectors(R2, F2);
    const a = rnd(0, 6.283), r = Math.sqrt(Math.random()) * sp; end.addScaledVector(R2, Math.cos(a) * r).addScaledVector(U2, Math.sin(a) * r * 0.6);
    const fly = j.from.distanceTo(end) / ((S.speed ?? 9) * rnd(0.85, 1.15)), sz = rr(S.size, 0.25) * j.s, cols = S.colors || [S.color || '#ff9a40'];
    const kind = S.kind || 'fire', add = kind === 'fire' || kind === 'glow';
    (add ? fx.wAdd : fx.wNorm).emit({ x: j.from.x + rnd(-0.1, 0.1), y: j.from.y + rnd(-0.1, 0.1), z: j.from.z + rnd(-0.1, 0.1),
      vx: (end.x - j.from.x) / fly, vy: (end.y - j.from.y) / fly, vz: (end.z - j.from.z) / fly, life: fly, size: sz, size1: sz * (S.grow ?? 3),
      rot: rnd(0, 6.28), vrot: rnd(-2, 2), color: rgb(cols[Math.floor(Math.random() * cols.length)]), a: S.a ?? 0.9, a1: S.a1 ?? 0.35,
      frame: kind === 'fire' ? (Math.random() < 0.5 ? FR.FLAME1 : FR.FLAME2) : kind === 'glow' ? (Math.random() < 0.3 ? FR.RUNE : FR.GLOW) : FR.SMOKE });
  }
  // smoke / foam left hanging in front of the camera over the view, drifting, thinning slowly (the girls are drawn in front of it)
  veil(W, s) {
    const cam = this.g.world.camera, fx = this.g.fx, col = rgb(W.color ?? '#a098a8');
    cam.getWorldDirection(F2); R2.crossVectors(F2, UP).normalize(); U2.crossVectors(R2, F2);
    const th = Math.tan((cam.fov * Math.PI) / 360);
    for (let i = 0; i < (W.n ?? 18); i++) {
      const d = rr(W.dist, 2), hh = th * d, hw = hh * cam.aspect, sz = rr(W.size, 1.2) * s;
      Q.copy(cam.position).addScaledVector(F2, d).addScaledVector(R2, rnd(-0.9, 0.9) * hw).addScaledVector(U2, rnd(-0.8, 0.5) * hh);
      fx.wNorm.emit({ x: Q.x, y: Q.y, z: Q.z, vx: rnd(-0.15, 0.15), vy: rnd(0.02, 0.12), vz: rnd(-0.1, 0.1), life: rr(W.life, 3.5), size: sz, size1: sz * 1.6,
        rot: rnd(0, 6.28), vrot: rnd(-0.2, 0.2), color: col, a: W.a ?? 0.5, a1: 0, frame: FR.SMOKE });
    }
  }
  // a magic circle standing in the air just in front of it, facing the girls
  circle(Ci, at, life, s) {
    const g = this.g, cam = g.world.camera, r = (Ci.r ?? 1) * s;
    const mat = new THREE.ShaderMaterial({ vertexShader: CIRCLE_VERT, fragmentShader: CIRCLE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { col: { value: new THREE.Color(hexNum(Ci.color ?? '#c070ff')) }, draw: { value: 0 }, alpha: { value: 1 }, flare: { value: 0 }, time: { value: 0 } } });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r), mat);
    F2.copy(cam.position).sub(at).normalize(); m.position.copy(at).addScaledVector(F2, 0.5); m.lookAt(cam.position); m.renderOrder = 19;
    g.world.scene.add(m);
    const c = { m, t: 0, life, spin: Ci.spin ?? 0.8, end: 0, flare: false };
    this.circles.push(c); return c;
  }
  end(c, flare) { if (!c.end) { c.end = 1e-4; c.flare = !!flare; } }
  update(dt) {
    this.volTick(dt);
    for (let i = this.jobs.length - 1; i >= 0; i--) {
      const j = this.jobs[i];
      if (j.fn) { j.wait -= dt; if (j.wait <= 0) { this.jobs.splice(i, 1); j.fn(); } continue; }
      j.t += dt; const want = Math.min(j.n, Math.ceil((j.n * j.t) / Math.max(0.01, j.T)));
      while (j.k < want) { this.pour(j); j.k++; }
      if (j.k >= j.n) this.jobs.splice(i, 1);
    }
    for (let i = this.circles.length - 1; i >= 0; i--) {
      const c = this.circles[i], U = c.m.material.uniforms; c.t += dt; U.time.value = c.t;
      if (!c.end && c.t >= c.life) this.end(c, true);
      U.draw.value = Math.min(1, c.t / Math.max(0.1, c.life * 0.6));
      c.m.rotateZ(dt * c.spin * (1 + 2.5 * Math.min(1, c.t / c.life)));
      if (c.end) {
        c.end += dt; const k = c.end / (c.flare ? 0.35 : 0.2);
        if (c.flare) { U.flare.value = 1 - k; c.m.scale.setScalar(1 + k * 0.5); }
        U.alpha.value = Math.max(0, 1 - k);
        if (k >= 1) { c.m.removeFromParent(); c.m.geometry.dispose(); c.m.material.dispose(); this.circles.splice(i, 1); }
      }
    }
  }
  // a beam / a cone (beam, cone above): a closed cylinder (its foot at `at`, its far end toward `to`, the wide end there for a cone) whose
  // back faces march the camera's ray through it (VOL_FRAG); it reaches out in a moment, holds `time`, thins away
  vol(cone, B, at, to, s) {
    // (aimed past the lens, down at the girl on the far side of the frame - `aside` metres - so it is seen along its length: one coming
    // straight at the camera is only a haze)
    const cam = this.g.world.camera, R = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), side = Math.sign(at.clone().sub(cam.position).dot(R)) || 1;
    const end = to.clone().addScaledVector(R, -side * (B.aside ?? 1.1)); end.y -= 0.4;
    const dir = end.sub(at), L = dir.length() - (B.short ?? 1.6); if (L < 0.5) return;
    dir.normalize();
    const r0 = (cone ? B.r0 ?? 0.1 : B.r ?? 0.3) * s, r1 = (cone ? B.r1 ?? 0.9 : B.r ?? 0.3) * s;
    const geo = new THREE.CylinderGeometry(r1, r0, 1, 24, 1, false); geo.translate(0, 0.5, 0);
    const U = { time: { value: 0 }, a: { value: 0 }, c1: { value: new THREE.Color(hexNum(B.core ?? '#ffffff')) }, c2: { value: new THREE.Color(hexNum(B.color ?? '#a070ff')) },
      rings: { value: cone ? 0 : B.rings ?? 4 }, fire: { value: cone ? 1 : 0 }, speed: { value: B.speed ?? (cone ? 2.4 : 3.2) }, len: { value: L },
      r0: { value: r0 }, r1: { value: r1 }, camL: { value: new THREE.Vector3() } };
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: VOL_VERT, fragmentShader: VOL_FRAG, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.BackSide }));
    m.position.copy(at); m.quaternion.setFromUnitVectors(UP, dir); m.scale.set(1, 0.01, 1); m.renderOrder = 18; m.frustumCulled = false;
    this.g.world.scene.add(m);
    this.vols.push({ m, U, L, t: 0, T: B.time ?? 0.5, grow: B.grow ?? 0.12, at: at.clone(), end: at.clone().addScaledVector(dir, L), col: rgb(B.color ?? '#a070ff') });
  }
  volTick(dt) {
    const fx = this.g.fx, cam = this.g.world.camera;
    for (let i = this.vols.length - 1; i >= 0; i--) {
      const v = this.vols[i]; v.t += dt; v.U.time.value = v.t;
      const out = Math.min(1, v.t / v.grow), fade = Math.min(1, Math.max(0, (v.t - v.grow - v.T) / 0.28)), thin = 1 - fade * 0.7;
      v.m.scale.set(thin, Math.max(0.01, out) * v.L, thin); v.U.len.value = v.m.scale.y; v.U.a.value = Math.min(1, out * 1.5) * (1 - fade);
      v.m.updateMatrixWorld(); v.m.worldToLocal(v.U.camL.value.copy(cam.position));
      // glowing at both ends while it holds
      if (fade < 1 && Math.random() < dt * 30) for (const p of [v.at, v.end]) fx.wAdd.emit({ x: p.x, y: p.y, z: p.z, life: 0.16, size: 0.7, size1: 1.1, color: v.col, a: 0.7 * (1 - fade), a1: 0, frame: FR.GLOW });
      if (fade >= 1) { v.m.removeFromParent(); v.m.geometry.dispose(); v.m.material.dispose(); this.vols.splice(i, 1); }
    }
  }
  // a new place: what was pouring / hanging there is gone
  clear() {
    this.jobs.length = 0; for (const c of this.circles) { c.m.removeFromParent(); c.m.geometry.dispose(); c.m.material.dispose(); } this.circles.length = 0;
    for (const v of this.vols) { v.m.removeFromParent(); v.m.geometry.dispose(); v.m.material.dispose(); } this.vols.length = 0;
  }
  // a moving thing's trail (its preset's emission rate per second: rate), e.g. a thrown fireball, a smoking shell
  trail(name, at, dt, o = {}) {
    const V = this.P[name]; if (!V || !at) return;
    const key = o.key || name, a = (this.acc.get(key) || 0) + dt * (V.rate ?? 30); let k = Math.floor(a); this.acc.set(key, a - k);
    const fx = this.g.fx, col = rgb(V.color ?? '#c0b0a0');
    while (k-- > 0) {
      const add = V.kind === 'fire' || V.kind === 'glow';
      (add ? fx.wAdd : fx.wNorm).emit({ x: at.x + rnd(-0.06, 0.06), y: at.y + rnd(-0.06, 0.06), z: at.z + rnd(-0.06, 0.06), vx: rnd(-0.2, 0.2), vy: rnd(0.1, V.rise ?? 0.5), vz: rnd(-0.2, 0.2), drag: 1,
        life: rr(V.life, 0.6), size: rr(V.size, 0.18), size1: rr(V.size, 0.18) * (V.grow ?? 2), color: col, a: V.a ?? 0.7, a1: 0, rot: rnd(0, 6.28),
        frame: V.kind === 'fire' ? (Math.random() < 0.5 ? FR.FLAME1 : FR.FLAME2) : V.kind === 'glow' ? FR.GLOW : V.kind === 'ink' ? FR.INK : FR.SMOKE });
    }
  }
}
