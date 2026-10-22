// 分镜 - a close-up told in shots (user 2026-10-21: "a close-up is a scene of its own: framing, a pose of its own, rise and fall - not the
// game's picture pasted on a page"): film bars come in, then a few shots one after another with hard cuts and nothing flashy between them -
// a shot in the game itself (Game.storyboard moves the camera there) or a painted one made for this moment, filling the frame and pushing in
// slowly - and the game is cut back to. This layer is the bars and the painted shots; Game.storyboard runs the shots.
//   painted shot: { k: picture key, hold (seconds), push: [scale from, scale to], focus: [u, v] (where it pushes in toward), pan: [x from, x to]
//                   (% of the frame), cap: a line in the bottom bar (a text {zh, en, ja} or a string), fade: seconds it dissolves in over
//                   the shot before (instead of a hard cut: the lady's rest), motes: n motes of light and petals rising over it and
//                   scattering (her and her child coming apart into light) }
import './storyboard.css';
import { url } from '../core/assets.js';
import { tr } from '../core/i18n.js';

const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };

export class Storyboard {
  constructor(root, shots = []) {
    this.pre = shots.filter((s) => s.k).map((s) => { const i = new Image(); i.src = url(s.k) || ''; return i; });   // (decoded before their cut)
    this.root = el('div', 'sb', root);
    this.shot = el('div', 'sb-shot', this.root);
    el('div', 'sb-bar top', this.root);
    this.cap = el('div', 'sb-cap', el('div', 'sb-bar bot', this.root));
  }
  // a painted shot (s.k) or the game's own picture between the bars (no s.k)
  show(s) {
    const old = s.fade && s.k ? [...this.shot.querySelectorAll('img')] : [];
    if (!old.length) this.shot.replaceChildren();
    this.shot.classList.toggle('on', !!s.k);
    if (s.k) {
      const img = el('img', null, this.shot), [s0, s1] = s.push || [1, 1.05], [x0, x1] = s.pan || [0, 0], [fx, fy] = s.focus || [0.5, 0.5];
      img.alt = ''; img.src = url(s.k) || '';
      for (const [k, v] of Object.entries({ '--dur': `${s.hold ?? 1}s`, '--s0': s0, '--s1': s1, '--x0': `${x0}%`, '--x1': `${x1}%`, '--fx': `${fx * 100}%`, '--fy': `${fy * 100}%` })) img.style.setProperty(k, String(v));
      if (old.length) { img.classList.add('fade'); img.style.setProperty('--fade', `${s.fade}s`); setTimeout(() => old.forEach((o) => o.remove()), s.fade * 1000 + 50); }
    }
    for (const m of this.shot.querySelectorAll('.sb-mote')) m.remove();
    for (let i = 0; i < (s.motes || 0); i++) {   // (rising light and petals, each its own way and pace)
      const m = el('i', `sb-mote${i % 3 === 0 ? ' petal' : ''}`, this.shot), d = 2.5 + Math.random() * 3.5;
      m.style.left = `${30 + Math.random() * 40}%`; m.style.top = `${30 + Math.random() * 50}%`;
      m.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}vw`); m.style.setProperty('--dy', `${-30 - Math.random() * 60}vh`);
      m.style.animationDuration = `${d}s`; m.style.animationDelay = `${Math.random() * (s.hold ?? 4) * 0.6}s`;
    }
    const cap = s.cap ? (typeof s.cap === 'string' ? s.cap : tr(s.cap)) : '';
    this.cap.textContent = cap; this.cap.classList.toggle('on', !!cap);
  }
  remove() { this.root.remove(); }
}
