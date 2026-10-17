// The special-attack markers' drawn pieces (docs/DESIGN.md「攻击分三种」, the user's round-8 mockup): a heart with wings (the crest), a
// small heart (a moon on the hide belt), and the whole marker as a still picture for the lesson cards. Plain canvas drawing: crisp shapes,
// a dark ink outline and a soft glow, no generated lettering. The moving rings themselves are a shader (src/battle/fx.js ORBIT_FRAG).
export const MARK = {
  kill: { fill: '#ff2a4a', lite: '#ffa0b8', wing: '#ffffff', vein: '#ffb3c6', ink: '#1c0510', glow: 'rgba(255,42,74,0.85)' },
  hide: { fill: '#9b3dff', lite: '#e0b6ff', wing: '#f6eeff', vein: '#cfa8ff', ink: '#14061f', glow: 'rgba(176,77,255,0.85)' },
};

function heartPath(g, x, y, s) {
  const k = s / 2;
  g.beginPath();
  g.moveTo(x, y + k * 0.95);
  g.bezierCurveTo(x - k * 0.3, y + k * 0.62, x - k * 1.05, y + k * 0.2, x - k, y - k * 0.32);
  g.bezierCurveTo(x - k * 0.95, y - k * 0.85, x - k * 0.25, y - k, x, y - k * 0.5);
  g.bezierCurveTo(x + k * 0.25, y - k, x + k * 0.95, y - k * 0.85, x + k, y - k * 0.32);
  g.bezierCurveTo(x + k * 1.05, y + k * 0.2, x + k * 0.3, y + k * 0.62, x, y + k * 0.95);
  g.closePath();
}
function leaf(g, x0, y0, x1, y1, w) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L * w, ny = (x1 - x0) / L * w;
  g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx + nx, my + ny, x1, y1); g.quadraticCurveTo(mx - nx, my - ny, x0, y0); g.closePath();
}
// the four feathers of one wing (d = -1 left, 1 right), the top one drawn first so the lower ones lie over it
function feathers(cx, cy, s, d) {
  const rx = cx + d * s * 0.32, ry = cy - s * 0.08;
  return [[1.0, 1.1], [0.65, 1.2], [0.3, 1.05], [-0.08, 0.8]].map(([a, l]) => [rx, ry, rx + d * Math.cos(a) * l * s, ry - Math.sin(a) * l * s, s * 0.17]);
}
function heart(g, x, y, s, P, ink) {
  g.lineJoin = 'round';
  heartPath(g, x, y, s); g.lineWidth = ink; g.strokeStyle = P.ink; g.stroke();
  const gr = g.createLinearGradient(x, y - s * 0.5, x, y + s * 0.5); gr.addColorStop(0, P.lite); gr.addColorStop(0.45, P.fill); gr.addColorStop(1, P.fill);
  heartPath(g, x, y, s); g.fillStyle = gr; g.fill();
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(x - s * 0.24, y - s * 0.2, s * 0.11, s * 0.065, -0.6, 0, Math.PI * 2); g.fill();
}
// a heart with spread wings, centred on (cx, cy); s: the heart's width (the wings span about 3.2 s)
export function wingedHeart(g, cx, cy, s, P) {
  const ink = Math.max(3, s * 0.1), fs = [...feathers(cx, cy, s, -1), ...feathers(cx, cy, s, 1)];
  g.save(); g.lineJoin = 'round';
  // the glow and the outer ink outline: everything stroked thick first
  g.shadowColor = P.glow; g.shadowBlur = s * 0.35;
  g.strokeStyle = P.ink; g.lineWidth = ink * 2;
  for (const f of fs) { leaf(g, ...f); g.stroke(); }
  heartPath(g, cx, cy, s); g.stroke();
  g.shadowBlur = 0;
  // the feathers, each with a thin line and a vein
  for (const f of fs) {
    leaf(g, ...f); g.fillStyle = P.wing; g.fill(); g.lineWidth = ink * 0.5; g.strokeStyle = P.ink; g.stroke();
    const [x0, y0, x1, y1] = f; g.beginPath(); g.moveTo(x0 + (x1 - x0) * 0.25, y0 + (y1 - y0) * 0.25); g.lineTo(x0 + (x1 - x0) * 0.8, y0 + (y1 - y0) * 0.8);
    g.lineWidth = ink * 0.45; g.strokeStyle = P.vein; g.stroke();
  }
  heart(g, cx, cy, s, P, ink * 0.6);
  g.restore();
}
export function smallHeart(g, cx, cy, s, P) {
  g.save(); g.shadowColor = P.glow; g.shadowBlur = s * 0.4;
  heartPath(g, cx, cy, s); g.lineWidth = s * 0.2; g.strokeStyle = P.ink; g.lineJoin = 'round'; g.stroke(); g.shadowBlur = 0;
  heart(g, cx, cy, s, P, s * 0.1); g.restore();
}
function sparkle(g, x, y, s, col) {
  g.save(); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = s;
  g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); g.fill();
  g.restore();
}
// a little dark monster for the icon (the belt goes round it)
function blob(g, x, y, s) {
  g.save(); g.fillStyle = '#2a1636'; g.strokeStyle = '#f2e6ff'; g.lineWidth = s * 0.07; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x - s * 0.5, y + s * 0.45); g.quadraticCurveTo(x - s * 0.62, y - s * 0.2, x - s * 0.42, y - s * 0.42); g.lineTo(x - s * 0.5, y - s * 0.75);
  g.lineTo(x - s * 0.2, y - s * 0.52); g.quadraticCurveTo(x, y - s * 0.6, x + s * 0.2, y - s * 0.52); g.lineTo(x + s * 0.5, y - s * 0.75); g.lineTo(x + s * 0.42, y - s * 0.42);
  g.quadraticCurveTo(x + s * 0.62, y - s * 0.2, x + s * 0.5, y + s * 0.45); g.quadraticCurveTo(x, y + s * 0.62, x - s * 0.5, y + s * 0.45); g.closePath(); g.stroke(); g.fill();
  g.fillStyle = '#ff4a8a'; for (const d of [-1, 1]) { g.beginPath(); g.arc(x + d * s * 0.2, y - s * 0.1, s * 0.09, 0, Math.PI * 2); g.fill(); }
  g.restore();
}

// a canvas of the given size with one of the pieces, for a texture: 'kill' / 'hide' winged heart, 'killHeart' / 'hideHeart' small heart
export function markCanvas(piece) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), P = MARK[piece.startsWith('hide') ? 'hide' : 'kill'];
  if (piece.endsWith('Heart')) { c.width = c.height = 128; smallHeart(g, 64, 66, 76, P); }
  else { c.width = 512; c.height = 300; wingedHeart(g, 256, 178, 118, P); }
  return c;
}

// the whole marker as a still picture (a lesson card's icon): the ring with its crest, or the belt going round a little monster (no words)
export function markIcon(kind) {
  const W = 280, H = 216, c = document.createElement('canvas'), g = c.getContext('2d'), P = MARK[kind];
  c.width = W; c.height = H;
  const cx = W / 2, cy = H * 0.6;
  g.lineCap = 'round';
  const line = (path, w, far) => {   // one glowing line with its ink band under it
    g.save(); g.globalAlpha = far ? 0.5 : 1;
    path(); g.strokeStyle = P.ink; g.lineWidth = w * 2.6; g.stroke();
    g.shadowColor = P.glow; g.shadowBlur = w * 3; path(); g.strokeStyle = P.fill; g.lineWidth = w * 1.4; g.stroke();
    g.shadowBlur = 0; path(); g.strokeStyle = '#fff'; g.lineWidth = w * 0.45; g.stroke(); g.restore();
  };
  if (kind === 'kill') {
    const r = H * 0.34;
    line(() => { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); }, 6);
    g.save(); g.setLineDash([9, 8]); g.strokeStyle = P.fill; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r * 0.8, 0, Math.PI * 2); g.stroke(); g.restore();
    for (let k = 0; k < 4; k++) {   // the arrowheads pointing in
      const a = k * Math.PI / 2 + Math.PI / 4, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux, R0 = r * 1.12, R1 = r * 0.86, w = r * 0.13;
      g.beginPath(); g.moveTo(cx + ux * R0 + px * w, cy + uy * R0 + py * w); g.lineTo(cx + ux * R1, cy + uy * R1); g.lineTo(cx + ux * R0 - px * w, cy + uy * R0 - py * w); g.closePath();
      g.lineWidth = 5; g.strokeStyle = P.ink; g.lineJoin = 'round'; g.stroke(); g.fillStyle = '#fff'; g.fill();
    }
    wingedHeart(g, cx, cy - r - 2, 50, P);
    sparkle(g, cx - r * 0.95, cy + r * 0.55, 12, '#fff'); sparkle(g, cx + r * 0.75, cy + r * 0.85, 9, '#fff'); sparkle(g, cx + r * 1.05, cy - r * 0.2, 7, '#fff');
  } else {
    const rx = W * 0.46, ry = rx * 0.36, tilt = -0.28;
    const half = (a0, a1) => () => { g.beginPath(); g.ellipse(cx, cy, rx, ry, tilt, a0, a1); };
    line(half(Math.PI, Math.PI * 2), 5, true);     // the far half, behind the monster
    blob(g, cx, cy - H * 0.06, H * 0.5);
    line(half(0, Math.PI), 6.5);                   // the near half, in front
    g.save(); g.setLineDash([10, 9]); g.strokeStyle = P.lite; g.lineWidth = 2.5; g.beginPath(); g.ellipse(cx, cy, rx * 0.88, ry * 0.88, tilt, 0, Math.PI); g.stroke(); g.restore();
    const at = (a) => { const x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]; };
    smallHeart(g, ...at(Math.PI * 1.25), 22, P);
    smallHeart(g, ...at(Math.PI * 0.15), 30, P);
    wingedHeart(g, ...at(Math.PI * 0.62), 40, P);
  }
  return c;
}
