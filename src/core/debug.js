// Debug / test menu: the ` key or Settings → Debug. Jump to any stage, auto-play, god mode, FPS, skip comics,
// cheats. Toggles persist per browser. Opening the menu pauses the game.
import { sfx } from './audio.js';
import { SAVE, persist, resetSave, SAVE_VERSION } from './save.js';
import { storeStatus, hasFiles } from './store.js';

const KEY = 'noa.debug';
const DEF = { auto: false, god: false, fps: false, skip: false };
export const DBG = (() => { try { return { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { return { ...DEF }; } })();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DBG)); } catch (e) { /* storage blocked */ } };

export function mountDebug(G, act) {
  const fps = document.createElement('div');
  fps.id = 'dbg-fps';
  document.body.appendChild(fps);
  const panel = document.createElement('div');
  panel.id = 'dbg';
  panel.className = 'hidden';
  document.body.appendChild(panel);

  const row = (title, items) => {
    const r = document.createElement('div'); r.className = 'drow';
    const h = document.createElement('span'); h.textContent = title; r.appendChild(h);
    for (const [label, fn, on] of items) {
      const b = document.createElement('button');
      b.textContent = label;
      if (on) b.classList.add('on');
      b.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); sfx.ui(); fn(); render(); };
      r.appendChild(b);
    }
    panel.appendChild(r);
  };
  const toggle = (k) => () => { DBG[k] = !DBG[k]; save(); apply(); };
  const apply = () => { G.auto = DBG.auto; G.god = DBG.god; fps.style.display = DBG.fps ? 'block' : 'none'; act.setAuto && act.setAuto(); };
  const close = () => { panel.classList.add('hidden'); G.paused = false; };
  const go = (ep, step) => () => { close(); act.start(ep, step); };
  function render() {
    panel.innerHTML = '';
    const head = document.createElement('div'); head.className = 'dhead';
    head.innerHTML = `<b>DEBUG</b><small>${G.build || ''}</small>`;
    const x = document.createElement('button'); x.textContent = '✕ 继续 Resume'; x.onpointerdown = (e) => { e.stopPropagation(); close(); };
    head.appendChild(x);
    panel.appendChild(head);
    row('第0话 Ep0', [['开场 Intro', go('ep0', 0)], ['教室 Class', go('ep0', 1)], ['走廊 Hall', go('ep0', 2)], ['BOSS', go('ep0', 4)], ['结尾 End', go('ep0', 5)]]);
    row('场景 Scene', [['选关 Select', () => { close(); act.select(); }], ['标题 Title', () => { close(); act.title(); }]]);
    row('开关 Toggle', [['1P自动打 Auto', toggle('auto'), DBG.auto], ['无敌 God', toggle('god'), DBG.god], ['帧率 FPS', toggle('fps'), DBG.fps], ['跳过漫画 Skip comics', toggle('skip'), DBG.skip]]);
    const g = G.game;
    if (g) {
      row('作弊 Cheat', [
        ['清场 Kill all', () => act.killAll()],
        ['必杀充满 Skill', () => g.players.forEach((p) => { p.charge = 1; })],
        ['Fever MAX', () => g.players.forEach((p) => { for (const k in p.fever.v) p.fever.v[k] = 3.99; })],
        ['回血 Heal', () => g.players.forEach((p) => { p.hp = p.maxHp; })],
        ['Boss -25%', () => { if (g.boss && g.boss.alive) g.boss.damage(g.boss.maxHp * 0.25, 'gun', null); }],
        ['慢动作 Slow-mo', () => { G.slow = G.slow === 1 ? 0.25 : 1; }, G.slow !== 1],
      ]);
      const p2 = g.players[1];
      if (p2 && p2.ctrl && p2.ctrl.kind === 'ai') row('2P AI', [0.2, 0.5, 0.8].map((s) => [`skill ${s}`, () => { p2.ctrl.skill = s; }, p2.ctrl.skill === s]));
    }
    row('存档 Save', [[`刀盾 ${SAVE.dd}`, () => {}], ['+1000 刀盾', () => { SAVE.dd += 1000; persist(); }], ['熟练度 +500xp', () => { for (const c of Object.values(SAVE.chars)) c.xp += 500; persist(); }], ['重置存档 Reset', () => { resetSave(); }]]);
    // the save files (electron/store.cjs): each place, written or not, and the folder to open
    const st = storeStatus();
    row(`存档文件 v${SAVE_VERSION}`, [...st.map((x) => [`${x.ok === false ? '✗ ' : x.ok ? '✓ ' : '· '}${x.dir}`, () => {}, x.ok === true]),
      ...(hasFiles ? [['打开存档文件夹', () => window.native.open()]] : [])]);
    const info = document.createElement('div'); info.className = 'dinfo';
    info.textContent = '` 打开/关闭本菜单 · Esc 设置 · URL 参数: ?play&skip / ?ep=ep0&step=4 / ?select / &auto';
    panel.appendChild(info);
  }
  const open = () => { render(); panel.classList.remove('hidden'); G.paused = true; };
  window.addEventListener('keydown', (e) => { if (e.key === '`' || e.key === 'F1') { e.preventDefault(); if (panel.classList.contains('hidden')) open(); else close(); } });
  apply();
  let frames = 0, t0 = performance.now();
  return {
    open,
    frame() {
      frames++;
      const now = performance.now();
      if (now - t0 > 500) { fps.textContent = `${Math.round(frames * 1000 / (now - t0))} fps · ${G.W}×${G.H} @${G.dpr.toFixed(2)}x`; frames = 0; t0 = now; }
    },
  };
}
