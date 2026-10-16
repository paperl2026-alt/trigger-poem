// Level sets: real 3D rooms (tiled floors / walls / ceilings), paper set pieces, light anchors, and the camera
// stations an episode's stages are made of. One set per episode. Floor is y = 0; the camera rides at ~1.6 m; rooms run down -Z.
// A station = where the camera stops to fight: { via (rail points from the previous stop), cam, look, covers, waves }.
// Anomaly (0 = calm, 1 = invaded): the world lerps its palette, set pieces float up, and tears open in the paper world.
import * as THREE from 'three';
import { tex } from '../engine/assets.js';
import { paperMesh } from '../engine/paper.js';

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

// =================================================================== SCHOOL (episode 0)
// A calm after-school sunset. The evil god breaks in: the paper world tears, the sunset turns wrong, desks float.
// classroom (z 2 .. -12) -> corridor (-12 .. -46) -> schoolyard (-46 .. -104, open sky, boss)
const S_ROOMS = {
  classroom: { x0: -5, x1: 5, z0: 2, z1: -12, h: 3.4, floor: ['tex/class_floor', 2.2], wallL: ['tex/class_wall', 3.4], wall: ['tex/corridor_wall', 3.4], ceil: ['tex/school_ceiling', 2.6], fog: 0.03, glow: 0.3 },
  corridor: { x0: -2.2, x1: 2.2, z0: -12, z1: -46, h: 3.2, floor: ['tex/class_floor', 2.2], wallL: ['tex/class_wall', 3.2], wall: ['tex/corridor_wall', 3.2], ceil: ['tex/school_ceiling', 2.6], fog: 0.035, glow: 0.28 },
  yard: { x0: -60, x1: 60, z0: -46, z1: -104, floor: ['tex/yard', 3.2], fog: 0.012, glow: 0.45 },
};
const SCHOOL = {
  rooms: S_ROOMS,
  // palettes: calm sunset -> invaded (cold violet light, magenta rims, darker paper)
  calm: { fog: 0x6a3a40, hemi: [0xffd0a8, 0x5a3438, 1.55], sky: 0xf0a070, base: [0.66, 0.56, 0.52], surface: 0xffffff },
  invaded: { fog: 0x241030, hemi: [0xa890ff, 0x2a1030, 1.25], sky: 0x2a1040, base: [0.46, 0.38, 0.6], surface: 0x9a88b8 },
  stations: {
    class1: {
      via: [[0, 1.5, 1.6]], cam: [0, 1.5, -0.6], look: [0, 1.35, -11],
      covers: [{ k: 'cover/desks', x: -1.05, z: -2.7, h: 0.92 }, { k: 'cover/desks', x: 1.05, z: -2.7, h: 0.92, flip: true }],
      invade: true, tutorial: true,
      waves: [
        [{ t: 0.4, type: 'zomb', from: 'pop', x: -1.2, z: -7.2 }, { t: 2.2, type: 'zomb', from: 'far', x: 1.4, z: -10.6 }],
        [{ t: 0.0, type: 'sheet', from: 'far', x: -3, y: 2.2, z: -10.5 }, { t: 0.6, type: 'sheet', from: 'far', x: 3, y: 2.4, z: -10.5 }, { t: 1.4, type: 'zomb', from: 'pop', x: 1.2, z: -5.2 },
          { t: 2.4, type: 'zomb', from: 'pop', x: -3.4, z: -9.2 }],
        [{ t: 0.0, type: 'lantern', from: 'pop', x: -2.6, z: -9.6 }, { t: 0.5, type: 'zomb', from: 'pop', x: 1.2, z: -7.2 }, { t: 1.0, type: 'zomb', from: 'pop', x: 3.4, z: -9.2 },
          { t: 1.8, type: 'sheet', from: 'far', x: 0, y: 2.6, z: -11 }, { t: 2.2, type: 'sheet', from: 'far', x: -2.5, y: 2, z: -11 }, { t: 2.6, type: 'sheet', from: 'far', x: 2.5, y: 2.2, z: -11 }],
      ],
    },
    hall1: {
      via: [[0, 1.5, -6], [1.6, 1.5, -10.5], [0.2, 1.5, -13.5]], cam: [0, 1.5, -16], look: [0, 1.35, -34],
      covers: [{ k: 'cover/desks', x: -0.95, z: -18.6, h: 0.9 }, { k: 'cover/desks', x: 0.95, z: -18.6, h: 0.9, flip: true }],
      waves: [
        [{ t: 0.2, type: 'lantern', from: 'pop', x: -1.3, z: -27 }, { t: 0.9, type: 'zomb', from: 'far', x: 0.6, z: -33 }, { t: 1.8, type: 'sheet', from: 'far', x: 0.8, y: 2.3, z: -34 },
          { t: 2.3, type: 'sheet', from: 'far', x: -0.8, y: 2.0, z: -34 }],
        [{ t: 0.0, type: 'umbrella', x: 0.6, z: -30 }, { t: 0.7, type: 'lantern', from: 'pop', x: 1.3, z: -30 }, { t: 1.5, type: 'zomb', from: 'far', x: -0.8, z: -34 },
          { t: 2.6, type: 'zomb', from: 'drop', x: 0.9, z: -26 }, { t: 3.2, type: 'sheet', from: 'far', x: 0, y: 2.4, z: -36 }],
      ],
    },
    hall2: {
      via: [[0.3, 1.5, -22], [-0.2, 1.5, -27]], cam: [0, 1.5, -30], look: [0, 1.35, -46],
      covers: [{ k: 'cover/desks', x: -0.95, z: -32.6, h: 0.9 }, { k: 'cover/desks', x: 0.95, z: -32.6, h: 0.9, flip: true }],
      waves: [
        [{ t: 0.2, type: 'lantern', from: 'pop', x: -1.2, z: -40 }, { t: 0.5, type: 'lantern', from: 'pop', x: 1.2, z: -42 }, { t: 1.4, type: 'zomb', from: 'far', x: 0, z: -45 },
          { t: 2.2, type: 'umbrella', x: -0.5, z: -44 }, { t: 2.6, type: 'sheet', from: 'far', x: -1, y: 2.0, z: -46 }],
        [{ t: 0.0, type: 'zomb', from: 'drop', x: -0.6, z: -38 }, { t: 0.4, type: 'zomb', from: 'drop', x: 0.7, z: -40 }, { t: 1.2, type: 'lantern', from: 'pop', x: 0, z: -44 },
          { t: 2.0, type: 'sheet', from: 'far', x: -1, y: 2.4, z: -46 }, { t: 2.3, type: 'sheet', from: 'far', x: 1, y: 2.2, z: -46 }, { t: 2.6, type: 'umbrella', x: 0.4, z: -45 },
          { t: 3.4, type: 'zomb', from: 'far', x: 0.4, z: -46 }],
      ],
    },
    yard: {
      via: [[0, 1.6, -40], [0, 1.7, -46], [0, 1.8, -50]], cam: [0, 1.8, -54], look: [0, 4.0, -74],
      covers: [{ k: 'cover/vault', x: -1.3, z: -56.8, h: 0.95 }, { k: 'cover/vault', x: 1.3, z: -56.8, h: 0.95, flip: true }],
    },
  },
  fogAt(z) { const R = S_ROOMS; return z > R.classroom.z1 ? R.classroom.fog : z > R.corridor.z1 ? R.corridor.fog : R.yard.fog; },
  ceilAt(z) { const R = S_ROOMS; return z > R.classroom.z1 ? R.classroom.h : z > R.corridor.z1 ? R.corridor.h : 12; },
  build(lv) {
    const C = S_ROOMS.classroom, H = S_ROOMS.corridor, Y = S_ROOMS.yard;
    lv.room(C, { openStart: false, openEnd: { w: 2.4, h: 2.7 } });
    lv.room(H, { openStart: false, openEnd: { w: 3.0, h: 2.8 } });
    const g = tiledPlane(Y.x1 - Y.x0, Y.z0 - Y.z1, Y.floor[0], Y.floor[1], Y.floor[1], { glow: Y.glow });
    g.rotation.x = -Math.PI / 2; g.position.set(0, 0, (Y.z0 + Y.z1) / 2); lv.group.add(g);
    lv.surfaces.push(g);
    lv.backdrop('bg/yard_calm', 130, 0, -9, Y.z1);
    // classroom: rows of desks (they float up when the anomaly hits), lectern, blackboard, locker, plant
    for (const z of [-5.2, -7.2, -9.2]) for (const x of [-3.6, -1.2, 1.2, 3.6]) lv.flat('prop/desk', 1.15, x + (Math.random() - 0.5) * 0.2, 0, z, { float: (Math.abs(x) > 2 || z < -8) && Math.random() < 0.75 ? 1.7 + Math.random() * 0.5 : 0 });
    lv.flat('prop/lectern', 1.2, 0.4, 0, -10.9, { float: 1.8 });
    const board = lv.flat('prop/chalkboard', 2.2, -2.4, 0.15, -11.85);
    if (board) board.scale.x = 1.25;
    lv.flat('prop/plant', 1.1, 4.4, 0, -11.4, { float: 1.2 });
    lv.flat('prop/locker', 1.8, -4.4, 0, -11.5);
    for (const z of [-1.5, -5, -8.5]) lv.light(C.x0 + 0.8, 2.4, z, 0xffa060, 1.3, 0.15, 0x9a5cff); // sunset through the windows
    lv.light(0, 3.0, -10, 0xffc8a0, 1.0, 0.2, 0xff3aa0);
    lv.light(2.5, 3.1, -3, 0xfff0d8, 0.8, 0.05, 0x7a6aff);
    // tears in the paper world (open when the evil god breaks in)
    lv.rip(0, C.x0 + 0.03, 2.1, -6.5, Math.PI / 2, 1.6);
    lv.rip(1, C.x1 - 0.03, 1.8, -8.8, -Math.PI / 2, 1.4);
    lv.rip(2, 2.4, 2.4, C.z1 + 0.03, 0, 1.5);
    lv.rip(3, C.x1 - 0.03, 2.3, -3.5, -Math.PI / 2, 1.1);
    // corridor: lockers on the inner wall, shoe cubbies at the exit, tears along the walls
    for (let z = -15; z > -44; z -= 3.6) lv.onWall('prop/locker', 1.85, 1, H.x1, 0, z);
    for (const z of [-21, -35]) lv.onWall('prop/plant', 1.0, -1, H.x0, 0, z);
    for (const x of [-1.6, 1.6]) lv.flat('prop/shoebox', 1.4, x, 0, -44.8, { float: 0.7 });
    for (let z = -14; z > -46; z -= 4.5) { lv.light(H.x0 + 0.6, 2.3, z, 0xff9a58, 1.1, 0.1, 0x9a5cff); lv.light(0.8, 3.0, z - 2, 0xfff0d8, 0.5, 0.3, 0xff3aa0); }
    [[4, H.x0 + 0.03, 2.0, -24, Math.PI / 2, 1.3], [5, H.x1 - 0.03, 2.2, -31, -Math.PI / 2, 1.2], [0, H.x0 + 0.03, 1.9, -39, Math.PI / 2, 1.2]].forEach((r) => lv.rip(...r));
    // yard: sunset key light; when invaded the sky itself is torn
    lv.light(-8, 9, -66, 0xffa060, 3.4, 0.05, 0x8a5cff);
    lv.light(8, 7, -70, 0xffb080, 2.6, 0.1, 0xff3aa0);
    lv.light(0, 4, -58, 0xffc890, 1.6, 0.1, 0xb070ff);
    for (const [x, z] of [[-9, -70], [9, -64], [-12, -84], [12, -80]]) lv.flat('prop/plant', 2.2, x, 0, z, { billboard: true });
    [[2, -24, 30, -101, 0, 16], [1, 18, 24, -101, 0, 12], [5, -2, 34, -101, 0, 10], [3, 34, 16, -101, 0, 9]].forEach((r) => lv.rip(...r, true));
  },
};

export const SETS = { school: SCHOOL };

// =================================================================== builder
export class Level {
  constructor(world, setId) {
    this.world = world;
    this.set = SETS[setId];
    this.group = new THREE.Group();
    this.lights = [];     // anchors {p, color (calm), alt (invaded), power, flicker}
    this.billboards = []; // props that turn toward the camera around Y
    this.surfaces = [];   // room planes whose paper tint shifts with the anomaly
    this.floaters = [];   // set pieces that lift off when the anomaly hits
    this.rips = [];       // torn-paper holes into the void
    this.anomaly = -1;
    this.set.build(this);
  }
  ceilAt(z) { return this.set.ceilAt(z); }

  room(r, { openStart = null, openEnd = null } = {}) {
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
    const m = paperMesh(t, h * t.image.width / t.image.height, { pivot: 'bottom' });
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
