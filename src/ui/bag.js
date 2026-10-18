// The school bag page (docs/DESIGN.md「书包」): the select screen's 书包 tab, over the team cards. Look A of art/raw/r52 (the user's pick:
// the select screen's own red / black / white language, items as tilted sticker cards); layout fixed by tools/rounds/bag_wireframe.py
// (content ui/select.json "bag", mockup px). Everything is drawn here (no Codex lettering):
//   the COST strip: the 20 slots (red = taken by what is equipped, white = free, dark = not bought yet), used / capacity, expand (+1, price)
//   the item grid (3 x 3 a page): white sticker cards, each tilted, a black folder tab on its top edge and a hard black shadow; its picture,
//   its level, its cost (● dots), E when equipped, the picked one red; ??? = not got yet; the slots no item fills yet are blank cards
//   the pager (always there, like the mockup), what is equipped now; the picked item: its picture on a tilted red card, name / level /
//   effect now -> next on three bars, its three paragraphs in tabbed boxes (about / origin / whisper), upgrade and equip (shirt) buttons
import { url, meta } from '../core/assets.js';
import { sfx } from '../core/audio.js';
import { C, list } from '../core/content.js';
import { t, tr } from '../core/i18n.js';
import { SAVE } from '../core/save.js';
import { bagCost, capMax, capPrice, upgradeCap, itemLevel, itemMax, nextLevel, upgradeItem, buyItem, toggleEquip, itemDesc } from '../battle/items.js';

const has = (k) => !!(k && meta[k]);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// x: the select screen's helpers (el, box, px, RS, tap, pop, shake, fx, toDesign, boxOf, say), parent: its UI layer
export function mountBag(x, parent) {
  const L = C.ui.select.bag, G = L.grid, per = G.cols * G.rows;
  const root = x.el('div', 'bag none', parent);
  root.style.setProperty('--u', `${x.RS}px`);
  const part = (cls, b, tag = 'div') => { const n = x.el(tag, cls, root); x.box(n, b); return n; };
  part('bpanel', L.panel);
  // ---- COST
  const cost = part('bcost', L.cost);
  const costLab = part('bcostlab', L.costLabel);
  const pips = part('bpips', L.costPips);
  const pipEls = Array.from({ length: capMax() }, () => x.el('i', '', pips));
  const costNum = part('bcostnum', L.costNum);
  const up = part('bcostup btn', L.costUp); up.dataset.cur = 'hover';
  // ---- the grid, the pager, what is equipped
  const cells = Array.from({ length: per }, (_, i) => {
    const c = x.el('div', 'bcell btn', root);
    const r = Math.floor(i / G.cols), k = i % G.cols, X = G.x + k * (G.w + G.gap), Y = G.y + r * (G.h + G.gap);
    x.box(c, [X, Y, X + G.w, Y + G.h]); c.style.rotate = `${[-2, 1.5, -1, 2, -1.5, 1, -1, 2, -2][i % 9]}deg`;
    c.dataset.cur = 'hover';
    return c;
  });
  const pager = part('bpager', L.pager);
  const worn = part('bworn', L.worn);
  // ---- the card
  const card = part('bcard', L.detail);
  let page = 0, pick = null;
  const items = () => list('items').slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const owned = (id) => SAVE.items.includes(id);
  const dots = (n) => '●'.repeat(n);
  // the next level in a few characters: only the words of its description that change ("×1.23"), not the whole sentence again
  const delta = (now, next) => { const a = now.split(/\s+/), b = next.split(/\s+/); const d = b.filter((w, i) => w !== a[i]); return d.length && d.length < b.length ? d.join(' ') : next; };
  // a text that has to fit its box: smaller until it does (long English names, long paragraphs)
  const fit = (el, max, min) => { let f = max; el.style.fontSize = `calc(${f} * var(--u))`; while (f > min && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) { f -= 0.5; el.style.fontSize = `calc(${f} * var(--u))`; } };
  const SHIRT = '<svg viewBox="0 0 48 40"><path d="M16 2 L4 9 L9 19 L13 17 L13 38 L35 38 L35 17 L39 19 L44 9 L32 2 Q24 9 16 2 Z" fill="#fff"/><text x="24" y="31" text-anchor="middle" font-size="15" font-weight="900" font-style="italic" fill="#e0121e">E</text></svg>';
  const UP = '<svg viewBox="0 0 40 40"><path d="M20 3 L36 19 L28 19 L20 11 L12 19 L4 19 Z M20 18 L36 34 L28 34 L20 26 L12 34 L4 34 Z" fill="#fff"/></svg>';

  function render() {
    const all = items(), used = bagCost(SAVE.bag), cap = SAVE.cap, price = capPrice();
    if (!pick || !C.items[pick]) pick = (all.find((it) => owned(it.id)) || all[0])?.id || null;
    // COST
    costLab.textContent = t('cost');
    pipEls.forEach((p, i) => { p.className = i < used ? 's-used' : i < cap ? 's-free' : 's-lock'; });
    costNum.innerHTML = `<b>${used}</b><span>/${cap}</span>`;
    up.classList.toggle('s-off', price == null || SAVE.dd < price);
    up.innerHTML = price == null ? `<b>${t('capMax')}</b>` : `<b>${t('expand')} +1</b><small>${price.toLocaleString('en-US')} ${t('ddShort')}</small>`;
    // the grid
    const pages = Math.max(1, Math.ceil(all.length / per)); page = Math.min(page, pages - 1);
    cells.forEach((c, i) => {
      const it = all[page * per + i];
      c.className = x.pre('bcell btn');
      c.onpointerdown = null;
      if (!it) { c.classList.add('s-empty'); c.innerHTML = ''; return; }   // (a blank card: the grid always looks full, like the mockup)
      const own = owned(it.id), on = SAVE.bag.includes(it.id);
      c.classList.toggle('s-pick', it.id === pick); c.classList.toggle('s-lockd', !own); c.classList.toggle('s-on', on);
      c.innerHTML = `<img src="${has(it.icon) ? url(it.icon) : ''}" draggable="false">`
        + (own && it.grow ? `<span class="s-lv">Lv${itemLevel(it.id)}</span>` : '')
        + `<span class="s-dots">${dots(it.cost)}</span>`
        + (on ? '<span class="s-e">E</span>' : '') + (!own ? '<span class="s-q">???</span>' : '');
      x.tap(c, (e) => { x.pop(c, e); sfx.ui(); pick = it.id; render(); });
    });
    pager.innerHTML = `<i class="s-pl"></i><span>${Array.from({ length: pages }, (_, i) => `<b class="${i === page ? 's-on' : ''}"></b>`).join('')}</span><i class="s-pr"></i>`;
    const [pl, pr] = pager.querySelectorAll('i');
    if (pl) x.tap(pl, () => { if (page > 0) { page--; sfx.uiPage(); render(); } else sfx.uiDeny(); });
    if (pr) x.tap(pr, () => { if (page < pages - 1) { page++; sfx.uiPage(); render(); } else sfx.uiDeny(); });
    // equipped now
    worn.innerHTML = `<span class="s-wl">${t('equipped')}</span>` + Array.from({ length: L.wornSlots }, (_, i) => {
      const id = SAVE.bag[i], it = C.items[id];
      return `<i>${it && has(it.icon) ? `<img src="${url(it.icon)}" draggable="false">` : ''}</i>`;
    }).join('');
    // the card
    const it = C.items[pick];
    if (!it) { card.innerHTML = ''; return; }
    const own = owned(it.id), on = SAVE.bag.includes(it.id), lv = itemLevel(it.id), nx = own ? nextLevel(it.id) : null;
    const name = own || !it.reward ? tr(it.name) : '???';
    const tabs = t('loreTabs').split('|'), known = own || !it.reward;
    const lore = [0, 1, 2].map((i) => `<div class="s-box"><span class="s-tab">${esc(tabs[i] || '')}</span><p>${known && it.lore?.[i] ? esc(tr(it.lore[i])) : ''}</p></div>`).join('');
    let act2;
    if (!own && it.reward) act2 = `<button class="s-bup s-off">${UP}<b>${t('notYet')}</b></button>`;
    else if (!own) act2 = `<button class="s-bup s-buy${SAVE.dd < it.price ? ' s-off' : ''}">${UP}<b>${t('buy')}</b><small>${it.price.toLocaleString('en-US')} ${t('ddShort')}</small></button>`;
    else if (!nx) act2 = `<button class="s-bup s-off">${UP}<b>${t('lvMax')}</b></button>`;
    else act2 = `<button class="s-bup${SAVE.dd < nx.price ? ' s-off' : ''}">${UP}<b>${t('upgrade')} → Lv${nx.lv}</b><small>${nx.price.toLocaleString('en-US')} ${t('ddShort')}</small></button>`;
    // (the mockup: upgrade on the left, equip — a shirt — on the right)
    card.innerHTML = `<div class="s-ci">${has(it.icon) ? `<img src="${url(it.icon)}" draggable="false"${own ? '' : ' class="s-sil"'}>` : ''}</div>
      <b class="s-cname">${esc(name)}</b>
      <span class="s-clv">${own && it.grow ? `Lv ${lv} <small>/ ${itemMax(it.id)}</small>` : own ? '' : t('notYet')}</span>
      <i class="s-cdots">${dots(it.cost)}</i>
      <div class="s-cfx">${known ? `<b>${esc(itemDesc(it.id, lv, tr))}</b>${nx ? `<small>${t('nextLv')} ${esc(delta(itemDesc(it.id, lv, tr), itemDesc(it.id, nx.lv, tr)))}</small>` : ''}` : `<b>${t('notYetHint')}</b>`}</div>
      <div class="s-lore">${lore}</div>
      <div class="s-btns">${act2}<button class="s-be${on ? ' s-on' : ''}${own ? '' : ' s-off'}">${SHIRT}<b>${on ? t('unequip') : t('equip')}</b></button></div>`;
    fit(card.querySelector('.s-cname'), 24, 13); fit(card.querySelector('.s-cfx'), 17, 11);
    card.querySelectorAll('.s-box p').forEach((q) => fit(q, 14.5, 10.5));
    const bu = card.querySelector('.s-bup'), be = card.querySelector('.s-be');
    x.tap(be, (e) => {
      const r = toggleEquip(it.id);
      if (r === 'full') { x.shake(be); x.shake(cost); sfx.uiDeny(); flash(t('bagFull')); return; }
      if (r === 'locked') { x.shake(be); return; }
      x.pop(be, e); sfx.stamp(); render();
    });
    x.tap(bu, (e) => {
      const ok = !own ? buyItem(it.id) : upgradeItem(it.id);
      if (!ok) { x.shake(bu); return; }
      x.pop(bu, e); sfx.item(); render(); x.say();
    });
  }
  x.tap(up, (e) => { if (!upgradeCap()) { x.shake(up); sfx.uiDeny(); return; } x.pop(up, e); sfx.levelUp(); render(); x.say(); });
  // a short note over the COST strip (the bag is full)
  const note = x.el('div', 'bnote', root);
  function flash(m) {
    const [x0, y0, x1] = L.cost; Object.assign(note.style, { left: x.px((x0 + x1) / 2), top: x.px(y0 - 6) });
    note.textContent = m; note.classList.remove('s-pop'); void note.offsetWidth; note.classList.add('s-pop');
  }
  return {
    root,
    show(on) { root.classList.toggle('s-none', !on); if (on) render(); },
    render,
  };
}
