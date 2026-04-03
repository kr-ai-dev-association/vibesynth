import { test, expect } from './electron-fixture'

test('데스크탑 스크린 동적 높이 — 콘텐츠에 맞게 하단이 잘리지 않아야 함', async ({ page }) => {
  test.setTimeout(300_000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 0: 다크모드 확인
  // ═══════════════════════════════════════════════════════════════
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  console.log(`Dark mode active: ${isDark}`)
  expect(isDark).toBe(true)

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 대시보드에서 Web 프로젝트 생성 → 긴 콘텐츠 디자인
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()

  // Web (데스크탑) 디바이스 선택
  await page.getByRole('button', { name: 'Web' }).click()
  await page.screenshot({ path: 'test-results/height-01-dashboard.png' })

  // 긴 콘텐츠가 포함되는 디자인 요청
  const textarea = page.locator('textarea')
  await textarea.fill(
    'A long landing page for a design agency with: hero section with large headline and CTA, ' +
    'about us section with team photos, services section with 6 service cards in a grid, ' +
    'portfolio gallery with 8 project thumbnails, testimonials section with 3 client reviews, ' +
    'pricing table with 3 tiers, FAQ section with 6 questions, contact form, and footer with links. ' +
    'Make it content-rich and vertically long.'
  )
  await textarea.press('Enter')

  await expect(page.getByText('Generating...').first()).toBeVisible({ timeout: 15_000 })

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: 스크린 생성 완료 대기
  // ═══════════════════════════════════════════════════════════════
  const screenCards = page.locator('[data-screen-card]')
  await expect(async () => {
    const count = await screenCards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  }).toPass({ timeout: 180_000 })

  // 생성 직후 스크린샷
  await page.screenshot({ path: 'test-results/height-02-screen-generated.png', fullPage: true })

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: 높이 측정 — postMessage가 동작할 시간을 줌
  // ═══════════════════════════════════════════════════════════════
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'test-results/height-03-after-height-measure.png', fullPage: true })

  // 스크린 카드의 data-screen-dims 속성에서 높이 읽기
  const firstCard = screenCards.first()
  const dims = await firstCard.getAttribute('data-screen-dims')
  console.log(`Screen dimensions: ${dims}`)

  // dims 형식: "1280x{height}"
  const match = dims?.match(/(\d+)x(\d+)/)
  expect(match).toBeTruthy()

  const screenWidth = parseInt(match![1], 10)
  const screenHeight = parseInt(match![2], 10)
  console.log(`Width: ${screenWidth}, Height: ${screenHeight}`)

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: 검증 — 데스크탑 스크린은 minHeight(900) 보다 커야 함
  // ═══════════════════════════════════════════════════════════════
  expect(screenWidth).toBe(1280)

  // 긴 랜딩 페이지는 900px보다 훨씬 길어야 함 (실제 콘텐츠가 매우 길 수 있음)
  console.log(`Height check: ${screenHeight} should be > 900 (minHeight)`)

  // 긴 콘텐츠이므로 최소 높이(900)보다 커야 함
  expect(screenHeight).toBeGreaterThan(900)

  console.log(`✓ Dynamic height working: ${screenWidth}x${screenHeight}`)

  // ═══════════════════════════════════════════════════════════════
  // Phase 5: 스크린 카드 내 iframe의 실제 렌더링 확인
  // ═══════════════════════════════════════════════════════════════
  // iframe container div의 실제 CSS height 확인
  const containerDiv = firstCard.locator('div.relative').first()
  const box = await containerDiv.boundingBox()
  console.log(`Screen card container box: ${JSON.stringify(box)}`)

  if (box) {
    // displayHeight = height * scale(0.5) → 최소 450px 이상이어야 함
    console.log(`Container display height: ${box.height}px (expected > 450)`)
    expect(box.height).toBeGreaterThan(450)
  }

  // 최종 확인 스크린샷 — 스크린 카드를 클릭해서 선택 후 dimension 표시
  await firstCard.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-results/height-04-selected-with-dims.png', fullPage: true })

  // 하단 dimension 텍스트에서 높이 확인
  const dimText = page.locator('text=/1280 x \\d+/')
  const dimCount = await dimText.count()
  if (dimCount > 0) {
    const text = await dimText.first().textContent()
    console.log(`Displayed dimensions: ${text}`)
  }

  // ═══════════════════════════════════════════════════════════════
  // Phase 6: Auto-zoom 확인 — 긴 콘텐츠 시 줌이 100% 미만으로 축소되어야 함
  // ═══════════════════════════════════════════════════════════════
  const zoomButton = page.locator('[data-testid="zoom-indicator"]')
  const zoomText = await zoomButton.textContent()
  console.log(`Zoom button text: "${zoomText}"`)
  const zoomMatch = zoomText?.match(/(\d+)/)
  const zoomLevel = zoomMatch ? parseInt(zoomMatch[1], 10) : 100
  console.log(`Canvas zoom level: ${zoomLevel}%`)

  // 긴 콘텐츠는 캔버스에 맞추려면 100%보다 작아야 함
  expect(zoomLevel).toBeLessThan(100)
  console.log(`✓ Auto-zoom applied: ${zoomLevel}%`)

  await page.screenshot({ path: 'test-results/height-05-auto-zoom.png', fullPage: true })
})
