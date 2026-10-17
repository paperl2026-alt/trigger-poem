// The cat girl's lettering (docs/DESIGN.md「猫娘的字」「特效 shader 要大胆」): designed characters (art, never a standard font — R41 / R39,
// the font only if the art is missing), each one dressed differently every time:
//   a MATERIAL: neon outline, hologram, rainbow enchant, gold metal, ink, frost, lava, halftone — in its colour, which runs along the
//     spectrum toward the next syllable's;
//   a way IN and a way OUT: glow dissolve, directional glow wipe, pixelate, glitch, ink spread, burn, shatter, squish, implode;
//   a MAGIC CIRCLE turning behind it (rings, ticks, a star, runes of light), sparks bursting out as it lands, ink drops as it goes.
// The mantra syllables land on what she hits; the nine seals jump by her paw while she reloads; the spell rides out along her beam.
// One shader does it from a glyph texture with three channels (R fill, G outline, B soft glow). Overlay pixel space (y up).
import * as THREE from 'three';
import { C } from '../core/content.js';
import { tex } from '../core/assets.js';
import { FR } from '../core/particles.js';

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const COMMON = `
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + 1.0), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.07; a *= 0.5; } return v; }
vec3 hsv(float hh, float s, float v){ vec3 p = abs(fract(hh + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0); return v * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), s); }`;
const FRAG = `
uniform sampler2D map; uniform vec3 c0; uniform vec3 c1; uniform float k; uniform float a; uniform float time; uniform float seed;
uniform float mat; uniform float dmode; uniform float diss; uniform float dang; uniform float pix; uniform float split; uniform float wig; uniform float flash;
varying vec2 vUv;
${COMMON}
void main(){
  vec2 uv = vUv;
  uv.x += sin(uv.y * 18.0 + time * 22.0) * wig * 0.04;                         // wiggle
  if (pix > 0.001) { float n = mix(160.0, 7.0, pix); uv = (floor(uv * n) + 0.5) / n; }   // pixelate
  if (dmode > 3.5 && dmode < 4.5 && diss > 0.0) {                               // shatter: chunks fly apart
    vec2 cell = floor(vUv * 6.0);
    uv += (vec2(h(cell), h(cell + 3.1)) - 0.5) * diss * 0.8 + vec2(0.0, diss * diss * 0.35);
  }
  vec4 t = texture2D(map, uv);
  float F = t.r, O = t.g, G = t.b * (1.0 - pix);   // pixelating: the soft glow would turn into blocks
  if (split > 0.001) { float fr = texture2D(map, uv + vec2(split, 0.0)).g, fb = texture2D(map, uv - vec2(split, 0.0)).g; O = max(O, max(fr, fb) * 0.8); }
  vec3 col = mix(c0, c1, k);
  float rim = clamp(O - F, 0.0, 1.0);
  vec3 c; float al;
  if (mat < 0.5) {            // neon: the outline is a glowing tube in the colour, a hot white core, flicker
    float fl = 0.85 + 0.15 * step(0.12, h(vec2(floor(time * 24.0), 1.0)));
    c = col * 1.7 * rim * fl + vec3(1.0) * F * 0.95 + col * G * 0.9; al = max(max(F, rim), G * 0.75);
  } else if (mat < 1.5) {     // hologram: scanlines running up, colour split, see-through bands
    float sc = 0.55 + 0.45 * step(0.45, fract(uv.y * 46.0 - time * 5.0));
    float band = 0.75 + 0.25 * sin(uv.y * 9.0 + time * 7.0);
    c = (col * 1.4 + vec3(0.1, 0.25, 0.3)) * sc * band * max(F, rim) + col * G * 0.6; al = max(F, rim) * 0.85 * sc + G * 0.35;
  } else if (mat < 2.5) {     // rainbow enchant: hue flowing across, twinkles
    vec3 rb = hsv(fract(uv.x * 0.9 + uv.y * 0.5 - time * 0.8 + seed * 0.1), 0.65, 1.0);
    float tw = step(0.985, h(floor(uv * 40.0) + floor(time * 9.0))) * F;
    c = mix(vec3(0.08, 0.04, 0.12), rb, F) + tw * 1.5 + rb * G * 0.7; al = max(max(F, O), G * 0.6);
  } else if (mat < 3.5) {     // metal: a gradient in the colour toward gold, a shine band sweeping, a dark rim
    vec3 hi = mix(col, vec3(1.0, 0.85, 0.45), 0.55);
    vec3 m = mix(col * 0.35, hi * 1.25, smoothstep(0.0, 1.0, uv.y + 0.25 * sin(uv.x * 6.0)));
    float band = smoothstep(0.07, 0.0, abs(fract(uv.x * 0.7 + uv.y * 0.5 - time * 1.4) - 0.5));
    c = mix(vec3(0.05, 0.03, 0.06), m + band * 1.2, F) + col * G * 0.5; al = max(max(F, O), G * 0.5);
  } else if (mat < 4.5) {     // ink: dark ink body, its colour bleeding at the edge, a wet sheen
    float bleed = smoothstep(0.35, 0.65, fbm(uv * 7.0 + time * 0.4)) * G;
    c = mix(col * 1.3, vec3(0.06, 0.03, 0.08), F) + vec3(0.6) * smoothstep(0.08, 0.0, abs(uv.y - 0.7 - 0.1 * sin(uv.x * 5.0))) * F * 0.4;
    al = max(max(F, O), bleed * 0.9);
  } else if (mat < 5.5) {     // frost: icy body, crack lines in the colour, a cold sheen
    float cr = smoothstep(0.03, 0.0, abs(fbm(uv * 9.0) - 0.5));
    c = mix(vec3(0.03, 0.07, 0.12), mix(vec3(0.78, 0.92, 1.0), col, 0.25) + cr * col * 1.3, F) + vec3(0.6, 0.85, 1.0) * G * 0.6;
    al = max(max(F, O), G * 0.55);
  } else if (mat < 6.5) {     // lava: dark crust, glowing veins in the colour, pulsing
    float v = smoothstep(0.06, 0.0, abs(fbm(uv * 6.0 + vec2(0.0, time * 0.3)) - 0.5));
    c = mix(vec3(0.04, 0.02, 0.03), vec3(0.18, 0.08, 0.06) + v * col * 2.2 * (0.8 + 0.2 * sin(time * 9.0)), F) + col * G * 0.8;
    al = max(max(F, O), G * 0.6);
  } else {                    // halftone: dots of the colour on white, an ink outline
    vec2 g = fract(uv * 30.0) - 0.5; float dot_ = step(length(g), 0.18 + 0.25 * (1.0 - uv.y));
    c = mix(vec3(0.05), mix(vec3(1.0), col, dot_), F) + col * G * 0.5; al = max(max(F, O), G * 0.45);
  }
  c += flash * step(0.01, al);
  // coming / going: 1 glow dissolve, 2 directional glow wipe, 3 burn from below, 4 shatter, 5 ink spread
  float keep = 1.0, edge = 0.0;
  if (diss > 0.0) {
    float n = fbm(vUv * 6.0);
    vec2 dv = vec2(cos(dang), sin(dang));
    float th = dmode < 1.5 ? n : dmode < 2.5 ? dot(vUv - 0.5, dv) + 0.5 + (n - 0.5) * 0.2 : dmode < 3.5 ? vUv.y * 0.8 + n * 0.2 : dmode < 4.5 ? h(floor(vUv * 6.0)) : n;
    if (dmode > 4.5) {        // ink spread: the shape goes soft and spreads, fading into its own glow
      al = mix(al, G * 0.8 * (1.0 - diss), diss); c = mix(c, col * 0.4, diss);
    } else {
      keep = step(diss, th);
      edge = 1.0 - smoothstep(0.0, 0.08, th - diss);
    }
  }
  c += edge * (col * 1.8 + 0.6) * step(0.01, al);
  gl_FragColor = vec4(c, al * a * keep);
}`;
// a magic circle in the glyph's colour: rings turning opposite ways, tick marks, a star, runes of light — additive, behind the glyph
const CIRCLE = `
uniform vec3 col; uniform float a; uniform float time; uniform float seed; uniform float spin; uniform float kind;
varying vec2 vUv;
${COMMON}
void main(){
  vec2 p = (vUv - 0.5) * 2.0; float r = length(p), an = atan(p.y, p.x);
  float ring = smoothstep(0.02, 0.0, abs(r - 0.92)) + smoothstep(0.012, 0.0, abs(r - 0.82)) + smoothstep(0.015, 0.0, abs(r - 0.48));
  float a1 = an + spin, a2 = an - spin * 1.6;
  float ticks = step(0.6, fract(a1 * 48.0 / 6.2832)) * smoothstep(0.03, 0.0, abs(r - 0.87));
  float dash = step(0.5, fract(a2 * 12.0 / 6.2832 + 0.25)) * smoothstep(0.025, 0.0, abs(r - 0.64));
  // a star polygon (5 or 6 points) between the inner rings
  float n = kind < 0.5 ? 5.0 : 6.0, sa = mod(a1 * 1.0, 6.2832 / n) - 3.1416 / n;
  float star = smoothstep(0.02, 0.0, abs(r * cos(sa) - 0.4 * cos(3.1416 / n))) * step(r, 0.82);
  // little runes of light around the outer ring
  float rn = step(0.86, h(vec2(floor(a2 * 16.0 / 6.2832), 7.0))) * smoothstep(0.05, 0.0, abs(r - 0.74));
  float v = ring + ticks + dash + star * 0.9 + rn * 1.4;
  float glow = exp(-r * r * 3.0) * 0.15;
  gl_FragColor = vec4(col * (v + glow), clamp(v + glow, 0.0, 1.0) * a);
}`;

// the spectrum the syllables walk along (hue stops); syllable i runs from stop i to a bit past stop i + 1
const STOPS = ['#ff2438', '#ff7a14', '#ffc814', '#2ee05a', '#1aa8ff', '#9a4bff', '#ff4fc8'].map((c) => new THREE.Color(c));
const along = (x, out) => { const n = STOPS.length - 1, f = ((x % n) + n) % n, i = Math.floor(f); return out.copy(STOPS[i]).lerp(STOPS[i + 1], f - i); };
const IN = ['glow', 'wipe', 'pixel', 'glitch', 'squish', 'spin'];
const OUT = ['glow', 'wipe', 'burn', 'shatter', 'ink', 'implode', 'pixel'];
const MATS = 8;
const T_IN = 0.16, T_HOLD = 0.14, T_OUT = 0.3;   // (short: what she hits must stay visible, DESIGN「Boss」)
const rnd = (a, b) => a + Math.random() * (b - a);
const easeOutBack = (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);

// the font, only when no art exists for a character
function glyphTexture(ch) {
  const S = 256, FONT = '900 196px "Noto Sans SC", "Microsoft YaHei", serif';
  const layer = (draw) => { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = FONT; g.lineJoin = 'round'; draw(g); return g.getImageData(0, 0, S, S).data; };
  const fill = layer((g) => { g.fillStyle = '#fff'; g.fillText(ch, S / 2, S / 2 + 8); });
  const line = layer((g) => { g.strokeStyle = '#fff'; g.lineWidth = 30; g.strokeText(ch, S / 2, S / 2 + 8); });
  const glow = layer((g) => { g.filter = 'blur(14px)'; g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 26; g.strokeText(ch, S / 2, S / 2 + 8); g.fillText(ch, S / 2, S / 2 + 8); });
  return pack(S, fill, line, glow, (d, i) => d[i + 3]);
}
function pack(S, fill, line, glow, fillOf) {
  const out = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4, j = ((S - 1 - y) * S + x) * 4;
    out[j] = fillOf(fill, i); out[j + 1] = line[i + 3]; out[j + 2] = glow[i + 3]; out[j + 3] = 255;
  }
  const t = new THREE.DataTexture(out, S, S, THREE.RGBAFormat);
  t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
  return t;
}
// designed lettering (white letters with a black outline) or talisman brush art (black ink): fill / outline / glow masks
function artGlyph(img, inkIsFill = false) {
  const S = 256, k = Math.min(S * 0.9 / img.width, S * 0.9 / img.height), w = img.width * k, h = img.height * k, x = (S - w) / 2, y = (S - h) / 2;
  const layer = (draw) => { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); draw(g); return g.getImageData(0, 0, S, S).data; };
  const src = layer((g) => g.drawImage(img, x, y, w, h));
  const line = inkIsFill ? layer((g) => { for (let a = 0; a < 12; a++) g.drawImage(img, x + Math.cos(a / 12 * 6.283) * 7, y + Math.sin(a / 12 * 6.283) * 7, w, h); }) : src;
  const glow = layer((g) => { g.filter = 'blur(11px)'; g.drawImage(img, x, y, w, h); g.drawImage(img, x, y, w, h); });
  return pack(S, src, line, glow, (d, i) => {
    if (inkIsFill) return d[i + 3];
    const lum = (d[i] + d[i + 1] + d[i + 2]) / 765;
    return Math.round(d[i + 3] * Math.max(0, Math.min(1, (lum - 0.35) / 0.4)));
  });
}

export class Mantra {
  constructor(game) {
    this.game = game;
    this.syll = C.theme.mantra;
    this.cache = new Map();
    this.pool = [];
    this.geo = new THREE.PlaneGeometry(1, 1);
    this.n = 0;
  }
  get styles() { return C.theme.glyphStyle || { mantra: 'catbrush', kuji: 'seal', spell: 'sigil' }; }
  // a character in her lettering style: the designed art (R41 fx/gl2_<style>_u<code>), else R39's, else the font
  texOf(ch, style = 'sigil') {
    const id = `${style}:${ch}`;
    if (!this.cache.has(id)) {
      const code = ch.codePointAt(0).toString(16);
      const art = tex[`fx/gl2_${style}_u${code}`] || ['seal', 'catbrush', 'sigil'].map((s) => tex[`fx/gl2_${s}_u${code}`]).find(Boolean)
        || tex[`fx/gl_sharp_u${code}`] || tex[`fx/gl_cute_u${code}`];
      this.cache.set(id, art?.image ? artGlyph(art.image) : glyphTexture(ch));
    }
    return this.cache.get(id);
  }
  // a talisman picture (fx/fu_*: black brush art), or a character when it is missing
  picOf(key, ch) {
    if (!this.cache.has(key)) this.cache.set(key, tex[key]?.image ? artGlyph(tex[key].image, true) : this.texOf(ch || '令'));
    return this.cache.get(key);
  }
  mesh() {
    let g = this.pool.find((x) => !x.on);
    if (g) return g;
    const u = { map: { value: null }, c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, k: { value: 0 }, a: { value: 1 }, time: { value: 0 },
      seed: { value: 0 }, mat: { value: 0 }, dmode: { value: 0 }, diss: { value: 0 }, dang: { value: 0 }, pix: { value: 0 }, split: { value: 0 }, wig: { value: 0 }, flash: { value: 0 } };
    const m = new THREE.Mesh(this.geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false }));
    m.renderOrder = 41; m.frustumCulled = false; m.visible = false;
    const cu = { col: { value: new THREE.Color() }, a: { value: 0 }, time: { value: 0 }, seed: { value: 0 }, spin: { value: 0 }, kind: { value: 0 } };
    const circle = new THREE.Mesh(this.geo, new THREE.ShaderMaterial({ uniforms: cu, vertexShader: VERT, fragmentShader: CIRCLE, transparent: true, depthTest: false,
      depthWrite: false, blending: THREE.AdditiveBlending }));
    circle.renderOrder = 40.5; circle.frustumCulled = false; circle.visible = false;
    this.game.overlay.add(circle, m);
    g = { m, u, circle, cu, on: false };
    this.pool.push(g);
    return g;
  }
  // dress a glyph: its material, its way in and out, its colours, its circle
  dress(g, i, ch, style, colAt, opt = {}) {
    const n = this.n++;
    g.on = true; g.light = false; g.t = -(opt.delay || 0); g.speed = opt.speed || 1; g.ride = null; g.crit = !!opt.crit; g.burst = false;
    g.u.map.value = opt.tex || this.texOf(ch, style); g.u.seed.value = Math.random() * 100;
    g.u.mat.value = opt.mat ?? ((i * 3 + n) % MATS);
    g.ein = opt.ein || IN[(i + n) % IN.length]; g.eout = opt.eout || OUT[(i * 2 + n) % OUT.length];
    g.u.dang.value = rnd(0, 6.28);
    along(colAt, g.u.c0.value); along(colAt + 1.4, g.u.c1.value);
    g.cu.col.value.copy(g.u.c0.value); g.cu.seed.value = Math.random() * 10; g.cu.kind.value = n % 2; g.circleOn = opt.circle !== false;
    g.rot = rnd(-0.18, 0.18); g.m.renderOrder = opt.order || 41; g.circle.renderOrder = (opt.order || 41) - 0.5;
  }
  // the i-th syllable of her chant lands at (x, y) (overlay px, y up); a streak in its colour from the paw (x0, y0)
  cast(x0, y0, x, y, i, crit = false) {
    const n = this.syll.length, s = ((i % n) + n) % n, g = this.mesh(), H = this.game.H;
    this.dress(g, s, this.syll[s], this.styles.mantra, s, { crit });
    g.x = x + rnd(-H * 0.01, H * 0.01); g.y = y + rnd(-H * 0.01, H * 0.01); g.size = H * (crit ? 0.16 : 0.11); g.light = true;
    this.game.fx.tracer(x0, y0, x, y, g.u.c0.value.getHex());
    return g;
  }
  // a character jumping up by her paw (the nine seals while she reloads): quicker
  flash(ch, i, x, y, size) {
    const g = this.mesh();
    this.dress(g, i, ch, this.styles.kuji, i * 0.75, { speed: 1.7, order: 60 });
    g.x = x; g.y = y; g.size = size;
    return g;
  }
  // one character of the spell riding out along the beam (B: its ends, updated by the beam every frame), then fading at the target
  ride(ch, i, B) {
    const g = this.mesh(), H = this.game.H;
    this.dress(g, i, ch, this.styles.spell, i * 0.35, { speed: 1.6, order: 42, circle: i % 3 === 0 });
    g.size = H * rnd(0.075, 0.11);
    g.ride = { B, u: 0, side: Math.random() < 0.5 ? -1 : 1, amp: rnd(0.4, 1.2), ph: Math.random() * 6 };
    g.x = B.x0; g.y = B.y0;
    return g;
  }
  // a seal stamped beside the beam: 'phrase' = one of the talisman seals; 'last' = 急急如律令, then 敕令 / 㗊
  seal(kind, B, i) {
    const H = this.game.H;
    const put = (key, ch, u, off, size, delay = 0) => {
      const g = this.mesh();
      this.dress(g, i, ch, this.styles.spell, i * 0.35 + 2, { tex: this.picOf(key, ch), speed: 1.1, order: 43, delay, crit: true });
      const x = B.x0 + (B.x1 - B.x0) * u, y = B.y0 + (B.y1 - B.y0) * u, L = Math.hypot(B.x1 - B.x0, B.y1 - B.y0) || 1;
      const nx = -(B.y1 - B.y0) / L, ny = (B.x1 - B.x0) / L;
      g.x = x + nx * off * H; g.y = y + ny * off * H; g.size = size * H;
    };
    const side = Math.random() < 0.5 ? -1 : 1;
    if (kind === 'phrase') {
      // a talisman sigil, a round seal, or one of the big single characters (敕 令 雷 鬼 罡 斬)
      const n = Math.floor(Math.random() * 24), key = n < 9 ? `fx/fu_a_${n}` : n < 18 ? `fx/fu_b_${n - 9}` : `fx/fu_w_${n - 15}`;
      put(key, '符', rnd(0.3, 0.8), side * rnd(0.1, 0.16), rnd(0.16, 0.22));
    } else {
      put('fx/fu_w_1', '令', 0.55, side * 0.15, 0.34);          // 急急如律令
      put('fx/fu_w_0', '令', 0.85, -side * 0.12, 0.26, 0.18);   // 敕令
      put('fx/fu_w_2', '㗊', 0.25, -side * 0.1, 0.2, 0.3);      // 㗊
    }
  }
  burst(g, out) {   // sparks of light as it lands, ink drops and shards as it goes
    const fx = this.game.fx, c = g.u.c0.value, H = this.game.H, n = out ? 6 : 9;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.283), s = H * rnd(0.3, 1.0);
      if (out) fx.oNorm.emit({ x: g.x + Math.cos(a) * g.size * 0.3, y: g.y + Math.sin(a) * g.size * 0.3, vx: Math.cos(a) * s * 0.4, vy: Math.sin(a) * s * 0.4 - H * 0.1,
        life: rnd(0.35, 0.6), size: H * rnd(0.012, 0.024), size1: H * 0.006, color: [c.r * 0.5, c.g * 0.5, c.b * 0.5], a: 0.9, a1: 0, frame: FR.INK, grav: H * 1.6, drag: 1.5 });
      else fx.oAdd.emit({ x: g.x, y: g.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: a, life: rnd(0.15, 0.32), size: H * rnd(0.03, 0.05), size1: H * 0.01,
        color: [c.r, c.g, c.b], a: 1, a1: 0, frame: i % 3 ? FR.STREAK : FR.STAR, drag: 6 });
    }
  }
  update(dt) {
    const H = this.game.H, time = performance.now() / 1000;
    for (const g of this.pool) {
      if (!g.on) continue;
      g.t += dt * (g.speed || 1);
      if (g.t < 0) { g.m.visible = g.circle.visible = false; continue; }   // waiting for its turn
      if (g.ride) {   // riding the beam: out along it, weaving around it; at the target it holds and goes
        const r = g.ride, B = r.B; r.u = Math.min(1, r.u + dt / 0.42);
        const L = Math.hypot(B.x1 - B.x0, B.y1 - B.y0) || 1, nx = -(B.y1 - B.y0) / L, ny = (B.x1 - B.x0) / L;
        const w = Math.sin(r.u * 9 + r.ph) * B.w * r.amp * r.side * Math.sin(r.u * Math.PI);
        g.x = B.x0 + (B.x1 - B.x0) * r.u + nx * w; g.y = B.y0 + (B.y1 - B.y0) * r.u + ny * w;
        if (r.u < 1 && g.t > T_IN + T_HOLD * 0.5) g.t = T_IN + T_HOLD * 0.5;
      }
      const t = g.t, u = g.u, m = g.m;
      if (t > T_IN + T_HOLD + T_OUT) { g.on = false; m.visible = g.circle.visible = false; continue; }
      m.visible = true;
      let sx = 1, sy = 1, rot = g.rot, dx = 0, dy = 0;
      u.a.value = g.light ? 0.85 : 1; u.diss.value = 0; u.dmode.value = 0; u.pix.value = 0; u.split.value = 0; u.wig.value = 0; u.flash.value = g.crit ? 0.12 : 0; u.time.value = time;
      u.k.value = Math.min(1, Math.max(0, (t - T_IN * 0.5) / (T_HOLD + T_OUT * 0.6)));
      const mode = (e) => ({ glow: 1, wipe: 2, burn: 3, shatter: 4, ink: 5 }[e] || 0);
      if (t < T_IN) {   // ---- in
        const e = t / T_IN;
        if (g.ein === 'glow' || g.ein === 'wipe') { u.dmode.value = mode(g.ein); u.diss.value = 1 - e; sx = sy = 1.15 - 0.15 * e; }
        else if (g.ein === 'pixel') { u.pix.value = 1 - e; }
        else if (g.ein === 'glitch') { u.split.value = 0.08 * (1 - e); dx = (Math.random() - 0.5) * H * 0.03 * (1 - e); u.a.value = Math.random() < 0.25 * (1 - e) ? 0.2 : 1; }
        else if (g.ein === 'squish') { const q = easeOutBack(e); sx = 0.3 + 0.7 * q + (1 - e) * 0.6; sy = 1.8 - 0.8 * q; }
        else if (g.ein === 'spin') { sx = sy = easeOutBack(e); rot += (1 - e) * Math.PI * 2; }
        u.flash.value += (1 - e) * 0.5;
      } else {
        if (!g.burst) { g.burst = true; this.burst(g, false); }
        if (t > T_IN + T_HOLD) {   // ---- out
          const e = (t - T_IN - T_HOLD) / T_OUT;
          if (!g.burstOut && e > 0.2) { g.burstOut = true; if (g.eout === 'ink' || g.eout === 'burn' || g.eout === 'shatter') this.burst(g, true); }
          if (g.eout === 'implode') { sx = sy = Math.max(0.01, 1 - e * e); rot += e * 3; u.flash.value = e < 0.85 ? e * 0.8 : 1; u.a.value = e < 0.85 ? 1 : (1 - e) / 0.15; }
          else if (g.eout === 'pixel') { u.pix.value = e; u.a.value = 1 - e * e; }
          else { u.dmode.value = mode(g.eout); u.diss.value = e; if (g.eout === 'ink') { sx = sy = 1 + e * 0.35; u.wig.value = e; } }
        } else u.wig.value = 0.15 * Math.sin(t * 20);   // a little life while it holds
      }
      m.position.set(g.x + dx, g.y + dy, 0);
      m.rotation.z = rot;
      m.scale.set(g.size * sx, g.size * sy, 1);
      // the circle behind: opens as the glyph lands, turns, fades as it goes
      const ci = g.circle;
      ci.visible = g.circleOn;
      if (ci.visible) {
        const open = Math.min(1, t / (T_IN * 1.2)), gone = Math.max(0, (t - T_IN - T_HOLD) / T_OUT);
        ci.position.set(g.x, g.y, 0); ci.scale.setScalar(g.size * (0.6 + 1.1 * easeOutBack(open)) * (1 + gone * 0.3));
        g.cu.a.value = Math.min(1, open * 1.5) * (1 - gone) * (g.light ? 0.75 : 1.3); g.cu.time.value = time; g.cu.spin.value = t * 3 + g.cu.seed.value;
      }
    }
  }
  clear() { for (const g of this.pool) { g.on = false; g.m.visible = g.circle.visible = false; } }
}
