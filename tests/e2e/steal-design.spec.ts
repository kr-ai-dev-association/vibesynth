import { test, expect } from './electron-fixture'

test('디자인 훔치기: SaaS 홈페이지 생성 → Pinterest 이미지 URL로 디자인 시스템 교체', async ({ page }) => {
  test.setTimeout(600_000)

  const PIN_IMAGE_URL = 'https://i.pinimg.com/736x/84/a1/31/84a131a27e1401568f0c88d218b18f5e.jpg'

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: Startup SaaS 홈페이지 3화면 생성
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()
  await page.getByRole('button', { name: 'Web' }).click()

  const textarea = page.locator('textarea')
  await textarea.fill(
    'A modern startup SaaS homepage with 3 screens. Use blue (#3B82F6) as primary color on white (#FFFFFF) background. ' +
    'All screens share the same design system with Inter font, rounded cards, clean layout. ' +
    'screens: Landing – hero section with headline "Launch Your Idea", feature cards with icons, CTA button; ' +
    'Pricing – 3-tier pricing cards (Free/Pro/Enterprise) with feature lists and select buttons; ' +
    'About – team member cards with photos, company mission statement, contact form'
  )
  await textarea.press('Enter')

  const screenCards = page.locator('[data-screen-card]')
  await expect(async () => {
    expect(await screenCards.count()).toBe(3)
  }).toPass({ timeout: 30_000 })
  console.log('Phase 1: 3 placeholder screens appeared')
  await page.screenshot({ path: 'test-results/steal-01-placeholders.png' })

  // 모든 화면 생성 완료 대기
  await expect(async () => {
    const generating = await page.locator('text=GENERATING').count()
    expect(generating).toBe(0)
  }).toPass({ timeout: 300_000 })

  const screenCount = await screenCards.count()
  expect(screenCount).toBe(3)
  console.log(`Phase 1: All ${screenCount} SaaS screens generated`)
  await page.screenshot({ path: 'test-results/steal-02-saas-screens.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: 디자인 시스템 확인 (변경 전)
  // ═══════════════════════════════════════════════════════════════
  // Design 탭 열기
  const designTab = page.getByText('Design', { exact: true })
  await designTab.click()
  await page.waitForTimeout(500)

  // 현재 테마 이름 캡처
  const themeNameBefore = await page.locator('[data-testid="theme-name"]').textContent()
  console.log(`Phase 2: Current theme name: "${themeNameBefore}"`)
  await page.screenshot({ path: 'test-results/steal-03-design-before.png' })

  // 첫 번째 스크린 HTML 캡처 (변경 비교용)
  const firstIframe = page.locator('iframe').first()
  const htmlBefore = await firstIframe.getAttribute('srcdoc') || ''
  console.log(`Phase 2: First screen HTML length: ${htmlBefore.length}`)

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: 디자인 훔치기 — Pinterest 이미지 URL 붙여넣기
  // ═══════════════════════════════════════════════════════════════
  console.log('Phase 3: Starting design steal...')

  // URL 입력란 찾기
  const urlInput = page.locator('[data-testid="steal-url-input"]')
  await expect(urlInput).toBeVisible({ timeout: 5000 })

  // 이미지 URL 입력
  await urlInput.fill(PIN_IMAGE_URL)
  console.log('Phase 3: Pasted Pinterest image URL')

  // Steal 버튼 클릭
  const stealBtn = page.locator('[data-testid="steal-url-submit"]')
  await stealBtn.click()
  console.log('Phase 3: Clicked Steal button')

  // Agent Log에서 분석 시작 확인
  await expect(page.getByText(/Downloading image/i)).toBeVisible({ timeout: 10_000 })
  console.log('Phase 3: Image download started')

  await expect(page.getByText(/Analyzing design from image/i)).toBeVisible({ timeout: 30_000 })
  console.log('Phase 3: Gemini Vision analysis started')

  // 분석 완료 대기 (Stolen design "..." applied)
  await expect(page.getByText(/Stolen design.*applied/i)).toBeVisible({ timeout: 60_000 })
  console.log('Phase 3: Design steal completed!')
  await page.screenshot({ path: 'test-results/steal-04-after-steal.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: 변경 검증
  // ═══════════════════════════════════════════════════════════════
  // 테마 이름이 변경되었는지 확인
  const themeNameAfter = await page.locator('[data-testid="theme-name"]').textContent()
  console.log(`Phase 4: New theme name: "${themeNameAfter}"`)
  expect(themeNameAfter).not.toBe(themeNameBefore)
  expect(themeNameAfter).not.toBe('Generating...')

  // 스크린 HTML이 변경되었는지 확인
  const htmlAfter = await firstIframe.getAttribute('srcdoc') || ''
  console.log(`Phase 4: First screen HTML length after: ${htmlAfter.length}`)
  expect(htmlAfter).not.toBe(htmlBefore)

  await page.screenshot({ path: 'test-results/steal-05-final.png' })
  console.log('Phase 4: Design steal test PASSED — theme name and screen HTML changed')
})
