// Technical validation: NIKKE-style motion on single painted sprites (no Spine rig).
//   rig.js   body layer (weight shift, upper-body sway, breathing) -> part layer (head, hems, tassels, hair, tail, ears)
//   flesh.js soft-body lattice: the force travels hips -> butt -> thighs and dies at the knees; squash bulges sideways
//   atmo.js  shutter motion blur (one render per physics sub-step), breath vapour; environment extras (off by default)
//   sweat.js beads form on the skin, run down along it leaving a drying streak, and are gone; rig.js draws them + sheen + flush
import * as THREE from 'three';
import { rigMesh, Body } from './rig.js';
import { Atmo, Dust, Breath } from './atmo.js';
import { Sweat } from './sweat.js';

THREE.ColorManagement.enabled = false;
const rnd = (a, b) => a + Math.random() * (b - a);

// per pose: body centre line (u), shot origin, weapon feel
const POSES = {
  cat_cover: { anchor: 0.55 },
  cat_fire: { anchor: 0.48, muzzle: [0.92, 0.83], rate: 0.22, kick: 1.0, tick: 0.7, fx: 'fx_cat', fxScale: 0.13 },
  pink_cover: { anchor: 0.45 },
  pink_fire: { anchor: 0.45, muzzle: [0.9, 0.82], rate: 0.075, kick: 0.42, tick: 1.0, fx: 'fx_pink', fxScale: 0.14 },
};
const CANVAS = 1536; // every source pose shares this canvas, so source pixels are one common scale
const SUBSTEP = 1 / 240;

// ------------------------------------------------------------------ renderer / scenes (orthographic, pixel units, y up)
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.autoClear = false;
const baseScene = new THREE.Scene();   // background + props
const charScene = new THREE.Scene();   // girls, flashes, vapour, dust (motion blurred)
const cam = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);
const atmo = new Atmo(renderer);
let W = 1, H = 1;

const loader = new THREE.TextureLoader();
const load = (url, data = false) => new Promise((res) => loader.load(url, (t) => {
  t.colorSpace = THREE.NoColorSpace;
  if (data) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; } else t.anisotropy = 4;
  res(t);
}));

const SET = { amp: 0.35, ring: 0.6, rhythm: 1.6, sweat: 0.8, view: 0, slow: false, auto: false, cam: 'close', cover: true, atmo: false, blur: true, force: null };

class Girl {
  constructor(id, side, A, breath) {
    this.id = id; this.side = side; // -1 left (unmirrored), +1 right (mirrored)
    this.mirror = side > 0;
    this.meta = A.meta;
    this.breathFx = breath; this.A = A;
    this.exert = 0.3;
    this.group = new THREE.Group();
    charScene.add(this.group);
    this.poses = {};
    for (const p of ['cover', 'fire']) {
      const key = `${id}_${p}`;
      const m = rigMesh(A.tex[key], A.weights[key], A.rigs[key], A.flesh[key]);
      const sw = new Sweat(renderer, A.weights[key][0].image, m.userData.flesh, m.userData.ar);
      m.userData.sweat = sw; m.material.uniforms.SW.value = sw.rt.texture; m.material.uniforms.SWpx.value.copy(sw.px);
      m.renderOrder = 10; m.visible = p === 'cover';
      m.userData.key = key;
      this.group.add(m);
      this.poses[p] = m;
    }
    const fireP = POSES[`${id}_fire`];
    this.fx = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: A.tex[fireP.fx], transparent: true, depthTest: false }));
    this.fx.renderOrder = 12; this.fx.visible = false;
    this.fxAr = A.tex[fireP.fx].image.height / A.tex[fireP.fx].image.width;
    this.group.add(this.fx);
    this.pose = 'cover';
    this.out = false; this.fireCD = 0; this.fxT = 0;
    this.body = new Body();
    this.lastBreath = 0;
  }
  setOut(out) {
    if (out === this.out) return;
    this.out = out;
    const next = out ? 'fire' : 'cover';
    // instant swap (a cross-fade between two different drawings ghosts); the squash-pop and the shutter blur carry it
    this.poses[this.pose].visible = false;
    this.pose = next;
    this.poses[next].visible = true;
    this.body.pop(out, SET.amp);
    this.body.jolt(out ? 1.0 : 1.25, SET.amp);
    this.fireCD = 0.12;
  }
  shoot() {
    const P = POSES[`${this.id}_fire`];
    const dir = -this.side; // she shoots toward the centre; the kick shoves her outward
    this.body.recoil(dir, P.kick, SET.amp, P.tick);
    this.body.jolt(P.kick * 0.18, SET.amp);   // shots push the whole body (smooth); only a light jolt goes straight into the flesh
    this.fxT = P.rate < 0.1 ? 0.05 : 0.11;
    this.fx.visible = true;
    this.fx.rotation.z = rnd(-0.15, 0.15);
  }
  update(dt, t, layout) {
    if (this.out) {
      this.fireCD -= dt;
      const P = POSES[`${this.id}_fire`];
      if (this.fireCD <= 0) { this.fireCD += P.rate; this.shoot(); }
    }
    const b = this.body, sign = this.mirror ? -1 : 1;
    b.update(dt, t, SET.amp, SET.ring, this.out, SET.rhythm, this.exert);
    // exertion builds while she is out fighting, cools off in cover
    this.exert = Math.max(0, Math.min(1, this.exert + (this.out ? 0.16 : -0.04) * dt));
    const wet = SET.sweat * (0.45 + 0.55 * this.exert), flush = SET.sweat * (0.15 + 0.85 * this.exert);
    const kick = b.kick * 0.55; b.kick = 0;
    for (const p of Object.values(this.poses)) {
      const k = p.userData.key, h = this.meta[k].h / CANVAS * layout.canvasPx, w = h / p.userData.ar;
      const au = POSES[k].anchor;
      const sx = w * (1 - b.sq.x * 0.5), sy = w * (1 + b.sq.x);
      p.scale.set(this.mirror ? -sx : sx, sy, 1);
      p.position.set(-((this.mirror ? 1 - au : au) - 0.5) * w + b.ox.x * h, b.oy.x * h, 0);
      p.rotation.z = b.r.x;
      // the flesh of every pose keeps simulating, so a pose swap lands mid-motion instead of from rest
      const { B, X } = b.pose(sign, p.userData.ar);
      p.userData.flesh.step(dt, B, X, SET.amp, SET.ring, b.breath, kick, [b.pulse[0] * sign, b.pulse[1]]);
      b.apply(p, sign);
      const U = p.material.uniforms;
      U.showW.value = SET.view; U.wet.value = wet; U.flush.value = flush; U.time.value = t; U.mir.value = sign;
      if (p === this.poses[this.pose]) p.userData.sweat.step(dt, wet, kick);
      p.userData.sweat.apply(U);
    }
    this.group.position.set(layout.x, layout.ground, 0);
    const m = this.poses[this.pose];
    // breath vapour on every exhale (the breath cycle turning downward)
    if (this.lastBreath > 0.95 && b.breath <= 0.95) {
      const key = m.userData.key, mo = this.A.flesh[key].nose, ar = m.userData.ar;
      m.updateMatrixWorld(true);
      const pt = new THREE.Vector3(mo[0] - 0.5, mo[1] * ar, 0);
      m.localToWorld(pt);
      this.breathFx.puff(pt.x, pt.y, sign, H, this.exert);
    }
    this.lastBreath = b.breath;
    // muzzle flash
    if (this.fx.visible) {
      this.fxT -= dt;
      const fp = POSES[`${this.id}_fire`], fm = this.poses.fire, fk = fm.userData.key;
      const h = this.meta[fk].h / CANVAS * layout.canvasPx, w = h / fm.userData.ar;
      const mu = this.mirror ? 1 - fp.muzzle[0] : fp.muzzle[0];
      this.fx.position.set(fm.position.x + (mu - 0.5) * w, fm.position.y + fp.muzzle[1] * h, 0);
      const fw = layout.canvasPx * fp.fxScale;
      this.fx.scale.set(fw * (this.mirror ? -1 : 1), fw * this.fxAr, 1);
      if (this.fxT <= 0) this.fx.visible = false;
    }
  }
}

// ------------------------------------------------------------------ boot
async function main() {
  const names = ['cat_cover', 'cat_fire', 'pink_cover', 'pink_fire', 'cover_obj', 'fx_pink', 'fx_cat'];
  const poses = ['cat_cover', 'cat_fire', 'pink_cover', 'pink_fire'];
  const [meta, flesh, rigList, texList, wList, bgTex] = await Promise.all([
    fetch('jiggle/meta.json').then((r) => r.json()),
    fetch('jiggle/flesh.json').then((r) => r.json()),
    Promise.all(poses.map((p) => fetch(`jiggle/${p}_rig.json`).then((r) => r.json()))),
    Promise.all(names.map((n) => load(`jiggle/${n}.png`))),
    Promise.all(poses.map((p) => Promise.all([0, 1, 2, 3].map((i) => load(`jiggle/${p}_w${i}.png`, true))))),
    load('assets/bg/yard_calm.webp'),
  ]);
  const tex = Object.fromEntries(names.map((n, i) => [n, texList[i]]));
  const A = { meta, tex, flesh, rigs: Object.fromEntries(poses.map((p, i) => [p, rigList[i]])), weights: Object.fromEntries(poses.map((p, i) => [p, wList[i]])) };
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: bgTex, color: 0xc0b0c4 }));
  baseScene.add(bg);
  const covers = [0, 1].map(() => { const c = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex.cover_obj, transparent: true, depthTest: false })); c.renderOrder = 5; baseScene.add(c); return c; });
  const breath = new Breath(charScene);
  const dust = new Dust();
  charScene.add(dust.points);
  const girls = [new Girl('cat', -1, A, breath), new Girl('pink', 1, A, breath)];

  function layoutFor(i) {
    // close-up: a full-height canvas fills ~95% of the screen; game framing: ~60% (full body, feet on the ground line)
    const canvasPx = H * (SET.cam === 'close' ? 0.95 : 0.6);
    const xs = SET.cam === 'close' ? [0.3, 0.7] : [0.24, 0.76];
    return { canvasPx, x: W * xs[i], ground: H * 0.015 };
  }
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false);
    atmo.setSize(W, H);
    cam.right = W; cam.top = H; cam.updateProjectionMatrix();
    const ar = bgTex.image.width / bgTex.image.height, s = Math.max(W / ar, H);
    bg.scale.set(s * ar, s, 1); bg.position.set(W / 2, H / 2, 0);
    // where the sun is in the painting (uv of the background texture -> screen uv)
    const su = 0.075, sv = 0.63;
    atmo.comp.uniforms.sun.value.set((W / 2 + (su - 0.5) * s * ar) / W, (H / 2 + (sv - 0.5) * s) / H);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------------------------------------------------------------- input + UI
  let down = false;
  canvas.addEventListener('pointerdown', (e) => { if (e.button === 0) down = true; });
  window.addEventListener('pointerup', () => { down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  const $ = (id) => document.getElementById(id);
  const VIEW = ['显示：正常', '显示：部件区域', '显示：肉感热力图'];
  function refresh() {
    $('auto').classList.toggle('on', SET.auto); $('slow').classList.toggle('on', SET.slow);
    $('regions').textContent = VIEW[SET.view]; $('regions').classList.toggle('on', SET.view > 0);
    $('cam').textContent = `镜头：${SET.cam === 'close' ? '特写' : '游戏站位'}`;
    $('cover').textContent = `掩体：${SET.cover ? '开' : '关'}`; $('cover').classList.toggle('on', SET.cover);
    $('atmo').textContent = `环境氛围：${SET.atmo ? '开' : '关'}`; $('atmo').classList.toggle('on', SET.atmo);
    $('blur').textContent = `动态模糊：${SET.blur ? '开' : '关'}`; $('blur').classList.toggle('on', SET.blur);
    $('ampv').textContent = SET.amp.toFixed(2); $('rhythmv').textContent = `${SET.rhythm.toFixed(2)} Hz`; $('sweatv').textContent = SET.sweat.toFixed(2);
  }
  const btn = (id, fn) => { $(id).onclick = () => { fn(); refresh(); }; };
  btn('auto', () => { SET.auto = !SET.auto; });
  btn('slow', () => { SET.slow = !SET.slow; });
  btn('regions', () => { SET.view = (SET.view + 1) % 3; });
  btn('cam', () => { SET.cam = SET.cam === 'close' ? 'game' : 'close'; });
  btn('cover', () => { SET.cover = !SET.cover; });
  btn('atmo', () => { SET.atmo = !SET.atmo; });
  btn('blur', () => { SET.blur = !SET.blur; });
  $('amp').oninput = (e) => { SET.amp = +e.target.value; refresh(); };
  $('rhythm').oninput = (e) => { SET.rhythm = +e.target.value; refresh(); };
  $('sweat').oninput = (e) => { SET.sweat = +e.target.value; refresh(); };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { SET.auto = !SET.auto; refresh(); e.preventDefault(); }
    if (e.code === 'KeyH') $('ui').classList.toggle('min');
  });
  const q = new URLSearchParams(location.search);
  if (q.has('auto')) SET.auto = true;
  if (q.has('game')) SET.cam = 'game';
  if (q.has('view')) SET.view = +q.get('view');
  if (q.has('atmo')) SET.atmo = true;
  if (q.has('hideui')) $('ui').style.display = 'none';
  refresh();

  // ---------------------------------------------------------------- loop: fixed physics sub-steps, one render sample each
  let time = 0, last = performance.now(), acc = 0;
  function step(dt) {
    acc += dt;
    const n = Math.max(1, Math.round(acc / SUBSTEP));
    acc -= n * SUBSTEP;
    for (const g of girls) for (const p of Object.values(g.poses)) p.userData.sweat.render(n * SUBSTEP);
    atmo.beginFrame();
    const samples = SET.blur ? Math.min(n, 4) : 1;
    for (let k = 0; k < n; k++) {
      time += SUBSTEP;
      const out = SET.force ?? (SET.auto ? (time % 3.2) < 1.9 : down);
      girls.forEach((g, i) => {
        g.setOut(out);
        const L = layoutFor(i);
        const cv = covers[i];
        cv.visible = SET.cover;
        const ch = L.canvasPx * 0.55, cw = ch * tex.cover_obj.image.width / tex.cover_obj.image.height;
        cv.scale.set(cw, ch, 1);
        cv.position.set(L.x + (i ? -1 : 1) * L.canvasPx * 0.12, L.ground + L.canvasPx * 0.16 + ch / 2, 0);
        g.update(SUBSTEP, time, L);
      });
      breath.update(SUBSTEP);
      dust.update(SUBSTEP, time, W, H, renderer.getPixelRatio());
      dust.points.visible = SET.atmo;
      // shutter: sample the last `samples` sub-steps of this frame
      if (k >= n - samples) atmo.sample(charScene, cam, 1 / samples);
    }
    atmo.endFrame(baseScene, cam, time, SET.atmo);
  }
  function frame() {
    const now = performance.now();
    let dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (SET.slow) dt *= 0.25;
    step(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // for recording: fixed-step frames
  window.__J = { step: (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) step(dt); }, SET, girls, canvas };
}
main();
