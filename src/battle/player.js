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

export class Player {
  constructor(game, charId, slot, prof = { xp: 0, bag: [] }) {
    this.game = game;
    this.id = charId;
    this.c = C.characters[charId];
    this.slot = slot;           // 0 = 1P (left), 1 = 2P (right)
    this.side = slot ? 1 : -1;
    this.mirror = (slot === 1) !== (this.c.drawnSide === 'right');
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
    const Lo = T.layout, D = Lo.heroineDist;
    const k = 2 * D * Math.tan(THREE.MathUtils.degToRad(this.game.world.baseFov / 2)) / H;
    this.group.position.set(-W / 2 * k, -H / 2 * k, -D);
    this.group.scale.set(k, k, k);
    // full body on screen like a third-person game: a standing pose is about half the screen tall, feet on the bottom edge.
    // Each girl's body centre sits at 20% / 80% of the HUD frame (ultrawide screens don't fling her to the far edge).
    this.frame = frame;
    this.margin = H * Lo.margin;
    this.baseX = frame.x + frame.w * Lo.bodyX[this.slot ? 1 : 0];
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
    if (this.invuln > 0 || this.game.G.god || this.state === 'down') return false;
    this.hp = Math.max(0, this.hp - n);
    this.taken += n;
    this.invuln = PL().invuln;
    this.exposed = false;
    this.fever.hurt();
    if (this.beaming) this.endActive(false);
    if (this.hero) this.hero.hurt(n >= 25); else this.soft.kick(1.4);
    if (this.hp <= 0) { this.state = 'down'; this.downT = PL().downTime; return true; }
    this.state = 'hurt';
    this.hurtT = PL().hurtTime;
    return true;
  }
  heal(n) { if (this.state !== 'down') this.hp = Math.min(this.maxHp, this.hp + n); }
  addCharge(v) { if (!this.activeOn) this.charge = Math.min(1, this.charge + v); }

  // ---- active skill
  startActive() {
    const g = this.game;
    this.charge = 0;
    this.activeT = this.a.dur;
    if (this.state === 'reload' || this.state === 'cover') this.state = 'out';
    this.ammo = this.w.mag;
    sfx.madness();
    // no cut-in band and no full-screen flash (DESIGN: never break the rhythm): her aura flares and her side of the screen glows
    g.G.stop(0.06);
    if (this.hero) this.hero.pulse(new THREE.Color(this.c.hex));
    this.edgePulse = 1.4;
    g.hud.setFace(this.slot, 'hype', this.a.dur);
    if (this.a.kind === 'beam') { this.beamGrace = T.combat.beam.grace; this.beam = g.fx.beam(this.c.hex); this.beamTick = 0; }
  }
  endActive(cancelled) {
    if (this.a.kind === 'beam') {
      if (cancelled) { const h = this.a.heal * this.activeT / this.a.dur; this.heal(h); if (h > 1) { this.game.hud.healPop(this.slot, h); sfx.clear(); } }
      if (this.beam) { this.beam.remove(); this.beam = null; }
    }
    this.activeT = 0;
  }

  update(dt, t) {
    const g = this.game, c = this.ctrl;
    this.invuln -= dt; this.fireCD -= dt; this.recoilT -= dt; this.tauntT -= dt; this.focus.t -= dt;
    // the shot effects follow her Fever: share of all levels, full Fever, her special
    this.muzzle.setLevel(FEVER_KEYS.reduce((s, k) => s + this.fever.level(k), 0) / (FEVER_KEYS.length * T.fever.maxLevel), this.fever.full, this.activeOn);
    this.muzzle.update(dt, t);
    const busy = this.state === 'run' || this.state === 'victory' || this.state === 'away' || !g.combat;
    // aim point: snaps to the controller, except while beaming (heavy, slow reticle)
    if (c) {
      if (this.beaming) { const k = 1 - Math.exp(-dt * this.a.aim); this.aimX += (c.x - this.aimX) * k; this.aimY += (c.y - this.aimY) * k; } else { this.aimX = c.x; this.aimY = c.y; }
    }
    if (!busy && c) {
      if (this.a.charge.sec) this.addCharge(this.a.charge.sec * dt);
      this.fever.update(dt);
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
        const wantOut = (c.fire || c.wantsOut) && !c.hide;
        if (this.beaming) {
          // the beam holds her out; letting go (mouse) or ducking (pad) ends it early and turns the time left into health
          this.beamGrace -= dt;
          if (this.state !== 'out') { this.state = 'out'; sfx.popup(); }
          if (this.beamGrace <= 0 && !wantOut) { this.endActive(true); this.state = 'cover'; this.coverTime = 0; }
        } else if (wantOut) {
          if (this.state !== 'out') { this.state = 'out'; sfx.popup(); this.soft.kick(0.8); }
          this.linger = PL().outLinger;
        } else if (this.state === 'out') {
          this.linger -= dt;
          if (this.linger <= 0 || c.hide) { this.state = 'cover'; this.coverTime = 0; this.soft.kick(0.8); }
        }
        if (this.state === 'cover') {
          this.coverTime += dt;
          if (this.ammo < this.w.mag && (this.coverTime > PL().autoReloadAfter || this.ammo === 0) && !this.gatling) this.startReload(PL().autoReloadMul);
        }
      }
      if (c.skill && this.charge >= 1 && !this.activeOn && this.state !== 'down' && this.state !== 'hurt') this.startActive();
    } else if (this.activeOn && !g.combat) this.endActive(false);
    this.exposed = this.state === 'out';
    if (this.state === 'out' && c) { if (this.beaming) this.updateBeam(dt, t); else this.updateGun(dt, t); }

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
      if (this.tauntT > 0) pose = 'taunt';
      else if (this.peekT < 0) { pose = 'peek'; if (this.peekT < -PL().peekHold) this.peekT = rr(PL().peekEvery); }
    }
    this.setPose(pose);
    this.kick = Math.max(0, this.kick - dt * 10);
    this.pop += (1 - this.pop) * Math.min(1, dt * 18);
    if (this.hero) {
      // Fever look: her colour, stronger with every level; full Fever = the light keeps running; skill = full blaze
      const lv = FEVER_KEYS.reduce((s, k) => s + this.fever.level(k), 0), maxSum = FEVER_KEYS.length * T.fever.maxLevel;
      while (this.fever.ups.length) { const k = this.fever.ups.shift(); this.hero.pulse(new THREE.Color(C.theme.feverColor[k])); this.edgePulse = 1; sfx.ui && sfx.ui(); }
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
      const wk = this.walkK * this.walkK * (3 - 2 * this.walkK), zoom = 1 + (Wk.zoom - 1) * wk;
      const sink = wk * (this.bottom + this.hero.standH() * Wk.knee * zoom);
      this.hero.update(dt, t, {
        state: this.state, zoom, x: this.baseX + shake, y: this.bottom - sink + this.y0 + run + hop - (this.state === 'down' ? this.H * 0.02 : 0),
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
    m.position.set(ax + shake + kx, this.bottom + this.y0 - this.kick * this.H * 0.012 * this.w.kick + run, 0);
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

  updateGun(dt, t) {
    const g = this.game, c = this.ctrl, w = this.w;
    if (!c.fire || this.fireCD > 0) return;
    if (this.ammo <= 0 && !this.gatling) { sfx.empty(); this.startReload(1); return; }
    this.fireCD += this.gatling ? this.a.rate : w.rate;
    if (this.fireCD < 0) this.fireCD = 0;
    if (!this.gatling) this.ammo--;
    this.shots++;
    this.fever.shot();
    const sp = this.H * w.spread * (this.gatling ? PL().gatlingSpread : 1);
    const sx = this.aimX + rnd(-sp, sp), sy = this.aimY + rnd(-sp, sp);
    const res = g.shoot(this, sx, sy);
    if (res.n) this.hits++;
    this.recoilT = PL().recoilPose;
    const mz = this.muzzlePos();
    if (w.kind === 'mantra') { g.fx.mantra(mz.x, mz.y, sx, g.H - sy, this.glyphI++, res.crit, this.c.glyph); if (this.c.glyph === 'jade') g.fx.rune(mz.x, mz.y, this.H * 0.11); }
    else g.fx.tracer(mz.x, mz.y, sx, g.H - sy, w.tracer);
    this.muzzle.fire(mz.x, mz.y, sx, g.H - sy, res.crit);
    if (res.n) this.muzzle.hit(sx, g.H - sy, res.crit);
    this.kick = 1;
    if (this.hero) this.hero.shoot(this.gatling);
    else this.soft.kick(w.kick * Math.max(0.35, Math.min(1, w.rate * 6)) * (this.gatling ? 0.7 : 1)); // fast guns: many small bounces
    const pan = (this.aimX / g.W - 0.5) * 0.6;
    if (w.sfx === 'mantra') sfx.cannon(pan); else sfx.gun(pan);
    if (w.kind === 'rifle' && Math.random() < 0.5) sfx.shell();
    if (this.slot === 0) g.post.kick(w.kick > 1.2 ? 0.5 : 0.18);
  }

  updateBeam(dt, t) {
    const g = this.game, mz = this.muzzlePos();
    this.muzzle.sustain(mz.x, mz.y);
    const B = T.combat.beam, width = g.H * B.width;
    if (this.beam) this.beam.set(mz.x, mz.y, this.aimX, g.H - this.aimY, width, t);
    this.kick = 0.6;
    this.beamTick -= dt;
    if (this.beamTick > 0) return;
    this.beamTick = B.tick;
    this.soft.kick(0.3);
    this.fever.shot();
    const n = g.beamHit(this, this.aimX, this.aimY, width * B.radius, this.a.dps * B.tick);
    if (n) this.hits++;
    this.shots++;
    if (this.slot === 0) g.post.shake(0.12);
    if (Math.random() < 0.5) sfx.crackle();
  }
}
