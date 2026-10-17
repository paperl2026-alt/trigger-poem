// Old-arcade-style alerts and the reload stickers (docs/DESIGN.md「战斗画面布局」, user refs art/ref/hud/arcade_*.png): things that matter
// for a moment are made BIG on her half of the screen, then gone — not small art in a corner:
//   RELOAD!        blinking big lettering over her half while she reloads (the lettering art R39: ui/alert_*)
//   NO AMMO!       when she is empty and not reloading
//   hit            the screen glass cracks where it came from (fx/crack_*), a quick OUCH!! / HIT!, a red wash on her half
//   down           her half goes dark: CONTINUE? and the big countdown to her revive (9 s)
//   DANGER!!       across the whole screen when a must-hide attack starts
// The reload itself: chibi big-head stickers (ui/rlq_<who>_<set>_1..9) slapped on one after another, irregularly, overlapping, in her
// corner above her HUD panel (never over the girls); the cat girl's nine seals also flash their characters by her paw.
import * as THREE from 'three';
import { tex } from '../core/assets.js';
import { C, T } from '../core/content.js';
import { Text, picture } from './glhud.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const quad = new THREE.PlaneGeometry(1, 1);
const flat = (col, order) => { const m = new THREE.Mesh(quad, new THREE.MeshBasicMaterial({ color: col, transparent: true, depthTest: false, depthWrite: false })); m.renderOrder = order; m.frustumCulled = false; m.visible = false; return m; };
const size = (m, key, w) => { const t = tex[key]; const ar = t ? t.image.height / t.image.width : 0.3; m.scale.set(w, w * ar, 1); return w * ar; };

class Girl {
  constructor(A, p) {
    this.A = A; this.p = p; const g = A.g;
    this.who = p.w.kind === 'mantra' ? 'cat' : 'pink';
    this.word = picture(null, 84, p.slot); g.add(this.word);
    this.wash = flat(0xff1a3a, 83); g.add(this.wash);
    this.dark = flat(0x000000, 83); g.add(this.dark);
    this.cracks = [0, 1, 2].map((i) => { const m = picture(null, 85, i * 0.3); g.add(m); m.userData.t = 9; return m; });
    this.ow = picture(null, 86, 0.5); g.add(this.ow); this.owT = 9;
    this.cont = picture(null, 87, 0.2); g.add(this.cont);
    this.num = new Text(88, { shadow: '#d8141e', sw: 0.1 }); g.add(this.num.m);
    // reload stickers
    const set = (A.hud.B.reloadQ || {})[this.who] || 'a';
    this.rl = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `ui/rlq_${this.who}_${set}_${i}`).filter((k) => tex[k]);
    this.st = [0, 1, 2, 3].map((i) => { const m = picture(null, 60 + i * 0.01, i * 0.2); g.add(m); m.userData.t = 9; return m; });
    this.si = 0; this.step = -1; this.last = {}; this.washK = 0;
  }
  // her corner zone (screen px, y up): between the screen edge and her figure, above her HUD panel
  zone() {
    const L = this.A.hud.L, f = L.f, H = L.H, p = this.p, left = p.slot === 0, fig = this.A.hud.space.girl(p.slot);
    const edge = left ? f.x : f.x + f.w, outer = fig ? (left ? fig.x0 : fig.x1) : p.baseX + (left ? -1 : 1) * H * 0.15;
    return { x0: Math.min(edge, outer), x1: Math.max(edge, outer), y0: H * 0.4, y1: H * 0.8, left };
  }
  half() { const L = this.A.hud.L, f = L.f; return this.p.slot === 0 || !this.A.game.p2on() ? (this.A.game.p2on() ? [f.x, f.x + f.w / 2] : [f.x, f.x + f.w]) : [f.x + f.w / 2, f.x + f.w]; }
  update(dt, t) {
    const p = this.p, g = this.A.game, L = this.A.hud.L, H = L.H, last = this.last;
    const on = (p.slot === 0 || g.p2on()) && p.state !== 'away';
    const [hx0, hx1] = this.half(), hw = hx1 - hx0, hcx = (hx0 + hx1) / 2;
    // ---- the big word: RELOAD! blinking while she reloads, NO AMMO! when empty
    const reload = on && g.combat && p.state === 'reload', empty = on && g.combat && p.ammo <= 0 && !p.gatling && !p.beaming && p.state !== 'reload' && p.state !== 'down';
    const key = reload ? (this.who === 'pink' ? 'ui/alert_reload_cute' : 'ui/alert_reload_p5') : empty ? 'ui/alert_noammo' : null;
    const blink = (t * 3.2) % 1 < 0.68;
    this.word.visible = !!key && !!tex[key] && blink;
    if (this.word.visible) {
      this.word.material.uniforms.map.value = tex[key];
      const w = Math.min(hw * 0.62, H * 0.62);
      size(this.word, key, w * (1 + 0.04 * Math.sin(t * 20)));
      this.word.position.set(hcx, H * 0.62, 0); this.word.rotation.z = -0.06;
      const U = this.word.material.uniforms; U.a.value = 0.88; U.time.value = t; U.shine.value = 1;
    }
    // ---- hit: a crack where it came from, a quick word, a red wash over her half
    if (on && last.hp !== undefined && p.hp < last.hp - 0.5 && g.combat) {
      const c = this.cracks.find((m) => m.userData.t > 1.2) || this.cracks[0], n = Math.floor(Math.random() * 6);
      c.material.uniforms.map.value = tex[`fx/crack_${n}`] || null; c.userData.t = 0;
      c.position.set(rnd(hx0 + hw * 0.15, hx1 - hw * 0.15), rnd(H * 0.35, H * 0.8), 0); c.rotation.z = rnd(0, 6.28);
      c.userData.s = H * rnd(0.32, 0.46);
      const ok = Math.random() < 0.5 ? 'ui/alert_ouch' : 'ui/alert_hit';
      this.ow.material.uniforms.map.value = tex[ok] || null; this.owT = 0; this.owPos = [c.position.x + rnd(-1, 1) * H * 0.05, c.position.y + H * 0.08];
      this.washK = 1;
    }
    last.hp = p.hp;
    for (const c of this.cracks) {
      c.userData.t += dt; const k = c.userData.t;
      c.visible = k < 1.4 && !!c.material.uniforms.map.value;
      if (c.visible) { c.scale.setScalar(c.userData.s * (k < 0.05 ? 0.7 + k * 6 : 1)); c.material.uniforms.a.value = k < 0.9 ? 0.95 : 0.95 * (1.4 - k) / 0.5; c.material.uniforms.time.value = t; }
    }
    this.owT += dt;
    this.ow.visible = this.owT < 0.55 && !!this.ow.material.uniforms.map.value;
    if (this.ow.visible) {
      const k = Math.min(1, this.owT / 0.08);
      size(this.ow, this.ow.material.uniforms.map.value === tex['ui/alert_ouch'] ? 'ui/alert_ouch' : 'ui/alert_hit', H * 0.3 * (1.5 - 0.5 * k));
      this.ow.position.set(this.owPos[0], this.owPos[1], 0); this.ow.rotation.z = 0.15;
      this.ow.material.uniforms.a.value = this.owT < 0.4 ? 1 : (0.55 - this.owT) / 0.15;
    }
    this.washK = Math.max(0, this.washK - dt * 3);
    this.wash.visible = this.washK > 0.01;
    if (this.wash.visible) { this.wash.position.set(hcx, H / 2, 0); this.wash.scale.set(hw, H, 1); this.wash.material.opacity = this.washK * 0.22; }
    // ---- down: her half dark, CONTINUE? and the countdown
    const down = on && p.state === 'down';
    this.dark.visible = this.cont.visible = this.num.m.visible = down;
    if (down) {
      this.dark.position.set(hcx, H / 2, 0); this.dark.scale.set(hw, H, 1); this.dark.material.opacity = 0.42 + 0.06 * Math.sin(t * 4);
      const ck = this.who === 'pink' ? 'ui/alert_continue_p5' : 'ui/alert_continue_chrome';
      this.cont.material.uniforms.map.value = tex[ck] || null; this.cont.visible = !!tex[ck];
      size(this.cont, ck, Math.min(hw * 0.7, H * 0.7)); this.cont.position.set(hcx, H * 0.64, 0); this.cont.rotation.z = -0.05;
      this.cont.material.uniforms.a.value = (t * 2) % 1 < 0.75 ? 1 : 0.35; this.cont.material.uniforms.time.value = t;
      const sec = Math.max(0, Math.ceil(p.downT));
      this.num.set(`${sec}`, H * 0.2); this.num.at(hcx, H * 0.4, -6, 1 + 0.12 * Math.max(0, Math.sin((p.downT % 1) * Math.PI)));
    }
    // ---- reload stickers: slapped on in her corner, one per ninth of the reload, irregularly, the last few stay stacked
    if (reload && this.rl.length) {
      const k = 1 - p.reloadT / (p.reloadT0 || 1), n = this.rl.length, step = Math.min(n - 1, Math.floor(k * n));
      if (step !== this.step) {
        this.step = step;
        const z = this.zone(), m = this.st[this.si++ % this.st.length], s = H * rnd(0.15, 0.2);
        m.material.uniforms.map.value = tex[this.rl[step]]; m.userData.t = 0; m.userData.s = s;
        m.position.set(rnd(z.x0 + s * 0.45, Math.max(z.x0 + s * 0.45, z.x1 - s * 0.45)), rnd(z.y0 + s * 0.5, z.y1 - s * 0.5), 0);
        m.rotation.z = rnd(-0.45, 0.45); m.userData.rot = m.rotation.z;
        m.renderOrder = 60 + this.si * 0.001;
        if (this.who === 'cat') {   // the seal's character by her paw (at the top of her figure, toward the middle)
          const fig = this.A.hud.space.girl(p.slot), ch = C.theme.kuji[step % C.theme.kuji.length];
          if (fig) g.fx.chant.flash(ch, step, p.slot ? fig.x0 + H * 0.02 : fig.x1 - H * 0.02, fig.y1 - (fig.y1 - fig.y0) * 0.3, H * 0.12);
        }
      }
    } else this.step = -1;
    for (const m of this.st) {
      m.userData.t += dt; const k = m.userData.t, life = reload ? 9 : 0.25;
      m.visible = !!m.material.uniforms.map.value && (reload ? k < 9 : k < life);
      if (!reload && m.userData.t < 9) m.userData.t = Math.max(m.userData.t, 9 - 0.2);   // reload over: they peel away
      if (!m.visible) continue;
      const img = m.material.uniforms.map.value.image, ar = img.height / img.width, slap = k < 0.07 ? 1.45 - k * 6.4 : 1;
      m.scale.set(m.userData.s * slap, m.userData.s * ar * slap, 1);
      m.rotation.z = m.userData.rot + (k < 0.07 ? (0.07 - k) * 3 : 0);
      m.material.uniforms.a.value = reload ? 1 : Math.max(0, (9.2 - m.userData.t) / 0.2); m.material.uniforms.time.value = t;
      if (m.visible) this.A.hud.space.claim({ x0: m.position.x - m.userData.s / 2, x1: m.position.x + m.userData.s / 2, y0: m.position.y - m.userData.s / 2, y1: m.position.y + m.userData.s / 2 });
    }
  }
}

export class Alerts {
  constructor(hud) {
    this.hud = hud; this.game = hud.game; this.g = new THREE.Group(); hud.g.add(this.g);
    this.girls = this.game.players.map((p) => new Girl(this, p));
    this.danger = picture('ui/alert_danger', 89, 0.9); this.g.add(this.danger); this.dangerT = 9;
  }
  // a must-hide attack starts: DANGER!! over the whole screen for a moment
  warnDanger() { this.dangerT = 0; }
  update(dt, t) {
    for (const g of this.girls) g.update(dt, t);
    const L = this.hud.L, H = L.H;
    this.dangerT += dt;
    this.danger.visible = this.dangerT < 1.1 && (t * 6) % 1 < 0.7 && !!tex['ui/alert_danger'];
    if (this.danger.visible) {
      size(this.danger, 'ui/alert_danger', Math.min(L.W * 0.55, H * 0.9));
      this.danger.position.set(L.W / 2, H * 0.6, 0); this.danger.rotation.z = -0.05;
      this.danger.material.uniforms.a.value = 0.92; this.danger.material.uniforms.time.value = t;
    }
  }
}
