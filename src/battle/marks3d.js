// The warning marks as real 3D structures (docs/DESIGN.md「攻击分三种」 提示进化成 3D 结构; user 2026-10-20, after R-Type Delta's
// wireframe tetrahedron turning round the ship it locks on: cones, icosahedra, the twisted skew apeirohedron, graphene - colour,
// motion and the size of what can be hit all plain to see). Glowing wire structures in the world round the thing they mark, their size
// its hit volume, their lines thick (fat lines: three/addons LineSegments2), their corners glowing nodes:
//   kill   (shoot it now)     an icosahedron cage round it; the nearer its strike, the faster it spins and the tighter it closes
//   hide   (get down now)     a cone from it to the girl it goes for (the way the blow will come), rings racing down it toward her; round
//                             the thing itself the twisted mucube {4,6|4} (squares, six at every corner, square holes: a piece of the
//                             regular skew apeirohedron) turning
//   shot   (a thrown thing)   a tetrahedron spinning round it on two axes, a ball of light on every corner
//   guard  (keep it safe)     a graphene shell (the dual of a geodesic sphere: hexagons and twelve pentagons) round what the girls guard;
//                             where it is hit the shell flares
// and a boss's own (user 2026-10-21: the bosses had kept the flat rings and winged hearts - "we are a 3D game; there are many ways to
// combine polyhedra, why not one for the boss"), driven by the boss itself (thing.js; boss.js and the stalker of chase.js through
// fx.js):
//   bossHide  the compound of three octahedra (a star of 24 edges) round her upper body, a small octahedron turning the other way inside
//             it, and a cone from her to EACH girl the blow goes for, rings racing down them
// (a boss's blow to be shot down has no structure: one on her weak point hid her - user 2026-10-21; thing.js motesTick tells it)
// Owned by fx.js (orbit: alongside the screen ring it always had, wherever the thing's place in the world is known).
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

// ---------------------------------------------------------------- the structures, as edge lists (pairs of points), about radius 1
const edgesOf = (geo) => { const e = new THREE.EdgesGeometry(geo, 1); const a = Array.from(e.attributes.position.array); e.dispose(); geo.dispose(); return a; };
const verts = (geo) => { const p = geo.attributes.position, seen = new Map(); for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!seen.has(k)) seen.set(k, [p.getX(i), p.getY(i), p.getZ(i)]); } return [...seen.values()]; };

let CACHE = null;
export function shapes() {   // (also drawn still on the lesson cards: src/ui/marks.js markIcon)
  if (CACHE) return CACHE;
  const ico = new THREE.IcosahedronGeometry(1, 0), icoV = verts(ico);
  const tet = new THREE.TetrahedronGeometry(1, 0), tetV = verts(tet);
  // the cone: apex at z = 1, its mouth a ring of radius 1 at z = 0, three rings between (they slide toward the apex as it comes)
  const cone = [], N = 14;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2, b = (i + 1) / N * Math.PI * 2;
    cone.push(Math.cos(a), Math.sin(a), 0, 0, 0, 1);
    cone.push(Math.cos(a), Math.sin(a), 0, Math.cos(b), Math.sin(b), 0);
  }
  // the mucube: the surface of the cubes of a cubic grid with at most one odd coordinate (nodes and the tubes joining them); its square
  // faces meet six at a corner and leave square holes. A 3 x 3 x 3 block, centred, scaled to radius 1
  const inU = (i, j, k) => i * i + j * j + k * k <= 5 && ((i & 1) + (j & 1) + (k & 1)) <= 1;   // (within a ball: fewer lines, a rounder knot)
  const mu = new Map(), key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const P = (x, y, z) => `${x},${y},${z}`;
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let k = -2; k <= 2; k++) {
    if (!inU(i, j, k)) continue;
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      if (inU(i + dx, j + dy, k + dz)) continue;
      // the face between the two cells: a square on the plane at the shared side, its four edges
      const c = [i + dx * 0.5, j + dy * 0.5, k + dz * 0.5], u = dx ? [0, 1, 0] : [1, 0, 0], v = dz ? [0, 1, 0] : dx ? [0, 0, 1] : [0, 0, 1];
      const corner = (s, t) => [c[0] + (u[0] * s + v[0] * t) * 0.5, c[1] + (u[1] * s + v[1] * t) * 0.5, c[2] + (u[2] * s + v[2] * t) * 0.5];
      const q = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
      for (let n = 0; n < 4; n++) { const a = P(...q[n]), b = P(...q[(n + 1) % 4]); mu.set(key(a, b), [q[n], q[(n + 1) % 4]]); }
    }
  }
  const muE = []; for (const [a, b] of mu.values()) muE.push(...a.map((x) => x / 2.6), ...b.map((x) => x / 2.6));
  // graphene: the dual of a geodesic sphere - a point in the middle of every triangle, joined across every shared edge
  const geo = new THREE.IcosahedronGeometry(1, 2), gp = geo.attributes.position, nf = gp.count / 3, cent = [], edgeFaces = new Map();
  for (let f = 0; f < nf; f++) {
    const a = new THREE.Vector3().fromBufferAttribute(gp, f * 3), b = new THREE.Vector3().fromBufferAttribute(gp, f * 3 + 1), c = new THREE.Vector3().fromBufferAttribute(gp, f * 3 + 2);
    cent.push(a.clone().add(b).add(c).normalize());
    for (const [x, y] of [[a, b], [b, c], [c, a]]) { const k = key(x.toArray().map((n) => n.toFixed(3)).join(), y.toArray().map((n) => n.toFixed(3)).join()); (edgeFaces.get(k) || edgeFaces.set(k, []).get(k)).push(f); }
  }
  const gra = []; for (const fs of edgeFaces.values()) if (fs.length === 2) gra.push(...cent[fs[0]].toArray(), ...cent[fs[1]].toArray());
  geo.dispose();
  // the bosses': three octahedra turned 45 degrees about x, y and z (their compound)
  const oct = new THREE.OctahedronGeometry(1, 0), octE = edgesOf(oct), octV = verts(new THREE.OctahedronGeometry(1, 0));
  const turned = (e, ax) => { const m = new THREE.Matrix4().makeRotationAxis(ax, Math.PI / 4), v = new THREE.Vector3(), o = [];
    for (let i = 0; i < e.length; i += 3) { v.set(e[i], e[i + 1], e[i + 2]).applyMatrix4(m); o.push(v.x, v.y, v.z); } return o; };
  const oct3 = [...turned(octE, new THREE.Vector3(1, 0, 0)), ...turned(octE, new THREE.Vector3(0, 1, 0)), ...turned(octE, new THREE.Vector3(0, 0, 1))];
  const oct3V = []; for (const ax of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) { const m = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(...ax), Math.PI / 4); for (const p of octV) oct3V.push(new THREE.Vector3(...p).applyMatrix4(m).toArray()); }
  CACHE = { ico: edgesOf(ico), icoV, tet: edgesOf(tet), tetV, cone, mu: muE, gra, graV: cent.map((v) => v.toArray()), oct: octE, oct3, oct3V };
  return CACHE;
}

// a soft round dot for the glowing corners
let DOT = null;
function dotTex() {
  if (DOT) return DOT;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  DOT = new THREE.CanvasTexture(c); return DOT;
}
// (the lines in their own colour, not added light: on a bright pink room added light only turns white; the corners glow)
const lines = (pos, color, width, order) => {
  const g = new LineSegmentsGeometry(); g.setPositions(pos);
  const m = new LineMaterial({ color, linewidth: width, transparent: true, depthWrite: false, worldUnits: false });
  const L = new LineSegments2(g, m); L.renderOrder = order; L.frustumCulled = false; return L;
};
const nodes = (pts, color, size, order) => {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
  const m = new THREE.PointsMaterial({ map: dotTex(), color, size, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const P = new THREE.Points(g, m); P.renderOrder = order + 0.1; P.frustumCulled = false; return P;
};
const COLORS = { kill: 0xff3a6a, hide: 0xb04dff, shot: 0xff5a8a, guard: 0xffd060, bossHide: 0xb04dff };
const INK = 0x1a0612;   // (a dark band under a boss's structure: it reads on a bright pink room too)
const ringLines = () => { const r = [], N = 20; for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, b = (i + 1) / N * Math.PI * 2; r.push(Math.cos(a), Math.sin(a), 0, Math.cos(b), Math.sin(b), 0); } return r; };
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), Q = new THREE.Quaternion(), Z = new THREE.Vector3(0, 0, 1);

export class Mark3D {
  constructor(scene, kind) {
    const S = shapes(), col = COLORS[kind] ?? COLORS.kill;
    this.kind = kind; this.root = new THREE.Group(); this.parts = []; this.flare = 0; this.spin = 0;
    const add = (o) => { this.root.add(o); this.parts.push(o); return o; };
    if (kind === 'kill') { this.cage = add(lines(S.ico, col, 2.6, 22)); this.dots = add(nodes(S.icoV, 0xffd0e0, 9, 22)); this.cage.add(this.dots); this.root.remove(this.dots); }
    else if (kind === 'shot') { this.cage = add(lines(S.tet, col, 2.2, 22)); this.dots = add(nodes(S.tetV, 0xffffff, 14, 22)); this.cage.add(this.dots); this.root.remove(this.dots); }
    else if (kind === 'guard') { this.cage = add(lines(S.gra, col, 1.6, 22)); this.dots = add(nodes(S.graV, 0xfff0c0, 5, 22)); this.cage.add(this.dots); this.root.remove(this.dots); }
    else if (kind === 'bossHide') {
      this.cage = add(lines(S.oct3, col, 2.2, 22)); this.ink = lines(S.oct3, INK, 6, 21.8); this.cage.add(this.ink); this.dots = add(nodes(S.oct3V, 0xe8c8ff, 9, 22)); this.cage.add(this.dots); this.root.remove(this.dots);
      this.inner = add(lines(S.oct, 0xe0a0ff, 1.6, 22));
      this.S = S; this.col = col; this.cones = [];   // (one per girl it goes for: made as they are needed)
    }
    else {   // hide: the cone toward her and the twisted mucube round it
      this.cone = add(lines(S.cone, col, 1.5, 22));
      this.rings = [0, 1, 2].map(() => { const r = []; const N = 20; for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, b = (i + 1) / N * Math.PI * 2; r.push(Math.cos(a), Math.sin(a), 0, Math.cos(b), Math.sin(b), 0); } return add(lines(r, 0xc070ff, 1.8, 22)); });
      this.cage = add(lines(S.mu, 0x8a2ad8, 1.1, 22));
    }
    scene.add(this.root);
  }
  // c: its centre (world), r: its size (half its height: the hit volume), p: 0 -> 1 toward the strike, t: time, to: where the blow goes
  // (hide: the girl's place in the world), res: the screen size in px (the fat lines need it)
  set(c, r, p, t, to, res, dt = 1 / 60) {
    this.root.position.copy(c);
    for (const o of this.parts) if (o.material?.resolution) o.material.resolution.copy(res);
    this.flare = Math.max(0, this.flare - dt * 3);
    const a = Math.min(1, 0.55 + p * 0.45 + this.flare);
    for (const o of this.parts) { o.material.opacity = a; for (const ch of o.children) ch.material.opacity = a; }
    if (this.ink) { const m = this.ink.material; m.opacity = a * 0.55; m.resolution.copy(res); }
    if (this.kind === 'kill') {
      this.spin += dt * (0.6 + p * p * 7);
      const s = r * (1.25 - 0.3 * p) * (1 + Math.sin(t * (4 + p * 10)) * 0.04);
      this.cage.scale.setScalar(s); this.cage.rotation.set(this.spin * 0.7, this.spin, this.spin * 0.3);
      this.cage.material.linewidth = 2.2 + p * 2.5 + this.flare * 3;
      this.dots.material.size = 7 + p * 9 + Math.sin(t * 12) * 2;
    } else if (this.kind === 'shot') {
      this.spin += dt * (2.2 + p * 4);
      this.cage.scale.setScalar(r * 1.7); this.cage.rotation.set(this.spin, this.spin * 1.6, 0);
      this.dots.material.size = 12 + Math.sin(t * 9) * 3 + p * 6;
    } else if (this.kind === 'bossHide') {
      this.spin += dt * (0.4 + p * 2.2);
      this.cage.scale.setScalar(r); this.cage.rotation.set(this.spin * 0.45, this.spin, Math.sin(t * 0.6) * 0.5);
      this.cage.material.linewidth = 3 + p * 3 + this.flare * 3;
      this.inner.scale.setScalar(r * 0.42); this.inner.rotation.set(-this.spin * 1.3, -this.spin * 0.9, 0);
      this.dots.material.size = 9 + p * 10;
      // the cones: from her to every girl the blow goes for (to: one point or a list)
      const T = to ? (Array.isArray(to) ? to : [to]) : [];
      while (this.cones.length < T.length) {
        const cone = lines(this.S.cone, this.col, 1.6, 22), rings = [0, 1, 2].map(() => lines(ringLines(), 0xc070ff, 1.8, 22));
        this.root.add(cone); this.parts.push(cone); for (const m of rings) { this.root.add(m); this.parts.push(m); }
        this.cones.push({ cone, rings });
      }
      this.cones.forEach((C, j) => {
        const on = j < T.length; C.cone.visible = on; for (const m of C.rings) m.visible = on; if (!on) return;
        const d = tmp.copy(T[j]).sub(c), L = d.length() || 1;
        Q.setFromUnitVectors(Z, tmp2.copy(d).divideScalar(L));
        C.cone.quaternion.copy(Q); C.cone.scale.set(r * 0.55, r * 0.55, L); C.cone.material.resolution?.copy(res);
        C.rings.forEach((m, i) => {
          const k = ((t * (0.5 + p * 1.6) + i / 3) % 1);
          m.quaternion.copy(Q); m.position.copy(d).multiplyScalar(k); const rr = r * 0.55 * (1 - k) + 0.05; m.scale.set(rr, rr, 1);
          m.material.opacity = a * (1 - k * 0.7) * 0.8; m.material.resolution?.copy(res);
        });
      });
    } else if (this.kind === 'guard') {
      this.spin += dt * 0.35;
      this.cage.scale.setScalar(r * 1.35); this.cage.rotation.set(0.3, this.spin, 0);
      this.cage.material.linewidth = 1.4 + this.flare * 3;
      this.dots.material.size = 4 + this.flare * 10;
    } else {
      // the cone: its mouth round the monster, its tip at her; rings run down it toward her, faster as it comes
      const d = to ? tmp.copy(to).sub(c) : tmp.set(0, 0, 1), L = d.length() || 1;
      Q.setFromUnitVectors(Z, tmp2.copy(d).divideScalar(L));
      this.cone.quaternion.copy(Q); this.cone.scale.set(r * 1.1, r * 1.1, L);
      this.rings.forEach((m, i) => {
        const k = ((t * (0.5 + p * 1.6) + i / 3) % 1);
        m.quaternion.copy(Q); m.position.copy(d).multiplyScalar(k); const rr = r * 1.1 * (1 - k) + 0.05; m.scale.set(rr, rr, 1);
        m.material.opacity = a * (1 - k * 0.7) * 0.8;
      });
      this.spin += dt * (0.5 + p * 2.5);
      this.cage.scale.setScalar(r * 0.95); this.cage.rotation.set(this.spin * 0.5, this.spin, Math.sin(t * 0.7) * 0.6);
      this.cage.material.opacity = a * 0.6;
    }
    if (this.ink) this.ink.material.linewidth = this.cage.material.linewidth + 4;
  }
  hit() { this.flare = 1; }
  remove() {
    this.root.parent?.remove(this.root);
    this.root.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  }
}
