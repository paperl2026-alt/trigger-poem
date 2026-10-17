// Free space on the battle screen (docs/DESIGN.md: nothing pops up over the HUD or the heroines). Every frame it collects what is taken —
// the HUD panels, the boss bar when it shows, the tutorial tip, each heroine's figure as it is right now (she grows when she stands up
// to shoot, and when the shot moves in while walking) — and things that pop up (stickers, reload panels) claim their own rectangle.
// find() takes candidate places in order of preference and returns the first one that overlaps nothing (or the one that overlaps least).
// Screen px, y up (the overlay's space).
export class Space {
  constructor(hud) { this.hud = hud; this.taken = []; this.claims = []; }
  // each frame, before anything places itself
  begin() {
    const hud = this.hud, g = hud.game, L = hud.L, B = hud.B, T = [];
    const box = (b, an) => { const x0 = L.x(b[0], an), x1 = L.x(b[2], an), y0 = L.y(b[3], an), y1 = L.y(b[1], an); return { x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0: Math.min(y0, y1), y1: Math.max(y0, y1), what: 'hud' }; };
    // the HUD panels (the art's own box, a little trimmed: its outer corners are mostly splatter)
    for (const k of ['left', 'right', 'center']) { const l = B.layers[k]; T.push(box(l.box, l.anchor)); }
    if (hud.bossBar.str) { const D = B.boss, c = [(D.box[0] + D.box[2]) / 2, (D.box[1] + D.box[3]) / 2], k = D.fit;
      T.push(box([c[0] + (D.box[0] - c[0]) * k, c[1] + (D.box[1] - c[1]) * k, c[0] + (D.box[2] - c[0]) * k, c[1] + (D.box[3] - c[1]) * k], D.anchor || 'bc')); }
    const tip = g.hud.tip;
    if (tip && !tip.classList.contains('hidden') && tip.offsetParent) {
      const r = tip.getBoundingClientRect(); T.push({ x0: r.left, x1: r.right, y0: L.H - r.bottom, y1: L.H - r.top, what: 'tip' });
    }
    // the heroines as they are right now
    for (const p of g.players) {
      if (p.state === 'away' || !(p.slot === 0 || g.p2on())) continue;
      const b = p.hero ? p.hero.box() : { x0: p.baseX - L.H * 0.15, x1: p.baseX + L.H * 0.15, y0: 0, y1: L.H * 0.55 };
      T.push({ ...b, what: 'girl', slot: p.slot });
    }
    this.taken = T; this.claims = [];
  }
  overlap(r, list) {
    let s = 0;
    for (const o of list) { const w = Math.min(r.x1, o.x1) - Math.max(r.x0, o.x0), h = Math.min(r.y1, o.y1) - Math.max(r.y0, o.y0); if (w > 0 && h > 0) s += w * h; }
    return s;
  }
  // candidates: [{ x, y }] centres in order of preference; w, h: the size; returns the chosen rect (and claims it)
  find(w, h, candidates, pad = 6) {
    const L = this.hud.L, f = L.f, all = [...this.taken, ...this.claims];
    let best = null;
    for (const c of candidates) {
      const x = Math.max(f.x + w / 2 + pad, Math.min(f.x + f.w - w / 2 - pad, c.x)), y = Math.max(h / 2 + pad, Math.min(L.H - h / 2 - pad, c.y));
      const r = { x0: x - w / 2 - pad, x1: x + w / 2 + pad, y0: y - h / 2 - pad, y1: y + h / 2 + pad, x, y };
      const o = this.overlap(r, all);
      if (o === 0) { best = r; break; }
      if (!best || o < best.o) best = { ...r, o };
    }
    this.claims.push(best);
    return best;
  }
  claim(r) { this.claims.push(r); }
  girl(slot) { return this.taken.find((t) => t.what === 'girl' && t.slot === slot); }
}
