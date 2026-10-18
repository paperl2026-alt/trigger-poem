// The loading screen (user 2026-10-18: like a film studio's logo): comic panels of the game flip by fast, full screen and faster and
// faster; then they are seen only through the letters of the title, which come in from very large; a white flash and the letters set
// as white on a red slab: the logo. The loading bar runs along the bottom the whole time; a click or a key skips to the logo.
//   startIntro(box)               the boot (index.html #loading): the whole sequence, finish() waits for it
//   startIntro(box, { loop })     a stage's pictures loading (main.js needPics): only the flipping letters, gone as soon as it is done
// -> { progress(p 0..1), finish(): Promise }
import { url, meta } from '../core/assets.js';
import { C } from '../core/content.js';
import { lang } from '../core/i18n.js';

const T = { full: 1300, into: 2100, red: 2450, hold: 2900 };   // ms: the full-screen flips end, the letters have landed, red, the logo held

// every comic page of the game, each looked at around one of its panels (comics.json: panel polygons in % of the page)
function shots() {
  const out = [];
  for (const [id, pages] of Object.entries(C.comics || {})) {
    if (id.startsWith('_') || !Array.isArray(pages)) continue;
    for (const pg of pages) {
      if (!pg?.page || !meta[pg.page]) continue;
      for (const p of pg.panels || []) {
        const pts = p.poly || []; if (!pts.length) continue;
        out.push({ src: url(pg.page), x: pts.reduce((a, q) => a + q[0], 0) / pts.length, y: pts.reduce((a, q) => a + q[1], 0) / pts.length });
      }
    }
  }
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export function startIntro(box, opt = {}) {
  const loop = !!opt.loop, title = C.text?.gameTitle?.[lang] || C.text?.gameTitle?.en || { small: '', big: '' };
  box.classList.add('intro'); if (loop) box.classList.add('i-loop');
  box.innerHTML = `<div class="ifull"></div><div class="ilogo"><b class="ismall"></b><span class="islab"></span><b class="ibig"></b></div>
    <div class="isub"></div><div class="iflash"></div><div class="track"><div id="loadbar"></div></div>`;
  const $ = (s) => box.querySelector(s), full = $('.ifull'), logo = $('.ilogo'), small = $('.ismall'), big = $('.ibig');
  small.textContent = title.small; big.textContent = title.big;
  const latin = /^[\x20-\x7e]+$/.test(title.big);
  big.style.fontSize = `min(26vh, ${Math.round(88 / Math.max(3, title.big.length * (latin ? 0.62 : 1.02)))}vw)`;
  small.style.fontSize = `min(5.5vh, ${Math.round(80 / Math.max(6, title.small.length * (latin ? 0.6 : 1)))}vw)`;
  $('.isub').textContent = Object.entries(C.text?.gameTitle || {}).filter(([k]) => k !== lang).map(([, v]) => `${v.small} ${v.big}`).join('   ·   ');
  const bar = $('#loadbar');

  // the pictures: only those already decoded are shown (the first few are asked for at once)
  const all = shots(), ready = [];
  all.slice(0, 18).forEach((s) => { const im = new Image(); im.onload = () => ready.push(s); im.src = s.src; });
  let k = 0;
  const flip = (els, zoom) => {
    if (!ready.length) return;
    const s = ready[k++ % ready.length];
    for (const e of els) { e.style.backgroundImage = `url("${s.src}")`; e.style.backgroundPosition = `${s.x}% ${s.y}%`; e.style.backgroundSize = `${zoom + Math.random() * 60}%`; }
  };

  const t0 = performance.now(); let phase = loop ? 'into' : 'full', loaded = 0, skipAt = 0, last = 0, alive = true;
  if (loop) logo.classList.add('on');
  const skip = () => { if (!loop && phase !== 'logo') skipAt = performance.now(); };
  box.addEventListener('pointerdown', skip); window.addEventListener('keydown', skip);
  function tick(now) {
    if (!alive) return;
    const t = skipAt ? T.hold : now - t0;
    if (!loop) {
      if (phase === 'full' && t >= T.full) { phase = 'into'; full.classList.add('off'); logo.classList.add('on'); }
      if (phase === 'into' && t >= T.red) { phase = 'logo'; logo.classList.add('red'); $('.iflash').classList.add('on'); $('.isub').classList.add('on'); }
    }
    // faster and faster: 120 ms a picture at first, 55 at the end of the full-screen part; 80 inside the letters
    const every = phase === 'full' ? 120 - 65 * Math.min(1, t / T.full) : 80;
    if (phase !== 'logo' && now - last >= every) {
      last = now;
      if (phase === 'full') { flip([full], 115); full.classList.remove('pop'); void full.offsetWidth; full.classList.add('pop'); }
      flip([small, big], 220);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return {
    progress(p) { loaded = p; bar.style.width = `${Math.round(p * 100)}%`; },
    finish() {
      const end = () => { alive = false; window.removeEventListener('keydown', skip); };
      if (loop) { end(); return Promise.resolve(); }
      return new Promise((ok) => {
        (function wait() {
          const t = skipAt ? Infinity : performance.now() - t0;
          if (t < T.hold) { setTimeout(wait, 50); return; }
          box.classList.add('out'); setTimeout(() => { end(); ok(); }, 260);
        })();
      });
    },
  };
}
