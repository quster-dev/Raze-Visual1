const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('loaderAPI', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  close: () => ipcRenderer.invoke('window:close'),
  togglePin: () => ipcRenderer.invoke('window:toggle-pin'),
  openExternal: (url) => ipcRenderer.invoke('window:open-external', url),
  startLaunch: (payload) => ipcRenderer.invoke('launch:start', payload),
  onLaunchStatus: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('launch:status', handler);
    return () => ipcRenderer.removeListener('launch:status', handler);
  }
});
