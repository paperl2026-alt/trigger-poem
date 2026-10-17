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

// ------------------------------------------------------------------ Results: the episode as an anime storyboard sheet
// The results (DESIGN 场景结构 4「结算做简单的记录」): no rating; the clear time and the best one, each girl's 历战值 going up (level ups;
// a girl at the top level gets extra 伍德刀盾 instead), the 伍德刀盾 earned line by line (clear, first clear, the top-level bonus, the bag's
// multipliers like the eldritch piggy bank) counting up to the total, a new item if the episode gave one, the piggy bank's upgrade.
export function showResults(st, onDone) {
  const el = ui();
  el.innerHTML = '';
  const ep = C.episodes[st.ep], DD = t('dd');
  const team = [...new Set(st.team)].map((id) => C.characters[id]).filter(Boolean);
  const face = (c) => { const k = `ui/chibi_${c.id}_${17}`; return has(k) ? img(k) : img(c.cam?.happy); };
  const girls = team.map((c, i) => {
    const x = st.xp[c.id]; if (!x) return '';
    const p0 = levelProgress(x.xp0 ?? x.xp - x.gain), p1 = levelProgress(x.xp), up = x.after > x.before;
    return `<div class="rg" style="--pc:${c.color};--d:${0.5 + i * 0.25}s"><img src="${face(c)}"><div class="rgi">
      <b>${tr(c.name)}</b><small>${t('warXp')} <em>+${x.gain}</em></small>
      <div class="rbar"><i style="--f0:${up ? 0 : p0.frac};--f1:${x.top ? 1 : p1.frac}"></i></div>
      <span class="rlv">Lv ${x.before}${up ? ` → <b>${x.after}</b>` : ''}</span>
      ${up ? `<em class="rup">${t('lvUp')}</em>` : ''}${x.top ? `<em class="rmax">${t('maxBonus')} +${x.bonus} ${DD}</em>` : ''}</div></div>`;
  }).join('');
  const lines = [[t('clear'), st.base], st.first ? [t('firstClear'), st.first] : null, st.bonus ? [t('maxBonus'), st.bonus] : null].filter(Boolean);
  const pig = C.items.pig, pigOwned = SAVE.items.includes('pig');
  const mulLine = st.mul && st.mul !== 1 ? `<div class="rl rmul"><span>${t('bagBonus') || 'BAG'}</span><b>×${st.mul.toFixed(2)}</b></div>` : '';
  const got = st.gotItem && C.items[st.gotItem] ? (() => { const it = C.items[st.gotItem]; return `<div class="rgot"><img src="${img(it.icon)}"><div><em>${t('gotItem')}</em><b>${tr(it.name)}</b><small>${itemDesc(it)}</small></div></div>`; })() : '';
  const s = h(`<div class="screen res7">
    <div class="rplate">
      <div class="rhead"><span class="rep">${tr(ep.title)}</span><b class="rclr">${st.win ? t('clear') : t('over')}</b></div>
      ${st.win ? `<div class="rtime"><small>${t('clearTime')}</small><b>${fmtT(st.time)}</b>${st.newRecord ? `<em class="rnew">${t('newRecord')}</em>` : ''}<span>${t('best')} ${st.bestTime != null ? fmtT(st.bestTime) : '--:--'}</span></div>` : ''}
      <div class="rgirls">${girls}</div>
      <div class="rdd">
        ${lines.map(([k, v], n) => `<div class="rl" style="--d:${1.2 + n * 0.2}s"><span>${k}</span><b>+${v}</b></div>`).join('')}
        ${mulLine}
        <div class="rtot"><span>${DD}</span><b class="rnum">+0</b><small>${t('dd')} ${SAVE.dd.toLocaleString()}</small></div>
      </div>
      ${got}
      ${pigOwned ? `<div class="rpig"></div>` : ''}
      ${st.unlocked?.length ? `<div class="runl">${t('unlocked')} <b>${st.unlocked.map((id) => tr(C.episodes[id].title)).join(' / ')}</b></div>` : ''}
      <button class="ok">${t('toSelect')} ▶</button>
    </div>
    <img class="rfig" src="${img(team[0]?.poses?.victory)}" draggable="false">
  </div>`);
  el.appendChild(s);
  sfx.stamp();
  // the total counts up
  const num = s.querySelector('.rnum'), t0 = performance.now() + 1700, dur = 900;
  const count = (now) => { const k = Math.min(1, Math.max(0, (now - t0) / dur)); num.textContent = `+${Math.round(st.dd * (1 - Math.pow(1 - k, 3))).toLocaleString()}`; if (k < 1 && num.isConnected) requestAnimationFrame(count); else if (k >= 1) sfx.slam && sfx.slam(); };
  requestAnimationFrame(count);
  // the piggy bank: its level, its multiplier, and an upgrade for its price
  const pigEl = s.querySelector('.rpig');
  const drawPig = () => {
    if (!pigEl || !pig) return;
    const lv = itemLevel('pig'), cur = pig.levels[lv - 1], nx = nextLevel('pig');
    pigEl.innerHTML = `<img src="${img(pig.icon)}"><div><b>${tr(pig.name)}</b> <span>Lv ${lv}</span><small>${itemDesc(pig, cur)}</small></div>` +
      (nx ? `<button class="up${SAVE.dd < nx.price ? ' poor' : ''}">${t('upgrade')} Lv ${nx.lv} ×${nx.dd}<small>${nx.price.toLocaleString()} ${DD}</small></button>` : '');
    const bt = pigEl.querySelector('.up');
    if (bt) tap(bt, () => { if (upgradeItem('pig')) { sfx.stamp(); drawPig(); s.querySelector('.rtot small').textContent = `${DD} ${SAVE.dd.toLocaleString()}`; } else { bt.classList.remove('shake'); void bt.offsetWidth; bt.classList.add('shake'); } });
  };
  drawPig();
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
