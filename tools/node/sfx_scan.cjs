// Looks at a folder of sound files so Claude can choose by eye (docs/ART.md「声音」): decodes each one with Chromium (Electron, offscreen),
// measures it, and draws contact sheets: one row per file, its waveform coloured by brightness (blue = dull / low, yellow = bright / high).
// Writes <out>.json ({ file: { dur, attack, peak, rms, tail, bright } }) and <out>_<n>.png (48 rows a sheet).
//   dur: seconds of sound (leading / trailing silence cut); attack: seconds from the first sound to the loudest point; tail: seconds
//   from the loudest point until it falls under 10 %; bright: zero crossings a second / 1000 (rough brightness); rms: loudness 0..1
// usage: electron tools/node/sfx_scan.cjs <folder> <out base path>   (mp3 / ogg / wav / m4a, sub folders included)
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const [dir, out] = process.argv.slice(2).filter((a) => !a.startsWith('--') && !a.endsWith('sfx_scan.cjs') && a !== '.');
const EXT = /\.(mp3|ogg|wav|m4a)$/i;
function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : EXT.test(e.name) ? [path.join(d, e.name)] : [])); }

const PAGE = `<html><body><script>
window.scan = async (b64, name) => {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
  const ctx = new OfflineAudioContext(1, 44100, 44100);
  let b; try { b = await ctx.decodeAudioData(bytes); } catch (e) { return { err: String(e) }; }
  const sr = b.sampleRate, n = b.length, d = new Float32Array(n);
  for (let c = 0; c < b.numberOfChannels; c++) { const x = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] += x[i] / b.numberOfChannels; }
  let peak = 0, pi = 0, s0 = -1, s1 = 0;
  for (let i = 0; i < n; i++) { const v = Math.abs(d[i]); if (v > peak) { peak = v; pi = i; } }
  const th = Math.max(0.005, peak * 0.02);
  for (let i = 0; i < n; i++) if (Math.abs(d[i]) > th) { if (s0 < 0) s0 = i; s1 = i; }
  if (s0 < 0) s0 = 0;
  let tail = pi; const win = Math.round(sr * 0.01);
  for (let i = pi; i < s1; i += win) { let m = 0; for (let k = i; k < Math.min(s1, i + win); k++) m = Math.max(m, Math.abs(d[k])); if (m > peak * 0.1) tail = i; }
  let rms = 0, zc = 0; for (let i = s0; i < s1; i++) { rms += d[i] * d[i]; if (i > s0 && (d[i] >= 0) !== (d[i - 1] >= 0)) zc++; }
  const len = Math.max(1, s1 - s0); rms = Math.sqrt(rms / len);
  // the picture: 900 px of sound (scaled to its own length, max 4 s), each column min / max and its local brightness
  const W = 900, H = 56, cv = document.createElement('canvas'); cv.width = W + 300; cv.height = H;
  const g = cv.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, cv.width, H);
  const span = Math.min(len, sr * 4), per = Math.max(1, Math.floor(span / W));
  for (let x = 0; x < W; x++) {
    const a = s0 + x * per; if (a >= s1) break;
    let lo = 0, hi = 0, z = 0;
    for (let k = a; k < Math.min(s1, a + per); k++) { lo = Math.min(lo, d[k]); hi = Math.max(hi, d[k]); }
    const w0 = Math.max(s0, a - 256), w1 = Math.min(s1, a + Math.max(per, 256));   // brightness over at least ~12 ms around it
    for (let k = w0 + 1; k < w1; k++) if ((d[k] >= 0) !== (d[k - 1] >= 0)) z++;
    const br = Math.min(1, z / Math.max(1, w1 - w0) * 6), hue = 220 - 170 * br;
    g.fillStyle = 'hsl(' + hue + ',90%,' + (45 + 20 * br) + '%)';
    const y0 = H / 2 - hi / Math.max(peak, 1e-6) * (H / 2 - 2), y1 = H / 2 - lo / Math.max(peak, 1e-6) * (H / 2 - 2);
    g.fillRect(x, y0, 1, Math.max(1, y1 - y0));
  }
  g.fillStyle = '#fff'; g.font = '13px sans-serif';
  const f = (v, k = 2) => v.toFixed(k);
  const info = { dur: len / sr, attack: Math.max(0, pi - s0) / sr, tail: Math.max(0, tail - pi) / sr, peak, rms, bright: zc / (len / sr) / 1000 };
  g.fillText(name.slice(0, 40), W + 6, 16);
  g.fillText(f(info.dur) + 's  atk ' + f(info.attack) + '  tail ' + f(info.tail), W + 6, 33);
  g.fillText('bright ' + f(info.bright, 1) + '  rms ' + f(info.rms) + (span < len ? '  (4s shown)' : ''), W + 6, 50);
  info.row = cv.toDataURL('image/png');
  return info;
};
</script></body></html>`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  await win.loadURL('data:text/html;base64,' + Buffer.from(PAGE).toString('base64'));
  const files = walk(path.resolve(dir)).sort();
  const res = {}, rows = [];
  for (const f of files) {
    const rel = path.relative(path.resolve(dir), f).replace(/\\/g, '/');
    const r = await win.webContents.executeJavaScript(`scan(${JSON.stringify(fs.readFileSync(f).toString('base64'))}, ${JSON.stringify(rel)})`);
    if (r.err) { console.log('skip', rel, r.err); continue; }
    rows.push(r.row); delete r.row; res[rel] = r;
  }
  fs.writeFileSync(`${out}.json`, JSON.stringify(res, null, 1));
  // the contact sheets
  const per = 48;
  for (let s = 0; s * per < rows.length; s++) {
    const part = rows.slice(s * per, s * per + per);
    const png = await win.webContents.executeJavaScript(`(async () => {
      const rows = ${JSON.stringify(part)}, cv = document.createElement('canvas'); cv.width = 1200; cv.height = rows.length * 58;
      const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < rows.length; i++) { const im = new Image(); im.src = rows[i]; await im.decode(); g.drawImage(im, 0, i * 58); }
      return cv.toDataURL('image/png').split(',')[1];
    })()`);
    fs.writeFileSync(`${out}_${s + 1}.png`, Buffer.from(png, 'base64'));
  }
  console.log(`${Object.keys(res).length} files -> ${out}.json, ${Math.ceil(rows.length / per)} sheet(s)`);
  app.quit();
});
