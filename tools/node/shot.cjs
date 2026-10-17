// Full-resolution capture of a running page (for side-by-side checks against reference mockups).
// usage: electron tools/node/shot.cjs <port> <out.png> [width height] [selector-to-wait-for]
// (a port, not a URL: on Windows an argument with ':' in it makes Electron quit before the script runs.
//  For another address set SHOT_URL instead.)
// The page is shown with transitions/animations frozen in their final state, so entrance effects do not blur the shot.
// SHOT_SEQ (see below) instead records a sequence of frames of something animating, e.g. a screen change.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.disableHardwareAcceleration();   // software rendering: also works where no GPU / desktop is available
// GUI process: stdout is not visible from most shells, so progress also goes to a log file next to the output
const LOG = path.join(require('node:os').tmpdir(), 'shot.log');
const log = (...a) => fs.appendFileSync(LOG, a.join(' ') + '\n');
fs.writeFileSync(LOG, '');
process.on('uncaughtException', (e) => { log('error', e.stack); app.exit(1); });
process.on('unhandledRejection', (e) => { log('error', e && (e.stack || e.message || e)); app.exit(1); });
const [port, out, w = '1672', h = '941', wait = '.screen.ttl'] = process.argv.slice(2).filter((a) => !a.startsWith('--') && !a.endsWith('shot.cjs') && a !== '.');
const url = process.env.SHOT_URL || `http://localhost:${port}/`;

app.whenReady().then(async () => {
  log('ready');
  const win = new BrowserWindow({ width: +w, height: +h, useContentSize: true, show: false, frame: false, webPreferences: { backgroundThrottling: false, offscreen: true } });
  win.webContents.setFrameRate(30);
  log('load', url, w, h);
  win.webContents.on('render-process-gone', (e, d) => log('renderer gone', JSON.stringify(d)));
  win.webContents.on('console-message', (e, level, message, line, src) => { if (level >= 2) log('console', level, message, `${src}:${line}`); });
  await win.loadURL(url);
  log('loaded');
  // SHOT_PRE="<js>": run once the first screen is up (e.g. "__G.titleStart()" to go to the chapter select), then wait for <selector>
  if (process.env.SHOT_PRE) {
    await win.webContents.executeJavaScript(`new Promise((ok) => { (function poll() { if ((document.querySelector('.screen') || window.__G?.game) && window.__G?.ready) return ok(); setTimeout(poll, 100); })(); })`);
    await new Promise((r) => setTimeout(r, 800));
    await win.webContents.executeJavaScript(process.env.SHOT_PRE);
    await new Promise((r) => setTimeout(r, +(process.env.SHOT_WAIT || 2600)));
  }
  const js = `new Promise((ok) => { const t0 = Date.now(); (function poll() {
      const el = document.querySelector(${JSON.stringify(wait)});
      const imgs = [...document.images];
      if (el && (imgs.length || window.__sceneReady) && imgs.every((i) => i.complete) && document.fonts.status === 'loaded') return ok(true);
      if (Date.now() - t0 > 20000) return ok(false);
      setTimeout(poll, 100); })(); })`;
  const ready = await win.webContents.executeJavaScript(js);
  // sequence mode (SHOT_SEQ="<js to run>|<frames>|<ms between>"): animations run, frames go to <out>_00.png, _01.png ...
  if (process.env.SHOT_SEQ) {
    const [act, n = '12', gap = '80'] = process.env.SHOT_SEQ.split('|');
    await win.webContents.executeJavaScript(`document.getElementById('cursor')?.style.setProperty('display', 'none', 'important'); document.querySelector(${JSON.stringify(wait)})?.classList.add('in')`);
    await new Promise((r) => setTimeout(r, 1200));
    await win.webContents.executeJavaScript(act);
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    const t0 = Date.now();
    for (let i = 0; i < +n; i++) {
      const wantAt = t0 + i * +gap;
      await new Promise((r) => setTimeout(r, Math.max(0, wantAt - Date.now())));
      const img = await win.webContents.capturePage();
      fs.writeFileSync(out.replace(/\.png$/, `_${String(i).padStart(2, '0')}.png`), img.toPNG());
      log('frame', i, Date.now() - t0, 'ms');
    }
    if (process.env.SHOT_EVAL) log('eval', JSON.stringify(await win.webContents.executeJavaScript(`(() => { try { return (${process.env.SHOT_EVAL.trim()}); } catch (e) { return 'eval error: ' + e.message; } })()`)));
    app.quit();
    return;
  }
  await win.webContents.executeJavaScript(`(() => { const s = document.createElement('style');
    s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important} #cursor{display:none!important}';
    document.head.appendChild(s); document.querySelector(${JSON.stringify(wait)})?.classList.add('in'); })()`);
  await new Promise((r) => setTimeout(r, 600));
  if (process.env.SHOT_EVAL) log('eval', JSON.stringify(await win.webContents.executeJavaScript(`(() => { try { return (${process.env.SHOT_EVAL.trim()}); } catch (e) { return 'eval error: ' + e.message; } })()`)));   // SHOT_EVAL: inspect the page
  win.webContents.invalidate(); await new Promise((r) => setTimeout(r, 400));   // offscreen windows can sit on an old frame: repaint first
  const img = await win.webContents.capturePage();
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, img.toPNG());
  log(ready ? 'ok' : 'timeout', out, JSON.stringify(img.getSize()));
  app.quit();
});
