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
  getEffectiveGeminiKey: () => Promise<string>
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
  openInEditor: (editor: string, folderPath: string) => Promise<{ success: boolean; error?: string }>
}

interface ElectronBanyaAPI {
  codegen: (opts: {
    projectId: string
    prompt: string
    preScaffold?: Record<string, string>
    timeoutMs?: number
    streamEventName?: string
    eventChannelName?: string
  }) => Promise<{
    success: boolean
    files: Record<string, string>
    exitCode: number | null
    content: string
    error?: string
  }>
  onStream: (channel: string, callback: (chunk: string) => void) => () => void
  onEvent: (channel: string, callback: (event: { type: string; data: any }) => void) => () => void
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
    open: (projectId?: string) => Promise<void>
    sendRequest: (prompt: string) => Promise<void>
    getProjectInfo: () => Promise<{
      projectId: string
      path: string
      files: string[]
      workspaceRoot?: string
      platforms?: Array<{ platform: 'react' | 'android'; path: string; files: string[] }>
    } | null>
    getDesignSystem: () => Promise<any | null>
    updateFeedback: (message: string, type: 'success' | 'error' | 'generating', devMarkdown?: string) => Promise<void>
    setActivePlatform: (platform: 'web' | 'android' | null) => Promise<void>
    getActivePlatform: () => Promise<'web' | 'android' | null>
    openInEditor: (platform?: 'react' | 'android') => Promise<{ success: boolean; error?: string }>
    setDesignSync: (enabled: boolean) => Promise<void>
    getDesignSync: () => Promise<boolean>
    close: () => Promise<void>
  }
  shell: ElectronShellAPI
  feedback: {
    show: (content: string, mode: 'designer' | 'developer') => Promise<void>
    close: () => Promise<void>
  }
  db: ElectronDBAPI
  banyaCli: {
    detect: (explicitPath?: string) => Promise<BanyaCliInfo>
    getConfig: () => Promise<BanyaCliConfig>
    saveConfig: (cfg: BanyaCliConfig) => Promise<boolean>
  }
  android: {
    detect: () => Promise<AndroidConfig>
    validate: (cfg: AndroidConfig) => Promise<AndroidValidationResult>
    listAvds: (emulatorPath: string) => Promise<AvdInfo[]>
    listDevices: (adbPath: string) => Promise<AndroidDeviceInfo[]>
    getConfig: () => Promise<AndroidConfig>
    saveConfig: (cfg: AndroidConfig) => Promise<boolean>
    run: (
      projectId: string,
      projectName: string,
      screens?: Array<{ id: string; name: string; html: string }>,
      designSystem?: any,
      opts?: { clean?: boolean; extraInstruction?: string },
    ) => Promise<{ success: boolean; error?: string }>
    onProgress: (cb: (e: AndroidRunProgress) => void) => () => void
  }
}

interface AndroidRunProgress {
  step: 'scaffold' | 'wrapper' | 'gradle' | 'emulator' | 'install' | 'launch' | string
  status: 'progress' | 'success' | 'error' | string
  message: string
  detail?: string
}

interface BanyaCliInfo {
  available: boolean
  path: string
  version: string
  error?: string
}

interface BanyaCliConfig {
  explicitPath: string             // empty = auto-detect
  agentModelMode: 'fixed' | 'cli-default'
  fixedModel: string               // gemini-2.0-flash | gemini-3.1-pro | ...
  criticEnabled: boolean
}

interface AndroidConfig {
  sdkRoot: string
  jdkHome: string
  adbPath: string
  emulatorPath: string
  avdManagerPath: string
  preferredAvd: string
}
interface AndroidFieldStatus { ok: boolean; message: string; detail?: string }
interface AndroidValidationResult {
  sdkRoot: AndroidFieldStatus
  jdkHome: AndroidFieldStatus
  adb: AndroidFieldStatus
  emulator: AndroidFieldStatus
  avdManager: AndroidFieldStatus
  preferredAvd: AndroidFieldStatus
  overall: 'ok' | 'partial' | 'fail'
}
interface AvdInfo { name: string; apiLevel?: number; device?: string }
interface AndroidDeviceInfo { serial: string; state: string; isEmulator: boolean }

interface Window {
  electronAPI?: ElectronAPI
}
