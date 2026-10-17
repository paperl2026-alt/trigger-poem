// Manga-page transitions (docs/DESIGN.md「漫画转场的规矩」): one page, read whole. The panels come in one by one in reading order; the page
// itself never moves — each panel has its own small camera move inside it (kb: in / out / left / right / up / down) and may carry short
// non-dialogue lettering (text: LIMITED, 限定, 17:00, BOOM ...). Tap = show all / next.
import { url, meta } from '../core/assets.js';
import { sfx } from '../core/audio.js';
import { t, tr } from '../core/i18n.js';
import { C } from '../core/content.js';

// Pages: content comics.json. rects are % of a 16:9 page; clip is a polygon in % of the panel; pos = background focus; in = entrance
const COMICS = C.comics;

export class Comic {
  constructor() {
    this.el = document.getElementById('comic');
    this.timers = [];
  }
  // true when every panel image of the comic exists (new episodes may not have their pages drawn yet)
  static ready(name) { return !!COMICS[name] && COMICS[name].every((pg) => (pg.page ? !!meta[pg.page] : pg.every((p) => !!meta[p.img]))); }
  play(name, onDone) {
    const pages = COMICS[name];
    const el = this.el;
    el.innerHTML = '';
    el.className = 'on';
    const tok = el.dataset.tok = String(Math.random());   // (the overlay is shared: a door close-up may take it over before this page's fade-out ends)
    const stage = document.createElement('div');
    stage.className = 'cstage';
    el.appendChild(stage);
    const skip = document.createElement('button');
    skip.className = 'cskip';
    skip.textContent = t('skip');
    el.appendChild(skip);
    let page = 0, shown = false, done = false;
    const finish = () => {
      if (done) return;
      done = true;
      this.clear();
      el.classList.add('out');
      setTimeout(() => { if (el.dataset.tok === tok) { el.className = ''; el.innerHTML = ''; } }, 350);
      onDone && onDone();
    };
    const showPage = (i) => {
      this.clear();
      stage.innerHTML = '';
      shown = false;
      const pageEl = document.createElement('div');
      pageEl.className = 'cpage';
      stage.appendChild(pageEl);
      let last = 0;
      // a whole drawn page (lettering in it): each panel = the page clipped to its polygon, appearing in turn, its own small move inside
      if (pages[i].page) {
        const pg = pages[i];
        for (const p of pg.panels) {
          const wrap = document.createElement('div');
          wrap.className = 'pwrap ppage';
          const panel = document.createElement('div');
          panel.className = 'panel';
          panel.style.clipPath = `polygon(${p.poly.map(([x, y]) => `${x}% ${y}%`).join(',')})`;
          const img = document.createElement('div');
          img.className = `pimg full kb-${p.kb || 'in'}`;
          img.style.backgroundImage = `url(${url(pg.page)})`;
          const cx = p.poly.reduce((s, q) => s + q[0], 0) / p.poly.length, cy = p.poly.reduce((s, q) => s + q[1], 0) / p.poly.length;
          img.style.transformOrigin = `${cx}% ${cy}%`;
          panel.appendChild(img);
          wrap.appendChild(panel);
          wrap.style.transformOrigin = `${cx}% ${cy}%`;
          pageEl.appendChild(wrap);
          this.later(p.at, () => { wrap.classList.add('in', p.in); sfx.panel(); });
          last = Math.max(last, p.at);
        }
        this.later(last + 0.6, () => { shown = true; });
        this.later(last + 3.4, next);
        return;
      }
      const panels = pages[i];
      for (const p of panels) {
        const wrap = document.createElement('div');
        wrap.className = 'pwrap';
        Object.assign(wrap.style, { left: `${p.rect[0]}%`, top: `${p.rect[1]}%`, width: `${p.rect[2]}%`, height: `${p.rect[3]}%` });
        const panel = document.createElement('div');
        panel.className = 'panel';
        panel.style.clipPath = `polygon(${p.clip})`;
        const img = document.createElement('div');
        img.className = 'pimg';
        img.style.backgroundImage = `url(${url(p.img)})`;
        img.style.backgroundPosition = p.pos;
        img.classList.add(`kb-${p.kb || 'in'}`);
        panel.appendChild(img);
        wrap.appendChild(panel);
        pageEl.appendChild(wrap);
        // short lettering on the panel (not lines of dialogue): % of the panel, size in % of the page height
        for (const tx of p.text || []) {
          const el = document.createElement('div');
          el.className = `ctext ${tx.style || 'pop'}`;
          el.textContent = typeof tx.t === 'string' ? tx.t : tr(tx.t);
          Object.assign(el.style, { left: `${tx.x}%`, top: `${tx.y}%` });
          el.style.setProperty('--r', `${tx.r || 0}deg`); el.style.setProperty('--s', `${tx.s || 6}`);   // custom properties: setProperty only
          wrap.appendChild(el);
          this.later(p.at + (tx.at ?? 0.35), () => el.classList.add('in'));
        }
        this.later(p.at, () => { wrap.classList.add('in', p.in); sfx.panel(); });
        last = Math.max(last, p.at);
        for (const s of p.sfx || []) {
          const im = document.createElement('img');
          im.className = 'csfx';
          im.src = url(s.k);
          Object.assign(im.style, { left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, '--r': `${s.r}deg` });
          pageEl.appendChild(im);
          this.later(s.at, () => { im.classList.add('in'); sfx.stamp(); if (s.shake) { stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); } });
          last = Math.max(last, s.at);
        }
      }
      this.later(last + 0.6, () => { shown = true; });
      this.later(last + 3.6, next);
    };
    const showAll = () => {
      this.clear();
      stage.querySelectorAll('.pwrap').forEach((w) => w.classList.add('in', 'instant'));
      stage.querySelectorAll('.ctext').forEach((w) => w.classList.add('in'));
      stage.querySelectorAll('.csfx').forEach((s) => s.classList.add('in', 'instant'));
      shown = true;
      this.later(3, next);
    };
    const next = () => { page++; if (page >= pages.length) finish(); else showPage(page); };
    el.onpointerdown = (e) => {
      e.preventDefault();
      if (e.target === skip) { finish(); return; }
      if (!shown) showAll(); else next();
    };
    showPage(0);
  }
  later(s, fn) { this.timers.push(setTimeout(fn, s * 1000)); }
  clear() { this.timers.forEach(clearTimeout); this.timers = []; }
  abort() { this.clear(); this.el.onpointerdown = null; this.el.className = ''; this.el.innerHTML = ''; }
}
