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

export default defineConfig({
  base: './',
  define: { __BUILD__: JSON.stringify(new Date().toLocaleString('zh-CN', { hour12: false })) },
  plugins: [shots],
  server: { port: 5300, strictPort: true },
  build: { chunkSizeWarningLimit: 2000, rollupOptions: { input: { main: path.resolve('index.html'), jiggle: path.resolve('jiggle.html') } } },
});
