import { test, expect } from './electron-fixture'

test('증분 빌드 — 첫 빌드 → 스크린 추가 → 재빌드 시 캐시된 스크린은 Gemini에 전송하지 않음', async ({ electronApp, page }) => {
  test.setTimeout(600_000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 대시보드에서 Web 프로젝트 생성 → 2개 스크린
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()
  await page.getByRole('button', { name: 'Web' }).click()

  const textarea = page.locator('textarea')
  await textarea.fill(
    'A travel booking app screens: Home with hero search bar, Destinations with card grid'
  )
  await textarea.press('Enter')

  await expect(page.getByText('Generating...').first()).toBeVisible({ timeout: 15_000 })

  const screenCards = page.locator('[data-screen-card]')
  await expect(async () => {
    expect(await screenCards.count()).toBeGreaterThanOrEqual(2)
  }).toPass({ timeout: 180_000 })

  const initialCount = await screenCards.count()
  console.log(`Phase 1: Generated ${initialCount} screens`)
  await page.screenshot({ path: 'test-results/incr-01-initial-screens.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: 첫 번째 풀 빌드 (Run)
  // ═══════════════════════════════════════════════════════════════
  const runButton = page.getByRole('button', { name: /Run/i })
  await runButton.click()

  await expect(
    page.getByRole('button', { name: /Building/i }),
  ).toBeVisible({ timeout: 15_000 })

  // "Generating React frontend" (풀 빌드) 로그 확인
  await expect(page.getByText('Generating React frontend from screens...')).toBeVisible({ timeout: 10_000 })

  // 빌드 완료 대기
  await expect(
    page.getByText(/Dev server running|Dev server failed|Frontend generation failed/i).first(),
  ).toBeVisible({ timeout: 300_000 })
  await page.screenshot({ path: 'test-results/incr-02-first-build.png' })

  const devFail = await page.getByText(/Dev server failed|Frontend generation failed/i).count()
  if (devFail > 0) {
    throw new Error('First build failed')
  }

  // Stop
  await page.getByRole('button', { name: /Stop/i }).click()
  await expect(page.getByRole('button', { name: /Run/i })).toBeVisible({ timeout: 10_000 })
  console.log('Phase 2: First full build + stop complete')

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: 새 스크린 추가 (디자인 모드에서)
  // ═══════════════════════════════════════════════════════════════
  // 스크린 선택 해제
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // 프롬프트로 새 스크린 생성
  const promptBar = page.locator('textarea')
  await promptBar.fill('Booking confirmation page with reservation details, payment summary, and QR code')
  await promptBar.press('Enter')

  await expect(page.getByText('Generating...').first()).toBeVisible({ timeout: 15_000 })

  // 새 스크린 추가 대기
  await expect(async () => {
    expect(await screenCards.count()).toBeGreaterThan(initialCount)
  }).toPass({ timeout: 180_000 })

  const newCount = await screenCards.count()
  console.log(`Phase 3: Now have ${newCount} screens (was ${initialCount})`)
  await page.screenshot({ path: 'test-results/incr-03-added-screen.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: 증분 빌드 (Run 다시)
  // ═══════════════════════════════════════════════════════════════
  await page.getByRole('button', { name: /Run/i }).click()

  await expect(
    page.getByRole('button', { name: /Building/i }),
  ).toBeVisible({ timeout: 15_000 })

  // 증분 빌드 로그 확인: "Incremental build" 로그가 나와야 함
  await expect(
    page.getByText(/Incremental build/i).first(),
  ).toBeVisible({ timeout: 15_000 })

  // "Cached:" 로그 확인
  await expect(
    page.getByText(/Cached:/i).first(),
  ).toBeVisible({ timeout: 5_000 })

  // "Building:" 로그 확인
  await expect(
    page.getByText(/Building:/i).first(),
  ).toBeVisible({ timeout: 5_000 })

  console.log('Phase 4: Incremental build detected correctly')
  await page.screenshot({ path: 'test-results/incr-04-incremental-build.png' })

  // 빌드 완료 대기
  await expect(
    page.getByText(/Dev server running|Dev server failed|Frontend generation failed/i).first(),
  ).toBeVisible({ timeout: 300_000 })
  await page.screenshot({ path: 'test-results/incr-05-incremental-done.png' })

  const devFail2 = await page.getByText(/Dev server failed|Frontend generation failed/i).count()
  if (devFail2 > 0) {
    const err = await page.getByText(/Dev server failed|Frontend generation failed/i).first().textContent()
    throw new Error(`Incremental build failed: ${err}`)
  }

  // Live window 확인
  let liveWindow = null
  for (let i = 0; i < 30; i++) {
    const windows = electronApp.windows()
    if (windows.length > 1) {
      liveWindow = windows.find(w => w !== page) || windows[windows.length - 1]
      break
    }
    await page.waitForTimeout(1000)
  }

  if (liveWindow) {
    await liveWindow.waitForLoadState('load', { timeout: 15_000 })
    await liveWindow.screenshot({ path: 'test-results/incr-06-live-window.png' })
    console.log('Phase 4: Live window opened successfully after incremental build')
  }

  // Stop
  await page.getByRole('button', { name: /Stop/i }).click()
  await expect(page.getByRole('button', { name: /Run/i })).toBeVisible({ timeout: 10_000 })
  console.log('✓ Incremental build test complete')
})
