import { test, expect } from './electron-fixture'

test('멀티 스크린 → Run → 프론트엔드 생성 → Live Window + 프롬프트 바 수정', async ({ electronApp, page }) => {
  test.setTimeout(600_000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 대시보드에서 Web 프로젝트 생성 → 멀티 스크린 생성
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()
  await page.getByRole('button', { name: 'Web' }).click()

  const dashboardTextarea = page.locator('textarea')
  await dashboardTextarea.fill(
    'A SaaS dashboard with 3 screens: landing page with hero and pricing, dashboard with analytics charts, and settings page with profile form',
  )
  await dashboardTextarea.press('Enter')

  await expect(page.getByText('Generating...').first()).toBeVisible({ timeout: 15_000 })

  const screenCards = page.locator('[data-screen-card]')
  await expect(async () => {
    const count = await screenCards.count()
    expect(count).toBeGreaterThanOrEqual(2)
  }).toPass({ timeout: 180_000 })

  const screenCount = await screenCards.count()
  console.log(`Generated ${screenCount} screens`)
  await page.screenshot({ path: 'test-results/live-01-screens-generated.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: Run 클릭 → 프론트엔드 빌드
  // ═══════════════════════════════════════════════════════════════
  const runButton = page.getByRole('button', { name: /Run/i })
  await expect(runButton).toBeVisible()
  await runButton.click()

  // "Building..." 버튼 확인
  await expect(
    page.getByRole('button', { name: /Building/i }),
  ).toBeVisible({ timeout: 15_000 })

  // Gemini API 로그 확인
  await expect(page.getByText('Generating React frontend from screens...')).toBeVisible({ timeout: 10_000 })
  await page.screenshot({ path: 'test-results/live-02-building.png' })

  // Gemini 완료 대기 — "writing to disk" 또는 에러
  const geminiDone = page.getByText(/writing to disk|Frontend generation failed/i).first()
  await expect(geminiDone).toBeVisible({ timeout: 180_000 })
  await page.screenshot({ path: 'test-results/live-03-after-gemini.png' })

  // 실패 시 에러 메시지 출력 후 테스트 실패
  const failCount = await page.getByText(/Frontend generation failed/i).count()
  if (failCount > 0) {
    const errorEl = page.getByText(/Frontend generation failed/i).first()
    const errorText = await errorEl.textContent()
    throw new Error(`Frontend generation failed: ${errorText}`)
  }

  // npm install 로그
  await expect(page.getByText(/Installing dependencies/i)).toBeVisible({ timeout: 30_000 })

  // dev server 시작 완료 대기
  await expect(
    page.getByText(/Dev server running|Dev server failed/i).first(),
  ).toBeVisible({ timeout: 180_000 })
  await page.screenshot({ path: 'test-results/live-04-dev-server.png' })

  // dev server 실패 시 에러 출력
  const devFailCount = await page.getByText(/Dev server failed/i).count()
  if (devFailCount > 0) {
    const errorEl = page.getByText(/Dev server failed/i).first()
    throw new Error(`Dev server failed: ${await errorEl.textContent()}`)
  }

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: Live Window 확인 (폴링)
  // ═══════════════════════════════════════════════════════════════
  let liveWindow = null
  for (let i = 0; i < 60; i++) {
    const windows = electronApp.windows()
    if (windows.length > 1) {
      liveWindow = windows.find(w => w !== page) || windows[windows.length - 1]
      break
    }
    await page.waitForTimeout(1000)
  }

  if (!liveWindow) {
    await page.screenshot({ path: 'test-results/live-05-no-live-window.png' })
    throw new Error('Live Window did not open within 60s')
  }

  await liveWindow.waitForLoadState('load', { timeout: 30_000 })
  await liveWindow.screenshot({ path: 'test-results/live-05-live-window.png' })

  // 플로팅 프롬프트 바 확인
  await expect(liveWindow.locator('#__vs-live-prompt-bar')).toBeVisible({ timeout: 15_000 })
  await expect(liveWindow.locator('#__vs-input')).toBeVisible()

  // Run 버튼이 "Stop"으로 변경
  await expect(page.getByRole('button', { name: /Stop/i })).toBeVisible()

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: Live 프롬프트 바에서 수정 지시
  // ═══════════════════════════════════════════════════════════════
  await liveWindow.locator('#__vs-input').fill('Add a dark mode toggle button in the top right corner')
  await liveWindow.locator('#__vs-submit').click()

  // 메인 에디터에 live edit 로그
  await expect(page.getByText(/Live edit/i).first()).toBeVisible({ timeout: 30_000 })

  // 수정 완료 대기
  await expect(
    liveWindow.locator('#__vs-status'),
  ).toContainText(/Applied|failed/i, { timeout: 120_000 })

  await liveWindow.screenshot({ path: 'test-results/live-06-after-edit.png' })
  await page.screenshot({ path: 'test-results/live-06-editor.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 5: Stop → dev server 종료
  // ═══════════════════════════════════════════════════════════════
  await page.getByRole('button', { name: /Stop/i }).click()
  await expect(page.getByRole('button', { name: /Run/i })).toBeVisible({ timeout: 10_000 })
})
