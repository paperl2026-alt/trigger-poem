// Madame Rotten Honey (docs/DESIGN.md 第 1 话 10; bosses.json madame, beh "madame"; user 2026-10-20: each of her child's things is a form
// with its own attack and way to fight her, Sweet Home's own mechanics brought back, and not staged like the prologue's boss):
//   form 1, the PHOTO (Sweet Home: the camera that shows what is hidden in the frescoes) - the studio goes dark and she melts into it: unseen,
//            untouchable; the photo drifts by her: shot, it flashes and she stands there, lit, for a few seconds (open to the guns); it
//            gathers a flash of its own now and then (shoot it first, or everyone is blinded); she hurls the studio's things at them
//   form 2, the DIARY (the torn diary pages that tell the truth date by date) - her pages swirl round her, each with a date; the next one
//            by date glows gold and only it can be shot (the others dim): shot, it slams its line of the truth across the screen and tears a
//            piece out of her; shots at her only glance off (user 2026-10-22: what do the dates mean, where on her do I shoot? - no order
//            puzzle, only the page to shoot, told by a hint); she flings storms of paper
//   form 3, the COFFIN (the pit with the ghosts round it, a friend pulled up by the rope; the coffin's bones looking back) - the floor
//            round her gives way into a pit, children's ghosts circling it; ghost hands rise and drag one of the girls toward it: the
//            other shoots them off, or she falls in (gone a while, hurt); the chandeliers over her: shot down they crush her (Game.harm)
// Between forms no warning tape, no title, no black bars (that is the prologue's): the picture goes to wet paint and datamosh, her word
// beats across the screen one syllable at a time, and she is painted back in, changed. At the end the three things in a row before her,
// given back to her one by one, the one she wants glowing (TheThing.grieve / offer / rest): Sweet Home's ending.
import * as THREE from 'three';
import { tex } from '../core/assets.js';
import { sfx } from '../core/audio.js';
import { tr } from '../core/i18n.js';
import { Ease } from '../core/tween.js';
import { TheThing, Keepsake, glow } from './thing.js';
import { Gimmick } from './gimmick.js';
import { COL } from './fx.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const rr = (v) => (Array.isArray(v) ? rnd(v[0], v[1]) : v);

// a diary page: aged paper, its date big, scrawled lines under it (made once per date, kept as a picture "gen/page_<date>")
function pageKey(date) {
  const key = `gen/page_${date}`;
  if (tex[key]) return key;
  const c = document.createElement('canvas'); c.width = 256; c.height = 320; const g = c.getContext('2d');
  g.fillStyle = '#f3e6c8'; g.fillRect(8, 8, 240, 304);
  g.fillStyle = 'rgba(160,110,60,0.25)'; for (let i = 0; i < 40; i++) g.fillRect(8 + Math.random() * 236, 8 + Math.random() * 300, 3 + Math.random() * 10, 2 + Math.random() * 6);
  g.strokeStyle = '#b89870'; g.lineWidth = 3; g.strokeRect(8, 8, 240, 304);
  g.fillStyle = '#5a1020'; g.font = 'bold 84px "Dela Gothic One", sans-serif'; g.textAlign = 'center'; g.fillText(date, 128, 112);
  g.strokeStyle = '#3a2a30'; g.lineWidth = 3;
  for (let y = 150; y < 300; y += 26) { g.beginPath(); g.moveTo(28, y); for (let x = 28; x < 228; x += 12) g.lineTo(x, y + Math.sin(x * 0.3 + y) * 3); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; tex[key] = t;
  return key;
}

// a thing of hers in the air that the girls shoot (a page, the photo, the hands): its hits go to her
class Relic extends Gimmick {
  constructor(game, boss, g, onHit) { super(game, { on: 'air', ...g }); this.boss = boss; this.onHit = onHit; this.billboard = true; this.live = () => this.alive && game.combat && !boss.mutating && !this.busy; }
  hit(info) { if (this.live()) this.onHit(this, info); }
  gone() { this.alive = false; this.dispose(); }
}

export class Madame extends TheThing {
  get M() { return this.def.madame; }
  form() { return this.stage; }

  // ---------------------------------------------------------------- the forms
  setStage(n) {
    super.setStage(n);
    if (this.relics) this.leaveForm();
    this.enterForm?.(n);
  }
  enterForm(n) {
    const g = this.game, M = this.M;
    this.relics = [];
    if (n === 0) {   // the photo: the studio dark, her melted into it
      this.lightsOut(M.photo.dark);
      this.photo = this.relic({ id: 'photo', k: 'ep1/photo', w: 1.2 }, (r) => this.photoHit(r));
      this.photo.ready = true; this.photoFuse = rr(M.photo.fuse);
      // (user 2026-10-22: only her outline at the start, a thing floating back and forth - what for, where to hit her? told plainly)
      g.tweens.wait(1.5, () => g.hint('madamePhoto'));
    } else if (n === 1) {   // the diary: its pages round her
      this.lightsOut(0);
      this.deal();
      g.tweens.wait(1.2, () => g.hint('madameDiary'));
    } else if (n === 2) {   // the coffin: the pit, the ghosts round it, the chandeliers over her
      this.lightsOut(0);
      this.pit = this.makePit();
      this.chandeliers = [-1, 1].map((s) => this.hang(s));
    }
  }
  leaveForm() {
    for (const r of this.relics) if (r.alive) r.gone();
    this.relics = []; this.photo = null; this.pages = null;
    for (const c of this.chandeliers || []) if (c.alive) c.act({ gone: true });   // (the fallen ones too: nothing of them left lying there - user 2026-10-22)
    this.chandeliers = null;
    if (this.pit) { this.pit.removeFromParent(); this.pit.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); this.pit = null; }
    this.release?.(true);
  }
  relic(g, onHit) {
    const P = this.root.position, r = new Relic(this.game, this, { x: P.x, y: this.S.h * 0.6, z: P.z + 1, ...g }, onHit);
    r.ph = Math.random() * 6; r.inner.scale.setScalar(0.01); this.game.tweens.to(r.inner.scale, { x: 1, y: 1, z: 1 }, 0.6, { ease: Ease.outBack });
    this.game.actors.push(r); this.relics.push(r); return r;
  }
  lightsOut(k) { const w = this.game.world; if (!w.set) return; w.set.dark = k > 0 || w.set.dark0; w.dark = k; }

  // ---- (1) the photo
  photoHit(r) {
    const g = this.game, M = this.M.photo;
    r.flash = 1;
    if (!r.ready) { sfx.clang(); return; }
    r.ready = false; this.photoFuse = rr(M.fuse); this.endPhotoRing();
    g.post.flash(0.85, 0xffffff); sfx.shutter(); g.world.dark = 0;   // (the flash lights the room: she is there)
    this.exposedT = M.reveal; this.flash = 1;
    if (!this.revealTold) { this.revealTold = true; g.tweens.wait(0.3, () => g.hint('madameReveal')); }   // (the first time: now hit her)
    this.later(M.reveal, () => { this.lightsOut(M.dark); });
    this.later(M.recharge, () => { if (this.photo === r) { r.ready = true; r.flash = 0.8; } });
  }
  endPhotoRing() { if (this.photoRing) { this.photoRing.remove(); this.photoRing = null; } }
  photoTick(dt, t) {
    const g = this.game, r = this.photo, M = this.M.photo; if (!r?.alive) return;
    this.orbit(r, 0, dt, t, 2.2, 0.62);
    r.u.outlineOn.value = r.ready ? 1 : 0.2;
    if (r.ready) glow(r, t);   // (what to shoot: a pulsing gold edge while it can flash)
    // its own flash gathering: the ring counts down; shot in time it flashes for them instead (photoHit)
    if (!g.combat || this.mutating || g.cineOn) { this.endPhotoRing(); return; }
    this.photoFuse -= dt;
    if (this.photoFuse < M.warn) {
      if (!this.photoRing) this.photoRing = g.fx.lock('shot', -1);
      const wc = r.center(), c = g.world.project(wc), b = r.screenBox();
      this.photoRing.set(c.x, g.H - c.y, Math.max(22, (b.y1 - b.y0) * 0.5), 1 - this.photoFuse / M.warn, t, this.photoFuse, b, wc);
    }
    if (this.photoFuse <= 0) {   // it flashes at them: blinded a while
      this.endPhotoRing(); this.photoFuse = rr(M.fuse); r.ready = true;
      sfx.shutter(); g.post.flash(1, 0xffffff); this.blind = M.blind;
      g.playerAttacked({ kind: 'shot', dmg: M.dmg, from: r, slot: -1 });
    }
  }
  // ---- (2) the diary
  deal() {
    const M = this.M.diary, dates = M.pages.map((p) => p.date);
    for (const r of this.pages || []) if (r.alive) r.gone();
    this.nextPage = 0;
    this.pages = dates.map((d, i) => {
      const r = this.relic({ id: `page${i}`, k: pageKey(d), w: 0.9 }, (q, info) => this.pageHit(q, info)), live = r.live; r.idx = i;
      r.live = () => live() && r.idx === this.nextPage && !(this.pageHold > 0);   // (only the next one by date, once the last one's page is read)
      return r;
    });
    // (their places round her shuffled: the order is in the dates, not in where they are)
    const slots = this.pages.map((_, i) => i).sort(() => Math.random() - 0.5);
    this.pages.forEach((r, i) => { r.slot = slots[i]; });
  }
  // the glowing page shot: it takes a while to tear (diary.pageHp - user 2026-10-22: one touch and it broke, two of them took half her
  // bar); torn, its line is held up to be read and it tears into her, and the next page lights up only once that page has been read
  pageHit(r, info) {
    const g = this.game, M = this.M.diary;
    r.hp = (r.hp ?? M.pageHp ?? 1) - (info?.dmg || 0); if (info) info.dealt = info.dmg; r.flash = 1;
    if (info?.uv) r.paint?.(info);
    if (r.hp > 0) { if ((this.tickT || 0) <= 0) { (sfx.paperRip || sfx.tear)(0); this.tickT = 0.12; } g.fx.confetti(r.center(), 3, 0.8, [COL.paper, COL.white]); return; }
    this.nextPage++;
    const line = M.pages[r.idx], P = r.root.position, to = this.uvToWorld(0.5, 0.6);
    r.taken = r.busy = true; r.u.outlineOn.value = 0;
    g.tweens.to(P, { x: to.x, y: to.y, z: to.z }, 0.35, { ease: Ease.inQuad, onDone: () => {
      r.gone(); if (!this.alive || this.stage !== 1 || this.mutating) return;   // (a page still on its way when the form changed: nothing)
      g.hud.gl.note(line.date, tr(line.text)); g.post.styleBurst(0.4, [8, 7], 0.08);   // (held up to be read, not slammed: user 2026-10-22)
      this.pageHold = (g.hud.gl.notes.life || 4) + 0.3;
      this.crushed(this.maxHp * M.chunk, M.stun); sfx.tear(0);
      if (this.nextPage >= this.pages.length) this.later(1.5, () => { if (this.stage === 1) this.deal(); });
    } });
  }
  pagesTick(dt, t) {
    this.pageHold = Math.max(0, (this.pageHold || 0) - dt); this.tickT = (this.tickT || 0) - dt;
    for (const r of this.pages || []) {
      if (!r.alive || r.busy || r.taken) continue;
      this.orbit(r, r.slot / this.pages.length * Math.PI * 2, dt, t, 3.0, 0.35 + 0.12 * (r.slot % 3));
      // the one to shoot: bigger, a pulsing gold edge; the rest faded back
      const on = r.idx === this.nextPage && !(this.pageHold > 0), s = r.inner.scale.x + ((on ? 1.3 : 0.8) - r.inner.scale.x) * Math.min(1, dt * 6);
      r.inner.scale.set(s, s, 1); r.u.opacity.value += ((on ? 1 : 0.4) - r.u.opacity.value) * Math.min(1, dt * 6);
      if (on) glow(r, t); else r.u.outlineOn.value = 0;
    }
  }
  // ---- (3) the coffin
  makePit() {   // (round her: the children's ghosts circling, the little coffin she watches over; the hole itself opens under a girl: sink)
    const g = this.game, P = this.root.position, root = new THREE.Group(); root.position.set(P.x, 0.02, P.z + 1.5);
    root.userData.ghosts = [];
    const k = tex['ep1/soul_child'];
    for (let i = 0; i < 6 && k; i++) {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: k, transparent: true, opacity: 0.85, depthWrite: false, color: 0xe8f0ff }));
      const h = 1.5 + (i % 3) * 0.2, ar = k.image.width / k.image.height; m.scale.set(h * ar, h, 1); root.add(m); root.userData.ghosts.push({ m, a: (i / 6) * Math.PI * 2, y: 0.8 + (i % 3) * 0.5 });
    }
    const ck = tex['ep1/coffin'];
    if (ck) { const cm = new THREE.Sprite(new THREE.SpriteMaterial({ map: ck, transparent: true, depthWrite: false })); const ch = 1.4; cm.scale.set(ch * ck.image.width / ck.image.height, ch, 1); cm.position.set(0, ch * 0.5, -1.2); root.add(cm); }
    g.world.scene.add(root); g.post.shake(0.8); sfx.creak?.();
    return root;
  }
  pitTick(dt, t) {
    const r = this.pit; if (!r) return;
    const P = this.root.position; r.position.x += (P.x - r.position.x) * Math.min(1, dt * 1.5); r.position.z += (P.z + 1.5 - r.position.z) * Math.min(1, dt * 1.5);   // (under her wherever she goes)
    for (const G of r.userData.ghosts) { G.a += dt * 0.45; G.m.position.set(Math.cos(G.a) * (this.M.coffin.pit + 0.4), G.y + Math.sin(t * 2 + G.a * 3) * 0.25, Math.sin(G.a) * (this.M.coffin.pit + 0.4) * 0.6); }

  }
  hang(side) {   // a chandelier over her (shot through its chain it comes down on her: Gimmick drop + crush)
    const g = this.game, P = this.root.position, M = this.M.coffin, H = g.world.set?.hall?.h ?? 6;
    const c = new Gimmick(g, { id: `chandelier${side}`, k: 'enemy/chandelier_disguise', on: 'air', x: P.x + side * M.hangX, y: H - 1.4, z: P.z + 0.8, w: 1.8,
      do: [{ drop: { t: 0.5 }, crush: { r: M.crushR, dmg: this.maxHp * M.crush, stun: M.stun } }, { t: 0.6, say: 'stagger' }] });
    g.actors.push(c); return c;
  }
  // an arm reaches in for one of the girls from her edge of the picture, through a rip there (user 2026-10-20: not hands out of the floor;
  // from the screen's sides, an eye in the palm to aim at): it grabs her and drags her down toward the pit; shots at the eye (only the eye)
  // make it let go, or she is pulled in. Placed in screen terms each frame (from the edge to her waist), drawn over the girls (layer 1)
  drag() {
    const g = this.game, M = this.M.coffin, A = M.arm, slot = g.pickTarget(this.root.position.x - g.world.camPos.x), p = g.players[slot];
    if (!p || p.state === 'away' || p.state === 'down' || !tex[A.reach]) { this.volley(); return; }
    const arm = this.relic({ id: 'arm', k: A.reach, w: 2 }, (r, info) => this.armHit(r, info));
    arm.billboard = false; arm.root.traverse((o) => { o.layers.set(1); o.renderOrder = 14; }); arm.inner.scale.setScalar(1);
    arm.side = slot ? 1 : -1; arm.out = 0; arm.left = M.hits;
    this.dragging = { p, arm, t: -A.reach_t, gripped: false, hole: this.hole(p), lift: g.H * (A.lift ?? 0.2) };   // (lifted into view first: the hole opens there, above the HUD)
    p.dragged = true;
    this.rip(arm.side, true);
    this.attackPose(0.6); sfx.roar(); g.hud.gl.stickers.say(p, 'scare');
    this.timer = M.time + A.reach_t + 1.5 + rr(this.def.rest);
  }
  armHit(r, info) {
    const g = this.game, [eu, ev, er] = this.eyeUv(r);
    if (Math.hypot((info.uv.u - eu) * r.w / r.h, info.uv.v - ev) > er) { this.glance(info); return; }   // (only the eye)
    info.dealt = 0; r.flash = 1; sfx.clang(); g.fx.ink(r.uvToWorld(info.uv.u, info.uv.v), 6, 1.2, COL.hot);
    if (--r.left <= 0) this.release(false);
  }
  // the rip at the edge of the picture it comes out of: purple-black, smoking
  rip(side, open) {
    const g = this.game;
    if (open) { this.ripSide = side; this.ripK = 0; } else this.ripSide = null;
  }
  // the black hole that opens under her feet (on her, drawn with the girls: a swirl of dark with a violet rim, wisps rising, a lip of
  // light along its near edge drawn over her - she stands in it and sinks)
  hole(p) {
    const mk = (front) => new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false,
      uniforms: { time: { value: 0 }, k: { value: 0 }, front: { value: front ? 1 : 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float time, k, front; varying vec2 vUv;
        void main(){ vec2 p = vUv * 2.0 - 1.0; float r = length(p); if (r > 1.0) discard;
          float a = atan(p.y, p.x), sw = 0.5 + 0.5 * sin(a * 5.0 + r * 9.0 - time * 3.0);
          if (front > 0.5) { if (p.y > 0.0) discard; float lip = smoothstep(0.1, 0.0, abs(r - 0.94)); gl_FragColor = vec4(vec3(0.85, 0.45, 1.0) * lip, lip * k); return; }
          float rim = smoothstep(0.75, 0.97, r) * (1.0 - smoothstep(0.97, 1.0, r));
          vec3 c = mix(vec3(0.02, 0.0, 0.04), vec3(0.25, 0.05, 0.35), sw * (1.0 - r) * 0.6) + vec3(0.7, 0.3, 1.0) * rim;
          gl_FragColor = vec4(c, smoothstep(1.0, 0.92, r) * k); }` }));
    const back = mk(false), front = mk(true);
    back.renderOrder = 9.5; front.renderOrder = 15;
    // the crowd of hands up out of it round her feet (ep1/hands_crowd) - over her, for a girl without a caught picture of her own (R77)
    const hk = this.M.coffin.hands, own = p.hero?.poses?.dragged, ht = !own && tex[hk] ? tex[hk].clone() : null;
    if (ht) { ht.repeat.set(1, 0.55); ht.offset.set(0, 0.45); ht.needsUpdate = true; }   // (its upper part: the fingers, the wrists inside the rim)
    const hands = ht ? new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ map: ht, transparent: true, depthTest: false, depthWrite: false })) : null;
    if (hands) hands.renderOrder = 14;
    for (const m of [back, front, hands].filter(Boolean)) { m.layers.set(1); m.frustumCulled = false; p.group.add(m); }
    return { back, front, hands, p, k: 0, y: 0 };
  }
  holeTick(H, dt, open) {
    const g = this.game, p = H.p, w = (p.hero ? p.hero.dims('cover').w : g.H * 0.25) * 1.15, h = w * 0.3;
    H.k = Math.max(0, Math.min(1, H.k + (open ? dt * 3 : -dt * 2.5)));
    const hy = p.bottom + H.y;
    for (const m of [H.back, H.front]) { m.position.set(p.baseX, hy, 0); m.scale.set(w * (0.4 + 0.6 * H.k), h * (0.4 + 0.6 * H.k), 1); m.material.uniforms.k.value = H.k; m.material.uniforms.time.value += dt; }
    if (H.hands) {   // (rising out of the hole with it, their cut-off wrists inside its rim)
      const ht = tex[this.M.coffin.hands], hw = w * 0.75, hh = hw * ht.image.height / ht.image.width * 0.55;   // (round her shins)
      H.hands.position.set(p.baseX, hy - h * 0.3, 0); H.hands.scale.set(hw, hh * H.k, 1); H.hands.material.opacity = Math.min(1, H.k * 1.5);
    }
    // what is below its near rim is hidden: the clip on her pictures, in device pixels
    const dpr = g.G.renderer?.getPixelRatio?.() ?? 1, on = H.k > 0.05;
    const S = p.hero ? Object.values(p.hero.poses).flatMap((m) => [m, m.userData.halo, ...(m.userData.echoes || [])]).filter(Boolean) : [];
    for (const m of S) m.material.uniforms.sink?.value.set(on ? p.baseX * dpr : 0, on ? hy * dpr : 0, on ? w * 0.5 * (0.4 + 0.6 * H.k) * dpr : 0, on ? h * 0.5 * (0.4 + 0.6 * H.k) * dpr : 0);
    if (Math.random() < dt * 20 * H.k) {   // (wisps rising out of it)
      const q = g.world.screenToWorld(p.baseX + (Math.random() - 0.5) * w * 0.8, g.H - hy, 2.4);
      g.fx.wNorm.emit({ x: q.x, y: q.y, z: q.z, vx: 0, vy: 0.5, vz: 0, drag: 0.5, life: 1.2, size: 0.12, size1: 0.35, color: [0.35, 0.1, 0.5], a: 0.7, a1: 0, frame: 3 });
    }
    if (!open && H.k <= 0) { for (const m of [H.back, H.front, H.hands].filter(Boolean)) { m.removeFromParent(); m.geometry.dispose(); if (m === H.hands) m.material.map.dispose(); m.material.dispose(); } for (const m of S) m.material.uniforms.sink?.value.set(0, 0, 0, 0); return false; }
    return true;
  }
  release(silent) {
    const D = this.dragging; if (!D) return;
    this.dragging = null; D.p.dragged = false;
    if (D.hole) (this.closing || (this.closing = [])).push(D.hole);
    const arm = D.arm, g = this.game;
    if (!silent) { g.fx.ink(arm.center(), 16, 1.8, COL.violet); sfx.paperRip?.(0); g.post.shake(0.6); }
    arm.retract = true; arm.live = () => false; arm.u.outlineOn.value = 0;   // (it pulls back out through its rip)
    if (this.eyeMark) { this.eyeMark.remove(); this.eyeMark = null; }
    g.tweens.to(D.p, { y0: 0 }, 0.4, { ease: Ease.outBack });
  }
  // where the arm is: its hand (the picture's right end) goes from just past her edge of the picture to her waist as it comes out (out
  // 0..1), the rest of it trailing back off the edge; a few metres in front of the camera, lying in the picture's plane. The arm from the
  // right is the same picture turned round (upside down after the turn, so it is flipped back: scale.y < 0)
  placeArm(arm, P) {
    const g = this.game, w = g.world, A = this.M.coffin.arm, side = arm.side;
    // (the hand stops just short of her, on her outer side: she stays seen)
    const ex = side < 0 ? -g.W * 0.08 : g.W * 1.08, hx = P.baseX + side * g.W * (A.short ?? 0.06), hy = Math.min(g.H * (A.handY ?? 0.5), g.H - (P.bottom + (P.y0 || 0) + (P.hero ? P.hero.standH() * 0.7 : g.H * 0.3))), ey = hy - g.H * (A.slope ?? 0.3);   // (at her shoulders, above the HUD corners)
    const a = w.screenToWorld(ex, ey, A.dist), b = w.screenToWorld(hx, hy, A.dist), dir = b.clone().sub(a), d = dir.length(); dir.normalize();
    // (its size by the picture's height - the hand about a third of it - whatever her distance from the edge: the rest of the arm stays off it)
    const vh = 2 * A.dist * Math.tan((w.camera.fov * Math.PI) / 360), L = Math.max(d * (A.over ?? 1.25), (A.size ?? 0.6) * vh * (arm.w / arm.h));
    const hand = a.clone().addScaledVector(dir, d * arm.out + d * 0.12);
    arm.root.position.copy(hand).addScaledVector(dir, -L / 2);
    arm.root.quaternion.copy(w.camera.quaternion); arm.root.rotateZ(Math.atan2(-(hy - ey), hx - ex));
    const s = L / arm.w; arm.root.scale.set(s, side > 0 ? -s : s, 1);
  }
  eyeUv(arm) { const A = this.M.coffin.arm, [eu, ev, er] = arm.gripped ? A.eye_grip : A.eye_reach; return [eu, arm.side > 0 ? 1 - ev : ev, er]; }
  dragTick(dt) {
    const g = this.game, M = this.M.coffin, A = M.arm;
    // the rip's smoke at the picture's edge while it is open
    if (this.ripSide) {
      const w = g.world, ex = this.ripSide < 0 ? g.W * 0.01 : g.W * 0.99;
      this.ripAcc = (this.ripAcc || 0) + dt * 30;
      while (this.ripAcc >= 1) { this.ripAcc -= 1; const p = w.screenToWorld(ex, g.H * (0.35 + Math.random() * 0.5), 2.6);
        g.fx.wNorm.emit({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, vz: 0, life: 1.0, size: 0.35, size1: 0.9, color: [0.22, 0.05, 0.3], a: 0.85, a1: 0, frame: 3 });
        if (Math.random() < 0.3) g.fx.wAdd.emit({ x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0, life: 0.5, size: 0.15, size1: 0.02, color: [1, 0.4, 0.8], a: 1, a1: 0, frame: 1 }); }
    }
    for (const r of this.relics) if (r.retract && r.alive) {
      r.out = Math.max(0, r.out - dt * 2.5); this.placeArm(r, r.who || this.game.players[r.side > 0 ? 1 : 0]);
      if (r.out <= 0) { r.gone(); if (!this.dragging) this.rip(0, false); }
    }
    this.closing = (this.closing || []).filter((H) => this.holeTick(H, dt, false));
    const D = this.dragging; if (!D) return;
    if (D.hole) { D.hole.y = D.lift; this.holeTick(D.hole, dt, true); }
    D.t += dt; const arm = D.arm;
    arm.who = D.p; arm.out = Math.min(1, arm.out + dt / A.reach_t);
    if (!D.gripped && arm.out >= 1) { D.gripped = arm.gripped = true; arm.setFrame(A.grip); g.post.shake(0.6); sfx.thud?.(0); }
    this.placeArm(arm, D.p);
    // the ring round the eye
    if (!this.eyeMark) this.eyeMark = g.fx.orbit('shot', D.p.slot);
    const [eu, ev, er] = this.eyeUv(arm), ec = arm.uvToWorld(eu, ev), sc = g.world.project(ec), top = g.world.project(arm.uvToWorld(eu, ev + er));
    this.eyeMark.set(sc.x, g.H - sc.y, Math.max(20, Math.abs(top.y - sc.y)), 0.2, performance.now() / 1000, 9, null, null);
    if (D.t <= 0) { D.p.y0 += (D.lift - D.p.y0) * Math.min(1, dt * 8); return; }   // (yanked up into view, struggling)
    D.p.y0 = D.lift - Math.pow(D.t / M.time, 1.3) * (D.p.hero ? D.p.hero.standH() * 0.75 : g.H * 0.3);   // (she sinks into the hole under her)
    if (D.t < M.time) return;
    // she went in: hurt, gone a while, then she climbs back up
    this.release(true);
    g.playerAttacked({ kind: 'ram', dmg: M.dmg, from: this, slot: D.p.slot, heavy: true }); sfx.slam(); g.post.shake(1.2);
    // (the last of her goes under, the hole closes over her; later she climbs back out of the floor)
    g.tweens.to(D.p, { y0: D.lift - (D.p.hero ? D.p.hero.standH() * 1.2 : g.H * 0.5) }, 0.35, { ease: Ease.inQuad, onDone: () => { D.p.state = 'away'; } });
    g.tweens.wait(M.away, () => { if (D.p.state === 'away') { D.p.state = 'cover'; D.p.y0 = 0; } });
  }

  // the things circle her (a lazy ring in front of her, at their heights)
  orbit(r, a0, dt, t, rad, yk) {
    const g = this.game, bp = this.root.position, cam = g.world.camera.position, dx = cam.x - bp.x, dz = cam.z - bp.z, dl = Math.hypot(dx, dz) || 1, fx = dx / dl, fz = dz / dl;
    r.ph = (r.ph || 0) + dt * 0.5; const a = a0 + r.ph, s = Math.sin(a), k = Math.cos(a);
    const to = new THREE.Vector3(bp.x + fx * (1.2 + k * 0.6) - fz * s * rad, (this.S.float ? bp.y - this.S.h * 0.5 : 0) + this.S.h * yk + Math.sin(t * 1.4 + a0) * 0.25, bp.z + fz * (1.2 + k * 0.6) + fx * s * rad);
    r.root.position.lerp(to, 1 - Math.exp(-dt * 4));
  }

  // where the AI partner aims (src/core/input.js): the thing that matters now - the eye of the arm holding her partner, the photo when
  // she is unseen, the next page of the diary - else her core when it is open
  aimAt() {
    const g = this.game, at = (o, u = 0.5, v = 0.5) => { const s = g.world.project(o.uvToWorld(u, v)); return { x: s.x, y: s.y }; };
    if (this.dragging?.arm?.alive && this.dragging.t > 0) { const [eu, ev] = this.eyeUv(this.dragging.arm); return at(this.dragging.arm, eu, ev); }
    if (this.stage === 0 && !(this.exposedT > 0) && this.photo?.alive && this.photo.ready) return at(this.photo);
    if (this.stage === 1) { const r = this.pages?.find((q) => q.alive && !q.busy && q.idx === this.nextPage); return r ? at(r) : null; }
    return super.aimAt();
  }
  // ---------------------------------------------------------------- hits and the end
  weakNow() {
    if (!super.weakNow()) return false;
    if (this.stage === 0) return this.exposedT > 0;   // (unseen in the dark but for the photo's flash)
    return this.stage !== 1;   // (the diary: only its pages hurt her)
  }
  hit(info) {
    info.dmg *= this.stage === 2 && this.openT > 0 ? this.M.coffin.openMul : 1;
    super.hit(info);
    this.endCheck();
  }
  crushed(dmg, stun) { super.crushed(dmg, stun); if (this.stage === 2) this.openT = this.M.coffin.open; this.endCheck(); }
  // her strength gone in her last form: the three things come out and hang in a row before her (TheThing.grieve, offer, rest)
  endCheck() {
    if (this.stage !== this.def.stages.length - 1 || this.grief || !this.alive || this.hp > 1) return;
    const g = this.game, R = this.def.ritual, P = this.root.position;
    this.leaveForm();
    this.keeps = R.items.map((k, i) => { const gm = new KeepRow(g, this, i, { id: `ritual${i}`, k, on: 'air', x: P.x, y: this.S.h * 0.5, z: P.z, w: R.w ?? 1.3, station: g.stationId }); g.actors.push(gm); return gm; });
    this.ritualNext = 0; this.stuck = 0; this.talkT = 0;
    this.grieve();
  }
  keepTick(dt) { if (this.grief) super.keepTick(dt); }   // (no swinging things in the fight: only the row at the end)

  // ---------------------------------------------------------------- between forms: repainted (not the prologue's tape and title)
  mutate(n) {
    const g = this.game, M = this.M.repaint;
    this.mutating = true; this.seq++; this.endWindup(); this.armor = false; g.lull = true; g.clearProjectiles?.();
    this.state = 'hurt'; this.play('hurt'); sfx.madness();
    g.post.styleBurst(M.time, [7, 10, 2, 8, 7, 2], 0.16, 0x1a0010, 0xff5aa8);
    // her word, one syllable a beat (bosses.json madame.repaint.word)
    const word = tr(M.word) || '', parts = [...word].filter((ch) => ch.trim());
    parts.forEach((ch, i) => g.tweens.wait(0.25 + i * (M.time / (parts.length + 2)), () => { g.mv.slam(ch, '', 0.7); sfx.thud?.(0); g.post.shake(0.5); }));
    g.tweens.wait(M.time * 0.8, () => g.mv.slam(word, '', 1.8));   // (then the whole of it, held: user 2026-10-22, too fast to read; real time, as her change is)
    // she runs like wet paint, and is painted in again, changed (her drawing dissolving away and back)
    g.tweens.run(M.time * 0.45, (e) => { this.u.dissolve.value = e; this.inner.scale.y = 1 + e * 0.15; }, { onDone: () => {
      this.setStage(n); this.inner.scale.set(1, 1, 1);
      g.tweens.run(M.time * 0.45, (e) => { this.u.dissolve.value = 1 - e; }, { onDone: () => {
        this.u.dissolve.value = 0; this.mutating = false; g.lull = false; this.pi = 0; this.timer = 1.2; this.state = 'idle'; this.play('idle', 3);
        g.cues.run(this.def.cues?.[`s${n + 1}`]);
      } });
    } });
  }

  update(dt, t) {
    super.update(dt, t);
    if (!this.alive) return;
    // unseen in the dark (form 1): a faint shimmer of her, solid while the photo's flash shows her
    const show = this.stage === 0 && !this.mutating ? (this.exposedT > 0 ? 1 : 0.1 + 0.06 * Math.sin(t * 7)) : 1;
    this.u.opacity.value += (show - this.u.opacity.value) * Math.min(1, dt * 8);
    this.openT = Math.max(0, (this.openT || 0) - dt);
    if (this.blind > 0) { this.blind -= dt; this.game.post.u.flash.value = Math.max(this.game.post.u.flash.value, Math.min(0.9, this.blind / this.M.photo.blind)); }
    if (this.stage === 0) this.photoTick(dt, t);
    if (this.stage === 1) this.pagesTick(dt, t);
    if (this.stage === 2) { this.pitTick(dt, t); this.dragTick(dt); }
    if (this.dream) this.dreamTick(this.game.rdt ?? dt, t);   // (her end, dreamed: real time)
  }
  die(calm) { this.leaveForm(); this.dreamDown(true); this.lightsOut(0); super.die(calm); }

  // ---------------------------------------------------------------- her end, dreamed (user 2026-10-22: the three things at the end had no
  // pressure - make the place go strange, like an animated film: memories, shadows of the past floating up, crayon drawings changing like
  // a slide show, photos coming up and slowly turning dark and grotesque; and, laid to rest, the rising of Sweet Home's ending)
  // While she kneels the studio dims and petals drift; picture frames float up behind and beside her (never before her face), each
  // a slide show of what happened (bosses.json madame.dream): the happy days; with the photo given back, the oven and its fire; with the
  // diary, the crying - and they rot, darken and flicker red, the room darker; with the little coffin they melt into light (rest)
  grieve() { super.grieve(); this.dreamUp(); }
  dreamUp() {
    const D = this.M.dream; if (!D || this.dream) return;
    const g = this.game, mk = (k) => { const t = tex[k]; return t ? new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide })) : null; };
    this.dream = { stage: -1, frames: D.frames.map((f, i) => {
      const m = mk(D.sets[0][i % D.sets[0].length]); if (!m) return null;
      m.renderOrder = 3; g.world.scene.add(m);
      return { m, f, i, k: i, next: rr(D.every) * (0.4 + i * 0.2), ph: Math.random() * 6, flick: 0 };
    }).filter(Boolean) };
  }
  dreamTick(dt, t) {
    const D = this.M.dream, R = this.dream; if (!D || !R) return;
    const g = this.game, bp = this.root.position, cam = g.world.camera.position, dx = cam.x - bp.x, dz = cam.z - bp.z, dl = Math.hypot(dx, dz) || 1, fx = dx / dl, fz = dz / dl;
    const stage = this.resting ? 3 : Math.min(2, this.ritualNext || 0);
    if (stage !== R.stage) {   // (on to the next memory: the room darker, the frames' colour)
      R.stage = stage; if (stage < 3) this.lightsOut(D.dark[stage]);
      for (const F of R.frames) { F.next = 0.15 + F.i * 0.12; }
      if (stage > 0 && stage < 3) { g.post.styleBurst(0.6, stage > 1 ? [7, 2, 8] : [8, 7], 0.12, 0x1a0008, stage > 1 ? 0xff2040 : 0xffa040); sfx.madness(); }
    }
    const tint = new THREE.Color(D.tint[Math.min(2, stage)]);
    for (const F of R.frames) {
      const m = F.m, [x, y, back, w] = F.f, set = D.sets[Math.min(2, stage)];
      F.ph += dt;
      // where it floats: beside and behind her (across x, up y, back away from the camera), drifting and bobbing; turned a little, in 3D
      const sway = Math.sin(F.ph * 0.5 + F.i) * 0.35, bob = Math.sin(F.ph * 0.8 + F.i * 1.7) * 0.25;
      m.position.set(bp.x - fz * (x + sway) - fx * back, y + bob, bp.z + fx * (x + sway) - fz * back);
      m.lookAt(cam); m.rotateY(Math.sin(F.ph * 0.4 + F.i) * 0.35); m.rotateZ(Math.sin(F.ph * 0.3 + F.i * 2) * 0.06);
      const tx = m.material.map, ar = tx?.image ? tx.image.width / tx.image.height : 1; m.scale.set(w * ar, w, 1);
      // its slide show: a flicker, then the next picture of this memory
      F.next -= dt;
      if (F.next <= 0 && stage < 3) { F.next = rr(D.every); F.flick = 0.16; F.k = (F.k + 1 + Math.floor(Math.random() * 2)) % set.length;
        const nt = tex[set[(F.k + F.i) % set.length]]; if (nt) m.material.map = nt; }
      F.flick = Math.max(0, F.flick - dt);
      const want = stage === 3 ? 0 : (F.flick > 0 ? 0.15 : 0.92) * (stage === 2 && Math.random() < 0.06 ? 0.4 : 1);   // (the last memories glitch)
      m.material.opacity += (want - m.material.opacity) * Math.min(1, dt * (stage === 3 ? 1.5 : 10));
      m.material.color.lerp(stage === 3 ? WHITE3 : tint, Math.min(1, dt * 1.2));
      if (Math.random() < dt * (stage === 3 ? 18 : 3)) g.fx.wAdd.emit({ x: m.position.x + (Math.random() - 0.5) * w, y: m.position.y + (Math.random() - 0.5) * w, z: m.position.z, vx: 0, vy: stage === 3 ? 0.9 : 0.25, vz: 0, life: 1.6, size: 0.07, size1: 0.01, color: stage === 2 ? [1, 0.3, 0.35] : [1, 0.85, 0.9], a: 0.9, a1: 0, frame: 1 });
    }
    // (petals in the air round her while it lasts)
    if (stage < 3 && Math.random() < dt * 8) { const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 4; g.fx.wAdd.emit({ x: bp.x + Math.cos(a) * r, y: 4 + Math.random() * 2, z: bp.z + Math.sin(a) * r * 0.5, vx: (Math.random() - 0.5) * 0.3, vy: -0.35, vz: 0, life: 4, size: 0.09, size1: 0.06, color: stage === 2 ? [0.7, 0.1, 0.18] : [1, 0.7, 0.82], a: 0.85, a1: 0, frame: 3 }); }
  }
  dreamDown(now) {
    const R = this.dream; if (!R) return; this.dream = null;
    for (const F of R.frames) { const m = F.m; const go = () => { m.removeFromParent(); m.geometry.dispose(); m.material.dispose(); };
      if (now) go(); else this.game.tweens.run(1.4, (e) => { m.material.opacity *= 1 - e; m.position.y += 0.02; }, { onDone: go }); }
  }
  // laid to rest - the rising of Sweet Home's ending: a column of light comes down on her, her child's soul floats down out of it to her
  // side, she says her last words, and the two of them rise together into the light and are gone (then die, calm)
  rest() {
    const g = this.game, P = this.root.position;
    this.seq++; this.resting = true;
    if (this.dream) { this.dreamTick(0, 0); g.tweens.wait(1.6, () => this.dreamDown()); }
    this.lightsOut(0.4); g.post.flash(0.5, 0xfff6e8); sfx.clear();   // (dim enough for the light to stand out)
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.5, 18, 28, 1, true), new THREE.MeshBasicMaterial({ map: beamTex(), color: 0xfff0dc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    beam.position.set(P.x, 9, P.z); beam.renderOrder = 4; g.world.scene.add(beam);
    g.tweens.run(1.4, (e) => { beam.material.opacity = e * 0.9; });
    const ck = tex['ep1/soul_child'];
    // (a picture facing the camera - the place draws no sprites - at her side, in front of her: seen)
    const ch = 1.6, child = ck ? new THREE.Mesh(new THREE.PlaneGeometry(ch * ck.image.width / ck.image.height, ch), new THREE.MeshBasicMaterial({ map: ck, transparent: true, opacity: 0, depthWrite: false, fog: false })) : null;
    if (child) {
      child.position.set(P.x + 2.3, 7, P.z + 1.4); child.renderOrder = 5; g.world.scene.add(child);
      child.onBeforeRender = () => child.lookAt(g.world.camera.position);
      g.tweens.run(2.6, (e) => { child.position.y = 7 - (7 - ch * 0.55) * (1 - (1 - e) * (1 - e)); child.material.opacity = Math.min(1, e * 2); }, { delay: 0.7 });
    }
    this.closeUp('rest', { lull: true, dist: this.S.h * 1.25, v: 0.5, up: 0.4, in: 1.0, out: 0.9, min: 10 });   // (she and her child, up close)
    const lift = () => {
      const y0 = P.y, c0 = child?.position.y ?? 0;
      g.tweens.run(4.4, (e) => {
        const k = e * e; P.y = y0 + k * 4.5;
        if (child) { child.position.y = c0 + k * 4.5; child.position.x += (P.x + 1.2 - child.position.x) * 0.03; child.material.opacity = 1 - Math.max(0, (e - 0.7) / 0.3); }
        this.u.tint.value.setRGB(1, 0.97, 0.9); this.u.tintAmt.value = e * 0.75;   // (going white in the light)
        if (Math.random() < 0.5) { const q = this.uvToWorld(rnd(0.2, 0.8), rnd(0.1, 0.9)); g.fx.wAdd.emit({ x: q.x, y: q.y, z: q.z, vx: 0, vy: 1.4, vz: 0, life: 1.6, size: 0.09, size1: 0.01, color: [1, 0.95, 0.85], a: 1, a1: 0, frame: 1 }); }
      }, { onDone: () => {
        if (child) g.tweens.run(0.8, (e) => { child.material.opacity = 0; }, { onDone: () => { child.removeFromParent(); child.geometry.dispose(); child.material.dispose(); } });
        g.tweens.run(2.4, (e) => { beam.material.opacity = 0.9 * (1 - e); }, { delay: 1.2, onDone: () => { beam.removeFromParent(); beam.geometry.dispose(); beam.material.dispose(); } });
        if (this.alive) this.die(true);
      } });
    };
    g.tweens.wait(5.2, lift);
  }
}
const WHITE3 = new THREE.Color(1, 1, 1);
let BEAM = null;
function beamTex() {   // (the column of light: bright down its middle, fading at its edges and toward the floor)
  if (BEAM) return BEAM;
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
  const gv = x.createLinearGradient(0, 0, 0, 256); gv.addColorStop(0, 'rgba(255,255,255,1)'); gv.addColorStop(0.7, 'rgba(255,250,235,0.7)'); gv.addColorStop(1, 'rgba(255,240,220,0)');
  x.fillStyle = gv; x.fillRect(0, 0, 64, 256);
  x.globalCompositeOperation = 'destination-in'; const gh = x.createLinearGradient(0, 0, 64, 0); gh.addColorStop(0, 'rgba(0,0,0,0.25)'); gh.addColorStop(0.5, 'rgba(0,0,0,1)'); gh.addColorStop(1, 'rgba(0,0,0,0.25)'); x.fillStyle = gh; x.fillRect(0, 0, 64, 256);
  BEAM = new THREE.CanvasTexture(c); BEAM.colorSpace = THREE.SRGBColorSpace; return BEAM;
}

// her three things for the end, straight into their row before her (no swinging, no blows: the fight is over; unseen until her close look
// is over: TheThing.grieve)
class KeepRow extends Keepsake {
  constructor(game, boss, i, g) { super(game, boss, i, g); this.still(); }
}
