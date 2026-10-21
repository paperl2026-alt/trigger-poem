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
//   slide     (3, user 2026-10-21 with a drawing) from the far end of her ground she slides side to side at one girl, quick and straight,
//             nearer with every slide, her core open; enough damage and she is thrown straight back to where she started, and starts
//             again; not stopped, she gets to them and strikes through any cover. Never nearer than the picture holds her (sizeOk).
// Only its core takes damage, and nothing gets through while it attacks (DESIGN「Boss」, 2026-10-18). The core is not ringed: now and
// then a puff of watercolour smoke wells out of it in the boss's own colours (def.coreSmoke), or - def.coreTrail, the prologue's - a ribbon
// of golden light streams off it as she moves; a hit there sprays a mist of blood, and with def.coreGlow the core itself changes colour
// the more it is hurt (bright, iridescent, a metallic glint: paper.js dmgStyle) - a hit anywhere else only glances (user 2026-10-21). Her attacks have key frames of their own
// per form (R80: pound_up / pound_down, throw_wind / throw_fling, slide / strike, summon, gather / release; pose() falls back to the
// old windup / attack when a form has none); a frame can carry its own core (manifest core: [u, v, r]).
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
import { FR } from '../core/particles.js';
import { Mark3D } from './marks3d.js';

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
    this.dm = new DamageMap(1 / this.ar, 512); attachDamage(this.mesh, this.dm, true); this.coreHurt = 0;
    this.u = this.mesh.material.uniforms;
    this.u.outlineOn.value = 1; this.u.mapTexel.value.set(1 / t.image.width, 1 / t.image.height);
    this.u.dmgStyle.value = this.def.coreGlow ? 1 : 0;   // (her core lights up as it is hurt: paper.js)
    this.u.coreCol.value.set((this.def.coreTrail?.colors || this.def.coreSmoke?.colors || ['#ffe08a'])[0]);
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
  core() { const C = this.S.cores; if (C) return C[(this.coreI || 0) % C.length]; return meta[this.mesh?.userData.texKey]?.core || this.S.core; }
  pose(name, alt, fps = 8) { this.play(tex[this.prefix + name] ? name : alt, fps); }   // (a key frame of this form's, else the old one)
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
    this.paint(info);   // (no white flash of the whole of her: the core itself changes colour as it is hurt - user 2026-10-21)
    if (this.def.coreGlow) { const c = this.core(); if (c) { this.dm.blob(c[0], c[1], (c[2] ?? 0.11) * this.h / this.w * 1.15, '0,255,0', 0.045); this.dm.tex.needsUpdate = true; this.coreHurt = (this.coreHurt || 0) + 1; } }   // (the whole core, a little more each hit)
    const p = this.uvToWorld(info.uv.u, info.uv.v);
    this.mist(p); this.strobeT = 0.3;   // (the weak point strobes where it is hit: beatTick)
    // a lunge being gathered breaks off when its core is hit enough
    if (this.state === 'windup' && this.move === 'lunge' && info.stagger) { this.poise += info.stagger; if (this.poise >= D.lunge.poise) this.interrupt(); }
    this.hp -= dmg; this.stageDmg = (this.stageDmg || 0) + dmg;
    // (a zigzag rush knocked back by enough damage on the way; a charge broken by enough damage before it is full)
    if (this.zz) { this.zz.dmg += dmg; if (this.zz.dmg >= (this.move === 'slide' ? D.slide : D.zigzag).poise) this.repel(); }
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
  endWindup() { if (this.lock) { this.lock.remove(); this.lock = null; } if (this.mark3) { this.mark3.remove(); this.mark3 = null; } this.markKill = false; }
  // her own warning: a blow to hide from - the star of octahedra round her, cones to the girls it goes for (marks3d.js bossHide); one to
  // stop by shooting - no structure on her (it hid her: user 2026-10-21), the motes round her core pour into it instead (motesTick)
  // (its own clock, dur seconds to the blow: the move sets this.timer on to after it - the next move - as soon as it starts)
  markUp(threat, slot, dur) {
    const g = this.game; this.lock = g.fx.lock(threat, slot, { quiet: true }); this.markEl = 0; this.markDur = dur || 1;
    const hide = threat === 'hide' || threat === 'heavy'; this.markKill = !hide;
    this.mark3 = hide ? new Mark3D(g.world.scene, 'bossHide') : null; this.markSlot = slot;
  }
  markP() { return Math.max(0, Math.min(1, (this.markEl || 0) / (this.markDur || 1))); }
  markTick(dt, t, p) {
    const g = this.game, M = this.mark3; if (!M) return;
    const fx = g.fx, s = this.markSlot;
    M.root.visible = !g.cineOn;
    const c = this.uvToWorld(0.5, this.S.float ? 0.55 : 0.68), to = s === -1 ? [fx.victimAt(0, new THREE.Vector3()), fx.victimAt(1, new THREE.Vector3())] : fx.victimAt(s, new THREE.Vector3());
    M.set(c, this.S.h * 0.3, p, t, to, fx.res(), dt);
  }
  // where the AI partner aims (src/core/input.js): the core, on screen (y down like screenBox)
  aimAt() { const c = this.core(); if (!c || !this.weakNow()) return null; const g = this.game, sc = g.world.project(this.uvToWorld(c[0], c[1])); return { x: sc.x, y: sc.y }; }
  // the ring round the core (the small kill ring: shoot inside it), gone while it attacks or changes
  // (not a ring: now and then watercolour smoke wells out of the core in her own colours, faint - def.coreSmoke: colors, every, n, a)
  markCore(on) {
    const g = this.game;
    if (this.coreMark) { this.coreMark.remove(); this.coreMark = null; }
    if (!on) { this.smokeT = 0.2; this.trailAt = null; return; }
    if (this.def.coreTrail) return;   // (the trail: update, always)
    this.smokeT = (this.smokeT ?? 0.2) - (g.rdt || 0.016);
    if (this.smokeT > 0) return;
    const S = this.def.coreSmoke || {}, c = this.core(); this.smokeT = rr(S.every || [0.7, 1.3]);
    const p = this.uvToWorld(c[0], c[1]), s = this.h * (c[2] ?? 0.11), cam = g.world.camPos;
    const toCam = new THREE.Vector3(cam.x - p.x, 0, cam.z - p.z).normalize(), cols = (S.colors || ['#ff6aa8', '#a46bff', '#ff9a6a', '#6ac8ff']).map((h) => new THREE.Color(h));
    for (let i = 0; i < (S.n ?? 7); i++) {
      const col = cols[i % cols.length], a = rnd(0, 6.28), v = rnd(0.25, 0.8) * s;
      g.fx.wNorm.emit({ x: p.x + toCam.x * 0.25 + Math.cos(a) * s * 0.25, y: p.y + Math.sin(a) * s * 0.25, z: p.z + toCam.z * 0.25, vx: Math.cos(a) * v + toCam.x * 0.2, vy: Math.sin(a) * v + 0.25 * s, vz: toCam.z * 0.2,
        drag: 1.4, life: rnd(1.0, 1.7), size: s * rnd(0.5, 0.9), size1: s * rnd(2.2, 3.4), rot: rnd(0, 6.28), vrot: rnd(-0.6, 0.6), color: [col.r, col.g, col.b], a: S.a ?? 0.4, a1: 0, frame: FR.SMOKE });
    }
  }
  // a ribbon of light streaming off her core as she moves (user 2026-10-21, a picture of golden light trails: the weak point found by
  // its trail; still, only a few sparks drift off it) - def.coreTrail: colors, perM (sparks a metre moved), idle (a second standing).
  // Fine sparks, spread round it (big soft ones heaped up into a round patch of light on her: user 2026-10-21)
  trailTick(dt, k = 1) {   // (k: dimmer while the core is shut - it still shows where it is)
    const g = this.game, T = this.def.coreTrail, c = this.core(); if (!c) return;
    const p = this.uvToWorld(c[0], c[1]), last = this.trailAt || p.clone(), d = Math.min(3, p.distanceTo(last)), s = this.h * (c[2] ?? 0.11);
    const cols = this.trailCols || (this.trailCols = (T.colors || ['#ffd27a', '#ffb347', '#fff2c0']).map((h) => new THREE.Color(h)));
    this.trailAcc = (this.trailAcc || 0) + Math.min(60, (d * (T.perM ?? 18) + dt * (T.idle ?? 6)) * (0.5 + 0.5 * k));
    while (this.trailAcc >= 1) {
      this.trailAcc -= 1;
      const q = last.clone().lerp(p, Math.random()), col = cols[Math.floor(Math.random() * cols.length)], star = Math.random() < 0.22;
      g.fx.wAdd.emit({ x: q.x + rnd(-0.6, 0.6) * s, y: q.y + rnd(-0.6, 0.6) * s, z: q.z + rnd(-0.2, 0.2) * s, vx: rnd(-0.3, 0.3), vy: rnd(0.15, 0.55), vz: rnd(-0.3, 0.3),
        drag: 0.6, life: rnd(0.9, 1.6), size: s * (star ? rnd(0.16, 0.28) : rnd(0.06, 0.14)), size1: s * rnd(0.02, 0.05), rot: rnd(0, 6.28), color: [col.r, col.g, col.b], a: 0.95 * k, a1: 0, frame: star ? FR.STAR : FR.GLOW });
    }
    this.trailAt = p.clone();
  }
  // her weak point told by its glitter (user 2026-10-21: no structure round it - that hid her - and no round patch of light either: fine
  // motes floating and glowing round it): tiny lights in bright shifting colours swirling about the core, more and brighter the more it
  // is hurt (coreHurt: hits there this form) and while it is open; while she gathers a blow to be shot down (a kill wind-up) they come
  // from further out and pour into it, faster and thicker as the blow comes - shoot here
  motesTick(dt, t, open) {
    const g = this.game, c = this.core(); if (!c) return;
    const p = this.uvToWorld(c[0], c[1]), s = this.h * (c[2] ?? 0.11), hurt = Math.min(1, (this.coreHurt || 0) / 30);
    const kill = this.markKill ? this.markP() : -1, cam = g.world.camPos, col = this.moteCol || (this.moteCol = new THREE.Color());
    const tx = cam.x - p.x, tz = cam.z - p.z, tl = Math.hypot(tx, tz) || 1, fx = tx / tl, fz = tz / tl;   // (toward the camera: a little in front of her)
    const rate = (open ? 30 : 10) * (1 + hurt * 1.6) + (kill >= 0 ? 30 + kill * 60 : 0);
    this.moteAcc = (this.moteAcc || 0) + Math.min(40, rate * dt);
    while (this.moteAcc >= 1) {
      this.moteAcc -= 1;
      const a = rnd(0, 6.28), ca = Math.cos(a), sa = Math.sin(a), pour = kill >= 0 && Math.random() < 0.7;
      const rr = s * (pour ? rnd(1.3, 2.4) : rnd(0.15, 1.05)), side = -fz, sideZ = fx;   // (the screen's sideways, in the world)
      col.setHSL((t * 0.08 + Math.random() * 0.6 + hurt * 0.3) % 1, 1, rnd(0.6, 0.78));
      const x = p.x + side * ca * rr + fx * s * 0.25, y = p.y + sa * rr, z = p.z + sideZ * ca * rr + fz * s * 0.25;
      let vx, vy, vz;
      if (pour) { const v = rr * rnd(1.4, 2.0) * (1 + kill * 1.5); vx = -side * ca * v; vy = -sa * v; vz = -sideZ * ca * v; }   // (into the core)
      else { const v = s * rnd(0.25, 0.7); vx = -side * sa * v; vy = ca * v + s * 0.18; vz = -sideZ * sa * v; }   // (swirling round it, drifting up)
      const star = Math.random() < 0.18 + hurt * 0.1;
      g.fx.wAdd.emit({ x, y, z, vx, vy, vz, drag: pour ? 0.2 : 0.9, life: pour ? rnd(0.4, 0.6) : rnd(0.6, 1.3), size: s * (star ? rnd(0.18, 0.3) : rnd(0.07, 0.15)) * (1 + hurt * 0.5),
        size1: s * rnd(0.01, 0.04), rot: rnd(0, 6.28), vrot: rnd(-3, 3), color: [col.r, col.g, col.b], a: 0.95, a1: 0, frame: star ? FR.STAR : FR.GLOW });
    }
  }
  // her weak point plain from the start (user 2026-10-21: "you still have to guess, or wait for the AI to hit it"): as the old light-gun
  // games show a boss's weak spot - House of the Dead's boss card, the glowing, beating cores of R-Type - it always holds a faint light,
  // and beats with light (paper.js coreBeat: a pulse from it, a ring of motes thrown off); when a form begins it is shown off - quick
  // strong beats and bursts of stars for a few seconds; open, it beats faster than shut; where it is hit it strobes (coreHit)
  beatTick(dt, open) {
    const g = this.game, U = this.u, c = this.core();
    if (!c || this.mutating || this.grief || g.cineOn || !this.alive) { U.coreOn.value = 0; U.coreBeat.value = 0; U.coreHit.value = 0; return; }
    U.coreAt.value.set(c[0], c[1], c[2] ?? 0.11, this.ar);
    if (this.revealStage !== this.stage) { this.revealStage = this.stage; this.revealT = 3.5; this.beatT = 9; }
    this.revealT = Math.max(0, (this.revealT || 0) - dt);
    const rev = this.revealT > 0, per = rev ? 0.5 : open ? 1.1 : 1.9;
    this.beatT = (this.beatT || 0) + dt;
    if (this.beatT >= per) {
      this.beatT = 0;
      const p = this.uvToWorld(c[0], c[1]), s = this.h * (c[2] ?? 0.11), col = U.coreCol.value, n = rev ? 18 : open ? 12 : 7;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + rnd(-0.15, 0.15), v = s * rnd(1.4, 2.2) * (rev ? 1.4 : 1);
        g.fx.wAdd.emit({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 0, drag: 2.2, life: rnd(0.45, 0.7), size: s * rnd(0.1, 0.18), size1: s * 0.03,
          rot: rnd(0, 6.28), color: [col.r, col.g, col.b], a: rev ? 1 : open ? 0.9 : 0.6, a1: 0, frame: Math.random() < 0.3 ? FR.STAR : FR.GLOW });
      }
      if (rev) g.fx.star(p, s * 1.6, COL.white);
    }
    U.coreOn.value = open || rev ? 1 : 0.6;
    U.coreBeat.value = Math.exp(-this.beatT * 5) * (rev ? 1.5 : open ? 1 : 0.55);
    this.strobeT = Math.max(0, (this.strobeT || 0) - dt);
    U.coreHit.value = this.strobeT > 0 && Math.floor(this.strobeT * 30) % 2 === 0 ? 1 : 0;
  }
  // a hit on the core: a spray of blood mist (her own blood colours: def.coreSmoke.blood) and a few drops
  mist(p) {
    const g = this.game, S = this.def.coreSmoke || {}, s = this.h * ((this.core()?.[2]) ?? 0.11), cols = (S.blood || ['#c8102e', '#ff3b5c', '#7a0018']).map((h) => new THREE.Color(h));
    if ((this.mistT || 0) > 0) return; this.mistT = 0.07;
    for (let i = 0; i < 4; i++) { const col = cols[i % cols.length], a = rnd(0, 6.28), v = rnd(0.6, 1.6) * s;
      g.fx.wNorm.emit({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: rnd(0, 0.6), drag: 2.5, life: rnd(0.5, 0.9), size: s * 0.35, size1: s * rnd(1.2, 1.8),
        rot: rnd(0, 6.28), vrot: rnd(-1, 1), color: [col.r, col.g, col.b], a: 0.5, a1: 0, frame: FR.SMOKE }); }
    g.fx.confetti(p, 3, 1.2, [0xc8102e, 0xff3b5c]);
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
    this.markCore(wk && this.core() && !g.cineOn); this.mistT = (this.mistT || 0) - dt; this.u.time.value = t;
    if (this.def.coreTrail && this.core() && !g.cineOn && !this.mutating && !this.grief) this.trailTick(dt, wk ? 1 : 0.35); else this.trailAt = null;
    if (this.def.coreGlow && this.core() && !g.cineOn && !this.mutating && !this.grief) this.motesTick(dt, t, wk);
    this.beatTick(dt, wk);
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
      const pk = this.markP(); this.markEl = (this.markEl || 0) + dt;
      this.lock.set(c.x, g.H - c.y, Math.max(40, (b.y1 - b.y0) * 0.5), pk, t, Math.max(0, this.markDur - this.markEl), b, wc); this.markTick(dt, t, pk);
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
    if (this.def.drift === 'slide') {   // (a quick slide aside where she stands - not at them, not to and fro: user 2026-10-21)
      const g = this.game, Z = this.zone, P = this.root.position, x = P.x > (Z.x[0] + Z.x[1]) / 2 ? rnd(Z.x[0], Z.x[0] * 0.4) : rnd(Z.x[1] * 0.4, Z.x[1]);
      this.state = 'move'; this.pose('slide', 'move'); this.inner.scale.x = Math.abs(this.inner.scale.x) * (x < P.x ? 1 : -1);
      g.etw.to(P, { x }, 0.55, { ease: Ease.inOutCubic, onDone: () => { this.inner.scale.x = Math.abs(this.inner.scale.x); if (this.alive && this.state === 'move') { this.state = 'idle'; this.play('idle', 3); } } });
      this.timer = 0.55 + rr(this.def.rest); return;
    }
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
  windup(time, threat, slot, then, pose) {
    const g = this.game;
    this.state = 'windup'; this.timer = this.timer0 = time; this.poise = 0;
    this.pose(pose || 'windup', 'windup');
    this.markUp(threat, slot, time);
    g.fx.charge(this, threat === 'hide' ? 0xff4fc8 : 0xffb04a);
    sfx.warn();
    this.later(time, () => { this.endWindup(); then(); });
  }
  attackPose(dur, pose) {
    this.state = 'attack'; this.pose(pose || 'attack', 'attack');
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
        this.attackPose(D.gap, 'pound_down'); sfx.slam(); g.post.shake(1.5); g.G.stop(0.05);
        for (const cv of g.world.covers || []) if (cv) g.fx.confetti(cv.m.position.clone().setY(cv.h * 0.8), 10, 1.6, [COL.bone, COL.paper]);
        g.playerAttacked({ kind: 'ranged', dmg: D.dmg, from: this, slot: -1, rattle: true });   // (hidden: the cover shakes as if it would give, and holds)
      });
      this.later(D.slams * D.gap + 0.3, () => {
        this.state = 'move'; this.play('move', 4);
        g.etw.to(this.root.position, { x: home.x, z: home.z }, D.back, { ease: Ease.inOutQuad, onDone: () => { if (this.alive && this.state === 'move') { this.state = 'idle'; this.play('idle', 3); } } });
      });
    }, 'pound_up');
    this.timer = D.windup + D.slams * D.gap + D.back + 0.6 + rr(this.def.rest);
  }
  // (2) things thrown one after another; its weak point opens only for a moment at each throw
  throw() {
    const g = this.game, D = this.def.throw, n = Math.round(rr(D.shots)), kinds = this.def.volley.projectiles;
    this.state = 'throwing'; this.pose('throw_wind', 'windup');
    for (let i = 0; i < n; i++) this.later(0.5 + i * D.gap, () => {
      this.pose('throw_fling', 'attack'); this.exposedT = D.expose;
      const c = this.core(); g.fx.glint(this.uvToWorld(c[0], c[1]), 0xffffff, 1.4); sfx.tink?.(0);
      const from = this.uvToWorld(rnd(0.35, 0.65), rnd(0.45, 0.7));
      g.spawnProjectile(kinds[(i + this.stage) % kinds.length], from, { slot: g.pickTarget(from.x - g.world.camPos.x), time: D.flight, curve: rnd(-2, 2), dmg: D.dmg });
      sfx.throwIt(0);
      this.later(D.expose, () => { if (this.state === 'throwing') this.pose('throw_wind', 'windup'); });
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
      this.timer = this.timer0 = D.time + 2.4 + rr(this.def.rest); this.markUp('kill', slot, this.timer0);   // (the red mark rides with it; the next move after it is back)
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
  slide() {
    const g = this.game, D = this.def.slide, Z = this.zone, P = this.root.position, c = g.world.camPos;
    const home = this.slideHome || (this.slideHome = new THREE.Vector3((Z.x[0] + Z.x[1]) / 2, P.y, Z.z[0]));   // (the start: the far end of her ground)
    if (Math.hypot(P.x - home.x, P.z - home.z) > 0.6) { this.slideBack(home, Math.max(0.6, Math.hypot(P.x - home.x, P.z - home.z) / 14)); return; }
    const alive = (s) => g.players[s] && g.players[s].state !== 'down' && g.players[s].state !== 'away';
    const slot = alive(0) ? 0 : 1, cov = g.world.covers?.[slot];   // (the drawing: at 1P)
    const gx = cov ? cov.def.x : c.x + (slot ? 1 : -1), gz = (cov ? cov.def.z : c.z - 2) - D.near;
    const Zz = this.zz = { dmg: 0, home: home.clone() };
    this.state = 'slide'; this.timer = 99;
    let i = 0, side = Math.random() < 0.5 ? -1 : 1;
    const step = () => {
      if (this.zz !== Zz || !this.alive) return;
      const k = (i + 1) / D.legs, to = new THREE.Vector3(gx + side * D.lateral * (1 - 0.35 * k), P.y, home.z + (gz - home.z) * k);
      if (i >= D.legs || !this.sizeOk(to)) { this.slideStrike(slot, Zz); return; }
      this.pose('slide', 'move'); this.inner.scale.x = Math.abs(this.inner.scale.x) * (to.x < P.x ? 1 : -1);   // (drawn sliding to the left)
      g.etw.to(P, { x: to.x, z: to.z }, D.time, { ease: Ease.inOutCubic, onDone: () => {
        if (this.zz !== Zz || !this.alive) return;
        this.inner.scale.x = Math.abs(this.inner.scale.x); this.play('idle', 3); sfx.thud?.(0); g.post.shake(0.3);
        i++; side = -side; this.later(D.pause, step);
      } });
    };
    this.later(0.35, step);
  }
  // (the whole of her inside the picture there: her top below its top edge - a paper figure is never blown up past the screen)
  sizeOk(to) { const g = this.game, top = g.world.project(new THREE.Vector3(to.x, to.y + (this.S.float ? this.S.h * 0.55 : this.S.h * 1.02), to.z)); return top.y > g.H * 0.05; }
  slideStrike(slot, Zz) {
    const g = this.game, D = this.def.slide;
    this.windup(D.windup, 'kill', slot, () => {   // (the red mark: it comes through any cover)
      if (this.zz !== Zz || !this.alive) return;
      this.zz = null; this.attackPose(0.7, 'strike'); sfx.slam(); g.post.shake(1.6); g.G.stop(0.08);
      g.playerAttacked({ kind: 'ram', dmg: D.dmg, from: this, slot, heavy: true });
      this.later(0.7, () => this.slideBack(Zz.home, 1.0));
    }, 'strike');
  }
  slideBack(home, time) {   // (straight back to where she started; her core still open on the way)
    const g = this.game, P = this.root.position;
    this.state = 'back'; this.play('move', 4); this.timer = 99;
    g.etw.to(P, { x: home.x, z: home.z }, time, { ease: Ease.outCubic, onDone: () => { if (!this.alive) return; if (this.state === 'back') { this.state = 'idle'; this.play('idle', 3); } this.timer = rr(this.def.rest); } });
  }
  repel() {   // (knocked back home in the middle of its rush)
    const g = this.game, Z = this.zz; this.zz = null; this.seq++; this.endWindup();
    this.state = 'hurt'; this.play('hurt'); this.flash = 1;
    g.fx.stamp('don', g.W * 0.5, g.H * 0.68, 0.26, 0); g.post.shake(1.1); sfx.roar(); g.G.stop(0.12);
    g.hud.gl.stickers.say(g.players.find((p) => p.state === 'out') || g.players[0], 'stagger');
    const far = Math.hypot(this.root.position.x - Z.home.x, this.root.position.z - Z.home.z);   // (all the way back to her start)
    g.etw.to(this.root.position, { x: Z.home.x, z: Z.home.z }, Math.max(0.55, far / 12), { ease: Ease.outQuad });
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
      this.chg = null; this.attackPose(0.9, 'release');
      sfx.slam(); sfx.madness(); g.post.flash(0.7, 0xff3a5a); g.post.shake(1.8);
      const p = this.center(); g.fx.confetti(p, 50, 6, [COL.hot, COL.pink, COL.white]); g.fx.star(p, 8, COL.hot);
      g.playerAttacked({ kind: 'ram', dmg: D.dmg, from: this, heavy: true, slot: -1 });
    }, 'gather');
    this.timer = D.time + 1.6 + rr(this.def.rest);
  }
  // (4) healers out of her body, one each side and above: kill them, or they feed her back (def.heal: rate per healer, max, type)
  heal() {
    const g = this.game, H = this.def.heal;
    this.healers = (this.healers || []).filter((e) => e.alive);
    const n = Math.min(H.n, H.max - this.healers.length);
    if (n <= 0) { this.volley(); return; }
    this.attackPose(0.8, 'summon'); sfx.roar();
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
    this.attackPose(0.8, 'summon'); sfx.roar();
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

