// The Fever gauges (docs/DESIGN.md「Fever 槽」, user 2026-10-18): six segments each, drawn by a shader of their own kind, with an aura
// (glow and flames above the lit part, additive) and a few particles.
//   力 dmg    molten: hot noise flowing up through the segments, fire tongues above, embers rising
//   准 acc    a neon tube: a white core, scanlines, a fluorescent flick at low levels; electric crackles above, a glint sweeping along it,
//             four-point sparks shooting out
//   连 combo  fluorescent ooze: bubbles rising inside; ghost-fire wisps above, swaying; bubbles drifting up and popping
// The higher its Fever, the brighter the colour, the wider the glow, the taller and busier the flames and the more particles. When the
// gauge rises, the spot that rose flares (a little for a small rise, a burst when a segment fills); a level-up flares the whole lit
// part, the biggest of all: nothing else ever gets as high as that.
// Placed in mockup pixels (ui/battle.json p1 / p2 fever[i].segs) by glhud.js Panel through its Layout.
import * as THREE from 'three';

const KIND = { dmg: 0, acc: 1, combo: 2 };
// flame heights in mockup px above the segments: at full heat, a rise burst, a level-up (the biggest)
const FLAME = { heat: 15, burst: 26, level: 40 };
// particles: a burst when a segment fills, a level-up, and per second at Fever level 0..3 (and extra at the top level)
const EMIT = { small: 2, burst: 7, level: 16, rate: [0, 0.7, 1.8, 4], max: 1.5 };
const POOL = 28;

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const NOISE = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }`;

// one segment: full up to fill (the tip one partly, with a wavy surface), its own kind of inside
const SEG_FRAG = `
uniform vec3 col; uniform float kind; uniform float heat; uniform float fill; uniform float up; uniform float puff; uniform float time;
uniform float seed; uniform float a;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 uv = vUv;
  float surf = fill + (fill < 0.999 ? 0.05 * sin(uv.x * 9.0 + time * 7.0 + seed * 5.0) : 0.0);
  if (uv.y > surf) discard;
  float h = 0.35 + 0.65 * heat;
  vec3 base = col * (0.72 + 0.4 * h), c;
  if (kind < 0.5) {
    float n = fbm(vec2(uv.x * 2.5 + seed * 3.0, uv.y * 3.0 - time * (1.2 + 2.0 * heat)));
    c = mix(col * 0.55, base, smoothstep(0.2, 0.62, n));
    c += vec3(1.0, 0.7, 0.25) * smoothstep(0.7 - 0.12 * heat, 0.92, n) * 0.55 * h;
  } else if (kind < 1.5) {
    float core = exp(-pow((uv.y - 0.5) / (0.12 + 0.1 * heat), 2.0));   // (along the gauge: the six read as one tube)
    float scan = 0.88 + 0.12 * sin(uv.x * 30.0 - time * 20.0);
    float flick = step(0.95 + 0.04 * heat, hash(vec2(floor(time * 18.0), seed))) * (1.0 - step(0.99, heat));
    c = (base * scan + vec3(0.55, 1.0, 1.0) * core * (0.12 + 0.45 * h)) * (1.0 - 0.45 * flick);
  } else {
    vec2 g = vec2(uv.x * 2.0, uv.y * 3.0 - time * (0.6 + 0.9 * heat)) + seed * 7.0;
    vec2 id = floor(g), f = fract(g) - 0.5;
    float r = 0.16 + 0.14 * hash(id);
    float ring = smoothstep(0.07, 0.0, abs(length(f - (vec2(hash(id + 3.1), hash(id + 5.7)) - 0.5) * 0.4) - r)) * step(0.35, hash(id + 9.3));
    float sw = 0.5 + 0.5 * sin(uv.y * 6.0 - time * 3.0 + uv.x * 2.0);
    c = mix(col * 0.55, base, 0.3 + 0.7 * sw) + mix(col, vec3(1.0), 0.5) * ring * (0.25 + 0.4 * h);
  }
  if (fill < 0.999) c += col * smoothstep(0.12, 0.0, abs(uv.y - surf)) * 0.6;   // (the rising surface of the one filling)
  c = mix(c, vec3(1.0), max(up * 0.6, puff * 0.45));
  gl_FragColor = vec4(c, a);
}`;

// the aura over the whole gauge (additive): glow round the lit part, flames above it (ambient by heat, a burst where it rose, the
// whole lit part on a level-up); worked out in mockup px so the sizes do not depend on the screen
const AURA_FRAG = `
uniform vec3 col; uniform float kind; uniform float heat; uniform float tip; uniform float burst; uniform float burstU; uniform float up;
uniform float time; uniform float seed; uniform float a; uniform vec4 box; uniform vec4 line; uniform float hh;
uniform vec3 flame;
varying vec2 vUv;
${NOISE}
vec3 ramp(float k, vec3 lo, vec3 mid, vec3 hi){ return k < 0.5 ? mix(lo, mid, k * 2.0) : mix(mid, hi, k * 2.0 - 1.0); }
void main(){
  vec2 p = vec2(mix(box.x, box.z, vUv.x), mix(box.w, box.y, vUv.y));
  vec2 A = line.xy, d = line.zw - line.xy; float L = length(d);
  float u = dot(p - A, d) / (L * L);
  vec2 q = A + d * clamp(u, -0.12, 1.12);
  float hy = q.y - p.y;                  // above the gauge's middle line (px)
  float yy = hy - hh;                  // above the segments' top
  float lit = smoothstep(tip + 0.03, tip - 0.03, u) * smoothstep(-0.16, -0.09, u);
  if (lit <= 0.0 && burst <= 0.0) discard;
  // how tall the fire is here
  float H = flame.x * pow(heat, 1.3) + flame.y * burst * exp(-pow((u - burstU) / 0.12, 2.0)) + flame.z * up;
  H *= lit;
  // glow: a halo round the lit band, wider and brighter with the heat (and the flares)
  float dy = max(0.0, abs(hy) - hh);
  float sig = 3.0 + 6.0 * heat + 6.0 * up;
  float glow = exp(-dy * dy / (sig * sig)) * lit * (0.12 + 0.5 * heat + 0.6 * up) * step(-hh - sig * 3.0, hy);
  vec3 c = vec3(0.0); float k = 0.0;
  if (kind < 0.5) {
    // fire tongues: turbulent, rising fast
    float x = u * L, n = fbm(vec2(x / 5.0 + seed * 4.0, yy / 9.0 - time * 3.4));
    float tongue = 0.55 + 0.45 * sin(x * 0.75 + n * 5.0 + time * 2.0);
    float f = H > 0.5 ? clamp(1.0 - yy / (H * (0.3 + 0.95 * n) * tongue), 0.0, 1.0) * smoothstep(-hh, 0.0, yy) : 0.0;
    f = pow(f, 1.5);
    float hot = f * smoothstep(8.0, 30.0, H);
    k = f * 0.9 + glow;
    c = ramp(clamp(f, 0.0, 1.0), vec3(0.6, 0.05, 0.02), col, mix(col, vec3(1.0, 0.85, 0.35), 0.5 + 0.5 * hot)) * f + col * glow;
  } else if (kind < 1.5) {
    // a cold plasma jet where it flares, electric crackles above, a glint sweeping along the lit part
    float x = u * L, n = fbm(vec2(x / 3.5 + seed * 4.0, yy / 6.0 - time * 5.0));
    float f = H > 0.5 ? clamp(1.0 - yy / (H * (0.35 + 0.85 * n)), 0.0, 1.0) * smoothstep(-hh, 0.0, yy) : 0.0;
    f = pow(f, 1.6) * (0.75 + 0.25 * noise(vec2(x * 0.5, time * 20.0)));
    float arcs = 0.0;
    for (int i = 0; i < 3; i++) {
      float slot = floor(time * 12.0 + float(i) * 3.3);
      float on = step(hash(vec2(slot, float(i) + seed)), 0.08 + 0.4 * heat + up);
      float uc = clamp(tip, 0.0, 1.0) * hash(vec2(slot + 1.7, float(i)));
      float Ha = (4.0 + 18.0 * heat + 22.0 * up) * (0.5 + 0.5 * hash(vec2(slot, 9.0 + float(i))));
      float off = (noise(vec2(yy * 0.4, slot * 3.1)) - 0.5) * 7.0;
      float dx = (u - uc) * L - off;
      arcs += on * exp(-abs(dx) * 2.2) * step(0.0, yy) * step(yy, Ha) * (1.0 - 0.7 * yy / max(Ha, 1.0));
    }
    float s = fract(time * 0.55 + seed);
    float glint = exp(-pow((u - s * max(tip, 0.0)) * L / 5.0, 2.0)) * exp(-hy * hy / 40.0) * lit * (0.3 + 0.9 * heat);
    k = f + arcs * 0.8 + glow * 1.3 + glint;
    c = mix(col, vec3(0.7, 1.0, 1.0), clamp(arcs * 0.5 + glint * 0.6 + f * 0.45, 0.0, 1.0)) * k;
  } else {
    // ghost fire: slow wisps that sway apart, a teal edge round a pale core
    float sway = sin(yy * 0.22 - time * 3.0 + u * 11.0) * 0.06;
    float n = fbm(vec2((u + sway) * 7.0 + seed * 4.0, yy / 15.0 - time * 1.5));
    float tongues = 0.55 + 0.45 * sin((u + sway) * 6.2832 * 3.0 + time * 1.3);
    float f = H > 0.5 ? clamp(1.0 - yy / (H * (0.35 + 0.9 * n) * tongues), 0.0, 1.0) * step(-hh, yy) : 0.0;
    f = pow(f, 1.6);
    k = f * 0.85 + glow;
    c = ramp(clamp(f * 1.2, 0.0, 1.0), vec3(0.05, 0.5, 0.4), col, mix(col, vec3(1.0), 0.35)) * f + col * glow;
  }
  gl_FragColor = vec4(c, clamp(k, 0.0, 1.0) * a);
}`;

// one particle: an ember, a four-point glint or a bubble
const PART_FRAG = `
uniform vec3 col; uniform float kind; uniform float a;
varying vec2 vUv;
void main(){
  vec2 p = vUv - 0.5; float r = length(p), k;
  if (kind < 0.5) k = pow(smoothstep(0.5, 0.0, r), 1.6) + smoothstep(0.18, 0.0, r);
  else if (kind < 1.5) k = max(exp(-abs(p.x) * 26.0) * smoothstep(0.5, 0.0, abs(p.y)), exp(-abs(p.y) * 26.0) * smoothstep(0.5, 0.0, abs(p.x))) + smoothstep(0.12, 0.0, r);
  else k = smoothstep(0.07, 0.0, abs(r - 0.36)) + 0.7 * smoothstep(0.1, 0.0, length(p - vec2(-0.13, 0.13)));
  vec3 c = mix(col, vec3(1.0), smoothstep(0.6, 1.4, k) * 0.7);
  gl_FragColor = vec4(c, clamp(k, 0.0, 1.0) * a);
}`;

function mesh(frag, u, order, add = false) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: frag,
    transparent: true, depthTest: false, depthWrite: false, ...(add ? { blending: THREE.AdditiveBlending } : {}) }));
  m.renderOrder = order; m.frustumCulled = false; m.visible = false;
  return m;
}
const rnd = (a, b) => a + Math.random() * (b - a);
const EMBER = [new THREE.Color(1, 0.95, 0.7), new THREE.Color(0.75, 0.1, 0.03)];

export class FeverGauge {
  // k: dmg / acc / combo, F: its mockup boxes (segs), color: its colour
  constructor(k, F, color) {
    this.kind = KIND[k] ?? 0; this.col = color.clone();
    const S = F.segs, mid = (b) => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
    this.boxes = S;
    this.A = mid(S[0]); this.B = mid(S[S.length - 1]); this.half = (S[0][3] - S[0][1]) / 2;
    const xs = S.flatMap((b) => [b[0], b[2]]), ys = S.flatMap((b) => [b[1], b[3]]);
    this.box = [Math.min(...xs) - 18, Math.min(...ys) - FLAME.level - 10, Math.max(...xs) + 18, Math.max(...ys) + 10];
    this.segs = S.map((_, i) => mesh(SEG_FRAG, { col: { value: this.col.clone() }, kind: { value: this.kind }, heat: { value: 0 }, fill: { value: 1 },
      up: { value: 0 }, puff: { value: 0 }, time: { value: 0 }, seed: { value: i * 0.37 + this.kind }, a: { value: 1 } }, 63));
    this.aura = mesh(AURA_FRAG, { col: { value: this.col.clone() }, kind: { value: this.kind }, heat: { value: 0 }, tip: { value: -1 }, burst: { value: 0 },
      burstU: { value: 0 }, up: { value: 0 }, time: { value: 0 }, seed: { value: this.kind * 0.31 }, a: { value: 1 },
      box: { value: new THREE.Vector4(...this.box) }, line: { value: new THREE.Vector4(...this.A, ...this.B) }, hh: { value: this.half },
      flame: { value: new THREE.Vector3(FLAME.heat, FLAME.burst, FLAME.level) } }, 62.5, true);
    this.parts = Array.from({ length: POOL }, () => ({ on: false, m: mesh(PART_FRAG, { col: { value: this.col.clone() }, kind: { value: this.kind }, a: { value: 0 } }, 64, true) }));
    this.meshes = [this.aura, ...this.segs, ...this.parts.map((q) => q.m)];
    this.heat = 0; this.litF = null; this.lastV = null; this.rose = 0; this.burst = 0; this.burstU = 0; this.puff = S.map(() => 0); this.amb = 0; this.next = 0;
  }
  hide() { for (const m of this.meshes) m.visible = false; }
  // u along the gauge (0 / 1 = the first / last segment's middle) -> a mockup point on its top edge
  top(u) { return [this.A[0] + (this.B[0] - this.A[0]) * u, this.A[1] + (this.B[1] - this.A[1]) * u - this.half]; }
  spawn(u, big) {
    const q = this.parts.find((x) => !x.on) || this.parts[this.next++ % this.parts.length];
    const [x, y] = this.top(u);
    Object.assign(q, { on: true, age: 0, x: x + rnd(-5, 5), y: y + rnd(-2, 3), ph: rnd(0, 6.28) });
    if (this.kind === 0) Object.assign(q, { vx: rnd(-10, 10), vy: -rnd(25, 55) * (big ? 1.4 : 1), life: rnd(0.5, 1.0), size: rnd(3, 5.5) });
    else if (this.kind === 1) { const an = rnd(-Math.PI * 0.95, -Math.PI * 0.05), sp = rnd(45, 95) * (big ? 1.3 : 1); Object.assign(q, { vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, life: rnd(0.3, 0.55), size: rnd(7, 12) }); }
    else Object.assign(q, { vx: rnd(-4, 4), vy: -rnd(12, 30) * (big ? 1.3 : 1), life: rnd(0.8, 1.4), size: rnd(4, 8) });
  }
  // lv / v / max: her Fever of this kind; up: the level-up flare (1 -> 0, glhud.js); lvUp: it levelled up this frame
  update(dt, t, { lv, v, max, up, lvUp }) {
    const n = this.segs.length, litF = lv >= max ? n : Math.max(0, Math.min(n, v / max * n)), uOf = (i) => i / (n - 1);
    const tip = (litF - 0.5) / (n - 1);
    this.heat += (Math.min(1, v / max) - this.heat) * Math.min(1, dt * 3);
    // it rose: a segment filled -> a burst there; a small rise -> a little flare at the tip
    if (this.litF !== null) {
      if (Math.floor(litF) > Math.floor(this.litF)) {
        for (let j = Math.floor(this.litF); j < Math.floor(litF) && j < n; j++) { this.puff[j] = 1; this.burst = 1; this.burstU = uOf(j); for (let e = 0; e < EMIT.burst; e++) this.spawn(this.burstU, true); }
        this.rose = 0;
      } else if (v > this.lastV) {
        this.rose += v - this.lastV;
        if (this.rose >= 0.12) { this.rose = 0; if (this.burst < 0.35) { this.burst = 0.35; this.burstU = Math.max(0, Math.min(1, tip)); } for (let e = 0; e < EMIT.small; e++) this.spawn(Math.max(0, Math.min(1, tip)), false); }
      } else this.rose = 0;
    }
    if (lvUp) for (let e = 0; e < EMIT.level; e++) this.spawn(rnd(0, Math.max(0, Math.min(1, tip))), true);
    this.litF = litF; this.lastV = v;
    this.burst = Math.max(0, this.burst - dt * 3);
    // ambient particles, more with the level
    this.amb = Math.min(3, this.amb + dt * ((EMIT.rate[Math.min(lv, EMIT.rate.length - 1)] || 0) + (lv >= max ? EMIT.max : 0)));   // (capped: a long frame never spawns a flood)
    while (this.amb >= 1) { this.amb -= 1; if (litF > 0.3) this.spawn(rnd(0, Math.max(0, Math.min(1, tip))), false); }
    // segments
    this.segs.forEach((m, i) => {
      const f = Math.max(0, Math.min(1, litF - i)), U = m.material.uniforms;
      this.puff[i] = Math.max(0, this.puff[i] - dt * 4);
      m.visible = f > 0.02;
      U.fill.value = f; U.heat.value = this.heat; U.up.value = up; U.puff.value = this.puff[i]; U.time.value = t;
    });
    const AU = this.aura.material.uniforms;
    AU.heat.value = this.heat; AU.tip.value = litF > 0.02 ? tip : -1; AU.burst.value = this.burst; AU.burstU.value = this.burstU; AU.up.value = up; AU.time.value = t;
    this.aura.visible = litF > 0.02 || this.burst > 0;
    // particles
    for (const q of this.parts) {
      if (!q.on) { q.m.visible = false; continue; }
      q.age += dt; const k = q.age / q.life;
      if (k >= 1) { q.on = false; q.m.visible = false; continue; }
      const U = q.m.material.uniforms; q.m.visible = true; q.s = 1;
      if (this.kind === 0) {
        q.vx += Math.sin(t * 7 + q.ph) * dt * 30; q.x += q.vx * dt; q.y += q.vy * dt;
        U.col.value.copy(EMBER[0]).lerp(this.col, Math.min(1, k * 2)).lerp(EMBER[1], Math.max(0, k * 2 - 1));
        U.a.value = (1 - k) * (0.75 + 0.25 * Math.sin(t * 40 + q.ph));
      } else if (this.kind === 1) {
        const drag = Math.exp(-3 * dt); q.vx *= drag; q.vy *= drag; q.x += q.vx * dt; q.y += q.vy * dt;
        q.s = 0.7 + 0.5 * Math.abs(Math.sin(q.age * 30 + q.ph)); U.a.value = 1 - k * k;
      } else {
        q.x += Math.sin(q.age * 5 + q.ph) * dt * 10; q.y += q.vy * dt;
        q.s = k > 0.85 ? 1 + (k - 0.85) / 0.15 * 0.7 : 1; U.a.value = k > 0.85 ? (1 - k) / 0.15 : 0.85;
      }
    }
  }
  layout(L, an, deg = -3) {
    this.boxes.forEach((b, i) => L.box(this.segs[i], [b[0] + 1.5, b[1] + 1.5, b[2] - 1.5, b[3] - 1.5], an, 1, deg));
    L.box(this.aura, this.box, an);
    for (const q of this.parts) if (q.on) { const h = q.size / 2; L.box(q.m, [q.x - h, q.y - h, q.x + h, q.y + h], an, q.s || 1); }
  }
}
