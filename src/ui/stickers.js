// Callouts (docs/DESIGN.md「气泡 / 喊话要像 P5 那样临时冒一下」, ref art/ref/hud/p5_menu.png): like Persona 5's battle command menu. A line
// pops out FROM the girl who says it, as a little fan of steeply tilted slabs, one after another (the words on a black slab with a white
// edge, a small English tag on a white slab, no button icons), holds a moment and is swept away. It stays in her own safe area: by her
// head, on the outer side (between her and the screen edge), above her HUD panel; never at the reticle or the middle of the screen,
// never over the HUD or the girls (user, round 7). One fan per girl; a more important line replaces the showing one.
// Every kill pops a sound-effect sticker where the monster was (fx/ono_*, art R42). Lines: content text/stickers.json.
import { voice } from '../core/audio.js';
import * as THREE from 'three';
import { tex } from '../core/assets.js';
import { C } from '../core/content.js';
import { lang } from '../core/i18n.js';
import { Text, picture } from './glhud.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const PRIO = { down: 9, skill: 8, coverBroken: 7, low: 7, revive: 6, stagger: 6, hurt: 6, fever: 6, join: 5, ready: 5, empty: 5, crit: 4, combo: 4, kill: 3, reload: 2, hit: 1, cover: 1,
  scare: 7, bridge: 7, rot: 6, real: 5, photo: 5, armor: 5, idle: 1 };
const TAG = { hit: 'HIT', crit: 'CRITICAL', kill: 'K.O.', combo: 'COMBO', hurt: 'OUCH', low: 'DANGER', reload: 'RELOAD', empty: 'NO AMMO', fever: 'FEVER',
  ready: 'SKILL OK', skill: 'SKILL', cover: 'COVER', revive: 'REVIVE', down: 'DOWN', coverBroken: 'BREAK', stagger: 'BREAK', join: 'JOIN', windup: 'WARNING', callout: 'NOTICE' };

// a slab: a skewed quad (black or white) with a thin offset edge and its words
function shear(geo, k) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + p.getY(i) * k); p.needsUpdate = true; return geo; }
class Slab {
  constructor(layer, order) {
    const mk = (col, o) => { const m = new THREE.Mesh(shear(new THREE.PlaneGeometry(1, 1), 0.28), new THREE.MeshBasicMaterial({ color: col, transparent: true, depthTest: false, depthWrite: false }));
      m.renderOrder = o; m.frustumCulled = false; layer.add(m); return m; };
    this.edge = mk(0xffffff, order); this.back = mk(0x121012, order + 0.1); this.under = mk(0xd8141e, order - 0.1);
    this.txt = new Text(order + 0.4, { color: '#ffffff', stroke: null, sw: 0 }); layer.add(this.txt.m);
    this.hide();
  }
  hide() { for (const m of [this.edge, this.back, this.under, this.txt.m]) m.visible = false; }
  set(text, h, dark) {
    this.dark = dark;
    this.txt.st.color = dark ? '#ffffff' : '#121012'; this.txt.str = null;
    this.txt.set(text, h * 0.56, this.txt.st.color, h * 12);
    this.back.material.color.set(dark ? 0x121012 : 0xffffff); this.edge.material.color.set(dark ? 0xffffff : 0x121012);
    this.w = this.txt.c.width + h * 0.9; this.h = h;
  }
  place(x, y, rot, s, a) {
    const c = Math.cos(rot), sn = Math.sin(rot), w = this.w * s, h = this.h * s;
    const at = (m, dx, dy, sx, sy) => { m.visible = a > 0.01; m.position.set(x + dx * c - dy * sn, y + dx * sn + dy * c, 0); m.rotation.z = rot; m.scale.set(sx, sy, 1); if (m.material.opacity !== undefined) m.material.opacity = a; };
    at(this.under, h * 0.12, -h * 0.12, w, h);
    at(this.edge, 0, 0, w + h * 0.16, h * 1.16);
    at(this.back, 0, 0, w, h);
    this.txt.at(x, y, rot * 57.3, s); this.txt.m.visible = a > 0.01; this.txt.m.material.uniforms.a.value = a;
  }
}

// a fan of slabs that comes out one by one beside a point, holds, and is knocked away
class Fan {
  constructor(layer, order) { this.slabs = [0, 1].map(() => new Slab(layer, order)); this.t = 9; this.life = 1; }
  get on() { return this.t < this.life; }
  show(kind, text, x, y, h, dir) {
    this.kind = kind; this.x = x; this.y = y; this.h = h; this.dir = dir; this.t = 0;
    this.life = 1.0 + Math.min(0.9, text.length * 0.05);
    this.slabs[0].set(text, h, true);
    this.slabs[1].set(TAG[kind] || 'TALK', h * 0.58, false);
    this.w = Math.max(this.slabs[0].w, this.slabs[1].w + h * 0.5);
  }
  knock() { if (this.t < this.life - 0.12) this.t = this.life - 0.12; }
  rect() { return { x0: this.x - this.w / 2, x1: this.x + this.w / 2, y0: this.y - this.h * 1.1, y1: this.y + this.h * 0.8 }; }
  update(dt) {
    this.t += dt;
    if (!this.on) { this.slabs.forEach((s) => s.hide()); return; }
    const out = Math.max(0, (this.t - (this.life - 0.12)) / 0.12);
    this.slabs.forEach((s, i) => {
      // out of her (the fan's root is at her head), one after another, steeply tilted like the P5 menu; at the end swept outward
      const k = Math.min(1, Math.max(0, (this.t - i * 0.08) / 0.1)), e = 1 - (1 - k) * (1 - k);
      const rot = this.dir * ((i ? 0.22 : 0.4) + (1 - e) * 0.5 + out * 0.5);
      const ox = this.dir * (i ? this.h * 1.0 : 0), oy = i ? -this.h * 0.95 : 0;
      const from = (1 - e) * this.dir * -this.w * 0.45, away = out * this.dir * this.w * 0.9;
      s.place(this.x + ox + from + away, this.y + oy + (1 - e) * -this.h * 0.6 + out * this.h * 0.5, rot, (0.5 + 0.5 * e) * (1 + 0.1 * Math.max(0, 1 - this.t * 5)), e * (1 - out));
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
  hit(p, crit) { this.say(p, crit ? 'crit' : 'hit', crit ? 0.35 : 0.04); }
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
    const li = Math.floor(Math.random() * set.lines.length), line = set.lines[li], text = line[lang] || line.en;
    if (text === H.lastText && set.lines.length > 1) return this.say(p, kind, 1);
    // her voice for this line (core/audio.js voice: one channel for both girls, by priority); small talk that cannot be said now is not
    // shown either (fewer, clearer lines: docs/TECH.md「声音」)
    if (voice(p.id, kind, li, p.slot, pr) === false && pr <= 4) return;
    H.lastText = text; this.quiet = 0;
    // from her head, on her OUTER side (toward her screen edge: her safe area), above her HUD panel; if that side is too narrow, above her head
    const L = this.hud.L, Hh = L.H, f0 = L.f, left = p.slot === 0 || !this.game.p2on(), dir = left ? -1 : 1, fig = this.hud.space.girl(p.slot);
    const h = Hh * 0.046, head = fig ? fig.y1 - (fig.y1 - fig.y0) * 0.1 : Hh * 0.5, outer = fig ? (left ? fig.x0 : fig.x1) : p.baseX + dir * Hh * 0.12;
    if (H.f.on) H.f.knock();
    const f = H.f; H.f = H.g || new Fan(this.layer, 75); H.g = f;
    H.f.show(kind, text, 0, 0, h, dir);
    const w = H.f.w, room = left ? outer - f0.x : f0.x + f0.w - outer;
    let x = outer + dir * w * 0.42, y = Math.max(Hh * 0.36, head);
    if (room < w * 0.75) { x = (fig ? (fig.x0 + fig.x1) / 2 : p.baseX) + dir * w * 0.2; y = Math.max(y, (fig ? fig.y1 : Hh * 0.5) + h * 1.6); }
    x = Math.max(f0.x + w * 0.55, Math.min(f0.x + f0.w - w * 0.55, x));
    H.f.x = x; H.f.y = Math.min(Hh * 0.8, y);
    H.f.spot = H.f.rect();
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
    // nobody has said anything for a while: a little cute nonsense (えへへ, にゃ~, やだよぉ ...: DESIGN「台词」)
    this.quiet = (this.quiet || 0) + dt;
    if (g.combat && this.quiet > 9 && Math.random() < dt * 0.25) { this.quiet = 0; this.say(pick(g.players.filter((p) => (p.slot === 0 || g.p2on()) && p.state !== 'down')), 'idle'); }
    if (g.combo >= 10 && g.combo % 10 === 0 && g.combo !== this.lastCombo) { this.lastCombo = g.combo; this.say(pick(g.players.filter((p) => p.slot === 0 || g.p2on())), 'combo'); }
    for (const a of g.actors) {
      if (!a.def || !a.type) continue;
      const was = this.seen.get(a), now = !a.alive ? 'dead' : a.state;
      if (was !== now) this.seen.set(a, now);
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
