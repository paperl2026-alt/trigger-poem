// Speech-bubble stickers (docs/DESIGN.md「拟声词 / 卖萌贴纸」): what is going on in the fight pops out as stickers. Each heroine's pop up by
// her own screen edge (one at a time, quickly replaced by the next), a monster's above the monster. Lines: content text/stickers.json;
// bubbles: ui/bub_<cute|shout|monster>_<0..5> (art R36, empty; the words are set by the game). The state is watched here, so the game
// only has to call hit() / crit() for things it cannot see from outside.
import * as THREE from 'three';
import { tex } from '../core/assets.js';
import { C } from '../core/content.js';
import { tr, lang } from '../core/i18n.js';
import { Text, picture } from './glhud.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
// how much a kind of moment matters (a more important one replaces a showing sticker at once)
const PRIO = { coverBroken: 7, stagger: 6, join: 5, down: 9, skill: 8, low: 7, hurt: 6, fever: 6, ready: 5, empty: 5, crit: 4, combo: 4, kill: 3, revive: 6, reload: 2, hit: 1, cover: 1 };

class Sticker {
  constructor(layer, order) {
    this.bub = picture(null, order, Math.random());
    this.txt = new Text(order + 0.5, { color: '#121012', stroke: '#ffffff', sw: 0.1, italic: true });
    layer.add(this.bub, this.txt.m);
    this.t = 9; this.life = 1; this.bub.visible = this.txt.m.visible = false;
  }
  show(kind, bubbleKey, text, x, y, size, color, dir) {
    const B = tex[bubbleKey];
    this.bub.material.uniforms.map.value = B || null;
    this.ar = B ? B.image.height / B.image.width : 0.7;
    this.kind = kind; this.text = text; this.x = x; this.y = y; this.size = size; this.color = color; this.dir = dir;
    // light bubbles (cute): her colour with a white edge; dark ones (shout, monster): white with a dark edge
    const dark = !/bub_cute/.test(bubbleKey);
    this.txt.st.stroke = dark ? '#121012' : '#ffffff'; this.txt.st.shadow = dark ? '#d8141e' : null; this.txt.str = null;
    this.t = 0; this.life = 0.95 + text.length * 0.035; this.rot = rnd(-0.18, 0.18); this.done = false;
  }
  out() { if (this.t < this.life - 0.12) this.t = this.life - 0.12; }   // replaced: a quick pop-out
  update(dt, time) {
    this.t += dt;
    const on = this.t < this.life;
    this.bub.visible = on && !!this.bub.material.uniforms.map.value; this.txt.m.visible = on;
    if (!on) return false;
    const t = this.t, inK = Math.min(1, t / 0.14), outK = Math.max(0, (t - (this.life - 0.12)) / 0.12);
    const pop = inK < 1 ? 0.4 + 0.75 * Math.sin(inK * Math.PI * 0.62) / Math.sin(Math.PI * 0.62) : 1 + 0.04 * Math.sin(time * 14);
    const s = this.size * pop * (1 - outK * 0.7);
    const wob = Math.sin(time * 9 + this.rot * 20) * 0.04;
    this.bub.position.set(this.x, this.y + outK * this.size * 0.3 * this.dir.y, 0);
    this.bub.scale.set(s * this.dir.flip, s * this.ar, 1); this.bub.rotation.z = this.rot + wob;
    const U = this.bub.material.uniforms; U.a.value = 1 - outK; U.time.value = time; U.boil.value = 0.6;
    this.txt.set(this.text, s * this.ar * 0.26, this.color, s * 0.72);
    this.txt.at(this.x, this.y + outK * this.size * 0.3 * this.dir.y, (this.rot + wob) * 57, 1);
    this.txt.m.material.uniforms.a.value = 1 - outK;
    return true;
  }
}

export class Stickers {
  constructor(hud) {
    this.hud = hud; this.game = hud.game;
    this.layer = new THREE.Group(); hud.g.add(this.layer);
    this.her = this.game.players.map(() => ({ s: new Sticker(this.layer, 75), cd: 0, last: {} }));
    this.mon = [0, 1, 2, 3].map(() => new Sticker(this.layer, 74));
    this.mi = 0; this.seen = new Map(); this.monCd = 0;
  }
  get D() { return C.text.stickers; }
  // the game tells what it cannot be seen from outside
  hit(p, crit) { this.say(p, crit ? 'crit' : 'hit', crit ? 1 : 0.22); }
  kill(p) { this.say(p, 'kill', 0.6); }
  // a heroine says something about `kind` (chance 0..1), unless something as important is already showing
  say(p, kind, chance = 1) {
    if (!p || Math.random() > chance) return;
    const H = this.her[p.slot], set = this.D.heroines[p.id]?.[kind];
    if (!H || !set) return;
    const pr = PRIO[kind] || 1, cur = H.s.t < H.s.life ? PRIO[H.s.kind] || 1 : -1;
    if (H.cd > 0 && pr <= cur) return;
    const L = this.hud.L, f = L.f, Hh = L.H;
    const line = pick(set.lines), text = (line[lang] || line.en);
    if (text === H.lastText && set.lines.length > 1) return this.say(p, kind, 1);
    H.lastText = text;
    // a free place by her (never over the HUD or either girl, src/ui/space.js): beside her head toward the middle like a speech bubble,
    // then by her screen edge below her panel, then above her head
    const left = p.slot === 0, s = left ? 1 : -1, fig = this.hud.space.girl(p.slot), n = Math.floor(Math.random() * 6);
    const bw = Hh * (kind === 'hit' ? 0.2 : 0.26), bh = bw * 0.62;
    const fx0 = fig ? fig.x0 : p.baseX - Hh * 0.15, fx1 = fig ? fig.x1 : p.baseX + Hh * 0.15, top = fig ? fig.y1 : Hh * 0.55;
    const inner = left ? fx1 : fx0, outer = left ? fx0 : fx1;
    const spot = this.hud.space.find(bw, bh, [
      { x: inner + s * (bw / 2 + Hh * 0.01), y: top - bh * 0.3 }, { x: inner + s * (bw / 2 + Hh * 0.01), y: top - bh * 1.4 },
      { x: (left ? f.x : f.x + f.w) + s * (bw / 2 + Hh * 0.01), y: top - bh * 0.6 }, { x: outer - s * (bw / 2), y: top + bh * 0.7 },
      { x: (fx0 + fx1) / 2, y: top + bh * 0.7 }, { x: inner + s * (bw / 2 + Hh * 0.01), y: top - bh * 2.5 },
    ]);
    const x = spot.x, y = spot.y;
    if (H.s.t < H.s.life) H.s.out();
    const s2 = H.s; H.s = H.next || new Sticker(this.layer, 75); H.next = s2;   // the old one pops out while the new one pops in
    H.s.show(kind, `ui/bub_${set.bubble}_${n}`, text, x, y, bw, set.bubble === 'cute' ? p.c.color : '#ffffff',
      { flip: x > (fx0 + fx1) / 2 ? 1 : -1, y: 1 });
    H.s.spot = spot;
    if (set.bubble === 'cute' && p.id !== 'pink') { const h = {}; new THREE.Color(p.c.color).getHSL(h); H.s.bub.material.uniforms.recol.value = 1; H.s.bub.material.uniforms.hueTo.value = h.h; }
    else H.s.bub.material.uniforms.recol.value = 0;
    H.cd = 0.45;
  }
  // something the game says during the fight (no overlay mid-fight: it would break the rhythm): a loud bubble in free space up top
  callout(text) {
    const Hh = this.hud.L.H, W = this.hud.L.W, bw = Hh * 0.3, bh = bw * 0.62, st = this.mon[this.mi++ % this.mon.length];
    const spot = this.hud.space.find(bw, bh, [{ x: W / 2, y: Hh * 0.62 }, { x: W / 2, y: Hh * 0.5 }, { x: W * 0.38, y: Hh * 0.55 }, { x: W * 0.62, y: Hh * 0.55 }]);
    st.show('callout', `ui/bub_shout_${Math.floor(Math.random() * 6)}`, text, spot.x, spot.y, bw, '#ffffff', { flip: 1, y: 1 });
    st.spot = spot;
  }
  // a monster makes a sound (windup / attack / hurt / die) above itself
  monster(a, kind) {
    if (this.hud.holdUI?.on) return;   // the hold overlay is talking
    if (this.monCd > 0 && kind !== 'windup' && kind !== 'die') return;
    const set = this.D.monsters[a.type] || this.D.monsters.default, lines = set[kind] || this.D.monsters.default[kind];
    if (!lines) return;
    const g = this.game, b = g.box(a), Hh = this.hud.L.H, bw = Hh * 0.2, bh = bw * 0.62;
    const st = this.mon[this.mi++ % this.mon.length];
    // around the monster (screen box: y down), in free space
    const cx = (b.x0 + b.x1) / 2, top = Hh - b.y0, mid = Hh - (b.y0 + b.y1) / 2;
    const spot = this.hud.space.find(bw, bh, [{ x: cx, y: top + bh * 0.6 }, { x: b.x1 + bw * 0.55, y: mid }, { x: b.x0 - bw * 0.55, y: mid }, { x: cx, y: top + bh * 1.8 }]);
    st.show(kind, `ui/bub_monster_${Math.floor(Math.random() * 6)}`, pick(lines), spot.x, spot.y, bw, '#ffffff', { flip: spot.x > cx ? -1 : 1, y: 1 });
    st.spot = spot;
    this.monCd = 0.5;
  }
  update(dt, time) {
    const g = this.game;
    this.monCd -= dt;
    g.players.forEach((p, i) => {
      const H = this.her[i], L = H.last;
      H.cd -= dt;
      if (H.s.t < H.s.life && H.s.spot) this.hud.space.claim(H.s.spot);
      H.s.update(dt, time); if (H.next) H.next.update(dt, time);
      if (!(p.slot === 0 || g.p2on()) || !g.combat && p.state !== 'down') { L.state = p.state; return; }
      // what changed since the last frame
      if (L.hp !== undefined && p.hp < L.hp - 0.5) this.say(p, p.hp < p.maxHp * 0.25 ? 'low' : 'hurt', 0.8);
      if (p.state !== L.state) {
        if (p.state === 'reload') this.say(p, 'reload', 0.7);
        if (p.state === 'down') this.say(p, 'down');
        if (L.state === 'down') this.say(p, 'revive');
      }
      if (L.ammo > 0 && p.ammo <= 0 && !p.gatling) this.say(p, 'empty');
      if (p.activeOn && !L.active) this.say(p, 'skill');
      if (p.charge >= 1 && L.charge < 1 && !p.activeOn) this.say(p, 'ready');
      if (p.fever.full && !L.full) this.say(p, 'fever');
      if (p.kills > (L.kills ?? p.kills)) this.say(p, 'kill', 0.55);
      L.hp = p.hp; L.state = p.state; L.ammo = p.ammo; L.active = p.activeOn; L.charge = p.charge; L.full = p.fever.full; L.kills = p.kills;
    });
    if (g.combo >= 10 && g.combo % 10 === 0 && g.combo !== this.lastCombo) { this.lastCombo = g.combo; this.say(pick(g.players.filter((p) => p.slot === 0 || g.p2on())), 'combo'); }
    // monsters: winding up, dying
    for (const a of g.actors) {
      if (!a.def || !a.type) continue;
      const was = this.seen.get(a);
      const now = !a.alive ? 'dead' : a.state;
      if (was !== now) {
        if (now === 'windup') this.monster(a, 'windup');
        else if (now === 'dead' && was) this.monster(a, 'die');
        this.seen.set(a, now);
      }
    }
    for (const st of this.mon) { if (st.t < st.life && st.spot) this.hud.space.claim(st.spot); st.update(dt, time); }
  }
}
