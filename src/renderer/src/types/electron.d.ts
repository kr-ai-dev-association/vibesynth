interface ElectronAPI {
  openLiveWindow: () => Promise<void>
  closeLiveWindow: () => Promise<void>
  setLiveWindowAlwaysOnTop: (value: boolean) => Promise<void>
}

interface Window {
  electronAPI?: ElectronAPI
}
