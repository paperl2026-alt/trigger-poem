// The sound sandbox (user 2026-10-19: test the sounds and the music in a scene of your choosing, with the monsters you choose - more
// vivid than single files). Set up on the listening page (sound.html, tab 沙盒) and saved as "sandbox"; index.html?sandbox plays it:
// one stop of the chosen place, the chosen monsters coming in wave after wave without end (Game.checkWave: run.sandbox), the chosen
// music, beds and (if asked) her prowling - and over it a mixer: every group's level live, each monster's cries on a button, her
// sounds, the hit notes, a note to write down (kept with the listening page's picks: saves/audition.json, sandboxNotes).
import { C } from '../core/content.js';
import { cry, sound, bed, bedsOff, hitNote, playMusic, stopMusic, setGroupGain, groupGain, setMusicVolume, setSfxVolume, setVoiceVolume, setVolume } from '../core/audio.js';
import { SET, saveSettings } from '../core/settings.js';

const STORE = 'sandbox';
export function sandboxConfig() {
  try { const s = window.native?.read(STORE)?.data || localStorage.getItem(STORE); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}
const FLY = new Set(['flyer']), HANG = new Set(['thrower']);
// the chosen place's stop (the first with a fight; its camera, view and covers) with the chosen monsters as its one wave, spread in front of
// the camera; an episode of one stage around it (debug: nothing is saved or paid)
export function buildSandbox(cfg) {
  const set = C.sets[cfg.set]; if (!set) return null;
  const all = Object.entries(set.stations || {}).filter(([, s]) => s.cam && s.look && !s.chase && !s.hide && !s.dial);
  const [, base] = all.find(([, s]) => s.waves?.length) || all[0] || [null, null];
  if (!base) return null;
  const [cx, , cz] = base.cam, [lx, , lz] = base.look, dx = lx - cx, dz = lz - cz, d = Math.hypot(dx, dz) || 1, fx = dx / d, fz = dz / d;
  const at = (dist, side) => [cx + fx * dist - fz * side, cz + fz * dist + fx * side];
  const wave = [];
  (cfg.monsters || []).forEach((m, i) => {
    const E = C.enemies[m.type]; if (!E || !m.n) return;
    const fly = FLY.has(E.beh), [x, z] = at(fly ? 5.5 : HANG.has(E.beh) ? 7 : 8.5 + (i % 3), ((i % 3) - 1) * 1.6);
    wave.push({ t: i * 1.2, type: m.type, count: m.n, x, z, ...(fly ? { y: 2.4 } : HANG.has(E.beh) ? { y: 1.3 } : { from: 'pop' }), spread: Math.min(5, 1 + m.n * 0.5), every: fly ? 0.15 : 0.6 });
  });
  const S = { cam: base.cam, look: base.look, covers: base.covers, waves: [wave.length ? wave : [{ t: 0, type: Object.keys(C.enemies)[0], count: 1 }]],
    music: cfg.music === 'none' ? null : cfg.music === 'synth' ? 'stage' : cfg.music, state: cfg.dark ? 1 : 0 };
  if (cfg.she) { const [x, z] = at(11, 1.5); S.she = { form: cfg.she, at: [x, z], wake: 4 }; }
  set.stations.__sandbox = S;
  return C.episodes.__sandbox = { id: '__sandbox', debug: true, sandbox: true, set: cfg.set, title: { zh: '声音沙盒', en: 'Sound sandbox', ja: 'サウンド砂場' },
    steps: [{ stage: 'sandbox', set: cfg.set, stations: ['__sandbox'], name: { zh: '声音沙盒', en: 'SOUND SANDBOX', ja: 'サウンド砂場' }, she: 'she', kaiko: 'kaiko', shots: ['geta', 'scissors', 'pins', 'crane'] }] };
}

// ---- the mixer over the game
const GROUPS = [['music', '音乐'], ['voice', '语音'], ['player', '她们的枪'], ['hit', '命中'], ['enemy', '怪叫'], ['world', '场景'], ['amb', '环境'], ['ui', '界面']];
export function mountSandboxMixer(G, cfg) {
  const el = document.createElement('div'); el.id = 'sbx';
  el.innerHTML = `<h3>声音沙盒 <button class="mini" data-k="min">－</button></h3><div class="body"></div>`;
  document.body.appendChild(el);
  const body = el.querySelector('.body');
  const row = (label, ...kids) => { const r = document.createElement('div'); r.className = 'r'; const l = document.createElement('span'); l.textContent = label; r.append(l, ...kids); body.appendChild(r); return r; };
  const slider = (v, on) => { const s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = 1; s.step = 0.05; s.value = v; s.oninput = () => on(+s.value); return s; };
  const button = (t, on) => { const b = document.createElement('button'); b.textContent = t; b.onclick = (e) => { e.stopPropagation(); on(b); }; return b; };
  // the player's own sliders (the same as the settings), then each group on top of them (1 = as designed)
  row('总音量', slider(SET.volume ?? 0.7, (v) => { SET.volume = v; setVolume(v); saveSettings(); }));
  row('BGM', slider(SET.bgm ?? 0.7, (v) => { SET.bgm = v; setMusicVolume(v); saveSettings(); }));
  row('音效', slider(SET.sfx ?? 0.7, (v) => { SET.sfx = v; setSfxVolume(v); saveSettings(); }));
  row('语音', slider(SET.voice ?? 0.7, (v) => { SET.voice = v; setVoiceVolume(v); saveSettings(); }));
  const sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = '各组（1 = 设计好的量，往上最多 +12 dB）'; body.appendChild(sub);
  for (const [g, name] of GROUPS) {
    const val = document.createElement('b');
    const show = (v) => { val.textContent = v <= 0.001 ? '关' : `${(20 * Math.log10(v)).toFixed(0)} dB`; };
    // (the middle = as designed; each side 12 dB; all the way down = off)
    const s = slider(0.5 + 20 * Math.log10(Math.max(0.0001, groupGain(g))) / 24, (x) => { const v = x <= 0.01 ? 0 : 10 ** (((x - 0.5) * 24) / 20); setGroupGain(g, v); show(v); });
    show(groupGain(g)); row(name, s, val);
  }
  // the chosen monsters' cries, one button per action
  for (const m of cfg.monsters || []) {
    if (!m.n) continue;
    const r = row(`${C.enemies[m.type]?.name?.zh || m.type}`);
    for (const [act, t] of [['windup', '蓄力'], ['attack', '攻击'], ['hurt', '挨打'], ['die', '死']]) r.append(button(t, () => cry(m.type, act, (Math.random() - 0.5) * 0.6)));
  }
  row('她', button('剪刀', () => sound('snip')), button('笑', () => sound('sheLaugh')), button('倒地', () => sound('sheKnock')), button('起身', () => sound('sheRise')));
  row('打击音', button('地雷妹', () => { for (let i = 0; i < 12; i++) setTimeout(() => hitNote('pink', Math.random() < 0.15, false, 0), i * 60); }),
    button('猫娘', () => { for (let i = 0; i < 5; i++) setTimeout(() => hitNote('cat', false, false, 0), i * 300); }), button('击杀', () => hitNote('cat', true, true, 0)));
  // the beds asked for, and any other on a toggle
  const loops = Object.entries(C.sounds?.sfx || {}).filter(([, e]) => e.loop && e.files?.length).map(([k]) => k);
  const on = new Set(cfg.beds || []);
  const br = row('环境声');
  for (const k of loops) br.append(button(`${on.has(k) ? '■' : '□'} ${k}`, (b) => { if (on.has(k)) { on.delete(k); bed(k, false); } else { on.add(k); bed(k, true, 0.9); } b.textContent = `${on.has(k) ? '■' : '□'} ${k}`; }));
  setTimeout(() => { for (const k of on) bed(k, true, 0.9); }, 1500);
  // music now
  const mr = row('换 BGM');
  for (const k of [...Object.keys(C.sounds?.music || {}), 'stage', 'boss']) mr.append(button(k, () => playMusic(k)));
  mr.append(button('停', () => stopMusic(0.5)));
  // a note, kept with the listening page's picks
  const ta = document.createElement('textarea'); ta.placeholder = '听到什么想说的，写这里（会和试听页的意见存在一起）';
  const save = button('记下', (b) => {
    if (!ta.value.trim()) return;
    let A = {}; try { A = JSON.parse(window.native?.read('audition')?.data || localStorage.getItem('audition') || '{}'); } catch (e) { A = {}; }
    (A.sandboxNotes || (A.sandboxNotes = [])).push({ at: new Date().toISOString(), set: cfg.set, music: cfg.music, monsters: (cfg.monsters || []).filter((m) => m.n).map((m) => m.type), note: ta.value.trim() });
    const s = JSON.stringify(A); if (window.native) window.native.write('audition', s); else localStorage.setItem('audition', s);
    ta.value = ''; b.textContent = '记下了 ✓'; setTimeout(() => { b.textContent = '记下'; }, 1500);
  });
  body.append(ta); row('', save, button('回试听页', () => { bedsOff(); location.href = 'sound.html'; }));
  el.querySelector('[data-k=min]').onclick = (e) => { e.stopPropagation(); el.classList.toggle('min'); };
  for (const ev of ['pointerdown', 'pointerup', 'click', 'wheel']) el.addEventListener(ev, (e) => e.stopPropagation());
  void G;
  return el;
}
