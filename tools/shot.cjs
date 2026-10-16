// Full-resolution capture of a running page (for side-by-side checks against reference mockups).
// usage: electron tools/shot.cjs <port> <out.png> [width height] [selector-to-wait-for]
// (a port, not a URL: on Windows an argument with ':' in it makes Electron quit before the script runs.
//  For another address set SHOT_URL instead.)
// The page is shown with transitions/animations frozen in their final state, so entrance effects do not blur the shot.
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
const [port, out, w = '1672', h = '941', wait = '.screen.ttl'] = process.argv.slice(2).filter((a) => !a.startsWith('--') && !a.endsWith('shot.cjs') && a !== '.');
const url = process.env.SHOT_URL || `http://localhost:${port}/`;

app.whenReady().then(async () => {
  log('ready');
  const win = new BrowserWindow({ width: +w, height: +h, useContentSize: true, show: false, frame: false, webPreferences: { backgroundThrottling: false, offscreen: true } });
  win.webContents.setFrameRate(30);
  log('load', url, w, h);
  win.webContents.on('render-process-gone', (e, d) => log('renderer gone', JSON.stringify(d)));
  await win.loadURL(url);
  log('loaded');
  const js = `new Promise((ok) => { const t0 = Date.now(); (function poll() {
      const el = document.querySelector(${JSON.stringify(wait)});
      const imgs = [...document.images];
      if (el && imgs.length && imgs.every((i) => i.complete) && document.fonts.status === 'loaded') return ok(true);
      if (Date.now() - t0 > 20000) return ok(false);
      setTimeout(poll, 100); })(); })`;
  const ready = await win.webContents.executeJavaScript(js);
  await win.webContents.executeJavaScript(`(() => { const s = document.createElement('style');
    s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important} #cursor{display:none!important}';
    document.head.appendChild(s); document.querySelector(${JSON.stringify(wait)})?.classList.add('in'); })()`);
  await new Promise((r) => setTimeout(r, 600));
  const img = await win.webContents.capturePage();
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, img.toPNG());
  log(ready ? 'ok' : 'timeout', out, JSON.stringify(img.getSize()));
  app.quit();
});
