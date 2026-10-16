// UI text in three languages. Everything decorative (logo, sound effects) is baked into images.
const S = {
  start:      { zh: '点击开始', en: 'CLICK TO START', ja: 'クリックでスタート' },
  lang:       { zh: '语言', en: 'LANGUAGE', ja: '言語' },
  sound:      { zh: '声音', en: 'SOUND', ja: 'サウンド' },
  on:         { zh: '开', en: 'ON', ja: 'ON' },
  off:        { zh: '关', en: 'OFF', ja: 'OFF' },
  settings:   { zh: '设置', en: 'SETTINGS', ja: '設定' },
  quit:       { zh: '退出游戏', en: 'QUIT', ja: 'ゲーム終了' },
  skip:       { zh: '跳过 ▶▶', en: 'SKIP ▶▶', ja: 'スキップ ▶▶' },
  tapNext:    { zh: '点击继续', en: 'CLICK', ja: 'クリック' },
  reload:     { zh: '装填中', en: 'RELOADING', ja: 'リロード中' },
  clear:      { zh: '清场！', en: 'CLEAR!', ja: 'クリア！' },
  stageClear: { zh: '小关完成！', en: 'STAGE CLEAR!', ja: 'ステージクリア！' },
  invade:     { zh: '异变发生！', en: 'ANOMALY!', ja: '異変発生！' },
  hintFire:   { zh: '按住左键：探身射击', en: 'HOLD LEFT: LEAN OUT & FIRE', ja: '左ボタン長押し：射撃' },
  hintHide:   { zh: '松开：躲进掩体 · 自动装填', en: 'RELEASE: TAKE COVER · RELOAD', ja: '離す：カバー・リロード' },
  hintSkill:  { zh: '右键：必杀技！', en: 'RIGHT CLICK: SKILL!', ja: '右クリック：必殺技！' },
  hintPad:    { zh: 'RT 射击 · LT 躲避 · Y 必杀', en: 'RT fire · LT cover · Y skill', ja: 'RT 射撃・LT カバー・Y 必殺' },
  hintFever:  { zh: '一直打 → Fever 升级', en: 'KEEP SHOOTING → FEVER UP', ja: '撃ち続けて → フィーバー' },
  over:       { zh: '被异变吞没了……', en: 'SWALLOWED BY THE ANOMALY…', ja: '異変に呑まれた……' },
  retry:      { zh: '从检查点重来', en: 'RETRY FROM CHECKPOINT', ja: 'チェックポイントから' },
  toSelect:   { zh: '回到选关', en: 'BACK TO CHAPTERS', ja: '章選択へ' },
  title:      { zh: '回到标题', en: 'TITLE', ja: 'タイトルへ' },
  result:     { zh: '本话分镜', en: 'EPISODE STORYBOARD', ja: '今回の絵コンテ' },
  kills:      { zh: '击破', en: 'KILLS', ja: '撃破' },
  acc:        { zh: '命中率', en: 'ACCURACY', ja: '命中率' },
  combo:      { zh: '最大连击', en: 'MAX COMBO', ja: '最大コンボ' },
  time:       { zh: '用时', en: 'TIME', ja: 'タイム' },
  taken:      { zh: '受伤', en: 'DAMAGE TAKEN', ja: '被ダメージ' },
  rank:       { zh: '评价', en: 'RANK', ja: 'ランク' },
  dd:         { zh: '刀盾', en: '刀盾', ja: '刀盾' },
  firstClear: { zh: '首次通关', en: 'FIRST CLEAR', ja: '初クリア' },
  unlocked:   { zh: '新章节解锁！', en: 'NEW CHAPTER!', ja: '新章解放！' },
  mastery:    { zh: '熟练度', en: 'MASTERY', ja: '熟練度' },
  lvUp:       { zh: '升级！', en: 'LEVEL UP!', ja: 'レベルアップ！' },
  go:         { zh: '出发！', en: 'GO!', ja: '出発！' },
  team:       { zh: '队伍', en: 'TEAM', ja: 'チーム' },
  bag:        { zh: '书包', en: 'SCHOOL BAG', ja: 'カバン' },
  outfit:     { zh: '服装', en: 'OUTFIT', ja: '衣装' },
  base:       { zh: '制服', en: 'UNIFORM', ja: '制服' },
  limit:      { zh: '满破形态', en: 'LIMIT BREAK', ja: '限界突破' },
  needLv:     { zh: '熟练度满级解锁', en: 'Unlocks at max mastery', ja: '熟練度MAXで解放' },
  cap:        { zh: '容量', en: 'CAPACITY', ja: '容量' },
  bigger:     { zh: '扩容', en: 'EXPAND', ja: '拡張' },
  buy:        { zh: '购买', en: 'BUY', ja: '購入' },
  owned:      { zh: '已拥有', en: 'OWNED', ja: '所持' },
  full:       { zh: '装不下了', en: 'BAG FULL', ja: '入りきらない' },
  poor:       { zh: '刀盾不够', en: 'NOT ENOUGH 刀盾', ja: '刀盾が足りない' },
  locked:     { zh: '未解锁', en: 'LOCKED', ja: '未解放' },
  soon:       { zh: '制作中', en: 'IN PRODUCTION', ja: '制作中' },
  best:       { zh: '最佳', en: 'BEST', ja: 'ベスト' },
  swap:       { zh: '交换 1P/2P', en: 'SWAP 1P/2P', ja: '1P/2P 交代' },
  skill:      { zh: '主动', en: 'SKILL', ja: 'スキル' },
  cost:       { zh: '占用', en: 'COST', ja: 'コスト' },
  ai:         { zh: 'AI 队友', en: 'AI', ja: 'AI' },
  rotate:     { zh: '请横过来玩', en: 'Please rotate your device', ja: '横向きでプレイしてね' },
};
// Working title (the logo on the title screen is plain styled text, so renaming is a one-line change)
export const GAME_TITLE = {
  zh: { small: '相对希望少女们的', big: '扣击诗' },
  ja: { small: '相対希望少女たちの', big: '引鉄詩', ruby: 'トリガーポエム' },
  en: { small: 'GIRLS OF RELATIVE HOPE', big: 'TRIGGER POEM' },
};
// Fever meter labels (one glyph each, they sit in small badges)
export const FEVER_LABEL = {
  dmg: { zh: '力', en: 'DMG', ja: '威' },
  acc: { zh: '准', en: 'ACC', ja: '精' },
  combo: { zh: '连', en: 'CMB', ja: '連' },
};

const FONTS = {
  zh: '"ZCOOL QingKe HuangYou", "Dela Gothic One", "Microsoft YaHei", "PingFang SC", sans-serif',
  en: '"Dela Gothic One", "Arial Black", sans-serif',
  ja: '"Dela Gothic One", "Hiragino Sans", "Yu Gothic", sans-serif',
};

function detect() {
  try { const s = localStorage.getItem('noa.lang'); if (s && FONTS[s]) return s; } catch (e) { /* storage blocked */ }
  const l = (navigator.language || 'en').toLowerCase();
  return l.startsWith('zh') ? 'zh' : l.startsWith('ja') ? 'ja' : 'en';
}
export let lang = detect();
export function setLang(l) {
  lang = l;
  try { localStorage.setItem('noa.lang', l); } catch (e) { /* storage blocked */ }
  document.documentElement.lang = l === 'zh' ? 'zh-CN' : l;
  document.documentElement.style.setProperty('--font', FONTS[l]);
}
setLang(lang);
export const t = (k) => (S[k] ? S[k][lang] : k);
// translate a {zh, en, ja} object
export const tr = (o) => (o ? o[lang] ?? o.en ?? '' : '');
export const LANGS = [['zh', '中文'], ['en', 'EN'], ['ja', '日本語']];
