// Callouts (docs/DESIGN.md「气泡 / 喊话要像 P5 那样临时冒一下」): few, short, one style. A line slams in on a tilted black P5 slab (white
// outline, red shadow, a bar of her colour), holds a moment and is cut away. Each heroine's come up in her own corner of the screen,
// above her HUD panel (one at a time; a more important one replaces the showing one); a monster's only when it winds up or dies, small,
// by the monster. Everything is placed in free space (src/ui/space.js): never over the HUD or the girls. Lines: content text/stickers.json.
// The state is watched here, so the game only calls hit() / kill() / say() for what it can't see from outside.
import * as THREE from 'three';
import { C } from '../core/content.js';
import { lang } from '../core/i18n.js';
import { Text, picture } from './glhud.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
// how much a moment matters (a more important one replaces the showing callout at once)
const PRIO = { down: 9, skill: 8, coverBroken: 7, low: 7, revive: 6, stagger: 6, hurt: 6, fever: 6, join: 5, ready: 5, empty: 5, crit: 4, combo: 4, kill: 3, reload: 2, hit: 1, cover: 1 };
const quad = new THREE.PlaneGeometry(1, 1);

class Callout {
  constructor(layer, order) {
    this.slab = picture('ui/hud_tag', order, Math.random());
    this.bar = new THREE.Mesh(quad, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthTest: false, depthWrite: false }));
    this.bar.renderOrder = order + 0.2; this.bar.frustumCulled = false;
    this.txt = new Text(order + 0.5, { color: '#ffffff', stroke: '#121012', shadow: '#d8141e', sw: 0.1 });
    layer.add(this.slab, this.bar, this.txt.m);
    this.t = 9; this.life = 1; this.hide();
  }
  hide() { this.slab.visible = this.bar.visible = this.txt.m.visible = false; }
  get on() { return this.t < this.life; }
  // h: the slab's height (px); color: her colour (the bar), or null
  show(kind, text, x, y, h, color, tilt) {
    this.kind = kind; this.text = text; this.x = x; this.y = y; this.h = h; this.tilt = tilt;
    this.t = 0; this.life = 0.75 + Math.min(0.8, text.length * 0.05);
    this.bar.visible = !!color; if (color) this.bar.material.color.set(color);
    this.txt.set(text, h * 0.5, '#ffffff', h * 9);
    this.w = Math.max(h * 2.2, this.txt.c.width * 1.18);
  }
  cut() { if (this.t < this.life - 0.08) this.t = this.life - 0.08; }
  rect() { return { x0: this.x - this.w / 2, x1: this.x + this.w / 2, y0: this.y - this.h / 2, y1: this.y + this.h / 2, x: this.x, y: this.y }; }
  update(dt, time) {
    this.t += dt;
    if (!this.on) { this.hide(); return; }
    const t = this.t, inK = Math.min(1, t / 0.1), outK = Math.max(0, (t - (this.life - 0.08)) / 0.08);
    // slam: big and skewed → snaps to size with a little overshoot; cut: squashed flat
    const s = inK < 1 ? 1.7 - 0.8 * inK : 1 + 0.06 * Math.max(0, 1 - (t - 0.1) * 8);
    const sy = 1 - outK, rot = this.tilt + (1 - inK) * -0.25;
    this.slab.visible = this.txt.m.visible = true;
    this.slab.position.set(this.x, this.y, 0); this.slab.rotation.z = rot; this.slab.scale.set(this.w * s, this.h * 1.25 * s * sy, 1);
    const U = this.slab.material.uniforms; U.time.value = time; U.shine.value = 0.8; U.a.value = 1;
    if (this.bar.visible) {
      const c = Math.cos(rot), sn = Math.sin(rot), off = -this.w * s * 0.5;
      this.bar.position.set(this.x + off * c, this.y + off * sn, 0); this.bar.rotation.z = rot; this.bar.scale.set(this.h * 0.18 * s, this.h * 1.05 * s * sy, 1);
    }
    this.txt.at(this.x, this.y, rot * 57.3, s * Math.max(0.01, sy));
    this.txt.m.material.uniforms.a.value = 1;
  }
}

export class Stickers {
  constructor(hud) {
    this.hud = hud; this.game = hud.game;
    this.layer = new THREE.Group(); hud.g.add(this.layer);
    this.her = this.game.players.map(() => ({ c: new Callout(this.layer, 75), cd: 0, last: {} }));
    this.mon = [0, 1].map(() => new Callout(this.layer, 74));
    this.big = new Callout(this.layer, 76);
    this.mi = 0; this.seen = new Map(); this.monCd = 0;
  }
  get D() { return C.text.stickers; }
  hit(p, crit) { this.say(p, crit ? 'crit' : 'hit', crit ? 0.5 : 0.06); }
  kill(p) { this.say(p, 'kill', 0.3); }
  // a heroine says something about `kind` (chance 0..1)
  say(p, kind, chance = 1) {
    if (!p || Math.random() > chance) return;
    const H = this.her[p.slot], set = this.D.heroines[p.id]?.[kind];
    if (!H || !set) return;
    const pr = PRIO[kind] || 1, cur = H.c.on ? PRIO[H.c.kind] || 1 : -1;
    if (pr < cur || (H.cd > 0 && pr <= cur) || (H.cd > 0 && pr < 5)) return;
    const line = pick(set.lines), text = line[lang] || line.en;
    if (text === H.lastText && set.lines.length > 1) return this.say(p, kind, 1);
    H.lastText = text;
    // her corner: above her HUD panel, between the screen edge and her figure
    const L = this.hud.L, f = L.f, Hh = L.H, left = p.slot === 0, s = left ? 1 : -1, fig = this.hud.space.girl(p.slot);
    const edge = left ? f.x : f.x + f.w, outer = fig ? (left ? fig.x0 : fig.x1) : p.baseX - s * Hh * 0.15;
    const h = Hh * 0.055, w = Hh * 0.3;
    const x = edge + s * (w * 0.5 + Hh * 0.02);
    const spot = this.hud.space.find(w, h * 1.3, [0.5, 0.58, 0.66, 0.74, 0.42].map((y) => ({ x, y: Hh * y })));
    if (H.c.on) H.c.cut();
    H.c.show(kind, text, spot.x, spot.y, h, p.c.color, s * rnd(0.05, 0.12));
    H.c.spot = spot; H.cd = 1.2;
  }
  // something the game says during the fight (no overlay mid-fight): one bigger callout up the middle
  callout(text) {
    const Hh = this.hud.L.H, W = this.hud.L.W, h = Hh * 0.08;
    const spot = this.hud.space.find(Hh * 0.6, h * 1.3, [{ x: W / 2, y: Hh * 0.72 }, { x: W / 2, y: Hh * 0.6 }]);
    this.big.show('callout', text, spot.x, spot.y, h, null, rnd(-0.08, 0.08)); this.big.spot = spot;
  }
  // a monster winds up / dies: a small dark callout by it
  monster(a, kind) {
    if (this.hud.holdUI?.on || this.monCd > 0) return;
    const set = this.D.monsters[a.type] || this.D.monsters.default, lines = set[kind] || this.D.monsters.default[kind];
    if (!lines) return;
    const g = this.game, b = g.box(a), Hh = this.hud.L.H, h = Hh * 0.04, c = this.mon[this.mi++ % this.mon.length];
    const cx = (b.x0 + b.x1) / 2, top = Hh - b.y0, mid = Hh - (b.y0 + b.y1) / 2;
    const spot = this.hud.space.find(Hh * 0.18, h * 1.3, [{ x: cx, y: top + h }, { x: b.x1 + Hh * 0.1, y: mid }, { x: b.x0 - Hh * 0.1, y: mid }]);
    c.show(kind, pick(lines), spot.x, spot.y, h, '#7a2cff', rnd(-0.1, 0.1)); c.spot = spot;
    this.monCd = 0.9;
  }
  update(dt, time) {
    const g = this.game;
    this.monCd -= dt;
    g.players.forEach((p, i) => {
      const H = this.her[i], L = H.last;
      H.cd -= dt;
      if (H.c.on && H.c.spot) this.hud.space.claim(H.c.spot);
      H.c.update(dt, time);
      if (!(p.slot === 0 || g.p2on()) || !g.combat && p.state !== 'down') { L.state = p.state; return; }
      if (L.hp !== undefined && p.hp < L.hp - 0.5) this.say(p, p.hp < p.maxHp * 0.25 ? 'low' : 'hurt', 0.6);
      if (p.state !== L.state) {
        if (p.state === 'down') this.say(p, 'down');
        if (L.state === 'down') this.say(p, 'revive');
      }
      if (p.activeOn && !L.active) this.say(p, 'skill');
      if (p.charge >= 1 && L.charge < 1 && !p.activeOn) this.say(p, 'ready');
      if (p.fever.full && !L.full) this.say(p, 'fever');
      if (p.kills > (L.kills ?? p.kills)) this.say(p, 'kill', 0.3);
      L.hp = p.hp; L.state = p.state; L.active = p.activeOn; L.charge = p.charge; L.full = p.fever.full; L.kills = p.kills;
    });
    if (g.combo >= 10 && g.combo % 10 === 0 && g.combo !== this.lastCombo) { this.lastCombo = g.combo; this.say(pick(g.players.filter((p) => p.slot === 0 || g.p2on())), 'combo'); }
    for (const a of g.actors) {
      if (!a.def || !a.type) continue;
      const was = this.seen.get(a), now = !a.alive ? 'dead' : a.state;
      if (was !== now) {
        if (now === 'windup') this.monster(a, 'windup');
        else if (now === 'dead' && was) this.monster(a, 'die');
        this.seen.set(a, now);
      }
    }
    for (const c of [...this.mon, this.big]) { if (c.on && c.spot) this.hud.space.claim(c.spot); c.update(dt, time); }
  }
}
