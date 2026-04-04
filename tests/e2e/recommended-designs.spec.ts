import { test, expect } from './electron-fixture'

test('추천 디자인 시스템: 대시보드 생성 → 추천 디자인 적용 → 컴포넌트 검증', async ({ page }) => {
  test.setTimeout(600_000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 대시보드 프로젝트 생성
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()
  await page.getByRole('button', { name: 'Web' }).click()

  const textarea = page.locator('textarea')
  await textarea.fill(
    'A simple analytics dashboard with 2 screens. Use blue (#3B82F6) primary on white. ' +
    'screens: Dashboard – 4 stat cards and a chart; Settings – profile form with inputs'
  )
  await textarea.press('Enter')

  const screenCards = page.locator('[data-screen-card]')
  await expect(async () => {
    expect(await screenCards.count()).toBe(2)
  }).toPass({ timeout: 30_000 })

  await expect(async () => {
    const generating = await page.locator('text=GENERATING').count()
    expect(generating).toBe(0)
  }).toPass({ timeout: 300_000 })
  console.log('Phase 1: Dashboard screens generated')
  await page.screenshot({ path: 'test-results/recommended-01-screens.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: 디자인 탭에서 추천 디자인 시스템 확인
  // ═══════════════════════════════════════════════════════════════
  const designTab = page.getByText('Design', { exact: true })
  await designTab.click()
  await page.waitForTimeout(500)

  const themeNameBefore = await page.locator('[data-testid="theme-name"]').textContent()
  console.log(`Phase 2: Current theme: "${themeNameBefore}"`)

  // "Recommended Designs" 섹션 펼치기
  const recommendedBtn = page.getByText('Recommended Designs')
  await expect(recommendedBtn).toBeVisible()
  await recommendedBtn.click()
  await page.waitForTimeout(300)

  const recommendedGrid = page.locator('[data-testid="recommended-designs"]')
  await expect(recommendedGrid).toBeVisible()

  // 13개 추천 디자인이 표시되는지 확인
  const recommendedItems = recommendedGrid.locator('button')
  const itemCount = await recommendedItems.count()
  console.log(`Phase 2: Found ${itemCount} recommended designs`)
  expect(itemCount).toBe(13)
  await page.screenshot({ path: 'test-results/recommended-02-grid.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: 추천 디자인 시스템 적용
  // ═══════════════════════════════════════════════════════════════
  // 첫 번째 추천 디자인 클릭
  const firstRecommended = recommendedItems.first()
  const recommendedName = await firstRecommended.locator('.font-medium').textContent()
  console.log(`Phase 3: Applying recommended design: "${recommendedName}"`)
  await firstRecommended.click()

  await page.waitForTimeout(1000)

  // 테마 이름이 변경되었는지 확인
  const themeNameAfter = await page.locator('[data-testid="theme-name"]').textContent()
  console.log(`Phase 3: Theme after: "${themeNameAfter}"`)
  expect(themeNameAfter).not.toBe(themeNameBefore)
  await page.screenshot({ path: 'test-results/recommended-03-applied.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: 컴포넌트 탭 검증
  // ═══════════════════════════════════════════════════════════════
  const componentsTab = page.getByRole('button', { name: 'Components', exact: true })
  await componentsTab.click()
  await page.waitForTimeout(500)

  await expect(page.locator('[data-testid="typo-headline"]')).toBeVisible()
  await expect(page.locator('[data-testid="component-btn-primary"]')).toBeVisible()
  await expect(page.locator('[data-testid="component-input"]')).toBeVisible()
  await expect(page.locator('[data-testid="component-card"]')).toBeVisible()
  await page.screenshot({ path: 'test-results/recommended-04-components.png' })
  console.log('Phase 4: Components tab verified')

  // ═══════════════════════════════════════════════════════════════
  // Phase 5: 다른 추천 디자인으로 전환
  // ═══════════════════════════════════════════════════════════════
  await designTab.click()
  await page.waitForTimeout(300)

  // 추천 섹션 다시 펼치기
  await page.getByText('Recommended Designs').click()
  await page.waitForTimeout(300)
  await expect(page.locator('[data-testid="recommended-designs"]')).toBeVisible()

  // 세 번째 추천 디자인 적용
  const thirdRecommended = page.locator('[data-testid="recommended-designs"] button').nth(2)
  await thirdRecommended.click()
  await page.waitForTimeout(1000)

  const themeNameFinal = await page.locator('[data-testid="theme-name"]').textContent()
  console.log(`Phase 5: Final theme: "${themeNameFinal}"`)
  expect(themeNameFinal).not.toBe(themeNameAfter)
  await page.screenshot({ path: 'test-results/recommended-05-switched.png' })

  console.log('=== Recommended Design Systems Test PASSED ===')
})
