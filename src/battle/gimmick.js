// Things in the place that react when they are shot (docs/DESIGN.md 第 1 话: the famous scenes of the homage are acted out, some of them
// by these): a painting that flashes and turns rotten (the photographed frescoes), the armour's empty hand, the barrier's seals, the
// boss's three objects. They wear the white "you can shoot this" outline but are no monsters: a wave never waits for them, the AI
// partner leaves them to the player.
// Set data (sets/<set>.json "gimmicks"), or made by code:
//   { id, k: picture, kx: picture once it has fired, on: "left" | "right" | "end" | "stand", x, y (centre height; "stand": 0 = on the
//     floor), z, w (metres), ry (degrees, "stand"), hp: hits to fire (default 1), station: only shootable at that stop, do: [events],
//     shoot: false = not a target (a wave event fires it: Game.waveEvent gimmick) }
//   events (each may wait { t: seconds }): { flash } a camera flash; { flip } turns into kx like a page; { turn: {...} } the place turns
//   (Game.turn); { spawn: [enemy spawns] }; { say: kind } a girl's line (text/stickers.json); { sfx: name }; { gone } it fades away;
//   { ritual: i } offered to the boss (thing.js offer); (DESIGN「地形和机关」) { light: step } it becomes kx at once and lights the dark room
//   a step (PanelWorld.addLamp); { topple: angle, seal: id } a standing thing tips over sideways (radians, + = to the left) onto the hole a
//   spawner pours out of and stops it (Game.sealSpawner); { gate: true } one of the seals holding the drawbridge (PanelWorld.gateHit)
import { Actor } from './enemies.js';
import { tex } from '../core/assets.js';
import { sfx, sound } from '../core/audio.js';
import { Ease } from '../core/tween.js';

export class Gimmick extends Actor {
  constructor(game, g) {
    const t = tex[g.k], h = g.w * t.image.height / t.image.width;
    super(game, g.k, h, g.on === 'stand' ? 'bottom' : 'center');
    this.g = g; this.prop = true; this.billboard = false;
    this.hits = 0; this.spent = false;
    const H = game.world.set?.hall || { x0: -2, x1: 2, z1: -20 }, P = this.root.position;
    if (g.on === 'left') { P.set(H.x0 + 0.03, g.y, g.z); this.root.rotation.y = Math.PI / 2; }
    else if (g.on === 'right') { P.set(H.x1 - 0.03, g.y, g.z); this.root.rotation.y = -Math.PI / 2; }
    else if (g.on === 'end') { P.set(g.x || 0, g.y, H.z1 + 0.03); }
    else if (g.on === 'floor') { P.set(g.x || 0, 0.03, g.z); this.root.rotation.set(-Math.PI / 2, 0, (g.ry || 0) * Math.PI / 180); }   // (lying flat: the clock face's plates)
    else { P.set(g.x || 0, g.y || 0, g.z); this.root.rotation.y = (g.ry || 0) * Math.PI / 180; }
    game.world.scene.add(this.root);
    if (g.shoot === false) this.u.outlineOn.value = 0;
    // a candle of a dark room: a faint glint where it is until it is lit (PanelWorld.lamp / light)
    if ((g.do || []).some((e) => e.light) && game.world.lamp) { this.root.updateMatrixWorld(true); this.lamp = game.world.lamp(this.uvToWorld(0.5, 0.92)); }
  }
  // shootable only at its own stop, once
  // (needs: a spawner's id: only while that hole is pouring monsters out is it there to be shot: the shelf that blocks it)
  live() { return !this.spent && (!this.g.station || this.game.stationId === this.g.station) && this.game.combat && (!this.g.needs || !!this.game.spawners?.some((s) => s.id === this.g.needs && s.live && s.ready !== false)); }
  hitMeshes() { return this.alive && this.g.shoot !== false && this.g.armed !== false && this.live() ? [this.mesh] : []; }   // (armed: false until the fight lets it be shot: chase.js dial)   // (shoot: false = only a wave event fires it)
  hit(info) {
    if (!this.live()) return;
    this.flash = 1;
    if (++this.hits >= (this.g.hp || 1)) this.fire(info?.by);
  }
  fire(by) {
    const g = this.game;
    this.spent = true; this.u.outlineOn.value = 0;
    if (this.g.block) g.chase?.cleared(this);   // (episode 2: a thing in the way is gone: time earned)
    for (const e of this.g.do || []) g.tweens.wait(e.t || 0, () => this.act(e, by));
  }
  // already done before this point of the place (a run started at a later stop, e.g. the boss in the studio whose portraits the shadows
  // already stepped out of): shown as it is after it fired, nothing happens
  settle() { this.spent = true; this.u.outlineOn.value = 0; if (this.g.kx) this.setFrame(this.g.kx); }
  act(e, by) {
    const g = this.game;
    if (e.flash) { g.post.flash(0.85, 0xffffff); sfx.shutter(); }
    if (e.flip && this.g.kx) {
      sfx.panel();
      g.tweens.run(0.36, (k) => {
        if (k >= 0.5 && this.mesh.userData.texKey !== this.g.kx) this.setFrame(this.g.kx);
        this.inner.scale.x = Math.max(0.02, Math.abs(Math.cos(k * Math.PI)));
      }, { ease: Ease.inOutQuad });
    }
    if (e.turn) g.turn(e.turn);
    if (e.spawn) for (const s of e.spawn) g.spawnEnemy(s);
    if (e.say) g.hud.gl.stickers.say(by || g.players.find((p) => p.state === 'out') || g.players[0], e.say);
    if (e.sfx && sfx[e.sfx]) sfx[e.sfx]();
    if (e.ritual !== undefined) g.boss?.offer?.(e.ritual, this);   // (the boss's offering: src/battle/thing.js ritual)
    if (e.light) {
      if (this.g.kx) this.setFrame(this.g.kx);
      const p = this.uvToWorld(0.5, 0.92); g.fx.embers(p, 14, 0.3); g.fx.star(p, 0.6, 0xffc070); sfx.burnOut(0);
      g.world.light?.(this.lamp, e.light);
    }
    if (e.topple) {
      sfx.tear(0);
      g.tweens.to(this.root.rotation, { z: e.topple }, 0.7, { ease: Ease.inQuad, onDone: () => {
        sfx.slam(); g.post.shake(1.1); g.fx.puff(this.root.position, 12, 0xd8c8b0, 1.3); g.sealSpawner(e.seal);
      } });
    }
    if (e.gate) g.world.gateHit?.();
    // episode 2 (src/battle/chase.js): it falls from where it hangs (drop: { t }), onto her if she is under it (trap: { r, down, hold });
    // a door / shutters slammed between her and the girls (door: { hold }); a clock struck to draw her away (lure: { t }); meter: time earned
    if (e.drop) this.drop(e.drop);
    if (e.trap) g.tweens.wait(e.drop ? (e.drop.t ?? 0.45) : e.topple ? 0.7 : 0, () => g.chase?.trap(this, e.trap));
    if (e.door) g.chase?.door(this, e.door);
    if (e.lure) g.chase?.lure(this, e.lure);
    if (e.meter) g.chase?.add(e.meter, this.center());
    if (e.sound) sound(e.sound);
    if (e.read) g.chase?.read(e.read, this);   // (a note / a ledger: its text on a card)
    if (e.toll) g.chase?.toll(this);           // (the bell of the tower: the end of her)
    if (e.node) g.chase?.node(this);           // (a plate of the clock face lit)
    if (e.free) g.chase?.freeCrow(this);       // (the crow let out of its cage)
    if (e.collapse) g.collapse();              // (the storehouse's floor hatch: down into the cave)
    if (e.gone) g.tweens.run(0.6, (k) => { this.u.opacity.value = 1 - k; }, { onDone: () => { this.alive = false; this.dispose(); } });
  }
  // a hanging thing comes down (its chain shot through): falls flat onto the floor with a crash
  drop(spec) {
    const g = this.game, P = this.root.position, y1 = this.pivot === 'center' ? this.h * 0.42 : 0, d = spec.t ?? 0.45;
    sound('beamFall') || sfx.slam();
    g.tweens.to(P, { y: y1 }, d, { ease: Ease.inQuad, onDone: () => { g.post.shake(1.0); g.fx.puff(P, 12, 0xd8c8b0, 1.3); sfx.thud(0); } });
    g.tweens.to(this.root.rotation, { z: (Math.random() - 0.5) * 0.7 }, d, { ease: Ease.inQuad });
  }
  update(dt, t) {
    if (!this.alive) return;
    this.baseUpdate(dt, t);
    if (this.g.needs && !this.spent) this.u.outlineOn.value = this.live() ? 1 : 0;
    // mark: while it can be shot, the red "shoot this" ring round it (fx.lock, like a monster about to ram), so it can't be missed
    if (this.g.mark) {
      const on = this.live() && this.g.armed !== false;
      if (on && !this.lock) this.lock = this.game.fx.lock('kill', 0);
      if (!on && this.lock) { this.lock.remove(); this.lock = null; }
      if (this.lock) { const g = this.game, wc = this.center(), c = g.world.project(wc), b = this.screenBox(); this.lock.set(c.x, g.H - c.y, Math.max(40, (b.y1 - b.y0) * 0.6), 1, t, 1, b, wc); }
    }
  }
}
