import { test, expect } from '@playwright/test'

test('멀티 스크린 생성 → 일괄 수정 → 단일 수정 전체 흐름', async ({ page }) => {
  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 대시보드에서 Web 멀티 스크린 프로젝트 생성
  // ═══════════════════════════════════════════════════════════════
  await page.goto('/')
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()

  await page.getByRole('button', { name: 'Web' }).click()

  const dashboardTextarea = page.locator('textarea')
  await dashboardTextarea.fill(
    'A SaaS project management tool screens: Dashboard, Projects, Team',
  )
  await dashboardTextarea.press('Enter')

  // 에디터로 이동 확인
  await expect(page.getByText('Generating...')).toBeVisible({ timeout: 10_000 })

  // 멀티 스크린 생성 시작 로그
  await expect(
    page.getByText(/Generating 3 screens/i),
  ).toBeVisible({ timeout: 30_000 })

  // 첫 번째 스크린 완료
  await expect(
    page.getByText(/Screen 1\/3 done/i),
  ).toBeVisible({ timeout: 120_000 })

  // 3개 스크린 모두 생성 완료
  await expect(
    page.getByText(/Generated 3 screens/i),
  ).toBeVisible({ timeout: 120_000 })

  // 캔버스에 3개 스크린 카드 확인
  const screenCards = page.locator('[data-screen-card]')
  await expect(screenCards).toHaveCount(3, { timeout: 10_000 })

  // 스크린 이름 확인
  await expect(screenCards.filter({ hasText: 'Dashboard' }).first()).toBeVisible()
  await expect(screenCards.filter({ hasText: 'Projects' }).first()).toBeVisible()
  await expect(screenCards.filter({ hasText: 'Team' }).first()).toBeVisible()

  // 각 iframe에 HTML이 렌더링되었는지 확인
  const iframes = page.locator('[data-screen-card] iframe')
  await expect(iframes).toHaveCount(3)
  for (let i = 0; i < 3; i++) {
    const srcDoc = await iframes.nth(i).getAttribute('srcdoc')
    expect(srcDoc).toBeTruthy()
    expect(srcDoc!.length).toBeGreaterThan(100)
  }

  // 디자인 시스템 추출 완료 확인 (중간 "Extracting..." 상태는 빠르게 지나갈 수 있음)
  await expect(
    page.getByText(/Design system .+ extracted/i).or(
      page.getByText(/Could not extract design system/i),
    ),
  ).toBeVisible({ timeout: 60_000 })

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: 글로벌 키워드로 일괄 수정 (모든 스크린)
  // ═══════════════════════════════════════════════════════════════

  // 원본 HTML 저장
  const originalHtmls: string[] = []
  for (let i = 0; i < 3; i++) {
    const html = await iframes.nth(i).getAttribute('srcdoc')
    originalHtmls.push(html || '')
  }

  // 스크린 선택
  const dashboardCard = screenCards.filter({ hasText: 'Dashboard' }).first()
  await dashboardCard.click()

  // 선택 태그 확인
  await expect(
    page.locator('.rounded-full', { hasText: 'Dashboard' }),
  ).toBeVisible({ timeout: 3_000 })

  // "theme" 키워드로 글로벌 수정 프롬프트 제출
  const editorTextarea = page.locator('.max-w-2xl textarea')
  await editorTextarea.fill('Change to a dark theme with neon green accents')
  await editorTextarea.press('Enter')

  // 일괄 수정 시작 확인
  await expect(
    page.getByText(/Batch editing all 3 screens/i),
  ).toBeVisible({ timeout: 10_000 })

  // 일괄 수정 완료 확인
  await expect(
    page.getByText(/Batch updated 3 screens/i),
  ).toBeVisible({ timeout: 120_000 })

  // 디자인 시스템 재추출 확인
  await expect(
    page.getByText(/Updating design system/i),
  ).toBeVisible({ timeout: 10_000 })

  await expect(
    page.getByText(/Design system updated to/i).or(
      page.getByText(/Design system update skipped/i),
    ),
  ).toBeVisible({ timeout: 60_000 })

  // 3개 스크린 카드 유지 확인
  await expect(screenCards).toHaveCount(3)

  // HTML이 실제로 변경되었는지 확인
  for (let i = 0; i < 3; i++) {
    const newHtml = await iframes.nth(i).getAttribute('srcdoc')
    expect(newHtml).toBeTruthy()
    expect(newHtml!.length).toBeGreaterThan(100)
    expect(newHtml).not.toEqual(originalHtmls[i])
  }

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: 비-글로벌 프롬프트로 단일 스크린만 수정
  // ═══════════════════════════════════════════════════════════════

  // 수정 후 HTML 저장
  const afterBatchHtmls: string[] = []
  for (let i = 0; i < 3; i++) {
    const html = await iframes.nth(i).getAttribute('srcdoc')
    afterBatchHtmls.push(html || '')
  }

  // "Projects" 스크린 선택 (두 번째)
  const projectsCard = screenCards.filter({ hasText: 'Projects' }).first()
  await projectsCard.click()

  await expect(
    page.locator('.rounded-full', { hasText: 'Projects' }),
  ).toBeVisible({ timeout: 3_000 })

  // 비-글로벌 프롬프트 (theme/color/font 키워드 없음)
  await editorTextarea.fill('Add a search bar and filter chips at the top')
  await editorTextarea.press('Enter')

  // 단일 수정 메시지 확인 (Batch가 아닌)
  await expect(
    page.getByText(/Editing "Projects"/i),
  ).toBeVisible({ timeout: 10_000 })

  // 단일 수정 완료
  await expect(
    page.getByText(/Updated screen: Projects/i),
  ).toBeVisible({ timeout: 60_000 })

  // 3개 스크린 유지
  await expect(screenCards).toHaveCount(3)

  // Projects(index 1)만 변경되고, 나머지는 유지
  const finalHtml0 = await iframes.nth(0).getAttribute('srcdoc')
  const finalHtml1 = await iframes.nth(1).getAttribute('srcdoc')
  const finalHtml2 = await iframes.nth(2).getAttribute('srcdoc')

  expect(finalHtml0).toEqual(afterBatchHtmls[0])
  expect(finalHtml1).not.toEqual(afterBatchHtmls[1])
  expect(finalHtml2).toEqual(afterBatchHtmls[2])

})
