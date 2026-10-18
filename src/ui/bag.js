// The school bag page (docs/DESIGN.md「书包」): the select screen's 书包 tab, over the team cards. Look A of art/raw/r52 (the user's pick:
// the select screen's own red / black / white language, items as tilted sticker cards); layout fixed by tools/rounds/bag_wireframe.py
// (content ui/select.json "bag", mockup px). Everything is drawn here (no Codex lettering):
//   the COST strip: the 20 slots (red = taken by what is equipped, white = free, dark = not bought yet), used / capacity, expand (+1, price)
//   the item grid (3 x 3 a page): each item's picture, its level, its cost (◆), E when equipped, the picked one red; ??? = not got yet
//   what is equipped now; the picked item's card: name, level, cost, effect now -> next level, its three paragraphs, E and upgrade
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
  const diamonds = (n) => '◆'.repeat(n);

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
      if (!it) { c.classList.add('s-empty'); c.innerHTML = ''; return; }
      const own = owned(it.id), on = SAVE.bag.includes(it.id);
      c.classList.toggle('s-pick', it.id === pick); c.classList.toggle('s-lockd', !own); c.classList.toggle('s-on', on);
      c.innerHTML = `<img src="${has(it.icon) ? url(it.icon) : ''}" draggable="false">`
        + (own && it.grow ? `<span class="s-lv">Lv${itemLevel(it.id)}</span>` : '')
        + `<span class="s-dots">${diamonds(it.cost)}</span>`
        + (on ? '<span class="s-e">E</span>' : '') + (!own ? '<span class="s-q">???</span>' : '');
      x.tap(c, (e) => { x.pop(c, e); sfx.ui(); pick = it.id; render(); });
    });
    pager.classList.toggle('s-none', pages < 2);
    pager.innerHTML = `<i class="s-pl"></i>${Array.from({ length: pages }, (_, i) => `<b class="${i === page ? 's-on' : ''}"></b>`).join('')}<i class="s-pr"></i>`;
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
    const lore = (it.lore || []).map((p) => `<p>${esc(tr(p))}</p>`).join('');
    let act2;
    if (!own && it.reward) act2 = `<button class="s-bup s-off"><b>${t('notYet')}</b></button>`;
    else if (!own) act2 = `<button class="s-bup s-buy${SAVE.dd < it.price ? ' s-off' : ''}"><b>${t('buy')}</b><small>${it.price.toLocaleString('en-US')} ${t('ddShort')}</small></button>`;
    else if (!nx) act2 = `<button class="s-bup s-off"><b>${t('lvMax')}</b></button>`;
    else act2 = `<button class="s-bup${SAVE.dd < nx.price ? ' s-off' : ''}"><b>${t('upgrade')} → Lv${nx.lv}</b><small>${nx.price.toLocaleString('en-US')} ${t('ddShort')}</small></button>`;
    card.innerHTML = `<div class="s-ch"><div class="s-ci">${has(it.icon) ? `<img src="${url(it.icon)}" draggable="false"${own ? '' : ' class="s-sil"'}>` : ''}</div>
        <div class="s-cn"><b>${esc(name)}</b><span>${own && it.grow ? `Lv ${lv} / ${itemMax(it.id)}` : own ? '' : t('notYet')}</span><em>${t('cost')} <i>${diamonds(it.cost)}</i></em></div></div>
      <div class="s-cfx">${own || !it.reward ? `<b>${esc(itemDesc(it.id, lv, tr))}</b>${nx ? `<small>${t('nextLv')} ${esc(itemDesc(it.id, nx.lv, tr))}</small>` : ''}` : `<b>${t('notYetHint')}</b>`}</div>
      <div class="s-lore">${own || !it.reward ? lore : ''}</div>
      <div class="s-btns"><button class="s-be${on ? ' s-on' : ''}${own ? '' : ' s-off'}"><i>E</i><b>${on ? t('unequip') : t('equip')}</b></button>${act2}</div>`;
    const [be, bu] = card.querySelectorAll('button');
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
