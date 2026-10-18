// Sweat that runs down the skin. Beads form on the skin (mostly over the soft flesh), cling and grow, then run down.
// A running bead follows the skin: when the way down leaves the skin it steers along the silhouette instead; it sheds
// water as it goes and is gone once it has run dry or meets clothing. Behind it a wet streak (a per-pose float
// texture in the sprite's uv) slowly dries off. Everything lives in the sprite's own uv, so beads and streaks ride
// the flesh deformation for free. Shape and shading of the beads: rig.js fragment (DR / DV / SW uniforms).
import * as THREE from 'three';

export const MAXD = 20;     // beads per pose (shader array size)
const RW = 512;             // streak texture width (one sprite width; height = RW * ar)
const MW = 256;             // skin mask resolution for steering
const MAXS = 512;           // streak stamps per frame
const rnd = (a, b) => a + Math.random() * (b - a);

const CAM = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
const stampMat = new THREE.ShaderMaterial({
  vertexShader: `attribute float size; attribute float amt; varying float vA;
    void main() { vA = amt; gl_PointSize = size; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `varying float vA;
    void main() { float r = length(gl_PointCoord - 0.5) * 2.0; gl_FragColor = vec4(vA * smoothstep(1.0, 0.25, r)); }`,
  depthTest: false, depthWrite: false,
  blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation,
});
// drying: dst *= k
const dryMat = new THREE.ShaderMaterial({
  uniforms: { k: { value: 1 } },
  vertexShader: 'void main() { gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }',
  fragmentShader: 'uniform float k; void main() { gl_FragColor = vec4(k); }',
  depthTest: false, depthWrite: false,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
});

export class Sweat {
  // maskImg: weight map 0 (red = bare skin); flesh: the pose's Flesh (softness); ar: sprite height / width
  constructor(renderer, maskImg, flesh, ar) {
    this.r = renderer; this.ar = ar;
    const mh = Math.round(MW * ar);
    const c = document.createElement('canvas'); c.width = MW; c.height = mh;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(maskImg, 0, 0, MW, mh);
    const px = g.getImageData(0, 0, MW, mh).data;
    this.mh = mh; this.mask = new Float32Array(MW * mh);
    for (let i = 0; i < MW * mh; i++) this.mask[i] = px[i * 4] / 255;
    // where beads form: well inside the skin, weighted toward the soft flesh, hardly ever on the shins
    this.spawnPts = []; let tot = 0;
    for (let y = 3; y < mh - 3; y += 2) for (let x = 3; x < MW - 3; x += 2) {
      const u = (x + 0.5) / MW, v = 1 - (y + 0.5) / mh;
      if (v < 0.2 || this.mask[y * MW + x] < 0.85) continue;
      if (Math.min(this.mask[y * MW + x - 3], this.mask[y * MW + x + 3], this.mask[(y - 3) * MW + x], this.mask[(y + 3) * MW + x]) < 0.7) continue;
      tot += (0.12 + flesh.softAt(u, v)) * (v < 0.3 ? 0.3 : 1);
      this.spawnPts.push([u, v, tot]);
    }
    this.tot = tot;
    this.drops = Array.from({ length: MAXD }, () => ({ on: false }));
    this.acc = 0; this.boost = 0;
    // wet streaks
    this.rt = new THREE.WebGLRenderTarget(RW, Math.round(RW * ar), {
      type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false,
    });
    this.px = new THREE.Vector2(1 / RW, 1 / Math.round(RW * ar));
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.setRenderTarget(prev);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXS * 3), 3));
    this.geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(MAXS), 1));
    this.geo.setAttribute('amt', new THREE.BufferAttribute(new Float32Array(MAXS), 1));
    this.stamps = 0;
    this.scene = new THREE.Scene();
    const dry = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), dryMat); dry.frustumCulled = false; dry.renderOrder = 0;
    const pts = new THREE.Points(this.geo, stampMat); pts.frustumCulled = false; pts.renderOrder = 1;
    this.scene.add(dry, pts);
  }
  // skin mask at a point in A-space (x = u, y = v * ar)
  at(x, y) {
    const u = x, v = y / this.ar;
    if (u <= 0 || u >= 1 || v <= 0 || v >= 1) return 0;
    return this.mask[Math.floor((1 - v) * this.mh) * MW + Math.floor(u * MW)];
  }
  spawn() {
    const d = this.drops.find((o) => !o.on);
    if (!d || !this.spawnPts.length) return;
    const k = Math.random() * this.tot;
    let lo = 0, hi = this.spawnPts.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (this.spawnPts[m][2] < k) lo = m + 1; else hi = m; }
    const [u, v] = this.spawnPts[lo];
    Object.assign(d, {
      on: true, state: 0, t: 0, x: u + rnd(-0.002, 0.002), y: v * this.ar,
      r0: rnd(0.009, 0.016), grow: rnd(0.8, 1.8), hold: rnd(1.2, 3.2), fade: 1,
      vmax: rnd(0.07, 0.13), shed: 0, ang: 0, side: Math.random() < 0.5 ? -1 : 1, dx: 0, dy: -1, sp: 0,
      f1: rnd(2.5, 4.5), p1: rnd(0, 6), f2: rnd(5, 8), p2: rnd(0, 6), f3: rnd(0.8, 1.6), p3: rnd(0, 6), lx: 0, ly: 0,
    });
    d.r = d.r0 * 0.35;
    d.shed = d.r0 / rnd(0.15, 0.45);       // how far it runs before it has given all its water to the streak
  }
  stamp(x, y, diam, amt) {
    if (this.stamps >= MAXS) return;
    const i = this.stamps++, P = this.geo.attributes.position.array;
    P[i * 3] = x; P[i * 3 + 1] = y / this.ar; P[i * 3 + 2] = 0;
    this.geo.attributes.size.array[i] = Math.max(1.5, diam * RW);
    this.geo.attributes.amt.array[i] = amt;
  }
  // wet: 0..1 how sweaty she is; kick: a jolt this step (shakes clinging beads loose, speeds runners up)
  step(dt, wet, kick) {
    this.acc = Math.min(4, this.acc + dt * wet * 2.4);
    while (this.acc > 1) { this.acc -= 1; this.spawn(); }
    this.boost = Math.max(0, this.boost - dt * 3) + kick * 2.5;
    for (const d of this.drops) {
      if (!d.on) continue;
      d.t += dt;
      if (d.state === 0) {                                       // beading up on the skin
        d.r = d.r0 * Math.min(1, 0.35 + 0.65 * d.t / d.grow);
        if (d.t > d.hold || (d.t > d.grow * 0.5 && Math.random() < kick * 0.8)) {
          d.state = 1; d.t = 0; d.lx = d.x; d.ly = d.y;
          this.stamp(d.x, d.y, d.r * 1.3, 0.55);                   // the spot where it sat stays wet
        }
      } else if (d.state === 1) {                                // running down
        // stick-slip: it hesitates and lurches; heavier beads run faster
        const pace = Math.max(0, 0.35 + 0.6 * Math.sin(d.t * d.f1 + d.p1) + 0.35 * Math.sin(d.t * d.f2 + d.p2));
        d.sp = d.vmax * (d.r / d.r0) * pace * (1 + this.boost);
        d.ang += (0.2 * Math.sin(d.t * d.f3 + d.p3) - d.ang) * Math.min(1, dt * 2.5);   // meanders, always pulled back down
        let dx = Math.sin(d.ang), dy = -Math.cos(d.ang);
        const look = d.r * 1.5 + 0.004;
        if (this.at(d.x + dx * look, d.y + dy * look) < 0.5) {
          // the way down leaves the skin: run along the edge instead (or it is soaked up by clothing / drips off)
          let ok = false;
          for (const a of [0.45, 0.9, 1.3]) {
            for (const s of [d.side, -d.side]) {
              const ca = d.ang + a * s, ex = Math.sin(ca), ey = -Math.cos(ca);
              if (ey < 0.15 && this.at(d.x + ex * look, d.y + ey * look) >= 0.5) { dx = ex; dy = ey; d.ang = ca; d.side = s; ok = true; break; }
            }
            if (ok) break;
          }
          if (!ok) { d.state = 2; d.t = 0; continue; }
        }
        const st = d.sp * dt;
        d.x += dx * st; d.y += dy * st; d.dx = dx; d.dy = dy;
        d.r -= st * d.shed;
        if (d.r < d.r0 * 0.3) { d.state = 2; d.t = 0; continue; }
        // streak behind it, a stamp every ~half a texel
        const gap = Math.hypot(d.x - d.lx, d.y - d.ly);
        if (gap > 0.6 / RW) {
          const n = Math.ceil(gap / (0.6 / RW));
          for (let k = 1; k <= n; k++) this.stamp(d.lx + (d.x - d.lx) * k / n, d.ly + (d.y - d.ly) * k / n, d.r * 0.75, 0.9);
          d.lx = d.x; d.ly = d.y;
        }
      } else {                                                   // gone: soaked in / run dry
        d.fade = 1 - d.t / 0.3;
        d.r *= 1 - dt * 3;
        if (d.fade <= 0) d.on = false;
      }
    }
  }
  // per frame: the streaks dry a little, new streak stamps go in
  render(dt) {
    dryMat.uniforms.k.value = Math.exp(-dt / 1.4);
    const G = this.geo;
    G.setDrawRange(0, this.stamps);
    G.attributes.position.needsUpdate = true; G.attributes.size.needsUpdate = true; G.attributes.amt.needsUpdate = true;
    const prev = this.r.getRenderTarget();
    this.r.setRenderTarget(this.rt); this.r.render(this.scene, CAM); this.r.setRenderTarget(prev);
    this.stamps = 0;
  }
  // shader arrays: DR = (x, y, radius, alpha) in A-space, DV = (dir x, dir y, stretch, 0)
  apply(U) {
    const DR = U.DR.value, DV = U.DV.value;
    this.drops.forEach((d, i) => {
      if (!d.on) { DR[i].set(0, 0, 0, 0); return; }
      DR[i].set(d.x, d.y, d.r, d.state === 2 ? Math.max(0, d.fade) : 1);
      DV[i].set(d.state === 0 ? 0 : d.dx, d.state === 0 ? -1 : d.dy, d.state === 1 ? Math.min(1.3, d.sp / 0.08) : 0, 0);
    });
  }
}
