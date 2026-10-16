// Screen changes turn like a manga page (content ui/manga.json): the old page is cut into panels by white gutters with black
// frames and the panels drift apart; the whole page turns over the right-hand spine (Japanese books open to the right); under it
// the new page waits as empty panel frames, its picture comes in panel by panel in reading order (top-right first), and then
// the gutters close up into the full screen. Each change picks a different panel layout, so no two turns look alike.
import { C } from '../core/content.js';
import { sfx } from '../core/audio.js';
import './manga.css';

const NS = 'http://www.w3.org/2000/svg';
let lastLayout = -1, busy = false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const el = (tag, cls, parent) => { const n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };
const sv = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (parent) parent.appendChild(n); return n; };
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;

function pick(avoid) {
  const n = C.ui.manga.layouts.length;
  let i;
  do { i = Math.floor(Math.random() * n); } while (n > 2 && (i === avoid || i === lastLayout));
  return i;
}
// polygon (clockwise on screen) moved inward by d px on every edge
function inset(P, d) {
  const n = P.length, lines = [];
  for (let i = 0; i < n; i++) {
    const [ax, ay] = P[i], [bx, by] = P[(i + 1) % n], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    lines.push([ax + nx * d, ay + ny * d, dx, dy]);
  }
  return lines.map((L1, i) => {
    const L0 = lines[(i + n - 1) % n], [x1, y1, d1x, d1y] = L0, [x2, y2, d2x, d2y] = L1;
    const den = d1x * d2y - d1y * d2x;
    if (Math.abs(den) < 1e-6) return [x2, y2];
    const t = ((x2 - x1) * d2y - (y2 - y1) * d2x) / den;
    return [x1 + d1x * t, y1 + d1y * t];
  });
}
const centre = (P) => P.reduce((a, [x, y]) => [a[0] + x / P.length, a[1] + y / P.length], [0, 0]);
const css = (P) => `polygon(${P.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
const pts = (P) => P.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const lerpP = (A, B, t) => A.map(([x, y], i) => [x + (B[i][0] - x) * t, y + (B[i][1] - y) * t]);
const scaleP = (P, s) => { const [cx, cy] = centre(P); return P.map(([x, y]) => [cx + (x - cx) * s, cy + (y - cy) * s]); };
function tween(ms, f) {
  return new Promise((done) => {
    const t0 = performance.now();
    const step = () => { const t = Math.min(1, (performance.now() - t0) / ms); f(t); if (t < 1) setTimeout(step, 16); else done(); };
    step();
  });
}

/** Turn from the screen element `oldScreen` (may be null) to whatever `build()` puts up. Resolves when the new screen is clear. */
export async function mangaTurn(oldScreen, build) {
  if (busy) { build(); return; }
  busy = true;
  const M = C.ui.manga, T = M.times, W = window.innerWidth, H = window.innerHeight, k = Math.min(W / 1920, H / 1080);
  const g = M.gutter * k, fr = M.frame * k, spread = M.spread * k;
  const la = pick(-1), lb = pick(la); lastLayout = lb;
  const toPx = (poly) => poly.map(([x, y]) => [x * W, y * H]);
  const ov = el('div', 'mg', document.body);
  ov.style.setProperty('--paper', M.paper); ov.style.setProperty('--ink', M.ink);

  // ---- the new page under the leaf: paper with empty panel frames (an SVG mask cuts the windows)
  const B = M.layouts[lb].map(toPx);
  const order = B.map((P, i) => ({ i, c: centre(P) })).sort((a, b) => (Math.round(a.c[1] / H * 3) - Math.round(b.c[1] / H * 3)) || (b.c[0] - a.c[0])).map((o) => o.i);
  const svg = sv('svg', { class: 'mg-next', width: W, height: H, viewBox: `0 0 ${W} ${H}` }, ov);
  const mask = sv('mask', { id: 'mg-mask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, sv('defs', {}, svg));
  sv('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }, mask);
  const holes = B.map(() => sv('polygon', { points: '', fill: '#000' }, mask));
  const paper = sv('rect', { x: 0, y: 0, width: W, height: H, class: 'mg-paper', mask: 'url(#mg-mask)' }, svg);
  const frames = B.map((P) => sv('polygon', { points: pts(inset(P, g / 2)), fill: 'none', stroke: M.ink, 'stroke-width': fr, 'stroke-linejoin': 'miter' }, svg));
  void paper;

  // ---- the old page, cut into panels, on a leaf that turns
  const leaf = el('div', 'mg-leaf', ov);
  const front = el('div', 'mg-front', leaf), back = el('div', 'mg-back', leaf), shade = el('div', 'mg-shade', front);
  const cells = [];
  if (oldScreen) {
    for (const poly of M.layouts[la]) {
      const P = toPx(poly), [cx, cy] = centre(P);
      const cell = el('div', 'mg-cell', front);
      const f = el('div', 'mg-frame', cell), p = el('div', 'mg-pn', cell);
      f.style.clipPath = p.style.clipPath = css(P);
      p.appendChild(oldScreen.cloneNode(true));
      const d = Math.hypot(cx - W / 2, cy - H / 2) || 1;
      cells.push({ cell, f, p, P, dx: (cx - W / 2) / d * spread, dy: (cy - H / 2) / d * spread, rot: (Math.random() * 2 - 1) * (M.tilt || 0) });
    }
    front.appendChild(shade);
    oldScreen.style.visibility = 'hidden';
  } else front.classList.add('blank');

  // 1) the gutters open, the panels drift apart a little
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  ov.classList.add('split');
  for (const c of cells) {
    c.p.style.clipPath = css(inset(c.P, g / 2));
    c.f.style.clipPath = css(inset(c.P, g / 2 - fr));
    c.cell.style.translate = `${c.dx}px ${c.dy}px`; c.cell.style.rotate = `${c.rot}deg`;
  }
  await wait(oldScreen ? T.split : 0);

  // 2) the new screen is built under everything, the leaf turns over the right-hand spine
  build();
  sfx.panel();
  ov.classList.add('turn');
  leaf.style.transitionDuration = `${T.turn}ms`;
  await wait(T.turn * 0.55);

  // 3) the new page's panels fill in reading order
  const R = B.map((P) => inset(P, g / 2));
  const reveals = order.map((idx, n) => wait(n * T.revealGap).then(() => tween(T.reveal, (t) => {
    holes[idx].setAttribute('points', pts(scaleP(R[idx], 0.25 + 0.75 * easeOut(t))));
    if (t === 1) holes[idx].setAttribute('points', pts(R[idx]));
  })));
  await wait(T.turn * 0.45);
  leaf.remove();
  await Promise.all(reveals);

  // 4) the gutters close up into the full screen
  await tween(T.close, (t) => {
    const e = easeIO(t);
    B.forEach((P, i) => {
      const Q = lerpP(R[i], inset(P, -2), e);
      holes[i].setAttribute('points', pts(Q));
      frames[i].setAttribute('points', pts(Q));
      frames[i].setAttribute('stroke-width', fr * (1 - e));
    });
  });
  ov.remove();
  busy = false;
}
