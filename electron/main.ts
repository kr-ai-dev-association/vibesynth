import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { execSync, spawn, ChildProcess } from 'child_process'
import os from 'os'
import { db } from './database'

let mainWindow: BrowserWindow | null = null
let liveAppWindow: BrowserWindow | null = null
let currentLiveHtml: string | null = null
let devServerProcess: ChildProcess | null = null
let devServerProjectId: string | null = null

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function getProjectDir(projectId: string): string {
  const home = os.homedir()
  return path.join(home, 'VibeSynth', 'projects', projectId)
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function killDevServer() {
  if (devServerProcess) {
    devServerProcess.kill('SIGTERM')
    devServerProcess = null
    devServerProjectId = null
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    if (liveAppWindow) {
      liveAppWindow.close()
    }
  })
}

function createLiveAppWindow(url?: string) {
  if (liveAppWindow) {
    liveAppWindow.focus()
    if (url) liveAppWindow.loadURL(url)
    return
  }

  const preloadFile = url && url.startsWith('http')
    ? path.join(__dirname, 'preload-live.js')
    : path.join(__dirname, 'preload.js')

  liveAppWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 320,
    minHeight: 480,
    title: 'Live App',
    webPreferences: {
      preload: preloadFile,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (url) {
    liveAppWindow.loadURL(url)
  } else if (currentLiveHtml) {
    loadHtmlInLiveWindow(currentLiveHtml)
  } else {
    liveAppWindow.loadURL('about:blank')
  }

  liveAppWindow.on('closed', () => {
    liveAppWindow = null
    mainWindow?.webContents.send('live-window-closed')
  })
}

function loadHtmlInLiveWindow(html: string) {
  if (!liveAppWindow) return
  const encoded = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
  liveAppWindow.loadURL(encoded)
}

// IPC Handlers
ipcMain.handle('open-live-window', (_event, html?: string) => {
  if (html) currentLiveHtml = html
  createLiveAppWindow()
})

ipcMain.handle('close-live-window', () => {
  if (liveAppWindow) {
    liveAppWindow.close()
  }
})

ipcMain.handle('update-live-window', (_event, html: string) => {
  currentLiveHtml = html
  if (liveAppWindow) {
    loadHtmlInLiveWindow(html)
  }
})

ipcMain.handle('set-live-window-always-on-top', (_event, value: boolean) => {
  if (liveAppWindow) {
    liveAppWindow.setAlwaysOnTop(value)
  }
})

ipcMain.handle('set-live-window-size', (_event, width: number, height: number) => {
  if (liveAppWindow) {
    liveAppWindow.setSize(width, height)
  }
})

ipcMain.handle('open-external', (_event, url: string) => {
  shell.openExternal(url)
})

// ─── Database IPC Handlers ─────────────────────────────────────

// Projects
ipcMain.handle('db:get-all-projects', (_event, userId: string) => {
  return db.getAllProjects(userId)
})

ipcMain.handle('db:get-project', (_event, id: string) => {
  return db.getProject(id)
})

ipcMain.handle('db:save-project', (_event, project: any) => {
  db.saveProject(project)
  return true
})

ipcMain.handle('db:delete-project', (_event, id: string) => {
  db.deleteProject(id)
  return true
})

// Design Guides
ipcMain.handle('db:get-all-guides', (_event, userId: string) => {
  return db.getAllGuides(userId)
})

ipcMain.handle('db:save-guide', (_event, guide: any) => {
  db.saveGuide(guide)
  return true
})

ipcMain.handle('db:find-matching-guide', (_event, prompt: string, userId: string) => {
  return db.findMatchingGuide(prompt, userId)
})

// Settings
ipcMain.handle('db:get-settings', (_event, userId: string) => {
  return db.getSettings(userId)
})

ipcMain.handle('db:save-settings', (_event, settings: any) => {
  db.saveSettings(settings)
  return true
})

ipcMain.handle('db:get-path', () => {
  return db.getDbPath()
})

// ─── Project Filesystem + Dev Server IPC ──────────────────────

ipcMain.handle('project:scaffold', (_event, projectId: string, files: Record<string, string>) => {
  const projectDir = getProjectDir(projectId)
  ensureDir(projectDir)
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(projectDir, filePath)
    ensureDir(path.dirname(fullPath))
    const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
    fs.writeFileSync(fullPath, data, 'utf-8')
  }
  return projectDir
})

ipcMain.handle('project:write-file', (_event, projectId: string, filePath: string, content: string) => {
  const fullPath = path.join(getProjectDir(projectId), filePath)
  ensureDir(path.dirname(fullPath))
  fs.writeFileSync(fullPath, content, 'utf-8')
  return true
})

ipcMain.handle('project:read-file', (_event, projectId: string, filePath: string) => {
  const fullPath = path.join(getProjectDir(projectId), filePath)
  if (!fs.existsSync(fullPath)) return null
  return fs.readFileSync(fullPath, 'utf-8')
})

ipcMain.handle('project:install', async (_event, projectId: string) => {
  const projectDir = getProjectDir(projectId)
  try {
    execSync('npm install --prefer-offline', { cwd: projectDir, stdio: 'pipe', timeout: 120_000 })
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'npm install failed' }
  }
})

ipcMain.handle('project:start-dev', async (_event, projectId: string, port: number) => {
  killDevServer()
  const projectDir = getProjectDir(projectId)

  return new Promise<{ success: boolean; url?: string; error?: string }>((resolve) => {
    const child = spawn('npx', ['vite', '--port', String(port), '--host'], {
      cwd: projectDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    })

    devServerProcess = child
    devServerProjectId = projectId
    let resolved = false

    const onData = (chunk: Buffer) => {
      const text = chunk.toString()
      const match = text.match(/Local:\s+(https?:\/\/[^\s]+)/)
      if (match && !resolved) {
        resolved = true
        resolve({ success: true, url: match[1] })
      }
    }

    child.stdout?.on('data', onData)
    child.stderr?.on('data', onData)

    child.on('error', (err) => {
      if (!resolved) {
        resolved = true
        resolve({ success: false, error: err.message })
      }
    })

    child.on('exit', (code) => {
      if (!resolved) {
        resolved = true
        resolve({ success: false, error: `Process exited with code ${code}` })
      }
      if (devServerProcess === child) {
        devServerProcess = null
        devServerProjectId = null
      }
    })

    setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolve({ success: true, url: `http://localhost:${port}` })
      }
    }, 15_000)
  })
})

ipcMain.handle('project:stop-dev', () => {
  killDevServer()
  return true
})

ipcMain.handle('project:get-status', () => {
  return {
    running: devServerProcess !== null,
    projectId: devServerProjectId,
  }
})

ipcMain.handle('open-live-window-url', (_event, url: string) => {
  createLiveAppWindow(url)
})

ipcMain.handle('live-edit-request', (_event, prompt: string, currentUrl: string) => {
  mainWindow?.webContents.send('live-edit-request', prompt, currentUrl)
})

ipcMain.handle('live-edit-result', (_event, result: { success: boolean; message: string }) => {
  if (liveAppWindow) {
    liveAppWindow.webContents.send('live-edit-result', result)
  }
})

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('before-quit', () => {
  killDevServer()
})

app.on('window-all-closed', () => {
  killDevServer()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
