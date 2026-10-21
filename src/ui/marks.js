// The special-attack markers' drawn pieces (docs/DESIGN.md「攻击分三种」, the user's round-8 mockup): a heart with wings (the crest), a
// small heart (a moon on the hide belt), and the whole marker as a still picture for the lesson cards. Plain canvas drawing: crisp shapes,
// a dark ink outline and a soft glow, no generated lettering. The moving rings themselves are a shader (src/battle/fx.js ORBIT_FRAG). In the
// game the 3D structures (src/battle/marks3d.js) stand in for both wherever the thing's place in the world is known; the lesson cards
// draw those structures (markIcon).
import { shapes } from '../battle/marks3d.js';

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
// a little dark monster for the icon (the structure goes round it)
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

// the whole marker as a still picture (a lesson card's icon): the 3D structures the game puts on the things themselves (src/battle/marks3d.js,
// the same edge lists), turned a little and seen from the front - nearer edges brighter, corners glowing - round a little monster:
// 'kill' the icosahedron cage, 'hide' the twisted mucube and the cone from it toward you, 'shot' the tetrahedron round a flying thing
export function markIcon(kind) {
  const W = 280, H = 216, c = document.createElement('canvas'), g = c.getContext('2d'), S = shapes();
  c.width = W; c.height = H;
  const cx = W / 2, cy = H * 0.5;
  // a point turned about y then x, onto the canvas: [x, y, depth -1 (far) .. 1 (near)]
  const turn = (x, y, z, ax, ay, s, ox, oy) => { const x1 = x * Math.cos(ay) + z * Math.sin(ay), z1 = -x * Math.sin(ay) + z * Math.cos(ay); return [ox + x1 * s, oy - (y * Math.cos(ax) - z1 * Math.sin(ax)) * s, y * Math.sin(ax) + z1 * Math.cos(ax)]; };
  const wire = (E, ax, ay, s, col, w, ox = cx, oy = cy) => {
    const seg = []; for (let i = 0; i < E.length; i += 6) { const a = turn(E[i], E[i + 1], E[i + 2], ax, ay, s, ox, oy), b = turn(E[i + 3], E[i + 4], E[i + 5], ax, ay, s, ox, oy); seg.push([a, b, (a[2] + b[2]) / 2]); }
    seg.sort((p, q) => p[2] - q[2]);   // (far first)
    g.save(); g.lineCap = 'round';
    for (const [a, b, z] of seg) {
      const k = 0.5 + 0.5 * z, path = () => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); };
      g.globalAlpha = 0.35 + 0.65 * k;
      path(); g.shadowBlur = 0; g.strokeStyle = '#14061f'; g.lineWidth = w * 2.2; g.stroke();
      path(); g.shadowColor = col; g.shadowBlur = w * 3; g.strokeStyle = col; g.lineWidth = w; g.stroke();
      if (k > 0.55) { path(); g.shadowBlur = 0; g.strokeStyle = '#fff'; g.lineWidth = w * 0.35; g.stroke(); }
    }
    g.restore();
  };
  const dots = (V, ax, ay, s, col, r, ox = cx, oy = cy) => {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const v of V) {
      const [x, y, z] = turn(v[0], v[1], v[2], ax, ay, s, ox, oy), rr = r * (0.7 + 0.3 * (0.5 + 0.5 * z)), gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  };
  if (kind === 'kill') {
    blob(g, cx, cy + H * 0.04, H * 0.42);
    wire(S.ico, 0.45, 0.6, H * 0.4, '#ff3a6a', 4.5); dots(S.icoV, 0.45, 0.6, H * 0.4, '#ffd0e0', 9);
  } else if (kind === 'shot') {
    // a thrown thing: a ball, the tetrahedron spinning round it
    g.save(); const gr = g.createRadialGradient(cx - 8, cy - 8, 2, cx, cy, H * 0.13); gr.addColorStop(0, '#fff3c8'); gr.addColorStop(0.6, '#e0703a'); gr.addColorStop(1, '#5a1a10');
    g.fillStyle = gr; g.strokeStyle = '#14061f'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, H * 0.13, 0, Math.PI * 2); g.stroke(); g.fill(); g.restore();
    wire(S.tet, 1.1, 0.35, H * 0.44, '#ff5a8a', 4.5); dots(S.tetV, 1.1, 0.35, H * 0.44, '#ffffff', 16);
  } else {
    // the cone: its mouth round the monster, its tip toward you (the bottom of the card, near: drawn over the cage); rings racing down it
    const my = cy - H * 0.14, tip = [cx - W * 0.16, H * 0.98], R = H * 0.2;
    blob(g, cx, my, H * 0.3);
    g.save(); g.globalAlpha = 0.75; wire(S.mu, 0.5, 0.45, H * 0.27, '#8a2ad8', 2.2, cx, my); g.restore();
    const ring = (k, w) => {
      const x = cx + (tip[0] - cx) * k, y = my + (tip[1] - my) * k, rr = R * (1 - k) + 2;
      g.beginPath(); g.ellipse(x, y, rr, rr * 0.38, 0, 0, Math.PI * 2); g.shadowBlur = 0; g.strokeStyle = '#14061f'; g.lineWidth = w * 2.2; g.stroke();
      g.shadowColor = '#c070ff'; g.shadowBlur = w * 3; g.strokeStyle = '#c070ff'; g.lineWidth = w; g.stroke(); g.shadowBlur = 0;
    };
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, x = cx + Math.cos(a) * R, y = my + Math.sin(a) * R * 0.38;
      g.globalAlpha = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(a));
      g.beginPath(); g.moveTo(x, y); g.lineTo(...tip); g.shadowBlur = 0; g.strokeStyle = '#14061f'; g.lineWidth = 5; g.stroke();
      g.shadowColor = '#b04dff'; g.shadowBlur = 8; g.strokeStyle = '#b04dff'; g.lineWidth = 2.4; g.stroke();
    }
    g.globalAlpha = 1; ring(0, 3.5); g.restore();
    g.save(); for (const k of [0.3, 0.6]) { g.globalAlpha = 1 - k * 0.6; ring(k, 3); } g.restore();
  }
  return c;
}
