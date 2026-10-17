// Level sets: real 3D rooms (tiled floors / walls / ceilings), paper set pieces, light anchors, and the camera
// stations an episode's stages are made of. One set per episode, all data: content sets/<id>.json
// (rooms, calm / invaded palettes, stations + waves, and a "dressing" list that this builder lays out).
// Floor is y = 0; the camera rides at ~1.6 m; rooms run down -Z.
// A station = where the camera stops to fight: { via (rail points from the previous stop), cam, look, covers, waves }.
// Anomaly (0 = calm, 1 = invaded): the world lerps its palette, set pieces float up, and tears open in the paper world.
import * as THREE from 'three';
import { tex, meta } from '../core/assets.js';
import { paperMesh } from '../core/paper.js';
import { C } from '../core/content.js';

export const FLOOR = 0;
const LAMBERT = (map, extra = {}) => new THREE.MeshLambertMaterial({ map, ...extra });
const WHITE = new THREE.Color(1, 1, 1);

function texRepeat(key) {
  const t = tex[key];
  if (!t) return null;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}
// plane with UVs scaled so one texture tile covers `tile` metres
function tiledPlane(w, h, key, tileW, tileH = tileW, opts = {}) {
  const geo = new THREE.PlaneGeometry(w, h, Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tileW + (opts.u0 || 0), uv.getY(i) * h / tileH + (opts.v0 || 0));
  const map = texRepeat(key);
  // a little self-glow keeps big dim rooms readable (paper diorama look); lights add on top
  const glow = opts.glow ? { emissive: 0xffffff, emissiveMap: map, emissiveIntensity: opts.glow } : {};
  const m = new THREE.Mesh(geo, LAMBERT(map, glow));
  m.renderOrder = -20;
  return m;
}

// =================================================================== builder
export class Level {
  constructor(world, setId) {
    this.world = world;
    this.set = C.sets[setId];
    this.group = new THREE.Group();
    this.lights = [];     // anchors {p, color (calm), alt (invaded), power, flicker}
    this.billboards = []; // props that turn toward the camera around Y
    this.surfaces = [];   // room planes whose paper tint shifts with the anomaly
    this.floaters = [];   // set pieces that lift off when the anomaly hits
    this.rips = [];       // torn-paper holes into the void
    this.anomaly = -1;
    // rooms in the order the camera meets them (they run down -Z)
    this.zones = Object.values(this.set.rooms).sort((a, b) => b.z0 - a.z0);
    for (const d of this.set.dressing || []) this.dress(d);
  }
  zone(z) { return this.zones.find((r) => z > r.z1) || this.zones[this.zones.length - 1]; }
  ceilAt(z) { return this.zone(z).h ?? this.set.openCeiling ?? 12; }
  fogAt(z) { return this.zone(z).fog ?? 0.02; }

  // one entry of the set's dressing list
  dress(d) {
    const R = this.set.rooms, deg = Math.PI / 180;
    switch (d.do) {
      case 'room': this.room(R[d.room], d); break;
      case 'ground': {
        const Y = R[d.room];
        const g = tiledPlane(Y.x1 - Y.x0, Y.z0 - Y.z1, Y.floor[0], Y.floor[1], Y.floor[1], { glow: Y.glow });
        g.rotation.x = -Math.PI / 2; g.position.set((Y.x0 + Y.x1) / 2, 0, (Y.z0 + Y.z1) / 2);
        this.group.add(g); this.surfaces.push(g);
        break;
      }
      case 'backdrop': this.backdrop(d.key, d.w, d.x || 0, d.y || 0, d.z); break;
      case 'flat': {
        const m = this.flat(d.key, d.h, d.x, d.y || 0, d.z, { rotY: (d.rotY || 0) * deg, billboard: !!d.billboard, float: d.float || 0 });
        if (m && d.scaleX) m.scale.x = d.scaleX;
        break;
      }
      case 'grid': // rows of the same prop, slightly jittered; some float up when the anomaly hits
        for (const z of d.zs) for (const x of d.xs) {
          const f = d.float, lifts = f && (Math.abs(x) > (f.ifAbsXOver ?? -1) || z < (f.orZUnder ?? -1e9)) && Math.random() < f.chance;
          this.flat(d.key, d.h, x + (Math.random() - 0.5) * (d.jitter || 0), 0, z, { float: lifts ? f.lift[0] + Math.random() * (f.lift[1] - f.lift[0]) : 0 });
        }
        break;
      case 'row': for (let z = d.z0; z > d.z1; z -= d.step) this.onWall(d.key, d.h, d.wall, d.xWall, 0, z); break;
      case 'onWall': this.onWall(d.key, d.h, d.side, d.xWall, d.y || 0, d.z); break;
      case 'light': this.light(d.x, d.y, d.z, d.color, d.power ?? 1, d.flicker ?? 1, d.alt ?? null); break;
      case 'rip': this.rip(d.i, d.x, d.y, d.z, (d.rotY || 0) * deg, d.size, !!d.sky); break;
      default: console.warn('unknown dressing', d);
    }
  }

  room(r, { openStart = null, openEnd = null } = {}) {
    if (!r) return;
    const g = this.group, w = r.x1 - r.x0, d = r.z0 - r.z1, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    const G = { glow: r.glow || 0 };
    const add = (m) => { g.add(m); this.surfaces.push(m); return m; };
    const floor = add(tiledPlane(w, d, r.floor[0], r.floor[1], r.floor[1], G));
    floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0, cz);
    const ceil = add(tiledPlane(w, d, r.ceil[0], r.ceil[1], r.ceil[1], G));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, r.h, cz);
    for (const side of [-1, 1]) {
      const x = side < 0 ? r.x0 : r.x1;
      const wt = (side < 0 && r.wallL) || r.wall;
      const wall = add(tiledPlane(d, r.h, wt[0], wt[1], wt[2] || wt[1], G));
      wall.rotation.y = -side * Math.PI / 2; wall.position.set(x, r.h / 2, cz);
    }
    // end walls with a doorway gap in the middle
    const endWall = (z, facing, gap) => {
      const gw = gap ? gap.w : 0, gh = gap ? gap.h : 0;
      const sideW = (w - gw) / 2;
      const mk = (ww, hh, x, y) => { const m = add(tiledPlane(ww, hh, r.wall[0], r.wall[1], r.wall[2] || r.wall[1], G)); m.rotation.y = facing > 0 ? 0 : Math.PI; m.position.set(x, y, z); };
      mk(sideW, r.h, r.x0 + sideW / 2, r.h / 2);
      mk(sideW, r.h, r.x1 - sideW / 2, r.h / 2);
      if (gap) mk(gw, r.h - gh, cx, gh + (r.h - gh) / 2);
    };
    if (openStart !== false) endWall(r.z0, -1, openStart);
    if (openEnd !== false) endWall(r.z1, 1, openEnd);
  }

  // a big painted backdrop (unlit, unfogged) standing at z, bottom edge at y
  backdrop(key, width, x, y, z) {
    const t = tex[key];
    if (!t) return null;
    const h = width / (t.image.width / t.image.height);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshBasicMaterial({ map: t, fog: false }));
    m.position.set(x, y + h / 2, z);
    m.renderOrder = -30;
    this.group.add(m);
    this.sky = m;
    return m;
  }

  flat(key, h, x, y, z, { rotY = 0, billboard = false, order = 0, float = 0 } = {}) {
    const t = tex[key];
    if (!t) return null;
    // (h = the drawn height; a picture with a transparent margin, tools/pad_frames.py, still stands on its drawn bottom)
    const pad = meta[key]?.pad || [0, 0, 0, 0], k = h / (t.image.height - pad[1] - pad[3]);
    const m = paperMesh(t, t.image.width * k, { pivot: 'bottom' });
    m.geometry.translate((pad[2] - pad[0]) / 2 * k, -pad[3] * k, 0);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    m.renderOrder = order;
    m.userData.texKey = key;
    this.group.add(m);
    if (billboard) this.billboards.push(m);
    if (float) this.floaters.push({ m, y0: y, lift: float, seed: Math.random() * 10 });
    return m;
  }
  // flat stuck on a side wall, facing into the room
  onWall(key, h, side, xWall, y, z) { return this.flat(key, h, xWall - side * 0.04, y, z, { rotY: -side * Math.PI / 2 }); }
  // alt = the colour this light turns when the world is invaded
  light(x, y, z, color = 0xff8a4a, power = 1, flicker = 1, alt = null) {
    const c = new THREE.Color(color);
    this.lights.push({ p: new THREE.Vector3(x, y, z), base: c.clone(), alt: new THREE.Color(alt ?? color), color: c, power, flicker, seed: Math.random() * 100 });
  }
  // a torn-paper hole (fx/rip<i>) on a wall / in the sky; hidden while the world is calm
  rip(i, x, y, z, rotY, size, sky = false) {
    const t = tex[`fx/rip${i % 6}`];
    if (!t) return;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * t.image.height / t.image.width),
      new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: !sky }));
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    m.rotation.z = (Math.random() - 0.5) * 0.6;
    m.renderOrder = sky ? -29 : -10;
    m.visible = false;
    this.group.add(m);
    this.rips.push({ m, delay: Math.random() * 0.6, seed: Math.random() * 10 });
  }

  // k: 0 calm .. 1 invaded
  setAnomaly(k) {
    if (Math.abs(k - this.anomaly) < 1e-4) return;
    this.anomaly = k;
    const s = this.set;
    const tint = new THREE.Color(s.calm.surface).lerp(new THREE.Color(s.invaded.surface), k);
    for (const m of this.surfaces) { m.material.color.copy(tint); m.material.emissive.copy(tint); }
    for (const a of this.lights) a.color.copy(a.base).lerp(a.alt, k);
  }

  update(dt, t, cam) {
    for (const b of this.billboards) {
      const dx = cam.position.x - b.position.x, dz = cam.position.z - b.position.z;
      b.rotation.y = Math.atan2(dx, dz);
    }
    const k = Math.max(0, this.anomaly);
    for (const f of this.floaters) {
      const lift = Math.max(0, Math.min(1, k * 1.4 - f.seed * 0.04));
      f.m.position.y = f.y0 + lift * (f.lift + Math.sin(t * 0.9 + f.seed) * 0.12);
      f.m.rotation.z = lift * Math.sin(t * 0.6 + f.seed) * 0.28;
    }
    for (const r of this.rips) {
      const a = Math.max(0, Math.min(1, (k - r.delay * 0.5) * 2));
      r.m.visible = a > 0.01;
      if (!r.m.visible) continue;
      const s = a < 1 ? a * (1.15 - 0.15 * a) : 1 + Math.sin(t * 2 + r.seed) * 0.03;
      r.m.scale.set(s, s, 1);
      r.m.material.opacity = Math.min(1, a * 1.5);
    }
  }
}
