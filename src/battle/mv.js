// The MV director (docs/DESIGN.md「停留点不只是一个镜头、一种打法」 MV 导演; the user 2026-10-20: KAngel's MVs - INTERNET OVERDOSE / YAMERO -
// their pile of effects and their "toxic radio wave" feel, arranged and used, not a bit of shake and a few scanlines now and then):
// the picture keeps time with the music (src/core/audio.js musicBeat): every beat a small pulse (colour, a kick of the colour split,
// the foreground glitter), every bar a stronger one; and a kit of MV pieces drawn over the game (the overlay, pixel space), called by the
// game at its moments:
//   wall(text)    one word repeated row after row till it fills the screen, every row its own colour, scrolling (the MVs' "アアアア")
//   slam(text)    a huge chrome-and-candy title smashing into the middle, its shadow copies behind it
//   popups(lines) a cascade of fake system windows, one on top of the other (YAMERO's popup waterfall)
//   label(text)   a red label bar with white letters racing across ("ネットをやめろ")
//   tunnel(dur)   hearts rushing out of the middle at the camera (the heart tunnel)
//   phone(l, r)   the picture squeezed into an upright phone in the middle, huge words down both sides
// Moments (Game): Fever full -> overdrive (stronger beats, the word wall, the tunnel); a stage starting -> its name slammed in; a boss
// changing -> her name in a wall and a slam; low HP -> toxic waves (popups of errors, glitches, the colours bleeding); combo milestones.
import * as THREE from 'three';
import { T } from '../core/content.js';
import { tr, t as ui } from '../core/i18n.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const say = (s) => (s && typeof s === 'object' && !Array.isArray(s) ? tr(s) : s);   // (a text: plain, or { zh, en, ja })
const PAL = ['#ff3a8a', '#ffd23a', '#3ad8ff', '#b04dff', '#7aff6a', '#ffffff', '#ff7a2a'];
const FONT = '"Dela Gothic One", "Noto Sans SC", "Microsoft YaHei", sans-serif';   // (src/fonts: Dela Gothic One is in the build)

function canvasQuad(w, h, draw) {
  const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h));
  draw(c.getContext('2d'), c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
  m.renderOrder = 66; m.frustumCulled = false; return m;
}

export class MV {
  constructor(game) { this.g = game; this.items = []; this.beatI = -1; this.over = 0; this.toxic = 0; this.toxicT = 0; }
  get root() { return this.g.overlay; }
  add(m, life, upd) { this.root.add(m); this.items.push({ m, t: 0, life, upd }); return m; }

  // ---- every frame: the beat, the moods (overdrive, toxic), the pieces on screen
  update(dt, t, beat) {
    const g = this.g, post = g.post;
    if (beat) {
      const i = Math.floor(beat.beats);
      if (i !== this.beatI) {
        this.beatI = i; const bar = i % 4 === 0, k = (bar ? 1 : 0.5) * (0.3 + this.over * 0.9) * (g.shot?.mv ?? 1);
        post.kick(0.35 * k + this.toxic * 0.4); if (bar && this.over > 0.5) post.flash(0.08, 0xff5ab0);
        if (g.combat && (bar || this.over > 0.5)) this.sparkle(bar ? 6 : 3);
        // (no word walls on the beat while they fight: the walls are for the moments nobody plays - a close look, a cinematic stop)
        if (this.over > 0.5 && bar && !g.combat) this.wall(this.overWord, 0.45, true);
      }
    }
    // toxic radio waves while a girl is nearly down: the colours bleed, now and then a glitch and an error window
    const low = g.players.some((p) => p.state !== 'away' && p.state !== 'down' && p.hp > 0 && p.hp < p.maxHp * (T.combat.mv?.lowHp ?? 0.25));
    this.toxic += ((low && g.combat ? 1 : 0) - this.toxic) * Math.min(1, dt * 1.5);
    if (this.toxic > 0.5 && (this.toxicT -= dt) <= 0) {
      this.toxicT = rnd(2.5, 5); post.styleBurst(0.3, [3, 4], 0.1, 0x200018, 0xff2a6a);
      const W = ui('mvToxic'); if (Math.random() < 0.6 && Array.isArray(W)) this.popups(W, 3, 0.9);
    }
    this.over = Math.max(0, this.over - dt * (this.overHold > 0 ? 0 : 0.6)); this.overHold = (this.overHold || 0) - dt;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i]; it.t += dt;
      const k = it.t / it.life;
      if (k >= 1) { this.drop(it.m); this.items.splice(i, 1); continue; }
      it.upd?.(k, dt, it);
    }
  }
  drop(m) { m.parent?.remove(m); m.traverse((o) => { o.material?.map?.dispose(); o.material?.dispose(); o.geometry?.dispose(); }); }
  clear() { for (const it of this.items) this.drop(it.m); this.items = []; this.over = 0; this.toxic = 0; }

  // a cue's mv (cues.js): { wall, slam, sub, popups: [...], label, tunnel: seconds | true, phone: [left, right], overdrive, life }
  play(o) {
    if (!o) return;
    if (o.overdrive) this.overdrive(say(o.overdrive), o.hold);
    if (o.wall) this.wall(say(o.wall), o.life ?? 0.9);
    if (o.slam) this.slam(say(o.slam), say(o.sub) || '', o.life ?? 1.4);
    if (o.popups) this.popups(o.popups.map(say), o.n ?? o.popups.length, o.life ?? 1.6);
    if (o.label) this.label(say(o.label), o.life ?? 1.6);
    if (o.tunnel) this.tunnel(o.tunnel === true ? 1 : o.tunnel);
    if (o.phone) this.phone(say(o.phone[0]), say(o.phone[1]), o.life ?? 2.4);
  }
  // ---- moods
  // (in a fight: one faint hollow wall for a moment and the label - what she shoots at must stay in sight; user 2026-10-20)
  overdrive(word, s = 6) { this.over = 1; this.overHold = s; this.overWord = word; this.tunnel(0.9); if (this.g.combat) this.wall(word, 0.6, true, 0.18, true); else this.wall(word, 0.8, true); this.label(word); }

  // ---- the pieces
  sparkle(n) {
    const g = this.g; for (let i = 0; i < n; i++) g.fx.oAdd?.emit({ x: rnd(0, g.W), y: rnd(0, g.H), vx: rnd(-20, 20), vy: rnd(20, 80), life: rnd(0.3, 0.6), size: g.H * rnd(0.008, 0.02), size1: 0, color: [1, rnd(0.5, 1), rnd(0.7, 1)], a: 1, a1: 0, frame: 10 });
  }
  // (alpha: how strong; hollow: outlines only - in a fight)
  wall(text, life = 0.7, flash = false, alpha = null, hollow = false) {
    if (!text) return;
    const g = this.g, W = g.W, H = g.H, rows = 7, rh = H / rows;
    const grp = new THREE.Group();
    for (let r = 0; r < rows; r++) {
      const col = PAL[(r + Math.floor(Math.random() * 7)) % PAL.length], s = `${text} `.repeat(Math.ceil(W / (rh * 0.9 * Math.max(1, text.length))) + 2);
      const m = canvasQuad(W * 1.6, rh, (x, w, h) => { x.font = `900 ${Math.round(h * 0.86)}px ${FONT}`; x.textBaseline = 'middle'; x.fillStyle = col; x.strokeStyle = hollow ? col : '#1a0010'; x.lineWidth = h * (hollow ? 0.035 : 0.06); x.strokeText(s, 0, h * 0.54); if (!hollow) x.fillText(s, 0, h * 0.54); });
      m.position.set(W / 2 + (r % 2 ? -1 : 1) * W * 0.1, H - rh * (r + 0.5), 0); m.userData.dir = r % 2 ? 1 : -1; grp.add(m);
    }
    this.add(grp, life, (k, dt) => { for (const m of grp.children) { m.position.x += m.userData.dir * W * 0.6 * dt; m.material.opacity = (alpha ?? (flash ? 0.55 : 0.85)) * (k < 0.15 ? k / 0.15 : k > 0.7 ? (1 - k) / 0.3 : 1); } });
  }
  slam(text, sub = '', life = 1.4) {
    if (!text) return;
    const g = this.g, W = g.W, H = g.H, h = H * 0.22;
    const make = (fill, stroke) => canvasQuad(W * 0.9, h * 1.3, (x, w, hh) => {
      x.font = `900 ${Math.round(hh * 0.62)}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
      const gr = x.createLinearGradient(0, hh * 0.2, 0, hh * 0.8); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, fill); gr.addColorStop(0.55, '#ff3a8a'); gr.addColorStop(1, '#ffd23a');
      x.lineWidth = hh * 0.09; x.strokeStyle = stroke; x.strokeText(text, w / 2, hh * 0.46); x.fillStyle = gr; x.fillText(text, w / 2, hh * 0.46);
      if (sub) { x.font = `700 ${Math.round(hh * 0.16)}px ${FONT}`; x.fillStyle = '#fff'; x.fillText(sub, w / 2, hh * 0.88); }
    });
    const grp = new THREE.Group(), back = [0, 1, 2].map((i) => { const m = make(PAL[i + 1], '#1a0010'); m.material.opacity = 0.35; grp.add(m); return m; }), front = make('#c8f4ff', '#1a0010'); grp.add(front);
    grp.position.set(W / 2, H * 0.56, 0); this.g.post.shake(0.8);
    this.add(grp, life, (k) => {
      const s = k < 0.12 ? 2.4 - 1.4 * (k / 0.12) : 1 + Math.sin(k * 30) * 0.01; grp.scale.setScalar(s);
      back.forEach((m, i) => { m.position.set((i - 1) * W * 0.012 * Math.sin(k * 40), (i - 1) * H * 0.01, 0); });
      for (const m of grp.children) m.material.opacity = (m === front ? 1 : 0.35) * (k > 0.75 ? (1 - k) / 0.25 : 1);
    });
  }
  popups(lines, n = 5, life = 1.6) {
    const g = this.g, W = g.W, H = g.H, pw = H * 0.42, ph = H * 0.16;
    for (let i = 0; i < n; i++) {
      const text = lines[i % lines.length];
      const m = canvasQuad(pw, ph, (x, w, h) => {
        x.fillStyle = '#f4f0f8'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff5aa8'; x.fillRect(0, 0, w, h * 0.24);
        x.strokeStyle = '#1a0010'; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4);
        x.fillStyle = '#fff'; x.font = `700 ${Math.round(h * 0.16)}px ${FONT}`; x.textBaseline = 'middle'; x.fillText('♥ message', h * 0.12, h * 0.12); x.fillText('×', w - h * 0.22, h * 0.12);
        x.fillStyle = '#1a0010'; x.font = `900 ${Math.round(h * 0.3)}px ${FONT}`; x.fillText(text, h * 0.18, h * 0.6);
      });
      const x0 = W * 0.25 + i * W * 0.06 + rnd(-20, 20), y0 = H * 0.7 - i * H * 0.07;
      m.position.set(x0, y0, 0); m.scale.setScalar(0.01);
      this.add(m, life + i * 0.08, (k, dt, it) => { const kk = Math.min(1, it.t / 0.08); m.scale.setScalar(it.t < i * 0.08 ? 0.01 : kk); m.material.opacity = k > 0.8 ? (1 - k) / 0.2 : 1; });
    }
  }
  label(text, life = 1.1) {
    if (!text) return;
    const g = this.g, W = g.W, H = g.H, h = H * 0.045;   // (a thin band: brief, never a wall over the fight)
    const m = canvasQuad(W * 0.8, h, (x, w, hh) => { x.fillStyle = '#e8102a'; x.fillRect(0, 0, w, hh); x.fillStyle = '#fff'; x.font = `900 ${Math.round(hh * 0.7)}px ${FONT}`; x.textBaseline = 'middle'; x.fillText(`${text}  ▶▶▶  ${text}`, hh * 0.3, hh * 0.54); });
    m.rotation.z = -0.06; m.position.set(-W * 0.4, H * 0.3, 0);
    this.add(m, life, (k) => { m.position.x = -W * 0.4 + (W * 1.8) * Math.min(1, k * 1.6) * (k < 0.6 ? 1 : 1) - (k > 0.6 ? 0 : 0); m.material.opacity = k > 0.85 ? (1 - k) / 0.15 : 1; });
  }
  tunnel(life = 1) {
    const g = this.g, W = g.W, H = g.H, n = 7, grp = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const m = canvasQuad(H, H, (x, w, h) => { x.translate(w / 2, h * 0.52); x.scale(w / 34, h / 34); x.beginPath(); x.moveTo(0, 6); x.bezierCurveTo(-16, -6, -8, -16, 0, -8); x.bezierCurveTo(8, -16, 16, -6, 0, 6); x.lineWidth = 0.9; x.strokeStyle = PAL[i % PAL.length]; x.stroke(); });
      m.userData.ph = i / n; grp.add(m);
    }
    grp.position.set(W / 2, H / 2, 0);
    this.add(grp, life, (k, dt) => { for (const m of grp.children) { const p = (m.userData.ph + k * 1.6) % 1; m.scale.setScalar(0.05 + p * p * 3.2); m.material.opacity = (1 - p) * (k > 0.8 ? (1 - k) / 0.2 : 1) * 0.9; } });
  }
  phone(left, right, life = 2.4) {
    const g = this.g, W = g.W, H = g.H, side = (W - H * 0.56) / 2;
    const make = (text, x0) => canvasQuad(side, H, (x, w, h) => { x.fillStyle = '#050307'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = `900 ${Math.round(Math.min(w * 0.8, h / Math.max(1, [...text].length) * 0.9))}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; [...text].forEach((ch, i, a) => x.fillText(ch, w / 2, h * (i + 0.5) / a.length)); });
    const grp = new THREE.Group(), L = make(left, 0), R = make(right, 0); L.position.set(side / 2, H / 2, 0); R.position.set(W - side / 2, H / 2, 0); grp.add(L, R);
    this.add(grp, life, (k) => { const a = k < 0.1 ? k / 0.1 : k > 0.85 ? (1 - k) / 0.15 : 1; L.position.x = side / 2 - side * (1 - a); R.position.x = W - side / 2 + side * (1 - a); });
  }
}
