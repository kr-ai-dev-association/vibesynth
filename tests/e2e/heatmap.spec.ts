import { test, expect } from './electron-fixture'

test('히트맵 생성 → 오버레이 표시 → 액션 메뉴 → 효과 적용', async ({ page }) => {
  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 대시보드에서 Web 프로젝트 생성 + 스크린 생성 대기
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()

  await page.getByRole('button', { name: 'Web' }).click()

  const dashboardTextarea = page.locator('textarea')
  await dashboardTextarea.fill(
    'A portfolio website for a photographer with hero section, gallery grid, about section, and contact form',
  )
  await dashboardTextarea.press('Enter')

  await expect(page.getByText('Generating...')).toBeVisible({ timeout: 10_000 })

  const screenCards = page.locator('[data-screen-card]')
  await expect(screenCards).toHaveCount(1, { timeout: 120_000 })

  const iframe = page.locator('[data-screen-card] iframe')
  await expect(iframe).toHaveCount(1)
  const originalHtml = await iframe.getAttribute('srcdoc')
  expect(originalHtml).toBeTruthy()
  expect(originalHtml!.length).toBeGreaterThan(100)

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: 스크린 선택 → Predictive heat map 클릭
  // ═══════════════════════════════════════════════════════════════
  await screenCards.first().click()
  await expect(page.getByText('Modify')).toBeVisible({ timeout: 5_000 })

  // Generate → Predictive heat map 클릭
  await page.getByText('Generate').first().click()
  await page.getByRole('button', { name: 'Predictive heat map' }).click()

  // 히트맵 생성 로그 확인
  await expect(page.getByText(/Generating predictive heatmap/i)).toBeVisible({ timeout: 10_000 })

  // 히트맵 생성 완료 확인
  await expect(
    page.getByText(/attention zones identified/i),
  ).toBeVisible({ timeout: 60_000 })

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: 히트맵 오버레이 확인
  // ═══════════════════════════════════════════════════════════════

  // 헤더에 "Heatmap" 인디케이터
  await expect(page.getByText('Heatmap').first()).toBeVisible({ timeout: 3_000 })

  // 스크린 카드에 "HEATMAP" 배지
  await expect(page.locator('[data-screen-card]').getByText('HEATMAP')).toBeVisible({ timeout: 3_000 })

  // 히트맵 존이 하나 이상 있는지 확인
  const heatmapZones = page.locator('[data-heatmap-zone]')
  await expect(heatmapZones.first()).toBeVisible({ timeout: 10_000 })
  const zoneCount = await heatmapZones.count()
  expect(zoneCount).toBeGreaterThanOrEqual(1)

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: 핫스팟 클릭 → 액션 메뉴 표시 확인
  // ═══════════════════════════════════════════════════════════════
  await heatmapZones.first().click()

  // 액션 메뉴가 열리는지 확인
  await expect(page.getByText('ADD INTERACTION')).toBeVisible({ timeout: 5_000 })
  await expect(page.getByText('AI ENHANCE')).toBeVisible({ timeout: 3_000 })

  // 메뉴 항목 확인
  await expect(page.getByRole('button', { name: 'Hover effect' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Click animation' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Make more prominent' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add micro-animation' })).toBeVisible()

  // ═══════════════════════════════════════════════════════════════
  // Phase 5: 인터랙션 효과 적용 → HTML 변경 확인
  // ═══════════════════════════════════════════════════════════════
  await page.getByRole('button', { name: 'Hover effect' }).click()

  // 적용 로그 확인
  await expect(page.getByText(/Applying "hover-effect"/i)).toBeVisible({ timeout: 10_000 })
  await expect(
    page.getByText(/Applied "hover-effect"/i),
  ).toBeVisible({ timeout: 120_000 })

  // HTML이 변경되었는지 확인
  const updatedHtml = await iframe.getAttribute('srcdoc')
  expect(updatedHtml).toBeTruthy()
  expect(updatedHtml!.length).toBeGreaterThan(100)
  expect(updatedHtml).not.toEqual(originalHtml)
})
