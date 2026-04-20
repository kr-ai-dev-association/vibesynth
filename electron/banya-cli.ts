/**
 * Banya CLI Integration
 *
 * Spawns `banya run` as a subprocess to replace direct Gemini API calls for
 * codegen tasks (frontend app scaffolding, incremental builds, build-error fixes).
 *
 * Uses --prompt-type=ask so banya-core routes the prompt to the LLM without
 * tool calls — we collect content_delta events from the NDJSON stream and
 * return the accumulated text, letting callers parse the JSON themselves
 * (drop-in replacement for `model.generateContent([prompt]).response.text()`).
 */

import { execSync, spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

let banyaAvailable: boolean | null = null

export function isBanyaCliAvailable(): boolean {
  if (banyaAvailable !== null) return banyaAvailable
  try {
    execSync('banya version', { stdio: 'pipe', timeout: 5000 })
    banyaAvailable = true
  } catch {
    banyaAvailable = false
  }
  return banyaAvailable
}

export interface RunBanyaOptions {
  promptType?: 'ask' | 'code' | 'plan' | 'agent'
  workspace?: string
  timeoutMs?: number
  onContentDelta?: (chunk: string) => void
}

export interface RunBanyaResult {
  success: boolean
  content: string
  exitCode: number | null
  error?: string
}

/**
 * Run `banya run` with a prompt and collect content_delta events as plain text.
 *
 * Uses --llm-backend=gemini with VITE_GEMINI_API_KEY so no extra configuration
 * is needed beyond the existing Gemini key vibesynth already ships with.
 */
export async function runBanya(
  prompt: string,
  options: RunBanyaOptions = {},
): Promise<RunBanyaResult> {
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
  if (!apiKey) {
    return {
      success: false,
      content: '',
      exitCode: null,
      error: 'VITE_GEMINI_API_KEY not set — banya run --llm-backend gemini requires it',
    }
  }

  const promptType = options.promptType ?? 'ask'
  const workspace = options.workspace ?? os.tmpdir()
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000

  const tmpPromptFile = path.join(
    os.tmpdir(),
    `vibesynth-banya-prompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`,
  )
  fs.writeFileSync(tmpPromptFile, prompt, 'utf-8')

  const args = [
    'run',
    '--prompt-file', tmpPromptFile,
    '--prompt-type', promptType,
    '--workspace', workspace,
    '--llm-backend', 'gemini',
    '--llm-key', apiKey,
    '--critic=false',
    '--idle-abort', '0',
    '--timeout', `${Math.floor(timeoutMs / 1000)}s`,
  ]

  return new Promise<RunBanyaResult>((resolve) => {
    const child = spawn('banya', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    })

    let content = ''
    let stderrBuf = ''
    let stdoutBuf = ''
    let settled = false

    const settle = (result: RunBanyaResult) => {
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
      settle({ success: false, content, exitCode: null, error: err.message })
    })

    child.on('exit', (code) => {
      if (stdoutBuf.trim()) handleLine(stdoutBuf)
      const ok = code === 0 && content.length > 0
      settle({
        success: ok,
        content,
        exitCode: code,
        error: ok ? undefined : `banya run exited ${code}${stderrBuf ? `: ${stderrBuf.slice(-500)}` : ''}`,
      })
    })

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      settle({
        success: false,
        content,
        exitCode: null,
        error: `banya run timed out after ${timeoutMs}ms`,
      })
    }, timeoutMs + 15_000)
    child.on('exit', () => clearTimeout(timer))
  })
}
