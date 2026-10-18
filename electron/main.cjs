// Desktop (Steam) shell. Serves dist/ through an app:// protocol so the game runs exactly as on a web server
// (ES modules, fetch, WebGL textures) and never from a stale browser cache.
// Window: starts at 16:9 (85% of the screen), freely resizable; F11 / Alt+Enter = borderless fullscreen (handled by the page).
// NOA_SELFTEST=<png path>: hidden offscreen run that plays a few seconds, writes a screenshot + <path>.json, then quits.
const { app, BrowserWindow, protocol, screen, Menu, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { Store } = require('./store.cjs');

// sound from the start: no waiting for a first click before the audio may run (the menus' first clicks were silent)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

const DIST = path.join(__dirname, '..', 'dist');
// content-pack mods (DLC / Workshop share the format): <folder of the exe>/mods/<id>/pack.json; in development <project>/mods
const MODS = app.isPackaged ? path.join(path.dirname(process.execPath), 'mods') : path.join(__dirname, '..', 'mods');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
const selfTest = process.env.NOA_SELFTEST;
// save files in two places (electron/store.cjs): the user-data folder and a "saves" folder next to the game; a self-test keeps its own
const store = new Store(selfTest ? [path.join(app.getPath('temp'), 'trigger-poem-selftest', 'saves')]
  : [path.join(app.getPath('userData'), 'saves'), path.join(app.isPackaged ? path.dirname(process.execPath) : path.join(__dirname, '..'), 'saves')]);
ipcMain.on('store:read', (e, name) => { e.returnValue = store.read(name); });
ipcMain.on('store:write', (e, name, data) => { store.write(name, data); });
ipcMain.on('store:status', (e) => { e.returnValue = store.status(); });
ipcMain.on('store:open', () => { const d = store.dirs[0].dir; fs.mkdirSync(d, { recursive: true }); shell.openPath(d); });
// `electron . --page=jiggle.html` opens another page of the build (e.g. the jiggle tech validation)
const page = (process.argv.find((a) => a.startsWith('--page=')) || '--page=index.html').slice(7);

function createWindow() {
  const wa = screen.getPrimaryDisplay().workAreaSize;
  const w = Math.min(1920, Math.round(wa.width * 0.85)), h = Math.min(Math.round(w * 9 / 16), wa.height);
  const win = new BrowserWindow({
    width: w, height: h, minWidth: 960, minHeight: 540, show: false,
    backgroundColor: '#1a0f20', title: '相对希望的少女扣击诗', autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { backgroundThrottling: false, contextIsolation: true, offscreen: !!selfTest, preload: path.join(__dirname, 'preload.cjs') },
  });
  Menu.setApplicationMenu(null);
  win.once('ready-to-show', () => { if (!selfTest) win.show(); });
  win.loadURL(`app://game/${page}${selfTest ? (page.includes('?') ? '&' : '?') + 'play&skip' : ''}`);
  if (selfTest) {
    win.webContents.once('did-finish-load', () => setTimeout(async () => {
      // store: a save written and read back through the save files (electron/store.cjs, the self-test's own folder)
      const info = await win.webContents.executeJavaScript(`JSON.stringify({ errs: window.__errs, combat: !!(window.__G && __G.game && __G.game.combat),
        size: [innerWidth, innerHeight], build: window.__G && __G.build, players: window.__G && __G.game && __G.game.players.map((p) => p.state),
        store: !window.native ? 'no native' : (native.write('selftest', '{"ok":1}'), native.read('selftest')?.data === '{"ok":1}' ? 'ok' : 'read back failed') })`);
      const img = await win.webContents.capturePage();
      fs.writeFileSync(selfTest, img.toPNG());
      fs.writeFileSync(`${selfTest}.json`, info);
      app.quit();
    }, 9000));
  }
}

app.whenReady().then(() => {
  protocol.handle('app', async (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p === '/' || p === '') p = '/index.html';
    if (p === '/__mods.json') {
      let list = [];
      try { list = fs.readdirSync(MODS).filter((d) => fs.existsSync(path.join(MODS, d, 'pack.json'))); } catch (e) { /* no mods folder */ }
      return new Response(JSON.stringify(list), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
    }
    const root = p.startsWith('/mods/') ? MODS : DIST;
    const file = path.normalize(path.join(root, p.startsWith('/mods/') ? p.slice(5) : p));
    if (!file.startsWith(root)) return new Response('forbidden', { status: 403 });
    try {
      const data = await fs.promises.readFile(file);
      return new Response(data, { headers: { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' } });
    } catch (e) {
      return new Response('not found', { status: 404 });
    }
  });
  createWindow();
});
app.on('window-all-closed', () => app.quit());
