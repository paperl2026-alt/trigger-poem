// A heroine seen from behind, riding with the camera (1P on the left, 2P on the right, NIKKE-style).
// Pose packs are drawn for the left side; on the right they are mirrored. Layout is in screen pixels (origin bottom-left).
// Out of cover while firing (mouse: holding the button) — cover = safe from blockable hits, reloads, drains Fever if you stay.
// Active skills: the gunner's gatling (endless belt, heals on hits), the cat paw's mantra beam (piercing, slow aim, cancel = heal).
// Numbers: content characters/<id>.json (gun, skill, poses), tuning/combat.json "player" + "beam", tuning/layout.json.
import * as THREE from 'three';
import { tex, meta } from '../core/assets.js';
import { paperMesh } from '../core/paper.js';
import { sfx } from '../core/audio.js';
import { buildStats } from './characters.js';
import { Fever } from './fever.js';
import { bagFx } from './items.js';
import { C, T } from '../core/content.js';
import { Soft } from './soft.js';
import { Heroine } from './heroine.js';
import { Muzzle } from './muzzle.js';
import { FEVER_KEYS } from './fever.js';
const AURA = new THREE.Color();

const rnd = (a, b) => a + Math.random() * (b - a);
const rr = (r) => (Array.isArray(r) ? rnd(r[0], r[1]) : r);
const PL = () => T.combat.player;

const MZ = new THREE.Vector3(), HD = new THREE.Vector3();
export class Player {
  constructor(game, charId, slot, prof = { xp: 0, bag: [] }) {
    this.game = game;
    this.id = charId;
    this.c = C.characters[charId];
    this.slot = slot;           // 0 = 1P (left), 1 = 2P (right)
    this.side = slot ? 1 : -1;
    this.mirror = this.mirror0 = (slot === 1) !== (this.c.drawnSide === 'right');
    const st = buildStats(charId, prof.xp, prof.bag);
    this.w = st.w; this.a = st.a; this.lv = st.lv;
    this.maxHp = st.hp; this.hp = this.maxHp;
    const fx = bagFx(prof.bag);
    this.fever = new Fever(this.w, { slowDecay: fx.feverDecay, startLv: fx.feverStart });
    this.group = new THREE.Group();
    game.world.camera.add(this.group);
    this.poses = {};
    // the jiggle heroine (two stills + procedural motion) when the character has a rig; the old pose-sprite pack otherwise
    this.hero = this.c.rig ? new Heroine(game, this) : null;
    for (const [role, key] of Object.entries(this.hero ? {} : this.c.poses)) {
      if (!tex[key]) continue;
      const m = paperMesh(tex[key], 1, { pivot: 'bottom', segs: [18, 30] });
      m.visible = false;
      m.renderOrder = 10 + slot;
      m.material.uniforms.useFog.value = 0;
      m.material.depthTest = false;
      m.userData.rawH = meta[key].rawH || 1000;
      m.userData.key = key;
      this.poses[role] = m;
      this.group.add(m);
    }
    this.soft = this.hero || new Soft(this);
    // her own layer: drawn after the world and its ink lines (Game.render), so nothing in the scene ever crosses her
    this.group.traverse((o) => o.layers.set(1));
    this.pose = 'cover';
    this.muzzle = new Muzzle(game, this);   // the shot at her gun / paw: painted flash + shader + glow + ring + particles (muzzle.js)
    this.ammo = this.w.mag;
    this.charge = 0; this.activeT = 0; this.beamGrace = 0; this.beam = null; this.beamTick = 0;
    this.state = 'away'; // cover | out | reload | hurt | down | run | victory | away
    this.exposed = false;
    this.linger = 0; this.coverTime = 0; this.reloadT = 0; this.reloadT0 = 1; this.fireCD = 0; this.hurtT = 0; this.invuln = 0; this.downT = 0;
    this.kick = 0; this.pop = 1; this.recoilT = 0; this.peekT = rr(PL().peekEvery); this.tauntT = 0; this.glyphI = 0;
    this.shots = 0; this.hits = 0; this.kills = 0; this.dealt = 0; this.taken = 0;
    this.focus = { a: null, n: 0, t: 0 };
    this.aimX = game.W * (slot ? 0.62 : 0.38); this.aimY = game.H * 0.45;
    this.y0 = 0;
    this.ctrl = null;
  }

  layout(W, H, frame) {
    this.W = W; this.H = H;
    const Lo = T.layout;
    this.fovAt = null; this.place();
    // full body on screen like a third-person game: a standing pose is about half the screen tall, feet on the bottom edge.
    // Each girl's body centre sits at 20% / 80% of the HUD frame (ultrawide screens don't fling her to the far edge).
    this.frame = frame;
    this.margin = H * Lo.margin;
    this.baseX = frame.x + frame.w * (this.game.live?.x[this.slot] ?? Lo.bodyX[this.slot ? 1 : 0]);   // (the shot moves it: update)
    this.bottom = H * Lo.bottom;
    const standH = H * Lo.standHeight;
    if (this.hero) this.hero.layout(W, H);
    // every pose of a pack shares one scale: the tallest standing pose maps to standH
    // the crouching poses set the scale (standing / running ones come out taller, sitting ones shorter)
    const ref = Math.max(...['aim', 'cover'].map((r) => this.poses[r]?.userData.rawH || 0)) || 1000;
    for (const role in this.poses) {
      const m = this.poses[role];
      const h = standH * m.userData.rawH / ref;
      const img = m.material.uniforms.map.value.image;
      m.userData.w = h * img.width / img.height; m.userData.h = h;
    }
  }

  // her pixel space on the camera (1 unit = 1 screen px, origin bottom-left) for the view as the shot has it (a scope narrows it: she
  // must not grow with the world; the quick kicks of the view - a kill's punch, a close look's zoom - leave her where she is)
  place() {
    const W = this.W, H = this.H, D = T.layout.heroineDist, fov = this.game.world.baseFov - (this.game.live?.zoom || 0);
    if (!H || Math.abs(fov - (this.fovAt ?? -99)) < 0.01) return;
    this.fovAt = fov;
    const k = 2 * D * Math.tan(THREE.MathUtils.degToRad(fov / 2)) / H;
    this.group.position.set(-W / 2 * k, -H / 2 * k, -D);
    this.group.scale.set(k, k, k);
  }
  // in the place (DESIGN「这是轨道射击」: the two of them in the 3D scene - standing on its floor where the shot puts them, seen from
  // wherever the camera is, hidden by what stands in front of them, drawn with the world; the shot's players.world: { m: her standing
  // height in metres, behind: metres behind her cover (toward the camera), at: [[x, z], [x, z]] instead of her cover }); else on the
  // camera as before (1 unit = 1 screen px)
  toWorld(on) {
    if (!!this.inWorld === on) return;
    const w = this.game.world; this.group.removeFromParent(); (on ? w.scene : w.camera).add(this.group);
    if (on) { this.inWorld = true; this.group.traverse((o) => { o.layers.set(0); if (o.material) o.material.depthTest = true; }); } else this.unworld();
  }
  unworld() {   // (back on the camera: a new place, or a shot without it)
    this.inWorld = false; this.mirror = this.mirror0; if (this.hero) this.hero.view = null; this.fovAt = null; this.group.rotation.set(0, 0, 0);
    this.group.traverse((o) => { o.layers.set(1); if (o.material) o.material.depthTest = false; });
  }
  worldSpot(Wd, out) {
    const w = this.game.world, cam = w.camera, at = Wd.at?.[this.slot], cv = w.covers?.[this.slot], R = this.game.ride;
    if (R.on && R.girls) return R.girlSpot(this.slot, out);   // (their own run: on the way, src/battle/ride.js)
    if (at) return out.set(at[0], 0, at[1]);
    if (cv) { out.set(cv.m.position.x, 0, cv.m.position.z); const dx = cam.position.x - out.x, dz = cam.position.z - out.z, d = Math.hypot(dx, dz) || 1; return out.set(out.x + dx / d * (Wd.behind ?? 0.45), 0, out.z + dz / d * (Wd.behind ?? 0.45)); }
    return out.set(cam.position.x + (this.slot ? 0.7 : -0.7), 0, cam.position.z - 2.4);
  }
  // start a move (tuning/layout.json moves: hop, dash, dive; o: { dx, dy, h, t, delay }); where it ends is where she stays until the
  // stop's shot places her again (settle)
  move(kind, o = {}) {
    const M = T.layout.moves?.[kind]; if (!M || this.state === 'down' || this.state === 'away') return;
    this.mv = { t: -(o.delay || 0), T: o.t ?? M.t, h: o.h ?? M.h ?? 0, dx: o.dx || 0, dy: o.dy || 0, frames: M.frames || [] };
  }
  settle() { this.mv = null; this.baseShift = 0; this.y0 = 0; }
  setPose(p) {
    if (this.hero) { this.pose = p; return; }   // the heroine shows cover / fire herself (heroine.js)
    const FALLBACK = { runB: 'run', down: 'hurt', peek: 'cover', taunt: 'cover', recoil: 'aim', aimOut: 'aim', active: 'aim', activeOut: 'aimOut' };
    while (!this.poses[p] && FALLBACK[p]) p = FALLBACK[p];
    if (!this.poses[p]) p = 'cover';
    if (this.pose === p) return;
    if (this.poses[this.pose]) this.poses[this.pose].visible = false;
    this.pose = p;
    this.pop = 0.93;
    this.soft.kick(0.6);
  }
  muzzlePos() {
    if (this.hero && this.inWorld) {   // (in the place: her muzzle where it is in the world, on the screen)
      const m = this.hero.muzzle(), s = this.game.world.project(this.group.localToWorld(MZ.set(m.x, m.y, 0)));
      return { x: s.x, y: this.H - s.y };
    }
    if (this.hero) return this.hero.muzzle();
    const m = this.poses[this.pose];
    if (!m) return { x: this.baseX, y: this.H * 0.3 };
    const mz = this.c.muzzle[this.pose] || this.c.muzzle.aim;
    const u = this.mirror ? 1 - mz[0] : mz[0];
    return { x: m.position.x + (u - 0.5) * m.userData.w, y: m.position.y + mz[1] * m.userData.h };
  }
  outerAim() { return this.side < 0 ? this.aimX < this.baseX + this.W * 0.04 : this.aimX > this.baseX - this.W * 0.04; }
  get activeOn() { return this.activeT > 0; }
  get gatling() { return this.activeT > 0 && this.a.kind === 'gatling'; }
  get beaming() { return this.activeT > 0 && this.a.kind === 'beam'; }
  get hearts() { return this.hp / T.combat.heartHp; }
  get alive() { return this.state !== 'down' && this.state !== 'away'; }

  damage(n) {
    if (this.invuln > 0 || this.game.G.god || this.state === 'down' || this.activeOn || this.game.lull) return false;   // her special: untouchable (DESIGN)
    this.hp = Math.max(0, this.hp - n);
    this.taken += n;
    this.invuln = PL().invuln;
    this.exposed = false;
    this.fever.hurt();
    this.addCharge(T.fever.hurtCharge ?? 0);   // hurt = a chunk of Fever and of the special (DESIGN「Fever 大方」)
    if (this.hero) this.hero.hurt(n >= 25); else this.soft.kick(1.4);
    if (this.hp <= 0) {
      this.state = 'down'; this.downT = PL().downTime;
      if (this.ctrl?.kind !== 'ai') this.game.deaths = (this.game.deaths || 0) + 1;   // (a player's girl, not the AI's: the results cut, Game.applyRewards)
      return true;
    }
    this.state = 'hurt';
    this.hurtT = PL().hurtTime;
    return true;
  }
  heal(n) { if (this.state !== 'down') this.hp = Math.min(this.maxHp, this.hp + n); }
  // heal and show it (Fever level-ups, the special: DESIGN「Fever 大方」)
  healPop(n) {
    if (!n || this.state === 'down' || this.hp >= this.maxHp) return;
    const h = Math.min(n, this.maxHp - this.hp); this.heal(h);
    if (h >= 1) this.game.hud.healPop(this.slot, Math.round(h));
  }
  addCharge(v) { if (!this.activeOn) this.charge = Math.min(1, this.charge + v); }

  // ---- active skill
  startActive() {
    const g = this.game;
    this.charge = 0;
    this.activeT = this.a.dur;
    this.healPop(T.fever.skillHeal);
    if (this.state === 'reload' || this.state === 'cover') this.state = 'out';
    this.ammo = this.w.mag;
    sfx.madness();
    // no cut-in band and no full-screen flash (DESIGN: never break the rhythm): her aura flares and her side of the screen glows
    g.G.stop(0.06);
    if (this.hero) this.hero.pulse(new THREE.Color(this.c.hex));
    this.edgePulse = 1.4;
    g.hud.setFace(this.slot, 'hype', this.a.dur);
    if (this.a.kind === 'beam') { this.beamGrace = T.combat.beam.grace; this.beam = g.fx.beam(this.c.hex); this.beam3d = g.fx.beam3d(this.c.hex); this.beamTick = 0; }   // (the band on the screen and the tube of light in the room)
  }
  endActive(cancelled) {
    if (this.a.kind === 'beam') {
      if (cancelled) { const h = this.a.heal * this.activeT / this.a.dur; this.heal(h); if (h > 1) { this.game.hud.healPop(this.slot, h); sfx.clear(); } }
      if (this.beam) { this.beam.remove(); this.beam = null; }
      if (this.beam3d) { this.beam3d.remove(); this.beam3d = null; }
    }
    this.activeT = 0;
  }

  update(dt, t) {
    const g = this.game, c = this.ctrl;
    this.invuln -= dt; this.fireCD -= dt; this.recoilT -= dt; this.tauntT -= dt; this.focus.t -= dt;
    // the shot effects follow her Fever: share of all levels, full Fever, her special
    this.muzzle.setLevel(FEVER_KEYS.reduce((s, k) => s + this.fever.level(k), 0) / (FEVER_KEYS.length * T.fever.maxLevel), this.fever.full, this.activeOn);
    this.muzzle.update(dt, t);
    // game.lull: the fight pauses for a moment (the boss changing form): she ducks, nobody shoots, her special's clock stops
    const busy = this.state === 'run' || this.state === 'victory' || this.state === 'away' || !g.combat || g.lull;
    if (g.lull && this.state === 'out') this.state = 'cover';
    // aim point: snaps to the controller; while beaming it follows close behind (a touch of weight, still where you point)
    if (c) {
      if (this.beaming) { const k = 1 - Math.exp(-dt * this.a.aim); this.aimX += (c.x - this.aimX) * k; this.aimY += (c.y - this.aimY) * k; } else { this.aimX = c.x; this.aimY = c.y; }
    }
    if (!busy && c) {
      if (this.a.charge.sec) this.addCharge(this.a.charge.sec * dt);
      this.fever.update(g.hasTargets ? dt : 0);   // (it only slides while there is something to hit: Game.hasTargets)
      if (this.activeT > 0) {
        this.activeT -= dt;
        if (this.activeT <= 0) this.endActive(false);
      }
      if (this.state === 'down') {
        this.downT -= dt;
        if (this.downT <= 0) { this.hp = this.maxHp * PL().reviveHp; this.state = 'cover'; this.invuln = PL().reviveInvuln; sfx.clear(); }
      } else if (this.state === 'hurt') {
        this.hurtT -= dt;
        if (this.hurtT <= 0) this.state = 'cover';
      } else if (this.state === 'reload') {
        this.reloadT -= dt;
        if (this.reloadT <= 0) { this.ammo = this.w.mag; this.state = 'cover'; }
      } else {
        // blind fire (DESIGN「女主动起来」: 抱头乱射): she stays down behind her cover, a hand over her head, and fires over it without
        // looking - a pad or the keys: hide and fire held together; the mouse: the first moment of a click while a must-hide attack is
        // coming at her (hold on and she leans out after all). Safe, but the shots go wide and hit softer (tuning combat.player.blind)
        this.pressT = c.fire ? (this.pressT || 0) + dt : 0;
        const B = PL().blind, press = c.fire && !this.activeOn;
        this.blind = press && (c.hide || (this.state !== 'out' && this.dangerOn() && this.pressT < B.tap));
        const always = g.shot?.players?.out === 'always';   // (the shot: riding, running - nowhere to hide, always up and shooting)
        const wantOut = always || ((c.fire || c.wantsOut) && !c.hide && !this.blind);
        if (this.activeOn) {
          // her special (DESIGN「角色性能」): she stays out the whole time, untouchable; letting go or ducking does not end it
          if (this.state !== 'out') { this.state = 'out'; sfx.popup(); }
          this.linger = PL().outLinger;
        } else if (wantOut) {
          if (this.state !== 'out') { this.state = 'out'; sfx.popup(); this.soft.kick(0.8); }
          this.linger = PL().outLinger;
        } else if (this.state === 'out' && !always) {
          this.linger -= dt;
          if (this.linger <= 0 || c.hide) { this.state = 'cover'; this.coverTime = 0; this.soft.kick(0.8); }
        }
        if (this.state === 'cover') {
          // (firing blind from behind it is not resting there: no reload after one blind shot - user 2026-10-22, the maggot's lunge: one
          // shot and she was made to reload before the next; only once she has let go, or is empty)
          this.coverTime = this.blind ? 0 : this.coverTime + dt;
          if (this.ammo < this.w.mag && (this.coverTime > PL().autoReloadAfter || this.ammo === 0) && !this.gatling && g.shot?.ammo !== 'infinite') this.startReload(PL().autoReloadMul);
        }
      }
      if (c.skill && this.charge >= 1 && !this.activeOn && this.state !== 'down' && this.state !== 'hurt') this.startActive();
    } else if (this.activeOn && !g.combat && !g.lull) this.endActive(false);
    this.exposed = this.state === 'out';
    if (this.state === 'out' && c && !g.lull) { if (this.beaming) this.updateBeam(dt, t); else this.updateGun(dt, t); }
    else if (this.blind && this.state === 'cover' && c && !busy) this.updateGun(dt, t, true);

    // ---- frame ----
    let pose = 'cover';
    if (this.state === 'out') pose = this.activeOn ? (this.outerAim() ? 'activeOut' : 'active') : this.outerAim() ? 'aimOut' : this.recoilT > 0 ? 'recoil' : 'aim';
    else if (this.state === 'reload') pose = 'reload';
    else if (this.state === 'hurt') pose = 'hurt';
    else if (this.state === 'down') pose = 'down';
    else if (this.state === 'run') pose = Math.floor(t * 5 + this.slot) % 2 ? 'runB' : 'run';
    else if (this.state === 'victory') pose = 'victory';
    else if (this.state === 'cover') {
      this.peekT -= dt;
      if (this.blind) pose = 'blind';
      else if (this.tauntT > 0) pose = 'taunt';
      else if (this.peekT < 0) { pose = 'peek'; if (this.peekT < -PL().peekHold) this.peekT = rr(PL().peekEvery); }
    }
    // a move she is making in the place (DESIGN「女主动起来」: a hop up / down a step, a dash to another spot, a dive into cover): its
    // pictures over whatever she was doing, an arc, a slide (tuning/layout.json moves)
    let mvX = 0, mvY = 0;
    if (this.mv) {
      const M = this.mv; M.t += dt;
      if (M.t >= 0) {
        const p = Math.min(1, M.t / M.T), e = p * p * (3 - 2 * p);
        for (const [at, name] of M.frames) if (p >= at) pose = name;
        mvX = M.dx * e * (this.frame?.w || this.W); mvY = (M.h * 4 * p * (1 - p) + M.dy * e) * this.H;
        if (p >= 1) { this.mv = null; this.y0 += M.dy * this.H; this.baseShift = (this.baseShift || 0) + M.dx * (this.frame?.w || this.W); }
      }
    }
    if (this.dragged) pose = 'dragged';   // (caught by the hands in the hole: madame.js)
    this.setPose(pose);
    this.kick = Math.max(0, this.kick - dt * 10);
    this.pop += (1 - this.pop) * Math.min(1, dt * 18);
    // a close look (Game.cine), a walk between places with the camera alone, a shot without the girls: she slides down out of the
    // picture and back
    const Lv = g.live;
    this.place();   // (the scope's narrower view: her size stays)
    this.cineK = (this.cineK || 0) + ((g.cineOn || g.walkOn ? 1 : 0) - (this.cineK || 0)) * Math.min(1, dt * 5);
    this.cineK = Math.max(this.cineK, Lv ? 1 - Lv.show : 0);
    if (Lv && this.frame) this.baseX = this.frame.x + this.frame.w * Lv.x[this.slot] + (this.baseShift || 0) + (g.world.steerPx || 0);   // (the camera leaning with the fight: she stays behind her cover, PanelWorld steer)
    const out = this.cineK * this.cineK * (3 - 2 * this.cineK) * this.H * 1.05;
    if (this.hero) {
      // Fever look: her colour, stronger with every level; full Fever = the light keeps running; skill = full blaze
      const lv = FEVER_KEYS.reduce((s, k) => s + this.fever.level(k), 0), maxSum = FEVER_KEYS.length * T.fever.maxLevel;
      while (this.fever.ups.length) { const k = this.fever.ups.shift(); this.hero.pulse(new THREE.Color(C.theme.feverColor[k])); this.edgePulse = 1; sfx.ui && sfx.ui(); this.healPop(T.fever.levelHeal); }
      AURA.set(this.c.color);
      const act = this.activeOn, full = this.fever.full;
      this.hero.setAura(act ? AURA.offsetHSL(Math.sin(t * 2) * 0.06, 0.1, 0.05) : AURA, act ? 0.95 : lv ? 0.12 + 0.5 * lv / maxSum : 0, act ? 1 : full ? 0.7 : 0.15 * lv / maxSum, act ? 1 : full ? 0.6 : 0);
      this.edgePulse = Math.max(0, (this.edgePulse || 0) - dt * 1.4);
      this.edge = act ? 0.85 + 0.15 * Math.sin(t * 9) : full ? 0.45 + 0.1 * Math.sin(t * 4) : lv ? 0.08 + 0.2 * lv / maxSum : 0;
      const run = this.state === 'run' ? Math.abs(Math.sin(t * 10 + this.slot)) * this.H * 0.022 : 0;
      const hop = this.state === 'victory' ? Math.abs(Math.sin(t * 5 + this.slot)) * this.H * 0.03 : 0;
      const shake = this.state === 'hurt' ? Math.sin(t * 60) * this.H * 0.006 : 0;
      // walking on: the shot moves in to above her knees (there is no walking picture, her legs would look wrong: DESIGN「画面」);
      // eased in and out, she grows about her body line and sinks until her knees sit on the bottom of the screen
      const Wk = T.layout.walk;
      this.walkK = (this.walkK || 0) + ((this.state === 'run' ? 1 : 0) - (this.walkK || 0)) * Math.min(1, dt * Wk.ease);
      const wk = this.walkK * this.walkK * (3 - 2 * this.walkK), zoom = (1 + (Wk.zoom - 1) * wk) * (Lv?.scale[this.slot] ?? 1);
      // the shot: her size, a rise, and sunk below the bottom edge so only her upper body shows (crop: share of her standing height)
      const sink = wk * (this.bottom + this.hero.standH() * Wk.knee * zoom) + (Lv ? Lv.crop[this.slot] * this.hero.standH() * zoom - Lv.y[this.slot] * this.H : 0);
      this.hero.setReady(this.charge >= 1 && !this.activeOn && g.combat && this.state !== 'down' && this.state !== 'away');
      const Wd = g.shot?.players?.world;
      this.toWorld(!!Wd);
      if (Wd) {   // (in the place: her feet on its floor, turned to the camera, her height in metres; the moves in metres of her size)
        const cam = g.world.camera, P = this.worldSpot(Wd, this.group.position), k = (Wd.m ?? 1.5) / this.hero.standH();   // (screen offsets below: in her own height, x2)
        this.group.rotation.set(0, Math.atan2(cam.position.x - P.x, cam.position.z - P.z), 0);
        // which side of her the camera is on: her picture from behind, from the side or from the front if she has one (heroine.js view;
        // drawn from her right, so not mirrored then); she faces along her run, or away from the camera at a stop
        const R = g.ride, hd = R.on && R.girls ? R.heading(HD) : HD.set(P.x - cam.position.x, 0, P.z - cam.position.z).normalize();
        const tx = cam.position.x - P.x, tz = cam.position.z - P.z, tl = Math.hypot(tx, tz) || 1, fw = (hd.x * tx + hd.z * tz) / tl, rt = (-hd.z * tx + hd.x * tz) / tl;
        const view = fw > 0.55 ? 'front' : fw < -0.55 ? 'back' : 'side';
        this.hero.view = view; this.mirror = view === 'back' ? this.mirror0 : rt < 0 && view === 'side';
        this.group.scale.setScalar(k);
        this.hero.setSet(g.shot?.players?.set || 'cover');
        this.hero.update(dt, t, { state: this.state, pose: this.pose, zoom: 1, x: (mvX + shake) / this.H * this.hero.standH() * 2, y: (run * 0.5 + hop + mvY) / this.H * this.hero.standH() * 2,
          lean: this.state === 'run' ? 0.025 : this.state === 'reload' ? 0.03 : 0, dark: this.state === 'down' ? 0.35 : 0, visible: this.state !== 'away' && this.cineK < 0.99,
          opacity: this.invuln > 0 && this.state !== 'hurt' ? 0.65 + 0.35 * Math.abs(Math.sin(t * 25)) : 1, flash: this.activeOn ? 0.03 + 0.03 * Math.sin(t * 12) : 0 });
        return;
      }
      this.hero.setSet(g.shot?.players?.set || 'cover');
      this.hero.update(dt, t, {
        state: this.state, pose: this.pose, zoom, x: this.baseX + shake + mvX, y: this.bottom - sink + this.y0 + run + hop + mvY - (this.state === 'down' ? this.H * 0.02 : 0) - out,
        lean: this.state === 'run' ? 0.025 : this.state === 'reload' ? 0.03 : 0,
        dark: this.state === 'down' ? 0.35 : 0, visible: this.state !== 'away',
        opacity: this.invuln > 0 && this.state !== 'hurt' ? 0.65 + 0.35 * Math.abs(Math.sin(t * 25)) : 1,
        flash: this.activeOn ? 0.03 + 0.03 * Math.sin(t * 12) : 0,
      });
      return;
    }
    const m = this.poses[this.pose];
    if (!m) return;
    m.visible = this.state !== 'away';
    const st = Math.floor(t * 12);
    const breathe = this.state === 'cover' ? Math.sin(st / 12 * 2.2 + this.slot) * 0.006 : 0;
    const shake = this.state === 'hurt' ? Math.sin(t * 60) * this.H * 0.01 : 0;
    const run = this.state === 'run' ? Math.abs(Math.sin(t * 10 + this.slot)) * this.H * 0.03 : 0;
    const kx = -this.side * this.kick * this.H * 0.01 * this.w.kick;
    // the pose's body centre (anchor u of the unmirrored sprite) goes on baseX; never let the sprite leave the frame
    const f = this.frame, wpx = m.userData.w, au = (this.c.anchor && this.c.anchor[this.pose]) ?? 0.5;
    let ax = this.baseX - ((this.mirror ? 1 - au : au) - 0.5) * wpx;
    ax = Math.max(f.x + this.margin + wpx / 2, Math.min(f.x + f.w - this.margin - wpx / 2, ax));
    m.position.set(ax + shake + kx, this.bottom + this.y0 - this.kick * this.H * 0.012 * this.w.kick + run - out, 0);
    const s = this.pop * (1 + breathe);
    m.scale.set(m.userData.w * s * (this.mirror ? -1 : 1), m.userData.w * s * (1 + breathe), 1);
    m.rotation.z = this.side * -this.kick * 0.012 + (this.state === 'run' ? Math.sin(t * 10) * 0.025 : 0);
    this.soft.update(dt, t, m, m.position.x / this.H, m.position.y / this.H);   // its own motion, in sprite heights, for the springs' inertia
    const mu = m.material.uniforms;
    mu.flash.value = this.state === 'hurt' ? 0.15 + 0.35 * Math.abs(Math.sin(t * 30)) : this.activeOn ? 0.08 + 0.06 * Math.sin(t * 12) : 0;
    mu.tint.value.setRGB(1, 0.1, 0.3);
    mu.tintAmt.value = this.state === 'hurt' ? 0.35 : 0;
    mu.dark.value = this.state === 'down' ? 0.35 : 0;
    mu.opacity.value = this.invuln > 0 && this.state !== 'hurt' ? 0.65 + 0.35 * Math.abs(Math.sin(t * 25)) : 1;
    const lit = g.world.lightAt(g.world.camPos);
    mu.lit.value.setRGB(0.8 + lit.r * 0.2, 0.8 + lit.g * 0.2, 0.8 + lit.b * 0.2);
  }

  startReload(k = 1) {
    if (this.state === 'reload') return;
    this.state = 'reload';
    this.reloadT = this.reloadT0 = this.w.reload * k * this.fever.reloadMul;
    if (this.hero) this.hero.kick(0.7);   // ducking down to reload
    sfx.reload();
  }

  // a must-hide attack coming at her (an orbit marker of that kind aimed at her or at both: fx.lock)
  dangerOn() { for (const L of this.game.fx.live || []) if ((L.type === 'hide' || L.type === 'heavy') && (L.slot === this.slot || L.slot === -1)) return true; return false; }
  // blind: fired from behind her cover without looking (the shots go wide, hit softer, come from lower down)
  updateGun(dt, t, blind = false) {
    const g = this.game, c = this.ctrl, w = this.w;
    if (!(c.fire || this.activeOn) || this.fireCD > 0) return;   // her special fires by itself: just point (DESIGN「必杀」)
    // the shot (tuning/shots.json): its weapon mode (characters/<id>.json modes.<name>: riding - the gunner's rotary gun, the cat's rapid
    // spell) and endless ammunition
    const S = g.shot || {}, RM = S.weapon ? this.c.modes?.[S.weapon] || {} : null, rot = this.gatling || RM?.gatling, free = S.ammo === 'infinite';
    if (this.ammo <= 0 && !rot && !free) { sfx.empty(); this.startReload(1); return; }
    this.fireCD += rot ? this.a.rate : w.rate * (RM?.rate ?? 1);
    if (this.fireCD < 0) this.fireCD = 0;
    if (!rot && !free) this.ammo--;
    this.shots++;
    this.fever.shot();
    const sp = this.H * (blind ? PL().blind.spread : w.spread * (rot ? PL().gatlingSpread : 1));
    const sx = this.aimX + rnd(-sp, sp), sy = this.aimY + rnd(-sp, sp);
    this.dmgMul = blind ? PL().blind.dmg : 1;
    const res = g.shoot(this, sx, sy);
    this.dmgMul = 1;
    if (res.n) this.hits++;
    this.recoilT = PL().recoilPose;
    const mz = this.muzzlePos(); if (blind && !this.hero?.poses.blind) mz.y -= this.H * 0.07;   // (over the top of the cover, until she has her own picture for it)
    if (w.kind === 'mantra') g.fx.chant.cast(mz.x, mz.y, sx, g.H - sy, this.glyphI++, res.crit, res.dist);   // each syllable its own colour and its own way in / out (glyphs.js)
    else g.fx.tracer(mz.x, mz.y, sx, g.H - sy, w.tracer);
    this.muzzle.fire(mz.x, mz.y, sx, g.H - sy, res.crit);
    if (res.n) this.muzzle.hit(sx, g.H - sy, res.crit, res.at, res.dist);
    this.kick = 1;
    if (this.hero) this.hero.shoot(rot);
    else this.soft.kick(w.kick * Math.max(0.35, Math.min(1, w.rate * 6)) * (rot ? 0.7 : 1)); // fast guns: many small bounces
    const pan = (this.aimX / g.W - 0.5) * 0.6;
    // every shot its toy gun's short sound (user 2026-10-19: like an old game, again and again; her one-syllable voice over it went:
    // single syllables sound strange, batch 23)
    if (w.sfx === 'mantra') sfx.cannon(pan); else sfx.gun(pan);
    if (w.kind === 'rifle' && Math.random() < 0.5) sfx.shell();
    if (this.slot === 0) g.post.kick(w.kick > 1.2 ? 0.5 : 0.18);
  }

  updateBeam(dt, t) {
    const g = this.game, mz = this.muzzlePos();
    this.muzzle.sustain(mz.x, mz.y);
    const B = T.combat.beam, width = g.H * B.width;
    if (this.beam) this.beam.set(mz.x, mz.y, this.aimX, g.H - this.aimY, width, t);
    if (this.beam3d) this.beam3d.set(mz.x, mz.y, this.aimX, g.H - this.aimY, width, t);
    this.kick = 0.6;
    this.beamTick -= dt;
    if (this.beamTick > 0) return;
    this.beamTick = B.tick;
    this.soft.kick(0.3);
    this.fever.shot();
    const V = this.a.vary, n = g.beamHit(this, this.aimX, this.aimY, width * B.radius, this.a.dps * B.tick * (V ? V[0] + Math.random() * (V[1] - V[0]) : 1));
    if (n) this.hits++;
    this.shots++;
    if (this.slot === 0) g.post.shake(0.12);
    if (Math.random() < 0.5) sfx.crackle();
  }
}
