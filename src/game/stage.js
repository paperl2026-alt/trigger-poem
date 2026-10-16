// Enemy types. beh = behaviour (walker: melee leaper / flyer: diver / thrower: ranged / crawler: ceiling pouncer).
// h = figure height (m). poise = stagger build-up needed to interrupt it (build-up drains when you stop hitting).
// frames = which sprite frames play each animation (sprites live at enemy/<sprite>_<frame>).
export const ENEMY = {
  // ---- episode 0: the cultural-festival haunted house gets out of hand
  zomb:     { beh: 'walker', sprite: 'zomb', hp: 80, h: 1.75, speed: 1.6, windup: 0.95, poise: 40, first: 'w0',
    frames: { idle: ['w0'], walk: ['w0', 'w1', 'w2', 'w3'], crouch: ['a0'], leap: ['a1'], bite: ['a2'], recoil: ['a3'], hurt: ['a3'] } },
  sheet:    { beh: 'flyer', sprite: 'sheet', hp: 26, h: 1.0, windup: 0.85, poise: 12, first: 'f0',
    frames: { fly: ['f0', 'f1', 'f2', 'f1'], windup: ['f0'], dive: ['f3'], hurt: ['f2'] } },
  lantern:  { beh: 'thrower', sprite: 'lantern', hp: 100, h: 1.6, windup: 1.0, poise: 50, first: 'p0', hides: false, proj: 'wisp',
    frames: { hide: ['p0'], rise: ['p0'], idle: ['p0'], windup: ['p1'], throw: ['p2'], hurt: ['p3'] } },
  umbrella: { beh: 'crawler', sprite: 'umbrella', hp: 45, h: 1.2, windup: 0.85, poise: 20, first: 'c0', drawnUpsideDown: true,
    frames: { crawl: ['c0', 'c1'], drop: ['d'], atk: ['a'], hurt: ['d'] } },
};
// projectile sprites: enemy/<key>; size in metres
export const PROJ = {
  wisp: { keys: ['wisp'], size: 0.7, spin: 3 },
  takoyaki: { keys: ['takoyaki'], size: 0.9, spin: -7 },
  balloon: { keys: ['balloon'], size: 1.0, spin: 1.5 },
};
export const HIT = 20; // HP a normal enemy hit takes (players have 100)
