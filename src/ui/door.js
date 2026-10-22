// The first-person door close-up between two places (docs/DESIGN.md 第 1 话 ①: Sweet Home opens every door this way, the shot Resident
// Evil's door screens came from): on black, a doorway and its door; the door creaks slowly open onto darkness, then the view moves through
// it. An episode step { door: { frame, leaf, leaves: 1 | 2, hinge: "left" | "right" } }: frame = the doorway picture whose opening is solid
// black (its manifest "hole" [x0, y0, x1, y1] = that opening, 0..1, tools/rounds/r53b_import.py), leaf = the closed door alone, stretched
// over the hole; two leaves = the left and right halves of the leaf picture swing apart. light: true = it opens onto warm light, not
// darkness (the child's soul's door after the escort: ep1/door10). Tap = skip.
import { url, meta } from '../core/assets.js';
import { sfx, sound } from '../core/audio.js';

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp = (x) => Math.min(1, Math.max(0, x));
// the timeline (seconds): fade in, wait, open, push through, black
const T = { fade: 0.45, open0: 0.8, open1: 2.9, push0: 2.5, push1: 3.5, end: 3.75 };

export function playDoor(d, onDone) {
  const el = document.getElementById('comic');
  el.innerHTML = ''; el.className = 'on door'; el.dataset.tok = 'door';   // (takes the overlay over from a comic page still fading out)
  const fm = meta[d.frame] || { w: 3, h: 2 }, hole = fm.hole || [0.3, 0.15, 0.7, 1];
  const stage = document.createElement('div'); stage.className = 'dstage';
  stage.style.aspectRatio = `${fm.w} / ${fm.h}`;
  stage.style.backgroundImage = `url(${url(d.frame)})`;
  stage.style.transformOrigin = `${(hole[0] + hole[2]) * 50}% ${(hole[1] + hole[3]) * 50}%`;
  el.appendChild(stage);
  const box = document.createElement('div'); box.className = 'dhole';
  if (d.light) box.style.background = 'radial-gradient(ellipse at 50% 60%, #fffaf0 0%, #ffe6b0 45%, #f0b060 100%)';
  Object.assign(box.style, { left: `${hole[0] * 100}%`, top: `${hole[1] * 100}%`, width: `${(hole[2] - hole[0]) * 100}%`, height: `${(hole[3] - hole[1]) * 100}%` });
  stage.appendChild(box);
  const two = (d.leaves || 1) > 1, hinge = d.hinge || 'left';
  const leaves = (two ? ['left', 'right'] : [hinge]).map((side) => {
    const l = document.createElement('div'); l.className = 'dleaf';
    l.style.backgroundImage = `url(${url(d.leaf)})`;
    if (two) Object.assign(l.style, { width: '50%', left: side === 'left' ? '0' : '50%', backgroundSize: '200% 100%', backgroundPosition: side === 'left' ? '0 0' : '100% 0' });
    l.style.transformOrigin = side === 'left' ? '0 50%' : '100% 50%';
    box.appendChild(l);
    return { l, sign: side === 'left' ? -1 : 1 };
  });
  let done = false, raf = 0, creaked = false;
  const t0 = performance.now();
  const finish = () => {
    if (done) return;
    done = true; cancelAnimationFrame(raf); el.onpointerdown = null;
    el.className = ''; el.innerHTML = '';
    onDone && onDone();
  };
  el.onpointerdown = (e) => { e.stopPropagation(); finish(); };
  const frame = (now) => {
    const t = (now - t0) / 1000;
    if (!creaked && t >= T.open0) { creaked = true; sound('doorOpen') || sfx.creak(); }   // (a real door: latch, long hinge creak - sfx_specs94.py; user 2026-10-22)
    const open = ease(clamp((t - T.open0) / (T.open1 - T.open0)));
    for (const { l, sign } of leaves) l.style.transform = `rotateY(${sign * open * 100}deg)`;
    const push = clamp((t - T.push0) / (T.push1 - T.push0));
    stage.style.transform = `scale(${0.97 + 0.03 * clamp(t / T.fade) + push * push * 4.2})`;
    stage.style.opacity = String(clamp(t / T.fade) * (1 - clamp((t - T.push1 + 0.25) / 0.25)));
    if (t >= T.end) { finish(); return; }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
}
