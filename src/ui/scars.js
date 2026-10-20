// What a hit leaves on the screen (docs/DESIGN.md「挨打留视觉残留」; user 2026-10-20: the early builds left bite marks and such, then they
// went; every monster's every attack should leave its own mark for a while - the price of a mistake, and the way to remember how each one
// hits): drawn on the girl's half of the screen where the blow came from, a pop, a few seconds, fading; hits stack. Kinds (enemies.json /
// projectiles.json "scar", else by the kind of attack: Game.playerAttacked -> player.lastHit):
//   bite    two arcs of tooth marks pressed into the glass, the gums' pink stain round them
//   claw    three curved slashes, a hot core and a dark edge, drops at their ends
//   crack   the screen glass cracked round a hole (fx/crack_* - the light-gun games' bullet hole)
//   splat   a thick splash (its colour: scarColor - honey, cream, slime) running down in drips
//   ink     a burst of ink and its spray of dots
//   paper   paper cuts: thin bright slashes, scraps of paper stuck on
//   burn    a scorched blot, its edge still glowing
// Drawn once per kind (three versions each, canvas), tinted, revealed downward for the runs (a shader: reveal).
import * as THREE from 'three';
import { tex } from '../core/assets.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const S = 512;

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FRAG = `uniform sampler2D map; uniform float a; uniform float reveal; uniform vec3 tint; uniform float tintK; uniform float glow; uniform float time; varying vec2 vUv;
void main(){
  vec4 c = texture2D(map, vUv);
  float run = smoothstep(0.0, 0.04, (1.0 - vUv.y) - (1.0 - reveal));   // (the runs come down as reveal grows)
  float show = reveal >= 1.0 ? 1.0 : 1.0 - run;
  c.rgb = mix(c.rgb, c.rgb * tint, tintK);
  c.rgb += glow * c.a * vec3(1.0, 0.55, 0.2) * (0.6 + 0.4 * sin(time * 9.0 + vUv.x * 20.0));
  gl_FragColor = vec4(c.rgb, c.a * a * show);
  if (gl_FragColor.a < 0.004) discard;
}`;

// ---------------------------------------------------------------- the drawings
function canvas() { const c = document.createElement('canvas'); c.width = c.height = S; return [c, c.getContext('2d')]; }
function blob(g, x, y, r, n = 9) {
  g.beginPath();
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rr = r * rnd(0.75, 1.15); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? g.quadraticCurveTo(x + Math.cos(a - Math.PI / n) * rr * 1.2, y + Math.sin(a - Math.PI / n) * rr * 1.2, px, py) : g.moveTo(px, py); }
  g.closePath(); g.fill();
}
const DRAW = {
  bite(g) {
    // the gums' stain first, then two jaws of tooth dents (upper bites down, lower bites up), each dent dark at its point
    const cx = S / 2, cy = S / 2;
    const gr = g.createRadialGradient(cx, cy, 20, cx, cy, 230); gr.addColorStop(0, 'rgba(255,120,150,0.35)'); gr.addColorStop(1, 'rgba(255,90,130,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    for (const up of [1, -1]) {
      const n = 9, R = 170, y0 = cy - up * 40;
      for (let i = 0; i < n; i++) {
        const a = (i / (n - 1) - 0.5) * 2.1, x = cx + Math.sin(a) * R, y = y0 + up * (Math.cos(a) * -R + R) * 0.55;
        const w = (i === 0 || i === n - 1 ? 18 : i === 3 || i === n - 4 ? 26 : 22) * rnd(0.9, 1.15), h = w * (i === 3 || i === n - 4 ? 2.0 : 1.4);
        g.save(); g.translate(x, y); g.rotate(a * 0.6 * up);
        g.fillStyle = 'rgba(120,10,30,0.85)'; g.beginPath(); g.moveTo(-w / 2, 0); g.quadraticCurveTo(0, up * h * 1.1, w / 2, 0); g.quadraticCurveTo(0, up * h * 0.3, -w / 2, 0); g.fill();
        g.fillStyle = 'rgba(255,200,210,0.55)'; g.beginPath(); g.moveTo(-w / 3, up * 2); g.quadraticCurveTo(0, up * h * 0.7, w / 3, up * 2); g.quadraticCurveTo(0, up * h * 0.35, -w / 3, up * 2); g.fill();
        g.restore();
      }
    }
  },
  claw(g) {
    const n = 3 + (Math.random() < 0.3 ? 1 : 0), a = rnd(-0.5, 0.5);
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * 62, x0 = S * 0.2 + off, y0 = S * 0.15, x1 = S * 0.78 + off, y1 = S * 0.86, mx = (x0 + x1) / 2 + 60 * Math.cos(a), my = (y0 + y1) / 2 - 40;
      for (const [w, col] of [[30, 'rgba(90,0,20,0.55)'], [16, 'rgba(220,20,60,0.9)'], [6, 'rgba(255,230,235,0.95)']]) {
        g.strokeStyle = col; g.lineCap = 'round';
        for (let k = 0; k < 12; k++) {   // tapered: thick in the middle, thin at the ends
          const t0 = k / 12, t1 = (k + 1) / 12, P = (t) => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1];
          g.lineWidth = w * Math.sin(Math.PI * (t0 + t1) / 2); g.beginPath(); g.moveTo(...P(t0)); g.lineTo(...P(t1)); g.stroke();
        }
      }
      g.fillStyle = 'rgba(200,10,40,0.85)'; g.beginPath(); g.arc(x1 + rnd(-4, 4), y1 + rnd(6, 20), rnd(5, 9), 0, 7); g.fill();
    }
  },
  splat(g) {
    // white base (tinted to its colour): a thick splash and its runs down; highlights left white
    g.fillStyle = 'rgba(255,255,255,0.96)';
    const cx = S / 2, cy = S * 0.3;
    blob(g, cx, cy, 110, 11);
    for (let i = 0; i < 14; i++) { const a = rnd(0, Math.PI * 2), d = rnd(120, 190); blob(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, rnd(10, 30), 7); }
    for (let i = 0; i < 6; i++) {   // the runs
      const x = cx + rnd(-95, 95), w = rnd(14, 30), len = rnd(120, 330);
      g.fillRect(x - w / 2, cy, w, len); g.beginPath(); g.arc(x, cy + len, w * 0.75, 0, 7); g.fill();
    }
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, S * 0.5, S, S * 0.5);
    g.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(cx + rnd(-60, 40), cy + rnd(-50, 10), rnd(8, 18), rnd(4, 9), -0.5, 0, 7); g.fill(); }
    g.globalCompositeOperation = 'source-over';
  },
  ink(g) {
    g.fillStyle = 'rgba(20,6,30,0.95)';
    const cx = S / 2, cy = S / 2;
    blob(g, cx, cy, 80, 12);
    for (let i = 0; i < 10; i++) { const a = rnd(0, Math.PI * 2), d = rnd(70, 150); g.save(); g.translate(cx, cy); g.rotate(a); g.fillRect(0, -rnd(6, 14) / 2, d, rnd(6, 14)); g.restore(); blob(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, rnd(10, 24), 6); }
    for (let i = 0; i < 60; i++) { const a = rnd(0, Math.PI * 2), d = rnd(120, 240); g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rnd(2, 8), 0, 7); g.fill(); }
    g.fillStyle = 'rgba(150,70,220,0.5)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(cx + rnd(-40, 40), cy + rnd(-40, 30), rnd(10, 22), rnd(4, 8), rnd(0, 3), 0, 7); g.fill(); }
  },
  paper(g) {
    for (let i = 0; i < 5; i++) {
      const x0 = rnd(40, 200), y0 = rnd(60, 450), x1 = x0 + rnd(200, 300), y1 = y0 + rnd(-90, 90);
      g.strokeStyle = 'rgba(200,0,40,0.7)'; g.lineWidth = 6; g.beginPath(); g.moveTo(x0, y0 + 3); g.lineTo(x1, y1 + 3); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
    for (let i = 0; i < 4; i++) {   // scraps stuck to the glass
      g.save(); g.translate(rnd(80, 430), rnd(80, 430)); g.rotate(rnd(-0.6, 0.6));
      const w = rnd(50, 90), h = rnd(36, 60);
      g.fillStyle = 'rgba(248,244,232,0.95)'; g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2 + rnd(-6, 6)); g.lineTo(w / 2 - rnd(0, 10), h / 2); g.lineTo(-w / 2, h / 2 - rnd(0, 8)); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(120,120,160,0.5)'; g.lineWidth = 1.5; for (let k = -h / 2 + 10; k < h / 2; k += 9) { g.beginPath(); g.moveTo(-w / 2 + 4, k); g.lineTo(w / 2 - 4, k); g.stroke(); }
      g.restore();
    }
  },
  burn(g) {
    const cx = S / 2, cy = S / 2;
    const gr = g.createRadialGradient(cx, cy, 30, cx, cy, 240); gr.addColorStop(0, 'rgba(20,8,4,0.95)'); gr.addColorStop(0.55, 'rgba(60,24,10,0.85)'); gr.addColorStop(0.8, 'rgba(255,120,30,0.65)'); gr.addColorStop(1, 'rgba(255,170,60,0)');
    g.fillStyle = gr; for (let i = 0; i < 7; i++) blob(g, cx + rnd(-60, 60), cy + rnd(-60, 60), rnd(120, 190), 12);
    g.fillStyle = 'rgba(255,210,120,0.8)'; for (let i = 0; i < 26; i++) { const a = rnd(0, Math.PI * 2), d = rnd(150, 230); g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rnd(2, 5), 0, 7); g.fill(); }
  },
};
const CACHE = {};
function texOf(kind) {
  const L = CACHE[kind] || (CACHE[kind] = []);
  if (L.length < 3) { const [c, g] = canvas(); DRAW[kind](g); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; L.push(t); return t; }
  return L[Math.floor(Math.random() * L.length)];
}

export const SCARS = ['bite', 'claw', 'crack', 'splat', 'ink', 'paper', 'burn'];
// the kind an attack leaves when its data names none (Game.playerAttacked kinds)
export const scarFor = (kind) => ({ bite: 'bite', ram: 'claw', melee: 'claw', shot: 'crack', ranged: 'burn' }[kind] || 'crack');

export class Scars {
  constructor(layer) { this.layer = layer; this.items = []; }
  // kind (SCARS), at x, y (screen px, y up), size s (px), colour (splat), hold (seconds before it fades)
  add(kind, x, y, s, color = null, hold = 2.6) {
    let map = null;
    if (kind === 'crack') map = tex[`fx/crack_${Math.floor(Math.random() * 6)}`] || texOf('ink');
    else map = texOf(DRAW[kind] ? kind : 'claw');
    const U = { map: { value: map }, a: { value: 1 }, reveal: { value: kind === 'splat' ? 0.35 : 1 }, tint: { value: new THREE.Color(color ?? 0xffffff) }, tintK: { value: kind === 'splat' && color != null ? 1 : 0 },
      glow: { value: kind === 'burn' ? 0.6 : 0 }, time: { value: 0 } };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false }));
    m.renderOrder = 84.5; m.frustumCulled = false; m.position.set(x, y, 0); m.rotation.z = kind === 'splat' ? rnd(-0.12, 0.12) : rnd(0, Math.PI * 2);
    this.layer.add(m);
    this.items.push({ m, U, kind, s, t: 0, hold, down: kind === 'splat' ? rnd(-0.04, -0.015) : 0 });
    while (this.items.length > 8) this.drop(this.items.shift());
  }
  drop(it) { it.m.parent?.remove(it.m); it.m.geometry.dispose(); it.m.material.dispose(); }
  update(dt, t, H) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i]; it.t += dt;
      const k = it.t, pop = k < 0.06 ? 1.25 - 0.25 * (k / 0.06) : 1;
      it.m.scale.set(it.s * pop, it.s * pop, 1);
      it.U.time.value = t;
      if (it.kind === 'splat') { it.U.reveal.value = Math.min(1, 0.35 + k * 0.45); it.m.position.y += it.down * H * dt; }   // (it runs, and slides)
      if (it.kind === 'burn') it.U.glow.value = Math.max(0, 0.6 - k * 0.3);
      const fade = it.hold + 0.9;
      it.U.a.value = k < it.hold ? 1 : Math.max(0, (fade - k) / 0.9);
      if (k >= fade) { this.drop(it); this.items.splice(i, 1); }
    }
  }
  clear() { for (const it of this.items) this.drop(it); this.items = []; }
}
