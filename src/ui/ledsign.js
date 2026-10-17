// The tiny DODGE sign above the stage label (docs/DESIGN.md「攻击分三种」: lit while a hide belt is out). An LED dot-matrix strip that
// flicks through twelve looks and memes, zh / en / ja in turn (the looks are Codex's design sheets art/raw/r50; the game draws them
// itself, every letter and frame built from LED dots, no generated lettering).
const Y = '#ffd21a', R = '#ff2a2a', V = '#c45bff', A = '#ff9a1a', W = '#ffffff', C = '#38d8ff', P = '#ff4fa8';
export const SIGNS = [
  { text: '前方高能反应', col: Y, deco: 'checker' },
  { text: 'HIGH ENERGY AHEAD', col: R, deco: 'hazard' },
  { text: '前方高エネルギー反応', col: V, deco: 'corners' },
  { text: '战斗人员也请避离', col: A, deco: 'arrows' },
  { text: 'COMBATANTS EVACUATE TOO', col: W, deco: 'tape', col2: R },
  { text: '戦闘員も退避せよ', col: Y, deco: 'hazard' },
  { text: '这不是演习', col: A, deco: 'chev' },
  { text: 'THIS IS NOT A DRILL', col: R, deco: 'hazard', thin: true },
  { text: '全員退避!!', col: C, deco: 'arrows', col2: '#a86bff', bar: true },
  { text: '大招来袭 快躲', col: Y, deco: 'barrier' },
  { text: 'DUCK!! DUCK!!', col: P, deco: 'hearts' },
  { text: '伏せろ!!', col: R, deco: 'beacon' },
];
const ROWS = 18, TXT = 13, CELL = 6;
const FONT = (cjk) => `${cjk ? '' : 'bold '}${TXT}px ${cjk ? '"Microsoft YaHei", "Noto Sans SC"' : '"Arial Narrow", "Arial"'}, sans-serif`;
const HEART = ['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'];

// one sign as a canvas of glowing dots (and its width / height)
export function ledCanvas(d) {
  const cjk = /[^\x00-\x7f]/.test(d.text);
  const m = document.createElement('canvas').getContext('2d'); m.font = FONT(cjk);
  const tw = Math.ceil(m.measureText(d.text).width);
  const side = { checker: 14, hazard: d.thin ? 6 : 13, corners: 4, arrows: 15, tape: 3, chev: 15, barrier: 16, hearts: 13, beacon: 20 }[d.deco];
  const cols = tw + side * 2 + 6, mid = ROWS / 2;
  // the grid: one canvas pixel per LED
  const gc = document.createElement('canvas'); gc.width = cols; gc.height = ROWS;
  const g = gc.getContext('2d'); g.imageSmoothingEnabled = false;
  const dot = (x, y, c = d.col) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
  const border = (c = d.col, step = 2) => { for (let x = 0; x < cols; x += step) { dot(x, 0, c); dot(x, ROWS - 1, c); } };
  const ends = (f) => { for (let y = 1; y < ROWS - 1; y++) for (let x = 0; x < side; x++) { const c = f(x, y); if (c) { dot(1 + x, y, c); dot(cols - 2 - x, y, c); } } };
  const chevron = (x0, dir, c, rows = 9) => {   // a '<' (dir -1) or '>' (dir 1), two dots thick
    const h = (rows - 1) / 2;
    for (let k = 0; k < rows; k++) { const o = h - Math.abs(k - h), x = dir > 0 ? x0 + o : x0 + h - o, y = Math.round(mid - h + k - 0.5); dot(x, y, c); dot(x + 1, y, c); }
  };
  if (d.deco === 'checker') { border(); ends((x, y) => y > 1 && y < ROWS - 2 && ((Math.floor(x / 3) + Math.floor((y - 2) / 3)) % 2 === 0) ? d.col : null); }
  if (d.deco === 'hazard') { border(d.col, 1); ends((x, y) => ((x + y) % 8 < 4) ? d.col : null); }
  if (d.deco === 'corners') {
    for (let x = 0; x < cols; x += 2) { dot(x, 0); dot(x, ROWS - 1); }
    for (let y = 0; y < ROWS; y += 2) { dot(0, y); dot(cols - 1, y); }
    for (const [x, y] of [[2, 2], [cols - 4, 2], [2, ROWS - 4], [cols - 4, ROWS - 4]]) g.fillStyle = W, g.fillRect(x, y, 2, 2);
  }
  if (d.deco === 'arrows' || d.deco === 'chev') {
    border(d.col, 2);
    const c2 = d.col2 || d.col;
    for (let k = 0; k < 3; k++) { chevron(2 + k * 4, d.deco === 'chev' ? 1 : -1, c2, 9); chevron(cols - 13 + k * 4, 1, c2, 9); }
    if (d.deco === 'chev') for (let y = 1; y < ROWS - 1; y += 2) { dot(side, y); dot(cols - 1 - side, y); }
  }
  if (d.bar) for (let x = 0; x < cols; x++) dot(x, ROWS - 1, Math.floor(x / 3) % 2 ? d.col : d.col2);
  if (d.deco === 'tape') for (let x = 0; x < cols; x++) for (const y of [0, 1, ROWS - 2, ROWS - 1]) dot(x, y, (x + y) % 6 < 3 ? d.col : d.col2);
  if (d.deco === 'barrier') {
    ends((x, y) => ((x + y) % 10 < 5) ? d.col : null);
    for (let x = side + 1; x < cols - side - 1; x++) { dot(x, 1); dot(x, ROWS - 2); }
    for (let y = 1; y < ROWS - 1; y++) { dot(side + 1, y); dot(cols - side - 2, y); }
  }
  if (d.deco === 'hearts') {
    border(d.col, 2);
    HEART.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') { dot(3 + x, 5 + y); dot(cols - 12 + x, 5 + y); } }));
  }
  if (d.deco === 'beacon') {
    for (let x = 0; x < cols; x++) { dot(x, 0); dot(x, ROWS - 1); }
    for (const cx of [7, cols - 8]) for (let y = 0; y < ROWS; y++) for (let x = -7; x <= 7; x++) { const r = Math.hypot(x, y - mid + 0.5); if (r < 6) dot(cx + x, y, r < 2.5 ? W : d.col); }
    for (const y of [mid - 3, mid, mid + 3]) for (let k = 0; k < 6; k++) { dot(15 + k, Math.round(y)); dot(cols - 16 - k, Math.round(y)); }
  }
  // the words, snapped to whole LEDs
  const tg = document.createElement('canvas'); tg.width = cols; tg.height = ROWS;
  const t = tg.getContext('2d'); t.font = FONT(cjk); t.textBaseline = 'middle'; t.textAlign = 'center'; t.fillStyle = d.col;
  t.fillText(d.text, cols / 2, mid + (cjk ? 0.5 : 1));
  const td = t.getImageData(0, 0, cols, ROWS).data;
  const gd = g.getImageData(0, 0, cols, ROWS).data;
  // the dots: every LED drawn round, lit ones glowing, unlit ones faint
  const c = document.createElement('canvas'); c.width = cols * CELL; c.height = ROWS * CELL;
  const o = c.getContext('2d');
  o.fillStyle = 'rgba(10,4,8,0.88)'; o.fillRect(0, 0, c.width, c.height);
  o.fillStyle = d.col; o.globalAlpha = 0.1;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < cols; x++) { o.beginPath(); o.arc((x + 0.5) * CELL, (y + 0.5) * CELL, CELL * 0.36, 0, Math.PI * 2); o.fill(); }
  o.globalAlpha = 1;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < cols; x++) {
    const i = (y * cols + x) * 4;
    let rgb = null;
    if (td[i + 3] > 105) rgb = `rgb(${td[i]},${td[i + 1]},${td[i + 2]})`;
    else if (gd[i + 3] > 128) rgb = `rgb(${gd[i]},${gd[i + 1]},${gd[i + 2]})`;
    if (!rgb) continue;
    o.shadowColor = rgb; o.shadowBlur = CELL * 1.1; o.fillStyle = rgb;
    o.beginPath(); o.arc((x + 0.5) * CELL, (y + 0.5) * CELL, CELL * 0.42, 0, Math.PI * 2); o.fill();
  }
  return c;
}
