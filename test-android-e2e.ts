/**
 * Standalone e2e test for the Android build pipeline.
 * Reads the LifeFlow project + Android config directly from the on-disk
 * JSON db (~/Library/Application Support/vibesynth/vibesynth-data/), then
 * invokes runOnAndroid() — bypassing the Electron UI.
 *
 * Usage:
 *   cd vibesynth
 *   npx tsx test-android-e2e.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { runOnAndroid, type ProgressEvent } from './electron/android-build'

const DB_DIR = path.join(os.homedir(), 'Library', 'Application Support', 'vibesynth', 'vibesynth-data')

// Load .env so VITE_GEMINI_API_KEY is available — the standalone tsx test
// runner doesn't go through vite-define like the packaged Electron build.
function loadDotEnv() {
  const envPath = path.join(__dirname, '.env')
  if (!fs.existsSync(envPath)) return
  for (const raw of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}
loadDotEnv()

function readJson<T = any>(file: string): T[] {
  const p = path.join(DB_DIR, file)
  if (!fs.existsSync(p)) return []
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

async function main() {
  const projectId = 'ex-android'
  const projects = readJson<any>('projects.json')
  const project = projects.find((p) => p.id === projectId)
  if (!project) {
    console.error(`[e2e] project not found: ${projectId}`)
    console.error(`[e2e] available: ${projects.map((p: any) => p.id).join(', ')}`)
    process.exit(1)
  }
  console.log(`[e2e] project: id=${project.id} name=${project.name} screens=${project.screens?.length || 0}`)

  const settingsList = readJson<any>('settings.json')
  const settings = settingsList.find((s) => s.userId === 'default') || {}
  const cfg = settings?.androidConfig
  if (!cfg) {
    console.error('[e2e] androidConfig not found in db.settings — open Settings → Android, configure + save first')
    process.exit(1)
  }
  const apiKey = (settings?.apiKey && String(settings.apiKey).trim())
    || process.env.VITE_GEMINI_API_KEY
    || process.env.GEMINI_API_KEY
    || ''
  console.log(`[e2e] android cfg: sdk=${cfg.sdkRoot} jdk=${cfg.jdkHome} avd=${cfg.preferredAvd}`)
  console.log(`[e2e] gemini key: ${apiKey ? `${apiKey.slice(0, 8)}…(${apiKey.length} chars)` : '(none)'}`)

  // Minimal BrowserWindow stand-in — just routes progress events to stdout.
  const fakeWin: any = {
    webContents: {
      send: (channel: string, payload: ProgressEvent) => {
        if (channel !== 'android:progress') return
        const icon = payload.status === 'success' ? '✓' : payload.status === 'error' ? '✗' : '⋯'
        const t = new Date().toISOString().slice(11, 19)
        console.log(`${t} ${icon} [${payload.step}] ${payload.message}`)
        if (payload.detail) console.log(`         ${payload.detail}`)
      },
    },
  }

  const t0 = Date.now()
  try {
    await runOnAndroid({
      projectId: project.id,
      projectName: project.name,
      screens: (project.screens || []).map((s: any) => ({ id: s.id, name: s.name, html: s.html })),
      designSystem: project.designSystem,
      geminiApiKey: apiKey,
      cfg,
    }, fakeWin)
    console.log(`\n[e2e] ✓ DONE in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  } catch (e: any) {
    console.error(`\n[e2e] ✗ FAILED in ${((Date.now() - t0) / 1000).toFixed(1)}s: ${e?.message || e}`)
    process.exit(1)
  }
}

main()
