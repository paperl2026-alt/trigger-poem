// Escorting from afar (docs/DESIGN.md「停留点不只是一个镜头、一种打法」, user 2026-10-20: the girls far off, sniping; something to keep safe
// moving or standing out there - a spirit, a core, a ritual - and the monsters going for it; what hits it hurts the girls too): the
// camera is a long way back (a narrow view, a scope's dark rim), the thing to guard goes along its way with its own bar (the boss bar)
// and its own ring (fx.lock 'guard'); the monsters of the stop make for it instead of the girls (Enemy: game.escort.goal()); when it gets
// to the end of its way the stop is won. Owned by Game (game.escort).
//   station escort: { who: soul | <picture key>, path: [[x, y, z], ...], speed, hp, share (of a hit the girls take too), zoom (degrees
//                     narrower), h (its size), name, door: { at: [x, y, z], h } }
// door: where it is going, in sight from the start - a doorway of light standing alone out in the open (no wall: user 2026-10-22, a
// door that was nowhere in the place opened after it; "if it turns into a door, no wall"), an arch drawn in light, a faint glow inside,
// motes rising at its foot. When the thing gets there every monster is gone at once and nothing more comes (user 2026-10-22: it got
// there and still a wave came): it drifts into the arch and becomes it - the doorway floods with light - and the stop is won
import * as THREE from 'three';
import { tex } from '../core/assets.js';
import { sfx } from '../core/audio.js';
import { T } from '../core/content.js';
import { tr } from '../core/i18n.js';
import { FR } from '../core/particles.js';

const K = () => T.combat.escort;

export class Escort {
  constructor(game) { this.g = game; this.on = false; }

  run(S, then) {
    const g = this.g, w = g.world, E = S.escort;
    this.S = S; this.E = E; this.then = then; this.on = true; this.done = false;
    const pts = E.path.map((p) => new THREE.Vector3(...p));
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); this.len = this.curve.getLength(); this.s = 0;
    this.hp = this.maxHp = E.hp ?? K().hp; this.speed = E.speed ?? K().speed; this.hurtT = 0; this.flash = 0;
    this.pos = this.curve.getPointAt(0).clone();
    this.root = new THREE.Group(); w.scene.add(this.root);
    const h = E.h ?? 1.2;
    if (E.who === 'soul' || !tex[E.who]) {
      // a small soul: a soft white-gold light with a heart of white, rings of light slowly turning round it
      const glow = (r, c, o) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false })); this.root.add(m); return m; };
      this.core = glow(h * 0.18, 0xffffff, 1); this.halo = glow(h * 0.36, 0xffe8b0, 0.35); this.halo2 = glow(h * 0.6, 0xffc070, 0.12);
    } else {
      const t = tex[E.who], m = new THREE.Mesh(new THREE.PlaneGeometry(h * t.image.width / t.image.height, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
      this.root.add(m); this.sprite = m;
    }
    if (E.door) this.makeDoor(E.door);
    this.lock = g.fx.lock('guard', -1);   // (the view narrows and darkens at the edges like a scope: the shot, tuning/shots.json escort)
    g.combat = true; g.escortName = tr(E.name || '') || null;
  }
  makeDoor(D) {
    const g = this.g, h = D.h ?? 3.2, w = h * 0.56;
    // the arch drawn on a canvas: a soft glow round it, a bright line of light, a faint light filling it
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = Math.round(256 * h / w);
    const c = cv.getContext('2d'), W = cv.width, Hc = cv.height, m = W * 0.16, r = (W - 2 * m) / 2;
    const arch = () => { c.beginPath(); c.moveTo(m, Hc - 4); c.lineTo(m, m + r); c.arc(W / 2, m + r, r, Math.PI, 0); c.lineTo(W - m, Hc - 4); };
    arch(); c.closePath(); const gr = c.createLinearGradient(0, 0, 0, Hc); gr.addColorStop(0, 'rgba(255,236,190,0.30)'); gr.addColorStop(1, 'rgba(255,214,150,0.12)'); c.fillStyle = gr; c.fill();
    c.shadowColor = 'rgba(255,220,150,1)'; c.shadowBlur = W * 0.08; c.strokeStyle = 'rgba(255,246,220,1)'; c.lineWidth = W * 0.05; arch(); c.stroke();
    c.shadowBlur = W * 0.02; c.lineWidth = W * 0.012; c.strokeStyle = 'rgba(255,255,255,1)'; arch(); c.stroke();
    const map = new THREE.CanvasTexture(cv); map.colorSpace = THREE.SRGBColorSpace;
    const mk = (o) => new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0), new THREE.MeshBasicMaterial({ map, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    const grp = new THREE.Group(); grp.position.set(...D.at);
    const arc = mk(0.95), fill = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.66, h * 0.82).translate(0, h * 0.41, -0.02),
      new THREE.MeshBasicMaterial({ color: 0xfff4dc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    grp.add(arc, fill);
    grp.lookAt(new THREE.Vector3(g.world.camPos.x, D.at[1], g.world.camPos.z));
    this.root.parent.add(grp); this.door = { grp, arc, fill, map, at: new THREE.Vector3(D.at[0], D.at[1] + h * 0.42, D.at[2]) };
  }
  // the monsters' goal while it is out there (Enemy: walk at it, throw at it)
  get going() { return this.on && !this.done; }
  goal() { return this.going ? this.pos : null; }
  // where a monster of the wave comes in: ahead metres further along its way (< 0: behind it), side metres to its side
  place(ahead = 8, side = 0) {
    const u = Math.max(0, Math.min(1, (this.s + ahead) / this.len)), p = this.curve.getPointAt(u), tg = this.curve.getTangentAt(u);
    return new THREE.Vector3(p.x - tg.z * side, 0, p.z + tg.x * side);
  }
  // something got to it: it takes the blow, and the girls with it (their bond with it: share)
  hit(dmg, from) {
    const g = this.g;
    if (!this.on || this.done || this.hurtT > 0) return;
    this.hp = Math.max(0, this.hp - dmg); this.hurtT = 0.4; this.flash = 1;
    sfx.hurt?.(); g.post.shake(0.6); g.fx.star(this.pos.clone(), 1.2, [1, 0.5, 0.6]);
    for (const p of g.players) if (p.state !== 'down' && p.state !== 'away' && (p.slot === 0 || g.p2on())) p.damage?.(dmg * (this.E.share ?? K().share));
    if (this.hp <= 0) {   // it falls: it fades for a moment and comes back weaker; the girls are hurt badly
      g.post.flash(0.6, 0xff4060); this.hp = this.maxHp * 0.4; this.down = 1.8;
      for (const p of g.players) if (p.state !== 'down' && p.state !== 'away' && (p.slot === 0 || g.p2on())) p.damage?.(K().fallDmg);
    }
  }

  update(dt, t) {
    if (!this.on) return;
    const g = this.g;
    this.hurtT -= dt; this.flash = Math.max(0, this.flash - dt * 4);
    if (this.down > 0) this.down -= dt;
    else if (!g.lull && !this.done) {
      this.s = Math.min(this.len, this.s + this.speed * dt);
      this.curve.getPointAt(this.s / this.len, this.pos);
      if (this.s >= this.len - 0.01) this.arrive();
    }
    this.root.position.copy(this.pos); this.root.position.y += Math.sin(t * 2.2) * 0.08;
    if (this.core) {
      const k = 1 + Math.sin(t * 5) * 0.08 + this.flash * 0.6;
      this.halo.scale.setScalar(k); this.halo2.scale.setScalar(1 + Math.sin(t * 2.6) * 0.15);
      this.core.material.color.setRGB(1, 1 - this.flash * 0.5, 1 - this.flash * 0.6);
      this.root.visible = !(this.down > 0 && Math.floor(t * 12) % 2);
      if (Math.random() < dt * 14) g.fx.wAdd.emit({ x: this.pos.x + (Math.random() - 0.5) * 0.4, y: this.pos.y + (Math.random() - 0.5) * 0.4, z: this.pos.z, vy: 0.4, life: 0.8, size: 0.06, size1: 0.01, color: [1, 0.9, 0.6], a: 0.9, a1: 0, frame: FR.GLOW });
    }
    if (this.door && !this.done && Math.random() < dt * 10) { const d = this.door.at; g.fx.wAdd.emit({ x: d.x + (Math.random() - 0.5) * 1.6, y: 0.2, z: d.z + (Math.random() - 0.5) * 0.6, vy: 0.7, life: 1.4, size: 0.07, size1: 0.01, color: [1, 0.92, 0.65], a: 0.9, a1: 0, frame: FR.GLOW }); }   // (the way home: motes of light at the door's foot)
    if (this.sprite) { this.sprite.lookAt(g.world.camera.position); this.sprite.material.color.setRGB(1, 1 - this.flash * 0.6, 1 - this.flash * 0.6); }
    const c = g.world.project(this.pos), b = { x0: c.x - 40, x1: c.x + 40, y0: c.y - 40, y1: c.y + 40 };
    this.lock?.set(c.x, g.H - c.y, Math.max(40, g.H * 0.05), 1 - this.hp / this.maxHp, t, 9, b, this.pos);
    g.hud.boss(g.escortName, this.hp / this.maxHp);
  }
  arrive() {
    const g = this.g;
    this.done = true; sfx.clear(); g.post.flash(0.5, 0xfff2d0); g.fx.shockRing(this.pos, 2.5, 0xfff0c0, 0.8);
    // nothing more comes, and what is out there is gone at once
    g.escortDone?.(); this.clearOut();
    const D = this.door;
    if (!D) { g.tweens.wait(1.2, () => this.end()); return; }
    // into the door: it drifts to the doorway and fades into it; the leaves swing open on light
    const p0 = this.pos.clone();
    g.tweens.run(0.6, (e) => { this.pos.lerpVectors(p0, D.at, e * e * (3 - 2 * e)); this.root.scale.setScalar(1 - e * 0.7); }, { onDone: () => {
      this.root.visible = false; g.post.flash(0.4, 0xfff6e0); g.fx.shockRing(D.at.clone().setY(0.05), 3, 0xfff0c0, 0.7);
      g.tweens.run(0.8, (e) => { D.fill.material.opacity = e * 0.95; D.grp.scale.setScalar(1 + e * 0.12); }, { ease: (k) => 1 - (1 - k) * (1 - k) });   // (the doorway floods with light, before the stage moves on)
      g.tweens.wait(1.0, () => this.end());
    } });
  }
  clearOut() {
    const g = this.g;
    for (const a of g.actors) if (a.alive && a.def) { a.alive = false; g.fx.puff(a.root.position, 6, 0xd8c8b0, 1); a.dispose(); }
  }
  end() {
    const g = this.g, w = g.world;
    this.on = false; this.lock?.remove(); this.lock = null; g.hud.boss(null);
    this.root.parent?.remove(this.root); this.root.traverse((m) => { m.geometry?.dispose(); m.material?.dispose(); });
    if (this.door) { const D = this.door; D.grp.parent?.remove(D.grp); D.grp.traverse((m) => { m.geometry?.dispose(); m.material?.dispose(); }); D.map.dispose(); this.door = null; }
    // whatever is still out there is beaten: the guarded thing got through
    this.clearOut();
    const then = this.then; this.then = null; then && then();
  }
}
