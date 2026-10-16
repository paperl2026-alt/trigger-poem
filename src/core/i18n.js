// UI text in three languages. Everything decorative (logo, sound effects) is baked into images.
import { C } from './content.js';

// all strings live in the content packs: text/ui.json (ui = keyed sentences, gameTitle, feverLabel, feverName)
export const LANGS = [['zh', '中文'], ['en', 'EN'], ['ja', '日本語']];
const CODES = LANGS.map(([k]) => k);

function detect() {
  try { const s = localStorage.getItem('noa.lang'); if (s && CODES.includes(s)) return s; } catch (e) { /* storage blocked */ }
  const l = (navigator.language || 'en').toLowerCase();
  return l.startsWith('zh') ? 'zh' : l.startsWith('ja') ? 'ja' : 'en';
}
export let lang = detect();
export function setLang(l) {
  lang = l;
  try { localStorage.setItem('noa.lang', l); } catch (e) { /* storage blocked */ }
  document.documentElement.lang = l === 'zh' ? 'zh-CN' : l;
  const fonts = C.theme.fonts;
  if (fonts && fonts[l]) document.documentElement.style.setProperty('--font', fonts[l]);
}
export const initLang = () => setLang(lang);   // after the content packs are loaded
export const t = (k) => { const s = C.text.ui && C.text.ui[k]; return s ? s[lang] ?? s.en : k; };
// translate a {zh, en, ja} object
export const tr = (o) => (o ? o[lang] ?? o.en ?? '' : '');
