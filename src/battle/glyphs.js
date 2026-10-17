// The cat girl's mantra syllables (docs/DESIGN.md「猫娘的真言字」): every syllable its own. Each runs along the spectrum from its colour
// toward the next syllable's (唵 red → orange, 嘛 orange-yellow → green, 呢 → blue ...), and each has its own way in and its own way out:
//   唵 slams in big → small, then turns from solid to hollow and fades
//   嘛 appears with a metallic glint sweeping across, dissolves in noise
//   呢 spins in growing, shatters into drifting chunks
//   叭 drops in like a stamp (squash, a ring), burns away from the bottom with a glowing edge
//   咪 is brushed in from the top, stretches upward and vanishes
//   吽 glitches in (colour split, jitter), implodes to a point with a flash
// One shader does all of it from a glyph texture with three channels (R fill, G outline, B soft glow). Overlay pixel space (y up).
import * as THREE from 'three';
import { C } from '../core/content.js';

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FRAG = `
uniform sampler2D map; uniform vec3 c0; uniform vec3 c1; uniform float k; uniform float a; uniform float fill; uniform float sheen;
uniform float diss; uniform float dmode; uniform float wipe; uniform float split; uniform float flash; uniform float seed;
varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + 1.0), f.x), f.y); }
void main(){
  vec2 uv = vUv;
  if (dmode > 1.5 && diss > 0.0) {   // shatter: chunks drift apart and turn
    vec2 cell = floor(vUv * 7.0);
    uv += (vec2(h(cell), h(cell + 3.1)) - 0.5) * diss * 0.7 + vec2(0.0, diss * diss * 0.3);
  }
  vec4 t = texture2D(map, uv);
  float F = t.r, O = t.g, G = t.b;
  vec3 col = mix(c0, c1, k);
  // dissolve: 0 noise, 1 burn from the bottom, 2 shatter (chunks fade as they fly)
  float n = noise(vUv * 9.0);
  float th = dmode < 0.5 ? n : dmode < 1.5 ? vUv.y * 0.75 + n * 0.25 : h(floor(vUv * 7.0));
  float keep = diss <= 0.0 ? 1.0 : step(diss, th);
  float edge = diss <= 0.0 ? 0.0 : (1.0 - smoothstep(0.0, 0.07, th - diss));
  // brushed in from the top
  float vis = 1.0 - smoothstep(wipe - 0.08, wipe, 1.0 - vUv.y);
  // the fill (solid → hollow), the outline (dark, lights up in the colour when hollow), a glint, the glow
  vec3 fillC = col * (0.8 + 0.45 * F) + flash;
  float sh = sheen > -0.5 ? smoothstep(0.09, 0.0, abs(vUv.x * 0.8 + vUv.y * 0.6 - sheen * 1.9 + 0.25)) : 0.0;
  fillC = mix(fillC, vec3(1.0, 0.98, 0.9), sh);
  vec3 outC = mix(vec3(0.08, 0.05, 0.1), col * 1.25 + 0.25, 1.0 - fill);
  float fA = F * fill;
  vec3 c = mix(outC, fillC, fA);
  float al = max(fA, O);
  c = mix(col * 1.3 + 0.1, c, al / max(al + G * 0.6 * (1.0 - al), 1e-3));
  al = max(al, G * 0.6);
  // colour split (glitch)
  if (split > 0.0) {
    float fr = texture2D(map, uv + vec2(split, 0.0)).r, fb = texture2D(map, uv - vec2(split, 0.0)).r;
    c += vec3(fr, 0.0, fb) * 0.9; al = max(al, max(fr, fb) * 0.8);
  }
  c += edge * (col * 1.5 + 0.4) * step(0.001, al);
  gl_FragColor = vec4(c, al * a * keep * vis);
}`;

// the spectrum the syllables walk along (hue stops), and glyph i runs from stop i to a bit past stop i + 1
const STOPS = ['#ff2438', '#ff7a14', '#ffc814', '#2ee05a', '#1aa8ff', '#9a4bff', '#ff4fc8'].map((c) => new THREE.Color(c));
const along = (x, out) => { const n = STOPS.length - 1, f = ((x % n) + n) % n, i = Math.floor(f); return out.copy(STOPS[i]).lerp(STOPS[i + 1], f - i); };
// per syllable: [enter, exit]
const STYLE = [['shrink', 'hollow'], ['glint', 'dissolve'], ['spin', 'shatter'], ['stamp', 'burn'], ['brush', 'stretch'], ['glitch', 'implode']];
const T_IN = 0.18, T_HOLD = 0.24, T_OUT = 0.4;
const rnd = (a, b) => a + Math.random() * (b - a);
const easeOutBack = (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);

// a syllable as three masks in one texture: R fill, G outline, B soft glow
function glyphTexture(ch) {
  const S = 256, FONT = '900 196px "SimSun", "Songti SC", "Noto Serif SC", "Microsoft YaHei", serif';
  const layer = (draw) => { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = FONT; g.lineJoin = 'round'; draw(g); return g.getImageData(0, 0, S, S).data; };
  const fill = layer((g) => { g.fillStyle = '#fff'; g.fillText(ch, S / 2, S / 2 + 8); });
  const line = layer((g) => { g.strokeStyle = '#fff'; g.lineWidth = 30; g.strokeText(ch, S / 2, S / 2 + 8); });
  const glow = layer((g) => { g.filter = 'blur(14px)'; g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 26; g.strokeText(ch, S / 2, S / 2 + 8); g.fillText(ch, S / 2, S / 2 + 8); });
  const out = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4, j = ((S - 1 - y) * S + x) * 4;   // flip: texture rows go bottom-up
    out[j] = fill[i + 3]; out[j + 1] = line[i + 3]; out[j + 2] = glow[i + 3]; out[j + 3] = 255;
  }
  const t = new THREE.DataTexture(out, S, S, THREE.RGBAFormat);
  t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
  return t;
}

export class Mantra {
  constructor(game) {
    this.game = game;
    this.syll = C.theme.mantra;
    this.cache = new Map();
    this.tex = this.syll.map((ch) => this.texOf(ch));
    this.pool = [];
    this.geo = new THREE.PlaneGeometry(1, 1);
  }
  texOf(ch) { if (!this.cache.has(ch)) this.cache.set(ch, glyphTexture(ch)); return this.cache.get(ch); }
  // any character with the i-th style and colour (the cat girl's nine seals while she reloads): shorter, no streak
  flash(ch, i, x, y, size) {
    const n = STYLE.length, s = ((i % n) + n) % n, g = this.mesh();
    g.on = true; g.t = 0; g.s = s; g.x = x; g.y = y; g.rot = rnd(-0.12, 0.12); g.size = size; g.crit = false; g.speed = 1.7;
    g.m.renderOrder = 60;   // over the reload close-ups
    g.u.map.value = this.texOf(ch); g.u.seed.value = Math.random() * 100;
    along(i * 0.75, g.u.c0.value); along(i * 0.75 + 1.2, g.u.c1.value);
    g.u.dmode.value = STYLE[s][1] === 'burn' ? 1 : STYLE[s][1] === 'shatter' ? 2 : 0;
    return g;
  }
  mesh() {
    let g = this.pool.find((x) => !x.on);
    if (g) return g;
    const u = { map: { value: null }, c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, k: { value: 0 }, a: { value: 1 },
      fill: { value: 1 }, sheen: { value: -1 }, diss: { value: 0 }, dmode: { value: 0 }, wipe: { value: 1 }, split: { value: 0 },
      flash: { value: 0 }, seed: { value: 0 } };
    const m = new THREE.Mesh(this.geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true,
      depthTest: false, depthWrite: false }));
    m.renderOrder = 41; m.frustumCulled = false; m.visible = false;
    this.game.overlay.add(m);
    g = { m, u, on: false };
    this.pool.push(g);
    return g;
  }
  // the i-th syllable of her chant lands at (x, y) (overlay px, y up); a streak in its colour from the paw (x0, y0)
  cast(x0, y0, x, y, i, crit = false) {
    const n = this.syll.length, s = ((i % n) + n) % n, g = this.mesh(), H = this.game.H;
    g.on = true; g.t = 0; g.s = s; g.x = x + rnd(-H * 0.01, H * 0.01); g.y = y + rnd(-H * 0.01, H * 0.01); g.rot = rnd(-0.18, 0.18);
    g.size = H * (crit ? 0.19 : 0.135); g.crit = crit; g.speed = 1;
    g.m.renderOrder = 41;
    g.u.map.value = this.tex[s]; g.u.seed.value = Math.random() * 100;
    along(s, g.u.c0.value); along(s + 1.5, g.u.c1.value);
    g.u.dmode.value = STYLE[s][1] === 'burn' ? 1 : STYLE[s][1] === 'shatter' ? 2 : 0;
    this.game.fx.tracer(x0, y0, x, y, g.u.c0.value.getHex());
    return g;
  }
  update(dt) {
    const H = this.game.H;
    for (const g of this.pool) {
      if (!g.on) continue;
      g.t += dt * (g.speed || 1);
      const t = g.t, u = g.u, [ein, eout] = STYLE[g.s], m = g.m;
      if (t > T_IN + T_HOLD + T_OUT) { g.on = false; m.visible = false; continue; }
      m.visible = true;
      // defaults (held)
      let sx = 1, sy = 1, rot = g.rot, dx = 0, dy = 0;
      u.a.value = 1; u.fill.value = 1; u.sheen.value = -1; u.diss.value = 0; u.wipe.value = 1; u.split.value = 0; u.flash.value = g.crit ? 0.15 : 0;
      u.k.value = Math.min(1, Math.max(0, (t - T_IN * 0.5) / (T_HOLD + T_OUT * 0.6)));   // its colour runs on toward the next syllable's
      if (t < T_IN) {   // ---- in
        const e = t / T_IN;
        if (ein === 'shrink') { const s = 2.6 - 1.6 * easeOutBack(e); sx = sy = s; u.a.value = Math.min(1, e * 3); }
        else if (ein === 'glint') { u.sheen.value = e * 1.2; u.flash.value = 0.5 * (1 - e); }
        else if (ein === 'spin') { const s = easeOutBack(e); sx = sy = s; rot += (1 - e) * Math.PI * 2; }
        else if (ein === 'stamp') { const d = 1 - e; dy = d * d * H * 0.12; const sq = e > 0.75 ? 1 + (1 - e) * 1.2 : 1; sx = sq; sy = 2 - sq; }
        else if (ein === 'brush') { u.wipe.value = e * 1.1; }
        else if (ein === 'glitch') { u.split.value = 0.06 * (1 - e); dx = (Math.random() - 0.5) * H * 0.03 * (1 - e); u.a.value = Math.random() < 0.25 * (1 - e) ? 0.2 : 1; }
      } else if (t > T_IN + T_HOLD) {   // ---- out
        const e = (t - T_IN - T_HOLD) / T_OUT;
        if (eout === 'hollow') { u.fill.value = Math.max(0, 1 - e * 2); u.a.value = e < 0.5 ? 1 : 1 - (e - 0.5) * 2; sx = sy = 1 + e * 0.2; }
        else if (eout === 'dissolve' || eout === 'burn' || eout === 'shatter') { u.diss.value = e; }
        else if (eout === 'stretch') { sy = 1 + e * 1.6; sx = 1 - e * 0.5; dy = e * H * 0.06; u.a.value = 1 - e; }
        else if (eout === 'implode') { sx = sy = Math.max(0.01, 1 - e * e); rot += e * 3; u.flash.value = e < 0.85 ? e * 0.8 : 1; u.a.value = e < 0.85 ? 1 : (1 - e) / 0.15; }
      } else if (ein === 'glint') u.sheen.value = -1;
      m.position.set(g.x + dx, g.y + dy, 0);
      m.rotation.z = rot;
      m.scale.set(g.size * sx, g.size * sy, 1);
    }
  }
  clear() { for (const g of this.pool) { g.on = false; g.m.visible = false; } }
}
