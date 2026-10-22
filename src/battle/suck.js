// Sucked into the oven (user 2026-10-22: at the end of the oven kitchen the girls did not walk up and crawl into the oven - the oven
// door bursts open and pulls them in, no girls on screen, then the comic of them falling): a stop's exit { suck: { door } } instead of a
// walk. The camera comes round to face the great oven painted on the end wall (PanelWorld.endBoard); its iron door - cut out of that
// very picture (door: the door's box on it, 0..1 from the top left, per picture) - bangs open in two leaves onto a turning vortex of
// dark honey and fire; flour, crumbs and sparks stream past into it, the view shakes harder and harder and is dragged in, to black.
// The girls and the HUD are out of the frame meanwhile (cineOn, lull); then(): the next step (the comic).
import * as THREE from 'three';
import { sfx } from '../core/audio.js';
import { Ease } from '../core/tween.js';

let VORTEX = null;
function vortexTex() {   // a whirl of dark honey and embers into black: many soft streaks, blurred, glowing at the rim
  if (VORTEX) return VORTEX;
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  const R = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  R.addColorStop(0, '#000'); R.addColorStop(0.3, '#080200'); R.addColorStop(0.7, '#3a1204'); R.addColorStop(0.92, '#a8400c'); R.addColorStop(1, 'rgba(168,64,12,0)');
  g.fillStyle = R; g.fillRect(0, 0, S, S);
  g.translate(S / 2, S / 2); g.filter = 'blur(2.5px)'; g.lineCap = 'round';
  const COLS = ['rgba(255,170,60,', 'rgba(232,120,30,', 'rgba(200,140,40,', 'rgba(255,210,120,'];
  for (let n = 0; n < 34; n++) {   // (streaks of different lengths, starting at different radii, all curling in)
    const a0 = Math.random() * Math.PI * 2, r0 = S * (0.2 + Math.random() * 0.28), turn = 1.2 + Math.random() * 1.6, len = 0.35 + Math.random() * 0.5;
    g.beginPath();
    for (let i = 0; i <= 40; i++) { const k = i / 40 * len, a = a0 + k * turn * Math.PI, r = r0 * (1 - k * 0.85); const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    const al = 0.25 + Math.random() * 0.5; g.strokeStyle = COLS[n % COLS.length] + al + ')'; g.lineWidth = 2 + Math.random() * 7; g.stroke();
  }
  g.filter = 'none';
  const H = g.createRadialGradient(0, 0, 0, 0, 0, S * 0.22); H.addColorStop(0, 'rgba(0,0,0,1)'); H.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = H; g.beginPath(); g.arc(0, 0, S * 0.22, 0, Math.PI * 2); g.fill();   // (its middle: nothing, a hole)
  VORTEX = new THREE.CanvasTexture(c); VORTEX.colorSpace = THREE.SRGBColorSpace;
  return VORTEX;
}

export function suckInto(G, spec, then) {
  const w = G.world, H = w.set.hall, E = w.endBoard;
  if (!E || !w.camPos) { then(); return; }
  const key = (E.userData.texKey || '').replace(/_x$/, ''), box = spec.door?.[key] || [0.39, 0.35, 0.61, 0.63];   // (its rotten picture: the same oven)
  const W = H.x1 - H.x0, h = H.h, z = H.z1, X = (u) => H.x0 + u * W, Y = (v) => h * (1 - v);
  const mx = (X(box[0]) + X(box[2])) / 2, my = (Y(box[1]) + Y(box[3])) / 2, dw = X(box[2]) - X(box[0]), dh = Y(box[1]) - Y(box[3]);
  const mouth = new THREE.Vector3(mx, my, z), root = new THREE.Group(); w.scene.add(root);
  G.cineOn = true; G.cinePause = true; G.lull = true; G.cineSubject = null;
  w.dropCovers?.();
  // the vortex behind the door, the two leaves of the door cut from the end wall's picture, hinged at their outer edges
  const vx = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48), new THREE.MeshBasicMaterial({ map: vortexTex(), transparent: true, depthWrite: false, fog: false }));
  const vg = new THREE.Group(); vg.position.set(mx, my, z + 0.04); vg.scale.set(dw * 0.02, dh * 0.02, 1); vg.add(vx); root.add(vg);   // (the group: the doorway's shape; the spiral turns inside it)
  const leaves = [-1, 1].map((sd) => {
    const geo = new THREE.PlaneGeometry(dw / 2, dh), uv = geo.attributes.uv;
    const u0 = sd < 0 ? box[0] : (box[0] + box[2]) / 2, u1 = sd < 0 ? (box[0] + box[2]) / 2 : box[2];
    for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), 1 - box[3] + uv.getY(i) * (box[3] - box[1]));
    geo.translate(-sd * dw / 4, 0, 0);   // (its hinge at the outer edge: the group turns about it)
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: E.material.map, side: THREE.DoubleSide, fog: true }));
    const hinge = new THREE.Group(); hinge.position.set(mx + sd * dw / 2, my, z + 0.07); hinge.add(m); root.add(hinge);
    return { hinge, sd };
  });
  // the camera comes round to face it
  const c0 = w.camPos.clone(), l0 = w.lookAt.clone(), front = new THREE.Vector3(mx, Math.max(1.5, my - 0.1), z + Math.max(3.2, dw * 2.1));   // (close: the oven most of the picture)
  G.tweens.run(1.1, (e) => { w.camPos.lerpVectors(c0, front, e); w.lookAt.lerpVectors(l0, mouth, e); }, { ease: Ease.inOutCubic, onDone: burst });
  function burst() {
    (sfx.slam || sfx.thud)(0); sfx.roar?.(); G.post.shake(1.6); G.post.flash(0.5, 0xffa040);
    for (const { hinge, sd } of leaves) G.tweens.to(hinge.rotation, { y: sd * 1.95 }, 0.3, { ease: Ease.outBack });
    G.tweens.run(0.45, (e) => vg.scale.set(dw * (0.02 + 0.98 * e), dh * (0.02 + 0.98 * e), 1), { ease: Ease.outCubic });
    G.fx.puff(mouth, 14, 0xf0e2c8, 1.6);
    stream(); G.tweens.wait(0.45, pull);
  }
  // flour, crumbs and sparks from all round the room, pulled into the mouth
  const bits = [], COLS = [0xf6eee0, 0xf6eee0, 0x8a5a2e, 0xffa040, 0xd09048];
  function stream() {
    for (let i = 0; i < 90; i++) G.tweens.wait(i * 0.028, () => {
      const s = 0.04 + Math.random() * 0.09, m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: COLS[i % COLS.length], transparent: true, depthWrite: false }));
      const a = Math.random() * Math.PI * 2, r = 1.2 + Math.random() * 3.2;
      const p0 = new THREE.Vector3(mx + Math.cos(a) * r * 1.4, Math.max(0.2, my + Math.sin(a) * r * 0.8), z + 1.5 + Math.random() * 6.5);
      m.position.copy(p0); root.add(m); bits.push(m);
      const d = 0.5 + Math.random() * 0.6, spin = (Math.random() - 0.5) * 20;
      G.tweens.run(d, (e) => { m.position.lerpVectors(p0, mouth, e * e); m.rotation.z += spin * 0.016; m.lookAt(w.camera.position); m.scale.setScalar(1 - e * 0.8); }, { onDone: () => { m.visible = false; } });
    });
  }
  // dragged in: slowly, then faster and faster, shaking, the view rolling, into the dark
  function pull() {
    const p0 = w.camPos.clone(), p1 = new THREE.Vector3(mx, my, z + 0.35); let shook = 0;
    sfx.whoosh?.(0);
    G.tweens.run(2.6, (e) => {
      w.camPos.lerpVectors(p0, p1, e * e * e); w.lookAt.copy(mouth);
      w.fovKick = Math.sin(e * 30) * 6 * e;
      vx.rotation.z -= 0.08 + e * 0.25;
      if ((shook += 1) % 9 === 0) { G.post.shake(0.4 + e * 1.2); if (e > 0.4) sfx.whoosh?.(0); }
    }, { onDone: () => {
      G.tweens.to(G.post.u.wipe, { value: 1 }, 0.25, { onDone: () => {
        w.fovKick = 0;
        root.removeFromParent(); for (const b of bits) { b.geometry.dispose(); b.material.dispose(); }
        for (const m of [vx]) { m.geometry.dispose(); m.material.dispose(); }
        G.cineOn = false; G.cinePause = false; G.lull = false;
        then();
      } });
    } });
  }
}
