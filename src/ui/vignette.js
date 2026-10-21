// 特写 - a close-up as a scene of its own (user 2026-10-21: "a close-up is a separate scene / a comic panel that shows one thing - not
// the rest frozen in a mess and the camera dragged through it"; "not too flashy: this is a game, not a fashion show"): the page turns to
// a comic panel in the game's own manga style (src/ui/manga.css: paper with halftone dots, ink frames; the HUD's slanted black plates with
// a white edge and a red shadow). One big slanted panel with the thing alone in it - its own picture, large, on a ground in its own
// colour with a few soft speed lines - a smaller panel with a detail of it when given, and its name on a plate with a line under it.
// It eases in, pushes in slowly while it holds, and the page goes. The fight waits meanwhile (Game.vignette holds it; the page covers it).
//   o: { k: picture key, title, sub (texts {zh, en, ja} or strings), color ('#hex', its ground), crop: [u0, v0, u1, v1] (the detail,
//        from the picture's top left), side (-1: the panel leans the other way), dur (seconds it holds, default 2.2) }
import './vignette.css';
import { url, meta } from '../core/assets.js';
import { tr } from '../core/i18n.js';

const el = (tag, cls, parent, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; if (parent) parent.appendChild(e); return e; };

// returns how long it lasts (seconds); then() when it is gone
export function vignette(root, o, then) {
  const src = url(o.k); if (!src) { then?.(); return 0; }
  const dur = o.dur ?? 2.2, IN = 0.32, OUT = 0.28;
  const page = el('div', `vig${o.side < 0 ? ' flip' : ''}`, root);
  page.style.setProperty('--col', o.color || '#3a2638');
  page.style.setProperty('--dur', `${dur + IN}s`);
  const main = el('div', 'vig-panel vig-main', page);
  el('div', 'vig-ground', main);
  const img = el('img', 'vig-img', main); img.src = src; img.alt = '';
  if (o.crop) {   // (a detail of it in a panel of its own: the picture zoomed so the crop fills it)
    const [u0, v0, u1, v1] = o.crop, d = el('div', 'vig-panel vig-detail', page), w = u1 - u0, h = v1 - v0;
    const m = meta[o.k] || {}, ar = (m.w || 1) / (m.h || 1);
    d.style.backgroundImage = `url("${src}")`;
    d.style.backgroundSize = `${100 / w}% ${100 / h}%`;
    d.style.backgroundPosition = `${w < 1 ? (u0 / (1 - w)) * 100 : 0}% ${h < 1 ? (v0 / (1 - h)) * 100 : 0}%`;
    d.style.setProperty('--ar', String(ar * w / h));
  }
  if (o.title) {
    const plate = el('div', 'vig-plate', page);
    el('b', null, plate, typeof o.title === 'string' ? o.title : tr(o.title));
    if (o.sub) el('span', null, plate, typeof o.sub === 'string' ? o.sub : tr(o.sub));
  }
  requestAnimationFrame(() => page.classList.add('on'));
  const total = IN + dur + OUT;
  setTimeout(() => page.classList.add('out'), (IN + dur) * 1000);
  setTimeout(() => { page.remove(); then?.(); }, total * 1000);
  return total;
}
