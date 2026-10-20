// The big pieces of a place beyond its hall (docs/DESIGN.md「总纲」: the world as big as it is, real 3D in one piece, the picture only a
// window on it - not a box with all five faces in view, not a painting pushed out into fake depth). A set's "scenery" is a list of
// solid pieces, each with its pictures (orthographic front views, like the hall's boards: ART 场景) on its faces:
//   { kind: box | slab | cyl | card, at: [x, y (its foot), z], size: [w, h, d] (cyl: [r, h]), ry (turned, degrees),
//     tex: <key> | { front, back, left, right, top } (box faces; a missing one is plain colour), tile: [u, v] (metres one picture
//     covers; it repeats), color: '#hex' (where no picture, or a tint), fog: false (far layers: no fog), lit: false }
//   { repeat: { n, step: [dx, dy, dz], ry }, ...piece }   the same piece n times (a row of buildings, pillars, trees, lamp posts)
//   card: a flat far layer (the sky line, a distant ridge) standing at its place, facing ry (default the way into the place)
//   sky: a ring round the whole place (size: [radius, height]) with the sky's picture on its inside, never fogged: every way out of a
//     window, a door, an open side shows sky (tile: [metres along the ring one picture covers, height])
// PanelWorld builds them into its root (src/battle/panels.js), so they fold, fog and get the ink lines with the rest.
import * as THREE from 'three';
import { tex } from '../core/assets.js';
import { hexNum } from '../core/content.js';

const D2R = Math.PI / 180;

function mat(key, w, h, P, opts = {}) {
  const t0 = key ? tex[key] : null;
  let t = t0;
  if (t0 && P.tile) {   // (repeats over the face: its own copy of the texture, wrapping)
    t = t0.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / P.tile[0], h / (P.tile[1] ?? P.tile[0])); t.needsUpdate = true;
  }
  return new THREE.MeshBasicMaterial({ map: t || null, color: P.color ? hexNum(P.color) : 0xffffff, transparent: !!opts.alpha, alphaTest: opts.alpha ? 0.5 : 0,
    fog: P.fog !== false, side: opts.side ?? THREE.FrontSide });
}

function piece(P) {
  const kind = P.kind || 'box', [w, h, d] = P.size || [1, 1, 1], T = typeof P.tex === 'string' ? { front: P.tex, back: P.tex, left: P.tex, right: P.tex, top: P.top || null } : P.tex || {};
  let m;
  if (kind === 'card') {
    m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(T.front || P.tex, w, h, P, { alpha: P.alpha, side: THREE.DoubleSide }));
    m.position.y = h / 2;
  } else if (kind === 'cyl' || kind === 'sky') {   // (sky: a ring round the whole place, its picture on the inside, no fog - every way out of it shows sky)
    const r = P.size[0], hh = P.size[1], inside = kind === 'sky' || P.inside;
    m = new THREE.Mesh(new THREE.CylinderGeometry(r, P.r1 ?? r, hh, P.seg || 48, 1, !P.top || inside), mat(T.front || P.tex, 2 * Math.PI * r, hh, kind === 'sky' ? { fog: false, ...P } : P, { side: inside ? THREE.BackSide : THREE.FrontSide }));
    m.position.y = hh / 2; if (kind === 'sky') m.renderOrder = -10;
  } else {   // box / slab (a slab: a thin box, a floor or a wall of its own)
    // BoxGeometry's faces: +x right, -x left, +y top, -y bottom, +z front, -z back
    const faces = [[T.right, d, h], [T.left, d, h], [T.top, w, d], [null, w, d], [T.front, w, h], [T.back, w, h]].map(([k, a, b]) => mat(k, a, b, P));
    m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), faces);
    m.position.y = h / 2;
  }
  const g = new THREE.Group(); g.add(m);
  g.position.set(...(P.at || [0, 0, 0])); g.rotation.y = (P.ry || 0) * D2R;
  g.userData.scenery = P;
  return g;
}

export function buildScenery(list = []) {
  const root = new THREE.Group();
  for (const P of list) {
    const R = P.repeat;
    if (!R) { root.add(piece(P)); continue; }
    const at = P.at || [0, 0, 0], st = R.step || [0, 0, 0];
    for (let i = 0; i < (R.n || 1); i++) root.add(piece({ ...P, at: [at[0] + st[0] * i, at[1] + st[1] * i, at[2] + st[2] * i], ry: (P.ry || 0) + (R.ry || 0) * i }));
  }
  return root;
}
