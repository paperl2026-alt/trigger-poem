// "You can't shoot now" (docs/DESIGN.md「UI」): while the game holds the fight — moving on, a station cleared, the terrain folding, an anomaly,
// the boss arriving or transforming — two hazard tapes scroll across the screen and a big caption flickers in and out over the picture,
// see-through, like the boss / threat warnings of many games. What it says and its colour depend on the moment (content text/holds.json,
// several lines each, picked at random). It goes away by itself when the fight is on again (or after its time).
import * as THREE from 'three';
import { C } from '../core/content.js';
import { tr, lang } from '../core/i18n.js';
import { Text, picture } from './glhud.js';

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
// a hazard tape: diagonal stripes in the colour and black, a band of words scrolling along the middle, torn-looking edges
const TAPE = `
uniform sampler2D words; uniform vec3 col; uniform float a; uniform float time; uniform float dir; uniform float rep; uniform float px;
varying vec2 vUv;
float h(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  float edge = 0.05 + 0.03 * h(floor(vUv.x * 90.0));
  if (vUv.y < edge || vUv.y > 1.0 - edge) discard;
  float st = step(0.5, fract((vUv.x * px + vUv.y * 60.0) / 70.0 + time * 0.6 * dir));
  vec3 c = mix(vec3(0.07, 0.05, 0.07), col, st);
  float band = step(0.3, vUv.y) * step(vUv.y, 0.7);
  vec2 wu = vec2(vUv.x * rep - time * 0.35 * dir, (vUv.y - 0.3) / 0.4);
  vec4 w = texture2D(words, wu);
  c = band > 0.5 ? mix(vec3(0.07, 0.05, 0.07), w.rgb, w.a) : c;
  float flick = 0.86 + 0.14 * step(0.2, h(floor(time * 18.0)));
  gl_FragColor = vec4(c, a * flick);
}`;

export class Hold {
  constructor(hud) {
    this.hud = hud; this.g = new THREE.Group(); hud.g.add(this.g);
    this.wc = document.createElement('canvas'); this.wc.width = 1024; this.wc.height = 96;
    this.wt = new THREE.CanvasTexture(this.wc); this.wt.wrapS = THREE.RepeatWrapping; this.wt.colorSpace = THREE.SRGBColorSpace;
    this.tapes = [0, 1].map((i) => {
      const u = { words: { value: this.wt }, col: { value: new THREE.Color() }, a: { value: 0 }, time: { value: 0 }, dir: { value: i ? -1 : 1 }, rep: { value: 3 }, px: { value: 1000 } };
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: TAPE, transparent: true, depthTest: false, depthWrite: false }));
      m.renderOrder = 80; m.frustumCulled = false; this.g.add(m); return m;
    });
    this.slab = picture('ui/hud_tag', 81, 0.7); this.g.add(this.slab);
    this.big = new Text(82, { shadow: '#d8141e', sw: 0.1 }); this.sub = new Text(82, { color: '#121012', stroke: '#ffffff', sw: 0.12 });
    this.g.add(this.big.m, this.sub.m);
    this.k = 0; this.on = false; this.kind = null; this.t = 0;
  }
  // kind: a key of text/holds.json; opt: { name, text, dur }
  show(kind, opt = {}) {
    const D = C.text.holds?.[kind] || C.text.holds?.info; if (!D) return;
    const line = opt.text || (D.lines ? (() => { const l = D.lines[Math.floor(Math.random() * D.lines.length)]; return (l[lang] || l.en).replace('{name}', opt.name || ''); })() : '');
    this.kind = kind; this.on = true; this.t = 0; this.dur = opt.dur ?? null; this.combat0 = this.hud.game.combat;
    this.text = line; this.subText = D.sub || ''; this.col = new THREE.Color(D.color || '#ff2a3a');
    this.drawWords(`${D.tape || 'WARNING'}  ◆  ${line}  ◆  `);
    for (const tp of this.tapes) tp.material.uniforms.col.value.copy(this.col);
  }
  drawWords(s) {
    const c = this.wc, g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.font = 'italic 900 62px "Noto Sans SC", "Microsoft YaHei", sans-serif'; g.textBaseline = 'middle';
    const w = g.measureText(s).width;
    c.width = Math.min(4096, Math.max(256, Math.ceil(w)));
    g.font = 'italic 900 62px "Noto Sans SC", "Microsoft YaHei", sans-serif'; g.textBaseline = 'middle';
    g.fillStyle = '#ffffff'; g.fillText(s, 0, c.height / 2 + 4);
    this.wt.dispose(); this.wt = new THREE.CanvasTexture(c); this.wt.wrapS = THREE.RepeatWrapping; this.wt.colorSpace = THREE.SRGBColorSpace;
    for (const tp of this.tapes) { tp.material.uniforms.words.value = this.wt; tp.material.uniforms.rep.value = 1; tp.userData.ww = c.width / c.height; }
  }
  end() { this.on = false; }
  update(dt, time) {
    const g = this.hud.game, L = this.hud.L, H = L.H, W = L.W;
    this.t += dt;
    // over when the fight is back on (if it was off when this came up), or when its time is up
    if (this.on && ((!this.combat0 && g.combat && this.t > 0.3) || (this.dur && this.t > this.dur))) this.on = false;
    this.k += ((this.on ? 1 : 0) - this.k) * Math.min(1, dt * (this.on ? 7 : 5));
    this.g.visible = this.k > 0.01;
    if (!this.g.visible) return;
    const k = this.k, slide = (1 - k) * W * 0.6;
    // the tapes: across the upper and lower part of the screen, tilted, sliding in from opposite sides
    this.tapes.forEach((m, i) => {
      const th = H * 0.1, len = Math.hypot(W, H) * 1.1, U = m.material.uniforms;
      m.position.set(W / 2 + (i ? slide : -slide), H * (i ? 0.29 : 0.71), 0);
      m.rotation.z = i ? 0.07 : -0.05;
      m.scale.set(len, th, 1);
      U.a.value = 0.78 * k; U.time.value = time; U.px.value = len / th * 40;
      U.rep.value = len / (th * 0.4 * (m.userData.ww || 8));
    });
    // the caption: on its slab, flickering in and out (若隐若现)
    const fl = 0.55 + 0.45 * Math.abs(Math.sin(time * 3.2)) * (Math.random() < 0.06 ? 0.3 : 1);
    const bh = H * 0.17;
    this.big.set(this.text, bh * 0.6, '#ffffff', W * 0.62);
    const bw = Math.max(bh * 3.4, this.big.c.width * 1.3);
    this.slab.position.set(W / 2, H * 0.5, 0); this.slab.scale.set(bw * (0.9 + 0.1 * k), bh * 1.25, 1); this.slab.rotation.z = -0.04;
    const SU = this.slab.material.uniforms; SU.a.value = k * fl * 0.9; SU.time.value = time; SU.shine.value = 1;
    SU.recol.value = 0;
    this.big.at(W / 2, H * 0.505, -2.5, 1 + (1 - k) * 0.4); this.big.m.material.uniforms.a.value = k * fl;
    this.sub.set(this.subText, bh * 0.26, '#121012', W * 0.4);
    this.sub.at(W / 2 - bw * 0.28, H * 0.5 + bh * 0.66, -2.5); this.sub.m.material.uniforms.a.value = k * (0.6 + 0.4 * fl);
  }
}
