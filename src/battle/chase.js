// Episode 2 (docs/DESIGN.md「第 2 话」钟楼惊宿, a homage to the SFC Clock Tower): "she", the stalker who cannot be killed, and the run of
// the one long stage she drives (user 2026-10-18: chase -> knock her back -> clear the monsters / the things in the way / the mechanism in a
// hurry / break through -> run -> she comes again, beaten back another way -> at last a magic circle where she keeps coming back in other
// forms until she is sent off; hiding places settle what the player earned on the way).
//   Stalker  her drawing and moves: a stagger gauge instead of HP (full = knocked down a while, up a little sooner each time), a wind-up with
//            the red "shoot it now" ring (hits there count double), a lunge that goes through cover, a grab the girls mash their way out of
//   Chase    owned by Game (game.chase); a station of the set says what happens there:
//            chase: { path, face, speed, form, dist, herSpeed }  the camera runs along the path looking back at her (or sideways / down),
//                   she gains on them; traps on the way (set gimmicks: drop / trap / door / lure) knock her down or hold her up
//            block: { form, dist, herSpeed, turnAt }  the way on is blocked (gimmicks with block: true, and the station's monsters) while
//                   she comes up from behind; close, the view whips round to beat her down, then back to the blockage
//            hide:  { stabs, dmg, from, at }  a hiding place: she comes, a forced round of stabs; the time earned since the last one
//                   (meter) stops that many of them and decides how she leaves (and how close she starts the next chase)
//            she:   { form, at, wake }  she prowls a fighting stop (the monsters' wave goes on; she is not one of them)
//            dial:  { ... }  the final fight on the bell tower's clock face (Game: dialFight)
// Numbers: content tuning/chase.json.
import * as THREE from 'three';
import { tex } from '../core/assets.js';
import { sfx, sound, bed, playMusic, stopMusic } from '../core/audio.js';
import { Ease } from '../core/tween.js';
import { T } from '../core/content.js';
import { t } from '../core/i18n.js';
import { Actor } from './enemies.js';
import { COL } from './fx.js';

const K = () => T.chase;
const rnd = (a, b) => a + Math.random() * (b - a);
const V = new THREE.Vector3(), V2 = new THREE.Vector3();

// her forms (enemy/she_<form>_<pose>, tools/rounds/r62_import.py); kaiko = the giant silkworm under the house (enemy/kaiko_<pose>)
const FORMS = {
  a: { frames: { still: ['still'], walk: ['walk0', 'walk1'], windup: ['windup'], lunge: ['lunge'], down: ['down'], rise: ['rise'], stare: ['stare'],
                 peek: ['peek'], grab: ['grab'], stab: ['stab'], stuck: ['stuck'] } },
  e: { frames: { still: ['still'], walk: ['hover', 'still'], windup: ['inhale'], lunge: ['sweep'], down: ['fall'], rise: ['hover'], stare: ['still'],
                 peek: ['still'], grab: ['sweep'], stab: ['sweep'], stuck: ['fall'], summon: ['summon'], scream: ['scream'] } },
  c: { frames: { still: ['still'], walk: ['walk0', 'walk1'], windup: ['windup'], lunge: ['lunge'], down: ['down'], rise: ['cling'], stare: ['still'],
                 peek: ['still'], grab: ['pounce'], stab: ['lunge'], stuck: ['drop'], climb: ['climb0', 'climb1'], cling: ['cling'], rear: ['rear'],
                 pounce: ['pounce'], drop: ['drop'] } },
  kaiko: { prefix: 'enemy/kaiko_', frames: { still: ['sleep'], wake: ['wake'], walk: ['crawl'], windup: ['windup'], lunge: ['lunge'], down: ['hurt'],
                                             rise: ['crawl'], stare: ['wake'], grab: ['lunge'], stab: ['lunge'], stuck: ['hurt'] } },
};

export class Stalker extends Actor {
  constructor(game, form = 'a', at = null) {
    const F = FORMS[form] || FORMS.a, pre = F.prefix || `enemy/she_${form}_`;
    const first = [pre + F.frames.still[0], pre + 'still', pre + 'walk0'].find((k) => tex[k]);
    super(game, first, K().she.h[form] ?? 2.3, 'bottom');
    this.prefix = pre; this.frames = F.frames; this.form = form; this.kaiko = form === 'kaiko';
    this.stalker = true; this.type = this.kaiko ? 'kaiko' : 'she';
    this.stag = 0; this.downs = 0; this.timer = 0; this.state = 'still'; this.after = 'follow'; this.invul = 0;
    this.snipT = 0; this.step = 0; this.speedK = 1;
    game.world.scene.add(this.root);
    this.shadowM = game.world.makeShadow(this.w * 0.5); this.root.add(this.shadowM);
    if (at) this.root.position.set(at.x, at.y || 0, at.z);
    this.play('still');
  }
  frameOk(name) { return (this.frames[name] || []).some((f) => tex[this.prefix + f]); }
  pose(name, fps = 8) { this.play(this.frameOk(name) ? name : 'still', fps); }
  hitMeshes() { return this.alive && this.state !== 'gone' ? [this.mesh] : []; }
  busy() { return ['down', 'rising', 'stuck', 'lunge', 'grab', 'lured', 'gone', 'scripted'].includes(this.state); }
  // where she is relative to the camera (metres, horizontal)
  dist() { const c = this.game.world.camPos, P = this.root.position; return Math.hypot(P.x - c.x, P.z - c.z); }

  update(dt, tt) {
    this.baseUpdate(dt, tt);
    if (!this.alive) return;
    const g = this.game, S = K().she;
    this.invul = Math.max(0, this.invul - dt);
    this.stag = Math.max(0, this.stag - S.stagDrain * dt);
    if ((this.fadeT = (this.fadeT ?? 0) - dt) <= 0) { this.fadeT = 0.3; this.dm.fade(0.82); }   // (her wounds close again: she cannot be killed)
    // her blades: a snip with every other step while she walks (where she is: louder near, panned to her side)
    if (['follow', 'walk', 'stalk', 'lured'].includes(this.state)) {
      this.pose(this.state === 'climb' ? 'climb' : 'walk', 6 * this.speedK);
      if ((this.snipT -= dt) <= 0) {
        this.snipT = 0.55 / Math.max(0.6, this.speedK);
        const d = this.dist(), s = g.world.project(this.root.position), pan = Math.max(-1, Math.min(1, (s.x / g.W - 0.5) * 2));
        if (!this.kaiko) { if (d < 9) sound('snip', { pan, vol: Math.min(1, 1.6 - d / 9) }) || sfx.slash(0.5); else sound('snipFar', { pan, vol: Math.min(1, 2 - d / 16) }); }
        else if (Math.random() < 0.5) sound('slurp', { pan, vol: 0.7 });
      }
    }
    if (this.state === 'down') {
      this.timer -= dt;
      this.inner.position.x = Math.sin(tt * 30) * 0.02 * Math.min(1, this.timer);
      if (Math.random() < dt * 4) g.fx.star(this.uvToWorld(rnd(0.3, 0.7), 0.35), 0.35, COL.lime);
      if (this.timer <= 0) this.rise();
    } else if (this.state === 'rising' || this.state === 'stuck') {
      if ((this.timer -= dt) <= 0) { if (this.state === 'stuck') { sound('shoji') || sfx.tear(0); g.post.shake(0.5); } this.state = this.after; this.inner.position.x = 0; }
    } else if (this.state === 'windup') {
      this.timer -= dt;
      this.inner.position.x = Math.sin(tt * 48) * 0.025;
      if (this.timer <= 0) this.lunge();
    }
    if (this.lock) {
      const wc = this.center(), c = g.world.project(wc), b = this.screenBox();
      this.lock.set(c.x, g.H - c.y, Math.max(50, (b.y1 - b.y0) * 0.45), Math.min(1, 1 - this.timer / Math.max(0.01, this.timer0)), tt, this.timer, b, wc);
    }
  }
  // info: a shot (Game.shoot / beamHit). No HP: every hit fills her stagger gauge; full = she goes down
  hit(info) {
    if (!this.alive) return;
    const g = this.game, p = this.uvToWorld(info.uv.u, info.uv.v);
    this.lastHitBy = info.by;
    if (this.busy() && this.state !== 'lunge' || this.invul > 0) {   // (down already / stuck in a door: the shots only spark off the steel)
      info.dealt = 0; this.flash = Math.max(this.flash, 0.25); g.fx.star(p, 0.3, COL.white);
      if (Math.random() < 0.3) sfx.clang();
      return;
    }
    this.paint(info);
    this.flash = 0.85;
    g.fx.confetti(p, info.crit ? 8 : 3, 0.7, [COL.white, COL.gold]); g.fx.star(p, info.crit ? 0.7 : 0.3);
    const S = K().she, k = (info.dmg / (this.kaiko ? S.kaikoStagger : S.stagger)) * (this.state === 'windup' ? S.windupStagger : 1);
    this.stag = Math.min(1, this.stag + k);
    info.dealt = info.dmg;
    g.onHit(this, info.kind, info);
    if (Math.random() < 0.18) sfx.clang();
    if (this.stag >= 1) { if (this.kaiko) this.flinch(); else this.knockDown(); }
    else if (!this.busy()) g.chase?.shove(this, (info.stagger || 10) * S.shove);
  }
  // the silkworm cannot be knocked down: a full gauge only makes it rear and hold back a moment
  flinch() { this.stag = 0; this.endWindup(); this.state = 'stuck'; this.after = this.after || 'follow'; this.timer = 1.2; this.pose('down'); sound('kaikoWail') || sfx.roar(); this.game.chase?.shove(this, 2.5); }
  knockDown(len = null, how = 'shot') {
    const g = this.game, S = K().she;
    if (this.state === 'down') { this.timer = Math.max(this.timer, len || 0); return; }
    this.endWindup(); g.etw.kill(this.root.position);
    if (this.state !== 'rising') this.after = this.after === 'down' ? 'follow' : this.after;
    this.state = 'down'; this.pose('down'); this.stag = 0; this.downs++; this.dm.clear();
    this.timer = len ?? Math.max(S.downMin, S.down * Math.pow(S.downDecay, this.downs - 1));
    sound('sheKnock') || sfx.thud(0); sfx.clang(); g.post.shake(0.9);
    g.fx.puff(this.root.position, 10, COL.bone, 1.2); g.fx.star(this.uvToWorld(0.5, 0.4), 1.2, COL.gold);
    g.chase?.onKnock(this, how);
  }
  rise() { this.state = 'rising'; this.pose('rise'); this.timer = K().she.riseTime; this.inner.position.x = 0; sound('sheRise') || sfx.creak(); }
  // the wind-up: blades spread (the red ring: hits now count double toward knocking her down), then the lunge
  windup(slot) {
    if (this.busy() || this.state === 'windup') return;
    const g = this.game;
    this.state = 'windup'; this.pose('windup'); this.timer = this.timer0 = K().she.windup;
    this.slot = slot ?? g.pickTarget(this.root.position.x - g.world.camPos.x);
    this.lock = g.fx.lock('kill', this.slot);
    sound('bladeOpen') || sfx.warn(); g.warnClose();
  }
  endWindup() { if (this.lock) { this.lock.remove(); this.lock = null; } }
  // the lunge: through any cover (DESIGN 快打: only knocking her down stops it); sometimes she keeps hold of one of them (Chase.grab)
  lunge() {
    const g = this.game, P = this.root.position, c = g.world.camPos, S = K().she;
    this.endWindup(); this.state = 'lunge'; this.pose('lunge');
    const dx = c.x - P.x, dz = c.z - P.z, d = Math.hypot(dx, dz) || 1, go = Math.max(0, d - 1.1);
    const x0 = P.x, z0 = P.z;
    sound('snip') || sfx.slash(1); sfx.whoosh(0);
    g.etw.run(0.22, (e) => { P.x = x0 + dx / d * go * e; P.z = z0 + dz / d * go * e; }, { ease: Ease.inQuad, onDone: () => {
      if (!this.alive || this.state !== 'lunge') return;
      g.post.shake(1.1); g.post.flash(0.25, 0xff2040);
      const grab = !this.kaiko && g.chase && g.combat && Math.random() < S.grabChance && !g.chase.grabbing;
      g.playerAttacked({ kind: 'ram', dmg: this.kaiko ? S.kaikoDmg : S.lungeDmg, from: this, heavy: true, slot: this.slot ?? 0 });
      if (grab && g.combat) { g.chase.grab(this, this.slot ?? 0); return; }
      this.recoil();
    } });
  }
  recoil(back = K().she.recoil) {
    const g = this.game, P = this.root.position, c = g.world.camPos, dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz) || 1, x0 = P.x, z0 = P.z;
    this.state = 'rising'; this.timer = 0.5; this.pose('rise');
    g.etw.run(0.4, (e) => { P.x = x0 + dx / d * back * e; P.z = z0 + dz / d * back * e; }, { ease: Ease.outCubic });
    g.chase?.shove(this, back, true);
  }
  // stuck in a door the girls slammed (Chase.door): she cuts her way through after hold seconds
  stuck(hold) { this.endWindup(); this.state = 'stuck'; this.timer = hold; this.pose('stuck'); sound('stab') || sfx.tear(0); }
  // drawn away by a sound somewhere else (a clock struck: Chase.lure)
  lured(s) { this.endWindup(); this.state = 'lured'; this.timer = s; this.lureT = s; }
  die() {   // (only the silkworm, burned: the trap of kerosene and candles)
    this.alive = false; this.endWindup(); this.u.outlineOn.value = 0;
    sound('kaikoWail') || sfx.roar(); this.dieBurn({ u: 0.5, v: 0.4 });
  }
  dispose() { this.endWindup(); super.dispose(); }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
export class Chase {
  constructor(game) {
    this.g = game; this.she = null; this.mode = null; this.meter = 0; this.panic = 0; this.nextDist = null;
    this.grabbing = null; this.theme = false; this.facing = 'fwd';
    this.ui = null;
  }
  // she is here (in the form asked for): the one already about, or a new one (an old form is put away)
  ensure(form = 'a', at = null) {
    const g = this.g;
    if (this.she && this.she.alive && this.she.form === form && !this.she.removed) return this.she;
    if (this.she && !this.she.removed) { const P = this.she.root.position.clone(); this.she.alive = false; this.she.dispose(); at = at || P; }
    const c = g.world.camPos;
    this.she = new Stalker(g, form, at || { x: c.x, z: c.z + 20 });
    g.actors.push(this.she);
    return this.she;
  }
  gone() { if (this.she && !this.she.removed) { this.she.alive = false; this.she.dispose(); } this.she = null; this.music(false); this.panic = 0; }
  // her theme: on the moment she is about (the original's music cuts in when Scissorman shows up), off when she is gone: the clocks again
  music(on) {
    if (on === this.theme) return;
    this.theme = on;
    if (on) { playMusic('she'); bed('clockTick', false); } else { stopMusic(1.5); if (this.g.world.set?.clocks !== false && this.g.ep?.id === 'ep2') bed('clockTick', true, 0.7); }
  }
  add(n, at = null) {
    const M = K().meter;
    this.meter = Math.min(M.max, this.meter + n);
    this.drawMeter(true);
    if (at && n > 0) { const s = this.g.world.project(at); this.g.hud.gl.stickers.onoma?.(s.x, this.g.H - s.y, false); }
  }

  // ---- a stretch run looking back at her (station chase)
  run(S, then) {
    const g = this.g, w = g.world, C = S.chase, R = K().run;
    const pts = [w.camPos.clone(), ...(C.path || S.via || []).map((p) => new THREE.Vector3(...p)), new THREE.Vector3(...S.cam)];
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); this.len = this.curve.getLength(); this.s = 0;
    this.speed = C.speed ?? R.speed; this.face = C.face || 'back'; this.S = S; this.then = then; this.mode = 'run';
    const she = this.ensure(C.form || 'a');
    this.dist = C.dist ?? this.nextDist ?? R.startDist; this.nextDist = null;
    this.herSpeed = C.herSpeed ?? R.herSpeed;
    if (!['down', 'rising', 'stuck'].includes(she.state)) she.state = 'follow';
    she.after = 'follow';
    this.placeShe();
    this.music(true);
    g.combat = true; g.setAll('cover'); g.settled = true;
    if (C.hint) g.hint(C.hint);
    this.drawMeter(true);
  }
  // the point of the run's path at distance s (metres from its start; before the start: on along its first direction)
  at(s, out) {
    if (s >= 0) return this.curve.getPointAt(Math.min(1, s / this.len), out);
    this.curve.getPointAt(0, out); const t0 = this.curve.getTangentAt(0); return out.addScaledVector(t0, s);
  }
  placeShe() {
    const she = this.she; if (!she) return;
    if (this.mode === 'run') {
      this.at(this.s - this.dist, V); she.root.position.set(V.x, this.S?.chase?.climb ? Math.max(0, V.y - 1.1) : 0, V.z);
    } else if (this.mode === 'block' && this.facing === 'fwd' && !she.busy()) {
      const w = this.g.world, f = V2.subVectors(w.lookAt, w.camPos).setY(0).normalize();
      she.root.position.set(w.camPos.x - f.x * this.dist, 0, w.camPos.z - f.z * this.dist);
    }
  }
  // pushed back along the run (hits, a recoil)
  shove(she, m, recoil = false) {
    if (this.mode === 'run') this.dist += m * (recoil ? 1 : 0.08);
    else if (this.mode === 'block' && this.facing === 'fwd') this.dist += m * (recoil ? 1 : 0.05);
  }
  onKnock(she, how) {
    this.add(how === 'trap' ? K().meter.trap : K().meter.knock, she.center());
    const g = this.g, p = g.players[Math.random() < 0.5 || !g.p2on() ? 0 : 1];
    if (p) g.hud.gl.stickers.say(p, 'stagger');
    if (this.mode === 'block' && this.facing === 'back') g.tweens.wait(0.8, () => this.mode === 'block' && this.turn('fwd'));
  }

  // ---- the way on is blocked while she comes up behind (station block)
  block(S) {
    const g = this.g, B = S.block;
    this.mode = 'block'; this.S = S; this.facing = 'fwd';
    this.fwdLook = new THREE.Vector3(...S.look);
    const c = g.world.camPos; this.backLook = new THREE.Vector3(2 * c.x - this.fwdLook.x, this.fwdLook.y, 2 * c.z - this.fwdLook.z);
    const she = this.ensure(B.form || 'a');
    this.dist = B.dist ?? this.nextDist ?? K().block.startDist; this.nextDist = null;
    this.herSpeed = B.herSpeed ?? K().block.herSpeed; this.turnAt = B.turnAt ?? K().block.turnAt;
    if (!she.busy()) she.state = 'follow';
    this.placeShe();
    this.music(true);
    if (B.hint) g.tweens.wait(1.0, () => g.hint(B.hint));
  }
  turn(to) {
    const g = this.g, w = g.world, c = w.camPos.clone(), from = w.lookAt.clone(), target = to === 'back' ? this.backLook : this.fwdLook;
    if (this.facing === to || this.turning) return;
    this.turning = true; this.facing = to;
    if (to === 'back') { g.hud.gl.hold('behind'); sound('sheLaugh') || sfx.roar(); g.players.forEach((p) => g.hud.setFace(p.slot, 'scared', 1.2)); }
    const a0 = Math.atan2(from.x - c.x, from.z - c.z), d0 = Math.hypot(from.x - c.x, from.z - c.z), d1 = Math.hypot(target.x - c.x, target.z - c.z);
    let a1 = Math.atan2(target.x - c.x, target.z - c.z);
    while (a1 - a0 > Math.PI) a1 -= Math.PI * 2;
    while (a1 - a0 < -Math.PI) a1 += Math.PI * 2;
    sfx.whoosh(0);
    g.tweens.run(0.45, (e) => { const a = a0 + (a1 - a0) * e, d = d0 + (d1 - d0) * e; w.lookAt.set(c.x + Math.sin(a) * d, from.y + (target.y - from.y) * e, c.z + Math.cos(a) * d); w.fovKick = Math.sin(e * Math.PI) * 12; },
      { ease: Ease.inOutCubic, onDone: () => { w.fovKick = 0; this.turning = false; if (to === 'back' && this.she && !this.she.busy()) this.she.state = 'stalk'; } });
  }
  // a blockage is gone (a gimmick with block: true): the time earned
  cleared(gm) { this.add(K().meter.block, gm.center()); }

  // ---- a hiding place (station hide): she comes; a forced round of stabs; what was earned stops some; how she leaves
  hide(S, then) {
    const g = this.g, H = S.hide, M = K().meter, HD = K().hide;
    this.mode = 'hide'; this.S = S;
    g.combat = false; g.setAll('cover');
    const she = this.ensure(H.form || 'a', H.from ? { x: H.from[0], z: H.from[1] } : null);
    she.state = 'scripted'; she.endWindup();
    const at = H.at ? { x: H.at[0], z: H.at[1] } : null, P = she.root.position;
    this.peek(true);
    bed('heartbeat', true, 0.9); this.music(false); stopMusic(0.4);
    g.hud.gl.hold('hide');
    const n = H.stabs ?? HD.stabs, k = this.meter / M.max, blocked = Math.round(n * k);
    const tier = k >= HD.high ? 'high' : k >= HD.mid ? 'mid' : 'low';
    // she walks up to the hiding place, slowly
    if (at) { she.pose('walk', 5); const x0 = P.x, z0 = P.z; g.tweens.run(H.walk ?? 3.2, (e) => { P.x = x0 + (at.x - x0) * e; P.z = z0 + (at.z - z0) * e; if (Math.floor(e * 7) !== this.hstep) { this.hstep = Math.floor(e * 7); sound('snip', { vol: 0.5 + e * 0.5 }); } }); }
    let tt = (H.walk ?? 3.2) + 0.9;
    g.tweens.wait(tt - 0.6, () => { she.pose('stare'); sound('sheLaugh'); });
    // the stabs: the first `blocked` ones are stopped by what the girls earned (the doors they shut, the things they dropped), the rest hurt
    const order = Array.from({ length: n }, (_, i) => i < blocked).sort(() => Math.random() - 0.5);
    order.forEach((stop, i) => g.tweens.wait(tt + i * HD.every, () => {
      she.pose('stab'); sound('stab') || sfx.tear(0); g.post.shake(stop ? 0.45 : 1);
      const x = g.W * rnd(0.3, 0.7), y = g.H * rnd(0.25, 0.7);
      this.stabMark(x, y, stop);
      if (stop) { sfx.clang(); g.fx.sparks(x, y, 10, COL.gold, 1); }
      else { g.combat = true; g.playerAttacked({ kind: 'ram', dmg: H.dmg ?? HD.dmg, from: she, heavy: true, slot: Math.random() < 0.5 ? 0 : 1 }); g.combat = false; g.post.flash(0.3, 0xff2040); }
    }));
    tt += n * HD.every + 0.6;
    g.tweens.wait(tt, () => {
      const R = HD.next[tier];
      this.nextDist = R;
      if (tier === 'high') {   // she gives up: a clock strikes somewhere and she goes after it
        sound('clockChime') || sfx.clang(); she.pose('walk', 5); const x0 = P.x, z0 = P.z;
        g.tweens.run(2.2, (e) => { P.z = z0 + e * 6; P.x = x0; }, { onDone: () => { this.out(then, tier); } });
        g.hud.gl.stickers.say(g.players[0], 'real');
      } else if (tier === 'mid') {   // she gets half in; they burst out past her
        she.pose('peek'); sound('shoji') || sfx.tear(0); g.post.shake(0.8);
        g.tweens.wait(1.0, () => { she.knockDown(K().she.downMin, 'burst'); this.out(then, tier); });
      } else {   // the door torn open, right in their faces, and she grabs one of them
        she.pose('lunge'); sound('sheLaugh'); sound('shoji'); g.post.flash(0.5, 0xffffff); g.post.shake(1.6); g.G.stop(0.12);
        g.players.forEach((p) => { g.hud.setFace(p.slot, 'scared', 2); p.soft.kick(1.6); });
        this.peek(false);
        g.tweens.wait(0.5, () => { g.combat = true; this.grab(she, Math.random() < 0.5 ? 0 : 1, () => this.out(then, tier)); });
      }
    });
    this.hideTier = tier;
  }
  out(then, tier) {
    const g = this.g;
    this.peek(false); bed('heartbeat', false);
    this.meter = 0; this.drawMeter(true);
    this.mode = null;
    g.hud.gl.hold(tier === 'high' ? 'hideSafe' : 'hideRun');
    then && then();
  }
  // the view from inside the hiding place: dark doors close on both sides, a slit to look through
  peek(on) {
    let el = document.querySelector('#ui .peek');
    if (on && !el) { el = document.createElement('div'); el.className = 'peek'; document.getElementById('ui').appendChild(el); requestAnimationFrame(() => el.classList.add('on')); }
    if (!on && el) { el.classList.remove('on'); setTimeout(() => el.remove(), 600); }
  }
  stabMark(x, y, stop) {
    const el = document.createElement('div'); el.className = `stab${stop ? ' stop' : ''}`;
    el.style.left = `${x}px`; el.style.top = `${y}px`; el.style.setProperty('--r', `${rnd(-50, 50)}deg`);
    document.getElementById('ui').appendChild(el); setTimeout(() => el.remove(), 1400);
  }

  // ---- she has hold of one of them: mash the trigger to break free (the original's panic button); hurts while it lasts
  grab(she, slot, then) {
    const g = this.g, S = K().she;
    if (this.grabbing) return;
    she.state = 'grab'; she.pose('grab'); she.endWindup();
    this.grabbing = { she, slot, n: 0, need: S.mash, t: S.mashTime, tick: 0, then };
    sound('grab') || sfx.hurt(); sound('sheLaugh');
    let el = document.createElement('div'); el.className = 'mash'; el.innerHTML = `<b>${t('mash')}</b><i></i>`; document.getElementById('ui').appendChild(el);
    this.grabbing.el = el;
    g.players.forEach((p) => g.hud.setFace(p.slot, 'scared', S.mashTime));
  }
  onShot(p) { const G = this.grabbing; if (G) { G.n++; G.el?.style.setProperty('--k', String(Math.min(1, G.n / G.need))); G.el?.classList.remove('pop'); void G.el?.offsetWidth; G.el?.classList.add('pop'); if (G.n >= G.need) this.free(true); } }
  free(won) {
    const G = this.grabbing; if (!G) return;
    this.grabbing = null; G.el?.remove();
    const g = this.g;
    if (won) { sfx.clang(); g.post.flash(0.3, 0xffffff); G.she.knockDown(K().she.downMin, 'free'); g.hud.gl.stickers.say(g.players[G.slot] || g.players[0], 'stagger'); }
    else G.she.recoil(K().she.recoil * 1.6);
    G.then && G.then();
  }

  // ---- mechanisms (gimmick.js do events)
  // something dropped / toppled on the spot (a hanging lantern, a screen, a stone lantern): down for long if she is under it, else it
  // still lies in her way (she has to cut through: a short hold)
  trap(gm, spec) {
    const she = this.she, at = gm.root.position; if (!she || !she.alive) return;
    const d = Math.hypot(she.root.position.x - at.x, she.root.position.z - at.z);
    if (d <= (spec.r ?? 2.2)) she.knockDown(spec.down ?? K().she.trapDown, 'trap');
    else { this.add(K().meter.trap * 0.4, at); if (this.mode === 'run' && she.state === 'follow') she.stuck(spec.hold ?? 1.2); }
  }
  // a door slammed / shutters shut between her and them: she is held there until she has cut through
  door(gm, spec) {
    const she = this.she; if (!she || !she.alive) return;
    this.add(K().meter.door, gm.center());
    if (she.state === 'down') { she.timer += spec.hold ?? 4; return; }
    she.stuck(spec.hold ?? 4);
  }
  // a clock struck elsewhere: she goes after the sound for a while (the gap grows)
  lure(gm, spec) {
    const she = this.she; if (!she || !she.alive || she.state === 'down') return;
    sound('clockChime') || sfx.clang();
    this.add(K().meter.lure, gm.center());
    she.lured(spec.t ?? 5);
  }

  // ---- every frame
  update(dt) {
    const g = this.g, she = this.she, R = K().run;
    if (this.grabbing) {
      const G = this.grabbing; G.t -= dt; G.tick -= dt;
      if (G.tick <= 0) { G.tick = 0.7; g.playerAttacked({ kind: 'ram', dmg: K().she.grabDmg, from: G.she, slot: G.slot }); }
      if (G.t <= 0) this.free(false);
    }
    if (she && she.alive) {
      if (she.state === 'lured') { she.timer -= dt; if (this.mode === 'run') this.dist += (this.speed + 0.6) * dt; if (she.timer <= 0) she.state = 'follow'; }
      if (this.mode === 'run') this.updateRun(dt);
      else if (this.mode === 'block') this.updateBlock(dt);
      else if (she.state === 'stalk') this.stalk(dt);
      // the HUD: how close she is (the portraits' colour, the original's) and her music
      const d = she.dist(), P = K().panic;
      this.panic += ((d < P.far ? Math.min(1, (P.far - d) / (P.far - P.near)) : 0) - this.panic) * Math.min(1, dt * 3);
    } else this.panic = Math.max(0, this.panic - dt);
    bed('heartbeat', this.panic > 0.75 || this.mode === 'hide', 0.4 + this.panic * 0.6);
    this.drawMeter(false);
  }
  updateRun(dt) {
    const g = this.g, w = g.world, she = this.she, R = K().run;
    if (g.lull) return;
    const down = she.busy() && she.state !== 'lunge';
    const k = this.grabbing ? 0 : 1;
    this.s = Math.min(this.len, this.s + this.speed * dt * k);
    if (!down && !this.grabbing && she.state !== 'windup') this.dist = Math.max(0.6, this.dist - (this.herSpeed * she.speedK - this.speed) * dt);
    else if (down && she.state !== 'lured') this.dist += this.speed * dt * k;
    // the camera on the path, looking back at her (or sideways, or down the shaft)
    this.curve.getPointAt(Math.min(1, this.s / this.len), w.camPos);
    const tg = this.curve.getTangentAt(Math.min(0.999, this.s / this.len)), f = V2.set(tg.x, 0, tg.z);
    if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
    const face = this.face;
    if (face === 'down') w.lookAt.set(w.camPos.x + f.x * 0.6, w.camPos.y - 8, w.camPos.z + f.z * 0.6);
    else if (face === 'fwd') w.lookAt.set(w.camPos.x + f.x * 12, w.camPos.y - 0.15, w.camPos.z + f.z * 12);
    else if (face === 'left' || face === 'right') { const sd = face === 'left' ? 1 : -1; w.lookAt.set(w.camPos.x - f.z * sd * 10 - f.x * 3, w.camPos.y - 0.1, w.camPos.z + f.x * sd * 10 - f.z * 3); }
    else w.lookAt.set(w.camPos.x - f.x * 12, w.camPos.y - 0.2, w.camPos.z - f.z * 12);
    w.bob = Math.abs(Math.sin(this.s * 2.1)) * 0.045 * k;
    const st = Math.floor(this.s * 1.6); if (st !== this.stepI) { this.stepI = st; g.onStep(st); }
    if (!she.busy() && she.state !== 'windup') { she.state = 'follow'; this.placeShe(); }
    else if (she.state === 'down' || she.state === 'stuck' || she.state === 'rising' || she.state === 'lured') { /* she stays where she fell */ }
    // close enough: the blades go up (the red ring) and she lunges
    if (she.state === 'follow' && this.dist <= R.reach && !this.grabbing) she.windup();
    if (this.s >= this.len - 0.01) {
      this.mode = null;
      const then = this.then; this.then = null;
      she.state = she.busy() ? she.state : 'follow';
      this.nextDist = Math.max(this.dist, 2.5);
      then && then();
    }
  }
  updateBlock(dt) {
    const she = this.she, B = this.S.block;
    if (this.facing === 'fwd' && !this.turning) {
      if (!she.busy() && she.state !== 'windup') { this.dist = Math.max(0.5, this.dist - this.herSpeed * dt); she.state = 'follow'; this.placeShe(); }
      if (this.dist <= this.turnAt && !she.busy()) this.turn('back');
    } else if (this.facing === 'back' && !this.turning) this.stalk(dt);
    void B;
  }
  // she walks straight at the camera and swings when close (a fighting stop she prowls, the view turned round to her)
  stalk(dt) {
    const she = this.she, g = this.g, c = g.world.camPos, P = she.root.position;
    if (she.busy() || she.state === 'windup') return;
    she.state = 'stalk';
    const dx = c.x - P.x, dz = c.z - P.z, d = Math.hypot(dx, dz) || 1, sp = K().she.walk * she.speedK;
    if (d > K().she.reach) { P.x += dx / d * sp * dt; P.z += dz / d * sp * dt; g.world.smashPropsNear?.(P, she.w * 0.35); }
    else she.windup();
    if (this.mode === 'block') this.dist = d;
  }
  // a fighting stop with her prowling in it (station she): she comes in from where the set says and stalks the girls
  prowl(S) {
    const H = S.she, she = this.ensure(H.form || 'a', H.at ? { x: H.at[0], z: H.at[1] } : null);
    she.state = 'scripted'; she.pose('stare');
    this.music(true);
    this.g.etw.wait(H.wake ?? 2.5, () => { if (she.alive && she.state === 'scripted') she.state = 'stalk'; });
    this.mode = 'prowl';
  }
  // the time earned: a little clock beside the stage name (drawn by the program), the twelve hours filling up
  drawMeter(force) {
    const g = this.g, show = g.ep?.id === 'ep2' && g.combat !== undefined && (this.mode || this.meter > 0);
    let el = this.ui;
    if (!el) { el = this.ui = document.createElement('canvas'); el.className = 'tmeter'; el.width = el.height = 128; document.getElementById('ui').appendChild(el); }
    el.classList.toggle('on', !!show);
    const k = this.meter / K().meter.max;
    if (!force && Math.abs(k - (this.drawnK ?? -1)) < 0.004) return;
    this.drawnK = k;
    const c = el.getContext('2d'), R = 56;
    c.clearRect(0, 0, 128, 128); c.save(); c.translate(64, 64);
    c.fillStyle = 'rgba(20,10,16,0.82)'; c.beginPath(); c.arc(0, 0, R + 4, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 12; i++) {   // the twelve hours of a wadokei, lit as the time is earned
      const a0 = -Math.PI / 2 + i * Math.PI / 6 + 0.03, a1 = a0 + Math.PI / 6 - 0.06, lit = k * 12 > i + 0.5;
      c.fillStyle = lit ? (i >= 8 ? '#ffd166' : '#ff7a59') : 'rgba(255,255,255,0.12)';
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, a0, a1); c.closePath(); c.fill();
    }
    c.fillStyle = '#1a0c12'; c.beginPath(); c.arc(0, 0, R * 0.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineCap = 'round'; const a = -Math.PI / 2 + k * Math.PI * 2;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85); c.stroke();
    c.restore();
  }
  dispose() { this.free(false); this.peek(false); bed('heartbeat', false); this.ui?.remove(); this.ui = null; }
}
