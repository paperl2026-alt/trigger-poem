// What monsters do besides coming at the girls (docs/DESIGN.md「停留点不只是一个镜头、一种打法」 怪的演出, user 2026-10-20: rituals,
// summoning, self-sacrifice, wrecking the place, playing with it, comedy, things turning into monsters, purified things coming back):
// little scenes a wave can stage. A wave entry with "act" (and no "type": the act spawns its own cast; they count in the wave):
//   ritual:    { act, of, n, x, z, r, time, summon }  n of them in a ring round a glowing circle on the floor, chanting, not fighting;
//              all down before time runs out and the circle breaks; too late and it erupts: the summoned one (summon) rises out of it
//              (up close), the ring wakes up and fights
//   summon:    { act, of, x, z, minion, every, max }  a summoner beside a portal it holds open: every few seconds another one comes out
//              of it, until the summoner is down
//   sacrifice: { act, of, x, z, at: wall | cover, side }  it runs for a wall (or a cover) and blows itself up there: a hole right through
//              the wall (or the cover smashed); shoot it on the way and it bursts harmlessly
//   squabble:  { act, of: [a, b], x, z, item }  two of them fighting over something (a thing lying between them), clouds of dust and
//              stars, paying the girls no heed - until one is shot: then both are furious
//   transform: { act, k, h, x, z, of, t }  an ordinary thing standing there shudders, splits with ink and becomes a monster (up close)
// and, for every monster: purified by the cat's mantra (kill kind mantra / beam), a kind with "revert" in enemies.json leaves behind
// what it was (a prop, a rigid body) instead of burning away (Acts.revert, from Enemy.die). Owned by Game (game.acts).
import * as THREE from 'three';
import { sfx, sound } from '../core/audio.js';
import { C } from '../core/content.js';
import { COL } from './fx.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const WAKE = { walker: 'walk', thrower: 'stand', flyer: 'hover', crawler: 'crawl' };

// the magic circle on the floor: rings, a star, runes round the rim, drawn once
let CIRCLE = null;
function circleTex() {
  if (CIRCLE) return CIRCLE;
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.translate(256, 256); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 6;
  for (const r of [240, 214, 120]) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
  g.lineWidth = 5; g.beginPath(); for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 4 / 5; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 214, Math.sin(a) * 214); } g.stroke();
  g.font = 'bold 26px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
  for (let i = 0; i < 24; i++) { g.save(); g.rotate(i * Math.PI / 12); g.fillText(runes[i % runes.length], 0, -227); g.restore(); }
  CIRCLE = new THREE.CanvasTexture(c); return CIRCLE;
}

export class Acts {
  constructor(game) { this.g = game; this.live = []; }

  start(e) {
    const f = this[e.act]; if (!f) { console.warn('unknown act', e.act); return; }
    const a = f.call(this, e); if (a) this.live.push(a);
  }
  update(dt, t) {
    for (let i = this.live.length - 1; i >= 0; i--) if (this.live[i].update(dt, t) === false) this.live.splice(i, 1);
  }
  clear() { for (const a of this.live) a.dispose?.(); this.live = []; }

  // ---- helpers
  spawn(type, x, z, o = {}) {
    const g = this.g; g.pendingSpawns++;
    const a = g.spawnEnemy({ type, x, z, y: o.y, from: o.from });
    g.pendingSpawns--; return a;
  }
  hold(a, pose = 'idle') { a.state = 'scripted'; a.play?.(a.frames?.[pose] ? pose : 'idle'); }
  release(a) { if (!a.alive || a.state !== 'scripted') return; a.state = WAKE[a.beh] || 'walk'; a.play?.(a.beh === 'walker' ? 'walk' : 'idle', 7); }
  floorMesh(x, z, r, color) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: circleTex(), color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.04, z); m.renderOrder = 5; this.g.world.scene.add(m); return m;
  }
  dropMesh(m) { m.parent?.remove(m); m.geometry.dispose(); m.material.dispose(); }

  // ---- ritual
  ritual(e) {
    const G = this.g, n = e.n ?? 4, r = e.r ?? 2, x = e.x ?? 0, z = e.z ?? -10, cast = [];
    const circle = this.floorMesh(x, z, r * 1.3, 0xff3a8a);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, m = this.spawn(e.of, x + Math.cos(a) * r, z + Math.sin(a) * r); this.hold(m, 'windup'); m.ritual = true; cast.push(m); G.fx.puff(m.root.position, 6, COL.violet, 1); }
    sound('roar') || sfx.roar(); G.hud.gl.stickers.say(G.players[0], 'scare', 0.8);
    let t = 0, over = false;
    const time = e.time ?? 9;
    return {
      update: (dt, tt) => {
        if (over) return false;
        t += dt; const k = Math.min(1, t / time);
        circle.material.opacity = Math.min(1, t * 2) * (0.5 + 0.5 * k) * (0.8 + 0.2 * Math.sin(tt * 8));
        circle.rotation.z += dt * (0.4 + k * 3); circle.scale.setScalar(1 + k * 0.15);
        if (Math.random() < dt * 20) G.fx.wAdd.emit({ x: x + rnd(-r, r), y: 0.1, z: z + rnd(-r, r), vy: 1.5 + k * 3, life: 0.8, size: 0.08, size1: 0.01, color: [1, 0.3, 0.6], a: 1, a1: 0, frame: 1 });
        for (const m of cast) if (m.alive) m.inner.position.y = Math.abs(Math.sin(tt * 4 + m.seed)) * 0.08;
        if (cast.every((m) => !m.alive)) {   // stopped in time: the circle breaks
          over = true; G.fx.shockRing(new THREE.Vector3(x, 0, z), r * 2, 0xffffff, 0.5); sfx.shatter(0); G.post.flash(0.3, 0xffffff);
          G.hud.gl.stickers.say(G.players[Math.random() < 0.5 ? 0 : 1], 'stagger', 1); this.dropMesh(circle); return false;
        }
        if (k >= 1) {   // too late: it erupts; the summoned one rises out of it, up close
          over = true; G.post.flash(0.8, 0xff3a8a); G.post.shake(1.6); G.post.styleBurst(1.0, [1, 3, 5], 0.14, 0x1a0010, 0xff3a8a); sfx.slam();
          G.fx.pillar(new THREE.Vector3(x, 0, z), 7, r * 0.8, 0xff5aa8, 1.2); G.fx.shockRing(new THREE.Vector3(x, 0, z), r * 3, 0xff5aa8, 0.7);
          for (const m of cast) this.release(m);
          if (e.summon) { const b = this.spawn(e.summon, x, z, { from: 'burrow' }); G.cine({ on: b, dist: 3, up: -0.3, in: 0.5, hold: 1.8, out: 0.5, lull: true, dolly: 10 }); }
          this.dropMesh(circle); return false;
        }
        return true;
      },
      dispose: () => this.dropMesh(circle),
    };
  }

  // ---- summoner and its portal
  summon(e) {
    const G = this.g, x = e.x ?? 0, z = e.z ?? -10, boss = this.spawn(e.of, x, z), portal = this.floorMesh(x + 1.4, z, 1.1, 0x9a5aff);
    portal.rotation.x = 0; portal.position.y = 1.2; portal.lookAt(G.world.camPos.x, 1.2, G.world.camPos.z);
    let t = 0, out = 0, cd = e.every ?? 3;
    return {
      update: (dt, tt) => {
        t += dt; portal.material.opacity = Math.min(1, t * 2) * (0.7 + 0.3 * Math.sin(tt * 6)); portal.rotation.z += dt * 2;
        if (!boss.alive) { G.fx.shockRing(portal.position, 2, 0x9a5aff, 0.4); sfx.shatter(0); this.dropMesh(portal); return false; }
        if ((cd -= dt) <= 0 && out < (e.max ?? 6)) { cd = e.every ?? 3; out++; const m = this.spawn(e.minion, portal.position.x + rnd(-0.3, 0.3), portal.position.z + 0.3); G.fx.puff(m.root.position, 8, COL.violet, 1.1); sfx.whoosh(0); }
        return true;
      },
      dispose: () => this.dropMesh(portal),
    };
  }

  // ---- self-sacrifice: it runs for a wall or a cover and blows up there
  sacrifice(e) {
    const G = this.g, w = G.world, H = w.set?.hall || {}, m = this.spawn(e.of, e.x ?? 0, e.z ?? -10);
    this.hold(m, 'windup');
    const side = e.side ?? (Math.random() < 0.5 ? -1 : 1), cov = e.at === 'cover' ? w.covers?.[side < 0 ? 0 : 1] : null;
    const goal = cov ? cov.m.position.clone() : new THREE.Vector3(side < 0 ? (H.x0 ?? -2) + 0.3 : (H.x1 ?? 2) - 0.3, 0, (e.z ?? -10) + 2);
    m.u.tint.value.setRGB(1, 0.3, 0.2); m.u.tintAmt.value = 0.5;
    G.hud.gl.stickers.say(G.players[0], 'scare', 0.7);
    return {
      update: (dt, tt) => {
        if (!m.alive) return false;   // shot on the way: it just bursts
        const P = m.root.position, d = Math.hypot(goal.x - P.x, goal.z - P.z), sp = 3.2;
        m.flash = 0.4 + 0.4 * Math.sin(tt * 20);
        if (d > 0.4) { P.x += (goal.x - P.x) / d * sp * dt; P.z += (goal.z - P.z) / d * sp * dt; return true; }
        // there: it blows up, the wall gets a hole right through, a cover goes to pieces
        const at = m.center(); m.alive = false; m.dispose();
        G.fx.confetti(at, 40, 3, [COL.hot, COL.ember, COL.bone]); G.vfx.play('explosion', at);
        if (cov) w.breakCover?.(cov);
        else w.addHole?.(side < 0 ? 'left' : 'right', new THREE.Vector3(goal.x, 1.1, goal.z), 2.4, true);
        w.phys?.chipsAt(at, new THREE.Vector3(0, 1, 0), 12, [COL.bone, 0x9a8070, 0x6a5a50], 1.2);
        return false;
      },
    };
  }

  // ---- squabble: two of them fighting over something, ignoring the girls until one is shot
  squabble(e) {
    const G = this.g, x = e.x ?? 0, z = e.z ?? -9, [ta, tb] = [].concat(e.of), A = this.spawn(ta, x - 0.7, z), B = this.spawn(tb || ta, x + 0.7, z);
    this.hold(A); this.hold(B);
    if (e.item && G.world.makeProp) G.world.makeProp({ k: e.item, h: e.itemH ?? 0.6, x, z: z + 0.1 });
    const hp0 = [A.hp, B.hp];
    return {
      update: (dt, tt) => {
        const hit = A.hp < hp0[0] || B.hp < hp0[1] || !A.alive || !B.alive;
        if (hit) { for (const m of [A, B]) if (m.alive) { this.release(m); m.flash = 1; G.fx.star(m.center(), 1, COL.hot); } G.hud.gl.stickers.say(G.players[0], 'kill', 0.6); return false; }
        // tugging at each other: lurching in and out, dust clouds and stars between them
        const k = Math.sin(tt * 9);
        A.inner.position.x = 0.15 + k * 0.12; B.inner.position.x = -0.15 - k * 0.12; A.inner.rotation.z = k * 0.12; B.inner.rotation.z = -k * 0.12;
        if (Math.random() < dt * 8) { const p = new THREE.Vector3(x + rnd(-0.4, 0.4), rnd(0.4, 1.3), z + 0.2); G.fx.puff(p, 2, 0xe8e0d0, 0.6); if (Math.random() < 0.4) G.fx.star(p, 0.4, COL.white); }
        if (Math.random() < dt * 2) sfx.thud?.(0);
        return true;
      },
    };
  }

  // ---- transform: an ordinary thing turns into a monster in front of them
  transform(e) {
    const G = this.g, w = G.world;
    if (!w.makeProp) return null;
    w.makeProp({ k: e.k, h: e.h ?? 1.2, x: e.x ?? 0, z: e.z ?? -8 });
    const q = w.props[w.props.length - 1];
    let t = 0, phase = 0;
    return {
      update: (dt, tt) => {
        t += dt;
        if (phase === 0 && t > (e.t ?? 1.2)) { phase = 1; if (e.look !== false) G.cine({ on: q.m.position.clone().setY((e.h ?? 1.2) * 0.6), dist: 2.6, in: 0.5, hold: 2.2, out: 0.5, lull: true }); sfx.creak?.(); }
        if (phase === 1) {   // it shudders, harder and harder
          q.m.rotation.z = Math.sin(tt * 40) * 0.06 * Math.min(1, (t - (e.t ?? 1.2)) / 1.2);
          if (t > (e.t ?? 1.2) + 1.6) {
            phase = 2; const P = q.m.position.clone();
            G.fx.ink(P.clone().setY(0.6), 30, 2.5, COL.violet); G.fx.confetti(P.clone().setY(0.6), 30, 2, [COL.violet, COL.hot]); G.post.styleBurst(0.6, [3, 1], 0.12, 0x200018, 0xb04dff); G.post.shake(1); sfx.tear(0);
            q.m.visible = false; q.sh.visible = false; if (q.body) { w.phys?.remove(q.body); q.body = null; } q.broken = true;
            this.spawn(e.of, P.x, P.z); return false;
          }
        }
        return true;
      },
    };
  }

  // ---- purified: what it was is left lying there (from Enemy.die, mantra / beam); false if this kind has nothing to go back to
  revert(m) {
    const G = this.g, w = G.world, k = C.enemies[m.type]?.revert;
    if (!k || !w.makeProp) return false;
    const P = m.root.position.clone();
    G.fx.confetti(m.center(), 24, 1.6, [COL.gold, COL.white]); G.fx.star(m.center(), 1.6, COL.gold); G.fx.shockRing(P, 1.4, 0xfff0b0, 0.5); sfx.clear?.();
    w.makeProp({ k: [].concat(k)[Math.floor(Math.random() * [].concat(k).length)], h: C.enemies[m.type].revertH ?? 0.9, x: P.x, z: P.z });
    const q = w.props[w.props.length - 1];
    if (q.body) w.phys.push(q.body, q.m.position.clone().setY(0.5), new THREE.Vector3(rnd(-1, 1), 1, rnd(-1, 1)), 1.5);
    return true;
  }
}
