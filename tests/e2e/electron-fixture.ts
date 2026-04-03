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
    const app = await electron.launch({
      args: [mainJs],
      env: {
        ...process.env,
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

    // 다크모드 설정 (앱의 키: 'vibesynth-theme')
    await win.evaluate(() => {
      localStorage.setItem('vibesynth-theme', 'dark')
      document.documentElement.classList.add('dark')
    })
    // 앱의 AppearanceToggle이 localStorage를 읽어 적용하도록 리로드
    await win.reload({ waitUntil: 'domcontentloaded' })
    await win.waitForTimeout(500)

    await use(win)
    const screenshot = await win.screenshot()
    await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' })
  },
})
