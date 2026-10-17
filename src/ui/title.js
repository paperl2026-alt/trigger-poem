// Title + settings (one scene, docs/DESIGN.md) in the user's chosen red / black / white style (art/ref/ui_p5.png).
// The painted parts were cut out of that mockup (back shapes, the grunge panel, front decorations, icons) and slide at
// different depths with the mouse; the controls (toggles, sliders, segmented tabs, the START / QUIT slabs, lines) are drawn
// here from the layout measured on the mockup (content ui/title.json), so they line up exactly. Text: bundled bold font,
// strings from text/ui.json (zh / ja / en).
import { url, meta } from '../core/assets.js';
import { sfx, initAudio, setMusicVolume, setSfxVolume } from '../core/audio.js';
import { C } from '../core/content.js';
import { t, tr, lang, setLang } from '../core/i18n.js';
import { SET, saveSettings, toggleFullscreen } from '../core/settings.js';
import { UiFx } from './uifx.js';
import { cursorScene } from './cursor.js';
import './title.css';

const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
const has = (k) => !!(k && meta[k]);
const ar = (k) => (has(k) ? meta[k].h / meta[k].w : 1);

// a convex polygon moved inward by d (each edge offset, neighbours intersected): the coloured face inside the white border
function inset(poly, d) {
  const n = poly.length, cx = poly.reduce((a, p) => a + p[0], 0) / n, cy = poly.reduce((a, p) => a + p[1], 0) / n;
  const lines = poly.map((p, i) => {
    const q = poly[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy);
    let nx = -dy / len, ny = dx / len;
    if ((cx - p[0]) * nx + (cy - p[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { x: p[0] + nx * d, y: p[1] + ny * d, dx, dy };
  });
  return lines.map((a, i) => {
    const b = lines[(i + n - 1) % n], den = a.dx * b.dy - a.dy * b.dx;
    const s = ((b.x - a.x) * b.dy - (b.y - a.y) * b.dx) / den;
    return [a.x + a.dx * s, a.y + a.dy * s];
  });
}

export function showTitle(act) {
  const L = C.ui.title, col = L.colors, ui = document.getElementById('ui');
  ui.innerHTML = '';
  cursorScene('menu');
  const root = el('div', 'screen ttl p5', ui);
  for (const [k, v] of Object.entries(col)) root.style.setProperty(`--${k}`, v);
  const stage = el('div', 'ttl-stage', root);
  const [DW, DH] = L.design;
  const RS = DW / L.refSize[0];      // reference px -> design px
  Object.assign(stage.style, { width: `${DW}px`, height: `${DH}px` });
  const PX = L.parallax;
  const px = (v) => `${v * RS}px`;
  const box = (n, [x0, y0, x1, y1]) => Object.assign(n.style, { left: px(x0), top: px(y0), width: px(x1 - x0), height: px(y1 - y0) });
  // an image contained in its box (reference px)
  function put(parent, key, b, cls = '') {
    const [x0, y0, x1, y1] = b.map((v) => v * RS), bw = x1 - x0, bh = y1 - y0, a = ar(key);
    let w = bw, h = bw * a; if (h > bh) { h = bh; w = bh / a; }
    const n = el('img', `ti ${cls}`, parent); n.draggable = false; if (has(key)) n.src = url(key);
    Object.assign(n.style, { left: `${x0 + (bw - w) / 2}px`, top: `${y0 + (bh - h) / 2}px`, width: `${w}px`, height: `${h}px` });
    return n;
  }
  // text at a reference position: spec.key = a key of text/ui.json; literal = fixed text ("@key" = a key too).
  // fit = the room it has (reference px): a longer translation shrinks to fit instead of running under the next control.
  const texts = [];
  function text(parent, spec, cls = '', literal = null, fit = 0) {
    const n = el('div', `tx ${cls}`, parent);
    if (spec.italic) n.style.fontStyle = 'italic';
    const say = () => {
      n.textContent = literal == null ? t(spec.key) : literal[0] === '@' ? t(literal.slice(1)) : literal;
      if (spec.size) n.style.fontSize = px(spec.size);
      if (fit && spec.size && n.offsetWidth > fit * RS) n.style.fontSize = px(spec.size * fit * RS / n.offsetWidth);
    };
    say(); texts.push(say);
    return n;
  }
  document.fonts?.ready.then(() => { for (const f of texts) f(); });

  // ---- parallax layers
  const layers = [];
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const shift = (d) => [-mouse.x * d * PX.max, -mouse.y * d * PX.max * 0.55];
  function layer(depth, cls = '') { const d = el('div', `plx ${cls}`, stage); d.dataset.depth = depth; layers.push(d); return d; }
  const cover = (parent, key, depth) => {
    const pad = PX.max * depth + 10, i = el('img', 'ti', parent); i.draggable = false; if (has(key)) i.src = url(key);
    Object.assign(i.style, { left: `${-pad}px`, top: `${-pad * 0.6}px`, width: `${DW + pad * 2}px`, height: `${DH + pad * 1.2}px` });
    return i;
  };
  const Ly = L.layers;
  cover(layer(Ly.back.depth, 'bg back'), Ly.back.img, Ly.back.depth);
  const panelL = layer(Ly.panel.depth, 'pnl');
  if (Ly.panel.img) put(panelL, Ly.panel.img, Ly.panel.box, 'panelimg');
  const fxBack = new UiFx(stage, DW, DH, shift);
  const girlsL = layer(Ly.girls.depth, 'chrl');
  const girls = el('img', 'ti chr', girlsL); girls.draggable = false; girls.src = url(Ly.girls.img); box(girls, Ly.girls.box);
  girls.style.animationDuration = `${1 / (Ly.girls.breath || 0.25)}s`;
  girls.dataset.cur = 'hover';
  cover(layer(Ly.front.depth, 'bg front'), Ly.front.img, Ly.front.depth);
  // the UI rides with the panel
  const U = layer(Ly.panel.depth, 'uil');

  // ---- the game's title (DESIGN「标题」): top left, clear of the girls. Ransom-note blocks like the rest of this red / black / white UI,
  // each character on its own slanted slip of paper, stamped in one after another; under it the Japanese title on a red band (with
  // its reading) and the English one. The settings below moved down to make room (ui/title.json "settings").
  const LG = L.logo, logo = el('div', 'logo', U); box(logo, LG.box);
  const T0 = C.text.gameTitle, slips = [];
  const line = (str, size, y, cls) => {
    const ln = el('div', `lline ${cls}`, logo); Object.assign(ln.style, { top: px(y), fontSize: px(size) });
    [...str].forEach((ch) => { const s = el('span', 'slip', ln); s.textContent = ch; slips.push(s); });
  };
  line(T0.zh.small, LG.small, 0, 'small');
  line(T0.zh.big, LG.big, LG.bigY, 'big');
  slips.forEach((s, i) => { s.dataset.k = LG.pattern[i % LG.pattern.length]; s.style.rotate = `${LG.tilt[i % LG.tilt.length]}deg`; s.style.animationDelay = `${0.35 + i * 0.07}s`; });
  const sub = el('div', 'lsub', logo); Object.assign(sub.style, { top: px(LG.subY), fontSize: px(LG.sub) });
  sub.innerHTML = `<span>${T0.ja.small}</span><ruby>${T0.ja.big}<rt>${T0.ja.ruby}</rt></ruby>`;
  sub.style.animationDelay = `${0.35 + slips.length * 0.07}s`;
  const en = el('div', 'len', logo); Object.assign(en.style, { top: px(LG.enY), fontSize: px(LG.en) });
  en.textContent = `${T0.en.small} · ${T0.en.big}`; en.style.animationDelay = sub.style.animationDelay;
  // the settings block, moved down under the title (one group: it slides in together)
  const SG = L.settings, S = el('div', 'setg', U);
  S.style.transformOrigin = `${px(SG.origin[0])} ${px(SG.origin[1])}`;
  S.style.transform = `translate(0, ${px(SG.dy)}) scale(${SG.scale})`;

  // ---- volume rows: icon, label, on/off toggle, slider, value
  for (const R of L.rows) {
    const row = el('div', 'row', S); row.dataset.id = R.id;
    const hl = el('div', 'rowhl', row); Object.assign(hl.style, { left: px(30), top: px(R.y - 34), width: px(626), height: px(68) });
    const icon = put(row, R.icon.img, R.icon.box, 'ico');
    const lab = text(row, R.label, 'lab', null, R.toggle.box[0] - R.label.x - 12); Object.assign(lab.style, { left: px(R.label.x), top: px((R.label.y ?? R.y) - R.label.size * 0.68) });
    const tg = el('div', 'tg', row); box(tg, R.toggle.box); tg.dataset.cur = 'hover';
    el('div', 'knob', tg);
    const sl = el('div', 'sl', row); sl.dataset.cur = 'grab';
    Object.assign(sl.style, { left: px(R.slider.x0 - 14), top: px(R.y - 22), width: px(R.slider.x1 - R.slider.x0 + 28), height: px(44) });
    const track = el('div', 'track', sl), fill = el('div', 'fill', track), knob = el('div', 'knob', sl);
    Object.assign(track.style, { left: px(14), right: px(14), top: px(22 - R.slider.h / 2), height: px(R.slider.h) });
    Object.assign(knob.style, { width: px(R.slider.knob * 2), height: px(R.slider.knob * 2), top: px(22 - R.slider.knob) });
    const val = el('div', 'tx val', row);   // a number, not a translation: not in texts
    const vy = R.value.y ?? R.y, room = (R.value.x1 - R.slider.x1 - R.slider.knob - 6) * RS;   // never over the slider's end
    val.style.right = px(L.refSize[0] - R.value.x1);
    const key = R.id, onKey = `${R.id}On`;
    const apply = () => {
      const v = SET[key] ?? 0.7, on = SET[onKey] !== false;
      (key === 'bgm' ? setMusicVolume : setSfxVolume)(on ? v : 0);
      fill.style.width = `${v * 100}%`;
      knob.style.left = `calc(${px(14 - R.slider.knob)} + ${v} * (100% - ${px(28)}))`;
      val.textContent = `${Math.round(v * 100)}%`;
      val.style.fontSize = px(R.value.size);
      const fs = val.offsetWidth > room ? R.value.size * room / val.offsetWidth : R.value.size;
      Object.assign(val.style, { fontSize: px(fs), top: px(vy - R.value.size * 0.68 + 0.55 * (R.value.size - fs)) });   // shrinks about its centre
      row.classList.toggle('off', !on); tg.classList.toggle('on', on);
      if (has(R.icon.off)) icon.src = url(on ? R.icon.img : R.icon.off);
    };
    apply();
    tg.onpointerdown = (e) => { e.stopPropagation(); initAudio(); SET[onKey] = SET[onKey] === false; apply(); saveSettings(); sfx.ui(); pop(tg, e); };
    const at = (e) => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
    sl.onpointerdown = (e) => {
      e.stopPropagation(); initAudio(); sl.setPointerCapture(e.pointerId); sl.classList.add('drag');
      SET[key] = Math.round(at(e) * 20) / 20; SET[onKey] = true; apply(); sfx.ui();
      sl.onpointermove = (ev) => { const v = Math.round(at(ev) * 20) / 20; if (v !== SET[key]) { SET[key] = v; apply(); if (key === 'sfx') sfx.ui(); } };
      sl.onpointerup = () => { sl.onpointermove = null; sl.classList.remove('drag'); saveSettings(); };
    };
  }
  for (const ln of L.lines) { const d = el('div', 'hr', S); Object.assign(d.style, { left: px(ln.x0), top: px(ln.y), width: px(ln.x1 - ln.x0) }); }

  // ---- segmented choices (language / display)
  const segs = [];
  for (const G of L.segments) {
    const row = el('div', 'row seg', S);
    const hl = el('div', 'rowhl', row); Object.assign(hl.style, { left: px(30), top: px(G.y - 36), width: px(626), height: px(72) });
    put(row, G.icon.img, G.icon.box, 'ico');
    const lab = text(row, G.label, 'lab', null, G.box[0] - G.label.x - 12); Object.assign(lab.style, { left: px(G.label.x), top: px((G.label.y ?? G.y) - G.label.size * 0.7) });
    const bar = el('div', 'segbar', row); box(bar, G.box);
    // cell edges: measured on the mockup (its cells are not equal), else equal parts
    const edges = [G.box[0], ...(G.splits || G.options.slice(1).map((_, i) => G.box[0] + (G.box[2] - G.box[0]) * (i + 1) / G.options.length)), G.box[2]];
    for (const [i, [opt, label, size]] of G.options.entries()) {
      const o = el('div', 'opt', bar); o.dataset.cur = 'hover';
      const cw = edges[i + 1] - edges[i]; o.style.flex = `0 0 ${px(cw)}`;
      text(o, { size: size || G.size }, 'otx', label, cw - 14);
      segs.push({ o, opt, group: G.id });
      o.onpointerdown = (e) => {
        e.stopPropagation(); sfx.ui(); pop(o, e);
        if (G.id === 'language') setLang(opt); else if ((opt === 'fullscreen') !== !!document.fullscreenElement) toggleFullscreen();
        refresh();
      };
    }
  }

  // ---- START / QUIT slabs: black shadow, white border, coloured face (polygons measured on the mockup)
  function slab(spec, cls) {
    const xs = spec.poly.map((p) => p[0]), ys = spec.poly.map((p) => p[1]);
    const bx0 = Math.min(...xs) - 4, by0 = Math.min(...ys) - 4, bx1 = Math.max(...xs) + spec.shadow[0] + 4, by1 = Math.max(...ys) + spec.shadow[1] + 4;
    const b = el('div', `slab ${cls}`, U); b.dataset.cur = 'hover';
    box(b, [bx0, by0, bx1, by1]);
    const poly = (pts, dx = 0, dy = 0) => `polygon(${pts.map(([x, y]) => `${(x - bx0 + dx) * RS}px ${(y - by0 + dy) * RS}px`).join(',')})`;
    el('div', 'sh', b).style.clipPath = poly(spec.poly, spec.shadow[0], spec.shadow[1]);
    el('div', 'bd', b).style.clipPath = poly(spec.poly);
    const face = el('div', 'face', b); face.style.clipPath = poly(inset(spec.poly, spec.border));
    el('div', 'dots', face); el('div', 'sweep', face);
    put(b, spec.icon.img, spec.icon.box.map((v, i) => v - (i % 2 ? by0 : bx0)), 'sico');
    const tx = text(b, spec.text, 'stx'); Object.assign(tx.style, { left: px(spec.text.x - bx0), top: px((Math.min(...ys) + Math.max(...ys)) / 2 - by0) });
    return b;
  }
  const startB = slab(L.start, 'start');
  const quitB = slab(L.quit, 'quit');
  startB.onpointerdown = (e) => { e.stopPropagation(); startB.classList.add('down'); sfx.ui(); };
  startB.onpointerup = () => { if (startB.classList.contains('down')) { startB.classList.remove('down'); go(); } };
  startB.onpointerleave = () => startB.classList.remove('down');
  quitB.onpointerdown = (e) => { e.stopPropagation(); sfx.ui(); window.close(); };

  // ---- feedback
  const fx = new UiFx(stage, DW, DH, shift);
  const toDesign = (cx, cy) => { const r = stage.getBoundingClientRect(); return [(cx - r.left) / r.width * DW, (cy - r.top) / r.height * DH]; };
  function boxOf(n) { const r = n.getBoundingClientRect(); const [x0, y0] = toDesign(r.left, r.top), [x1, y1] = toDesign(r.right, r.bottom); return [x0, y0, x1 - x0, y1 - y0]; }
  function pop(n, e) { n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop'); if (e) { const [x, y] = toDesign(e.clientX, e.clientY); fx.click(x, y); } }
  for (const n of [startB, quitB]) n.addEventListener('pointerenter', () => { const [x, y, w, h] = boxOf(n); fx.hover(x, y, w, h, n === startB ? 8 : 4); });
  girls.addEventListener('pointerenter', (e) => { girls.classList.remove('poke'); void girls.offsetWidth; girls.classList.add('poke'); const [x, y] = toDesign(e.clientX, e.clientY); fx.hearts(x, y - 40, 3);
    const [rx] = toDesign(e.clientX, e.clientY); bubble(rx / RS < L.speech.split ? 'cat' : 'pink', 'poke'); });
  // a speech bubble by one of the girls (text/stickers.json heroines.<id>.<kind>)
  const bub = el('div', 'tbub', U), bubJa = el('b', '', bub), bubTr = el('small', '', bub);
  let bubT = 0;
  function bubble(who, kind) {
    const set = C.text.stickers?.heroines?.[who]?.[kind]; if (!set) return;
    const line = set.lines[Math.floor(Math.random() * set.lines.length)], at = L.speech[who];
    bubJa.textContent = line.ja; bubTr.textContent = lang === 'ja' ? '' : (line[lang] || line.en);
    bub.dataset.who = who; Object.assign(bub.style, { left: px(at[0]), top: px(at[1]) });
    bub.classList.remove('on'); void bub.offsetWidth; bub.classList.add('on');
    clearTimeout(bubT); bubT = setTimeout(() => bub.classList.remove('on'), 1800);
  }
  quitB.addEventListener('pointerenter', () => bubble(Math.random() < 0.5 ? 'pink' : 'cat', 'quit'));
  root.addEventListener('pointermove', (e) => { mouse.tx = e.clientX / window.innerWidth * 2 - 1; mouse.ty = e.clientY / window.innerHeight * 2 - 1; });

  let gone = false;
  function go() {
    if (gone) return;
    gone = true; initAudio(); sfx.clear();
    const [x, y, w, h] = boxOf(startB); fx.click(x + w / 2, y + h / 2, true);
    setTimeout(() => act.start(), 180);   // the click burst shows, then the page turns (main.js -> manga.js)
  }
  function refresh() {
    for (const s of segs) s.o.classList.toggle('on', s.group === 'language' ? s.opt === lang : (s.opt === 'fullscreen') === !!document.fullscreenElement);
  }
  refresh();
  document.addEventListener('fullscreenchange', refresh);
  const onLang = () => { for (const f of texts) f(); refresh(); };   // also when changed elsewhere (the Esc settings panel)
  window.addEventListener('langchange', onLang);

  // ---- loop: parallax + particles (rAF, with a timer fallback when frames are throttled)
  for (let k = 0; k < 8; k++) { const p = fxBack.petal(Math.random() * 0.4 + 0.2); p.y = Math.random() * DH; }
  let last = performance.now(), lastRaf = last, alive = true;
  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt * PX.ease);
    mouse.x += (mouse.tx - mouse.x) * k; mouse.y += (mouse.ty - mouse.y) * k;
    for (const d of layers) { const [dx, dy] = shift(+d.dataset.depth); d.style.transform = `translate(${dx}px, ${dy}px)`; }
    if (Math.random() < dt * 0.6) fxBack.petal(Math.random() * 0.4 + 0.2);
    fxBack.update(dt); fx.update(dt);
  }
  const raf = (now) => { if (!alive) return; lastRaf = now; frame(now); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  const backup = setInterval(() => { if (!alive) clearInterval(backup); else if (performance.now() - lastRaf > 100) frame(performance.now()); }, 33);
  function fit() { const s = Math.min(window.innerWidth / DW, window.innerHeight / DH); stage.style.transform = `translate(-50%, -50%) scale(${s})`; }
  fit();
  window.addEventListener('resize', fit);
  // entrance: the UI pieces arrive one after another (CSS uses --i)
  [...U.children].forEach((c, i) => c.style.setProperty('--i', i));
  setTimeout(() => root.classList.add('in'), 60);
  const api = { start: go, refresh, dispose: () => { alive = false; window.removeEventListener('resize', fit); document.removeEventListener('fullscreenchange', refresh); window.removeEventListener('langchange', onLang); } };
  root.dispose = api.dispose;
  return api;
}
