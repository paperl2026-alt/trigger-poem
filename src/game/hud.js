// In-run HUD: loud, chunky, anime-game style (no tiny labels). Inside the HUD frame.
//   per heroine (top corners): big portrait = skill button with a fat ring gauge, thick HP bar, giant ammo number,
//                              three big Fever bars (力 / 准 / 连) with levels
//   damage numbers: every hit, one counter per enemy that keeps adding up and popping (crits bigger, gold)
//   combo: giant counter on the right that grows and shakes; milestone shouts
//   Fever: level-ups shout across the screen; P1's damage multiplier sits in a big rank badge
//   boss: one fat bar on top. Reticles: one per player (reload ring, slow beam circle + ghost dot).
import { url, meta } from '../engine/assets.js';
import { t, tr, lang, FEVER_LABEL } from './i18n.js';
import { FEVER_KEYS } from './fever.js';

const $ = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
const L3 = (zh, en, ja) => ({ zh, en, ja }[lang] || en);
const FEVER_NAME = { dmg: () => L3('伤害', 'POWER', '威力'), acc: () => L3('准头', 'AIM', '精度'), combo: () => L3('连击', 'CHAIN', '連撃') };
const RANKS = ['C', 'C', 'B', 'B', 'A', 'A', 'S', 'S', 'S', '极'];

class Panel {
  constructor(root, p) {
    this.p = p;
    const el = this.el = $('div', `deck ${p.slot ? 'p2' : 'p1'}`, root);
    el.style.setProperty('--pc', p.c.color);
    // portrait = skill button
    const sk = this.sk = $('div', 'skbtn', el);
    this.ring = $('div', 'ring', sk);
    const face = this.faceEl = $('div', 'face', sk);
    this.bust = $('img', '', face);
    this.key = $('div', 'key', sk);
    this.ready = $('div', 'ready', sk);
    this.ready.textContent = L3('必杀OK!', 'SKILL!', '必殺OK!');
    this.badge = $('div', 'who', sk);
    const col = $('div', 'col', el);
    const nm = $('div', 'name', col);
    $('b', '', nm).textContent = tr(p.c.name);
    $('i', '', nm).textContent = `Lv${p.lv}`;
    // HP
    const hp = this.hpEl = $('div', 'hp', col);
    const heart = $('img', 'heart', hp); heart.src = url('hud/heart');
    const bar = $('div', 'bar', hp);
    this.hpLag = $('i', 'lag', bar); this.hpFill = $('i', 'fill', bar);
    this.hpN = $('b', 'n', hp);
    // ammo + fever
    const row = $('div', 'row2', col);
    const am = this.ammo = $('div', 'ammo', row);
    this.ammoN = $('b', '', am); this.ammoMax = $('span', '', am);
    this.ammoMax.textContent = `/${p.w.mag}`;
    this.reload = $('div', 'reload', am); this.reload.textContent = L3('装填!', 'RELOAD!', 'リロード!');
    const fv = this.fever = $('div', 'fever', row);
    this.fv = {};
    for (const k of FEVER_KEYS) {
      const b = $('div', `fb k-${k}`, fv);
      $('b', 'kj', b).textContent = tr(FEVER_LABEL[k]);
      const track = $('div', 'tr', b);
      const fill = $('i', '', track);
      const lv = $('em', '', b);
      this.fv[k] = { b, fill, lvEl: lv, lv: -1 };
    }
    this.join = $('div', 'join hidden', el);
    this.join.innerHTML = '<span class="pad">🎮</span><span>START!</span>';
    this.face = ''; this.faceT = 0; this.last = {}; this.lag = p.hp;
    this.setFace('happy');
  }
  setFace(f, hold = 0) {
    if (hold) this.faceT = hold;
    if (this.face === f) return;
    this.face = f;
    const k = this.p.c.cam[f];
    this.bust.src = url(k && meta[k] ? k : this.p.c.cam.happy);
    this.faceEl.classList.remove('jolt'); void this.faceEl.offsetWidth; this.faceEl.classList.add('jolt');
  }
  update(dt, g) {
    const p = this.p, L = this.last;
    const hp = Math.round(p.hp);
    if (hp !== L.hp) {
      if (L.hp !== undefined && hp < L.hp) { this.hpEl.classList.remove('hit'); void this.hpEl.offsetWidth; this.hpEl.classList.add('hit'); }
      L.hp = hp;
      this.hpFill.style.transform = `scaleX(${Math.max(0, p.hp / p.maxHp)})`;
      this.hpN.textContent = hp;
      this.hpEl.classList.toggle('low', p.hp <= p.maxHp * 0.3);
    }
    this.lag += (p.hp - this.lag) * Math.min(1, dt * 2.5);
    this.hpLag.style.transform = `scaleX(${Math.max(0, this.lag / p.maxHp)})`;
    const inf = p.gatling || p.beaming;
    const a = inf ? '∞' : `${p.ammo}`;
    if (a !== L.ammo) {
      L.ammo = a;
      this.ammoN.textContent = a;
      this.ammo.classList.remove('pop'); void this.ammo.offsetWidth; this.ammo.classList.add('pop');
    }
    this.ammo.classList.toggle('inf', inf);
    this.ammo.classList.toggle('low', !inf && p.ammo <= Math.max(1, p.w.mag * 0.2));
    this.ammo.classList.toggle('reloading', p.state === 'reload');
    // skill
    const m = p.activeOn ? p.activeT / p.a.dur : p.charge;
    this.ring.style.setProperty('--m', m.toFixed(3));
    this.sk.classList.toggle('on', p.activeOn);
    this.sk.classList.toggle('full', p.charge >= 1 && !p.activeOn);
    const k = p.ctrl?.kind;
    this.key.textContent = k === 'pad' ? 'Y' : k === 'keys' ? '⌫' : k === 'ai' ? 'AI' : L3('右键', 'R-CLICK', '右クリック');
    this.badge.textContent = p.slot ? '2P' : '1P';
    // fever
    for (const key of FEVER_KEYS) {
      const f = this.fv[key], lv = p.fever.level(key), v = p.fever.v[key];
      if (lv !== f.lv) {
        if (lv > f.lv && f.lv >= 0) { f.b.classList.remove('up'); void f.b.offsetWidth; f.b.classList.add('up'); }
        f.lv = lv;
        f.lvEl.textContent = lv >= 3 ? 'MAX' : `Lv${lv}`;
        f.b.classList.toggle('max', lv >= 3);
        f.b.dataset.lv = lv;
      }
      f.fill.style.transform = `scaleX(${lv >= 3 ? 1 : v - lv})`;
    }
    this.fever.classList.toggle('full', p.fever.full);
    this.join.classList.toggle('hidden', !(k === 'ai' && g.G.padCount > 0));
    this.el.classList.toggle('down', p.state === 'down');
    if (this.faceT > 0) this.faceT -= dt;
    else this.setFace(p.state === 'down' || p.hp <= 20 ? 'hurt' : p.activeOn || p.fever.full ? 'hype' : 'happy');
  }
}

export class Hud {
  constructor(game) {
    this.game = game;
    const root = this.root = document.getElementById('hud');
    root.innerHTML = '';
    this.panels = game.players.map((p) => new Panel(root, p));
    const bb = this.bossBar = $('div', 'bossbar hidden', root);
    this.bossName = $('div', 'name', bb);
    const bbar = $('div', 'bar', bb);
    this.bossLag = $('i', 'lag', bbar); this.bossFill = $('i', 'fill', bbar);
    this.bossPct = $('b', 'pct', bb);
    this.bossFrac = 1; this.bossLagV = 1;
    this.banner = $('div', 'banner hidden', root);
    this.tip = $('div', 'tip hidden', root);
    // combo + rank badge
    const cb = this.comboEl = $('div', 'combo hidden', root);
    this.comboN = $('b', '', cb);
    $('span', '', cb).textContent = L3('连击!', 'COMBO!', 'コンボ!');
    this.comboShout = $('div', 'cshout', cb);
    this.lastCombo = 0;
    const rk = this.rank = $('div', 'rank', root);
    this.rankC = $('b', '', rk); this.rankM = $('span', '', rk);
    this.lastRank = '';
    this.shouts = $('div', 'shouts', root);
    this.nums = $('div', 'nums', document.body);
    this.dmgs = new Map();
    this.reticles = game.players.map((p) => {
      const r = $('div', `reticle ${p.slot ? 'r2' : 'r1'}`, document.body);
      r.style.setProperty('--pc', p.c.color);
      $('div', 'rl', r); $('div', 'beamc', r);
      const ghost = $('div', 'ghost', document.body);
      ghost.style.setProperty('--pc', p.c.color);
      r.ghost = ghost;
      return r;
    });
    this.tut = null;
  }
  show(v) { this.root.classList.toggle('hidden', !v); this.reticles.forEach((r) => { r.classList.toggle('hidden', !v); r.ghost.classList.add('hidden'); }); }
  dispose() { this.reticles.forEach((r) => { r.ghost.remove(); r.remove(); }); this.nums.remove(); clearTimeout(this.bT); clearTimeout(this.tipT); }
  setFace(slot, f, hold) { this.panels[slot]?.setFace(f, hold); }
  showBanner(text, cls = '', dur = 1.4) {
    const b = this.banner;
    b.textContent = text;
    b.className = `banner ${cls}`;
    void b.offsetWidth; b.classList.add('show');
    clearTimeout(this.bT);
    this.bT = setTimeout(() => b.classList.add('hidden'), dur * 1000);
  }
  // a loud line that flies across the screen (Fever level-ups, combo milestones)
  shout(text, color = '#ffd23a', y = 30) {
    const s = $('div', 'shout', this.shouts);
    s.textContent = text;
    s.style.setProperty('--c', color);
    s.style.top = `${y}%`;
    setTimeout(() => s.remove(), 1300);
  }
  tutorial(kind) {
    this.tut = this.tut || { fire: false, skill: false };
    if (this.tut[kind]) return;
    this.tut[kind] = true;
    const pad = this.game.players[0].ctrl?.kind === 'pad';
    const tip = this.tip;
    tip.className = `tip ${kind}`;
    if (pad) tip.innerHTML = `<div class="padic">🎮</div><div class="tl"><b>${t('hintPad')}</b><small>${t('hintFever')}</small></div>`;
    else if (kind === 'fire') tip.innerHTML = `<div class="mouse l"><i></i><i></i></div><div class="tl"><b>${t('hintFire')}</b><span>${t('hintHide')}</span><small>${t('hintFever')}</small></div>`;
    else tip.innerHTML = `<div class="mouse r"><i></i><i></i></div><div class="tl"><b>${t('hintSkill')}</b></div>`;
    clearTimeout(this.tipT);
    this.tipT = setTimeout(() => tip.classList.add('hidden'), kind === 'fire' ? 7000 : 5000);
  }
  healPop(slot, n) {
    const pan = this.panels[slot];
    if (!pan) return;
    const d = $('div', 'heal', pan.el);
    d.textContent = `+${Math.round(n)}`;
    setTimeout(() => d.remove(), 900);
  }
  boss(name, frac) {
    if (name === null) { this.bossBar.classList.add('hidden'); return; }
    this.bossBar.classList.remove('hidden');
    if (this.bossName.textContent !== name) this.bossName.textContent = name;
    if (frac < this.bossFrac - 1e-4) { this.bossBar.classList.remove('hit'); void this.bossBar.offsetWidth; this.bossBar.classList.add('hit'); }
    this.bossFrac = Math.max(0, frac);
    this.bossFill.style.transform = `scaleX(${this.bossFrac})`;
    this.bossPct.textContent = `${Math.ceil(this.bossFrac * 100)}%`;
  }
  // every hit: one counter per enemy that keeps adding up while you keep hitting it (screen px, top-left origin)
  dmg(target, x, y, value, crit, color) {
    let d = this.dmgs.get(target);
    if (!d || d.dead) {
      if (this.nums.childElementCount > 30) { const old = this.nums.firstChild; this.dmgs.forEach((v, k) => { if (v.el === old) this.dmgs.delete(k); }); old.remove(); }
      const el = $('div', 'dn', this.nums);
      d = { el, sum: 0, t: 0, x, y, dead: false };
      this.dmgs.set(target, d);
    }
    d.sum += value; d.t = 0.75; d.x = x; d.y = y;
    d.el.textContent = Math.round(d.sum);
    d.el.style.setProperty('--c', color);
    d.el.classList.toggle('crit', crit || d.el.classList.contains('crit'));
    d.el.style.fontSize = `calc(${Math.min(9, 3.6 + Math.log10(1 + d.sum) * 1.4)} * min(1vh, 0.5625vw))`;
    d.el.classList.remove('pop'); void d.el.offsetWidth; d.el.classList.add('pop');
    if (crit) { const c = $('i', 'ct', d.el); c.textContent = L3('暴击!', 'CRIT!', 'クリティカル!'); }
  }
  update(dt) {
    const g = this.game;
    this.panels.forEach((p) => p.update(dt, g));
    if (this.tut && !this.tut.skill && g.combat && g.players[0].charge >= 1) this.tutorial('skill');
    // damage counters drift up and fade after the last hit
    this.dmgs.forEach((d, k) => {
      d.t -= dt;
      d.el.style.transform = `translate(${d.x}px, ${d.y - (0.75 - Math.max(0, d.t)) * 30}px) translate(-50%, -100%)`;
      if (d.t <= 0 && !d.dead) { d.dead = true; d.el.classList.add('out'); setTimeout(() => d.el.remove(), 350); this.dmgs.delete(k); }
    });
    // combo
    const c = g.combo;
    if (c !== this.lastCombo) {
      if (c >= 3) {
        this.comboEl.classList.remove('hidden', 'pop'); void this.comboEl.offsetWidth; this.comboEl.classList.add('pop');
        this.comboN.textContent = c;
        this.comboEl.style.setProperty('--s', Math.min(1.6, 1 + c / 60));
        this.comboEl.dataset.tier = c >= 50 ? 3 : c >= 25 ? 2 : c >= 10 ? 1 : 0;
        if (c === 10 || c === 25 || c === 50 || c === 100) this.shout(c >= 50 ? L3('无双!!', 'UNSTOPPABLE!!', '無双!!') : c >= 25 ? L3('超神!', 'GODLIKE!', '神!') : L3('好耶!', 'NICE!', 'ナイス!'), '#ff4fd8', 46);
      } else if (c === 0) this.comboEl.classList.add('hidden');
      this.lastCombo = c;
    }
    // Fever level-up shouts + P1's damage rank badge
    for (const p of g.players) {
      while (p.fever.ups.length) {
        const k = p.fever.ups.shift(), lv = p.fever.level(k);
        this.shout(`${FEVER_NAME[k]()} FEVER ${lv >= 3 ? 'MAX' : `Lv${lv}`}!!`, { dmg: '#ff5a4a', acc: '#4ad8ff', combo: '#ffd23a' }[k], p.slot ? 26 : 20);
      }
    }
    const p1 = g.players[0], lvSum = FEVER_KEYS.reduce((a, k) => a + p1.fever.level(k), 0);
    const r = RANKS[lvSum];
    if (r !== this.lastRank) { this.lastRank = r; this.rankC.textContent = r; this.rank.dataset.r = r; this.rank.classList.remove('pop'); void this.rank.offsetWidth; this.rank.classList.add('pop'); }
    this.rankM.textContent = `${L3('伤害', 'DMG', '与ダメ')}×${p1.fever.dmgMul.toFixed(2)}`;
    this.rank.classList.toggle('hidden', !g.combat && !this.game.boss);
    // reticles
    g.players.forEach((p, i) => {
      const rt = this.reticles[i], ct = p.ctrl;
      const vis = g.combat && ct && ct.active && p.alive;
      rt.classList.toggle('hidden', !vis);
      rt.ghost.classList.toggle('hidden', !(vis && p.beaming));
      if (!vis) return;
      rt.style.transform = `translate(${p.aimX}px, ${p.aimY}px)`;
      if (p.beaming) rt.ghost.style.transform = `translate(${ct.x}px, ${ct.y}px)`;
      rt.classList.toggle('hot', p.exposed);
      rt.classList.toggle('ai', ct.kind === 'ai');
      rt.classList.toggle('beam', p.beaming);
      rt.classList.toggle('gat', p.gatling);
      rt.style.setProperty('--rl', p.state === 'reload' ? 1 - p.reloadT / (p.reloadT0 || 1) : 0);
      rt.classList.toggle('reloading', p.state === 'reload');
    });
  }
}
