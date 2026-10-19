// The listening page (sound.html; 开始游戏.bat [6]): every BGM track (the loop the game plays, and every version ACE-Step made of it),
// every sound effect (each of its files), and the girls' lines, each with a play button. What the user picks is saved
// (saves/audition.json through the desktop build's save files, or localStorage in a browser) and tools/audition_apply.py applies it:
// the BGM version chosen, the sound files turned down (made again from the other versions), notes for Claude.
// The ACE-Step versions are read from art/raw (not in the game: served as /raw/ by the development build only).

const BASE = 'content/base/';
const USE = {
  ep0_stage: '序章 各小关', ep0_boss: '序章 Boss 战', ep1_stage: '第 1 话 各小关', ep1_boss: '第 1 话 Boss（腐蜜夫人）',
  ep2_inn: '第 2 话 民宿（停电前，平静）', ep2_she: '第 2 话 她出现时（追逐主题）', ep2_final: '第 2 话 钟楼表盘决战',
};
const EP2_LINES = ['sheSeen', 'runNow', 'hush', 'trapHit', 'grabbed', 'bell'];
const getJson = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);

let state = { bgm: {}, bgmNote: {}, sfx: {}, voice: {} };
try {
  const s = window.native?.read('audition')?.data || localStorage.getItem('audition');
  if (s) state = { ...state, ...JSON.parse(s) };
} catch (e) { /* a fresh start */ }
let saveT = 0;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    const s = JSON.stringify(state);
    try { if (window.native) window.native.write('audition', s); else localStorage.setItem('audition', s); } catch (e) { /* shown below */ }
    document.getElementById('saved').textContent = `已保存 ${new Date().toLocaleTimeString()}${window.native ? '（saves/audition.json）' : '（浏览器里）'}`;
  }, 300);
}

// ---- playing: one sound at a time (a new one stops the last)
const vol = document.getElementById('vol');
let cur = null, curBtn = null, actx = null, loopSrc = null;
function stopAll() {
  if (cur) { cur.pause(); cur = null; }
  if (loopSrc) { try { loopSrc.stop(); } catch (e) { /* over */ } loopSrc = null; }
  if (curBtn) curBtn.classList.remove('playing'); curBtn = null;
}
function play(url, btn) {
  const same = curBtn === btn; stopAll(); if (same) return;
  cur = new Audio(url); cur.volume = +vol.value; cur.play().catch(() => { btn.textContent += '（读不到）'; });
  curBtn = btn; btn.classList.add('playing'); cur.onended = () => { if (curBtn === btn) stopAll(); };
}
// the game's own loop of a track (loopStart / loopEnd as the game plays it); from = seconds to start at
const bufs = new Map();
async function playLoop(M, from, btn) {
  const same = curBtn === btn; stopAll(); if (same) return;
  actx = actx || new AudioContext();
  const url = BASE + M.files[0];
  if (!bufs.has(url)) bufs.set(url, await fetch(url).then((r) => r.arrayBuffer()).then((a) => actx.decodeAudioData(a)));
  const b = bufs.get(url), s = actx.createBufferSource(), g = actx.createGain();
  s.buffer = b; s.loop = true; s.loopStart = M.loopStart || 0; s.loopEnd = M.loopEnd || b.duration; g.gain.value = +vol.value;
  s.connect(g); g.connect(actx.destination); s.start(0, Math.max(0, Math.min(b.duration - 0.1, from)));
  loopSrc = s; curBtn = btn; btn.classList.add('playing');
}
vol.oninput = () => { if (cur) cur.volume = +vol.value; };

const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (k === 'on') for (const [ev, f] of Object.entries(v)) e.addEventListener(ev, f); else if (k === 'cls') e.className = v; else e.setAttribute(k, v);
  for (const k of kids) if (k != null) e.append(k);
  return e;
};
const btn = (label, f, cls = 'p') => { const b = el('button', { cls }, label); b.onclick = () => f(b); return b; };
const note = (val, set) => { const i = el('input', { cls: 'note', placeholder: '想说的（可以不写）' }); i.value = val || ''; i.oninput = () => { set(i.value); save(); }; return i; };

// ---- the three tabs
async function bgmTab(S) {
  const rep = await getJson('raw/bgm_ai/_look/pick_report.json');
  const out = [el('div', { cls: 'help' }, '每首：先听「游戏里的循环」（游戏里放的就是这个；「听接缝」从循环结尾前 6 秒放，听跳回开头时顺不顺）。下面是 ACE-Step 出的几个版本（强度越高越贴 Claude 写的曲谱），整首从头放；觉得哪版好就点「用这版」。都不行就在框里写想要什么样。',
    rep ? null : el('b', {}, '（读不到 art/raw 里的版本：要用 开始游戏.bat 的 [6] 打开）'))];
  for (const [name, M] of Object.entries(S.music || {})) {
    if (!M?.files) continue;
    const it = el('div', { cls: 'item', 'data-q': `${name} ${USE[name] || ''}` });
    it.append(el('h3', {}, name, el('small', {}, USE[name] || '')));
    it.append(el('div', { cls: 'row' }, btn('▶ 游戏里的循环', (b) => playLoop(M, 0, b)), btn('▶ 听接缝', (b) => playLoop(M, (M.loopEnd || 0) - 6, b)),
      el('span', { cls: 'tag' }, `现在用的：${state.bgm[name] || M.from || ''}`)));
    for (const [file, st] of Object.entries(rep?.[name]?.all || {})) {
      const k = (file.match(/_k([\d.]+)_/) || [])[1];
      const chosen = (state.bgm[name] || (M.from ? `${M.from}.wav` : '')) === file;
      const row = el('div', { cls: `cand${chosen ? ' cur' : ''}` });
      const use = btn(chosen ? '✓ 用这版' : '用这版', () => { state.bgm[name] = file; save(); render(); }, chosen ? 'p pick' : 'p');
      row.append(btn('▶ 整首', (b) => play(`raw/bgm_ai/${file}`, b)), el('span', { cls: 'tag' }, `强度 ${k}　分数 ${st.score}${st.fade ? '　结尾淡出' : ''}`), use);
      it.append(row);
    }
    it.append(el('div', { cls: 'row' }, note(state.bgmNote[name], (v) => { state.bgmNote[name] = v; })));
    out.push(it);
  }
  return out;
}
function sfxTab(S) {
  const out = [el('div', { cls: 'help' }, '每种音效的几个文件游戏里随机放。不好听的那个点它右边的「✕」划掉（会从别的版本里补一个），整种都不行就点「整种重做」并写想要什么声音。AI 出的（Stable Audio）在前面，下面是以前从魔王魂、OtoLogic 挑的。')];
  const keys = Object.keys(S.sfx || {}).filter((k) => S.sfx[k]?.files?.length).sort((a, b) => (S.sfx[b].src === 'ai') - (S.sfx[a].src === 'ai'));
  for (const key of keys) {
    const e = S.sfx[key], st = state.sfx[key] || (state.sfx[key] = { no: [], redo: false, note: '' });
    const it = el('div', { cls: `item${st.redo ? ' redo' : ''}`, 'data-q': `${key} ${e.when || ''} ${e.want || ''}` });
    it.append(el('h3', {}, key, el('small', {}, `${e.when || ''}　${e.src === 'ai' ? 'AI' : '素材库'}`)));
    if (e.want) it.append(el('div', { cls: 'want' }, `想要的：${e.want}`));
    const row = el('div', { cls: 'row' });
    e.files.forEach((f, i) => {
      const stem = e.from?.[i] || f, b = btn(`▶ ${i + 1}`, (bb) => play(BASE + f, bb));
      if (st.no.includes(stem)) b.classList.add('no');
      row.append(b);
      if (e.src === 'ai') row.append(btn('✕', (x) => { const j = st.no.indexOf(stem); if (j >= 0) st.no.splice(j, 1); else st.no.push(stem); b.classList.toggle('no', j < 0); x.classList.toggle('on', j < 0); save(); }, `t${st.no.includes(stem) ? ' on' : ''}`));
    });
    row.append(btn('整种重做', (x) => { st.redo = !st.redo; x.classList.toggle('on', st.redo); it.classList.toggle('redo', st.redo); save(); }, `t${st.redo ? ' on' : ''}`));
    it.append(row, el('div', { cls: 'row' }, note(st.note, (v) => { st.note = v; })));
    out.push(it);
  }
  return out;
}
function voiceTab(S, T) {
  const out = [el('div', { cls: 'help' }, '两人的台词，先列第 2 话新加的（她出现、快跑、躲着、机关砸中她、被抓、敲钟），其他的在下面展开。读得不对 / 口吻不对的点「不好」，写想怎么说。')];
  const H = T?.stickers?.heroines || {};
  for (const who of ['pink', 'cat']) {
    const lines = S.voices?.[who]?.lines || {}, kinds = Object.keys(H[who] || {});
    const block = (kind) => {
      const it = el('div', { cls: 'item', 'data-q': `${who} ${kind}` });
      it.append(el('h3', {}, `${who === 'pink' ? '地雷妹' : '猫娘'}　${kind}`));
      (H[who][kind]?.lines || []).forEach((L, i) => {
        const key = `${kind}_${i + 1}`, f = lines[key]; if (!f) return;
        const st = state.voice[`${who}/${key}`] || {};
        const row = el('div', { cls: 'row' }, btn(`▶ ${L.zh}　${L.ja}`, (b) => play(BASE + f, b)),
          btn('不好', (x) => { const s2 = state.voice[`${who}/${key}`] || (state.voice[`${who}/${key}`] = {}); s2.bad = !s2.bad; x.classList.toggle('on', s2.bad); save(); }, `t${st.bad ? ' on' : ''}`),
          note(st.note, (v) => { (state.voice[`${who}/${key}`] || (state.voice[`${who}/${key}`] = {})).note = v; }));
        it.append(row);
      });
      return it;
    };
    for (const k of EP2_LINES) if (kinds.includes(k)) out.push(block(k));
    const more = el('details', {}, el('summary', {}, `${who === 'pink' ? '地雷妹' : '猫娘'}的其他台词`));
    for (const k of kinds) if (!EP2_LINES.includes(k)) more.append(block(k));
    out.push(more);
  }
  return out;
}

let S = null, T = null, tab = localStorage.getItem('auditionTab') || 'bgm';
async function render() {
  stopAll();
  const main = document.getElementById('main'); main.innerHTML = '';
  const parts = tab === 'bgm' ? await bgmTab(S) : tab === 'sfx' ? sfxTab(S) : voiceTab(S, T);
  main.append(...parts.filter(Boolean));
  filter();
  for (const b of document.querySelectorAll('header .tabs button')) b.classList.toggle('on', b.dataset.tab === tab);
}
function filter() {
  const q = document.getElementById('q').value.trim().toLowerCase();
  for (const it of document.querySelectorAll('.item')) it.style.display = !q || (it.dataset.q || '').toLowerCase().includes(q) ? '' : 'none';
}
document.getElementById('q').oninput = filter;
for (const b of document.querySelectorAll('header .tabs button')) b.onclick = () => { tab = b.dataset.tab; localStorage.setItem('auditionTab', tab); render(); };
Promise.all([getJson(`${BASE}audio/sounds.json`), getJson(`${BASE}text/stickers.json`)]).then(([s, t]) => { S = s || {}; T = t; render(); });
