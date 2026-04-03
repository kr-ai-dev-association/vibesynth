import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openLiveWindow: (html?: string) => ipcRenderer.invoke('open-live-window', html),
  closeLiveWindow: () => ipcRenderer.invoke('close-live-window'),
  updateLiveWindow: (html: string) => ipcRenderer.invoke('update-live-window', html),
  setLiveWindowAlwaysOnTop: (value: boolean) =>
    ipcRenderer.invoke('set-live-window-always-on-top', value),
  setLiveWindowSize: (width: number, height: number) =>
    ipcRenderer.invoke('set-live-window-size', width, height),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  onLiveWindowClosed: (callback: () => void) => {
    ipcRenderer.on('live-window-closed', callback)
    return () => ipcRenderer.removeListener('live-window-closed', callback)
  },
})
