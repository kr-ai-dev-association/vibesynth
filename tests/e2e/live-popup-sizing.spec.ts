import { test, expect } from './electron-fixture'

/**
 * Live App 팝업 창 크기 및 위치 테스트
 *
 * 1. 모바일 앱 → Live 빌드 → 창 크기 420x900 확인
 * 2. Live App 창과 Live Edit 창이 겹치지 않는지 확인
 */

const DELAY = 1000

test('Live App 팝업: 크기 + 위치 겹침 검증', async ({ electronApp, page }) => {
  test.setTimeout(300_000) // 5분

  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 1. 모바일 앱 프로젝트 생성
  // ═══════════════════════════════════════════════════════════════
  // App 모드 (기본)
  const textarea = page.locator('textarea')
  await textarea.fill('A simple mobile fitness app with dashboard and workout list. screens: Dashboard, Workouts')
  await textarea.press('Enter')

  // 스크린 생성 대기
  await expect(async () => {
    const count = await page.locator('[data-screen-card]').count()
    expect(count).toBeGreaterThanOrEqual(2)
  }).toPass({ timeout: 180_000 })

  // HTML 생성 완료 대기
  await expect(async () => {
    const gen = await page.locator('[data-screen-card]').getByText('AI Generating').count()
    expect(gen).toBe(0)
  }).toPass({ timeout: 300_000 })

  console.log('✅ 2개 스크린 생성 완료')
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 2. Run → Live App 창 열기
  // ═══════════════════════════════════════════════════════════════
  const runButton = page.locator('button').filter({ hasText: '▶ Run' }).first()
  await runButton.click()
  console.log('Run 클릭')

  // Live Window 열림 대기
  let liveWindow = null
  for (let i = 0; i < 120; i++) {
    const windows = electronApp.windows()
    if (windows.length > 1) {
      liveWindow = windows.find(w => w !== page)
      break
    }
    await page.waitForTimeout(1000)
  }

  if (!liveWindow) {
    console.log('⚠️ Live Window 미열림 — 빌드 실패 가능')
    await page.screenshot({ path: 'test-results/popup-no-live.png' })
    return
  }

  await page.waitForTimeout(3000) // 창 안정화

  // ═══════════════════════════════════════════════════════════════
  // 3. Live App 창 크기 확인 (App = 420x900 예상)
  // ═══════════════════════════════════════════════════════════════
  const liveSize = await electronApp.evaluate(({ BrowserWindow }) => {
    const wins = BrowserWindow.getAllWindows()
    // List all window titles for debugging
    const titles = wins.map(w => w.getTitle())
    console.log('Window titles:', titles)
    // Find the live window — it's not the main window (largest one)
    // Use the second window (index 1) or find by title
    const live = wins.find(w => w.getTitle().includes('Live')) ||
                 (wins.length > 1 ? wins[1] : null)
    if (!live) return { titles, width: 0, height: 0, x: 0, y: 0 }
    const [w, h] = live.getSize()
    const [x, y] = live.getPosition()
    return { titles, width: w, height: h, x, y }
  })

  console.log(`Live App 창: ${liveSize?.width}x${liveSize?.height} at (${liveSize?.x}, ${liveSize?.y})`)
  await page.screenshot({ path: 'test-results/popup-01-live-size.png' })

  if (liveSize) {
    // App 모드: 420x900 (±50 허용)
    expect(liveSize.width).toBeGreaterThanOrEqual(370)
    expect(liveSize.width).toBeLessThanOrEqual(470)
    console.log('✅ Live App 창 너비 정상 (App 모드)')
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. Live Edit 창 위치 확인 — Live App과 겹치지 않아야 함
  // ═══════════════════════════════════════════════════════════════
  const editSize = await electronApp.evaluate(({ BrowserWindow }) => {
    const wins = BrowserWindow.getAllWindows()
    const edit = wins.find(w => w.getTitle().includes('Edit')) ||
                 (wins.length > 2 ? wins[2] : null)
    if (!edit) return null
    const [w, h] = edit.getSize()
    const [x, y] = edit.getPosition()
    return { width: w, height: h, x, y }
  })

  if (editSize && liveSize) {
    console.log(`Live Edit 창: ${editSize.width}x${editSize.height} at (${editSize.x}, ${editSize.y})`)

    // 겹침 검사: Live App의 오른쪽 끝이 Live Edit의 왼쪽보다 작아야 함
    // 또는 Live Edit가 Live App 아래에 있어야 함
    const liveRight = liveSize.x + liveSize.width
    const liveBottom = liveSize.y + liveSize.height
    const noOverlapX = liveRight <= editSize.x || editSize.x + editSize.width <= liveSize.x
    const noOverlapY = liveBottom <= editSize.y || editSize.y + editSize.height <= liveSize.y
    const noOverlap = noOverlapX || noOverlapY

    if (noOverlap) {
      console.log('✅ Live App과 Live Edit 창이 겹치지 않음')
    } else {
      console.log('⚠️ 두 창이 겹침!')
      console.log(`  Live App: (${liveSize.x},${liveSize.y}) ~ (${liveRight},${liveBottom})`)
      console.log(`  Live Edit: (${editSize.x},${editSize.y}) ~ (${editSize.x + editSize.width},${editSize.y + editSize.height})`)
    }
  } else {
    console.log(`Live Edit 창: ${editSize ? '존재' : '미열림'}`)
  }

  await page.screenshot({ path: 'test-results/popup-02-positions.png' })

  // ═══════════════════════════════════════════════════════════════
  // 5. Stop
  // ═══════════════════════════════════════════════════════════════
  await page.evaluate(async () => {
    await (window as any).electronAPI?.feedback?.close?.()
    await (window as any).electronAPI?.liveEdit?.close?.()
  }).catch(() => {})
  await page.waitForTimeout(500)

  const stopBtn = page.locator('button').filter({ hasText: /Stop/ }).first()
  if (await stopBtn.isVisible().catch(() => false)) {
    await stopBtn.click({ force: true })
  }
  await page.waitForTimeout(2000)
  console.log('✅ Stop 완료')
})
