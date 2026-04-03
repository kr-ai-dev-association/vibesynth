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

interface ElectronAPI {
  openLiveWindow: (html?: string) => Promise<void>
  closeLiveWindow: () => Promise<void>
  updateLiveWindow: (html: string) => Promise<void>
  setLiveWindowAlwaysOnTop: (value: boolean) => Promise<void>
  setLiveWindowSize: (width: number, height: number) => Promise<void>
  openExternal: (url: string) => Promise<void>
  onLiveWindowClosed: (callback: () => void) => () => void
  db: ElectronDBAPI
}

interface Window {
  electronAPI?: ElectronAPI
}
