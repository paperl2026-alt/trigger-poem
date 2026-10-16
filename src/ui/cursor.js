// Custom cursor: a sprite that follows the pointer (a touch of lag, tilting with its motion), with a look per state —
// normal / hover (over anything with data-cur="hover") / press / grab (data-cur="grab", e.g. sliders) — and a set per scene
// (content ui/cursors.json: menu, comic, battle ...). A scene set to null hides it (in battle the HUD draws the reticles).
import { url, meta } from '../core/assets.js';
import { C } from '../core/content.js';

let el = null, set = null, state = 'normal', down = false, hoverEl = null;
let x = -200, y = -200, px = -200, py = -200, tilt = 0, pop = 1;
const moveFns = [];
export const onCursorMove = (fn) => { moveFns.push(fn); return () => moveFns.splice(moveFns.indexOf(fn), 1); };

function look() {
  if (!set) return null;
  const want = down ? (hoverEl && hoverEl.dataset.cur === 'grab' ? 'grab' : 'press') : hoverEl ? (hoverEl.dataset.cur === 'grab' ? 'grab' : 'hover') : 'normal';
  return set[want] || set.normal;
}
function apply() {
  const L = look();
  if (!L || !meta[L.img]) { el.style.display = 'none'; return; }
  el.style.display = '';
  if (el.dataset.key !== L.img) { el.src = url(L.img); el.dataset.key = L.img; pop = 0.75; }
  const w = set.size, h = w * meta[L.img].h / meta[L.img].w;
  el.style.width = `${w}px`; el.style.height = `${h}px`;
  el.dataset.hx = L.hot[0] * w; el.dataset.hy = L.hot[1] * h;
}

export function initCursor() {
  el = document.createElement('img');
  el.id = 'cursor';
  el.draggable = false;
  document.body.appendChild(el);
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    const h = e.target.closest ? e.target.closest('[data-cur]') : null;
    if (h !== hoverEl) { hoverEl = h; if (set) apply(); }
    for (const fn of moveFns) fn(x, y);
  }, true);
  window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') { down = true; if (set) apply(); } }, true);
  window.addEventListener('pointerup', () => { down = false; if (set) apply(); }, true);
  document.addEventListener('mouseleave', () => { x = y = -200; });
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (set && el.style.display !== 'none') {
      const k = 1 - Math.exp(-dt * 40);
      const vx = (x - px) / Math.max(dt, 1e-3);
      px += (x - px) * k; py += (y - py) * k;
      tilt += (Math.max(-18, Math.min(18, vx * 0.012)) - tilt) * (1 - Math.exp(-dt * 10));
      pop += (1 - pop) * (1 - Math.exp(-dt * 14));
      const s = (down ? 0.9 : 1) * pop;
      el.style.transform = `translate(${px - el.dataset.hx}px, ${py - el.dataset.hy}px) rotate(${tilt}deg) scale(${s})`;
      el.style.transformOrigin = `${el.dataset.hx}px ${el.dataset.hy}px`;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// scene: a key of C.ui.cursors (null / missing = the system cursor, false = no cursor at all)
export function cursorScene(name) {
  if (!el) return;
  const cfg = C.ui.cursors ? C.ui.cursors[name] : undefined;
  set = cfg || null;
  document.body.classList.toggle('cur-custom', !!set || cfg === false);
  el.style.display = set ? '' : 'none';
  if (set) apply();
}
