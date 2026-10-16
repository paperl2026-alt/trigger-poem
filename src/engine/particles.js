// Instanced camera-facing quads. One system per blend mode; frames come from a 4x2 atlas.
import * as THREE from 'three';

export const FR = { PAPER: 0, GLOW: 1, INK: 2, SMOKE: 3, FLAME1: 4, FLAME2: 5, STAR: 6, ASH: 7 };

// Atlas: procedural paper bits / glow / ink / smoke / ash + painted flames and star from the fx sheet.
export function buildAtlas(images) {
  const S = 128, c = document.createElement('canvas');
  c.width = S * 4; c.height = S * 2;
  const g = c.getContext('2d');
  const cell = (i) => [(i % 4) * S, Math.floor(i / 4) * S];
  // paper scrap
  let [x, y] = cell(FR.PAPER);
  g.fillStyle = '#fff';
  g.beginPath(); g.moveTo(x + 20, y + 30); g.lineTo(x + 100, y + 18); g.lineTo(x + 110, y + 92); g.lineTo(x + 64, y + 110); g.lineTo(x + 16, y + 96); g.closePath(); g.fill();
  // glow dot
  [x, y] = cell(FR.GLOW);
  let gr = g.createRadialGradient(x + 64, y + 64, 0, x + 64, y + 64, 62);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x, y, S, S);
  // ink drop (hard circle with a splash tail)
  [x, y] = cell(FR.INK);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 64, y + 70, 40, 0, 6.283); g.fill();
  g.beginPath(); g.moveTo(x + 40, y + 50); g.quadraticCurveTo(x + 64, y + 2, x + 88, y + 50); g.fill();
  // smoke puff
  [x, y] = cell(FR.SMOKE);
  for (let i = 0; i < 7; i++) {
    const cx = x + 64 + Math.cos(i * 0.9) * 24, cy = y + 64 + Math.sin(i * 1.3) * 22;
    gr = g.createRadialGradient(cx, cy, 0, cx, cy, 40);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x, y, S, S);
  }
  // ash flake
  [x, y] = cell(FR.ASH);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x + 30, y + 50); g.lineTo(x + 70, y + 30); g.lineTo(x + 100, y + 60); g.lineTo(x + 76, y + 96); g.lineTo(x + 40, y + 84); g.closePath(); g.fill();
  // painted frames
  const put = (fr, img) => {
    if (!img) return;
    const [px, py] = cell(fr);
    const s = Math.min(S / img.width, S / img.height) * 0.98;
    g.drawImage(img, px + (S - img.width * s) / 2, py + (S - img.height * s) / 2, img.width * s, img.height * s);
  };
  put(FR.FLAME1, images.flame1); put(FR.FLAME2, images.flame2); put(FR.STAR, images.star);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

const VERT = `
attribute vec3 iPos; attribute vec4 iCol; attribute vec3 iSRF; // size, rotation, frame
varying vec2 vUv; varying vec4 vCol;
void main(){
  vCol = iCol;
  float c = cos(iSRF.y), s = sin(iSRF.y);
  vec2 p = mat2(c, s, -s, c) * (position.xy * iSRF.x);
  vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
  mv.xy += p;
  float f = iSRF.z;
  vUv = (uv + vec2(mod(f, 4.0), 1.0 - floor(f / 4.0))) * vec2(0.25, 0.5);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = `
uniform sampler2D atlas; varying vec2 vUv; varying vec4 vCol;
void main(){ vec4 t = texture2D(atlas, vUv); float a = t.a * vCol.a; if (a < 0.01) discard; gl_FragColor = vec4(t.rgb * vCol.rgb, a); }`;

export class Particles {
  constructor(atlas, { max = 800, additive = false, renderOrder = 10 } = {}) {
    this.max = max;
    this.n = 0;
    this.p = []; // particle structs
    const base = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute('position', base.getAttribute('position'));
    geo.setAttribute('uv', base.getAttribute('uv'));
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aSRF = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('iPos', this.aPos); geo.setAttribute('iCol', this.aCol); geo.setAttribute('iSRF', this.aSRF);
    geo.instanceCount = 0;
    this.geo = geo;
    const mat = new THREE.ShaderMaterial({
      uniforms: { atlas: { value: atlas } }, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, depthTest: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = renderOrder;
  }
  // o: {x,y,z, vx,vy,vz, life, size, size1, rot, vrot, color:[r,g,b], a, a1, frame, drag, grav, flutter}
  emit(o) {
    if (this.p.length >= this.max) this.p.shift();
    this.p.push({
      x: o.x, y: o.y, z: o.z || 0, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0,
      t: 0, life: o.life || 1, size: o.size || 0.1, size1: o.size1 ?? o.size ?? 0.1,
      rot: o.rot ?? Math.random() * 6.28, vrot: o.vrot || 0, r: o.color ? o.color[0] : 1, g: o.color ? o.color[1] : 1, b: o.color ? o.color[2] : 1,
      a: o.a ?? 1, a1: o.a1 ?? 0, frame: o.frame || 0, drag: o.drag || 0, grav: o.grav || 0, flutter: o.flutter || 0, fx: Math.random() * 6.28,
    });
  }
  update(dt) {
    const P = this.p;
    let w = 0;
    for (let i = 0; i < P.length; i++) {
      const q = P[i];
      q.t += dt;
      if (q.t >= q.life) continue;
      const k = Math.exp(-q.drag * dt);
      q.vx *= k; q.vy = q.vy * k - q.grav * dt; q.vz *= k;
      if (q.flutter) { q.vx += Math.sin(q.t * 7 + q.fx) * q.flutter * dt; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      q.rot += q.vrot * dt;
      P[w++] = q;
    }
    P.length = w;
    const pos = this.aPos.array, col = this.aCol.array, srf = this.aSRF.array;
    for (let i = 0; i < w; i++) {
      const q = P[i], f = q.t / q.life;
      pos[i * 3] = q.x; pos[i * 3 + 1] = q.y; pos[i * 3 + 2] = q.z;
      col[i * 4] = q.r; col[i * 4 + 1] = q.g; col[i * 4 + 2] = q.b; col[i * 4 + 3] = q.a + (q.a1 - q.a) * f;
      srf[i * 3] = q.size + (q.size1 - q.size) * f; srf[i * 3 + 1] = q.rot; srf[i * 3 + 2] = q.frame;
    }
    this.geo.instanceCount = w;
    this.aPos.needsUpdate = this.aCol.needsUpdate = this.aSRF.needsUpdate = true;
  }
  clear() { this.p.length = 0; this.geo.instanceCount = 0; }
}

// ---- grid shatter: the sprite breaks into flying paper squares ----
const SH_VERT = `
attribute vec3 iOff; attribute vec4 iUvR; attribute vec4 iVel; // vel.xyz, spin
uniform float t; uniform vec2 cell;
varying vec2 vUv; varying float vA;
void main(){
  float s = iVel.w * t;
  float c = cos(s), sn = sin(s);
  vec2 p = position.xy * cell;
  p = vec2(c * p.x - sn * p.y, sn * p.x + c * p.y);
  p.y *= cos(s * 0.7);
  vec3 o = iOff + iVel.xyz * t + vec3(0.0, -4.5 * t * t, 0.0);
  vUv = iUvR.xy + uv * iUvR.zw;
  vA = clamp(1.4 - t * 1.1, 0.0, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(o + vec3(p, 0.0), 1.0);
}`;
const SH_FRAG = `
uniform sampler2D map; uniform float flash; varying vec2 vUv; varying float vA;
void main(){ vec4 c = texture2D(map, vUv); if (c.a < 0.4) discard; gl_FragColor = vec4(mix(c.rgb, vec3(1.0), flash), c.a * vA); }`;

export function makeShatter(texture, w, h, { cols = 10, impact = [0.5, 0.6], power = 1, pivot = 'bottom' } = {}) {
  const rows = Math.max(4, Math.round(cols * h / w));
  const n = cols * rows;
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.setAttribute('position', base.getAttribute('position'));
  geo.setAttribute('uv', base.getAttribute('uv'));
  const off = new Float32Array(n * 3), uvr = new Float32Array(n * 4), vel = new Float32Array(n * 4);
  const cw = w / cols, ch = h / rows;
  let i = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++, i++) {
    const u = (c + 0.5) / cols, v = (r + 0.5) / rows;
    off[i * 3] = (u - 0.5) * w; off[i * 3 + 1] = pivot === 'bottom' ? v * h : (v - 0.5) * h; off[i * 3 + 2] = 0;
    uvr[i * 4] = c / cols; uvr[i * 4 + 1] = r / rows; uvr[i * 4 + 2] = 1 / cols; uvr[i * 4 + 3] = 1 / rows;
    const dx = u - impact[0], dy = v - impact[1], d = Math.hypot(dx, dy) + 0.05;
    const sp = power * (2.2 / (d + 0.3)) * (0.6 + Math.random() * 0.8);
    vel[i * 4] = dx / d * sp + (Math.random() - 0.5); vel[i * 4 + 1] = dy / d * sp + 1.5 + Math.random() * 1.5;
    vel[i * 4 + 2] = -(0.5 + Math.random() * 2) * power; vel[i * 4 + 3] = (Math.random() - 0.5) * 16;
  }
  geo.setAttribute('iOff', new THREE.InstancedBufferAttribute(off, 3));
  geo.setAttribute('iUvR', new THREE.InstancedBufferAttribute(uvr, 4));
  geo.setAttribute('iVel', new THREE.InstancedBufferAttribute(vel, 4));
  geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: texture }, t: { value: 0 }, cell: { value: new THREE.Vector2(cw * 1.04, ch * 1.04) }, flash: { value: 0.6 } },
    vertexShader: SH_VERT, fragmentShader: SH_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}
