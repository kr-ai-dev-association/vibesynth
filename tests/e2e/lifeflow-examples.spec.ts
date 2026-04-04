import { test, expect } from './electron-fixture'

test('LifeFlow 예제: Dashboard에 6개 예제 카드 표시 + 사이드바 카테고리 목록', async ({ page }) => {
  await page.waitForSelector('text=Welcome to VibeSynth', { timeout: 15000 })
  await page.screenshot({ path: 'test-results/lifeflow-01-dashboard.png' })

  // 메인 영역에 6개 예제 카드가 표시되는지 확인
  const exampleCards = page.locator('main button:has-text("LifeFlow")')
  await expect(exampleCards).toHaveCount(6)

  // 사이드바에 "LifeFlow Examples" 레이블 확인
  await expect(page.getByText('LifeFlow Examples')).toBeVisible()

  // 사이드바에 카테고리별 예제 항목 확인 (exact match로 중복 방지)
  const categories = ['Landing Page', 'Homepage', 'Dashboard', 'iPhone App', 'Android App', 'iPad App']
  for (const cat of categories) {
    await expect(page.locator('aside').getByText(cat, { exact: true })).toBeVisible()
  }

  await page.screenshot({ path: 'test-results/lifeflow-02-sidebar-categories.png' })
})

test('LifeFlow 예제: iPhone App 카드 클릭 → PRD 모달 표시 → MD 렌더링 확인', async ({ page }) => {
  await page.waitForSelector('text=Welcome to VibeSynth', { timeout: 15000 })

  // iPhone App 카드 클릭 (메인 영역)
  await page.locator('main button:has-text("LifeFlow iPhone App")').click()

  // PRD 모달이 열리는지 확인
  const modal = page.locator('[class*="fixed"]')
  await expect(modal.locator('h2:has-text("LifeFlow iPhone App")')).toBeVisible({ timeout: 5000 })
  await page.screenshot({ path: 'test-results/lifeflow-03-prd-modal-iphone.png' })

  // PRD 내용이 렌더링되는지 확인
  await expect(modal.getByText('LifeFlow — iPhone App')).toBeVisible()
  await expect(modal.getByText('Overview')).toBeVisible()
  await expect(modal.getByText('Target Audience')).toBeVisible()

  // PRD 내 구체적 내용 확인
  await expect(modal.getByText('좋은 아침, 민지님')).toBeVisible()

  // 모달 하단의 Design Style 섹션 확인 (exact match)
  await expect(modal.getByText('Design Style', { exact: true })).toBeVisible()

  // 모달 내 Generate 버튼 확인
  await expect(modal.locator('button:has-text("Generate"):not([disabled])')).toBeVisible()
})

test('LifeFlow 예제: Dashboard 카드 클릭 → PRD 내용 확인 → 모달 닫기', async ({ page }) => {
  await page.waitForSelector('text=Welcome to VibeSynth', { timeout: 15000 })

  // Dashboard 예제 클릭 (사이드바에서)
  await page.locator('aside button:has-text("LifeFlow Admin Dashboard")').click()

  // PRD 모달 열림 확인
  const modal = page.locator('[class*="fixed"]')
  await expect(modal.locator('h2:has-text("LifeFlow Admin Dashboard")')).toBeVisible({ timeout: 5000 })
  await page.screenshot({ path: 'test-results/lifeflow-04-prd-modal-dashboard.png' })

  // 대시보드 PRD의 핵심 내용 확인
  await expect(modal.getByText('Member Management Dashboard')).toBeVisible()
  await expect(modal.getByText('KPI Cards')).toBeVisible()

  // 배경 클릭으로 모달 닫기
  await page.mouse.click(5, 5)
  await page.waitForTimeout(500)

  // 모달이 닫혔는지 확인
  await expect(modal.locator('h2:has-text("LifeFlow Admin Dashboard")')).not.toBeVisible()
  await expect(page.getByText('Welcome to VibeSynth')).toBeVisible()
})

test('LifeFlow 예제: PRD 모달에서 디자인 시스템 변경 후 Generate', async ({ page }) => {
  await page.waitForSelector('text=Welcome to VibeSynth', { timeout: 15000 })

  // Landing Page 예제 클릭
  await page.locator('main button:has-text("LifeFlow Landing Page")').click()
  const modal = page.locator('[class*="fixed"]')
  await expect(modal.locator('h2:has-text("LifeFlow Landing Page")')).toBeVisible({ timeout: 5000 })
  await page.screenshot({ path: 'test-results/lifeflow-05-prd-landing.png' })

  // PRD 내용 확인
  await expect(modal.getByText('Service Landing Page')).toBeVisible()
  await expect(modal.getByText('무료로 시작하기')).toBeVisible()

  // 디자인 시스템 선택 변경 (모달 내의 두 번째 DS 버튼 클릭)
  const dsButtons = modal.locator('button[title]')
  const count = await dsButtons.count()
  if (count >= 3) {
    await dsButtons.nth(2).click()
    await page.waitForTimeout(300)
  }
  await page.screenshot({ path: 'test-results/lifeflow-06-ds-selected.png' })

  // 모달 내 Generate 버튼 클릭
  await modal.locator('button:has-text("Generate")').click()

  // Editor로 이동되었는지 확인
  await expect(page.getByText('Welcome to VibeSynth')).not.toBeVisible({ timeout: 10000 })

  // 프로젝트 이름이 에디터에 표시되는지 확인
  await expect(page.getByText('LifeFlow Landing Page')).toBeVisible({ timeout: 10000 })
  await page.screenshot({ path: 'test-results/lifeflow-07-editor-launched.png' })

  // 생성이 시작되는지 확인
  await expect(page.getByText('Generating...', { exact: true })).toBeVisible({ timeout: 30000 })
  await page.screenshot({ path: 'test-results/lifeflow-08-generating.png' })
})

test('LifeFlow 예제: 모든 6개 카테고리의 PRD 모달 열기/닫기', async ({ page }) => {
  await page.waitForSelector('text=Welcome to VibeSynth', { timeout: 15000 })

  const examples = [
    { name: 'LifeFlow Landing Page', heading: 'LifeFlow — Service Landing Page' },
    { name: 'LifeFlow Inc. Homepage', heading: 'LifeFlow Inc. — Company Homepage' },
    { name: 'LifeFlow Admin Dashboard', heading: 'LifeFlow Admin — Member Management Dashboard' },
    { name: 'LifeFlow iPhone App', heading: 'LifeFlow — iPhone App' },
    { name: 'LifeFlow Android App', heading: 'LifeFlow — Android App' },
    { name: 'LifeFlow iPad App', heading: 'LifeFlow — iPad App' },
  ]

  for (const ex of examples) {
    // 메인 카드 클릭
    await page.locator(`main button:has-text("${ex.name}")`).click()

    const modal = page.locator('[class*="fixed"]')

    // 모달 헤더의 프로젝트 이름 확인
    await expect(modal.locator(`h2:has-text("${ex.name}")`)).toBeVisible({ timeout: 5000 })

    // PRD의 H1 제목 확인 (마크다운 렌더링된 고유 제목)
    await expect(modal.getByRole('heading', { name: ex.heading })).toBeVisible()

    // 모달 내 Generate 버튼 존재 확인
    await expect(modal.locator('button:has-text("Generate"):not([disabled])')).toBeVisible()

    // 스크린샷
    await page.screenshot({ path: `test-results/lifeflow-prd-${ex.name.replace(/\s+/g, '-').toLowerCase()}.png` })

    // 배경 클릭으로 모달 닫기
    await page.mouse.click(5, 5)
    await page.waitForTimeout(500)
  }
})
