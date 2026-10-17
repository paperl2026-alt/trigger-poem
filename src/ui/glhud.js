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
    // Fever: three gauges of six segments, each with its icon, label and level
    this.fv = FEVER_KEYS.map((k, i) => {
      const F = D.fever[i], c = new THREE.Color(B.colors.fever[k]);
      const icon = F.icon ? picture(`ui/hud_ic_${['flame', 'aim', 'chain'][i]}`, 64, i * 0.3) : null;   // the new panels have the icons in their art
      const segs = F.segs.map(() => { const m = new THREE.Mesh(quad, new THREE.MeshBasicMaterial({ color: c, transparent: true, depthTest: false, depthWrite: false }));
        m.renderOrder = 63; m.frustumCulled = false; return m; });
      return { k, F, c, icon, segs, label: new Text(65, { color: B.colors.fever[k], sw: 0.18 }), lv: new Text(65, { sw: 0.16 }), lvN: -1, up: 0 };
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
      ...this.fv.flatMap((f) => [f.icon, ...f.segs, f.label.m, f.lv.m])]) if (m) g.add(m);
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
    this.face.material.uniforms.circle.value = disc / (2 * pr);
    const rc = D.ring.c, rr = D.ring.r1 + 2;
    L.box(this.ring, [rc[0] - rr, rc[1] - rr, rc[0] + rr, rc[1] + rr], an);
    this.ring.material.uniforms.r0.value = D.ring.r0 / rr; this.ring.material.uniforms.r1.value = D.ring.r1 / rr;
    L.box(this.hp, D.hp.box, an); this.hp.material.uniforms.px.value.set((D.hp.box[2] - D.hp.box[0]) * s, (D.hp.box[3] - D.hp.box[1]) * s);
    if (this.heart) L.box(this.heart, D.hp.heart, an);
    this.fv.forEach((f) => { if (f.icon) L.box(f.icon, f.F.icon, an); f.F.segs.forEach((b, i) => L.box(f.segs[i], [b[0] + 1.5, b[1] + 1.5, b[2] - 1.5, b[3] - 1.5], an, 1, -3)); });
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
    if (!on) { this.fv.forEach((f) => f.segs.forEach((m) => { m.visible = false; })); return; }
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
    // skill ring
    const RU = this.ring.material.uniforms;
    RU.fill.value = p.activeOn ? p.activeT / p.a.dur : p.charge; RU.time.value = t; RU.full.value = p.charge >= 1 && !p.activeOn ? 1 : 0; RU.on.value = p.activeOn ? 1 : 0;
    // texts
    this.text('tag', p.slot ? '2P' : '1P');
    const nb = this.D.text.name.box, lb = this.D.text.lv.box;
    this.text('name', tr(p.c.name), undefined, 1, (lb[0] - nb[0]) * 0.95);
    this.text('lv', `Lv${p.lv}`);
    this.text('hp', `${Math.ceil(p.hp)} / ${p.maxHp}`);
    const k = p.ctrl?.kind;
    this.text('key', k === 'pad' ? 'Y' : k === 'keys' ? '⌫' : k === 'ai' ? 'AI' : ({ zh: '右键', ja: '右クリック', en: 'R-CLICK' }[lang] || 'R-CLICK'), '#121012', 0.62);
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
    // Fever gauges: lit segments, level text, a pop on level-up
    this.fv.forEach((f) => {
      const lv = p.fever.level(f.k), v = p.fever.v[f.k], max = T.fever.maxLevel, lit = lv >= max ? 6 : Math.floor(v / max * 6 + 1e-6);
      if (lv > f.lvN && f.lvN >= 0) { f.up = 1; if (lv >= max) this.react('fever', 1.4); }
      f.lvN = lv; f.up = Math.max(0, f.up - dt * 2.5);
      f.segs.forEach((m, i) => { m.visible = i < lit; m.material.color.copy(f.c).lerp(WHITE, f.up * 0.6 + (lv >= max ? 0.25 + 0.25 * Math.sin(t * 9 + i) : 0)); });
      const F = f.F;
      f.label.set(tr(C.text.feverLabel[f.k]), (F.label[3] - F.label[1]) * s * 0.8, undefined, (F.label[2] - F.label[0]) * s * 1.2);
      f.label.at(L.x((F.label[0] + F.label[2]) / 2, this.an), L.y((F.label[1] + F.label[3]) / 2, this.an), -4, 1 + f.up * 0.3);
      f.lv.set(lv >= max ? 'MAX' : `Lv${lv}`, (F.lv[3] - F.lv[1]) * s * 0.75, lv >= max ? '#fff36a' : '#ffffff', (F.lv[2] - F.lv[0]) * s * 1.1);
      f.lv.at(L.x((F.lv[0] + F.lv[2]) / 2, this.an), L.y((F.lv[1] + F.lv[3]) / 2, this.an), -4, 1 + f.up * 0.3);
      if (f.icon) { f.icon.material.uniforms.time.value = t; f.icon.scale.multiplyScalar(1 + f.up * 0.35 + (lv >= max ? 0.06 * Math.sin(t * 8) : 0)); }
    });
    // combo-up reactions
    if (g.combo > this.lastCombo && g.combo > 0 && g.combo % 10 === 0) this.react('combo', 1.2);
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
  meshes() { return [this.layer, this.face, this.ring, this.hp, this.heart, this.ammoIcon, ...this.ticks, ...Object.values(this.t).map((x) => x.m), ...this.fv.flatMap((f) => [f.icon, f.label.m, f.lv.m])].filter(Boolean); }
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
  }
}

// ---------------------------------------------------------------- the reticle: her state decides its form (DESIGN: shape, not colour)
const STATES = ['idle', 'lock', 'fire', 'reload', 'cover', 'empty', 'fever', 'special'];
class Reticle {
  constructor(hud, p) {
    this.hud = hud; this.p = p;
    this.set = hud.B.reticle[p.w.kind === 'mantra' ? 'cat' : 'pink'];   // by who she is, not by which side she stands on
    this.mk = () => { const u = { map: { value: null }, a: { value: 1 }, rin: { value: 0 }, rout: { value: 0 }, split: { value: 0.22 }, flash: { value: 0 }, time: { value: 0 } };
      const m = new THREE.Mesh(quad, mat(RET_FRAG, u)); m.renderOrder = 70 + p.slot; m.frustumCulled = false; hud.g.add(m); return m; };
    this.cur = this.mk(); this.old = this.mk(); this.old.visible = false;
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
    for (const m of [this.cur, this.old, this.line, this.lineB, this.tag, this.name.m, this.ghost]) m.visible = false;
    if (!vis) return;
    // the monster under her aim, if any
    const over = g.actors.find((a) => { if (!a.alive || !a.hitMeshes || !a.hitMeshes().length || !a.def) return false; const b = g.box(a); return p.aimX > b.x0 && p.aimX < b.x1 && p.aimY > b.y0 && p.aimY < b.y1; });
    const inf = p.gatling || p.beaming;
    const st = !g.combat || p.state === 'down' || p.state === 'run' ? 'cover' : p.activeOn ? 'special' : p.state === 'reload' ? 'reload' : (p.ammo <= 0 && !inf) ? 'empty'
      : p.state === 'cover' || p.state === 'hurt' ? 'cover' : p.fever.full ? 'fever' : over ? 'lock' : 'idle';
    if (st !== this.state) {   // the old form flies apart, the new one snaps in turning
      const tmp = this.old; this.old = this.cur; this.cur = tmp;
      this.oldK = 1; this.k = 0.55; this.state = st;   // the new form is there at once (it only finishes popping in)
      const key = `ui/ret_${this.set}_${st}`;
      this.cur.material.uniforms.map.value = tex[key] || tex[`ui/ret_${this.set}_idle`];
    }
    if ((p.shots || 0) !== this.lastShots) { this.kick = 1; this.lastShots = p.shots || 0; }
    this.kick = Math.max(0, this.kick - dt * 9);
    this.k = Math.min(1, this.k + dt * 9); this.oldK = Math.max(0, (this.oldK || 0) - dt * 7);
    const size = H * this.hud.B.reticle.size * (st === 'special' ? 1.5 : st === 'fever' ? 1.25 : st === 'cover' ? 0.7 : 1);
    // motion per state: slow drift, locked = tight fast counter-spin, firing = kicks out, reload = a steady turn, special = a whirl
    const sp = { idle: [0.3, -0.5], lock: [2.2, -3.4], fire: [0.6, -0.6], reload: [3.5, 0], cover: [0.15, -0.15], empty: [0, 0], fever: [1.4, -2.4], special: [5, -7] }[st];
    this.spin += dt;
    // where it is: her aim this very frame (the slow beam aim of the cat girl's special is drawn there, and her pointer gets a dot)
    const x = p.aimX, y = H - p.aimY, pop = 1 + (1 - this.k) * 0.6 * (1 - this.k);
    if (p.beaming && human) { this.ghost.visible = true; this.ghost.position.set(ct.x, H - ct.y, 0); this.ghost.scale.setScalar(H * 0.018); }
    const U = this.cur.material.uniforms;
    U.rin.value = this.spin * sp[1]; U.rout.value = this.spin * sp[0] + (1 - this.k) * 1.2; U.time.value = t;
    U.a.value = Math.min(1, 0.4 + this.k) * (st === 'cover' ? 0.75 : 1); U.flash.value = this.kick * 0.35;
    this.cur.visible = !!U.map.value;
    const shake = st === 'empty' ? Math.sin(t * 50) * H * 0.004 : 0;
    this.cur.position.set(x + shake, y, 0); this.cur.scale.setScalar(size * pop * (1 + this.kick * 0.12));
    if (this.oldK > 0 && this.old.material.uniforms.map.value) {
      this.old.visible = true; const O = this.old.material.uniforms; O.a.value = this.oldK; this.old.position.set(x, y, 0);
      this.old.scale.setScalar(size * (1 + (1 - this.oldK) * 0.8)); O.rout.value += dt * 6;
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
    put(this.label, D.label, { zh: '复活!', ja: '復活!', en: 'REVIVE!' }[lang] || 'REVIVE!');
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

// ---------------------------------------------------------------- the whole HUD
export class HudGL {
  constructor(game) {
    this.game = game; this.B = C.ui.battle; this.L = new Layout();
    this.g = new THREE.Group(); game.hudScene.add(this.g);   // after the post pass: fixed on screen
    this.panels = game.players.map((p) => new Panel(this, p));
    this.top = new Top(this);
    this.reticles = game.players.map((p) => new Reticle(this, p));
    // (the old in-panel reload panel and down timer are replaced by alerts.js: reload stickers in her corner, CONTINUE? on her half)
    this.bossBar = new BossBar(this);
    this.damage = new Damage(this);
    this.space = new Space(this);
    this.stickers = new Stickers(this);
    this.holdUI = new Hold(this);
    this.alerts = new Alerts(this);
    this.visible = true;
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
  update(dt, t) {
    const g = this.game;
    this.L.set(g.W, g.H, g.G.frame, this.B.scale ?? 1);
    if (!this.visible) return;
    this.space.begin();   // what is taken this frame (HUD, boss bar, the girls); pop-ups below find their places around it
    for (const p of this.panels) p.update(dt, t);
    this.top.update(dt, t);
    for (const r of this.reticles) r.update(dt, t);
    this.bossBar.update(dt, t);
    this.damage.update(dt);
    this.stickers.update(dt, t);
    this.alerts.update(dt, t);
    this.holdUI.update(dt, t);
  }
  dispose() { this.game.overlay.remove(this.g); }
}
