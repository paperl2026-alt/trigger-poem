// The out-of-run scenes (DOM): Chapter select (+ team / outfit / school bag), results, game over. (Title + settings: title.js)
// Chapter select reads like flipping through a colour manga: each episode is a chapter cover + a facing page.
import { url, meta } from '../core/assets.js';
import { sfx } from '../core/audio.js';
import { t, tr } from '../core/i18n.js';
import { bagCost } from '../battle/items.js';
import { SAVE, persist, levelProgress, nextCap, maxLv, itemLevel, nextLevel, upgradeItem } from '../core/save.js';
import { C, list } from '../core/content.js';

const ui = () => document.getElementById('ui');
const h = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
const has = (k) => !!meta[k];
const img = (k) => (has(k) ? url(k) : '');
const tap = (el, fn) => { el.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); sfx.ui(); fn(e); }; };
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ------------------------------------------------------------------ Chapter select / team / bag
export function showSelect(act) {
  const el = ui();
  el.innerHTML = '';
  const eps = list('episodes');
  let idx = Math.max(0, eps.findIndex((e) => e.id === (SAVE.lastEp || 'ep0')));
  let tab = 'team';
  let note = '';
  const s = h(`<div class="screen select">
    <div class="sbg" style="background-image:url(${img('bg/clubroom')})"></div>
    <div class="stop"><button class="back">◀ ${t('title')}</button><div class="money"></div><button class="gear">⚙</button></div>
    <div class="book"><div class="pg l"></div><div class="pg r"></div><div class="spine"></div>
      <button class="flip prev">◀</button><button class="flip next">▶</button></div>
    <div class="side"><div class="tabs"><button data-t="team"></button><button data-t="bag"></button></div><div class="tabbody"></div><div class="note"></div></div>
  </div>`);
  el.appendChild(s);
  const L = s.querySelector('.pg.l'), R = s.querySelector('.pg.r'), book = s.querySelector('.book'), body = s.querySelector('.tabbody'), money = s.querySelector('.money'), noteEl = s.querySelector('.note');
  tap(s.querySelector('.back'), () => act.title());
  tap(s.querySelector('.gear'), () => act.settings());

  const epOpen = (e) => !e.teaser && !!SAVE.eps[e.id]?.open;
  function renderBook() {
    const e = eps[idx];
    const rec = SAVE.eps[e.id] || {};
    const open = epOpen(e);
    L.className = `pg l ${open ? '' : e.teaser ? 'teaser' : 'locked'}`;
    L.innerHTML = has(e.cover || '') ? `<div class="cover" style="background-image:url(${img(e.cover)})"></div>` : `<div class="cover blank"><span>${e.teaser ? '?' : open ? e.no : '🔒'}</span></div>`;
    L.insertAdjacentHTML('beforeend', `<div class="pno">${String(e.no * 2 + 1).padStart(2, '0')}</div>`);
    const stl = (e.steps || []).filter((st) => !st.comic).map((st, i) => `<li class="${st.boss ? 'boss' : ''}"><i><b>${st.boss ? '☠' : i + 1}</b></i>${tr(st.name)}</li>`).join('');
    R.innerHTML = `<div class="chap">CHAPTER ${e.no}</div><h2>${tr(e.title)}</h2><div class="sub">${tr(e.sub)}</div>
      ${e.blurb ? `<p class="blurb">${tr(e.blurb)}</p>` : ''}
      ${stl ? `<ol class="stl">${stl}</ol>` : ''}
      ${rec.best ? `<div class="best"><small>${t('best')}</small><b>${rec.best}</b></div>` : ''}
      ${open ? `<button class="go">${t('go')}</button>` : `<div class="lockmsg">${e.teaser ? t('soon') : t('locked')}</div>`}
      <div class="pno">${String(e.no * 2 + 2).padStart(2, '0')}</div>`;
    const go = R.querySelector('.go');
    if (go) tap(go, () => { SAVE.lastEp = e.id; persist(); act.play(e.id); });
    s.querySelector('.prev').disabled = idx === 0;
    s.querySelector('.next').disabled = idx === eps.length - 1;
  }
  // page turn: a copy of the right page swings over the spine while the new spread is drawn underneath
  function flip(dir) {
    const ni = idx + dir;
    if (ni < 0 || ni >= eps.length) return;
    const turn = (dir > 0 ? R : L).cloneNode(true);
    turn.classList.add('turn', dir > 0 ? 'fwd' : 'bwd');
    book.appendChild(turn);
    sfx.panel();
    idx = ni;
    renderBook();
    setTimeout(() => turn.remove(), 650);
  }
  tap(s.querySelector('.prev'), () => flip(-1));
  tap(s.querySelector('.next'), () => flip(1));
  s.flip = flip;

  function renderTeam() {
    body.innerHTML = '';
    const wrap = h('<div class="team"></div>');
    SAVE.team.forEach((id, slot) => {
      const c = C.characters[id], st = SAVE.chars[id], pr = levelProgress(st.xp);
      const card = h(`<div class="card" style="--pc:${c.color}">
        <div class="slot">${slot ? '2P / AI' : '1P'}</div>
        <img class="fig" src="${img(c.front)}" draggable="false">
        <div class="ci"><div class="cn"><b>${tr(c.name)}</b><span>${tr(c.role)}</span></div>
          <div class="lvl"><small>${t('mastery')}</small><b>Lv${pr.lv}${pr.lv >= maxLv() ? ' MAX' : ''}</b><i style="--f:${pr.frac}"></i></div>
          <p>${tr(c.blurb)}</p><p class="sk"><b>${t('skill')}</b> ${tr(c.skill)}</p>
          <div class="outfits"><button class="on">${t('base')}</button><button class="lock" title="${t('needLv')}">${t('limit')} 🔒</button></div>
        </div></div>`);
      wrap.appendChild(card);
    });
    body.appendChild(wrap);
    const sw = h(`<button class="swap">⇄ ${t('swap')}</button>`);
    tap(sw, () => { SAVE.team.reverse(); persist(); renderTeam(); });
    body.appendChild(sw);
  }
  function renderBag() {
    body.innerHTML = '';
    const used = bagCost(SAVE.bag);
    const nc = nextCap();
    const top = h(`<div class="cap"><span>${t('cap')}</span><div class="cells">${Array.from({ length: SAVE.cap }, (_, i) => `<i class="${i < used ? 'on' : ''}"></i>`).join('')}</div><b>${used}/${SAVE.cap}</b>
      ${nc ? `<button class="more">${t('bigger')} +1 <small>${nc[1]} 刀盾</small></button>` : ''}</div>`);
    body.appendChild(top);
    const more = top.querySelector('.more');
    if (more) tap(more, () => { if (SAVE.dd < nc[1]) { say(t('poor')); return; } SAVE.dd -= nc[1]; SAVE.cap = nc[0]; persist(); sfx.clear(); renderAll(); });
    const grid = h('<div class="items"></div>');
    for (const it of list('items')) {
      const own = SAVE.items.includes(it.id), on = SAVE.bag.includes(it.id);
      const icon = has(it.icon) ? `<img src="${img(it.icon)}" draggable="false">` : '<span class="noi">?</span>';
      const card = h(`<div class="item ${own ? 'own' : ''} ${on ? 'on' : ''}">${icon}
        <div class="iname">${tr(it.name)}</div><div class="idesc">${tr(it.desc)}</div>
        <div class="icost">${'◆'.repeat(it.cost)}</div>
        <div class="iprice">${own ? (on ? '✔' : '') : `${it.price} 刀盾`}</div></div>`);
      tap(card, () => {
        if (!own) {
          if (SAVE.dd < it.price) { say(t('poor')); return; }
          SAVE.dd -= it.price; SAVE.items.push(it.id); persist(); sfx.clear(); renderAll(); return;
        }
        if (on) SAVE.bag = SAVE.bag.filter((x) => x !== it.id);
        else if (bagCost(SAVE.bag) + it.cost > SAVE.cap) { say(t('full')); return; } else SAVE.bag.push(it.id);
        persist(); renderAll();
      });
      grid.appendChild(card);
    }
    body.appendChild(grid);
  }
  function say(m) { note = m; noteEl.textContent = m; noteEl.classList.remove('pop'); void noteEl.offsetWidth; noteEl.classList.add('pop'); sfx.miss(0); }
  function renderAll() {
    money.innerHTML = `<b>${SAVE.dd.toLocaleString()}</b><span>刀盾</span>`;
    s.querySelectorAll('.tabs button').forEach((b) => { b.textContent = t(b.dataset.t); b.classList.toggle('on', b.dataset.t === tab); });
    if (tab === 'team') renderTeam(); else renderBag();
    noteEl.textContent = note;
  }
  s.querySelectorAll('.tabs button').forEach((b) => tap(b, () => { tab = b.dataset.t; note = ''; renderAll(); }));
  renderBook();
  renderAll();
  // keyboard / pad: ←→ flip, Enter go
  s.go = () => { const go = R.querySelector('.go'); if (go) go.onpointerdown(new PointerEvent('pointerdown')); };
  return s;
}

// ------------------------------------------------------------------ Results
// No rating (DESIGN 场景结构 4「结算做简单的记录」): the clear time and the best one, each girl's 历战值 (a girl at the top level gets extra
// 伍德刀盾 instead), the 伍德刀盾 line by line counting up to the total, the new item and the bag, the new chapters.
// The results page (DESIGN「结算界面」): laid out like a manga magazine's table of contents, every part a row that repeats for as many
// things as there are (style.css .res8): the girls (thumbnail, level, by-line, 历战值 where the page number goes), the 特集 bar with one row
// per NEW item (only on the first clear; a levelled one can be upgraded right here), the numbers (each 伍德刀盾 multiplier under its
// item's name), the new chapters (only when they open).
export function showResults(st, onDone) {
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
      <div class="ttl">${tr(it.name)}</div><div class="by"><span class="desc">${itemDesc(it)}</span><i class="dots"></i><b class="num lv">${it.levels ? `Lv ${itemLevel(id)}` : ''}</b></div></div></div>`;
  }).join('');
  // the numbers: the run on the left, the 伍德刀盾 on the right, the total under both, then the new chapters
  const ln = (k, v, cls = '') => `<div class="ln in ${cls}" style="--d:${at(0.06)}"><span>${k}</span><i class="dots"></i><b class="v">${v}</b></div>`;
  const left = [
    ln(t('kills'), st.kills), ln(t('combo'), st.combo), ln(t('acc'), `${Math.round(st.acc * 100)}%`),
    ...(st.unlocked || []).map((id) => ln(`<span class="tag pop" style="--d:${(d + 0.2).toFixed(2)}">${t('unlocked')}</span>`, tr(C.episodes[id].title))),
  ];
  const right = [
    ln(t('clearReward'), `+${st.base}`), st.first ? ln(t('firstClear'), `+${st.first}`) : '', st.bonus ? ln(t('maxBonus'), `+${st.bonus}`) : '',
    ...(st.mulBy || []).map((m) => ln(tr(C.items[m.id].name), `×${m.dd.toFixed(2)}`)),
  ].filter(Boolean);
  const L = left.filter(Boolean), rows = [];
  for (let i = 0; i < Math.max(L.length, right.length); i++) rows.push(L[i] || '<div></div>', right[i] || '<div></div>');
  const tot = `<div class="ln tot wide in" style="--d:${at(0.1)}"><span>${DD}</span><i class="dots"></i><b class="v rnum">+0</b></div>`;
  const cover = has('res/cover') ? `<img src="${img('res/cover')}" draggable="false">` : '';
  const s = h(`<div class="screen res8"><div class="page">
    <div class="mast"><div class="logo">${st.win ? 'CLEAR<i>!!</i>' : t('over')}</div><div class="since">SINCE 2026<br>FOR GIRLS<br>&amp; MONSTERS</div>
      ${st.win ? `<div class="issue"><small>${t('clearTime')}</small><b>${fmtT(st.time)}</b><span>${t('best')} ${st.bestTime != null ? fmtT(st.bestTime) : '--:--'}${st.newRecord ? `<em class="tag pop" style="--d:0.6">${t('newRecord')}</em>` : ''}</span></div>` : ''}
      <div class="vol"><b>${vol}</b><span>${epName}</span></div></div>
    <div class="vbar"><b>RESULT</b></div>
    <div class="cover tone">${cover}</div>
    <div class="main">
      ${girls}
      ${ids.length ? `<div class="feat in" style="--d:${at()}"><b>${t('feature')}</b><span>${t('itemsHead')}</span></div>
      <div class="items${ids.length >= 5 ? ' three' : ids.length >= 2 ? ' two' : ''}">${items}</div>` : ''}
      <div class="list">${rows.join('')}${tot}</div>
      <div class="foot"><span>${t('colophon')}</span><button class="ok">${t('toSelect')}</button></div>
    </div>
  </div></div>`);
  el.appendChild(s);
  sfx.stamp();
  // the total counts up once its row is printed
  const num = s.querySelector('.rnum'), t0 = performance.now() + d * 1000 + 300, dur = 900;
  const count = (now) => { const k = Math.min(1, Math.max(0, (now - t0) / dur)); num.textContent = `+${Math.round(st.dd * (1 - Math.pow(1 - k, 3))).toLocaleString()}`; if (k < 1 && num.isConnected) requestAnimationFrame(count); else if (k >= 1) sfx.slam && sfx.slam(); };
  requestAnimationFrame(count);
  // a levelled item: its upgrade tab on its row (the price in 伍德刀盾)
  const drawUp = (row) => {
    const id = row.dataset.id, it = C.items[id]; if (!it.levels) return;
    const nx = nextLevel(id), w = row.querySelector('.upw');
    row.querySelector('.lv').textContent = `Lv ${itemLevel(id)}`;
    row.querySelector('.desc').textContent = itemDesc(it);
    w.innerHTML = nx ? `<button class="up${SAVE.dd < nx.price ? ' poor' : ''}" title="Lv ${nx.lv} · ${nx.price.toLocaleString()} ${DD}">${t('upgrade')} <small>${nx.price.toLocaleString()}</small></button>` : '';
    const bt = w.querySelector('.up');
    if (bt) tap(bt, () => {
      if (upgradeItem(id)) { sfx.stamp(); s.querySelectorAll('.it[data-id]').forEach(drawUp); }
      else { bt.classList.remove('shake'); void bt.offsetWidth; bt.classList.add('shake'); }
    });
  };
  s.querySelectorAll('.it[data-id]').forEach(drawUp);
  tap(s.querySelector('.ok'), () => { el.innerHTML = ''; onDone(); });
}
// an item's description with its current numbers ({dd} = its 伍德刀盾 multiplier at its level)
function itemDesc(it, lv) { const v = lv || (it.levels ? it.levels[itemLevel(it.id) - 1] : it.effects) || {}; return tr(it.desc).replace('{dd}', v.dd ?? ''); }

export function showGameOver(st, onRetry, onSelect) {
  const el = ui();
  el.innerHTML = '';
  const c = C.characters[st.team[0]];
  const s = h(`<div class="screen over">
    <img class="obust" src="${img(c.cam.hurt)}" draggable="false">
    <div class="otitle">${t('over')}</div>
    <div class="odd">${t('dd')} +${st.dd}</div>
    <div class="ostatic"></div>
    <div class="rbtns"><button class="retry">${t('retry')}</button><button class="home">${t('toSelect')}</button></div>
  </div>`);
  el.appendChild(s);
  tap(s.querySelector('.retry'), () => { el.innerHTML = ''; onRetry(); });
  tap(s.querySelector('.home'), () => { el.innerHTML = ''; onSelect(); });
}
