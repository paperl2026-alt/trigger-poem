// Painted 2.5D stages (docs/DESIGN.md "场景的 3D 感"). Every battle station is one painting seen from where the heroines crouch:
// the painting is pushed out along its depth (Depth Anything, tools/build_station.py) into a real 3D surface, the two near cover
// objects are relief meshes of their own, and window panes can show a far layer. The camera rests exactly where the painter stood,
// so at rest the screen IS the painting; when it moves (aim sway, leaning out, advancing) everything shifts with true parallax.
// Monsters stand on the painting's floor (levelled to y = 0 by a plane fit) and are hidden by what is in front of them.
// Same interface as World (world.js), so Game / enemies / bosses / fx work unchanged on it.
// Advancing between stations: the camera pushes forward into the painting, a flash, and the next painting arrives the same way.
import * as THREE from 'three';
import { tex, meta } from '../core/assets.js';
import { paperMaterial, DamageMap, attachDamage, FOG } from '../core/paper.js';
import { Ease } from '../core/tween.js';
import { C, T } from '../core/content.js';
import { shadowTex } from './fx.js';

const tmpV = new THREE.Vector3();

// inverse depth (0..1, R = high byte, G = low byte) of a station's depth grid image
function readDepth(key) {
  const im = tex[key]?.image;
  if (!im) return null;
  const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
  const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
  const px = g.getImageData(0, 0, im.width, im.height).data, out = new Float32Array(im.width * im.height);
  for (let i = 0; i < out.length; i++) out[i] = (px[i * 4] * 256 + px[i * 4 + 1]) / 65535;
  return { d: out, w: im.width, h: im.height };
}

// one painted station, built in the painter's camera space (x right, y up, looking down -z), then levelled
class Station {
  constructor(world, id, def) {
    this.world = world; this.id = id; this.def = def;
    const S = this.S = def.scene;
    const [W, H] = S.size;
    this.W = W; this.H = H;
    this.t = Math.tan((S.fov * Math.PI) / 360);
    this.group = new THREE.Group();
    // level the floor: the fitted floor normal (from pitch / roll) turns to +Y; the camera rides at camH above it
    const n = new THREE.Vector3(-Math.tan((S.roll * Math.PI) / 180), 1, Math.tan((S.pitch * Math.PI) / 180)).normalize();
    this.q = new THREE.Quaternion().setFromUnitVectors(n, new THREE.Vector3(0, 1, 0));
    this.group.quaternion.copy(this.q);
    this.group.position.set(0, S.camH, 0);
    this.camPos = new THREE.Vector3(0, S.camH, 0);
    this.fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.q);
    this.lit = new THREE.Color(...(S.lit || [1, 1, 1]));
    // the painting
    const P = S.plate, dp = readDepth(P.depth);
    this.depth = dp;
    const pm = this.plateMat = new THREE.MeshBasicMaterial({ map: tex[P.img], alphaTest: S.farImg ? 0.5 : 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 });
    this.plate = new THREE.Mesh(this.surface(dp, P.dims, 0, 0, Infinity), pm);
    this.plate.renderOrder = -20;
    this.group.add(this.plate);
    // the same painting in its other state (calm, before the invasion), faded by world.anomaly
    if (S.alt && tex[S.alt]) {
      this.altMat = new THREE.MeshBasicMaterial({ map: tex[S.alt], transparent: true, depthWrite: false, opacity: 1 });
      const am = new THREE.Mesh(this.plate.geometry, this.altMat); am.renderOrder = -19; am.raycast = () => {};
      this.group.add(am);
    }
    // the far layer behind window holes: exactly the painting's frame at that distance, so at rest it lines up
    if (S.farImg && tex[S.farImg]) {
      const z = S.far * 1.05;
      const far = new THREE.Mesh(new THREE.PlaneGeometry(2 * this.t * (W / H) * z, 2 * this.t * z), new THREE.MeshBasicMaterial({ map: tex[S.farImg] }));
      far.position.set(0, 0, -z); far.renderOrder = -30; far.raycast = () => {};
      this.group.add(far);
    }
    // cover objects: relief meshes with the paper shader (bullet marks, flash), each with an anchor for the game's cover logic
    this.covers = S.covers.map((c, i) => this.makeCover(c, i));
  }
  // a painting pixel at inverse depth d -> painter's camera space
  place(px, py, d, out = new THREE.Vector3()) {
    const S = this.S, z = 1 / (1 / S.far + Math.max(0, d) * (1 / S.near - 1 / S.far));
    return out.set((px / (this.W - 1) - 0.5) * 2 * this.t * (this.W / this.H) * z, (0.5 - py / (this.H - 1)) * 2 * this.t * z, -z);
  }
  depthAt(px, py) {
    const g = this.S.grid, D = this.depth, x = Math.max(0, Math.min(D.w - 1, px / g)), y = Math.max(0, Math.min(D.h - 1, py / g));
    const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(D.w - 1, x0 + 1), y1 = Math.min(D.h - 1, y0 + 1), fx = x - x0, fy = y - y0;
    const v = (a, b) => D.d[b * D.w + a];
    return (v(x0, y0) * (1 - fx) + v(x1, y0) * fx) * (1 - fy) + (v(x0, y1) * (1 - fx) + v(x1, y1) * fx) * fy;
  }
  // world position of a painting pixel (on whatever surface is painted there); floor pixels come out at y ~ 0
  toWorld(px, py, out = new THREE.Vector3()) { return this.place(px, py, this.depthAt(px, py), out).applyQuaternion(this.q).add(this.group.position); }
  // how far away the painted surface at a pixel is (metres along the view), and a point on that pixel's ray at any distance
  distAt(px, py) { const S = this.S; return 1 / (1 / S.far + Math.max(0, this.depthAt(px, py)) * (1 / S.near - 1 / S.far)); }
  atDist(px, py, dist, out = new THREE.Vector3()) {
    out.set((px / (this.W - 1) - 0.5) * 2 * this.t * (this.W / this.H) * dist, (0.5 - py / (this.H - 1)) * 2 * this.t * dist, -dist);
    return out.applyQuaternion(this.q).add(this.group.position);
  }
  // the width of the picture at a distance (metres)
  widthAt(dist) { return 2 * this.t * (this.W / this.H) * dist; }
  // grid -> mesh; triangles across a depth jump bigger than tear are left out (the far side shows instead of a smear)
  surface(D, dims, x0, y0, tear) {
    const [gw, gh] = dims, g = this.S.grid, pos = new Float32Array(gw * gh * 3), uv = new Float32Array(gw * gh * 2), v = new THREE.Vector3();
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const k = j * gw + i;
      this.place(x0 + i * g, y0 + j * g, D.d[k], v);
      pos[k * 3] = v.x; pos[k * 3 + 1] = v.y; pos[k * 3 + 2] = v.z;
      uv[k * 2] = i / (gw - 1); uv[k * 2 + 1] = 1 - j / (gh - 1);
    }
    const idx = [], z = (k) => -pos[k * 3 + 2], ok = (a, b, c) => { const m = Math.max(z(a), z(b), z(c)), n = Math.min(z(a), z(b), z(c)); return m / n < tear; };
    for (let j = 0; j < gh - 1; j++) for (let i = 0; i < gw - 1; i++) {
      const a = j * gw + i, b = a + 1, c = a + gw, e = c + 1;
      if (ok(a, c, b)) idx.push(a, c, b);
      if (ok(b, c, e)) idx.push(b, c, e);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    geo.computeVertexNormals(); geo.computeBoundingSphere();
    return geo;
  }
  makeCover(c, slot) {
    const D = readDepth(c.depth), t = tex[c.img];
    const geo = this.surface(D, c.dims, c.box[0], c.box[1], 1.35);
    const ar = (c.box[2] - c.box[0]) / (c.box[3] - c.box[1]);
    const mat = paperMaterial(t, ar);
    mat.uniforms.useFog.value = 0;
    mat.uniforms.lit.value.copy(this.lit).lerp(new THREE.Color(1, 1, 1), 0.6);
    mat.depthWrite = true;
    const m = new THREE.Mesh(geo, mat);
    m.renderOrder = 5;
    m.userData.texKey = c.img;
    const dm = new DamageMap(1 / ar, 384);
    attachDamage(m, dm);
    this.group.add(m);
    let alt = null;
    if (c.alt && tex[c.alt]) {
      const am = paperMaterial(tex[c.alt], ar); am.uniforms.useFog.value = 0;
      alt = new THREE.Mesh(geo, am); alt.renderOrder = 6; alt.raycast = () => {};
      this.group.add(alt);
    }
    // where the cover stands, for the game: bottom middle of its box, its size, an anchor facing the camera
    const bx = c.box, cx = (bx[0] + bx[2]) / 2;
    const base = this.toWorld(cx, bx[3] - 6), top = this.toWorld(cx, bx[1] + 4);
    const left = this.toWorld(bx[0], (bx[1] + bx[3]) / 2), right = this.toWorld(bx[2], (bx[1] + bx[3]) / 2);
    const anchor = new THREE.Object3D();
    anchor.position.set(base.x, 0, base.z);
    anchor.rotation.y = Math.atan2(this.camPos.x - base.x, this.camPos.z - base.z);
    anchor.position.y = 0; anchor.updateMatrixWorld(true);
    const h = Math.max(0.6, top.y), w = Math.max(0.8, left.distanceTo(right));
    const hp = T.combat.cover?.hp ?? 160;
    return { m: anchor, mesh: m, alt, dm, w, h, slot, hp, max: hp, broken: false, def: { x: base.x, z: base.z, h } };
  }
  setAnomaly(k) {
    if (this.altMat) this.altMat.opacity = 1 - k;
    for (const c of this.covers) if (c.alt) c.alt.material.uniforms.opacity.value = 1 - k;
  }
  dispose() {
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
    for (const c of this.covers) c.dm.dispose();
  }
}

export class PlateWorld {
  constructor(game, setId) {
    this.game = game;
    this.plates = true;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(52, 16 / 9, 0.05, 200);
    this.scene.add(this.camera);
    const set = C.sets[setId];
    this.scene.background = new THREE.Color(set.sky || 0x2a1830);
    this.scene.fog = new THREE.FogExp2(set.fog || 0x6a4a6a, 0.03);
    FOG.color.value.set(set.fog || 0x6a4a6a); FOG.density.value = set.fogDensity ?? 0.035;
    this.anomaly = 1;
    this.stationRoot = new THREE.Group();
    this.scene.add(this.stationRoot);
    // what the rest of the game asks of a level
    const world = this;
    this.level = {
      set, lights: [], sky: null,
      get group() { return world.stationRoot; },
      ceilAt: () => set.ceiling ?? 3.2,
      fogAt: () => FOG.density.value,
      setAnomaly: (k) => world.st && world.st.setAnomaly(k),
      update() {},
    };
    this.ray = new THREE.Raycaster();
    this.look = { x: 0, y: 0 };
    this.camPos = new THREE.Vector3(0, 1, 0);
    this.lookAt = new THREE.Vector3(0, 1, -10);
    this.camQ = new THREE.Quaternion();
    this.bob = 0; this.fovKick = 0; this.lean = 0;
    this.covers = [];
    this.baseFov = 52;
    this.st = null;
    this.push = 0;          // metres the camera is pushed along the station's forward (advancing)
  }

  // the camera always stays inside the painting: wider screens crop top / bottom instead of seeing past the edges
  setSize(W, H) {
    this.aspect = W / H;
    this.fit();
  }
  fit() {
    const S = this.st?.S, crop = this.game.G?.plateCrop ?? 0.9;
    const t = S ? this.st.t : Math.tan((26 * Math.PI) / 180), pa = S ? S.size[0] / S.size[1] : 16 / 9;
    const half = Math.min(t, t * pa / this.aspect) * crop;
    this.baseFov = (2 * Math.atan(half) * 180) / Math.PI;
    this.camera.aspect = this.aspect; this.camera.fov = this.baseFov; this.camera.updateProjectionMatrix();
  }

  // ---- stations ----
  station(id) { return this.level.set.stations[id]; }
  maxZ() { return this.stId ? this.station(this.stId).maxZ || 6 : 6; }
  load(id) {
    this.stId = id;
    if (this.st) { this.stationRoot.remove(this.st.group); this.st.dispose(); }
    this.st = new Station(this, id, this.station(id));
    this.stationRoot.add(this.st.group);
    this.st.setAnomaly(this.anomaly);
    this.camQ.copy(this.st.q);
    this.camPos.copy(this.st.camPos);
    this.fit();
    if (this.game.layout) this.game.players.forEach((p) => p.layout(this.game.W, this.game.H, this.game.G.frame));
    this.covers = [];
  }
  // arrive at a station: from a comic / the stage start the camera glides in; between stations it pushes forward into the
  // current painting, flashes, and glides into the next one
  enter(id, first, onDone) {
    const g = this.game, tw = g.tweens;
    const glideIn = () => {
      this.load(id);
      this.push = -1.6;
      let step = 0;
      tw.run(0.75, (e, k) => {
        this.push = -1.6 * (1 - e);
        this.bob = Math.abs(Math.sin(k * 7.5)) * 0.04 * (1 - k);
        this.fovKick = (1 - e) * 4;
        const s = Math.floor(k * 4); if (s !== step) { step = s; g.onStep && g.onStep(s); }
      }, { ease: Ease.outCubic, onDone: () => { this.push = 0; this.bob = 0; this.fovKick = 0; onDone && onDone(); } });
    };
    if (first || !this.st) { glideIn(); return; }
    let step = 0;
    tw.run(0.7, (e, k) => {
      this.push = 2.6 * e;
      this.bob = Math.abs(Math.sin(k * 9)) * 0.06;
      this.fovKick = e * 9;
      const s = Math.floor(k * 4.5); if (s !== step) { step = s; g.onStep && g.onStep(s); }
    }, {
      ease: Ease.inQuad,
      onDone: () => {
        g.post.flash(0.85, 0xffffff);
        g.post.kick(1.5);
        glideIn();
      },
    });
  }
  // the old world's camera rail calls (unused by plate stages, kept for the interface)
  place(cam, look) { if (cam) this.camPos.set(...cam); if (look) this.lookAt.set(...look); }
  travel(points, look, dur, onDone) { onDone && onDone(); }

  // ---- covers: they are part of the painting; arriving makes them count ----
  setCovers() {
    this.covers = this.st ? this.st.covers : [];
    for (const c of this.covers) { c.hp = c.max; c.broken = false; c.mesh.visible = true; c.mesh.rotation.set(0, 0, 0); }
  }
  dropCovers() { this.covers = []; }
  breakCover(c) {
    if (c.broken) return;
    c.broken = true;
    const g = this.game, tw = g.tweens, m = c.mesh;
    c.dm.cut([[0.1, 0.9], [0.9, 0.2]], 0.03); c.dm.cut([[0.15, 0.2], [0.85, 0.85]], 0.03);
    m.material.uniforms.flash.value = 1;
    // it slumps away into the floor
    tw.run(0.5, (e) => { m.material.uniforms.opacity.value = 1 - e * 0.85; m.position.y = -e * 0.4; }, { ease: Ease.inQuad });
    if (c.alt) c.alt.visible = false;
  }

  makeShadow(width) {
    if (!this.shadowTex) this.shadowTex = shadowTex();
    const s = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.4), new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false, fog: false }));
    s.rotation.x = -Math.PI / 2;
    s.position.y = 0.02;
    s.renderOrder = -4;
    return s;
  }
  applyAnomaly() { if (this._k !== this.anomaly) { this._k = this.anomaly; this.st && this.st.setAnomaly(this.anomaly); } }
  litFlats() {}
  // a monster standing in the painting takes the painting's light
  lightAt(p, out = new THREE.Color()) { return out.copy(this.st ? this.st.lit : new THREE.Color(1, 1, 1)); }

  update(dt, t) {
    const g = this.game, cam = this.camera;
    this.applyAnomaly();
    // look sway toward 1P's reticle (small: the camera must stay inside the painting) and a lean when 1P is out firing
    const c1 = g.players[0]?.ctrl, on = c1 && c1.active;
    const lx = on ? c1.x / g.W - 0.5 : 0, ly = on ? c1.y / g.H - 0.5 : 0;
    this.look.x += (lx - this.look.x) * Math.min(1, dt * 4);
    this.look.y += (ly - this.look.y) * Math.min(1, dt * 4);
    const out = g.players[0]?.exposed ? 1 : 0;
    this.lean += (out - this.lean) * Math.min(1, dt * 6);
    if (this.st) {
      cam.quaternion.copy(this.camQ);
      cam.position.copy(this.camPos).addScaledVector(this.st.fwd, this.push);
      // leaning out: up and a little toward the side 1P aims at
      cam.translateX(this.lean * (this.look.x * 0.12 - 0.04));
      cam.translateY(this.lean * 0.06 + this.bob + Math.sin(t * 1.3) * 0.008);
      cam.position.x += g.post.shakeX * 0.05;
      cam.position.y += g.post.shakeY * 0.05;
      cam.rotateY(-this.look.x * 0.035);
      cam.rotateX(-this.look.y * 0.025);
    }
    const fov = this.baseFov + this.fovKick;
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
    for (const c of this.covers) { c.dm.update(dt); const u = c.mesh.material.uniforms; u.flash.value = Math.max(0, u.flash.value - dt * 5); }
  }

  // ---- screen <-> world ----
  ndc(sx, sy) { return new THREE.Vector2(sx / this.game.W * 2 - 1, -(sy / this.game.H) * 2 + 1); }
  rayFrom(sx, sy) { this.ray.setFromCamera(this.ndc(sx, sy), this.camera); return this.ray.ray; }
  screenToWorld(sx, sy, dist) { const r = this.rayFrom(sx, sy); return r.origin.clone().addScaledVector(r.direction, dist); }
  project(p) {
    const v = tmpV.copy(p).project(this.camera);
    return { x: (v.x + 1) / 2 * this.game.W, y: (1 - v.y) / 2 * this.game.H, z: v.z };
  }
  pick(sx, sy, meshes) {
    this.ray.setFromCamera(this.ndc(sx, sy), this.camera);
    for (const h of this.ray.intersectObjects(meshes, false)) if (h.uv) return h;
    return null;
  }
  // painting pixel (1672-wide space) -> world, for wave spawns
  at(px, py) { return this.st.toWorld(px, py); }
  get meta() { return meta; }
}
