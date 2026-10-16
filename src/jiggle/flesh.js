// Flesh: a soft-body lattice over the whole sprite (like a Live2D warp deformer driven by Spine-style physics).
// Every lattice node carries the four Spine physics parameters as smooth FIELDS instead of per-bone values:
//   softness s(x)  0 = bone / prop (pinned to the body motion) .. 1 = soft flesh (butt core, side boob)
//   strength       spring back to the body's pose: stiff where s is low, loose where s is high
//   inertia / mass how much of the body's acceleration the node resists (∝ s)
//   damping        low in flesh (it rings), high on bone
// Neighbouring nodes are tied together (a Laplacian on the offsets), so a shove travels: hips -> butt -> thigh,
// weaker and later, dying out at the knee. Vertical squash makes a row bulge sideways (volume kept).
// The offset field goes to the GPU as a small float texture, read with bicubic (Catmull-Rom) interpolation.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- authored fields per pose live in public/jiggle/flesh.json (see its _doc); tools/flesh_preview.py draws them.

const NX = 22, NY = 34;

export class Flesh {
  constructor(def, ar, rig) {
    this.def = def;
    this.ar = ar;
    this.rig = rig;
    const n = NX * NY;
    this.s = new Float32Array(n);      // softness
    this.k = new Float32Array(n);      // strength (ω²)
    this.c = new Float32Array(n);      // damping coefficient
    this.br = new Float32Array(n);     // breathing weight
    this.rx = new Float32Array(n); this.ry = new Float32Array(n);   // rest position (sprite-local units: x ∈ [-.5,.5], y ∈ [0, ar])
    this.dx = new Float32Array(n); this.dy = new Float32Array(n);   // offset from the body's pose
    this.vx = new Float32Array(n); this.vy = new Float32Array(n);
    this.tx = new Float32Array(n); this.ty = new Float32Array(n);   // body-pose target (for its acceleration)
    this.tvx = new Float32Array(n); this.tvy = new Float32Array(n);
    this.first = true;
    const d = this.def;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const id = j * NX + i, u = i / (NX - 1), v = j / (NY - 1);
      this.rx[id] = u - 0.5; this.ry[id] = v * ar;
      let s = 0;
      // soft masses hang from their top edge: the lower half stays fully soft, the upper half firms up by `hang`
      for (const [mu, mv, ru, rv, ms, hang] of d.masses) {
        const r = Math.hypot((u - mu) / ru, (v - mv) / rv), up = Math.max(0, Math.min(1, (v - mv) / rv));
        s = Math.max(s, ms * (1 - sstep(0.55, 1.6, r)) * (1 - hang * up));
      }
      for (const [u0, v0, u1, v1, r, s0, s1] of d.limbs) {
        // distance to the segment in sprite-local units
        const ax = u0, ay = v0 * ar, bx = u1, by = v1 * ar, px = u, py = v * ar;
        const ex = bx - ax, ey = by - ay, L2 = ex * ex + ey * ey;
        const t = Math.max(0, Math.min(1, ((px - ax) * ex + (py - ay) * ey) / L2));
        const dd = Math.hypot(px - ax - ex * t, py - ay - ey * t);
        s = Math.max(s, (s0 + (s1 - s0) * t) * (1 - sstep(0.55, 1.5, dd / r)));
      }
      for (const [pu, pv, ru, rv, pk] of d.pins) { const r = Math.hypot((u - pu) / ru, (v - pv) / rv); s *= 1 - pk * (1 - sstep(0.6, 1.2, r)); }
      this.s[id] = s;
      // jelly: heavy and slow in the core (2 Hz), settles in two or three wobbles; firm near bone
      const f = 8.5 - 6.5 * Math.sqrt(s);
      this.k[id] = (TAU * f) ** 2;
      const z = 0.55 - 0.38 * s;                        // damping ratio: 0.55 .. 0.17
      this.c[id] = 2 * z * TAU * f;
      const [tu, tv, tru, trv] = d.torso;
      this.br[id] = 1 - sstep(0.4, 1.2, Math.hypot((u - tu) / tru, (v - tv) / trv));
    }
    // neighbour coupling weights (horizontal / vertical), strongest between soft nodes
    this.wx = new Float32Array(n); this.wy = new Float32Array(n);
    const KN = (TAU * 5.5) ** 2;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const id = j * NX + i;
      if (i < NX - 1) this.wx[id] = KN * (0.08 + Math.sqrt(this.s[id] * this.s[id + 1]));
      if (j < NY - 1) this.wy[id] = KN * (0.08 + Math.sqrt(this.s[id] * this.s[id + NX]));
    }
    // per-row soft centre (for the sideways bulge)
    this.cx = new Float32Array(NY);
    for (let j = 0; j < NY; j++) { let a = 0, b = 0; for (let i = 0; i < NX; i++) { const id = j * NX + i; a += this.s[id] * this.rx[id]; b += this.s[id]; } this.cx[j] = b > 1e-3 ? a / b : 0; }
    this.data = new Float32Array(n * 4);
    this.tex = new THREE.DataTexture(this.data, NX, NY, THREE.RGBAFormat, THREE.FloatType);
    this.tex.minFilter = this.tex.magFilter = THREE.NearestFilter;
    this.tex.needsUpdate = true;
  }

  // softness at a uv point (nearest lattice node)
  softAt(u, v) {
    const i = Math.max(0, Math.min(NX - 1, Math.round(u * (NX - 1)))), j = Math.max(0, Math.min(NY - 1, Math.round(v * (NY - 1))));
    return this.s[j * NX + i];
  }

  // the body's pose of a rest point (mirrors the shader's body layer + the mesh transform), in sprite-local units
  target(x, y, B, X) {
    const L = this.rig.lines, wp = this.rig.waistPivot;
    const v = y / this.ar;
    const hk = sstep(L.ground, L.hip, v);
    let qx = x + B.hip * hk, qy = y + B.drop * hk;
    const wu = sstep(L.waist - 0.05, L.chest, v);
    const px = wp[0] - 0.5 + B.hip, py = wp[1] * this.ar + B.drop;
    const a = B.upper * wu, c = Math.cos(a), s = Math.sin(a);
    let rx = qx - px, ry = qy - py;
    qx = px + c * rx - s * ry; qy = py + s * rx + c * ry;
    qy += (qy - py) * B.breath * wu;
    // whole-figure transform: squash, tilt, shove
    qx *= X.sx; qy *= X.sy;
    const cr = Math.cos(X.r), sr = Math.sin(X.r);
    return [cr * qx - sr * qy + X.ox, sr * qx + cr * qy + X.oy];
  }

  // B: body layer (hip, upper, breath) in local units; X: mesh transform in local units (sx, sy, r, ox, oy)
  // amp: overall strength; ring: >1 = more rebounds; breathe: chest / back breathing phase value (-1..1)
  // pulse: [x, y] body acceleration of the standing-fire bounce, fed straight into the soft parts (the jelly rides it)
  step(dt, B, X, amp, ring, breathe, kick, pulse = null) {
    const n = NX * NY, s = this.s;
    // body-pose targets, their velocity and acceleration -> inertial force on the flesh
    for (let id = 0; id < n; id++) {
      const [x, y] = this.target(this.rx[id], this.ry[id], B, X);
      if (this.first) { this.tx[id] = x; this.ty[id] = y; this.tvx[id] = 0; this.tvy[id] = 0; continue; }
      const vx = (x - this.tx[id]) / dt, vy = (y - this.ty[id]) / dt;
      const ax = (vx - this.tvx[id]) / dt, ay = (vy - this.tvy[id]) / dt;
      this.tx[id] = x; this.ty[id] = y; this.tvx[id] = vx; this.tvy[id] = vy;
      // inertia ∝ softness; clamp spikes (pose swaps)
      const m = s[id] * amp;
      this.vx[id] -= Math.max(-80, Math.min(80, ax)) * m * dt;
      this.vy[id] -= Math.max(-80, Math.min(80, ay)) * m * dt;
    }
    this.first = false;
    if (pulse) for (let id = 0; id < n; id++) { this.vx[id] -= pulse[0] * s[id] * 3 * dt; this.vy[id] -= pulse[1] * s[id] * 3 * dt; }
    // a shot / landing: a random jolt in the soft parts
    if (kick) for (let id = 0; id < n; id++) if (s[id] > 0.05) { this.vy[id] -= kick * s[id] * amp * (0.8 + Math.random() * 0.4); this.vx[id] += (Math.random() - 0.5) * kick * s[id] * amp * 0.5; }
    // springs: back to the body pose (strength), to the neighbours (propagation), damping
    const zMul = 1 / ring;
    const fx = this.fx || (this.fx = new Float32Array(n)), fy = this.fy || (this.fy = new Float32Array(n));
    for (let id = 0; id < n; id++) { fx[id] = -this.k[id] * this.dx[id] - this.c[id] * zMul * this.vx[id]; fy[id] = -this.k[id] * this.dy[id] - this.c[id] * zMul * this.vy[id]; }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const id = j * NX + i;
      if (i < NX - 1) { const w = this.wx[id], ex = this.dx[id + 1] - this.dx[id], ey = this.dy[id + 1] - this.dy[id]; fx[id] += w * ex; fy[id] += w * ey; fx[id + 1] -= w * ex; fy[id + 1] -= w * ey; }
      if (j < NY - 1) { const w = this.wy[id], ex = this.dx[id + NX] - this.dx[id], ey = this.dy[id + NX] - this.dy[id]; fx[id] += w * ex; fy[id] += w * ey; fx[id + NX] -= w * ex; fy[id + NX] -= w * ey; }
    }
    for (let id = 0; id < n; id++) {
      this.vx[id] += fx[id] * dt; this.vy[id] += fy[id] * dt;
      this.dx[id] += this.vx[id] * dt; this.dy[id] += this.vy[id] * dt;
    }
    // write the texture: offset + sideways bulge from vertical squash (volume) + breathing swell
    const hy = this.ar / (NY - 1);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const id = j * NX + i;
      const up = j < NY - 1 ? this.dy[id + NX] : this.dy[id], dn = j > 0 ? this.dy[id - NX] : this.dy[id];
      const strain = (up - dn) / (2 * hy);                       // < 0: squashed vertically
      const bulge = -strain * 1.1 * s[id] * (this.rx[id] - this.cx[j]);   // squashed -> spreads, stretched -> narrows
      const swell = breathe * 0.02 * this.br[id];
      const [tu, tv] = this.def.torso;
      this.data[id * 4] = this.dx[id] + bulge + swell * (this.rx[id] - (tu - 0.5));
      this.data[id * 4 + 1] = this.dy[id] + swell * (this.ry[id] - tv * this.ar);
      this.data[id * 4 + 2] = s[id];
      this.data[id * 4 + 3] = 1;
    }
    this.tex.needsUpdate = true;
  }
  reset() { this.dx.fill(0); this.dy.fill(0); this.vx.fill(0); this.vy.fill(0); this.first = true; }
}
export const LATTICE = { NX, NY };
