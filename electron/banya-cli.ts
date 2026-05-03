/**
 * Banya CLI Integration
 *
 * Spawns `banya run --prompt-type=agent` with a project workspace. banya-core
 * uses its tool-based workflow (write_file, update_file, ...) to create or
 * modify files directly on disk over multiple LLM turns — so we're not bound
 * to the ~4k-token single-response limit that `ask` mode imposes.
 *
 * After banya exits, we scan the workspace and return the resulting file map
 * back to the renderer, so the existing scaffold/cache/build flow in vibesynth
 * keeps its contract of `Record<string, string>`.
 */

import { execSync, spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

let resolvedBanyaPath: string | null | undefined = undefined

function resolveBanyaPath(): string | null {
  if (resolvedBanyaPath !== undefined) return resolvedBanyaPath
  const candidates = [
    'banya',
    path.join(os.homedir(), '.local', 'bin', 'banya'),
    '/usr/local/bin/banya',
    '/opt/homebrew/bin/banya',
  ]
  for (const candidate of candidates) {
    try {
      execSync(`${JSON.stringify(candidate)} version`, { stdio: 'pipe', timeout: 5000 })
      resolvedBanyaPath = candidate
      return candidate
    } catch { /* try next candidate */ }
  }
  resolvedBanyaPath = null
  return null
}

export function isBanyaCliAvailable(): boolean {
  return resolveBanyaPath() !== null
}

// ─── Detection / validation API for the Settings page ─────────

export interface BanyaCliInfo {
  available: boolean
  path: string             // resolved or empty
  version: string          // banya version output (or empty)
  error?: string           // populated when validation failed
}

/** Force a fresh detection — clears the cached resolved path. Useful when
 * the user installs the CLI mid-session. */
export function detectBanyaCli(explicitPath?: string): BanyaCliInfo {
  // If an explicit path is provided, validate it directly without caching.
  if (explicitPath && explicitPath.trim()) {
    const p = explicitPath.trim()
    return validateBanyaCliAt(p)
  }

  // Reset cache so we re-probe well-known locations.
  resolvedBanyaPath = undefined
  const found = resolveBanyaPath()
  if (!found) {
    return {
      available: false,
      path: '',
      version: '',
      error: 'banya CLI 를 찾을 수 없음 — `make install` 또는 `~/.local/bin/banya` 확인',
    }
  }
  return validateBanyaCliAt(found)
}

function validateBanyaCliAt(p: string): BanyaCliInfo {
  if (!p) return { available: false, path: '', version: '', error: '경로 비어있음' }
  if (p !== 'banya' && !fs.existsSync(p)) {
    return { available: false, path: p, version: '', error: `파일 없음: ${p}` }
  }
  try {
    const out = execSync(`${JSON.stringify(p)} version`, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000,
      encoding: 'utf-8',
    }).trim()
    // Output looks like "banya version 0.1.0".
    const version = out || '(no output)'
    return { available: true, path: p, version }
  } catch (e: any) {
    return {
      available: false,
      path: p,
      version: '',
      error: `'${p} version' 실행 실패: ${(e?.message || '').slice(0, 200)}`,
    }
  }
}

function resolveGeminiKey(): string {
  // User-saved setting wins (set via Settings UI, persisted in db).
  try {
    const { db } = require('./database') as { db: { getSettings: (u: string) => any } }
    const s = db.getSettings('default')
    if (s?.apiKey && String(s.apiKey).trim()) return String(s.apiKey).trim()
  } catch { /* db not available — fall through */ }

  const fromEnv = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
  if (fromEnv) return fromEnv
  try {
    const envPath = path.resolve(__dirname, '..', '.env')
    if (!fs.existsSync(envPath)) return ''
    const text = fs.readFileSync(envPath, 'utf-8')
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      if (key !== 'VITE_GEMINI_API_KEY' && key !== 'GEMINI_API_KEY') continue
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      return val
    }
  } catch { /* ignore */ }
  return ''
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-electron', '.vite'])

const BINARY_EXTS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico', 'bmp',
  'pdf', 'woff', 'woff2', 'ttf', 'otf', 'eot',
  'mp3', 'mp4', 'wav', 'webm', 'mov',
  'zip', 'gz', 'tar',
])

function isBinaryPath(rel: string): boolean {
  const dot = rel.lastIndexOf('.')
  if (dot === -1) return false
  const ext = rel.slice(dot + 1).toLowerCase()
  return BINARY_EXTS.has(ext)
}

function listRelativePaths(dir: string, base = ''): string[] {
  const out: string[] = []
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const rel = base ? `${base}/${name}` : name
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) out.push(...listRelativePaths(full, rel))
    else out.push(rel.replace(/\\/g, '/'))
  }
  return out
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

/**
 * Write pre-scaffolded files (deterministic parts: package.json, vite.config,
 * index.html, main.tsx, screen ref HTMLs, public images) to the workspace so
 * banya has context and only needs to generate the AI-driven files.
 */
function writePreScaffold(workspace: string, files: Record<string, string>) {
  ensureDir(workspace)
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(workspace, rel)
    ensureDir(path.dirname(full))
    if (typeof content === 'string' && content.startsWith('__BASE64__')) {
      fs.writeFileSync(full, Buffer.from(content.slice('__BASE64__'.length), 'base64'))
    } else {
      fs.writeFileSync(full, content, 'utf-8')
    }
  }
}

function readWorkspaceFiles(workspace: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rel of listRelativePaths(workspace)) {
    // Skip binary files — they'd corrupt under UTF-8 decode, and the caller
    // doesn't need them in the returned map (they stay on disk untouched).
    if (isBinaryPath(rel)) continue
    const full = path.join(workspace, rel)
    try {
      const buf = fs.readFileSync(full)
      out[rel] = buf.toString('utf-8')
    } catch { /* ignore unreadable */ }
  }
  return out
}

export interface BanyaCodegenOptions {
  projectId: string
  workspace: string
  prompt: string
  preScaffold?: Record<string, string>
  timeoutMs?: number
  /** Optional path to a PNG/JPEG to attach to the first turn — passed to
   * the agent CLI as `--image-file`, surfaced to the LLM as multimodal
   * inline data. Lets vibesynth send a rendered design screenshot
   * alongside the HTML for vision-aware Kotlin codegen. */
  imageFile?: string
  onContentDelta?: (chunk: string) => void
  onEvent?: (eventType: string, data: any) => void
}

export interface BanyaCodegenResult {
  success: boolean
  files: Record<string, string>
  exitCode: number | null
  error?: string
  content: string
}

/**
 * Run banya-core in agent mode to generate/modify files directly in a project
 * workspace. Returns the complete workspace file map after banya exits.
 */
export async function runBanyaCodegen(
  options: BanyaCodegenOptions,
): Promise<BanyaCodegenResult> {
  const apiKey = resolveGeminiKey()
  if (!apiKey) {
    return {
      success: false,
      files: {},
      exitCode: null,
      content: '',
      error: 'VITE_GEMINI_API_KEY not set — add it to vibesynth/.env or export it in your shell',
    }
  }
  const banyaBin = resolveBanyaPath()
  if (!banyaBin) {
    return {
      success: false,
      files: {},
      exitCode: null,
      content: '',
      error: 'banya CLI not found — tried PATH, ~/.local/bin/banya, /usr/local/bin/banya, /opt/homebrew/bin/banya',
    }
  }

  if (options.preScaffold) {
    writePreScaffold(options.workspace, options.preScaffold)
  }
  ensureDir(options.workspace)

  const timeoutMs = options.timeoutMs ?? 15 * 60 * 1000
  const tmpPromptFile = path.join(
    os.tmpdir(),
    `vibesynth-banya-prompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`,
  )
  fs.writeFileSync(tmpPromptFile, options.prompt, 'utf-8')

  // Saved Settings → banyaCliConfig drives backend/model/critic args.
  // 'fixed' mode (default): vibesynth forces Gemini + chosen model + critic
  //   off (or on, per saved toggle).
  // 'cli-default' mode: omit --llm-* and --critic so the CLI uses the
  //   user's `banya config` values (their main provider/model + critic).
  let banyaCfg: any = {}
  try {
    const { db } = require('./database') as { db: { getSettings: (u: string) => any } }
    banyaCfg = db.getSettings('default')?.banyaCliConfig || {}
  } catch { /* db not ready — fall back to fixed Gemini */ }
  const mode = banyaCfg.agentModelMode || 'fixed'
  const fixedModel = banyaCfg.fixedModel || 'gemini-2.0-flash'
  const criticEnabled = !!banyaCfg.criticEnabled

  const args = [
    'run',
    '--prompt-file', tmpPromptFile,
    '--prompt-type', 'agent',
    '--workspace', options.workspace,
    '--no-patch-nudge',
    '--auto-approve=true',
    '--idle-abort', '0',
    '--timeout', `${Math.floor(timeoutMs / 1000)}s`,
  ]
  if (mode === 'fixed') {
    args.push('--llm-backend', 'gemini', '--llm-key', apiKey, '--llm-model', fixedModel)
    args.push(criticEnabled ? '--critic=true' : '--critic=false')
  } else {
    // cli-default: still need a key for Gemini critic if user enables it,
    // but otherwise let CLI pick its main provider from ~/.banya.
    if (criticEnabled) args.push('--critic=true')
    else args.push('--critic=false')
  }
  if (options.imageFile && fs.existsSync(options.imageFile)) {
    args.push('--image-file', options.imageFile)
  }

  return new Promise<BanyaCodegenResult>((resolve) => {
    const child = spawn(banyaBin, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
      cwd: options.workspace,
    })

    let content = ''
    let stderrBuf = ''
    let stdoutBuf = ''
    let settled = false

    const settle = (result: BanyaCodegenResult) => {
      if (settled) return
      settled = true
      try { fs.unlinkSync(tmpPromptFile) } catch { /* ignore */ }
      resolve(result)
    }

    const handleLine = (line: string) => {
      if (!line.trim()) return
      let evt: any
      try { evt = JSON.parse(line) } catch { return }
      if (evt?.type === 'content_delta') {
        const chunk: string = evt?.data?.content ?? ''
        if (chunk) {
          content += chunk
          options.onContentDelta?.(chunk)
        }
      }
      if (evt?.type) options.onEvent?.(evt.type, evt.data)
    }

    child.stdout?.on('data', (buf: Buffer) => {
      stdoutBuf += buf.toString('utf-8')
      let idx: number
      while ((idx = stdoutBuf.indexOf('\n')) !== -1) {
        const line = stdoutBuf.slice(0, idx)
        stdoutBuf = stdoutBuf.slice(idx + 1)
        handleLine(line)
      }
    })

    child.stderr?.on('data', (buf: Buffer) => {
      stderrBuf += buf.toString('utf-8')
    })

    child.on('error', (err) => {
      settle({ success: false, files: {}, exitCode: null, content, error: err.message })
    })

    child.on('exit', (code) => {
      if (stdoutBuf.trim()) handleLine(stdoutBuf)
      const files = readWorkspaceFiles(options.workspace)
      try {
        const logDir = path.join(os.tmpdir(), 'vibesynth-banya-logs')
        fs.mkdirSync(logDir, { recursive: true })
        const logPath = path.join(logDir, `codegen-${Date.now()}.log`)
        fs.writeFileSync(
          logPath,
          `=== PROMPT ===\n${options.prompt}\n\n=== CONTENT ===\n${content}\n\n=== FILES (${Object.keys(files).length}) ===\n${Object.keys(files).sort().join('\n')}\n\n=== STDERR ===\n${stderrBuf}\n\n=== EXIT ${code} ===\n`,
          'utf-8',
        )
        console.log(`[banya:codegen] exit=${code} files=${Object.keys(files).length} log=${logPath}`)
      } catch { /* ignore */ }
      const ok = code === 0
      settle({
        success: ok,
        files,
        exitCode: code,
        content,
        error: ok ? undefined : `banya run exited ${code}${stderrBuf ? `: ${stderrBuf.slice(-500)}` : ''}`,
      })
    })

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      const files = readWorkspaceFiles(options.workspace)
      settle({
        success: false,
        files,
        exitCode: null,
        content,
        error: `banya run timed out after ${timeoutMs}ms`,
      })
    }, timeoutMs + 15_000)
    child.on('exit', () => clearTimeout(timer))
  })
}
