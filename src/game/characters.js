// Heroines. A character = one gun profile + one active skill that fits her (no passives).
// Art: every pose is drawn for the LEFT of the screen (rear view, attacking toward the right); as 2P (right side) it is mirrored.
// A new outfit (or the limit-break form) is a whole new pose pack under its own prefix, never part-swapped.
// Per pose, all in uv of the unmirrored sprite (v from the bottom):
//   muzzle  where shots leave        anchor  u of the body's centre line (she stands on it, not on her gun / paw)
//   soft    jiggle / sway regions [u, v, rx, ry, kind] (kinds in soft.js)
// size: { pose, h } = world height in metres of one reference pose; every other pose of the pack scales with it (same source scale).
import { levelOf, MAX_LV } from './save.js';
import { bagHas } from './items.js';

const POSES = (k) => ({
  cover: `${k}/cover`, peek: `${k}/peek`, taunt: `${k}/taunt`, aim: `${k}/aim`, aimOut: `${k}/aim_out`, recoil: `${k}/recoil`,
  hurt: `${k}/hurt`, down: `${k}/down`, reload: `${k}/reload`, run: `${k}/run`, runB: `${k}/run_b`, victory: `${k}/victory`,
  active: `${k}/active`, activeOut: `${k}/active_out`,
});
const CAM = (k) => ({ happy: `${k}/cam_happy`, scared: `${k}/cam_scared`, hype: `${k}/cam_hype`, hurt: `${k}/cam_hurt` });

export const CHARS = {
  // 物理净化流: fast, big magazine, light rounds that punch through; sustained fire on one target keeps stacking stagger.
  tsubaki: {
    id: 'tsubaki', color: '#ff5fa8', hex: 0xff5fa8, edge: [60, 20, 40],
    name: { zh: '椿', en: 'TSUBAKI', ja: 'ツバキ' },
    role: { zh: '物理净化', en: 'Purge Rifle', ja: '物理浄化' },
    blurb: { zh: '射速快、弹匣大、子弹穿透。一直打同一个敌人会不断叠硬直。', en: 'Fast, huge magazine, piercing rounds. Keep firing on one foe to stack stagger.', ja: '高連射・大容量・貫通弾。同じ敵を撃ち続けると怯みが溜まる。' },
    skill: { zh: '净化加特林：无限弹匣扫射，伤害射速提升，命中回血。靠命中充能。', en: 'Purge Gatling: endless belt, more damage and speed, hits heal. Charged by hits.', ja: '浄化ガトリング：弾切れなし、命中で回復。命中でチャージ。' },
    // the user's pink gunner (poses cut from their own sheet)
    poses: POSES('pink'), cam: CAM('pink'), cutin: 'pink/cutin', front: 'pink/front', back: 'pink/back',
    size: { pose: 'aim', h: 1.65 },
    anchor: { aim: 0.45, peek: 0.45, cover: 0.45, victory: 0.5 },
    muzzle: { aim: [0.92, 0.79], peek: [0.96, 0.77], recoil: [0.92, 0.79], aimOut: [0.92, 0.79], active: [0.92, 0.79], activeOut: [0.92, 0.79] },
    soft: {
      aim: [[0.34, 0.52, 0.07, 0.05, 'butt'], [0.45, 0.51, 0.07, 0.05, 'butt'], [0.22, 0.47, 0.15, 0.05, 'skirt'], [0.15, 0.68, 0.15, 0.15, 'hair'], [0.75, 0.6, 0.1, 0.12, 'hair']],
      cover: [[0.14, 0.33, 0.09, 0.07, 'butt'], [0.24, 0.37, 0.09, 0.06, 'butt'], [0.15, 0.27, 0.15, 0.05, 'skirt'], [0.12, 0.6, 0.12, 0.2, 'hair'], [0.85, 0.5, 0.12, 0.2, 'hair']],
      peek: [[0.33, 0.33, 0.08, 0.055, 'butt'], [0.44, 0.35, 0.08, 0.055, 'butt'], [0.22, 0.38, 0.12, 0.06, 'skirt'], [0.18, 0.55, 0.15, 0.2, 'hair']],
      victory: [[0.43, 0.7, 0.07, 0.045, 'chest'], [0.56, 0.7, 0.07, 0.045, 'chest'], [0.5, 0.45, 0.3, 0.05, 'skirt'], [0.12, 0.62, 0.12, 0.2, 'hair'], [0.86, 0.62, 0.1, 0.2, 'hair']],
    },
    weapon: { kind: 'rifle', rate: 0.075, dmg: 8, mag: 40, reload: 1.15, spread: 0.006, pierce: 1, stagger: 3, stun: 0.45, ramp: 0, sfx: 'smg', kick: 0.8, tracer: 0xff7ac0 },
    active: { kind: 'gatling', dur: 6, rate: 0.042, dmg: 1.5, stagger: 2.2, heal: 0.4, charge: { hit: 0.008 } },
  },
  // 灵能攻击流 (homage: the demon hand of a certain hell teacher): the hand fires the six-syllable mantra.
  kagura: {
    id: 'kagura', color: '#a66bff', hex: 0xa66bff, edge: [30, 12, 60],
    name: { zh: '神乐', en: 'KAGURA', ja: 'カグラ' },
    role: { zh: '灵能猫爪', en: 'Spirit Paw', ja: '霊能ネコの手' },
    blurb: { zh: '鬼手射出六字真言：单发重、杂鱼几发就倒；连续打同一目标伤害递增，硬直长。', en: 'The demon hand fires mantra syllables: heavy hits that ramp up on the same target, long stagger.', ja: '鬼の手から真言を放つ。一撃が重く、同じ相手には威力上昇。怯みが長い。' },
    skill: { zh: '真言镭射：贯穿一切的光束，准星变慢。松手躲回掩体会中断，按剩余时间回血。靠时间和击杀充能。', en: 'Mantra Beam: piercing beam, slow aim. Ducking into cover ends it and heals by the time left. Charged by time and kills.', ja: '真言レーザー：全てを貫く。カバーに戻ると中断、残り時間に応じて回復。時間と撃破でチャージ。' },
    // the user's cat-paw design (her five poses, drawn for the left side: the paw is her right arm, image-right)
    poses: POSES('neko'), cam: CAM('neko'), cutin: 'neko/cutin', front: 'neko/front', back: 'neko/back', glyph: 'jade',
    size: { pose: 'cover', h: 0.98 },
    anchor: { cover: 0.58, aim: 0.47, peek: 0.52, reload: 0.57, taunt: 0.55 },
    muzzle: { aim: [0.86, 0.82], peek: [0.92, 0.7], reload: [0.88, 0.72], recoil: [0.86, 0.82], aimOut: [0.86, 0.82], active: [0.86, 0.82], activeOut: [0.86, 0.82] },
    soft: {
      cover: [[0.45, 0.31, 0.09, 0.06, 'butt'], [0.6, 0.31, 0.09, 0.06, 'butt'], [0.4, 0.42, 0.22, 0.06, 'skirt'], [0.1, 0.3, 0.1, 0.08, 'tail'], [0.2, 0.15, 0.1, 0.07, 'tailtip'], [0.86, 0.95, 0.06, 0.05, 'ear']],
      aim: [[0.35, 0.33, 0.075, 0.055, 'butt'], [0.48, 0.33, 0.075, 0.055, 'butt'], [0.4, 0.41, 0.21, 0.05, 'skirt'], [0.2, 0.33, 0.1, 0.06, 'tail'], [0.1, 0.42, 0.08, 0.06, 'tailtip'], [0.6, 0.92, 0.05, 0.05, 'ear']],
      peek: [[0.35, 0.33, 0.08, 0.055, 'butt'], [0.49, 0.33, 0.08, 0.055, 'butt'], [0.38, 0.4, 0.2, 0.05, 'skirt'], [0.12, 0.35, 0.1, 0.06, 'tail'], [0.15, 0.21, 0.09, 0.07, 'tailtip'], [0.75, 0.93, 0.06, 0.05, 'ear']],
      reload: [[0.37, 0.31, 0.08, 0.055, 'butt'], [0.52, 0.31, 0.08, 0.055, 'butt'], [0.4, 0.4, 0.22, 0.05, 'skirt'], [0.1, 0.25, 0.09, 0.08, 'tail'], [0.2, 0.1, 0.1, 0.06, 'tailtip'], [0.77, 0.92, 0.06, 0.05, 'ear']],
      taunt: [[0.38, 0.3, 0.08, 0.055, 'butt'], [0.53, 0.29, 0.08, 0.055, 'butt'], [0.4, 0.38, 0.22, 0.05, 'skirt'], [0.08, 0.25, 0.08, 0.08, 'tail'], [0.17, 0.1, 0.1, 0.06, 'tailtip'], [0.8, 0.88, 0.05, 0.05, 'ear']],
    },
    weapon: { kind: 'mantra', rate: 0.2, dmg: 30, mag: 8, reload: 1.3, spread: 0.003, pierce: 0, stagger: 24, stun: 1.1, ramp: 0.15, rampMax: 6, sfx: 'mantra', kick: 1.4, tracer: 0xffd86a },
    active: { kind: 'beam', dur: 4.5, dps: 300, aim: 3.2, heal: 40, charge: { sec: 1 / 42, kill: 0.07 } },
  },
};
export const CHAR_IDS = Object.keys(CHARS);

// Final per-run stats: base gun + mastery + backpack.
export function buildStats(id, xp, bag) {
  const c = CHARS[id];
  const w = { ...c.weapon }, a = { ...c.active, charge: { ...c.active.charge } };
  const lv = levelOf(xp);
  w.dmg *= 1 + 0.03 * (lv - 1);
  w.reload *= 1 - 0.015 * (lv - 1);
  if (bagHas(bag, 'loader')) w.reload *= 0.8;
  if (bagHas(bag, 'drum')) w.mag = Math.round(w.mag * 1.25);
  const chargeMul = bagHas(bag, 'energy') ? 1.25 : 1;
  for (const k in a.charge) a.charge[k] *= chargeMul;
  return { w, a, lv, limit: lv >= MAX_LV, hp: 100 + (bagHas(bag, 'charm') ? 20 : 0) };
}
