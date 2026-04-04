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

    // 다크모드 + 영어 locale 설정
    await win.evaluate(() => {
      localStorage.setItem('vibesynth-theme', 'dark')
      localStorage.setItem('vibesynth-lang', 'en')
      document.documentElement.classList.add('dark')
    })
    // 앱의 AppearanceToggle이 localStorage를 읽어 적용하도록 리로드
    await win.reload({ waitUntil: 'domcontentloaded' })
    await win.waitForTimeout(500)

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
  },
})
