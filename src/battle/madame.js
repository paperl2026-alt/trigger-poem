// Madame Rotten Honey (docs/DESIGN.md 第 1 话 10; bosses.json madame, beh "madame"; user 2026-10-20: each of her child's things is a form
// with its own attack and way to fight her, Sweet Home's own mechanics brought back, and not staged like the prologue's boss):
//   form 1, the PHOTO (Sweet Home: the camera that shows what is hidden in the frescoes) - the studio goes dark and she melts into it: unseen,
//            untouchable; the photo drifts by her: shot, it flashes and she stands there, lit, for a few seconds (open to the guns); it
//            gathers a flash of its own now and then (shoot it first, or everyone is blinded); she hurls the studio's things at them
//   form 2, the DIARY (the torn diary pages that tell the truth date by date) - her pages swirl round her, each with a date: shot in the
//            order of their dates, each slams its line of the truth across the screen and tears a piece out of her; a wrong one flies at the
//            one who shot it; she flings storms of paper; shots at her do little
//   form 3, the COFFIN (the pit with the ghosts round it, a friend pulled up by the rope; the coffin's bones looking back) - the floor
//            round her gives way into a pit, children's ghosts circling it; ghost hands rise and drag one of the girls toward it: the
//            other shoots them off, or she falls in (gone a while, hurt); the chandeliers over her: shot down they crush her (Game.harm)
// Between forms no warning tape, no title, no black bars (that is the prologue's): the picture goes to wet paint and datamosh, her word
// beats across the screen one syllable at a time, and she is painted back in, changed. At the end the three things in a row before her,
// shown to her in their order (TheThing.grieve / offer / rest): Sweet Home's ending.
import * as THREE from 'three';
import { tex } from '../core/assets.js';
import { sfx } from '../core/audio.js';
import { tr } from '../core/i18n.js';
import { Ease } from '../core/tween.js';
import { TheThing, Keepsake } from './thing.js';
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
    } else if (n === 1) {   // the diary: its pages round her
      this.lightsOut(0);
      this.deal();
    } else if (n === 2) {   // the coffin: the pit, the ghosts round it, the chandeliers over her
      this.lightsOut(0);
      this.pit = this.makePit();
      this.chandeliers = [-1, 1].map((s) => this.hang(s));
    }
  }
  leaveForm() {
    for (const r of this.relics) if (r.alive) r.gone();
    this.relics = []; this.photo = null; this.pages = null;
    for (const c of this.chandeliers || []) if (c.alive && !c.spent) c.act({ gone: true });
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
    this.later(M.reveal, () => { this.lightsOut(M.dark); });
    this.later(M.recharge, () => { if (this.photo === r) { r.ready = true; r.flash = 0.8; } });
  }
  endPhotoRing() { if (this.photoRing) { this.photoRing.remove(); this.photoRing = null; } }
  photoTick(dt, t) {
    const g = this.game, r = this.photo, M = this.M.photo; if (!r?.alive) return;
    this.orbit(r, 0, dt, t, 2.2, 0.62);
    r.u.outlineOn.value = r.ready ? 1 : 0.2;
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
    this.pages = dates.map((d, i) => { const r = this.relic({ id: `page${i}`, k: pageKey(d), w: 0.9 }, (q, info) => this.pageHit(q, info)); r.idx = i; return r; });
    // (their places round her shuffled: the order is in the dates, not in where they are)
    const slots = this.pages.map((_, i) => i).sort(() => Math.random() - 0.5);
    this.pages.forEach((r, i) => { r.slot = slots[i]; });
  }
  pageHit(r, info) {
    const g = this.game, M = this.M.diary, by = info.by;
    if (r.idx === this.nextPage) {   // right: the page's line slammed across, and it tears into her
      this.nextPage++;
      const line = M.pages[r.idx], P = r.root.position, to = this.uvToWorld(0.5, 0.6);
      r.taken = r.busy = true; r.u.outlineOn.value = 0;
      g.tweens.to(P, { x: to.x, y: to.y, z: to.z }, 0.35, { ease: Ease.inQuad, onDone: () => {
        r.gone(); if (!this.alive || this.stage !== 1 || this.mutating) return;   // (a page still on its way when the form changed: nothing)
        g.mv.slam(tr(line.text), line.date, 1.8); g.post.styleBurst(0.5, [8, 7], 0.1);
        this.crushed(this.maxHp * M.chunk, M.stun); sfx.tear(0);
        if (this.nextPage >= this.pages.length) this.later(1.5, () => { if (this.stage === 1) this.deal(); });
      } });
      return;
    }
    // wrong: it flies at whoever shot it
    sfx.miss(); r.flash = 1; r.busy = true;   // (not shot again on its way: one wrong page, one cut)
    const q = r.q = (r.q || 0) + 1, P = r.root.position, home = P.clone(), c = g.world.camPos, slot = by?.slot ?? 0;
    g.tweens.to(P, { x: c.x + (slot ? 1 : -1) * 1.0, y: 1.5, z: c.z - 2.2 }, 0.3, { ease: Ease.inQuad, onDone: () => {
      if (q !== r.q || !r.alive) return;
      sfx.paperRip?.(0); g.playerAttacked({ kind: 'shot', dmg: M.cut, from: r, slot });
      g.tweens.to(P, { x: home.x, y: home.y, z: home.z }, 0.6, { ease: Ease.outQuad, onDone: () => g.tweens.wait(M.calm ?? 1.2, () => { r.busy = false; }) });
    } });
  }
  pagesTick(dt, t) {
    for (const r of this.pages || []) if (r.alive && !r.busy && !r.taken) this.orbit(r, r.slot / this.pages.length * Math.PI * 2, dt, t, 3.0, 0.35 + 0.12 * (r.slot % 3));
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
    const c = new Gimmick(g, { id: `chandelier${side}`, k: 'enemy/chandelier_idle', on: 'air', x: P.x + side * M.hangX, y: H - 1.4, z: P.z + 0.8, w: 1.8,
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
    if (this.stage === 1) { const r = this.pages?.find((q) => q.alive && !q.busy && q.idx === this.nextPage); if (r) return at(r); }
    return super.aimAt();
  }
  // ---------------------------------------------------------------- hits and the end
  weakNow() {
    if (!super.weakNow()) return false;
    if (this.stage === 0) return this.exposedT > 0;   // (unseen in the dark but for the photo's flash)
    return true;
  }
  hit(info) {
    info.dmg *= this.stage === 1 ? this.M.diary.coreMul : this.stage === 2 && this.openT > 0 ? this.M.coffin.openMul : 1;
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
    parts.forEach((ch, i) => g.etw.wait(0.25 + i * (M.time / (parts.length + 2)), () => { g.mv.slam(ch, '', 0.5); sfx.thud?.(0); g.post.shake(0.5); }));
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
  }
  die(calm) { this.leaveForm(); this.lightsOut(0); super.die(calm); }
}

// her three things for the end, straight into their row before her (no swinging, no blows: the fight is over)
class KeepRow extends Keepsake {
  constructor(game, boss, i, g) { super(game, boss, i, g); this.still(); }
}
