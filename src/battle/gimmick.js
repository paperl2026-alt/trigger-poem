// Things in the place that react when they are shot (docs/DESIGN.md 第 1 话: the famous scenes of the homage are acted out, some of them
// by these): a painting that flashes and turns rotten (the photographed frescoes), the armour's empty hand, the barrier's seals, the
// boss's three objects. They wear the white "you can shoot this" outline but are no monsters: a wave never waits for them, the AI
// partner leaves them to the player.
// Set data (sets/<set>.json "gimmicks"), or made by code:
//   { id, k: picture, kx: picture once it has fired, on: "left" | "right" | "end" | "stand", x, y (centre height; "stand": 0 = on the
//     floor), z, w (metres), ry (degrees, "stand"), hp: hits to fire (default 1), station: only shootable at that stop, do: [events] }
//   events (each may wait { t: seconds }): { flash } a camera flash; { flip } turns into kx like a page; { turn: {...} } the place turns
//   (Game.turn); { spawn: [enemy spawns] }; { say: kind } a girl's line (text/stickers.json); { sfx: name }; { gone } it fades away;
//   { ritual: i } offered to the boss (thing.js offer)
import { Actor } from './enemies.js';
import { tex } from '../core/assets.js';
import { sfx } from '../core/audio.js';
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
    else { P.set(g.x || 0, g.y || 0, g.z); this.root.rotation.y = (g.ry || 0) * Math.PI / 180; }
    game.world.scene.add(this.root);
  }
  // shootable only at its own stop, once
  live() { return !this.spent && (!this.g.station || this.game.stationId === this.g.station) && this.game.combat; }
  hitMeshes() { return this.alive && this.live() ? [this.mesh] : []; }
  hit(info) {
    if (!this.live()) return;
    this.flash = 1;
    if (++this.hits >= (this.g.hp || 1)) this.fire(info?.by);
  }
  fire(by) {
    const g = this.game;
    this.spent = true; this.u.outlineOn.value = 0;
    for (const e of this.g.do || []) g.tweens.wait(e.t || 0, () => this.act(e, by));
  }
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
    if (e.gone) g.tweens.run(0.6, (k) => { this.u.opacity.value = 1 - k; }, { onDone: () => { this.alive = false; this.dispose(); } });
  }
  update(dt, t) { if (this.alive) this.baseUpdate(dt, t); }
}
