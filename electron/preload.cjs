// The page's door to the desktop build (contextIsolation): save files (electron/store.cjs). In a browser this is absent and the game
// keeps its saves in localStorage only.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('native', {
  // the newest valid copy of a save ({ data, seq, time, from }) or null; synchronous: the game reads its save once at startup
  read: (name) => ipcRenderer.sendSync('store:read', name),
  write: (name, data) => ipcRenderer.send('store:write', name, data),
  status: () => ipcRenderer.sendSync('store:status'),
  open: () => ipcRenderer.send('store:open'),   // the save folder in Explorer (debug menu)
});
