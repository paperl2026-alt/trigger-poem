// 2.5D scene test (docs/DESIGN.md "场景的 3D 感"): a painted plate is pushed out along its Depth Anything depth into a real
// 3D surface, and the near cover pieces get their own relief meshes in front of it. When the camera moves (mouse, or the
// lean-out of firing from cover: hold the left button) everything shifts with true parallax. Data: tools/depth_mesh.py ->
// public/proto/<scene>/. "平面" shows the same painting on a flat card for comparison.
import * as THREE from 'three';

const BASE = `${import.meta.env.BASE_URL || '/'}proto/`;
const params = new URLSearchParams(location.search);
const SCENE = params.get('scene') || 'corridor';
// ?auto=1: a scripted camera sweep (for recordings); ?flat=1: the flat card for comparison
const AUTO = params.get('auto') === '1';
const opt = { near: 1.4, far: 15, fov: 52, move: 0.6, sway: true, flat: false, light: true, tear: 1.35, crop: 0.9 };

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x120c14);
const cam = new THREE.PerspectiveCamera(opt.fov, 16 / 9, 0.05, 200);
const amb = new THREE.AmbientLight(0xffffff, 0.75); scene.add(amb);
const sun = new THREE.PointLight(0xffd6a0, 6, 12, 1.4); scene.add(sun);

const loadTex = (u) => new Promise((ok) => new THREE.TextureLoader().load(u, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; ok(t); }));
const loadBin = async (u) => new Float32Array(await (await fetch(u)).arrayBuffer());

let S, plateMesh, back, covers = [];
// a vertex of the painting at pixel (px, py) with inverse depth d, put where the painting's camera saw it
function place(px, py, d, out) {
  const [W, H] = S.size, t = Math.tan((opt.fov * Math.PI) / 360);
  const inv = 1 / opt.far + Math.max(0, d) * (1 / opt.near - 1 / opt.far), z = opt.flat ? 9 : 1 / inv;
  out[0] = ((px / (W - 1)) - 0.5) * 2 * t * (W / H) * z;
  out[1] = (0.5 - py / (H - 1)) * 2 * t * z;
  out[2] = -z;
}
function surface(depth, dims, x0, y0, mat) {
  const [gw, gh] = dims, g = S.grid, pos = new Float32Array(gw * gh * 3), uv = new Float32Array(gw * gh * 2), v = [0, 0, 0];
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const k = j * gw + i; place(x0 + i * g, y0 + j * g, depth[k], v);
    pos.set(v, k * 3); uv[k * 2] = i / (gw - 1); uv[k * 2 + 1] = 1 - j / (gh - 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(tris(pos, gw, gh));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat); m.userData = { depth, dims, x0, y0 };
  return m;
}
// triangles of the grid, leaving out those across a depth jump (the far side shows through to the backdrop instead of a smear)
function tris(pos, gw, gh, tear = opt.tear) {
  const arr = pos.array || pos, idx = [], z = (k) => -arr[k * 3 + 2], ok = (...k) => { const zs = k.map(z); return Math.max(...zs) / Math.min(...zs) < tear; };
  for (let j = 0; j < gh - 1; j++) for (let i = 0; i < gw - 1; i++) {
    const a = j * gw + i, b = a + 1, c = a + gw, e = c + 1;
    if (opt.flat || ok(a, c, b)) idx.push(a, c, b);
    if (opt.flat || ok(b, c, e)) idx.push(b, c, e);
  }
  return idx;
}
function rebuild() {
  for (const m of [plateMesh, ...covers]) {
    const { depth, dims, x0, y0 } = m.userData, pos = m.geometry.attributes.position, [gw, gh] = dims, g = S.grid, v = [0, 0, 0];
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const k = j * gw + i; place(x0 + i * g, y0 + j * g, depth[k] + (m === plateMesh ? 0 : 0.002), v); pos.setXYZ(k, v[0], v[1], v[2]); }
    // the plate stays whole (a window frame smears a little instead of showing a doubled window); covers tear at their outline
    pos.needsUpdate = true; m.geometry.setIndex(tris(pos, gw, gh, m === plateMesh ? Infinity : opt.tear)); m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere();
  }
  // the backdrop: the same painting, flat, just behind the farthest point, so a tear shows roughly what lies behind it
  const t = Math.tan((opt.fov * Math.PI) / 360), z = opt.flat ? 9.5 : opt.far * 1.05;
  back.scale.set(2 * t * (S.size[0] / S.size[1]) * z * 1.15, 2 * t * z * 1.15, 1); back.position.set(0, 0, -z);
  cam.fov = 2 * Math.atan(Math.tan((opt.fov * Math.PI) / 360) * opt.crop) * 180 / Math.PI; cam.updateProjectionMatrix();   // a little zoomed in: the edges never show
}

async function boot() {
  S = await (await fetch(`${BASE}${SCENE}/scene.json`)).json();
  const P = S.plate;
  const tex = await loadTex(`${BASE}${SCENE}/${P.img}`);
  plateMesh = surface(await loadBin(`${BASE}${SCENE}/${P.depth}`), P.dims, 0, 0, new THREE.MeshBasicMaterial({ map: tex }));
  scene.add(plateMesh);
  back = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, color: 0xb8a8b0 })); back.renderOrder = -5; scene.add(back);
  for (const c of S.covers) {
    const t = await loadTex(`${BASE}${SCENE}/${c.img}`);
    const mat = new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.35, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.55 });
    const m = surface(await loadBin(`${BASE}${SCENE}/${c.depth}`), c.dims, c.box[0], c.box[1], mat);
    m.renderOrder = 2; covers.push(m); scene.add(m);
  }
  if (params.get('flat') === '1') opt.flat = true;
  rebuild(); ui(); resize(); requestAnimationFrame(loop);
  window.__sceneReady = true;
}

// camera: still = exactly the painting's view; the mouse and the lean-out move it, and it keeps looking at the middle distance
const mouse = { x: 0, y: 0 }; let lean = 0, leanT = 0, t0 = performance.now();
canvas.addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1; });
canvas.addEventListener('pointerdown', () => { leanT = 1; });
addEventListener('pointerup', () => { leanT = 0; });
function loop(now) {
  const t = (now - t0) / 1000;
  if (AUTO) { const u = t * 0.9; mouse.x = Math.sin(u) * 0.9; mouse.y = Math.sin(u * 0.5) * 0.4; leanT = Math.sin(u * 0.5 + 1) > 0.3 ? 1 : 0; }
  lean += (leanT - lean) * 0.12;
  const k = opt.move, sx = opt.sway ? Math.sin(t * 0.7) * 0.05 : 0, sy = opt.sway ? Math.sin(t * 1.1) * 0.02 : 0;
  // leaning out of cover: up and to the side, like the game's fire pose
  cam.position.set((mouse.x * 0.35 + sx + lean * 0.45) * k, (-mouse.y * 0.15 + sy + lean * 0.22) * k, (lean * -0.15) * k);
  cam.lookAt(cam.position.x * 0.15, cam.position.y * 0.15, -9);
  sun.position.set(Math.sin(t * 0.6) * 1.6, 0.6 + Math.cos(t * 0.4) * 0.4, -2.6);
  sun.intensity = opt.light ? 6 : 0;
  renderer.render(scene, cam);
  requestAnimationFrame(loop);
}
function resize() {
  const w = innerWidth, h = innerHeight, a = 16 / 9;
  let cw = w, ch = w / a; if (ch > h) { ch = h; cw = h * a; }
  renderer.setSize(cw, ch, false); Object.assign(canvas.style, { width: `${cw}px`, height: `${ch}px`, left: `${(w - cw) / 2}px`, top: `${(h - ch) / 2}px` });
  cam.aspect = a; cam.updateProjectionMatrix();
}
addEventListener('resize', resize);

function ui() {
  const el = document.getElementById('ui');
  el.innerHTML = `<h1>2.5D 场景验证</h1><p>原画按深度模型推成立体网格；近处掩体单独成型。移动鼠标看视差，按住左键 = 探身射击时的镜头。</p>`;
  const slider = (label, key, min, max, step) => {
    const l = document.createElement('label'); l.innerHTML = `<span>${label}</span>`;
    const r = Object.assign(document.createElement('input'), { type: 'range', min, max, step, value: opt[key] });
    r.oninput = () => { opt[key] = +r.value; rebuild(); };
    l.appendChild(r); el.appendChild(l);
  };
  slider('最近距离', 'near', 0.6, 4, 0.1); slider('断开阈值', 'tear', 1.05, 3, 0.05); slider('最远距离', 'far', 8, 60, 1); slider('视角', 'fov', 35, 75, 1); slider('镜头移动幅度', 'move', 0, 2, 0.05);
  const row = document.createElement('div'); row.className = 'row'; el.appendChild(row);
  const tog = (label, key, then) => { const b = document.createElement('button'); b.textContent = label; b.classList.toggle('on', opt[key]); b.onclick = () => { opt[key] = !opt[key]; b.classList.toggle('on', opt[key]); then && then(); }; row.appendChild(b); };
  tog('晃动', 'sway'); tog('平面（对比）', 'flat', rebuild); tog('掩体受光', 'light');
  const m = document.createElement('button'); m.textContent = '收起'; m.onclick = () => el.classList.toggle('min'); row.appendChild(m);
}
boot();
