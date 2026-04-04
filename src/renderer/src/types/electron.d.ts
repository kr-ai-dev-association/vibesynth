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
  scaffold: (projectId: string, files: Record<string, string>) => Promise<string>
  writeFile: (projectId: string, filePath: string, content: string) => Promise<boolean>
  readFile: (projectId: string, filePath: string) => Promise<string | null>
  install: (projectId: string) => Promise<{ success: boolean; error?: string }>
  startDev: (projectId: string, port: number) => Promise<{ success: boolean; url?: string; error?: string }>
  stopDev: () => Promise<boolean>
  getStatus: () => Promise<{ running: boolean; projectId: string | null }>
  listRelativePaths: (projectId: string) => Promise<string[]>
  exportToFolder: (projectId: string, destPath: string) => Promise<{ success: boolean; path?: string; error?: string }>
}

interface ElectronShellAPI {
  openVscode: (folderPath: string) => Promise<{ success: boolean; error?: string }>
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
  onLiveWindowClosed: (callback: () => void) => () => void
  onLiveEditRequest: (callback: (prompt: string, currentUrl: string) => void) => () => void
  sendLiveEditResult: (result: { success: boolean; message: string; devMarkdown?: string }) => Promise<void>
  pinterest: ElectronPinterestAPI
  project: ElectronProjectAPI
  liveEdit: {
    open: () => Promise<void>
    updateFeedback: (message: string, type: 'success' | 'error' | 'generating') => Promise<void>
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
