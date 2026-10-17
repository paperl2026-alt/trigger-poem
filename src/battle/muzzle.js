// The shot at the gun / the paw (docs/DESIGN.md「射击特效」): the painted flash (hud/flash_*) is only the base; the program puts on top
// of it a shader pass (pop, flip, radial smear, colour split, hue running in Fever), a glow with star rays, a shock ring (the gun) or a
// spinning talisman ring (the paw), and particles: needle sparks along the shot, ejected casings (gun), runes and paw prints (paw), hearts
// at full Fever. How strong all of it is follows her Fever (level share 0..1), full Fever, and her special (endless gatling / beam).
// Pixel space (the game's overlay, 1 unit = 1 px, origin bottom-left), drawn over the heroines.
import * as THREE from 'three';
import { tex } from '../core/assets.js';
import { FR } from '../core/particles.js';

export const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const HUE = `vec3 hueRot(vec3 c, float h){ const vec3 k = vec3(0.57735); float co = cos(h); return c * co + cross(k, c) * sin(h) + k * dot(k, c) * (1.0 - co); }`;
// the painted flash: smeared outward along its rays, split into colours, its hue running (Fever)
const FLASH_FRAG = `
uniform sampler2D map; uniform vec3 tint; uniform float a; uniform float smear; uniform float split; uniform float hue;
varying vec2 vUv;
${HUE}
void main(){
  vec2 d = vUv - 0.5;
  vec4 t = texture2D(map, vUv);
  vec3 c = t.rgb * t.a; float al = t.a;
  for (int i = 1; i <= 4; i++) { vec4 s = texture2D(map, 0.5 + d * (1.0 - smear * float(i) * 0.07)); c += s.rgb * s.a * 0.45; al += s.a * 0.45; }
  c /= 2.8; al /= 2.8;
  float r = texture2D(map, vUv + d * split).a, b = texture2D(map, vUv - d * split).a;
  c = hueRot(c * tint, hue) + vec3(max(0.0, r - al), 0.0, max(0.0, b - al)) * split * 6.0;
  gl_FragColor = vec4(c * a, clamp(al * a, 0.0, 1.0));
}`;
// soft glow + star rays, flickering
export const GLOW_FRAG = `
uniform vec3 col; uniform float a; uniform float rays; uniform float rot; uniform float time;
varying vec2 vUv;
void main(){
  vec2 p = (vUv - 0.5) * 2.0; float r = length(p), ang = atan(p.y, p.x) + rot;
  float g = exp(-r * r * 7.0);
  float star = rays > 0.5 ? pow(abs(cos(ang * rays * 0.5)), 30.0) * exp(-r * 2.4) : 0.0;
  float fl = 0.85 + 0.15 * sin(time * 63.0 + r * 9.0);
  float v = (g + star * 1.1) * a * fl;
  gl_FragColor = vec4(col * v, clamp(v, 0.0, 1.0));
}`;
// kind 0: a shock ring racing out; kind 1: a talisman ring (double circle, ticks, dashes) spinning while it opens
export const RING_FRAG = `
uniform vec3 col; uniform float a; uniform float k; uniform float kind; uniform float spin;
varying vec2 vUv;
void main(){
  vec2 p = (vUv - 0.5) * 2.0; float r = length(p), ang = atan(p.y, p.x);
  float R = mix(0.25, 0.92, k), w = mix(0.07, 0.025, k);
  float v = smoothstep(w, 0.0, abs(r - R));
  if (kind > 0.5) {
    float sa = ang + spin;
    v = max(v, smoothstep(0.022, 0.0, abs(r - R * 0.8)));
    v = max(v, step(0.5, fract(sa * 16.0 / 6.2832)) * smoothstep(0.05, 0.0, abs(r - R * 0.9)));
    v = max(v, step(0.75, fract(-sa * 6.0 / 6.2832 + 0.1)) * smoothstep(0.03, 0.0, abs(r - R * 0.62)));
  }
  v *= a * (1.0 - k * k);
  gl_FragColor = vec4(col * v, clamp(v, 0.0, 1.0));
}`;

const quad = new THREE.PlaneGeometry(1, 1);
function layer(game, frag, uniforms, order) {
  const m = new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: frag, transparent: true, depthTest: false,
    depthWrite: false, blending: THREE.AdditiveBlending }));
  m.renderOrder = order; m.visible = false; m.frustumCulled = false;
  game.overlay.add(m);
  return m;
}
const rnd = (a, b) => a + Math.random() * (b - a);
const C1 = new THREE.Color(), C2 = new THREE.Color();

export class Muzzle {
  constructor(game, player) {
    this.game = game; this.p = player;
    const w = player.w;
    this.paw = w.kind === 'mantra';
    this.flashes = { rifle: tex['hud/flash_rifle'], gatling: tex['hud/flash_gatling'], mantra: tex['hud/flash_mantra'] };
    this.col = new THREE.Color(player.c.color);
    this.tracer = new THREE.Color(w.tracer || player.c.color);
    this.flash = layer(game, FLASH_FRAG, { map: { value: this.flashes[w.kind] || this.flashes.rifle }, tint: { value: new THREE.Color(1, 1, 1) },
      a: { value: 0 }, smear: { value: 0 }, split: { value: 0 }, hue: { value: 0 } }, 39);
    this.glow = layer(game, GLOW_FRAG, { col: { value: new THREE.Color() }, a: { value: 0 }, rays: { value: 0 }, rot: { value: 0 }, time: { value: 0 } }, 38);
    this.ring = layer(game, RING_FRAG, { col: { value: new THREE.Color() }, a: { value: 0 }, k: { value: 0 }, kind: { value: this.paw ? 1 : 0 },
      spin: { value: 0 } }, 38.5);
    this.t = 1; this.rt = 1; this.hold = 0; this.lv = 0; this.full = false; this.skill = false; this.time = 0;
  }
  // her Fever share (0..1), full Fever, special on: called every frame by the player
  setLevel(lv, full, skill) { this.lv = lv; this.full = full; this.skill = skill; }

  // one shot from (x, y) toward (tx, ty), all in overlay pixels (y up)
  fire(x, y, tx, ty, crit = false) {
    const g = this.game, H = this.p.H, U = this.flash.material.uniforms, fx = g.fx;
    const ang = Math.atan2(ty - y, tx - x), lv = this.skill ? 1 : this.lv, hot = this.full || this.skill;
    // Fever shows in colour, smear, rays and more particles, not in a bigger white blob over her (nothing may hide the heroines)
    const sz = H * (this.paw ? 0.15 : 0.14) * (1 + lv * 0.2 + (this.skill ? 0.15 : 0)) * rnd(0.9, 1.1);
    this.x = x; this.y = y; this.ang = ang; this.sz = sz; this.t = 0;
    // the painted flash: popped, flipped at random, smeared and colour-split as the Fever grows, hue running at full Fever
    U.map.value = (this.skill && !this.paw && this.flashes.gatling) || this.flashes[this.p.w.kind] || this.flashes.rifle;
    U.smear.value = 0.3 + lv * 1.2; U.split.value = lv * 0.035 + (hot ? 0.02 : 0);
    U.tint.value.copy(C1.set(1, 1, 1).lerp(this.col, 0.25 + lv * 0.35));
    this.flash.rotation.z = (this.paw ? ang - Math.PI / 2 : ang) + rnd(-0.25, 0.25);
    this.flip = Math.random() < 0.5 ? -1 : 1;
    // glow and rays, ring
    this.glow.material.uniforms.rays.value = lv > 0.15 || crit ? (this.paw ? 8 : 6) : 0;
    this.glow.material.uniforms.rot.value = rnd(0, 6.28);
    if (this.paw || lv > 0.3 || this.rt > 0.6) this.rt = 0;
    // particles: needle sparks along the shot (more with Fever), the gun's casing, the paw's runes / paw prints, hearts at full Fever
    const n = Math.round((this.paw ? 3 : 2) + lv * 6 + (crit ? 3 : 0));
    C2.copy(this.tracer).lerp(this.col, 0.5);
    for (let i = 0; i < n; i++) {
      const a = ang + rnd(-0.45, 0.45), s = H * rnd(0.9, 2.6) * (1 + lv);
      fx.oAdd.emit({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: a, life: rnd(0.08, 0.18), size: H * rnd(0.03, 0.06) * (1 + lv * 0.6), size1: H * 0.01,
        color: [C2.r, C2.g, C2.b], a: 1, a1: 0, frame: FR.STREAK, drag: 7 });
    }
    if (!this.paw) {
      const side = -this.p.side, a = Math.PI / 2 + side * rnd(0.3, 0.9);
      fx.oNorm.emit({ x, y, vx: Math.cos(a) * H * rnd(0.35, 0.6), vy: Math.sin(a) * H * rnd(0.45, 0.8), life: rnd(0.45, 0.7), size: H * 0.022, size1: H * 0.02,
        rot: rnd(0, 6.28), vrot: rnd(-24, 24), color: hot ? [1, 0.55, 0.85] : [1, 0.82, 0.45], a: 1, a1: 0.6, frame: FR.CASING, grav: H * 2.6, drag: 0.6 });
    } else {
      for (let i = 0, m = 1 + Math.round(lv * 3); i < m; i++) {
        const a = rnd(0, 6.28), s = H * rnd(0.1, 0.35);
        fx.oAdd.emit({ x: x + Math.cos(a) * sz * 0.2, y: y + Math.sin(a) * sz * 0.2, vx: Math.cos(a) * s, vy: Math.sin(a) * s + H * 0.08, life: rnd(0.35, 0.6),
          size: H * rnd(0.025, 0.04), size1: H * 0.01, rot: rnd(0, 6.28), vrot: rnd(-6, 6), color: i % 2 ? [1, 0.85, 0.4] : [0.8, 0.55, 1],
          a: 1, a1: 0, frame: i % 2 ? FR.RUNE : FR.PAW, drag: 3 });
      }
    }
    if (hot) {
      for (let i = 0; i < 2; i++) {
        const a = ang + rnd(-1.2, 1.2), s = H * rnd(0.2, 0.5);
        fx.oAdd.emit({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s + H * 0.1, life: rnd(0.4, 0.7), size: H * 0.03, size1: H * 0.045, rot: rnd(-0.4, 0.4),
          color: [this.col.r, this.col.g, this.col.b], a: 0.9, a1: 0, frame: this.paw ? FR.PAW : FR.HEART, drag: 2.5, flutter: H * 0.6 });
      }
    }
  }
  // the beam (her special, the paw): the muzzle stays lit while it lasts
  sustain(x, y) { this.x = x; this.y = y; this.hold = 0.08; if (this.t > 0.03) this.t = 0.03; }

  update(dt, t) {
    this.time = t;
    this.t += dt; this.rt += dt * (this.paw ? 2.6 : 4.2); this.hold = Math.max(0, this.hold - dt);
    const life = this.paw ? 0.09 : 0.055, on = this.t < life || this.hold > 0, e = Math.min(1, this.t / life);
    const lv = this.skill ? 1 : this.lv, hot = this.full || this.skill;
    // flash: pops big and settles, fades out
    const F = this.flash, U = F.material.uniforms;
    F.visible = on;
    if (on) {
      const pop = 1.35 - 0.35 * Math.min(1, e * 3);
      F.position.set(this.x, this.y, 0);
      F.scale.set(this.sz * pop * this.flip, this.sz * pop, 1);
      U.a.value = (1 - e * 0.7) * (0.9 + lv * 0.25);
      U.hue.value = hot ? Math.sin(t * 7) * 0.5 : 0;
    }
    // glow: the player's colour, warmer at the core, bigger and longer with Fever
    const G = this.glow, GU = G.material.uniforms, ga = on ? 1 - e * 0.6 : Math.max(0, GU.a.value - dt * 9);
    G.visible = ga > 0.01;
    if (G.visible) {
      GU.a.value = ga * (0.35 + lv * 0.2); GU.time.value = t;
      GU.col.value.copy(C1.copy(this.col).lerp(C2.setRGB(1, 0.95, 0.85), 0.3 - lv * 0.2));
      G.position.set(this.x, this.y, 0);
      G.scale.setScalar(this.sz * (1.0 + lv * 0.35));
    }
    // ring: the gun's shock ring or the paw's talisman ring
    const R = this.ring, RU = R.material.uniforms, k = Math.min(1, this.rt);
    R.visible = this.rt < 1;
    if (R.visible) {
      RU.k.value = k; RU.a.value = (this.paw ? 0.8 : 0.5) * (0.6 + lv * 0.4); RU.spin.value = t * (this.paw ? 3 : 0);
      RU.col.value.copy(this.paw ? C1.setRGB(1, 0.85, 0.45).lerp(this.col, lv * 0.6) : this.col);
      R.position.set(this.x, this.y, 0);
      R.scale.setScalar(this.sz * (this.paw ? 1.15 : 0.9) * (1 + lv * 0.2));
      R.rotation.z = this.paw ? 0 : this.ang;
    }
  }
  dispose() { for (const m of [this.flash, this.glow, this.ring]) { this.game.overlay.remove(m); m.material.dispose(); } }
}
