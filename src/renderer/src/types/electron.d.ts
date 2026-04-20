interface ElectronDBAPI {
  getAllProjects: (userId: string) => Promise<any[]>
  getProject: (id: string) => Promise<any | undefined>
  saveProject: (project: any) => Promise<boolean>
  deleteProject: (id: string) => Promise<boolean>
  getAllGuides: (userId: string) => Promise<any[]>
  saveGuide: (guide: any) => Promise<boolean>
  findMatchingGuide: (prompt: string, userId: string) => Promise<any | null>
  getSettings: (userId: string) => Promise<any>
  saveSettings: (settings: any) => Promise<boolean>
  getDbPath: () => Promise<string>
}

interface ElectronProjectAPI {
  clean: (projectId: string) => Promise<{ success: boolean }>
  restartDev: (projectId: string) => Promise<{ success: boolean; url?: string; port?: number; error?: string }>
  scaffold: (projectId: string, files: Record<string, string>) => Promise<string>
  writeFile: (projectId: string, filePath: string, content: string) => Promise<boolean>
  readFile: (projectId: string, filePath: string) => Promise<string | null>
  install: (projectId: string) => Promise<{ success: boolean; error?: string }>
  startDev: (projectId: string, port: number) => Promise<{ success: boolean; url?: string; error?: string }>
  stopDev: () => Promise<boolean>
  exportZip: (projectId: string, screens: { name: string; html: string }[]) => Promise<{ success: boolean; path?: string; error?: string }>
  getStatus: () => Promise<{ running: boolean; projectId: string | null }>
  listRelativePaths: (projectId: string) => Promise<string[]>
  exportToFolder: (projectId: string, destPath: string) => Promise<{ success: boolean; path?: string; error?: string }>
}

interface ElectronShellAPI {
  openVscode: (folderPath: string) => Promise<{ success: boolean; error?: string }>
}

interface ElectronBanyaAPI {
  run: (opts: {
    prompt: string
    projectId?: string
    promptType?: 'ask' | 'code' | 'plan' | 'agent'
    timeoutMs?: number
    streamEventName?: string
  }) => Promise<{ success: boolean; content: string; exitCode: number | null; error?: string }>
  onStream: (channel: string, callback: (chunk: string) => void) => () => void
}

interface ElectronPinterestAPI {
  connect: () => Promise<void>
  open: (query: string) => Promise<void>
  cancel: () => Promise<void>
  stealUrl: (imageUrl: string) => Promise<{ success: boolean; error?: string }>
  onImageCaptured: (callback: (base64: string | null, mimeType: string | null) => void) => () => void
  onConnectDone: (callback: () => void) => () => void
}

interface ElectronAPI {
  openLiveWindow: (html?: string, deviceType?: string) => Promise<void>
  openLiveWindowUrl: (url: string, deviceType?: string) => Promise<void>
  closeLiveWindow: () => Promise<void>
  updateLiveWindow: (html: string) => Promise<void>
  setLiveWindowAlwaysOnTop: (value: boolean) => Promise<void>
  setLiveWindowSize: (width: number, height: number) => Promise<void>
  openExternal: (url: string) => Promise<void>
  onLiveAppError: (callback: (message: string) => void) => () => void
  onLiveWindowClosed: (callback: () => void) => () => void
  onLiveEditRequest: (callback: (prompt: string, currentUrl: string) => void) => () => void
  sendLiveEditResult: (result: { success: boolean; message: string; devMarkdown?: string }) => Promise<void>
  pinterest: ElectronPinterestAPI
  project: ElectronProjectAPI
  banya: ElectronBanyaAPI
  liveEdit: {
    open: () => Promise<void>
    sendRequest: (prompt: string) => Promise<void>
    getProjectInfo: () => Promise<{ projectId: string; path: string; files: string[] } | null>
    getDesignSystem: () => Promise<any | null>
    updateFeedback: (message: string, type: 'success' | 'error' | 'generating', devMarkdown?: string) => Promise<void>
    close: () => Promise<void>
  }
  shell: ElectronShellAPI
  feedback: {
    show: (content: string, mode: 'designer' | 'developer') => Promise<void>
    close: () => Promise<void>
  }
  db: ElectronDBAPI
}

interface Window {
  electronAPI?: ElectronAPI
}
