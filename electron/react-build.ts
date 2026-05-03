/**
 * Web (React+Vite) live-app build pipeline — single channel through banya
 * CLI agent, mirroring the Android pipeline:
 *
 *   1. scaffold a React+Vite project at ~/VibeSynth/workspaces/<id>/web/ (idempotent)
 *   2. drop each screen's HTML to <projectDir>/_design/
 *   3. render the first screen to PNG (multimodal anchor)
 *   4. spawn banya CLI agent: convert HTMLs → src/App.tsx + src/pages/*.tsx
 *      with --image-file = first PNG so the model sees the design
 *   5. caller takes over: project:install + project:start-dev
 *
 * The agent loop iterates internally on its own errors. Hash-based skip
 * lets repeat runs short-circuit when nothing changed.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as crypto from 'crypto'
import type { BrowserWindow } from 'electron'
import { buildReactScaffold } from './react-templates'
import { runBanyaCodegen, isBanyaCliAvailable } from './banya-cli'
import { captureHtmlToPng } from './screen-capture'

export interface ScreenForReact {
  id: string
  name: string
  html: string
}

export interface RunReactOptions {
  projectId: string
  projectName: string
  screens: ScreenForReact[]
  designSystem?: any
  deviceType?: 'app' | 'web' | 'tablet' | string
  userPrompt?: string
}

export interface ReactProgressEvent {
  step: 'scaffold' | 'screenshot' | 'codegen' | 'verify' | string
  status: 'progress' | 'success' | 'error'
  message: string
  detail?: string
}

type Emit = (e: ReactProgressEvent) => void

function projectDir(projectId: string): string {
  // web platform under the unified workspace root
  return path.join(os.homedir(), 'VibeSynth', 'workspaces', projectId, 'web')
}
function ensureDir(p: string) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }
function pascal(s: string): string {
  return s.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase()).join('')
}

export async function runReactBuild(opts: RunReactOptions, win: BrowserWindow | null): Promise<void> {
  const emit: Emit = (e) => { try { win?.webContents.send('react:progress', e) } catch {} }

  if (!isBanyaCliAvailable()) {
    throw new Error('banya CLI 를 찾을 수 없음 — banya-cli 설치 필요')
  }

  const dir = projectDir(opts.projectId)
  ensureDir(dir)

  // 1. scaffold (skip if already present — only the agent-touched files
  //    get overwritten on subsequent runs).
  const scaffoldMarker = path.join(dir, 'package.json')
  if (!fs.existsSync(scaffoldMarker)) {
    emit({ step: 'scaffold', status: 'progress', message: 'React+Vite 보일러플레이트 생성 중…' })
    const files = buildReactScaffold({ projectName: opts.projectName, deviceType: opts.deviceType })
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(dir, rel)
      ensureDir(path.dirname(full))
      fs.writeFileSync(full, content, 'utf-8')
    }
    emit({ step: 'scaffold', status: 'success', message: `${Object.keys(files).length}개 파일 생성됨`, detail: dir })
  } else {
    emit({ step: 'scaffold', status: 'success', message: '기존 프로젝트 사용', detail: dir })
  }

  // 2. design HTMLs to _design/ + hash-based skip
  const designDir = path.join(dir, '_design')
  ensureDir(designDir)
  const hashFile = path.join(designDir, '.hashes.json')
  const currentHashes = Object.fromEntries(
    opts.screens.map((s, i) => [`${i}:${s.id}`, crypto.createHash('sha1').update(s.html).digest('hex')]),
  )
  let priorHashes: Record<string, string> = {}
  try { priorHashes = JSON.parse(fs.readFileSync(hashFile, 'utf-8')) } catch {}
  const appTsxPath = path.join(dir, 'src', 'App.tsx')
  // Skip codegen entirely when nothing changed AND App.tsx is non-placeholder.
  const appExists = fs.existsSync(appTsxPath)
  const appIsPlaceholder = appExists && fs.readFileSync(appTsxPath, 'utf-8').includes('AI screens not yet generated')
  const unchanged = appExists && !appIsPlaceholder
    && Object.keys(currentHashes).length === Object.keys(priorHashes).length
    && Object.entries(currentHashes).every(([k, v]) => priorHashes[k] === v)
  if (unchanged) {
    emit({ step: 'codegen', status: 'success', message: '디자인 변경 없음 — codegen 건너뜀 (캐시 사용)' })
    return
  }

  // Clean stale design files
  for (const f of fs.readdirSync(designDir)) {
    try { fs.unlinkSync(path.join(designDir, f)) } catch {}
  }
  const screenFiles: string[] = []
  const screenPngPaths: string[] = []
  for (let i = 0; i < opts.screens.length; i++) {
    const safe = opts.screens[i].name.replace(/[^a-zA-Z0-9가-힣 _-]/g, '').replace(/\s+/g, '-').slice(0, 60) || `screen-${i + 1}`
    const baseName = `${String(i + 1).padStart(2, '0')}-${safe}`
    fs.writeFileSync(path.join(designDir, `${baseName}.html`), opts.screens[i].html, 'utf-8')
    screenFiles.push(`${baseName}.html`)
    screenPngPaths.push(path.join(designDir, `${baseName}.png`))
  }

  // 3. screenshots (BrowserWindow in Electron / Playwright fallback)
  emit({ step: 'screenshot', status: 'progress', message: `스크린샷 렌더 중: ${opts.screens.length}개` })
  for (let i = 0; i < opts.screens.length; i++) {
    try {
      // Web context — render at typical web viewport for the chosen device.
      const w = opts.deviceType === 'tablet' ? 768 : opts.deviceType === 'web' ? 1280 : 412
      const h = opts.deviceType === 'tablet' ? 1024 : opts.deviceType === 'web' ? 800 : 916
      await captureHtmlToPng(opts.screens[i].html, screenPngPaths[i], { width: w, height: h })
    } catch (e: any) {
      emit({ step: 'screenshot', status: 'progress', message: `${opts.screens[i].name}: ${e?.message || e} — text-only` })
      screenPngPaths[i] = ''
    }
  }
  emit({ step: 'screenshot', status: 'success', message: '완료' })

  // 4. banya CLI agent codegen
  const screenSpecs = opts.screens.map((s, i) => `  ${i + 1}. "${s.name}" → _design/${screenFiles[i]} → src/pages/${pascal(s.name) || `Screen${i + 1}`}.tsx`).join('\n')
  const primary = (opts.designSystem as any)?.colors?.primary?.base || '#3B82F6'
  const firstPng = screenPngPaths.find((p) => p) || ''
  const userPromptHint = opts.userPrompt ? `\nUser intent: ${opts.userPrompt.slice(0, 300)}` : ''
  const deviceHint = opts.deviceType ? `\nTarget form factor: ${opts.deviceType}.` : ''

  const prompt = `Build a React + Vite + TypeScript live app from the design screens below.
The workspace root is the project directory (package.json, vite.config.ts,
src/, _design/ are siblings). The boilerplate is already scaffolded.${deviceHint}${userPromptHint}

DESIGN SCREENS — read each HTML with read_file before writing the page:
${screenSpecs}

The attached image is the rendered screenshot of the FIRST screen. Use it
to ground the visual design (colors, typography weights, spacing).

DESIGN SYSTEM: primary color ${primary}.

YOU MUST WRITE these files (use create_file / update_file):

1. src/App.tsx — top-level <App /> component:
   - import the per-screen components from './pages/<Name>'
   - render a simple in-memory router. If >1 screen, top tab bar that
     switches between them; if 1, render that one directly.
   - apply a base layout container with the design system primary color
     used for buttons / accents.

2. src/pages/<Name>.tsx for each screen (one file per screen):
   - default-export a function component named <Name>
   - convert the HTML/CSS into JSX + inline styles or a <style> tag
   - keep semantic structure (forms, buttons, headings) intact
   - prefer accessible HTML (label, aria-*) where the design implies it

3. src/index.css — only update if a global style override is necessary.

DO NOT touch package.json, vite.config.ts, tsconfig.*, index.html — they're
already correct. DO NOT install deps. DO NOT run vite — the host will do
that after you finish.

Stop after the files are written. No explanation output.`

  emit({ step: 'codegen', status: 'progress', message: `banya CLI 멀티모달 codegen ${firstPng ? '(이미지 포함)' : '(text-only)'} — ${opts.screens.length}개 화면` })
  const result = await runBanyaCodegen({
    projectId: opts.projectId + '-react-codegen',
    workspace: dir,
    prompt,
    imageFile: firstPng || undefined,
    timeoutMs: 15 * 60 * 1000,
  })
  if (!result.success) {
    throw new Error(`banya CLI 실패: ${result.error || `exit ${result.exitCode}`}`)
  }

  // 5. verify the agent actually wrote the expected files.
  emit({ step: 'verify', status: 'progress', message: 'src/App.tsx + 페이지 파일 검증' })
  if (!fs.existsSync(appTsxPath)) {
    throw new Error('agent 가 src/App.tsx 를 작성하지 않음')
  }
  const newAppContent = fs.readFileSync(appTsxPath, 'utf-8')
  if (newAppContent.includes('AI screens not yet generated')) {
    throw new Error('agent 가 src/App.tsx 를 placeholder 그대로 두었음')
  }
  // Persist hashes only on full success.
  try { fs.writeFileSync(hashFile, JSON.stringify(currentHashes, null, 2), 'utf-8') } catch {}
  emit({ step: 'verify', status: 'success', message: `완료 (${newAppContent.length} bytes App.tsx)` })
}
