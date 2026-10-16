import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// dev-only: lets automated checks save full-resolution canvas captures to art/_shots/
const shots = {
  name: 'dev-shots',
  configureServer(server) {
    server.middlewares.use('/__shot', (req, res) => {
      if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
      const name = (new URL(req.url, 'http://x').searchParams.get('name') || 'shot').replace(/[^\w-]/g, '');
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        const dir = path.resolve('art/_shots');
        fs.mkdirSync(dir, { recursive: true });
        const b64 = body.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(path.join(dir, `${name}.png`), Buffer.from(b64, 'base64'));
        res.end('ok');
      });
    });
  },
};

// dev: content-pack mods from <project>/mods/<id>/ (the packaged game reads the mods folder next to the exe, see electron/main.cjs)
const MIME = { '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg' };
const mods = {
  name: 'dev-mods',
  configureServer(server) {
    const dir = path.resolve('mods');
    server.middlewares.use('/__mods.json', (req, res) => {
      const list = fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'pack.json'))) : [];
      res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(list));
    });
    server.middlewares.use('/mods/', (req, res, next) => {
      const f = path.normalize(path.join(dir, decodeURIComponent(req.url.split('?')[0])));
      if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { next(); return; }
      res.setHeader('content-type', MIME[path.extname(f).toLowerCase()] || 'application/octet-stream');
      res.end(fs.readFileSync(f));
    });
  },
};

export default defineConfig({
  base: './',
  define: { __BUILD__: JSON.stringify(new Date().toLocaleString('zh-CN', { hour12: false })) },
  plugins: [shots, mods],
  server: { port: 5300, strictPort: true },
  build: { chunkSizeWarningLimit: 2000, rollupOptions: { input: { main: path.resolve('index.html'), jiggle: path.resolve('jiggle.html'), depth: path.resolve('depth.html') } } },
});
