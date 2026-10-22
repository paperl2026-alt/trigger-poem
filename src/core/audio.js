// Everything is synthesized with WebAudio: weapons, paper, monsters, UI and two music loops; a sound with recorded files in content
// audio/sounds.json plays those instead (at the end of this file).
import { C } from './content.js';
let ctx = null, master, sfxBus, fxBus, musBus, musDuck, voiceBus, verb, verbIn, wetSfx, wetVoice, noiseBuf, radio, crackleBuf;
let muted = false;
let volume = 0.7;
let musicVol = 0.7, sfxVol = 0.7, voiceVol = 0.7; // the player's sliders (0..1): 0.7 is the mix as designed (docs/TECH.md「混音」)
// ---------------- the mix (docs/TECH.md「混音」; user 2026-10-19: room above the player's 70%, groups that give way to each other instead
// of sounds cut short, sound from where it happens). master -> limiter -> out:
//   music (BGM slider) <- music duck (steps back while a girl talks and while the fight is busy)
//   sfx (SFX slider)   <- ui | player (her gun, her weapon's syllables) | hit (impacts) | enemy (cries) | world (the place: doors, traps,
//                         her steps; the synthesized effects by default) | amb (the beds: clocks, rain, fire)
//   voice (voice slider): the girls' lines;  room (reverb send, per place: setRoom) -> master
// A slider is heard in dB: 0.7 = 0 dB (the designed mix), 1 = +6 dB, 40 dB per unit below (0.1 = -24 dB), 0 = off
export const sliderGain = (v) => (v <= 0.001 ? 0 : Math.pow(10, (v >= 0.7 ? (v - 0.7) * 20 : (v - 0.7) * 40) / 20));
// each bus at the designed mix (sliders at 0.7). Set by measuring the output (2026-10-19, the dev build, a fight in episode 1): the music
// about as loud as the fight (both near -21 dB RMS; it steps back a little while they talk or the fight is busy), the whole mix low
// enough that every slider can still go 6 dB up before the limiter has to hold it (at 0.62 a slider at 100% only gained 0.9 dB)
const NOM = { master: 0.45, music: 0.6, sfx: 0.8, voice: 1.0 };
const GROUPS = ['ui', 'player', 'hit', 'enemy', 'world', 'amb'], GRP = {};
// each group's own level on top of the mix (the sound sandbox's mixer, src/ui/sandbox.js; 1 = as designed): music, voice and the groups
const GRPU = { music: 1, voice: 1, ui: 1, player: 1, hit: 1, enemy: 1, world: 1, amb: 1 };
export const groupGain = (g) => GRPU[g] ?? 1;
export function setGroupGain(g, v) { GRPU[g] = v; if (g === 'voice') setVoiceVolume(voiceVol); }
let curGroup = null;   // (which group a synthesized effect plays in: set by its wrapper below)
let flameNode = null;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  // the limiter at the end: the room above the designed mix (a slider past 0.7) never clips, the loudest moments are held down softly
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -6; comp.knee.value = 6; comp.ratio.value = 8; comp.attack.value = 0.003; comp.release.value = 0.2;
  master = ctx.createGain(); master.gain.value = muted ? 0 : NOM.master * sliderGain(volume);
  master.connect(comp); comp.connect(ctx.destination);
  ana = ctx.createAnalyser(); ana.fftSize = 1024; ana.smoothingTimeConstant = 0.72; ana.minDecibels = -80; ana.maxDecibels = -18;
  comp.connect(ana); anaBuf = new Uint8Array(ana.frequencyBinCount);   // (listens only: spectrum())
  sfxBus = ctx.createGain(); sfxBus.gain.value = NOM.sfx * sliderGain(sfxVol); sfxBus.connect(master);
  for (const k of GROUPS) { GRP[k] = ctx.createGain(); GRP[k].connect(sfxBus); }
  fxBus = GRP.world;   // (the default for everything that names no group)
  voiceBus = ctx.createGain(); voiceBus.gain.value = NOM.voice * sliderGain(voiceVol); voiceBus.connect(master);
  musBus = ctx.createGain(); musBus.gain.value = NOM.music * sliderGain(musicVol);
  musDuck = ctx.createGain();
  // the music's own treatment (user 2026-10-20: the loud tracks bury the sounds - "the loud ones need a bus of their own"): a dip where
  // the voices and the hits live, the top eased, the peaks held down gently; then the duck
  const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 2800; mid.Q.value = 0.9; mid.gain.value = -3.5;
  const air = ctx.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 8000; air.gain.value = -2;
  const boom = ctx.createBiquadFilter(); boom.type = 'lowshelf'; boom.frequency.value = 150; boom.gain.value = -3;   // (ours were two thirds bass)
  const mcomp = ctx.createDynamicsCompressor(); mcomp.threshold.value = -18; mcomp.knee.value = 10; mcomp.ratio.value = 2.5; mcomp.attack.value = 0.02; mcomp.release.value = 0.25;
  musBus.connect(boom); boom.connect(mid); mid.connect(air); air.connect(mcomp); mcomp.connect(musDuck); musDuck.connect(master);
  verb = ctx.createConvolver();
  const len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  verb.buffer = ir;
  verbIn = ctx.createGain(); verbIn.gain.value = 1; verbIn.connect(verb);   // (the send: setRoom sets how much of it the place has)
  wetSfx = ctx.createGain(); wetSfx.gain.value = sfxBus.gain.value; wetSfx.connect(verbIn);
  wetVoice = ctx.createGain(); wetVoice.gain.value = voiceBus.gain.value; wetVoice.connect(verbIn);
  const vg = ctx.createGain(); vg.gain.value = 0.3; verb.connect(vg); vg.connect(master); verb.out = vg;
  setInterval(mixTick, 50);
  preloadSounds();   // (recorded sounds: below; boot waits for the menus' own ones)
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  // a boss's voice as if over an old radio (user 2026-10-20: "some post-processing, like a radio"; sounds.json voices.<who>.radio): the
  // band of a small speaker with its honk, driven a little; under the line a hiss with crackles, a squelch at each end (radioBed)
  radio = ctx.createGain();
  // (2026-10-22 user: still the bare TTS, not a far-off radio voice: a narrower band, a short echo off the walls and some of the room)
  const rhp = ctx.createBiquadFilter(); rhp.type = 'highpass'; rhp.frequency.value = 600; rhp.Q.value = 0.9;
  const rpk = ctx.createBiquadFilter(); rpk.type = 'peaking'; rpk.frequency.value = 1500; rpk.Q.value = 1.3; rpk.gain.value = 8;
  const rlp = ctx.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 2600; rlp.Q.value = 1.0;
  const rws = ctx.createWaveShaper(), cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) cv[i] = Math.tanh((i / 1023 * 2 - 1) * 4) / Math.tanh(4);
  rws.curve = cv; rws.oversample = '2x';
  const rout = ctx.createGain(); rout.gain.value = 0.72;
  radio.connect(rhp); rhp.connect(rpk); rpk.connect(rws); rws.connect(rlp); rlp.connect(rout); rout.connect(voiceBus);
  const rdl = ctx.createDelay(1), rfb = ctx.createGain(), rel = ctx.createGain(), rdf = ctx.createBiquadFilter();
  rdl.delayTime.value = 0.13; rfb.gain.value = 0.32; rel.gain.value = 0.38; rdf.type = 'lowpass'; rdf.frequency.value = 1800;
  rlp.connect(rdl); rdl.connect(rdf); rdf.connect(rfb); rfb.connect(rdl); rdf.connect(rel); rel.connect(voiceBus);   // (the echo, darker each time)
  const rvs = ctx.createGain(); rvs.gain.value = 0.35; rlp.connect(rvs); rvs.connect(verbIn);   // (and the room round it)
  crackleBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const cd = crackleBuf.getChannelData(0);
  for (let i = 0; i < cd.length; i++) { cd[i] = (Math.random() * 2 - 1) * 0.22; if (Math.random() < 0.0005) { const a = (Math.random() * 2 - 1) * 0.9; for (let k = 0; k < 90 && i + k < cd.length; k++) cd[i + k] += a * Math.exp(-k / 18) * (Math.random() * 2 - 1); } }
}
function radioBed(t0, dur) {
  const s = ctx.createBufferSource(); s.buffer = crackleBuf; s.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.6;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.5, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.11, t0 + 0.1);   // (the squelch, then the hiss under her)
  g.gain.setValueAtTime(0.11, t0 + dur); g.gain.linearRampToValueAtTime(0.4, t0 + dur + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.16);
  s.connect(bp); bp.connect(g); g.connect(voiceBus); s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.2);
  return s;
}
// what the speakers play, by pitch: 16 bands from 60 Hz to 10 kHz spaced like the ear hears them, 0..1 (the cat girl's reticle is a sound
// visualizer: src/ui/glhud.js RETG_FRAG - the music, her chant, the shots all move it). Read once per audio tick, shared by whoever asks.
let ana = null, anaBuf = null, specAt = -1;
const SPEC = new Float32Array(16);
export function spectrum() {
  if (!ana || ctx.currentTime === specAt) return SPEC;
  specAt = ctx.currentTime; ana.getByteFrequencyData(anaBuf);
  const N = anaBuf.length, hz = ctx.sampleRate / 2 / N;
  for (let i = 0; i < 16; i++) {
    const a = Math.floor(60 * Math.pow(10000 / 60, i / 16) / hz), b = Math.max(a + 1, Math.ceil(60 * Math.pow(10000 / 60, (i + 1) / 16) / hz));
    let m = 0; for (let j = a; j < b && j < N; j++) m = Math.max(m, anaBuf[j]);
    SPEC[i] = Math.pow(Math.max(0, (m / 255 - 0.3) / 0.7), 1.4);
  }
  return SPEC;
}
export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : NOM.master * sliderGain(volume); }
export function setVolume(v) { volume = v; if (master) master.gain.value = muted ? 0 : NOM.master * sliderGain(volume); }
export function getVolume() { return volume; }
export function setMusicVolume(v) { musicVol = v; if (musBus) musBus.gain.value = NOM.music * sliderGain(v); }
// (the reverb sends follow the sliders too: a muted group leaves no echo behind)
export function setSfxVolume(v) { sfxVol = v; if (sfxBus) sfxBus.gain.value = wetSfx.gain.value = NOM.sfx * sliderGain(v); }
export function setVoiceVolume(v) { voiceVol = v; if (voiceBus) voiceBus.gain.value = wetVoice.gain.value = NOM.voice * sliderGain(v) * GRPU.voice; }
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
  n.connect(bus || GRP[curGroup] || fxBus);
  if (verbAmt) { const vs = ctx.createGain(); vs.gain.value = verbAmt; n.connect(vs); vs.connect(wetSfx); }
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
  // out of a stage (tools/ui_sfx.py makes the real ones; these are stand-ins): move onto / back / can't / page / tab / toggle / swap / go,
  // a number ticking, an item got, a level up, a comic page landing
  uiMove() { tone({ f: 3136, type: 'sine', d: 0.05, v: 0.03 }); },
  uiBack() { tone({ f: 1320, type: 'sine', d: 0.08, v: 0.06 }); tone({ t: 0.06, f: 880, type: 'sine', d: 0.1, v: 0.06 }); },
  uiDeny() { tone({ f: 200, type: 'square', d: 0.07, v: 0.06, filter: { f: 800 } }); tone({ t: 0.1, f: 180, type: 'square', d: 0.07, v: 0.06, filter: { f: 800 } }); },
  uiPage() { noise({ f: 1500, f2: 5000, a: 0.04, d: 0.18, v: 0.12, q: 0.8 }); },
  uiTab() { noise({ f: 2500, f2: 7000, a: 0.02, d: 0.08, v: 0.1, q: 1 }); tone({ t: 0.08, f: 2637, type: 'sine', d: 0.08, v: 0.04 }); },
  uiToggle() { tone({ f: 2093, type: 'sine', d: 0.05, v: 0.05 }); tone({ t: 0.035, f: 2637, type: 'sine', d: 0.05, v: 0.05 }); },
  uiSwap() { noise({ f: 800, f2: 6000, a: 0.08, d: 0.2, v: 0.12 }); noise({ t: 0.07, f: 6000, f2: 800, a: 0.08, d: 0.2, v: 0.12 }); },
  uiStart() { [72, 76, 79, 84, 88].forEach((m, i) => tone({ f: mtof(m), type: 'sine', t: 0.05 + i * 0.055, d: 0.5, v: 0.08, verbAmt: 0.4 })); tone({ f: 110, f2: 55, type: 'sine', d: 0.2, v: 0.3 }); },
  count() { tone({ f: 2794, type: 'sine', d: 0.03, v: 0.03 }); },
  item() { [79, 83, 86, 91].forEach((m, i) => tone({ f: mtof(m), type: 'sine', t: i * 0.045, d: 0.4, v: 0.06, verbAmt: 0.4 })); },
  levelUp() { [72, 76, 79, 84].forEach((m, i) => tone({ f: mtof(m), type: 'sine', t: i * 0.1, d: 0.6, v: 0.07, verbAmt: 0.4 })); },
  comicPage() { noise({ f: 1500, f2: 6000, a: 0.03, d: 0.15, v: 0.12 }); tone({ t: 0.15, f: 140, f2: 70, type: 'sine', d: 0.1, v: 0.15 }); },
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
  hit(pan = 0, crit = false) {
    noise({ f: crit ? 3800 : 2200, d: 0.05, v: crit ? 0.26 : 0.18, q: 1.5, pan, verbAmt: 0.02 }); tone({ f: crit ? 700 : 300, f2: 120, type: 'triangle', d: 0.06, v: 0.12, pan }); },
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
  shutter() { noise({ f: 6000, d: 0.03, v: 0.25, q: 2 }); noise({ t: 0.06, f: 4000, d: 0.05, v: 0.2, q: 2 }); },
  creak() { tone({ f: 190, f2: 120, type: 'sawtooth', a: 0.25, d: 1.3, v: 0.05, filter: { f: 900 } }); tone({ t: 0.4, f: 240, f2: 150, type: 'sawtooth', a: 0.2, d: 0.9, v: 0.04, filter: { f: 1100 } }); },
  doorSlam() { tone({ f: 80, f2: 30, type: 'sine', d: 0.5, v: 0.45 }); noise({ f: 500, d: 0.18, v: 0.25 }); },
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
// the music: a recorded track (content audio/sounds.json music.<name>: files, vol, loop) plays when there is one, looping, crossfading
// from what was playing; otherwise the synthesized loop of that name (SONGS). A name without either is silence (episode 2's quiet stretches:
// only the clocks)
let track = null, trackName = null;
export function playMusic(name) {
  if (!ctx) return;
  const M = C.sounds?.music?.[name];
  if (M?.files?.length) {
    if (trackName === name && track) return;   // (already on: a stage's stops keep it going)
    stopMusic();
    const f = M.files[Math.floor(Math.random() * M.files.length)], b = BUF.get(f);
    if (!b || b instanceof Promise) { if (b === undefined) load(f); Promise.resolve(BUF.get(f)).then((x) => { if (x && !track && wantMusic === name) playMusic(name); }); wantMusic = name; return; }
    const s = ctx.createBufferSource(); s.buffer = b; s.loop = M.loop !== false; if (M.loopStart != null) { s.loopStart = M.loopStart; s.loopEnd = M.loopEnd ?? b.duration; }
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now()); g.gain.linearRampToValueAtTime((M.vol ?? 0.9), now() + (M.fadeIn ?? 0.8));
    s.connect(g); g.connect(musBus); s.start(0, 0);
    track = { s, g, t0: now() }; trackName = name; wantMusic = name;
    return;
  }
  stopMusic();
  song = SONGS[name] || null; step = 0; nextT = now() + 0.1; wantMusic = name;
  if (song) timer = setInterval(schedule, 25);
}
let wantMusic = null;
export function stopMusic(fade = 0.6) {
  if (timer) clearInterval(timer); timer = null; song = null; wantMusic = null;
  if (track) { const { s, g } = track; try { g.gain.setTargetAtTime(0.0001, now(), fade / 4); s.stop(now() + fade + 0.05); } catch (e) { /* over */ } track = null; trackName = null; }
}
export const musicNow = () => trackName || (song ? 'synth' : null);
// where the music is in its beat (the MV director, src/battle/mv.js): beats since it started (a recorded track's sounds.json bpm, and
// offset = the seconds before its first beat), null when there is none or nothing playing
export function musicBeat() {
  if (track && trackName) { const M = C.sounds?.music?.[trackName]; if (!M?.bpm) return null; const s = now() - track.t0 - (M.offset || 0); return s < 0 ? null : { beats: s * M.bpm / 60, bpm: M.bpm }; }
  if (song) return { beats: step / 4, bpm: song.bpm };
  return null;
}
export function duckMusic(v, t = 0.3) { if (musBus) musBus.gain.setTargetAtTime(v, now(), t); }
function schedule() {
  if (!song || muted) { if (song) nextT = now() + 0.1; return; }
  const spb = 60 / song.bpm / 4;
  if (!(spb > 0.01)) return;
  if (nextT < now() - 0.5) nextT = now();   // (fallen far behind - the context was suspended, a long stall: never play the missed steps all at once)
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

// ---- hits (user 2026-10-19: a toy's short sound on every hit, again and again like an old game - not a phrase going up and down; plain,
// clear, short, plainly apart from the music and the voices): the cartoon set's hitPink / hitCat, a crit's slot-machine "ding ding", a
// kill's coin (tools/toy_sfx.py; sounds.json gap keeps a gatling's 20 a second from blurring)
export function hitNote(who, crit = false, kill = false, pan = 0, rate = 1) {
  if (!ctx || muted) return;
  sound(kill ? 'kill' : crit ? 'crit' : who === 'cat' ? 'hitCat' : 'hitPink', { pan, rate: rate * (0.97 + Math.random() * 0.06) });   // (rate: up with the combo, Game.comboRate)
}

// ---- the mixer, every 50 ms: the groups give way to each other (docs/TECH.md「混音」)
//   a girl talking: the music -5 dB, the beds -8, the place and the monsters -4, the hits and her gun -3 (UI never)
//   a busy fight (the loudness of what has just happened, like an HDR window: hits, cries, crashes push it up, it falls off in a second):
//   the beds up to -9 dB, the music up to -2.5 dB; in a lull they come back up. Attack fast, release slow (no pumping)
const DUCK_V = { music: -5, amb: -8, world: -4, enemy: -4, hit: -3, player: -3, ui: 0 }, BUSY = { amb: -9, music: -2.5 };
// a boss talking: everything steps right back for her line (user 2026-10-20: "unless a boss's line covers them for a moment")
const DUCK_BOSS = { music: -9, amb: -12, world: -9, enemy: -9, hit: -8, player: -8, ui: -3 };
const VERB = { ui: 0, player: 0.05, hit: 0.08, enemy: 0.15, world: 0.2, amb: 0 };   // (how much of each group goes into the place's reverb)
let act = 0;
const LOUD = { hit: 0.05, enemy: 0.12, world: 0.06, player: 0.015 }, BIG = /^(slam|roar|shatter|beamFall|woodBreak|bellToll|doorSlam|kaikoWail|sheKnock)/;
function busy(grp, key = '') { act = Math.min(1, act + (BIG.test(key) ? 0.35 : LOUD[grp] || 0)); }
const UIK = /^(ui|stamp|count|item|levelUp|comicPage|panel|victory|defeat|clear)/, HITK = /^(hit|crit|kill|coverHit|clang|miss|pop|tick)/, PLAYERK = /^(shell|empty|reload|shot|gun|beam|laser|flame)/;
function groupOf(key) { const g = C.sounds?.sfx?.[key]?.bus; return GRP[g] ? g : UIK.test(key) ? 'ui' : HITK.test(key) ? 'hit' : PLAYERK.test(key) ? 'player' : 'world'; }
const db = (x) => Math.pow(10, x / 20);
function mixTick() {
  if (!ctx) return;
  const t = now(), talk = talking(), k = act, D = talk && !C.characters?.[TALK.who] ? DUCK_BOSS : DUCK_V;   // (not a heroine: a boss)
  act *= 0.94;   // (about a second to fall away)
  for (const g of GROUPS) {
    const target = db((talk ? D[g] : 0) + (BUSY[g] || 0) * k) * GRPU[g];
    GRP[g].gain.setTargetAtTime(target, t, target < GRP[g].gain.value ? 0.03 : 0.3);
  }
  const m = db((talk ? D.music : 0) + BUSY.music * k) * GRPU.music;
  musDuck.gain.setTargetAtTime(m, t, m < musDuck.gain.value ? 0.06 : 0.6);
}
// where the camera is (Game every frame): the sounds given a point are heard from here
const LISTEN = { on: false };
export function setListener(cam) {
  if (!ctx || !cam) return;
  const L = ctx.listener, p = cam.position, m = cam.matrixWorld.elements, fx = -m[8], fy = -m[9], fz = -m[10];
  if (L.positionX) { L.positionX.value = p.x; L.positionY.value = p.y; L.positionZ.value = p.z; L.forwardX.value = fx; L.forwardY.value = fy; L.forwardZ.value = fz; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
  else { L.setPosition(p.x, p.y, p.z); L.setOrientation(fx, fy, fz, 0, 1, 0); }
  LISTEN.on = true;
}
export function listenerOff() { LISTEN.on = false; }
// how much the place echoes (a set's "reverb", 0..1: a tiled bath or a cave a lot, an open bell tower little)
export function setRoom(k = 0.3) { if (verb?.out) verb.out.gain.setTargetAtTime(Math.max(0, k), now(), 0.5); }

// ---- recorded sounds (content audio/sounds.json, docs/DESIGN.md「声音」): a sound that has files plays one of them, with a slight change
// of pitch each time, instead of its synthesized stand-in; the girls' voices and the monsters' cries the same way. Nothing is fetched
// unless the list names it. Files decode the first time they are wanted (and on preloadSounds()).
const BUF = new Map();   // url -> AudioBuffer | Promise | null (failed)
function load(url) {
  if (!ctx || !url) return null;
  if (BUF.has(url)) return BUF.get(url);
  const EMB = window.__NOA_CONTENT;   // (the portable build carries every file inside, as data URIs)
  const p = fetch(EMB && typeof EMB[url] === 'string' ? EMB[url] : url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status)))).then((a) => ctx.decodeAudioData(a))
    .then((b) => { level(b); BUF.set(url, b); return b; }, (e) => { console.warn('[audio]', url, e.message); BUF.set(url, null); return null; });
  BUF.set(url, p);
  return p;
}
// files from different libraries come at different levels and with silence in front: each one is measured once when it decodes and
// played from its first sound, scaled to the same peak (vol in sounds.json is then the only loudness choice)
const PEAK = 0.7;
function level(b) {
  let peak = 0, start = b.length;
  for (let c = 0; c < b.numberOfChannels; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; if (v > 0.003 && i < start) start = i; }
  }
  // (the lead-in kept generous: soft consonants - fu, shi, hi - start quietly and were cut off: user 2026-10-18; and the small swells before
  // a hit are part of it: user 2026-10-19. Only true silence goes: under -50 dB of its peak, and 50 ms before the first sound stay)
  let first = b.length;
  for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c), th = Math.max(0.0005, peak * 0.003); for (let i = 0; i < Math.min(first, d.length); i++) if (Math.abs(d[i]) > th) { first = i; break; } }
  void start;
  b.gainK = peak > 0.001 ? PEAK / peak : 1; b.startAt = Math.max(0, first - Math.round(b.sampleRate * 0.05)) / b.sampleRate;
}
function playBuf(b, { pan = 0, vol = 1, rate = 1, len = 0, bus = fxBus, fadeIn = 0, pos = null, verbAmt = 0 } = {}) {
  const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = vol * (b.gainK || 1);
  s.connect(g);
  if (pos && LISTEN.on) {   // a point in the place: heard from the camera (HRTF: left / right, in front / behind, near / far)
    const p = ctx.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 2.5; p.rolloffFactor = 0.7; p.maxDistance = 60;
    if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y ?? 1; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y ?? 1, pos.z);
    g.connect(p); p.connect(bus);
  } else {
    const pn = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pn) { pn.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(pn); pn.connect(bus); } else g.connect(bus);
  }
  if (verbAmt) { const vs = ctx.createGain(); vs.gain.value = verbAmt; g.connect(vs); vs.connect(bus === voiceBus ? wetVoice : wetSfx); }
  if (fadeIn) { const v = g.gain.value; g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.linearRampToValueAtTime(v, ctx.currentTime + fadeIn); }
  s.start(0, b.startAt || 0);
  s.g = g;
  if (len > 0) {   // only the first len seconds (of the sound as played), then a short fade
    const t = ctx.currentTime, end = t + len / rate, f = Math.min(0.15, len / rate * 0.4);   // (a long fade: a cut-off tail is heard)
    g.gain.setValueAtTime(g.gain.value * 1, end - f); g.gain.linearRampToValueAtTime(0.0001, end); s.stop(end + 0.01);
  }
  return s;
}
// one of these files, now if it is ready (true), else loading it for next time (false: the caller uses its stand-in)
function playOne(files, opt) {
  if (!ctx || !files?.length) return false;
  const f = files[Math.floor(Math.random() * files.length)], b = BUF.get(f);
  if (b && !(b instanceof Promise)) { playBuf(b, opt); return true; }
  if (b === undefined) load(f);
  return false;
}
// decoding all of them at once kept the menus' own sounds waiting behind ~170 others (user 2026-10-18: the first clicks were silent):
// first the menus' effects and the lines said there (boot waits for these, behind the loading bar), then the rest a few at a time
const MENU_SFX = /^(ui|stamp|count|item|levelUp|comicPage|panel|victory|defeat|clear)/, MENU_LINES = /^(quit|poke|start|win|lose)_/;
// the recorded music is not preloaded with the rest (a track is ~30 MB decoded): a run decodes its own episode's tracks (warmMusic) and
// lets the others go
export function warmMusic(names) {
  if (!ctx) return;
  const M = C.sounds?.music || {}, want = new Set(names.flatMap((n) => M[n]?.files || []));
  for (const m of Object.values(M)) for (const f of m?.files || []) if (!want.has(f) && BUF.has(f) && track?.s.buffer !== BUF.get(f)) BUF.delete(f);
  for (const f of want) load(f);
}
let preloading = null;
export function preloadSounds() {
  if (preloading || !ctx) return preloading || Promise.resolve();
  const S = C.sounds || {}, first = [], rest = [];
  for (const [k, e] of Object.entries(S.sfx || {})) for (const f of e.files || []) (MENU_SFX.test(k) ? first : rest).push(f);
  for (const v of Object.values(S.voices || {})) {
    for (const [k, f] of Object.entries(v?.lines || {})) (MENU_LINES.test(k) ? first : rest).push(f);
  }
  for (const [k, m] of Object.entries(S.monsters || {})) if (!k.startsWith('_')) for (const a of ['windup', 'attack', 'hurt', 'die']) rest.push(...(m[a] || []));
  preloading = Promise.all(first.map(load)).then(() => { STATS.menuReadyMs = Math.round(performance.now()); STATS.ctxState = ctx.state; STATS.menuSounds = first.length; });
  preloading.then(async () => { for (let i = 0; i < rest.length; i += 4) await Promise.all(rest.slice(i, i + 4).map(load)); });
  return preloading;
}
// every synthesized effect first looks for its recorded version; sounds.json "gap" = at most one every that many seconds (a fast gun's
// hits would blur into one noise)
const LAST = new Map();
for (const k of Object.keys(sfx)) {
  const synth = sfx[k];
  sfx[k] = (...a) => {
    const e = C.sounds?.sfx?.[k];
    if (e?.gap && ctx) { if (now() - (LAST.get(k) ?? -9) < e.gap) return; LAST.set(k, now()); }
    const grp = groupOf(k); busy(grp, k);
    if (e?.files?.length && playOne(e.files, { pan: typeof a[0] === 'number' && Math.abs(a[0]) <= 1 ? a[0] : 0, vol: e.vol ?? 1, rate: (e.rate || 1) * (0.94 + Math.random() * 0.12), len: e.len || 0, bus: GRP[grp], verbAmt: VERB[grp] })) return;
    curGroup = grp; try { return synth(...a); } finally { curGroup = null; }
  };
}
// a sound by its sounds.json key (the ones with no synthesized stand-in: episode 2's scissors, paper screens, clocks…); false = nothing
// to play (yet). opt: pan, vol (times the key's), rate
export function sound(key, opt = {}) {
  const e = C.sounds?.sfx?.[key]; if (!ctx || muted || !e?.files?.length) return false;
  if (e.gap) { if (now() - (LAST.get(key) ?? -9) < e.gap) return true; LAST.set(key, now()); }
  const grp = groupOf(key); busy(grp, key);
  return playOne(e.files, { pan: opt.pan || 0, pos: opt.pos || null, vol: (e.vol ?? 1) * (opt.vol ?? 1), rate: (e.rate || 1) * (opt.rate ?? (0.94 + Math.random() * 0.12)), len: e.len || 0, bus: GRP[grp], verbAmt: VERB[grp] });
}
// a looping bed (sounds.json sfx entries with loop: true: the clocks ticking, the rain, the fire): on / off with a fade; vol can change
const BEDS = new Map();
export function bed(key, on, vol = 1) {
  if (!ctx) return;
  const cur = BEDS.get(key);
  if (!on) { if (cur === 'want') { BEDS.delete(key); return; } if (cur) { try { cur.g.gain.setTargetAtTime(0.0001, now(), 0.25); cur.s.stop(now() + 1.2); } catch (e) { /* over */ } BEDS.delete(key); } return; }
  const e = C.sounds?.sfx?.[key];
  if (cur === 'want') return;
  if (cur) { cur.g.gain.setTargetAtTime((e?.vol ?? 1) * vol, now(), 0.3); return; }
  if (!e?.files?.length) return;
  const f = e.files[Math.floor(Math.random() * e.files.length)], b = BUF.get(f);
  if (!b || b instanceof Promise) { if (b === undefined) load(f); Promise.resolve(BUF.get(f)).then((x) => { if (x && BEDS.get(key) === 'want') { BEDS.delete(key); bed(key, true, vol); } }); BEDS.set(key, 'want'); return; }
  const s = ctx.createBufferSource(); s.buffer = b; s.loop = true;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now()); g.gain.setTargetAtTime((e.vol ?? 1) * vol, now(), 0.4);
  s.connect(g); g.connect(GRP.amb); s.start(0, Math.random() * b.duration);
  BEDS.set(key, { s, g });
}
export function bedsOff() { for (const k of [...BEDS.keys()]) bed(k, false); }
// ---- the girls' voices (docs/TECH.md「声音」: how other games keep barks apart — one channel, priorities, gaps, ducking)
// One channel for both girls: a line starts only when nobody is talking, or cuts in (the other fades out in 50 ms) when it matters
// clearly more (2 priority steps); small talk (priority 4 and below) waits TALK_GAP after the last line and is dropped while the fight is
// hot (setIntensity). While a line plays, the effects and the music step back.
const TALK_GAP = 1.2;
// counts for tests (tools/node/playthrough.cjs writes them out: nobody can listen to an offscreen run)
const STATS = { lines: 0, linesDropped: 0, linesCut: 0, cries: 0, criesSkipped: 0 };
window.__noaAudio = STATS;
const TALK = { s: null, who: null, pr: 0, end: 0, start: -9 };
export function talking(who) { return !!ctx && now() < TALK.end && (!who || TALK.who === who); }
function talk(who, b, pr, pan) {
  const t = now(), busy = t < TALK.end;
  if (busy && pr < TALK.pr + 2) { STATS.linesDropped++; return false; }
  if (!busy && pr <= 4 && (t - TALK.start < TALK_GAP || intensity > 0.85)) { STATS.linesDropped++; return false; }
  STATS.lines++; if (busy) STATS.linesCut++;
  if (busy && TALK.s) { try { TALK.s.g.gain.setTargetAtTime(0.0001, t, 0.04); TALK.s.stop(t + 0.2); TALK.bed?.stop(t + 0.05); } catch (e) { /* over */ } }
  const R = !C.characters?.[who] && C.sounds?.voices?.[who]?.radio;   // (a boss over the radio)
  const s = playBuf(b, { vol: 1, pan, bus: R ? radio : voiceBus, fadeIn: busy ? 0.04 : 0, verbAmt: R ? 0 : 0.08 });
  const end = t + (b.duration - (b.startAt || 0));
  Object.assign(TALK, { s, who, pr, end, start: t, bed: R ? radioBed(t, end - t) : null });
  return true;
}
// a girl says the i-th line of a sticker kind (text/stickers.json) with its priority (stickers.js PRIO): true = said, false = not now
// (someone else is talking / too soon), null = that line has no voice (yet)
export function voice(who, kind, i, slot = 0, pr = 5, pan) {
  const f = C.sounds?.voices?.[who]?.lines?.[`${kind}_${i + 1}`];
  if (!ctx || !f) return null;
  const b = BUF.get(f);
  if (!b || b instanceof Promise) { if (b === undefined) load(f); return null; }
  return talk(who, b, pr, pan ?? (slot ? 0.25 : -0.25));
}
// how long that line is said (seconds; 0 = no voice / not loaded yet): a line's words stay up while it is said
export function voiceLen(who, kind, i) {
  const b = BUF.get(C.sounds?.voices?.[who]?.lines?.[`${kind}_${i + 1}`]);
  return b && !(b instanceof Promise) ? b.duration - (b.startAt || 0) : 0;
}
// a monster's cry (windup / attack / hurt / die), its own or the default one. At most CRY_MAX at once: a new one only takes a place
// from a less important one (die > windup > attack > hurt), else it is skipped (the fight stays readable: "play the right sounds")
const CRY_MAX = 4, CRY_PR = { die: 3, windup: 2, attack: 1, hurt: 0 };
const CRIES = [];
// a monster's own files for that action, else its family's AI cries (sounds.json monsters.<type>.cry = girl / paper / wood / beast ->
// sfx cry_<family>_<act>, tools/rounds/sfx_specs62.py), else the default
export function cry(type, act, pan = 0, pos = null) {
  const M = C.sounds?.monsters || {}, own = M[type]?.[act]?.length, fam = C.sounds?.sfx?.[`cry_${M[type]?.cry}_${act}`]?.files;
  const files = own ? M[type][act] : fam?.length ? fam : M.default?.[act], rate = (M[type]?.rate || 1) * (0.92 + Math.random() * 0.16);
  if (!ctx || !files?.length) return;
  const t = now(), pr = CRY_PR[act] ?? 0;
  for (let k = CRIES.length - 1; k >= 0; k--) if (CRIES[k].end <= t) CRIES.splice(k, 1);
  if (CRIES.length >= CRY_MAX) {
    const low = CRIES.reduce((a, c) => (c.pr < a.pr ? c : a));
    if (low.pr >= pr) { STATS.criesSkipped++; return; }
    try { low.s.g.gain.setTargetAtTime(0.0001, t, 0.08); low.s.stop(t + 0.4); } catch (e) { /* over */ }
    CRIES.splice(CRIES.indexOf(low), 1);
  }
  const f = files[Math.floor(Math.random() * files.length)], b = BUF.get(f);
  if (!b || b instanceof Promise) { if (b === undefined) load(f); return; }
  const s = playBuf(b, { pan, pos, vol: M[type]?.vol ?? 0.9, rate, bus: GRP.enemy, verbAmt: 0.15 }); busy('enemy');
  CRIES.push({ s, pr, end: t + (b.duration - (b.startAt || 0)) / rate }); STATS.cries++;
}
