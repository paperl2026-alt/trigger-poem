// Everything is synthesized with WebAudio: weapons, paper, monsters, UI and two music loops; a sound with recorded files in content
// audio/sounds.json plays those instead (at the end of this file).
import { C } from './content.js';
let ctx = null, master, sfxBus, musBus, verb, noiseBuf;
let muted = false;
let volume = 0.8;
let musicVol = 1, sfxVol = 1; // BGM / SFX sliders (0..1), on top of the master volume
let flameNode = null;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.15;
  master = ctx.createGain(); master.gain.value = muted ? 0 : 0.75 * volume;
  master.connect(comp); comp.connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9 * sfxVol; sfxBus.connect(master);
  musBus = ctx.createGain(); musBus.gain.value = 0.34 * musicVol; musBus.connect(master);
  verb = ctx.createConvolver();
  const len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  verb.buffer = ir;
  const vg = ctx.createGain(); vg.gain.value = 0.3; verb.connect(vg); vg.connect(master);
  setTimeout(() => preloadSounds(), 0);   // (recorded sounds: below)
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
}
export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.75 * volume; }
export function setVolume(v) { volume = v; if (master) master.gain.value = muted ? 0 : 0.75 * volume; }
export function getVolume() { return volume; }
export function setMusicVolume(v) { musicVol = v; if (musBus) musBus.gain.value = 0.34 * v; }
export function setSfxVolume(v) { sfxVol = v; if (sfxBus) sfxBus.gain.value = 0.9 * v; }
export function isMuted() { return muted; }
const now = () => ctx.currentTime;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function out(node, bus, pan, verbAmt) {
  let n = node;
  if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); n.connect(p); n = p; }
  n.connect(bus || sfxBus);
  if (verbAmt) { const vs = ctx.createGain(); vs.gain.value = verbAmt; n.connect(vs); vs.connect(verb); }
}
function tone({ f = 440, f2 = null, type = 'square', t = 0, a = 0.004, d = 0.15, v = 0.2, bus = null, pan = 0, verbAmt = 0.1, filter = null, q = 1, vib = 0, vibRate = 6 }) {
  if (!ctx || muted) return;
  const st = now() + t;
  const o = ctx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f, st);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), st + a + d);
  const g = ctx.createGain(); env(g, st, a, v, d);
  let node = o;
  if (vib) {
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = vibRate; lg.gain.value = vib; lfo.connect(lg); lg.connect(o.frequency);
    lfo.start(st); lfo.stop(st + a + d + 0.05);
  }
  if (filter) {
    const bq = ctx.createBiquadFilter(); bq.type = filter.type || 'lowpass';
    bq.frequency.setValueAtTime(filter.f, st);
    if (filter.f2) bq.frequency.exponentialRampToValueAtTime(filter.f2, st + a + d);
    bq.Q.value = q; node.connect(bq); node = bq;
  }
  node.connect(g); out(g, bus, pan, verbAmt);
  o.start(st); o.stop(st + a + d + 0.05);
}
function noise({ t = 0, a = 0.002, d = 0.1, v = 0.2, f = 2000, f2 = null, type = 'bandpass', q = 1, bus = null, pan = 0, verbAmt = 0.08 }) {
  if (!ctx || muted) return;
  const st = now() + t;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const bq = ctx.createBiquadFilter(); bq.type = type; bq.frequency.setValueAtTime(f, st); bq.Q.value = q;
  if (f2) bq.frequency.exponentialRampToValueAtTime(f2, st + a + d);
  const g = ctx.createGain(); env(g, st, a, v, d);
  s.connect(bq); bq.connect(g); out(g, bus, pan, verbAmt);
  s.start(st, Math.random() * 1.2); s.stop(st + a + d + 0.05);
}

export const sfx = {
  ui() { tone({ f: 880, type: 'square', d: 0.04, v: 0.06, filter: { f: 3000 } }); tone({ t: 0.04, f: 1320, type: 'square', d: 0.06, v: 0.06, filter: { f: 3000 } }); },
  gun(pan = 0) {
    noise({ f: 2600, f2: 500, d: 0.07, v: 0.32, q: 0.6, pan, verbAmt: 0.12 });
    tone({ f: 180, f2: 50, type: 'sine', d: 0.08, v: 0.32, pan, verbAmt: 0 });
    tone({ f: 1400, f2: 300, type: 'square', d: 0.03, v: 0.05, filter: { f: 3500 }, pan });
  },
  cannon(pan = 0) {
    noise({ f: 1800, f2: 300, d: 0.16, v: 0.4, q: 0.5, pan, verbAmt: 0.25 });
    tone({ f: 120, f2: 35, type: 'sine', d: 0.22, v: 0.5, pan, verbAmt: 0.1 });
    tone({ f: 900, f2: 200, type: 'square', d: 0.05, v: 0.06, filter: { f: 2500 }, pan });
  },
  shell() { tone({ t: 0.18 + Math.random() * 0.1, f: 3200 + Math.random() * 600, type: 'sine', d: 0.06, v: 0.025, verbAmt: 0.2 }); },
  empty() { tone({ f: 2400, type: 'square', d: 0.02, v: 0.06, filter: { f: 4000 } }); },
  reload() { noise({ f: 3000, d: 0.04, v: 0.15, q: 3 }); tone({ t: 0.05, f: 900, type: 'square', d: 0.03, v: 0.06 }); noise({ t: 0.32, f: 1800, d: 0.06, v: 0.2, q: 2 }); tone({ t: 0.36, f: 600, f2: 900, type: 'square', d: 0.05, v: 0.07, filter: { f: 2500 } }); },
  slash(p = 1) { noise({ f: 7000, f2: 1200, d: 0.16, v: 0.24 * p, q: 1.2 }); tone({ f: 2400, f2: 700, type: 'sawtooth', d: 0.12, v: 0.04, filter: { f: 5000 } }); },
  paperRip(pan = 0) { for (let i = 0; i < 3; i++) noise({ t: i * 0.025, f: 2500 + Math.random() * 3000, d: 0.04, v: 0.12, q: 4, pan, verbAmt: 0.02 }); },
  tear(pan = 0) { noise({ f: 1500, f2: 6000, d: 0.22, v: 0.22, q: 2.5, pan }); noise({ t: 0.06, f: 4000, f2: 900, d: 0.18, v: 0.15, q: 3, pan }); },
  hit(pan = 0, crit = false) { noise({ f: crit ? 3800 : 2200, d: 0.05, v: crit ? 0.26 : 0.18, q: 1.5, pan, verbAmt: 0.02 }); tone({ f: crit ? 700 : 300, f2: 120, type: 'triangle', d: 0.06, v: 0.12, pan }); },
  thud(pan = 0) { tone({ f: 120, f2: 40, type: 'sine', d: 0.25, v: 0.4, pan, verbAmt: 0.1 }); noise({ f: 400, d: 0.15, v: 0.2, type: 'lowpass', pan }); },
  shatter(pan = 0) { for (let i = 0; i < 6; i++) noise({ t: i * 0.02, f: 3000 + i * 600, d: 0.08, v: 0.12, q: 5, pan, verbAmt: 0.2 }); tone({ f: 600, f2: 90, type: 'triangle', d: 0.3, v: 0.12, pan }); },
  burnOut(pan = 0) { noise({ f: 900, f2: 200, d: 0.7, a: 0.05, v: 0.25, type: 'lowpass', pan, verbAmt: 0.2 }); for (let i = 0; i < 8; i++) noise({ t: Math.random() * 0.6, f: 5000, d: 0.02, v: 0.08, q: 6, pan }); },
  flameStart() {
    if (!ctx || muted || flameNode) return;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const bq = ctx.createBiquadFilter(); bq.type = 'bandpass'; bq.frequency.value = 900; bq.Q.value = 0.5;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    const g = ctx.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(0.32, now(), 0.04);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 13; lg.gain.value = 300; lfo.connect(lg); lg.connect(bq.frequency); lfo.start();
    s.connect(bq); bq.connect(lp); lp.connect(g); g.connect(sfxBus);
    s.start();
    flameNode = { s, g, lfo };
  },
  flameStop() {
    if (!flameNode) return;
    const f = flameNode; flameNode = null;
    f.g.gain.setTargetAtTime(0.0001, now(), 0.06);
    setTimeout(() => { try { f.s.stop(); f.lfo.stop(); } catch (e) { /* already stopped */ } }, 300);
  },
  miss(pan = 0) {
    if (!ctx || now() - (sfx._missT || 0) < 0.05) return;
    sfx._missT = now();
    noise({ f: 700 + Math.random() * 300, d: 0.05, v: 0.13, type: 'lowpass', pan, verbAmt: 0.05 });
    noise({ t: 0.01, f: 3500, d: 0.02, v: 0.05, q: 4, pan, verbAmt: 0 });
  },
  crackle() { noise({ f: 4000 + Math.random() * 3000, d: 0.015, v: 0.06, q: 8, verbAmt: 0 }); },
  dollScreech(pan = 0) { tone({ f: 900, f2: 1500, type: 'sawtooth', d: 0.35, v: 0.06, vib: 80, vibRate: 30, filter: { f: 3000 }, pan, verbAmt: 0.3 }); },
  mothFlap(pan = 0) { noise({ f: 300, d: 0.05, v: 0.1, q: 1, pan, verbAmt: 0 }); },
  whoosh(pan = 0) { noise({ f: 500, f2: 3500, a: 0.15, d: 0.3, v: 0.18, q: 1, pan }); },
  throwIt(pan = 0) { noise({ f: 1200, f2: 2600, a: 0.1, d: 0.25, v: 0.15, q: 3, pan }); },
  clang() { tone({ f: 1800, type: 'square', d: 0.25, v: 0.07, filter: { f: 5000 }, verbAmt: 0.4 }); tone({ f: 2650, type: 'sine', d: 0.4, v: 0.05, verbAmt: 0.4 }); noise({ f: 5000, d: 0.05, v: 0.15 }); },
  coverHit() { tone({ f: 90, f2: 45, type: 'sine', d: 0.3, v: 0.45, verbAmt: 0.1 }); noise({ f: 700, d: 0.2, v: 0.25, type: 'lowpass' }); noise({ t: 0.03, f: 3000, d: 0.1, v: 0.1, q: 3 }); },
  warn() { tone({ f: 1046, type: 'square', d: 0.07, v: 0.06, filter: { f: 2500 } }); tone({ t: 0.1, f: 1046, type: 'square', d: 0.07, v: 0.06, filter: { f: 2500 } }); },
  hurt() { tone({ f: 600, f2: 120, type: 'square', d: 0.25, v: 0.12, filter: { f: 1600 } }); noise({ f: 800, d: 0.25, v: 0.3 }); tone({ f: 70, f2: 30, type: 'sine', d: 0.4, v: 0.4, verbAmt: 0 }); },
  popup() { noise({ f: 900, f2: 2500, d: 0.1, v: 0.1, q: 2 }); tone({ f: 300, f2: 600, type: 'triangle', d: 0.08, v: 0.06 }); },
  roar() { tone({ f: 70, f2: 50, type: 'sawtooth', a: 0.1, d: 1.4, v: 0.25, vib: 6, vibRate: 9, filter: { f: 600 }, verbAmt: 0.5 }); tone({ f: 104, f2: 70, type: 'sawtooth', a: 0.1, d: 1.3, v: 0.15, vib: 10, vibRate: 13, filter: { f: 900 }, verbAmt: 0.5 }); noise({ f: 300, f2: 1200, a: 0.2, d: 1.2, v: 0.2, verbAmt: 0.4 }); },
  slam() { tone({ f: 60, f2: 25, type: 'sine', d: 0.8, v: 0.6, verbAmt: 0.3 }); noise({ f: 1500, f2: 150, d: 0.7, v: 0.4, type: 'lowpass', verbAmt: 0.4 }); },
  madness() { tone({ f: 110, f2: 880, type: 'sawtooth', a: 0.5, d: 0.7, v: 0.12, filter: { f: 500, f2: 6000 }, vib: 40 }); [72, 75, 79, 82, 86].forEach((m, i) => tone({ f: mtof(m), type: 'square', t: 0.4 + i * 0.05, d: 0.4, v: 0.06, filter: { f: 5000 }, verbAmt: 0.5 })); },
  stamp() { tone({ f: 160, f2: 60, type: 'sine', d: 0.2, v: 0.4, verbAmt: 0.1 }); noise({ f: 2500, d: 0.08, v: 0.2 }); },
  panel() { noise({ f: 800, f2: 4000, a: 0.03, d: 0.15, v: 0.14, q: 1 }); },
  viewer() { tone({ f: 1975, type: 'sine', d: 0.06, v: 0.03 }); },
  clear() { [67, 72, 76, 79, 84].forEach((m, i) => tone({ f: mtof(m), type: 'square', t: i * 0.06, d: 0.25, v: 0.07, filter: { f: 5000 }, verbAmt: 0.4 })); },
  victory() { [[72, 0], [76, 0.14], [79, 0.28], [84, 0.42], [83, 0.7], [84, 0.84], [91, 1.0]].forEach(([m, t]) => tone({ f: mtof(m), type: 'square', t, d: 0.35, v: 0.09, filter: { f: 5000 }, verbAmt: 0.4 })); },
  defeat() { [[67, 0], [63, 0.3], [60, 0.6], [55, 0.95]].forEach(([m, t]) => tone({ f: mtof(m), type: 'triangle', t, d: 0.6, v: 0.1, verbAmt: 0.5 })); noise({ f: 6000, type: 'highpass', d: 1.5, v: 0.06 }); },
  run(i) { tone({ f: i % 2 ? 110 : 95, f2: 50, type: 'sine', d: 0.08, v: 0.2, verbAmt: 0 }); noise({ f: 1200, d: 0.03, v: 0.06 }); },
};

// ---------------- music: dark synth loops ----------------
const SONGS = {
  stage: {
    bpm: 132,
    chords: [[45, 48, 52], [41, 45, 48], [43, 46, 50], [40, 44, 47]],
    lead: [
      [81, -1, -1, 80, 81, -1, 76, -1, 77, -1, 76, -1, 72, -1, 74, -1],
      [77, -1, -1, 76, 77, -1, 72, -1, 74, -1, 72, -1, 69, -1, -1, -1],
      [79, -1, -1, 77, 79, -1, 82, -1, 81, -1, 79, -1, 77, -1, 74, -1],
      [76, -1, 80, -1, 83, -1, 86, -1, 84, -1, 83, -1, 80, -1, -1, -1],
    ],
  },
  boss: {
    bpm: 150,
    chords: [[40, 43, 47], [41, 44, 48], [38, 41, 45], [39, 43, 46]],
    lead: [
      [76, 77, 76, -1, 71, -1, 76, -1, 79, -1, 77, -1, 76, -1, 72, -1],
      [77, 79, 77, -1, 72, -1, 77, -1, 80, -1, 79, -1, 77, -1, 74, -1],
      [74, 76, 74, -1, 69, -1, 74, -1, 77, -1, 76, -1, 74, -1, 71, -1],
      [75, -1, 79, -1, 82, -1, 87, -1, 86, -1, 82, -1, 79, -1, 75, -1],
    ],
  },
};
let song = null, step = 0, nextT = 0, timer = null, intensity = 0;
export function setIntensity(v) { intensity = v; }
export function playMusic(name) {
  if (!ctx) return;
  stopMusic();
  song = SONGS[name]; step = 0; nextT = now() + 0.1;
  timer = setInterval(schedule, 25);
}
export function stopMusic() { if (timer) clearInterval(timer); timer = null; song = null; }
export function duckMusic(v, t = 0.3) { if (musBus) musBus.gain.setTargetAtTime(v, now(), t); }
function schedule() {
  if (!song || muted) { if (song) nextT = now() + 0.1; return; }
  const spb = 60 / song.bpm / 4;
  while (nextT < now() + 0.12) { playStep(step, nextT); nextT += spb; step++; }
}
function playStep(s, t) {
  const bar = Math.floor(s / 16) % 4, k = s % 16;
  const ch = song.chords[bar], lead = song.lead[bar][k];
  const dt = Math.max(0, t - now()), B = musBus;
  if (k % 4 === 0) tone({ f: 150, f2: 38, type: 'sine', t: dt, d: 0.2, v: 0.55, bus: B, verbAmt: 0 });
  if (k === 4 || k === 12) { noise({ t: dt, f: 1900, d: 0.16, v: 0.22, bus: B, q: 0.7, verbAmt: 0.25 }); }
  noise({ t: dt, f: 9500, type: 'highpass', d: k % 2 ? 0.02 : 0.045, v: k % 2 ? 0.035 : 0.06, bus: B, verbAmt: 0 });
  if (k % 2 === 1) tone({ f: mtof(ch[0] - 12), type: 'sawtooth', t: dt, d: 0.1, v: 0.13, bus: B, filter: { f: 600 + intensity * 900 }, verbAmt: 0 });
  const arp = [ch[0], ch[2], ch[1], ch[2] + 12][k % 4] + 12;
  tone({ f: mtof(arp), type: 'square', t: dt, d: 0.08, v: 0.03, bus: B, filter: { f: 1500 + intensity * 2500 }, verbAmt: 0.25 });
  if (k === 0) ch.forEach((m) => tone({ f: mtof(m + 12), type: 'sawtooth', t: dt, a: 0.2, d: 1.6, v: 0.022, bus: B, filter: { f: 1200 }, vib: 3, verbAmt: 0.4 }));
  if (lead > 0 && intensity > 0.3) tone({ f: mtof(lead), type: 'square', t: dt, d: 0.18, v: 0.045, bus: B, filter: { f: 3200 }, vib: 5, verbAmt: 0.3 });
}

// ---- recorded sounds (content audio/sounds.json, docs/DESIGN.md「声音」): a sound that has files plays one of them, with a slight change
// of pitch each time, instead of its synthesized stand-in; the girls' voices and the monsters' cries the same way. Nothing is fetched
// unless the list names it. Files decode the first time they are wanted (and on preloadSounds()).
const BUF = new Map();   // url -> AudioBuffer | Promise | null (failed)
function load(url) {
  if (!ctx || !url) return null;
  if (BUF.has(url)) return BUF.get(url);
  const p = fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status)))).then((a) => ctx.decodeAudioData(a))
    .then((b) => { BUF.set(url, b); return b; }, (e) => { console.warn('[audio]', url, e.message); BUF.set(url, null); return null; });
  BUF.set(url, p);
  return p;
}
function playBuf(b, { pan = 0, vol = 1, rate = 1, bus = sfxBus } = {}) {
  const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = vol;
  const pn = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  s.connect(g); if (pn) { pn.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(pn); pn.connect(bus); } else g.connect(bus);
  s.start(); return s;
}
// one of these files, now if it is ready (true), else loading it for next time (false: the caller uses its stand-in)
function playOne(files, opt) {
  if (!ctx || !files?.length) return false;
  const f = files[Math.floor(Math.random() * files.length)], b = BUF.get(f);
  if (b && !(b instanceof Promise)) { playBuf(b, opt); return true; }
  if (b === undefined) load(f);
  return false;
}
export function preloadSounds() {
  const S = C.sounds || {};
  for (const e of Object.values(S.sfx || {})) for (const f of e.files || []) load(f);
  for (const [k, m] of Object.entries(S.monsters || {})) if (!k.startsWith('_')) for (const a of ['windup', 'attack', 'hurt', 'die']) for (const f of m[a] || []) load(f);
  for (const v of Object.values(S.voices || {})) for (const f of Object.values(v?.lines || {})) load(f);
}
// every synthesized effect first looks for its recorded version
for (const k of Object.keys(sfx)) {
  const synth = sfx[k];
  sfx[k] = (...a) => {
    const e = C.sounds?.sfx?.[k];
    if (e?.files?.length && playOne(e.files, { pan: typeof a[0] === 'number' && Math.abs(a[0]) <= 1 ? a[0] : 0, vol: e.vol ?? 1, rate: 0.94 + Math.random() * 0.12 })) return;
    return synth(...a);
  };
}
// a girl says the i-th line of a sticker kind (text/stickers.json), if that line has a voice file
let voiceNow = [null, null];
export function voice(who, kind, i, slot = 0) {
  const f = C.sounds?.voices?.[who]?.lines?.[`${kind}_${i + 1}`];
  if (!ctx || !f) return;
  const b = BUF.get(f);
  if (!b || b instanceof Promise) { if (b === undefined) load(f); return; }
  try { voiceNow[slot]?.stop(); } catch (e) { /* already over */ }
  voiceNow[slot] = playBuf(b, { vol: 1, pan: slot ? 0.25 : -0.25 });
}
// a monster's cry (windup / attack / hurt / die), its own or the default one
export function cry(type, act, pan = 0) {
  const M = C.sounds?.monsters || {};
  const files = M[type]?.[act]?.length ? M[type][act] : M.default?.[act];
  playOne(files, { pan, vol: 0.9, rate: 0.9 + Math.random() * 0.2 });
}
