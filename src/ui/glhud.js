// The battle HUD (docs/DESIGN.md「UI」战斗 HUD), drawn with WebGL over the game: the approved mockup (art/raw/r33/hud_a.png) taken apart
// (tools/r35_import.py) and put back at the mockup's places (content ui/battle.json, mockup pixels, scaled by the screen height), with
// the text, numbers, bars, skill rings, Fever gauges, ammo, chibi portraits, reticles, reload pictures and the down countdown drawn by
// the program and moving: lines boil like hand-drawn animation, a light runs along the white outlines, numbers bounce, the panel shakes
// when she is hit. Nothing of it may cover the heroines (DESIGN): everything sits in the top strip, the corners and the bottom middle.
import * as THREE from 'three';
import { tex, meta } from '../core/assets.js';
import { C, T } from '../core/content.js';
import { tr, lang } from '../core/i18n.js';
import { FEVER_KEYS } from '../battle/fever.js';
import { Stickers } from './stickers.js';
import { Space } from './space.js';
import { Hold } from './hold.js';
import { Alerts } from './alerts.js';
import { sfx, spectrum } from '../core/audio.js';
import { SIGNS, ledCanvas } from './ledsign.js';
import { FeverGauge } from './feverfx.js';

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
// every HUD picture: boil (the lines wobble a little at 8 steps a second, like drawn animation), a light sweeping along the white
// outlines, tint, flash, a circle mask (portraits), a clip rect (fills)
const FRAG = `
uniform sampler2D map; uniform float a; uniform float time; uniform float boil; uniform float shine; uniform vec3 tint; uniform float tintK;
uniform float flash; uniform float circle; uniform float seed; uniform float recol; uniform float hueTo;
varying vec2 vUv;
float h1(float n){ return fract(sin(n) * 43758.5453); }
vec3 rgb2hsv(vec3 c){ vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0); vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r)); float d = q.x - min(q.w, q.y); float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x); }
vec3 hsv2rgb(vec3 c){ vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0); return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y); }
void main(){
  vec2 uv = vUv;
  float st = floor(time * 8.0) + seed * 13.0;
  uv += (vec2(h1(st), h1(st + 7.1)) - 0.5) * boil * 0.006;
  uv.x += sin(uv.y * 40.0 + st) * boil * 0.0012;
  if (circle > 0.0) { if (length(uv - 0.5) > circle) discard; }
  vec4 t = texture2D(map, uv);
  if (recol > 0.5) {   // the panel's own pink / violet (not the red of the P5 style) becomes the girl's colour
    vec3 h = rgb2hsv(t.rgb);
    float k = smoothstep(0.66, 0.70, h.x) * smoothstep(0.955, 0.935, h.x) * smoothstep(0.2, 0.35, h.y);
    t.rgb = mix(t.rgb, hsv2rgb(vec3(hueTo, h.y, h.z)), k);
  }
  vec3 c = mix(t.rgb, tint * (0.35 + 0.9 * dot(t.rgb, vec3(0.333))), tintK);
  float lum = min(min(t.r, t.g), t.b);
  float band = smoothstep(0.07, 0.0, abs(fract(uv.x * 0.9 + uv.y * 0.4 - time * 0.45 + seed) - 0.5));
  c += shine * band * smoothstep(0.7, 0.95, lum) * vec3(1.0, 0.75, 0.85);
  c = mix(c, vec3(1.0), flash);
  gl_FragColor = vec4(c, t.a * a);
}`;
// episode 2: the original's portrait colour (Clock Tower: calm blue, then yellow, orange, red as the stalker nears): a disc behind the chibi,
// its rim brighter, pulsing when she is right there
const PANIC_FRAG = `uniform vec3 col; uniform float a; uniform float time; varying vec2 vUv;
void main(){ float r = length(vUv - 0.5) * 2.0; float band = smoothstep(0.8, 0.86, r) * smoothstep(1.0, 0.95, r); if (band <= 0.0) discard;
  float glow = 0.75 + 0.25 * sin(atan(vUv.y - 0.5, vUv.x - 0.5) * 6.0 - time * 4.0);
  gl_FragColor = vec4(col * (0.8 + 0.4 * glow), a * band); }`;
const PANIC = [[0.25, 0.5, 0.95], [1.0, 0.86, 0.3], [1.0, 0.55, 0.18], [0.95, 0.12, 0.16]].map((c) => new THREE.Color(...c));
// bars: a fill with moving diagonal stripes and a lighter "just lost" chunk, in a rounded slot
const BAR_FRAG = `
uniform float fill; uniform float lag; uniform vec3 col; uniform vec3 col2; uniform float a; uniform float time; uniform float flash; uniform vec2 px;
varying vec2 vUv;
void main(){
  vec2 p = vUv * px; float r = px.y * 0.5;
  vec2 q = vec2(clamp(p.x, r, px.x - r), r);
  if (length(p - q) > r) discard;
  float x = vUv.x; vec3 c; float al = 1.0;
  if (x < fill) {
    float s = step(0.5, fract((p.x + p.y) / (px.y * 0.9) - time * 1.6));
    c = mix(col, col * 1.18 + 0.06, s * 0.5) * (0.85 + 0.3 * (1.0 - vUv.y));
    c += smoothstep(0.75, 1.0, 1.0 - vUv.y) * 0.25;
  } else if (x < lag) { c = col2; }
  else { c = vec3(0.23, 0.22, 0.23); al = 0.0; }
  c = mix(c, vec3(1.0), flash);
  gl_FragColor = vec4(c, a * (al > 0.0 ? 1.0 : 0.0));
}`;
// the skill ring: segments around the portrait, lit up to the charge; full = a light runs round; on = it spins and drains
const RING_FRAG = `
uniform float fill; uniform float r0; uniform float r1; uniform float segs; uniform float a0; uniform float a1; uniform vec3 col; uniform float a;
uniform float time; uniform float full; uniform float on;
varying vec2 vUv;
void main(){
  vec2 p = (vUv - 0.5) * 2.0; float r = length(p);
  if (r < r0 || r > r1) discard;
  float ang = atan(p.y, p.x);
  float span = a1 - a0, d = mod((ang - a0) * sign(span), 6.28319);
  if (d > abs(span)) discard;   // the gap (where her key tag sits)
  float u = d / abs(span);
  float k = fract(u * segs);
  if (k < 0.12 || k > 0.88) discard;
  float lit = step(u, fill);
  vec3 c = mix(vec3(0.86, 0.83, 0.85), col, lit);
  float run = smoothstep(0.08, 0.0, abs(fract(u - time * 0.7) - 0.5) - 0.42);
  c += (full + on) * run * 0.6;
  float edge = smoothstep(r1, r1 - 0.02, r) * smoothstep(r0, r0 + 0.02, r);
  gl_FragColor = vec4(c, a * edge);
}`;
// the reticle: one state picture, its middle and its outside turning their own ways (one drawing, two motions)
const RET_FRAG = `
uniform sampler2D map; uniform float a; uniform float rin; uniform float rout; uniform float split; uniform float flash; uniform float time;
varying vec2 vUv;
vec2 rot(vec2 p, float r){ float c = cos(r), s = sin(r); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
void main(){
  vec2 p = vUv - 0.5;
  float r = length(p);
  vec2 q = 0.5 + rot(p, r < split ? rin : rout);
  vec4 t = texture2D(map, q);
  float glow = smoothstep(0.02, 0.0, abs(fract(atan(p.y, p.x) / 6.2832 - time * 0.6) - 0.5) - 0.46) * step(split, r);
  vec3 c = t.rgb + glow * 0.35 * t.a + flash;
  gl_FragColor = vec4(c, t.a * a);
}`;


// the reticle, drawn (docs/DESIGN.md「准星精简」, user 2026-10-20: the pictures were too big and hid what she aimed at): four corner
// brackets and a dot - almost nothing in the middle - with her ears on top (the cat girl's cat ears, the gun girl's bunny ears); over
// something she can hit it closes in to a small square (the gun girl) or triangle (the cat girl). Drawn twice: a dark outline, then the
// line itself inverting what is behind it (RET_INV: always the strongest contrast).
const RETV_FRAG = `
uniform float shape; uniform float ears; uniform float thick; uniform float corner; uniform float rot; uniform float a; uniform vec3 col;
uniform float grow; uniform float dotR; uniform float ring; uniform float dash; uniform float time; uniform float earK;
uniform sampler2D map; uniform float useMap; uniform float ph; uniform float rgb; uniform float fxK;
varying vec2 vUv;
float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
float ell(vec2 p, vec2 c, vec2 r){ vec2 q = (p - c) / r; return abs(length(q) - 1.0) * min(r.x, r.y); }
void main(){
  vec2 p0 = (vUv - 0.5) * 2.0;
  float c = cos(rot), s = sin(rot); vec2 p = mat2(c, -s, s, c) * p0;
  float R = 0.5, d = 1e3;
  if (useMap > 0.5) {
    // the picture's lines (its alpha), turned with it; the dark edge: the alpha spread out by grow (uv)
    vec2 uv = p * 0.5 + 0.5; float al = texture2D(map, uv).a;
    if (grow > 0.0) for (int i = 0; i < 12; i++) { float an = float(i) * 0.5236; al = max(al, texture2D(map, uv + vec2(cos(an), sin(an)) * grow).a); }
    if (ring > 0.0) { float rr = abs(length(p0) - 0.86), an = atan(p0.y, p0.x) + time * 2.0; float w = 0.012 + grow * 2.0;
      if (dash < 0.5 || fract(an / 6.2832 * 14.0) < 0.55) al = max(al, (1.0 - smoothstep(w, w + 0.02, rr)) * ring); }
    if (al * a < 0.004) discard;
    // (metal: lighter on top, darker below; now and then a bright band sweeps across it and it glows - user 2026-10-20)
    float sw = fract(time * 0.28 + ph), band = smoothstep(0.16, 0.0, abs((p0.x - p0.y) * 0.5 - (sw * 3.2 - 1.6))) * fxK;
    vec3 cc = mix(col * (0.8 + 0.3 * (p0.y * 0.5 + 0.5)), vec3(1.0), band * 0.85) * (1.0 + band * 0.6);
    if (rgb * fxK > 0.0) {   // (its colours split apart: a slow sway, and a quick glitchy jolt now and then)
      float j = step(0.9, fract(sin(floor(time * 9.0 + ph * 7.0) * 91.7) * 4375.85)), o = rgb * fxK * (0.4 + 0.6 * sin(time * 1.3 + ph * 6.0) + j * 2.5);
      vec2 dd = vec2(cos(time * 0.7), sin(time * 0.7)) * o;
      vec3 ch = vec3(texture2D(map, uv + dd).a, al, texture2D(map, uv - dd).a); float am = max(ch.r, max(ch.g, ch.b));
      gl_FragColor = vec4(cc * ch * a, am * a); return;
    }
    gl_FragColor = vec4(cc * al * a, al * a); return;
  }
  if (shape < 0.5) {
    for (int i = 0; i < 4; i++) {
      vec2 sg = vec2((i == 0 || i == 3) ? -1.0 : 1.0, i < 2 ? 1.0 : -1.0), cn = sg * R;
      d = min(d, seg(p, cn, cn - vec2(sg.x * corner * R, 0.0)));
      d = min(d, seg(p, cn, cn - vec2(0.0, sg.y * corner * R)));
    }
  } else {
    vec2 v0 = vec2(0.0, R * 1.1), v1 = vec2(-R * 0.98, -R * 0.62), v2 = vec2(R * 0.98, -R * 0.62);
    float k = corner * 0.5;
    d = min(d, seg(p, v0, mix(v0, v1, k))); d = min(d, seg(p, v0, mix(v0, v2, k)));
    d = min(d, seg(p, v1, mix(v1, v0, k))); d = min(d, seg(p, v1, mix(v1, v2, k)));
    d = min(d, seg(p, v2, mix(v2, v0, k))); d = min(d, seg(p, v2, mix(v2, v1, k)));
  }
  d = min(d, max(length(p0) - dotR, 0.0));
  if (ring > 0.0) {   // reload / Fever / special: a dashed ring round it, turning
    float rr = abs(length(p0) - 0.78), an = atan(p0.y, p0.x) + time * 2.0;
    if (dash < 0.5 || fract(an / 6.2832 * 12.0) < 0.55) d = min(d, rr + (1.0 - ring) * 0.2);
  }
  // her ears on top of it (not turning with it)
  vec2 q = p0 - vec2(0.0, R * (1.0 + 0.04 * earK));
  if (ears > 0.5 && ears < 1.5) {
    d = min(d, seg(q, vec2(-0.36, 0.02), vec2(-0.28, 0.26))); d = min(d, seg(q, vec2(-0.28, 0.26), vec2(-0.14, 0.04)));
    d = min(d, seg(q, vec2(0.36, 0.02), vec2(0.28, 0.26)));  d = min(d, seg(q, vec2(0.28, 0.26), vec2(0.14, 0.04)));
  } else if (ears > 1.5) {
    float tilt = 0.12 * sin(time * 2.0) * earK;
    d = min(d, ell(q, vec2(-0.16 - tilt, 0.24), vec2(0.07, 0.22)));
    d = min(d, ell(q, vec2(0.16 + tilt * 0.6, 0.26), vec2(0.07, 0.24)));
  }
  float w = thick + grow;
  float al = 1.0 - smoothstep(w, w + 0.025, d);
  if (al * a < 0.004) discard;
  gl_FragColor = vec4(col * al * a, al * a);
}`;
// the light round her drawn reticle (user 2026-10-20, two pictures to go by: a sound visualizer's glowing line for the cat girl, a ring
// of light pillars rising for the gun girl - "not a new shape: effects, particles, light, RGB changes"). Drawn under the line, adding
// light: its lines spread into a soft glow, a light running along them, sparks drifting off them; the cat girl's: thin bars hanging
// from her lines like a spectrum, moving with what the speakers play (audio.js spectrum), a thin flare across her middle; the gun girl's: pillars of light rising from her lines in shifting colours, an RGB-split glow. Its quad is span times the
// picture's (room for the light), the picture turned with the reticle; screen-down is down for the bars and pillars.
const RETG_FRAG = `
uniform sampler2D map; uniform float rot; uniform float a; uniform float time; uniform float ph; uniform float who;
uniform float span; uniform vec3 tint; uniform float tintK; uniform float spec[16]; uniform float level;
varying vec2 vUv;
float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float L(vec2 q0){ float c = cos(rot), s = sin(rot); vec2 uv = (mat2(c, -s, s, c) * q0) * 0.5 + 0.5;
  return (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) ? 0.0 : texture2D(map, uv).a; }
float sp(float i){ float r = 0.0; for (int k = 0; k < 16; k++) if (float(k) == i) r = spec[k]; return r; }
float halo(vec2 p, float rad){ float h = 0.0; for (int i = 0; i < 10; i++) { float an = float(i) * 0.6283; vec2 d = vec2(cos(an), sin(an));
  h += L(p + d * rad * 0.45) * 0.55 + L(p + d * rad) * 0.45; } return h / 10.0; }
void main(){
  vec2 p0 = (vUv - 0.5) * 2.0 * span;
  float breath = 0.78 + 0.22 * sin(time * 1.7 + ph * 6.0);
  float ang = atan(p0.y, p0.x), r = length(p0);
  vec3 c = vec3(0.0);
  // sparks drifting off the lines (cells; each a point that twinkles now and then)
  vec2 gq = (p0 + vec2(0.0, -time * (who > 0.5 ? 0.22 : 0.1))) * 13.0, id = floor(gq), f = fract(gq) - 0.5;
  float rs = h2(id), sd = length(f - (vec2(h2(id + 1.3), h2(id + 2.7)) - 0.5) * 0.7);
  float spark = smoothstep(0.09, 0.0, sd) * pow(0.5 + 0.5 * sin(time * (3.0 + rs * 5.0) + rs * 40.0), 10.0) * step(0.55, rs);
  if (who < 0.5) {
    // the cat girl: her lines glow deep blue, a cyan-white bar of light sweeps across them
    float hal = halo(p0, 0.075);
    float sx = (p0.x - (fract(time * 0.32 + ph) * 3.0 - 1.5) * span) * 3.2, sweep = exp(-sx * sx);
    // the spectrum: thin bars hanging from her lines (low pitches in her middle, high ones out at the sides), a few short ones rising
    float N = 44.0, xc = (floor((p0.x / span * 0.5 + 0.5) * N) + 0.5) / N, cx = (xc * 2.0 - 1.0) * span;
    float bi = min(15.0, floor(abs(xc - 0.5) * 2.0 * 16.0));
    float hb = 0.05 + sp(bi) * 0.42 + 0.07 * h1(xc * 91.0 + floor(time * 12.0));
    float stripe = smoothstep(0.32, 0.08, abs(fract((p0.x / span * 0.5 + 0.5) * N) - 0.5)), bar = 0.0;
    for (int k = 1; k <= 8; k++) { float d = hb * float(k) / 8.0; bar = max(bar, L(vec2(cx, p0.y + d)) * (1.0 - float(k) / 9.0));
      bar = max(bar, L(vec2(cx, p0.y - d * 0.35)) * (1.0 - float(k) / 9.0) * 0.6); }
    bar *= stripe * (1.0 - L(p0));
    // a thin flare across her middle, the aim point itself left clear
    float flare = exp(-abs(p0.y) * 90.0) * exp(-abs(p0.x) * 1.6) * smoothstep(0.1, 0.32, abs(p0.x)) * (0.12 + level * 0.5);
    c = vec3(0.12, 0.38, 1.0) * hal * 1.3 * breath + vec3(0.55, 0.88, 1.0) * hal * sweep * 1.6
      + vec3(0.45, 0.8, 1.0) * bar * 0.75 + vec3(0.6, 0.9, 1.0) * flare
      + vec3(0.85, 0.95, 1.0) * spark * smoothstep(0.0, 0.08, halo(p0, 0.22)) * 1.4;
  } else {
    // the gun girl: an RGB-split glow, its colours running round her (pink most of all)
    vec2 o = vec2(cos(time * 0.9), sin(time * 0.9)) * 0.02;
    vec3 hal = vec3(halo(p0 + o, 0.07), halo(p0, 0.07), halo(p0 - o, 0.07));
    vec3 hue = 0.5 + 0.5 * cos(6.2832 * (ang / 6.2832 + time * 0.12 + vec3(0.0, 0.33, 0.67)));
    hue = mix(hue, vec3(1.0, 0.42, 0.8), 0.45);
    // a light running round along her lines
    float da = abs(mod(ang - time * 2.2 - ph * 6.0 + 3.1416, 6.2832) - 3.1416), run = exp(-da * da * 5.0);
    // pillars of light rising from her lines, each its own colour and height, flickering
    float N = 38.0, col = floor((p0.x / span * 0.5 + 0.5) * N), xc = (col + 0.5) / N, cx = (xc * 2.0 - 1.0) * span;
    float tk = floor(time * 7.0 + h1(col) * 3.0), hp = 0.06 + 0.3 * h1(col * 7.3 + tk) * step(0.35, h1(col * 3.1 + floor(time * 1.3))) + level * 0.18;
    float stripe = smoothstep(0.34, 0.1, abs(fract((p0.x / span * 0.5 + 0.5) * N) - 0.5)), pil = 0.0;
    for (int k = 1; k <= 8; k++) { float d = hp * float(k) / 8.0; pil = max(pil, L(vec2(cx, p0.y - d)) * pow(1.0 - float(k) / 9.0, 1.5)); }
    pil *= stripe * (1.0 - L(p0));
    float pk = h1(col * 13.7);
    vec3 pc = pk < 0.35 ? vec3(1.0, 0.4, 0.78) : pk < 0.6 ? vec3(0.45, 0.75, 1.0) : pk < 0.82 ? vec3(0.75, 0.45, 1.0) : vec3(1.0, 0.95, 1.0);
    c = hal * hue * 1.25 * breath + vec3(1.0, 0.85, 0.95) * hal.g * run * 1.5 + pc * pil * 0.9
      + mix(vec3(1.0, 0.6, 0.9), vec3(1.0), rs) * spark * smoothstep(0.0, 0.08, halo(p0, 0.22)) * 1.4;
  }
  c *= 1.0 - L(p0) * 0.9;   // (not under the line itself: the gun girl's line inverts what is behind it, and must stay white)
  c = mix(c, tint * dot(c, vec3(0.35, 0.45, 0.2)) * 1.6, tintK) * a;
  gl_FragColor = vec4(c, 1.0);
}`;
const quad = new THREE.PlaneGeometry(1, 1);
const RED = new THREE.Color('#d8141e'), WHITE = new THREE.Color(1, 1, 1);

function mat(frag, u, opts = {}) {
  return new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: frag, transparent: true, depthTest: false, depthWrite: false, ...opts });
}
export function picture(key, order, seed = 0) {
  const u = { map: { value: tex[key] || null }, a: { value: 1 }, time: { value: 0 }, boil: { value: 1 }, shine: { value: 0 },
    tint: { value: new THREE.Color(1, 1, 1) }, tintK: { value: 0 }, flash: { value: 0 }, circle: { value: 0 }, seed: { value: seed },
    recol: { value: 0 }, hueTo: { value: 0 } };
  const m = new THREE.Mesh(quad, mat(FRAG, u)); m.renderOrder = order; m.frustumCulled = false; m.visible = !!(key && tex[key]);
  return m;
}
function recolor(m, col) { const h = {}; col.getHSL(h); m.material.uniforms.recol.value = 1; m.material.uniforms.hueTo.value = h.h; }

// ---- text drawn into a canvas (P5 lettering: heavy italic, black outline, offset shadow), redrawn only when it changes
const FONT = '"Noto Sans SC", "Microsoft YaHei", sans-serif';
export class Text {
  constructor(order, style = {}) {
    this.st = { color: '#fff', stroke: '#121012', sw: 0.16, shadow: null, italic: true, weight: 900, align: 'center', ...style };
    this.c = document.createElement('canvas'); this.g = this.c.getContext('2d');
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace;
    const u = { map: { value: this.t }, a: { value: 1 }, time: { value: 0 }, boil: { value: 0 }, shine: { value: 0 }, tint: { value: new THREE.Color(1, 1, 1) },
      tintK: { value: 0 }, flash: { value: 0 }, circle: { value: 0 }, seed: { value: 0 }, recol: { value: 0 }, hueTo: { value: 0 } };
    this.m = new THREE.Mesh(quad, mat(FRAG, u)); this.m.renderOrder = order; this.m.frustumCulled = false;
    this.str = null; this.px = 0; this.pop = 0;
  }
  // the text filling a box h screen px tall (its glyphs about that tall), shrunk to fit maxW when it is longer
  set(str, h, color, maxW = 0) {
    str = String(str); h = Math.max(6, Math.round(h)); maxW = Math.round(maxW);
    if (color && color !== this.st.color) { this.st.color = color; this.str = null; }
    if (this.st.shadow !== this.drawnShadow) { this.drawnShadow = this.st.shadow; this.str = null; }
    if (str === this.str && h === this.px && maxW === this.mw) return false;
    this.str = str; this.px = h; this.mw = maxW;
    const S = this.st, g = this.g;
    let fs = h * 1.08;
    g.font = `${S.italic ? 'italic ' : ''}${S.weight} ${fs}px ${FONT}`;
    const tw = g.measureText(str).width;
    if (maxW && tw > maxW) fs *= maxW / tw;
    const pad = Math.ceil(fs * (0.2 + S.sw));
    g.font = `${S.italic ? 'italic ' : ''}${S.weight} ${fs}px ${FONT}`;
    const w = Math.ceil(g.measureText(str).width) + pad * 2 + fs * 0.2;
    const hh = Math.ceil(fs * 1.2) + pad * 2;
    if (w !== this.c.width || hh !== this.c.height) {   // a new size needs a new texture (its storage is fixed once uploaded)
      this.t.dispose(); this.c.width = w; this.c.height = hh;
      this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.m.material.uniforms.map.value = this.t;
    }
    else g.clearRect(0, 0, w, hh);
    g.font = `${S.italic ? 'italic ' : ''}${S.weight} ${fs}px ${FONT}`;
    g.textBaseline = 'middle'; g.textAlign = 'center'; g.lineJoin = 'round';
    const x = this.c.width / 2, y = this.c.height / 2;
    if (S.shadow) { g.fillStyle = S.shadow; g.strokeStyle = S.shadow; g.lineWidth = fs * S.sw * 2; g.strokeText(str, x + fs * 0.07, y + fs * 0.07); g.fillText(str, x + fs * 0.07, y + fs * 0.07); }
    if (S.stroke) { g.strokeStyle = S.stroke; g.lineWidth = fs * S.sw * 2; g.strokeText(str, x, y); }
    g.fillStyle = S.color; g.fillText(str, x, y);
    this.t.needsUpdate = true;
    this.w = this.c.width / this.c.height;
    return true;
  }
  // centre (screen px, y up), rotation, extra scale (the canvas is drawn at screen size: 1 canvas px = 1 screen px)
  at(x, y, deg = 0, s = 1) {
    const k = s * (1 + this.pop * 0.35);
    this.m.scale.set(this.c.width * k, this.c.height * k, 1);
    this.m.position.set(x, y, 0); this.m.rotation.z = deg * Math.PI / 180;
  }
}

// ---- layout: mockup pixels -> screen pixels (y up), anchored to a side of the HUD frame
class Layout {
  set(W, H, frame, k = 1) { this.W = W; this.H = H; this.f = frame || { x: 0, w: W }; this.s = H / 941 * k; }   // k: the HUD's own scale (battle.json scale)
  x(x, an) {
    const f = this.f, s = this.s;
    if (an === 'tr' || an === 'br') return f.x + f.w - (1672 - x) * s;
    if (an === 'tc' || an === 'bc') return f.x + f.w / 2 + (x - 836) * s;
    return f.x + x * s;
  }
  y(y, an) { return an && an[0] === 'b' ? (941 - y) * this.s : this.H - y * this.s; }
  // (anchors: tl / tc / tr keep the distance to the top edge, bl / bc / br to the bottom edge; l / c / r to the left / middle / right)
  // a mesh over a mockup box (centre, size), optional extra scale about the box centre
  box(m, b, an, k = 1, deg = 0) {
    const cx = this.x((b[0] + b[2]) / 2, an), cy = this.y((b[1] + b[3]) / 2, an);
    m.position.set(cx, cy, 0); m.scale.set((b[2] - b[0]) * this.s * k, (b[3] - b[1]) * this.s * k, 1); m.rotation.z = deg * Math.PI / 180;
    return [cx, cy];
  }
}

// chibi expressions (tools/job_specs35.py EXPR1 / EXPR2 order): which ones each state picks from
const FACES = {
  idle: [1, 18, 24], shoot: [2, 3, 24], cover: [15, 16, 22], reload: [10], empty: [11], hurt: [4, 20], cry: [5, 20], combo: [6, 23],
  fever: [7, 23], ready: [8], skill: [9, 7], run: [13, 14], down: [12], victory: [17, 18], angry: [19],
};

// ---------------------------------------------------------------- one girl's panel
class Panel {
  constructor(hud, p) {
    this.hud = hud; this.p = p; this.slot = p.slot;
    // each side keeps the mockup's own panel; its pink / violet is turned into the colour of the girl standing there (the team can be
    // swapped on the select screen), and her own ammo is drawn on it (magazine ticks for the gun, talismans for the cat girl)
    this.cat = p.w.kind === 'mantra';
    const side = p.slot ? 'p2' : 'p1';
    const B = hud.B, D = this.D = B[side], an = this.an = D.anchor, g = hud.g, col = this.col = new THREE.Color(p.c.color);
    this.lay = B.layers[p.slot ? 'right' : 'left'];
    this.layer = picture(this.lay.img || `ui/hud_${p.slot ? 'right' : 'left'}`, 61, p.slot * 0.37);
    recolor(this.layer, col);
    this.face = picture(`ui/chibi_${this.who()}_1`, 62, 0.2); this.face.material.uniforms.circle.value = 0.5; this.face.material.uniforms.boil.value = 0;
    this.panicM = new THREE.Mesh(quad, mat(PANIC_FRAG, { col: { value: PANIC[0].clone() }, a: { value: 0 }, time: { value: 0 } }));
    this.panicM.renderOrder = 62.4; this.panicM.frustumCulled = false; g.add(this.panicM);
    this.ring = new THREE.Mesh(quad, mat(RING_FRAG, { fill: { value: 0 }, r0: { value: 0 }, r1: { value: 1 }, segs: { value: D.ring.segs },
      a0: { value: D.ring.from * Math.PI / 180 }, a1: { value: D.ring.to * Math.PI / 180 }, col: { value: col.clone() }, a: { value: 1 }, time: { value: 0 },
      full: { value: 0 }, on: { value: 0 } }));
    this.ring.renderOrder = 63; this.ring.frustumCulled = false;
    this.hp = new THREE.Mesh(quad, mat(BAR_FRAG, { fill: { value: 1 }, lag: { value: 1 }, col: { value: col.clone() }, col2: { value: new THREE.Color(1, 0.92, 0.95) },
      a: { value: 1 }, time: { value: 0 }, flash: { value: 0 }, px: { value: new THREE.Vector2(100, 10) } }));
    this.hp.renderOrder = 62; this.hp.frustumCulled = false;
    this.heart = D.hp.heart ? picture(this.cat ? 'ui/hud_ic_heart2' : 'ui/hud_ic_heart', 64, 0.5) : null;
    this.t = {
      tag: new Text(65), name: new Text(65), lv: new Text(65), hp: new Text(65, { sw: 0.12 }),
      key: new Text(65, { color: '#121012', stroke: null, italic: false }), ammo: new Text(65, { shadow: '#d8141e', sw: 0.14 }), ammoMax: new Text(65, { sw: 0.14 }),
    };
    // her special is ready: a badge stamped over her ring until she uses it (DESIGN「必杀」: you must see it at once)
    this.rdy = new Text(66, { color: '#ffffff', shadow: '#d8141e', sw: 0.16 }); this.rdyK = new Text(66, { color: '#fff36a', sw: 0.18 });
    this.rdy.m.visible = this.rdyK.m.visible = false; this.rdyT = 0; this.wasReady = false;
    // Fever: three gauges of six segments, each with its icon, label and level; each kind its own look (feverfx.js)
    this.fv = FEVER_KEYS.map((k, i) => {
      const F = D.fever[i], c = new THREE.Color(B.colors.fever[k]);
      const icon = F.icon ? picture(`ui/hud_ic_${['flame', 'aim', 'chain'][i]}`, 64, i * 0.3) : null;   // the new panels have the icons in their art
      return { k, F, c, icon, gauge: new FeverGauge(k, F, c), label: new Text(65, { color: B.colors.fever[k], sw: 0.18 }), lv: new Text(65, { sw: 0.16 }), lvN: -1, up: 0 };
    });
    // ammo: her 40-round magazine as ticks along the slab's curve, or the cat girl's 8 talismans
    this.ammoIcon = !this.cat && D.ammo.icon ? picture('ui/hud_ic_bullets', 64, 0.8) : null;
    const n = p.w.mag;
    this.ticks = [];
    if (!this.cat) for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(quad, new THREE.MeshBasicMaterial({ color: col, transparent: true, depthTest: false, depthWrite: false }));
      m.renderOrder = 63; m.frustumCulled = false; this.ticks.push(m);
    } else {
      const set = B.talisman;
      this.tali = { ready: `ui/talisman_${set}_ready`, spent: `ui/talisman_${set}_spent`, glow: `ui/talisman_${set}_glow` };
      for (let i = 0; i < n; i++) this.ticks.push(picture(this.tali.ready, 63, i * 0.21));
    }
    for (const m of [this.layer, this.face, this.ring, this.hp, this.heart, this.ammoIcon, ...this.ticks, ...Object.values(this.t).map((x) => x.m),
      ...this.fv.flatMap((f) => [f.icon, ...f.gauge.meshes, f.label.m, f.lv.m]), this.rdy.m, this.rdyK.m]) if (m) g.add(m);
    this.last = {}; this.lag = 1; this.shake = 0; this.faceKey = ''; this.faceT = 0; this.faceHold = 0; this.event = null; this.lastCombo = 0;
  }
  who() { return this.cat ? 'cat' : 'pink'; }
  // an event face for a while (hurt, combo up ...), else the state's face
  react(kind, hold = 1.2) { if (FACES[kind]) { this.event = kind; this.faceHold = hold; this.faceT = 0; } }
  pickFace(kind) {
    const list = FACES[kind] || FACES.idle;
    let n = list[Math.floor(Math.random() * list.length)];
    if (`ui/chibi_${this.who()}_${n}` === this.faceKey && list.length > 1) n = list[(list.indexOf(n) + 1) % list.length];
    const key = `ui/chibi_${this.who()}_${n}`;
    if (key !== this.faceKey && tex[key]) { this.faceKey = key; this.face.material.uniforms.map.value = tex[key]; this.facePop = 1; }
  }
  layout() {
    const L = this.hud.L, D = this.D, an = this.an, s = L.s;
    L.box(this.layer, this.lay.box, this.lay.anchor);
    const pc = D.portrait.c, pr = D.portrait.r * 1.32;   // the chibi's own round frame lies outside the white disc: masked off
    const disc = D.portrait.r * 1.1;
    L.box(this.face, [pc[0] - pr, pc[1] - pr, pc[0] + pr, pc[1] + pr], an);
    const pd = disc * 1.22; L.box(this.panicM, [pc[0] - pd, pc[1] - pd, pc[0] + pd, pc[1] + pd], an);
    this.face.material.uniforms.circle.value = disc / (2 * pr);
    const rc = D.ring.c, rr = D.ring.r1 + 2;
    L.box(this.ring, [rc[0] - rr, rc[1] - rr, rc[0] + rr, rc[1] + rr], an);
    this.ring.material.uniforms.r0.value = D.ring.r0 / rr; this.ring.material.uniforms.r1.value = D.ring.r1 / rr;
    L.box(this.hp, D.hp.box, an); this.hp.material.uniforms.px.value.set((D.hp.box[2] - D.hp.box[0]) * s, (D.hp.box[3] - D.hp.box[1]) * s);
    if (this.heart) L.box(this.heart, D.hp.heart, an);
    this.fv.forEach((f) => { if (f.icon) L.box(f.icon, f.F.icon, an); f.gauge.layout(L, an); });
    if (this.ammoIcon) L.box(this.ammoIcon, D.ammo.icon, an);
    // magazine ticks along the curve through three points; talismans in a row
    if (!this.cat) {
      const [p0, p1, p2] = D.ammo.ticks, n = this.ticks.length;
      this.ticks.forEach((m, i) => {
        const u = n > 1 ? i / (n - 1) : 0, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
        const x = a * p0[0] + b * p1[0] + c * p2[0], y = a * p0[1] + b * p1[1] + c * p2[1];
        const dy = 2 * (1 - u) * (p1[1] - p0[1]) + 2 * u * (p2[1] - p1[1]), dx = 2 * (1 - u) * (p1[0] - p0[0]) + 2 * u * (p2[0] - p1[0]);
        L.box(m, [x - D.ammo.tick[0] / 2, y - D.ammo.tick[1] / 2, x + D.ammo.tick[0] / 2, y + D.ammo.tick[1] / 2], an, 1, -Math.atan2(dy, dx) * 180 / Math.PI - 8);
      });
    } else {
      const R = D.ammo.row, n = this.ticks.length, [tw, th] = D.ammo.talisman;
      this.ticks.forEach((m, i) => {
        const x = R[0] + tw / 2 + (R[2] - R[0] - tw) * (n > 1 ? i / (n - 1) : 0), y = (R[1] + R[3]) / 2 - Math.sin((i / (n - 1)) * Math.PI) * 4;
        L.box(m, [x - tw / 2, y - th / 2, x + tw / 2, y + th / 2], an, 1, (i - (n - 1) / 2) * 2.5);
      });
    }
  }
  text(name, str, color, k = 1, maxW) {
    const L = this.hud.L, T = this.D.text[name], t = this.t[name], b = T.box;
    if (t.str !== null && String(str) !== t.str) t.pop = 1;
    t.set(str, (b[3] - b[1]) * L.s * k, color, (maxW ?? (b[2] - b[0]) * 1.2) * L.s * k);
    const [cx, cy] = [L.x((b[0] + b[2]) / 2, this.an), L.y((b[1] + b[3]) / 2, this.an)];
    t.at(cx, cy, T.deg, 1);
  }
  update(dt, t) {
    const p = this.p, g = this.hud.game, L = this.hud.L, s = L.s, last = this.last;
    const on = p.slot === 0 || g.p2on();
    for (const m of this.meshes()) m.visible = on && !(m.material.uniforms?.map && !m.material.uniforms.map.value);
    if (!on) { this.fv.forEach((f) => f.gauge.hide()); return; }
    const down = p.state === 'down';
    // shake when hit
    this.shake = Math.max(0, this.shake - dt * 3);
    const hp = Math.max(0, p.hp / p.maxHp);
    if (last.hp !== undefined && p.hp < last.hp - 0.5) { this.shake = 1; this.hp.material.uniforms.flash.value = 0.8; this.react(p.hp / p.maxHp < 0.3 ? 'cry' : 'hurt', 1.1); }
    last.hp = p.hp;
    this.lag += (hp - this.lag) * Math.min(1, dt * 2.2); if (this.lag < hp) this.lag = hp;
    const HU = this.hp.material.uniforms;
    HU.fill.value = hp; HU.lag.value = this.lag; HU.time.value = t; HU.flash.value = Math.max(0, HU.flash.value - dt * 4);
    HU.col.value.copy(hp < 0.3 && Math.sin(t * 14) > 0 ? RED : this.col);
    // the whole panel nudges when she takes a hit
    const sx = this.shake * Math.sin(t * 70) * s * 6;
    // her portrait's colour while she is about (episode 2, src/battle/chase.js panic)
    { const ch = this.hud.game.chase, PU = this.panicM.material.uniforms, k = ch?.panic || 0, vis = ch && (ch.she || ch.mode);
      PU.a.value += ((vis ? 0.9 : 0) - PU.a.value) * Math.min(1, dt * 3);
      const f = Math.min(2.999, k * 3), i = Math.floor(f); PU.col.value.copy(PANIC[i]).lerp(PANIC[i + 1], f - i);
      PU.time.value = t; if (k > 0.8) PU.col.value.multiplyScalar(0.85 + 0.3 * Math.abs(Math.sin(t * 9))); this.panicM.visible = PU.a.value > 0.01; }
    // skill ring
    const RU = this.ring.material.uniforms;
    RU.fill.value = p.activeOn ? p.activeT / p.a.dur : p.charge; RU.time.value = t; RU.full.value = p.charge >= 1 && !p.activeOn ? 1 : 0; RU.on.value = p.activeOn ? 1 : 0;
    // the ready badge on her own side (a player's girl only: the AI fires hers by herself): stamped in with a sound, then it keeps
    // bouncing; her figure shows it too (afterimages, heroine.js setReady). No prompt in the middle: with two players it says nobody's
    const kind = p.ctrl?.kind, ready = p.charge >= 1 && !p.activeOn && g.combat && !!kind && kind !== 'ai' && p.state !== 'down';
    if (ready && !this.wasReady) { this.rdyT = 0; sfx.stamp(); }
    this.wasReady = ready;
    this.rdy.m.visible = this.rdyK.m.visible = ready;
    if (ready) {
      this.rdyT += dt;
      const rc = this.D.ring.c, dir = p.slot ? -1 : 1, deg = -7 * dir;
      const x = L.x(rc[0] + dir * 56, this.an), y = L.y(rc[1] - this.D.ring.r1 - 56, this.an);
      const pop = this.rdyT < 0.16 ? 2 - this.rdyT / 0.16 : 1 + 0.07 * Math.sin(t * 9);
      this.rdy.set({ zh: '必杀 OK!', ja: '必殺 OK!', en: 'SKILL OK!' }[lang] || 'SKILL OK!', 54 * s, '#ffffff', 360 * s);
      this.rdy.at(x, y, deg, pop);
      this.rdy.m.material.uniforms.flash.value = this.rdyT < 0.2 ? 1 - this.rdyT / 0.2 : Math.sin(t * 9) > 0.92 ? 0.35 : 0;
      const key = kind === 'pad' ? 'Y / RB' : kind === 'keys' ? 'Backspace' : ({ zh: '▶ 右键发动', ja: '▶ 右クリック', en: '▶ RIGHT CLICK' }[lang] || '▶ RIGHT CLICK');
      this.rdyK.set(key, 30 * s, '#fff36a', 360 * s);
      this.rdyK.at(x + dir * 10 * s, y - 50 * s, deg, 1);
    }
    // texts
    this.text('tag', p.slot ? '2P' : '1P');
    const nb = this.D.text.name.box, lb = this.D.text.lv.box;
    this.text('name', tr(p.c.name), undefined, 1, (lb[0] - nb[0]) * 0.95);
    this.text('lv', `Lv${p.lv}`);
    this.text('hp', `${Math.ceil(p.hp)} / ${p.maxHp}`);
    const k = p.ctrl?.kind;
    // who plays her: the AI, or a player - 1P / 2P (user 2026-10-19: not the skill's button; that is in the SKILL OK badge)
    this.text('key', k === 'ai' ? 'AI' : p.slot ? '2P' : '1P', '#121012', 0.62);
    for (const tx of Object.values(this.t)) tx.pop = Math.max(0, tx.pop - dt * 5);
    // ammo
    const inf = p.gatling || p.beaming, n = this.ticks.length;
    const ammoStr = inf ? '∞' : `${p.ammo}`;
    last.ammo = ammoStr;
    this.text('ammo', ammoStr, inf ? '#fff36a' : p.ammo <= Math.max(1, p.w.mag * 0.2) ? '#ff3a4a' : '#ffffff', inf ? 1.15 : 1);
    this.text('ammoMax', inf ? '' : `/${p.w.mag}`);
    const reload = p.state === 'reload', rk = reload ? 1 - p.reloadT / (p.reloadT0 || 1) : 0;
    this.ticks.forEach((m, i) => {
      const full = inf || (reload ? i < n * rk : i < p.ammo);
      if (!this.cat) {
        m.material.color.copy(full ? (inf ? WHITE.clone().lerp(this.col, 0.5 + 0.5 * Math.sin(t * 20 - i * 0.6)) : this.col) : new THREE.Color(0.2, 0.19, 0.2));
        m.material.opacity = full ? 1 : 0.9;
      } else {
        const key = inf ? this.tali.glow : full ? this.tali.ready : this.tali.spent;
        m.material.uniforms.map.value = tex[key]; m.material.uniforms.time.value = t;
        m.material.uniforms.shine.value = inf ? 1 : 0;
        m.material.uniforms.a.value = full ? 1 : 0.85;
      }
    });
    // Fever gauges: the segments (feverfx.js: their own look, flaring where they rise), level text, a pop on level-up
    this.fv.forEach((f) => {
      const lv = p.fever.level(f.k), v = p.fever.v[f.k], max = T.fever.maxLevel, lvUp = lv > f.lvN && f.lvN >= 0;
      if (lvUp) { f.up = 1; if (lv >= max) this.react('fever', 1.4); }
      f.lvN = lv; f.up = Math.max(0, f.up - dt * 2.5);
      f.gauge.update(dt, t, { lv, v, max, up: f.up, lvUp });
      const F = f.F;
      f.label.set(tr(C.text.feverLabel[f.k]), (F.label[3] - F.label[1]) * s * 0.8, undefined, (F.label[2] - F.label[0]) * s * 1.2);
      f.label.at(L.x((F.label[0] + F.label[2]) / 2, this.an), L.y((F.label[1] + F.label[3]) / 2, this.an), -4, 1 + f.up * 0.3);
      f.lv.set(lv >= max ? 'MAX' : `Lv${lv}`, (F.lv[3] - F.lv[1]) * s * 0.75, lv >= max ? '#fff36a' : '#ffffff', (F.lv[2] - F.lv[0]) * s * 1.1);
      f.lv.at(L.x((F.lv[0] + F.lv[2]) / 2, this.an), L.y((F.lv[1] + F.lv[3]) / 2, this.an), -4, 1 + f.up * 0.3);
      if (f.icon) { f.icon.material.uniforms.time.value = t; f.icon.scale.multiplyScalar(1 + f.up * 0.35 + (lv >= max ? 0.06 * Math.sin(t * 8) : 0)); }
    });
    // combo-up reactions
    const step = T.combat.comboCall || 50;
    if (g.combo > this.lastCombo && Math.floor(g.combo / step) > Math.floor(this.lastCombo / step)) this.react('combo', 1.2);
    this.lastCombo = g.combo;
    // the face: an event for a while, else what she is doing (and now and then another face of the same mood)
    this.faceHold -= dt; this.faceT -= dt;
    const mood = down ? 'down' : this.faceHold > 0 && this.event ? this.event : p.state === 'run' ? 'run' : p.state === 'victory' ? 'victory'
      : p.activeOn ? 'skill' : p.charge >= 1 ? 'ready' : p.state === 'reload' ? 'reload' : p.ammo <= 0 && !inf ? 'empty'
      : p.fever.full ? 'fever' : hp < 0.3 ? 'cry' : p.state === 'out' ? 'shoot' : p.state === 'cover' ? 'cover' : 'idle';
    if (mood !== this.mood || this.faceT <= 0) { this.mood = mood; this.faceT = 2.5 + Math.random() * 3; this.pickFace(mood); }
    this.facePop = Math.max(0, (this.facePop || 0) - dt * 5);
    // shared shader clocks and the boil / shine look
    for (const m of [this.layer, this.heart, this.ammoIcon]) if (m) { m.material.uniforms.time.value = t; m.material.uniforms.shine.value = 0.7; }
    const FU = this.face.material.uniforms; FU.time.value = t;
    FU.tintK.value = down ? 0.85 : 0; FU.tint.value.setRGB(0.7, 0.7, 0.72);
    this.layer.material.uniforms.tintK.value = down ? 0.75 : 0; this.layer.material.uniforms.tint.value.setRGB(0.75, 0.75, 0.78);
    // re-place (cheap) so pops and shakes apply
    this.layout();
    this.face.scale.multiplyScalar(1 + this.facePop * 0.12);
    this.face.position.x += this.shake * Math.sin(t * 90) * s * 5;
    this.layer.position.x += sx;
    if (this.heart) this.heart.scale.multiplyScalar(1 + (hp < 0.3 ? 0.15 * Math.max(0, Math.sin(t * 9)) : 0.05 * Math.max(0, Math.sin(t * 4))));
  }
  meshes() { return [this.layer, this.panicM, this.face, this.ring, this.hp, this.heart, this.ammoIcon, ...this.ticks, ...Object.values(this.t).map((x) => x.m), ...this.fv.flatMap((f) => [f.icon, f.label.m, f.lv.m])].filter(Boolean); }
}

// ---------------------------------------------------------------- the top middle: stage name, combo, rank
class Top {
  constructor(hud) {
    this.hud = hud; const B = hud.B;
    this.layer = picture(B.layers.center.img || 'ui/hud_center', 61, 0.6);
    this.stage = new Text(65, { sw: 0.12 }); this.combo = new Text(65, { shadow: '#d8141e', sw: 0.1 }); this.comboL = new Text(65, { sw: 0.14 });
    this.rank = new Text(65, { color: '#d8141e', sw: 0.12, stroke: '#fff' }); this.mul = new Text(65, { color: '#fff36a', sw: 0.16 });
    for (const m of [this.layer, this.stage.m, this.combo.m, this.comboL.m, this.rank.m, this.mul.m]) hud.g.add(m);
    this.D = B.center; this.last = 0; this.pop = 0;
  }
  put(t, name, str, k = 1, color) {
    const L = this.hud.L, D = this.D[name], b = D.box;
    t.set(str, (b[3] - b[1]) * L.s * 0.9, color, (b[2] - b[0]) * L.s * 1.15);
    const an = this.D.anchor || 'tc';
    t.at(L.x((b[0] + b[2]) / 2, an), L.y((b[1] + b[3]) / 2, an), D.deg, k);
  }
  update(dt, t) {
    const g = this.hud.game, L = this.hud.L, on = g.combat || !!g.boss;
    for (const m of [this.layer, this.stage.m, this.combo.m, this.comboL.m, this.rank.m, this.mul.m]) m.visible = on;
    if (!on) return;
    const lay = this.hud.B.layers.center;
    L.box(this.layer, lay.box, lay.anchor);   // (anchor bc: the strip at the bottom middle)
    this.layer.material.uniforms.time.value = t; this.layer.material.uniforms.shine.value = 0.8;
    const c = g.combo;
    if (c !== this.last) { if (c > this.last) this.pop = 1; this.last = c; }
    this.pop = Math.max(0, this.pop - dt * 5);
    const st = g.stage?.name ? tr(g.stage.name) : '';
    this.put(this.stage, 'stage', st);
    this.put(this.combo, 'combo', `${c}`, 1 + this.pop * 0.3);
    this.put(this.comboL, 'comboL', { zh: '连击!', ja: 'コンボ!', en: 'COMBO!' }[lang] || 'COMBO!');
    const p1 = g.players[0], lvSum = FEVER_KEYS.reduce((a, k) => a + p1.fever.level(k), 0), r = T.fever.rankBadge[lvSum];
    this.put(this.rank, 'rank', r, 1 + (r !== this.lastR ? 0.4 : 0), { S: '#ffd23a', A: '#ff2a3a', B: '#ffe04a', C: '#d0ced0' }[r] || '#ff2a3a');
    this.lastR = r;
    this.put(this.mul, 'mul', `×${p1.fever.dmgMul.toFixed(1)}`);
    this.layer.position.x += Math.sin(t * 60) * this.pop * L.s * 4;
    // the shot moves the strip up (tuning/shots.json hud.mid, share of the screen height; the corner panels never move)
    const dy = (g.live?.mid || 0) * L.H;
    if (dy) for (const m of [this.layer, this.stage.m, this.combo.m, this.comboL.m, this.rank.m, this.mul.m]) m.position.y += dy;
    this.hud.midDY = dy;
  }
}

// ---------------------------------------------------------------- the tiny DODGE sign just above the stage label (ledsign.js)
// Lit while a hide belt is out (fx.orbit 'hide'): an LED strip that switches on with a flicker and flicks through its signs and memes.
class Dodge {
  constructor(hud) {
    this.hud = hud; this.m = picture(null, 64, 0.4); this.m.visible = false; hud.g.add(this.m);
    this.tex = []; this.i = Math.floor(Math.random() * SIGNS.length); this.k = 0; this.t = 0; this.on = 0; this.was = false;
  }
  texOf(i) { return this.tex[i] || (this.tex[i] = (() => { const t = new THREE.CanvasTexture(ledCanvas(SIGNS[i])); t.colorSpace = THREE.NoColorSpace; return t; })()); }
  next() { this.i = (this.i + 1) % SIGNS.length; this.t = 0; this.k = 0; }
  update(dt, t) {
    const g = this.hud.game, L = this.hud.L, B = this.hud.B.center, D = B.dodge;
    let want = false;
    if (g.combat && D) for (const lk of g.fx?.live || []) if (lk.type === 'hide') { want = true; break; }
    if (want && !this.was) this.next();
    this.was = want;
    this.on = want ? Math.min(1, this.on + dt * 8) : Math.max(0, this.on - dt * 5);
    this.m.visible = this.on > 0;
    if (!this.m.visible) return;
    this.t += dt; this.k += dt;
    if (want && this.t > 0.6) this.next();
    const tx = this.texOf(this.i), img = tx.image, b = D.box, an = B.anchor || 'bc';
    const h = (b[3] - b[1]) * L.s, w = h * img.width / img.height;
    const u = this.m.material.uniforms; u.map.value = tx;
    this.m.scale.set(w, h * (0.5 + 0.5 * this.on), 1);
    this.m.position.set(L.x((b[0] + b[2]) / 2, an), L.y((b[1] + b[3]) / 2, an) + (this.hud.midDY || 0), 0); this.m.rotation.z = 0;
    // each sign switches on like an LED panel: a few flickers, then steady
    const fl = this.k < 0.14 && Math.floor(this.k * 50) % 2 ? 0.25 : 1;
    u.a.value = this.on * fl; u.boil.value = 0; u.shine.value = 0; u.time.value = t; u.flash.value = this.k < 0.05 ? 0.5 : 0;
  }
}

// ---------------------------------------------------------------- the reticle: her state decides its form (DESIGN: shape, not colour)
const STATES = ['idle', 'lock', 'fire', 'reload', 'cover', 'empty', 'fever', 'special'];
class Reticle {
  constructor(hud, p) {
    this.hud = hud; this.p = p;
    this.set = hud.B.reticle[p.w.kind === 'mantra' ? 'cat' : 'pink'];   // by who she is, not by which side she stands on
    this.cat = p.w.kind === 'mantra';
    // the drawn reticle (RETV_FRAG): the dark outline under, the line itself over (inverting what is behind it)
    const U = this.U = { shape: { value: 0 }, ears: { value: this.cat ? 1 : 2 }, thick: { value: 0.03 }, corner: { value: 0.38 }, rot: { value: 0 }, a: { value: 1 },
      col: { value: new THREE.Color(1, 1, 1) }, grow: { value: 0 }, dotR: { value: 0.03 }, ring: { value: 0 }, dash: { value: 1 }, time: { value: 0 }, earK: { value: 0 },
      map: { value: null }, useMap: { value: 0 }, ph: { value: p.slot * 0.5 } };
    U.rgb = { value: this.cat ? 0.004 : 0.009 }; U.fxK = { value: 1 }; this.calm = 1; this.shotAt = -9;
    const UO = this.UO = { ...U, col: { value: new THREE.Color(0.04, 0.02, 0.06) }, grow: { value: 0.035 }, a: { value: 0.7 }, ears: { value: 0 }, rgb: { value: 0 } };
    // the light round it (RETG_FRAG), under the line
    const UG = this.UG = { map: U.map, rot: U.rot, time: U.time, ph: U.ph, a: { value: 1 }, who: { value: this.cat ? 0 : 1 }, span: { value: 1.35 },
      tint: { value: new THREE.Color(1, 1, 1) }, tintK: { value: 0 }, spec: { value: new Array(16).fill(0) }, level: { value: 0 } };
    this.glow = new THREE.Mesh(quad, mat(RETG_FRAG, UG, { blending: THREE.AdditiveBlending })); this.glow.renderOrder = 69.95 + p.slot; this.glow.frustumCulled = false; hud.g.add(this.glow);
    U.ears.value = 0;   // (her ears come from her drawn reticle, R70: the ones drawn by the script sat wrong - user 2026-10-20)
    this.who = this.cat ? 'cat' : 'pink';
    this.under = new THREE.Mesh(quad, mat(RETV_FRAG, UO)); this.under.renderOrder = 69.9 + p.slot; this.under.frustumCulled = false; hud.g.add(this.under);
    this.cur = new THREE.Mesh(quad, mat(RETV_FRAG, U, { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneMinusDstColorFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
    this.cur.renderOrder = 70 + p.slot; this.cur.frustumCulled = false; hud.g.add(this.cur);
    this.old = this.cur; this.sz = 1; this.shp = 0; this.rot = 0;
    this.state = ''; this.k = 1; this.spin = 0; this.kick = 0;
    // the locked form's leader line and name tag
    this.line = new THREE.Mesh(quad, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthTest: false, depthWrite: false }));
    this.line.renderOrder = 69; this.line.frustumCulled = false; hud.g.add(this.line);
    this.lineB = new THREE.Mesh(quad, new THREE.MeshBasicMaterial({ color: 0x121012, transparent: true, depthTest: false, depthWrite: false }));
    this.lineB.renderOrder = 68.5; this.lineB.frustumCulled = false; hud.g.add(this.lineB);
    this.tag = picture(hud.B.warn.tag, 69, p.slot * 0.4); hud.g.add(this.tag);
    this.ghost = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 24), new THREE.MeshBasicMaterial({ color: p.c.color, transparent: true, depthTest: false, depthWrite: false }));
    this.ghost.renderOrder = 71; this.ghost.frustumCulled = false; hud.g.add(this.ghost);
    this.name = new Text(69.5, { sw: 0.1 }); hud.g.add(this.name.m);
    this.lockK = 0; this.lastShots = p.shots || 0;
  }
  update(dt, t) {
    const g = this.hud.game, p = this.p, H = this.hud.L.H, ct = p.ctrl;
    // a player's own reticle never leaves her pointer while the battle is on screen (between waves, walking, down: shown calm); the AI's only
    // in a fight
    const human = ct && ct.kind !== 'ai';
    const vis = ct && ct.active && p.state !== 'away' && (g.combat || human);
    for (const m of [this.cur, this.under, this.glow, this.line, this.lineB, this.tag, this.name.m, this.ghost]) m.visible = false;
    if (!vis) return;
    // the monster under her aim, if any
    const over = g.actors.find((a) => { if (!a.alive || !a.hitMeshes || !a.hitMeshes().length || !a.def) return false; const b = g.box(a); return p.aimX > b.x0 && p.aimX < b.x1 && p.aimY > b.y0 && p.aimY < b.y1; });
    const inf = p.gatling || p.beaming;
    const st = !g.combat || p.state === 'down' || p.state === 'run' ? 'cover' : p.activeOn ? 'special' : p.state === 'reload' ? 'reload' : (p.ammo <= 0 && !inf) ? 'empty'
      : p.state === 'cover' || p.state === 'hurt' ? 'cover' : p.fever.full ? 'fever' : over ? 'lock' : 'idle';
    if (st !== this.state) { this.k = (st === 'lock') !== (this.state === 'lock') ? 0 : 0.4; this.state = st; }
    if ((p.shots || 0) !== this.lastShots) { this.kick = 1; this.lastShots = p.shots || 0; this.shotAt = t; }
    // its light and shine are for the quiet moments (user 2026-10-20: "mainly while not aiming at anything and not shooting"): down at once
    // on a target or a shot, back up slowly after; half in cover
    const calmTo = st === 'idle' && t - this.shotAt > 0.6 ? 1 : st === 'cover' ? 0.5 : st === 'lock' || t - this.shotAt < 0.6 ? 0.1 : 0.35;
    this.calm += (calmTo - this.calm) * Math.min(1, dt * (calmTo < this.calm ? 14 : 2.5)); this.U.fxK.value = this.calm;
    this.kick = Math.max(0, this.kick - dt * 9);
    this.k = Math.min(1, this.k + dt * 8);
    // the form per state (DESIGN「准星精简」): small and open; over something she can hit: closes in fast to a smaller square (the gun girl)
    // or triangle (the cat girl); reload: a dashed ring turning, a slow turn; empty: red, wide open, shaking; Fever: gold, a ring; her
    // special: her colour, a ring, spinning; in cover: faint
    const F = { idle: [1, 0, 0.36, 0], lock: [tex[`ui/retv_${this.cat ? 'cat' : 'pink'}_lock`] ? 1 : 0.55, this.cat ? 1 : 0, 0.5, 0], reload: [0.9, 0, 0.3, 1], empty: [1.15, 0, 0.22, 0], cover: [0.8, 0, 0.3, 0],
      fever: [0.85, this.cat ? 1 : 0, 0.45, 1], special: [1.1, this.cat ? 1 : 0, 0.5, 1] }[st] || [1, 0, 0.36, 0];
    const e = Math.min(1, dt * (st === 'lock' ? 22 : 12));   // (closing in on a target is fast)
    this.sz += (F[0] - this.sz) * e; this.shp = F[1]; this.U.corner.value += (F[2] - this.U.corner.value) * e;
    this.U.ring.value += (F[3] - this.U.ring.value) * e;
    this.rot += dt * (st === 'special' ? 5 : st === 'reload' ? 1.6 : st === 'lock' && !this.cat ? 0 : 0.15);
    const size = H * (this.hud.B.reticle.drawn ?? 0.07) * this.sz * (1 + this.kick * 0.1) * (1 + (1 - this.k) * 0.3);
    // where it is: her aim this very frame (the slow beam aim of the cat girl's special is drawn there, and her pointer gets a dot)
    const x = p.aimX, y = H - p.aimY;
    if (p.beaming && human) { this.ghost.visible = true; this.ghost.position.set(ct.x, H - ct.y, 0); this.ghost.scale.setScalar(H * 0.018); }
    const U = this.U, shake = st === 'empty' ? Math.sin(t * 50) * H * 0.004 : 0;
    U.shape.value = this.shp; U.rot.value = st === 'lock' ? 0 : this.rot; U.time.value = t; U.earK.value = st === 'lock' ? 0 : 1;
    U.col.value.set(st === 'empty' ? 0xff3040 : st === 'fever' ? 0xffd040 : st === 'special' ? p.c.color : 0xffffff);
    if (st === 'lock' || st === 'idle') U.col.value.setRGB(1, 1, 1);   // (white through the inverting blend: the reverse of what is behind)
    if (this.cat && (st === 'idle' || st === 'cover')) U.col.value.setRGB(0.82, 0.92, 1.0);   // (hers white with a blue cast, drawn as it is: user 2026-10-20, the inverted one was dull)
    U.a.value = (st === 'cover' ? 0.5 : 1) * (st === 'empty' && Math.sin(t * 18) < -0.3 ? 0.4 : 1);
    U.thick.value = st === 'lock' ? 0.045 : 0.032; U.dotR.value = st === 'lock' ? 0.02 : 0.035;
    const art = tex[`ui/retv_${this.who}_${st === 'lock' ? 'lock' : 'idle'}`];
    U.map.value = art || null; U.useMap.value = art ? 1 : 0;
    if (art) { U.shape.value = 0; U.rot.value = st === 'reload' || st === 'special' ? this.rot : 0; }
    for (const k of ['shape', 'rot', 'time', 'earK', 'thick', 'dotR', 'corner', 'ring', 'dash', 'map', 'useMap']) this.UO[k].value = U[k].value;
    this.UO.grow.value = art ? 0.012 : 0.035; U.grow.value = 0;
    this.UO.a.value = 0.7 * U.a.value;
    // (colours other than white show as themselves: the inverting blend only for the white forms)
    this.cur.material.blending = U.col.value.r + U.col.value.g + U.col.value.b > 2.95 ? THREE.CustomBlending : THREE.NormalBlending;
    // (her picture: the frame spans 46% of it - drawn bigger to match; the form it changes to pops in big and closes in fast)
    const fi = meta[`ui/retv_${this.who}_idle`]?.frame || 0.46;   // (one scale for both of her forms: the lock form is drawn smaller)
    const qs = art ? size * 1.1 / fi * (1 + (1 - this.k) * (1 - this.k) * 0.9) : size * 2.2;
    for (const m of [this.under, this.cur]) { m.visible = true; m.position.set(x + shake, y, 0); m.scale.setScalar(qs); }
    if (art) {   // (its light: dimmer in cover, the state's own colour when it has one; the sound and her shots move it)
      const UG = this.UG, S = spectrum(), RG = this.hud.B.reticle.glow ?? 1;
      let lv = 0; for (let i = 0; i < 16; i++) { UG.spec.value[i] = S[i]; lv += S[i] / 16; }
      UG.level.value += (lv - UG.level.value) * Math.min(1, dt * 10);
      UG.a.value = U.a.value * RG * this.calm;
      UG.tintK.value = st === 'empty' || st === 'fever' || st === 'special' ? 0.65 : 0; UG.tint.value.copy(U.col.value);
      this.glow.visible = RG > 0 && this.calm > 0.02; this.glow.position.set(x + shake, y, 0); this.glow.scale.setScalar(qs * UG.span.value);
    }
    // locked on: a leader line up and out to a name tag with the monster's name
    this.lockK += ((over && (st === 'lock' || st === 'fever' || st === 'special') ? 1 : 0) - this.lockK) * Math.min(1, dt * 10);
    if (this.lockK > 0.02 && over) {
      const nm = over.def?.name ? tr(over.def.name) : '';
      const dir = p.slot ? -1 : 1, L = H * 0.09 * this.lockK;
      const ex = x + dir * L * 0.9, ey = y + L * 0.75;
      const lx = (x + ex) / 2, ly = (y + ey) / 2, len = Math.hypot(ex - x, ey - y), ang = Math.atan2(ey - y, ex - x);
      for (const [m, w] of [[this.lineB, H * 0.007], [this.line, H * 0.0035]]) { m.visible = true; m.position.set(lx, ly, 0); m.rotation.z = ang; m.scale.set(len, w, 1); m.material.opacity = this.lockK; }
      const th = H * 0.045, tw = th * 3.2 + (nm.length > 4 ? th * 0.5 * (nm.length - 4) : 0);
      this.tag.visible = !!tex[this.hud.B.warn.tag];
      this.tag.position.set(ex + dir * tw * 0.45, ey, 0); this.tag.scale.set(tw * this.lockK, th, 1); this.tag.material.uniforms.a.value = this.lockK;
      this.tag.material.uniforms.time.value = t;
      this.name.set(nm, th * 0.5, undefined, tw * 0.8); this.name.at(ex + dir * tw * 0.47, ey, -4, this.lockK); this.name.m.visible = true;
    }
  }
}

// ---------------------------------------------------------------- reloading: nine close-ups flashing by over her side
// (docs/DESIGN.md「装填动画」): see-through, quick, a little jump in place and angle each time; the cat girl forms the nine seals and
// each comes with its big character in the spectrum colours (glyphs.js); the gun girl's mix reloading with make-up and cute moments
class Reload {
  constructor(hud, p) {
    this.hud = hud; this.p = p;
    const R = hud.B.reload, who = p.w.kind === 'mantra' ? 'cat' : 'pink';
    this.cat = who === 'cat';
    this.keys = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `ui/rl_${R[who]}_${i}`).filter((k) => tex[k]);
    this.m = [0, 1].map((i) => { const m = picture(null, 58 + i * 0.1, p.slot * 0.5 + i); hud.g.add(m); return m; });
    // the panel frame: a white outline and a black border behind the pictures, like a manga panel
    const sq = (col, o) => { const m = new THREE.Mesh(quad, new THREE.MeshBasicMaterial({ color: col, transparent: true, depthTest: false, depthWrite: false })); m.renderOrder = o; m.frustumCulled = false; hud.g.add(m); return m; };
    this.white = sq(0xffffff, 57.8); this.black = sq(0x121012, 57.9);
    this.step = -1; this.t = 0; this.on = false; this.cur = 0;
  }
  // a free place for the panel: low between her and the middle of the screen first (floor), then a bit higher, then by the middle
  place(w, h) {
    const p = this.p, hud = this.hud, H = hud.L.H, W = hud.L.W, fig = hud.space.girl(p.slot), s = p.slot ? -1 : 1;
    const inner = fig ? (s > 0 ? fig.x1 : fig.x0) : p.baseX + s * H * 0.2;
    const c = [];
    for (const y of [0.2, 0.32, 0.45, 0.58]) c.push({ x: inner + s * (w / 2 + H * 0.02), y: H * y });
    c.push({ x: W / 2 - s * w * 0.6, y: H * 0.2 }, { x: W / 2 - s * w * 0.6, y: H * 0.42 });
    return hud.space.find(w * 1.08, h * 1.08, c);
  }
  update(dt, t) {
    const p = this.p, g = this.hud.game, H = this.hud.L.H, R = this.hud.B.reload, n = this.keys.length;
    const want = g.combat && p.state === 'reload' && n > 0;
    if (want && !this.on) { this.on = true; this.step = -1; }
    if (!want) this.on = false;
    for (const m of this.m) m.visible = false;
    this.white.visible = this.black.visible = false;
    if (!this.on && this.fade === undefined) return;
    // its place: found when it starts, kept (claimed) while it shows
    const ph = H * R.size, pw = ph * 0.92;
    if (this.on && this.step < 0) this.spot = this.place(pw, ph); else if (this.spot) this.hud.space.claim(this.spot);
    const k = this.on ? 1 - p.reloadT / (p.reloadT0 || 1) : 1, step = Math.min(n - 1, Math.floor(k * n));
    if (this.on && step !== this.step) {
      this.step = step; this.cur ^= 1; this.age = 0;
      const m = this.m[this.cur], side = p.slot ? -1 : 1;
      m.material.uniforms.map.value = tex[this.keys[step]];
      // in its panel, each step a little different in angle and nudge
      this.pos = { x: this.spot.x + (Math.random() - 0.5) * H * 0.012, y: this.spot.y + (Math.random() - 0.5) * H * 0.012, rot: (Math.random() - 0.5) * 0.12 + side * 0.04 };
      m.userData.pos = this.pos;
      if (this.cat) {   // the seal's character, big, in its own colour, at the panel's top corner toward the middle
        const ch = C.theme.kuji[step % C.theme.kuji.length];
        g.fx.chant.flash(ch, step, this.spot.x + side * pw * 0.42, this.spot.y + ph * 0.42, H * R.glyph);
      }
    }
    this.age = (this.age || 0) + dt;
    const dur = (p.reloadT0 || 1) / n;
    this.m.forEach((m, i) => {
      const P = m.userData.pos; if (!P || !m.material.uniforms.map.value) return;
      const cur = i === this.cur && this.on;
      const e = cur ? Math.min(1, this.age / 0.06) : Math.max(0, 1 - this.age / 0.09);   // snaps in, the last one flicks out
      if (e <= 0) return;
      const U = m.material.uniforms, img = U.map.value.image, ar = img.height / img.width;
      const fit = Math.min(pw / 1, ph / ar), size = fit * (cur ? 1.06 - 0.06 * e : 1 + 0.08 * (1 - e));
      m.visible = true;
      m.position.set(P.x, P.y, 0); m.rotation.z = P.rot;
      m.scale.set(size, size * ar, 1);
      if (cur) {   // the frame follows the current picture
        const fw = size, fh = size * ar;
        for (const [q, k] of [[this.white, H * 0.012], [this.black, H * 0.006]]) {
          q.visible = true; q.position.set(P.x, P.y, 0); q.rotation.z = P.rot; q.scale.set(fw + k * 2, fh + k * 2, 1); q.material.opacity = e * Math.min(1, R.alpha + 0.1);
        }
      }
      U.a.value = e * R.alpha * (0.85 + 0.15 * Math.sin(t * 40)); U.time.value = t; U.boil.value = 0.4;
      U.flash.value = cur ? Math.max(0, 0.5 - this.age * 6) : 0;   // a white pop as each one lands
    });
    if (!this.on && this.age > 0.1) this.fade = undefined; else if (!this.on) this.fade = 1;
  }
}

// ---------------------------------------------------------------- down: the 9-second countdown on her panel
class Down {
  constructor(hud, p) {
    this.hud = hud; this.p = p;
    this.m = picture(hud.B.down.img, 66, 0.3); this.n = new Text(67, { shadow: '#d8141e', sw: 0.1 }); this.of = new Text(67, { sw: 0.14 });
    this.label = new Text(67, { color: '#ff2a3a', sw: 0.14, stroke: '#fff' });
    for (const m of [this.m, this.n.m, this.of.m, this.label.m]) hud.g.add(m);
  }
  update(dt, t) {
    const p = this.p, L = this.hud.L, D = this.hud.B.down, s = L.s;
    const on = p.state === 'down' && (p.slot === 0 || this.hud.game.p2on());
    for (const m of [this.m, this.n.m, this.of.m, this.label.m]) m.visible = on;
    if (!on) return;
    // the mockup puts it on 2P's panel; 1P's is the mirror image
    const mx = (x) => (p.slot ? x : 1672 - x), an = p.slot ? 'tr' : 'tl';
    const bx = (b) => (p.slot ? b : [mx(b[2]), b[1], mx(b[0]), b[3]]);
    L.box(this.m, bx(D.box), an, 1 + 0.04 * Math.sin(t * 6), Math.sin(t * 2) * 3);
    this.m.material.uniforms.time.value = t; this.m.material.uniforms.shine.value = 1;
    const sec = Math.max(0, Math.ceil(p.downT));
    const put = (txt, b, str, k = 1) => { const B2 = bx(b); txt.set(str, (B2[3] - B2[1]) * s * 0.9, undefined, (B2[2] - B2[0]) * s * 1.3); txt.at(L.x((B2[0] + B2[2]) / 2, an), L.y((B2[1] + B2[3]) / 2, an), -6, k); };
    put(this.n, D.num, `${sec}`, 1 + 0.15 * Math.max(0, Math.sin(t * Math.PI * 2)));
    put(this.of, D.of, `/${T.combat.player.downTime}`);
    put(this.label, D.label, p.c.revive ? tr(p.c.revive) : { zh: '复活!', ja: '復活!', en: 'REVIVE!' }[lang] || 'REVIVE!');   // (her own word: characters/<id>.json revive)
  }
}

// ---------------------------------------------------------------- the boss bar, at the very bottom between the girls
class BossBar {
  constructor(hud) {
    this.hud = hud; const D = this.D = hud.B.boss;
    this.m = picture(D.img, 61, 0.9);
    this.fill = new THREE.Mesh(quad, mat(BAR_FRAG, { fill: { value: 1 }, lag: { value: 1 }, col: { value: new THREE.Color('#e8142a') }, col2: { value: new THREE.Color(1, 0.9, 0.9) },
      a: { value: 1 }, time: { value: 0 }, flash: { value: 0 }, px: { value: new THREE.Vector2(100, 10) } }));
    this.fill.renderOrder = 62; this.fill.frustumCulled = false;
    this.name = new Text(63, { sw: 0.12 });
    this.pips = [0, 1, 2].map(() => { const m = new THREE.Mesh(quad, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthTest: false, depthWrite: false })); m.renderOrder = 63; m.frustumCulled = false; return m; });
    for (const m of [this.m, this.fill, this.name.m, ...this.pips]) hud.g.add(m);
    this.frac = 1; this.lag = 1; this.str = null; this.phase = 0; this.phases = 1;
  }
  set(name, frac, phase, phases) { this.str = name; if (name !== null) { if (frac < this.frac - 1e-4) this.fill.material.uniforms.flash.value = 0.7; this.frac = Math.max(0, frac); } if (phase !== undefined) { this.phase = phase; this.phases = phases; } }
  update(dt, t) {
    const L = this.hud.L, D = this.D, on = this.str !== null && this.str !== undefined;
    for (const m of [this.m, this.fill, this.name.m, ...this.pips]) m.visible = on;
    if (!on) return;
    // narrower than the mockup and centred, so it stays between the girls' feet
    const k = D.fit, c = [(D.box[0] + D.box[2]) / 2, (D.box[1] + D.box[3]) / 2];
    const fit = (b) => [c[0] + (b[0] - c[0]) * k, c[1] + (b[1] - c[1]) * k, c[0] + (b[2] - c[0]) * k, c[1] + (b[3] - c[1]) * k];
    L.box(this.m, fit(D.box), D.anchor || 'bc'); this.m.material.uniforms.time.value = t; this.m.material.uniforms.shine.value = 0.8;
    const tb = fit(D.track);
    L.box(this.fill, tb, D.anchor || 'bc', 1, -1.5);
    this.lag += (this.frac - this.lag) * Math.min(1, dt * 1.5); if (this.lag < this.frac) this.lag = this.frac;
    const U = this.fill.material.uniforms; U.fill.value = this.frac; U.lag.value = this.lag; U.time.value = t; U.flash.value = Math.max(0, U.flash.value - dt * 4);
    U.px.value.set((tb[2] - tb[0]) * L.s, (tb[3] - tb[1]) * L.s);
    const nb = fit(D.name); this.name.set(this.str, (nb[3] - nb[1]) * L.s * 0.8, undefined, (nb[2] - nb[0]) * L.s); this.name.at(L.x((nb[0] + nb[2]) / 2, D.anchor || 'bc'), L.y((nb[1] + nb[3]) / 2, D.anchor || 'bc'), -3);
    this.pips.forEach((m, i) => {
      const P = D.pips[i], pc = fit([P[0], P[1], P[0], P[1]]), r = 9 * L.s * k;
      m.visible = i < this.phases; m.position.set(L.x(pc[0], D.anchor || 'bc'), L.y(pc[1], D.anchor || 'bc'), 0); m.scale.setScalar(r * 2 * (i === this.phase ? 1.3 + 0.15 * Math.sin(t * 8) : 1)); m.rotation.z = Math.PI / 4;
      m.material.color.set(i < this.phase ? '#5a5658' : i === this.phase ? '#ff2a3a' : '#ffffff');
    });
  }
}

// ---------------------------------------------------------------- damage counters: one per monster, adding up while you keep hitting it
class Damage {
  constructor(hud) { this.hud = hud; this.pool = []; this.live = new Map(); }
  get() {
    let d = this.pool.find((x) => !x.on);
    if (!d) {
      if (this.pool.length >= 24) { d = this.pool[0]; this.live.forEach((v, k) => { if (v === d) this.live.delete(k); }); }
      else { d = { n: new Text(66, { sw: 0.12 }), c: new Text(66.5, { color: '#fff36a', shadow: '#d8141e', sw: 0.14 }) }; this.hud.g.add(d.n.m, d.c.m); this.pool.push(d); }
    }
    return d;
  }
  // x, y: screen px from the top-left (the game's box of the monster)
  add(target, x, y, value, crit, color, sign = '') {
    let d = this.live.get(target);
    if (!d || !d.on) { d = this.get(); d.on = true; d.sum = 0; d.crit = false; d.age = 0; this.live.set(target, d); }
    d.sum += value; d.t = sign ? 1.1 : 0.8; d.x = x; d.y = y; d.crit = d.crit || crit; d.color = color; d.pop = 1; d.sign = sign;
  }
  update(dt) {
    const H = this.hud.L.H;
    for (const d of this.pool) {
      if (!d.on) { d.n.m.visible = d.c.m.visible = false; continue; }
      d.t -= dt; d.age += dt; d.pop = Math.max(0, d.pop - dt * 7);
      if (d.t <= -0.3) { d.on = false; this.live.forEach((v, k) => { if (v === d) this.live.delete(k); }); continue; }
      const a = d.t > 0 ? 1 : 1 + d.t / 0.3, rise = (0.8 - Math.max(0, d.t)) * H * 0.05 + (d.t < 0 ? -d.t * H * 0.1 : 0);
      const h = H * Math.min(0.09, 0.034 + Math.log10(1 + d.sum) * 0.012) * (d.crit ? 1.25 : 1);
      d.n.st.shadow = d.color; d.n.set(`${d.sign || ''}${Math.round(d.sum)}`, h, d.sign ? '#c9ffe0' : d.crit ? '#fff36a' : '#ffffff');
      d.n.at(d.x, H - d.y + rise + h * 0.6, -6, 1 + d.pop * 0.35);
      d.n.m.visible = true; d.n.m.material.uniforms.a.value = a;
      d.c.m.visible = d.crit;
      if (d.crit) { d.c.set({ zh: '暴击!', ja: 'クリティカル!', en: 'CRIT!' }[lang] || 'CRIT!', h * 0.42); d.c.at(d.x + h * 0.9, H - d.y + rise + h * 1.35, 8, 1 + d.pop * 0.3); d.c.m.material.uniforms.a.value = a; }
    }
  }
}

// ---------------------------------------------------------------- a page held up to be read (the lady's diary: its date and that day's
// words; user 2026-10-22: the slammed truth was a blur of red and blue and gone too fast): paper, dark ink, plain letters, wrapped, drawn
// after the picture's effects (no colour split, no glitch over it), held as long as it takes to read
class Note {
  constructor(hud) { this.hud = hud; this.m = null; this.t = 0; this.life = 0; }
  show(date, text, life) {
    this.drop();
    const c = document.createElement('canvas'), x = c.getContext('2d'), CW = 1400, pad = 64, fs = 60, words = /\s/.test(text);
    x.font = `700 ${fs}px ${FONT}`;
    const lines = []; let cur = '';
    for (const p of words ? text.split(/(\s+)/) : [...text]) {   // (wrapped by words, or by characters for Chinese and Japanese)
      if (cur && x.measureText(cur + p).width > CW - pad * 2 && !/^[。，、！？!?,.…」』）)]/.test(p)) { lines.push(cur.trim()); cur = p.trimStart(); } else cur += p;   // (no line starting with a stop)
    }
    if (cur.trim()) lines.push(cur.trim());
    const dh = date ? fs * 1.1 : 0, lh = fs * 1.45;
    c.width = CW; c.height = Math.ceil(pad * 2 + dh + lines.length * lh);
    x.fillStyle = '#f3e6c8'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = 'rgba(150,100,50,0.18)'; for (let i = 0; i < 60; i++) x.fillRect(Math.random() * c.width, Math.random() * c.height, 4 + Math.random() * 14, 2 + Math.random() * 6);
    x.strokeStyle = '#8a6a48'; x.lineWidth = 6; x.strokeRect(3, 3, c.width - 6, c.height - 6);
    x.textBaseline = 'top';
    if (date) { x.fillStyle = '#9a1a2a'; x.font = `900 ${Math.round(fs * 0.85)}px ${FONT}`; x.fillText(date, pad, pad * 0.8); }
    x.fillStyle = '#24161a'; x.font = `700 ${fs}px ${FONT}`;
    lines.forEach((l, i) => x.fillText(l, pad, pad + dh + i * lh));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    this.m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, opacity: 0 }));
    this.m.renderOrder = 86; this.m.frustumCulled = false; this.m.userData.ar = c.height / c.width; this.hud.g.add(this.m);
    this.t = 0; this.life = life ?? Math.min(9, Math.max(4.5, 2 + [...text].length * (words ? 0.06 : 0.2)));
  }
  drop() { if (!this.m) return; this.m.removeFromParent(); this.m.material.map.dispose(); this.m.material.dispose(); this.m.geometry.dispose(); this.m = null; }
  update(dt) {
    if (!this.m) return;
    this.t += dt; const L = this.hud.L, t = this.t, k = Math.min(1, t / 0.3), out = Math.max(0, Math.min(1, (this.life - t) / 0.5));
    if (t >= this.life) { this.drop(); return; }
    const w = Math.min(L.W * 0.62, L.H * 1.0);
    this.m.scale.set(w, w * this.m.userData.ar, 1); this.m.position.set(L.W / 2, L.H * 0.75 + (1 - k) * L.H * 0.03, 0); this.m.rotation.z = -0.015;
    this.m.material.opacity = Math.min(k, out) * 0.97;
  }
}

// ---------------------------------------------------------------- the whole HUD
export class HudGL {
  constructor(game) {
    this.game = game; this.B = C.ui.battle; this.L = new Layout();
    this.g = new THREE.Group(); game.hudScene.add(this.g);   // after the post pass: fixed on screen
    this.panels = game.players.map((p) => new Panel(this, p));
    this.top = new Top(this);
    this.dodge = new Dodge(this);
    this.reticles = game.players.map((p) => new Reticle(this, p));
    // (the old in-panel reload panel and down timer are replaced by alerts.js: reload stickers in her corner, CONTINUE? on her half)
    this.bossBar = new BossBar(this);
    this.damage = new Damage(this);
    this.space = new Space(this);
    this.stickers = new Stickers(this);
    this.holdUI = new Hold(this);
    this.alerts = new Alerts(this);
    this.notes = new Note(this);
    this.visible = true;
    // a close look (Game.cine): black bars come in top and bottom; the HUD steps back but the lines (stickers) and the warning overlay
    this.cine = 0; this.cineHid = null;
    this.bars = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x050307, depthTest: false, depthWrite: false }));
      m.renderOrder = 72; m.frustumCulled = false; m.visible = false; this.g.add(m); return m; });
    // words in the bars (Game.cine title: a boss coming on): her name huge, again and again, running along the top bar, and hollow
    // running the other way along the bottom one (the MVs' label bars and words repeated till they fill the screen)
    this.marquee = [0, 1].map((i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, opacity: 0 }));
      m.renderOrder = 73; m.frustumCulled = false; m.visible = false; this.g.add(m); m.userData.i = i; return m; });
    this.marqueeText = null;
  }
  // the bars' words as a texture that repeats along them: filled (top) or hollow (bottom)
  marqueeTex(text, hollow) {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 160;
    const g = c.getContext('2d');
    g.font = `900 112px ${FONT}`; g.textBaseline = 'middle';
    const one = g.measureText(`${text}  ◆  `).width, n = Math.max(1, Math.round(2048 / one));
    g.setTransform(2048 / (one * n), 0, 0, 1, 0, 0);   // (a whole number of repeats fills the canvas: it joins up seamlessly)
    const s = `${text}  ◆  `.repeat(n);
    if (hollow) { g.strokeStyle = '#ff3a8a'; g.lineWidth = 5; g.strokeText(s, 0, 84); }
    else { g.fillStyle = '#fff4f8'; g.fillText(s, 0, 84); }
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  show(v) { this.visible = v; this.g.visible = v; }
  react(slot, kind, hold) { this.panels[slot]?.react(kind, hold); }
  boss(name, frac, phase, phases) { this.bossBar.set(name, frac, phase, phases); }
  dmg(target, x, y, value, crit, color) { this.damage.add(target, x, y, value, crit, color); }
  // a heal (Fever level-up, the special, items): a green +N rising from her HP bar
  heal(slot, n) {
    const P = this.panels[slot]; if (!P) return;
    const b = P.D.hp.box, L = this.L, x = L.x((b[0] + b[2]) / 2, P.an), y = this.L.H - L.y((b[1] + b[3]) / 2, P.an);
    this.damage.add({ heal: slot, t: performance.now() }, x, y, n, false, '#1aa86a', '+');
  }
  hold(kind, opt) { this.holdUI.show(kind, opt); }
  note(date, text, life) { this.notes.show(date, text, life); }
  update(dt, t) {
    const g = this.game;
    this.L.set(g.W, g.H, g.G.frame, this.B.scale ?? 1);
    this.g.visible = this.visible && !this.game.board;   // (a storyboard's shots: nothing of the HUD over them, its words neither)
    if (!this.visible) return;
    this.space.begin();   // what is taken this frame (HUD, boss bar, the girls); pop-ups below find their places around it
    for (const p of this.panels) p.update(dt, t);
    this.top.update(dt, t);
    this.dodge.update(dt, t);
    for (const r of this.reticles) r.update(dt, t);
    this.bossBar.update(dt, t);
    this.damage.update(dt);
    this.stickers.update(dt, t);
    this.alerts.update(dt, t);
    this.holdUI.update(dt, t);
    this.notes.update(dt);
    this.cineUpdate(dt);
  }
  cineUpdate(dt) {
    const g = this.game, k = this.cine = this.cine + ((g.cineOn || g.walkOn || g.shot?.hud?.show === false ? 1 : 0) - this.cine) * Math.min(1, dt * 5), W = this.L.W, H = this.L.H;
    this.barK = (this.barK || 0) + ((g.cineOn ? 1 : 0) - (this.barK || 0)) * Math.min(1, dt * 5); const bh = H * 0.11 * this.barK;   // (bars: close-ups only)
    this.bars.forEach((m, i) => { m.visible = this.barK > 0.01; m.scale.set(W * 1.02, bh, 1); m.position.set(W / 2, i ? H - bh / 2 : bh / 2, 0); });
    // the words in the bars while a close look has a title
    const title = g.cineOn ? g.cineTitle : null;
    if (title !== this.marqueeText) {
      this.marqueeText = title;
      for (const m of this.marquee) { m.material.map?.dispose(); m.material.map = title ? this.marqueeTex(title, m.userData.i === 1) : null; m.material.needsUpdate = true; }
    }
    for (const m of this.marquee) {
      const on = !!this.marqueeText && this.barK > 0.05, mh = bh * 0.82, i = m.userData.i;
      m.visible = on; if (!on) continue;
      m.scale.set(W * 1.02, mh, 1); m.position.set(W / 2, i ? H - bh / 2 : bh / 2, 0);
      const tx = m.material.map; tx.repeat.x = (W / mh) / (2048 / 160); tx.offset.x += (i ? -1 : 1) * dt * 0.18;
      m.material.opacity = Math.min(1, this.barK * 1.4);
    }
    const keep = [this.stickers.layer, this.holdUI.g, ...this.bars, ...this.marquee];
    if (k > 0.3) {   // (what each part shows is its own business: hidden on top of it every frame, given back as it was at the end)
      if (!this.cineHid) { this.cineHid = new Map(); for (const c of this.g.children) if (!keep.includes(c)) this.cineHid.set(c, c.visible); }
      for (const c of this.cineHid.keys()) c.visible = false;
    } else if (this.cineHid) { for (const [c, v] of this.cineHid) c.visible = v; this.cineHid = null; }
  }
  dispose() { this.game.overlay.remove(this.g); }
}
