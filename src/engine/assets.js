import * as THREE from 'three';

export const tex = {};   // key -> THREE.Texture (key like "enemy/doll_idle")
export const meta = {};  // key -> manifest entry
export const masks = {}; // key -> { w, h, a: Uint8Array } low-res alpha for hit tests

let renderer = null;
export function setRenderer(r) { renderer = r; }

const base = () => import.meta.env.BASE_URL || './';
// portable build (double-click index.html): images ride along as data URIs, because browsers refuse
// file:// images in WebGL; window.__NOA_ASSETS is set by assets-data.js
const EMB = typeof window !== 'undefined' ? window.__NOA_ASSETS : null;
export const url = (key) => (EMB ? EMB.files[meta[key]?.src] || '' : `${base()}${meta[key]?.src || ''}`);

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

export async function loadAll(onProgress) {
  const manifest = EMB ? EMB.manifest : await (await fetch(`${base()}assets/manifest.json`)).json();
  const keys = Object.keys(manifest);
  const loader = new THREE.TextureLoader();
  let done = 0;
  for (const k of keys) meta[k] = manifest[k];
  await Promise.all(keys.map((k) => new Promise((resolve) => {
    if (manifest[k].dom) { // DOM-only images (comic panels, busts): just warm the cache
      const im = new Image();
      im.onload = im.onerror = () => { done++; onProgress && onProgress(done / keys.length); resolve(); };
      im.src = url(k);
      return;
    }
    loader.load(url(k), (t) => {
      t.colorSpace = THREE.NoColorSpace;
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.anisotropy = renderer ? Math.min(4, renderer.capabilities.getMaxAnisotropy()) : 1;
      tex[k] = t;
      if (manifest[k].hit) buildMask(k, t.image);
      done++; onProgress && onProgress(done / keys.length);
      resolve();
    }, undefined, () => { console.warn('missing', k); done++; resolve(); });
  })));
}
