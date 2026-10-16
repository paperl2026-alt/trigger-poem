// Backpack items: bought once with 刀盾, then usable forever. Each has a cost; the backpack's capacity limits the loadout.
// They are plain stat modifiers applied to both girls (the team shares one backpack).
export const ITEMS = [
  { id: 'charm',   icon: 'item/charm',   cost: 3, price: 400, name: { zh: '备用护符', en: 'Spare Charm', ja: '予備のお守り' },        desc: { zh: '体力上限 +1 心', en: '+1 max heart', ja: '体力上限 +1' } },
  { id: 'loader',  icon: 'item/loader',  cost: 2, price: 300, name: { zh: '速装器', en: 'Speed Loader', ja: 'スピードローダー' },   desc: { zh: '装填时间 −20%', en: 'Reload −20%', ja: 'リロード −20%' } },
  { id: 'drum',    icon: 'item/drum',    cost: 2, price: 300, name: { zh: '大号弹鼓', en: 'Big Drum', ja: 'ドラムマガジン' },      desc: { zh: '弹匣 +25%', en: 'Magazine +25%', ja: '装弾数 +25%' } },
  { id: 'energy',  icon: 'item/energy',  cost: 3, price: 500, name: { zh: '能量饮料', en: 'Energy Drink', ja: 'エナドリ' },          desc: { zh: '主动技能充能 +25%', en: 'Skill charge +25%', ja: 'スキル充填 +25%' } },
  { id: 'anpan',   icon: 'item/anpan',   cost: 2, price: 350, name: { zh: '红豆面包', en: 'Anpan', ja: 'あんぱん' },               desc: { zh: 'Fever 衰减 −40%', en: 'Fever decays 40% slower', ja: 'フィーバー減衰 −40%' } },
  { id: 'cat',     icon: 'item/cat',     cost: 1, price: 600, name: { zh: '招财猫', en: 'Lucky Cat', ja: '招き猫' },                desc: { zh: '刀盾收入 +25%', en: '+25% 刀盾', ja: '刀盾 +25%' } },
  { id: 'armband', icon: 'item/armband', cost: 4, price: 800, name: { zh: '学生会臂章', en: 'Council Armband', ja: '生徒会の腕章' }, desc: { zh: 'Fever 三项从 1 级开始', en: 'Fever starts at Lv1', ja: 'フィーバー Lv1 から' } },
  { id: 'bandaid', icon: 'item/bandaid', cost: 2, price: 400, name: { zh: '爱心创可贴', en: 'Heart Band-aid', ja: 'ハートの絆創膏' },  desc: { zh: '每个小关结束回 1 心', en: 'Heal 1 heart after each stage', ja: 'ステージ毎に 1 回復' } },
];
export const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const bagCost = (bag) => bag.reduce((a, id) => a + (ITEM[id]?.cost || 0), 0);
export const bagHas = (bag, id) => bag.includes(id);
