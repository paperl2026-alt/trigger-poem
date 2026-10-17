// Effects: particles in the world and on the overlay, tracers, slash trail, lock-on rings, SFX stamps.
import { C } from '../core/content.js';
import * as THREE from 'three';
import { tex } from '../core/assets.js';
import { Particles, buildAtlas, FR } from '../core/particles.js';
import { paperMaterial } from '../core/paper.js';
import { Ease } from '../core/tween.js';
import { VERT as FXVERT, GLOW_FRAG, RING_FRAG } from './muzzle.js';
import { Text } from '../ui/glhud.js';
import { lang } from '../core/i18n.js';
// the countdown on a warning's ring: the time left as a red arc running down from the top
const ARC_FRAG = `
uniform float p; uniform vec3 col; uniform float a;
varying vec2 vUv;
void main(){
  vec2 q = (vUv - 0.5) * 2.0; float r = length(q);
  if (r < 0.62 || r > 0.82) discard;
  float u = mod(atan(q.x, q.y) + 6.28319, 6.28319) / 6.28319;   // 0 at the top, clockwise
  if (u > p) discard;
  gl_FragColor = vec4(col, a * smoothstep(0.82, 0.78, r) * smoothstep(0.62, 0.66, r));
}`;

// colours / threat rings / mantra glyphs: content theme.json (filled by initTheme() once the packs are loaded)
export const COL = {};
export function initTheme() {
  Object.assign(COL, C.theme.col);
  Object.assign(THREAT, C.theme.threat);
}
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export const shadowTex = () => canvasTex(128, 64, (g) => {
  const gr = g.createRadialGradient(64, 32, 0, 64, 32, 62);
  gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.setTransform(1, 0, 0, 0.5, 0, 16);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

// Threat rings: the SHAPE + COLOUR says what to do, the shrink says when. No words.
//  melee  (red, spiked)        cover won't save you: kill it
//  ranged (yellow, 4 ticks)    hide or kill
//  shot   (orange, dashed)     a thing in flight: shoot it down
//  heavy  (violet, chevrons)   can't be stopped: hide
export const THREAT = {};
const threatTex = (type) => canvasTex(256, 256, (g) => {
  g.translate(128, 128);
  g.strokeStyle = '#fff'; g.fillStyle = '#fff';
  g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 6;
  if (type === 'melee') {
    g.lineWidth = 12; g.beginPath(); g.arc(0, 0, 88, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 10; i++) { g.rotate(Math.PI / 5); g.beginPath(); g.moveTo(-13, -92); g.lineTo(0, -126); g.lineTo(13, -92); g.closePath(); g.fill(); }
  } else if (type === 'ranged') {
    g.lineWidth = 10; g.beginPath(); g.arc(0, 0, 100, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 80, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -126); g.lineTo(14, -100); g.lineTo(-14, -100); g.closePath(); g.fill(); }
  } else if (type === 'shot') {
    g.lineWidth = 12;
    for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(0, 0, 96, i * Math.PI / 4 + 0.12, (i + 1) * Math.PI / 4 - 0.12); g.stroke(); }
    g.beginPath(); g.arc(0, 0, 14, 0, Math.PI * 2); g.fill();
  } else {
    g.lineWidth = 14; g.beginPath(); g.arc(0, 0, 104, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 78, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 3; i++) { g.rotate(Math.PI * 2 / 3); g.lineWidth = 12; g.beginPath(); g.moveTo(-26, -66); g.lineTo(0, -40); g.lineTo(26, -66); g.stroke(); }
  }
});
// torn-paper bullet hole for walls / floor / props (a few random variants)
const holeTex = () => canvasTex(128, 128, (g) => {
  g.translate(64, 64);
  const blob = (r0, r1, n) => { g.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, r = r0 + Math.random() * (r1 - r0); if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r); else g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); };
  g.fillStyle = 'rgba(18,6,8,0.9)'; blob(32, 54, 16);
  g.fillStyle = 'rgba(252,246,232,1)'; blob(26, 46, 16);
  g.strokeStyle = 'rgba(18,6,8,0.85)'; g.lineWidth = 3;
  for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28, L = 38 + Math.random() * 20; g.beginPath(); g.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); g.lineTo(Math.cos(a + 0.2) * L * 0.6, Math.sin(a + 0.2) * L * 0.6); g.lineTo(Math.cos(a) * L, Math.sin(a) * L); g.stroke(); }
  g.fillStyle = '#100406'; blob(14, 22, 11);
});

// the six syllables of the mantra, burned gold
const glyphTex = (ch, pal = 'gold') => canvasTex(256, 256, (g) => {
  const [glow, ink, fill] = C.theme.glyphPal[pal];
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 190px "SimSun", "Songti SC", "Noto Serif SC", "Microsoft YaHei", serif';
  g.shadowColor = glow; g.shadowBlur = 28;
  g.lineJoin = 'round'; g.lineWidth = 22; g.strokeStyle = ink; g.strokeText(ch, 128, 136);
  g.fillStyle = fill; g.fillText(ch, 128, 136);
  g.shadowBlur = 0; g.fillStyle = '#fffbe6'; g.font = '900 150px "SimSun", "Songti SC", "Noto Serif SC", "Microsoft YaHei", serif'; g.globalAlpha = 0.55; g.fillText(ch, 128, 136);
});
const BEAM_FRAG = `uniform float t; uniform float a; uniform vec3 col; varying vec2 vUv;
void main(){ float y = abs(vUv.y - 0.5) * 2.0;
  float wob = 0.08 * sin(vUv.x * 40.0 - t * 50.0) + 0.05 * sin(vUv.x * 13.0 + t * 23.0);
  float core = smoothstep(0.42 + wob, 0.0, y);
  float glow = smoothstep(1.0, 0.25 + wob, y);
  float rings = step(0.82, fract(vUv.x * 6.0 - t * 9.0)) * smoothstep(1.0, 0.5, y) * 0.5;
  vec3 c = mix(col, vec3(1.0, 0.98, 0.9), core) + rings * col;
  float fade = smoothstep(0.0, 0.06, vUv.x);
  gl_FragColor = vec4(c, a * fade * max(core, glow * 0.75 + rings)); }`;

// the cat paw's rune: a red pentagram seal (always the same shape, drawn by the engine)
const runeTex = () => canvasTex(256, 256, (g) => {
  g.translate(128, 128);
  g.strokeStyle = '#ff3048'; g.fillStyle = '#ff3048'; g.shadowColor = 'rgba(80,255,190,0.9)'; g.shadowBlur = 16; g.lineJoin = 'round';
  g.lineWidth = 9; g.beginPath(); g.arc(0, 0, 104, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 88, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 7; g.beginPath();
  for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 4 / 5; const x = Math.cos(a) * 82, y = Math.sin(a) * 82; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
  g.stroke();
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.save(); g.rotate(a); g.fillRect(-9, -122, 18, 18); g.restore(); }
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.beginPath(); g.moveTo(Math.cos(a) * 112, Math.sin(a) * 112); g.lineTo(Math.cos(a) * 126, Math.sin(a) * 126); g.stroke(); }
});

const notchTex = () => canvasTex(64, 64, (g) => { g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 6; g.beginPath(); g.moveTo(32, 58); g.lineTo(6, 10); g.lineTo(58, 10); g.closePath(); g.stroke(); g.fill(); });

const TRACER_FRAG = `uniform float a; uniform vec3 col; varying vec2 vUv;
void main(){ float k = smoothstep(0.0, 1.0, vUv.x); float w = 1.0 - abs(vUv.y - 0.5) * 2.0;
  gl_FragColor = vec4(mix(col, vec3(1.0), w * w) , a * k * w); }`;
const BASIC_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

class SlashTrail {
  constructor(parent) {
    this.max = 48;
    this.pts = [];
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.max * 2 * 3);
    this.al = new Float32Array(this.max * 2 * 2);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aw', new THREE.BufferAttribute(this.al, 2).setUsage(THREE.DynamicDrawUsage));
    const idx = [];
    for (let i = 0; i < this.max - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    geo.setIndex(idx);
    geo.setDrawRange(0, 0);
    this.geo = geo;
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      vertexShader: 'attribute vec2 aw; varying vec2 vW; void main(){ vW = aw; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec2 vW; void main(){ float c = 1.0 - abs(vW.y); gl_FragColor = vec4(mix(vec3(1.0, 0.2, 0.62), vec3(1.0), smoothstep(0.35, 0.9, c)), vW.x * smoothstep(0.0, 0.3, c)); }',
      transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 45;
    parent.add(this.mesh);
  }
  add(x, y, t) {
    const l = this.pts[this.pts.length - 1];
    if (l && Math.hypot(l.x - x, l.y - y) < 3) return;
    this.pts.push({ x, y, t });
    if (this.pts.length > this.max) this.pts.shift();
  }
  update(t, H) {
    const life = 0.22;
    while (this.pts.length && t - this.pts[0].t > life) this.pts.shift();
    const P = this.pts, n = P.length;
    if (n < 2) { this.geo.setDrawRange(0, 0); return; }
    for (let i = 0; i < n; i++) {
      const p = P[i], q = P[Math.min(n - 1, i + 1)], o = P[Math.max(0, i - 1)];
      let dx = q.x - o.x, dy = q.y - o.y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
      const age = (t - p.t) / life, along = i / (n - 1);
      const w = H * 0.035 * (1 - age) * Math.sin(Math.PI * Math.min(1, along * 1.1)) + 1;
      this.pos.set([p.x - dy * w, p.y + dx * w, 0, p.x + dy * w, p.y - dx * w, 0], i * 6);
      const a = (1 - age);
      this.al.set([a, -1, a, 1], i * 4);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aw.needsUpdate = true;
    this.geo.setDrawRange(0, (n - 1) * 6);
  }
  clear() { this.pts.length = 0; }
}

export class FX {
  constructor(game) {
    this.game = game;
    const atlas = buildAtlas({ star: tex['hud/spark']?.image });
    this.wNorm = new Particles(atlas, { max: 1600, renderOrder: 20 });
    this.wAdd = new Particles(atlas, { max: 900, additive: true, renderOrder: 21 });
    game.world.scene.add(this.wNorm.mesh, this.wAdd.mesh);
    this.oNorm = new Particles(atlas, { max: 500, renderOrder: 50 });
    this.oAdd = new Particles(atlas, { max: 500, additive: true, renderOrder: 51 });
    game.overlay.add(this.oNorm.mesh, this.oAdd.mesh);
    this.items = [];
    this.decalGeo = new THREE.PlaneGeometry(1, 1);
    this.decalMats = [0, 1, 2].map(() => new THREE.MeshBasicMaterial({ map: holeTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    this.decals = [];
    this.rings = { melee: threatTex('melee'), ranged: threatTex('ranged'), shot: threatTex('shot'), heavy: threatTex('heavy') };
    this.notch = notchTex();
    this.trail = new SlashTrail(game.overlay);
    this.tracers = [];
    const tg = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(tg, new THREE.ShaderMaterial({ uniforms: { a: { value: 0 }, col: { value: new THREE.Color(1, 0.3, 0.7) } }, vertexShader: BASIC_VERT, fragmentShader: TRACER_FRAG, transparent: true, depthTest: false, blending: THREE.AdditiveBlending }));
      m.renderOrder = 40; m.visible = false; m.frustumCulled = false;
      game.overlay.add(m);
      this.tracers.push({ m, t: 0 });
    }
    this.tracerI = 0;
    this.stampCD = {};
    this.glyphs = { gold: C.theme.mantra.map((c) => glyphTex(c, 'gold')), jade: C.theme.mantra.map((c) => glyphTex(c, 'jade')) };
    this.runeT = runeTex();
  }

  // ---------- generic ----------
  add(item) { this.items.push(item); return item; }
  update(dt, t) {
    this.wNorm.update(dt); this.wAdd.update(dt); this.oNorm.update(dt); this.oAdd.update(dt);
    for (let i = this.items.length - 1; i >= 0; i--) if (!this.items[i].update(dt)) this.items.splice(i, 1);
    for (const tr of this.tracers) if (tr.m.visible) { tr.t -= dt; tr.m.material.uniforms.a.value = Math.max(0, tr.t / 0.07); if (tr.t <= 0) tr.m.visible = false; }
    this.trail.update(t, this.game.H);
    for (const k in this.stampCD) this.stampCD[k] -= dt;
  }
  clear() {
    for (const d of this.decals) d.parent && d.parent.remove(d);
    this.decals.length = 0;
    this.wNorm.clear(); this.wAdd.clear(); this.oNorm.clear(); this.oAdd.clear();
    for (const it of this.items) it.dispose && it.dispose();
    this.items.length = 0;
    this.trail.clear();
  }

  // ---------- world bursts ----------
  // a missed shot: hole in whatever it hit (stays), chips flying off the surface, a spark
  decal(hit) {
    const n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 0, 1);
    const size = Math.min(0.5, Math.max(0.12, hit.distance * 0.045)); // comic scale: reads at any distance
    // solid surfaces keep the hole; semi-transparent paper props would paint over it, so they only burst
    if (!hit.object.material.transparent) {
      const m = new THREE.Mesh(this.decalGeo, this.decalMats[Math.floor(Math.random() * this.decalMats.length)]);
      m.scale.setScalar(size * rnd(0.85, 1.15));
      m.position.copy(hit.point).addScaledVector(n, 0.006);
      m.lookAt(hit.point.clone().add(n));
      m.rotateZ(Math.random() * 6.28);
      m.renderOrder = -3;
      m.raycast = () => {};
      hit.object.attach(m); // rides along with doors
      this.decals.push(m);
      if (this.decals.length > 160) { const old = this.decals.shift(); old.parent && old.parent.remove(old); }
    }
    const p = hit.point;
    this.wNorm.emit({ x: p.x + n.x * 0.05, y: p.y + n.y * 0.05, z: p.z + n.z * 0.05, life: 0.09, size: size * 1.2, size1: size * 2.2, rot: Math.random() * 6.28, color: [1, 0.95, 0.85], a: 1, a1: 0.2, frame: FR.STAR });
    for (let i = 0; i < 6; i++) {
      const sp = rnd(1.5, 3.5);
      this.wNorm.emit({ x: p.x, y: p.y, z: p.z, vx: n.x * sp + rnd(-0.8, 0.8), vy: n.y * sp + rnd(0, 1.5), vz: n.z * sp + rnd(-0.8, 0.8), life: rnd(0.4, 0.8), size: size * rnd(0.25, 0.45), vrot: rnd(-14, 14), color: pick([COL.paper, COL.red, COL.bone]), a: 1, a1: 0.2, frame: FR.PAPER, grav: 7, drag: 1.5 });
    }
    this.wAdd.emit({ x: p.x + n.x * 0.05, y: p.y + n.y * 0.05, z: p.z + n.z * 0.05, life: 0.07, size: 0.1, size1: 0.22, color: [1, 0.85, 0.6], a: 0.9, a1: 0, frame: FR.GLOW });
    this.wNorm.emit({ x: p.x + n.x * 0.08, y: p.y + n.y * 0.08, z: p.z + n.z * 0.08, vx: n.x * 0.4, vy: 0.3, vz: n.z * 0.4, life: 0.5, size: 0.08, size1: 0.3, color: COL.bone, a: 0.5, a1: 0, frame: FR.SMOKE, drag: 2 });
  }
  confetti(p, n = 14, power = 1, colors = [COL.paper, COL.pink, COL.bone, COL.lime]) {
    for (let i = 0; i < n; i++) {
      this.wNorm.emit({
        x: p.x, y: p.y, z: p.z + 0.05, vx: rnd(-3, 3) * power, vy: rnd(0.5, 4.5) * power, vz: rnd(-1, 2) * power,
        life: rnd(0.8, 1.6), size: rnd(0.06, 0.16) * Math.sqrt(power), vrot: rnd(-12, 12), color: pick(colors), a: 1, a1: 0.2,
        frame: FR.PAPER, drag: 2.2, grav: 6, flutter: 14,
      });
    }
  }
  ink(p, n = 8, power = 1, color = COL.hot) {
    for (let i = 0; i < n; i++) {
      this.wNorm.emit({ x: p.x, y: p.y, z: p.z + 0.08, vx: rnd(-2.5, 2.5) * power, vy: rnd(-0.5, 3) * power, vz: rnd(0, 1.5), life: rnd(0.35, 0.7), size: rnd(0.05, 0.14) * power, size1: 0.02, color, frame: FR.INK, grav: 9, drag: 1 });
    }
  }
  puff(p, n = 4, color = COL.bone, size = 0.5) {
    for (let i = 0; i < n; i++) this.wNorm.emit({ x: p.x + rnd(-0.1, 0.1), y: p.y + rnd(-0.1, 0.1), z: p.z, vx: rnd(-0.6, 0.6), vy: rnd(0.2, 1), life: rnd(0.4, 0.8), size: size * 0.5, size1: size * 1.5, color, a: 0.7, a1: 0, frame: FR.SMOKE, drag: 2 });
  }
  embers(p, n = 6, spread = 0.3) {
    for (let i = 0; i < n; i++) this.wAdd.emit({ x: p.x + rnd(-spread, spread), y: p.y + rnd(-spread, spread), z: p.z + 0.1, vx: rnd(-0.8, 0.8), vy: rnd(0.8, 2.6), life: rnd(0.5, 1.2), size: rnd(0.05, 0.12), size1: 0.01, color: COL.ember, frame: FR.GLOW, drag: 1.5, flutter: 6 });
  }
  ash(p, n = 4, spread = 0.3) {
    for (let i = 0; i < n; i++) this.wNorm.emit({ x: p.x + rnd(-spread, spread), y: p.y + rnd(-spread, spread), z: p.z + 0.05, vx: rnd(-0.5, 0.5), vy: rnd(0.6, 1.8), life: rnd(1, 2), size: rnd(0.05, 0.12), vrot: rnd(-5, 5), color: COL.ash, a: 0.9, a1: 0, frame: FR.ASH, drag: 1.2, flutter: 5 });
  }
  star(p, size = 0.5, color = COL.white) {
    this.wNorm.emit({ x: p.x, y: p.y, z: p.z + 0.15, life: 0.12, size: size * 0.6, size1: size * 1.3, color, frame: FR.STAR, a: 1, a1: 0.3 });
  }

  // ---------- overlay (pixel space) ----------
  tracer(x0, y0, x1, y1, color = 0xff2e93) {
    const tr = this.tracers[this.tracerI++ % this.tracers.length];
    tr.m.material.uniforms.col.value.setHex(color);
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
    tr.m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
    tr.m.rotation.z = Math.atan2(dy, dx);
    tr.m.scale.set(L, Math.max(3, this.game.H * 0.006), 1);
    tr.m.visible = true; tr.t = 0.07;
  }
  sparks(x, y, n = 6, color = COL.fire, speed = 1) {
    const H = this.game.H;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.28), s = rnd(0.2, 1) * H * 0.6 * speed;
      this.oAdd.emit({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.12, 0.3), size: H * 0.012, size1: 1, color, frame: FR.GLOW, drag: 6 });
    }
  }
  screenInk(n = 6) {
    const { W, H } = this.game;
    for (let i = 0; i < n; i++) {
      const edge = Math.random() < 0.5;
      const x = edge ? (Math.random() < 0.5 ? rnd(0, W * 0.15) : rnd(W * 0.85, W)) : rnd(0, W);
      const y = edge ? rnd(0, H) : (Math.random() < 0.5 ? rnd(0, H * 0.15) : rnd(H * 0.85, H));
      this.oNorm.emit({ x, y, life: rnd(0.9, 1.4), size: rnd(0.08, 0.2) * H, size1: rnd(0.2, 0.3) * H, color: COL.hot, a: 0.85, a1: 0, frame: FR.INK, vy: -H * 0.05 });
    }
  }
  // a mantra syllable flies from the demon hand to the hit point and burns there for a moment
  mantra(x0, y0, x1, y1, i, crit = false, pal = 'gold') {
    const H = this.game.H, set = this.glyphs[pal] || this.glyphs.gold;
    const mat = new THREE.MeshBasicMaterial({ map: set[i % set.length], transparent: true, depthTest: false, blending: THREE.AdditiveBlending });
    const mat2 = new THREE.MeshBasicMaterial({ map: set[i % set.length], transparent: true, depthTest: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat2);
    const glow = new THREE.Mesh(m.geometry, mat);
    m.add(glow); glow.scale.setScalar(1.35);
    m.renderOrder = 41; glow.renderOrder = 40; m.frustumCulled = glow.frustumCulled = false;
    this.game.overlay.add(m);
    const s0 = H * 0.05, s1 = H * (crit ? 0.16 : 0.11);
    let k = 0;
    const fly = 0.07;
    this.add({
      update: (dt) => {
        k += dt;
        if (k < fly) {
          const e = k / fly;
          m.position.set(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e, 0);
          m.scale.setScalar(s0 + (s1 * 0.8 - s0) * e);
          m.rotation.z = (1 - e) * 0.6;
        } else {
          const e = (k - fly) / 0.4;
          m.position.set(x1, y1 + e * H * 0.03, 0);
          m.scale.setScalar(s1 * (1 + 0.25 * Math.min(1, e * 4)));
          mat2.opacity = 1 - e; mat.opacity = Math.max(0, 1 - e * 1.6);
        }
        if (k > fly + 0.4) { this.game.overlay.remove(m); m.geometry.dispose(); mat.dispose(); mat2.dispose(); return false; }
        return true;
      },
      dispose: () => { this.game.overlay.remove(m); },
    });
  }
  // a monster gathering itself for an attack (the art has no effects drawn in, docs/ART.md): a glow at the point it attacks from that
  // swells with the wind-up, star rays turning, sparks pulled into it. Ends by itself when the wind-up ends (attack, stagger, death).
  charge(enemy, color = 0xff5ac8) {
    const g = this.game, uv = enemy.bp.throwFrom || [0.5, 0.5], col = new THREE.Color(color);
    const U = { col: { value: col }, a: { value: 0 }, rays: { value: 8 }, rot: { value: 0 }, time: { value: 0 } };
    const m = new THREE.Mesh(this.quad || (this.quad = new THREE.PlaneGeometry(1, 1)), new THREE.ShaderMaterial({ uniforms: U, vertexShader: FXVERT,
      fragmentShader: GLOW_FRAG, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.renderOrder = 36; m.frustumCulled = false;
    g.overlay.add(m);
    let t = 0, emitT = 0;
    const end = () => { g.overlay.remove(m); m.material.dispose(); };
    this.add({
      update: (dt) => {
        if (!enemy.alive || enemy.state !== 'windup') { end(); return false; }
        t += dt;
        const k = Math.min(1, enemy.timer0 > 0 ? 1 - enemy.timer / enemy.timer0 : 1);
        const s = g.world.project(enemy.uvToWorld(uv[0], uv[1])), b = g.box(enemy), hb = Math.max(g.H * 0.04, b.y1 - b.y0);
        const x = s.x, y = g.H - s.y, r = hb * (0.25 + 0.5 * k);
        m.position.set(x, y, 0); m.scale.setScalar(r * 2 * (1 + 0.08 * Math.sin(t * 31)));
        U.a.value = 0.8 + 1.6 * k; U.rot.value = t * 2.5; U.time.value = t;   // additive over a bright scene: strong
        emitT -= dt;
        if (emitT <= 0) {
          emitT = 0.035 - 0.02 * k;
          const a = Math.random() * 6.283, d = r * 1.6;
          this.oAdd.emit({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: -Math.cos(a) * d * 5, vy: -Math.sin(a) * d * 5, rot: a, life: 0.18,
            size: hb * 0.18, size1: hb * 0.04, color: [col.r, col.g, col.b], a: 0.9, a1: 0, frame: FR.STREAK });
        }
        return true;
      },
      dispose: end,
    });
  }
  // a sound wave hitting the whole screen (the PA-system siren's blast): rings racing out from the horn past the screen edges
  soundWave(x, y, color = 0xff5ac8) {
    const g = this.game, R = Math.hypot(g.W, g.H) * 1.2;
    for (let i = 0; i < 4; i++) {
      const U = { col: { value: new THREE.Color(color) }, a: { value: 0 }, k: { value: 0 }, kind: { value: 0 }, spin: { value: 0 } };
      const m = new THREE.Mesh(this.quad || (this.quad = new THREE.PlaneGeometry(1, 1)), new THREE.ShaderMaterial({ uniforms: U, vertexShader: FXVERT,
        fragmentShader: RING_FRAG, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.renderOrder = 36; m.frustumCulled = false; m.position.set(x, y, 0); m.visible = false;
      g.overlay.add(m);
      let t = -i * 0.11;
      const end = () => { g.overlay.remove(m); m.material.dispose(); };
      this.add({
        update: (dt) => {
          t += dt;
          if (t < 0) return true;
          const k = Math.min(1, t / 0.75);
          m.visible = true; m.scale.setScalar(R * (0.1 + 1.9 * k)); U.k.value = 0.35 + 0.4 * k; U.a.value = 1.2 * (1 - k);
          if (k >= 1) { end(); return false; }
          return true;
        },
        dispose: end,
      });
    }
  }
  // the rune seal flashing in front of the paw on every strike
  rune(x, y, size) {
    const mat = new THREE.MeshBasicMaterial({ map: this.runeT, transparent: true, depthTest: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.renderOrder = 41; m.frustumCulled = false; m.position.set(x, y, 0);
    this.game.overlay.add(m);
    let k = 0;
    this.add({
      update: (dt) => {
        k += dt;
        const e = Math.min(1, k / 0.22);
        m.scale.setScalar(size * (0.6 + 0.6 * e));
        m.rotation.z = k * 4;
        mat.opacity = 1 - e;
        if (k > 0.22) { this.game.overlay.remove(m); m.geometry.dispose(); mat.dispose(); return false; }
        return true;
      },
      dispose: () => this.game.overlay.remove(m),
    });
  }
  // the palm beam: a glowing band from the hand to the aim point, alive while the skill lasts
  beam(hex) {
    const mat = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, a: { value: 1 }, col: { value: new THREE.Color(hex) } }, vertexShader: BASIC_VERT, fragmentShader: BEAM_FRAG, transparent: true, depthTest: false, blending: THREE.AdditiveBlending });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.renderOrder = 39; m.frustumCulled = false;
    this.game.overlay.add(m);
    const fx = this;
    return {
      set(x0, y0, x1, y1, width, t) {
        const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
        m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
        m.rotation.z = Math.atan2(dy, dx);
        m.scale.set(L, width * (1 + 0.08 * Math.sin(t * 40)), 1);
        mat.uniforms.t.value = t;
        if (Math.random() < 0.6) fx.oAdd.emit({ x: x1 + rnd(-width, width) * 0.3, y: y1 + rnd(-width, width) * 0.3, vx: rnd(-1, 1) * width * 4, vy: rnd(-1, 1) * width * 4, life: rnd(0.15, 0.3), size: width * 0.5, size1: width * 1.2, color: COL.gold, frame: FR.GLOW, drag: 4 });
      },
      remove() { fx.game.overlay.remove(m); m.geometry.dispose(); mat.dispose(); },
    };
  }
  // slot: which player it will hit (0 / 1), -1 = everyone. The small notch points at that player in their colour.
  // the attack warning over a winding-up monster (docs/DESIGN.md: some attacks are stopped by staggering it, some must be hidden from):
  // the battle HUD's 打断! / 躲! art (ui/hud_interrupt, ui/hud_hide), a countdown arc and the seconds left on its ring, a notch pointing
  // at the girl it is after
  lock(type = 'ranged', slot = 0) {
    if (type === 'shot') return this.shotLock(slot);
    const game = this.game, hide = type === 'heavy';
    const key = hide ? 'ui/hud_hide' : 'ui/hud_interrupt', T0 = tex[key];
    const RC = hide ? [0.669, 0.662, 0.136] : [0.472, 0.726, 0.146];   // its ring: centre (share of the picture), radius (share of its width)
    const WC = hide ? [0.26, 0.5] : [0.47, 0.26];                       // where its word goes
    const ar = T0 ? T0.image.height / T0.image.width : 0.8;
    const g = new THREE.Group();
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: T0, transparent: true, depthTest: false, depthWrite: false }));
    const AU = { p: { value: 0 }, col: { value: new THREE.Color(0xffffff) }, a: { value: 1 } };
    const arc = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: AU, vertexShader: FXVERT, fragmentShader: ARC_FRAG,
      transparent: true, depthTest: false, depthWrite: false }));
    const word = new Text(43, { color: hide ? '#ffffff' : '#ffffff', shadow: '#d8141e', sw: 0.12 });
    const num = new Text(44, { sw: 0.14 });
    const notch = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.notch, transparent: true, depthTest: false, color: 0xffffff }));
    g.add(pic, arc, word.m, num.m, notch);
    pic.renderOrder = 42; arc.renderOrder = 42.5; notch.renderOrder = 42;
    g.traverse((o) => { o.frustumCulled = false; });
    this.game.overlay.add(g);
    const W3 = { zh: hide ? '躲!' : '打断!', ja: hide ? '隠れて!' : '止めて!', en: hide ? 'HIDE!' : 'STOP IT!' };
    let born = 0;
    const L = {
      type, slot, p: 0,
      set(x, y, size, p, t, left) { // p: 0 -> 1 progress to the hit; left: seconds to it
        L.p = p; born = Math.min(1, born + 0.08);
        const blink = Math.abs(Math.sin(t * (5 + p * 20)));
        const W = Math.max(game.H * 0.13, size * 2.4) * (1 + (1 - born) * 0.5) * (p > 0.85 ? 1 + 0.06 * blink : 1);
        // over the monster, but kept under the HUD's top strip (27% of the height) and on the screen
        const hh = W * ar / 2, top = game.H * 0.73 - hh;
        g.position.set(Math.max(game.W * 0.22, Math.min(game.W * 0.78, x)), Math.min(y + size * 0.9, top), 0);
        pic.scale.set(W, W * ar, 1);
        pic.rotation.z = Math.sin(t * 3) * 0.03;
        const cx = (RC[0] - 0.5) * W, cy = (0.5 - RC[1]) * W * ar, r = RC[2] * W;
        arc.position.set(cx, cy, 0); arc.scale.setScalar(r * 2.6);
        AU.p.value = 1 - p; AU.col.value.setHex(p > 0.75 && blink > 0.5 ? 0xffffff : 0xff2a3a);
        num.set(`${Math.max(0, Math.ceil(left ?? (1 - p) * 2))}`, r * 1.1);
        num.at(cx, cy, -6, 1 + (p > 0.75 ? 0.15 * blink : 0));
        word.set(W3[lang] || W3.en, W * 0.17);
        word.at((WC[0] - 0.5) * W, (0.5 - WC[1]) * W * ar, -8, 1 + 0.06 * blink);
        const pl = slot >= 0 ? game.players[slot] : null;
        notch.visible = !!pl;
        if (pl) {
          const ang = Math.atan2(game.H * 0.15 - (y + cy), pl.baseX - (x + cx));
          notch.position.set(cx + Math.cos(ang) * r * 1.5, cy + Math.sin(ang) * r * 1.5, 0);
          notch.rotation.z = ang + Math.PI / 2;
          notch.scale.setScalar(Math.max(14, r * 0.7));
          notch.material.color.setHex(pl.c.hex);
        }
      },
      remove() { g.parent && g.parent.remove(g); pic.geometry.dispose(); pic.material.dispose(); arc.geometry.dispose(); arc.material.dispose(); notch.geometry.dispose(); notch.material.dispose(); },
    };
    return L;
  }
  // a small spinning ring on something flying at her (shoot it down): many at once, so no words
  shotLock(slot) {
    const game = this.game, g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.rings.shot, transparent: true, depthTest: false, color: THREAT.shot }));
    g.add(ring); ring.renderOrder = 42; ring.frustumCulled = false;
    this.game.overlay.add(g);
    const L = {
      type: 'shot', slot, p: 0,
      set(x, y, size, p, t) {
        L.p = p; g.position.set(x, y, 0);
        const s = size * (1.5 - 0.6 * p), blink = Math.abs(Math.sin(t * (6 + p * 22)));
        ring.scale.set(s, s, 1); ring.rotation.z = t * 4;
        ring.material.opacity = 0.6 + 0.4 * blink;
        ring.material.color.setHex(p > 0.86 && blink > 0.5 ? 0xffffff : (slot >= 0 ? game.players[slot]?.c.hex : null) ?? THREAT.shot);
      },
      remove() { g.parent && g.parent.remove(g); ring.geometry.dispose(); ring.material.dispose(); },
    };
    return L;
  }
  // NIKKE-style skill cut-in: a slanted stripe band slams in, the heroine lunges across it. Runs on real time (the world is in hit-stop).
  cutIn(key, side = -1, hex = 0xff2e93) {
    const { W, H } = this.game;
    const g = new THREE.Group();
    g.position.set(W / 2, H * 0.55, 0);
    g.rotation.z = 0.07 * -side;
    const bandMat = new THREE.ShaderMaterial({
      uniforms: { t: { value: 0 }, a: { value: 1 }, col: { value: new THREE.Color(hex) } }, transparent: true, depthTest: false,
      vertexShader: BASIC_VERT,
      fragmentShader: `uniform float t; uniform float a; uniform vec3 col; varying vec2 vUv;
        void main(){ float s = step(0.5, fract((vUv.x * 9.0 - vUv.y * 2.0) - t * 3.0));
          vec3 c = mix(vec3(0.07, 0.02, 0.09), col, s * 0.85);
          float lines = step(0.985, fract(vUv.y * 23.0 + sin(vUv.x * 40.0 + t * 30.0) * 0.1));
          c = mix(c, vec3(0.78, 1.0, 0.2), lines);
          float e = smoothstep(0.0, 0.04, vUv.y) * smoothstep(1.0, 0.96, vUv.y);
          c = mix(vec3(1.0), c, e);
          gl_FragColor = vec4(c, a); }`,
    });
    const band = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.4, H * 0.48), bandMat);
    g.add(band);
    const t = tex[key];
    let fig = null;
    if (t) {
      const h = H * 0.62, w = h * t.image.width / t.image.height;
      fig = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paperMaterial(t, w / h));
      fig.material.uniforms.useFog.value = 0;
      fig.material.depthTest = false;
      fig.position.y = H * 0.02;
      g.add(fig);
    }
    g.traverse((o) => { o.renderOrder = 70; o.frustumCulled = false; });
    this.game.overlay.add(g);
    const t0 = performance.now();
    this.add({
      update: () => {
        const k = (performance.now() - t0) / 1000;
        bandMat.uniforms.t.value = k;
        band.scale.y = k < 0.12 ? Ease.outBack(k / 0.12) : k > 1.05 ? Math.max(0, 1 - (k - 1.05) / 0.15) : 1;
        if (fig) {
          const x = k < 0.16 ? W * (1.1 - 0.95 * Ease.outCubic(k / 0.16)) : k < 0.95 ? W * (0.15 - 0.08 * (k - 0.16)) : W * (0.09 - 1.6 * (k - 0.95));
          fig.position.x = (x - W * 0.05) * -side;
          fig.material.uniforms.flash.value = Math.max(0, 0.7 - k * 4);
          fig.scale.setScalar(1 + Math.max(0, 0.12 - k * 0.5));
        }
        if (k > 1.25) { this.game.overlay.remove(g); band.geometry.dispose(); bandMat.dispose(); if (fig) { fig.geometry.dispose(); fig.material.dispose(); } return false; }
        return true;
      },
    });
  }

  // big comic sound-effect stamp on the overlay (baked katakana images)
  stamp(name, x, y, size = 0.22, cd = 0.6) {
    if ((this.stampCD[name] || 0) > 0) return;
    this.stampCD[name] = cd;
    const t = tex[`sfx2/${name}`];
    if (!t) return;
    const H = this.game.H, h = H * size, w = h * t.image.width / t.image.height;
    const mat = paperMaterial(t, w / h);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.renderOrder = 60; m.frustumCulled = false;
    m.position.set(x, y, 0);
    m.rotation.z = rnd(-0.25, 0.25);
    this.game.overlay.add(m);
    let a = 0;
    this.add({
      update: (dt) => {
        a += dt;
        const pop = a < 0.12 ? Ease.outBack(a / 0.12) : 1;
        const s = a < 0.12 ? pop * 1.15 : 1.15 - Math.min(0.15, (a - 0.12) * 0.6);
        m.scale.set(s, s, 1);
        mat.uniforms.flash.value = Math.max(0, 0.8 - a * 6);
        mat.uniforms.opacity.value = a > 0.55 ? Math.max(0, 1 - (a - 0.55) / 0.2) : 1;
        m.position.y += dt * H * 0.04;
        if (a > 0.75) { this.game.overlay.remove(m); m.geometry.dispose(); mat.dispose(); return false; }
        return true;
      },
    });
  }
}
