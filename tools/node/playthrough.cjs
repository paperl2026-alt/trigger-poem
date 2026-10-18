// Plays a whole episode of the BUILT game (dist/, served the way the desktop build serves it) offscreen and reports how far it got:
// auto-play for 1P (and the AI 2P), god mode, sped up. A test that the steps, stations and waves of an episode all run through to the
// results without errors (the self-test only shows the first few seconds). Build first (npm run build).
// usage: electron tools/node/playthrough.cjs <out.json> [episode id] [step]
//   env PT_SLOW (game speed, default 3), PT_TIME (seconds before giving up, default 900), PT_TEAM (e.g. cat,pink), PT_SHOTS=1 (a
//   screenshot <out>_<n>.png at every new station), PT_EVERY=<ms> (a screenshot that often instead, for watching a scene),
//   PT_NOSKIP=1 (comic pages and door close-ups are played, not skipped), PT_JS=<js> (run in the page every tick, e.g. to shoot the
//   place's mechanisms, which the auto-player leaves alone: see docs/TECH.md 自检), PT_STATION=<stop> (start at that stop of a long
//   stage, e.g. kn2: episode 2's last fight)
// <out.json>: { done, results, timeline: [{ t, step, station, wave, ..., mem }], peak, load, audio, errs }; also <tmp>/playthrough.log while it runs.
// audio = what the sound code did (src/core/audio.js STATS: lines said / dropped / cut in, weapon syllables, monster cries played / skipped).
// load = { batches: [{ n pictures, ms }] (the first is the core at start-up), waits: [ms the loading bar showed before a stage],
// jank: frames over 50 ms { n, max, sum } }.
// mem = MB of the game's processes (Electron app.getAppMetrics working sets): gpu (textures live there), tab (the page: decoded images,
// JS), all; plus tex = textures on the graphics card (three.js renderer.info.memory.textures), vram = their size in MB (estimated,
// src/core/assets.js vramMB), loaded = pictures loaded (src/core/groups.js decides which).
const { app, BrowserWindow, protocol } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
app.setPath('userData', path.join(os.tmpdir(), 'trigger-poem-playthrough'));   // its own saves, never the player's
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const DIST = path.join(__dirname, '..', '..', 'dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
const LOG = path.join(os.tmpdir(), 'playthrough.log');
const log = (...a) => fs.appendFileSync(LOG, a.join(' ') + '\n');
fs.writeFileSync(LOG, '');
const [out, ep = 'ep0', step = '0'] = process.argv.slice(2).filter((a) => !a.startsWith('--') && !a.endsWith('playthrough.cjs') && a !== '.');
const SLOW = +(process.env.PT_SLOW || 3), TIME = +(process.env.PT_TIME || 900), TEAM = process.env.PT_TEAM, SHOTS = !!process.env.PT_SHOTS;
const EVERY = +(process.env.PT_EVERY || 0), NOSKIP = !!process.env.PT_NOSKIP, JS = process.env.PT_JS, STATION = process.env.PT_STATION;
process.on('uncaughtException', (e) => { log('error', e.stack); app.exit(1); });

const STATE = `(() => { const g = window.__G && __G.game;
  if (!g) return { done: true, results: !!document.querySelector('.res8') };
  const b = g.boss;
  return { step: g.stepIdx, station: g.stationId || null, wave: g.waveIndex ?? null, combat: !!g.combat,
    live: g.actors.filter((a) => a.alive).length, boss: b ? Math.round(100 * (b.hp / (b.maxHp || b.hp0 || 1))) : null,
    anomaly: g.world && g.world.anomaly !== undefined ? +g.world.anomaly.toFixed(2) : null,
    players: g.players.map((p) => p.state), errs: (window.__errs || []).length }; })()`;

app.whenReady().then(async () => {
  protocol.handle('app', async (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p === '/' || p === '') p = '/index.html';
    if (p === '/__mods.json') return new Response('[]', { headers: { 'content-type': 'application/json' } });
    const file = path.normalize(path.join(DIST, p));
    if (!file.startsWith(DIST)) return new Response('forbidden', { status: 403 });
    try { return new Response(await fs.promises.readFile(file), { headers: { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' } }); }
    catch (e) { return new Response('not found', { status: 404 }); }
  });
  const win = new BrowserWindow({ width: 1480, height: 833, show: false, webPreferences: { backgroundThrottling: false, offscreen: true } });
  win.webContents.setFrameRate(60);
  win.webContents.on('console-message', (e, level, message, line, src) => { if (level >= 2) log('console', level, message, `${src}:${line}`); });
  const q = `play&auto${NOSKIP ? '' : '&skip'}&ep=${ep}&step=${step}${TEAM ? `&team=${TEAM}` : ''}${STATION ? `&station=${STATION}` : ''}`;
  log('load', q, 'slow', SLOW);
  await win.loadURL(`app://game/index.html?${q}`);
  await win.webContents.executeJavaScript(`new Promise((ok) => { (function poll() { if (window.__G && __G.game) return ok(); setTimeout(poll, 100); })(); })`);
  await win.webContents.executeJavaScript(`__G.god = true; __G.slow = ${SLOW}; __G.audioOn && __G.audioOn(); true`);   // (sound on, as after a click)
  // frames longer than 50 ms (decoding / uploading pictures shows up here)
  await win.webContents.executeJavaScript(`window.__jank = { n: 0, max: 0, sum: 0 }; (function f(a) { requestAnimationFrame((b) => { const d = b - a; if (d > 50) { __jank.n++; __jank.sum += Math.round(d); __jank.max = Math.max(__jank.max, Math.round(d)); } f(b); }); })(performance.now()); true`);
  const timeline = [], t0 = Date.now();
  let last = '', shots = 0, lastStation = null, st;
  const peak = {};
  for (;;) {
    await new Promise((r) => setTimeout(r, EVERY ? Math.min(1000, EVERY) : 1000));
    if (EVERY) fs.writeFileSync(out.replace(/\.json$/, `_${String(shots++).padStart(3, '0')}.png`), (await win.webContents.capturePage()).toPNG());
    if (JS) await win.webContents.executeJavaScript(`try { ${JS} } catch (e) { (window.__errs || (window.__errs = [])).push('PT_JS: ' + e.message) }`);
    st = await win.webContents.executeJavaScript(STATE);
    const t = Math.round((Date.now() - t0) / 1000);
    const M = { gpu: 0, tab: 0, all: 0 };
    for (const m of app.getAppMetrics()) { const mb = Math.round(m.memory.workingSetSize / 1024); M.all += mb; if (m.type === 'GPU') M.gpu += mb; if (m.type === 'Tab' || m.type === 'Renderer') M.tab += mb; }
    Object.assign(M, await win.webContents.executeJavaScript('window.__G && __G.renderer ? { tex: __G.renderer.info.memory.textures, vram: __G.vramMB ? __G.vramMB() : null, loaded: __G.texCount ? __G.texCount() : null } : {}').catch(() => ({})));
    st.mem = M; for (const k of ['gpu', 'tab', 'all', 'vram', 'tex']) peak[k] = Math.max(peak[k] || 0, M[k]);
    const key = JSON.stringify([st.done, st.step, st.station, st.wave, st.boss !== null && Math.round(st.boss / 25)]);
    if (key !== last) { last = key; timeline.push({ t, ...st }); log(t, JSON.stringify(st)); }
    if (SHOTS && st.station && st.station !== lastStation) {
      lastStation = st.station;
      await new Promise((r) => setTimeout(r, 2500));
      fs.writeFileSync(out.replace(/\.json$/, `_${String(shots++).padStart(2, '0')}.png`), (await win.webContents.capturePage()).toPNG());
    }
    if (st.done || t > TIME) break;
  }
  const errs = await win.webContents.executeJavaScript('window.__errs || []');
  const load = await win.webContents.executeJavaScript('({ batches: __G.loadLog, waits: __G.waits, jank: window.__jank })').catch(() => null);
  const audio = await win.webContents.executeJavaScript('window.__noaAudio || null').catch(() => null);   // (what was heard: src/core/audio.js STATS)
  fs.writeFileSync(out, JSON.stringify({ done: !!st.done, results: !!st.results, seconds: Math.round((Date.now() - t0) / 1000), slow: SLOW, peak, load, audio, timeline, errs }, null, 1));
  log('end', st.done ? 'done' : 'timeout');
  app.quit();
});
