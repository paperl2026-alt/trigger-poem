// The monsters change before the girls' eyes (docs/DESIGN.md「总纲」 处处有小巧思, user 2026-10-20: not only bursting in through a wall,
// pushing a door, coming up out of the ground - drawn by the program, no new pictures needed). Owned by Game (game.morph); every change is
// in the kind's data (enemies.json "morph": { ... }) or a wave entry's "morph", so a level picks them by its tables:
//   shed:   { type, every: [a, b] s, max }        a big one drops small ones off its body as it goes (they fall, bounce, get up)
//   burst:  { type, n }                           shot dead, it splits open and new ones climb out of it
//   puddle: { into, need, group }                 dead, it leaves a puddle; when need puddles of its group lie about they crawl together
//                                                 and a new one (into) rises out of the pool
//   merge:  { with, into, after: s, dist }        two of them about for a while drift together, fuse in a flash and a new one (into) stands
//   wave entry from: 'melt'                      a stain swells on the wall, drips down, and the monster rises out of the drip at the wall's
//                                                 foot (x past a wall: that wall; else the nearer one)
// A wave entry's morph: { shed, burst, puddle, merge } gives that one monster its own (over its kind's). puddle.as: the new one's spawn
// fields (h, hp: a bigger, tougher one out of the pooled remains).
// Each one is a few seconds of animation: scale and squash, the white-hot flash, ink and goo flying, a pool spreading on the floor.
import * as THREE from 'three';
import { sfx } from '../core/audio.js';
import { Ease } from '../core/tween.js';
import { hexNum } from '../core/content.js';
import { COL } from './fx.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const rr = (v) => (Array.isArray(v) ? rnd(v[0], v[1]) : v);
const V = new THREE.Vector3();

// a soft round pool on the floor (a canvas texture shared by all, tinted per pool)
let poolTex = null;
function pool() {
  if (!poolTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 6, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.65, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath();
    for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2, r = 50 + Math.sin(i * 2.7) * 8 + Math.cos(i * 1.3) * 5; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); }
    g.fill(); poolTex = new THREE.CanvasTexture(c);
  }
  return poolTex;
}

export class Morph {
  constructor(game) { this.g = game; this.pools = []; this.jobs = []; }
  get world() { return this.g.world; }

  // the colour of a monster's goo: its kind's scarColor, else its outline pink
  goo(e) { return hexNum(e?.def?.scarColor || e?.def?.gooColor || '#ff6aa8'); }
  // a monster grows out of nothing at p (its feet), from a puddle: squashed flat, stretched up, settling (scale on its root)
  rise(e, p, time = 0.9) {
    const g = this.g; e.root.position.copy(p); e.inner.scale.set(1.6, 0.05, 1);
    e.invul = time + 0.1; e.busyMorph = true;
    g.etw.to(e.inner.scale, { x: 1, y: 1 }, time, { ease: Ease.outBack, onDone: () => { e.busyMorph = false; } });
    g.fx.ink(p.clone().setY(0.3), 14, 1.6, this.goo(e)); sfx.popup?.();
  }
  spawn(type, p, extra = {}) {
    const e = this.g.spawnEnemy({ type, x: p.x, y: p.y, z: p.z, free: true, ...extra });
    return e;
  }

  // ---- shed: while it lives, now and then a small one falls off it
  tickShed(e, dt) {
    const S = e.morphs?.shed ?? e.def?.morph?.shed; if (!S || !e.alive || e.busyMorph || !this.g.combat) return;
    e.shedT = (e.shedT ?? rr(S.every)) - dt;
    if (e.shedT > 0) return;
    e.shedT = rr(S.every);
    const mine = this.g.actors.filter((a) => a.alive && a.shedBy === e).length;
    if (mine >= (S.max ?? 3)) return;
    const from = e.uvToWorld(rnd(0.3, 0.7), rnd(0.45, 0.75)), g = this.g;
    const k = this.spawn(S.type, from, { near: true }); k.shedBy = e;
    // it drops off, bounces once on the floor, gets up
    k.busyMorph = true; k.invul = 0.8; k.inner.scale.set(0.6, 0.6, 1);
    const x = from.x + rnd(-1.2, 1.2), z = from.z + rnd(0.5, 1.5);
    g.etw.run(0.55, (t) => { k.root.position.set(from.x + (x - from.x) * t, from.y * (1 - t * t) + Math.sin(t * Math.PI) * 0.6, from.z + (z - from.z) * t); },
      { onDone: () => { g.fx.puff(k.root.position, 4, COL.bone, 0.5); g.etw.to(k.inner.scale, { x: 1, y: 1 }, 0.35, { ease: Ease.outBack, onDone: () => { k.busyMorph = false; } }); } });
    g.fx.ink(from, 8, 1.2, this.goo(e)); e.flash = Math.max(e.flash, 0.5); sfx.paperRip?.(0);
  }

  // ---- burst: dead, it splits open and its insides climb out
  burst(e) {
    const B = e.morphs?.burst ?? e.def?.morph?.burst; if (!B) return;
    const g = this.g, c = e.center(), n = B.n ?? 2;
    g.fx.ink(c, 18, 2.4, this.goo(e)); g.fx.confetti(c, 16, 2, [this.goo(e), COL.bone]); g.post.shake(0.6); sfx.shatter?.(0);
    for (let i = 0; i < n; i++) g.etw.wait(0.25 + i * 0.2, () => {
      if (!g.combat) return;
      const p = e.root.position.clone().add(V.set((i - (n - 1) / 2) * 1.1, 0, rnd(-0.3, 0.3)));
      this.rise(this.spawn(B.type, p, { near: true }), p, 0.7);
    });
  }

  // ---- puddle: dead, it leaves a pool; enough pools of a group crawl together and a new one rises
  puddle(e) {
    const P = e.morphs?.puddle ?? e.def?.morph?.puddle; if (!P) return;
    const g = this.g, w = this.world, col = this.goo(e), r = Math.max(0.6, e.w * 0.45);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: pool(), color: col, transparent: true, depthWrite: false, opacity: 0.85 }));
    m.rotation.x = -Math.PI / 2; m.position.set(e.root.position.x, 0.03, e.root.position.z); m.scale.setScalar(0.1); m.renderOrder = 3;
    w.scene.add(m); g.etw.to(m.scale, { x: r * 2, y: r * 2, z: 1 }, 0.8, { ease: Ease.outQuad });
    const it = { m, group: P.group || e.type, into: P.into, as: P.as || {}, need: P.need ?? 3, r, born: performance.now() };
    this.pools.push(it);
    const same = this.pools.filter((q) => q.group === it.group && !q.used);
    if (same.length >= it.need) this.gather(same.slice(0, it.need));
  }
  gather(list) {
    const g = this.g; for (const q of list) q.used = true;
    const c = new THREE.Vector3(); for (const q of list) c.add(q.m.position); c.divideScalar(list.length);
    // the pools crawl together over the floor (their edges trembling), merge into one, swell and a new one rises out of it
    g.etw.wait(0.6, () => {
      for (const q of list) g.etw.to(q.m.position, { x: c.x, z: c.z }, 1.6, { ease: Ease.inOutQuad });
      g.etw.wait(1.7, () => {
        for (const q of list.slice(1)) { q.m.removeFromParent(); q.m.geometry.dispose(); q.m.material.dispose(); }
        const big = list[0].m; g.etw.to(big.scale, { x: big.scale.x * 1.6, y: big.scale.y * 1.6 }, 0.5, { ease: Ease.outBack });
        g.fx.ink(c.clone().setY(0.4), 20, 2.2, big.material.color.getHex()); g.post.shake(0.7); sfx.roar?.();
        g.etw.wait(0.5, () => {
          if (g.combat) this.rise(this.spawn(list[0].into, c, { near: true, ...list[0].as }), c.clone(), 1.1);
          g.etw.to(big.material, { opacity: 0 }, 1.2, { onDone: () => { big.removeFromParent(); big.geometry.dispose(); big.material.dispose(); } });
        });
      });
    });
    this.pools = this.pools.filter((q) => !q.used);
  }

  // ---- merge: two of them about together long enough drift into each other and fuse
  tickMerge(dt) {
    const g = this.g;
    for (const a of g.actors) {
      const M = a.morphs?.merge ?? a.def?.morph?.merge; if (!M || !a.alive || a.merging || a.busyMorph) continue;
      a.mergeT = (a.mergeT || 0) + dt; if (a.mergeT < (M.after ?? 4)) continue;
      const b = g.actors.find((o) => o !== a && o.alive && !o.merging && !o.busyMorph && o.type === M.with && (o.mergeT || 0) >= (M.after ?? 4));
      if (b) this.fuse(a, b, M.into);
    }
  }
  fuse(a, b, into) {
    const g = this.g; a.merging = b.merging = true; a.invul = b.invul = 99;
    const c = a.root.position.clone().add(b.root.position).multiplyScalar(0.5);
    for (const e of [a, b]) { e.endWindup?.(); e.state = 'scripted'; g.etw.kill(e.root.position); g.etw.to(e.root.position, { x: c.x, z: c.z }, 1.0, { ease: Ease.inQuad }); g.etw.to(e.inner.scale, { x: 0.7, y: 1.3 }, 1.0, { ease: Ease.inQuad }); }
    sfx.warn?.();
    g.etw.wait(1.0, () => {
      g.post.flash(0.35, 0xffffff); g.fx.ink(c.clone().setY(0.8), 22, 2.6, this.goo(a)); g.fx.confetti(c.clone().setY(0.8), 20, 2, [this.goo(a), COL.white]); g.post.shake(0.9);
      for (const e of [a, b]) { e.alive = false; e.dispose(); }
      if (g.combat) this.rise(this.spawn(into, c, { near: true }), c, 0.9);
    });
  }

  // ---- melt: a stain swells on the wall, drips down, and the monster rises out of the drip at the wall's foot (Enemy: from 'melt')
  melt(e, s, ready) {
    const g = this.g, w = this.world, H = w.set?.hall, col = this.goo(e);
    const side = s.side ?? (H && Math.abs((s.x ?? 0) - H.x0) < Math.abs((s.x ?? 0) - H.x1) ? -1 : 1);
    const wx = H ? (side < 0 ? H.x0 + 0.02 : H.x1 - 0.02) : (s.x ?? 0), z = s.z ?? w.camPos.z - 6, y = Math.min((H?.h ?? 3) * 0.7, 2.2);
    const st = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: pool(), color: col, transparent: true, depthWrite: false, opacity: 0.9 }));
    st.position.set(wx, y, z); st.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; st.scale.setScalar(0.05); st.renderOrder = 3; w.scene.add(st);
    const foot = new THREE.Vector3(wx - side * 0.7, 0, z);
    e.root.position.set(foot.x, -50, foot.z); e.invul = 3; e.busyMorph = true;
    // it swells on the wall (1 s), drips down it in long runs (1 s), and the monster rises out of the pool at the foot
    g.etw.to(st.scale, { x: e.w * 1.2, y: e.h * 0.9 }, 1.0, { ease: Ease.outQuad });
    let k = 0;
    g.etw.run(1.0, (t) => { if (t * 10 > k) { k++; g.fx.ink(new THREE.Vector3(wx - side * 0.05, y - t * y * 0.9, z + rnd(-0.4, 0.4)), 3, 0.6, col); } }, { delay: 0.8 });
    g.etw.wait(1.9, () => {
      g.etw.to(st.material, { opacity: 0 }, 1.5, { onDone: () => { st.removeFromParent(); st.geometry.dispose(); st.material.dispose(); } });
      this.rise(e, foot, 0.9); g.etw.wait(1.0, () => { e.busyMorph = false; ready(); });
    });
    sfx.creak?.();
  }

  update(dt) {
    for (const a of this.g.actors) if (a.morphs?.shed || a.def?.morph?.shed) this.tickShed(a, dt);
    this.tickMerge(dt);
  }
  // a new place: what lay on the floor of the last one is gone
  clear() { for (const q of this.pools) { q.m.removeFromParent(); q.m.geometry.dispose(); q.m.material.dispose(); } this.pools = []; }
}
