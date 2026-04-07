import { test as base, _electron as electron, expect, ElectronApplication, Page } from '@playwright/test'
import path from 'path'

type ElectronFixtures = {
  electronApp: ElectronApplication
  page: Page
}

export { expect }

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    const mainJs = path.join(__dirname, '../../dist-electron/main.js')

    // CRITICAL: Remove ELECTRON_RUN_AS_NODE so Electron runs in full app mode
    // (Claude Code and some CI environments set this to 1, which makes
    //  require('electron') return a bare Node shim with no ipcMain/app/etc.)
    const env = { ...process.env }
    delete env.ELECTRON_RUN_AS_NODE

    const app = await electron.launch({
      args: [mainJs],
      env: {
        ...env,
        VITE_DEV_SERVER_URL: `http://localhost:${process.env.TEST_PORT || 5199}`,
      },
    })
    await use(app)
    await app.close()
  },

  page: async ({ electronApp }, use, testInfo) => {
    const win = await electronApp.firstWindow()
    await win.waitForLoadState('domcontentloaded')

    // 전체화면
    await electronApp.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows()[0]
      if (w) w.maximize()
    })

    // 페이지가 실제로 로드될 때까지 대기 (webServer가 준비될 때까지)
    await win.waitForTimeout(2000)
    const url = win.url()
    if (url === 'about:blank' || url === '') {
      // webServer가 아직 준비 안 됨 — 재시도
      await win.waitForTimeout(5000)
    }

    // 다크모드 + 영어 locale 설정 (localStorage 접근 가능한 상태에서만)
    try {
      await win.evaluate(() => {
        localStorage.setItem('vibesynth-theme', 'dark')
        localStorage.setItem('vibesynth-lang', 'en')
        document.documentElement.classList.add('dark')
      })
      await win.reload({ waitUntil: 'domcontentloaded' })
      await win.waitForTimeout(500)
    } catch {
      // localStorage 접근 실패 시 건너뜀 (about:blank 상태)
      console.warn('[Fixture] Could not set localStorage — page may not have loaded yet')
      await win.waitForTimeout(3000)
    }

    // 콘솔 로그를 터미널에 출력 (디버깅용)
    win.on('console', (msg) => {
      const type = msg.type()
      const text = msg.text()
      if (type === 'error') console.error(`[CONSOLE ERROR] ${text}`)
      else if (type === 'warning') console.warn(`[CONSOLE WARN] ${text}`)
      else if (text.includes('VibeSynth') || text.includes('error') || text.includes('fail'))
        console.log(`[CONSOLE] ${text}`)
    })

    await use(win)
    const screenshot = await win.screenshot()
    await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' })

    // ─── Auto-cleanup: delete projects created during this test ───
    try {
      await win.evaluate(async () => {
        const api = (window as any).electronAPI
        if (!api?.db?.getAllProjects) return
        const projects = await api.db.getAllProjects('default')
        if (!projects?.length) return
        for (const p of projects) {
          // Skip example/curated projects
          if (p.id.startsWith('ex-')) continue
          try {
            await api.project?.clean?.(p.id)  // delete workspace files
            await api.db?.deleteProject?.(p.id) // delete from DB
          } catch {}
        }
      })
      console.log('[Fixture] Cleaned up test-generated projects')
    } catch {
      // Page may already be closed — ignore
    }
  },
})
