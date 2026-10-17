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
import { sfx } from '../core/audio.js';
import { C, T } from '../core/content.js';
import { shadowTex } from './fx.js';

const tmpV = new THREE.Vector3();
const rnd = (a, b) => a + Math.random() * (b - a);

// a flat board w x h (metres) showing texture key with the given uv scale; pivot at its centre
function board(key, w, h, opts = {}) {
  const geo = new THREE.PlaneGeometry(w, h);
  if (opts.uv) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * opts.uv[0] + (opts.uv0?.[0] || 0), uv.getY(i) * opts.uv[1] + (opts.uv0?.[1] || 0)); }
  const t = tex[key];
  if (t && opts.uv) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; }
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t || null, color: t ? 0xffffff : 0xff00ff, transparent: !!opts.alpha, alphaTest: opts.alpha ? 0.5 : 0, side: THREE.DoubleSide, fog: true, ...(opts.decal ? { depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 } : {}) }));
  m.userData.texKey = key;
  return m;
}

const INK_FRAG = `
uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 texel; uniform float near; uniform float far; uniform float time; uniform vec3 ink; uniform float paper;
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
  // paper: a little fibre grain over everything
  float g = fbm(vUv * vec2(260.0, 150.0)) - 0.5;
  c *= 1.0 + g * paper;
  gl_FragColor = vec4(c, 1.0);
}`;

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
    this.anomaly = 1;
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
    this.build();
    // ink pass
    this.rt = new THREE.WebGLRenderTarget(4, 4);
    this.rt.depthTexture = new THREE.DepthTexture(4, 4);
    this.inkU = { tColor: { value: this.rt.texture }, tDepth: { value: this.rt.depthTexture }, texel: { value: new THREE.Vector2() }, near: { value: 0.05 }, far: { value: 120 },
      time: { value: 0 }, ink: { value: new THREE.Color(set.ink || '#2a1420') }, paper: { value: set.paper ?? 0.06 } };
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
    // walls: one painted bay after another (left = classroom side, right = windows)
    const bays = Math.ceil(L / bay);
    for (let i = 0; i < bays; i++) {
      const zc = z0 - (i + 0.5) * bay;
      const kl = Hd.left[i % Hd.left.length], kr = Hd.right[i % Hd.right.length];
      const l = board(kl, bay, h); l.position.set(x0, h / 2, zc); l.rotation.y = Math.PI / 2; put(l, zc);
      const r = board(kr, bay, h, { alpha: meta[kr] && /W$/.test(kr) }); r.position.set(x1, h / 2, zc); r.rotation.y = -Math.PI / 2; put(r, zc);
      // ceiling, one bay at a time (so it folds with the rest)
      const c = board(Hd.ceil, W, bay, { uv: [W / Hd.tile, bay / Hd.tile], uv0: [0, i * bay / Hd.tile] }); c.position.set((x0 + x1) / 2, h, zc); c.rotation.x = Math.PI / 2; put(c, zc);
    }
    // the end wall, the void behind it, the outside seen through the windows
    const e = board(Hd.end, W, h, { alpha: true }); e.position.set((x0 + x1) / 2, h / 2, z1); put(e, z1);
    for (const o of [{ x: x1 + 11, z: (z0 + z1) / 2, ry: -Math.PI / 2, w: 66 }, { x: 0, z: z1 - 14, ry: 0, w: 40 }]) {
      const m = board(Hd.outside, o.w, o.w / 1.5); m.material.fog = false; m.position.set(o.x, o.w / 1.5 * 0.3, o.z); m.rotation.y = o.ry; o.ry ? R.add(m) : put(m, o.z);   // big enough for every window angle, horizon near eye height
    }
    // floor: tiles, so they can fold up into ridges; the painted boards run on across them
    this.tiles = [];
    const tw = W / Hd.tilesX, tl = Hd.tileL;
    for (let j = 0; j * tl < L; j++) for (let i = 0; i < Hd.tilesX; i++) {
      const xa = x0 + i * tw, za = z0 - j * tl;
      const t = board(Hd.floor, tw, tl, { uv: [tw / Hd.tile, tl / Hd.tile], uv0: [xa / Hd.tile, (za - tl) / Hd.tile] });
      // pivot on its far edge, lying toward the camera: lifting its near edge makes a ridge facing the camera
      t.geometry.translate(0, tl / 2, 0);
      t.rotation.x = Math.PI / 2;
      const g = new THREE.Group(); g.position.set(xa + tw / 2, 0, za - tl); g.add(t);
      put(g, za - tl);
      this.tiles.push({ g, t, x: xa + tw / 2, z: za - tl / 2 });
    }
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
    }
    // props standing in the corridor (relief drawings), and every station's covers: placed in the level, there from the start
    this.coverSets = {};
    for (const [sid, st] of Object.entries(S.stations)) this.coverSets[sid] = (st.covers || []).map((c) => this.makeCover(c, st, sid));
    for (const p of S.props || []) this.makeProp(p);
  }
  // a relief drawing standing on the floor at (x, z), facing a point
  relief(key, h, x, z, face, amtK = 0.32) {
    const t = tex[key], ar = t.image.width / t.image.height, w = h * ar;
    const m = paperMesh(t, w, { pivot: 'bottom', segs: [64, Math.max(8, Math.round(64 / ar))] });
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
  // screen at that station (placeCovers): when the camera stops there, it is right in front of her, a moderate size (she is sheltered
  // kneeling, and out shooting she is clearly above it). Built at unit height, placed and scaled later.
  makeCover(c, st, sid) {
    const { m, w, h, sh } = this.relief(c.k, 1, 0, 0, new THREE.Vector3(0, 0, 1), 0.34);
    const dm = new DamageMap(h / w, 384); attachDamage(m, dm);
    return { m, sh, dm, c, st, sid, ar: w / h, amt: m.material.uniforms.reliefAmt.value, def: { x: 0, z: 0, h: 1, k: c.k }, w, h,
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
      const st = cv.st, H = p.H, W = p.W;
      cam.position.set(...st.cam); cam.lookAt(new THREE.Vector3(...st.look)); cam.updateMatrixWorld();
      // her figure on screen: standing height (sets the cover height), kneeling width and where she kneels (sets the width and the middle)
      const stand = p.hero ? p.hero.dims('fire').h : p.H * T.layout.standHeight;
      let kw = stand * 0.6, cx = p.baseX;
      if (p.hero) { const d = p.hero.dims('cover'), au = p.hero.R.cover.anchor; kw = d.w; cx = p.baseX - ((p.mirror ? 1 - au : au) - 0.5) * d.w; }
      let hPx = stand * L.h;
      hPx = Math.min(stand * L.maxH, Math.max(hPx, kw * L.w / cv.ar));
      // the bottom middle of the cover on screen -> a point on the floor; its depth turns the screen height into metres
      const sx = cx + p.side * kw * L.x, sy = p.bottom + H * L.y;
      ray.origin.copy(cam.position);
      ray.direction.set(sx / W * 2 - 1, sy / H * 2 - 1, 0.5).unproject(cam).sub(cam.position).normalize();
      if (!ray.intersectPlane(floor, hit)) continue;
      cam.getWorldDirection(fw);
      const depth = hit.clone().sub(cam.position).dot(fw);
      const hh = hPx / H * 2 * depth * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      const m = cv.m;
      m.position.set(hit.x, 0, hit.z);
      m.rotation.y = Math.atan2(cam.position.x - hit.x, cam.position.z - hit.z);
      m.scale.set((cv.c.flip ? -1 : 1) * hh, hh, hh);
      cv.sh.position.set(hit.x, 0.02, hit.z); cv.sh.scale.setScalar(hh);
      cv.w = hh * cv.ar; cv.h = hh;
      cv.def.x = hit.x; cv.def.z = hit.z; cv.def.h = hh;
    }
  }
  makeProp(p) { this.relief(p.k, p.h, p.x, p.z, new THREE.Vector3(p.fx ?? p.x, 0, p.fz ?? p.z + 5), 0.3); }

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
  travel(points, look, dur, onDone) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
    const fromLook = this.lookAt.clone(), toLook = new THREE.Vector3(...look);
    let step = 0;
    this.game.tweens.run(dur, (e, k) => {
      curve.getPointAt(e, this.camPos);
      const ahead = curve.getPointAt(Math.min(1, e + 0.12)).add(new THREE.Vector3(0, -0.1, -0.01));
      const w = Ease.inOutQuad(Math.max(0, (k - 0.55) / 0.45));
      this.lookAt.copy(ahead).lerp(toLook, w);
      if (k < 0.15) this.lookAt.lerp(fromLook, 1 - k / 0.15);
      this.bob = Math.abs(Math.sin(k * dur * 9.5)) * 0.06 * Math.sin(k * Math.PI);
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
      c.m.renderOrder = 11.6; c.m.material.depthTest = false;
    }
  }
  // leaving: they fold over backwards flat onto the floor like pop-up book pages (the relief flattens too), and the girls walk over
  // them; returns how long that takes (the game waits for it before anyone gets up)
  dropCovers() {
    const live = this.covers.filter(Boolean), tw = this.game.tweens, t = T.layout.cover.foldTime;
    this.covers = [];
    live.forEach((c, i) => {
      const u = c.m.material.uniforms;
      tw.to(c.m.rotation, { x: -Math.PI / 2 }, t, { delay: i * 0.06, ease: Ease.inQuad, onDone: () => { c.m.renderOrder = 4; c.m.material.depthTest = true; } });
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
    // it topples over backwards, flat onto the floor
    g.tweens.to(m.rotation, { x: -Math.PI / 2 * 0.92 }, 0.45, { ease: Ease.inQuad, onDone: () => { sfx.thud(0); g.post.shake(0.6); } });
  }

  makeShadow(width) {
    if (!this.shadowTex) this.shadowTex = shadowTex();
    const s = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.4), new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false, fog: false }));
    s.rotation.x = -Math.PI / 2; s.position.y = 0.02; s.renderOrder = -4;
    return s;
  }
  applyAnomaly() {}
  litFlats() {}
  lightAt(p, out = new THREE.Color()) { return out.copy(this.lit); }

  update(dt, t) {
    const g = this.game, cam = this.camera;
    const c1 = g.players[0]?.ctrl, on = c1 && c1.active;
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
    const fov = this.baseFov + this.fovKick;
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
    for (const c of this.covers) if (c) { c.dm.update(dt); const u = c.m.material.uniforms; u.flash.value = Math.max(0, u.flash.value - dt * 5); }
    this.inkU.time.value = t;
  }
  // the world into its own target with depth, then the ink pass into whatever target was set (the post-processing one)
  render(r) {
    const target = r.getRenderTarget(), size = r.getDrawingBufferSize(tmpV2);
    const w = target ? target.width : size.x, h = target ? target.height : size.y;
    if (this.rt.width !== w || this.rt.height !== h) { this.rt.setSize(w, h); this.rt.depthTexture.image.width = w; this.rt.depthTexture.image.height = h; this.inkU.texel.value.set(1 / w, 1 / h); }
    this.inkU.near.value = this.camera.near; this.inkU.far.value = this.camera.far;
    r.setRenderTarget(this.rt); r.clear(); r.render(this.scene, this.camera);
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
