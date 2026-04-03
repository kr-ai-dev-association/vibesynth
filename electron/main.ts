import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { db } from './database'

let mainWindow: BrowserWindow | null = null
let liveAppWindow: BrowserWindow | null = null
let currentLiveHtml: string | null = null

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

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

function createLiveAppWindow() {
  if (liveAppWindow) {
    liveAppWindow.focus()
    return
  }

  liveAppWindow = new BrowserWindow({
    width: 420,
    height: 900,
    minWidth: 320,
    minHeight: 480,
    title: 'Live App',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (currentLiveHtml) {
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

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
