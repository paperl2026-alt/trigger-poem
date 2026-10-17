// In-run HUD facade. The battle HUD itself (both girls' panels, combo / rank, boss bar, reticles, reload pictures, down countdown) is
// drawn with WebGL from the approved mockup (glhud.js, docs/DESIGN.md「UI」战斗 HUD). The DOM keeps the tutorial tip, the stage banner
// and the damage counters (one per enemy, adding up while you keep hitting it).
import { url, meta } from '../core/assets.js';
import { t, tr, lang } from '../core/i18n.js';
import { C, T } from '../core/content.js';
import { FEVER_KEYS } from '../battle/fever.js';
import './hud.css';
import { HudGL } from './glhud.js';

const $ = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
const L3 = (zh, en, ja) => ({ zh, en, ja }[lang] || en);
// Fever names / labels: content text/ui.json; rank letters: tuning/fever.json; shout colours: theme.json

export class Hud {
  constructor(game) {
    this.game = game;
    const root = this.root = document.getElementById('hud');
    root.innerHTML = '';
    // panels, combo, rank, boss bar and reticles are drawn with WebGL from the approved mockup (glhud.js); the DOM keeps the tutorial tip,
    // the stage banner and the damage counters
    this.gl = new HudGL(game);
    this.time = 0;
    this.banner = $('div', 'banner hidden', root);
    this.tip = $('div', 'tip hidden', root);
    this.shouts = $('div', 'shouts', root);
    this.tut = null;
  }
  show(v) { this.root.classList.toggle('hidden', !v); this.gl.show(v); }
  dispose() { this.gl.dispose(); clearTimeout(this.bT); clearTimeout(this.tipT); }
  // the old face moods -> the chibi portrait's reactions
  setFace(slot, f, hold) { this.gl.react(slot, { scared: 'hurt', hurt: 'cry', hype: 'fever', happy: 'idle' }[f] || f, hold || 1.2); }
  // out of the fight: the see-through warning overlay (hold.js); during it: a bubble (no overlay mid-fight)
  showBanner(text, cls = '', dur = 1.4) {
    if (this.gl) { if (this.game.combat) this.gl.stickers.callout(text); else this.gl.hold('info', { text, dur: dur + 0.4 }); return; }
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
  healPop() {}
  boss(name, frac, phase, phases) { this.gl.boss(name, frac, phase, phases); }
  // every hit: one counter per enemy that keeps adding up (screen px, top-left origin), drawn by the GL HUD
  dmg(target, x, y, value, crit, color) { this.gl.dmg(target, x, y, value, crit, color); }
  update(dt) {
    const g = this.game;
    this.time += dt;
    this.gl.update(dt, this.time);
    if (this.tut && !this.tut.skill && g.combat && g.players[0].charge >= 1) this.tutorial('skill');
  }
}
