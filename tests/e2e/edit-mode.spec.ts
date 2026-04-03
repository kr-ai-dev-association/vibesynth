import { test, expect } from './electron-fixture'

test('스크린 선택 → Edit 모드 → 요소 선택 → 요소 수정 전체 흐름', async ({ page }) => {
  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 대시보드에서 단일 스크린 프로젝트 생성
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()

  await page.getByRole('button', { name: 'Web' }).click()

  const dashboardTextarea = page.locator('textarea')
  await dashboardTextarea.fill(
    'A landing page for a coffee shop with a large hero heading, a navigation bar, and a contact section',
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
  // Phase 2: 스크린 카드 클릭 → 선택 상태 확인
  // ═══════════════════════════════════════════════════════════════
  await screenCards.first().click()

  // ScreenContextToolbar가 나타나는지 확인 (Modify 버튼)
  await expect(page.getByText('Modify')).toBeVisible({ timeout: 5_000 })

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: Edit 모드 진입 (Modify → Edit 툴바 메뉴)
  // ═══════════════════════════════════════════════════════════════
  await page.getByText('Modify').click()
  await page.getByRole('button', { name: 'Edit' }).click()

  // 헤더에 "Edit Mode" 인디케이터 확인
  await expect(page.getByText('Edit Mode').first()).toBeVisible({ timeout: 3_000 })

  // Agent log에 edit mode 진입 메시지 확인
  await expect(page.getByText(/Entered edit mode/i)).toBeVisible({ timeout: 5_000 })

  // 스크린 카드에 "EDIT" 배지 확인
  await expect(page.locator('[data-screen-card]').getByText('EDIT')).toBeVisible({ timeout: 3_000 })

  // iframe이 edit mode script와 함께 리로드될 시간 대기
  await page.waitForTimeout(3000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: iframe 내 요소 클릭 → 선택 확인
  // ═══════════════════════════════════════════════════════════════

  // edit script가 로드되어 __vs_overlay가 존재하는지 확인
  const frameLocator = iframe.contentFrame()
  await expect(frameLocator.locator('#__vs_overlay')).toBeAttached({ timeout: 10_000 })

  // iframe 위치 기반으로 직접 마우스 클릭 (scale transform 고려)
  const box = await iframe.boundingBox()
  expect(box).toBeTruthy()
  // 상단 1/3 지점 클릭 (보통 heading이나 nav가 있는 영역)
  await page.mouse.click(
    box!.x + box!.width * 0.4,
    box!.y + box!.height * 0.2,
  )

  // PromptBar에 보라색 요소 태그가 표시되는지 확인
  await expect(
    page.getByText(/Selected </),
  ).toBeVisible({ timeout: 10_000 })

  // ═══════════════════════════════════════════════════════════════
  // Phase 5: 요소 수정 프롬프트 제출 → AI 수정 확인
  // ═══════════════════════════════════════════════════════════════
  const editorTextarea = page.locator('.max-w-2xl textarea')
  await editorTextarea.fill('Make this element bold, larger, and bright red')
  await editorTextarea.press('Enter')

  // "Editing element <tagName> in ..." 로그 확인
  await expect(page.getByText(/Editing element/i)).toBeVisible({ timeout: 10_000 })

  // "Updated element in ..." 완료 로그 확인
  await expect(page.getByText(/Updated element/i)).toBeVisible({ timeout: 120_000 })

  // HTML이 실제로 변경되었는지 확인
  const updatedHtml = await iframe.getAttribute('srcdoc')
  expect(updatedHtml).toBeTruthy()
  expect(updatedHtml!.length).toBeGreaterThan(100)
  expect(updatedHtml).not.toEqual(originalHtml)

  // ═══════════════════════════════════════════════════════════════
  // Phase 6: Edit 모드 종료 확인 (PromptBar의 Edit Mode × 버튼)
  // ═══════════════════════════════════════════════════════════════

  // Edit 모드에 다시 진입 (요소 수정 완료 후에도 editMode는 유지됨)
  // PromptBar의 "Edit Mode" 배지 옆 × 버튼 클릭
  const editModeBadge = page.locator('span').filter({ hasText: 'Edit Mode' })
  await editModeBadge.locator('button').click()

  // "EDIT" 배지가 사라지는지 확인
  await expect(
    page.locator('[data-screen-card]').getByText('EDIT'),
  ).not.toBeVisible({ timeout: 5_000 })
})
