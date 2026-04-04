import { test, expect } from './electron-fixture'

test('디자인 훔치기: 대시보드 3화면 생성 → Pinterest 대시보드 이미지로 디자인 시스템 교체 + 컴포넌트 토큰 검증', async ({ page }) => {
  test.setTimeout(600_000)

  const DASHBOARD_IMAGE_URL = 'https://i.pinimg.com/1200x/dc/07/27/dc0727dafb62f0e3d1699115c375e5ab.jpg'

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 대시보드 3화면 생성
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()
  await page.getByRole('button', { name: 'Web' }).click()

  const textarea = page.locator('textarea')
  await textarea.fill(
    'A modern analytics dashboard with 3 screens. Use deep indigo (#4F46E5) as primary color on white (#F9FAFB) background. ' +
    'All screens share the same design system with Inter font, clean data-driven layout, 8px radius cards. ' +
    'screens: Overview – KPI stat cards (Revenue, Users, Orders, Conversion), area chart for revenue trend, recent activity table; ' +
    'Users – user list table with search bar, status badges (Active/Inactive), pagination; ' +
    'Settings – profile form with text inputs and labels, toggle switches, save button'
  )
  await textarea.press('Enter')

  const screenCards = page.locator('[data-screen-card]')
  await expect(async () => {
    expect(await screenCards.count()).toBe(3)
  }).toPass({ timeout: 30_000 })
  console.log('Phase 1: 3 placeholder screens appeared')
  await page.screenshot({ path: 'test-results/steal-dash-01-placeholders.png' })

  await expect(async () => {
    const generating = await page.locator('text=GENERATING').count()
    expect(generating).toBe(0)
  }).toPass({ timeout: 300_000 })

  const screenCount = await screenCards.count()
  expect(screenCount).toBe(3)
  console.log(`Phase 1: All ${screenCount} dashboard screens generated`)
  await page.screenshot({ path: 'test-results/steal-dash-02-screens.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: 디자인 시스템 확인 (변경 전)
  // ═══════════════════════════════════════════════════════════════
  const designTab = page.getByText('Design', { exact: true })
  await designTab.click()
  await page.waitForTimeout(500)

  const themeNameBefore = await page.locator('[data-testid="theme-name"]').textContent()
  console.log(`Phase 2: Current theme: "${themeNameBefore}"`)
  await page.screenshot({ path: 'test-results/steal-dash-03-design-before.png' })

  const firstIframe = page.locator('iframe').first()
  const htmlBefore = await firstIframe.getAttribute('srcdoc') || ''
  console.log(`Phase 2: First screen HTML length: ${htmlBefore.length}`)

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: Components 탭 확인 (변경 전)
  // ═══════════════════════════════════════════════════════════════
  const componentsTab = page.getByRole('button', { name: 'Components', exact: true })
  await componentsTab.click()
  await page.waitForTimeout(500)

  await expect(page.locator('[data-testid="typo-headline"]')).toBeVisible()
  await expect(page.locator('[data-testid="component-btn-primary"]')).toBeVisible()
  await expect(page.locator('[data-testid="component-input"]')).toBeVisible()
  await expect(page.locator('[data-testid="component-card"]')).toBeVisible()
  await page.screenshot({ path: 'test-results/steal-dash-04-components-before.png' })
  console.log('Phase 3: Components tab verified (typography, buttons, input, card)')

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: 디자인 훔치기 — 대시보드 이미지 URL
  // ═══════════════════════════════════════════════════════════════
  await designTab.click()
  await page.waitForTimeout(300)

  // "Dashboard Design" 카테고리 확인
  const browsePintBtn = page.locator('[data-testid="steal-from-pinterest"]')
  await expect(browsePintBtn).toBeVisible()
  await browsePintBtn.click()
  await page.waitForTimeout(300)

  const dashboardCategory = page.locator('[data-testid="steal-category-dashboard"]')
  await expect(dashboardCategory).toBeVisible()
  console.log('Phase 4: Dashboard category button verified')
  await page.screenshot({ path: 'test-results/steal-dash-05-categories.png' })

  // 메뉴 닫기
  await browsePintBtn.click()
  await page.waitForTimeout(200)

  // URL 입력으로 디자인 훔치기
  const urlInput = page.locator('[data-testid="steal-url-input"]')
  await expect(urlInput).toBeVisible({ timeout: 5000 })
  await urlInput.fill(DASHBOARD_IMAGE_URL)
  console.log('Phase 4: Pasted dashboard image URL')

  const stealBtn = page.locator('[data-testid="steal-url-submit"]')
  await stealBtn.click()
  console.log('Phase 4: Clicked Steal button')

  await expect(page.getByText(/Downloading image/i)).toBeVisible({ timeout: 10_000 })
  console.log('Phase 4: Image download started')

  await expect(page.getByText(/Analyzing design from image/i)).toBeVisible({ timeout: 30_000 })
  console.log('Phase 4: Gemini Vision analysis started')

  await expect(page.getByText(/Stolen design.*applied/i)).toBeVisible({ timeout: 120_000 })
  console.log('Phase 4: Design steal completed!')
  await page.screenshot({ path: 'test-results/steal-dash-06-after-steal.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 5: 변경 검증
  // ═══════════════════════════════════════════════════════════════
  const themeNameAfter = await page.locator('[data-testid="theme-name"]').textContent()
  console.log(`Phase 5: New theme: "${themeNameAfter}"`)
  expect(themeNameAfter).not.toBe(themeNameBefore)
  expect(themeNameAfter).not.toBe('Generating...')

  const htmlAfter = await firstIframe.getAttribute('srcdoc') || ''
  console.log(`Phase 5: First screen HTML after: ${htmlAfter.length}`)
  expect(htmlAfter).not.toBe(htmlBefore)

  await page.screenshot({ path: 'test-results/steal-dash-07-design-after.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 6: Components 탭 변경 확인 (디자인 토큰 적용 검증)
  // ═══════════════════════════════════════════════════════════════
  await componentsTab.click()
  await page.waitForTimeout(500)

  await expect(page.locator('[data-testid="typo-headline"]')).toBeVisible()
  await expect(page.locator('[data-testid="component-btn-primary"]')).toBeVisible()
  await expect(page.locator('[data-testid="component-btn-tertiary"]')).toBeVisible()
  await expect(page.locator('[data-testid="component-input"]')).toBeVisible()
  await expect(page.locator('[data-testid="component-input-label"]')).toBeVisible()
  await expect(page.locator('[data-testid="component-card"]')).toBeVisible()
  await expect(page.locator('[data-testid="component-fab"]')).toBeVisible()
  await expect(page.locator('[data-testid="component-chips"]')).toBeVisible()

  await page.screenshot({ path: 'test-results/steal-dash-08-components-after.png' })
  console.log('Phase 6: All component sections verified after design steal')

  console.log('=== Dashboard Design Steal Test PASSED ===')
})
