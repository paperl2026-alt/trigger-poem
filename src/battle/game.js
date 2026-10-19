// One episode run: walks the episode's steps (comics, small stages, bosses), owns the world, the two heroines,
// enemies, shooting rules (pierce / ramp / Fever crits / stagger), rewards at the end.
// Numbers: content tuning/combat.json (shooting, waves) and tuning/economy.json (rank, rewards).
import * as THREE from 'three';
import { alphaAt, meta, url } from '../core/assets.js';
import { sfx, sound, playMusic, stopMusic, setIntensity, warmMusic, setListener, listenerOff, setRoom, hitNote } from '../core/audio.js';
import { Ease, Tweens } from '../core/tween.js';
import { World } from './world.js';
import { PlateWorld } from './plates.js';
import { PanelWorld } from './panels.js';
import { FX, COL } from './fx.js';
import { Player } from './player.js';
import { Enemy, Projectile } from './enemies.js';
import { BOSSES } from './boss.js';
import { Gimmick } from './gimmick.js';
import { Chase } from './chase.js';
import { Hud } from '../ui/hud.js';
import { Comic } from '../ui/comic.js';
import { playDoor } from '../ui/door.js';
import { AICtrl, PadCtrl, KeyCtrl } from '../core/input.js';
import { SET } from '../core/settings.js';
import { SAVE, persist, levelOf, openStage, maxLv } from '../core/save.js';
import { bagFx, giveItem } from './items.js';
import { C, T, isStage } from '../core/content.js';
import { coreKeys, stageKeys, stageKeysAt, setKeys, placeOf, stageFrom, stageAt, outfitKeys } from '../core/groups.js';
import { loadKeys, releaseExcept, isLoaded } from '../core/assets.js';
import { t, tr } from '../core/i18n.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const EDGE_C = new THREE.Color();

export class Game {
  // run: { ep, team: [id1P, id2P], bag: [...] }
  constructor(G, run) {
    this.G = G;
    this.run = run;
    this.ep = run.ep;
    warmMusic(Object.keys(C.sounds?.music || {}).filter((n) => n.startsWith(`${this.ep.id}_`)));   // (its recorded tracks: music())
    this.tweens = G.tweens;
    // the enemies' clock (DESIGN「节奏要慢下来」): monsters, the boss, their shots and the waves run at tuning combat.pace of real time
    this.etw = new Tweens();
    this.post = G.post;
    this.pointer = G.pointer;
    this.overlay = new THREE.Scene();
    this.hudScene = new THREE.Scene();   // the HUD: drawn after the post pass, so shakes and warps never move it (DESIGN「战斗画面布局」)
    this.ortho = new THREE.OrthographicCamera(0, 1, 1, 0, -100, 100);
    // the place: every stage can have a set of its own (episodes.json step "set", else the episode's); the run starts in the one of
    // the step it starts from, and moves to the next set when a stage needs it (useSet)
    this.useSet(this.setOf(run.step || 0));
    this.fx = new FX(this);
    this.players = run.team.map((id, i) => new Player(this, id, i, { xp: SAVE.chars[id]?.xp || 0, bag: run.bag }));
    this.hud = new Hud(this);
    this.comic = new Comic();
    this.actors = [];
    this.chase = new Chase(this);   // (episode 2: she who cannot be killed, and the run she drives: src/battle/chase.js)
    this.addGimmicks();
    this.boxes = new Map();
    this.combat = false; this.lull = false;   // lull: a short pause in the fight (the boss changing form, thing.js mutate)
    this.combo = 0; this.comboT = 0; this.maxCombo = 0; this.kills = 0;
    this.time = 0; this.playT = 0;
    this.camPlaced = false;
    this.assignControllers();
    this.layout(G.W, G.H);
  }
  // which set a step plays in: its own, or the next stage's (a comic / door before a stage), or the episode's
  // (the pictures loaded for the start are that stage's, main.js; a stage through several places: the place of the stop it starts at)
  setOf(i) { const st = stageAt(this.ep, i); return st?.places ? placeOf(st, this.run.station) : st?.set || this.ep.set; }
  makeWorld(id) { const d = C.sets[id]; return d?.panels ? new PanelWorld(this, id) : d?.plates ? new PlateWorld(this, id) : new World(this, id); }
  // build the set (first time), or swap to another one between stages: the heroines, the effects and the camera move over
  useSet(id) {
    if (id === this.setId && this.world) return;
    const old = this.world;
    this.setId = id;
    this.world = this.makeWorld(id);
    this.justBuilt = true;
    if (!old) return;
    this.clearActors(); this.boss = null; this.etw.clear();
    this.addGimmicks();
    this.fx.clear();
    for (const p of this.players) { old.camera.remove(p.group); this.world.camera.add(p.group); }
    this.world.scene.add(this.fx.wNorm.mesh, this.fx.wAdd.mesh);
    if (old.dispose) old.dispose();
    this.camPlaced = false;
    this.layout(this.W, this.H);
    if (this.stage?.places?.includes(id)) this.streamPlaces(id);
    setRoom(this.world.set?.reverb ?? 0.3);   // (how much this place echoes)
  }
  // a stage through several places (src/core/groups.js stageKeysAt): the places behind are let go, the next one starts loading
  streamPlaces(id) {
    const keys = new Set([...coreKeys(), ...stageKeysAt(this.ep, this.stage, id), ...outfitKeys(this.run.team, (c) => SAVE.chars[c]?.outfit)]);
    releaseExcept(keys); loadKeys(keys);
  }
  get W() { return this.G.W; }
  get H() { return this.G.H; }
  get player() { return this.players[0]; }
  p2on() { return SET.p2 !== 'off'; }
  // DESIGN「阵亡」: a girl who goes down gets back up at half HP after the countdown while her partner is still standing; both down = lost
  allDown() { return this.players.every((p) => p.state === 'down' || (p.slot && !this.p2on())); }

  assignControllers() {
    const [p1, p2] = this.players, G = this.G;
    p1.ctrl = G.auto ? new AICtrl(G, p1, 0.95) : G.p1ctrl;
    if (SET.p2 === 'pad' && G.p2pad !== null) p2.ctrl = new PadCtrl(G, G.p2pad);
    else if (SET.p2 === 'keys') p2.ctrl = new KeyCtrl(G);
    else p2.ctrl = new AICtrl(G, p2, 0.5);
  }
  applyP2() {
    this.assignControllers();
    const p2 = this.players[1];
    const on = this.p2on();
    if (!on) { p2.state = 'away'; p2.poses[p2.pose] && (p2.poses[p2.pose].visible = false); if (p2.hero) p2.hero.g.visible = false; }
    else if (p2.state === 'away' && this.combat) { p2.state = 'cover'; p2.y0 = 0; }
  }

  layout(W, H) {
    this.ortho.right = W; this.ortho.top = H; this.ortho.updateProjectionMatrix();
    this.world.setSize(W, H);
    this.players.forEach((p) => p.layout(W, H, this.G.frame));
    if (this.world.placeCovers) this.world.placeCovers(this.players);   // covers stand where the heroines will kneel
  }

  // ------------------------------------------------------------------ episode flow
  start(step = 0) {
    this.applyP2();
    this.hud.show(false);
    this.stepIdx = step - 1;
    this.nextStep();
  }
  nextStep() {
    this.stepIdx++;
    const st = this.ep.steps[this.stepIdx];
    if (!st) { this.finish(); return; }
    this.checkpoint = this.stepIdx;
    // while a comic page or a door plays, the next stage's pictures load in the background (src/core/groups.js); a stage waits for its
    // pictures (a loading bar if they are not all there yet) and then the previous stage's are released
    if (!isStage(st)) { const nx = stageFrom(this.ep, this.stepIdx + 1); if (nx) loadKeys(stageKeysAt(this.ep, nx, placeOf(nx, this.run.station))); }
    else if (!this.picsReady) { this.picsReady = true; this.stepIdx--; this.G.needPics(new Set([...coreKeys(), ...stageKeysAt(this.ep, st, placeOf(st, this.run.station)), ...outfitKeys(this.run.team, (id) => SAVE.chars[id]?.outfit)]), () => this.nextStep()); return; }
    this.picsReady = false;
    // a door close-up between two places (src/ui/door.js): like a comic page, over the wipe
    // (they followed a monster through the hole it broke, Game.breakoutAt, or fell through the floor, collapse: not through this door)
    if (st.door && this.skipDoor) { this.skipDoor = false; this.afterComic = true; this.nextStep(); return; }
    if (st.door) {
      if (this.G.skipComics || !meta[st.door.frame] || !meta[st.door.leaf]) { this.afterComic = true; this.nextStep(); return; }
      this.hud.show(false);
      stopMusic();
      const play = () => playDoor(st.door, () => { this.post.u.wipe.value = 0; this.afterComic = true; this.nextStep(); });
      if (this.camPlaced) this.tweens.to(this.post.u.wipe, { value: 1 }, 0.35, { ease: Ease.inQuad, onDone: play }); else play();
      return;
    }
    if (st.comic) {
      if (this.G.skipComics || !Comic.ready(st.comic)) { this.afterComic = true; this.nextStep(); return; }
      this.hud.show(false);
      stopMusic();
      const play = () => this.comic.play(st.comic, () => { this.post.u.wipe.value = 0; this.afterComic = true; this.nextStep(); });
      if (this.camPlaced) this.tweens.to(this.post.u.wipe, { value: 1 }, 0.35, { ease: Ease.inQuad, onDone: play }); else play();
      return;
    }
    this.stage = st;
    this.skipDoor = false;   // (a door is skipped only right after the hole / the fall that leads past it)
    this.useSet(st.places ? placeOf(st, this.run.station) : st.set || this.ep.set);
    this.hud.show(true);
    if (st.stage) {
      // a stage through several places (episode 2): which place each stop is in (the step's "places": [set ids]; a stop's id is looked up in them)
      this.setOfStation = null;
      if (st.places) { this.setOfStation = {}; for (const s of st.places) for (const k of Object.keys(C.sets[s]?.stations || {})) this.setOfStation[k] = s; }
      this.stationQ = [...st.stations];
      // resumed at a checkpoint inside the stage (run.station: the results page's retry, or the save's SAVE.eps[ep].cp)
      if (this.run.station && st.stations.includes(this.run.station)) { this.stationQ = st.stations.slice(st.stations.indexOf(this.run.station)); this.resumed = true; this.run.station = null; }
      this.mutated = false;
      if (st.name) this.hud.gl.hold('stage', { name: tr(st.name) });   // can't shoot until the first stop: the stage's warning overlay
      this.goStation(this.stationQ.shift(), false);
    } else if (st.boss) this.goStation(st.station, true);
  }
  station(id) { return C.sets[this.setOfStation?.[id] || this.setId]?.stations?.[id] || this.world.level.set.stations[id]; }
  goStation(id, boss) {
    const S = this.station(id);
    // a checkpoint inside a long stage (episode 2): a retry starts here, and so does the next run from the select screen until it is cleared
    if (S?.cp && !boss) { this.cpStation = id; const r = SAVE.eps[this.ep.id] || (SAVE.eps[this.ep.id] = { open: true, cleared: false, best: null }); r.cp = { step: this.stepIdx, station: id }; persist(); }
    // the boss's stop: the mechanisms the earlier stops of this place fire on their own are done by now (the studio's portraits stand
    // empty even when the run starts at the boss)
    if (boss) for (const a of this.actors) if (a.g?.shoot === false && a.g.station && a.g.station !== id && !a.spent) a.settle();
    this.S = S;
    this.stationId = id;
    this.combat = false;
    if (this.chase.mode === 'block' || this.chase.mode === 'prowl') this.chase.mode = null;
    // the covers fold away first; only then do the girls get up and move on (DESIGN: nobody runs through a cover)
    if (this.hud.gl.holdUI.kind !== 'stage' || !this.hud.gl.holdUI.on) this.hud.gl.hold(boss ? 'boss' : 'move', { name: boss && this.stage.boss ? tr(C.bosses[this.stage.boss]?.name || '') : '' });
    const fold = this.world.dropCovers();
    if (fold) { this.tweens.wait(fold + 0.05, () => this.goStation(id, boss)); return; }
    // episode 2's one long stage (DESIGN 第 2 话: no cuts): this stop is in the next place: through its doorway first (passThrough)
    const sid = this.setOfStation?.[id];
    if (sid && sid !== this.setId && !isLoaded(setKeys(sid))) { loadKeys(setKeys(sid)).then(() => this.goStation(id, boss)); return; }   // (walked on faster than it loaded)
    if (sid && sid !== this.setId && this.camPlaced && !this.afterComic) { this.passThrough(sid, id, boss); return; }
    if (sid && sid !== this.setId) this.useSet(sid);
    if (this.world.plates) {
      // painted stations: push forward into the painting, the next one glides in
      const first = !this.camPlaced || this.afterComic;
      this.camPlaced = true; this.afterComic = false;
      this.post.u.wipe.value = 0;
      this.settleAnomaly(S);
      this.music(boss);
      this.setAll('run');
      this.world.enter(id, first, () => this.arrive(S, boss));
      return;
    }
    // the first stop of a stage (the run's start, or after a comic): the camera is already there and the girls already crouch in their
    // cover (DESIGN「进小关的第一个点直接蹲好」: no running in, no looking at the floor)
    if (!this.camPlaced || this.afterComic) {
      this.camPlaced = true; this.afterComic = false;
      this.post.u.wipe.value = 0;
      this.settleAnomaly(S);
      this.music(boss);
      this.world.place(S.cam, S.look);
      this.setAll('cover'); this.settled = true;
      if (S.enter) { this.enterFrom(S.enter, () => this.arrive(S, boss)); return; }
      this.arrive(S, boss);
      return;
    }
    // episode 2: a stretch run looking back at her (station chase, src/battle/chase.js); arrives at the end of it
    if (S.chase) { this.post.u.wipe.value = 0; this.settleAnomaly(S); this.world.setCovers(S.covers); this.chase.run(S, () => this.arrive(S, boss)); return; }
    // something behind them: the view whips round where they stand (DESIGN「演出」 背后出现敌人)
    if (S.whip) { this.post.u.wipe.value = 0; this.setAll('cover'); this.settled = true; this.whip(S, () => this.arrive(S, boss)); return; }
    const pts = [this.world.camPos.toArray(), ...(S.via || []), S.cam];
    this.post.u.wipe.value = 0;
    // the calm after-school world until the invasion station; invaded from then on
    this.settleAnomaly(S);
    this.music(false);
    this.setAll('run');
    let len = 0;
    for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][2] - pts[k - 1][2]);
    const go = () => this.arrive(S, boss);
    const dur = Math.max(1.6, len / (S.waves?.length ? 6.5 : S.walkSpeed ?? 2.6));   // (a walk-through stretch: slowly, looking round)
    if (pts.length < 2 || len < 0.05) { this.world.place(S.cam, S.look); go(); } else this.world.travel(pts, S.look, dur, go);
    // a plank bridge over a broken floor (docs/DESIGN.md 第 1 话: Sweet Home's planks break after a few steps): it cracks half-way
    // a ghost grabs the view and drags it off to another part of the house (docs/DESIGN.md 第 1 话: Sweet Home's ghosts carry people off)
    if (S.grab) this.grabbed(dur, S.grab);
    if (S.bridge) this.tweens.wait(dur * 0.5, () => {
      sfx.tear(0); sfx.thud(0); this.post.shake(1.3); this.G.stop(0.12);
      this.players.forEach((p) => { this.hud.setFace(p.slot, 'scared', 1.2); p.soft.kick(1.4); });
      this.hud.gl.stickers.say(this.players[Math.random() < 0.5 || !this.p2on() ? 0 : 1], 'bridge');
    });
  }
  // into the next place without a cut (DESIGN 第 2 话): the girls walk into the way on (the far wall's doorway: the set's "exit", a point
  // just inside its darkness; "exitVia" on the way), a blink of black there, and they come out of the next place's doorway (its "entry":
  // { at, look }) and walk on to the stop. Whatever she was doing carries on (src/battle/chase.js keeps her state, not her drawing)
  passThrough(sid, id, boss) {
    const w = this.world, H = w.set.hall || {}, L = this.station(id)?.leave || {}, X = L.exit || w.set.exit || [w.camPos.x, 1.1, (H.z1 ?? -10) - 0.5];
    const pts = [w.camPos.toArray(), ...(L.via || w.set.exitVia || []), X];
    if (L.hole) {   // (the way on is a hole she cut through the wall: it bursts open first)
      const o = L.hole; w.addHole(o.on, new THREE.Vector3(o.x ?? 0, o.y ?? 1.1, o.z ?? 0), o.size ?? 2.4);
      sound('woodBreak') || sfx.slam(); sound('shoji'); this.post.shake(1.2); this.fx.confetti(new THREE.Vector3(o.x ?? 0, o.y ?? 1.1, o.z ?? 0), 30, 2.2);
    }
    let len = 0; for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][2] - pts[k - 1][2]);
    this.setAll('run'); this.combat = false;
    const go = () => this.blackout(true, () => {
      this.useSet(sid);
      const N = this.world.set, NH = N.hall || {}, E = this.station(id)?.arrive || N.entry || { at: [0, 1.1, (NH.z0 ?? 5) - 0.2], look: [0, 1.0, (NH.z1 ?? -10)] };
      this.world.place(E.at, E.look); this.camPlaced = true; this.afterComic = false;
      this.blackout(false); this.goStation(id, boss);
    });
    if (len < 0.1) go(); else w.travel(pts, [X[0], X[1], X[2] - 6], Math.max(1.1, len / 3.2), go);
  }
  // the recorded tracks (content audio/sounds.json music) are named <episode>_stage / <episode>_boss unless the set names its own (music,
  // bossMusic; music null = only the clocks); without a recording, the synthesized loops
  music(boss) {
    const set = this.world.set || {}, ep = this.ep?.id, name = boss ? set.bossMusic ?? `${ep}_boss` : set.music !== undefined ? set.music : `${ep}_stage`;
    if (this.chase?.theme) return;   // (her theme plays while she is about: src/battle/chase.js)
    if (!name) { stopMusic(1.2); return; }
    playMusic(C.sounds?.music?.[name] ? name : boss ? 'boss' : 'stage');
  }
  // a blink of black (through a doorway): in, then(), out
  blackout(on, then) {
    let el = document.querySelector('#ui .blackout');
    if (!el) { el = document.createElement('div'); el.className = 'blackout'; document.getElementById('ui').appendChild(el); }
    el.classList.toggle('on', on);
    if (then) setTimeout(then, on ? 260 : 0);
  }
  // the prologue: the calm after-school world until the invasion station, invaded from then on. A set that turns between real and rotten
  // ("turns", docs/DESIGN.md 第 1 话) keeps whatever it is; its stations and waves turn it (turn)
  settleAnomaly(S) {
    // (a stop that knows how its place looks by then, station "state": 0 calm / 1 turned: a run resumed there from a checkpoint)
    if (this.world.set?.turns) { if (S.state != null && (this.resumed || this.justBuilt)) { this.world.anomaly = S.state; this.world.grade?.(S.state); } this.justBuilt = false; return; }
    if (S.invade) this.world.anomaly = 0; else if (this.world.anomaly < 1) this.world.anomaly = 1;
  }
  // the place turns: to 1 = the rotten version of every board that has one, 0 = back to the real place; a page-flip wave running out from
  // spec.from (world point, default where the set's anomaly starts), over spec.dur seconds; spec.hit = it strikes (flash, shake, slam)
  turn(spec, then) {
    const w = this.world, to = spec.to ?? 1;
    if (!w.turnFrom) { w.anomaly = to; then && then(); return; }
    w.turnFrom(spec.from || w.set.anomalyFrom, to < (w.anomaly ?? 1) ? -1 : 1);
    if (spec.hit) { sfx.slam(); this.post.flash(0.7, to > 0.5 ? 0xffa040 : 0xfff2d0); this.post.shake(1); }
    sfx.tear(0);
    this.tweens.to(w, { anomaly: to }, spec.dur ?? 1.6, { ease: Ease.inOutCubic, onDone: () => {
      // one of the girls reacts: the place rotted / came back (text/stickers.json rot / real)
      const p = this.players[this.p2on() && Math.random() < 0.5 ? 1 : 0];
      if (p && p.state !== 'down') this.hud.gl.stickers.say(p, to > 0.5 ? 'rot' : 'real', 0.8);
      then && then();
    } });
  }
  // the turning-around scare (docs/DESIGN.md 第 1 话 ⑰, Sweet Home's ending, Resident Evil's first zombie): a monster crouched with its back
  // turned, eating; the view creeps in on it (a slow zoom, no music), one of the girls asks what it is doing, it stops, slowly turns its
  // head and faces them -> the fight starts, with it. Station { scare: { type, sprite, x, z, who: which girl asks (slot), zoom } }
  scare(sp, then) {
    const w = this.world, e = this.spawnEnemy({ type: sp.type, sprite: sp.sprite, x: sp.x ?? 0, z: sp.z, from: 'scare' });
    stopMusic();
    this.tweens.to(w, { fovKick: -(sp.zoom ?? 16) }, 3.6, { ease: Ease.inOutSine });
    this.tweens.wait(2.4, () => this.hud.gl.stickers.say(this.players[sp.who ?? 1] && this.p2on() ? this.players[sp.who ?? 1] : this.players[0], 'scare'));
    this.tweens.wait(3.8, () => e.turnAround((k) => {
      if (k === 'face') {
        sfx.madness(); this.post.flash(0.45, 0xffffff); this.post.shake(0.9);
        this.tweens.to(w, { fovKick: 0 }, 0.3, { ease: Ease.outBack });
        this.players.forEach((p) => { this.hud.setFace(p.slot, 'scared', 1.4); p.soft.kick(1.4); });
      } else { playMusic('stage'); this.combat = true; then && then(); }
    }));
  }
  // a stage that starts with the view arriving from somewhere (station "enter": { from: [dx, dy, dz] offset the camera starts at, dur,
  // shake, overlay: a picture over the screen meanwhile, e.g. a paw hauling the view up out of a pit; docs/DESIGN.md 第 1 话 ⑦)
  enterFrom(E, then) {
    const w = this.world, to = w.camPos.clone(), d = E.from || [0, 4, 0], dur = E.dur ?? 0.8;
    w.camPos.set(to.x + d[0], to.y + d[1], to.z + d[2]);
    let el = null;
    if (E.overlay) {
      el = document.createElement('img'); el.className = d[1] < 0 ? 'haul' : 'grab'; el.src = url(E.overlay);
      el.style.animationDuration = dur + 0.6 + 's'; document.getElementById('ui').appendChild(el);
    }
    if (E.sfx && sfx[E.sfx]) sfx[E.sfx](0); else sfx.whoosh(0);
    this.tweens.wait(E.overlay ? 0.6 : 0, () => this.tweens.to(w.camPos, { x: to.x, y: to.y, z: to.z }, dur, { ease: d[1] > 0 ? Ease.inQuad : Ease.outCubic, onDone: () => {
      if (E.shake) { this.post.shake(E.shake); sfx.thud(0); this.players.forEach((p) => p.soft.kick(1.4)); }
      if (el) el.remove();
      then();
    } }));
  }
  // 背后 (station whip): a growl, a shake, one of them asks "behind…?", and the view whips round to the station's look
  whip(S, then) {
    const w = this.world, c = w.camPos.clone(), from = w.lookAt.clone(), to = new THREE.Vector3(...S.look);
    sfx.roar(); this.post.shake(0.8); this.hud.gl.hold('behind');
    this.players.forEach((p) => { this.hud.setFace(p.slot, 'scared', 1.4); p.soft.kick(1.2); });
    this.hud.gl.stickers.say(this.players[this.p2on() && Math.random() < 0.5 ? 1 : 0], 'scare');
    const a0 = Math.atan2(from.x - c.x, from.z - c.z), d0 = Math.hypot(from.x - c.x, from.z - c.z), d1 = Math.hypot(to.x - c.x, to.z - c.z);
    let a1 = Math.atan2(to.x - c.x, to.z - c.z);
    while (a1 - a0 > Math.PI) a1 -= Math.PI * 2;
    while (a1 - a0 < -Math.PI) a1 += Math.PI * 2;
    this.tweens.wait(0.9, () => {
      sfx.whoosh(0); this.post.flash(0.2, 0xffffff);
      this.tweens.run(0.5, (e) => { const a = a0 + (a1 - a0) * e, d = d0 + (d1 - d0) * e; w.lookAt.set(c.x + Math.sin(a) * d, from.y + (to.y - from.y) * e, c.z + Math.cos(a) * d); w.fovKick = Math.sin(e * Math.PI) * 14; },
        { ease: Ease.inOutCubic, onDone: () => { w.fovKick = 0; w.place(S.cam, S.look); then(); } });
    });
  }
  // 塌方 (wave event collapse): mid-fight the floor gives way; everything falls; the stage ends here and the next one starts below
  collapse() {
    this.combat = false; this.waveLive = false; this.waveEvents = [];
    this.clearProjectiles();
    this.players.forEach((p) => { if (p.activeOn) p.endActive(false); this.hud.setFace(p.slot, 'scared', 2.5); p.soft.kick(1.6); });
    this.hud.gl.stickers.say(this.players[this.p2on() && Math.random() < 0.5 ? 1 : 0], 'bridge');
    for (const a of this.actors) if (a.alive && (a instanceof Enemy || a.phantom)) {
      a.alive = false; a.endWindup?.(); this.etw.kill(a.root.position);
      this.tweens.to(a.root.position, { y: -8 }, 1.2, { delay: 0.2 + Math.random() * 0.4, ease: Ease.inQuad, onDone: () => a.dispose() });
    }
    if (this.setOfStation && this.stationQ.length) {   // (a stage through several places: they land in the next one, its first stop's enter)
      const on = () => this.blackout(true, () => { this.camPlaced = false; this.blackout(false); this.goStation(this.stationQ.shift(), false); });
      if (this.world.collapse) this.world.collapse(on); else on();
      return;
    }
    this.stationQ = [];
    this.openNextStage();
    const go = () => { this.skipDoor = true; this.tweens.to(this.post.u.wipe, { value: 1 }, 0.25, { onDone: () => { this.afterComic = true; this.nextStep(); } }); };
    if (this.world.collapse) this.world.collapse(go); else go();
  }
  // what to do with a mechanism: the small see-through tag at the top for a few seconds (never over the fight: DESIGN「不能射击的阶段的提示」)
  hint(key) { this.hud.gl.hold('hint', { text: t(key), dur: 4.5 }); }
  // a spawner's hole got blocked (Gimmick topple)
  sealSpawner(id) {
    const s = (this.spawners || []).find((x) => x.id === id && x.live); if (!s) return;
    s.live = false; sfx.clear(); this.hud.gl.stickers.say(this.players[0], 'stagger');
  }
  // a spawner (DESIGN「地形和机关」): monsters keep coming until it is stopped - from a hole in a side wall (from 'wall', the hole drawn by
  // the set: hall.holes) or up out of the floor (from 'burrow', anywhere across the room about z); every s, times faster after each
  // (down to min); until: 'gate' = it stops when the drawbridge comes down; else a topple { seal: id } stops it. sealAfter: kills before
  // the thing that stops it can be shot (then the hint); remind: s between reminders of what to shoot
  updateSpawners(dt) {
    for (const s of this.spawners || []) {
      if (!s.live) continue;
      if (s.until === 'gate' && this.world.gate?.open) { s.live = false; continue; }
      if (s.remind && (s.remindT = (s.remindT ?? s.remind) - dt) <= 0) { s.remindT = s.remind; if (s.ready !== false) this.hint(s.hint || 'sealHint'); }
      if ((s.timer -= dt) > 0) continue;
      s.timer = s.every ?? 3;
      if (s.faster) s.every = Math.max(s.min ?? 1, (s.every ?? 3) * s.faster);
      const Hd = this.world.set?.hall, from = s.from || 'wall';
      const x = from === 'wall' ? (Hd ? (s.side < 0 ? Hd.x0 + 1.2 : Hd.x1 - 1.2) : s.side * 1.5) : Hd ? Hd.x0 + 0.6 + Math.random() * (Hd.x1 - Hd.x0 - 1.2) : 0;
      const z = s.z + (from === 'wall' ? 0 : (Math.random() - 0.5) * (s.spreadZ ?? 2));
      this.spawnEnemy({ type: pick([].concat(s.type)), x, z, from, side: s.side, hole: !!s.hole && s.n === 0, holeY: s.holeY, holeSize: s.holeSize, near: true });
      s.n++;
    }
  }
  // a monster broke out through the far wall (Enemy.breakOut): when this room is done, the girls go through that hole, not the door
  breakoutAt(x, z) { this.exitVia = { to: [x, 1.1, z + 1.4], look: [x, 1.0, z - 10], hole: true }; }
  // the ghost's hands: over the screen while the view is dragged away (grab = the hands picture, or true for the default one)
  grabbed(dur, pic) {
    const el = document.createElement('img');
    el.className = 'grab'; el.src = url(typeof pic === 'string' ? pic : 'ep1/hands_a');
    el.style.animationDuration = dur + 's';
    document.getElementById('ui').appendChild(el);
    sfx.dollScreech(0); sfx.whoosh(0); this.post.flash(0.4, 0xffe0c0);
    const w = this.world;
    this.tweens.run(dur, (k) => { w.fovKick = Math.sin(k * Math.PI) * 14 * Math.sin(k * 40); this.post.shake(0.25); }, { onDone: () => { w.fovKick = 0; el.remove(); } });
    this.players.forEach((p) => this.hud.setFace(p.slot, 'scared', dur));
  }
  // everyone runs to the next stop; a downed 2P gets back up for it
  setAll(state) {
    for (const p of this.players) {
      if (p.slot && !this.p2on()) continue;
      if (p.state === 'down') p.hp = Math.max(p.hp, p.maxHp * 0.4);
      p.state = state;
    }
  }

  arrive(S, boss) {
    this.world.setCovers(S.covers);
    // episode 2: a hiding place (station hide): she comes, the forced stabs, then on (src/battle/chase.js)
    if (S.hide) { this.enterCover(null, true); this.tweens.wait(0.3, () => this.chase.hide(S, () => this.onward(S))); return; }
    // a stretch they only walk through (no waves: a corridor between two places, DESIGN「门和小关的衔接」): a line or a sound on the way, on
    if (S.swap) for (const [from, to] of Object.entries(S.swap)) this.world.swapBoard?.(from, to);   // (a wall that has changed: the burnt altar)
    if (S.fire) for (const gid of S.fire) this.actors.find((a) => a.g?.id === gid && !a.spent)?.fire();
    if (S.music !== undefined) S.music ? playMusic(S.music) : stopMusic(1.2);
    if (!boss && !S.waves?.length) {
      if (S.sfx) { if (sfx[S.sfx]) sfx[S.sfx](0); else sound(S.sfx); }
      this.tweens.wait(S.pause ?? 0.5, () => {
        if (S.say) this.hud.gl.stickers.say(this.players[this.p2on() && Math.random() < 0.5 ? 1 : 0], S.say);
        this.onward(S);
      });
      return;
    }
    if (boss) this.spawnBoss(this.stage.boss);
    // the place itself changes (panel stages): the corridor bends up, the floor folds into ridges, then the fight starts
    if (S.fold && this.world.fold) { this.hud.gl.hold('fold'); this.enterCover(null, true); this.world.fold(() => { this.combat = true; this.beginStation(); }); return; }
    // the boss: a warning while she shows herself, then the fight
    if (boss) { this.hud.gl.hold('boss', { name: this.boss ? tr(this.boss.name) : '' }); this.enterCover(null, true); this.tweens.wait(2.2, () => this.teach(S.lesson, () => { this.combat = true; })); return; }
    if (S.scare) { this.enterCover(null, true); this.scare(S.scare, () => this.beginStation()); return; }
    if (S.invade && this.world.anomaly < 1) { this.enterCover(null, true); this.tweens.wait(1.6, () => this.invade(() => this.beginStation())); return; }
    if (S.turn) { this.enterCover(null, true); this.tweens.wait(S.turn.wait ?? 0.6, () => this.turn(S.turn, () => this.enterCover(() => this.beginStation()))); return; }
    this.enterCover(() => { if (!boss) this.beginStation(); });
  }
  // on from a stop with no fight of its own (a walk-through, the end of a chase, a hiding place): the next stop, or the stage's end
  onward(S) {
    if (this.stationQ.length) this.goStation(this.stationQ.shift(), false);
    else { this.combat = true; this.waveLive = true; this.pendingSpawns = 0; this.waveIndex = 0; this.S = { ...S, waves: [[]] }; }   // (the stage's end: as if cleared)
  }
  // the evil god breaks into the calm after-school world: a hit, the paper world tears, the light turns wrong, desks float up
  invade(then) {
    const w = this.world;
    sfx.slam(); sfx.madness();
    this.G.stop(0.25);
    this.post.flash(0.9, 0xff3aa0);
    this.post.shake(1.4);
    this.hud.gl.hold('invade');
    this.players.forEach((p) => { this.hud.setFace(p.slot, 'scared', 1.6); p.soft.kick(1.6); });
    this.tweens.to(w, { anomaly: 1 }, 1.8, { ease: Ease.outCubic });
    this.tweens.wait(0.5, () => { sfx.tear(0); this.post.shake(0.8); });
    this.tweens.wait(2.0, () => { this.combat = true; then && then(); });
  }
  // a comic page in the middle of a fight (the boss transforming): the fight stops, the page plays over the wipe, the girls are back in
  // cover after it; then() goes on (the boss turns the fight back on when she is ready)
  interlude(id, then) {
    this.combat = false;
    this.clearProjectiles();
    this.players.forEach((p) => { if (p.activeOn) p.endActive(false); });
    const back = () => { this.post.u.wipe.value = 0; this.hud.show(true); this.enterCover(null, true); then && then(); };
    if (!id || this.G.skipComics || !Comic.ready(id)) { back(); return; }
    this.tweens.to(this.post.u.wipe, { value: 1 }, 0.35, { ease: Ease.inQuad, onDone: () => { this.hud.show(false); this.comic.play(id, back); } });
  }
  // calm: take places but keep combat off (the world hasn't been invaded yet)
  enterCover(then, calm = false) {
    const settled = this.settled; this.settled = false;   // (already crouching there: no drop-in)
    this.players.forEach((p, i) => {
      if (i && !this.p2on()) return;
      p.state = 'cover';
      if (settled) { p.y0 = 0; return; }
      p.y0 = -this.H * 0.5;
      p.soft.kick(1.2);
      this.tweens.to(p, { y0: 0 }, 0.4, { ease: Ease.outBack, delay: 0.1 + i * 0.08 });
    });
    this.tweens.wait(0.55, () => { if (calm) return; this.combat = true; then && then(); });
  }
  // the fight at a stop starts; a stop with a lesson (the prologue teaches: docs/DESIGN.md 序章) first shows its card, once
  beginStation() {
    this.waveIndex = 0; this.spawners = []; this.gateHint = false;
    if (this.S.hint) this.tweens.wait(1.2, () => this.hint(this.S.hint));   // (a dark room: light the lamps)
    if (this.S.block) this.chase.block(this.S);   // (episode 2: the way blocked while she comes up behind)
    if (this.S.dial) this.chase.dial(this.S);     // (episode 2: the bell tower's clock face, the last fight)
    if (this.S.she) this.chase.prowl(this.S);     // (episode 2: she prowls this fighting stop)
    this.teach(this.S.lesson, () => this.startWave());
  }
  teach(id, then) {
    if (!id || SAVE.lessons?.[id] || this.G.auto) { then(); return; }
    const was = this.combat; this.combat = false;
    if (id === 'skill') this.players.forEach((p) => { p.charge = 1; });   // (that lesson: try one right away)
    this.hud.lesson(id, (shown = true) => {
      if (shown) { (SAVE.lessons || (SAVE.lessons = {}))[id] = true; persist(); }
      this.combat = was || this.combat; then();
    });
  }
  startWave() {
    const wave = this.S.waves[this.waveIndex];
    // a wave lists monsters, and may list things that happen at a time { t, ... } or once so many of this wave's monsters are dead
    // { kills: n, ... }: turn: {...} the place turns real / rotten; mutate: true every monster still standing becomes its full self
    // (enemies.json mutatesTo); gimmick: id fires that mechanism of the set (a portrait empties)
    // count: n = that many of it, spread across the room a beat apart (a swarm: DESIGN「怪的行为要多样」 成群飞的)
    const spawns = wave.filter((s) => s.type).flatMap((s) => !s.count ? [s] : Array.from({ length: s.count }, (_, i) => ({ ...s, count: undefined,
      t: (s.t || 0) + i * (s.every ?? 0.18), x: (s.x || 0) + (i - (s.count - 1) / 2) * (s.spread ?? 4.4) / Math.max(1, s.count - 1) + (Math.random() - 0.5) * 0.4,
      y: s.y != null ? s.y + (Math.random() - 0.5) * 0.8 : undefined })));
    this.pendingSpawns = spawns.length;
    this.waveLive = true; this.waveKills = 0;
    for (const s of spawns) this.etw.wait(s.t + T.combat.spawnDelay, () => { if (!this.combat) return; this.spawnEnemy(s); this.pendingSpawns--; });
    this.waveEvents = wave.filter((e) => !e.type && e.kills);
    for (const e of wave) if (!e.type && !e.kills) this.etw.wait(e.t || 0, () => this.combat && this.waveEvent(e));
  }
  waveEvent(e) {
    if (e.turn) this.turn(e.turn);
    if (e.mutate) this.mutateAll();
    if (e.gimmick) this.actors.find((a) => a.g?.id === e.gimmick && !a.spent)?.fire();
    if (e.collapse) { this.collapse(); return; }
    if (e.hint) this.hint(e.hint);
    if (e.sound) sound(e.sound);
    // a hole in a side wall that keeps pouring monsters out until something is toppled onto it (DESIGN「地形和机关」 堵住出怪口):
    // { spawner: { id, type: [kinds], side, z, every } }; the wave does not end while it runs (checkWave)
    if (e.spawner) this.spawners.push({ ...e.spawner, live: true, timer: e.spawner.first ?? 0.4, n: 0, kills: 0, ready: e.spawner.sealAfter ? false : true });
    if (e.wake) {   // statues come to life (all, or so many of them, nearest first)
      const st = this.actors.filter((a) => a.alive && a.state === 'statue').sort((a, b) => a.distToCam() - b.distToCam());
      st.slice(0, e.wake === true ? st.length : e.wake).forEach((a, i) => this.etw.wait(i * 0.5, () => a.wake()));
    }
  }
  // the house turns and what is left of the small things turns with it: each becomes its full self where it stands (a flash, a puff)
  mutateAll() {
    for (const a of [...this.actors]) {
      if (!a.alive || !a.def?.mutatesTo || a instanceof Projectile) continue;
      const P = a.root.position, to = a.def.mutatesTo;
      this.fx.puff(P, 8, COL.pink, 1.2); this.fx.star(a.center(), 1.4, COL.pink);
      a.alive = false; a.endWindup?.(); a.dispose();
      this.pendingSpawns++;
      this.etw.wait(0.15, () => { this.spawnEnemy({ type: to, x: P.x, z: P.z, near: true }); this.pendingSpawns--; });
    }
    this.mutated = true;   // (and whatever of the wave is still to come comes as its full self: spawnEnemy)
    sfx.madness(); this.post.flash(0.5, 0xff8ab0);
  }
  checkWave() {
    if (!this.waveLive || this.pendingSpawns > 0) return;
    if (this.spawners?.some((s) => s.live)) return;
    // episode 2: the things blocking the way (gimmicks with block: true) must all be gone too
    if (this.S.block && this.actors.some((a) => a.g?.block && (!a.g.station || a.g.station === this.stationId) && !a.spent)) return;
    if (this.S.dial && !this.chase.sentOff) return;   // (the last fight: over when the bell has sent her off)
    // no idle gaps (user 2026-10-18): a wave that is not the last one hands over to the next while its last few (combat.waveCarry) are still
    // up; the last wave of a stop is fought to the end
    const left = this.actors.filter((a) => a.alive && !(a instanceof Projectile) && !a.prop && !a.phantom && !a.stalker).length;
    const last = this.waveIndex >= this.S.waves.length - 1;
    if (left > (last ? 0 : T.combat.waveCarry ?? 0)) return;
    if (!last && left && this.waveEvents?.length) return;   // (this wave's kill-events still to come: it finishes first)
    // the way on still shut (a drawbridge held by seals): the fight goes on until it is worked
    if (this.waveIndex >= this.S.waves.length - 1 && !this.stationQ.length && this.world.gate && !this.world.gate.open) {
      if (!this.gateHint) { this.gateHint = true; this.hint('gateHint'); }
      return;
    }
    this.waveLive = false;
    this.waveIndex++;
    if (this.ep.sandbox && this.waveIndex >= this.S.waves.length) { this.waveIndex = 0; this.etw.wait(T.combat.waveGap, () => this.combat && this.startWave()); return; }   // (the sound sandbox: they keep coming)
    if (this.waveIndex < this.S.waves.length) { this.etw.wait(left ? 0.2 : T.combat.waveGap, () => this.combat && this.startWave()); return; }
    this.combat = false;
    this.clearProjectiles();
    sfx.clear();
    this.players.forEach((p) => { p.tauntT = 1.1; if (p.activeOn) p.endActive(false); });
    if (this.stationQ.length) {
      this.hud.gl.hold('clear');
      this.tweens.wait(1.3, () => this.goStation(this.stationQ.shift(), false));
    } else {
      this.hud.gl.hold('stageClear');
      this.openNextStage();
      const heal = bagFx(this.run.bag).stageHeal;
      if (heal) this.players.forEach((p) => { if (p.state !== 'away') { p.heal(heal); this.hud.healPop(p.slot, heal); } });
      // the room is done: the girls walk up to its door before the next step (a door close-up) (station "exit": { via, to, look })
      // (or through the hole a monster broke in the far wall: they follow it, and the door after this room is skipped)
      const X = this.exitVia || this.S.exit, hole = !!this.exitVia?.hole;
      this.exitVia = null;
      if (X && this.world.travel) {
        this.tweens.wait(1.2, () => {
          this.world.dropCovers?.(); this.setAll('run');
          const pts = [this.world.camPos.toArray(), ...(X.via || []), X.to], len = pts.reduce((a, q, i) => a + (i ? Math.hypot(q[0] - pts[i - 1][0], q[2] - pts[i - 1][2]) : 0), 0);
          this.world.travel(pts, X.look || [X.to[0], X.to[1], X.to[2] - 10], Math.max(1.4, len / 5.5), () => {
            if (hole) { this.skipDoor = true; this.tweens.to(this.post.u.wipe, { value: 1 }, 0.3, { onDone: () => { this.afterComic = true; this.nextStep(); } }); return; }
            this.setAll('cover'); this.tweens.wait(0.4, () => this.nextStep());
          });
        });
      } else this.tweens.wait(1.7, () => this.nextStep());
    }
  }
  spawnBoss(id) {
    this.clearActors();
    const def = C.bosses[id], B = BOSSES[def?.beh];
    if (!B) { console.warn('unknown boss', id); this.onBossDead(); return; }
    this.boss = new B(this, def); this.boss.id = id;   // (its lines: text/stickers.json bosses.<id>)
    this.actors.push(this.boss);
    playMusic('boss');
    this.hud.boss(tr(this.boss.name), 1);
    sfx.roar();
    this.post.shake(1);
  }
  // this stage is cleared: the next one opens on the select screen (stages = the episode's played steps, in order)
  openNextStage() {
    const stages = this.ep.steps.filter(isStage), i = stages.indexOf(this.ep.steps[this.stepIdx]);
    if (i >= 0) openStage(this.ep.id, i + 2);
  }
  onBossDead() {
    this.openNextStage();
    this.combat = false;
    this.hud.boss(null);
    this.clearProjectiles();
    this.players.forEach((p) => { if (p.activeOn) p.endActive(false); });
    this.tweens.wait(3.4, () => {
      stopMusic();
      sfx.victory();
      this.setAll('victory');
      this.tweens.wait(1.4, () => this.nextStep());
    });
  }
  gameOver() {
    this.combat = false;
    stopMusic();
    sfx.defeat();
    this.players[0].state = 'down';
    const st = this.stats(false);
    this.applyRewards(st);
    this.tweens.to(this.post.u.wipe, { value: 1 }, 1.2, { delay: 0.6, ease: Ease.inQuad, onDone: () => this.G.showResults(st) });
  }
  finish() {
    stopMusic();
    const st = this.stats(true);
    this.applyRewards(st);
    this.G.showResults(st);
  }
  stats(win) {
    const ps = this.players.filter((p, i) => i === 0 || this.p2on());
    const shots = ps.reduce((a, p) => a + p.shots, 0), hits = ps.reduce((a, p) => a + p.hits, 0);
    const p1 = this.players[0];
    const st = {
      win, ep: this.ep.id, kills: this.kills, acc: shots ? hits / shots : 0, combo: this.maxCombo, time: this.playT, checkpoint: this.checkpoint, cpStation: this.cpStation,
      taken: p1.taken, team: this.run.team, bag: this.run.bag,
      players: ps.map((p) => ({ id: p.id, kills: p.kills, dealt: Math.round(p.dealt), acc: p.shots ? p.hits / p.shots : 0 })),
    };
    return st;
  }
  // 伍德刀盾 + 历战值 (mastery XP); no rating (DESIGN 局外「不做评级」): a clear pays a fixed amount and the kills, the best full-clear time
  // is kept; a girl already at the top level turns her XP into extra 伍德刀盾 (满破追加); only the FIRST clear gives the episode's
  // reward items (ones she does not have yet: st.newItems) and opens the next episodes (ones not open yet: st.unlocked), so a replay
  // shows neither. Each 伍德刀盾 multiplier is kept with the item it comes from (st.mulBy: the results page names it). Applied to the
  // save right away; st carries every number for the results screen.
  applyRewards(st) {
    const E = T.economy;
    const rec = SAVE.eps[this.ep.id] || (SAVE.eps[this.ep.id] = { open: true, cleared: false, best: null });
    st.firstClear = st.win && !rec.cleared && !this.ep.debug;
    st.base = st.win ? E.clearDd + st.kills * E.winDdPerKill : st.kills * E.lossDdPerKill;
    st.first = st.firstClear ? E.firstClearDd : 0;
    st.xp = {}; st.unlocked = []; st.bonus = 0;
    // every time a player's girl went down this run (not the AI's) takes deathCut off the 伍德刀盾 and the 历战值, at most deathMax times
    // (user 2026-10-19: dying a lot still gets half)
    st.deaths = this.deaths || 0; st.deathK = 1 - (E.deathCut ?? 0.1) * Math.min(E.deathMax ?? 5, st.deaths);
    if (this.ep.debug) { st.dd = 0; return; }
    for (const id of new Set(st.team)) {
      const c = SAVE.chars[id], gain = Math.round((st.win ? E.winXp + st.kills * E.winXpPerKill : st.kills * E.lossXpPerKill) * st.deathK);
      const before = levelOf(c.xp), top = before >= maxLv();
      st.xp[id] = { gain, before, after: levelOf(c.xp + gain), xp0: c.xp, xp: c.xp + gain, top, bonus: top ? Math.round(gain * E.maxXpDd) : 0 };
      if (top) st.bonus += st.xp[id].bonus; else c.xp += gain;
    }
    st.newItems = [];
    if (st.firstClear) for (const id of [].concat(this.ep.reward?.items || this.ep.reward?.item || [])) {   // (given before the multiplier: it counts at once)
      if (!C.items[id] || SAVE.items.includes(id)) continue;
      giveItem(id); st.newItems.push(id);
      if (!SAVE.bag.includes(id)) { SAVE.bag.push(id); this.run.bag = [...this.run.bag, id]; }
    }
    // a chapter can give an outfit (episode 2: the yukata, user 2026-10-18): both girls can wear it from then on, in any chapter
    st.newOutfits = [];
    if (st.firstClear) for (const o of [].concat(this.ep.reward?.outfits || [])) if (!SAVE.outfits.includes(o)) { SAVE.outfits.push(o); st.newOutfits.push(o); }
    st.mul = bagFx(this.run.bag).dd;
    st.mulBy = this.run.bag.map((id) => ({ id, dd: bagFx([id]).dd })).filter((m) => m.dd !== 1);
    st.dd = Math.round((st.base + st.first + st.bonus) * st.mul * st.deathK);
    SAVE.dd += st.dd;
    if (st.win) {
      rec.cleared = true; delete rec.cp;
      st.bestBefore = rec.bestTime ?? null;
      if (rec.bestTime == null || st.time < rec.bestTime) { rec.bestTime = st.time; st.newRecord = st.bestBefore != null; }
      st.bestTime = rec.bestTime;
      for (const id of this.ep.unlocks || []) if (!SAVE.eps[id]?.open) { SAVE.eps[id] = { open: true, cleared: false, best: null }; st.unlocked.push(id); }
    }
    persist();
  }
  clearActors() { for (const a of this.actors) if (!a.removed) a.dispose(); this.actors.length = 0; }
  clearProjectiles() { for (const a of this.actors) if (a instanceof Projectile && a.alive) { a.alive = false; if (a.lock) { a.lock.remove(); a.lock = null; } a.dieShatter({ u: 0.5, v: 0.5 }, 0.6); } }
  dispose() {
    listenerOff();
    this.chase.dispose();
    this.clearActors();
    this.fx.clear();
    this.comic.abort();
    stopMusic();
    this.hud.show(false);
    this.hud.dispose();
    this.players.forEach((p) => { if (p.beam) p.beam.remove(); this.world.camera.remove(p.group); });
  }

  // ------------------------------------------------------------------ spawning / set pieces
  // the place's shootable things (src/battle/gimmick.js): there for the whole set, each live at its own stop
  addGimmicks() { for (const g of this.world.set?.gimmicks || []) this.actors.push(new Gimmick(this, g)); }
  spawnEnemy(s) {
    const to = this.mutated && C.enemies[s.type]?.mutatesTo;   // (after the house has turned: mutateAll)
    const e = new Enemy(this, to ? { ...s, type: to, sprite: undefined } : s); this.actors.push(e); return e;
  }
  spawnProjectile(kind, from, opts) { const p = new Projectile(this, kind, from, opts); this.actors.push(p); return p; }
  // which player an attack goes for: mostly the one on the attacker's side of the screen
  pickTarget(x = 0) {
    if (!this.p2on()) return 0;
    let slot = x > 0.3 ? 1 : x < -0.3 ? 0 : Math.random() < 0.5 ? 0 : 1;
    if (Math.random() < 0.25) slot = 1 - slot;
    const s = this.players[slot].state;
    if (s === 'down' || s === 'away') slot = 1 - slot;
    return slot;
  }

  // ------------------------------------------------------------------ combat queries
  box(a) { let b = this.boxes.get(a); if (!b) { b = a.screenBox(); this.boxes.set(a, b); } return b; }
  hitMeshes() { const out = []; for (const a of this.actors) if (a.alive) out.push(...a.hitMeshes()); if (this.world.breakableMeshes) out.push(...this.world.breakableMeshes()); return out; }   // (breakable props stop shots: PanelWorld)
  // for gamepad aim-assist: the enemy under (x, y), if any
  overTarget(x, y) {
    const m = this.H * 0.02;
    for (const a of this.actors) {
      if (!a.alive || !a.hitMeshes().length) continue;
      const b = this.box(a);
      if (x > b.x0 - m && x < b.x1 + m && y > b.y0 - m && y < b.y1 + m) return { x: (b.x0 + b.x1) / 2, y: b.y0 + (b.y1 - b.y0) * 0.45 };
    }
    return null;
  }
  boxUV(a, sx, sy) {
    const b = this.box(a);
    const cx = clamp(sx, b.x0, b.x1), cy = clamp(sy, b.y0, b.y1);
    let u = (cx - b.x0) / Math.max(1, b.x1 - b.x0), v = 1 - (cy - b.y0) / Math.max(1, b.y1 - b.y0);
    if (alphaAt(a.mesh.userData.texKey, u, v) < 110) { u = 0.5; v = 0.5; if (alphaAt(a.mesh.userData.texKey, u, v) < 110) return null; }
    return { u, v, d: Math.hypot(cx - sx, cy - sy) };
  }
  assist(sx, sy, radius) {
    let best = null, bd = radius;
    for (const a of this.actors) {
      if (!a.alive || !a.hitMeshes().length) continue;
      const uv = this.boxUV(a, sx, sy);
      if (!uv || uv.d > bd) continue;
      best = { a, uv }; bd = uv.d;
    }
    return best;
  }
  // everything the shot passes through, nearest first (up to max)
  targetsAt(sx, sy, radius, max) {
    const w = this.world;
    w.ray.setFromCamera(w.ndc(sx, sy), w.camera);
    const out = [], seen = new Set();
    // things flying at the girls bring their own sight: a shot anywhere inside it shoots them down (DESIGN「要击落的东西自带准星」)
    for (const a of this.actors) {
      if (!(a instanceof Projectile) || !a.alive || !a.sightR) continue;
      if (Math.hypot(sx - a.sightX, sy - a.sightY) > a.sightR) continue;
      seen.add(a); out.push({ a, uv: { u: 0.5, v: 0.5 } });
      if (out.length >= max) return out;
    }
    const wall = w.occluders?.length ? w.ray.intersectObjects(w.occluders, false).find((h) => h.uv && alphaAt(h.object.userData.texKey, h.uv.x, h.uv.y) > 110) : null;
    for (const h of w.ray.intersectObjects(this.hitMeshes(), false)) {
      if (!h.uv) continue;
      if (wall && wall.distance < h.distance) break;
      const mu = h.object.material.uniforms;
      if (mu && mu.sliceOn && mu.sliceOn.value) continue;
      const a = h.object.userData.owner;
      if (seen.has(a) || alphaAt(h.object.userData.texKey, h.uv.x, h.uv.y) <= 110) continue;
      seen.add(a);
      out.push({ a, uv: { u: h.uv.x, v: h.uv.y }, part: h.object });
      if (out.length >= max) break;
    }
    if (!out.length) { const as = this.assist(sx, sy, radius); if (as) out.push(as); }
    return out;
  }

  // One shot from player p at screen (sx, sy). Rifle rounds pierce; mantra hits ramp up on the same target.
  // Crits come from the accuracy Fever plus her mastery (critRate / critMul). Returns { n: targets hit, crit }.
  shoot(p, sx, sy) {
    this.chase.onShot(p);   // (held by her: every pull of the trigger counts toward breaking free)
    const w = p.w;
    const K = T.combat;
    const hits = this.targetsAt(sx, sy, this.H * (p.ctrl?.kind === 'mouse' ? K.aimRadiusMouse : K.aimRadiusPad), 1 + (w.pierce || 0));
    if (!hits.length) {
      // the bullet still lands somewhere — leave a hole in the room
      this.world.ray.setFromCamera(this.world.ndc(sx, sy), this.world.camera);
      const hit = this.world.ray.intersectObject(this.world.level.group, true)
        .find((h) => !h.object.userData.texKey || (h.uv && alphaAt(h.object.userData.texKey, h.uv.x, h.uv.y) > 110));
      if (hit) { this.fx.decal(hit); sfx.miss((sx / this.W - 0.5) * 0.6); }
      p.fever.miss();
      return { n: 0, crit: false };
    }
    let crit = false;
    hits.forEach((tg, i) => {
      if (i === 0) { if (p.focus.a === tg.a && p.focus.t > 0) p.focus.n++; else { p.focus.a = tg.a; p.focus.n = 0; } p.focus.t = K.focusTime; }
      const n = i === 0 ? p.focus.n : 0;
      let dmg = w.dmg * (i ? K.pierceDmgMul : 1) * p.fever.dmgMul;
      if (p.gatling) dmg *= p.a.dmg;
      if (w.ramp) dmg *= 1 + w.ramp * Math.min(n, w.rampMax);
      const c = Math.random() < this.critRate(p);
      if (c) { dmg *= this.critMul(p); crit = true; }
      const stagger = w.stagger * (w.kind === 'rifle' ? 1 + K.rifleStaggerRamp * Math.min(n, K.rifleStaggerRampMax) : 1) * (p.gatling ? p.a.stagger : 1);
      tg.a.hit({ kind: w.kind, dmg, uv: tg.uv, part: tg.part, by: p, crit: c, stagger, stun: w.stun });
    });
    return { n: hits.length, crit };
  }
  critRate(p) { return p.fever.critRate + (p.w.critAdd || 0); }
  critMul(p) { return p.fever.critMul + (p.w.critMulAdd || 0); }
  // Kaburu's beam tick: everything around the aim point along the line of sight takes damage (pierces all).
  beamHit(p, sx, sy, R, dmg) {
    let n = 0;
    for (const a of [...this.actors]) {
      if (!a.alive || !a.hitMeshes().length) continue;
      const uv = this.boxUV(a, sx, sy);
      if (!uv || uv.d > R) continue;
      const c = Math.random() < this.critRate(p);
      a.hit({ kind: 'beam', dmg: dmg * p.fever.dmgMul * (c ? this.critMul(p) : 1), uv, by: p, crit: c, stagger: T.combat.beam.stagger, stun: T.combat.beam.stun });
      n++;
    }
    return n;
  }

  // returns true when nobody got hurt (blocked by cover / missed)
  playerAttacked({ kind, dmg, from, heavy, slot = 0 }) {
    const targets = slot === -1 ? this.players : [this.players[slot] || this.players[0]];
    let hurt = false;
    for (const p of targets) {
      if (!this.combat || ['run', 'away', 'down', 'victory'].includes(p.state) || p.activeOn) continue;   // her special: untouchable
      const cov = this.world.covers[p.slot], through = kind === 'ram' || kind === 'shot' || kind === 'melee';
      const shielded = !through && !p.exposed && !(cov && cov.broken);
      if (shielded) {
        this.coverHit(p, from, heavy);
        if (!heavy || !p.damage(dmg * T.combat.cover.chip)) continue;
      } else if (!p.damage(dmg)) continue;
      hurt = true;
      sfx.hurt();
      if (p.slot === 0) { this.post.u.hurt.value = 1; this.post.kick(2); this.fx.screenInk(heavy ? 12 : 7); } else this.post.u.hurt.value = Math.max(this.post.u.hurt.value, 0.35);
      this.post.shake(p.slot === 0 ? 1 : 0.5);
      this.hud.setFace(p.slot, 'scared', 1.2);
      this.combo = 0;
    }
    if (this.combat && this.allDown()) this.gameOver();
    return !hurt;
  }
  coverHit(p, from, heavy) {
    const cov = this.world.covers[p.slot];
    if (!cov) return;
    const mesh = cov.mesh || cov.m, CV = T.combat.cover;
    if (cov.hp !== undefined && !cov.broken) {
      cov.hp -= heavy ? CV.heavy : CV.hit;
      if (cov.hp <= 0 && this.world.breakCover) { this.world.breakCover(cov); this.hud.gl.stickers.say(p, 'coverBroken'); }
    }
    const s = from && from.center ? this.world.project(from.center()) : { x: this.W * (p.slot ? 0.7 : 0.3) };
    const l = this.world.project(cov.m.localToWorld(new THREE.Vector3(-cov.w / 2, cov.h * 0.6, 0)));
    const r = this.world.project(cov.m.localToWorld(new THREE.Vector3(cov.w / 2, cov.h * 0.6, 0)));
    const u = clamp((s.x - l.x) / Math.max(1, r.x - l.x), 0.08, 0.92), v = 0.45 + Math.random() * 0.4;
    if (from instanceof Projectile && from.kind === 'takoyaki') { cov.dm.cut([[u - 0.12, v + 0.1], [u + 0.12, v - 0.08]], 0.012); sfx.clang(); } else if (heavy) { cov.dm.cut([[0.15, 0.85], [0.85, 0.45]], 0.02); cov.dm.hole(0.5, 0.65, 0.09); } else cov.dm.hole(u, v, 0.05);
    if (mesh.material?.uniforms) mesh.material.uniforms.flash.value = 0.6;
    sfx.coverHit();
    this.post.shake(heavy ? 1.1 : 0.4);
    this.fx.sparks(l.x + u * (r.x - l.x), this.H - l.y, 6, COL.bone, 0.8);
  }

  warnClose() { this.players.forEach((p) => this.hud.setFace(p.slot, 'scared', 0.8)); }
  warnSlam() { this.players.forEach((p) => this.hud.setFace(p.slot, 'scared', 1.0)); }
  onStep(i) { sfx.run(i); }

  onHit(target, kind, info) {
    const by = info?.by;
    if (!by) return;
    const dealt = info.dealt || 0;
    if (dealt) { by.dealt += dealt; by.fever.hit(dealt); }
    // the combo counts every hit (user 2026-10-18: counting kills only, it sat at 0 most of the time with the tougher monsters)
    if (dealt) { this.combo++; this.comboT = T.combat.comboTime; this.comboF = this.combo; this.maxCombo = Math.max(this.maxCombo, this.combo); }
    if (by.a.charge.hit) by.addCharge(by.a.charge.hit);
    if (by.gatling && dealt) by.heal(by.a.heal);
    // every hit shows: one counter per enemy above its head that keeps adding up
    if (dealt && this.hud.gl) this.hud.gl.stickers.hit(by, !!info.crit);
    if (dealt) {
      const b = this.box(target);
      this.hud.dmg(target, (b.x0 + b.x1) / 2, Math.max(this.H * 0.12, b.y0), dealt, !!info.crit, by.c.color);
      hitNote(by.id, !!info.crit, false, ((b.x0 + b.x1) / 2 / this.W - 0.5) * 1.2);   // (a note that plays along: src/core/audio.js)
    }
  }
  onKill(target, how, crit) {
    const by = target.lastHitBy;
    if (target instanceof Projectile) return;
    this.kills++;
    if (by) { const b = this.box(target); hitNote(by.id, !!crit, true, ((b.x0 + b.x1) / 2 / this.W - 0.5) * 1.2); }
    // a spawner whose stopper comes into play after so many kills (the cold store's shelf): from then on it can be shot, and the hint says so
    for (const s of this.spawners || []) if (s.live && s.ready === false && ++s.kills >= s.sealAfter) { s.ready = true; this.hint(s.hint || 'sealHint'); }
    if (this.waveLive && this.waveEvents?.length) {   // wave events waiting for so many kills
      this.waveKills = (this.waveKills || 0) + 1;
      for (const e of this.waveEvents.filter((x) => this.waveKills >= x.kills)) { this.waveEvents.splice(this.waveEvents.indexOf(e), 1); this.waveEvent(e); }
    }
    if (by) { by.kills++; by.fever.kill(); if (by.a.charge.kill) by.addCharge(by.a.charge.kill); }
    this.combo += T.combat.comboKill; this.comboT = T.combat.comboTime; this.comboF = this.combo;   // (a kill: a few more)
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    // every kill: a sound-effect sticker where it was (stickers.js), and now and then a line from the girl who got it
    { const s = this.world.project(target.center()); this.hud.gl.stickers.onoma(s.x, this.H - s.y, crit); }
    if (by) this.hud.gl.stickers.kill(by);
    if (crit && !(by && by.activeOn)) this.G.stop(0.05);
    if (this.combo >= T.combat.tauntCombo && by && by.state === 'cover') by.tauntT = 0.7;
    sfx.viewer();
  }

  // ------------------------------------------------------------------ frame
  update(dt, now, pads = []) {
    this.time = now;
    setListener(this.world.camera);   // (the sounds given a point are heard from the camera: src/core/audio.js)
    if (this.combat) this.playT += dt;
    this.boxes.clear();
    this.world.update(dt, now);
    for (const p of this.players) {
      if (p.slot && !this.p2on()) continue;
      if (p.ctrl) p.ctrl.update(dt, this, pads);
      p.update(dt, now);
    }
    const edt = dt * (T.combat.pace ?? 1);
    this.rdt = dt;
    this.etw.update(edt);
    this.chase.update(dt);
    for (const a of this.actors) a.update(edt, now);
    for (let i = this.actors.length - 1; i >= 0; i--) if (this.actors[i].removed) this.actors.splice(i, 1);
    if (this.combat && !this.boss) { this.updateSpawners(edt); this.checkWave(); }
    this.fx.update(dt, now);
    // the combo holds outside the fight (walks, comics); in it, after comboTime without a hit it slides down, faster and faster
    if (this.combat && this.combo > 0) {
      this.comboT -= dt;
      if (this.comboT < 0) { this.comboF = Math.min(this.comboF ?? this.combo, this.combo) - dt * T.combat.comboDrop * (1 - this.comboT * T.combat.comboAccel); this.combo = Math.max(0, Math.floor(this.comboF)); }
    }
    const active = this.players.some((p) => p.activeOn);
    const mu = this.post.u.madness;
    mu.value += ((active ? 0.22 : 0) - mu.value) * Math.min(1, dt * 3);
    const hid = ['cover', 'reload'].includes(this.players[0].state);
    this.post.u.dim.value += ((hid ? 0.5 : 0) - this.post.u.dim.value) * Math.min(1, dt * 8);
    this.post.u.warn.value = Math.max(0, this.post.u.warn.value - dt * 1.5);
    for (const p of this.players) {
      const E = (p.slot ? this.post.u.edgeB : this.post.u.edgeA).value, col = EDGE_C.set(p.c.color);
      const on = (p.slot === 0 || this.p2on()) && this.combat;
      E.set(col.r, col.g, col.b, on ? Math.min(1.2, (p.edge || 0) + (p.edgePulse || 0) * 0.6) : 0);
    }
    if (this.boss) this.hud.boss(this.boss.alive ? tr(this.boss.name) : null, this.boss.hp / this.boss.maxHp, this.boss.stage, this.boss.phases?.());
    setIntensity(this.combat ? Math.min(1, 0.35 + this.combo * 0.006 + (active ? 0.4 : 0)) : 0.2);
    this.hud.update(dt);
  }

  render(r) {
    // the heroines (layer 1) are drawn over the finished world, so covers, scenery and ink lines never cross them (DESIGN「掩体」)
    const cam = this.world.camera;
    if (this.world.render) this.world.render(r); else { cam.layers.set(0); r.render(this.world.scene, cam); }
    const sc = this.world.scene, bg = sc.background, ac = r.autoClear;
    sc.background = null; r.autoClear = false;   // a background colour would clear the world away
    cam.layers.set(1); r.render(sc, cam); cam.layers.set(0);
    sc.background = bg; r.autoClear = ac;
    r.render(this.overlay, this.ortho);
  }
  renderHUD(r) { r.render(this.hudScene, this.ortho); }

}
