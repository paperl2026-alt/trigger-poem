// The prologue boss "???" (docs/DESIGN.md 序章 / Boss, bosses.json "qq", art R43 boss/qq_s<n>_<pose>): the formless thing that fell on the
// school, possessing the discipline-committee girl and mutating her like the G-virus, five stages from infection to the core.
// Not a giant made of parts: one whole drawing at a time (idle / move / wind-up / attack / hurt), middle-sized, whole on the screen, drifting
// back and forth across the yard and throwing things (DESIGN「Boss」). One move at a time, with breathers between (DESIGN「关卡编排要有起伏」).
// Each form fights its own way (DESIGN 序章 Boss 五个形态, user 2026-10-20) - its "pattern" in bosses.json picks from:
//   approach  (1) it walks up on them, faster the more it is hit; at the covers it pounds them: they shake as if they would give, and hold
//   throw     (2) it throws things one after another; only in the moment of each throw is its weak point open (S.guarded)
//   zigzag    (3) it rushes at one girl in a fast zigzag: enough damage on the way knocks it back home, else it hits her, cover or not
//   heal      (4) healers called up out of her (nurse's-office IV drips): they float beside her and feed her through their tubes - kill
//             them while fighting her, or she heals back to where this form began and returns to the one before (regress)
//   charge    (5) a long gathering, its weak point jumping from place to place (S.cores) - break it with enough damage or everyone is hit hard
//   volley / lunge / burst / drift   the older moves (things spat at them, a lunge at a cover, a blast to hide from, a drift aside)
//   weave     (drift, when its data has weave: user 2026-10-20 "a snaking Z back and forth AT the girls, and in range it hits them - not a
//             target sliding to and fro") slanting legs at one girl, a stamp at each turn, nearer each time; in range (or its head off the
//             top of the picture) it rears up - a red mark, hide - and strikes; then backs off in two slanting steps to where it fights from
// Only its core takes damage (a ring marks it), and nothing gets through while it attacks (DESIGN「Boss」, 2026-10-18).
// Hits change its colour, never hole it (paper.js solid damage). Between stages it convulses, splashes ooze and the next mutation grows out
// (no comic: the fight keeps its rhythm).
import * as THREE from 'three';
import { tex, meta } from '../core/assets.js';
import { paperMesh, DamageMap, attachDamage, setRelief } from '../core/paper.js';
import { Ease } from '../core/tween.js';
import { sfx } from '../core/audio.js';
import { tr } from '../core/i18n.js';
import { Actor, Enemy } from './enemies.js';
import { Gimmick } from './gimmick.js';
import { COL } from './fx.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const rr = (r) => (Array.isArray(r) ? rnd(r[0], r[1]) : r);
const FRAMES = { idle: ['idle0', 'idle1'], move: ['move', 'idle0'], windup: ['windup'], attack: ['attack'], hurt: ['hurt'] };

export class TheThing extends Actor {
  constructor(game, def) {
    const S0 = def.stages[0];
    super(game, `${def.sprite || 'boss/qq'}_s1_idle0`, S0.h, S0.float ? 'center' : 'bottom');
    this.def = def; this.type = 'boss'; this.name = def.name;
    this.hp = this.maxHp = def.hp;
    this.frames = FRAMES; this.bp = { throwFrom: [0.5, 0.55] };
    this.stage = 0; this.seq = 0; this.pi = 0; this.timer = def.firstDelay; this.busy = true;
    this.state = 'idle'; this.timer0 = 1; this.poise = 0; this.poiseCD = 0; this.lock = null; this.armor = false;
    const w = game.world;
    this.cam = w.camPos.clone();
    this.zone = def.zone;   // where it moves: x range, z range (metres in the yard)
    this.root.position.set(0, 0, this.zone.z[1]);
    w.scene.add(this.root);
    this.shadowM = w.makeShadow(1); w.scene.add(this.shadowM);
    this.setStage(0);
    // it rises out of the ground
    const P = this.root.position, y0 = P.y;
    P.y = y0 - this.h * 0.9; this.inner.scale.set(0.6, 0.6, 1);
    game.etw.to(P, { y: y0 }, 1.6, { ease: Ease.outBack });
    game.etw.to(this.inner.scale, { x: 1, y: 1 }, 1.6, { ease: Ease.outBack, onDone: () => { this.busy = false; } });
    sfx.roar(); game.post.shake(1);
  }
  get S() { return this.def.stages[this.stage]; }
  phases() { return this.def.stages.length; }

  // ---------------------------------------------------------------- a stage's drawing set: a new mesh (its own size and shape)
  setStage(n) {
    this.stage = n; this.stageDmg = 0; this.coreI = 0; this.exposedT = 0; this.zz = null; this.chg = null;
    const S = this.S, key = `${this.def.sprite || 'boss/qq'}_s${n + 1}_idle0`, t = tex[key];
    if (!t) { console.warn('boss: no frames for stage', n + 1); return; }
    const figH = meta[key]?.figH || 1, pivot = S.float ? 'center' : 'bottom';
    this.pivot = pivot; this.ar = t.image.width / t.image.height; this.h = S.h / figH; this.w = this.h * this.ar;
    const old = this.mesh;
    this.inner.remove(old); old.geometry.dispose(); old.material.dispose(); this.dm.dispose();
    this.relief = !!meta[key]?.relief;
    this.mesh = paperMesh(t, this.w, { pivot, segs: this.relief ? [64, Math.max(8, Math.round(64 / this.ar))] : null });
    if (this.relief) setRelief(this.mesh, tex[meta[key].relief], Math.min(this.w, this.h) * 0.12);
    this.mesh.userData.owner = this; this.mesh.userData.texKey = key;
    this.dm = new DamageMap(1 / this.ar, 512); attachDamage(this.mesh, this.dm, true);
    this.u = this.mesh.material.uniforms;
    this.u.outlineOn.value = 1; this.u.mapTexel.value.set(1 / t.image.width, 1 / t.image.height);
    this.inner.add(this.mesh);
    this.prefix = `${this.def.sprite || 'boss/qq'}_s${n + 1}_`; this.anim = null; this.play('idle', 3);
    this.root.position.y = S.float ? S.y : 0;
    this.shadowM.scale.setScalar(this.w * 0.6);
  }

  // ---------------------------------------------------------------- her child's things (bosses.json "ritual"; docs/DESIGN.md 第 1 话 10;
  // in Sweet Home the lady is laid to rest by showing her the photo, then the diary, then her child's coffin). In her last form the three
  // come out and swing back and forth before her, each on its own beat, and now and then one of them swings in front of her core and
  // takes the shots meant for her. Nothing hurts them. Each counts down, at an uneven pace, to a blow of its own at one of the girls (the
  // red "shoot it" ring: hiding does not help); a shot knocks it back and starts its count again, and she cries out (they are her child's).
  // Her core is open in the gaps between them. When her strength is gone she sinks down and the three hang still in a row: shown to her
  // in the right order (her words tell which) each one flies into her arms; with the last her child comes back to her and she is at rest.
  // A wrong one floats back.
  ritual() {
    const g = this.game, R = this.def.ritual, P = this.root.position;
    this.ritualNext = 0; this.stuck = 0; this.talkT = 0;
    this.keeps = R.items.map((k, i) => {
      const gm = new Keepsake(g, this, i, { id: `ritual${i}`, k, on: 'air', x: P.x, y: this.S.h * 0.5, z: P.z, w: R.w ?? 1.3, station: g.stationId });
      gm.inner.scale.setScalar(0.01); g.tweens.to(gm.inner.scale, { x: 1, y: 1, z: 1 }, 0.6, { delay: i * 0.35, ease: Ease.outBack });
      g.actors.push(gm); return gm;
    });
    this.guardT = rr(R.guard.every);
    sfx.clear(); g.post.flash(0.3, 0xfff0c8);
    this.closeUp('keep', { lull: true, dist: this.S.h * 1.6, v: 0.5, min: 3.4 });   // (the three come out up close)
  }
  // one of them is shot: nothing happens to it but a knock (its count starts again) and her cry; once she is down, it is shown to her
  keepHit(k, info) {
    const g = this.game, R = this.def.ritual;
    info.dealt = 0; k.flash = 1;
    const p = k.uvToWorld(info.uv.u, info.uv.v);
    g.fx.star(p, 0.6, COL.white); g.fx.confetti(p, 3, 0.9, [COL.white, COL.bone]);
    if ((this.tickT || 0) <= 0) { sfx.clang(); this.tickT = 0.18; }
    if (this.grief) { this.offer(k.i, k); return; }
    k.knock();
    if (this.talkT <= 0) { this.talkT = R.talkGap ?? 7; this.say(R.lines[k.i]); }
  }
  // her strength is gone (only once her child's things are out): she sinks down, and they hang still in a row before her
  grieve() {
    const g = this.game, P = this.root.position;
    this.grief = true; this.seq++; this.endWindup(); this.markCore(false); this.armor = false; this.hp = 0;
    g.clearProjectiles();
    for (const a of g.actors) if (a instanceof Enemy && a.alive) a.die('mantra', { uv: { u: 0.5, v: 0.5 } });   // (what she called up goes with her)
    this.state = 'hurt'; this.play('hurt'); this.flash = 1;
    sfx.roar(); g.post.flash(0.5, 0xffffff); g.post.shake(1);
    g.etw.kill(P); g.tweens.to(P, { y: -this.S.h * 0.15 }, 1.4, { ease: Ease.outQuad });
    for (const k of this.keeps) k.still();
    this.stuck = 0;
    this.closeUp('kneel', { lull: true, dist: this.S.h * 0.9, v: 0.45, min: 3.5 }, () => { this.stuck = 0; });   // (on her knees, up close)
  }
  offer(i, gm) {
    const g = this.game, R = this.def.ritual;
    if (!this.alive || gm.mode !== 'still') return;
    if (i !== this.ritualNext) {   // not that one yet: it shakes and floats back
      sfx.miss(); if (this.talkT <= 0) { this.talkT = 3; this.say('wrong'); }
      g.tweens.run(0.4, (e) => { gm.inner.position.x = Math.sin(e * 40) * 0.08 * (1 - e); });
      return;
    }
    const n = ++this.ritualNext; this.stuck = 0;
    gm.mode = 'offered'; gm.u.outlineOn.value = 0;
    const P = gm.root.position, to = this.uvToWorld(0.5, 0.55);   // (into her arms)
    g.tweens.to(P, { x: to.x, y: to.y, z: to.z + 0.3 }, 0.9, { ease: Ease.inOutQuad, onDone: () => {
      gm.act({ gone: true });
      if (!this.alive) return;
      this.flash = 1; g.post.flash(0.4, 0xfff0c8); sfx.clear();
      g.fx.confetti(to, 24, 2.4, [COL.pink, COL.white]);
      if (n < R.items.length) { this.talkT = 0; this.say(`offer${n}`); return; }
      this.rest();
    } });
  }
  // the last one: a small light rises from where the coffin went into her arms - her child back with her - and she is at rest
  rest() {
    const g = this.game, to = this.uvToWorld(0.5, 0.6), from = to.clone().setY(0.3), q = new THREE.Vector3();
    this.seq++;
    this.closeUp('rest', { lull: true, dist: this.S.h * 0.8, v: 0.55, in: 1.0, out: 0.9, min: 6 });   // (her child back in her arms, up close)
    let k = 0;
    g.tweens.run(2.6, (e) => {
      if (e * 30 < k) return; k++;
      q.lerpVectors(from, to, e); q.x += Math.sin(e * 9) * 0.25;
      g.fx.star(q, 0.9, COL.white); if (k % 3 === 0) g.fx.confetti(q, 3, 0.5, [COL.white, COL.pink]);
    }, { onDone: () => { if (this.alive) this.die(true); } });
  }
  // her line (text/stickers.json bosses.<id>.<kind>, her voice): returns how long it is said
  say(kind) { const n = this.game.hud.gl.stickers.boss?.(this, kind) || 0; this.talkT = Math.max(this.talkT || 0, n + 1); return n; }
  // a close look at her (Game.cine) while she says a line: held as long as the line (at least min seconds); then()
  closeUp(kind, o, then) {
    let n = 0;
    this.game.cine({ on: this, v: 0.62, dist: this.S.h * 1.15, up: 0.15, in: 0.8, out: 0.7, ...o, during: () => { o.during?.(); n = kind ? this.say(kind) : 0; },
      hold: () => Math.max(o.min ?? 2.6, n + 0.3) }, then);
  }
  // her entrance (Game.arrive, after the warning): the camera goes up close and she says her first words
  // (from low down looking up at her, the camera going half way round her as the room stretches out behind her: the references' boss
  // entrances, docs/ART.md「用户给的参考里的手法」)
  intro(then) { this.game.cues.run(this.def.cues?.intro); this.closeUp('intro', { lull: true, dist: this.S.h * 0.85, v: 0.7, up: -this.S.h * 0.22, orbit: 0.85, dolly: 16, title: tr(this.name || '') || null }, then); }

  // ---------------------------------------------------------------- hits
  // DESIGN「Boss」(2026-10-18): only its core takes damage (each form's "core": [u, v] on its drawing, radius r of its height; a ring
  // marks it); everything else glances off. While it attacks nothing gets through; its wind-up is the opening (and hits on the core
  // there can break a lunge off)
  hitMeshes() { return this.alive && !this.grief ? [this.mesh] : []; }   // (down and grieving: not a target any more, only her child's things)
  // (S.guarded: open only for moments - exposedT; S.open: open only in these states, e.g. while it rushes and when knocked back)
  weakNow() { return !this.mutating && !this.grief && this.state !== 'attack' && (!this.S.guarded || this.exposedT > 0) && (!this.S.open || this.S.open.includes(this.state)); }
  core() { const C = this.S.cores; return C ? C[(this.coreI || 0) % C.length] : this.S.core; }
  onCore(uv) {
    const c = this.core(); if (!c) return true;
    return Math.hypot((uv.u - c[0]) * this.w / this.h, uv.v - c[1]) < (c[2] ?? 0.11);
  }
  glance(info) {   // a shot that does nothing: sparks and a tick
    info.dealt = 0;
    const p = this.uvToWorld(info.uv.u, info.uv.v), fx = this.game.fx;
    fx.star(p, 0.5, COL.white); fx.confetti(p, 2, 0.8, [COL.white, COL.bone]);
    if ((this.tickT || 0) <= 0) { sfx.clang(); this.tickT = 0.18; }
  }
  hit(info) {
    if (!this.alive || this.mutating) return;
    if (this.grief) { this.glance(info); return; }
    const D = this.def;
    if (!this.weakNow() || !this.onCore(info.uv)) { this.glance(info); return; }
    const dmg = info.dmg * (D.coreMul ?? 1) * (this.S.guarded ? D.throw?.exposedMul ?? 2 : 1);   // (a form open only for moments: those moments hurt it more)
    info.dealt = dmg; this.lastHitBy = info.by;
    this.paint(info);
    this.flash = Math.max(this.flash, 0.7);
    const p = this.uvToWorld(info.uv.u, info.uv.v), fx = this.game.fx;
    fx.ink(p, 8, 2.6, COL.hot); fx.star(p, 2.5, COL.pink);
    // a lunge being gathered breaks off when its core is hit enough
    if (this.state === 'windup' && this.move === 'lunge' && info.stagger) { this.poise += info.stagger; if (this.poise >= D.lunge.poise) this.interrupt(); }
    this.hp -= dmg; this.stageDmg = (this.stageDmg || 0) + dmg;
    // (a zigzag rush knocked back by enough damage on the way; a charge broken by enough damage before it is full)
    if (this.zz) { this.zz.dmg += dmg; if (this.zz.dmg >= D.zigzag.poise) this.repel(); }
    if (this.chg && this.state === 'windup') { this.chg.dmg += dmg; if (this.chg.dmg >= D.charge.poise) { this.chg = null; this.interrupt(); } }
    if (D.ritual && !this.keeps) this.hp = Math.max(this.hp, 1);   // (her child's things come out before her end)
    this.game.onHit(this, info.kind, info);
    if (this.hp <= 0) { if (this.keeps) this.grieve(); else this.die(); return; }
    // the next mutation
    const next = this.def.stages.findIndex((s, i) => i > this.stage && this.hp <= this.maxHp * s.at);
    if (next > this.stage && !this.mutating) this.mutate(next);
  }
  // the place came down on her (a chandelier, a blast: Game.harm): the whole of it hurts, and she reels for stun seconds
  crushed(dmg, stun) {
    if (!this.alive || this.mutating || this.grief) return;
    const g = this.game; this.hp -= dmg; this.stageDmg = (this.stageDmg || 0) + dmg; this.flash = 1;
    g.fx.stamp('don', g.W * 0.5, g.H * 0.6, 0.32, 0); g.post.shake(1.4); g.G.stop(0.12); sfx.roar();
    this.game.onHit(this, 'crush', { dmg, dealt: dmg });
    if (this.def.ritual && !this.keeps) this.hp = Math.max(this.hp, 1);   // (her child's things come out before her end)
    if (this.hp <= 0) { if (this.keeps) this.grieve(); else this.die(); return; }
    if (stun) { this.seq++; this.endWindup(); this.zz = null; this.chg = null; this.state = 'hurt'; this.play('hurt'); this.later(stun, () => { this.state = 'idle'; this.play('idle', 3); }); this.timer = stun + 0.6; }
    const next = this.def.stages.findIndex((s, i) => i > this.stage && this.hp <= this.maxHp * s.at);
    if (next > this.stage && !this.mutating) this.mutate(next);
  }
  interrupt() {
    const g = this.game;
    this.seq++; this.endWindup(); this.poise = 0;
    this.state = 'hurt'; this.play('hurt'); this.flash = 1;
    g.fx.stamp('don', g.W * 0.5, g.H * 0.68, 0.26, 0); g.post.shake(0.9); sfx.roar(); g.G.stop(0.1);
    g.hud.gl.stickers.say(g.players.find((p) => p.state === 'out') || g.players[0], 'stagger');
    this.later(this.def.stunTime, () => { this.state = 'idle'; this.play('idle', 3); });
    this.timer = this.def.stunTime + 0.8;
  }
  endWindup() { if (this.lock) { this.lock.remove(); this.lock = null; } }
  // where the AI partner aims (src/core/input.js): the core, on screen (y down like screenBox)
  aimAt() { const c = this.core(); if (!c || !this.weakNow()) return null; const g = this.game, sc = g.world.project(this.uvToWorld(c[0], c[1])); return { x: sc.x, y: sc.y }; }
  // the ring round the core (the small kill ring: shoot inside it), gone while it attacks or changes
  markCore(on, t) {
    const g = this.game;
    if (!on) { if (this.coreMark) { this.coreMark.remove(); this.coreMark = null; } return; }
    if (!this.coreMark) this.coreMark = g.fx.orbit('shot', -1);
    const c = this.core(), wc = this.uvToWorld(c[0], c[1]), sc = g.world.project(wc), top = g.world.project(this.uvToWorld(c[0], c[1] + (c[2] ?? 0.11)));
    this.coreMark.set(sc.x, g.H - sc.y, Math.max(18, Math.abs(top.y - sc.y)), 0.2, t, 9, null, null);
  }
  later(s, fn) { const q = this.seq; this.game.etw.wait(s, () => { if (this.alive && q === this.seq) fn(); }); }

  // ---------------------------------------------------------------- frame
  update(dt, t) {
    if (!this.alive) { this.baseUpdate(dt, t); return; }
    this.baseUpdate(dt, t);
    const g = this.game, P = this.root.position;
    this.root.rotation.y = Math.atan2(g.world.camPos.x - P.x, g.world.camPos.z - P.z);
    if (this.S.float) P.y = this.S.y + Math.sin(t * 1.3) * 0.18;
    this.shadowM.position.set(P.x, 0.03, P.z);
    // attacking: the outline goes hard white (nothing gets through); otherwise its usual white, and the core is ringed
    const wk = this.weakNow();
    this.u.outlineCol.value.setRGB(1, 1, 1);
    this.tickT = (this.tickT || 0) - dt;
    this.markCore(wk && this.core() && !g.cineOn, t);
    this.exposedT = Math.max(0, (this.exposedT || 0) - dt);
    const H = this.def.heal, on = (this.healers || []).filter((e) => e.alive && e.attached).length;
    if (H && on && !this.mutating && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + on * H.rate * dt); this.healGlow = 1;
      if (this.stage === H.stage && this.hp >= this.maxHp * this.S.at) this.regress();
    }
    this.healGlow = Math.max(0, (this.healGlow || 0) - dt * 2);
    if (this.healGlow > 0) this.u.outlineCol.value.setRGB(1 - 0.45 * this.healGlow, 1, 1 - 0.3 * this.healGlow);
    if (this.keeps) this.keepTick(dt);
    // breathing
    this.inner.scale.y += ((1 + Math.sin(t * 2.1) * 0.025) - this.inner.scale.y) * Math.min(1, dt * 6);
    if (this.lock) {
      const wc = this.center(), c = g.world.project(wc), b = g.box(this);
      this.lock.set(c.x, g.H - c.y, Math.max(40, (b.y1 - b.y0) * 0.5), Math.min(1, 1 - this.timer / this.timer0), t, this.timer, b, wc);
      this.timer -= dt;
      return;
    }
    if (this.busy || this.mutating || this.grief || this.state === 'hurt' || g.cineOn) return;
    if (this.state === 'approach') { this.walkOn(dt); return; }
    // how this form is fought, once, as it starts (bosses.json texts.h<n>)
    if (!(this.told ||= {})[this.stage] && this.def.texts?.[`h${this.stage + 1}`]) { this.told[this.stage] = true; g.hud.gl.hold('hint', { text: tr(this.def.texts[`h${this.stage + 1}`]), dur: 4.5 }); }
    this.timer -= dt;
    if (this.timer > 0) return;
    const P2 = this.S.pattern, mv = P2[this.pi++ % P2.length];
    this.move = mv; this[mv]();
  }

  // her child's things: now and then one of them goes in front of her core for a while
  keepTick(dt) {
    const R = this.def.ritual;
    this.talkT -= dt;
    if (this.grief) {   // stuck on which to show her: she says it again
      this.stuck += dt;
      if (this.stuck > (R.hint ?? 9) && this.talkT <= 0) { this.stuck = 0; this.talkT = 4; this.say(this.ritualNext ? `offer${this.ritualNext}` : 'kneel'); }
      return;
    }
    if (this.mutating || !this.game.combat) return;
    this.guardT -= dt;
    if (this.guardT > 0) return;
    const on = this.keeps.find((k) => k.mode === 'guard'), free = this.keeps.filter((k) => k.mode === 'swing');
    if (on) { on.mode = 'swing'; this.guardT = rr(R.guard.every); }
    else if (free.length) { free[Math.floor(Math.random() * free.length)].mode = 'guard'; this.guardT = rr(R.guard.time); }
    else this.guardT = 0.5;
  }

  // ---------------------------------------------------------------- moves
  drift() {
    if (this.def.weave) { this.weave(); return; }
    const g = this.game, Z = this.zone, P = this.root.position;
    let x = rnd(Z.x[0], Z.x[1]); if (Math.abs(x - P.x) < 1.5) x = P.x > 0 ? Z.x[0] * 0.7 : Z.x[1] * 0.7;
    const z = rnd(Z.z[0], Z.z[1]), d = Math.hypot(x - P.x, z - P.z), time = Math.max(1.2, d / this.def.speed);
    this.state = 'move'; this.play('move', 4);
    g.etw.to(P, { x, z }, time, { ease: Ease.inOutQuad, onDone: () => { if (this.alive && this.state === 'move') { this.state = 'idle'; this.play('idle', 3); } } });
    this.timer = time + rr(this.def.rest);
  }
  weave() {
    const g = this.game, D = this.def.weave, Z = this.zone, P = this.root.position, c = g.world.camPos, slot = g.pickTarget(P.x - c.x), cov = g.world.covers?.[slot];
    const from = P.clone(), gx = cov ? cov.def.x : c.x + (slot ? 1 : -1), gz = cov ? cov.def.z : c.z - 2;
    const dx = gx - from.x, dz = gz - from.z, dd = Math.hypot(dx, dz) || 1, reach = Math.max(0, dd - D.near);
    const to = new THREE.Vector3(from.x + dx / dd * reach, from.y, from.z + dz / dd * reach), side = Math.random() < 0.5 ? -1 : 1;
    this.state = 'move'; this.play('move', 6);
    const leg = (i) => {
      if (!this.alive || this.state !== 'move') return;
      const top = g.world.project(this.uvToWorld(this.core()[0], Math.min(1, this.core()[1] + 0.12)));
      if (i > D.legs || top.y < g.H * (D.topY ?? 0.06)) { this.weaveStrike(slot); return; }
      const q = from.clone().lerp(to, i / D.legs);
      if (i < D.legs) q.x = Math.max(Z.x[0] - 1.5, Math.min(Z.x[1] + 1.5, q.x + side * (i % 2 ? 1 : -1) * D.lateral));
      g.etw.to(P, { x: q.x, z: q.z }, D.leg, { ease: Ease.inOutQuad, onDone: () => {
        if (!this.alive || this.state !== 'move') return;
        g.post.shake(0.35); sfx.thud(0); g.fx.puff(P, 6, COL.bone, 1.6);   // (a stamp at each turn)
        this.later(D.pause, () => leg(i + 1));
      } });
    };
    leg(1);
    this.timer = D.legs * (D.leg + D.pause) + D.windup + 0.6 + D.back + rr(this.def.rest);
  }
  weaveStrike(slot) {
    const g = this.game, D = this.def.weave, P = this.root.position;
    this.state = 'idle';
    this.windup(D.windup, 'hide', slot, () => {
      this.attackPose(0.5); sfx.slam(); g.post.shake(1.2); g.G.stop(0.06);
      g.playerAttacked({ kind: 'ranged', dmg: D.dmg, from: this, slot, rattle: true });
      this.later(0.55, () => {   // (back off: two slanting steps, the other way)
        const Z = this.zone, bx = rnd(Z.x[0], Z.x[1]), bz = rnd(Z.z[0], Z.z[1]);
        const mx = (P.x + bx) / 2 + (P.x > bx ? 1 : -1) * D.lateral * 0.6, mz = (P.z + bz) / 2;
        this.state = 'move'; this.play('move', 4);
        g.etw.to(P, { x: mx, z: mz }, D.back * 0.5, { ease: Ease.inOutQuad, onDone: () => {
          if (!this.alive || this.state !== 'move') return;
          g.etw.to(P, { x: bx, z: bz }, D.back * 0.5, { ease: Ease.inOutQuad, onDone: () => { if (this.alive && this.state === 'move') { this.state = 'idle'; this.play('idle', 3); } } });
        } });
      });
    });
  }
  windup(time, threat, slot, then) {
    const g = this.game;
    this.state = 'windup'; this.timer = this.timer0 = time; this.poise = 0;
    this.play('windup');
    this.lock = g.fx.lock(threat, slot);
    g.fx.charge(this, threat === 'hide' ? 0xff4fc8 : 0xffb04a);
    sfx.warn();
    this.later(time, () => { this.endWindup(); then(); });
  }
  attackPose(dur) {
    this.state = 'attack'; this.play('attack');
    this.later(dur, () => { if (this.state === 'attack') { this.state = 'idle'; this.play('idle', 3); } });
  }
  volley() {
    const g = this.game, D = this.def.volley, n = Math.round(rr(this.S.shots || D.shots)), kinds = this.S.projectiles || D.projectiles;   // (a form's own things to throw)
    this.attackPose(0.4 + n * D.gap);
    for (let i = 0; i < n; i++) this.later(0.3 + i * D.gap, () => {
      const from = this.uvToWorld(rnd(0.35, 0.65), rnd(0.45, 0.7));
      g.spawnProjectile(kinds[(i + this.stage) % kinds.length], from, { slot: g.pickTarget(from.x - g.world.camPos.x), time: D.flight, curve: rnd(-2, 2), dmg: D.dmg });
      sfx.throwIt(0);
    });
    this.timer = 0.6 + n * D.gap + rr(this.def.rest);
  }
  lunge() {
    const g = this.game, D = this.def.lunge, slot = g.pickTarget(this.root.position.x - g.world.camPos.x);
    this.windup(D.windup, 'kill', slot, () => {
      // it throws itself at that girl's cover and comes back
      const P = this.root.position, home = P.clone(), cov = g.world.covers[slot], c = g.world.camPos;
      const to = new THREE.Vector3(cov ? cov.def.x : c.x + (slot ? 1 : -1), P.y, cov ? cov.def.z - 1.2 : c.z - 3);
      this.attackPose(D.time + 0.4);
      g.etw.to(P, { x: to.x, z: to.z }, D.time, { ease: Ease.inQuad, onDone: () => {
        if (!this.alive) return;
        sfx.slam(); g.post.shake(1.3); g.fx.confetti(to, 20, 2.2, [COL.hot, COL.bone]);
        if (cov && cov.hp !== undefined) { cov.hp -= D.coverDmg; if (cov.hp <= 0 && g.world.breakCover) g.world.breakCover(cov); }
        g.playerAttacked({ kind: 'ram', dmg: D.dmg, from: this, slot });
        g.etw.to(P, { x: home.x, z: home.z }, 0.9, { delay: 0.3, ease: Ease.inOutQuad });
      } });
    });
    this.timer = D.windup + D.time + 1.4 + rr(this.def.rest);
  }
  burst() {
    const g = this.game, D = this.def.burst;
    this.armor = true;
    this.windup(D.windup, 'hide', -1, () => {
      this.armor = false; this.attackPose(0.8);
      sfx.slam(); sfx.madness(); g.post.flash(0.6, 0xff3aa0); g.post.shake(1.6);
      const p = this.center(); g.fx.confetti(p, 50, 6, [COL.pink, COL.hot, COL.white]); g.fx.star(p, 8, COL.pink);
      g.fx.stamp('gogogo', g.W * 0.5, g.H * 0.6, 0.3, 0);
      g.playerAttacked({ kind: 'ranged', dmg: D.dmg, from: this, heavy: true, slot: -1 });
    });
    this.timer = D.windup + 1.2 + rr(this.def.rest);
  }
  // (1) it walks up on them, faster the more it has been hit in this form; it stops where its weak point would leave the top of the
  // picture or at the covers, and pounds them
  approach() {
    this.state = 'approach'; this.play('move', 4); this.home = this.root.position.clone();
  }
  walkOn(dt) {
    const g = this.game, D = this.def.approach, P = this.root.position, c = g.world.camPos;
    const stageHp = this.maxHp * (this.S.at - (this.def.stages[this.stage + 1]?.at ?? 0));
    const v = D.speed * (1 + D.speedUp * Math.min(1, (this.stageDmg || 0) / Math.max(1, stageHp)));
    const dx = c.x - P.x, dz = c.z - P.z, d = Math.hypot(dx, dz);
    const top = g.world.project(this.uvToWorld(this.core()[0], Math.min(1, this.core()[1] + 0.12)));
    if (d <= D.near || top.y < g.H * D.topY) { this.pound(); return; }
    P.x += (dx / d) * v * dt * 0.35 + Math.sin(performance.now() / 600) * 0.004; P.z += (dz / d) * v * dt;
  }
  pound() {
    const g = this.game, D = this.def.approach, home = this.home || this.root.position.clone();
    this.state = 'idle';
    this.windup(D.windup, 'hide', -1, () => {
      for (let i = 0; i < D.slams; i++) this.later(i * D.gap, () => {
        this.attackPose(D.gap); sfx.slam(); g.post.shake(1.5); g.G.stop(0.05);
        for (const cv of g.world.covers || []) if (cv) g.fx.confetti(cv.m.position.clone().setY(cv.h * 0.8), 10, 1.6, [COL.bone, COL.paper]);
        g.playerAttacked({ kind: 'ranged', dmg: D.dmg, from: this, slot: -1, rattle: true });   // (hidden: the cover shakes as if it would give, and holds)
      });
      this.later(D.slams * D.gap + 0.3, () => {
        this.state = 'move'; this.play('move', 4);
        g.etw.to(this.root.position, { x: home.x, z: home.z }, D.back, { ease: Ease.inOutQuad, onDone: () => { if (this.alive && this.state === 'move') { this.state = 'idle'; this.play('idle', 3); } } });
      });
    });
    this.timer = D.windup + D.slams * D.gap + D.back + 0.6 + rr(this.def.rest);
  }
  // (2) things thrown one after another; its weak point opens only for a moment at each throw
  throw() {
    const g = this.game, D = this.def.throw, n = Math.round(rr(D.shots)), kinds = this.def.volley.projectiles;
    this.state = 'throwing'; this.play('windup');
    for (let i = 0; i < n; i++) this.later(0.5 + i * D.gap, () => {
      this.play('attack'); this.exposedT = D.expose; this.flash = Math.max(this.flash, 0.4);
      const c = this.core(); g.fx.glint(this.uvToWorld(c[0], c[1]), 0xffffff, 1.4); sfx.tink?.(0);
      const from = this.uvToWorld(rnd(0.35, 0.65), rnd(0.45, 0.7));
      g.spawnProjectile(kinds[(i + this.stage) % kinds.length], from, { slot: g.pickTarget(from.x - g.world.camPos.x), time: D.flight, curve: rnd(-2, 2), dmg: D.dmg });
      sfx.throwIt(0);
      this.later(D.expose, () => { if (this.state === 'throwing') this.play('windup'); });
    });
    this.later(0.6 + n * D.gap, () => { if (this.state === 'throwing') { this.state = 'idle'; this.play('hurt'); this.exposedT = D.after ?? 1.5; this.later(D.after ?? 1.5, () => { if (this.state === 'idle') this.play('idle', 3); }); } });   // (spent: open a little longer)
    this.timer = 0.8 + n * D.gap + (D.after ?? 1.5) + rr(this.def.rest);
  }
  // (3) a fast zigzag rush at one girl: enough damage on the way knocks it back home; else it hits her, cover or not, and goes back
  zigzag() {
    const g = this.game, D = this.def.zigzag, slot = g.pickTarget(this.root.position.x - g.world.camPos.x), Z = this.zz = { dmg: 0, home: this.root.position.clone() };   // (damage counts from the wind-up on)
    this.windup(D.windup, 'kill', slot, () => {
      if (this.zz !== Z) return;
      const P = this.root.position, home = Z.home, cov = g.world.covers[slot], c = g.world.camPos;
      const to = new THREE.Vector3(cov ? cov.def.x : c.x + (slot ? 1 : -1), P.y, cov ? cov.def.z - D.stop : c.z - 4);
      const pts = [home];
      for (let i = 1; i < D.legs; i++) { const q = home.clone().lerp(to, i / D.legs); q.x += (i % 2 ? 1 : -1) * D.lateral; pts.push(q); }
      pts.push(to);
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      this.state = 'dash'; this.play('move', 9); sfx.roar();
      this.lock = g.fx.lock('kill', slot); this.timer = this.timer0 = D.time + 2.4 + rr(this.def.rest);   // (the red mark rides with it; the next move after it is back)
      g.etw.run(D.time, (e) => { if (this.zz === Z) curve.getPointAt(e, P); }, { onDone: () => {
        if (this.zz !== Z || !this.alive) return;
        this.zz = null; this.endWindup(); this.attackPose(0.6);
        sfx.slam(); g.post.shake(1.4); g.fx.confetti(to, 20, 2.2, [COL.hot, COL.bone]);
        g.playerAttacked({ kind: 'ram', dmg: D.dmg, from: this, slot, heavy: true });
        this.later(0.6, () => { this.state = 'back'; this.play('move', 4); g.etw.to(P, { x: home.x, z: home.z }, 1.0, { ease: Ease.inOutQuad, onDone: () => { if (this.alive && this.state === 'back') { this.state = 'idle'; this.play('idle', 3); } } }); });   // ('back': open on the way home)
      } });
    });
    this.timer = D.windup + 1;
  }
  repel() {   // (knocked back home in the middle of its rush)
    const g = this.game, Z = this.zz; this.zz = null; this.seq++; this.endWindup();
    this.state = 'hurt'; this.play('hurt'); this.flash = 1;
    g.fx.stamp('don', g.W * 0.5, g.H * 0.68, 0.26, 0); g.post.shake(1.1); sfx.roar(); g.G.stop(0.12);
    g.hud.gl.stickers.say(g.players.find((p) => p.state === 'out') || g.players[0], 'stagger');
    g.etw.to(this.root.position, { x: Z.home.x, z: Z.home.z }, 0.55, { ease: Ease.outQuad });
    this.later(this.def.stunTime, () => { this.state = 'idle'; this.play('idle', 3); });
    this.timer = this.def.stunTime + 0.8;
  }
  // (5) a long gathering, its weak point jumping from place to place; enough damage before it is full breaks it off, else a heavy blow
  // over everyone, cover or not
  charge() {
    const g = this.game, D = this.def.charge, n = this.S.cores?.length || 1;
    this.chg = { dmg: 0 };
    for (let i = 1; i <= D.shifts; i++) this.later((D.time * i) / (D.shifts + 1), () => {
      if (!this.chg) return;
      this.coreI = ((this.coreI || 0) + 1 + Math.floor(Math.random() * Math.max(1, n - 1))) % n;
      const c = this.core(); g.fx.glint(this.uvToWorld(c[0], c[1]), 0xff3a5a, 1.6); sfx.tink?.(0);
    });
    this.windup(D.time, 'kill', -1, () => {
      if (!this.chg) return;
      this.chg = null; this.attackPose(0.9);
      sfx.slam(); sfx.madness(); g.post.flash(0.7, 0xff3a5a); g.post.shake(1.8);
      const p = this.center(); g.fx.confetti(p, 50, 6, [COL.hot, COL.pink, COL.white]); g.fx.star(p, 8, COL.hot);
      g.playerAttacked({ kind: 'ram', dmg: D.dmg, from: this, heavy: true, slot: -1 });
    });
    this.timer = D.time + 1.6 + rr(this.def.rest);
  }
  // (4) healers out of her body, one each side and above: kill them, or they feed her back (def.heal: rate per healer, max, type)
  heal() {
    const g = this.game, H = this.def.heal;
    this.healers = (this.healers || []).filter((e) => e.alive);
    const n = Math.min(H.n, H.max - this.healers.length);
    if (n <= 0) { this.volley(); return; }
    this.attackPose(0.8); sfx.roar(); this.flash = 0.6;
    for (let i = 0; i < n; i++) this.later(0.3 + i * 0.5, () => {
      const c = this.center(), side = (this.healN = (this.healN || 0) + 1) % 2 ? -1 : 1;   // (left, right, left...)
      const e = g.spawnEnemy({ type: H.type, x: c.x, y: c.y, z: c.z + 0.5, free: true });
      e.healer = this; e.healSide = side; this.healers.push(e);
      g.fx.confetti(c, 14, 2.2, [COL.pink, COL.white]); sfx.popup?.();
    });
    this.timer = 1.2 + n * 0.5 + rr(this.def.rest);
  }
  // healed back past where this form began: back to the form before, and the healers go with it
  regress() {
    for (const e of this.healers || []) if (e.alive) { e.alive = false; this.game.fx.puff(e.center(), 8, 0xffd0e8, 1); e.dispose(); }
    this.healers = [];
    this.mutate(this.stage - 1, true);
  }
  summon() {
    const g = this.game, list = this.S.summon || this.def.summon;
    const up = g.actors.filter((a) => a.alive && a !== this && a.def && !a.boss && a.type !== 'boss').length;
    if (up >= (this.def.summonMax ?? 99)) { this.volley(); return; }   // (enough of them about: it throws instead)
    this.attackPose(0.8); sfx.roar();
    list.forEach((s, i) => this.later(0.4 + i * 0.7, () => g.spawnEnemy({ ...s })));
    this.timer = 1.2 + list.length * 0.7 + this.def.summonRest;
  }

  // ---------------------------------------------------------------- the next mutation (DESIGN「Boss」: about 2 s, nobody can shoot):
  // it convulses and splashes ooze, a white flash, the next form bursts out and grows in. Real time (not the enemies' slower clock).
  mutate(n, back) {
    const g = this.game, tw = g.tweens, M = this.def.mutate || { shake: 1.1, grow: 0.8 };
    this.mutating = true; this.seq++; this.endWindup(); this.armor = false;
    g.lull = true;
    g.clearProjectiles && g.clearProjectiles();
    this.state = 'hurt'; this.play('hurt');
    sfx.roar(); sfx.madness(); g.post.flash(0.8, 0xff3a8a); g.post.shake(1.4); g.G.stop(0.25);
    g.hud.gl.hold('phase', { text: tr((back && this.def.texts.regress) || this.def.texts[`s${n + 1}`] || this.def.texts.mutate), dur: M.shake + M.grow + 0.2 });
    // up close the whole time (DESIGN「要给玩家看的东西放慢、特写」): her line as she convulses; the fight comes back with the camera
    const big = Math.max(this.S.h, this.def.stages[n].h);
    // (the picture switches how it is drawn as she changes, cut on the beat: two colours, line art, glitch, halftone, the negative)
    this.game.post.styleBurst(1.5, n % 2 ? [6, 2, 5, 1, 3] : [1, 5, 2, 6, 3], 0.14, 0x1a0010, n % 2 ? 0x5ad8ff : 0xff5aa8);
    // (her name in a wall of words behind it all, the MVs' way: mv.js; and whatever her data adds for this form: bosses.json cues.s<n>)
    g.mv.wall(tr(this.name || ''), 1.3, false, 0.5); g.cues.run(this.def.cues?.[`s${n + 1}`]);
    this.closeUp(`s${n + 1}`, { dist: big * 1.2, v: 0.55, in: 0.6, min: M.shake + M.grow + 0.6, up: -big * 0.15, orbit: n % 2 ? 0.6 : -0.6, dolly: 10 }, () => {   // (going round her the other way each time)
      if (!this.alive) return;
      this.mutating = false; g.lull = false; this.pi = 0; this.timer = 1.2; this.state = 'idle'; this.play('idle', 3);
      if (this.def.ritual && n === this.def.stages.length - 1) this.ritual();
    });
    let k = 0;
    tw.run(M.shake, (e) => {
      this.flash = Math.max(this.flash, e > 0.7 ? (e - 0.7) / 0.3 : 0.25 * Math.max(0, Math.sin(e * 30)));
      this.inner.position.x = Math.sin(e * 70) * 0.12 * (1 - e);
      this.inner.scale.set(1 + Math.sin(e * 40) * 0.08, 1 - Math.sin(e * 40) * 0.06, 1);
      if (e * 6 > k) { k++; const p = this.uvToWorld(rnd(0.2, 0.8), rnd(0.2, 0.9)); g.fx.ink(p, 10, 3, COL.hot); g.fx.confetti(p, 12, 2.5, [COL.hot, 0x2a0a2a]); }
    }, { onDone: () => {
      this.inner.position.x = 0;
      this.setStage(n);
      this.inner.scale.set(0.45, 0.45, 1); this.flash = 1;
      g.post.flash(0.45, 0xffffff);
      for (let i = 0; i < 8; i++) { const q = this.uvToWorld(rnd(0.1, 0.9), rnd(0.1, 0.9)); g.fx.confetti(q, 14, 3.5, [COL.hot, 0x2a0a2a, COL.bone]); }
      tw.to(this.inner.scale, { x: 1, y: 1 }, M.grow, { ease: Ease.outBack });
      g.post.shake(1.2); sfx.slam();
      if (n === this.def.wreckAt && g.world.named?.school && tex[this.def.schoolAfter]) {   // it smashes the school: the building is damaged from now on
        const sc = g.world.named.school; sc.m.material.map = tex[this.def.schoolAfter]; sc.m.material.needsUpdate = true; sc.m.userData.texKey = this.def.schoolAfter;
        for (let i = 0; i < 5; i++) g.fx.confetti(new THREE.Vector3(rnd(-10, 10), rnd(4, 11), sc.z + 0.5), 20, 4, [COL.bone, COL.paper]);
      }
    } });
  }

  // ---------------------------------------------------------------- purified
  die(calm) {   // (calm: laid to rest - her child back with her - not torn apart)
    this.alive = false; this.seq++; this.endWindup(); this.markCore(false);
    for (const o of this.keeps || []) if (o.alive) o.act({ gone: true });
    const g = this.game;
    g.cues.run(this.def.cues?.die);   // (bosses.json cues.die)
    if (calm) { sfx.clear(); g.post.flash(0.8, 0xfff6e8); } else { sfx.roar(); g.post.flash(1, 0xffffff); g.post.shake(1.6); this.play('hurt'); }
    // rings of light racing out across the floor one after another, and a column of light standing up out of her (R-Type's bosses)
    const P = this.root.position;
    for (let i = 0; i < 4; i++) g.tweens.wait(i * 0.35, () => g.fx.shockRing(P, 3 + i * 2.5, calm ? 0xfff2e0 : i % 2 ? 0xff5aa8 : 0xffffff, 0.8));
    if (!calm) g.post.styleBurst(1.0, [6, 1, 5, 2], 0.16, 0x200010, 0xffe0f0);
    g.fx.pillar(P, this.S.h * 2.2, this.S.h * 0.18, calm ? 0xfff6e8 : 0xffd0f0, calm ? 3 : 1.6);
    for (let i = 0; i < 10; i++) g.tweens.wait(i * 0.2, () => { const q = this.uvToWorld(rnd(0.2, 0.8), rnd(0.2, 0.9)); if (calm) { g.fx.confetti(q, 14, 1.5, [COL.white, COL.pink]); g.fx.star(q, 2, COL.white); return; } g.fx.confetti(q, 40, 5); g.fx.star(q, 5, COL.pink); sfx.shatter(rnd(-0.5, 0.5)); g.post.shake(0.8); });
    g.tweens.wait(1.2, () => {
      sfx.burnOut(0);
      this.u.dOrigin.value.set(0.5, 0.6);
      g.tweens.run(2.2, (e) => { this.u.dissolve.value = e; }, { onDone: () => this.dispose() });
    });
    if (!calm && this.game.hud.gl.stickers.D.bosses?.[this.id]?.end) this.closeUp('end', { dist: this.S.h * 1.1, v: 0.6, min: 3.4, orbit: 0.4, dolly: -8 });   // (the room closing in on her)   // (her last words, up close)
    g.onBossDead(this);
  }
}

// one of her child's things (TheThing.ritual): swings before her, guards her core now and then, counts down to its blow; can't be hurt
export class Keepsake extends Gimmick {
  constructor(game, boss, i, g) {
    super(game, g);
    const R = boss.def.ritual, S = R.swing;
    this.boss = boss; this.i = i; this.billboard = true; this.mode = 'swing'; this.q = 0; this.knockT = 0;
    this.ph = i * 2.1 + rnd(0, 1); this.sp = rr(S.speed); this.amp = rr(S.x); this.yk = S.y[i % S.y.length];
    this.to = this.root.position.clone(); this.rate = 1; this.rateT = 0;
    this.restart(rr(S.first ?? R.fuse));
  }
  live() { return this.alive && this.game.combat && this.mode !== 'offered'; }
  hit(info) { if (this.live()) this.boss.keepHit(this, info); }
  // a new count to its next blow, at one of the girls
  restart(s) {
    const g = this.game;
    this.fuse = this.fuse0 = s ?? rr(this.boss.def.ritual.fuse);
    this.slot = g.pickTarget(this.root.position.x - g.world.camPos.x);
    if (this.ring) this.ring.slot = this.slot;
  }
  ringOff() { if (this.ring) { this.ring.remove(); this.ring = null; } }
  // shot: knocked back a little, spinning, and its count starts again (a blow on its way is stopped)
  knock() {
    const g = this.game;
    if (this.mode === 'strike') { this.q++; g.tweens.kill(this.root.position); this.mode = 'swing'; }
    this.restart();
    if (this.knockT > 0) return;
    this.knockT = 0.45;
    g.tweens.run(0.45, (e) => { this.inner.rotation.y = Math.sin(e * Math.PI * 2) * 0.7 * (1 - e); this.inner.position.z = -Math.sin(e * Math.PI) * 0.6; },
      { onDone: () => { this.inner.rotation.y = 0; this.inner.position.z = 0; } });
  }
  // she is down: it stops where it is and waits to be shown to her
  still() { this.q++; this.game.tweens.kill(this.root.position); this.mode = 'still'; this.ringOff(); this.flash = 1; }
  // its count ran out: a shiver, then it flies at that girl and strikes (bosses.json ritual.strike), and swings back to its place
  strike() {
    const g = this.game, B = this.boss, A = B.def.ritual.strike[this.i] || B.def.ritual.strike[0], P = this.root.position, q = ++this.q;
    this.mode = 'strike'; this.ringOff();
    const c = g.world.camPos, to = new THREE.Vector3(c.x + (this.slot ? 1 : -1) * 1.1, 1.5, c.z - 2.4);
    g.tweens.run(0.35, (e) => { this.inner.position.x = Math.sin(e * 50) * 0.07; }, { onDone: () => {
      this.inner.position.x = 0;
      if (q !== this.q || !this.alive) return;
      g.tweens.to(P, { x: to.x, y: to.y, z: to.z }, 0.32, { ease: Ease.inQuad, onDone: () => {
        if (q !== this.q || !this.alive) return;
        const p = this.center();
        if (A.flash) g.post.flash(0.7, 0xffffff);
        if (sfx[A.sfx]) sfx[A.sfx](); else sfx.slam();
        g.post.shake(A.all ? 1.2 : 0.8); g.fx.confetti(p, 18, 2.5, A.all ? [COL.bone, COL.hot] : [COL.paper, COL.pink]);
        g.playerAttacked({ kind: 'shot', dmg: A.dmg, from: this, slot: A.all ? -1 : this.slot });
        this.mode = 'back';
        g.tweens.to(P, { x: this.to.x, y: this.to.y, z: this.to.z }, 0.7, { ease: Ease.outQuad, onDone: () => { if (q === this.q) { this.mode = 'swing'; this.restart(); } } });
      } });
    } });
  }
  update(dt, t) {
    if (!this.alive) return;
    this.baseUpdate(dt, t);
    this.knockT -= dt;
    const g = this.game, B = this.boss, R = B.def.ritual, P = this.root.position;
    if (this.mode === 'strike' || this.mode === 'back' || this.mode === 'offered') return;
    // toward the camera from her: the things hang between her and the girls
    const bp = B.root.position, cam = g.world.camera.position, dx = cam.x - bp.x, dz = cam.z - bp.z, dl = Math.hypot(dx, dz) || 1, fx = dx / dl, fz = dz / dl;
    this.ph += dt * this.sp;
    if (this.mode === 'still') {   // in a row before her, waiting to be shown to her (the one she is waiting for glows once it takes long)
      const off = (this.i - (B.keeps.length - 1) / 2) * (R.rowGap ?? 2);
      this.to.set(bp.x + fx * R.near * 1.4 - fz * off, (R.rowY ?? 2) + Math.sin(t * 1.5 + this.i) * 0.08, bp.z + fz * R.near * 1.4 + fx * off);
      if (B.ritualNext === this.i && B.stuck > (R.hint ?? 9) * 0.5) this.flash = Math.max(this.flash, 0.35 + 0.35 * Math.sin(t * 6));
    } else if (this.mode === 'guard') {   // before her core, between it and the girls
      const c = B.uvToWorld(B.S.core[0], B.S.core[1]);
      this.to.set(c.x + fx * R.near, c.y, c.z + fz * R.near);
    } else {   // swinging back and forth before her, a lazy figure of eight
      const s = Math.sin(this.ph);
      this.to.set(bp.x + fx * R.near - fz * s * this.amp, B.S.h * this.yk + Math.sin(this.ph * 2) * 0.35, bp.z + fz * R.near + fx * s * this.amp);
    }
    P.lerp(this.to, 1 - Math.exp(-dt * (this.mode === 'guard' ? 7 : 4)));
    this.inner.rotation.z = Math.cos(this.ph) * 0.18;   // (hanging, like a pendulum)
    // its count, at an uneven pace (the pace changes every second or so)
    if (this.mode === 'still' || !g.combat || g.cineOn || B.mutating || B.grief || !B.alive) { this.ringOff(); return; }
    this.rateT -= dt; if (this.rateT <= 0) { this.rateT = rnd(0.7, 1.8); this.rate = rnd(R.pace[0], R.pace[1]); }
    this.fuse -= dt * this.rate;
    if (this.fuse <= 0) { this.strike(); return; }
    if (!this.ring) this.ring = g.fx.lock('shot', this.slot);
    const wc = this.center(), c = g.world.project(wc), b = this.screenBox();
    this.ring.set(c.x, g.H - c.y, Math.max(22, (b.y1 - b.y0) * 0.5), 1 - this.fuse / this.fuse0, t, this.fuse, b, wc);
  }
  dispose() { this.ringOff(); super.dispose(); }
}

