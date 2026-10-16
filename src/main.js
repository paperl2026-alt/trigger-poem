import * as THREE from 'three';
import './fonts/fonts.css';
import { loadContent, C, T } from './core/content.js';
import { loadAll, setRenderer } from './engine/assets.js';
import { Tweens } from './engine/tween.js';
import { Post } from './engine/post.js';
import { initAudio, sfx } from './engine/audio.js';
import { Game } from './game/game.js';
import { showTitle, showSelect, showResults, showGameOver } from './game/screens.js';
import { SAVE, initSave } from './game/save.js';
import { initLang } from './game/i18n.js';
import { initTheme } from './game/fx.js';
import { DBG, mountDebug } from './game/debug.js';
import { SET, saveSettings, mountSettings, initSettings } from './game/settings.js';
import { HybridCtrl, PadBook, PAD } from './game/input.js';

THREE.ColorManagement.enabled = false;
window.__errs = [];
const noteErr = (m) => { if (window.__errs.length < 20) { window.__errs.push(String(m)); document.documentElement.dataset.errs = window.__errs.join(' | '); } };
window.addEventListener('error', (e) => noteErr(e.message));
window.addEventListener('unhandledrejection', (e) => noteErr(e.reason && (e.reason.stack || e.reason.message) || e.reason));

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setClearColor(0x120814, 1);
renderer.autoClear = false;
setRenderer(renderer);

const G = {
  renderer,
  post: new Post(renderer),
  tweens: new Tweens(),
  W: 1, H: 1, dpr: 1, frame: { x: 0, w: 1 },
  time: 0, hitstop: 0,
  pointer: { x: 0, y: 0, down: false, active: false, touch: false, moved: false },
  keys: {},
  paused: false, slow: 1, god: false, auto: false,
  build: typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev',
  game: null,
  padBook: new PadBook(), padCount: 0, p2pad: null,
  stop(s) { this.hitstop = Math.max(this.hitstop, s); },
};
G.p1ctrl = new HybridCtrl(G);
window.__G = G; // debug handle for automated checks

// Any window size / aspect: the 3D view widens (panorama), the HUD + characters stay inside the HUD frame.
function resize() {
  if (!G.ready) return; // settings + layout come from the content packs
  const w = window.innerWidth, h = window.innerHeight;
  G.dpr = Math.max(0.5, Math.min(2.5, Math.min(2, window.devicePixelRatio || 1) * SET.scale));
  renderer.setPixelRatio(G.dpr);
  renderer.setSize(w, h, false);
  G.post.setSize(w, h, G.dpr);
  G.W = w; G.H = h;
  const lim = T.layout.hudFrame[SET.hud] ?? 99;
  const fw = Math.min(w, h * lim);
  G.frame = { x: (w - fw) / 2, w: fw };
  const hud = document.getElementById('hud');
  hud.style.left = `${G.frame.x}px`; hud.style.width = `${fw}px`;
  if (G.game) G.game.layout(w, h);
}
window.addEventListener('resize', resize);

// ---- mouse / keyboard (1P) ----
const P = G.pointer;
let activeId = null;
const setPos = (e) => { P.x = e.clientX; P.y = e.clientY; P.active = true; P.moved = true; };
canvas.addEventListener('pointerdown', (e) => {
  initAudio();
  P.touch = e.pointerType !== 'mouse';
  if (e.pointerType === 'mouse' && e.button === 2) { G.p1ctrl.skillQ = true; setPos(e); return; }
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (activeId !== null && activeId !== e.pointerId) return;
  activeId = e.pointerId;
  canvas.setPointerCapture(e.pointerId);
  setPos(e);
  P.down = true;
  e.preventDefault();
});
canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || activeId === e.pointerId) setPos(e); });
const up = (e) => { if (activeId !== e.pointerId) return; activeId = null; P.down = false; };
canvas.addEventListener('pointerup', up);
canvas.addEventListener('pointercancel', up);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
const GAME_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Enter'];
window.addEventListener('keydown', (e) => {
  G.keys[e.code] = true;
  if (G.game && GAME_KEYS.includes(e.code)) e.preventDefault();
  if (!G.game && G.select && !e.repeat) { // chapter select: arrows flip pages, Enter departs
    if (e.code === 'ArrowLeft') G.select.flip(-1);
    if (e.code === 'ArrowRight') G.select.flip(1);
    if (e.code === 'Enter') G.select.go();
  }
});
window.addEventListener('keyup', (e) => { G.keys[e.code] = false; });
window.addEventListener('blur', () => { G.keys = {}; P.down = false; });

// ---- flow: Title(+settings) -> Chapter select(+team/bag) -> Episode run -> Results -> Chapter select ----
function resetFx() {
  G.tweens.clear();
  G.post.u.wipe.value = 0;
  G.post.u.madness.value = 0;
  G.post.u.warn.value = 0;
  G.post.u.dim.value = 0;
}
function startRun(epId = 'ep0', step = 0) {
  G.skipComics = DBG.skip;
  G.titleStart = null; G.select = null;
  document.getElementById('ui').innerHTML = '';
  if (G.game) G.game.dispose();
  resetFx();
  const ep = C.episodes[epId] || C.episodes.ep0;
  G.game = new Game(G, { ep, team: [...SAVE.team], bag: [...SAVE.bag] });
  G.game.start(step);
}
function endRun() { if (G.game) { G.game.dispose(); G.game = null; } resetFx(); }
function toTitle() {
  endRun();
  G.select = null;
  G.titleStart = () => { initAudio(); toSelect(); };
  showTitle(G.titleStart, { settings: () => settings.open() });
}
function toSelect() {
  endRun();
  G.titleStart = null;
  G.select = showSelect({ title: toTitle, settings: () => settings.open(), play: (id) => { initAudio(); startRun(id); } });
}
G.showResults = (st) => { G.game.hud.show(false); const done = () => toSelect(); endRun(); showResults(st, done); };
G.showGameOver = (st) => {
  G.game.hud.show(false);
  const ep = G.game.ep.id;
  showGameOver(st, () => startRun(ep, st.checkpoint), toSelect);
};

let settings = null, dbg = null;
function setP2(mode) {
  SET.p2 = mode; saveSettings();
  if (G.game) G.game.applyP2();
}
// Gamepads: the first pad that plays becomes 1P's pad (Steam Deck / couch); START on another pad takes over the AI as 2P.
function handlePads(pads) {
  G.padCount = pads.length;
  for (const pd of pads) {
    const i = pd.gp.index;
    const isP1 = G.p1ctrl.pad === i, isP2 = SET.p2 === 'pad' && G.p2pad === i;
    if (!G.game && G.titleStart && (pd.pressed(PAD.A) || pd.pressed(PAD.START))) { if (G.p1ctrl.pad === null) G.p1ctrl.pad = i; G.titleStart(); return; }
    if (!G.game && G.select) { // chapter select on a pad: LB/RB flip, A departs
      if (pd.pressed(PAD.LB)) G.select.flip(-1);
      if (pd.pressed(PAD.RB)) G.select.flip(1);
      if (pd.pressed(PAD.A)) { if (G.p1ctrl.pad === null) G.p1ctrl.pad = i; G.select.go(); return; }
    }
    if (pd.pressed(PAD.START)) {
      if (isP1 || isP2) { settings.toggle(); continue; }
      if (G.game && SET.p2 !== 'pad') { G.p2pad = i; setP2('pad'); sfx.clear(); G.game.hud.showBanner('2P!', 'clear', 0.9); continue; }
      if (G.p1ctrl.pad === null) { G.p1ctrl.pad = i; continue; }
    } else if (!isP1 && !isP2 && G.p1ctrl.pad === null && (pd.pressed(PAD.A) || pd.held(PAD.RT))) G.p1ctrl.pad = i;
  }
}
window.addEventListener('gamepaddisconnected', (e) => { if (G.p1ctrl.pad === e.gamepad.index) G.p1ctrl.pad = null; });

// ---- loop ----
let last = performance.now(), lastRaf = last;
function tick() {
  const now = performance.now();
  const raw = Math.min(0.05, (now - last) / 1000);
  last = now;
  let dt = raw * G.slow;
  if (G.hitstop > 0) { G.hitstop -= raw; dt *= 0.08; }
  if (G.paused) dt = 0;
  step(dt, G.paused ? 0 : raw);
  dbg && dbg.frame();
}
function frame() { lastRaf = performance.now(); tick(); requestAnimationFrame(frame); }
function step(dt, raw) {
  const pads = G.padBook.poll();
  if (settings) handlePads(pads);
  G.time += dt;
  G.tweens.update(dt);
  if (G.game) G.game.update(dt, G.time, pads);
  G.post.update(raw);
  G.post.render(() => { if (G.game) G.game.render(renderer); });
}
// fallback driver when rAF is throttled (background / embedded previews)
setInterval(() => { if (performance.now() - lastRaf > 100) tick(); }, 16);
G.step = (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) step(dt, dt); };
G.shot = async (name = 'shot') => {
  G.post.render(() => { if (G.game) G.game.render(renderer); });
  const data = canvas.toDataURL('image/png');
  await fetch(`/__shot?name=${encodeURIComponent(name)}`, { method: 'POST', body: data });
  return name;
};

async function boot() {
  const bar = document.getElementById('loadbar');
  // 1) content packs (base + mods): every number, text, level and the image list; 2) everything that reads them
  await loadContent(import.meta.env.BASE_URL || './');
  initSettings(); initSave(); initLang(); initTheme();
  G.content = C; // debug handle
  G.ready = true;
  resize();
  await loadAll((p) => { bar.style.width = `${Math.round(p * 100)}%`; });
  await document.fonts?.ready;
  document.getElementById('loading').remove();
  const q = new URLSearchParams(location.search);
  const act = {
    start: (ep, step) => { initAudio(); startRun(ep, step); },
    title: toTitle,
    select: toSelect,
    resize,
    setP2,
    setAuto: () => G.game && G.game.assignControllers(),
    killAll: () => { for (const a of G.game?.actors || []) if (a.alive && a !== G.game.boss && a.hitMeshes().length) a.hit({ kind: 'rifle', dmg: 9999, uv: { u: 0.5, v: 0.6 }, crit: true }); },
  };
  dbg = mountDebug(G, act);
  settings = mountSettings(G, { ...act, debug: () => dbg.open() });
  const gear = document.createElement('button');
  gear.id = 'dbg-btn'; gear.textContent = '⚙';
  gear.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); settings.toggle(); };
  document.body.appendChild(gear);
  if (q.has('auto')) G.auto = true;
  if (q.has('skip')) G.forceSkip = true;
  if (q.has('play') || q.has('ep') || q.has('step')) {
    if (q.has('skip')) DBG.skip = true;
    startRun(q.get('ep') || 'ep0', +(q.get('step') || 0));
  } else if (q.has('select')) toSelect();
  else toTitle();
  requestAnimationFrame(frame);
}
boot();
