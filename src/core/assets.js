import * as THREE from 'three';
import { C } from './content.js';

export const tex = {};   // key -> THREE.Texture (key like "enemy/doll_idle")
export const meta = {};  // key -> manifest entry
export const masks = {}; // key -> { w, h, a: Uint8Array } low-res alpha for hit tests

let renderer = null;
export function setRenderer(r) { renderer = r; }

// images come from the content packs (C.assets: key -> { url, w, h, ... }); a later pack can replace any image.
// portable build (double-click index.html): images ride along as data URIs (window.__NOA_CONTENT), because browsers
// refuse file:// images in WebGL
const EMB = typeof window !== 'undefined' ? window.__NOA_CONTENT : null;
export const url = (key) => { const u = meta[key]?.url || ''; return EMB && EMB[u] ? EMB[u] : u; };

function buildMask(key, img) {
  const s = Math.min(1, 160 / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * s)), h = Math.max(1, Math.round(img.height * s));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  const a = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3];
  masks[key] = { w, h, a };
}

// alpha at texture uv (v = 0 at the bottom, three.js convention)
export function alphaAt(key, u, v) {
  const m = masks[key];
  if (!m) return 255;
  if (u < 0 || u > 1 || v < 0 || v > 1) return 0;
  const x = Math.min(m.w - 1, Math.floor(u * m.w)), y = Math.min(m.h - 1, Math.floor((1 - v) * m.h));
  return m.a[y * m.w + x];
}

// Pictures are loaded in groups and released explicitly (docs/TECH.md「图片按小关加载」, src/core/groups.js): a texture is freed only by
// dispose(), never by the garbage collector, and every picture decodes to w × h × 4 bytes whatever its file size.
const loading = new Map();   // key -> Promise (being loaded)
const loader = new THREE.TextureLoader();
function loadOne(k) {
  if (tex[k] || loading.has(k)) return loading.get(k) || Promise.resolve();
  const m = meta[k];
  const p = new Promise((resolve) => {
    if (m.dom) { // DOM-only images (busts): just warm the cache
      const im = new Image();
      im.onload = im.onerror = () => resolve();
      im.src = url(k);
      return;
    }
    loader.load(url(k), (t) => {
      t.colorSpace = THREE.NoColorSpace;
      // data maps (jiggle part weights): exact values, no mipmaps
      t.generateMipmaps = !m.data;
      t.minFilter = m.data ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.anisotropy = renderer ? Math.min(4, renderer.capabilities.getMaxAnisotropy()) : 1;
      tex[k] = t;
      if (m.hit) buildMask(k, t.image);
      resolve();
    }, undefined, () => { console.warn('missing', k); resolve(); });
  }).then(() => loading.delete(k));
  loading.set(k, p);
  return p;
}
// load these pictures (the ones not loaded yet); onProgress(0..1)
export async function loadKeys(keys, onProgress) {
  const todo = [...keys].filter((k) => meta[k] && !tex[k]);
  let done = 0;
  await Promise.all(todo.map((k) => loadOne(k).then(() => { done++; onProgress && onProgress(done / todo.length); })));
  onProgress && onProgress(1);
}
export const isLoaded = (keys) => [...keys].every((k) => !meta[k] || meta[k].dom || tex[k]);
// free every loaded picture that is not in keep (a mesh still showing one just uploads it again: nothing breaks)
export function releaseExcept(keep) {
  let n = 0;
  for (const k of Object.keys(tex)) if (!keep.has(k)) { tex[k].dispose(); delete tex[k]; delete masks[k]; n++; }
  return n;
}
// the manifest (every picture's size and place) is known from the start; only the core pictures are loaded then
export function setManifest() { for (const [k, v] of Object.entries(C.assets)) meta[k] = v; }
// how much the textures on the graphics card take, roughly (each uploaded one: w × h × 4 bytes + a third for mipmaps), in MB: for the
// memory checks (tools/node/playthrough.cjs)
export function vramMB() {
  if (!renderer) return 0;
  let b = 0;
  for (const [k, t] of Object.entries(tex)) if (renderer.properties.get(t).__webglTexture) b += (meta[k]?.w || 0) * (meta[k]?.h || 0) * 4 * (t.generateMipmaps ? 1.33 : 1);
  return Math.round(b / 1048576);
}
