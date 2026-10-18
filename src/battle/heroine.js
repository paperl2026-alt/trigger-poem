// A battle heroine drawn with the jiggle tech (docs/DESIGN.md "主角动起来靠晃动技术", src/jiggle): two NIKKE-style stills per
// heroine (cover / fire), each a deforming mesh with the body layer (weight shift, sway, breathing), the part layer (skirt, sleeves,
// hair, tail, ears), the soft-body flesh lattice, sweat, and breath vapour from the nose. Every other state is motion on these two
// pictures, not more drawings, each on the right picture (DESIGN「画面」): standing (fire) = shooting, walking on to the next stop and
// cheering; crouching (cover) = hiding, reloading in cover (a dip), down (slumped, darkened). Hurt = a jolt + red flash on either.
// Lives in the Player's pixel-space group (camera child, 1 unit = 1 screen px, origin bottom-left). Data: characters/<id>.json "rig"
// (tools/jig_import.py), numbers: tuning/soft.json "jiggle", tuning/layout.json "canvas".
import * as THREE from 'three';
import { tex } from '../core/assets.js';
import { T } from '../core/content.js';
import { SAVE } from '../core/save.js';
import { rigMesh, Body } from '../jiggle/rig.js';
import { Sweat } from '../jiggle/sweat.js';
import { Breath } from '../jiggle/atmo.js';

const SUBSTEP = 1 / 240;

export class Heroine {
  constructor(game, player) {
    this.game = game; this.p = player;
    // her outfit (the select screen's outfit chip, SAVE.chars[id].outfit): the same poses with other clothes (characters/<id>.json rigs)
    const of = player.c.rigs?.[SAVE.chars[player.id]?.outfit];
    const R = this.R = of && tex[of.cover?.img] && tex[of.fire?.img] ? of : player.c.rig;
    this.g = new THREE.Group();
    player.group.add(this.g);
    const r = game.G.renderer, clear = r.getClearColor(new THREE.Color()), clearA = r.getClearAlpha();
    this.poses = {};
    for (const name of ['cover', 'fire']) {
      const P = R[name];
      const m = rigMesh(tex[P.img], P.w.map((k) => tex[k]), P.rig, P.flesh);
      const sw = new Sweat(r, tex[P.w[0]].image, m.userData.flesh, m.userData.ar);
      m.userData.sweat = sw;
      m.material.uniforms.SW.value = sw.rt.texture; m.material.uniforms.SWpx.value.copy(sw.px);
      m.renderOrder = 10 + player.slot; m.visible = name === 'cover'; m.frustumCulled = false;
      m.userData.name = name;
      // the aura halo: the same mesh and uniforms (so it bends with her), drawing only the glow, additive, a little larger, behind
      const hu = { ...m.material.uniforms, auraOnly: { value: 1 } };
      const halo = new THREE.Mesh(m.geometry, new THREE.ShaderMaterial({ uniforms: hu, vertexShader: m.material.vertexShader, fragmentShader: m.material.fragmentShader,
        transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.renderOrder = m.renderOrder - 0.5; halo.frustumCulled = false; halo.visible = false;
      m.userData.halo = halo;
      this.g.add(halo);
      // afterimages for "her special is ready": the same mesh drawn as a flat silhouette in her colour, behind her (DESIGN「必杀好了」)
      m.userData.echoes = [0, 1, 2].map((k) => {
        const eu = { ...m.material.uniforms, auraOnly: { value: 2 }, aura: { value: new THREE.Vector4() }, opacity: { value: 1 } };
        const e = new THREE.Mesh(m.geometry, new THREE.ShaderMaterial({ uniforms: eu, vertexShader: m.material.vertexShader, fragmentShader: m.material.fragmentShader,
          transparent: true, depthTest: false, depthWrite: false }));
        e.renderOrder = m.renderOrder - 0.7 - k * 0.01; e.frustumCulled = false; e.visible = false;
        this.g.add(e); return e;
      });
      this.g.add(m);
      this.poses[name] = m;
    }
    r.setClearColor(clear, clearA);   // the sweat targets clear with transparent black
    this.breath = new Breath(this.g);
    for (const it of this.breath.items) it.m.renderOrder = 13;
    this.body = new Body();
    this.pose = 'cover'; this.out = false;
    this.exert = 0.3; this.acc = 0; this.lastBreath = 0; this.hitT = 0;
    this.canvasPx = 600;
    this.aura = { col: new THREE.Color(1, 1, 1), a: 0, flow: 0, pulse: 0, halo: 0 };
    this.ready = false; this.readyFlash = 0; this.readyK = 0; this.readyCol = new THREE.Color(player.c.color);
  }
  // her special is ready (player.js): she flashes once, then afterimages keep swelling out of her body and fading, until she uses it
  setReady(on) {
    if (on && !this.ready) this.readyFlash = 1;
    this.ready = on;
  }
  // the Fever / skill look (player.js decides): colour, strength 0..1, flow 0..1 (how fast the light runs), pulse (decays), halo size
  setAura(col, a, flow, halo) { this.aura.col.copy(col); this.aura.a = a; this.aura.flow = flow; this.aura.halo = halo; }
  pulse(col) { this.aura.pulse = 1; if (col) this.aura.pcol = col; }
  get J() { return T.jiggle; }   // tuning/soft.json "jiggle"
  layout(W, H) { this.W = W; this.H = H; this.canvasPx = H * T.layout.canvas; }
  // size of a pose on screen (px)
  dims(name) { const P = this.R[name], m = this.poses[name], h = P.h / P.canvasH * this.canvasPx; return { h, w: h / m.userData.ar }; }
  // ---- drives (same feel as the validation)
  kick(k) { this.body.jolt(k, this.J.amp); }                     // Soft-compatible: a jolt into cloth and flesh
  setOut(out) {
    if (out === this.out) return;
    this.out = out;
    const next = out ? 'fire' : 'cover';
    this.poses[this.pose].visible = false;
    this.pose = next;
    this.poses[next].visible = true;
    this.body.pop(out, this.J.amp);
    this.body.jolt(out ? 1.0 : 1.25, this.J.amp);
  }
  shoot(gatling = false) {
    const F = this.R.fire, dir = -this.p.side;   // she shoots toward the middle; the kick shoves her outward
    this.body.recoil(dir, F.kick * (gatling ? 0.6 : 1), this.J.amp, F.tick);
    this.body.jolt(F.kick * 0.18, this.J.amp);
    this.exert = Math.min(1, this.exert + 0.004);
  }
  hurt(heavy) { this.body.jolt(heavy ? 2.2 : 1.6, this.J.amp); this.body.recoil(this.p.side, heavy ? 1.4 : 0.9, this.J.amp, 0.6); this.hitT = 0.35; }
  // the muzzle in the Player's pixel space
  muzzle() {
    const F = this.R.fire, m = this.poses.fire, { w, h } = this.dims('fire');
    const u = this.p.mirror ? 1 - F.muzzle[0] : F.muzzle[0];
    return { x: this.g.position.x + m.position.x + (u - 0.5) * w, y: this.g.position.y + m.position.y + F.muzzle[1] * h };
  }
  // st: { state, x (body centre line px), y (feet px), zoom, lean, dark, opacity, flash }
  update(dt, t, st) {
    const J = this.J, b = this.body, sign = this.p.mirror ? -1 : 1;
    this.setOut(st.state === 'out' || st.state === 'victory' || st.state === 'run');
    // exertion builds while she is out fighting, cools off in cover
    this.exert = Math.max(0, Math.min(1, this.exert + (this.out ? 0.16 : -0.04) * dt));
    const wet = J.sweat * (0.45 + 0.55 * this.exert), flush = J.sweat * (0.15 + 0.85 * this.exert);
    this.acc += Math.min(0.1, dt);
    const n = Math.max(1, Math.round(this.acc / SUBSTEP)); this.acc -= n * SUBSTEP;
    let tt = t - n * SUBSTEP;
    for (let k = 0; k < n; k++) {
      tt += SUBSTEP;
      b.update(SUBSTEP, tt, J.amp, J.ring, st.state === 'out', J.rhythm, this.exert);
      const kick = b.kick * 0.55; b.kick = 0;
      for (const p of Object.values(this.poses)) {
        const { B, X } = b.pose(sign, p.userData.ar);
        p.userData.flesh.step(SUBSTEP, B, X, J.amp, J.ring, b.breath, kick, [b.pulse[0] * sign, b.pulse[1]]);
      }
      this.breath.update(SUBSTEP);
    }
    for (const p of Object.values(this.poses)) {
      const name = p.userData.name, { w, h } = this.dims(name), au = this.R[name].anchor;
      const sx = w * (1 - b.sq.x * 0.5), sy = w * (1 + b.sq.x);
      p.scale.set(sign < 0 ? -sx : sx, sy, 1);
      p.position.set(-((sign < 0 ? 1 - au : au) - 0.5) * w + b.ox.x * h, b.oy.x * h, 0);
      p.rotation.z = b.r.x + (st.lean || 0) * -this.p.side;
      b.apply(p, sign);
      const U = p.material.uniforms;
      U.wet.value = wet; U.flush.value = flush; U.time.value = t; U.mir.value = sign;
      U.flash.value = Math.max(st.flash || 0, this.readyFlash * 0.85);
      U.tintAmt.value = this.hitT > 0 ? this.hitT * 1.2 : 0;
      U.dark.value = st.dark || 0;
      U.opacity.value = st.opacity ?? 1;
      const A = this.aura, pc = A.pulse > 0 && A.pcol ? A.pcol : A.col;
      U.aura.value.set(A.col.r * (1 - A.pulse) + pc.r * A.pulse, A.col.g * (1 - A.pulse) + pc.g * A.pulse, A.col.b * (1 - A.pulse) + pc.b * A.pulse, Math.min(1, A.a + A.pulse * 0.35));
      U.auraFlow.value = A.flow; U.auraPulse.value = A.pulse;
      const halo = p.userData.halo, hs = 1 + 0.02 + A.halo * 0.05 + A.pulse * 0.04;
      halo.visible = p.visible && U.aura.value.w > 0.02;
      halo.position.copy(p.position); halo.rotation.copy(p.rotation);
      halo.scale.set(p.scale.x * hs, p.scale.y * hs, 1);
      // the afterimages: three copies a third of a beat apart, each swelling about her body's middle and fading out
      const E = this.J.echo || { beat: 0.85, grow: 0.3, a: 0.85 };
      p.userData.echoes.forEach((e, k) => {
        e.visible = p.visible && this.readyK > 0.01 && st.visible !== false;
        if (!e.visible) return;
        const ph = (t / E.beat + k / 3) % 1, s = 1 + E.grow * ph, figH = Math.abs(p.scale.y) * p.userData.ar;
        e.position.set(p.position.x, p.position.y - (s - 1) * figH * 0.45, 0); e.rotation.copy(p.rotation);
        e.scale.set(p.scale.x * s, p.scale.y * s, 1);
        const c = this.readyCol;
        e.material.uniforms.aura.value.set(c.r, c.g, c.b, E.a * this.readyK * Math.pow(1 - ph, 1.6));
        e.material.uniforms.opacity.value = st.opacity ?? 1;
      });
      if (p.visible) { p.userData.sweat.step(dt, wet, 0); p.userData.sweat.render(dt); }
      p.userData.sweat.apply(U);
    }
    this.hitT = Math.max(0, this.hitT - dt);
    this.readyFlash = Math.max(0, this.readyFlash - dt * 4);
    this.readyK += ((this.ready ? 1 : 0) - this.readyK) * Math.min(1, dt * (this.ready ? 3 : 10));
    this.aura.pulse = Math.max(0, this.aura.pulse - dt * 1.6);
    this.g.position.set(st.x, st.y, 0);
    this.g.scale.setScalar(st.zoom || 1);   // walking: the shot moves in on her (player.js)
    this.g.visible = st.visible !== false;
    // breath vapour on every exhale (the breath cycle turning downward), from the nose toward the face
    const m = this.poses[this.pose];
    if (this.lastBreath > 0.95 && b.breath <= 0.95 && this.g.visible) {
      const nose = this.R[this.pose].flesh.nose, ar = m.userData.ar;
      m.updateMatrix();
      const pt = new THREE.Vector3(nose[0] - 0.5, nose[1] * ar, 0).applyMatrix4(m.matrix);
      this.breath.puff(pt.x, pt.y, sign, this.H, this.exert);
    }
    this.lastBreath = b.breath;
  }
  // where her figure is on screen right now (px, y up), for things that must not cover her (src/ui/space.js); the pictures have some
  // empty canvas at the sides, trimmed off
  box() {
    const m = this.poses[this.pose], { w, h } = this.dims(this.pose), z = this.g.scale.x, cx = this.g.position.x + m.position.x * z;
    return { x0: cx - w * z * 0.4, x1: cx + w * z * 0.4, y0: Math.max(0, this.g.position.y), y1: this.g.position.y + h * z * 0.96 };
  }
  // the size of her standing figure, for layouts that ask (px)
  standH() { return this.dims('fire').h; }
}
