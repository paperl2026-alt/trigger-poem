// Chapter select in the red / black / white style, built from the approved mockup art/ref/select_ref.png (content ui/select.json).
// Everything painted comes from that mockup: the plate, the control plates (cut out with their lettering removed, so they
// keep the mockup's exact textures), the two character card pictures (they trade places on a 1P / 2P swap) and the icons.
// The game writes its own text on top at the places, sizes and angles measured on the mockup.
import { url, meta } from '../core/assets.js';
import { sfx, initAudio, voice } from '../core/audio.js';
import { C, list, isStage } from '../core/content.js';
import { t, tr } from '../core/i18n.js';
import { SAVE, persist, levelProgress, maxLv, stagesOpen } from '../core/save.js';
import { UiFx } from './uifx.js';
import { mountBag } from './bag.js';
import { cursorScene } from './cursor.js';
import './select.css';

// every class of this screen is prefixed s- (old global styles use the same short names: .card, .swap, .go ...)
const KEEP = new Set(['screen', 'sel', 'p5', 'in']);
const pre = (cls) => cls.split(/\s+/).filter(Boolean).map((c) => (KEEP.has(c) ? c : `s-${c}`)).join(' ');
const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = pre(cls); if (parent) parent.appendChild(e); return e; };
const has = (k) => !!(k && meta[k]);
const ar = (k) => (has(k) ? meta[k].h / meta[k].w : 1);
// "第1话　腐蜜之家（制作中）" -> ["第1话", "腐蜜之家"]: the number and the name are set apart on the next-chapter card
function splitTitle(s) {
  const m = /^(\S+)[\s　]+(.*)$/.exec(s || '');
  const strip = (x) => x.replace(/\s*[（(][^（）()]*[）)]\s*$/, '');
  return m ? [m[1], strip(m[2])] : ['', strip(s || '')];
}

export function showSelect(act) {
  const L = C.ui.select, ui = document.getElementById('ui');
  ui.innerHTML = '';
  cursorScene('menu');
  const root = el('div', 'screen sel p5', ui);
  for (const [k, v] of Object.entries(L.colors)) root.style.setProperty(`--${k}`, v);
  const stage = el('div', 'sel-stage', root);
  const [DW, DH] = L.design, RS = DW / L.refSize[0];
  Object.assign(stage.style, { width: `${DW}px`, height: `${DH}px` });
  const px = (v) => `${v * RS}px`;
  const box = (n, [x0, y0, x1, y1]) => Object.assign(n.style, { left: px(x0), top: px(y0), width: px(x1 - x0), height: px(y1 - y0) });
  // an image in its box: pieces fill it exactly (their boxes are their own pixels), icons are contained in it
  function img(parent, key, b, cls = '', contain = false) {
    const n = el('img', `si ${cls}`, parent); n.draggable = false; if (has(key)) n.src = url(key);
    if (!contain) { box(n, b); return n; }
    const [x0, y0, x1, y1] = b.map((v) => v * RS), bw = x1 - x0, bh = y1 - y0, a = ar(key);
    let w = bw, h = bw * a; if (h > bh) { h = bh; w = bh / a; }
    Object.assign(n.style, { left: `${x0 + (bw - w) / 2}px`, top: `${y0 + (bh - h) / 2}px`, width: `${w}px`, height: `${h}px` });
    return n;
  }
  // a group: a piece of the mockup plus what the game puts on it; positions inside stay in mockup px of the whole screen
  function group(cls, parent = U) { const g = el('div', `grp ${cls}`, parent); return g; }
  // the contrast layer of a piece (user 2026-10-18: hover / press / the picked stage must be obvious, not just a little bigger): the
  // piece's own shape (its image as a mask) in one solid colour, right over it and under what is written on it; select.css shows it
  function shade(piece, colour) {
    const n = el('div', 'hl', piece.parentNode); piece.after(n);
    for (const k of ['left', 'top', 'width', 'height']) n.style[k] = piece.style[k];
    const m = `url("${piece.src}")`; n.style.maskImage = m; n.style.webkitMaskImage = m; n.style.setProperty('--hl', colour);
    return n;
  }
  // text at a measured place: centred on (x, y), or from its left end (align left); turned by deg; shrunk to maxW
  const texts = [];
  function text(parent, spec, cls = '', get = null, reg = texts) {
    const n = el('div', `tx ${cls}`, parent);
    if (spec.italic) n.style.fontStyle = 'italic';
    const left = spec.align === 'left', right = spec.align === 'right';
    n.style.left = px(spec.x); n.style.top = px(spec.y + (L.textDy || 0));   // textDy: the font sits a little low in its line
    n.style.transformOrigin = left ? '0 50%' : right ? '100% 50%' : '50% 50%';
    const say = () => {
      n.textContent = get ? get() : spec.key ? t(spec.key) : spec.text || '';
      n.style.fontSize = px(spec.size);
      let s = 1; if (spec.maxW && n.offsetWidth > spec.maxW * RS) s = spec.maxW * RS / n.offsetWidth;
      n.style.transform = `translate(${left ? 0 : right ? -100 : -50}%, -50%) rotate(${spec.deg || 0}deg) scale(${s})`;
    };
    say(); reg.push(say); n.say = say;
    return n;
  }
  let rowTexts = [];   // the stage rows are rebuilt for each chapter: their text is kept apart
  const say = () => { for (const f of texts) f(); for (const f of rowTexts) f(); };

  // ---- layers: the plate, then the controls (same depth, so they stay on their plate), particles over everything
  const PX = L.parallax, mouse = { x: 0, y: 0, tx: 0, ty: 0 }, layers = [];
  const shift = (d) => [-mouse.x * d * PX.max, -mouse.y * d * PX.max * 0.55];
  const layer = (depth, cls) => { const d = el('div', `plx ${cls}`, stage); d.dataset.depth = depth; layers.push(d); return d; };
  const plate = layer(L.plate.depth, 'plate');
  { const pad = PX.max * L.plate.depth + 10, i = el('img', 'si', plate); i.draggable = false; i.src = url(L.plate.img);
    Object.assign(i.style, { left: `${-pad}px`, top: `${-pad * 0.6}px`, width: `${DW + pad * 2}px`, height: `${DH + pad * 1.2}px` }); }
  const fxBack = new UiFx(stage, DW, DH, shift);
  const U = layer(L.uiDepth, 'uil');
  const P = L.pieces;

  // ---- top bar: back to the title, coins, settings
  const back = group('back btn'); back.dataset.cur = 'hover';
  shade(img(back, P.back.img, P.back.box), 'var(--red)');
  const tri = el('div', 'tri', back);
  { const T = L.back.tri, xs = T.map((p) => p[0]), ys = T.map((p) => p[1]), b = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    box(tri, b); tri.style.clipPath = `polygon(${T.map(([x, y]) => `${(x - b[0]) / (b[2] - b[0]) * 100}% ${(y - b[1]) / (b[3] - b[1]) * 100}%`).join(',')})`; }
  text(back, L.back.text, 'wh');
  const coins = group('coins');
  img(coins, P.coins.img, P.coins.box);
  img(coins, L.coins.icon.img, L.coins.icon.box, 'coin', true);
  text(coins, { ...L.coins.text, x: L.coins.text.x1, align: 'right' }, 'wh num', () => (SAVE.dd || 0).toLocaleString('en-US'));
  const gear = group('gear btn'); gear.dataset.cur = 'hover';
  shade(img(gear, P.gear.img, P.gear.box), 'var(--red)');
  img(gear, L.gear.icon.img, L.gear.icon.box, 'gico', true);

  // ---- tabs (team / bag)
  let tab = 'team';
  const tabs = L.tabs.map((T) => {
    const pc = P[`tab_${T.id}`], g = group(`tab btn t-${T.id}`); g.dataset.cur = 'hover';
    const face = img(g, pc.on, pc.box);
    shade(face, 'var(--ink)');
    img(g, T.icon.img, T.icon.box, 'tico', true);
    const tx = text(g, T.text, 'ttx');
    return { T, g, face, tx, pc };
  });
  function setTab(id) {
    tab = id;
    for (const k of tabs) { const on = k.T.id === id; k.face.src = url(on ? k.pc.on : k.pc.off); k.g.classList.toggle('s-on', on); }
    // the bag page lies over the team cards (src/ui/bag.js)
    const team = id === 'team';
    for (const n of [...lows.map((l) => l.g), ...Object.values(arts), swapG]) n.classList.toggle('s-none', !team);
    bag.show(!team);
  }

  // ---- the chapter: header, stage rows, best, GO, next chapter card, arrows
  const eps = list('episodes').filter((e) => !e.hidden);   // hidden = tech validations, opened by their own launcher
  let idx = Math.max(0, eps.findIndex((e) => e.id === (SAVE.lastEp || 'ep0')));
  const open = (e) => !e.teaser && !!SAVE.eps[e.id]?.open;
  const chap = group('chap');
  const H = L.chapter;
  const head = group('head', chap);
  img(head, P.header.img, P.header.box);
  text(head, H.label, 'ink lab');
  text(head, H.no, 'red no', () => String(eps[idx].no));
  text(head, H.title, 'ink ttl', () => tr(eps[idx].title).replace(/　/g, ' ').replace(/\s*[（(][^（）()]*[）)]\s*$/, ''));
  text(head, H.sub, 'ink sub', () => tr(eps[idx].sub || ''));
  const rowsG = group('rows', chap);
  const bestG = group('best', chap);
  img(bestG, P.best.img, P.best.box);
  img(bestG, L.best.crown.img, L.best.crown.box, '', true);
  text(bestG, L.best.word, 'ink');
  // the best full-clear time of this chapter (no rating: DESIGN 局外)
  text(bestG, L.best.no, 'red', () => { const b = SAVE.eps[eps[idx].id]?.bestTime; return b == null ? '--:--' : `${Math.floor(b / 60)}:${String(Math.floor(b % 60)).padStart(2, '0')}`; });
  const goG = group('go btn'); goG.dataset.cur = 'hover';
  const goFace = img(goG, P.go.img, P.go.box, 'face');
  shade(goFace, 'var(--ink)');
  el('div', 'sweep', goG).style.clipPath = 'inset(0)';
  img(goG, L.go.icon.img, L.go.icon.box, 'gtri', true);
  const goTx = text(goG, L.go.text, 'wh gtx', () => (open(eps[idx]) ? t('go') : eps[idx].teaser ? t('soon') : t('locked')));


  let pick = 99;   // the picked stage of this chapter (99 = the last open one)
  // a chapter with more stages than rows is shown a page at a time (docs/DESIGN.md 选关: the user picked pages of 3): the arrows above /
  // below the rows, the wheel over them, or ↑ ↓ turn the page; the page follows the picked stage
  let page = 0, pageFollows = true;
  const pagesG = group('pages', chap);
  function renderRows() {
    rowsG.innerHTML = ''; rowTexts = []; pagesG.innerHTML = '';
    const e = eps[idx], R = L.rows, per = R.slots.length;
    if (!open(e)) { rowsG.classList.add('s-none'); return; }
    rowsG.classList.remove('s-none');
    const all = (e.steps || []).filter(isStage), nOpen = Math.min(stagesOpen(e.id), all.length), pages = Math.ceil(all.length / per);   // (a cleared chapter counts one past its last stage)
    if (pick >= nOpen) pick = nOpen - 1;
    if (pageFollows) page = Math.floor(Math.max(0, pick) / per);
    page = Math.max(0, Math.min(pages - 1, page)); pageFollows = true;
    const steps = all.slice(page * per, page * per + per);
    if (pages > 1) renderPager(pages);
    steps.forEach((s, j) => {
      const i = page * per + j;
      const pc = s.boss ? P.row_boss : P.row_n, y0 = R.slots[j];
      // the piece's own top sits on its mockup slot (row_n came from slot 2, row_boss from slot 3)
      const dy = y0 - (s.boss ? R.slots[2] : R.slots[1]);
      const g = group('row', rowsG); g.style.setProperty('--i', i);
      const locked = i >= nOpen;
      // its own slot, and the picked one nudged out (one translate: a CSS one would replace the slot offset and hide the row under the next)
      g.style.translate = `${!locked && i === pick ? 14 : 0}px ${dy * RS}px`;
      g.classList.toggle('s-row-lock', locked); g.classList.toggle('s-row-open', !locked); g.classList.toggle('s-row-pick', i === pick);
      g.dataset.cur = 'hover';
      tap(g, (ev) => { if (locked) { shake(g); sfx.uiDeny(); return; } pick = i; sfx.ui(); pop(g, ev); renderRows(); });
      if (!locked) g.addEventListener('pointerenter', () => sfx.uiMove());
      const plate = img(g, pc.img, pc.box);
      if (!locked) shade(plate, 'var(--ink)');
      if (has(s.thumb)) { const th = img(g, s.thumb, [R.thumb.x0, R.slots[s.boss ? 2 : 1] + R.thumb.dy0, R.thumb.x1, R.slots[s.boss ? 2 : 1] + R.thumb.dy1], 'thumb'); th.style.objectFit = 'cover'; }
      const ys = R.slots[s.boss ? 2 : 1];
      img(g, R.chev.img, [R.chev.box[0], ys + R.chev.dy0, R.chev.box[2], ys + R.chev.dy1], 'chev', true);
      if (s.boss) {
        img(g, R.boss.skull.img, R.boss.skull.box, '', true);
        text(g, R.boss.word, 'wh boss', null, rowTexts);
        text(g, { ...R.text, x: R.boss.textX, y: ys + R.text.dy, align: 'left', maxW: R.text.maxW + 10 }, 'ink', () => tr(s.name), rowTexts);
      } else {
        text(g, { ...R.no, y: ys + R.no.dy }, 'wh rno', () => String(i + 1), rowTexts);
        text(g, { ...R.text, y: ys + R.text.dy, align: 'left' }, 'ink', () => tr(s.name), rowTexts);
      }
      if (locked && has('ui/sel_icon_lock_big')) img(g, 'ui/sel_icon_lock_big', [R.chev.box[0] - 30, ys + R.chev.dy0 - 22, R.chev.box[2] + 6, ys + R.chev.dy1 + 22], 'rlock', true);
    });
  }
  // the page arrows and dots (ui/select.json rows.pager)
  function renderPager(pages) {
    const Q = L.rows.pager;
    for (const [dir, b] of [[-1, Q.up], [1, Q.down]]) {
      const a = el('div', `pgar ${dir < 0 ? 'up' : 'dn'}`, pagesG); box(a, b);
      a.classList.toggle('s-off', dir < 0 ? page === 0 : page === pages - 1);
      a.dataset.cur = 'hover';
      tap(a, () => turnPage(dir));
    }
    for (let k = 0; k < pages; k++) {
      const d = el('div', 'pgdot', pagesG); box(d, [Q.dots.x + k * Q.dots.gap, Q.dots.y, Q.dots.x + k * Q.dots.gap + Q.dots.size, Q.dots.y + Q.dots.size]);
      d.classList.toggle('s-on', k === page);
      tap(d, () => { if (k !== page) { page = k; pageFollows = false; sfx.panel(); renderRows(); } });
    }
  }
  function turnPage(dir) {
    const e = eps[idx], per = L.rows.slots.length, pages = Math.ceil((e.steps || []).filter(isStage).length / per);
    const np = page + dir;
    if (!open(e) || np < 0 || np >= pages) { sfx.uiDeny(); return; }
    page = np; pageFollows = false; sfx.uiPage(); renderRows();
  }
  // ↑ ↓: the stage before / after (the page turns with it)
  function step(dir) {
    const e = eps[idx]; if (!open(e)) return;
    const n = Math.min(stagesOpen(e.id), (e.steps || []).filter(isStage).length), np = Math.max(0, Math.min(n - 1, (pick >= n ? n - 1 : pick) + dir));
    if (np === pick) { sfx.uiDeny(); return; }
    pick = np; sfx.uiMove(); renderRows();
  }
  rowsG.addEventListener('wheel', (ev) => { ev.preventDefault(); turnPage(ev.deltaY > 0 ? 1 : -1); }, { passive: false });

  // the chapter card between the arrows (user 2026-10-18): a placeholder picture, and while an arrow is hovered the card of the chapter
  // it leads to (its number, name, and a padlock only when it is not open yet); switching happens on the arrows only
  const nextG = group('next');
  const N = L.next;
  let peek = 0;   // -1 / 1 = the arrow hovered, 0 = none
  const peekEp = () => (peek ? eps[idx + peek] : null);
  const nextImg = img(nextG, N.placeholder || N.img, N.box);
  text(nextG, N.no, 'lt', () => splitTitle(tr(peekEp()?.title || ''))[0]);
  text(nextG, N.title, 'lt nt', () => splitTitle(tr(peekEp()?.title || ''))[1]);
  text(nextG, N.wip, 'lt', () => { const e = peekEp(); return !e ? '' : e.teaser ? t('soon') : open(e) ? '' : t('locked'); });
  const nLock = img(nextG, N.lock.img, N.lock.box, 'nlock', true);
  nextG.style.transformOrigin = `${(N.box[0] + N.box[2]) / 2 * RS}px ${(N.box[1] + N.box[3]) / 2 * RS}px`;   // (it flips about its own middle)
  function renderCard() {
    const e = peekEp(), key = e ? (has(e.cover) ? e.cover : N.img) : (N.placeholder || N.img);
    if (nextImg.dataset.key !== key) { nextImg.dataset.key = key; nextImg.src = url(key); nextG.classList.remove('s-flip'); void nextG.offsetWidth; nextG.classList.add('s-flip'); }
    nLock.classList.toggle('s-none', !e || open(e));
    nextG.classList.toggle('s-peek', !!e);
    say();
  }
  const arrows = {};
  for (const k of ['l', 'r']) {
    const a = group(`arrow btn a-${k}`); a.dataset.cur = 'hover';
    { const B = L.arrows[k].box; a.style.transformOrigin = `${(B[0] + B[2]) / 2 * RS}px ${(B[1] + B[3]) / 2 * RS}px`; }
    shade(img(a, L.arrows[k].img, L.arrows[k].box, '', true), 'var(--red)');
    a.addEventListener('pointerenter', () => { peek = k === 'l' ? -1 : 1; renderCard(); });
    a.addEventListener('pointerleave', () => { peek = 0; renderCard(); });
    arrows[k] = a;
  }

  function renderChapter() {
    const e = eps[idx], nx = eps[idx + 1];
    renderRows();
    bestG.classList.toggle('s-none', !open(e));
    goG.classList.toggle('s-locked', !open(e));
    void nx;
    // no arrow where there is no chapter (the prologue has no left one, the last chapter no right one)
    arrows.l.classList.toggle('s-none', idx === 0);
    arrows.r.classList.toggle('s-none', idx === eps.length - 1);
    // the arrow still under the cursor after a switch shows the next chapter on from there
    peek = !arrows.r.classList.contains('s-none') && arrows.r.matches(':hover') ? 1 : !arrows.l.classList.contains('s-none') && arrows.l.matches(':hover') ? -1 : 0;
    renderCard();
  }
  function flip(dir) {
    const ni = idx + dir;
    if (ni < 0 || ni >= eps.length) { sfx.uiDeny(); return; }
    sfx.uiPage();
    chap.classList.remove('s-in-l', 's-in-r'); void chap.offsetWidth;
    idx = ni; pick = 99; renderChapter();
    chap.classList.add(dir > 0 ? 's-in-r' : 's-in-l');
  }

  // ---- the team: two cards; the pictures belong to the girls, the name plates to the 1P / 2P places
  const CD = L.cards;
  const lows = [P.low_cat, P.low_pink].map((pc, slot) => {
    const g = group(`low s${slot}`);
    img(g, pc.img, pc.box);
    const dx = slot * CD.dx, o = (s) => ({ ...s, x: s.x + dx });
    text(g, o(CD.badge), 'wh badge', () => `${slot + 1}P`);
    text(g, { ...o(CD.name), align: 'left' }, 'ink name', () => { const c = C.characters[SAVE.team[slot]]; return c ? `${tr(c.name)} · ${tr(c.role)}` : ''; });
    img(g, CD.swords.img, CD.swords.box.map((v, i) => v + (i % 2 ? 0 : dx)), '', true);
    text(g, { ...o(CD.mastery), align: 'left' }, 'ink mast', () => { const st = SAVE.chars[SAVE.team[slot]]; const pr = levelProgress(st?.xp || 0); return `${t('mastery')} Lv${pr.lv}${pr.lv >= maxLv() ? ' MAX' : ''}`; });
    const bar = el('div', 'bar', g); box(bar, [CD.bar.x0 + dx, CD.bar.y - CD.bar.h / 2, CD.bar.x1 + dx, CD.bar.y + CD.bar.h / 2]);
    const fill = el('i', '', bar);
    const chips = CD.chips.map((ch) => {
      const cg = el('div', `chip c-${ch.id}`, g); cg.dataset.cur = 'hover';
      img(cg, ch.icon.img, ch.icon.box.map((v, i) => v + (i % 2 ? 0 : dx)), '', true);
      text(cg, o(ch.text), ch.id === 'base' ? 'wh' : 'ink');
      return cg;
    });
    return { g, fill, chips, slot };
  });
  const arts = {};
  for (const [id, A] of Object.entries(CD.art)) {
    const n = img(U, A.img, A.box, 'card'); n.dataset.cur = 'hover'; n.dataset.native = A.slot || 0; arts[id] = n;
  }
  function renderTeam(animate) {
    SAVE.team.forEach((id, slot) => {
      const n = arts[id]; if (!n) return;
      n.classList.toggle('s-moving', !!animate);
      n.style.translate = `${(slot - +n.dataset.native) * CD.slots[1] * RS}px 0`;
    });
    for (const l of lows) {
      const st = SAVE.chars[SAVE.team[l.slot]];
      l.fill.style.width = `${levelProgress(st?.xp || 0).frac * 100}%`;
    }
    say();
  }

  const swapG = group('swap btn'); swapG.dataset.cur = 'hover';
  shade(img(swapG, P.swap.img, P.swap.box), 'var(--red)');
  img(swapG, L.swap.icon.img, L.swap.icon.box, 'sico', true);
  text(swapG, L.swap.text, 'wh');
  let bag = { show() {} };   // (made once the feedback helpers below exist)

  // ---- feedback and actions
  const fx = new UiFx(stage, DW, DH, shift);
  const toDesign = (cx, cy) => { const r = stage.getBoundingClientRect(); return [(cx - r.left) / r.width * DW, (cy - r.top) / r.height * DH]; };
  function boxOf(n) { const r = n.getBoundingClientRect(); const [x0, y0] = toDesign(r.left, r.top), [x1, y1] = toDesign(r.right, r.bottom); return [x0, y0, x1 - x0, y1 - y0]; }
  function pop(n, e) { n.classList.remove('s-pop'); void n.offsetWidth; n.classList.add('s-pop'); if (e) { const [x, y] = toDesign(e.clientX, e.clientY); fx.click(x, y); } }
  function shake(n) { n.classList.remove('s-shake'); void n.offsetWidth; n.classList.add('s-shake'); }
  const tap = (n, f) => { n.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); initAudio(); press(n); f(e); }; };
  function press(n) { n.classList.add('s-press'); clearTimeout(n.pressT); n.pressT = setTimeout(() => n.classList.remove('s-press'), 170); }
  for (const n of [back, gear, ...tabs.map((k) => k.g), goG, arrows.l, arrows.r, swapG]) n.addEventListener('pointerenter', () => { const [x, y, w, h] = boxOf(n); fx.hover(x, y, w, h, n === goG ? 8 : 4); sfx.uiMove(); });
  tap(back, (e) => { sfx.uiBack(); pop(back, e); act.title(); });
  tap(gear, (e) => { sfx.ui(); pop(gear, e); act.settings(); });
  for (const k of tabs) tap(k.g, (e) => { pop(k.g, e); sfx.uiTab(); setTab(k.T.id); });
  bag = mountBag({ el, pre, box, px, RS, tap, pop, shake, say }, U);
  window.addEventListener('langchange', () => { if (tab === 'bag') bag.render(); });
  tap(arrows.l, (e) => { pop(arrows.l, e); flip(-1); });
  tap(arrows.r, (e) => { pop(arrows.r, e); flip(1); });
  let going = false;
  // the one leading the team says she is off (text/stickers.json start)
  const goLine = () => { const who = SAVE.team[0], n = C.text.stickers?.heroines?.[who]?.start?.lines?.length || 0; if (n) voice(who, 'start', Math.floor(Math.random() * n), 0, 6); };
  function go() {
    const ep = eps[idx];
    if (going) return;
    if (!open(ep)) { shake(goG); sfx.uiDeny(); return; }
    going = true; initAudio(); sfx.uiStart(); goLine(); const [x, y, w, h] = boxOf(goG); fx.click(x + w / 2, y + h / 2, true); goG.classList.add('s-down');
    SAVE.lastEp = ep.id; persist();
    // from the picked stage: its step, or the transitions just before it (comic pages, door close-ups)
    const stages = ep.steps.filter(isStage), si = ep.steps.indexOf(stages[Math.min(pick, stages.length - 1)]);
    let from = Math.max(0, si);
    while (from > 0 && !isStage(ep.steps[from - 1])) from--;
    setTimeout(() => act.play(ep.id, from), 220);
  }
  tap(goG, () => go());
  tap(swapG, (e) => { sfx.uiSwap(); pop(swapG, e); SAVE.team.reverse(); persist(); renderTeam(true); for (const l of lows) pop(l.g); });
  for (const l of lows) for (const c of l.chips) tap(c, (e) => { pop(c, e); if (c.classList.contains('s-c-limit')) { shake(c); sfx.uiDeny(); } else sfx.ui(); });
  for (const n of Object.values(arts)) n.addEventListener('pointerenter', (e) => { n.classList.remove('s-poke'); void n.offsetWidth; n.classList.add('s-poke'); const [x, y] = toDesign(e.clientX, e.clientY); fx.hearts(x, y - 30, 3); });
  root.addEventListener('pointermove', (e) => { mouse.tx = e.clientX / window.innerWidth * 2 - 1; mouse.ty = e.clientY / window.innerHeight * 2 - 1; });

  setTab('team'); renderChapter(); renderTeam(false);
  window.addEventListener('langchange', say);
  document.fonts?.ready.then(say);

  // ---- loop
  for (let k = 0; k < 6; k++) { const p = fxBack.petal(Math.random() * 0.4 + 0.2); p.y = Math.random() * DH; }
  let last = performance.now(), lastRaf = last, alive = true;
  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt * PX.ease);
    mouse.x += (mouse.tx - mouse.x) * k; mouse.y += (mouse.ty - mouse.y) * k;
    for (const d of layers) { const [dx, dy] = shift(+d.dataset.depth); d.style.transform = `translate(${dx}px, ${dy}px)`; }
    if (Math.random() < dt * 0.45) fxBack.petal(Math.random() * 0.4 + 0.2);
    fxBack.update(dt); fx.update(dt);
  }
  const raf = (now) => { if (!alive) return; lastRaf = now; frame(now); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  const backup = setInterval(() => { if (!alive) clearInterval(backup); else if (performance.now() - lastRaf > 100) frame(performance.now()); }, 33);
  function fit() { const s = Math.min(window.innerWidth / DW, window.innerHeight / DH); stage.style.transform = `translate(-50%, -50%) scale(${s})`; }
  fit();
  window.addEventListener('resize', fit);
  // entrance: the controls drop in one after another (Web Animations, so it never fights the hover / poke effects)
  [...U.children].forEach((c, i) => c.animate([{ opacity: 0, transform: 'translateY(-34px)' }, { opacity: 1, transform: 'none' }],
    { duration: 480, delay: 60 + i * 28, easing: 'cubic-bezier(0.2, 1.3, 0.4, 1)', fill: 'backwards' }));
  root.classList.add('in');
  // keys / pad (main.js): arrows or LB / RB flip the chapter, Enter or A departs
  const api = { flip, go, step, dispose: () => { alive = false; window.removeEventListener('resize', fit); window.removeEventListener('langchange', say); } };
  root.dispose = api.dispose;
  return api;
}
