// The stop's shot (docs/TECH.md「停留点预设」; tuning/shots.json; user 2026-10-20: the girls go with the camera and the place - not always
// the two crouch / stand pictures at the same two spots; at times only part of them or none; the bottom-middle HUD may move, the corner
// panels never; the bubbles not everywhere; and above all one feel all through, nothing jarring). A preset says how the girls are shown
// and play at a kind of stop; a station picks one (shot: "<preset>" or { kind, ...changes }) or gets one from what it is (ride, escort,
// cine, else cover). Game.setShot switches; Live eases what is on screen toward it, so a change of shot is a move, never a jump.
import { T, merge } from '../core/content.js';

// a station's preset, its changes laid over it
export function shotOf(S) {
  const P = T.shots || {}, spec = S?.shot;   // (tuning/shots.json: its "shots" is T.shots)
  const kind = (typeof spec === 'string' ? spec : spec?.kind) || (S?.ride ? (S.ride.vehicle ? 'ride' : 'run') : S?.escort ? 'escort' : S?.cine ? 'cine' : 'cover');
  let out = P[kind] || P.cover || {};
  if (spec && typeof spec === 'object') { const { kind: _k, ...rest } = spec; out = merge(out, rest); }
  return { kind, ...out };
}
// another shot from a cue: a preset's name, or changes to the shot it is in now
export function shotFrom(spec, cur) {
  if (typeof spec === 'string') return shotOf({ shot: spec });
  if (spec?.kind) return shotOf({ shot: spec });
  return { ...merge(cur, spec || {}), kind: cur.kind };
}

// what is on screen now, easing toward the shot, each girl on her own (DESIGN「女主动起来」: one up the stairs and one below, one leaning
// on a pillar, one further off...): her place (x, share of the HUD frame), size (scale), rise (y, share of the screen height), how far
// she is sunk below the bottom (crop, share of her standing height) - each [1P, 2P] or one number for both; shown (0..1); the
// bottom-middle strip's rise; the lens
const two = (v, d) => (Array.isArray(v) ? [v[0] ?? d, v[1] ?? v[0] ?? d] : [v ?? d, v ?? d]);
export class Live {
  constructor() { this.x = [0.27, 0.73]; this.scale = [1, 1]; this.y = [0, 0]; this.crop = [0, 0]; this.show = 1; this.mid = 0; this.zoom = 0; this.lens = 0; this.hud = 1; }
  snap(s) { this.ease(s, 99); }
  ease(s, dt) {
    const k = Math.min(1, dt * 4), P = s.players || {}, H = s.hud || {}, Cm = s.cam || {};
    const to = (a, b) => a + (b - a) * k, both = (cur, v, d) => { const w = two(v, d); return [to(cur[0], w[0]), to(cur[1], w[1])]; };
    this.x = both(this.x, P.x || [0.27, 0.73], 0.5);
    this.scale = both(this.scale, P.scale, 1); this.y = both(this.y, P.y, 0); this.crop = both(this.crop, P.crop, 0);
    this.show = to(this.show, P.show === false ? 0 : 1);
    this.mid = to(this.mid, H.mid ?? 0); this.hud = to(this.hud, H.show === false ? 0 : 1);
    this.zoom = to(this.zoom, Cm.zoom ?? 0); this.lens = to(this.lens, Cm.lens ?? 0);
  }
}
