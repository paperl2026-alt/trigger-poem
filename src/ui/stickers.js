// Callouts (docs/DESIGN.md「气泡 / 喊话要像 P5 那样临时冒一下」, ref art/ref/hud/p5_menu.png): like Persona 5's battle command menu. A line
// pops out beside her head as a little fan of tilted slabs, one after another — the words on a black slab with a white edge, an English
// tag on a white slab, each with a round button mark — holds a moment and is knocked away. Each heroine's come up by her own head, toward
// the middle of the screen (one fan at a time; a more important one replaces the showing one). Monsters call out when they wind up.
// Every kill pops a sound-effect sticker where the monster was (fx/ono_*, art R42). Everything finds free space (src/ui/space.js): never
// over the HUD or the girls. Lines: content text/stickers.json.
import * as THREE from 'three';
import { tex } from '../core/assets.js';
import { C } from '../core/content.js';
import { lang } from '../core/i18n.js';
import { Text, picture } from './glhud.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const PRIO = { down: 9, skill: 8, coverBroken: 7, low: 7, revive: 6, stagger: 6, hurt: 6, fever: 6, join: 5, ready: 5, empty: 5, crit: 4, combo: 4, kill: 3, reload: 2, hit: 1, cover: 1 };
const TAG = { hit: 'HIT', crit: 'CRITICAL', kill: 'K.O.', combo: 'COMBO', hurt: 'OUCH', low: 'DANGER', reload: 'RELOAD', empty: 'NO AMMO', fever: 'FEVER',
  ready: 'SKILL OK', skill: 'SKILL', cover: 'COVER', revive: 'REVIVE', down: 'DOWN', coverBroken: 'BREAK', stagger: 'BREAK', join: 'JOIN', windup: 'WARNING', callout: 'NOTICE' };
const BTN = ['○', '△', '✕', '□'];

// a slab: a skewed quad (black or white) with a thin offset edge, a round button mark, and its words
function shear(geo, k) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + p.getY(i) * k); p.needsUpdate = true; return geo; }
class Slab {
  constructor(layer, order) {
    const mk = (col, o) => { const m = new THREE.Mesh(shear(new THREE.PlaneGeometry(1, 1), 0.28), new THREE.MeshBasicMaterial({ color: col, transparent: true, depthTest: false, depthWrite: false }));
      m.renderOrder = o; m.frustumCulled = false; layer.add(m); return m; };
    this.edge = mk(0xffffff, order); this.back = mk(0x121012, order + 0.1); this.under = mk(0xd8141e, order - 0.1);
    this.btn = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthTest: false, depthWrite: false }));
    this.btn.renderOrder = order + 0.2; this.btn.frustumCulled = false; layer.add(this.btn);
    this.bt = new Text(order + 0.3, { color: '#121012', stroke: null, italic: false, sw: 0 }); layer.add(this.bt.m);
    this.txt = new Text(order + 0.4, { color: '#ffffff', stroke: null, sw: 0 }); layer.add(this.txt.m);
    this.hide();
  }
  hide() { for (const m of [this.edge, this.back, this.under, this.btn, this.bt.m, this.txt.m]) m.visible = false; }
  set(text, h, dark, btn) {
    this.dark = dark;
    this.txt.st.color = dark ? '#ffffff' : '#121012'; this.txt.str = null;
    this.txt.set(text, h * 0.56, this.txt.st.color, h * 12);
    this.bt.set(btn, h * 0.36, '#121012');
    this.back.material.color.set(dark ? 0x121012 : 0xffffff); this.edge.material.color.set(dark ? 0xffffff : 0x121012);
    this.w = this.txt.c.width + h * 1.3; this.h = h;
  }
  place(x, y, rot, s, a) {
    const c = Math.cos(rot), sn = Math.sin(rot), w = this.w * s, h = this.h * s;
    const at = (m, dx, dy, sx, sy) => { m.visible = a > 0.01; m.position.set(x + dx * c - dy * sn, y + dx * sn + dy * c, 0); m.rotation.z = rot; m.scale.set(sx, sy, 1); if (m.material.opacity !== undefined) m.material.opacity = a; };
    at(this.under, h * 0.12, -h * 0.12, w, h);
    at(this.edge, 0, 0, w + h * 0.16, h * 1.16);
    at(this.back, 0, 0, w, h);
    at(this.btn, -w / 2 + h * 0.55, 0, h * 0.72, h * 0.72);
    this.bt.at(x + (-w / 2 + h * 0.55) * c, y + (-w / 2 + h * 0.55) * sn, rot * 57.3, s); this.bt.m.visible = a > 0.01; this.bt.m.material.uniforms.a.value = a;
    const tx = h * 0.35;
    this.txt.at(x + tx * c, y + tx * sn, rot * 57.3, s); this.txt.m.visible = a > 0.01; this.txt.m.material.uniforms.a.value = a;
  }
}

// a fan of slabs that comes out one by one beside a point, holds, and is knocked away
class Fan {
  constructor(layer, order) { this.slabs = [0, 1].map(() => new Slab(layer, order)); this.t = 9; this.life = 1; }
  get on() { return this.t < this.life; }
  show(kind, text, x, y, h, dir) {
    this.kind = kind; this.x = x; this.y = y; this.h = h; this.dir = dir; this.t = 0;
    this.life = 1.0 + Math.min(0.9, text.length * 0.05);
    this.slabs[0].set(text, h, true, pick(BTN));
    this.slabs[1].set(TAG[kind] || 'TALK', h * 0.62, false, pick(BTN));
    this.w = Math.max(this.slabs[0].w, this.slabs[1].w * 0.62 + h);
  }
  knock() { if (this.t < this.life - 0.12) this.t = this.life - 0.12; }
  rect() { return { x0: this.x - this.w / 2, x1: this.x + this.w / 2, y0: this.y - this.h * 1.1, y1: this.y + this.h * 0.8 }; }
  update(dt) {
    this.t += dt;
    if (!this.on) { this.slabs.forEach((s) => s.hide()); return; }
    const out = Math.max(0, (this.t - (this.life - 0.12)) / 0.12);
    this.slabs.forEach((s, i) => {
      const k = Math.min(1, Math.max(0, (this.t - i * 0.07) / 0.09));   // one after another
      const slide = (1 - k) * this.h * 1.5 * this.dir;
      const rot = (i ? -0.12 : -0.2) * this.dir + (1 - k) * 0.3 * this.dir + out * 0.6 * this.dir;
      const ox = i ? this.dir * this.h * 0.55 : 0, oy = i ? -this.h * 0.82 : 0;
      s.place(this.x + ox - slide + out * this.h * 2 * this.dir, this.y + oy - out * this.h * 0.6, rot, (0.6 + 0.4 * k) * (1 + 0.08 * Math.max(0, 1 - this.t * 6)), k * (1 - out));
    });
  }
}

export class Stickers {
  constructor(hud) {
    this.hud = hud; this.game = hud.game;
    this.layer = new THREE.Group(); hud.g.add(this.layer);
    this.her = this.game.players.map(() => ({ f: new Fan(this.layer, 75), cd: 0, last: {} }));
    this.mon = [0, 1].map(() => new Fan(this.layer, 74));
    this.big = new Fan(this.layer, 76);
    this.onos = [0, 1, 2, 3, 4, 5].map(() => { const m = picture(null, 73, Math.random()); this.layer.add(m); m.userData.t = 9; return m; });
    this.oi = 0; this.mi = 0; this.seen = new Map(); this.monCd = 0;
  }
  get D() { return C.text.stickers; }
  hit(p, crit) { this.say(p, crit ? 'crit' : 'hit', crit ? 0.6 : 0.12); }
  kill(p) { this.say(p, 'kill', 0.55); }
  // a sound-effect sticker where a monster died (screen px, y up)
  onoma(x, y, big) {
    const keys = Object.keys(tex).filter((k) => k.startsWith('fx/ono_'));
    if (!keys.length) return;
    const m = this.onos[this.oi++ % this.onos.length], H = this.hud.L.H, s = H * (big ? 0.2 : 0.14) * rnd(0.9, 1.15);
    m.material.uniforms.map.value = tex[pick(keys)]; m.userData = { t: 0, x, y, s, rot: rnd(-0.35, 0.35), dx: rnd(-1, 1) * H * 0.06 };
  }
  say(p, kind, chance = 1) {
    if (!p || Math.random() > chance) return;
    const H = this.her[p.slot], set = this.D.heroines[p.id]?.[kind];
    if (!H || !set) return;
    const pr = PRIO[kind] || 1, cur = H.f.on ? PRIO[H.f.kind] || 1 : -1;
    if (pr < cur || (H.cd > 0 && pr <= cur)) return;
    const line = pick(set.lines), text = line[lang] || line.en;
    if (text === H.lastText && set.lines.length > 1) return this.say(p, kind, 1);
    H.lastText = text;
    // beside her head, toward the middle of the screen (like the P5 menu beside the character)
    const L = this.hud.L, Hh = L.H, left = p.slot === 0, dir = left ? 1 : -1, fig = this.hud.space.girl(p.slot);
    const h = Hh * 0.05, head = fig ? fig.y1 : Hh * 0.5, inner = fig ? (left ? fig.x1 : fig.x0) : p.baseX + dir * Hh * 0.1;
    const w = Hh * 0.32;
    const spot = this.hud.space.find(w, h * 2.2, [0, 1, -1, 2, 3].map((k) => ({ x: inner + dir * (w * 0.45), y: head - h * 0.8 - k * h * 1.2 })));
    if (H.f.on) H.f.knock();
    const f = H.f; H.f = H.g || new Fan(this.layer, 75); H.g = f;
    H.f.show(kind, text, spot.x, spot.y, h, dir); H.f.spot = spot;
    H.cd = 0.7;
  }
  callout(text) {
    const Hh = this.hud.L.H, W = this.hud.L.W, h = Hh * 0.07;
    const spot = this.hud.space.find(Hh * 0.55, h * 2.2, [{ x: W / 2, y: Hh * 0.72 }, { x: W / 2, y: Hh * 0.6 }]);
    this.big.show('callout', text, spot.x, spot.y, h, 1); this.big.spot = spot;
  }
  monster(a, kind) {
    if (this.hud.holdUI?.on || this.monCd > 0) return;
    const set = this.D.monsters[a.type] || this.D.monsters.default, lines = set[kind] || this.D.monsters.default[kind];
    if (!lines) return;
    const g = this.game, b = g.box(a), Hh = this.hud.L.H, h = Hh * 0.036, f = this.mon[this.mi++ % this.mon.length];
    const cx = (b.x0 + b.x1) / 2, top = Hh - b.y0, mid = Hh - (b.y0 + b.y1) / 2;
    const spot = this.hud.space.find(Hh * 0.2, h * 2.2, [{ x: cx, y: top + h * 1.4 }, { x: b.x1 + Hh * 0.11, y: mid }, { x: b.x0 - Hh * 0.11, y: mid }]);
    f.show(kind, pick(lines), spot.x, spot.y, h, spot.x >= cx ? 1 : -1); f.spot = spot;
    this.monCd = 0.8;
  }
  update(dt, time) {
    const g = this.game;
    this.monCd -= dt;
    g.players.forEach((p, i) => {
      const H = this.her[i], L = H.last;
      H.cd -= dt;
      if (H.f.on && H.f.spot) this.hud.space.claim(H.f.spot);
      H.f.update(dt); if (H.g) H.g.update(dt);
      if (!(p.slot === 0 || g.p2on()) || !g.combat && p.state !== 'down') { L.state = p.state; return; }
      if (L.hp !== undefined && p.hp < L.hp - 0.5) this.say(p, p.hp < p.maxHp * 0.25 ? 'low' : 'hurt', 0.7);
      if (p.state !== L.state) {
        if (p.state === 'reload') this.say(p, 'reload', 0.35);
        if (p.state === 'down') this.say(p, 'down');
        if (L.state === 'down') this.say(p, 'revive');
      }
      if (L.ammo > 0 && p.ammo <= 0 && !p.gatling) this.say(p, 'empty', 0.6);
      if (p.activeOn && !L.active) this.say(p, 'skill');
      if (p.charge >= 1 && L.charge < 1 && !p.activeOn) this.say(p, 'ready');
      if (p.fever.full && !L.full) this.say(p, 'fever');
      L.hp = p.hp; L.state = p.state; L.ammo = p.ammo; L.active = p.activeOn; L.charge = p.charge; L.full = p.fever.full;
    });
    if (g.combo >= 10 && g.combo % 10 === 0 && g.combo !== this.lastCombo) { this.lastCombo = g.combo; this.say(pick(g.players.filter((p) => p.slot === 0 || g.p2on())), 'combo'); }
    for (const a of g.actors) {
      if (!a.def || !a.type) continue;
      const was = this.seen.get(a), now = !a.alive ? 'dead' : a.state;
      if (was !== now) { if (now === 'windup') this.monster(a, 'windup'); this.seen.set(a, now); }
    }
    for (const f of [...this.mon, this.big]) { if (f.on && f.spot) this.hud.space.claim(f.spot); f.update(dt); }
    // the kill stickers: slap in big, wobble, float up and fade
    for (const m of this.onos) {
      const u = m.userData; u.t += dt;
      m.visible = u.t < 0.75 && !!m.material.uniforms.map.value;
      if (!m.visible) continue;
      const img = m.material.uniforms.map.value.image, ar = img.height / img.width, k = Math.min(1, u.t / 0.08);
      const s = u.s * (k < 1 ? 1.6 - 0.6 * k : 1 + 0.05 * Math.sin(u.t * 30) * Math.max(0, 0.4 - u.t));
      m.position.set(u.x + u.dx * u.t, u.y + u.t * this.hud.L.H * 0.06, 0); m.rotation.z = u.rot;
      m.scale.set(s, s * ar, 1);
      m.material.uniforms.a.value = u.t < 0.55 ? 1 : (0.75 - u.t) / 0.2; m.material.uniforms.time.value = time;
    }
  }
}
