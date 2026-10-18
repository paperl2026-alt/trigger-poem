// The out-of-run scenes (DOM): results, game over. (Title + settings: title.js; chapter select, team and bag: select.js)
import { url, meta } from '../core/assets.js';
import { sfx, voice } from '../core/audio.js';
import { t, tr } from '../core/i18n.js';
import { itemLevel, nextLevel, upgradeItem, itemDesc as fxDesc } from '../battle/items.js';
import { SAVE, levelProgress } from '../core/save.js';
import { C } from '../core/content.js';

const ui = () => document.getElementById('ui');
const h = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
const has = (k) => !!meta[k];
const img = (k) => (has(k) ? url(k) : '');
const tap = (el, fn) => { el.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); sfx.ui(); fn(e); }; };
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ------------------------------------------------------------------ Results
// No rating (DESIGN 场景结构 4「结算做简单的记录」): the clear time and the best one, each girl's 历战值 (a girl at the top level gets extra
// 伍德刀盾 instead), the 伍德刀盾 line by line counting up to the total, the new item and the bag, the new chapters.
// The results page (DESIGN「结算界面」): laid out like a manga magazine's table of contents, every part a row that repeats for as many
// things as there are (style.css .res8): the girls (thumbnail, level, by-line, 历战值 where the page number goes), the 特集 bar with one row
// per NEW item (only on the first clear; a levelled one can be upgraded right here), the numbers (each 伍德刀盾 multiplier under its
// item's name), the new chapters (only when they open).
// The same page when both girls went down (st.win false, user 2026-10-18: a full defeat is still settled): DOWN on the masthead, what the
// kills earned, and a retry from the checkpoint beside the way back. The cover: the chapter's own picture when it is won (res/cover_<ep>,
// else res/cover), one of the defeat pictures at random when it is lost (res/lose_<n>).
function coverKey(st) {
  if (st.win) return has(`res/cover_${st.ep}`) ? `res/cover_${st.ep}` : 'res/cover';
  const lose = Object.keys(meta).filter((k) => /^res\/lose_\d+$/.test(k));
  return lose.length ? lose[Math.floor(Math.random() * lose.length)] : 'res/cover';
}
export function showResults(st, onDone, onRetry) {
  const el = ui();
  el.innerHTML = '';
  const ep = C.episodes[st.ep], DD = t('dd');
  const [vol, ...rest] = tr(ep.title).split(/　| {2,}/), epName = rest.join(' ').trim();
  const team = [...new Set(st.team)].map((id) => C.characters[id]).filter(Boolean);
  const pst = (id) => st.players?.find((p) => p.id === id);
  const thumb = (key, fb) => `<div class="thumb${has(key) ? '' : ' old'}" style="background-image:url('${img(key) || img(fb)}')"></div>`;
  let d = 0.25;
  const at = (k = 0.1) => (d += k).toFixed(2);
  // the girls: one entry each
  const girls = team.map((c) => {
    const x = st.xp[c.id]; if (!x) return '';
    const up = x.after > x.before, p = pst(c.id), dd = at(0.14);
    const lead = x.top ? `Lv ${x.before}<span class="tag k">MAX</span>${t('maxBonus')} +${x.bonus} ${DD}`
      : `Lv ${x.before}${up ? ` → ${x.after}<span class="tag pop" style="--d:${(+dd + 0.3).toFixed(2)}">${t('lvUp')}</span>` : ''}`;
    const by = p ? `${t('kills')} ${p.kills}　${t('dealt')} ${p.dealt.toLocaleString()}　${t('acc')} ${Math.round(p.acc * 100)}%` : '';
    return `<div class="ent in" style="--d:${dd}">${thumb(`res/face_${c.id}`, `ui/chibi_${c.id}_17`)}<div class="ebody">
      <div class="lead">${lead}</div><div class="ttl">${tr(c.name)}</div>
      <div class="by"><span>${by}</span><i class="dots"></i><small>${t('warXp')}</small><b class="num">+${x.gain}</b></div></div></div>`;
  }).join('');
  // the new items (the first clear's reward); no 特集 at all without one
  const ids = (st.newItems || []).filter((id) => C.items[id]);
  const items = ids.map((id) => {
    const it = C.items[id], dd = at(0.1);
    return `<div class="it in" data-id="${id}" style="--d:${dd}"><div class="tw">${thumb(`res/item_${id}`, it.icon)}<span class="upw"></span></div><div class="ebody">
      <div class="lead"><span class="tag pop" style="--d:${(+dd + 0.25).toFixed(2)}">NEW!</span>${t('firstReward')}</div>
      <div class="ttl">${tr(it.name)}</div><div class="by"><span class="desc">${itemDesc(it)}</span><i class="dots"></i><b class="num lv">${it.grow ? `Lv ${itemLevel(id)}` : ''}</b></div></div></div>`;
  }).join('');
  // the numbers: the run on the left, the 伍德刀盾 on the right, the total under both, then the new chapters
  const ln = (k, v, cls = '') => `<div class="ln in ${cls}" style="--d:${at(0.06)}"><span>${k}</span><i class="dots"></i><b class="v">${v}</b></div>`;
  const left = [
    ln(t('kills'), st.kills), ln(t('combo'), st.combo), ln(t('acc'), `${Math.round(st.acc * 100)}%`),
    ...(st.unlocked || []).map((id) => ln(`<span class="tag pop" style="--d:${(d + 0.2).toFixed(2)}">${t('unlocked')}</span>`, tr(C.episodes[id].title))),
  ];
  const right = [
    ln(t(st.win ? 'clearReward' : 'lossReward'), `+${st.base}`), st.first ? ln(t('firstClear'), `+${st.first}`) : '', st.bonus ? ln(t('maxBonus'), `+${st.bonus}`) : '',
    ...(st.mulBy || []).map((m) => ln(tr(C.items[m.id].name), `×${m.dd.toFixed(2)}`)),
  ].filter(Boolean);
  const L = left.filter(Boolean), rows = [];
  for (let i = 0; i < Math.max(L.length, right.length); i++) rows.push(L[i] || '<div></div>', right[i] || '<div></div>');
  const tot = `<div class="ln tot wide in" style="--d:${at(0.1)}"><span>${DD}</span><i class="dots"></i><b class="v rnum">+0</b></div>`;
  const ck = coverKey(st), cover = has(ck) ? `<img src="${img(ck)}" draggable="false">` : '';
  const s = h(`<div class="screen res8"><div class="page">
    <div class="mast"><div class="logo">${st.win ? 'CLEAR<i>!!</i>' : 'DOWN<i>…</i>'}</div><div class="since">SINCE 2026<br>FOR GIRLS<br>&amp; MONSTERS</div>
      ${st.win ? `<div class="issue"><small>${t('clearTime')}</small><b>${fmtT(st.time)}</b><span>${t('best')} ${st.bestTime != null ? fmtT(st.bestTime) : '--:--'}${st.newRecord ? `<em class="tag pop" style="--d:0.6">${t('newRecord')}</em>` : ''}</span></div>` : `<div class="issue lost"><small>${t('over')}</small><b>${fmtT(st.time)}</b></div>`}
      <div class="vol"><b>${vol}</b><span>${epName}</span></div></div>
    <div class="vbar"><b>RESULT</b></div>
    <div class="cover tone">${cover}</div>
    <div class="main">
      ${girls}
      ${ids.length ? `<div class="feat in" style="--d:${at()}"><b>${t('feature')}</b><span>${t('itemsHead')}</span></div>
      <div class="items${ids.length >= 5 ? ' three' : ids.length >= 2 ? ' two' : ''}">${items}</div>` : ''}
      <div class="list">${rows.join('')}${tot}</div>
      <div class="foot"><span>${t('colophon')}</span>${onRetry ? `<button class="ok retry">${t('retry')}</button>` : ''}<button class="ok">${t('toSelect')}</button></div>
    </div>
  </div></div>`);
  el.appendChild(s);
  sfx.stamp();
  cheer(st.team[Math.random() < 0.5 || st.team.length < 2 ? 0 : 1], st.win ? 'win' : 'lose', 900);
  // the total counts up once its row is printed
  const num = s.querySelector('.rnum'), t0 = performance.now() + d * 1000 + 300, dur = 900;
  let tick = 0;
  const count = (now) => { const k = Math.min(1, Math.max(0, (now - t0) / dur)); num.textContent = `+${Math.round(st.dd * (1 - Math.pow(1 - k, 3))).toLocaleString()}`;
    if (k > 0 && k < 1 && now - tick > 70) { tick = now; sfx.count(); }
    if (k < 1 && num.isConnected) requestAnimationFrame(count); else if (k >= 1) sfx.stamp(); };
  requestAnimationFrame(count);
  // a levelled item: its upgrade tab on its row (the price in 伍德刀盾)
  const drawUp = (row) => {
    const id = row.dataset.id, it = C.items[id]; if (!it.grow) return;
    const nx = nextLevel(id), w = row.querySelector('.upw');
    row.querySelector('.lv').textContent = `Lv ${itemLevel(id)}`;
    row.querySelector('.desc').textContent = itemDesc(it);
    w.innerHTML = nx ? `<button class="up${SAVE.dd < nx.price ? ' poor' : ''}" title="Lv ${nx.lv} · ${nx.price.toLocaleString()} ${DD}">${t('upgrade')} <small>${nx.price.toLocaleString()}</small></button>` : '';
    const bt = w.querySelector('.up');
    if (bt) tap(bt, () => {
      if (upgradeItem(id)) { sfx.levelUp(); s.querySelectorAll('.it[data-id]').forEach(drawUp); }
      else { bt.classList.remove('shake'); void bt.offsetWidth; bt.classList.add('shake'); sfx.uiDeny(); }
    });
  };
  s.querySelectorAll('.it[data-id]').forEach(drawUp);
  tap(s.querySelector('.ok:not(.retry)'), () => { el.innerHTML = ''; onDone(); });
  if (onRetry) tap(s.querySelector('.retry'), () => { el.innerHTML = ''; onRetry(); });
}
// one of the team says something about how it went (text/stickers.json win / lose), a moment after the screen is up
function cheer(who, kind, wait) {
  const n = C.text.stickers?.heroines?.[who]?.[kind]?.lines?.length || 0;
  if (n) setTimeout(() => voice(who, kind, Math.floor(Math.random() * n), 0, 6), wait);
}
// an item's description with its current numbers ({dd} = its 伍德刀盾 multiplier at its level)
function itemDesc(it) { return fxDesc(it.id, itemLevel(it.id), tr); }

