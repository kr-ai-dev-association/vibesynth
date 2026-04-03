import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openLiveWindow: () => ipcRenderer.invoke('open-live-window'),
  closeLiveWindow: () => ipcRenderer.invoke('close-live-window'),
  setLiveWindowAlwaysOnTop: (value: boolean) =>
    ipcRenderer.invoke('set-live-window-always-on-top', value),
})
