const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openBrowser: (url) => ipcRenderer.invoke('openBrowser', url),
  saveState: (encryptedString) =>
    ipcRenderer.invoke('saveState', encryptedString),
  encrypt: (plainText) => ipcRenderer.invoke('encrypt', plainText),
  decrypt: (encryptedString) => ipcRenderer.invoke('decrypt', encryptedString),
  on: (channel, callback) => {
    ipcRenderer.on(channel, callback);
  },
  send: (channel, args) => {
    ipcRenderer.send(channel, args);
  },
});
