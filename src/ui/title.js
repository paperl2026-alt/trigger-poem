// Title + settings (one scene, docs/DESIGN.md). A stack of depth layers that slide at different speeds as the mouse moves
// (sunset sky -> light shafts -> classroom -> dust -> the two heroines -> the settings board -> foreground desk / blossoms),
// like the stacked backgrounds of old scrolling games. The heroines are approved standing art (never redrawn into UI art).
// The settings board is hand-made craft UI: BGM = a red cord with a bell knob, SFX = a row of cartridges, language / display
// = paper tabs, START = a sketchbook sheet, QUIT = a paper tag. Every piece has normal / highlighted / pressed looks, metal
// glints, and particle feedback (uifx.js). Layout, images, lettering: content ui/title.json (design canvas 1920x1080).
import { url, meta } from '../core/assets.js';
import { sfx, initAudio, setMusicVolume, setSfxVolume } from '../core/audio.js';
import { C } from '../core/content.js';
import { t, lang, setLang } from '../core/i18n.js';
import { SET, saveSettings, toggleFullscreen } from '../core/settings.js';
import { UiFx } from './uifx.js';
import { cursorScene } from './cursor.js';
import './title.css';

const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
const has = (k) => !!(k && meta[k]);
const ar = (k) => (has(k) ? meta[k].h / meta[k].w : 1);
// an image at design coordinates; w or h (the other follows the image's aspect)
function img(parent, key, { x = 0, y = 0, w, h, rot = 0, cls = '' } = {}) {
  const i = el('img', `ti ${cls}`, parent);
  i.draggable = false;
  if (has(key)) i.src = url(key);
  const W = w ?? h / ar(key), H = h ?? w * ar(key);
  Object.assign(i.style, { left: `${x}px`, top: `${y}px`, width: `${W}px`, height: `${H}px`, transform: rot ? `rotate(${rot}deg)` : '' });
  return i;
}
// a metal glint that sweeps across an image now and then (masked by the image itself)
function glint(parent, i, delay = 0) {
  const g = el('div', 'glint', parent);
  for (const k of ['left', 'top', 'width', 'height', 'transform']) g.style[k] = i.style[k];
  g.style.webkitMaskImage = g.style.maskImage = `url(${i.src})`;
  g.style.animationDelay = `${delay}s`;
  return g;
}
// a paper button: three stacked looks (normal / highlighted / pressed), a light sweep, and its lettering on top
function paper(parent, base, { x, y, w, rot = 0 }) {
  const b = el('div', 'tbtn', parent);
  b.dataset.cur = 'hover';
  const n = meta[`${base}_n`] || { w: 1, h: 1 };
  const H = w * n.h / n.w;
  Object.assign(b.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${H}px`, '--rot': `${rot}deg` });
  for (const s of ['n', 'h', 'p']) {
    const k = `${base}_${s}`, m = meta[k];
    if (!m) continue;
    const i = el('img', `st ${s}`, b); i.src = url(k); i.draggable = false;
    // the looks were drawn at one scale: keep their real size relative to the normal one, centred
    const sw = w * m.w / n.w, sh = sw * m.h / m.w;
    Object.assign(i.style, { width: `${sw}px`, height: `${sh}px`, left: `${(w - sw) / 2}px`, top: `${(H - sh) / 2}px` });
    if (s === 'h') { const sh2 = el('div', 'sweep', b); Object.assign(sh2.style, { width: i.style.width, height: i.style.height, left: i.style.left, top: i.style.top }); sh2.style.webkitMaskImage = sh2.style.maskImage = `url(${url(k)})`; }
  }
  return b;
}

export function showTitle(act) {
  const L = C.ui.title, ui = document.getElementById('ui');
  ui.innerHTML = '';
  cursorScene('menu');
  const root = el('div', 'screen ttl', ui);
  const stage = el('div', 'ttl-stage', root);
  const [DW, DH] = L.design;
  Object.assign(stage.style, { width: `${DW}px`, height: `${DH}px` });
  const PX = L.parallax;

  // ---- parallax: every layer slides by -mouse * depth * max (eased); the board group also tilts toward the mouse
  const layers = [];
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const shift = (d) => [-mouse.x * d * PX.max, -mouse.y * d * PX.max * 0.55];
  function layer(depth, cls = '') { const d = el('div', `plx ${cls}`, stage); d.dataset.depth = depth; layers.push(d); return d; }
  const coverImg = (parent, key, depth) => { const pad = PX.max * depth + 12; return img(parent, key, { x: -pad, y: -pad * 0.6, w: DW + pad * 2, h: DH + pad * 1.2 }); };

  for (const Ly of L.layers) {
    const d = layer(Ly.depth, 'bg');
    if (Ly.img) coverImg(d, Ly.img, Ly.depth);
    for (const s of Ly.shafts || []) { const i = img(d, 'ui/fx_shaft', { ...s, cls: 'shaft' }); i.style.animationDelay = `${-Math.random() * 6}s`; }
  }
  // back particle layer: far petals + dust in the light
  const fxBack = new UiFx(stage, DW, DH, shift);
  // heroines
  const chars = L.characters.map((c) => {
    const d = layer(c.depth, 'chrl');
    const w = c.h / ar(c.img);
    const i = img(d, c.img, { x: c.x - w / 2, y: c.y, h: c.h, cls: 'chr' });
    i.style.animationDuration = `${1 / (c.breath || 0.25)}s`;
    return { i, c, w };
  });
  // logo
  const logoL = layer(L.logo.depth || 0.3, 'logol');
  const logo = img(logoL, L.logos[lang], { x: L.logo.x, y: L.logo.y, w: L.logo.w, rot: L.logo.rot, cls: 'logo' });
  logo.dataset.cur = 'hover';
  const logoGlint = glint(logoL, logo, 1.5);
  // the board group (board + every setting) tilts with the mouse
  const grp = layer(L.board.depth, 'boardgrp');
  img(grp, L.board.img, { x: L.board.x, y: L.board.y, w: L.board.w, rot: L.board.rot, cls: 'board' });
  for (const d of L.decor || []) img(grp, d.img, d);
  L.pins?.forEach((p, k) => glint(grp, img(grp, p.img, { ...p, cls: 'pin' }), 0.7 + k * 1.3));
  // foreground (nearest, blurred, slides the most)
  for (const f of L.front || []) {
    const d = layer(f.depth, 'front');
    const i = img(d, f.img, f);
    if (f.blur) i.style.filter = `blur(${f.blur}px)`;
    if (f.flip) i.style.transform = `${i.style.transform} scaleX(-1)`;
  }
  // front particle layer: near petals + all UI feedback
  const fx = new UiFx(stage, DW, DH, shift);

  // pointer -> design coordinates (the stage is scaled to fit the window)
  const toDesign = (cx, cy) => { const r = stage.getBoundingClientRect(); return [(cx - r.left) / r.width * DW, (cy - r.top) / r.height * DH]; };
  const boxOf = (n) => { const r = n.getBoundingClientRect(); const [x0, y0] = toDesign(r.left, r.top), [x1, y1] = toDesign(r.right, r.bottom); return [x0, y0, x1 - x0, y1 - y0]; };
  root.addEventListener('pointermove', (e) => { mouse.tx = e.clientX / window.innerWidth * 2 - 1; mouse.ty = e.clientY / window.innerHeight * 2 - 1; });

  // ---- lettering for the current language (plain text until that image exists)
  const letterKey = (name) => { const m = L.letters[name] || {}; return m.all || m[lang]; };
  const letters = [];
  function letter(parent, name, box) {
    const k = letterKey(name);
    let n;
    if (has(k)) n = img(parent, k, box);
    else { n = el('div', 'tfallback', parent); n.textContent = t(name); Object.assign(n.style, { left: `${box.x}px`, top: `${box.y}px`, height: `${box.h}px`, fontSize: `${box.h * 0.6}px` }); }
    n.classList.add('let');
    letters.push({ n, name, box });
    return n;
  }
  const row = (r) => {
    img(grp, r.icon, { x: L.rowIcon.x, y: r.y - L.rowIcon.w / 2, w: L.rowIcon.w, cls: 'ico' });
    letter(grp, r.label, { x: L.rowLabel.x, y: r.y - L.rowLabel.h / 2, h: L.rowLabel.h });
  };
  // a value in hand-lettered digits ("70%"), bouncing when it changes
  function digits(v, x, yMid, h = 46) {
    grp.querySelectorAll(`.dg[data-row="${yMid}"]`).forEach((d) => d.remove());
    let cx = x;
    for (const ch of [...`${Math.round(v * 100)}`].map(Number).concat('%')) {
      const k = ch === '%' ? L.percent : L.digits[ch];
      const d = img(grp, k, { x: cx, y: yMid - h / 2, h, cls: 'dg' });
      d.dataset.row = yMid;
      cx += h / ar(k) * 0.84;
    }
  }

  // ---- BGM: the red cord (filled) over the pale one, knots at the ends, the bell is the knob
  {
    const B = L.bgm, [x0, x1] = B.track, cordH = 30;
    row(B);
    const box = el('div', 'slider', grp);
    box.dataset.cur = 'grab';
    Object.assign(box.style, { left: `${x0 - 30}px`, top: `${B.y - 50}px`, width: `${x1 - x0 + 60}px`, height: '100px' });
    img(box, 'ui/cord_off', { x: 30, y: 50 - cordH / 2, w: x1 - x0, h: cordH });
    const on = img(box, 'ui/cord_on', { x: 30, y: 50 - cordH / 2, w: x1 - x0, h: cordH, cls: 'fill' });
    img(box, 'ui/knot_l', { x: -6, y: 20, h: 96 });
    img(box, 'ui/knot_r', { x: x1 - x0 + 4, y: 20, h: 96 });
    const bellW = 78 / ar('ui/bell');
    const bellBox = el('div', 'knob', box);
    Object.assign(bellBox.style, { top: '8px', width: `${bellW}px`, height: '78px' });
    const bell = img(bellBox, 'ui/bell', { x: 0, y: 0, h: 78 });
    glint(bellBox, bell, 0.3);
    let lastStep = -1;
    const set = (v, ring) => {
      SET.bgm = Math.max(0, Math.min(1, Math.round(v * 20) / 20)); setMusicVolume(SET.bgm);
      on.style.clipPath = `inset(0 ${(1 - SET.bgm) * 100}% 0 0)`;
      bellBox.style.left = `${30 + SET.bgm * (x1 - x0) - bellW / 2}px`;
      digits(SET.bgm, B.value, B.y);
      const st = Math.round(SET.bgm * 20);
      if (ring || st !== lastStep) { bellBox.classList.remove('ring'); void bellBox.offsetWidth; bellBox.classList.add('ring'); }
      lastStep = st;
    };
    set(SET.bgm ?? 0.7);
    const at = (e) => { const r = box.getBoundingClientRect(); return (e.clientX - r.left) / r.width * (x1 - x0 + 60) - 30; };
    box.onpointerdown = (e) => {
      e.stopPropagation(); initAudio(); box.setPointerCapture(e.pointerId);
      set(at(e) / (x1 - x0), true); sfx.ui();
      const [bx, by, bw] = boxOf(bellBox); fx.sparks(bx + bw / 2, by + 30, 6);
      box.onpointermove = (ev) => set(at(ev) / (x1 - x0), false);
      box.onpointerup = () => { box.onpointermove = null; saveSettings(); };
    };
    box.onpointerenter = () => { bellBox.classList.remove('ring'); void bellBox.offsetWidth; bellBox.classList.add('ring'); };
  }
  // ---- SFX: one cartridge per 10 %
  {
    const S = L.sfx, [x0, x1] = S.track, n = S.bullets, step = (x1 - x0) / n;
    row(S);
    const bul = [];
    for (let i = 0; i < n; i++) {
      const b = el('div', 'bullet', grp);
      b.dataset.cur = 'hover';
      Object.assign(b.style, { left: `${x0 + i * step}px`, top: `${S.y - 44}px`, width: `${step}px`, height: '88px' });
      const on = img(b, 'ui/bullet_on', { x: (step - 26) / 2, y: 0, h: 88, cls: 'on' });
      const g = glint(b, on, 0.15 * i);
      const off = img(b, 'ui/bullet_off', { x: (step - 30) / 2, y: 0, h: 88, cls: 'off' });
      bul.push({ on, off, g });
      b.onpointerdown = (e) => {
        e.stopPropagation(); initAudio();
        const v = (i + 1) / n;
        set(Math.abs(v - SET.sfx) < 1e-3 ? i / n : v); saveSettings(); sfx.shell(); sfx.ui();
        b.classList.remove('kick'); void b.offsetWidth; b.classList.add('kick');
        const [bx, by, bw] = boxOf(b); fx.sparks(bx + bw / 2, by + 10, 5);
      };
    }
    function set(v) {
      SET.sfx = Math.max(0, Math.min(1, v)); setSfxVolume(SET.sfx);
      bul.forEach((b, i) => { const lit = i < Math.round(SET.sfx * n); b.on.style.opacity = b.g.style.opacity = lit ? 1 : 0; b.off.style.opacity = lit ? 0 : 1; });
      digits(SET.sfx, S.value, S.y);
    }
    set(SET.sfx ?? 0.8);
  }
  // ---- language / display: paper tabs, the chosen one stays highlighted
  const tabs = [];
  function tabRow(R, current, choose) {
    row(R);
    R.tabs.options.forEach((opt, i) => {
      const b = paper(grp, 'ui/tab', { x: R.tabs.x[i], y: R.tabs.y - 40, w: R.tabs.w, rot: (i % 2 ? 1.5 : -1.2) });
      b.classList.add('opt'); // an option: dimmed until chosen
      const H = parseFloat(b.style.height);
      letter(b, opt, { x: R.tabs.w * 0.14, y: H * 0.2, h: H * 0.5 });
      tabs.push({ b, opt, current });
      b.onpointerdown = (e) => {
        e.stopPropagation(); b.classList.add('down'); sfx.ui();
        const [px, py] = toDesign(e.clientX, e.clientY); fx.stamp(px, py); fx.click(px, py);
        choose(opt); refresh(true);
      };
      b.onpointerup = b.onpointerleave = () => b.classList.remove('down');
    });
  }
  tabRow(L.language, () => lang, (o) => setLang(o));
  tabRow(L.display, () => (document.fullscreenElement ? 'fullscreen' : 'window'), (o) => { if ((o === 'fullscreen') !== !!document.fullscreenElement) toggleFullscreen(); });
  // ---- START / QUIT
  const start = paper(grp, 'ui/sheet', L.start);
  start.classList.add('start');
  const sH = parseFloat(start.style.height);
  letter(start, 'start', { x: L.start.w * 0.1, y: sH * 0.3, h: L.start.letterH });
  start.onpointerdown = (e) => { e.stopPropagation(); start.classList.add('down'); sfx.ui(); };
  start.onpointerup = () => { if (!start.classList.contains('down')) return; start.classList.remove('down'); go(); };
  start.onpointerleave = () => start.classList.remove('down');
  const quit = paper(grp, 'ui/tag', L.quit);
  const qH = parseFloat(quit.style.height);
  letter(quit, 'quit', { x: L.quit.w * 0.16, y: qH * 0.42, h: L.quit.letterH });
  quit.onpointerdown = (e) => { e.stopPropagation(); sfx.ui(); window.close(); };

  // hover feedback for every paper button: twinkles around it (the CSS lifts it and sweeps a light across)
  for (const b of grp.querySelectorAll('.tbtn')) b.addEventListener('pointerenter', () => { const [x, y, w, h] = boxOf(b); fx.hover(x, y, w, h, b.classList.contains('start') ? 7 : 4); });
  // the heroines react when the cursor touches them; the logo wobbles
  for (const ch of chars) {
    ch.i.dataset.cur = 'hover';
    ch.i.addEventListener('pointerenter', () => { ch.i.classList.remove('poke'); void ch.i.offsetWidth; ch.i.classList.add('poke'); const [x, y, w] = boxOf(ch.i); fx.hearts(x + w / 2, y + 220, 3); });
  }
  logo.addEventListener('pointerenter', () => { logo.classList.remove('wob'); void logo.offsetWidth; logo.classList.add('wob'); const [x, y, w, h] = boxOf(logo); fx.hover(x, y, w, h, 6); });

  let gone = false;
  function go() {
    if (gone) return;
    gone = true; initAudio(); sfx.clear();
    const [x, y, w, h] = boxOf(start); fx.click(x + w / 2, y + h / 2, true);
    root.classList.add('leave');
    setTimeout(() => act.start(), 650);
  }

  function refresh(bump) {
    for (const tb of tabs) tb.b.classList.toggle('on', tb.current() === tb.opt);
    for (const L2 of letters) {
      const k = letterKey(L2.name);
      if (L2.n.tagName === 'IMG' && has(k)) { L2.n.src = url(k); L2.n.style.width = `${L2.box.h / ar(k)}px`; } else if (L2.n.tagName !== 'IMG') L2.n.textContent = t(L2.name);
      if (bump) { L2.n.classList.remove('flip'); void L2.n.offsetWidth; L2.n.classList.add('flip'); }
    }
    if (has(L.logos[lang])) {
      logo.src = url(L.logos[lang]); logo.style.height = `${L.logo.w * ar(L.logos[lang])}px`;
      logoGlint.style.height = logo.style.height; logoGlint.style.webkitMaskImage = logoGlint.style.maskImage = `url(${logo.src})`;
    }
  }
  refresh();
  document.addEventListener('fullscreenchange', () => refresh());

  // ---- ambient: petals (far ones behind the heroines, near ones in front), dust in the light
  for (let k = 0; k < L.petals.far; k++) { const p = fxBack.petal(Math.random() * 0.4 + 0.2); p.y = Math.random() * DH; }
  for (let k = 0; k < L.petals.near; k++) { const p = fx.petal(1 + Math.random() * 0.4); p.y = Math.random() * DH; }
  const D = L.dust;

  // ---- frame loop: parallax, particles
  let last = performance.now(), lastRaf = last, alive = true;
  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt * PX.ease);
    mouse.x += (mouse.tx - mouse.x) * k; mouse.y += (mouse.ty - mouse.y) * k;
    for (const d of layers) {
      const [dx, dy] = shift(+d.dataset.depth);
      d.style.transform = d.classList.contains('boardgrp')
        ? `translate(${dx}px, ${dy}px) perspective(1800px) rotateY(${mouse.x * L.board.tilt}deg) rotateX(${-mouse.y * L.board.tilt * 0.6}deg)`
        : `translate(${dx}px, ${dy}px)`;
    }
    if (fxBack.count < L.petals.far + D.count && Math.random() < dt * 3) fxBack.dust(...D.box, D.depth);
    if (Math.random() < dt * L.petals.far / 14) fxBack.petal(Math.random() * 0.4 + 0.2);
    if (Math.random() < dt * L.petals.near / 10) fx.petal(1 + Math.random() * 0.4);
    fxBack.update(dt); fx.update(dt);
  }
  const raf = (now) => { if (!alive) return; lastRaf = now; frame(now); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  // fallback driver when animation frames are throttled (hidden / embedded windows)
  const backup = setInterval(() => { if (!alive) clearInterval(backup); else if (performance.now() - lastRaf > 100) frame(performance.now()); }, 33);

  // fit the design canvas into the window
  function fit() {
    const s = Math.min(window.innerWidth / DW, window.innerHeight / DH);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  fit();
  window.addEventListener('resize', fit);
  // entrance: the board pieces arrive one after another (the stagger is removed afterwards so hovers stay snappy)
  const kids = [...grp.children];
  kids.forEach((c, i) => { c.style.transitionDelay = `${0.12 + i * 0.022}s`; });
  setTimeout(() => kids.forEach((c) => { c.style.transitionDelay = ''; }), 1800);
  setTimeout(() => root.classList.add('in'), 60);
  const api = { start: go, refresh, dispose: () => { alive = false; window.removeEventListener('resize', fit); } };
  root.dispose = api.dispose;
  return api;
}
