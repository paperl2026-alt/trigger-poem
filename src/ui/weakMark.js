// The boss's weak point pointed out (user 2026-10-23, a sketch - a red circle, an arrow beside it - and a "««" icon): the circle is her
// weak point's own glitter (thing.js motes / smoke / glow, never smaller than WEAK_MIN of the screen: no ring of ours); beside it a row of
// three chevrons "‹‹‹" jabbing at it and back, each an RGB gradient running round the colours all the time, lit in turn 3, 2, 1 (the far
// one first) over and over; small - each about half the reticle; the row stands just clear of her picture (not over her), as near the
// weak point as that lets it, and follows it. Drawn on a canvas of its own over the game (#hud, under the storyboards) each frame while it is open (TheThing.weakTick); fades
// out when it shuts.
// the eight ways a row can go from the weak point (dx, dy, a little against: the sideways ones first)
const DIRS = [[-1, 0, 0], [1, 0, 0], [-0.7071, -0.7071, 0.1], [0.7071, -0.7071, 0.1], [0, -1, 0.2], [-0.7071, 0.7071, 0.3], [0.7071, 0.7071, 0.3], [0, 1, 0.5]];

export class WeakMark {
  constructor(root) {
    this.cv = document.createElement('canvas');
    Object.assign(this.cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20 });
    root.appendChild(this.cv);
    this.c = this.cv.getContext('2d');
    this.k = 0; this.dir = null;
  }
  // on: open now; x, y: the weak point on the screen (px, y down); R: its radius there (px); solid(px, py): her picture there;
  // W, H: the screen; dpr: device pixels per px. Its own clock (the colours never stand still, hit-stops or not)
  set(dt, t, on, x, y, R, solid, W, H, dpr = 1) {
    const cv = this.cv, c = this.c, now = performance.now() / 1000;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    this.k += ((on ? 1 : 0) - this.k) * Math.min(1, dt * (on ? 8 : 5));
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    if (this.k < 0.02 || !(x > -W && x < 2 * W)) { this.dir = null; return; }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = H * 0.034, gap = s * 0.9, L = s * 0.5 + gap * 2 + s * 0.5;   // (one chevron tip to tail; the row's length)
    // its way kept a while (no jumping about) unless it runs off the screen or another is clearly better; how far out along it, every
    // frame, eased
    this.dirT = (this.dirT || 0) + dt;
    const all = this.place(x, y, R, L, solid, W, H, DIRS) || { dx: Math.sign(W / 2 - x) || 1, dy: 0, d: R * 1.08, sc: 99 };
    let at = this.dir ? this.place(x, y, R, L, solid, W, H, [this.dir]) : null;
    if (!at || this.dirT > 1.2 || all.sc < at.sc - 1) { if (!at || at.dx !== all.dx || at.dy !== all.dy) { this.dirT = 0; this.d = all.d; } at = all; this.dir = [at.dx, at.dy, 0]; }
    this.d += (at.d - this.d) * Math.min(1, dt * 6);
    const dx = at.dx, dy = at.dy, jab = (0.5 + 0.5 * Math.sin(now * 7)) * s * 0.8;   // (in at the weak point and back)
    const step = Math.floor(now * 6) % 4;   // (0, 1, 2: the far one lit, the middle, the near one; 3: a beat with none)
    for (let i = 2; i >= 0; i--) {   // (i = 0 the nearest; drawn far to near)
      const d = this.d + s * 0.5 + jab + i * gap, lit = step === 2 - i;
      this.chevron(x + dx * d, y + dy * d, -dx, -dy, s * (lit ? 1.15 : 1), (now * 220 + i * 70) % 360, lit, this.k);
    }
  }
  // where the row goes: of these ways from the weak point, the one where it comes clear of her picture soonest and stays on the screen
  // (a little overlap is better than standing far off); {dx, dy, d: from the weak point to the row's near end}, or null (all off the screen)
  place(x, y, R, L, solid, W, H, dirs) {
    let best = null;
    for (const [dx, dy, pref] of dirs) {
      for (let d = R * 1.08; d <= R * 1.08 + H * 0.2; d += H * 0.02) {
        let over = 0, off = false;
        for (let k = 0; k <= 6 && !off; k++) {
          const q = d + (L * k) / 6, px = x + dx * q, py = y + dy * q;
          if (px < W * 0.03 || px > W * 0.97 || py < H * 0.17 || py > H * 0.8) off = true;   // (clear of the bar and the hints at the top, the HUD at the bottom)
          else if (solid(px, py)) over++;
        }
        if (off) break;   // (further only goes further off)
        const sc = ((d - R * 1.08) / H) * 10 + over * 1.5 + pref;
        if (!best || sc < best.sc) best = { sc, dx, dy, d };
        if (!over) break;
      }
    }
    return best;
  }
  // one chevron "‹" pointing along (ux, uy): a thick bent bar in an RGB gradient (hue round to hue + 160 along it), a white edge and a
  // dark one outside it; lit: bright, a white shine down its middle; not lit: the same colours, dim
  chevron(cx, cy, ux, uy, s, hue, lit, k) {
    const c = this.c, px = -uy, py = ux, w = s * 0.62, th = s * 0.3;   // (across: px, py)
    const tip = [cx + ux * s * 0.5, cy + uy * s * 0.5], a = [cx - ux * s * 0.5 + px * w, cy - uy * s * 0.5 + py * w], b = [cx - ux * s * 0.5 - px * w, cy - uy * s * 0.5 - py * w];
    const path = () => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(tip[0], tip[1]); c.lineTo(b[0], b[1]); };
    c.lineJoin = 'miter'; c.lineCap = 'butt'; c.globalAlpha = k * (lit ? 1 : 0.55);
    path(); c.lineWidth = th + s * 0.2; c.strokeStyle = 'rgba(20,0,16,0.7)'; c.stroke();
    path(); c.lineWidth = th + s * 0.1; c.strokeStyle = lit ? '#ffffff' : 'rgba(255,255,255,0.7)'; c.stroke();
    const g = c.createLinearGradient(a[0], a[1], b[0], b[1]), Lg = lit ? 60 : 42;
    for (let j = 0; j <= 4; j++) g.addColorStop(j / 4, `hsl(${(hue + j * 40) % 360}, 100%, ${Lg}%)`);
    path(); c.lineWidth = th; c.strokeStyle = g; c.stroke();
    if (lit) { path(); c.lineWidth = th * 0.3; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke(); }
    c.globalAlpha = 1;
  }
  remove() { this.cv.remove(); }
}
