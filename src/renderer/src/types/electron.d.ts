interface ElectronAPI {
  openLiveWindow: (html?: string) => Promise<void>
  closeLiveWindow: () => Promise<void>
  updateLiveWindow: (html: string) => Promise<void>
  setLiveWindowAlwaysOnTop: (value: boolean) => Promise<void>
  setLiveWindowSize: (width: number, height: number) => Promise<void>
  openExternal: (url: string) => Promise<void>
  onLiveWindowClosed: (callback: () => void) => () => void
}

interface Window {
  electronAPI?: ElectronAPI
}
