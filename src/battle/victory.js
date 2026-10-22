// The victory jump after a boss (user 2026-10-22: the girls "jumped" in their shooting pose, bobbing on the spot - a jump of their own,
// facing the camera): the fight's figures slide out of the frame (cineOn) and the two girls, drawn facing the viewer (R96: ui/win_<girl>_
// <1|2|3> - crouched, at the top of the jump, landed in a pose), spring up in front of the place: crouch, up in an arc, land with a squash,
// hold the pose a moment, then go; the second a beat after the first. then(): the next step.
import { url, meta } from '../core/assets.js';

const T = { crouch: 0.32, air: 0.62, hold: 1.5, out: 0.35 };   // (seconds)
const ease = (k) => 1 - (1 - k) * (1 - k);

export function victoryJump(G, ids, then) {
  const have = ids.filter((id) => meta[`ui/win_${id}_1`]);
  if (!have.length) { then(); return; }
  G.cineOn = true; G.lull = true;
  const root = document.createElement('div');
  Object.assign(root.style, { position: 'absolute', inset: '0', pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '2vh', zIndex: 30 });
  for (const id of have) for (const f of [2, 3]) new Image().src = url(`ui/win_${id}_${f}`);   // (the next frames ready before they are shown)
  const girls = have.map((id, i) => {
    const im = document.createElement('img'); im.src = url(`ui/win_${id}_1`);
    Object.assign(im.style, { height: '74vh', transformOrigin: '50% 100%', opacity: '0', filter: 'drop-shadow(0 0.8vh 1.2vh rgba(0,0,0,0.45))' });
    root.appendChild(im);
    return { im, id, delay: i * 0.14, frame: 1 };
  });
  document.getElementById('ui').appendChild(root);
  const end = T.crouch + T.air + T.hold + T.out + 0.2;
  const set = (g, f) => { if (g.frame !== f) { g.frame = f; g.im.src = url(`ui/win_${g.id}_${f}`); } };
  // (on the game's own clock: it holds with a pause, like everything else on the screen)
  G.tweens.run(end, (e) => {
    const t = e * end;
    for (const g of girls) {
      const s = t - g.delay; let y = 0, sx = 1, sy = 1, op = Math.min(1, Math.max(0, s / 0.15));
      if (s < T.crouch) { set(g, 1); const k = Math.max(0, s) / T.crouch; sx = 1 + 0.05 * k; sy = 1 - 0.06 * k; y = 0; }
      else if (s < T.crouch + T.air) { set(g, 2); const k = (s - T.crouch) / T.air; y = -Math.sin(k * Math.PI) * 22; sx = 0.97; sy = 1.04; }
      else { set(g, 3); const k = (s - T.crouch - T.air) / 0.18; const q = Math.max(0, 1 - k); sx = 1 + 0.07 * q; sy = 1 - 0.09 * q; }
      if (s > T.crouch + T.air + T.hold) { const k = Math.min(1, (s - T.crouch - T.air - T.hold) / T.out); op = 1 - ease(k); y = 8 * k; }
      g.im.style.opacity = String(op);
      g.im.style.transform = `translateY(${y}vh) scale(${sx}, ${sy})`;
    }
  }, { onDone: () => { root.remove(); G.cineOn = false; G.lull = false; then(); } });
}
