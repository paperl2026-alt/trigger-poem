// The listening page (sound.html; 开始游戏.bat [6]): every BGM track (the loop the game plays, and every version ACE-Step made of it),
// every sound effect (each of its files), and the girls' lines, each with a play button. What the user picks is saved
// (saves/audition.json through the desktop build's save files, or localStorage in a browser) and tools/audition_apply.py applies it:
// the BGM version chosen, the sound files turned down (made again from the other versions), notes for Claude.
// The ACE-Step versions are read from art/raw (not in the game: served as /raw/ by the development build only).

const BASE = 'content/base/';
const USE = {
  ep0_stage: '序章 各小关', ep0_boss: '序章 Boss 战', ep1_stage: '第 1 话 各小关', ep1_boss: '第 1 话 Boss（腐蜜夫人）',
  ep2_inn: '第 2 话 民宿（停电前，平静）', ep2_night: '第 2 话 走廊入夜（念咒第二版）', ep2_she: '第 2 话 她出现时（追逐主题）', ep2_final: '第 2 话 钟楼表盘决战',
};
const EP2_LINES = ['sheSeen', 'runNow', 'hush', 'trapHit', 'grabbed', 'bell'];
const getJson = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);

let state = { bgm: {}, bgmNote: {}, sfx: {}, voice: {}, hitsNote: '', criesNote: {}, chantNote: {} };
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

// ---- the hits that play along (src/core/audio.js hitNote): the game's own sound code, over a track of the game, fired like a fight would
let gameAudio = null;
async function gameSound() {
  if (gameAudio) return gameAudio;
  const [A, K] = await Promise.all([import('./core/audio.js'), import('./core/content.js')]);
  const music = {};   // (the game's paths are from the pack folder)
  for (const [k, m] of Object.entries(S.music || {})) music[k] = { ...m, files: (m.files || []).map((f) => BASE + f) };
  const sfx = {};
  for (const [k, e] of Object.entries(S.sfx || {})) sfx[k] = { ...e, files: (e.files || []).map((f) => BASE + f) };
  K.C.sounds = { ...S, music, sfx, voices: {}, monsters: {} };
  A.initAudio(); A.setVolume(+vol.value);
  gameAudio = A; return A;
}
let fireT = 0;
function fire(who, secs, every, opt = {}) {
  clearInterval(fireT); const t0 = performance.now(); let n = 0;
  fireT = setInterval(() => {
    const t = (performance.now() - t0) / 1000;
    if (t > secs) { clearInterval(fireT); if (opt.kill !== false) gameAudio.hitNote(who, false, true, 0); return; }
    gameAudio.hitNote(who, Math.random() < (opt.crit ?? 0.12), opt.kills && ++n % opt.kills === 0, (Math.random() - 0.5) * 0.8);
  }, every);
}
function hitsTab() {
  const out = [el('div', { cls: 'help' }, '打上去的声音（卡通 / 街机风，tools/toy_sfx.py）：每打中一下一个玩具的短音，连着打就一下一下地响，像老游戏。地雷妹打中是泡泡「啵」，猫娘是木鱼「咚」，暴击是老虎机「叮叮」，打倒一只是金币「叮——」。先点一首 BGM，再点下面的按钮。')];
  const it1 = el('div', { cls: 'item', 'data-q': 'bgm' }, el('h3', {}, '先放一首 BGM'));
  const r1 = el('div', { cls: 'row' });
  for (const name of Object.keys(S.music || {})) r1.append(btn(`▶ ${name}`, async () => { const A = await gameSound(); A.playMusic(name); }));
  r1.append(btn('■ 停', async () => { const A = await gameSound(); A.stopMusic(0.3); clearInterval(fireT); }));
  it1.append(r1); out.push(it1);
  const it2 = el('div', { cls: 'item', 'data-q': 'hits' }, el('h3', {}, '打'));
  it2.append(el('div', { cls: 'row' },
    btn('地雷妹 连射 3 秒', async () => { await gameSound(); fire('pink', 3, 50); }),
    btn('猫娘 连射 3 秒', async () => { await gameSound(); fire('cat', 3, 300); }),
    btn('地雷妹 边打边杀', async () => { await gameSound(); fire('pink', 5, 50, { kills: 25 }); }),
    btn('猫娘 边打边杀', async () => { await gameSound(); fire('cat', 5, 300, { kills: 5 }); }),
    btn('暴击', async () => { const A = await gameSound(); A.hitNote('pink', true, false, 0); }),
    btn('击杀', async () => { const A = await gameSound(); A.hitNote('cat', false, true, 0); })));
  it2.append(el('div', { cls: 'row' }, note(state.hitsNote, (v) => { state.hitsNote = v; })));
  out.push(it2);
  return out;
}
// ---- the monster cries made from a speech voice (tools/monster_voice.py): a try-out with a stand-in voice, to choose the direction
async function criesTab() {
  const idx = await getJson('raw/monster_vo/_index.json');
  const out = [el('div', { cls: 'help' }, '怪叫：全部是女声变声（用户 2026-10-19：不要野兽、木头、男的、老的），声线「花音」（AivisHub 上 Aivis 官方的研究用试作模型，ACML 1.0，没有声优），每句是一小句话（2026-10-19 第二十三批：只念一个字 / 两个音节很怪）。四类：可爱又瘆人的少女、悄悄话少女、发条人偶少女（升调、卡顿、机械感）、凶一点的怪物少女；还有她的笑声、お蚕様的哀嚎。这里是全部出的版本，游戏里用的是每种挑出来的几个（音效栏 cry_ 开头的、sheLaugh、kaikoWail）。'),,
    idx ? null : el('b', {}, '（还没有试作：要用 开始游戏.bat 的 [6] 打开）')];
  const NAME = { girl: '少女（人偶、影子…）', paper: '悄悄话少女（纸人、试卷…）', wood: '发条人偶少女（课桌、画框、小芥子…）', beast: '怪物少女（丧尸、爬行的、拖鞋…）', she: '她', kaiko: 'お蚕様' },
    ACT = { windup: '蓄力', attack: '攻击', hurt: '挨打', die: '死', laugh: '笑', wail: '哀嚎' };
  for (const [k, files] of Object.entries(idx || {})) {
    const [fam, act] = k.split('_'), it = el('div', { cls: 'item', 'data-q': k });
    it.append(el('h3', {}, `${NAME[fam] || fam}　${ACT[act] || act}`));
    const row = el('div', { cls: 'row' }); files.forEach((f, i) => row.append(btn(`▶ ${i + 1}`, (b) => play(`raw/monster_vo/${k}/${f}`, b)))); it.append(row);
    it.append(el('div', { cls: 'row' }, note(state.criesNote?.[k], (v) => { (state.criesNote || (state.criesNote = {}))[k] = v; })));
    out.push(it);
  }
  return out;
}
// ---- chanting BGM straight from ACE-Step (tools/bgm_chant.py)
async function chantTab() {
  const idx = await getJson('raw/bgm_ai/_chants.json');
  const out = [el('div', { cls: 'help' }, 'BGM 模型自己唱的念咒：只要女声、更快，歌词是整句（2026-10-19 第二十三批：两个音节的小块很怪；第一批唯一勉强合格的洗脑念咒歌就是整句唱的）：九字真言、急急如律令、「ときを きざめ はりの おと」、剪刀和钟的句子……。第一批、第二批留着对比；第三批三首每首两版。'),
    idx ? null : el('b', {}, '（还在生成，或者要用 开始游戏.bat 的 [6] 打开）')];
  const NAME = { hook: '洗脑念咒歌（第一批，勉强合格的那首）', hook2: '洗脑念咒歌 · 快一点（第二批，短词）', battle2: '念咒战斗曲（第二批，短词）', night2: '民宿夜里（第二批，短词）',
    hook3: '洗脑念咒歌 · 快一点、整句', battle3: '念咒战斗曲 · 女声、快、整句', night3: '民宿夜里 · 女声、悄悄地念整句' };
  for (const [name, files] of Object.entries(idx || {})) {
    const it = el('div', { cls: 'item', 'data-q': name }, el('h3', {}, NAME[name] || name));
    const row = el('div', { cls: 'row' }); files.forEach((f, i) => row.append(btn(`▶ 第 ${i + 1} 版`, (b) => play(`raw/bgm_ai/${f}`, b)))); it.append(row);
    it.append(el('div', { cls: 'row' }, note(state.chantNote?.[name], (v) => { (state.chantNote || (state.chantNote = {}))[name] = v; })));
    out.push(it);
  }
  return out;
}

// ---- the sound sandbox's setup (src/ui/sandbox.js plays it: index.html?sandbox): a place, the music, the monsters and how many, the
// beds, her; who plays. Saved as "sandbox" (the desktop build's save files, or localStorage)
async function sandboxTab() {
  const pack = await getJson(`${BASE}pack.json`);
  const sets = {}, enemies = await getJson(`${BASE}enemies.json`) || {};
  // the base pack and its level packs (docs/TECH.md「关卡包」): every chapter's places and its own monsters
  const dirs = [['', pack], ...await Promise.all((pack?.levels || []).map(async (l) => [`${l}/`, await getJson(`${BASE}${l}/level.json`)]))];
  for (const [dir, P] of dirs) {
    for (const f of P?.data?.sets || []) { const d = await getJson(BASE + dir + f); for (const [k, v] of Object.entries(d || {})) if (!k.startsWith('_') && v?.stations) sets[k] = { file: dir + f, v }; }
    if (dir) for (const f of P?.data?.enemies || []) Object.assign(enemies, await getJson(BASE + dir + f) || {});
  }
  let cfg = { set: 'ep2_hiroma', music: 'ep2_she', monsters: [], beds: [], she: '', auto: true, god: true, p2: 'ai', dark: true };
  try { const s = window.native?.read('sandbox')?.data || localStorage.getItem('sandbox'); if (s) cfg = { ...cfg, ...JSON.parse(s) }; } catch (e) { /* defaults */ }
  const saveCfg = () => { const s = JSON.stringify(cfg); try { if (window.native) window.native.write('sandbox', s); localStorage.setItem('sandbox', s); } catch (e) { /* the page still goes */ } };
  const sel = (opts, val, on) => { const s = el('select'); for (const [v, t] of opts) { const o = el('option', { value: v }, t); if (v === val) o.selected = true; s.append(o); } s.onchange = () => on(s.value); return s; };
  const out = [el('div', { cls: 'help' }, '自己搭一个场景来听：选地方、BGM、上哪些怪各几只、要不要她在场、环境声，点「开始」就进游戏打（怪打完会一直重新刷）。游戏里右上角是调音台：每组声音的量能实时拉、每种怪的叫声能单独点、能换 BGM、能写意见（和这里的意见存在一起）。')];
  const it1 = el('div', { cls: 'item' }, el('h3', {}, '地方和音乐'));
  const label = (k) => `${k}${sets[k].v.dark || /ep2_(hiroma|nakaniwa|kura|chika|shoro|kane)/.test(k) ? '' : ''}`;
  it1.append(el('div', { cls: 'row' }, '地方', sel(Object.keys(sets).map((k) => [k, label(k)]), cfg.set, (v) => { cfg.set = v; saveCfg(); }),
    'BGM', sel([['none', '没有（只有环境声）'], ['synth', '旧的合成音乐'], ...Object.keys(S.music || {}).map((k) => [k, `${k}　${USE[k] || ''}`])], cfg.music, (v) => { cfg.music = v; saveCfg(); })));
  const dark = el('label', {}, el('input', { type: 'checkbox' }), ' 停电后的样子（第 2 话前四个地方）'); dark.firstChild.checked = !!cfg.dark; dark.firstChild.onchange = () => { cfg.dark = dark.firstChild.checked; saveCfg(); };
  it1.append(el('div', { cls: 'row' }, dark));
  out.push(it1);
  const it2 = el('div', { cls: 'item' }, el('h3', {}, '上哪些怪（几只，0 = 不上）'));
  const row2 = el('div', { cls: 'row' });
  for (const [k, e] of Object.entries(enemies)) {
    if (k.startsWith('_') || !e?.sprite || k === 'she' || k === 'kaiko') continue;
    const m = cfg.monsters.find((x) => x.type === k) || { type: k, n: 0 };
    const n = el('input', { type: 'number', min: 0, max: 30, cls: 'num' }); n.value = m.n;
    const box = el('span', { cls: `mon${m.n ? ' on' : ''}` }, `${e.name?.zh || k}`, n);
    n.oninput = () => { const v = Math.max(0, Math.min(30, +n.value || 0)); cfg.monsters = cfg.monsters.filter((x) => x.type !== k); if (v) cfg.monsters.push({ type: k, n: v }); box.classList.toggle('on', !!v); saveCfg(); };
    row2.append(box);
  }
  it2.append(row2); out.push(it2);
  const it3 = el('div', { cls: 'item' }, el('h3', {}, '她和环境声'));
  it3.append(el('div', { cls: 'row' }, '她', sel([['', '不在'], ['a', '剪刀人偶（巡游）'], ['c', '千刃蜘蛛'], ['e', '空振袖'], ['kaiko', 'お蚕様']], cfg.she, (v) => { cfg.she = v; saveCfg(); })));
  const beds = el('div', { cls: 'row' }, '环境声');
  for (const [k, e] of Object.entries(S.sfx || {})) {
    if (!e.loop || !e.files?.length) continue;
    const c = el('label', { cls: 'mon' }, el('input', { type: 'checkbox' }), ` ${k}`); c.firstChild.checked = cfg.beds.includes(k);
    c.firstChild.onchange = () => { cfg.beds = cfg.beds.filter((x) => x !== k); if (c.firstChild.checked) cfg.beds.push(k); saveCfg(); };
    beds.append(c);
  }
  it3.append(beds); out.push(it3);
  const it4 = el('div', { cls: 'item' }, el('h3', {}, '谁来打'));
  const chk = (key, text) => { const c = el('label', { cls: 'mon' }, el('input', { type: 'checkbox' }), ` ${text}`); c.firstChild.checked = !!cfg[key]; c.firstChild.onchange = () => { cfg[key] = c.firstChild.checked; saveCfg(); }; return c; };
  it4.append(el('div', { cls: 'row' }, chk('auto', 'AI 替我打（不勾 = 我自己用鼠标打）'), chk('god', '不会死'), '2P', sel([['ai', 'AI'], ['off', '不要']], cfg.p2, (v) => { cfg.p2 = v; saveCfg(); })));
  out.push(it4);
  const go = el('button', { cls: 'go' }, '开始'); go.onclick = () => { saveCfg(); stopAll(); location.href = 'index.html?sandbox'; };
  out.push(el('div', { cls: 'row' }, go));
  return out;
}

let S = null, T = null, tab = localStorage.getItem('auditionTab') || 'sandbox';
async function render() {
  stopAll();
  const main = document.getElementById('main'); main.innerHTML = '';
  const parts = tab === 'sandbox' ? await sandboxTab() : tab === 'bgm' ? await bgmTab(S) : tab === 'sfx' ? sfxTab(S) : tab === 'voice' ? voiceTab(S, T) : tab === 'hits' ? hitsTab()
    : tab === 'cries' ? await criesTab() : await chantTab();
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
