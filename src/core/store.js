// Where the game keeps what it remembers (the save, the settings). The desktop build writes real files in two places with checksums and
// older versions (electron/store.cjs, through electron/preload.cjs: window.native); a browser keeps localStorage only. localStorage
// is written in the desktop build too, as a last copy, and is where saves from builds before the files are picked up.
const N = typeof window !== 'undefined' ? window.native : null;
export const hasFiles = !!N;

// the stored text of a thing (a JSON string) or null; info: where it came from
export function readStored(name, legacyKey) {
  if (N) {
    try { const c = N.read(name); if (c) return { data: c.data, from: c.from, seq: c.seq }; } catch (e) { /* the files failed: localStorage below */ }
  }
  try { const s = localStorage.getItem(legacyKey); if (s) return { data: s, from: 'localStorage' }; } catch (e) { /* storage blocked */ }
  return null;
}
export function writeStored(name, legacyKey, text) {
  if (N) { try { N.write(name, text); } catch (e) { /* the other copies stay */ } }
  try { localStorage.setItem(legacyKey, text); } catch (e) { /* storage blocked */ }
}
export function storeStatus() { try { return N ? N.status() : [{ dir: 'localStorage', ok: true }]; } catch (e) { return []; } }
