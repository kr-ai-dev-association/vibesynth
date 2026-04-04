import { app, BrowserWindow, ipcMain, shell, net } from 'electron'
import path from 'path'
import fs from 'fs'
import { execSync, spawn, ChildProcess } from 'child_process'
import os from 'os'
import { db } from './database'
import { isGeminiCliAvailable, runGeminiCli } from './gemini-cli'

let mainWindow: BrowserWindow | null = null
let liveAppWindow: BrowserWindow | null = null
let feedbackWindow: BrowserWindow | null = null
let pinterestWindow: BrowserWindow | null = null
let pinterestConnected = false
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

function expandUserPath(p: string): string {
  const trimmed = (p || '').trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('~/')) return path.join(os.homedir(), trimmed.slice(2))
  if (trimmed === '~') return os.homedir()
  return path.resolve(trimmed)
}

const EXPORT_SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.vite'])

function listRelativePathsSync(dir: string, base = ''): string[] {
  const out: string[] = []
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    if (EXPORT_SKIP_DIRS.has(name)) continue
    const rel = base ? `${base}/${name}` : name
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) out.push(...listRelativePathsSync(full, rel))
    else out.push(rel.replace(/\\/g, '/'))
  }
  return out
}

function copyProjectTree(src: string, dest: string) {
  for (const rel of listRelativePathsSync(src)) {
    const from = path.join(src, ...rel.split('/'))
    const to = path.join(dest, ...rel.split('/'))
    ensureDir(path.dirname(to))
    fs.copyFileSync(from, to)
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

  mainWindow.setFullScreen(true)

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

function getDeviceWindowSize(deviceType?: string): { width: number; height: number } {
  switch (deviceType) {
    case 'iphone':
    case 'android':
    case 'app':
      return { width: 420, height: 900 }
    case 'ipad':
    case 'tablet':
      return { width: 820, height: 1100 }
    case 'web':
    case 'desktop':
      return { width: 1280, height: 800 }
    default:
      return { width: 420, height: 750 }
  }
}

function createLiveAppWindow(url?: string, deviceType?: string) {
  const size = getDeviceWindowSize(deviceType)

  if (liveAppWindow) {
    liveAppWindow.setSize(size.width, size.height)
    liveAppWindow.focus()
    if (url) liveAppWindow.loadURL(url)
    return
  }

  const preloadFile = url && url.startsWith('http')
    ? path.join(__dirname, 'preload-live.js')
    : path.join(__dirname, 'preload.js')

  liveAppWindow = new BrowserWindow({
    width: size.width,
    height: size.height,
    minWidth: 320,
    minHeight: 480,
    title: `Live App — ${(deviceType || 'app').toUpperCase()}`,
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
ipcMain.handle('open-live-window', (_event, html?: string, deviceType?: string) => {
  if (html) currentLiveHtml = html
  createLiveAppWindow(undefined, deviceType)
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

ipcMain.handle('open-live-window-url', (_event, url: string, deviceType?: string) => {
  createLiveAppWindow(url, deviceType)
})

// ─── Feedback Popup Window (Designer/Developer mode) ──────────────

function createFeedbackWindow(content: string, mode: 'designer' | 'developer') {
  if (feedbackWindow) {
    feedbackWindow.webContents.send('feedback-update', { content, mode })
    feedbackWindow.focus()
    return
  }

  feedbackWindow = new BrowserWindow({
    width: mode === 'developer' ? 720 : 480,
    height: mode === 'developer' ? 600 : 400,
    minWidth: 400,
    minHeight: 300,
    title: mode === 'designer' ? '🎨 Designer Feedback' : '💻 Developer Summary',
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const bgColor = mode === 'developer' ? '#0f0f17' : '#1a1a2e'
  const accentColor = mode === 'developer' ? '#60a5fa' : '#a78bfa'

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: ${bgColor}; color: #e2e8f0;
    padding: 24px; overflow-y: auto; height: 100vh;
  }
  .header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .header .badge {
    font-size: 11px; font-weight: 600; padding: 3px 10px;
    border-radius: 99px; background: ${accentColor}22; color: ${accentColor};
    border: 1px solid ${accentColor}44;
  }
  .header h1 { font-size: 15px; font-weight: 600; color: #f1f5f9; }
  .content {
    font-size: 13px; line-height: 1.7; color: #cbd5e1;
    white-space: pre-wrap; word-break: break-word;
  }
  .content h2 { font-size: 15px; color: #e0e7ff; margin: 14px 0 6px; }
  .content h3 { font-size: 13px; color: ${accentColor}; margin: 10px 0 4px; }
  .content pre {
    background: #000; padding: 12px; border-radius: 8px;
    font-family: 'SF Mono', Menlo, monospace; font-size: 11px;
    overflow-x: auto; margin: 8px 0;
  }
  .content code { background: #ffffff10; padding: 1px 4px; border-radius: 3px; font-size: 11px; }
  .actions { margin-top: 20px; display: flex; gap: 8px; }
  .actions button {
    padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer;
    font-size: 12px; font-weight: 600; transition: opacity 0.15s;
  }
  .actions button:hover { opacity: 0.85; }
  .btn-export { background: #10b981; color: white; }
  .btn-vscode { background: #3b82f6; color: white; }
  .btn-close { background: #374151; color: #9ca3af; }
</style>
</head><body>
<div class="header">
  <span class="badge">${mode === 'designer' ? '🎨 Designer' : '💻 Developer'}</span>
  <h1>${mode === 'designer' ? 'Edit Feedback' : 'Edit Summary'}</h1>
</div>
<div class="content" id="feedback-content">${escapeHtml(content)}</div>
${mode === 'developer' ? `<div class="actions">
  <button class="btn-export" onclick="window.electronAPI?.project.exportToFolder('current','~/VibeSynth/export/current')">📦 Export</button>
  <button class="btn-vscode" onclick="window.electronAPI?.shell.openVscode('~/VibeSynth/export/current')">💻 VS Code</button>
  <button class="btn-close" onclick="window.close()">Close</button>
</div>` : '<div class="actions"><button class="btn-close" onclick="window.close()">Close</button></div>'}
<script>
  const { ipcRenderer } = require('electron') || {};
  if (typeof window.__feedbackUpdate === 'undefined') {
    window.__feedbackUpdate = true;
    // Listen for content updates from main process
    const el = document.getElementById('feedback-content');
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'feedback-update' && el) el.innerHTML = e.data.content;
    });
  }
</script>
</body></html>`

  feedbackWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

  feedbackWindow.on('closed', () => {
    feedbackWindow = null
  })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Simple markdown rendering
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '• $1')
}

ipcMain.handle('feedback:show', (_event, content: string, mode: 'designer' | 'developer') => {
  createFeedbackWindow(content, mode)
})

ipcMain.handle('feedback:close', () => {
  if (feedbackWindow) {
    feedbackWindow.close()
    feedbackWindow = null
  }
})

// ─── Gemini CLI Integration ───────────────────────────────────────

ipcMain.handle('gemini-cli:available', () => {
  return isGeminiCliAvailable()
})

ipcMain.handle('gemini-cli:run', async (_event, prompt: string, outputFormat?: 'json' | 'text') => {
  try {
    const result = await runGeminiCli(prompt, { outputFormat })
    return { success: true, result }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

// ─── Live Export + VS Code (§11.2) ────────────────────────────────

ipcMain.handle('project:list-relative-paths', (_event, projectId: string) => {
  const projectDir = getProjectDir(projectId)
  return listRelativePathsSync(projectDir)
})

ipcMain.handle('project:export-to-folder', (_event, projectId: string, destPath: string) => {
  const projectDir = getProjectDir(projectId)
  const dest = expandUserPath(destPath)
  try {
    ensureDir(dest)
    copyProjectTree(projectDir, dest)
    return { success: true, path: dest }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('shell:open-vscode', (_event, folderPath: string) => {
  const resolved = expandUserPath(folderPath)
  try {
    execSync(`code "${resolved}"`, { stdio: 'ignore', timeout: 5000 })
    return { success: true }
  } catch {
    // Fallback: try 'cursor' CLI
    try {
      execSync(`cursor "${resolved}"`, { stdio: 'ignore', timeout: 5000 })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: 'Could not open VS Code or Cursor. Make sure "code" or "cursor" CLI is on your PATH.' }
    }
  }
})

// ─── Pinterest Design Steal ─────────────────────────────────────

const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// 1) Connect: open system browser for Pinterest login
ipcMain.handle('pinterest:connect', async () => {
  await shell.openExternal('https://www.pinterest.com/login/')
  pinterestConnected = true
  mainWindow?.webContents.send('pinterest:connect-done')
})

// 2) Steal: open Pinterest search in system browser
ipcMain.handle('pinterest:open', async (_event, query: string) => {
  await shell.openExternal(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`)
})

// 3) Steal by image URL: download any image URL → base64 → send to renderer
ipcMain.handle('pinterest:steal-url', async (_event, imageUrl: string) => {
  try {
    const response = await net.fetch(imageUrl, {
      headers: { 'User-Agent': CHROME_UA },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const buffer = Buffer.from(await response.arrayBuffer())
    const base64 = buffer.toString('base64')
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const mimeType = contentType.split(';')[0].trim()

    mainWindow?.webContents.send('pinterest:image-captured', base64, mimeType)
    return { success: true }
  } catch (err: any) {
    console.error('[Pinterest] Failed to download image:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('pinterest:cancel', () => {
  if (pinterestWindow) {
    pinterestWindow.close()
    pinterestWindow = null
  }
})

ipcMain.handle('live-edit-request', (_event, prompt: string, currentUrl: string) => {
  mainWindow?.webContents.send('live-edit-request', prompt, currentUrl)
})

ipcMain.handle('live-edit-result', (_event, result: { success: boolean; message: string; devMarkdown?: string }) => {
  if (liveAppWindow) {
    liveAppWindow.webContents.send('live-edit-result', result)
  }
})

function killZombieElectrons() {
  try {
    const myPid = process.pid
    if (process.platform === 'win32') {
      const out = execSync('tasklist /FI "IMAGENAME eq Electron.exe" /FO CSV /NH', { encoding: 'utf8' })
      for (const line of out.split('\n')) {
        const match = line.match(/"Electron\.exe","(\d+)"/)
        if (match) {
          const pid = parseInt(match[1], 10)
          if (pid !== myPid) try { process.kill(pid, 'SIGTERM') } catch {}
        }
      }
    } else {
      // Only kill main Electron processes (--no-sandbox), not Helper subprocesses (--type=gpu, --type=utility)
      const out = execSync('ps ax -o pid,command | grep "vibesynth.*Electron.*--no-sandbox" | grep -v "Helper" | grep -v grep 2>/dev/null || true', { encoding: 'utf8' })
      for (const line of out.trim().split('\n')) {
        const match = line.trim().match(/^(\d+)/)
        if (!match) continue
        const pid = parseInt(match[1], 10)
        if (pid && pid !== myPid && pid !== process.ppid) {
          try { process.kill(pid, 'SIGTERM') } catch {}
        }
      }
    }
  } catch {}
}

app.whenReady().then(() => {
  killZombieElectrons()
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
