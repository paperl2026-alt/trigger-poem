// Manga-page transitions: panels slam in one by one, baked katakana SFX stamp on top. Tap = show all / next.
import { url, meta } from '../engine/assets.js';
import { sfx } from '../engine/audio.js';
import { t } from './i18n.js';

// rects are % of a 16:9 page; clip is a polygon in % of the panel; pos = background focus; in = entrance
export const COMICS = {
  // ---- episode 0
  ep0_intro: [[
    { img: 'comic/t1', rect: [1.5, 2.5, 97, 50], clip: '0 0,100% 0,100% 90%,0 100%', pos: '50% 40%', in: 'slideL', at: 0.1, sfx: [{ k: 'sfx2/ba', x: 70, y: 6, w: 20, r: 8, at: 0.6 }] },
    { img: 'comic/t2', rect: [1.5, 48.5, 97, 49], clip: '0 9%,100% 0,100% 100%,0 100%', pos: '50% 45%', in: 'punch', at: 1.4, sfx: [{ k: 'sfx2/don', x: 6, y: 56, w: 20, r: -10, at: 1.8, shake: true }] },
  ]],
  ep0_boss: [[
    { img: 'comic/t3', rect: [1.5, 2.5, 97, 95], clip: '0 0,100% 0,100% 100%,0 100%', pos: '50% 50%', in: 'drop', at: 0.1, sfx: [{ k: 'sfx2/gogogo', x: 74, y: 8, w: 22, r: 8, at: 0.7, shake: true }] },
  ]],
  ep0_end: [[
    { img: 'comic/t4', rect: [1.5, 2.5, 59, 95], clip: '0 0,100% 0,93% 100%,0 100%', pos: '50% 45%', in: 'slideL', at: 0.1, sfx: [{ k: 'sfx2/gaan', x: 4, y: 6, w: 22, r: -10, at: 0.7, shake: true }] },
    { img: 'comic/t5', rect: [56.5, 2.5, 42, 95], clip: '9% 0,100% 0,100% 100%,0 100%', pos: '50% 50%', in: 'slideR', at: 1.5 },
  ]],
};

export class Comic {
  constructor() {
    this.el = document.getElementById('comic');
    this.timers = [];
  }
  // true when every panel image of the comic exists (new episodes may not have their pages drawn yet)
  static ready(name) { return !!COMICS[name] && COMICS[name].every((pg) => pg.every((p) => !!meta[p.img])); }
  play(name, onDone) {
    const pages = COMICS[name];
    const el = this.el;
    el.innerHTML = '';
    el.className = 'on';
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
      setTimeout(() => { el.className = ''; el.innerHTML = ''; }, 350);
      onDone && onDone();
    };
    const showPage = (i) => {
      this.clear();
      stage.innerHTML = '';
      shown = false;
      const panels = pages[i];
      let last = 0;
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
        panel.appendChild(img);
        wrap.appendChild(panel);
        stage.appendChild(wrap);
        this.later(p.at, () => { wrap.classList.add('in', p.in); sfx.panel(); });
        last = Math.max(last, p.at);
        for (const s of p.sfx || []) {
          const im = document.createElement('img');
          im.className = 'csfx';
          im.src = url(s.k);
          Object.assign(im.style, { left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, '--r': `${s.r}deg` });
          stage.appendChild(im);
          this.later(s.at, () => { im.classList.add('in'); sfx.stamp(); if (s.shake) { stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); } });
          last = Math.max(last, s.at);
        }
      }
      this.later(last + 0.3, () => { shown = true; });
      this.later(last + 3.4, next);
    };
    const showAll = () => {
      this.clear();
      stage.querySelectorAll('.pwrap').forEach((w) => w.classList.add('in', 'instant'));
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
