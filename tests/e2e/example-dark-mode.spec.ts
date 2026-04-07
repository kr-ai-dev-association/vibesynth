import { test, expect } from './electron-fixture'

test('랜덤 예제 → 랜덤 DS → 다크모드 선택 → 생성 → 다크 배경 검증', async ({ page }) => {
  test.setTimeout(300_000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 대시보드에서 랜덤 예제 선택
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()

  // 사이드바의 예제 버튼들 수집
  const sidebar = page.locator('aside')
  const exampleButtons = sidebar.locator('button').filter({ has: page.locator('.rounded-md') })
  const exCount = await exampleButtons.count()
  console.log(`[Test] 예제 ${exCount}개 발견`)
  expect(exCount).toBeGreaterThan(0)

  // 랜덤 선택
  const randomIdx = Math.floor(Math.random() * exCount)
  const selectedBtn = exampleButtons.nth(randomIdx)
  const exName = await selectedBtn.textContent()
  console.log(`[Test] 랜덤 예제 선택 (#${randomIdx}): "${exName?.trim().slice(0, 40)}"`)
  await selectedBtn.click()

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: PRD 모달 → 랜덤 DS 선택
  // ═══════════════════════════════════════════════════════════════
  // PRD 모달 — bg-black/50 backdrop 안의 카드
  const modal = page.locator('[class*="fixed"][class*="inset-0"][class*="backdrop"]')
  await expect(modal).toBeVisible({ timeout: 5000 })
  const modalCard = modal.locator('[class*="rounded-2xl"]').first()
  await expect(modalCard.locator('h2').first()).toBeVisible({ timeout: 5000 })
  const modalTitle = await modalCard.locator('h2').first().textContent()
  console.log(`[Test] PRD 모달: "${modalTitle}"`)

  // DS 버튼들
  const dsButtons = modalCard.locator('button[title]')
  const dsCount = await dsButtons.count()
  console.log(`[Test] 추천 DS: ${dsCount}개`)
  expect(dsCount).toBeGreaterThan(0)

  // 랜덤 DS 선택
  const randomDs = Math.floor(Math.random() * dsCount)
  const dsBtn = dsButtons.nth(randomDs)
  const dsName = await dsBtn.getAttribute('title')
  await dsBtn.click()
  await page.waitForTimeout(300)
  console.log(`[Test] 랜덤 DS 선택 (#${randomDs}): "${dsName}"`)

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: 다크모드 선택
  // ═══════════════════════════════════════════════════════════════
  // Theme 영역에서 Dark 버튼 클릭
  const darkBtn = modalCard.getByText('Dark', { exact: true })
  await expect(darkBtn).toBeVisible({ timeout: 3000 })
  await darkBtn.click()
  await page.waitForTimeout(300)
  console.log('[Test] 다크모드 선택')

  await page.screenshot({ path: 'test-results/dark-01-modal-options.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: Generate
  // ═══════════════════════════════════════════════════════════════
  await modalCard.locator('button:has-text("Generate")').click()
  console.log('[Test] Generate 클릭')

  // Editor 진입
  await expect(page.getByText('Welcome to VibeSynth.')).not.toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('Generating...').first()).toBeVisible({ timeout: 15_000 })

  // 최소 2개 스크린 대기
  const screenCards = page.locator('[data-screen-card]')
  await expect(async () => {
    expect(await screenCards.count()).toBeGreaterThanOrEqual(2)
  }).toPass({ timeout: 180_000 })

  // 첫 스크린 생성 완료 대기
  await expect(async () => {
    const gen = await screenCards.first().getByText('AI Generating').count()
    expect(gen).toBe(0)
  }).toPass({ timeout: 180_000 })

  const count = await screenCards.count()
  console.log(`[Test] ✅ ${count}개 스크린 생성 완료`)
  await page.waitForTimeout(2000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 5: 다크모드 검증 — 배경색 분석
  // ═══════════════════════════════════════════════════════════════
  const iframe = screenCards.first().locator('iframe').first()
  const srcDoc = await iframe.getAttribute('srcdoc') || ''

  // 다크 배경 색상 패턴 확인
  const darkPatterns = [
    '#0a0a0a', '#0f0f', '#111', '#1a1a', '#0d0d', '#18181b', '#171717',
    '#0f172a', '#020617', '#0c0a09', '#1e1e2e', '#0f1117',
    'rgb(0,', 'rgb(10,', 'rgb(15,', 'rgb(17,', 'rgb(24,', 'rgb(26,',
  ]
  const lightPatterns = [
    '#fff', '#fafafa', '#f5f5', '#fefefe', '#f8f8', '#f9fafb',
    'rgb(255,', 'rgb(250,', 'rgb(245,', 'rgb(248,',
  ]

  const htmlLower = srcDoc.toLowerCase()
  const hasDarkBg = darkPatterns.some(p => htmlLower.includes(p))
  const hasLightBg = lightPatterns.some(p => htmlLower.includes(p))

  console.log(`[Test] HTML 다크 배경 패턴: ${hasDarkBg}`)
  console.log(`[Test] HTML 라이트 배경 패턴: ${hasLightBg}`)

  // body/html 태그의 배경색 확인
  const bodyBgMatch = srcDoc.match(/body\s*\{[^}]*background[^;]*;/i)
  const htmlBgMatch = srcDoc.match(/html\s*\{[^}]*background[^;]*;/i)
  console.log(`[Test] body background: ${bodyBgMatch?.[0]?.slice(0, 80) || 'none'}`)
  console.log(`[Test] html background: ${htmlBgMatch?.[0]?.slice(0, 80) || 'none'}`)

  // Inline style background 확인
  const inlineBg = srcDoc.match(/style="[^"]*background[^"]*"/gi)?.slice(0, 3)
  console.log(`[Test] Inline backgrounds: ${inlineBg?.map(s => s.slice(0, 60)).join(' | ') || 'none'}`)

  await page.screenshot({ path: 'test-results/dark-02-screens.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 6: DS 추출 후 colorScheme 확인
  // ═══════════════════════════════════════════════════════════════
  const dsInfo = await page.evaluate(() => {
    // Access through localStorage or app state
    const el = document.querySelector('[data-testid="theme-name"]')
    return el?.textContent || null
  })
  console.log(`[Test] DS 이름: "${dsInfo || 'not found'}"`)

  // Agent log에서 DS 추출 확인
  const dsLog = page.getByText(/Design system extracted|DS extracted/i).first()
  if (await dsLog.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('[Test] ✅ DS 추출 로그 확인')
  }

  // ═══════════════════════════════════════════════════════════════
  // Phase 7: 결과 판정
  // ═══════════════════════════════════════════════════════════════
  if (hasDarkBg) {
    console.log('[Test] ✅ 다크모드 디자인 생성 확인 — 어두운 배경 감지')
  } else if (!hasLightBg) {
    console.log('[Test] ⚠️ 명확한 배경 패턴 미감지 — CSS 변수 등 사용 가능')
  } else {
    console.log('[Test] ⚠️ 밝은 배경 감지됨 — 다크모드 미적용 가능성')
  }

  // 다크 배경이 있거나, 최소한 밝은 배경이 주도적이지 않아야 함
  expect(hasDarkBg || !hasLightBg).toBe(true)
  console.log('[Test] ✅ 랜덤 예제 → 랜덤 DS → 다크모드 테스트 통과')
})
