/**
 * Android build environment: auto-detection + per-field validation.
 *
 * The user's machine has a different Android SDK / JDK / AVD setup than
 * any other developer's, so the live-app "Run on Android" path needs:
 *   1. Auto-detect best-guess paths from common locations + env vars.
 *   2. Per-field validation that actually invokes the binaries (not just
 *      file-exists) to confirm versions and reachability.
 *   3. Listing of AVDs and connected devices so the user can pick a
 *      target without typing names.
 *
 * All functions are pure (no electron deps) so they can be tested
 * standalone or invoked from the renderer via IPC handlers.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execSync } from 'child_process'

export interface AndroidConfig {
  sdkRoot: string      // ANDROID_HOME / ANDROID_SDK_ROOT
  jdkHome: string      // JAVA_HOME (Gradle needs JDK 17+)
  adbPath: string      // <sdk>/platform-tools/adb
  emulatorPath: string // <sdk>/emulator/emulator
  avdManagerPath: string // <sdk>/cmdline-tools/latest/bin/avdmanager (or homebrew)
  preferredAvd: string // user's choice of AVD to boot when none running
}

export interface FieldStatus {
  ok: boolean
  message: string
  detail?: string // e.g. version string from binary
}

export interface ValidationResult {
  sdkRoot: FieldStatus
  jdkHome: FieldStatus
  adb: FieldStatus
  emulator: FieldStatus
  avdManager: FieldStatus
  preferredAvd: FieldStatus
  overall: 'ok' | 'partial' | 'fail'
}

export interface AvdInfo {
  name: string
  apiLevel?: number
  device?: string
}

export interface DeviceInfo {
  serial: string
  state: string // 'device' | 'offline' | 'unauthorized' | 'emulator'
  isEmulator: boolean
}

// ─── auto-detect ──────────────────────────────────────────────

function existsFile(p: string): boolean {
  try { return !!p && fs.statSync(p).isFile() } catch { return false }
}
function existsDir(p: string): boolean {
  try { return !!p && fs.statSync(p).isDirectory() } catch { return false }
}

function firstExisting(candidates: string[], kind: 'file' | 'dir'): string {
  const check = kind === 'file' ? existsFile : existsDir
  for (const c of candidates) {
    if (check(c)) return c
  }
  return ''
}

export function detectAndroid(): AndroidConfig {
  const home = os.homedir()

  // SDK root candidates
  const sdkRoot = firstExisting([
    process.env.ANDROID_HOME || '',
    process.env.ANDROID_SDK_ROOT || '',
    path.join(home, 'Library/Android/sdk'),
    path.join(home, 'Android/Sdk'),
    '/opt/android-sdk',
    '/usr/local/android-sdk',
  ], 'dir')

  // JDK candidates (need 17+ for modern Gradle Android plugin)
  const jdkHome = firstExisting([
    process.env.JAVA_HOME || '',
    '/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home',
    '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home',
    '/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home',
    '/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home',
    '/usr/lib/jvm/java-17-openjdk',
    '/usr/lib/jvm/temurin-17-jdk-amd64',
  ], 'dir')

  const adbPath = sdkRoot
    ? firstExisting([path.join(sdkRoot, 'platform-tools/adb')], 'file')
    : ''
  const emulatorPath = sdkRoot
    ? firstExisting([path.join(sdkRoot, 'emulator/emulator')], 'file')
    : ''
  const avdManagerPath = firstExisting([
    sdkRoot ? path.join(sdkRoot, 'cmdline-tools/latest/bin/avdmanager') : '',
    sdkRoot ? path.join(sdkRoot, 'tools/bin/avdmanager') : '',
    '/opt/homebrew/bin/avdmanager',
    '/usr/local/bin/avdmanager',
  ], 'file')

  return {
    sdkRoot,
    jdkHome,
    adbPath,
    emulatorPath,
    avdManagerPath,
    preferredAvd: '',
  }
}

// ─── validation ───────────────────────────────────────────────

function runOk(cmd: string, timeoutMs = 5000): { ok: boolean; out: string; err: string } {
  try {
    const out = execSync(cmd, {
      encoding: 'utf8',
      timeout: timeoutMs,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
    return { ok: true, out, err: '' }
  } catch (e: any) {
    return { ok: false, out: '', err: (e?.stderr?.toString?.() || e?.message || '').slice(0, 300) }
  }
}

function quote(p: string): string {
  return `"${p.replace(/"/g, '\\"')}"`
}

export function validateAndroid(cfg: AndroidConfig): ValidationResult {
  const result: ValidationResult = {
    sdkRoot: { ok: false, message: '' },
    jdkHome: { ok: false, message: '' },
    adb: { ok: false, message: '' },
    emulator: { ok: false, message: '' },
    avdManager: { ok: false, message: '' },
    preferredAvd: { ok: false, message: '' },
    overall: 'fail',
  }

  // SDK root
  if (!cfg.sdkRoot) {
    result.sdkRoot = { ok: false, message: 'SDK 경로가 비어있습니다' }
  } else if (!existsDir(cfg.sdkRoot)) {
    result.sdkRoot = { ok: false, message: `디렉토리 없음: ${cfg.sdkRoot}` }
  } else {
    result.sdkRoot = { ok: true, message: '디렉토리 존재' }
  }

  // JDK
  if (!cfg.jdkHome) {
    result.jdkHome = { ok: false, message: 'JDK 경로 비어있음 (Gradle 빌드용)' }
  } else if (!existsDir(cfg.jdkHome)) {
    result.jdkHome = { ok: false, message: `디렉토리 없음: ${cfg.jdkHome}` }
  } else {
    const javaBin = path.join(cfg.jdkHome, 'bin/java')
    if (!existsFile(javaBin)) {
      result.jdkHome = { ok: false, message: `bin/java 없음: ${javaBin}` }
    } else {
      const r = runOk(`${quote(javaBin)} -version`, 5000)
      const versionLine = (r.out || r.err).split('\n')[0] || ''
      if (r.ok || /version/i.test(versionLine)) {
        result.jdkHome = { ok: true, message: 'OK', detail: versionLine }
      } else {
        result.jdkHome = { ok: false, message: 'java -version 실패', detail: r.err }
      }
    }
  }

  // adb
  if (!cfg.adbPath) {
    result.adb = { ok: false, message: 'adb 경로 비어있음' }
  } else if (!existsFile(cfg.adbPath)) {
    result.adb = { ok: false, message: `파일 없음: ${cfg.adbPath}` }
  } else {
    const r = runOk(`${quote(cfg.adbPath)} version`, 5000)
    const verLine = r.out.split('\n').find((l) => /Android Debug Bridge|Version/i.test(l)) || r.out.split('\n')[0] || ''
    if (r.ok && /android debug bridge|version/i.test(r.out)) {
      result.adb = { ok: true, message: 'OK', detail: verLine }
    } else {
      result.adb = { ok: false, message: 'adb version 실패', detail: r.err || r.out }
    }
  }

  // emulator
  if (!cfg.emulatorPath) {
    result.emulator = { ok: false, message: 'emulator 경로 비어있음' }
  } else if (!existsFile(cfg.emulatorPath)) {
    result.emulator = { ok: false, message: `파일 없음: ${cfg.emulatorPath}` }
  } else {
    // `emulator -version` writes banner to stdout; some versions exit non-zero.
    const r = runOk(`${quote(cfg.emulatorPath)} -version`, 5000)
    const verLine = (r.out || r.err).split('\n').find((l) => /Android emulator|version/i.test(l)) || ''
    if (verLine || r.ok) {
      result.emulator = { ok: true, message: 'OK', detail: verLine || r.out.split('\n')[0] }
    } else {
      result.emulator = { ok: false, message: 'emulator -version 실패', detail: r.err }
    }
  }

  // avdmanager
  if (!cfg.avdManagerPath) {
    result.avdManager = { ok: false, message: 'avdmanager 경로 비어있음' }
  } else if (!existsFile(cfg.avdManagerPath)) {
    result.avdManager = { ok: false, message: `파일 없음: ${cfg.avdManagerPath}` }
  } else {
    // avdmanager prints help to stderr when called with -h; we just check it runs.
    const r = runOk(`${quote(cfg.avdManagerPath)} -h`, 5000)
    if (/avdmanager|usage/i.test(r.out + r.err)) {
      result.avdManager = { ok: true, message: 'OK' }
    } else {
      result.avdManager = { ok: false, message: 'avdmanager -h 실패', detail: r.err || r.out }
    }
  }

  // preferred AVD must exist in the AVD list (when set)
  if (!cfg.preferredAvd) {
    result.preferredAvd = { ok: false, message: '선호 AVD 미선택' }
  } else if (!result.emulator.ok) {
    result.preferredAvd = { ok: false, message: 'emulator 사용 불가 — AVD 목록을 확인할 수 없습니다' }
  } else {
    const avds = listAvds(cfg.emulatorPath)
    if (avds.find((a) => a.name === cfg.preferredAvd)) {
      result.preferredAvd = { ok: true, message: 'OK' }
    } else {
      result.preferredAvd = { ok: false, message: `등록된 AVD 에 없음: ${cfg.preferredAvd}`, detail: `available: ${avds.map((a) => a.name).join(', ') || '(none)'}` }
    }
  }

  // overall
  const required = [result.sdkRoot, result.jdkHome, result.adb, result.emulator, result.avdManager]
  const allOk = required.every((f) => f.ok)
  const someOk = required.some((f) => f.ok)
  const avdOk = result.preferredAvd.ok
  result.overall = allOk && avdOk ? 'ok' : (allOk ? 'partial' : (someOk ? 'partial' : 'fail'))
  return result
}

// ─── enumeration helpers ──────────────────────────────────────

export function listAvds(emulatorPath: string): AvdInfo[] {
  if (!emulatorPath || !existsFile(emulatorPath)) return []
  const r = runOk(`${quote(emulatorPath)} -list-avds`, 5000)
  if (!r.ok) return []
  return r.out
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('INFO'))
    .map((name) => ({ name }))
}

export function listDevices(adbPath: string): DeviceInfo[] {
  if (!adbPath || !existsFile(adbPath)) return []
  const r = runOk(`${quote(adbPath)} devices`, 5000)
  if (!r.ok) return []
  const lines = r.out.split('\n').slice(1) // skip "List of devices attached"
  const out: DeviceInfo[] = []
  for (const line of lines) {
    const m = line.trim().match(/^(\S+)\s+(\S+)/)
    if (!m) continue
    out.push({
      serial: m[1],
      state: m[2],
      isEmulator: m[1].startsWith('emulator-'),
    })
  }
  return out
}
