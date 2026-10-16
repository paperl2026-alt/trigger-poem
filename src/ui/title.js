// Title + settings (one scene, docs/DESIGN.md), built STRICTLY from the user's approved mockup (art/ref/ui_user_mock.png):
// every piece was cut out of that mockup and is placed by its box in it (content ui/title.json, map: art/ref/ui_breakdown.jpg).
// Depth layers slide at different speeds with the mouse (window view -> room -> heroines -> board -> books in front), the board
// group tilts toward the mouse. The settings live on the board: BGM = red rope + bell knob, SFX = bullets in a bar + bunny knob,
// language / display = paper tags (chosen = red marker frame + paw stamp), START = notebook sheet, QUIT = pinned note.
// Lettering is the user's chosen bubble style (one image per language). Feedback: lifts, light sweeps, metal glints,
// particles (uifx.js), the cat-paw cursor (cursor.js).
import { url, meta } from '../core/assets.js';
import { sfx, initAudio, setMusicVolume, setSfxVolume } from '../core/audio.js';
import { C } from '../core/content.js';
import { lang, setLang } from '../core/i18n.js';
import { SET, saveSettings, toggleFullscreen } from '../core/settings.js';
import { UiFx } from './uifx.js';
import { cursorScene } from './cursor.js';
import './title.css';

const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
const has = (k) => !!(k && meta[k]);
const ar = (k) => (has(k) ? meta[k].h / meta[k].w : 1);

export function showTitle(act) {
  const L = C.ui.title, ui = document.getElementById('ui');
  ui.innerHTML = '';
  cursorScene('menu');
  const root = el('div', 'screen ttl', ui);
  const stage = el('div', 'ttl-stage', root);
  const [DW, DH] = L.design;
  const RS = DW / L.refSize[0];   // reference pixels -> design pixels
  Object.assign(stage.style, { width: `${DW}px`, height: `${DH}px` });
  const PX = L.parallax;

  // an image fitted into its box from the reference: contain + centred by default; align: bottom / top sticks it to that edge;
  // fit: width = as wide as the box whatever the height (it may run past the box, e.g. the heroines below the screen edge)
  function put(parent, key, box, { cls = '', align = 'center', fit = 'contain' } = {}) {
    const [x0, y0, x1, y1] = box.map((v) => v * RS), bw = x1 - x0, bh = y1 - y0, a = ar(key);
    let w = bw, h = bw * a;
    if (fit === 'contain' && h > bh) { h = bh; w = bh / a; }
    if (fit === 'exact') h = bh;   // the box IS the image's rect (placed by anchors measured on the mockup)
    const x = x0 + (bw - w) / 2, y = align === 'bottom' ? y1 - h : align === 'top' ? y0 : y0 + (bh - h) / 2;
    const n = el('img', `ti ${cls}`, parent);
    n.draggable = false;
    if (has(key)) n.src = url(key);
    Object.assign(n.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    return n;
  }
  // a metal glint sweeping across an image now and then (masked by the image itself)
  function glint(parent, i, delay = 0) {
    const g = el('div', 'glint', parent);
    for (const k of ['left', 'top', 'width', 'height']) g.style[k] = i.style[k];
    g.style.webkitMaskImage = g.style.maskImage = `url(${i.src})`;
    g.style.animationDelay = `${delay}s`;
    return g;
  }

  // ---- parallax layers
  const layers = [];
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const shift = (d) => [-mouse.x * d * PX.max, -mouse.y * d * PX.max * 0.55];
  function layer(depth, cls = '') { const d = el('div', `plx ${cls}`, stage); d.dataset.depth = depth; layers.push(d); return d; }
  const S = L.scene;
  for (const [key, depth] of [[S.far, S.farDepth], [S.room, S.roomDepth]]) {
    const d = layer(depth, 'bg');
    const pad = PX.max * depth + 10;   // bigger than the screen so the slide never shows an edge
    const i = el('img', 'ti', d); i.draggable = false; if (has(key)) i.src = url(key);
    Object.assign(i.style, { left: `${-pad}px`, top: `${-pad * 0.6}px`, width: `${DW + pad * 2}px`, height: `${DH + pad * 1.2}px` });
    if (key === S.far && S.farFlip) i.style.transform = 'scaleX(-1)';   // puts the blossoms behind the window panes
  }
  if (L.glassText) put(layer(L.glassText.depth, 'bg'), L.glassText.img, L.glassText.box);
  const fxBack = new UiFx(stage, DW, DH, shift);
  const gl = layer(L.girls.depth, 'chrl');
  const girls = put(gl, L.girls.img, L.girls.box, { cls: 'chr', align: L.girls.align, fit: L.girls.fit });
  girls.style.animationDuration = `${1 / (L.girls.breath || 0.25)}s`;
  girls.dataset.cur = 'hover';

  // ---- the board group
  const grp = layer(L.board.depth, 'boardgrp');
  put(grp, L.board.img, L.board.box, { cls: 'board' });
  const decor = (d) => {
    const n = put(grp, d.img, d.box, { cls: `deco ${d.hover ? 'tilt' : ''} ${d.sway ? 'sway' : ''} ${d.peek ? 'peek' : ''}` });
    if (d.hover) n.dataset.cur = 'hover';
    if (d.metal) glint(grp, n, Math.random() * 3);
    return n;
  };
  // decorations under the strips (photos, note, tassel) first; flowers and pins go on top at the end
  const under = (L.decor || []).filter((d) => !/sakura|pin/.test(d.img)), over = (L.decor || []).filter((d) => /sakura|pin/.test(d.img));
  under.forEach(decor);

  // lettering for the current language, fitted into its box
  const letterKey = (name) => { const m = L.letters[name] || {}; return m.all || m[lang]; };
  const letters = [];
  function letter(parent, name, box, cls = '') { const n = put(parent, letterKey(name), box, { cls: `let ${cls}` }); letters.push({ n, name, box }); return n; }
  // a value in hand-lettered digits, right-aligned in its box
  function digits(R, v) {
    grp.querySelectorAll(`.dg[data-row="${R}"]`).forEach((d) => d.remove());
    const [, y0, x1, y1] = L.rows[R].value.box.map((q) => q * RS), h = y1 - y0;
    const keys = [...`${Math.round(v * 100)}`].map((c) => L.digits[+c]).concat(L.percent);
    const ws = keys.map((k) => h / ar(k) * 0.86);
    let x = x1 - ws.reduce((a, b) => a + b, 0);
    keys.forEach((k, i) => {
      const d = el('img', 'ti dg', grp); d.src = url(k); d.dataset.row = R; d.draggable = false;
      Object.assign(d.style, { left: `${x}px`, top: `${y0}px`, width: `${h / ar(k)}px`, height: `${h}px` });
      x += ws[i];
    });
  }
  const row = (R) => {
    const r = L.rows[R];
    put(grp, r.strip.img, r.strip.box, { cls: 'strip' });
    put(grp, r.icon.img, r.icon.box, { cls: 'ico' });
    letter(grp, r.label.letter, r.label.box);
    return r;
  };

  // ---- BGM: the red rope (filled) over the metal rod (empty), the bell is the knob, a cat sticker caps the end
  {
    const r = row('bgm'), Sl = r.slider;
    const x0 = Sl.x0 * RS, x1 = Sl.x1 * RS, yc = Sl.y * RS, rh = Sl.ropeH * RS;
    const box = el('div', 'slider', grp);
    box.dataset.cur = 'grab';
    Object.assign(box.style, { left: `${x0 - 20}px`, top: `${yc - 46}px`, width: `${x1 - x0 + 40}px`, height: '92px' });
    const lay = (key, h, cls) => { const i = el('img', `ti ${cls}`, box); i.src = url(key); i.draggable = false; Object.assign(i.style, { left: '20px', top: `${46 - h / 2}px`, width: `${x1 - x0}px`, height: `${h}px` }); return i; };
    lay(Sl.rod, rh * 0.62, 'rod');
    const rope = lay(Sl.rope, rh, 'fill');
    put(grp, Sl.cap.img, Sl.cap.box, { cls: 'cap' });
    const kh = Sl.knobH * RS, kw = kh / ar(Sl.knob);
    const knob = el('div', 'knob', box);
    Object.assign(knob.style, { top: `${46 - kh * 0.55}px`, width: `${kw}px`, height: `${kh}px` });
    const bell = el('img', 'ti', knob); bell.src = url(Sl.knob); bell.draggable = false;
    Object.assign(bell.style, { left: '0', top: '0', width: `${kw}px`, height: `${kh}px` });
    glint(knob, bell, 0.4);
    let lastStep = -1;
    const set = (v, ring) => {
      SET.bgm = Math.max(0, Math.min(1, Math.round(v * 20) / 20)); setMusicVolume(SET.bgm);
      rope.style.clipPath = `inset(0 ${(1 - SET.bgm) * 100}% 0 0)`;
      knob.style.left = `${20 + SET.bgm * (x1 - x0) - kw / 2}px`;
      digits('bgm', SET.bgm);
      const s = Math.round(SET.bgm * 20);
      if (ring || s !== lastStep) { knob.classList.remove('ring'); void knob.offsetWidth; knob.classList.add('ring'); }
      lastStep = s;
    };
    set(SET.bgm ?? 0.7);
    const at = (e) => { const b = box.getBoundingClientRect(); return ((e.clientX - b.left) / b.width * (x1 - x0 + 40) - 20) / (x1 - x0); };
    box.onpointerdown = (e) => {
      e.stopPropagation(); initAudio(); box.setPointerCapture(e.pointerId);
      set(at(e), true); sfx.ui();
      const [bx, by, bw] = boxOf(knob); fx.sparks(bx + bw / 2, by + 20, 6);
      box.onpointermove = (ev) => set(at(ev), false);
      box.onpointerup = () => { box.onpointermove = null; saveSettings(); };
    };
    box.onpointerenter = () => { knob.classList.remove('ring'); void knob.offsetWidth; knob.classList.add('ring'); };
  }
  // ---- SFX: one cartridge per 10 % inside the bar, the bunny knob marks the level, the metal rod runs on to the end
  {
    const r = row('sfx'), Bc = r.bar;
    const [fx0, fy0, fx1, fy1] = Bc.frame.box.map((q) => q * RS);
    const rod = el('img', 'ti rod', grp); rod.src = url(Bc.rod); rod.draggable = false;
    Object.assign(rod.style, { left: `${fx1 - 6}px`, top: `${(fy0 + fy1) / 2 - 7}px`, width: `${Bc.rodTo * RS - fx1 + 6}px`, height: '14px' });
    put(grp, Bc.frame.img, Bc.frame.box, { cls: 'barframe' });
    const n = Bc.slots, [px, py] = Bc.slotPad.map((q) => q * RS);
    const step = (fx1 - fx0 - px * 2) / n, bh = fy1 - fy0 - py * 2;
    const bul = [];
    for (let i = 0; i < n; i++) {
      const b = el('div', 'bullet', grp);
      b.dataset.cur = 'hover';
      Object.assign(b.style, { left: `${fx0 + px + i * step}px`, top: `${fy0 + py}px`, width: `${step}px`, height: `${bh}px` });
      const w = bh / ar(Bc.bullet);
      const on = el('img', 'ti on', b); on.src = url(Bc.bullet); on.draggable = false;
      Object.assign(on.style, { left: `${(step - w) / 2}px`, top: '0', width: `${w}px`, height: `${bh}px` });
      glint(b, on, 0.12 * i);
      bul.push(b);
      b.onpointerdown = (e) => {
        e.stopPropagation(); initAudio();
        const v = (i + 1) / n;
        set(Math.abs(v - SET.sfx) < 1e-3 ? i / n : v); saveSettings(); sfx.shell(); sfx.ui();
        b.classList.remove('kick'); void b.offsetWidth; b.classList.add('kick');
        const [bx, by, bw] = boxOf(b); fx.sparks(bx + bw / 2, by + 6, 5);
      };
    }
    const kh = Bc.knobH * RS, kw = kh / ar(Bc.knob);
    const knob = el('img', 'ti knobb', grp); knob.src = url(Bc.knob); knob.draggable = false;
    Object.assign(knob.style, { top: `${(fy0 + fy1) / 2 - kh / 2}px`, width: `${kw}px`, height: `${kh}px` });
    function set(v) {
      SET.sfx = Math.max(0, Math.min(1, v)); setSfxVolume(SET.sfx);
      const lit = Math.round(SET.sfx * n);
      bul.forEach((b, i) => b.classList.toggle('empty', i >= lit));
      knob.style.left = `${fx0 + px + lit * step - kw / 2}px`;
      digits('sfx', SET.sfx);
    }
    set(SET.sfx ?? 0.8);
  }
  // ---- language / display: paper tags, the chosen one shows the red marker frame + paw stamp
  const chips = [];
  function chipRow(R, current, choose) {
    const r = row(R);
    for (const c of r.chips) {
      const I = L.chipImg[c.size];
      const wrap = el('div', 'chip', grp);
      wrap.dataset.cur = 'hover';
      put(wrap, I.off, c.box, { cls: 'off' });
      const on = put(wrap, I.on, c.box, { cls: 'on' });
      // the text sits in the middle of the tag (a little left of centre: the paw stamp is on the right)
      const [x0, y0, x1, y1] = c.box, cw = (x1 - x0) * L.chipText[0], ch = (y1 - y0) * L.chipText[1], sh = c.size === 's' ? 6 : 8;
      letter(wrap, c.opt, [x0 + (x1 - x0 - cw) / 2 - sh, y0 + (y1 - y0 - ch) / 2, x0 + (x1 - x0 + cw) / 2 - sh, y0 + (y1 - y0 + ch) / 2], 'ctext');
      chips.push({ wrap, opt: c.opt, current });
      wrap.onpointerdown = (e) => {
        e.stopPropagation(); wrap.classList.add('down'); sfx.ui();
        const [qx, qy] = toDesign(e.clientX, e.clientY); fx.stamp(qx, qy); fx.click(qx, qy);
        choose(c.opt); refresh(true);
      };
      wrap.onpointerup = wrap.onpointerleave = () => wrap.classList.remove('down');
      wrap.onpointerenter = () => { const [bx, by, bw, bh] = boxOf(on); fx.hover(bx, by, bw, bh, 3); };
    }
  }
  chipRow('language', () => lang, (o) => setLang(o));
  chipRow('display', () => (document.fullscreenElement ? 'fullscreen' : 'window'), (o) => { if ((o === 'fullscreen') !== !!document.fullscreenElement) toggleFullscreen(); });

  // ---- START: the notebook sheet (its cord sways), QUIT: the pinned note
  const st = L.start;
  const startEl = el('div', 'startbtn', grp);
  startEl.dataset.cur = 'hover';
  const sheet = put(startEl, st.sheet.img, st.sheet.box, { cls: 'sheet' });
  const sweep = el('div', 'sweep', startEl);
  for (const k of ['left', 'top', 'width', 'height']) sweep.style[k] = sheet.style[k];
  sweep.style.webkitMaskImage = sweep.style.maskImage = `url(${sheet.src})`;
  letter(startEl, 'start', st.label.box, 'stext');
  put(grp, st.cord.img, st.cord.box, { cls: 'cord' });
  startEl.onpointerdown = (e) => { e.stopPropagation(); startEl.classList.add('down'); sfx.ui(); };
  startEl.onpointerup = () => { if (!startEl.classList.contains('down')) return; startEl.classList.remove('down'); go(); };
  startEl.onpointerleave = () => startEl.classList.remove('down');
  startEl.onpointerenter = () => { const [bx, by, bw, bh] = boxOf(sheet); fx.hover(bx, by, bw, bh, 8); };
  const qt = L.quit;
  const quitEl = el('div', 'quitbtn', grp);
  quitEl.dataset.cur = 'hover';
  put(quitEl, qt.note.img, qt.note.box, { cls: 'note' });
  letter(quitEl, 'quit', qt.label.box, 'qtext');
  quitEl.onpointerdown = (e) => { e.stopPropagation(); sfx.ui(); window.close(); };
  over.forEach(decor);

  // ---- the books in front (nearest layer); the heroines react to the cursor
  if (L.books) put(layer(L.books.depth, 'front'), L.books.img, L.books.box, { align: L.books.align });
  const fx = new UiFx(stage, DW, DH, shift);
  const toDesign = (cx, cy) => { const r = stage.getBoundingClientRect(); return [(cx - r.left) / r.width * DW, (cy - r.top) / r.height * DH]; };
  function boxOf(n) { const r = n.getBoundingClientRect(); const [x0, y0] = toDesign(r.left, r.top), [x1, y1] = toDesign(r.right, r.bottom); return [x0, y0, x1 - x0, y1 - y0]; }
  root.addEventListener('pointermove', (e) => { mouse.tx = e.clientX / window.innerWidth * 2 - 1; mouse.ty = e.clientY / window.innerHeight * 2 - 1; });
  girls.addEventListener('pointerenter', (e) => { girls.classList.remove('poke'); void girls.offsetWidth; girls.classList.add('poke'); const [x, y] = toDesign(e.clientX, e.clientY); fx.hearts(x, y - 40, 3); });
  for (const n of grp.querySelectorAll('.deco.tilt')) n.addEventListener('pointerenter', () => { n.classList.remove('wig'); void n.offsetWidth; n.classList.add('wig'); });

  let gone = false;
  function go() {
    if (gone) return;
    gone = true; initAudio(); sfx.clear();
    const [x, y, w, h] = boxOf(sheet); fx.click(x + w / 2, y + h / 2, true);
    root.classList.add('leave');
    setTimeout(() => act.start(), 650);
  }

  function refresh(bump) {
    for (const c of chips) c.wrap.classList.toggle('sel', c.current() === c.opt);
    for (const q of letters) {
      const k = letterKey(q.name);
      if (!has(k) || q.n.getAttribute('src') === url(k)) continue;
      // refit the new language's image into the same box
      const [x0, y0, x1, y1] = q.box.map((v) => v * RS), bw = x1 - x0, bh = y1 - y0, a = ar(k);
      let w = bw, h = bw * a; if (h > bh) { h = bh; w = bh / a; }
      q.n.src = url(k);
      Object.assign(q.n.style, { left: `${x0 + (bw - w) / 2}px`, top: `${y0 + (bh - h) / 2}px`, width: `${w}px`, height: `${h}px` });
      if (bump) { q.n.classList.remove('flip'); void q.n.offsetWidth; q.n.classList.add('flip'); }
    }
  }
  refresh();
  document.addEventListener('fullscreenchange', () => refresh());

  // ---- ambient: petals (far ones behind the heroines, near ones in front), dust in the window light
  for (let k = 0; k < L.petals.far; k++) { const p = fxBack.petal(Math.random() * 0.4 + 0.2); p.y = Math.random() * DH; }
  for (let k = 0; k < L.petals.near; k++) { const p = fx.petal(1 + Math.random() * 0.4); p.y = Math.random() * DH; }
  const D = L.dust, dustBox = D.box.map((v) => v * RS);

  // ---- frame loop: parallax + particles (rAF, with a timer fallback when frames are throttled)
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
    if (fxBack.count < L.petals.far + D.count && Math.random() < dt * 3) fxBack.dust(...dustBox, D.depth);
    if (Math.random() < dt * L.petals.far / 14) fxBack.petal(Math.random() * 0.4 + 0.2);
    if (Math.random() < dt * L.petals.near / 10) fx.petal(1 + Math.random() * 0.4);
    fxBack.update(dt); fx.update(dt);
  }
  const raf = (now) => { if (!alive) return; lastRaf = now; frame(now); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  const backup = setInterval(() => { if (!alive) clearInterval(backup); else if (performance.now() - lastRaf > 100) frame(performance.now()); }, 33);

  function fit() { const s = Math.min(window.innerWidth / DW, window.innerHeight / DH); stage.style.transform = `translate(-50%, -50%) scale(${s})`; }
  fit();
  window.addEventListener('resize', fit);
  // entrance: the board pieces arrive one after another (the stagger is removed afterwards so hovers stay snappy)
  const kids = [...grp.children];
  kids.forEach((c, i) => { c.style.transitionDelay = `${0.1 + i * 0.012}s`; });
  setTimeout(() => kids.forEach((c) => { c.style.transitionDelay = ''; }), 1600);
  setTimeout(() => root.classList.add('in'), 60);
  const api = { start: go, refresh, dispose: () => { alive = false; window.removeEventListener('resize', fit); } };
  root.dispose = api.dispose;
  return api;
}
