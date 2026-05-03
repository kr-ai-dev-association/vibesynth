/**
 * Phase 1 Android run pipeline:
 *   1. Scaffold a boilerplate Kotlin Compose project under
 *      ~/VibeSynth/projects-android/<projectId>/ (idempotent — skips if
 *      already present).
 *   2. Ensure gradle-wrapper.jar is downloaded + cached at
 *      ~/Library/Application Support/vibesynth/gradle-wrapper-<ver>.jar
 *      and copied into the project's gradle/wrapper/ dir.
 *   3. Run `./gradlew assembleDebug` with JAVA_HOME pointing at the
 *      user-configured JDK.
 *   4. Boot the user's preferred AVD if no device is currently online.
 *   5. `adb install -r` + `adb shell am start` — app shows in emulator.
 *
 * Each step emits a progress event so the renderer can stream the log
 * to the user.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as https from 'https'
import { spawn, execSync } from 'child_process'
import type { BrowserWindow } from 'electron'
import {
  buildKotlinScaffold,
  GRADLE_WRAPPER_JAR_URL,
  type AndroidScaffoldOptions,
} from './android-templates'
import { type ScreenForCodegen, type DesignSystemLite } from './android-codegen'
import { runBanyaCodegen, isBanyaCliAvailable } from './banya-cli'
import { captureHtmlToPng } from './screen-capture'
import { extractScreenImages, buildDrawableMappingPrompt } from './android-image-extract'

export interface RunAndroidOptions {
  projectId: string
  projectName: string
  screens?: ScreenForCodegen[]
  designSystem?: DesignSystemLite
  geminiApiKey?: string
  /** When true, wipes ~/VibeSynth/projects-android/<id>/ entirely before
   * scaffolding — equivalent to a "clean rebuild": gradle wrapper is
   * re-downloaded, all dependencies re-resolved, all codegen + build
   * caches dropped. Use after major template changes or when chasing a
   * mystery build error. */
  clean?: boolean
  cfg: {
    sdkRoot: string
    jdkHome: string
    adbPath: string
    emulatorPath: string
    avdManagerPath: string
    preferredAvd: string
  }
}

export interface ProgressEvent {
  step: string         // 'scaffold' | 'wrapper' | 'gradle' | 'emulator' | 'install' | 'launch'
  status: 'progress' | 'success' | 'error'
  message: string
  detail?: string
}

type Emit = (e: ProgressEvent) => void

// ─── helpers ──────────────────────────────────────────────────

function projectDir(projectId: string): string {
  return path.join(os.homedir(), 'VibeSynth', 'projects-android', projectId)
}

function ensureDir(p: string) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }

function packageNameFor(projectId: string): string {
  // Android package names must match [a-z][a-z0-9_]* per segment.
  const safe = projectId.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 24) || 'demo'
  return `ai.banya.vibesynth.proj.p${safe}`
}

function downloadFile(url: string, dest: string, timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const tmp = dest + '.tmp'
    const file = fs.createWriteStream(tmp)
    let settled = false
    const finish = (err?: Error) => {
      if (settled) return
      settled = true
      file.close()
      if (err) {
        try { fs.unlinkSync(tmp) } catch {}
        reject(err)
      } else {
        try { fs.renameSync(tmp, dest) } catch (e: any) { reject(e); return }
        resolve()
      }
    }
    const req = https.get(url, (res) => {
      // Follow redirects (gradle CDN may redirect)
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close()
        try { fs.unlinkSync(tmp) } catch {}
        downloadFile(res.headers.location, dest, timeoutMs).then(resolve, reject)
        return
      }
      if (res.statusCode !== 200) {
        finish(new Error(`HTTP ${res.statusCode} fetching ${url}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => finish())
    })
    req.on('error', (e) => finish(e))
    req.setTimeout(timeoutMs, () => req.destroy(new Error('Download timeout')))
  })
}

function runStream(
  cmd: string,
  args: string[],
  opts: {
    cwd?: string
    env?: NodeJS.ProcessEnv
    timeoutMs?: number
    onLine?: (line: string, stream: 'out' | 'err') => void
  } = {},
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env: opts.env || process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let outBuf = ''
    let errBuf = ''
    const drain = (buf: string, stream: 'out' | 'err'): string => {
      let nl: number
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl)
        buf = buf.slice(nl + 1)
        opts.onLine?.(line, stream)
      }
      return buf
    }
    child.stdout.on('data', (c) => { const s = c.toString(); stdout += s; outBuf = drain(outBuf + s, 'out') })
    child.stderr.on('data', (c) => { const s = c.toString(); stderr += s; errBuf = drain(errBuf + s, 'err') })
    child.on('error', reject)
    child.on('exit', (code) => resolve({ code, stdout, stderr }))
    if (opts.timeoutMs) {
      setTimeout(() => { try { child.kill('SIGTERM') } catch {} }, opts.timeoutMs)
    }
  })
}

// ─── stages ───────────────────────────────────────────────────

function scaffoldIfNeeded(opts: RunAndroidOptions, emit: Emit): { dir: string; pkg: string } {
  const dir = projectDir(opts.projectId)
  const pkg = packageNameFor(opts.projectId)
  const marker = path.join(dir, 'app', 'build.gradle.kts')

  if (fs.existsSync(marker)) {
    emit({ step: 'scaffold', status: 'success', message: '기존 프로젝트 사용', detail: dir })
    return { dir, pkg }
  }

  emit({ step: 'scaffold', status: 'progress', message: 'Kotlin Compose 보일러플레이트 생성 중…' })
  const files = buildKotlinScaffold({
    projectName: opts.projectName,
    packageName: pkg,
    appLabel: opts.projectName,
  } as AndroidScaffoldOptions)

  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel)
    ensureDir(path.dirname(full))
    fs.writeFileSync(full, content, 'utf-8')
  }

  // gradlew script needs +x.
  try { fs.chmodSync(path.join(dir, 'gradlew'), 0o755) } catch {}

  emit({ step: 'scaffold', status: 'success', message: `프로젝트 생성됨 (${Object.keys(files).length}개 파일)`, detail: dir })
  return { dir, pkg }
}

async function ensureWrapperJar(projectDirPath: string, emit: Emit): Promise<void> {
  const cacheDir = path.join(os.homedir(), 'Library', 'Application Support', 'vibesynth', 'cache')
  ensureDir(cacheDir)
  const cached = path.join(cacheDir, 'gradle-wrapper.jar')
  const dest = path.join(projectDirPath, 'gradle', 'wrapper', 'gradle-wrapper.jar')
  ensureDir(path.dirname(dest))

  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    emit({ step: 'wrapper', status: 'success', message: 'gradle-wrapper.jar 이미 존재' })
    return
  }

  if (!fs.existsSync(cached) || fs.statSync(cached).size < 1000) {
    emit({ step: 'wrapper', status: 'progress', message: 'gradle-wrapper.jar 다운로드 중…', detail: GRADLE_WRAPPER_JAR_URL })
    await downloadFile(GRADLE_WRAPPER_JAR_URL, cached, 30_000)
  }

  fs.copyFileSync(cached, dest)
  emit({ step: 'wrapper', status: 'success', message: 'gradle-wrapper.jar 준비 완료' })
}

async function gradleAssemble(
  dir: string,
  cfg: RunAndroidOptions['cfg'],
  emit: Emit,
): Promise<string> {
  emit({ step: 'gradle', status: 'progress', message: '`./gradlew assembleDebug` 실행 중… (첫 빌드는 5-10분 소요)' })
  const env = {
    ...process.env,
    JAVA_HOME: cfg.jdkHome,
    ANDROID_HOME: cfg.sdkRoot,
    ANDROID_SDK_ROOT: cfg.sdkRoot,
    PATH: [cfg.jdkHome ? path.join(cfg.jdkHome, 'bin') : '', process.env.PATH || ''].filter(Boolean).join(':'),
  }
  const { code, stderr } = await runStream(path.join(dir, 'gradlew'), ['assembleDebug', '--console=plain'], {
    cwd: dir,
    env,
    timeoutMs: 20 * 60 * 1000, // 20 min hard cap (first build downloads everything)
    onLine: (line, stream) => {
      // Surface key milestones to the UI; verbose lines stay in the buffered stderr/stdout.
      if (/BUILD (SUCCESS|FAILED)|FAILURE:|Could not resolve|Downloading https/.test(line)) {
        emit({ step: 'gradle', status: 'progress', message: line.slice(0, 200), detail: stream })
      }
    },
  })
  if (code !== 0) {
    throw new Error(`gradle exited with code ${code}\n${stderr.slice(-2000)}`)
  }

  const apk = path.join(dir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
  if (!fs.existsSync(apk)) {
    throw new Error(`APK not found after build: ${apk}`)
  }
  emit({ step: 'gradle', status: 'success', message: '빌드 성공', detail: apk })
  return apk
}

function listOnlineDevices(adbPath: string): string[] {
  try {
    const out = execSync(`"${adbPath}" devices`, { encoding: 'utf8', timeout: 5000 })
    return out.split('\n').slice(1)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('*') && /\sdevice$/.test(l))
      .map((l) => l.split(/\s+/)[0])
  } catch { return [] }
}

async function ensureEmulator(cfg: RunAndroidOptions['cfg'], emit: Emit): Promise<string> {
  const online = listOnlineDevices(cfg.adbPath)
  if (online.length > 0) {
    emit({ step: 'emulator', status: 'success', message: `이미 연결됨: ${online[0]}` })
    return online[0]
  }
  if (!cfg.preferredAvd) {
    throw new Error('연결된 device 없음. 설정에서 선호 AVD 를 선택하세요.')
  }

  emit({ step: 'emulator', status: 'progress', message: `AVD 부팅 중: ${cfg.preferredAvd} (1-2분 소요)` })
  // Detached so it survives this turn; user closes via emulator UI when done.
  const child = spawn(cfg.emulatorPath, ['-avd', cfg.preferredAvd, '-no-snapshot-load'], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, ANDROID_HOME: cfg.sdkRoot, ANDROID_SDK_ROOT: cfg.sdkRoot },
  })
  child.unref()

  // Poll adb every 3s until a device shows up + boot completes.
  const start = Date.now()
  const maxWaitMs = 5 * 60 * 1000
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 3000))
    const devices = listOnlineDevices(cfg.adbPath)
    if (devices.length === 0) continue
    // Confirm boot completed (sys.boot_completed == 1).
    try {
      const r = execSync(`"${cfg.adbPath}" -s ${devices[0]} shell getprop sys.boot_completed`, {
        encoding: 'utf8', timeout: 5000,
      }).trim()
      if (r === '1') {
        emit({ step: 'emulator', status: 'success', message: `부팅 완료: ${devices[0]}` })
        return devices[0]
      }
    } catch {}
  }
  throw new Error(`AVD 부팅 시간 초과 (5분): ${cfg.preferredAvd}`)
}

function installAndLaunch(
  cfg: RunAndroidOptions['cfg'],
  serial: string,
  apk: string,
  pkg: string,
  emit: Emit,
): void {
  emit({ step: 'install', status: 'progress', message: 'APK 설치 중…' })
  try {
    execSync(`"${cfg.adbPath}" -s ${serial} install -r "${apk}"`, { encoding: 'utf8', timeout: 120_000 })
  } catch (e: any) {
    throw new Error(`adb install 실패: ${(e?.stderr?.toString?.() || e?.message || '').slice(0, 500)}`)
  }
  emit({ step: 'install', status: 'success', message: '설치 완료' })

  emit({ step: 'launch', status: 'progress', message: '앱 실행…' })
  try {
    execSync(`"${cfg.adbPath}" -s ${serial} shell am start -n ${pkg}/${pkg}.MainActivity`, {
      encoding: 'utf8', timeout: 10_000,
    })
  } catch (e: any) {
    throw new Error(`am start 실패: ${(e?.message || '').slice(0, 500)}`)
  }
  emit({ step: 'launch', status: 'success', message: '에뮬레이터에서 실행 중' })
}

// ─── public entry ─────────────────────────────────────────────

export async function runOnAndroid(opts: RunAndroidOptions, win: BrowserWindow | null): Promise<void> {
  const emit: Emit = (e) => {
    try { win?.webContents.send('android:progress', e) } catch {}
  }

  try {
    if (opts.clean) {
      const dirToWipe = projectDir(opts.projectId)
      if (fs.existsSync(dirToWipe)) {
        emit({ step: 'clean', status: 'progress', message: `Clean rebuild — 프로젝트 wipe 중: ${dirToWipe}` })
        fs.rmSync(dirToWipe, { recursive: true, force: true })
        emit({ step: 'clean', status: 'success', message: '프로젝트 디렉토리 삭제됨' })
      }
    }
    const { dir, pkg } = scaffoldIfNeeded(opts, emit)
    await ensureWrapperJar(dir, emit)
    await codegenScreens(dir, pkg, opts, emit)
    const apk = await gradleAssemble(dir, opts.cfg, emit)
    const serial = await ensureEmulator(opts.cfg, emit)
    installAndLaunch(opts.cfg, serial, apk, pkg, emit)
  } catch (err: any) {
    emit({ step: 'gradle', status: 'error', message: err?.message || String(err) })
    throw err
  }
}

/**
 * Two-stage Kotlin codegen:
 *   Stage A (vision-aware draft) — render each screen's HTML to a PNG via a
 *     hidden BrowserWindow, then call Gemini multimodal (HTML text +
 *     screenshot) for an initial Screens.kt. The screenshot gives the model
 *     the *resolved* visual (computed colors, fonts, spacing) — far closer
 *     to the user's design than HTML alone.
 *   Stage B (compile-fix) — hand off to banya CLI agent in a focused
 *     "compile + iterate" mode. The agent runs ./gradlew, reads any
 *     compiler errors, and fixes Screens.kt up to N times.
 *
 * The cache key in Stage A includes both the prompt version and the html
 * hash, so prompt changes invalidate stale entries automatically.
 */
async function codegenScreens(
  projectDirPath: string,
  packageName: string,
  opts: RunAndroidOptions,
  emit: Emit,
): Promise<void> {
  const screens = opts.screens || []
  if (screens.length === 0) {
    emit({ step: 'codegen', status: 'success', message: '디자인 화면 없음 — placeholder 사용' })
    return
  }
  if (!opts.geminiApiKey) {
    emit({ step: 'codegen', status: 'error', message: 'Gemini API 키 없음 — Settings → AI 에 키 입력' })
    return
  }
  if (!isBanyaCliAvailable()) {
    emit({ step: 'codegen', status: 'error', message: 'banya CLI 를 찾을 수 없음 — banya-cli 설치 필요' })
    return
  }

  // 1. Drop each screen's HTML into _design/ so the agent can read them
  //    via its read_file tool. Use safe filenames.
  const designDir = path.join(projectDirPath, '_design')
  ensureDir(designDir)

  // Hash-based skip: if every screen's HTML matches what we hashed last
  // codegen AND Screens.kt exists, skip the entire banya agent run. This
  // makes incremental rebuilds (Phase 3 watch mode) cheap when only e.g.
  // a Kotlin file changed but no design touched.
  const hashFile = path.join(designDir, '.hashes.json')
  const targetKt = path.join(projectDirPath, 'app', 'src', 'main', 'java', packageName.replace(/\./g, '/'), 'Screens.kt')
  const currentHashes = Object.fromEntries(
    screens.map((s, i) => [`${i}:${s.id}`, require('crypto').createHash('sha1').update(s.html).digest('hex')]),
  )
  let priorHashes: Record<string, string> = {}
  try { priorHashes = JSON.parse(fs.readFileSync(hashFile, 'utf-8')) } catch {}
  const unchanged = fs.existsSync(targetKt)
    && Object.keys(currentHashes).length === Object.keys(priorHashes).length
    && Object.entries(currentHashes).every(([k, v]) => priorHashes[k] === v)
  if (unchanged) {
    emit({ step: 'codegen', status: 'success', message: '디자인 변경 없음 — codegen 건너뜀 (캐시 사용)' })
    return
  }

  // Clean stale design files so the agent doesn't see screens from a
  // prior run that the user has since removed/renamed.
  for (const f of fs.readdirSync(designDir)) {
    try { fs.unlinkSync(path.join(designDir, f)) } catch {}
  }
  // Extract every <img src="data:..."> into res/drawable/ so the agent
  // can use painterResource(R.drawable.<name>) instead of placeholder
  // boxes. Also returns the rewritten HTML with marker tags
  // (<img data-vs-drawable="<name>">) that the agent maps back.
  emit({ step: 'codegen', status: 'progress', message: '디자인 이미지 추출 중 (data URI → res/drawable)' })
  const extracted = extractScreenImages(projectDirPath, screens.map((s) => ({ name: s.name, html: s.html })))
  emit({
    step: 'codegen',
    status: 'success',
    message: `${extracted.images.length}개 이미지 → res/drawable/`,
    detail: extracted.images.slice(0, 4).map((im) => im.drawableName).join(', ') + (extracted.images.length > 4 ? ` +${extracted.images.length - 4}개` : ''),
  })

  const screenFiles: string[] = []
  const screenPngPaths: string[] = []
  for (let i = 0; i < screens.length; i++) {
    const safe = screens[i].name.replace(/[^a-zA-Z0-9가-힣 _-]/g, '').replace(/\s+/g, '-').slice(0, 60) || `screen-${i + 1}`
    const baseName = `${String(i + 1).padStart(2, '0')}-${safe}`
    const htmlFname = `${baseName}.html`
    // Write the REWRITTEN HTML (with marker tags) so the agent's read_file
    // tool sees the marker, not the original ~700KB base64 payload.
    fs.writeFileSync(path.join(designDir, htmlFname), extracted.rewrittenHtmlByScreen[i], 'utf-8')
    screenFiles.push(htmlFname)
    screenPngPaths.push(path.join(designDir, `${baseName}.png`))
  }

  // Render each ORIGINAL HTML to PNG so Gemini sees the actual visual
  // design (with the real images) — the agent's screenshot still has the
  // designed pictures even though its text source has been compacted.
  emit({ step: 'codegen', status: 'progress', message: `스크린샷 렌더 중: ${screens.length}개 (각 ~1초)` })
  for (let i = 0; i < screens.length; i++) {
    try {
      await captureHtmlToPng(screens[i].html, screenPngPaths[i], { width: 412, height: 916 })
    } catch (e: any) {
      emit({ step: 'codegen', status: 'progress', message: `스크린샷 실패 (${screens[i].name}): ${e?.message || e} — text-only 진행` })
      // Mark missing so multimodal codegen falls back to text.
      screenPngPaths[i] = ''
    }
  }

  // Stage A — vision-aware draft via banya CLI agent. The agent reads each
  // _design/*.html with read_file and sees the FIRST screen's rendered
  // screenshot via --image-file (multimodal). It writes Screens.kt directly.
  // We use only the first PNG because the CLI's --image-file accepts one
  // image; the screenshot anchors the design system (colors/typography),
  // and the per-screen HTMLs cover the layouts.
  const targetKt2 = path.join(projectDirPath, 'app', 'src', 'main', 'java', packageName.replace(/\./g, '/'), 'Screens.kt')
  const targetRel2 = `app/src/main/java/${packageName.replace(/\./g, '/')}/Screens.kt`
  const screenSpecs = screens.map((s, i) => `  ${i + 1}. "${s.name}" → _design/${screenFiles[i]} → Composable name "${pascal(s.name) || `Screen${i + 1}`}Screen"`).join('\n')
  const primary = (opts.designSystem as any)?.colors?.primary?.base || '#3B82F6'
  const firstPng = screenPngPaths.find((p) => p) || ''

  const draftPrompt = `Write ${targetRel2} for an Android Kotlin Compose project. The workspace
root is the Android project directory (gradle/, app/, _design/ are siblings).

DESIGN SCREENS — read each HTML with read_file before writing the
corresponding Composable:
${screenSpecs}

The attached image is the rendered screenshot of the FIRST screen. Use it
to ground the design system (colors, typography weights, spacing rhythm).
For the other screens, the HTML is your source of truth.

DESIGN SYSTEM: primary color ${primary}.${buildDrawableMappingPrompt(extracted.images)}

NAVIGATION STRUCTURE — match what the design shows, not a generic wrapper:
- Inspect each screen's HTML for navigation chrome (bottom tab bar, top
  app bar, side drawer, hamburger menu, segmented tabs, etc.) and
  reproduce that EXACT structure once at the App() level.
- If the design has a BOTTOM NAV BAR (icons + labels at the bottom): use
  Scaffold(bottomBar = { NavigationBar { NavigationBarItem(...) } }).
- If the design has only a TOP TAB ROW: use TabRow / ScrollableTabRow.
- If the design has a TOP APP BAR with title only: use Scaffold(topBar = ...).
- If there is only one screen, render it directly without any router.
- Pick the icons / labels for nav items from the design — do NOT default
  to "Tab 1 / Tab 2 / Tab 3".
- The agent may extract repeated nav UI from the per-screen HTML into the
  App()-level Scaffold so it doesn't render twice.

REQUIRED IMPORTS — copy this block at the top, after \`package ${packageName}\`:
\`\`\`
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
\`\`\`

CRITICAL API RULES:
- ICONS — only these are valid Icons.Default.<Name>:
  ArrowBack, ArrowForward, ArrowDownward, ArrowUpward, ArrowDropDown,
  KeyboardArrowDown/Up/Left/Right, Add, Remove, Close, Done, Check, Clear,
  Edit, Delete, Save, Menu, MoreVert, MoreHoriz, Search, Settings, Refresh,
  Share, Send, Home, Person, AccountCircle, Lock, Email, Phone, LocationOn,
  Place, Star, StarBorder, Favorite, FavoriteBorder, Notifications,
  Visibility, VisibilityOff, ShoppingCart, Image, Photo, PlayArrow, Pause,
  Stop, Info, Warning, Error, HelpOutline, Circle.
  THERE IS NO ArrowDropUp — use KeyboardArrowUp.
- ROUNDEDCORNERSHAPE: RoundedCornerShape(8.dp) or
  RoundedCornerShape(topStart=…, topEnd=…, bottomEnd=…, bottomStart=…).
  NEVER use topLeft/topRight/bottomLeft/bottomRight.
- BUTTON: Button(onClick = { }) { Text("Label") } — onClick is required.
- OUTLINEDTEXTFIELD requires both value and onValueChange.
- Modifier.weight(...) only inside Row{} or Column{} — never inside Box.
- Every function calling a Composable must itself be @Composable.

CONVERSION:
- <div> with flex-direction:row → Row {}; otherwise Column {}.
- <button> → Button { Text(...) }; secondary → OutlinedButton.
- <input> → OutlinedTextField (with var by remember mutableStateOf("")).
- <h1>/<h2>/<h3> → Text(style = MaterialTheme.typography.headlineLarge/Medium/Small).
- <p>/<span> → Text(style = MaterialTheme.typography.bodyLarge/bodyMedium).
- <img> → Box(Modifier.size(W.dp, H.dp).background(Color(0xFFE5E7EB))).
- CSS color #RRGGBB → Color(0xFFRRGGBB).
- Bottom navigation → Scaffold + BottomAppBar.

WRAP each screen in:
  Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
      Column(modifier = Modifier.fillMaxSize().padding(16.dp)) { ... }
  }

ALSO write a @Composable fun App() at the end of the file. App() is the
single entry point that MainActivity calls. Inside App() decide the
navigation per the rules above (Scaffold + BottomAppBar / TabRow / single
screen) and dispatch to the per-screen Composables.

When using Scaffold with a bottomBar / topBar, render the current screen
inside the content lambda — strip any duplicate top/bottom chrome from the
individual screen Composables so it doesn't appear twice.

PROCESS:
  1. read_file each _design/*.html in order.
  2. create_file ${targetRel2} containing: package, imports, one
     <Name>Screen() per screen, App() at the end with the navigation
     structure that matches the design.
  3. Stop. DO NOT run gradle. DO NOT modify gradle/Manifest/MainActivity/
     Theme/anything else.`

  emit({ step: 'codegen', status: 'progress', message: `Stage A: banya CLI 멀티모달 codegen ${firstPng ? '(이미지 포함)' : '(text-only)'}` })

  const stageA = await runBanyaCodegen({
    projectId: opts.projectId + '-android-stage-a',
    workspace: projectDirPath,
    prompt: draftPrompt,
    imageFile: firstPng || undefined,
    timeoutMs: 10 * 60 * 1000,
  })
  if (!stageA.success) {
    throw new Error(`Stage A (banya CLI 초안) 실패: ${stageA.error || `exit ${stageA.exitCode}`}`)
  }
  if (!fs.existsSync(targetKt2)) {
    throw new Error(`Stage A: agent 가 ${targetKt2} 를 작성하지 않음`)
  }
  const draftSize = fs.statSync(targetKt2).size
  emit({ step: 'codegen', status: 'success', message: `Stage A 완료: ${draftSize} bytes` })

  // Stage B — try gradle ourselves first. If it compiles cleanly, we skip
  // the slow agent loop entirely. If not, hand the FIRST batch of compiler
  // errors directly to banya with the file content + targeted instructions
  // so it doesn't waste turns figuring out where to start.
  const targetRel = `app/src/main/java/${packageName.replace(/\./g, '/')}/Screens.kt`
  const target = path.join(projectDirPath, 'app', 'src', 'main', 'java', packageName.replace(/\./g, '/'), 'Screens.kt')

  const env = {
    ...process.env,
    JAVA_HOME: opts.cfg.jdkHome,
    ANDROID_HOME: opts.cfg.sdkRoot,
    ANDROID_SDK_ROOT: opts.cfg.sdkRoot,
    PATH: [opts.cfg.jdkHome ? path.join(opts.cfg.jdkHome, 'bin') : '', process.env.PATH || ''].filter(Boolean).join(':'),
  }

  const MAX_FIX_ATTEMPTS = 3
  for (let attempt = 0; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    emit({
      step: 'codegen',
      status: 'progress',
      message: attempt === 0
        ? 'Stage B: gradle 검증 빌드'
        : `Stage B: gradle 재시도 ${attempt}/${MAX_FIX_ATTEMPTS}`,
    })
    const { code, stderr, stdout } = await runStream(path.join(projectDirPath, 'gradlew'), ['compileDebugKotlin', '--console=plain'], {
      cwd: projectDirPath,
      env,
      timeoutMs: 10 * 60 * 1000,
    })
    if (code === 0) {
      emit({ step: 'codegen', status: 'success', message: `Stage B 완료 (시도 ${attempt + 1}회)` })
      try { fs.writeFileSync(hashFile, JSON.stringify(currentHashes, null, 2), 'utf-8') } catch {}
      return
    }

    // Extract the e: file://… lines (Kotlin compiler errors).
    const errBlock = (stderr + '\n' + stdout)
      .split('\n')
      .filter((l) => /^e:\s|error:|FAILURE:/.test(l))
      .slice(0, 30)
      .join('\n')

    if (attempt === MAX_FIX_ATTEMPTS) {
      throw new Error(`gradle compile failed after ${MAX_FIX_ATTEMPTS + 1} attempts:\n${errBlock || stderr.slice(-2000)}`)
    }

    emit({ step: 'codegen', status: 'progress', message: `Stage B: 컴파일 에러 → banya CLI 로 수정 중 (${errBlock.split('\n').length}개 에러)` })

    // Hand the agent a self-contained task: here are the errors, here's
    // the file content, write a fixed version. No iterative gradle inside
    // the agent — we control the loop.
    const currentSrc = fs.readFileSync(target, 'utf-8')
    const fixPrompt = `The Kotlin file ${targetRel} fails to compile. Rewrite it so it compiles.

== current Screens.kt ==
\`\`\`kotlin
${currentSrc}
\`\`\`

== compiler errors ==
${errBlock}

== fix rules ==
- Output the COMPLETE corrected Screens.kt. Do not omit any function.
- Use create_file (or update_file) to overwrite ${targetRel}. Touch ONLY
  that file — leave gradle/Manifest/MainActivity/Theme alone.
- Common Kotlin Compose mistakes you may need to fix:
  • "Unresolved reference: <IconName>" → swap to a real icon. Safe list:
    ArrowBack, ArrowForward, ArrowDownward, ArrowUpward, ArrowDropDown,
    KeyboardArrowDown/Up/Left/Right, Add, Remove, Close, Done, Check,
    Clear, Edit, Delete, Save, Menu, MoreVert, MoreHoriz, Search, Settings,
    Refresh, Share, Send, Home, Person, AccountCircle, Lock, Email, Phone,
    LocationOn, Place, Star, StarBorder, Favorite, FavoriteBorder,
    Notifications, Visibility, VisibilityOff, ShoppingCart, Image, Photo,
    PlayArrow, Pause, Stop, Info, Warning, Error, HelpOutline, Circle.
    There is NO ArrowDropUp — use KeyboardArrowUp.
  • "Unresolved reference: BorderStroke" → add
    \`import androidx.compose.foundation.BorderStroke\`.
  • "Unresolved reference: CircleShape" → add
    \`import androidx.compose.foundation.shape.CircleShape\`.
  • "Cannot find a parameter with this name: topLeft" → RoundedCornerShape
    uses topStart / topEnd / bottomStart / bottomEnd (Start/End, not Left/Right).
  • "Type mismatch: ... CornerSize was expected" → pass RoundedCornerShape
    directly (do not wrap it).
  • "Expression 'weight' cannot be invoked" → Modifier.weight is only
    available inside Row{} or Column{}. Wrap in Column{}, or use a fixed
    .height(N.dp) instead.
  • "@Composable invocations can only happen from the context of a
    @Composable function" → add @Composable to the calling function.
- Do not run gradle yourself — just write the file and stop.
- Do not include any explanation or markdown around the file content.`

    const result = await runBanyaCodegen({
      projectId: opts.projectId + '-android-fix-' + attempt,
      workspace: projectDirPath,
      prompt: fixPrompt,
      timeoutMs: 5 * 60 * 1000,
    })
    if (!result.success) {
      throw new Error(`banya 에이전트 (수정 ${attempt + 1}회차) 실패: ${result.error || `exit ${result.exitCode}`}`)
    }
    if (!fs.existsSync(target)) {
      throw new Error(`agent 가 ${target} 를 지웠음 — 복구 불가`)
    }
  }
}

function pascal(s: string): string {
  return s.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase()).join('')
}
