// Layered sprite deformation, Live2D-style: one painted pose = one dense mesh, deformed in the vertex shader by
//   body layer (parents)  hips shift with the feet planted · upper body bends about the waist · breathing
//   part layer            head turns about the neck · skirt hem / sleeve hem / tassels hang and swing · hair, braids and
//                         the tail swing from their roots with a wave running to the tip · ears twitch
//   flesh layer           a soft-body lattice over the whole figure (flesh.js): the shove travels from the hips into the
//                         butt and thighs and dies at the knees, squashed rows bulge sideways, the torso breathes
//   sweat (fragment)      wet sheen on the skin (the art's own highlights brighten and shimmer while the flesh moves),
//                         small drops that ride on the deforming skin and creep down, a flush with exertion
// Children are deformed first in rest space, then carried by the parents, so all the layers add up.
// Part weights come from tools/jiggle_masks.py (12 channels in 4 RGB maps, CH order) + pivots in <pose>_rig.json.
import * as THREE from 'three';
import { Flesh, LATTICE } from './flesh.js';
import { MAXD } from './sweat.js';


export const CH = ['skin', 'gloss', 'skirt', 'tail', 'hairA', 'hairB', 'earL', 'earR', 'dangle', 'sleeve', 'head', 'chest'];

const VERT = `
uniform sampler2D W0; uniform sampler2D W1; uniform sampler2D W2; uniform sampler2D W3; uniform sampler2D FL;
uniform vec2 size; uniform vec4 C[12]; uniform vec4 D[12]; uniform vec4 BODY; uniform vec4 LINES; uniform vec4 PIV;
varying vec2 vUv; varying vec3 vA; varying vec3 vB; varying vec3 vC; varying vec3 vE; varying vec2 vF;
const ivec2 NL = ivec2(${LATTICE.NX}, ${LATTICE.NY});
vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
vec2 L(vec2 q) { return (q - vec2(0.5, 0.0)) * size; }
vec2 chain(vec2 p, float s, int i) {
  float a = D[i].x * s + D[i].y * sin(D[i].z - D[i].w * s) * s;
  vec2 r = L(C[i].xy);
  return rot(p - r, a) - (p - r);
}
vec2 turn(vec2 p, float w, int i) { vec2 r = L(C[i].xy); return rot(p - r, D[i].x * w) - (p - r); }
vec4 cr(float t) { // Catmull-Rom weights
  float t2 = t * t, t3 = t2 * t;
  return vec4(-0.5 * t3 + t2 - 0.5 * t, 1.5 * t3 - 2.5 * t2 + 1.0, -1.5 * t3 + 2.0 * t2 + 0.5 * t, 0.5 * t3 - 0.5 * t2);
}
vec3 flesh(vec2 uv) {
  vec2 g = uv * vec2(NL - 1);
  ivec2 i0 = ivec2(floor(g)); vec2 f = g - floor(g);
  vec4 wx = cr(f.x), wy = cr(f.y);
  vec3 acc = vec3(0.0);
  for (int j = 0; j < 4; j++) {
    vec3 row = vec3(0.0);
    for (int i = 0; i < 4; i++) {
      ivec2 q = clamp(i0 + ivec2(i - 1, j - 1), ivec2(0), NL - 1);
      row += texelFetch(FL, q, 0).xyz * wx[i];
    }
    acc += row * wy[j];
  }
  return acc;
}
void main() {
  vUv = uv;
  // W0 = skin gloss skirt · W1 = tail hairA hairB · W2 = earL earR dangle · W3 = sleeve head chest
  vec3 a = texture2D(W0, uv).rgb, b = texture2D(W1, uv).rgb, c = texture2D(W2, uv).rgb, e = texture2D(W3, uv).rgb;
  vA = a; vB = b; vC = c; vE = e;
  vec2 p = position.xy;
  // part layer (rest space): cloth hangs, chains swing, ears / head turn
  vec2 off = D[2].xy * size * a.b + D[8].xy * size * c.b + D[9].xy * size * e.r;
  off += chain(p, b.r, 3) + chain(p, b.g, 4) + chain(p, b.b, 5);
  off += turn(p, c.r, 6) + turn(p, c.g, 7) + turn(p, e.g, 10);
  // flesh layer
  vec3 fl = flesh(uv);
  vF = vec2(fl.z, length(fl.xy));
  vec2 q = p + off + fl.xy;
  // body layer: hips shift (feet planted), upper body bends about the waist and breathes
  float v = uv.y;
  q += vec2(BODY.x, BODY.w) * smoothstep(LINES.x, LINES.y, v);   // hips shift / dip, feet planted
  float wu = smoothstep(LINES.z - 0.05, LINES.w, v);
  vec2 wp = L(PIV.xy) + BODY.xw;
  q = wp + rot(q - wp, BODY.y * wu);
  q.y += (q.y - wp.y) * BODY.z * wu;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(q, position.z, 1.0);
}`;
const FRAG = `
uniform sampler2D map; uniform sampler2D W0; uniform float flash; uniform float opacity; uniform float showW;
uniform vec3 tint; uniform float tintAmt; uniform float dark;
uniform vec4 aura; uniform float auraFlow; uniform float auraPulse; uniform float auraOnly; uniform vec2 texel;
uniform float wet; uniform float flush; uniform float time; uniform float aspect; uniform sampler2D FL;
uniform vec4 DR[${MAXD}]; uniform vec4 DV[${MAXD}]; uniform sampler2D SW; uniform vec2 SWpx; uniform float mir;
const ivec2 NL = ivec2(${LATTICE.NX}, ${LATTICE.NY});
varying vec2 vUv; varying vec3 vA; varying vec3 vB; varying vec3 vC; varying vec3 vE; varying vec2 vF;
float h1(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
// sweat beads (simulated in sweat.js): a clear drop (the skin shows through, a touch darker), a hard white glint toward
// the light (screen upper left), a soft caustic opposite it, a thin shadow crescent. Running beads draw a tail out behind.
vec3 beads(vec3 col, vec2 a) {
  vec2 L = vec2(-0.32 * mir, 0.34);
  for (int i = 0; i < ${MAXD}; i++) {
    vec4 d = DR[i];
    if (d.w <= 0.0) continue;
    vec2 rel = a - d.xy;
    float st = DV[i].z, reach = d.z * (2.0 + 2.5 * st);
    if (dot(rel, rel) > reach * reach) continue;
    vec2 fw = DV[i].xy;
    vec2 q = vec2(dot(rel, vec2(-fw.y, fw.x)), dot(rel, fw)) / d.z;     // x across, y ahead
    float back = max(0.0, -q.y);
    float dd = length(vec2(q.x * (1.0 + back * 0.6 / (1.0 + st)), q.y < 0.0 ? q.y / (1.0 + 1.8 * st) : q.y));
    float body = smoothstep(1.0, 0.8, dd);
    vec2 o = rel / d.z;
    float sh = clamp(smoothstep(1.08, 0.86, length(o + L * 0.5)) - body, 0.0, 1.0);
    float glint = smoothstep(0.3, 0.05, length(o - L)) * body;
    float caustic = smoothstep(0.7, 0.0, length(o + L * 1.2)) * body;
    col = mix(col, col * 0.84, body * 0.6 * d.w);
    col += vec3(1.0, 0.98, 0.95) * caustic * 0.3 * d.w;
    col = mix(col, col * 0.62, sh * 0.5 * d.w);
    col += vec3(1.0) * glint * d.w;
  }
  return col;
}
// a twinkling 4-point star on the wet highlight streaks
float sparkle(vec2 uv, float cs) {
  vec2 c = floor(uv / cs);
  vec2 ctr = (c + 0.5 + 0.5 * (vec2(h1(c + 2.2), h1(c + 4.4)) - 0.5)) * cs;
  float g = texture2D(W0, vec2(ctr.x, ctr.y / aspect)).g;
  if (g < 0.5 || h1(c + 9.9) > 0.45) return 0.0;
  float tw = fract(time * (0.25 + 0.35 * h1(c + 6.6)) + h1(c + 8.8));
  float k = smoothstep(0.0, 0.06, tw) * smoothstep(0.2, 0.06, tw);
  vec2 q = abs(uv - ctr) / (cs * 0.5);
  float s = max(smoothstep(0.07, 0.0, q.x) * max(0.0, 1.0 - q.y), smoothstep(0.07, 0.0, q.y) * max(0.0, 1.0 - q.x));
  s = max(s, smoothstep(0.22, 0.0, length(q)));
  return s * k;
}
// Fever / skill aura (battle): light running up the figure in stripes; the halo copy draws only this, larger, behind her
float auraLight() {
  float flow = 0.5 + 0.5 * sin(vUv.y * 26.0 - time * (3.0 + auraFlow * 9.0) + vUv.x * 6.0);
  return mix(0.55, 1.0, flow * min(1.0, auraFlow + 0.3)) + auraPulse * 0.8 * smoothstep(0.25, 0.0, abs(vUv.y - fract(time * 1.6)));
}
void main() {
  vec4 t = texture2D(map, vUv);
  if (t.a < 0.02) discard;
  if (auraOnly > 0.5) {
    float k = aura.a * auraLight();
    gl_FragColor = vec4(aura.rgb * k, t.a * min(1.0, k) * opacity);
    return;
  }
  vec3 col = t.rgb;
  // ---- sweat
  vec3 sg = texture2D(W0, vUv).rgb;
  float skin = sg.r, gloss = sg.g;
  if (skin > 0.01 && (wet > 0.001 || flush > 0.001)) {
    col = mix(col, col * vec3(1.05, 0.86, 0.86) + vec3(0.04, 0.0, 0.01), skin * flush * 0.55);      // flushed
    float shimmer = 0.75 + 0.25 * sin(time * 3.0 + vUv.y * 40.0) + clamp(vF.y * 30.0, 0.0, 0.8);   // wet light slides as she moves
    col += vec3(1.0, 0.97, 0.94) * gloss * wet * 0.42 * shimmer;
    float lum = dot(t.rgb, vec3(0.3, 0.59, 0.11));
    col += vec3(1.0, 0.95, 0.9) * skin * wet * smoothstep(0.78, 0.97, lum) * 0.22;                 // oily skin
    vec2 uvA = vec2(vUv.x, vUv.y * aspect);
    // wet streaks the beads left behind: a shadowed rim and a glossy core line; as it dries the core goes first,
    // then the rim thins out and is gone
    float tr = texture2D(SW, vUv).r;
    float sk = smoothstep(0.15, 0.5, skin);
    float rim = smoothstep(0.04, 0.3, tr) * (1.0 - smoothstep(0.45, 0.8, tr));
    col = mix(col, col * vec3(0.8, 0.7, 0.72), rim * 0.55 * sk);
    col += vec3(1.0, 0.98, 0.96) * smoothstep(0.5, 0.85, tr) * 0.5 * sk;
    col = mix(col, beads(col, uvA), sk);
    col += vec3(1.0, 0.98, 0.95) * sparkle(uvA, 0.05) * wet * smoothstep(0.2, 0.6, gloss) * 1.1;
  }
  col = mix(col, tint, tintAmt);          // hit / status tints (battle)
  if (aura.a > 0.001) {   // rim light just inside the outline
    float e = 1.0 - min(min(texture2D(map, vUv + vec2(texel.x * 6.0, 0.0)).a, texture2D(map, vUv - vec2(texel.x * 6.0, 0.0)).a),
                        min(texture2D(map, vUv + vec2(0.0, texel.y * 6.0)).a, texture2D(map, vUv - vec2(0.0, texel.y * 6.0)).a));
    col += aura.rgb * aura.a * (0.1 + 1.1 * smoothstep(0.1, 0.9, e)) * auraLight();   // the light stays at her outline, she stays readable
  }
  col *= 1.0 - dark;
  col = mix(col, vec3(1.0), flash);
  if (showW > 0.5 && showW < 1.5) { // part weights
    vec3 k = vA.b * vec3(0.15, 0.45, 1.0) + vB.r * vec3(0.0, 0.9, 0.45) + (vB.g + vB.b) * vec3(0.75, 0.25, 1.0)
           + (vC.r + vC.g) * vec3(0.0, 1.0, 1.0) + vC.b * vec3(1.0, 0.0, 1.0) + vE.r * vec3(0.5, 1.0, 0.2) + vE.g * vec3(0.35);
    col = mix(col * 0.6, k, clamp(length(k), 0.0, 0.75));
  } else if (showW > 1.5) { // flesh softness heat map (blue = bone, red = soft), brightened by how far it moves right now
    vec3 h = mix(vec3(0.1, 0.25, 1.0), vec3(1.0, 0.15, 0.2), vF.x);
    col = mix(col * 0.55, h, 0.35 + 0.4 * vF.x) + vec3(1.0, 0.9, 0.4) * clamp(vF.y * 25.0, 0.0, 0.6);
  }
  gl_FragColor = vec4(col, t.a * opacity);
}`;

export function rigMesh(tex, weights, rig, fleshDef, segs = [96, 144]) {
  const ar = tex.image.height / tex.image.width;
  const geo = new THREE.PlaneGeometry(1, ar, segs[0], segs[1]);
  geo.translate(0, ar / 2, 0); // pivot bottom-centre; local = ((u - 0.5), v * ar)
  const C = CH.map((name) => { const p = rig.parts[name]; const at = p ? p.pivot : [0.5, 0.5]; return new THREE.Vector4(at[0], at[1], 0, 0); });
  const flesh = new Flesh(fleshDef, ar, rig);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: tex }, W0: { value: weights[0] }, W1: { value: weights[1] }, W2: { value: weights[2] }, W3: { value: weights[3] }, FL: { value: flesh.tex },
      size: { value: new THREE.Vector2(1, ar) }, C: { value: C }, D: { value: CH.map(() => new THREE.Vector4()) },
      BODY: { value: new THREE.Vector4() }, LINES: { value: new THREE.Vector4(rig.lines.ground, rig.lines.hip, rig.lines.waist, rig.lines.chest) },
      PIV: { value: new THREE.Vector4(rig.waistPivot[0], rig.waistPivot[1], rig.neckPivot[0], rig.neckPivot[1]) },
      flash: { value: 0 }, opacity: { value: 1 }, showW: { value: 0 }, tint: { value: new THREE.Color(1, 0.1, 0.3) }, tintAmt: { value: 0 }, dark: { value: 0 },
      aura: { value: new THREE.Vector4(1, 1, 1, 0) }, auraFlow: { value: 0 }, auraPulse: { value: 0 }, auraOnly: { value: 0 }, texel: { value: new THREE.Vector2(1 / tex.image.width, 1 / tex.image.height) },
      wet: { value: 0 }, flush: { value: 0 }, time: { value: 0 }, aspect: { value: ar },
      DR: { value: Array.from({ length: MAXD }, () => new THREE.Vector4()) }, DV: { value: Array.from({ length: MAXD }, () => new THREE.Vector4()) },
      SW: { value: null }, SWpx: { value: new THREE.Vector2() }, mir: { value: 1 },
    },
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.userData.ar = ar;
  m.userData.flesh = flesh;
  return m;
}

// ------------------------------------------------------------------ physics: body + part springs per girl (the flesh lattice is per pose mesh)
const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
class S1 { // 1-D spring
  constructor(f, z) { this.x = 0; this.v = 0; this.f = f; this.z = z; this.a = 0; }
  step(target, dt, zMul = 1) { const w = TAU * this.f; this.a = w * w * (target - this.x) - 2 * this.z * zMul * w * this.v; this.v += this.a * dt; this.x += this.v * dt; return this.a; }
}
class S2 { constructor(f, z) { this.x = new S1(f, z); this.y = new S1(f, z); } }

export class Body {
  constructor() {
    // whole figure (applied as the mesh transform): pop / recoil shove / tilt / squash — fractions of the sprite height
    this.oy = new S1(3.2, 0.42); this.ox = new S1(2.8, 0.5); this.r = new S1(2.8, 0.5); this.sq = new S1(3.4, 0.3);
    // body layer: weight shift between the hips, upper body sway, head
    this.hip = new S1(1.8, 0.3); this.upper = new S1(2.2, 0.26); this.head = new S1(2.8, 0.35);
    // cloth / chains / ears
    this.skirt = new S2(1.8, 0.15); this.dangle = new S2(1.35, 0.1); this.sleeve = new S2(1.2, 0.17);
    this.tail = new S1(1.15, 0.2); this.hairA = new S1(0.95, 0.18); this.hairB = new S1(1.05, 0.18);
    this.earL = new S1(6, 0.22); this.earR = new S1(6.4, 0.22);
    // gun tick: a fast spring kicked by every shot, so the upper body and hips jerk with each round (16 Hz: reads even at 13 rounds/s)
    this.shake = new S1(16, 0.5);
    // standing fire: the hips keep a slow steady bounce (knees give, feet planted) that the flesh rides on
    this.env = 0; this.rph = 0; this.drop = 0; this.sway = 0; this.pulse = [0, 0];
    this.bph = Math.random() * TAU; this.depth = 1;
    this.wave = Math.random() * 6; this.hwave = Math.random() * 6;
    this.tw = [rnd(1, 3), rnd(2, 4)];
    this.ph = Math.random() * 10;
    this.kick = 0; this.breath = 0;
  }
  // cloth / hair react to a jolt; the flesh gets `kick` (consumed by the lattice step)
  jolt(k, amp) {
    for (const [s, a] of [[this.skirt, 0.02], [this.dangle, 0.03], [this.sleeve, 0.015]]) {
      const w = TAU * s.y.f; s.y.v -= k * a * w * amp * rnd(0.85, 1.15); s.x.v += rnd(-0.4, 0.4) * k * a * w * amp;
    }
    this.hairA.v += rnd(-1, 1) * k * 0.25; this.hairB.v += rnd(-1, 1) * k * 0.25; this.tail.v += rnd(-1, 1) * k * 0.4;
    this.kick += k;
  }
  pop(up, amp = 1) { // springing out of cover / dropping back into it: velocity impulses, so the flesh feels the acceleration
    this.oy.v += (up ? 0.55 : -0.5) * amp; this.sq.v += (up ? 0.5 : -0.6) * amp;
    this.upper.v += (up ? -1 : 1) * 0.3 * amp; this.hip.v += rnd(-0.08, 0.08) * amp;
  }
  recoil(dir, kick, amp = 1, tick = 1) { // dir: the way she shoots (+1 right); the kick shoves her the other way
    const k = kick * amp;
    this.shake.v += dir * 7 * tick * amp;
    this.ox.v -= dir * 0.22 * k; this.oy.v -= 0.2 * k; this.r.v += dir * 0.3 * k;
    this.upper.v += dir * 0.45 * k; this.hip.v -= dir * 0.06 * k;
  }
  // firing: standing and shooting; rhythm: Hz of the standing-fire bounce; exert 0..1 (breath gets faster and deeper)
  update(dt, t, amp, ring, firing = false, rhythm = 1.6, exert = 0) {
    const zm = 1 / ring;
    this.shake.step(0, dt);
    this.env += ((firing ? 1 : 0) - this.env) * Math.min(1, dt * 4);
    this.rph += dt * TAU * rhythm;
    this.drop = -0.03 * amp * this.env * (0.5 - 0.5 * Math.cos(this.rph));
    this.sway = 0.02 * amp * this.env * Math.sin(this.rph * 0.5);
    const w = TAU * rhythm;   // the bounce's acceleration, for the flesh
    this.pulse = [-this.sway * 0.25 * w * w, -0.03 * amp * this.env * 0.5 * w * w * Math.cos(this.rph)];
    const ay = this.oy.step(0, dt, zm), ax = this.ox.step(0, dt, zm);
    this.r.step(0, dt, zm); this.sq.step(0, dt, zm);
    // idle: weight shifts from hip to hip, the upper body counter-sways, breathing
    const ah = this.hip.step(Math.sin(t * TAU * 0.27) * 0.014 * amp * (1 - this.env) + this.sway, dt, zm);
    const au = this.upper.step(Math.sin(t * TAU * 0.27 + 2.4) * 0.016 * amp + Math.sin(t * TAU * 0.11) * 0.006, dt, zm);
    this.bph += dt * TAU * (0.24 + 0.24 * exert);
    this.depth = 1 + 0.9 * exert;
    this.breath = Math.sin(this.bph);
    this.head.step(-this.upper.x * 0.6 + Math.sin(t * TAU * 0.17 + this.ph) * 0.02, dt, zm);
    const sy = -ay * 0.0032 * amp;
    this.skirt.x.step(-(ah * 0.006 + ax * 0.003) * amp + Math.sin(t * TAU * 0.4 + this.ph) * 0.006, dt, zm); this.skirt.y.step(sy * 0.8, dt, zm);
    this.dangle.x.step(-(ah * 0.008 + ax * 0.004 + au * 0.004) * amp, dt, zm); this.dangle.y.step(sy, dt, zm);
    this.sleeve.x.step(-(au * 0.006 + ax * 0.003) * amp + Math.sin(t * TAU * 0.3 + 1) * 0.006, dt, zm); this.sleeve.y.step(sy * 0.6, dt, zm);
    this.tail.step(Math.sin(t * TAU * 0.45) * 0.16 - (ah * 0.02 + ax * 0.01) * amp, dt, zm);
    this.hairA.step(Math.sin(t * TAU * 0.25 + this.ph) * 0.03 - (au * 0.01 + ax * 0.012 + ay * 0.004) * amp, dt, zm);
    this.hairB.step(Math.sin(t * TAU * 0.27 + this.ph + 1) * 0.03 - (au * 0.01 + ax * 0.012 - ay * 0.004) * amp, dt, zm);
    this.wave += dt * TAU * 0.9; this.hwave += dt * TAU * 0.5;
    for (let i = 0; i < 2; i++) { this.tw[i] -= dt; if (this.tw[i] <= 0) { this.tw[i] = rnd(1.6, 4.2); (i ? this.earR : this.earL).v += rnd(4, 7) * (Math.random() < 0.5 ? -1 : 1); } }
    this.earL.step(-this.head.x * 0.5, dt); this.earR.step(-this.head.x * 0.5, dt);
  }
  // the body layer + mesh transform in sprite-local units of the unmirrored sprite (sign = -1 when mirrored)
  pose(sign, ar) {
    return {
      B: { hip: (this.hip.x - this.shake.x * 0.3) * sign, upper: (this.upper.x + this.shake.x * 3) * sign, breath: this.breath * 0.02 * this.depth, drop: this.drop },
      X: { sx: 1 - this.sq.x * 0.5, sy: 1 + this.sq.x, r: this.r.x * sign, ox: this.ox.x * ar * sign, oy: this.oy.x * ar },
    };
  }
  // write the uniforms of one pose mesh
  apply(m, sign) {
    const D = m.material.uniforms.D.value, B = m.material.uniforms.BODY.value;
    const soft = (i, s) => D[i].set(s.x.x * sign, s.y.x, 0, 0);
    soft(2, this.skirt); soft(8, this.dangle); soft(9, this.sleeve);
    D[3].set(this.tail.x * sign, 0.14 * sign, this.wave, 3.5);
    D[4].set(this.hairA.x * sign, 0.03 * sign, this.hwave, 2.5);
    D[5].set(this.hairB.x * sign, 0.03 * sign, this.hwave + 1.3, 2.5);
    D[6].set(this.earL.x * sign, 0, 0, 0); D[7].set(this.earR.x * sign, 0, 0, 0);
    D[10].set(this.head.x * sign, 0, 0, 0);
    B.set((this.hip.x - this.shake.x * 0.3) * sign, (this.upper.x + this.shake.x * 3) * sign, this.breath * 0.02 * this.depth, this.drop);
  }
}
