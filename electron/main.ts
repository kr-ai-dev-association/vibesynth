import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null
let liveAppWindow: BrowserWindow | null = null

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
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // For now, show a placeholder. Later this will load localhost:PORT
  liveAppWindow.loadURL('about:blank')

  liveAppWindow.on('closed', () => {
    liveAppWindow = null
  })
}

// IPC Handlers
ipcMain.handle('open-live-window', () => {
  createLiveAppWindow()
})

ipcMain.handle('close-live-window', () => {
  if (liveAppWindow) {
    liveAppWindow.close()
  }
})

ipcMain.handle('set-live-window-always-on-top', (_event, value: boolean) => {
  if (liveAppWindow) {
    liveAppWindow.setAlwaysOnTop(value)
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
