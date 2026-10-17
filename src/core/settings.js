// Player-facing settings (Esc / ⚙ / pad START): display, 2P, volume, language. Persisted per browser.
// Display: always landscape; any window size or aspect works (ultrawide shows more panorama, never black bars).
// Fullscreen is borderless (browser / Electron fullscreen), render scale trades sharpness for speed,
// HUD frame keeps the HUD and characters inside 16:9 or 21:9 on very wide screens.
import { sfx, isMuted, setMuted, setVolume, getVolume, setMusicVolume, setSfxVolume } from './audio.js';
import { lang, setLang, LANGS } from './i18n.js';
import { T } from './content.js';
import { readStored, writeStored } from './store.js';

const KEY = 'noa.settings';
// defaults: content tuning/settings.json; initSettings() runs once the packs are loaded
export const SET = {};
export function initSettings() {
  let saved = {};
  try { saved = JSON.parse(readStored('settings', KEY)?.data || '{}'); } catch (e) { saved = {}; }
  Object.assign(SET, T.defaultSettings, saved);
  setVolume(SET.volume); setMusicVolume(SET.bgmOn === false ? 0 : SET.bgm); setSfxVolume(SET.sfxOn === false ? 0 : SET.sfx);
}
export const saveSettings = () => writeStored('settings', KEY, JSON.stringify(SET));

const L = (zh, en, ja) => ({ zh, en, ja }[lang] || en);

export function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen({ navigationUI: 'hide' });
  } catch (e) { /* not allowed here */ }
}

export function mountSettings(G, act) {
  const panel = document.createElement('div');
  panel.id = 'set';
  panel.className = 'hidden';
  document.body.appendChild(panel);
  const row = (title, items) => {
    const r = document.createElement('div'); r.className = 'srow';
    const h = document.createElement('span'); h.textContent = title; r.appendChild(h);
    const box = document.createElement('div'); box.className = 'sopts'; r.appendChild(box);
    for (const [label, fn, on] of items) {
      const b = document.createElement('button');
      b.textContent = label;
      if (on) b.classList.add('on');
      b.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); sfx.ui(); fn(); saveSettings(); render(); };
      box.appendChild(b);
    }
    panel.appendChild(r);
  };
  function render() {
    panel.innerHTML = '';
    const head = document.createElement('div'); head.className = 'shead';
    head.innerHTML = `<b>${L('设置', 'SETTINGS', '設定')}</b>`;
    panel.appendChild(head);
    row(L('全屏', 'Fullscreen', 'フルスクリーン'), [[document.fullscreenElement ? 'ON' : 'OFF', toggleFullscreen, !!document.fullscreenElement]]);
    row(L('渲染精度', 'Render scale', '描画解像度'), [0.5, 0.75, 1, 1.25].map((v) => [`${v * 100}%`, () => { SET.scale = v; act.resize(); }, SET.scale === v]));
    row(L('HUD 范围', 'HUD frame', 'HUD 範囲'), [['16:9', () => { SET.hud = '16:9'; act.resize(); }, SET.hud === '16:9'], ['21:9', () => { SET.hud = '21:9'; act.resize(); }, SET.hud === '21:9'], [L('全宽', 'Full', '全幅'), () => { SET.hud = 'full'; act.resize(); }, SET.hud === 'full']]);
    // who plays the second girl: the AI, a second player (pad / keys), or nobody (she stays out: solo)
    row(L('2P 由谁来打', '2P is played by', '2P の操作'), [[L('AI 代打', 'AI', 'AI'), () => act.setP2('ai'), SET.p2 === 'ai'], [L('手柄玩家', 'Gamepad', 'パッド'), () => act.setP2('pad'), SET.p2 === 'pad'], [L('键盘玩家 ←↑→↓', 'Keys ←↑→↓', 'キー ←↑→↓'), () => act.setP2('keys'), SET.p2 === 'keys'], [L('不上场（单人）', 'Nobody (solo)', '出撃しない（ソロ）'), () => act.setP2('off'), SET.p2 === 'off']]);
    // volumes: the total, then the music and the sound effects on their own (the middle button mutes / unmutes)
    const step = (key, d, apply) => { SET[key] = Math.max(0, Math.min(1, +(SET[key] + d).toFixed(1))); apply(); };
    const music = () => setMusicVolume(SET.bgmOn === false ? 0 : SET.bgm), effects = () => setSfxVolume(SET.sfxOn === false ? 0 : SET.sfx);
    row(L('总音量', 'Volume', '全体音量'), [['−', () => step('volume', -0.1, () => setVolume(SET.volume))], [`${Math.round(getVolume() * 100)}%`, () => setMuted(!isMuted()), !isMuted()], ['+', () => step('volume', 0.1, () => setVolume(SET.volume))]]);
    row(L('音乐', 'Music', 'BGM'), [['−', () => step('bgm', -0.1, music)], [`${Math.round(SET.bgm * 100)}%`, () => { SET.bgmOn = SET.bgmOn === false; music(); }, SET.bgmOn !== false], ['+', () => step('bgm', 0.1, music)]]);
    row(L('音效', 'Sound effects', '効果音'), [['−', () => step('sfx', -0.1, effects)], [`${Math.round(SET.sfx * 100)}%`, () => { SET.sfxOn = SET.sfxOn === false; effects(); }, SET.sfxOn !== false], ['+', () => step('sfx', 0.1, effects)]]);
    row(L('语言', 'Language', '言語'), LANGS.map(([k, n]) => [n, () => setLang(k), k === lang]));
    row('', [[L('▶ 继续', '▶ Resume', '▶ 再開'), close], ...(G.game ? [[L('放弃本话 · 回选关', 'Quit to chapters', '章選択へ戻る'), () => { close(); act.select(); }]] : []), [L('回到标题', 'Title', 'タイトル'), () => { close(); act.title(); }], [L('调试', 'Debug', 'デバッグ'), () => { close(); act.debug(); }]]);
    const info = document.createElement('div'); info.className = 'sinfo';
    info.textContent = L(
      '鼠标：按住左键探身射击，松开躲掩体，右键必杀 ｜ 手柄：摇杆瞄准，RT/A 射击，LT/LB 掩体，Y/RB 必杀，START 加入2P ｜ 2P键盘：方向键瞄准，Enter 射击，右Shift 掩体，Backspace 必杀',
      'Mouse: hold LMB to lean out and fire, release to hide, RMB skill | Pad: stick aim, RT/A fire, LT/LB cover, Y/RB skill, START joins as 2P | 2P keys: arrows aim, Enter fire, Right Shift cover, Backspace skill',
      'マウス：左押しで射撃、離すとカバー、右で必殺 ｜ パッド：スティック照準、RT/A 射撃、LT/LB カバー、Y/RB 必殺、START で2P参加');
    panel.appendChild(info);
  }
  const open = () => { render(); panel.classList.remove('hidden'); G.paused = true; };
  function close() { panel.classList.add('hidden'); G.paused = false; }
  document.addEventListener('fullscreenchange', () => { if (!panel.classList.contains('hidden')) render(); act.resize(); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (panel.classList.contains('hidden')) open(); else close(); }
    if ((e.key === 'Enter' && e.altKey) || e.key === 'F11') { e.preventDefault(); toggleFullscreen(); }
  });
  return { open, close, toggle: () => (panel.classList.contains('hidden') ? open() : close()), isOpen: () => !panel.classList.contains('hidden') };
}
