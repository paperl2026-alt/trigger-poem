// Panel-built stages (docs/DESIGN.md "场景的技术路线"): the place is a real 3D space put together from flat boards like a pop-up book
// or a stage set. Every board carries a flat, front-on painting (a wall elevation, the floor seen from above), so the perspective comes
// from the 3D view itself and the camera can travel through it. Covers, props and monsters are single drawings with a depth relief
// (tools/relief.py) so they have volume. Boards can fold along their edges: the "Inception" moves (floor ridges, the corridor bending up).
// An ink pass draws outlines on depth edges so the whole thing reads like an anime background.
// Same interface as World (world.js): Game, enemies, bosses and fx work on it unchanged. Data: content sets/<id>.json with "panels": true.
import * as THREE from 'three';
import { tex, meta } from '../core/assets.js';
import { paperMesh, DamageMap, attachDamage, setRelief, FOG, NOISE_GLSL } from '../core/paper.js';
import { Ease } from '../core/tween.js';
import { sfx, sound } from '../core/audio.js';
import { C, T } from '../core/content.js';
import { shadowTex, COL } from './fx.js';
import { Physics, physicsReady } from './physics.js';
import { FR } from '../core/particles.js';
import { shotOf } from './shot.js';

const tmpV = new THREE.Vector3(), tmpV3 = new THREE.Vector3(), TMPC = new THREE.Color(), FIT_F = new THREE.Vector3(), FIT_R = new THREE.Vector3();
const rnd = (a, b) => a + Math.random() * (b - a);

// a flat board w x h (metres) showing texture key with the given uv scale; pivot at its centre
// a rectangle (x a..b, z near c .. far d) without a square hole in it (hole: { x, z, size }): the four pieces round it
function holeRects(a, b, c, d, hole) {
  const r = (hole.size ?? 1.6) / 2, hx0 = hole.x - r, hx1 = hole.x + r, hz0 = hole.z + r, hz1 = hole.z - r;
  return [[a, b, c, hz0], [a, b, hz1, d], [a, hx0, hz0, hz1], [hx1, b, hz0, hz1]].filter(([p, q, u, v]) => q - p > 0.01 && u - v > 0.01);
}
function board(key, w, h, opts = {}) {
  const geo = new THREE.PlaneGeometry(w, h);
  if (opts.uv) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * opts.uv[0] + (opts.uv0?.[0] || 0), uv.getY(i) * opts.uv[1] + (opts.uv0?.[1] || 0)); }
  const t = tex[key];
  if (t && opts.uv) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; }
  const soft = !!opts.soft;   // (soft: its alpha blends, edges that fade out; not cut at half)
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t || null, color: t ? 0xffffff : 0xff00ff, transparent: !!opts.alpha || soft, alphaTest: soft ? 0 : opts.alpha ? 0.5 : 0, side: THREE.DoubleSide, fog: true, ...(opts.decal || soft ? { depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 } : {}) }));
  m.userData.texKey = key;
  return m;
}

const INK_FRAG = `
uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 texel; uniform float near; uniform float far; uniform float time; uniform vec3 ink; uniform float paper;
uniform vec3 gTint; uniform float gK; uniform float gSat;
uniform float dark; uniform vec4 lamps[4];   // (a dark room: how dark, and up to four lit lamps: screen x, y, radius, strength)
varying vec2 vUv;
${NOISE_GLSL}
float lin(vec2 uv) { float z = texture2D(tDepth, uv).x; return near * far / (far - z * (far - near)); }
void main(){
  vec3 c = texture2D(tColor, vUv).rgb;
  float d = lin(vUv);
  if (d < far * 0.98) {
    // creases and silhouettes: how much the depth bends here, relative to its distance
    float l = lin(vUv - vec2(texel.x, 0.0)), r = lin(vUv + vec2(texel.x, 0.0));
    float u = lin(vUv + vec2(0.0, texel.y)), b = lin(vUv - vec2(0.0, texel.y));
    float lap = abs(l + r + u + b - 4.0 * d) / d;
    float jump = max(max(abs(l - d), abs(r - d)), max(abs(u - d), abs(b - d))) / d;
    float e = max(smoothstep(0.012, 0.03, lap), smoothstep(0.06, 0.14, jump));
    c = mix(c, ink, e * 0.85);
  }
  // the set's colour grade (DESIGN「画面一致性」): everything in the place (boards, props, covers, monsters) in one light; the heroines
  // are drawn after this and keep their own colours
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(lum), c, gSat);
  c = mix(c, c * gTint, gK);
  // paper: a little fibre grain over everything
  float g = fbm(vUv * vec2(260.0, 150.0)) - 0.5;
  c *= 1.0 + g * paper;
  // a dark room (DESIGN「地形和机关」 点灯): night-blue darkness, warm pools round the lamps the girls have lit
  if (dark > 0.001) {
    float pool = 0.0, asp = texel.y / texel.x;
    for (int i = 0; i < 4; i++) { vec4 L = lamps[i]; if (L.w > 0.0) pool += L.w * smoothstep(L.z, 0.0, length((vUv - L.xy) * vec2(asp, 1.0))); }
    pool = clamp(pool, 0.0, 1.0);
    c = mix(c, c * vec3(0.16, 0.15, 0.25), dark * (1.0 - pool));
    c += vec3(1.0, 0.62, 0.28) * 0.12 * pool * dark;
  }
  gl_FragColor = vec4(c, 1.0);
}`;

// a hole broken through a wall / the ceiling (DESIGN「演出」: walls are not to be trusted): a jagged dark opening, a pale broken rim, cracks
// running out; drawn by the program, a few versions
const HOLES = [], HOLES_T = [];
function holeTex(through = false) {   // (through: the middle see-through, only the torn rim - a hole cut right through, cutWall)
  const HS = through ? HOLES_T : HOLES;
  if (HS.length < 3) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), R = 128;
    const jag = (r0, r1, n) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, r = r0 + Math.random() * (r1 - r0); return [R + Math.cos(a) * r, R + Math.sin(a) * r]; });
    const fill = (pts, style) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = style; g.fill(); };
    g.strokeStyle = 'rgba(34,14,20,0.85)'; g.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      let a = Math.random() * Math.PI * 2, x = R + Math.cos(a) * 72, y = R + Math.sin(a) * 72;
      g.lineWidth = 2 + Math.random() * 2; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 5; k++) { a += (Math.random() - 0.5) * 0.9; x += Math.cos(a) * 11; y += Math.sin(a) * 11; g.lineTo(x, y); }
      g.stroke();
    }
    fill(jag(80, 114, 28), 'rgba(238,218,196,0.96)');
    fill(jag(70, 98, 32), 'rgb(118,68,58)');
    const gr = g.createRadialGradient(R, R, 8, R, R, 92); gr.addColorStop(0, '#040108'); gr.addColorStop(1, '#22101a');
    fill(jag(56, 86, 36), gr);
    if (through) { g.globalCompositeOperation = 'destination-out'; fill(jag(60, 80, 36), '#000'); g.globalCompositeOperation = 'source-over'; }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; HS.push(t);
  }
  return HS[Math.floor(Math.random() * HS.length)];
}

// the drawbridge's deck: old planks side by side, two iron bands with rivets (drawn by the program)
let PLANKS = null;
function plankTex() {
  if (PLANKS) return PLANKS;
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d');
  const n = 6, pw = 256 / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = ['#8a5a34', '#76492a', '#93623a'][i % 3]; g.fillRect(i * pw + 2, 0, pw - 4, 512);
    g.strokeStyle = 'rgba(50,28,14,0.45)'; g.lineWidth = 1.5;
    for (let k = 0; k < 7; k++) { const x = i * pw + 6 + Math.random() * (pw - 12); g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, 170, x - 6, 340, x + 3, 512); g.stroke(); }
    g.fillStyle = 'rgba(40,22,10,0.6)'; g.fillRect(i * pw, 0, 2, 512);
  }
  for (const y of [90, 400]) {
    g.fillStyle = '#3a3a40'; g.fillRect(0, y, 256, 26); g.fillStyle = '#5a5a62'; g.fillRect(0, y + 3, 256, 5);
    g.fillStyle = '#c8c0b0'; for (let i = 0; i < n; i++) { g.beginPath(); g.arc(i * pw + pw / 2, y + 13, 4, 0, Math.PI * 2); g.fill(); }
  }
  PLANKS = new THREE.CanvasTexture(c); PLANKS.colorSpace = THREE.SRGBColorSpace;
  return PLANKS;
}
// an iron rod from a to b (a chain seen from afar)
function rod(a, b, r = 0.035) {
  const d = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), new THREE.MeshBasicMaterial({ color: 0x2b211c }));
  m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

export class PanelWorld {
  constructor(game, setId) {
    this.game = game;
    this.panels = true;
    const set = this.set = C.sets[setId];
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(52, 16 / 9, 0.05, 120);
    this.scene.add(this.camera);
    this.scene.background = new THREE.Color(set.sky || '#2a1830');
    this.scene.fog = new THREE.Fog(set.fog || '#8a6070', set.fogNear ?? 8, set.fogFar ?? 34);
    FOG.color.value.set(set.fog || '#8a6070'); FOG.density.value = set.fogDensity ?? 0.03;
    this.anomaly = set.turns ? (set.start ?? 0) : 1;   // a set that turns between real and rotten starts as "start" (docs/DESIGN.md 第 1 话)
    this.turnDir = 1;
    this.root = new THREE.Group(); this.scene.add(this.root);
    const world = this;
    this.level = {
      set, lights: [], sky: null,
      get group() { return world.root; },
      ceilAt: () => set.hall?.h ?? 3,
      fogAt: () => FOG.density.value,
      setAnomaly() {}, update() {},
    };
    this.ray = new THREE.Raycaster();
    this.look = { x: 0, y: 0 };
    this.camPos = new THREE.Vector3(0, 1.1, 2);
    this.lookAt = new THREE.Vector3(0, 1, -10);
    this.bob = 0; this.fovKick = 0;
    this.covers = [];
    this.baseFov = 52;
    this.lit = new THREE.Color(...(set.lit || [1, 0.94, 0.9]));
    this.dark = set.dark || 0; this.lampList = [];   // (a dark room: set "dark", lit up lamp by lamp: addLamp)
    this.build();
    // ink pass
    this.rt = new THREE.WebGLRenderTarget(4, 4);
    this.rt.depthTexture = new THREE.DepthTexture(4, 4);
    this.inkU = { tColor: { value: this.rt.texture }, tDepth: { value: this.rt.depthTexture }, texel: { value: new THREE.Vector2() }, near: { value: 0.05 }, far: { value: 120 },
      time: { value: 0 }, ink: { value: new THREE.Color(set.ink || '#2a1420') }, paper: { value: set.paper ?? 0.06 },
      gTint: { value: new THREE.Color(1, 1, 1) }, gK: { value: 0 }, gSat: { value: 1 },
      dark: { value: this.dark }, lamps: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 0, 0)) } };   // (w = 0: no lamp)
    this.grade(this.anomaly);
    this.inkScene = new THREE.Scene();
    this.inkCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.inkScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: this.inkU, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: INK_FRAG })));
  }

  // ---------------------------------------------------------------- the place
  build() {
    const S = this.set, Hd = S.hall, R = this.root;
    const { x0, x1, z0, z1, h, bay } = Hd, W = x1 - x0, L = z0 - z1;
    // the far part of the corridor hangs on a hinge so it can bend up (fold); everything past foldZ goes in it
    this.hinge = new THREE.Group(); this.hinge.position.set(0, 0, Hd.foldZ ?? z1); R.add(this.hinge);
    const put = (m, z) => { if (Hd.foldZ !== undefined && z < Hd.foldZ) { m.position.z -= Hd.foldZ; this.hinge.add(m); } else R.add(m); return m; };
    // walls: one painted bay after another (left = classroom side, right = windows). Every surface kind has several pictures
    // (docs/ART.md 多版本): a fixed shuffled order per set, never the same picture twice in a row
    const bays = Math.ceil(L / bay), seed = S.seed ?? 7;
    const some = (l) => l && [].concat(l).length;   // (a place may have no walls or ceiling: the netherworld is open all round)
    const KL = some(Hd.left) ? order(Hd.left, bays, seed) : null, KR = some(Hd.right) ? order(Hd.right, bays, seed + 1) : null, KC = some(Hd.ceil) ? order(Hd.ceil, bays, seed + 2) : null;
    // boards with an anomaly version (<key>_x): when the evil energy hits they flip over to it, one after another (update)
    this.flips = [];
    const flip = (m, key, side, alt = `${key}_x`) => { if (tex[alt]) this.flips.push({ m, key, alt, side, p: 0, d: 0 }); return m; };
    const keyed = (k) => !!(meta[k]?.keyed || /W$/.test(k));
    this.wallB = [];   // (the side walls' boards: a hole can be cut through one, cutWall)
    const rows = Hd.rows || 1, rh = h / rows;   // (a tall place: its walls stacked in rows, each row a picture of its own)
    const KL2 = rows > 1 && KL ? order(Hd.left, bays * rows, seed + 5) : KL, KR2 = rows > 1 && KR ? order(Hd.right, bays * rows, seed + 6) : KR;
    for (let i = 0; i < bays; i++) {
      const zc = z0 - (i + 0.5) * bay;
      for (let r = 0; r < rows; r++) {
        const kl = KL2?.[i * rows + r], kr = KR2?.[i * rows + r], yc = (r + 0.5) * rh;
        if (KL) { const l = board(kl, bay, rh, { alpha: keyed(kl) }); l.position.set(x0, yc, zc); l.rotation.y = Math.PI / 2; put(l, zc); flip(l, kl, 1); this.wallB.push({ m: l, on: 'left', key: kl, zc, yc, rh }); }
        if (KR) { const rr = board(kr, bay, rh, { alpha: keyed(kr) }); rr.position.set(x1, yc, zc); rr.rotation.y = -Math.PI / 2; put(rr, zc); flip(rr, kr, -1); this.wallB.push({ m: rr, on: 'right', key: kr, zc, yc, rh }); }
      }
      // ceiling, one bay at a time (so it folds with the rest); open sky when the set has none
      const cut = (Hd.shafts || []).find((s) => s.at === 'ceil' && Math.abs(s.z - zc) < bay / 2);   // (a shaft above: the ceiling round its hole)
      if (KC && cut) for (const [a, b, c2, d] of holeRects(x0, x1, zc + bay / 2, zc - bay / 2, cut)) {
        const pc = board(KC[i], b - a, c2 - d, { uv: [(b - a) / Hd.tile, (c2 - d) / Hd.tile], uv0: [(a - x0) / Hd.tile, (i * bay + (zc + bay / 2 - c2)) / Hd.tile] });
        pc.position.set((a + b) / 2, h, (c2 + d) / 2); pc.rotation.x = Math.PI / 2; put(pc, zc); flip(pc, KC[i], 0);
      } else if (KC) { const c = board(KC[i], W, bay, { uv: [W / Hd.tile, bay / Hd.tile], uv0: [0, i * bay / Hd.tile] }); c.position.set((x0 + x1) / 2, h, zc); c.rotation.x = Math.PI / 2; put(c, zc); flip(c, KC[i], 0); }
    }
    // the end wall, the void behind it, the outside seen through the windows
    const ek = Hd.end ? order(Hd.end, 1, seed + 3)[0] : null;
    if (ek) { const e = board(ek, W, h, { alpha: true }); e.position.set((x0 + x1) / 2, h / 2, z1); put(e, z1); flip(e, ek, 0); }
    // the door this room ends at (DESIGN「门和小关的衔接」): the very door the close-up after this room opens (tools/rounds/door_room.py),
    // standing in the end wall from the start, so the girls see where they are going; hall.door = { frame, leaf, w (metres), x }
    if (Hd.door && tex[Hd.door.frame]) {
      const D = Hd.door, ft = tex[D.frame], hole = meta[D.frame]?.hole || [0.26, 0.2, 0.74, 1], dw = D.w, dh = dw * ft.image.height / ft.image.width, dx = D.x || 0;
      const f = board(D.frame, dw, dh, { soft: true }); f.position.set(dx, dh / 2, z1 + 0.08); f.renderOrder = 2; put(f, z1);
      if (tex[D.leaf]) {
        const lw = dw * (hole[2] - hole[0]), lh = dh * (hole[3] - hole[1]), l = board(D.leaf, lw, lh, { alpha: true });
        l.position.set(dx + dw * ((hole[0] + hole[2]) / 2 - 0.5), dh * (1 - (hole[1] + hole[3]) / 2), z1 + 0.05); put(l, z1);
      }
    }
    // a drawbridge (hall.bridge = { z0, z1, seals }): a gap in the floor between z0 and z1, the bridge standing up on its far side (hinged
    // on the floor at z1, its own floor picture, two chains up to the walls); it comes down when the seals holding it are shot (gateHit)
    if (Hd.bridge) {
      const B = Hd.bridge, L = B.z0 - B.z1, fk = [].concat(Hd.floor)[0];
      const g = new THREE.Group(); g.position.set((x0 + x1) / 2, 0, B.z1); void fk;
      const deck = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.2, L), new THREE.MeshBasicMaterial({ map: plankTex(), side: THREE.DoubleSide })); deck.position.y = L / 2; g.add(deck);
      const top = B.anchorY ?? Math.min(h - 0.2, L + 0.8), az = B.anchorZ ?? B.z1 + 0.3;
      this.chains = [-1, 1].map((sd) => { const m = rod(new THREE.Vector3((x0 + x1) / 2 + sd * (W / 2 - 0.3), L - 0.1, B.z1 + 0.02), new THREE.Vector3(sd < 0 ? x0 + 0.06 : x1 - 0.06, top, az), 0.05); R.add(m); return m; });
      R.add(g); this.bridge = g;
      this.gate = { open: false, need: B.seals ?? 2, got: 0 };
    }
    // a wall behind where the girls came in too (a station that looks back: the view whips round, Game.whip); back: true = the other
    // version of the end wall, or its own pictures
    if (Hd.back) {
      const bk = Hd.back === true ? ([].concat(Hd.end || []).find((k) => k !== ek) || ek) : order(Hd.back, 1, seed + 4)[0];
      if (bk) { const b = board(bk, W, h, { alpha: true }); b.position.set((x0 + x1) / 2, h / 2, z0); b.rotation.y = Math.PI; R.add(b); flip(b, bk, 0); }
    }
    if (Hd.outside) for (const o of (Hd.outsideAt || [{ x: x1 + 11, z: (z0 + z1) / 2, ry: -Math.PI / 2, w: 66 }, { x: 0, z: z1 - 14, ry: 0, w: 40 }])) {
      const m = board(o.k || Hd.outside, o.w, o.w / 1.5); m.material.fog = false; m.position.set(o.x, o.w / 1.5 * (o.yk ?? 0.3), o.z); m.rotation.y = o.ry || 0; o.ry ? R.add(m) : put(m, o.z);   // big enough for every window angle, horizon near eye height
      flip(m, Hd.outside, 0, Hd.outsideX);
    }
    // free-standing boards: a building front, a sky, a backdrop (x, z = bottom centre, y = its bottom, w = width; height from the picture)
    for (const b of S.boards || []) {
      const t = tex[b.k]; if (!t) continue;
      const hh = b.h || b.w * t.image.height / t.image.width, m = board(b.k, b.w, hh, { alpha: keyed(b.k) || b.alpha });
      m.position.set(b.x || 0, (b.y || 0) + hh / 2, b.z); m.rotation.y = (b.ry || 0) * Math.PI / 180;
      if (b.sky) m.material.fog = false;
      R.add(m); flip(m, b.k, 0);
      if (b.name) (this.named || (this.named = {}))[b.name] = { m, w: b.w, h: hh, x: b.x || 0, y: b.y || 0, z: b.z };
      if (b.occlude) (this.occluders || (this.occluders = [])).push(m);   // shots stop at it (Game.targetsAt)
    }
    // floor: tiles, so they can fold up into ridges; the painted boards run on across them
    this.tiles = [];
    const tw = W / Hd.tilesX, tl = Hd.tileL;
    for (let j = 0; j * tl < L; j++) for (let i = 0; i < Hd.tilesX; i++) {
      const xa = x0 + i * tw, za = z0 - j * tl;
      // which floor picture: one per tile-sized block (all versions share their edges, so any mix meets without a seam)
      const FL = [].concat(Hd.floor), bk = FL[hash(Math.floor(xa / Hd.tile + 1e-6), Math.floor((za - tl) / Hd.tile + 1e-6), seed) % FL.length];
      const t = board(bk, tw, tl, { uv: [tw / Hd.tile, tl / Hd.tile], uv0: [xa / Hd.tile, (za - tl) / Hd.tile] });
      // pivot on its far edge, lying toward the camera: lifting its near edge makes a ridge facing the camera
      t.geometry.translate(0, tl / 2, 0);
      t.rotation.x = Math.PI / 2;
      const g = new THREE.Group(); g.position.set(xa + tw / 2, 0, za - tl); g.add(t);
      put(g, za - tl);
      if (tex[`${bk}_x`]) this.flips.push({ m: t, key: bk, alt: `${bk}_x`, side: 0, p: 0, d: 0, floor: true });
      this.tiles.push({ g, t, x: xa + tw / 2, z: za - tl / 2 });
    }
    // holes there from the start (hall.holes: { on, z, y, size }: a spawner pours monsters out of one)
    for (const o of Hd.holes || []) this.addHole(o.on, new THREE.Vector3(o.x ?? 0, o.y ?? 1.1, o.z), o.size ?? 1.6, false, true);   // (built with the place: no burst)
    // (the drawbridge's gap: no floor there)
    if (Hd.bridge) for (const t of this.tiles) if (t.z < Hd.bridge.z0 - 0.05 && t.z > Hd.bridge.z1 + 0.05) t.g.visible = false;
    // under the floor: the void the folds open onto
    const v = new THREE.Mesh(new THREE.PlaneGeometry(W * 3, L * 2), new THREE.MeshBasicMaterial({ color: S.void || '#1a0820', fog: false }));
    v.rotation.x = -Math.PI / 2; v.position.set(0, -1.4, (z0 + z1) / 2); R.add(v);
    // decals: sigils, banners, papers, goo laid on the boards
    for (const d of S.decals || []) {
      const t = tex[d.k]; if (!t) continue;
      const w = d.w, hh = w * t.image.height / t.image.width, m = board(d.k, w, hh, { alpha: true, decal: true });
      if (d.on === 'left') { m.position.set(x0 + 0.01, d.y, d.z); m.rotation.y = Math.PI / 2; }
      else if (d.on === 'right') { m.position.set(x1 - 0.01, d.y, d.z); m.rotation.y = -Math.PI / 2; }
      else if (d.on === 'floor') { m.position.set(d.x, 0.01, d.z); m.rotation.x = -Math.PI / 2; m.rotation.z = d.r || 0; }
      else if (d.on === 'hang') { m.position.set(d.x, h - hh / 2 - 0.05, d.z); m.material.side = THREE.DoubleSide; }
      put(m, d.z);
      // a banner hangs from the ceiling on a pivot: what flies into it, a shot that lands on it, swings it (src/battle/physics.js)
      if (d.on === 'hang' && !d.anomaly && this.phys && m.parent === R) {   // (not in the folding part: it moves)
        m.updateMatrixWorld(true); m.userData.hang = this.phys.hang(m, w, hh, 0.03, new THREE.Vector3(d.x, h - 0.03, d.z)); }
      if (d.anomaly) { m.visible = false; (this.anomalyDecals || (this.anomalyDecals = [])).push(m); }
    }
    // the ways between places (hall.ways / stairs / shafts, tools/rounds/ep2_level.py; DESIGN 第 2 话「场景之间怎么走」): a short passage
    // behind a doorway the camera really walks into, a door in it that opens, stairs up to a doorway high in a wall, a shaft above a hole
    // in the ceiling (a fall into the cave, a ladder up) or below one in the floor (a trapdoor)
    this.ways = {};
    for (const wy of Hd.ways || []) this.buildWay(wy);
    for (const s of Hd.stairs || []) this.buildStairs(s);
    for (const s of Hd.shafts || []) this.buildShaft(s);
    // props standing in the corridor (relief drawings), and every station's covers: placed in the level, there from the start
    this.coverSets = {};
    for (const [sid, st] of Object.entries(S.stations)) this.coverSets[sid] = (st.covers || []).map((c) => this.makeCover(c, st, sid));
    // the props are real things (src/battle/physics.js: they rock when shot, fly when broken, tumble and bounce off the room)
    this.phys = physicsReady() ? new Physics(Hd, this.root) : null;
    for (const p of S.props || []) this.makeProp(p);
    // the anomaly wave starts where the evil energy hits (set "anomalyFrom", default the far end) and runs outward from there
    this.root.updateMatrixWorld(true);
    const from = new THREE.Vector3(...(S.anomalyFrom || [0, h / 2, z1]));
    for (const f of this.flips) { f.d = f.m.getWorldPosition(tmpV).distanceTo(from); f.base = f.m.position.clone(); }
  }
  // a relief drawing standing on the floor at (x, z), facing a point
  // (h = the drawn height: a picture with a transparent margin for the outline, tools/pad_frames.py, still stands on the floor)
  relief(key, h, x, z, face, amtK = 0.32) {
    const t = tex[key], ar = t.image.width / t.image.height, pad = meta[key]?.pad || [0, 0, 0, 0];
    const k = h / (t.image.height - pad[1] - pad[3]), w = (t.image.width - pad[0] - pad[2]) * k;
    const m = paperMesh(t, t.image.width * k, { pivot: 'bottom', segs: [64, Math.max(8, Math.round(64 / ar))] });
    m.geometry.translate((pad[2] - pad[0]) / 2 * k, -pad[3] * k, 0);
    if (meta[key]?.relief) setRelief(m, tex[meta[key].relief], Math.min(w, h) * amtK);
    m.material.uniforms.lit.value.copy(this.lit);
    m.userData.texKey = key;
    m.position.set(x, 0, z);
    m.rotation.order = 'YXZ';   // yaw to face, then tip over about its own base
    m.rotation.y = Math.atan2(face.x - x, face.z - z);
    m.renderOrder = 4;
    const sh = this.makeShadow(w * 0.9); sh.position.set(x, 0.02, z); this.root.add(sh);
    this.root.add(m);
    return { m, w, h, sh };
  }
  // covers (DESIGN「掩体」): things standing in the corridor from the start, seen from afar; the girls arrive and take cover behind them.
  // One per heroine per station (side -1 = 1P, 1 = 2P). Where each stands and how big it is comes from where her heroine stands on
  // screen at that station (placeCovers): when the camera stops there it stands just beyond her, between her and the monsters, like in
  // NIKKE: she is always drawn whole over it (covers and scenery never hide the heroines), and it shows around her, about as big as she
  // is kneeling and wider, so it clearly shields her; out shooting she rises above it. Built at unit height, placed and scaled later.
  makeCover(c, st, sid) {
    const { m, w, h, sh } = this.relief(c.k, 1, 0, 0, new THREE.Vector3(0, 0, 1), 0.34);
    const dm = new DamageMap(h / w, 384); attachDamage(m, dm);
    // solidTop: where the solid body starts (a broom sticking up does not count as the top)
    return { m, sh, dm, c, st, sid, ar: w / h, solid: 1 - (meta[c.k]?.solidTop || 0), amt: m.material.uniforms.reliefAmt.value, def: { x: 0, z: 0, h: 1, k: c.k }, w, h,
      slot: c.side < 0 ? 0 : 1, hp: 0, max: 0, broken: false };
  }
  // put every station's covers in front of where the heroines stand on screen there (after a resize / layout too)
  placeCovers(players) {
    if (!this.coverSets) return;
    const L = T.layout.cover, cam = this.stCam || (this.stCam = new THREE.PerspectiveCamera());
    cam.fov = this.baseFov; cam.aspect = this.camera.aspect; cam.near = this.camera.near; cam.far = this.camera.far; cam.updateProjectionMatrix();
    const fw = new THREE.Vector3(), ray = new THREE.Ray(), hit = new THREE.Vector3(), floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    for (const list of Object.values(this.coverSets)) for (const cv of list) {
      const p = players[cv.slot]; if (!p || !p.H) continue;
      const st = cv.st, H = p.H, W = p.W, SP = shotOf(st), Pl = SP.players || {}, sc = Pl.scale ?? 1;
      cam.fov = this.baseFov - (SP.cam?.zoom || 0); cam.updateProjectionMatrix();   // (that stop's shot: its scope narrows the view)
      cam.position.set(...st.cam); cam.lookAt(new THREE.Vector3(...st.look)); cam.updateMatrixWorld();
      // her kneeling figure on screen in that stop's shot (tuning/shots.json players: where, how big, how far sunk): its height sets the
      // cover's top, its width and middle the cover's width and middle
      const bx = p.frame ? p.frame.x + p.frame.w * (Pl.x?.[cv.slot] ?? 0.5) : p.baseX;
      let kh = p.H * 0.4 * sc, kw = kh * 0.75, cx = bx;
      if (p.hero) { const d = p.hero.dims('cover'), au = p.hero.R.cover.anchor; kh = d.h * sc; kw = d.w * sc; cx = bx - ((p.mirror ? 1 - au : au) - 0.5) * d.w * sc; }
      const pb = p.bottom + (Pl.y ?? 0) * H - (Pl.crop ?? 0) * (p.hero ? p.hero.standH() : H * 0.42) * sc;   // (her feet in that shot)
      // its foot on the floor a little above her feet on screen (= just beyond her), its top at a share of her kneeling height;
      // wider than her (a narrow drawing gets a higher top, up to maxTop)
      const sx = cx + p.side * kw * L.x, base = Math.max(H * L.lift, pb + H * L.lift);
      let top = pb + kh * L.top;
      top = Math.min(pb + kh * L.maxTop, Math.max(top, base + kw * L.w / cv.ar * cv.solid));
      ray.origin.copy(cam.position);
      ray.direction.set(sx / W * 2 - 1, base / H * 2 - 1, 0.5).unproject(cam).sub(cam.position).normalize();
      if (!ray.intersectPlane(floor, hit)) continue;
      cam.getWorldDirection(fw);
      const depth = hit.clone().sub(cam.position).dot(fw);
      const hh = (top - base) / cv.solid / H * 2 * depth * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      const m = cv.m;
      m.position.set(hit.x, 0, hit.z);
      m.rotation.y = Math.atan2(cam.position.x - hit.x, cam.position.z - hit.z);
      m.scale.set((cv.c.flip ? -1 : 1) * hh, hh, hh);
      cv.sh.position.set(hit.x, 0.02, hit.z); cv.sh.scale.setScalar(hh);
      cv.w = hh * cv.ar; cv.h = hh;
      cv.def.x = hit.x; cv.def.z = hit.z; cv.def.h = hh;
    }
    this.clearProps();
  }
  // props are breakable (DESIGN「敌人要逼上来」: what stands between the monsters and the girls can be shot to bits, and the monsters smash
  // through it), unless the set marks one "solid" (a fountain, a statue): shots stop at it, it takes holes, it tips over and fades when
  // spent (tuning combat.json prop)
  makeProp(p) {
    const r = this.relief(p.k, p.h, p.x, p.z, new THREE.Vector3(p.fx ?? p.x, 0, p.fz ?? p.z + 5), 0.3);
    const q = { ...r, x: p.x, z: p.z, solid: !!p.solid, broken: false, hp: p.hp ?? T.combat.prop?.hp ?? 120 };
    // its body: a box as wide and tall as the drawing, about a quarter of its width deep (set "d" for another depth); a solid one does
    // not move but the others bounce off it
    if (this.phys) { const d = p.d ?? Math.max(0.12, Math.min(0.4, q.w * 0.25)); q.body = this.phys.add(r.m, q.w, q.h, d, { type: q.solid ? 'fixed' : 'dynamic', owner: q }); }
    if (!q.solid) {
      q.dm = new DamageMap(r.h / r.w, 256); attachDamage(r.m, q.dm);
      const W = this;
      r.m.userData.owner = { prop: true, get alive() { return !q.broken && q.m.visible; }, hitMeshes: () => (q.broken || !q.m.visible ? [] : [q.m]), hit: (info) => W.hitProp(q, info) };
    }
    (this.props || (this.props = [])).push(q);
  }
  breakableMeshes() { return (this.props || []).filter((q) => !q.solid && !q.broken && q.m.visible).map((q) => q.m); }
  hitProp(q, info) {
    if (q.broken) return;
    info.dealt = 0;
    q.hp -= info.dmg;
    const k = 1 / q.w;
    if (info.uv) q.dm.hole(info.uv.u, info.uv.v, (info.kind === 'mantra' ? 0.12 : 0.07) * k);
    const g = this.game, pt = q.m.localToWorld(tmpV.set(((info.uv?.u ?? 0.5) - 0.5) * q.w, (info.uv?.v ?? 0.5) * q.h, 0.05).clone());
    g.fx.confetti(pt, 3, 0.6, [COL.bone, 0xffffff]);
    // it takes the shot: pushed where it was hit, away from the camera (it rocks, slides, a heavy one tips it)
    if (q.body) { const P = T.combat.prop.phys, dir = tmpV3.copy(pt).sub(this.camPos).setY(0).normalize(); this.phys.push(q.body, pt, dir, (P.push[info.kind] ?? P.push.rifle) * (info.crit ? 1.5 : 1)); }
    if (q.hp <= 0) this.breakProp(q);
  }
  // a prop goes: knocked flying away from the camera (or from the monster that ran into it: from), it tumbles, bounces about, comes to
  // rest and fades out a while later, its splinters scattering (src/battle/physics.js); without the physics it tips over and fades
  breakProp(q, from = null) {
    if (q.broken || q.solid) return;
    q.broken = true;
    const g = this.game, P = q.m.position;
    sfx.shatter(0); g.post.shake(0.35);
    g.fx.confetti(tmpV.set(P.x, q.h * 0.5, P.z).clone(), 26, 2.2, [COL.bone, 0xffffff]); g.fx.puff(P, 6, COL.bone, 0.9);
    if (q.body) {
      const F = T.combat.prop.phys, src = from || this.camPos, dir = tmpV3.set(P.x - src.x, 0, P.z - src.z).normalize();
      const top = q.m.localToWorld(tmpV.set((Math.random() - 0.5) * q.w * 0.5, q.h * 0.8, 0)).clone();
      this.phys.knock(q.body, top, src, F.breakPush * (0.8 + Math.random() * 0.4), F.breakUp);
      this.phys.chipsAt(tmpV.set(P.x, q.h * 0.5, P.z).clone(), dir, F.chips, [COL.bone, COL.paper, 0xd09060, 0xb87848]);
      g.tweens.wait(F.fadeAfter, () => g.tweens.run(0.6, (e) => { q.m.material.uniforms.opacity.value = 1 - e; }, { onDone: () => { q.m.visible = false; q.sh.visible = false; this.phys?.remove(q.body); q.body = null; } }));   // (the place may be gone by then: no world, no body to take out)
      return;
    }
    const c = this.camPos, away = Math.atan2(P.x - c.x, P.z - c.z) - q.m.rotation.y;
    const tip = Math.cos(away) >= 0 ? -1.45 : 1.45;
    g.tweens.to(q.m.rotation, { x: tip }, 0.45, { ease: Ease.inQuad, onDone: () => g.tweens.run(0.5, (e) => { q.m.material.uniforms.opacity.value = 1 - e; }, { onDone: () => { q.m.visible = false; q.sh.visible = false; } }) });
  }
  // the air is never still (docs/ART.md「用户给的参考里的手法」 前景粒子永远在: the MVs' hearts, bokeh and glitter always drifting in front):
  // things floating in the light between the camera and the far end - dust in the calm, pink petals and ash once the place has turned
  // (anomaly), embers and paper specks in a dark place; set "ambient": { kind: dust | petals | embers | off, rate }
  ambient(dt) {
    const A = this.set.ambient || {}, kind = A.kind || (this.anomaly > 0.5 ? 'petals' : this.set.dark ? 'embers' : 'dust');
    if (kind === 'off' || !this.game.fx) return;
    this.ambT = (this.ambT || 0) + dt * (A.rate ?? 7);
    const fx = this.game.fx, cam = this.camera, f = tmpV3.set(0, 0, -1).applyQuaternion(cam.quaternion);
    while (this.ambT >= 1) {
      this.ambT -= 1;
      const d = 1.2 + Math.random() * 7, side = (Math.random() - 0.5) * d * 1.3, up = (Math.random() - 0.4) * d * 0.7;
      const x = cam.position.x + f.x * d + (-f.z) * side, z = cam.position.z + f.z * d + f.x * side, y = Math.max(0.1, cam.position.y + up);
      if (kind === 'dust') fx.wAdd.emit({ x, y, z, vx: (Math.random() - 0.5) * 0.08, vy: 0.02 + Math.random() * 0.05, life: 4 + Math.random() * 3, size: 0.012 + Math.random() * 0.02, color: [1, 0.95, 0.85], a: 0.5, a1: 0, frame: FR.GLOW, flutter: 0.15 });
      else if (kind === 'embers') fx.wAdd.emit({ x, y, z, vx: (Math.random() - 0.5) * 0.15, vy: 0.08 + Math.random() * 0.15, life: 3 + Math.random() * 2, size: 0.015 + Math.random() * 0.02, color: [1, 0.6, 0.25], a: 0.8, a1: 0, frame: FR.GLOW, flutter: 0.4 });
      else fx.wNorm.emit({ x, y: y + 1, z, vx: (Math.random() - 0.5) * 0.2, vy: -0.15 - Math.random() * 0.15, life: 5 + Math.random() * 3, size: 0.05 + Math.random() * 0.05, vrot: (Math.random() - 0.5) * 3,
        color: Math.random() < 0.6 ? [1, 0.55, 0.75] : [0.2, 0.15, 0.17], a: 0.85, a1: 0, frame: Math.random() < 0.6 ? FR.HEART : FR.ASH, flutter: 0.6, drag: 0.4 });
    }
  }
  // a monster moving through here smashes whatever breakable prop it runs into
  // hard: a leap, a dash, bursting up through the floor (it smashes them); a walk (hard false) only shoves them, with the physics
  smashPropsNear(p, r, hard = true) {
    if (!hard && this.phys) return;
    for (const q of this.props || []) if (!q.solid && !q.broken && q.m.visible && Math.hypot(q.m.position.x - p.x, q.m.position.z - p.z) < q.w * 0.5 + r) this.breakProp(q, p);
  }
  // a prop standing where a station's cover goes (covers are placed from the heroines' screen layout) steps aside: it is not drawn
  clearProps() {
    const all = Object.values(this.coverSets || {}).flat();
    for (const p of this.props || []) {
      const hit = all.some((c) => Math.hypot(c.def.x - p.x, c.def.z - p.z) < c.w / 2 + p.w / 2 + 0.15);
      p.m.visible = p.sh.visible = !hit;
      p.body?.setEnabled(!hit);   // (and not in the physics either)
    }
  }

  // ---------------------------------------------------------------- the ways between places
  // a passage behind a doorway (way: { id, wall: end | back, x0, x1, y0, y1 (metres), depth, door }): floor, walls and ceiling in the
  // place's own pictures, darker, black at its far end
  buildWay(wy) {
    const Hd = this.set.hall, back = wy.wall === 'back', zw = back ? Hd.z0 : Hd.z1, dir = back ? 1 : -1, D = wy.depth ?? 2.6;
    const w = wy.x1 - wy.x0, hh = wy.y1 - wy.y0, xc = (wy.x0 + wy.x1) / 2, g = new THREE.Group(); g.position.set(xc, wy.y0, zw); this.root.add(g);
    const fk = [].concat(Hd.floor)[0], wk = [].concat(Hd.left || Hd.right || Hd.floor)[0], ck = [].concat(Hd.ceil || Hd.floor)[0];
    const dim = (m, k) => { m.material.color.setScalar(k); return m; };
    const fl = dim(board(fk, w, D, { uv: [w / Hd.tile, D / Hd.tile] }), 0.55); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.01, dir * D / 2); g.add(fl);
    const ce = dim(board(ck, w, D, { uv: [w / Hd.tile, D / Hd.tile] }), 0.3); ce.rotation.x = Math.PI / 2; ce.position.set(0, hh, dir * D / 2); g.add(ce);
    for (const s of [-1, 1]) { const sw = dim(board(wk, D, hh, { uv: [D / (Hd.bay || 4), hh / Hd.h] }), 0.38); sw.rotation.y = -s * Math.PI / 2; sw.position.set(s * w / 2, hh / 2, dir * D / 2); g.add(sw); }
    const cap = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.4, hh + 0.4), new THREE.MeshBasicMaterial({ color: 0x050307, side: THREE.DoubleSide }));
    cap.position.set(0, hh / 2, dir * D); g.add(cap);
    const W = this.ways[wy.id] = { ...wy, g, zw, dir, D, xc, w, hh, leaves: [], k: 0 };
    if (wy.door) this.buildDoor(W);
  }
  // a door in the doorway (door: { kind: slide | swing, k: [leaf pictures], side, open }): sliding fusuma, iron doors swinging on hinges
  buildDoor(W) {
    const d = W.door, keys = [].concat(d.k), n = keys.length, lw = W.w / n;
    keys.forEach((k, i) => {
      const m = board(k, lw, W.hh, {}), piv = new THREE.Group(), sx = n > 1 ? (i ? 1 : -1) : (d.side ?? 1);
      if (W.dir > 0) m.rotation.y = Math.PI;   // (in a back wall: its painted side toward the room)
      if (d.kind === 'swing') { piv.position.set(sx * W.w / 2, W.hh / 2, -W.dir * 0.03); m.position.set(-sx * lw / 2, 0, 0); }
      else piv.position.set((i - (n - 1) / 2) * lw, W.hh / 2, -W.dir * 0.03);
      piv.add(m); W.g.add(piv); W.leaves.push({ piv, i, sx, x0: piv.position.x, lw });
    });
    this.setDoor(W, d.open ? 1 : 0);
  }
  setDoor(W, k) {   // 0 shut .. 1 open: fusuma slide aside into the wall, iron doors swing into the room
    W.k = k;
    for (const L of W.leaves) {
      if (W.door.kind === 'swing') L.piv.rotation.y = (L.sx < 0 ? 1 : -1) * W.dir * k * 1.7;
      else L.piv.position.x = L.x0 + L.sx * L.lw * 0.96 * k;
    }
  }
  // open / shut a way's door (dur seconds; slam: shut hard)
  door(id, open, dur = 0.7, then) {
    const W = this.ways?.[id], g = this.game;
    if (!W || !W.leaves.length || (W.k > 0.5) === open) { then && then(); return; }
    const from = W.k, to = open ? 1 : 0, swing = W.door.kind === 'swing';
    sound(swing ? (open ? 'doorCreak' : 'doorSlam') : 'fusumaOpen', { pos: W.g.position }) || (swing ? (open ? sfx.creak() : sfx.slam()) : sfx.panel());
    g.tweens.run(dur, (e) => this.setDoor(W, from + (to - from) * e), { ease: open ? Ease.inOutCubic : Ease.inQuad, onDone: () => {
      if (!open && swing) { g.post.shake(1.0); sfx.thud(0); }
      then && then();
    } });
  }
  // where a way is, for walking through it: in front of it in the room (front, eye height), its doorway, deep in its passage (far)
  wayPoints(id) {
    const W = this.ways?.[id]; if (!W) return null;
    const y = W.y0 + 1.15, z = W.zw;
    return { front: [W.xc, y, z - W.dir * 1.1], door: [W.xc, y, z], far: [W.xc, y, z + W.dir * (W.D - 0.5)], W };
  }
  // stairs up to a doorway high in a wall (stairs: { x, w, z0: the foot, z1: the top, y1: the top's height, n: steps, tint }): solid
  // steps (wood treads, darker risers), a stringer each side, banister rails
  buildStairs(s) {
    const Hd = this.set.hall, n = s.n, rise = s.y1 / n, run = (s.z0 - s.z1) / n, fk = [].concat(Hd.floor)[0], t = tex[fk];
    const tread = new THREE.MeshBasicMaterial({ map: t || null, color: new THREE.Color(s.tint || '#ffffff') });
    const riser = new THREE.MeshBasicMaterial({ map: t || null, color: new THREE.Color(s.tint || '#ffffff').multiplyScalar(0.55) });
    const side = new THREE.MeshBasicMaterial({ map: t || null, color: new THREE.Color(0.35, 0.24, 0.18) });
    for (let i = 0; i < n; i++) {
      const top = rise * (i + 1), z = s.z0 - run * (i + 0.5);
      const b = new THREE.Mesh(new THREE.BoxGeometry(s.w, top, run), [side, side, tread, side, riser, riser]);
      b.position.set(s.x, top / 2, z); this.root.add(b);
    }
    for (const sd of [-1, 1]) {   // (the rails: up the slope at hand height, a post at the foot and the top)
      const x = s.x + sd * (s.w / 2 + 0.04), a = new THREE.Vector3(x, 0.95, s.z0 - run * 0.5), b = new THREE.Vector3(x, s.y1 + 0.95, s.z1 + run * 0.5);
      this.root.add(rod(a, b, 0.035), rod(new THREE.Vector3(x, 0, s.z0 - run * 0.5), a, 0.05), rod(new THREE.Vector3(x, s.y1, s.z1 + run * 0.5), b, 0.05));
    }
  }
  // a shaft above a hole in the ceiling (at: ceil) or below one in the floor (at: floor): { x, z, size, h, ladder }; four walls in the
  // place's own pictures, darker, black at its end; a ladder up one side
  buildShaft(s) {
    const Hd = this.set.hall, up = s.at !== 'floor', y0 = up ? Hd.h : 0, hh = s.h ?? 3, sz = s.size ?? 1.6, g = new THREE.Group();
    g.position.set(s.x, up ? y0 + hh / 2 : -hh / 2, s.z); this.root.add(g);
    const wk = [].concat(Hd.left || Hd.right || Hd.floor)[0];
    for (let i = 0; i < 4; i++) {
      const m = board(wk, sz, hh, { uv: [sz / (Hd.bay || 4), hh / Hd.h] }); m.material.color.setScalar(0.4);
      const a = i * Math.PI / 2; m.position.set(Math.sin(a) * sz / 2, 0, Math.cos(a) * sz / 2); m.rotation.y = a + Math.PI; g.add(m);
    }
    const cap = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), new THREE.MeshBasicMaterial({ color: 0x050307, side: THREE.DoubleSide }));
    cap.rotation.x = Math.PI / 2; cap.position.y = up ? hh / 2 : -hh / 2; g.add(cap);
    if (!up) for (const t of this.tiles) if (Math.abs(t.x - s.x) < sz / 2 + 0.3 && Math.abs(t.z - s.z) < sz / 2 + 0.3) t.g.visible = false;   // (the trapdoor: no floor there)
    if (s.ladder) {   // (two rails and rungs on the far side, from the floor below up through the shaft)
      const z = s.z - sz / 2 + 0.12, ya = up ? (s.ladderFrom ?? y0 - 2.4) : -hh, yb = up ? y0 + hh : 0.9;
      for (const sd of [-0.25, 0.25]) this.root.add(rod(new THREE.Vector3(s.x + sd, ya, z), new THREE.Vector3(s.x + sd, yb, z), 0.03));
      for (let y = ya + 0.3; y < yb; y += 0.32) this.root.add(rod(new THREE.Vector3(s.x - 0.25, y, z), new THREE.Vector3(s.x + 0.25, y, z), 0.022));
    }
  }
  // a hole broken through (on: left | right | end | back | ceil | floor, p: a world point on that surface, size in metres); it bursts open
  addHole(on, p, size = 1.8, through = false, quiet = false) {   // (through: really cut through the wall - a way to walk on through: cutWall)
    const Hd = this.set.hall, g = new THREE.Group();
    // it bursts (tuning/vfx.json wallBreak / floorBreak / ceilBreak: the flash, chunks flying, dust spreading, sparks), toward the room
    if (!quiet && this.game.vfx) {
      const N = on === 'left' ? [1, 0, 0] : on === 'right' ? [-1, 0, 0] : on === 'end' ? [0, 0, 1] : on === 'back' ? [0, 0, -1] : on === 'ceil' ? [0, -1, 0] : [0, 1, 0];
      const at = new THREE.Vector3(on === 'left' ? Hd.x0 + 0.2 : on === 'right' ? Hd.x1 - 0.2 : p.x, on === 'ceil' ? Hd.h - 0.2 : on === 'floor' || !on ? 0.15 : p.y, on === 'end' ? Hd.z1 + 0.2 : on === 'back' ? Hd.z0 - 0.2 : p.z);
      this.game.vfx.play(on === 'ceil' ? 'ceilBreak' : on === 'left' || on === 'right' || on === 'end' || on === 'back' ? 'wallBreak' : 'floorBreak', at, { n: new THREE.Vector3(...N), scale: size / 2 });
    }
    if (through && (on === 'left' || on === 'right')) this.cutWall(on, p.z, p.y, size * 0.56);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: holeTex(through), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, side: through ? THREE.DoubleSide : THREE.FrontSide }));
    m.rotation.z = Math.random() * Math.PI * 2; m.renderOrder = 3; g.add(m);
    if (on === 'left') { g.position.set(Hd.x0 + 0.03, p.y, p.z); g.rotation.y = Math.PI / 2; }
    else if (on === 'right') { g.position.set(Hd.x1 - 0.03, p.y, p.z); g.rotation.y = -Math.PI / 2; }
    else if (on === 'end') g.position.set(p.x, p.y, Hd.z1 + 0.03);
    else if (on === 'back') { g.position.set(p.x, p.y, Hd.z0 - 0.03); g.rotation.y = Math.PI; }
    else if (on === 'ceil') { g.position.set(p.x, Hd.h - 0.03, p.z); g.rotation.x = Math.PI / 2; }
    else { g.position.set(p.x, 0.03, p.z); g.rotation.x = -Math.PI / 2; }
    g.scale.setScalar(0.2); this.game.tweens.to(g.scale, { x: 1, y: 1, z: 1 }, 0.22, { ease: Ease.outBack });
    this.root.add(g); (this.holes || (this.holes = [])).push(m);
    return g;
  }
  // a hole right through a side wall at (z, y), an opening size metres across: the board there is replaced by the pieces round it
  cutWall(on, z, y, size) {
    const Hd = this.set.hall, bay = Hd.bay, r = size / 2, B = this.wallB.find((b) => b.on === on && Math.abs(b.zc - z) <= bay / 2 && Math.abs(b.yc - y) <= b.rh / 2);
    if (!B) return;
    B.m.visible = false;
    const x = on === 'left' ? Hd.x0 : Hd.x1, s = on === 'left' ? -1 : 1;   // (u runs along the board toward -z on the left wall, +z on the right)
    const za = B.zc - bay / 2, zb = B.zc + bay / 2, ya = B.yc - B.rh / 2, yb = B.yc + B.rh / 2;
    for (const [z0, z1, y0, y1] of [[za, zb, y + r, yb], [za, zb, ya, y - r], [za, z - r, y - r, y + r], [z + r, zb, y - r, y + r]]) {
      if (z1 - z0 < 0.01 || y1 - y0 < 0.01) continue;
      const w = z1 - z0, hh = y1 - y0, u0 = s < 0 ? (zb - z1) / bay : (z0 - za) / bay, v0 = (y0 - ya) / B.rh;
      const m = board(B.key, w, hh, { alpha: B.m.material.transparent, uv: [w / bay, hh / B.rh], uv0: [u0, v0] });
      const t = B.m.material.map;   // (the picture it shows now: the dark version once the lights are out)
      if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; m.material.map = t; }
      m.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2); m.rotation.y = B.m.rotation.y; this.root.add(m);
    }
  }
  // a seal holding the drawbridge was shot: when all are, it comes down across the gap (the way on opens: Game.checkWave waits for it)
  gateHit() {
    const G = this.gate; if (!G || G.open) return;
    if (++G.got < G.need) return;
    const g = this.game;
    for (const c of this.chains || []) c.visible = false;
    sfx.tear(0); sfx.whoosh(0);
    g.tweens.to(this.bridge.rotation, { x: Math.PI / 2 }, 1.1, { ease: Ease.outBounce, onDone: () => { G.open = true; sfx.slam(); g.post.shake(1.0); g.fx.puff(new THREE.Vector3(0, 0.1, this.set.hall.bridge.z0), 10, COL.bone, 1.2); } });
  }
  swapBoard(from, to) {
    if (!tex[to]) return;
    this.root.traverse((o) => { if (o.isMesh && o.userData.texKey === from) { o.material.map = tex[to]; o.material.needsUpdate = true; o.userData.texKey = to; } });
    for (const f of this.flips) if (f.key === from) f.key = to;
  }
  // a candle in a dark room: unlit, a faint glint so it can be found (lamp(p)); lit (light), a warm pool round it and the room a step lighter
  lamp(p) { const L = { p: p.clone(), k: 0, max: 0.75, r: 0.12 }; this.lampList.push(L); return L; }
  light(L, step = 0.3) {
    if (L) { L.max = 1; L.r = 0.3; }
    this.dark = Math.max(0, this.dark - step);
  }
  // the floor gives way (DESIGN「演出」 塌方): the tiles round the girls drop, the nearest first, then the view falls through the gap
  collapse(then) {
    const g = this.game, tw = g.tweens, c = this.camPos, f = new THREE.Vector3().subVectors(this.lookAt, c).setY(0).normalize();
    sfx.slam(); sfx.tear(0); g.post.shake(1.6); g.post.flash(0.35, 0xffe0c0);
    for (const t of this.tiles) {
      const dx = t.x - c.x, dz = t.z - c.z, along = dx * f.x + dz * f.z, side = Math.abs(dx * f.z - dz * f.x);
      if (along < -3 || along > 8 || side > 4.5) continue;
      const delay = Math.max(0, Math.hypot(along, side)) * 0.07 + rnd(0, 0.15);
      tw.to(t.g.position, { y: -9 }, 1.0, { delay, ease: Ease.inQuad });
      tw.to(t.g.rotation, { x: rnd(-0.9, 0.9), z: rnd(-0.7, 0.7) }, 1.0, { delay });
      if (Math.random() < 0.2) tw.wait(delay, () => g.fx.puff(new THREE.Vector3(t.x, 0.1, t.z), 3, COL.bone, 0.8));
    }
    tw.wait(0.45, () => { sfx.thud(0); g.post.shake(1.2); });
    tw.run(1.9, (k) => { this.fovKick = Math.sin(k * Math.PI) * 18; });
    tw.wait(0.95, () => tw.to(c, { y: c.y - 7 }, 0.9, { ease: Ease.inQuad, onDone: () => { this.fovKick = 0; then && then(); } }));
  }

  // ---------------------------------------------------------------- folding (the "Inception" moves)
  // the corridor past the hinge bends up into a slope, and floor tiles near it rise into ridges, one after another
  fold(then) {
    const g = this.game, tw = g.tweens, F = this.set.hall.fold || {};
    sfx.slam(); sfx.madness(); g.post.flash(0.5, 0xff4fb0); g.post.shake(1.4);
    tw.to(this.hinge.rotation, { x: (F.bend ?? 26) * Math.PI / 180 }, F.time ?? 1.6, { ease: Ease.inOutCubic });
    const z0 = (this.set.hall.foldZ ?? 0), rows = this.tiles.filter((t) => t.z < (F.ridgeFrom ?? 0) && t.z > z0);
    rows.forEach((t, i) => {
      if (Math.random() > (F.ridgeShare ?? 0.45)) return;
      const delay = (F.ridgeFrom - t.z) * 0.08 + rnd(0, 0.15);
      tw.to(t.t.rotation, { x: Math.PI / 2 - rnd(0.35, 0.9) }, 0.45, { delay, ease: Ease.outBack, onDone: () => { if (i % 3 === 0) { sfx.thud(0); g.post.shake(0.4); } } });
    });
    tw.wait((F.time ?? 1.6) + 0.3, () => then && then());
  }

  // ---------------------------------------------------------------- camera rail (as World)
  setSize(W, H) {
    const a = W / H, minHalfH = Math.atan(Math.tan(THREE.MathUtils.degToRad(26)) * 16 / 9);
    this.baseFov = Math.max(52, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(minHalfH) / a)));
    this.camera.aspect = a; this.camera.fov = this.baseFov; this.camera.updateProjectionMatrix();
  }
  place(cam, look) { this.camPos.set(...cam); this.lookAt.set(...look); }
  travel(points, look, dur, onDone, o = {}) {   // (o.steps: climbing stairs / a ladder, a bob for every step)
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
    const fromLook = this.lookAt.clone(), toLook = new THREE.Vector3(...look);
    let step = 0;
    this.game.tweens.run(dur, (e, k) => {
      curve.getPointAt(e, this.camPos);
      // look the way she runs, level (a point far ahead at eye height), never down at the floor
      const dir = curve.getTangentAt(Math.min(0.999, e)); dir.y = 0; if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1); dir.normalize();
      const ahead = this.camPos.clone().addScaledVector(dir, 12); ahead.y = this.camPos.y - 0.15;
      const w = Ease.inOutQuad(Math.max(0, (k - 0.55) / 0.45));
      this.lookAt.copy(ahead).lerp(toLook, w);
      if (k < 0.15) this.lookAt.lerp(fromLook, 1 - k / 0.15);
      this.bob = o.steps ? -Math.abs(Math.sin(e * Math.PI * o.steps)) * 0.08 : Math.abs(Math.sin(k * dur * 9.5)) * 0.06 * Math.sin(k * Math.PI);
      this.fovKick = Math.sin(k * Math.PI) * 5;
      const s = Math.floor(k * dur * 4.75);
      if (s !== step) { step = s; this.game.onStep && this.game.onStep(s); }
    }, { ease: Ease.inOutQuad, onDone: () => { this.bob = 0; this.fovKick = 0; onDone && onDone(); } });
  }

  // ---------------------------------------------------------------- covers: the current station's, out of the level
  // arriving: this station's covers are the ones that count, and they are drawn over the heroines (who kneel behind them)
  setCovers() {
    const sid = this.game.stationId;
    this.covers = [];
    for (const c of this.coverSets[sid] || []) {
      c.hp = c.max = T.combat.cover.hp; c.broken = false; this.covers[c.slot] = c;
      if (this.phys) this.coverBody(c);
    }
  }
  // a cover in the physics: standing, it does not move but what flies bounces off it; one marked "fall" comes crashing down into its
  // place as they arrive (DESIGN「掩体」: covers can fall; it drops straight, lands, settles) and stands from then on ("fall": true from
  // prop.phys.coverFall metres up, or a number: from that high - a door coming off its track, a table going over)
  coverBody(c) {
    if (c.falling) return;   // (arrive runs again after a close look: it is still coming down)
    if (c.body) { this.phys.remove(c.body); c.body = null; }
    const S = c.m.scale.y, w = c.w * S, h = c.h * S, d = Math.max(0.15, h * 0.3);
    if (c.c.fall && !c.fell) {
      c.fell = true;
      const y0 = c.m.position.y; c.m.position.y = y0 + (typeof c.c.fall === 'number' ? c.c.fall : T.combat.prop.phys.coverFall);
      c.m.updateMatrixWorld(true);
      c.body = this.phys.add(c.m, w, h, d, { spin: false, density: 400 });
      this.game.tweens.wait(0.25, () => sound('beamFall', { pos: c.m.position.clone() }) || sfx.whoosh(0));
      c.falling = { y0, w, h, d, t: 0 };   // (update() sees it land: never by polling with waits, a long frame runs those all at once)
      return;
    }
    c.body = this.phys.add(c.m, w, h, d, { type: 'kinematic' });
  }
  // a cover takes a blow: it rocks back and springs up again (rock: how far, radians)
  rockCover(c, rock) { if (!c.broken) { c.rock = c.rock || 0; c.rockV = (c.rockV || 0) + rock * 14; } }
  // leaving: they fold over backwards, away from the girls, flat onto the floor like pop-up book pages (the relief flattens too), and
  // the girls walk on over them; returns how long that takes (the game waits for it before anyone gets up)
  dropCovers() {
    const live = this.covers.filter(Boolean), tw = this.game.tweens, t = T.layout.cover.foldTime;
    this.covers = [];
    for (const c of live) { if (c.body) { this.phys.remove(c.body); c.body = null; } c.rock = c.rockV = 0; if (c.falling) { c.m.position.y = c.falling.y0; c.falling = null; } }
    live.forEach((c, i) => {
      if (c.broken && this.phys) return;   // (knocked over by the physics: it lies where it fell)
      const u = c.m.material.uniforms;
      tw.to(c.m.rotation, { x: -Math.PI / 2 }, t, { delay: i * 0.06, ease: Ease.inQuad });
      tw.to(u.reliefAmt, { value: 0 }, t, { delay: i * 0.06 });
    });
    if (live.length) sfx.thud(1);
    return live.length ? t + 0.06 * live.length : 0;
  }
  breakCover(c) {
    if (c.broken) return;
    c.broken = true;
    const g = this.game, m = c.m;
    c.dm.cut([[0.1, 0.9], [0.9, 0.2]], 0.03); c.dm.cut([[0.15, 0.2], [0.85, 0.85]], 0.03);
    m.material.uniforms.flash.value = 1;
    g.fx.confetti(m.position.clone().add(new THREE.Vector3(0, c.h * 0.5, 0)), 30, 1.8);
    // it goes over backwards (away from the girl crouching at it): with the physics knocked over and tumbling, splinters flying; else
    // it topples flat onto the floor
    if (c.body && this.phys) {
      this.phys.remove(c.body); c.rock = c.rockV = 0; m.rotation.x = 0; m.updateMatrixWorld(true);
      const S = m.scale.y, w = c.w * S, h = c.h * S;
      c.body = this.phys.add(m, w, h, Math.max(0.15, h * 0.3), { density: 350 });
      const top = m.localToWorld(new THREE.Vector3((Math.random() - 0.5) * c.w * 0.4, c.h * 0.85, 0));
      this.phys.knock(c.body, top, this.camPos, T.combat.prop.phys.coverBreak, 0.15);
      this.phys.chipsAt(m.position.clone().add(new THREE.Vector3(0, h * 0.6, 0)), tmpV3.set(m.position.x - this.camPos.x, 0, m.position.z - this.camPos.z).normalize(), 10, [COL.bone, COL.paper, 0xd09060, 0xb87848]);
      g.post.shake(0.6);
      return;
    }
    g.tweens.to(m.rotation, { x: -Math.PI / 2 * 0.92 }, 0.45, { ease: Ease.inQuad, onDone: () => { sfx.thud(0); g.post.shake(0.6); } });
  }

  makeShadow(width) {
    if (!this.shadowTex) this.shadowTex = shadowTex();
    const s = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.4), new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false, fog: false }));
    s.rotation.x = -Math.PI / 2; s.position.y = 0.02; s.renderOrder = -4;
    return s;
  }
  applyAnomaly() {}
  // the next turn starts at this point (world coordinates) and runs outward from it; dir 1 = toward the anomaly, -1 = back to the real
  // place (Game.turn)
  turnFrom(from, dir) {
    this.turnDir = dir;
    if (!from) return;
    const o = tmpV.set(...from).clone();
    for (const f of this.flips) f.d = f.m.getWorldPosition(tmpV).distanceTo(o);
  }
  // the evil energy hits (game.invade tweens anomaly 0 -> 1): every board with an anomaly version flips over to it like a page, a wave from
  // the far end toward the camera, popping off its surface on the way; the light, fog and sky shift with it (set "anomalyLit" / "anomalyFog"
  // / "anomalySky"). Going straight to 1 (a later station) shows the anomaly versions at once. Turning back (turnDir -1) runs the same
  // wave outward from its start, the boards nearest to it flipping back first.
  updateAnomaly() {
    const k = this.anomaly ?? 1;
    if (k === this._ak) return;
    const jump = this._ak === undefined || Math.abs(k - this._ak) > 0.5;
    this._ak = k;
    const S = this.set, maxD = Math.max(1, ...this.flips.map((f) => f.d)), clamp = (x) => Math.min(1, Math.max(0, x));
    for (const f of this.flips) {
      const start = f.d / maxD * 0.55;
      const p = jump ? (k >= 0.5 ? 1 : 0) : this.turnDir < 0 ? 1 - clamp((1 - k - start) / 0.4) : clamp((k - start) / 0.4);
      f.p = p;
      const want = p >= 0.5 ? f.alt : f.key;
      if (f.m.userData.texKey !== want && tex[want]) {
        const t = tex[want], old = f.m.material.map;
        if (old && (old.wrapS === THREE.RepeatWrapping)) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; }
        f.m.material.map = t; f.m.material.needsUpdate = true; f.m.userData.texKey = want;
      }
      // the flip: squeezed to a sliver at the half-way point, lifted off its surface
      const sq = Math.max(0.02, Math.abs(Math.cos(p * Math.PI)));
      if (f.floor) f.m.scale.set(1, sq, 1); else f.m.scale.set(sq, 1, 1);
      const lift = Math.sin(p * Math.PI) * 0.35;
      f.m.position.copy(f.base);
      if (f.side) f.m.position.x += f.side * lift; else if (!f.floor) f.m.position.z += lift * 0.5;
    }
    for (const d of this.anomalyDecals || []) { d.visible = k > 0.6; d.scale.setScalar(Math.min(1, Math.max(0.01, (k - 0.6) / 0.3))); }
    if (S.anomalyLit) this.lit.setRGB(...(S.lit || [1, 0.94, 0.9])).lerp(TMPC.setRGB(...S.anomalyLit), k);
    if (S.anomalyFog) { this.scene.fog.color.set(S.fog || '#8a6070').lerp(TMPC.set(S.anomalyFog), k); FOG.color.value.copy(this.scene.fog.color); }
    if (S.anomalySky) this.scene.background.set(S.sky || '#2a1830').lerp(TMPC.set(S.anomalySky), k);
    this.grade(k);
  }
  // the colour grade: set "grade" (calm) -> "anomalyGrade" with the anomaly ({ tint: [r, g, b], k: how much, sat: saturation })
  grade(k) {
    const S = this.set, a = S.grade || { tint: [1, 1, 1], k: 0, sat: 1 }, b = S.anomalyGrade || a, u = this.inkU;
    if (!u) return;
    u.gTint.value.setRGB(...a.tint).lerp(TMPC.setRGB(...b.tint), k);
    u.gK.value = a.k + (b.k - a.k) * k; u.gSat.value = (a.sat ?? 1) + ((b.sat ?? 1) - (a.sat ?? 1)) * k;
  }
  litFlats() {}
  // docs/DESIGN.md「战斗画面布局」: a monster h metres tall and w wide about to stand at p (a Vector3, changed in place) is moved to where
  // the player can read it: no further than where it is minShare of the screen tall, not nearer than `near` (the covers), its feet
  // above the bottom band (feetMin of the screen: HUD and the heroines' knees), inside the middle of the screen (walkX / flyX of the
  // half width: the heroines stand at the sides) and inside the walls. A flyer (fly) also keeps between flyY of the screen height.
  // Numbers: tuning/layout.json monster; a station's "monsterFar" (metres) keeps them nearer still. Works for any station direction.
  // o: { far, min } = how deep a spawn may / must stand (monsters close in from there: DESIGN「敌人要逼上来」)
  fit(p, h, w, fly = false, o = {}) {
    const M = T.layout.monster, c = this.camPos, f = FIT_F.copy(this.lookAt).sub(c);
    const pitch = Math.atan2(f.y, Math.hypot(f.x, f.z));
    f.y = 0; f.normalize();
    const rt = FIT_R.set(-f.z, 0, f.x), d0 = tmpV.copy(p).sub(c);
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.baseFov / 2)), tanH = tanV * this.camera.aspect;
    // screen height share s (0 = bottom) at depth D -> height in the world, and back
    const yAt = (s, D) => c.y + D * Math.tan(pitch + Math.atan((2 * s - 1) * tanV));
    let depth = d0.dot(f), lat = d0.dot(rt);
    const far = Math.min(o.far || h / (2 * tanV * M.minShare), this.game.S?.monsterFar ?? 99);   // (a station can keep them nearer: in front of floor ridges)
    let near = M.near;
    if (!fly) { const a = pitch + Math.atan((2 * M.feetMin - 1) * tanV); if (a < 0) near = Math.max(near, c.y / Math.tan(-a)); }
    if (o.min) depth = Math.max(depth, Math.min(o.min, far));
    depth = Math.min(Math.max(depth, near), Math.max(far, near));
    const lim = Math.max(0, depth * tanH * (fly ? M.flyX : M.walkX) - w / 2);
    lat = Math.max(-lim, Math.min(lim, lat));
    p.x = c.x + f.x * depth + rt.x * lat; p.z = c.z + f.z * depth + rt.z * lat;
    const Hd = this.set.hall;
    if (Hd) { p.x = Math.max(Hd.x0 + w / 2 + 0.15, Math.min(Hd.x1 - w / 2 - 0.15, p.x)); p.z = Math.max(Hd.z1 + 0.5, Math.min(Hd.z0 - 0.5, p.z)); }
    if (fly) {
      const lo = Math.max(h / 2 + 0.3, yAt(M.flyY[0], depth) + h / 2), top = Hd && Hd.ceil ? Hd.h - h / 2 - 0.15 : 99;
      p.y = Math.min(top, Math.max(lo, Math.min(p.y, yAt(M.flyY[1], depth) - h / 2)));
    } else this.clearOfProps(p, w, f, rt, depth);
    return p;
  }
  // how far off something h metres tall has to stand for its top to show at least at share s of the screen height (0 = bottom): the
  // small monsters keep back that far, above the covers (Enemy)
  minDepth(h, s) {
    const c = this.camPos, f = FIT_F.copy(this.lookAt).sub(c), pitch = Math.atan2(f.y, Math.hypot(f.x, f.z)), tanV = Math.tan(THREE.MathUtils.degToRad(this.baseFov / 2));
    const a = pitch + Math.atan((2 * s - 1) * tanV);
    return a < 0 && h < c.y ? (c.y - h) / Math.tan(-a) : 0;
  }
  // a monster on the floor never stands inside a prop or half hidden behind one (it would look like it clips through: DESIGN「怪不能站在
  // 遮挡物后面穿模」): if a drawn prop is in the way (its footprint on the line from the camera, nearer than the monster, or under it), the
  // monster moves sideways to the nearest clear spot (then nearer to the camera)
  clearOfProps(p, w, f, rt, depth) {
    const props = (this.props || []).filter((q) => q.m.visible);
    if (!props.length) return;
    const c = this.camPos, blocked = (x, z) => props.some((q) => {
      const vx = x - c.x, vz = z - c.z, L = Math.hypot(vx, vz) || 1, ux = vx / L, uz = vz / L;
      const qx = q.x - c.x, qz = q.z - c.z, along = qx * ux + qz * uz;
      if (along < 0.3 || along > L + q.w * 0.5) return false;            // behind the camera or well behind the monster
      const off = Math.abs(qx * uz - qz * ux);                             // its distance from the line of sight
      return off < q.w * 0.5 + w * 0.45;
    });
    if (!blocked(p.x, p.z)) return;
    for (const d of [0.6, -0.6, 1.2, -1.2, 1.8, -1.8, 2.4, -2.4]) {
      const x = p.x + rt.x * d, z = p.z + rt.z * d;
      const Hd = this.set.hall;
      if (Hd && (x < Hd.x0 + w / 2 + 0.15 || x > Hd.x1 - w / 2 - 0.15)) continue;
      if (!blocked(x, z)) { p.x = x; p.z = z; return; }
    }
    for (const k of [0.8, 0.6]) { const x = c.x + (p.x - c.x) * k, z = c.z + (p.z - c.z) * k; if (!blocked(x, z)) { p.x = x; p.z = z; return; } }
  }
  // the run moves on to another set: everything this one made goes (the pictures stay loaded, they belong to the asset cache)
  dispose() {
    this.phys?.dispose(); this.phys = null;
    for (const m of this.holes || []) m.geometry.dispose();
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => m.dispose());
    });
    for (const list of Object.values(this.coverSets || {})) for (const c of list) c.dm.dispose();
    this.rt.dispose(); this.rt.depthTexture.dispose();
  }
  lightAt(p, out = new THREE.Color()) { return out.copy(this.lit); }

  update(dt, t) {
    const g = this.game, cam = this.camera;
    this.updateAnomaly(dt);
    this.ambient(dt);
    if (this.phys) {   // (the props' bodies; their shadows stay under them on the floor; a cover that took a blow rocks back and up)
      this.phys.step(dt);
      // a falling cover down and still (or it took too long: something under it): it stands in its place from now on
      for (const c of this.covers) if (c?.falling && c.body) {
        const F = c.falling; F.t += dt;
        if (F.t > 0.3 && ((c.m.position.y <= F.y0 + 0.03 && Math.abs(c.body.linvel().y) < 0.3) || F.t > 2.5)) {
          this.phys.remove(c.body); c.falling = null; c.m.position.y = F.y0; c.m.updateMatrixWorld(true);
          c.body = this.phys.add(c.m, F.w, F.h, F.d, { type: 'kinematic' });
          this.game.post.shake(0.9); this.game.fx.puff(c.m.position, 10, COL.bone, 1.2); sfx.thud(0);
        }
      }
      for (const c of this.covers) if (c && !c.broken && c.body && (c.rock || c.rockV)) {
        c.rockV += (-c.rock * 160 - c.rockV * 9) * dt; c.rock += c.rockV * dt;
        if (Math.abs(c.rock) + Math.abs(c.rockV) < 0.002) c.rock = c.rockV = 0;
        c.m.rotation.x = -c.rock;
      }
      for (const q of this.props || []) if (q.body && q.m.visible) { q.sh.position.x = q.m.position.x; q.sh.position.z = q.m.position.z; q.sh.material.opacity = Math.max(0, 1 - q.m.position.y * 1.5); }
    }
    const c1 = g.players[0]?.ctrl, on = c1 && c1.active && !g.cineOn && !g.walkOn;   // (a close look, Game.cine / a walk between places: held still)
    const lx = on ? c1.x / g.W - 0.5 : 0, ly = on ? c1.y / g.H - 0.5 : 0;
    this.look.x += (lx - this.look.x) * Math.min(1, dt * 4);
    this.look.y += (ly - this.look.y) * Math.min(1, dt * 4);
    cam.position.copy(this.camPos);
    cam.position.y += this.bob + Math.sin(t * 1.3) * 0.012;
    cam.position.x += g.post.shakeX * 0.06;
    cam.position.y += g.post.shakeY * 0.06;
    cam.lookAt(this.lookAt);
    cam.rotateY(-this.look.x * 0.09);
    cam.rotateX(-this.look.y * 0.06);
    // banking with the aim (Mirage Feathers' tilted horizon: the camera leans a little into where she aims) and the shake's roll; a
    // tough kill punches the view in for a moment (punch, degrees: Game.onKill)
    cam.rotateZ(g.post.shakeR - this.look.x * 0.035 + (this.rideBank || 0));   // (rideBank: leaning into the bends at speed, src/battle/ride.js)
    this.punch = (this.punch || 0) * Math.exp(-dt * 7);
    const fov = this.baseFov + this.fovKick - (this.cineZoom || 0) - this.punch - (this.game?.live?.zoom || 0);   // (zoom: the shot's scope)
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
    for (const c of this.covers) if (c) { c.dm.update(dt); const u = c.m.material.uniforms; u.flash.value = Math.max(0, u.flash.value - dt * 5); }
    this.inkU.time.value = t;
    if (this.set.dark || this.inkU.dark.value > 0) {   // (darkness eases toward what is left of it; lamps light up into their pools)
      const U = this.inkU; U.dark.value += (this.dark - U.dark.value) * Math.min(1, dt * 1.5);
      this.lampList.slice(0, 4).forEach((L, i) => {
        L.k += (L.max - L.k) * Math.min(1, dt * 3);
        const v = tmpV.copy(L.p).project(cam), on = v.z < 1 && v.z > -1;
        U.lamps.value[i].set((v.x + 1) / 2, (v.y + 1) / 2, L.r, on ? L.k * (0.9 + 0.1 * Math.sin(t * 9 + i * 2)) : 0);
      });
    }
  }
  // the world into its own target with depth, then the ink pass into whatever target was set (the post-processing one)
  render(r) {
    const target = r.getRenderTarget(), size = r.getDrawingBufferSize(tmpV2);
    const w = target ? target.width : size.x, h = target ? target.height : size.y;
    if (this.rt.width !== w || this.rt.height !== h) { this.rt.setSize(w, h); this.rt.depthTexture.image.width = w; this.rt.depthTexture.image.height = h; this.inkU.texel.value.set(1 / w, 1 / h); }
    this.inkU.near.value = this.camera.near; this.inkU.far.value = this.camera.far;
    r.setRenderTarget(this.rt); r.clear(); this.camera.layers.set(0); r.render(this.scene, this.camera);   // the heroines (layer 1) come after, see Game.render
    r.setRenderTarget(target); r.render(this.inkScene, this.inkCam);
  }

  // ---------------------------------------------------------------- screen <-> world
  ndc(sx, sy) { return new THREE.Vector2(sx / this.game.W * 2 - 1, -(sy / this.game.H) * 2 + 1); }
  rayFrom(sx, sy) { this.ray.setFromCamera(this.ndc(sx, sy), this.camera); return this.ray.ray; }
  screenToWorld(sx, sy, dist) { const r = this.rayFrom(sx, sy); return r.origin.clone().addScaledVector(r.direction, dist); }
  project(p) { const v = tmpV.copy(p).project(this.camera); return { x: (v.x + 1) / 2 * this.game.W, y: (1 - v.y) / 2 * this.game.H, z: v.z }; }
  pick(sx, sy, meshes) {
    this.ray.setFromCamera(this.ndc(sx, sy), this.camera);
    for (const h of this.ray.intersectObjects(meshes, false)) if (h.uv) return h;
    return null;
  }
}
const tmpV2 = new THREE.Vector2();
// a list of picture keys in a fixed shuffled order, n long, never the same one twice in a row (a single key works too)
function order(list, n, seed) {
  list = [].concat(list);
  let s = (seed * 9301 + 49297) % 233280 || 1;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out = [];
  while (out.length < n) {
    const deck = [...list];
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    if (deck.length > 1 && deck[0] === out[out.length - 1]) deck.push(deck.shift());
    out.push(...deck);
  }
  return out.slice(0, n);
}
function hash(x, y, seed) { let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return (h ^ (h >>> 16)) >>> 0; }
