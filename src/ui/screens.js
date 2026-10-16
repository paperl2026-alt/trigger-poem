// The out-of-run scenes (DOM): Title (+ settings), Chapter select (+ team / outfit / school bag), results, game over.
// Chapter select reads like flipping through a colour manga: each episode is a chapter cover + a facing page.
import { url, meta } from '../core/assets.js';
import { sfx } from '../core/audio.js';
import { t, tr } from '../core/i18n.js';
import { bagCost } from '../battle/items.js';
import { SAVE, persist, levelProgress, nextCap, maxLv } from '../core/save.js';
import { C, list } from '../core/content.js';

const ui = () => document.getElementById('ui');
const h = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
const has = (k) => !!meta[k];
const img = (k) => (has(k) ? url(k) : '');
const tap = (el, fn) => { el.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); sfx.ui(); fn(e); }; };
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ------------------------------------------------------------------ Title (+ settings, same scene)
export function showTitle(onStart, act) {
  const el = ui();
  el.innerHTML = '';
  const art = has('ui/keyart') ? 'ui/keyart' : 'bg/fest_yard';
  const s = h(`<div class="screen title">
    <div class="tbg" style="background-image:url(${img(art)})"></div>
    <div class="tshade"></div>
    <div class="tlogo txt"></div>
    <div class="tstart"></div>
    <div class="topts"><button class="set"></button>${/Electron/.test(navigator.userAgent) ? '<button class="quit"></button>' : ''}</div>
    <div class="tver">build ${typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev'}</div>
  </div>`);
  el.appendChild(s);
  const start = s.querySelector('.tstart'), set = s.querySelector('.set'), quit = s.querySelector('.quit');
  const logo = s.querySelector('.tlogo');
  const refresh = () => {
    const T = tr(C.text.gameTitle);
    logo.innerHTML = `<small>${T.small}</small><b>${T.big}</b>${T.ruby ? `<i>${T.ruby}</i>` : ''}`;
    start.textContent = t('start'); set.textContent = `⚙ ${t('settings')}`; if (quit) quit.textContent = t('quit'); };
  refresh();
  s.refresh = refresh;
  tap(set, () => act.settings());
  if (quit) tap(quit, () => window.close());
  s.onpointerdown = (e) => { if (e.button !== 0) return; sfx.ui(); el.innerHTML = ''; onStart(); };
}

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
export function showResults(st, onDone) {
  const el = ui();
  el.innerHTML = '';
  const ep = C.episodes[st.ep];
  const panels = ['comic/t1', 'comic/t2', 'comic/t3', 'comic/t4'].map((k, i) => (has(k) ? k : ['comic/c1', 'comic/c2', 'comic/c4', 'comic/c7'][i]));
  const rows = [
    [t('kills'), st.kills], [t('acc'), `${Math.round(st.acc * 100)}%`], [t('combo'), st.combo], [t('time'), fmtT(st.time)],
  ];
  const team = st.team.map((id) => C.characters[id]);
  const s = h(`<div class="screen results sb">
    <div class="sheet">
      <div class="shead"><span class="ttl">${tr(ep.title)}</span><span class="kind">${t('result')}</span><span class="no">No. ${String(ep.no).padStart(3, '0')}</span></div>
      <div class="cols"><span>CUT</span><span>${t('result')}</span><span>ACTION</span><span>TIME</span></div>
      ${rows.map((r, i) => `<div class="cut" style="--d:${0.15 + i * 0.22}s"><span class="cn">${i + 1}</span>
        <span class="pic" style="background-image:url(${img(panels[i])})"></span>
        <span class="act"><small>${r[0]}</small><b>${r[1]}</b></span><span class="sec">${(2 + i * 1.5).toFixed(1)}″</span></div>`).join('')}
      <div class="hanko"><small>${t('rank')}</small><b>${st.rank || '-'}</b></div>
    </div>
    <div class="rew">
      <div class="dd"><span>刀盾</span><b>+${st.dd}</b>${st.firstClear ? `<em>${t('firstClear')} +300</em>` : ''}</div>
      ${team.map((c) => { const x = st.xp[c.id]; if (!x) return ''; const pr = levelProgress(x.xp); return `<div class="mx" style="--pc:${c.color}"><img src="${img(c.cam.happy)}"><div><b>${tr(c.name)}</b> Lv${pr.lv} <small>+${x.gain} XP</small>${x.after > x.before ? `<em>${t('lvUp')}</em>` : ''}<i style="--f:${pr.frac}"></i></div></div>`; }).join('')}
      ${st.unlocked.length ? `<div class="unl">${t('unlocked')}<br><b>${st.unlocked.map((id) => tr(C.episodes[id].title)).join('<br>')}</b></div>` : ''}
      <button class="ok">${t('toSelect')} ▶</button>
    </div>
    <img class="rfig" src="${img(team[0].poses.victory)}" draggable="false">
  </div>`);
  el.appendChild(s);
  sfx.stamp();
  setTimeout(() => sfx.slam && sfx.slam(), 1100);
  tap(s.querySelector('.ok'), () => { el.innerHTML = ''; onDone(); });
}

export function showGameOver(st, onRetry, onSelect) {
  const el = ui();
  el.innerHTML = '';
  const c = C.characters[st.team[0]];
  const s = h(`<div class="screen over">
    <img class="obust" src="${img(c.cam.hurt)}" draggable="false">
    <div class="otitle">${t('over')}</div>
    <div class="odd">刀盾 +${st.dd}</div>
    <div class="ostatic"></div>
    <div class="rbtns"><button class="retry">${t('retry')}</button><button class="home">${t('toSelect')}</button></div>
  </div>`);
  el.appendChild(s);
  tap(s.querySelector('.retry'), () => { el.innerHTML = ''; onRetry(); });
  tap(s.querySelector('.home'), () => { el.innerHTML = ''; onSelect(); });
}
