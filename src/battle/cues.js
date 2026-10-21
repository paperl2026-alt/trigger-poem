// The director's cues (docs/TECH.md「演出指令」; user 2026-10-20: the orchestration is config tables - each level different by its data,
// not by code - and one good engine that is easy to add to): one vocabulary for every moment the content wants something to happen:
// a ride's marks, a wave's timed / kill events, a stop's arrival and its end (station on: { arrive: [cues], clear: [cues] }), a cinematic
// stop's timeline (station cine: [cues]), a boss's forms (bosses.json cues: { intro, s2, s3, die }). A cue is one object; every key is
// optional and they all happen together:
//   say: <line kind> (who: 0 | 1 | 'both', default either; force: shown even where the shot has no bubbles)   a heroine's line
//   sfx: <sound key or synth sound>, shake: n, flash: [strength, '#hex'], impact: seconds, burst: [dur, [styles], beat, '#hexA', '#hexB']
//   hint: <ui text key>, music: <name> | null (stops it)
//   mv: { wall, slam, sub, popups: [...], label, tunnel, phone: [left, right], overdrive }   the MV director (mv.js)
//   vfx: <preset> | { name, at: [x, y, z], scale }   an effect (tuning/vfx.json: a wall bursting, an explosion, a blast of magic...)
//   act: <kind> + its fields (ritual / summon / sacrifice / squabble / transform: acts.js)
//   spawn: [wave entries], turn, mutate, gimmick, collapse, spawner, wake          the old wave events (Game.waveEvent)
//   swap: { <board>: <board> }, fire: [gimmick ids]
//   cam: { on: 'boss' | <monster type> | [x, y, z], dist, up, side, zoom, orbit, dolly, title (a text), hold, in, out, pause }   a close look;
//     the fight held still while it lasts (pause: false only where nothing is fighting anyway - user 2026-10-21)
//   insert: { k: <picture>, side: -1 | 1, w, h, y, life, color }   a slanted comic panel cut in from one side (ride.js insert)
//   vignette: { k: <picture>, title, sub, color, crop, side, dur }   a close-up: a comic page of its own, the fight waiting (Game.vignette;
//     user 2026-10-21: a close-up is its own little scene, not the camera dragged through the fight); holds the timeline like cam
//   shot: <preset> | { kind, ... }   the stop's shot changes from here (tuning/shots.json; shot.js)
//   girls: { move: hop | dash | dive, who: 0 | 1 | 'both', dx, dy, h, t, delay: [1P, 2P] } | 'settle'   the two of them move in the place
//     (DESIGN「女主动起来」: a hop up or down a step, a dash across, a dive into cover; tuning/layout.json moves; player.js move)
// timeline(list, then): cues with at (seconds from the start) in order; a cue with a cam holds the timeline until the camera is back.
import * as THREE from 'three';
import { sfx, sound, playMusic, stopMusic } from '../core/audio.js';
import { tr } from '../core/i18n.js';
import { hexNum } from '../core/content.js';

const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

export class Cues {
  constructor(game) { this.g = game; this.q = 0; }

  girls(G) {
    const g = this.g;
    g.players.forEach((p, i) => {
      if (p.slot && !g.p2on()) return;
      if (G === 'settle') { p.settle(); return; }
      if (G.who != null && G.who !== 'both' && G.who !== i) return;
      const d = Array.isArray(G.delay) ? G.delay[i] ?? 0 : G.delay ?? i * 0.12;
      p.move(G.move, { ...G, delay: d });
    });
  }
  // one cue; then() when it is done (at once, or when its close look is over)
  run(c, then) {
    const g = this.g;
    if (!c) { then?.(); return; }
    if (c.shot !== undefined) g.setShot(c.shot);
    if (c.girls) this.girls(c.girls);
    if (c.music !== undefined) { if (c.music) playMusic(c.music); else stopMusic(1.2); }
    if (c.sfx) { if (!sound(c.sfx)) sfx[c.sfx]?.(0); }
    if (c.sound) sound(c.sound);
    if (c.shake) g.post.shake(c.shake);
    if (c.flash) g.post.flash(c.flash[0] ?? 0.6, hexNum(c.flash[1] ?? '#ffffff'));
    if (c.impact) g.post.impact(c.impact);
    if (c.burst) { const [d, seq, beat, a, b] = c.burst; g.post.styleBurst(d, seq, beat, hexNum(a), hexNum(b)); }
    if (c.hint) g.hint(c.hint);
    if (c.say) this.say(c);
    if (c.mv) g.mv.play(c.mv);
    if (c.vfx) { const V = typeof c.vfx === 'string' ? { name: c.vfx } : c.vfx; g.vfx.play(V.name, V.at ? v3(V.at) : g.world.lookAt.clone(), { scale: V.scale }); }
    if (c.act) g.acts.start(c);
    if (c.insert) g.ride.insert(c.insert);
    if (c.swap) for (const [from, to] of Object.entries(c.swap)) g.world.swapBoard?.(from, to);
    if (c.fire) for (const id of c.fire) g.actors.find((a) => a.g?.id === id && !a.spent)?.fire();
    if (c.spawn) for (const e of c.spawn) g.spawnEnemy(e);
    // (the wave events of before: Game.waveEvent does them, as it always did)
    if (c.turn || c.mutate || c.gimmick || c.collapse || c.spawner || c.wake) g.waveEvent({ turn: c.turn, mutate: c.mutate, gimmick: c.gimmick, collapse: c.collapse, spawner: c.spawner, wake: c.wake });
    if (c.vignette) { g.vignette(c.vignette, () => then?.()); return; }
    if (c.cam) { this.cam(c.cam, then); return; }
    then?.();
  }
  say(c) {
    const g = this.g, P = g.players.filter((p) => p.state !== 'away' && (p.slot === 0 || g.p2on()));
    if (!P.length) return;
    const who = c.who === 'both' ? P : c.who != null ? P.filter((p) => p.slot === c.who || p.id === c.who) : [P[Math.floor(Math.random() * P.length)]];   // (who: a slot, or the girl herself: 'pink' / 'cat')
    // (not in the very first frame of a stage: the HUD lays itself out first)
    g.tweens.wait(0.05, () => { for (const p of who) g.hud.gl.stickers.say(p, c.say, 1, !!c.force); });
  }
  // a close look at something (Game.cine): the boss, the nearest monster of a kind, a point
  cam(o, then) {
    const g = this.g;
    let on = null;
    if (Array.isArray(o.on)) on = v3(o.on);
    else if (o.on === 'boss') on = g.boss || null;
    else if (o.on) on = g.actors.filter((a) => a.alive && a.type === o.on).sort((a, b) => a.distToCam() - b.distToCam())[0] || null;
    if (!on) { then?.(); return; }
    g.cine({ on, dist: o.dist ?? 3, up: o.up ?? 0, side: o.side ?? 0, v: o.v ?? 0.55, zoom: o.zoom, orbit: o.orbit, dolly: o.dolly,
      title: o.title ? tr(o.title) : null, in: o.in ?? 0.8, hold: o.hold ?? 2, out: o.out ?? 0.7, lull: o.lull !== false, pause: o.pause !== false, face: o.face }, () => then?.());
  }
  // cues in order by their at (seconds since the start); a close look holds the rest until it is over
  timeline(list, then) {
    const g = this.g, q = ++this.q, L = [...(list || [])].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
    let i = 0, t0 = performance.now() / 1000, held = 0;
    const next = () => {
      if (q !== this.q) return;   // (a newer timeline took over: the stop was left)
      if (i >= L.length) { then?.(); return; }
      const c = L[i++], wait = Math.max(0, (c.at ?? 0) - (performance.now() / 1000 - t0 - held));
      g.tweens.wait(wait, () => {
        if (q !== this.q) return;
        if (c.cam) { const s = performance.now() / 1000; this.run(c, () => { held += performance.now() / 1000 - s; next(); }); } else { this.run(c); next(); }
      });
    };
    next();
  }
  stop() { this.q++; }
}
