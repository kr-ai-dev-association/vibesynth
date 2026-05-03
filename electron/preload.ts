import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openLiveWindow: (html?: string, deviceType?: string) => ipcRenderer.invoke('open-live-window', html, deviceType),
  openLiveWindowUrl: (url: string, deviceType?: string) => ipcRenderer.invoke('open-live-window-url', url, deviceType),
  closeLiveWindow: () => ipcRenderer.invoke('close-live-window'),
  updateLiveWindow: (html: string) => ipcRenderer.invoke('update-live-window', html),
  setLiveWindowAlwaysOnTop: (value: boolean) =>
    ipcRenderer.invoke('set-live-window-always-on-top', value),
  setLiveWindowSize: (width: number, height: number) =>
    ipcRenderer.invoke('set-live-window-size', width, height),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  onLiveAppError: (callback: (message: string) => void) => {
    const handler = (_e: any, msg: string) => callback(msg)
    ipcRenderer.on('live-app-error', handler)
    return () => ipcRenderer.removeListener('live-app-error', handler)
  },
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
    clean: (projectId: string) =>
      ipcRenderer.invoke('project:clean', projectId) as Promise<{ success: boolean }>,
    restartDev: (projectId: string) =>
      ipcRenderer.invoke('project:restart-dev', projectId) as Promise<{ success: boolean; url?: string; port?: number; error?: string }>,
    getDevInfo: () =>
      ipcRenderer.invoke('project:get-dev-info') as Promise<{
        tracked: { pid: number; projectId: string; alive: boolean } | null
        activePorts: { port: number; pid: number }[]
      }>,
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
    exportZip: (projectId: string, screens: { name: string; html: string }[]) =>
      ipcRenderer.invoke('project:export-zip', projectId, screens) as Promise<{ success: boolean; path?: string; error?: string }>,
    getStatus: () => ipcRenderer.invoke('project:get-status'),
    listRelativePaths: (projectId: string) =>
      ipcRenderer.invoke('project:list-relative-paths', projectId),
    exportToFolder: (projectId: string, destPath: string) =>
      ipcRenderer.invoke('project:export-to-folder', projectId, destPath) as Promise<{ success: boolean; path?: string; error?: string }>,
  },

  // Banya CLI (codegen backend — runs banya in agent mode with project workspace)
  banya: {
    codegen: (opts: {
      projectId: string
      prompt: string
      preScaffold?: Record<string, string>
      timeoutMs?: number
      streamEventName?: string
      eventChannelName?: string
    }) =>
      ipcRenderer.invoke('banya:codegen', opts) as Promise<{
        success: boolean
        files: Record<string, string>
        exitCode: number | null
        content: string
        error?: string
      }>,
    onStream: (channel: string, callback: (chunk: string) => void) => {
      const handler = (_e: any, chunk: string) => callback(chunk)
      ipcRenderer.on(channel, handler)
      return () => ipcRenderer.removeListener(channel, handler)
    },
    onEvent: (channel: string, callback: (event: { type: string; data: any }) => void) => {
      const handler = (_e: any, evt: { type: string; data: any }) => callback(evt)
      ipcRenderer.on(channel, handler)
      return () => ipcRenderer.removeListener(channel, handler)
    },
  },

  // Shell commands (§11.2)
  shell: {
    openVscode: (folderPath: string) =>
      ipcRenderer.invoke('shell:open-vscode', folderPath) as Promise<{ success: boolean; error?: string }>,
    openInEditor: (editor: string, folderPath: string) =>
      ipcRenderer.invoke('shell:open-in-editor', editor, folderPath) as Promise<{ success: boolean; error?: string }>,
  },

  // Live Edit popup
  liveEdit: {
    open: (projectId?: string) => ipcRenderer.invoke('live-edit:open', projectId),
    sendRequest: (prompt: string) => ipcRenderer.invoke('live-edit-request', prompt, window.location.href),
    getProjectInfo: () => ipcRenderer.invoke('live-edit:get-project-info'),
    getDesignSystem: () => ipcRenderer.invoke('live-edit:get-design-system'),
    updateFeedback: (message: string, type: 'success' | 'error' | 'generating', devMarkdown?: string) =>
      ipcRenderer.invoke('live-edit:update-feedback', message, type, devMarkdown),
    close: () => ipcRenderer.invoke('live-edit:close'),
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
    getEffectiveGeminiKey: () => ipcRenderer.invoke('db:get-effective-gemini-key') as Promise<string>,
  },

  // banya CLI detection + saved config (Settings page)
  banyaCli: {
    detect: (explicitPath?: string) => ipcRenderer.invoke('banya-cli:detect', explicitPath),
    getConfig: () => ipcRenderer.invoke('banya-cli:get-config'),
    saveConfig: (cfg: any) => ipcRenderer.invoke('banya-cli:save-config', cfg),
  },

  // Android build environment (settings page Android section)
  android: {
    detect: () => ipcRenderer.invoke('android:detect'),
    validate: (cfg: any) => ipcRenderer.invoke('android:validate', cfg),
    listAvds: (emulatorPath: string) => ipcRenderer.invoke('android:list-avds', emulatorPath),
    listDevices: (adbPath: string) => ipcRenderer.invoke('android:list-devices', adbPath),
    getConfig: () => ipcRenderer.invoke('android:get-config'),
    saveConfig: (cfg: any) => ipcRenderer.invoke('android:save-config', cfg),
    run: (projectId: string, projectName: string, screens?: any[], designSystem?: any, opts?: { clean?: boolean }) =>
      ipcRenderer.invoke('android:run', projectId, projectName, screens, designSystem, opts) as Promise<{ success: boolean; error?: string }>,
    onProgress: (cb: (e: { step: string; status: string; message: string; detail?: string }) => void) => {
      const handler = (_e: unknown, ev: any) => cb(ev)
      ipcRenderer.on('android:progress', handler)
      return () => ipcRenderer.removeListener('android:progress', handler)
    },
  },
})
