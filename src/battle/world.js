// 3D world: the level geometry, pooled flickering candle lights, fog, the camera on its rail,
// and the paper barricade (cover) that folds up from the floor at each station.
import * as THREE from 'three';
import { tex, alphaAt } from '../core/assets.js';
import { paperMesh, DamageMap, attachDamage, FOG } from '../core/paper.js';
import { Ease } from '../core/tween.js';
import { Level } from './level.js';
import { shadowTex } from './fx.js';

const POOL = 8;
const tmpV = new THREE.Vector3();

export class World {
  constructor(game, setId) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(52, 16 / 9, 0.05, 260);
    this.scene.add(this.camera);
    this.level = new Level(this, setId);
    const set = this.level.set;
    // palettes: calm <-> invaded, blended by this.anomaly (0..1)
    this.pal = [set.calm, set.invaded || set.calm].map((p) => ({ fog: new THREE.Color(p.fog), sky: new THREE.Color(p.sky), hs: new THREE.Color(p.hemi[0]), hg: new THREE.Color(p.hemi[1]), hi: p.hemi[2], base: p.base }));
    this.scene.fog = new THREE.FogExp2(set.calm.fog, 0.05);
    this.scene.background = new THREE.Color(set.calm.sky);
    this.hemi = new THREE.HemisphereLight(set.calm.hemi[0], set.calm.hemi[1], set.calm.hemi[2]);
    this.scene.add(this.hemi);
    this.base = [...set.calm.base];
    this.anomaly = 0;
    this.scene.add(this.level.group);
    this.pool = [];
    for (let i = 0; i < POOL; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 16, 1.25);
      this.scene.add(l);
      this.pool.push(l);
    }
    this.ray = new THREE.Raycaster();
    this.look = { x: 0, y: 0 };
    this.camPos = new THREE.Vector3(0, 1.6, 4);
    this.lookAt = new THREE.Vector3(0, 1.5, -10);
    this.bob = 0;
    this.fovKick = 0;
    this.covers = [];
    this.baseFov = 52;
    this.litFlats();
  }

  // Hor+ with a floor: wider screens see more to the sides (panorama on ultrawide);
  // narrower than 16:9 opens the vertical FOV so the sides are never lost.
  setSize(W, H) {
    const a = W / H, minHalfH = Math.atan(Math.tan(THREE.MathUtils.degToRad(26)) * 16 / 9);
    this.baseFov = Math.max(52, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(minHalfH) / a)));
    this.camera.aspect = a; this.camera.fov = this.baseFov; this.camera.updateProjectionMatrix();
  }

  // ---- camera rail ----
  place(cam, look) { this.camPos.set(...cam); this.lookAt.set(...look); }
  travel(points, look, dur, onDone) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
    const fromLook = this.lookAt.clone(), toLook = new THREE.Vector3(...look);
    let step = 0;
    this.game.tweens.run(dur, (e, k) => {
      curve.getPointAt(e, this.camPos);
      // look ahead along the rail while moving, settle on the station target at the end
      const ahead = curve.getPointAt(Math.min(1, e + 0.12)).add(new THREE.Vector3(0, -0.1, -0.01));
      const w = Ease.inOutQuad(Math.max(0, (k - 0.55) / 0.45));
      this.lookAt.copy(ahead).lerp(toLook, w);
      if (k < 0.15) this.lookAt.lerp(fromLook, 1 - k / 0.15);
      this.bob = Math.abs(Math.sin(k * dur * 9.5)) * 0.07 * Math.sin(k * Math.PI);
      this.fovKick = Math.sin(k * Math.PI) * 5;
      const s = Math.floor(k * dur * 4.75);
      if (s !== step) { step = s; this.game.onStep && this.game.onStep(s); }
    }, { ease: Ease.inOutQuad, onDone: () => { this.bob = 0; this.fovKick = 0; onDone && onDone(); } });
  }

  // ---- covers: one barricade per player, folding up from the floor ----
  setCovers(defs) {
    this.dropCovers();
    this.covers = defs.map((def, i) => {
      const t = tex[def.k];
      const ar = t.image.width / t.image.height;
      const m = paperMesh(t, def.h * ar, { pivot: 'bottom' });
      const dm = new DamageMap(1 / ar, 384);
      attachDamage(m, dm);
      m.position.set(def.x, 0, def.z);
      m.rotation.order = 'YXZ';
      m.rotation.y = Math.atan2(this.camPos.x - def.x, this.camPos.z - def.z);
      m.rotation.x = -Math.PI / 2;
      if (def.flip) m.scale.x = -1;
      m.renderOrder = 5;
      this.scene.add(m);
      this.game.tweens.to(m.rotation, { x: 0 }, 0.45, { ease: Ease.outBack, delay: i * 0.08 });
      return { m, dm, def, w: def.h * ar, h: def.h };
    });
  }
  dropCovers() {
    for (const c of this.covers || []) {
      this.game.tweens.to(c.m.rotation, { x: -Math.PI / 2 }, 0.35, { ease: Ease.inQuad, onDone: () => { this.scene.remove(c.m); c.dm.dispose(); c.m.material.dispose(); } });
    }
    this.covers = [];
  }

  makeShadow(width) {
    if (!this.shadowTex) this.shadowTex = shadowTex();
    const s = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.4), new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false, fog: false }));
    s.rotation.x = -Math.PI / 2;
    s.position.y = 0.02;
    s.renderOrder = -4;
    return s;
  }

  // ---- calm / invaded palette ----
  applyAnomaly() {
    const k = this.anomaly, [a, b] = this.pal;
    if (this._k === k) return;
    this._k = k;
    this.scene.fog.color.copy(a.fog).lerp(b.fog, k);
    FOG.color.value.copy(this.scene.fog.color);
    this.scene.background.copy(a.sky).lerp(b.sky, k);
    this.hemi.color.copy(a.hs).lerp(b.hs, k);
    this.hemi.groundColor.copy(a.hg).lerp(b.hg, k);
    this.hemi.intensity = a.hi + (b.hi - a.hi) * k;
    for (let i = 0; i < 3; i++) this.base[i] = a.base[i] + (b.base[i] - a.base[i]) * k;
    this.level.setAnomaly(k);
    if (this.level.sky) this.level.sky.material.color.setRGB(1 - 0.45 * k, 1 - 0.6 * k, 1 - 0.25 * k);
  }

  // ---- lighting ----
  lightAt(p, out = new THREE.Color()) {
    out.setRGB(...this.base);
    for (const a of this.level.lights) {
      const d2 = a.p.distanceToSquared(p);
      if (d2 > 160) continue;
      const k = a.power * 3.2 / (1 + d2 * 0.25);
      out.r += a.color.r * k * 0.35; out.g += a.color.g * k * 0.35; out.b += a.color.b * k * 0.35;
    }
    out.r = Math.min(1.25, out.r); out.g = Math.min(1.2, out.g); out.b = Math.min(1.2, out.b);
    return out;
  }
  litFlats() {
    this.level.group.traverse((o) => { if (o.material && o.material.uniforms && o.material.uniforms.lit) this.lightAt(o.position, o.material.uniforms.lit.value); });
  }

  update(dt, t) {
    const g = this.game, cam = this.camera;
    // nearest light anchors drive the pooled point lights (fixed light count keeps shaders stable)
    const anchors = this.level.lights;
    const sorted = anchors.map((a) => [a, a.p.distanceToSquared(this.camPos) - (a.p.z < this.camPos.z - 1 ? 0 : 400)]).sort((x, y) => x[1] - y[1]);
    for (let i = 0; i < POOL; i++) {
      const L = this.pool[i], a = sorted[i] && sorted[i][0];
      if (!a) { L.intensity = 0; continue; }
      L.position.copy(a.p);
      L.color.copy(a.color);
      const fl = 1 - a.flicker * 0.25 * (0.5 + 0.5 * Math.sin(t * 13 + a.seed) * Math.sin(t * 7.3 + a.seed * 2));
      L.intensity = a.power * 12 * fl;
    }
    // fog per room
    this.applyAnomaly();
    const want = this.level.fogAt(this.camPos.z - 1) * (1 + this.anomaly * 0.6);
    this.scene.fog.density += (want - this.scene.fog.density) * Math.min(1, dt * 2);
    FOG.density.value = this.scene.fog.density;
    // camera: rail position + look sway toward 1P's reticle
    const c1 = g.players[0]?.ctrl, on = c1 && c1.active && !g.cineOn && !g.walkOn;   // (a close look, Game.cine / a walk between places: held still)
    const lx = on ? c1.x / g.W - 0.5 : 0, ly = on ? c1.y / g.H - 0.5 : 0;
    this.look.x += (lx - this.look.x) * Math.min(1, dt * 4);
    this.look.y += (ly - this.look.y) * Math.min(1, dt * 4);
    cam.position.copy(this.camPos);
    cam.position.y += this.bob + Math.sin(t * 1.3) * 0.015;
    cam.position.x += g.post.shakeX * 0.08;
    cam.position.y += g.post.shakeY * 0.08;
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
    this.level.update(dt, t, cam);
    for (const c of this.covers) { c.dm.update(dt); const u = c.m.material.uniforms; u.flash.value = Math.max(0, u.flash.value - dt * 5); }
  }

  // ---- screen <-> world ----
  ndc(sx, sy) { return new THREE.Vector2(sx / this.game.W * 2 - 1, -(sy / this.game.H) * 2 + 1); }
  rayFrom(sx, sy) { this.ray.setFromCamera(this.ndc(sx, sy), this.camera); return this.ray.ray; }
  screenToWorld(sx, sy, dist) {
    const r = this.rayFrom(sx, sy);
    return r.origin.clone().addScaledVector(r.direction, dist);
  }
  project(p) {
    const v = tmpV.copy(p).project(this.camera);
    return { x: (v.x + 1) / 2 * this.game.W, y: (1 - v.y) / 2 * this.game.H, z: v.z };
  }
  pick(sx, sy, meshes) {
    this.ray.setFromCamera(this.ndc(sx, sy), this.camera);
    const hits = this.ray.intersectObjects(meshes, false);
    for (const h of hits) {
      const u = h.uv;
      if (!u) continue;
      const mu = h.object.material.uniforms;
      if (mu && mu.sliceOn && mu.sliceOn.value) continue;
      if (alphaAt(h.object.userData.texKey, u.x, u.y) > 110) return h;
    }
    return null;
  }
}
