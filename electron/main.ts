import { app, BrowserWindow, ipcMain, shell, net } from 'electron'
import path from 'path'
import fs from 'fs'
import { execSync, spawn, ChildProcess } from 'child_process'
import os from 'os'
import { db } from './database'
import { isGeminiCliAvailable, runGeminiCli } from './gemini-cli'
import { isBanyaCliAvailable, runBanya } from './banya-cli'

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

/** Kill any zombie dev server processes on common Vite ports (5173-5299) */
function killZombieDevServers() {
  try {
    // Find and kill any node/vite processes listening on ports 5173-5299
    const result = execSync(
      `lsof -iTCP:5173-5189,5200-5299 -sTCP:LISTEN -t 2>/dev/null || true`,
      { encoding: 'utf-8', timeout: 5000 }
    ).trim()
    if (result) {
      const pids = result.split('\n').filter(Boolean)
      console.log(`[VibeSynth] Killing ${pids.length} zombie dev server(s): ${pids.join(', ')}`)
      for (const pid of pids) {
        try { process.kill(parseInt(pid), 'SIGKILL') } catch {}
      }
    }
  } catch {}
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 10 },
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
      return { width: 1060, height: 1400 }
    case 'web':
    case 'desktop':
      return { width: 1280, height: 800 }
    default:
      return { width: 420, height: 750 }
  }
}

function createLiveAppWindow(url?: string, deviceType?: string) {
  const size = getDeviceWindowSize(deviceType)
  console.log(`[VibeSynth] createLiveAppWindow: deviceType=${deviceType}, size=${size.width}x${size.height}`)

  if (liveAppWindow) {
    liveAppWindow.setSize(size.width, size.height)
    liveAppWindow.focus()
    if (url) liveAppWindow.loadURL(url)
    return
  }

  const preloadFile = url && url.startsWith('http')
    ? path.join(__dirname, 'preload-live.js')
    : path.join(__dirname, 'preload.js')

  // Position Live App window at left side of screen
  const { screen: eScreen } = require('electron') as typeof import('electron')
  const primaryDisplay = eScreen.getPrimaryDisplay()
  const workArea = primaryDisplay.workAreaSize

  liveAppWindow = new BrowserWindow({
    width: Math.min(size.width, workArea.width - 40),
    height: Math.min(size.height, workArea.height - 40),
    x: 20,
    y: 20,
    minWidth: 320,
    minHeight: 480,
    fullscreen: false,
    fullscreenable: false,
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

  // Catch Live App console errors and forward to main window for LLM fix
  liveAppWindow.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2 && mainWindow) { // level 2 = error
      mainWindow.webContents.send('live-app-error', message)
    }
  })

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
  console.log(`[VibeSynth] IPC open-live-window: deviceType=${deviceType}`)
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

ipcMain.handle('project:clean', async (_event, projectId: string) => {
  // Stop dev server if running for this project
  if (devServerProjectId === projectId) {
    killDevServer()
  }
  const projectDir = getProjectDir(projectId)
  if (fs.existsSync(projectDir)) {
    fs.rmSync(projectDir, { recursive: true, force: true })
    console.log(`[VibeSynth] Cleaned project directory: ${projectDir}`)
  }
  return { success: true }
})

ipcMain.handle(
  'banya:run',
  async (
    event,
    opts: {
      prompt: string
      projectId?: string
      promptType?: 'ask' | 'code' | 'plan' | 'agent'
      timeoutMs?: number
      streamEventName?: string
    },
  ) => {
    if (!isBanyaCliAvailable()) {
      return {
        success: false,
        content: '',
        exitCode: null,
        error: 'banya CLI not found in PATH — install banya-cli or check $PATH',
      }
    }
    let workspace: string | undefined
    if (opts.projectId) {
      workspace = getProjectDir(opts.projectId)
      ensureDir(workspace)
    }
    const streamChannel = opts.streamEventName
    return await runBanya(opts.prompt, {
      promptType: opts.promptType,
      workspace,
      timeoutMs: opts.timeoutMs,
      onContentDelta: streamChannel
        ? (chunk) => event.sender.send(streamChannel, chunk)
        : undefined,
    })
  },
)

ipcMain.handle('project:scaffold', (_event, projectId: string, files: Record<string, string>) => {
  const projectDir = getProjectDir(projectId)
  ensureDir(projectDir)
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(projectDir, filePath)
    ensureDir(path.dirname(fullPath))
    if (typeof content === 'string' && content.startsWith('__BASE64__')) {
      // Decode base64 image data to binary file
      const base64Data = content.slice('__BASE64__'.length)
      fs.writeFileSync(fullPath, Buffer.from(base64Data, 'base64'))
    } else {
      const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      fs.writeFileSync(fullPath, data, 'utf-8')
    }
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
  killZombieDevServers()
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
  killZombieDevServers()
  return true
})

ipcMain.handle('project:restart-dev', async (_event, projectId: string) => {
  killDevServer()
  killZombieDevServers()
  const projectDir = getProjectDir(projectId)
  if (!fs.existsSync(path.join(projectDir, 'package.json'))) {
    return { success: false, error: 'Project not built yet' }
  }
  const port = 5173 + Math.floor(Math.random() * 100)
  return new Promise<{ success: boolean; url?: string; port?: number; error?: string }>((resolve) => {
    const child = spawn('npx', ['vite', '--port', String(port), '--host'], {
      cwd: projectDir, stdio: ['pipe', 'pipe', 'pipe'], shell: true,
    })
    devServerProcess = child
    devServerProjectId = projectId
    let resolved = false
    const onData = (chunk: Buffer) => {
      const text = chunk.toString()
      const match = text.match(/Local:\s+(https?:\/\/[^\s]+)/)
      if (match && !resolved) { resolved = true; resolve({ success: true, url: match[1], port }) }
    }
    child.stdout?.on('data', onData)
    child.stderr?.on('data', onData)
    child.on('error', (err) => { if (!resolved) { resolved = true; resolve({ success: false, error: err.message }) } })
    child.on('exit', (code) => {
      if (!resolved) { resolved = true; resolve({ success: false, error: `Exited ${code}` }) }
      if (devServerProcess === child) { devServerProcess = null; devServerProjectId = null }
    })
    setTimeout(() => { if (!resolved) { resolved = true; resolve({ success: false, error: 'Timeout starting dev server' }) } }, 30000)
  })
})

ipcMain.handle('project:get-status', () => {
  // Check if tracked process is actually still alive
  if (devServerProcess && devServerProcess.exitCode !== null) {
    console.log('[VibeSynth] Dev server process died (exitCode:', devServerProcess.exitCode, ') — cleaning up')
    devServerProcess = null
    devServerProjectId = null
  }
  return {
    running: devServerProcess !== null,
    projectId: devServerProjectId,
  }
})

ipcMain.handle('project:get-dev-info', () => {
  // Scan for all listening processes on Vite port range
  let activePorts: { port: number; pid: number }[] = []
  try {
    const result = execSync(
      `lsof -iTCP:5173-5189,5200-5299 -sTCP:LISTEN -P -n 2>/dev/null || true`,
      { encoding: 'utf-8', timeout: 3000 }
    ).trim()
    if (result) {
      for (const line of result.split('\n').slice(1)) { // skip header
        const parts = line.split(/\s+/)
        const pid = parseInt(parts[1])
        const portMatch = parts[8]?.match(/:(\d+)$/)
        if (pid && portMatch) {
          activePorts.push({ port: parseInt(portMatch[1]), pid })
        }
      }
    }
  } catch {}

  return {
    tracked: devServerProcess ? {
      pid: devServerProcess.pid,
      projectId: devServerProjectId,
      alive: devServerProcess.exitCode === null,
    } : null,
    activePorts,
  }
})

ipcMain.handle('open-live-window-url', (_event, url: string, deviceType?: string) => {
  console.log(`[VibeSynth] IPC open-live-window-url: url=${url}, deviceType=${deviceType}`)
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
    fullscreen: false,
    fullscreenable: false,
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

// ─── Live Edit Popup Window ───────────────────────────────────────

let liveEditWindow: BrowserWindow | null = null

ipcMain.handle('live-edit:open', () => {
  if (liveEditWindow) {
    liveEditWindow.focus()
    return
  }

  // Position Live Edit window at bottom-right, not overlapping Live App
  const { screen: electronScreen } = require('electron') as typeof import('electron')
  const display = electronScreen.getPrimaryDisplay()
  const { width: screenW, height: screenH } = display.workAreaSize
  const editW = 700, editH = 800

  liveEditWindow = new BrowserWindow({
    width: editW,
    height: editH,
    x: screenW - editW - 20,
    y: screenH - editH - 20,
    minWidth: 400,
    minHeight: 300,
    fullscreen: false,
    fullscreenable: false,
    title: '✦ VibeSynth — Live Edit',
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f17;color:#e2e8f0;display:flex;flex-direction:column;height:100vh}
  .header{padding:10px 16px;border-bottom:1px solid #1e1e2e;display:flex;align-items:center;justify-content:space-between;-webkit-app-region:drag}
  .header .logo{font-size:13px;font-weight:600;color:#a5b4fc}
  .mode-toggle{display:flex;gap:2px;background:#1a1a2e;border-radius:8px;padding:2px;-webkit-app-region:no-drag}
  .mode-btn{padding:4px 10px;font-size:11px;font-weight:600;border:none;border-radius:6px;cursor:pointer;transition:all 0.15s;background:transparent;color:#64748b}
  .mode-btn.active{color:white}
  .mode-btn.designer.active{background:#7c3aed}
  .mode-btn.developer.active{background:#3b82f6}
  .content{flex:1;display:flex;flex-direction:column;padding:12px 16px;gap:10px;overflow:hidden;min-height:0}
  .input-area{display:flex;gap:8px;min-height:0}
  .input-area.expand{flex:1}
  textarea{flex:1;background:#1a1a2e;border:1px solid #2d2d44;border-radius:10px;padding:10px 14px;color:#e2e8f0;font-size:13px;resize:none;outline:none;font-family:inherit;min-height:60px}
  textarea:focus{border-color:#7c3aed}
  textarea::placeholder{color:#4a4a6a}
  button.submit{background:#7c3aed;color:white;border:none;border-radius:10px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background 0.15s}
  button.submit:hover{background:#6d28d9}
  button.submit:disabled{opacity:0.4;cursor:not-allowed}
  .palette{display:none;background:#1a1a2e;border-radius:8px;padding:10px;margin-bottom:4px}
  .palette.visible{display:block}
  .palette h4{font-size:10px;font-weight:600;color:#a5b4fc;margin-bottom:6px}
  .color-row{display:flex;gap:3px;margin-bottom:6px;flex-wrap:wrap}
  .color-swatch{width:24px;height:24px;border-radius:6px;cursor:pointer;border:2px solid transparent;transition:all 0.15s}
  .color-swatch:hover{border-color:white;transform:scale(1.15)}
  .font-list{display:flex;flex-wrap:wrap;gap:4px}
  .font-item{padding:3px 8px;border-radius:99px;cursor:pointer;font-size:10px;color:#94a3b8;transition:all 0.15s;background:#0f0f17;border:1px solid #2d2d44;white-space:nowrap}
  .font-item:hover{background:#2d2d44;color:white;border-color:#7c3aed}
  .attach-bar{display:flex;align-items:center;gap:6px;padding:4px 0}
  .attach-btn{background:none;border:1px solid #2d2d44;border-radius:8px;padding:4px 10px;color:#94a3b8;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px}
  .attach-btn:hover{border-color:#7c3aed;color:#e2e8f0}
  .attach-chips{display:flex;flex-wrap:wrap;gap:4px}
  .attach-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:99px;background:#2d2d44;color:#94a3b8;font-size:10px}
  .attach-chip button{background:none;border:none;color:#64748b;cursor:pointer;font-size:10px}
  .attach-chip button:hover{color:#f87171}
  .feedback{font-size:12px;line-height:1.6;color:#94a3b8;white-space:pre-wrap;max-height:200px;overflow-y:auto;padding:10px;background:#1a1a2e;border-radius:8px;display:none}
  .feedback.visible{display:block}
  .feedback.success{border-left:3px solid #34d399}
  .feedback.error{border-left:3px solid #f87171}
  .feedback.generating{border-left:3px solid #fbbf24}
  .feedback h3{font-size:11px;font-weight:700;margin-bottom:4px;color:#a5b4fc}
  .feedback pre{background:#000;padding:8px;border-radius:6px;font-size:10px;overflow-x:auto;margin:4px 0}
  .feedback code{background:#ffffff10;padding:1px 4px;border-radius:3px;font-size:10px}
  .status{font-size:11px;color:#64748b;text-align:center;padding:2px}
  .section-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin-bottom:4px}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
</style></head><body>
<div class="header">
  <span class="logo">✦ Live Edit</span>
  <div class="mode-toggle">
    <button class="mode-btn designer active" id="le-mode-designer">🎨 Designer</button>
    <button class="mode-btn developer" id="le-mode-developer">💻 Developer</button>
  </div>
</div>
<div class="content">
  <!-- Designer Palette (colors + fonts) -->
  <div class="palette" id="le-palette">
    <h4>🎨 Color Palette</h4>
    <div id="le-colors"></div>
    <h4 style="margin-top:8px">🔤 Fonts</h4>
    <div class="font-list" id="le-fonts"></div>
  </div>

  <!-- File Attachment Bar (common to both modes) -->
  <div class="attach-bar" id="le-attach-bar">
    <button class="attach-btn" id="le-attach-btn">+ Attach</button>
    <input type="file" id="le-file-input" accept="image/*,.txt,.csv,.md" multiple style="display:none">
    <div class="attach-chips" id="le-attach-chips"></div>
  </div>

  <div class="input-area">
    <textarea id="le-input" rows="4" placeholder="Describe changes to apply..."></textarea>
    <button class="submit" id="le-submit">Apply</button>
  </div>

  <!-- Selected DOM element preview -->
  <div id="le-dom-preview" style="display:none;background:#1a1a2e;border:1px solid #2d2d44;border-radius:8px;padding:8px;margin-bottom:4px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <span class="section-label">Selected Element</span>
      <button id="le-dom-clear" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:10px">✕ Clear</button>
    </div>
    <pre id="le-dom-html" style="background:#000;padding:6px;border-radius:4px;font-size:9px;color:#94a3b8;max-height:80px;overflow:auto;white-space:pre-wrap"></pre>
  </div>

  <div class="feedback" id="le-feedback"></div>

  <!-- Developer mode: project info -->
  <div id="le-project-info" style="display:none;font-size:11px;color:#64748b;background:#1a1a2e;border-radius:8px;padding:10px;overflow-y:auto;min-height:0">
    <div style="font-weight:600;color:#60a5fa;margin-bottom:6px">📁 Workspace</div>
    <div id="le-project-path" style="font-family:monospace;font-size:10px;color:#94a3b8;margin-bottom:8px;word-break:break-all"></div>
    <div style="font-weight:600;color:#60a5fa;margin-bottom:4px">📄 Files</div>
    <div id="le-project-files" style="font-family:monospace;font-size:10px;line-height:1.6"></div>
  </div>
  <div class="status" id="le-status"></div>
</div>
<script>
  let currentMode = localStorage.getItem('vibesynth-live-feedback-mode') || 'designer';
  const input = document.getElementById('le-input');
  const submit = document.getElementById('le-submit');
  const feedback = document.getElementById('le-feedback');
  const status = document.getElementById('le-status');
  const designerBtn = document.getElementById('le-mode-designer');
  const developerBtn = document.getElementById('le-mode-developer');
  const palette = document.getElementById('le-palette');
  const colorsDiv = document.getElementById('le-colors');
  const fontsDiv = document.getElementById('le-fonts');
  const projectInfo = document.getElementById('le-project-info');
  const projectPath = document.getElementById('le-project-path');
  const projectFiles = document.getElementById('le-project-files');
  const attachBtn = document.getElementById('le-attach-btn');
  const fileInput = document.getElementById('le-file-input');
  const attachChips = document.getElementById('le-attach-chips');
  const domPreview = document.getElementById('le-dom-preview');
  const domHtml = document.getElementById('le-dom-html');
  const domClear = document.getElementById('le-dom-clear');
  const inputArea = document.querySelector('.input-area');

  let attachedFiles = [];

  // ── Palette: load DS colors + fonts ──
  const POPULAR_FONTS = [
    'Inter','Roboto','Poppins','Montserrat','Lato','DM Sans','Space Grotesk',
    'Outfit','Playfair Display','Merriweather','Lora','Bebas Neue','Oswald',
    'JetBrains Mono','Fira Code','Nunito','Raleway','Quicksand','Sora','Urbanist'
  ];

  async function loadPalette() {
    try {
      const ds = await window.electronAPI?.liveEdit?.getDesignSystem?.();
      colorsDiv.innerHTML = '';
      if (ds && ds.colors) {
        const roles = ['primary','secondary','tertiary','neutral'];
        roles.forEach(role => {
          const c = ds.colors[role];
          if (!c) return;
          const label = document.createElement('div');
          label.className = 'section-label';
          label.textContent = role.charAt(0).toUpperCase() + role.slice(1);
          colorsDiv.appendChild(label);
          const row = document.createElement('div');
          row.className = 'color-row';
          // Base color + tones
          const allColors = [c.base, ...(c.tones || [])];
          allColors.forEach(hex => {
            if (!hex) return;
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.background = hex;
            swatch.title = hex;
            swatch.addEventListener('click', () => insertAtCursor(hex + ' '));
            row.appendChild(swatch);
          });
          colorsDiv.appendChild(row);
        });
      } else {
        colorsDiv.innerHTML = '<div style="color:#64748b;font-size:10px">No design system loaded</div>';
      }
      // Fonts: DS fonts first, then popular fonts
      fontsDiv.innerHTML = '';
      const dsfonts = [];
      if (ds && ds.typography) {
        ['headline','body','label'].forEach(level => {
          if (ds.typography[level]?.family) dsfonts.push(ds.typography[level].family);
        });
      }
      const allFonts = [...new Set([...dsfonts, ...POPULAR_FONTS])];
      allFonts.forEach(font => {
        const item = document.createElement('div');
        item.className = 'font-item';
        item.textContent = font;
        if (dsfonts.includes(font)) item.style.color = '#a5b4fc';
        item.addEventListener('click', () => insertAtCursor(font + ' '));
        fontsDiv.appendChild(item);
      });
    } catch(e) { console.error('[LiveEdit] loadPalette error:', e); }
  }

  function insertAtCursor(text) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.substring(0, start) + text + input.value.substring(end);
    input.selectionStart = input.selectionEnd = start + text.length;
    input.focus();
  }

  // ── File Attachment ──
  attachBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    for (const file of fileInput.files) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (['txt','csv','md'].includes(ext)) {
        const text = await file.text();
        attachedFiles.push({ name: file.name, type: 'text', content: text });
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        const b64 = await new Promise(r => { reader.onload = () => r(reader.result); reader.readAsDataURL(file); });
        attachedFiles.push({ name: file.name, type: 'image', content: b64 });
      }
    }
    renderChips();
    fileInput.value = '';
  });

  function renderChips() {
    attachChips.innerHTML = attachedFiles.map((f, i) =>
      '<span class="attach-chip">' + f.name + '<button data-idx="' + i + '">✕</button></span>'
    ).join('');
    attachChips.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        attachedFiles.splice(parseInt(btn.dataset.idx), 1);
        renderChips();
      });
    });
  }

  // ── DOM element preview (received from Live App) ──
  domClear.addEventListener('click', () => {
    domPreview.style.display = 'none';
    domHtml.textContent = '';
  });

  // Listen for selected DOM element from Live App
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'vibesynth-dom-selected') {
      domHtml.textContent = e.data.html;
      domPreview.style.display = 'block';
    }
  });

  // ── Mode switching ──
  function setMode(mode) {
    currentMode = mode;
    localStorage.setItem('vibesynth-live-feedback-mode', mode);
    designerBtn.className = 'mode-btn designer' + (mode === 'designer' ? ' active' : '');
    developerBtn.className = 'mode-btn developer' + (mode === 'developer' ? ' active' : '');
    // Designer: show palette + expand textarea; Developer: expand file explorer
    if (mode === 'designer') {
      palette.classList.add('visible');
      projectInfo.style.display = 'none';
      projectInfo.style.flex = '';
      inputArea.classList.add('expand');
      loadPalette();
    } else {
      palette.classList.remove('visible');
      projectInfo.style.display = 'flex';
      projectInfo.style.flexDirection = 'column';
      projectInfo.style.flex = '1';
      inputArea.classList.remove('expand');
      loadProjectInfo();
    }
  }

  async function loadProjectInfo() {
    try {
      const info = await window.electronAPI?.liveEdit?.getProjectInfo?.();
      if (info && projectPath && projectFiles) {
        projectPath.textContent = info.path;
        projectFiles.innerHTML = info.files
          .map(f => '<div style="color:' + (f.endsWith('.tsx') ? '#93c5fd' : f.endsWith('.css') ? '#f9a8d4' : f.endsWith('.json') ? '#fcd34d' : '#94a3b8') + '">' + f + '</div>')
          .join('');
      }
    } catch {}
  }

  // Init mode from localStorage
  setMode(currentMode);
  designerBtn.addEventListener('click', () => setMode('designer'));
  developerBtn.addEventListener('click', () => setMode('developer'));

  async function handleSubmit() {
    let prompt = input.value.trim();
    if (!prompt && attachedFiles.length === 0) return;

    // Append text file contents to prompt
    attachedFiles.filter(f => f.type === 'text').forEach(f => {
      prompt += '\\n\\n[File: ' + f.name + ']\\n' + f.content;
    });

    // Append DOM element context if present
    const domCtx = domHtml.textContent;
    if (domCtx) {
      prompt += '\\n\\n[Selected Element]\\n' + domCtx;
    }

    submit.disabled = true;
    status.textContent = 'Applying changes...';
    feedback.className = 'feedback generating visible';
    feedback.innerHTML = '<div style="display:flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.2"/><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg> Processing...</div>';
    console.log('[LiveEdit] Sending edit request:', prompt);
    try {
      await window.electronAPI?.liveEdit?.sendRequest?.(prompt);
      // Clear attachments + DOM preview after send
      attachedFiles = [];
      renderChips();
      domPreview.style.display = 'none';
      domHtml.textContent = '';
    } catch (err) {
      console.error('[LiveEdit] Send failed:', err);
      feedback.textContent = 'Failed to send request';
      feedback.className = 'feedback error visible';
      submit.disabled = false;
    }
  }

  submit.addEventListener('click', handleSubmit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  });
</script>
</body></html>`

  // Write HTML to temp file — data: URLs block inline scripts with CSP
  const tmpDir = path.join(app.getPath('userData'), 'vibesynth-data')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  const tmpFile = path.join(tmpDir, 'live-edit.html')
  fs.writeFileSync(tmpFile, html, 'utf-8')
  liveEditWindow.loadFile(tmpFile)

  liveEditWindow.on('closed', () => { liveEditWindow = null })
})

// Get current design system for Live Edit palette
ipcMain.handle('live-edit:get-design-system', () => {
  if (!devServerProjectId) return null
  const project = db.getProject(devServerProjectId)
  return project?.designSystem || null
})

// Get project workspace info for Developer mode display
ipcMain.handle('live-edit:get-project-info', () => {
  if (!devServerProjectId) return null
  const projectDir = getProjectDir(devServerProjectId)
  const files = fs.existsSync(projectDir) ? listRelativePathsSync(projectDir) : []
  return { projectId: devServerProjectId, path: projectDir, files }
})

ipcMain.handle('live-edit:update-feedback', (_event, message: string, type: 'success' | 'error' | 'generating', devMarkdown?: string) => {
  if (liveEditWindow) {
    const escapedMsg = JSON.stringify(message)
    const escapedMd = devMarkdown ? JSON.stringify(devMarkdown) : 'null'
    liveEditWindow.webContents.executeJavaScript(`
      (function() {
        const fb = document.getElementById('le-feedback');
        const st = document.getElementById('le-status');
        const sub = document.getElementById('le-submit');
        const md = ${escapedMd};
        const mode = localStorage.getItem('vibesynth-live-feedback-mode') || 'designer';

        if (fb) {
          if (mode === 'developer' && md) {
            // Developer mode: show markdown diff
            let html = md
              .replace(/^### (.+)$/gm, '<h3>$1</h3>')
              .replace(/^## (.+)$/gm, '<h3 style="color:#a5b4fc">$1</h3>')
              .replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre>$1</pre>')
              .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
              .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
              .replace(/^- (.+)$/gm, '• $1');
            fb.innerHTML = html;
          } else {
            // Designer mode: friendly text
            fb.textContent = ${escapedMsg};
          }
          fb.className = 'feedback ${type} visible';
        }
        if (st) { st.textContent = '${type === 'success' ? '✓ Applied' : type === 'error' ? '✗ Failed' : '⏳ Processing...'}'; }
        if (sub) { sub.disabled = ${type === 'generating'}; }
        if ('${type}' === 'success' && sub) {
          document.getElementById('le-input').value = '';
          // Refresh project info (file list may have changed after LLM edit)
          if (mode === 'developer' && typeof loadProjectInfo === 'function') loadProjectInfo();
          // Refresh palette (DS may have changed)
          if (mode === 'designer' && typeof loadPalette === 'function') loadPalette();
        }
      })();
    `)
  }
})

// Forward DOM selection from Live App to Live Edit popup
ipcMain.handle('live-edit:dom-selected', (_event, html: string) => {
  if (liveEditWindow) {
    const escapedHtml = JSON.stringify(html)
    liveEditWindow.webContents.executeJavaScript(`
      (function() {
        const preview = document.getElementById('le-dom-preview');
        const pre = document.getElementById('le-dom-html');
        const input = document.getElementById('le-input');
        if (preview && pre) {
          pre.textContent = ${escapedHtml};
          preview.style.display = 'block';
        }
        // Insert into textarea at cursor position
        if (input) {
          const tag = ${escapedHtml};
          const snippet = '\\n[Element]: ' + tag + '\\n';
          const start = input.selectionStart;
          const end = input.selectionEnd;
          input.value = input.value.substring(0, start) + snippet + input.value.substring(end);
          input.selectionStart = input.selectionEnd = start + snippet.length;
          input.focus();
        }
      })();
    `)
  }
})

ipcMain.handle('live-edit:close', () => {
  if (liveEditWindow) { liveEditWindow.close(); liveEditWindow = null }
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
    if (!fs.existsSync(projectDir)) {
      return { success: false, error: `Project directory not found: ${projectDir}` }
    }
    const files = listRelativePathsSync(projectDir)
    if (files.length === 0) {
      return { success: false, error: 'Project has no files to export' }
    }
    ensureDir(dest)
    copyProjectTree(projectDir, dest)
    return { success: true, path: dest, fileCount: files.length }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

// ZIP export — package all screens as HTML/CSS/JS files
ipcMain.handle('project:export-zip', async (_event, projectId: string, screens: { name: string; html: string }[]) => {
  const { dialog } = require('electron') as typeof import('electron')

  const result = await dialog.showSaveDialog({
    title: 'Export Project as ZIP',
    defaultPath: `vibesynth-${projectId.slice(0, 8)}.zip`,
    filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
  })

  if (result.canceled || !result.filePath) return { success: false, error: 'Cancelled' }

  try {
    const archiver = require('archiver')
    const output = fs.createWriteStream(result.filePath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    return new Promise<{ success: boolean; path?: string; error?: string }>((resolve) => {
      output.on('close', () => resolve({ success: true, path: result.filePath! }))
      archive.on('error', (err: any) => resolve({ success: false, error: err.message }))
      archive.pipe(output)

      // Add each screen as separate HTML file
      for (const screen of screens) {
        const fileName = screen.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
        archive.append(screen.html, { name: `${fileName}.html` })
      }

      // If project has generated React files, include those too
      const projectDir = getProjectDir(projectId)
      if (fs.existsSync(projectDir)) {
        archive.directory(projectDir, 'react-app')
      }

      archive.finalize()
    })
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
  console.log(`[VibeSynth] live-edit-request: prompt="${prompt?.slice(0, 50)}", mainWindow=${!!mainWindow}`)
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
  killZombieDevServers()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('before-quit', () => {
  killDevServer()
  killZombieDevServers()
})

app.on('window-all-closed', () => {
  killDevServer()
  killZombieDevServers()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
