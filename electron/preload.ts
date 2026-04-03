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

  // Database API
  db: {
    getAllProjects: (userId: string) => ipcRenderer.invoke('db:get-all-projects', userId),
    getProject: (id: string) => ipcRenderer.invoke('db:get-project', id),
    saveProject: (project: any) => ipcRenderer.invoke('db:save-project', project),
    deleteProject: (id: string) => ipcRenderer.invoke('db:delete-project', id),
    getAllGuides: (userId: string) => ipcRenderer.invoke('db:get-all-guides', userId),
    saveGuide: (guide: any) => ipcRenderer.invoke('db:save-guide', guide),
    findMatchingGuide: (prompt: string, userId: string) =>
      ipcRenderer.invoke('db:find-matching-guide', prompt, userId),
    getSettings: (userId: string) => ipcRenderer.invoke('db:get-settings', userId),
    saveSettings: (settings: any) => ipcRenderer.invoke('db:save-settings', settings),
    getDbPath: () => ipcRenderer.invoke('db:get-path'),
  },
})
