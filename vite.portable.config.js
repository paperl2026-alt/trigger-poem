// Portable build: a folder anyone can open by double-clicking index.html (file://, no server, offline).
// Browsers block module scripts, font files and WebGL images from file://, so: classic script (iife),
// fonts inlined into the CSS, images shipped as data URIs in assets-data.js (see tools/portable.mjs).
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  define: { __BUILD__: JSON.stringify(`portable ${new Date().toLocaleString('zh-CN', { hour12: false })}`) },
  publicDir: false,
  build: {
    outDir: 'dist-portable',
    emptyOutDir: true,
    assetsInlineLimit: 100 * 1024 * 1024,
    cssCodeSplit: false,
    modulePreload: false,
    chunkSizeWarningLimit: 50000,
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true, entryFileNames: 'game.js', assetFileNames: '[name][extname]' } },
  },
});
