import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openLiveWindow: (html?: string) => ipcRenderer.invoke('open-live-window', html),
  openLiveWindowUrl: (url: string) => ipcRenderer.invoke('open-live-window-url', url),
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
  onLiveEditRequest: (callback: (prompt: string, currentUrl: string) => void) => {
    const handler = (_e: any, prompt: string, currentUrl: string) => callback(prompt, currentUrl)
    ipcRenderer.on('live-edit-request', handler)
    return () => ipcRenderer.removeListener('live-edit-request', handler)
  },
  sendLiveEditResult: (result: { success: boolean; message: string }) =>
    ipcRenderer.invoke('live-edit-result', result),

  // Project filesystem + dev server API
  project: {
    scaffold: (projectId: string, files: Record<string, string>) =>
      ipcRenderer.invoke('project:scaffold', projectId, files),
    writeFile: (projectId: string, filePath: string, content: string) =>
      ipcRenderer.invoke('project:write-file', projectId, filePath, content),
    readFile: (projectId: string, filePath: string) =>
      ipcRenderer.invoke('project:read-file', projectId, filePath),
    install: (projectId: string) =>
      ipcRenderer.invoke('project:install', projectId),
    startDev: (projectId: string, port: number) =>
      ipcRenderer.invoke('project:start-dev', projectId, port),
    stopDev: () => ipcRenderer.invoke('project:stop-dev'),
    getStatus: () => ipcRenderer.invoke('project:get-status'),
    listRelativePaths: (projectId: string) =>
      ipcRenderer.invoke('project:list-relative-paths', projectId),
    exportToFolder: (projectId: string, destPath: string) =>
      ipcRenderer.invoke('project:export-to-folder', projectId, destPath) as Promise<{ success: boolean; path?: string; error?: string }>,
  },

  // Shell commands (§11.2)
  shell: {
    openVscode: (folderPath: string) =>
      ipcRenderer.invoke('shell:open-vscode', folderPath) as Promise<{ success: boolean; error?: string }>,
  },

  // Feedback popup (Designer/Developer mode)
  feedback: {
    show: (content: string, mode: 'designer' | 'developer') =>
      ipcRenderer.invoke('feedback:show', content, mode),
    close: () => ipcRenderer.invoke('feedback:close'),
  },

  // Pinterest Design Steal
  pinterest: {
    connect: () => ipcRenderer.invoke('pinterest:connect'),
    open: (query: string) => ipcRenderer.invoke('pinterest:open', query),
    cancel: () => ipcRenderer.invoke('pinterest:cancel'),
    stealUrl: (imageUrl: string) =>
      ipcRenderer.invoke('pinterest:steal-url', imageUrl) as Promise<{ success: boolean; error?: string }>,
    onImageCaptured: (callback: (base64: string | null, mimeType: string | null) => void) => {
      const handler = (_e: any, b64: string | null, mime: string | null) => callback(b64, mime)
      ipcRenderer.on('pinterest:image-captured', handler)
      return () => ipcRenderer.removeListener('pinterest:image-captured', handler)
    },
    onConnectDone: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('pinterest:connect-done', handler)
      return () => ipcRenderer.removeListener('pinterest:connect-done', handler)
    },
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
