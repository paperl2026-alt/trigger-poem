// Old-arcade-style alerts and the reload stickers (docs/DESIGN.md「战斗画面布局」, user refs art/ref/hud/arcade_*.png): things that matter
// for a moment are made BIG on her half of the screen, then gone — not small art in a corner:
//   RELOAD!        blinking big lettering over her half while she reloads (the lettering art R39: ui/alert_*)
//   NO AMMO!       when she is empty and not reloading
//   hit            the screen glass cracks where it came from (fx/crack_*), a quick OUCH!! / HIT!, a red wash on her half
//   down           her half goes dark: CONTINUE? and the big countdown to her revive (9 s)
// Danger is told at the SCREEN EDGES (docs/DESIGN.md「危险提示在屏幕边缘」, user: the upper half is for the monsters' show): her side's edge
// glows and pulses, see-through, with a small word by the edge: red 躲! (a must-hide attack coming, with its seconds), amber 击落!
// (something flying at her), a slow dark-red heartbeat when her HP is low. The warnings on the monsters themselves stay small (fx.lock).
// The reload itself: chibi big-head stickers (ui/rlq_<who>_<set>_1..9) slapped on one after another, irregularly, overlapping, in her
// corner above her HUD panel (never over the girls); the cat girl's nine seals also flash their characters by her paw.
import * as THREE from 'three';
import { tex } from '../core/assets.js';
import { C, T } from '../core/content.js';
import { Text, picture } from './glhud.js';
import { lang } from '../core/i18n.js';

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
      // in her corner above her HUD panel, toward the screen edge (the reload stickers' zone), not over the monsters
      const z = this.zone(), w = Math.min(H * 0.34, Math.max(H * 0.22, (z.x1 - z.x0) * 1.2)), cx = (z.x0 + z.x1) / 2;
      size(this.word, key, w * (1 + 0.04 * Math.sin(t * 20)));
      this.word.position.set(z.left ? Math.max(L.f.x + w * 0.5, cx) : Math.min(L.f.x + L.f.w - w * 0.5, cx), H * 0.3, 0); this.word.rotation.z = z.left ? 0.08 : -0.08;
      const U = this.word.material.uniforms; U.a.value = 0.8; U.time.value = t; U.shine.value = 1;
    }
    // ---- hit: a crack where it came from, a quick word, a red wash over her half
    if (on && last.hp !== undefined && p.hp < last.hp - 0.5 && g.combat) {
      const c = this.cracks.find((m) => m.userData.t > 1.2) || this.cracks[0], n = Math.floor(Math.random() * 6);
      c.material.uniforms.map.value = tex[`fx/crack_${n}`] || null; c.userData.t = 0;
      const outer = p.slot === 0 || !g.p2on() ? hx0 + hw * 0.16 : hx1 - hw * 0.16;   // toward her edge of the screen
      c.position.set(outer + rnd(-1, 1) * hw * 0.12, rnd(H * 0.3, H * 0.7), 0); c.rotation.z = rnd(0, 6.28);
      c.userData.s = H * rnd(0.2, 0.28);
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
      size(this.ow, this.ow.material.uniforms.map.value === tex['ui/alert_ouch'] ? 'ui/alert_ouch' : 'ui/alert_hit', H * 0.17 * (1.5 - 0.5 * k));
      this.ow.position.set(this.owPos[0], this.owPos[1], 0); this.ow.rotation.z = 0.15;
      this.ow.material.uniforms.a.value = this.owT < 0.4 ? 1 : (0.55 - this.owT) / 0.15;
    }
    this.washK = Math.max(0, this.washK - dt * 3);
    this.wash.visible = this.washK > 0.01;
    if (this.wash.visible) { this.wash.position.set(hcx, H / 2, 0); this.wash.scale.set(hw, H, 1); this.wash.material.opacity = this.washK * 0.12; }
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

// the edge glow: each side (1P left, 2P right) its own colour and strength, a band along the side edge that runs a little along the top and
// bottom, wobbling and scanning, see-through
const EDGE_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const EDGE_FRAG = `
uniform vec2 res; uniform vec2 fr; uniform vec4 colL; uniform vec4 colR; uniform float time;
varying vec2 vUv;
float band(float d, float w) { return exp(-max(d, 0.0) / w); }
void main(){
  vec2 p = vUv * res;
  float T = res.y * 0.09, x = (p.x - fr.x) / max(1.0, fr.y - fr.x);
  float wob = 1.0 + 0.18 * sin(p.y * 0.035 + time * 7.0) + 0.1 * sin(p.y * 0.11 - time * 11.0);
  float tb = min(p.y, res.y - p.y);
  float l = max(band(p.x - fr.x, T * wob), band(tb, T * 0.55) * smoothstep(0.5, 0.12, x));
  float r = max(band(fr.y - p.x, T * wob), band(tb, T * 0.55) * smoothstep(0.5, 0.88, x));
  float scan = 0.82 + 0.18 * sin(p.y * 0.3 - time * 30.0);
  float al = l * colL.a * scan, ar = r * colR.a * scan, a = clamp(al + ar, 0.0, 0.85);
  if (a < 0.003) discard;
  gl_FragColor = vec4((colL.rgb * al + colR.rgb * ar) / max(0.0001, al + ar), a);
}`;
const SAYS = { hide: { zh: '躲!', ja: '隠れて!', en: 'HIDE!' }, shot: { zh: '击落!', ja: '撃ち落とせ!', en: 'SHOOT DOWN!' }, low: { zh: '危险!', ja: 'ピンチ!', en: 'DANGER!' } };
const EDGE_COL = { hide: 0xff1f4a, shot: 0xffb21f, low: 0xb3001e };
const TMPC = new THREE.Color();

export class Alerts {
  constructor(hud) {
    this.hud = hud; this.game = hud.game; this.g = new THREE.Group(); hud.g.add(this.g);
    this.girls = this.game.players.map((p) => new Girl(this, p));
    this.EU = { res: { value: new THREE.Vector2(1, 1) }, fr: { value: new THREE.Vector2(0, 1) }, colL: { value: new THREE.Vector4() }, colR: { value: new THREE.Vector4() }, time: { value: 0 } };
    this.edge = new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms: this.EU, vertexShader: EDGE_VERT, fragmentShader: EDGE_FRAG, transparent: true, depthTest: false, depthWrite: false }));
    this.edge.renderOrder = 59; this.edge.frustumCulled = false; this.g.add(this.edge);
    this.words = [0, 1].map(() => { const w = new Text(59.5, { color: '#ffffff', shadow: '#121012', sw: 0.14 }); this.g.add(w.m); return w; });
    this.k = [{ hide: 0, shot: 0, low: 0 }, { hide: 0, shot: 0, low: 0 }];
  }
  warnDanger() {}   // (the old full-screen DANGER!!: the edges say it now)
  update(dt, t) {
    for (const g of this.girls) g.update(dt, t);
    const L = this.hud.L, H = L.H, g = this.game, both = !g.p2on();
    // what threatens each side now
    const want = [{ hide: 0, shot: 0, low: 0, left: 9 }, { hide: 0, shot: 0, low: 0, left: 9 }];
    for (const lk of g.fx.live || []) {
      const kind = lk.type === 'heavy' ? 'hide' : lk.type === 'shot' ? 'shot' : null;
      if (!kind || !g.combat) continue;
      const sides = lk.slot < 0 || both ? [0, 1] : [lk.slot];
      for (const s of sides) { want[s][kind] = Math.max(want[s][kind], 0.45 + 0.55 * lk.p); if (kind === 'hide') want[s].left = Math.min(want[s].left, lk.left ?? 9); }
    }
    for (const p of g.players) {
      if (!(p.slot === 0 || g.p2on()) || p.state === 'down' || p.state === 'away' || !g.combat) continue;
      if (p.hp < p.maxHp * 0.35) for (const s of both ? [0, 1] : [p.slot]) want[s].low = 1;
    }
    const cols = [this.EU.colL.value, this.EU.colR.value];
    this.k.forEach((k, s) => {
      for (const n of ['hide', 'shot', 'low']) k[n] += (want[s][n] - k[n]) * Math.min(1, dt * (want[s][n] > k[n] ? 12 : 4));
      // the strongest wins the colour; its pulse
      const top = k.hide > 0.05 ? 'hide' : k.shot > 0.05 ? 'shot' : k.low > 0.05 ? 'low' : null;
      const pulse = top === 'hide' ? 0.6 + 0.4 * Math.abs(Math.sin(t * (5 + 10 * k.hide))) : top === 'shot' ? 0.7 + 0.3 * Math.abs(Math.sin(t * 9)) : 0.45 + 0.55 * Math.pow(Math.abs(Math.sin(t * 2.6)), 6);
      TMPC.setHex(top ? EDGE_COL[top] : 0);
      cols[s].set(TMPC.r, TMPC.g, TMPC.b, top ? Math.min(1, k[top]) * pulse * (top === 'low' ? 0.55 : 0.75) : 0);
      // the small word by that edge (with the seconds left for 躲!)
      const w = this.words[s];
      w.m.visible = !!top && k[top] > 0.25;
      if (w.m.visible) {
        const say = SAYS[top][lang] || SAYS[top].en, sec = top === 'hide' && want[s].left < 9 ? ` ${Math.max(1, Math.ceil(want[s].left))}` : '';
        w.set(say + sec, H * 0.042, top === 'shot' ? '#ffe7a6' : '#ffffff', H);
        const x = s === 0 ? L.f.x + w.c.width * 0.5 + H * 0.03 : L.f.x + L.f.w - w.c.width * 0.5 - H * 0.03;
        w.at(x, H * 0.56, s === 0 ? 8 : -8, 1 + 0.06 * pulse);
        w.m.material.uniforms.a.value = Math.min(1, k[top]) * (0.6 + 0.4 * pulse);
      }
    });
    this.edge.position.set(L.W / 2, H / 2, 0); this.edge.scale.set(L.W, H, 1);
    this.EU.res.value.set(L.W, H); this.EU.fr.value.set(L.f.x, L.f.x + L.f.w); this.EU.time.value = t;
    this.edge.visible = cols[0].w > 0.003 || cols[1].w > 0.003;
  }
}
