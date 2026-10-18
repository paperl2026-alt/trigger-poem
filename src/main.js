import * as THREE from 'three';
import './fonts/fonts.css';
import { loadContent, C, T } from './core/content.js';
import { setManifest, loadKeys, isLoaded, releaseExcept, setRenderer, vramMB, tex, loadLog } from './core/assets.js';
import { coreKeys, stageKeys, stageFrom, stageAt } from './core/groups.js';
import { Tweens } from './core/tween.js';
import { Post } from './core/post.js';
import { initAudio, sfx } from './core/audio.js';
import { Game } from './battle/game.js';
import { showResults } from './ui/screens.js';
import { showSelect } from './ui/select.js';
import { mangaTurn } from './ui/manga.js';
import { showTitle } from './ui/title.js';
import { initCursor, cursorScene } from './ui/cursor.js';
import { SAVE, initSave } from './core/save.js';
import { initLang } from './core/i18n.js';
import { initTheme } from './battle/fx.js';
import { DBG, mountDebug } from './core/debug.js';
import { SET, saveSettings, mountSettings, initSettings } from './core/settings.js';
import { HybridCtrl, PadBook, PAD } from './core/input.js';

THREE.ColorManagement.enabled = false;
window.__errs = [];
const noteErr = (m) => { if (window.__errs.length < 20) { window.__errs.push(String(m)); document.documentElement.dataset.errs = window.__errs.join(' | '); } };
window.addEventListener('error', (e) => noteErr(e.error && e.error.stack ? `${e.message} @ ${e.error.stack.split(String.fromCharCode(10)).slice(1, 4).join(' / ')}` : e.message));   // where it broke, for the self-test
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
G.renderer = renderer; G.vramMB = vramMB; G.texCount = () => Object.keys(tex).length; G.loadLog = loadLog;   // (tools/node/playthrough.cjs: memory checks)
G.audioOn = () => initAudio();   // (tools/node/playthrough.cjs: sound without a click)

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
  if (!G.game && G.titleStart && !e.repeat && (e.code === 'Enter' || e.code === 'Space')) G.titleStart(); // title: Enter / Space starts
  if (!G.game && G.select && !e.repeat) { // chapter select: arrows flip pages, Enter departs
    if (e.code === 'ArrowLeft') G.select.flip(-1);
    if (e.code === 'ArrowRight') G.select.flip(1);
    if (e.code === 'Enter') G.select.go();
    if (e.code === 'ArrowUp') G.select.step?.(-1);
    if (e.code === 'ArrowDown') G.select.step?.(1);
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
// the menu screen currently shown (title has a frame loop of its own to stop)
let screenApi = null;
function clearScreen() { if (screenApi && screenApi.dispose) screenApi.dispose(); screenApi = null; }
// a stage's pictures (src/core/groups.js): what is not loaded yet is loaded behind the loading bar, then everything else is released
// (only the core + this stage stay: memory does not grow with the number of chapters)
function needPics(keys, then) {
  const go = () => { releaseExcept(keys); then(); };
  if (isLoaded(keys)) { go(); return; }
  const box = document.createElement('div'); box.id = 'loading'; box.innerHTML = '<div class="track"><div id="loadbar"></div></div>';
  document.body.appendChild(box);
  const bar = box.querySelector('#loadbar'), t0 = performance.now();
  loadKeys(keys, (p) => { bar.style.width = `${Math.round(p * 100)}%`; }).then(() => { box.remove(); G.waits.push(Math.round(performance.now() - t0)); go(); });
}
G.waits = [];   // ms the loading bar was shown before each stage (tools/node/playthrough.cjs)
G.needPics = needPics;
const picsFor = (ep, st) => new Set([...coreKeys(), ...(st ? stageKeys(ep, st) : [])]);
function startRun(epId = 'ep0', step = 0) {
  const ep0 = C.episodes[epId] || C.episodes.ep0;
  needPics(picsFor(ep0, stageAt(ep0, step)), () => beginRun(ep0, step));   // (the ending: the last stage's place)
}
function beginRun(ep, step) {
  clearScreen();
  cursorScene('battle'); // the HUD draws each heroine's reticle
  G.skipComics = DBG.skip;
  G.titleStart = null; G.select = null;
  document.getElementById('ui').innerHTML = '';
  if (G.game) G.game.dispose();
  resetFx();
  G.game = new Game(G, { ep, step, team: [...SAVE.team], bag: [...SAVE.bag] });
  G.game.start(step);
}
function endRun() { if (G.game) { G.game.dispose(); G.game = null; } resetFx(); }
function toTitle() {
  endRun();
  G.select = null;
  clearScreen();
  const title = screenApi = showTitle({ start: () => turnTo(toSelect) });
  G.titleStart = () => { initAudio(); title.start(); };
}
function toSelect() {
  endRun();
  G.titleStart = null;
  clearScreen();
  cursorScene('menu');
  G.select = showSelect({ title: () => turnTo(toTitle), settings: () => settings.open(), play: (id, step = 0) => { initAudio(); startRun(id, step); } });
}
// menu screens change like turning a manga page (src/ui/manga.js)
const turnTo = (show) => mangaTurn(document.querySelector('#ui > .screen'), show);
// the results page, won or lost (both girls down: the same page with a retry from the checkpoint)
G.showResults = (st) => {
  G.game.hud.show(false);
  const ep = G.game.ep.id, retry = st.win ? null : () => startRun(ep, st.checkpoint);
  endRun(); cursorScene('menu'); showResults(st, () => toSelect(), retry);
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
      if (G.game && SET.p2 !== 'pad') { G.p2pad = i; setP2('pad'); sfx.clear(); G.game.hud.gl.stickers.say(G.game.players[1], 'join'); continue; }
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
  G.post.render(() => { if (G.game) G.game.render(renderer); }, () => { if (G.game) G.game.renderHUD(renderer); });
}
// fallback driver when rAF is throttled (background / embedded previews)
setInterval(() => { if (performance.now() - lastRaf > 100) tick(); }, 16);
G.step = (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) step(dt, dt); };
G.shot = async (name = 'shot') => {
  G.post.render(() => { if (G.game) G.game.render(renderer); }, () => { if (G.game) G.game.renderHUD(renderer); });
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
  initCursor();
  G.ready = true;
  resize();
  setManifest();
  await loadKeys(coreKeys(), (p) => { bar.style.width = `${Math.round(p * 100)}%`; });   // only the core: each stage loads its own (src/core/groups.js)
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
  if (q.has('team')) SAVE.team = q.get('team').split(',');   // test runs: ?team=cat,pink (1P, 2P)
  if (q.has('play') || q.has('ep') || q.has('step')) {
    if (q.has('skip')) DBG.skip = true;
    startRun(q.get('ep') || 'ep0', +(q.get('step') || 0));
  } else if (q.has('select')) toSelect();
  else toTitle();
  requestAnimationFrame(frame);
}
boot();
