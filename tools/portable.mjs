// Finishes the portable build: images -> assets-data.js (data URIs), classic <script> tags, README, zip.
// usage: npm run portable
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist-portable');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/assets/manifest.json'), 'utf8'));
const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const files = {};
let bytes = 0;
for (const k of Object.keys(manifest)) {
  const src = manifest[k].src;
  if (files[src]) continue;
  const buf = fs.readFileSync(path.join(root, 'public', src));
  bytes += buf.length;
  files[src] = `data:${MIME[path.extname(src)] || 'application/octet-stream'};base64,${buf.toString('base64')}`;
}
fs.writeFileSync(path.join(out, 'assets-data.js'), `window.__NOA_ASSETS=${JSON.stringify({ manifest, files })};\n`);

let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
html = html.replace(/<script type="module" crossorigin src="\.\/game\.js"><\/script>/, '<script src="./assets-data.js"></script>\n  <script defer src="./game.js"></script>');
html = html.replace(/ crossorigin/g, '');
if (!html.includes('assets-data.js')) throw new Error('could not rewrite the game script tag');
fs.writeFileSync(path.join(out, 'index.html'), html);

fs.writeFileSync(path.join(out, 'README.txt'), [
  '相对希望少女们的扣击诗 — 便携版 / portable build',
  '',
  '双击 index.html 就能玩（Chrome / Edge / Firefox，离线可用，不需要装任何东西）。',
  'Double-click index.html to play (Chrome / Edge / Firefox, works offline, nothing to install).',
  '',
  '右上角 ⚙ 或按 ` 键：调试菜单（跳关、自动打、无敌、帧率、跳过漫画、作弊）。',
  'Top-right ⚙ or the ` key: debug menu (jump to stage, auto-play, god mode, FPS, skip comics, cheats).',
  '',
  '操作：按住鼠标/手指 = 探身攻击，松开 = 躲进掩体（自动装填）。1/2/3 或滚轮切武器。',
  'Controls: hold mouse/finger = lean out and attack, release = hide behind cover (reloads). 1/2/3 or wheel = weapons.',
  '',
].join('\r\n'));

const zip = path.join(root, 'trigger-poem-portable.zip');
fs.rmSync(zip, { force: true });
execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${out}\*' -DestinationPath '${zip}' -CompressionLevel Optimal"`, { stdio: 'inherit' });
const size = (p) => (fs.statSync(p).size / 1048576).toFixed(1) + ' MB';
console.log(`images embedded: ${Object.keys(files).length} (${(bytes / 1048576).toFixed(1)} MB)`);
console.log(`assets-data.js ${size(path.join(out, 'assets-data.js'))}, game.js ${size(path.join(out, 'game.js'))}, zip ${size(zip)}`);
